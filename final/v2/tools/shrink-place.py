# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Shrink a master by F and place it at fractional position (X, Y) on a black canvas of the same size, leaving
the rest for Gemini to outpaint. Usage: uv run tools/shrink-place.py IN OUT --f 0.5 --x 0.5 --y 0.5"""
import argparse
from PIL import Image

p = argparse.ArgumentParser(); p.add_argument("inp"); p.add_argument("out")
p.add_argument("--f", type=float, required=True); p.add_argument("--x", type=float, required=True); p.add_argument("--y", type=float, required=True)
a = p.parse_args()
im = Image.open(a.inp).convert("RGB")
small = im.resize((round(im.width * a.f), round(im.height * a.f)), Image.LANCZOS)
out = Image.new("RGB", im.size, (0, 0, 0))
out.paste(small, (round(a.x * im.width), round(a.y * im.height)))
out.save(a.out)
print(a.out)
