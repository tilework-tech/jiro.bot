"""HTTP contract tests for the copy-editing server; no browser or mocks required."""
import json
import os
import re
from pathlib import Path
import shlex
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

REPO = Path(__file__).resolve().parents[1]
FIXTURE = '''<!doctype html><html><head><title>Fixture</title></head><body>
<h1>Hello <em>world &amp; friends</em></h1><p>Before <b>bold</b> after.</p>
<div data-text="live">42</div><div class="fpanel"><p>Animated panel</p></div>
<script>const untouched = "Hello";</script></body></html>'''


class CopyServerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / 'index.html').write_text(FIXTURE)
        (self.root / 'css').mkdir()
        (self.root / 'css/styles.css').write_text('body { color: black }')
        (self.root / 'video').mkdir()
        (self.root / 'video/hero.mp4').write_bytes(b'video fixture')
        (self.root / 'img').mkdir()
        (self.root / 'img/jiro.png').write_bytes(b'image fixture')
        subprocess.run(['git', 'init', '-q', '-b', 'test-preview'], cwd=self.root, check=True)
        subprocess.run(['git', 'add', 'index.html'], cwd=self.root, check=True)
        subprocess.run(['git', '-c', 'user.name=Test', '-c', 'user.email=test@example.test',
                        'commit', '-qm', 'Original'], cwd=self.root, check=True)
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0))
            port = probe.getsockname()[1]
        command = os.environ.get('COPY_SERVER_COMMAND',
            f'{sys.executable} {REPO / "server.py"} --port {{port}} --root {{root}} --edit')
        self.process = subprocess.Popen(shlex.split(command.format(port=port, root=self.root)),
                                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.addCleanup(self.stop)
        self.url = f'http://127.0.0.1:{port}/'
        for _ in range(100):
            try:
                self.request('')
                break
            except urllib.error.URLError:
                if self.process.poll() is not None:
                    self.fail('Server exited before serving the site')
                time.sleep(.02)
        else:
            self.fail('Server did not become ready')

    def stop(self):
        self.process.terminate()
        self.process.wait(timeout=5)

    def request(self, path, payload=None, headers=None):
        body = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(self.url + path, data=body, headers={
            'Content-Type': 'application/json', 'X-Copy-Editor': '1', **(headers or {})})
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, response.read().decode()
        except urllib.error.HTTPError as error:
            return error.code, error.read().decode()

    def state(self):
        status, body = self.request('__copy/state')
        self.assertEqual(status, 200, 'The editor must expose the current saved copy')
        return json.loads(body)

    def test_site_exposes_editable_copy_but_preserves_dynamic_regions(self):
        status, page = self.request('')
        self.assertEqual(status, 200)
        self.assertIn('data-copy-id=', page)
        revision = re.search(r'<meta name="copy-version" content="([^"]+)">', page).group(1)
        self.assertEqual(revision, self.state()['version'])
        self.assertIn('<div data-text="live">42</div>', page)
        self.assertIn('<div class="fpanel"><p>Animated panel</p></div>', page)
        self.assertIn('<script>const untouched = "Hello";</script>', page)
        self.assertEqual((self.root / 'index.html').read_text(), FIXTURE)

    def test_serves_hero_video(self):
        with urllib.request.urlopen(self.url + 'video/hero.mp4', timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers.get_content_type(), 'video/mp4')
            self.assertEqual(response.read(), b'video fixture')

    def test_serves_images(self):
        with urllib.request.urlopen(self.url + 'img/jiro.png', timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers.get_content_type(), 'image/png')
            self.assertEqual(response.read(), b'image fixture')

    def test_default_preview_has_no_editor(self):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0))
            port = probe.getsockname()[1]
        static = subprocess.Popen(
            [sys.executable, str(REPO / 'server.py'), '--root', str(self.root), '--port', str(port)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            url = f'http://127.0.0.1:{port}/port/{port}/'
            for _ in range(100):
                try:
                    with urllib.request.urlopen(url, timeout=5) as response:
                        page = response.read().decode()
                    break
                except urllib.error.URLError:
                    if static.poll() is not None:
                        self.fail('Plain preview exited before serving the site')
                    time.sleep(.02)
            else:
                self.fail('Plain preview did not become ready')
            self.assertEqual(page, FIXTURE)
            with self.assertRaises(urllib.error.HTTPError) as denied:
                urllib.request.urlopen(url + '__copy/editor.js', timeout=5)
            self.assertEqual(denied.exception.code, 404)
            with urllib.request.urlopen(url + 'video/hero.mp4', timeout=5) as response:
                self.assertEqual(response.read(), b'video fixture')
        finally:
            static.terminate()
            static.wait(timeout=5)

    def test_save_escapes_text_preserves_markup_commits_and_survives_reload(self):
        state = self.state()
        target = next(key for key, text in state['copy'].items() if text == 'world & friends')
        text = '<script>alert(1)</script> & new\nline'
        status, _ = self.request('__copy/save', {'version': state['version'], 'changes': {target: text}})
        self.assertEqual(status, 200)
        saved = (self.root / 'index.html').read_text()
        self.assertIn('&lt;script&gt;alert(1)&lt;/script&gt; &amp; new<br>line', saved)
        self.assertIn('<p>Before <b>bold</b> after.</p>', saved)
        self.assertIn('<em>', saved)
        self.assertNotIn('data-copy-id', saved)
        self.assertNotEqual(self.state()['version'], state['version'])
        commits = subprocess.check_output(['git', 'rev-list', '--count', 'HEAD'], cwd=self.root, text=True)
        self.assertEqual(commits.strip(), '2')
        _, download = self.request('__copy/download')
        self.assertEqual(download, saved)
        _, diff = self.request('__copy/changes')
        self.assertIn('+', diff)
        self.assertIn('new<br>line', diff)

    def test_stale_save_is_rejected_without_overwriting_saved_copy(self):
        state = self.state()
        target = next(iter(state['copy']))
        first = {'version': state['version'], 'changes': {target: 'First editor'}}
        self.assertEqual(self.request('__copy/save', first)[0], 200)
        stale = {'version': state['version'], 'changes': {target: 'Stale editor'}}
        self.assertEqual(self.request('__copy/save', stale)[0], 409)
        self.assertIn('First editor', (self.root / 'index.html').read_text())

    def test_invalid_save_is_atomic_and_private_files_are_not_served(self):
        state = self.state()
        for changes in ({'unknown': 'Oops'}, {next(iter(state['copy'])): 42},
                        {next(iter(state['copy'])): 'Valid', 'unknown': 'Invalid'}):
            status, _ = self.request('__copy/save', {'version': state['version'], 'changes': changes})
            self.assertEqual(status, 400)
            self.assertEqual((self.root / 'index.html').read_text(), FIXTURE)
        self.assertEqual(self.request('.git/config')[0], 404)
        self.assertEqual(self.request('server.py')[0], 404)
        self.assertEqual(self.request('css/styles.css')[0], 200)
        self.assertEqual(self.request('port/4100/__copy/state')[0], 200)
        self.assertEqual(self.request('__copy/save', {'version': state['version'], 'changes': {}},
                                      {'X-Copy-Editor': ''})[0], 403)


if __name__ == '__main__':
    unittest.main(verbosity=2)
