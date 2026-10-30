import pathlib
import re
import unittest

from helpers import REPO

# Page copy and the sources it is built from. Video sources and renders are excluded.
COPY_ROOTS = ["site", "content", "build.py", "README.md", "docs.md", "tools", "tests/browser"]
TEXT = {".html", ".js", ".css", ".md", ".txt", ".toml", ".py", ".mjs", ".xml", ".json"}
HANDLE = re.compile(r"(?<![\w.])@jiro(?:\.?bot\b|\b(?!-))", re.IGNORECASE)


def copy_files():
    for root in COPY_ROOTS:
        path = REPO / root
        files = [path] if path.is_file() else path.rglob("*")
        for file in files:
            if file.suffix in TEXT and "node_modules" not in file.parts and file.name != "test_handle.py":
                yield file


class HandleTest(unittest.TestCase):
    def test_every_handle_in_page_copy_is_exactly_at_jiro(self):
        wrong = []
        for file in copy_files():
            for line_no, line in enumerate(file.read_text(errors="ignore").splitlines(), 1):
                wrong += [f"{file.relative_to(REPO)}:{line_no}: {m.group()}" for m in HANDLE.finditer(line) if m.group() != "@Jiro"]
        self.assertEqual(wrong, [])

    def test_landing_page_and_its_description_say_tag_at_jiro_to_start(self):
        page = (REPO / "site" / "index.html").read_text()
        description = re.search(r'name="description"\s+content="([^"]*)"', page).group(1)
        self.assertIn("Tag @Jiro to start.", description)


if __name__ == "__main__":
    unittest.main()
