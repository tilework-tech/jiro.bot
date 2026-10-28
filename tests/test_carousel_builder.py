"""The carousel source builder works with a new nested output directory."""
import pathlib
import subprocess
import tempfile
import unittest

from helpers import REPO


class CarouselBuilderTest(unittest.TestCase):
    def test_builds_into_a_new_output_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            source = root / "scene.html"
            source.write_text("<!doctype html><h1>Scene</h1>{{slack}}")
            output = root / "built" / "nested" / "scene.html"
            result = subprocess.run(
                ["node", str(REPO / "video/carousel-src/build.mjs"), str(source), str(output)],
                cwd=REPO / "video/carousel-src", capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('<h1>Scene</h1><svg', output.read_text())


if __name__ == "__main__":
    unittest.main()
