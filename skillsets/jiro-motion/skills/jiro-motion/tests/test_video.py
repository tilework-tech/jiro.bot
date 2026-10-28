import subprocess
import tempfile
import unittest
from pathlib import Path

import numpy as np

from jiro_motion import video


def synth(path, spec):
    """Concatenate lavfi sources; each entry is (source, seconds)."""
    inputs, filters = [], []
    for i, (src, secs) in enumerate(spec):
        joiner = ":" if "=" in src else "="
        inputs += ["-f", "lavfi", "-i", f"{src}{joiner}size=320x180:rate=30:duration={secs}"]
        filters.append(f"[{i}:v]")
    graph = "".join(filters) + f"concat=n={len(spec)}:v=1:a=0[v]"
    subprocess.run([video.FFMPEG, "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[v]",
                    "-pix_fmt", "yuv420p", str(path)], check=True)


class CutDetectionTest(unittest.TestCase):
    def test_finds_hard_cuts_but_not_continuous_motion(self):
        with tempfile.TemporaryDirectory() as tmp:
            clip = Path(tmp) / "clip.mp4"
            synth(clip, [("testsrc2", 2), ("color=c=0x202830", 1.5), ("testsrc", 2)])
            cuts = video.detect_cuts(clip)
        self.assertEqual(len(cuts), 2, cuts)
        self.assertAlmostEqual(cuts[0], 2.0, delta=0.05)
        self.assertAlmostEqual(cuts[1], 3.5, delta=0.05)

    def test_moving_footage_without_cuts_has_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            clip = Path(tmp) / "clip.mp4"
            synth(clip, [("testsrc2", 3)])
            self.assertEqual(video.detect_cuts(clip), [])


class OverlayEncodingTest(unittest.TestCase):
    def test_both_overlays_keep_transparency(self):
        frame = np.zeros((90, 160, 4), dtype=np.uint8)
        frame[30:60, 40:80] = (250, 248, 242, 255)
        with tempfile.TemporaryDirectory() as tmp:
            webm, mov = Path(tmp) / "o.webm", Path(tmp) / "o.mov"
            writer = video.OverlayWriter(webm, mov, (160, 90), 30)
            for _ in range(10):
                writer.write(frame)
            writer.close()
            for path, decoder in ((mov, None), (webm, "libvpx-vp9")):
                decoded = list(video.frames(path, pix_fmt="rgba", decoder=decoder))
                self.assertEqual(len(decoded), 10, path.name)
                alpha = decoded[5][..., 3]
                self.assertGreater(alpha[45, 60], 240, path.name)
                self.assertLess(alpha[5, 5], 10, path.name)


if __name__ == "__main__":
    unittest.main()
