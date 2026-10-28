"""Black-box checks of the hero carousel videos in site/video/carousel/.

Needs an ffmpeg binary: $FFMPEG, ffmpeg on PATH, or the one installed by
`npm i` in video/carousel-src/. Skipped when none is found.
"""

import os
import pathlib
import re
import shutil
import struct
import subprocess
import unittest

from helpers import REPO

CAROUSEL = REPO / "site" / "video" / "carousel"
NAMES = ("oncall", "multiplayer", "rbac")
CUTS = ("desktop", "mobile")
MAX_VIDEO_BYTES = {"desktop": 1_600_000, "mobile": 1_200_000}
MAX_POSTER_BYTES = 150_000


def find_ffmpeg():
    bundled = REPO / "video" / "carousel-src" / "node_modules" / "ffmpeg-static" / "ffmpeg"
    for candidate in (os.environ.get("FFMPEG"), shutil.which("ffmpeg"), str(bundled)):
        if candidate and pathlib.Path(candidate).is_file():
            return candidate
    return None


FFMPEG = find_ffmpeg()
if not FFMPEG and os.environ.get("CI"):
    raise RuntimeError("ffmpeg is required in CI for the carousel video tests")


def probe(path):
    """Parse `ffmpeg -i` output into codec, size, duration and whether audio exists."""
    out = subprocess.run([FFMPEG, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    video = re.search(r"Stream #\S+.*?: Video: (\w+)[^,]*, (\w+)[^,]*?(?:\([^)]*\))?, (\d{2,5})x(\d{2,5})", out)
    duration = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out)
    assert video and duration, out
    h, m, s = duration.groups()
    return {
        "codec": video.group(1),
        "pix_fmt": video.group(2),
        "size": (int(video.group(3)), int(video.group(4))),
        "duration": int(h) * 3600 + int(m) * 60 + float(s),
        "audio": "Audio:" in out,
    }


def top_level_atoms(path):
    atoms, data = [], path.read_bytes()
    i = 0
    while i + 8 <= len(data):
        size, kind = struct.unpack(">I4s", data[i:i + 8])
        if size == 1:
            size = struct.unpack(">Q", data[i + 8:i + 16])[0]
        atoms.append(kind.decode("latin-1"))
        if size < 8:
            break
        i += size
    return atoms


SIDE = 96


def gray_frames(path, seek=(), limit=()):
    """Decoded frames scaled to SIDE x SIDE grayscale, as a list of byte strings."""
    raw = subprocess.run(
        [FFMPEG, "-v", "error", *seek, "-i", str(path), *limit,
         "-vf", f"scale={SIDE}:{SIDE},format=gray", "-f", "rawvideo", "-"],
        capture_output=True, check=True,
    ).stdout
    n = SIDE * SIDE
    return [raw[i:i + n] for i in range(0, len(raw) - n + 1, n)]


def frame_at(path, seconds):
    return gray_frames(path, seek=("-ss", str(seconds)), limit=("-frames:v", "1"))[0]


def last_frame(path):
    return gray_frames(path, seek=("-sseof", "-1"))[-1]


def mean_abs_diff(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


@unittest.skipUnless(FFMPEG, "no ffmpeg binary found")
class CarouselVideoTest(unittest.TestCase):
    def each(self, check):
        """Run check(name, cut, video) once per video, each in its own subTest."""
        for name in NAMES:
            for cut in CUTS:
                video = CAROUSEL / f"{name}-{cut}.mp4"
                with self.subTest(video=video.name):
                    self.assertTrue(video.is_file(), video)
                    check(name, cut, video)

    def poster(self, name):
        poster = CAROUSEL / f"{name}-poster.jpg"
        self.assertTrue(poster.is_file(), poster)
        return poster

    def test_videos_are_muted_browser_safe_h264_with_faststart(self):
        def check(_name, _cut, video):
            info = probe(video)
            self.assertEqual(info["codec"], "h264")
            self.assertEqual(info["pix_fmt"], "yuv420p", "Safari plays only 4:2:0 H.264")
            self.assertFalse(info["audio"], "autoplay on iOS needs no audio track")
            atoms = top_level_atoms(video)
            self.assertIn("moov", atoms)
            self.assertIn("mdat", atoms)
            self.assertLess(atoms.index("moov"), atoms.index("mdat"), atoms)
        self.each(check)

    def test_desktop_is_5_by_4_and_mobile_is_4_by_5(self):
        # The hero carousel (jiro.bot PR #26) shows desktop at up to 560 CSS px and mobile full width.
        def check(_name, cut, video):
            w, h = probe(video)["size"]
            self.assertAlmostEqual(w / h, 5 / 4 if cut == "desktop" else 4 / 5, places=2)
            self.assertGreaterEqual(w, 1100 if cut == "desktop" else 700)
        self.each(check)

    def test_videos_are_long_enough_to_read_and_short_enough_to_loop(self):
        # One calm story per slide: under 20 s would be v25 pace again, over 40 s nobody waits for the loop.
        def check(_name, _cut, video):
            self.assertTrue(20 <= probe(video)["duration"] <= 40)
        self.each(check)

    def test_files_fit_the_web_budget(self):
        def check(name, cut, video):
            self.assertLessEqual(video.stat().st_size, MAX_VIDEO_BYTES[cut])
        self.each(check)

    def test_one_poster_per_example_fits_both_crops(self):
        # One poster serves both cuts, cropped by object-fit: cover to 5:4 or 4:5.
        for name in NAMES:
            with self.subTest(poster=name):
                poster = self.poster(name)
                w, h = probe(poster)["size"]
                self.assertTrue(4 / 5 <= w / h <= 5 / 4, (w, h))
                self.assertGreaterEqual(min(w, h), 800)
                self.assertLessEqual(poster.stat().st_size, MAX_POSTER_BYTES)

    def test_last_frame_flows_into_first_frame(self):
        def check(_name, _cut, video):
            self.assertLess(mean_abs_diff(frame_at(video, 0), last_frame(video)), 1.5)
        self.each(check)

    def test_video_is_not_a_still(self):
        def check(_name, _cut, video):
            duration = probe(video)["duration"]
            first = frame_at(video, 0)
            changes = [mean_abs_diff(first, frame_at(video, duration * k / 5)) for k in range(1, 5)]
            self.assertGreater(max(changes), 4.0)
        self.each(check)


if __name__ == "__main__":
    unittest.main()
