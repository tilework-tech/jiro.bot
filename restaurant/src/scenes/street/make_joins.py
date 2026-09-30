#!/usr/bin/env python3
"""Make the parallax tiles wrap: Gemini paints the seams (one-off, results kept in src/).

For each seam we crop a 16:9 window centred on it (left art | flat green gap | right art),
ask Gemini (pipeline/gen_still.py) to paint the gap so the street continues, and keep the
raw answer (JPEG bytes) as src/join_<name>.jpg. build_art.py pastes only the gap back.

usage: /tmp/venv/bin/python src/scenes/street/make_joins.py [far] [ab] [ba]
"""
import os, subprocess, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
SRC = os.path.join(HERE, "src")
H = 1008            # working height for the seam windows
WIN = 1792          # 16:9 window
GAP = 320           # green band painted by Gemini

PROMPT = (
    "The image has a vertical band of flat pure green (#00FF00) in the middle. Paint the missing part inside the "
    "green band so the scene continues seamlessly from the left part into the right part: it is ONE continuous "
    "side-on {what}. Match the perspective (flat side elevation), scale, horizon, ground line, roof heights, "
    "palette and pixel style exactly; add a narrow building, alley or utility pole in the gap if that joins the two "
    "sides naturally. Keep the left and right parts exactly unchanged. Everything above the rooflines must stay "
    "flat pure magenta #FF00FF like the rest of the image. No green may remain. No people, no rain streaks, no text."
)


def work(name):
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    return im.resize((round(im.width * H / im.height), H), Image.LANCZOS)


def window(left, right):
    """Right edge of `left` | green gap | left edge of `right`, as one WIN x H window."""
    side = (WIN - GAP) // 2
    c = Image.new("RGB", (WIN, H), (0, 255, 0))
    c.paste(left.crop((left.width - side, 0, left.width, H)), (0, 0))
    c.paste(right.crop((0, 0, side, H)), (side + GAP, 0))
    return c


def gen(name, img, what):
    p = f"/tmp/street-win_{name}.png"  # Gemini input only, not kept
    img.save(p)
    out = os.path.join(SRC, f"join_{name}.jpg")
    env = dict(os.environ, AR="16:9", SIZE="2K")
    subprocess.run(["/tmp/venv/bin/python", os.path.join(ROOT, "pipeline/gen_still.py"), out, PROMPT.format(what=what), p],
                   env=env, check=True)


if __name__ == "__main__":
    todo = sys.argv[1:] or ["far", "ab", "ba"]
    far = work("far_raw.jpg")
    a, b = work("midA_raw.jpg"), work("midB_raw.jpg")
    if "far" in todo:
        gen("far", window(far, far), "distant night city skyline panorama")
    if "ab" in todo:
        gen("ab", window(a, b), "row of small Japanese night shopfronts along a wet sidewalk")
    if "ba" in todo:
        gen("ba", window(b, a), "row of small Japanese night shopfronts along a wet sidewalk")
