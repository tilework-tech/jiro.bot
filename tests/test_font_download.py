"""Font installation validates the whole official payload before replacing assets."""
import hashlib
import io
import pathlib
import sys
import tempfile
import unittest
import zipfile

from helpers import REPO

sys.path.insert(0, str(REPO))
from tools.fetch_fonts import install_fonts


class FontDownloadTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.destination = pathlib.Path(self.temp.name) / "fonts"
        self.destination.mkdir()
        self.files = {"vendor/font.woff2": b"approved font bytes", "vendor/license.txt": b"approved license"}
        self.assets = {
            source: (pathlib.Path(source).name, hashlib.sha256(data).hexdigest())
            for source, data in self.files.items()
        }

    def archive(self, files):
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w") as bundle:
            for name, data in files.items():
                bundle.writestr(name, data)
        return stream.getvalue()

    def test_installs_only_verified_assets_without_modifying_bytes(self):
        files = {**self.files, "../unrequested.txt": b"not an asset"}
        install_fonts(self.archive(files), self.destination, self.assets)
        self.assertEqual({p.name for p in self.destination.iterdir()}, {"font.woff2", "license.txt"})
        self.assertEqual((self.destination / "font.woff2").read_bytes(), b"approved font bytes")
        self.assertEqual((self.destination / "license.txt").read_bytes(), b"approved license")
        self.assertFalse((self.destination.parent / "unrequested.txt").exists())

    def test_changed_license_rejects_entire_bundle_and_preserves_installed_files(self):
        target = self.destination / "font.woff2"
        target.write_bytes(b"previous font")
        files = {**self.files, "vendor/license.txt": b"unreviewed license"}
        with self.assertRaisesRegex(ValueError, "checksum"):
            install_fonts(self.archive(files), self.destination, self.assets)
        self.assertEqual(target.read_bytes(), b"previous font")
        self.assertFalse((self.destination / "license.txt").exists())

    def test_incomplete_bundle_leaves_destination_untouched(self):
        with self.assertRaises(KeyError):
            install_fonts(self.archive({"vendor/font.woff2": self.files["vendor/font.woff2"]}),
                          self.destination, self.assets)
        self.assertEqual(list(self.destination.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
