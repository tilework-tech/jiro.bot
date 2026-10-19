import pathlib
import shutil
import subprocess
import sys
import tempfile

REPO = pathlib.Path(__file__).resolve().parent.parent
FIXTURE = REPO / "tests" / "fixtures" / "content"


class Workspace:
    """A temp copy of the fixture content plus an output dir, driven through the real CLIs."""

    def __init__(self):
        self._tmp = tempfile.TemporaryDirectory()
        root = pathlib.Path(self._tmp.name)
        self.content = root / "content"
        self.site = root / "site"
        shutil.copytree(FIXTURE, self.content)

    def cleanup(self):
        self._tmp.cleanup()

    def edit(self, rel, old, new):
        path = self.content / rel
        text = path.read_text()
        assert old in text, f"{old!r} not in {rel}"
        path.write_text(text.replace(old, new))

    def build(self):
        return subprocess.run(
            [sys.executable, str(REPO / "build.py"), "--content", str(self.content), "--out", str(self.site)],
            check=False, capture_output=True, text=True,
        )

    def lint(self):
        return subprocess.run(
            [sys.executable, str(REPO / "tools" / "lint.py"), "--content", str(self.content), "--site", str(self.site)],
            check=False, capture_output=True, text=True,
        )

    def read(self, rel):
        return (self.site / rel).read_text()
