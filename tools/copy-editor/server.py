#!/usr/bin/env python3
"""Serve the marketing site, with an optional session-local copy editor."""
import argparse
import difflib
import hashlib
import html
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
import os
from pathlib import Path
import re
import subprocess
import tempfile
import threading
from urllib.parse import unquote, urlsplit

VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
EXCLUDED = set('head script style svg noscript template textarea select'.split())
ASSETS = Path(__file__).resolve().parent / 'editor'
STATIC_PAGES = {'/confirmed.html', '/link-expired.html', '/privacy.html'}


class CopyParser(HTMLParser):
    """Locate eligible text ranges without reserializing the site's markup."""
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.lines = [0] + [m.end() for m in re.finditer('\n', source)]
        self.stack = []
        self.ranges = []
        self.feed(source)

    def source_offset(self):
        line, column = self.getpos()
        return self.lines[line - 1] + column

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        blocked = (tag in EXCLUDED or attrs.get('aria-hidden') == 'true'
                   or any(key in attrs for key in ('data-px', 'data-text', 'data-bind', 'data-list'))
                   or 'fpanel' in attrs.get('class', '').split()
                   or bool(self.stack and self.stack[-1][1]))
        if tag not in VOID:
            self.stack.append((tag, blocked))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        if not self.stack or self.stack[-1][1] or not any(tag == 'body' for tag, _ in self.stack):
            return
        start = self.source_offset()
        end = start + len(data)
        if self.ranges and self.ranges[-1][1] == start:
            self.ranges[-1] = (self.ranges[-1][0], end)
        else:
            self.ranges.append((start, end))

    def handle_entityref(self, name):
        self.handle_data('&' + name + ';')

    def handle_charref(self, name):
        self.handle_data('&#' + name + ';')

    def blocks(self):
        return {str(index): (start, end) for index, (start, end) in enumerate(self.ranges)
                if html.unescape(self.source[start:end]).strip()}


def version(source):
    return hashlib.sha256(source.encode()).hexdigest()


def text_value(source):
    return re.sub(r'\s+', ' ', html.unescape(source))


def annotate(source, blocks):
    revision = version(source)
    for key, (start, end) in reversed(list(blocks.items())):
        source = (source[:start] + '<span data-copy-id="' + key + '">' + source[start:end]
                  + '</span>' + source[end:])
    source = source.replace('</head>', '<meta name="copy-version" content="' + revision + '"></head>')
    additions = '<link rel="stylesheet" href="__copy/editor.css"><script src="__copy/editor.js" defer></script>'
    return source.replace('</body>', additions + '</body>')


class CopyServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, root, editing=False):
        super().__init__(address, CopyHandler)
        self.root = root.resolve()
        self.editing = editing
        self.lock = threading.Lock()
        if editing:
            original_commit = subprocess.check_output(
                ['git', 'log', '--reverse', '--format=%H', '--', 'index.html'], cwd=root, text=True).splitlines()[0]
            self.original = subprocess.check_output(
                ['git', 'show', original_commit + ':index.html'], cwd=root).decode()


class CopyHandler(BaseHTTPRequestHandler):
    def route(self):
        return re.sub(r'^/port/\d+(?=/|$)', '', unquote(urlsplit(self.path).path)) or '/'

    def send(self, status, body, content_type='application/json; charset=utf-8', download=False):
        if isinstance(body, dict):
            body = json.dumps(body)
        if isinstance(body, str):
            body = body.encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if download:
            self.send_header('Content-Disposition', 'attachment; filename="index.html"')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.route()
        if not self.server.editing and path.startswith('/__copy/'):
            self.send(404, {'error': 'Not found'})
            return
        source = (self.server.root / 'index.html').read_text()
        if path in ('/', '/index.html'):
            page = annotate(source, CopyParser(source).blocks()) if self.server.editing else source
            self.send(200, page, 'text/html; charset=utf-8')
        elif path == '/__copy/state':
            blocks = CopyParser(source).blocks()
            self.send(200, {'version': version(source), 'copy': {
                key: text_value(source[start:end]) for key, (start, end) in blocks.items()}})
        elif path == '/__copy/download':
            self.send(200, source, 'text/html; charset=utf-8', download=True)
        elif path == '/__copy/changes':
            diff = ''.join(difflib.unified_diff(self.server.original.splitlines(True), source.splitlines(True),
                                               fromfile='Maddy original', tofile='Current copy'))
            self.send(200, diff or 'No saved changes.', 'text/plain; charset=utf-8')
        elif path in ('/__copy/editor.js', '/__copy/editor.css'):
            file = ASSETS / path.rsplit('/', 1)[1]
            self.send(200, file.read_bytes(), 'text/javascript' if file.suffix == '.js' else 'text/css')
        elif path in STATIC_PAGES:
            self.send(200, (self.server.root / path.lstrip('/')).read_bytes(), 'text/html; charset=utf-8')
        elif path.startswith(('/css/', '/js/', '/fonts/', '/img/', '/video/')):
            file = (self.server.root / path.lstrip('/')).resolve()
            if file.is_relative_to(self.server.root) and file.is_file():
                self.send(200, file.read_bytes(), mimetypes.guess_type(file.name)[0] or 'application/octet-stream')
            else:
                self.send(404, {'error': 'Not found'})
        else:
            self.send(404, {'error': 'Not found'})

    def do_POST(self):
        if not self.server.editing or self.route() != '/__copy/save':
            self.send(404, {'error': 'Not found'})
            return
        if self.headers.get('X-Copy-Editor') != '1' or self.headers.get_content_type() != 'application/json':
            self.send(403, {'error': 'Use the copy editor to save changes.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 1_000_000:
                raise ValueError('Save is empty or too large.')
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError('Invalid save.')
            with self.server.lock:
                file = self.server.root / 'index.html'
                source = file.read_text()
                if payload.get('version') != version(source):
                    self.send(409, {'error': 'The page changed since you opened it. Copy your draft, then reload.'})
                    return
                blocks = CopyParser(source).blocks()
                changes = payload.get('changes')
                if not isinstance(changes, dict) or any(
                    key not in blocks or not isinstance(value, str) or len(value) > 100_000
                    for key, value in changes.items()
                ):
                    raise ValueError('Invalid text changes.')
                for key in sorted(changes, key=lambda key: blocks[key][0], reverse=True):
                    start, end = blocks[key]
                    value = html.escape(changes[key], quote=False).replace('\r\n', '\n').replace('\r', '\n')
                    source = source[:start] + value.replace('\n', '<br>') + source[end:]
                if source != file.read_text():
                    with tempfile.NamedTemporaryFile(mode='w', dir=file.parent, delete=False) as temporary:
                        temporary.write(source)
                        temporary.flush()
                        os.fsync(temporary.fileno())
                    os.replace(temporary.name, file)
                    commit = subprocess.run(
                        ['git', '-c', 'user.name=Copy Editor', '-c', 'user.email=copy-editor@localhost',
                         'commit', '--only', '-m', 'Edit website copy', '--', 'index.html'],
                        cwd=self.server.root, capture_output=True, text=True)
                    if commit.returncode:
                        self.send(200, {'saved': True, 'warning': 'Saved to disk; local history commit failed.'})
                        return
                self.send(200, {'saved': True})
        except (ValueError, OSError) as error:
            self.send(400 if isinstance(error, ValueError) else 500, {'error': str(error)})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4100)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2] / 'site')
    parser.add_argument('--edit', action='store_true', help='Enable the optional inline copy editor')
    arguments = parser.parse_args()
    CopyServer(('0.0.0.0', arguments.port), arguments.root, arguments.edit).serve_forever()
