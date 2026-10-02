# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Shift a master sideways by D source px (negative = left) so a painted belt shaft lines up with the belt route.
The strip that opens up repeats the neighbouring D columns, or stays black for a Gemini outpaint (--blank).
Usage: uv run tools/shift-x.py IN OUT --d D"""
import argparse
from PIL import Image

p = argparse.ArgumentParser(); p.add_argument("inp"); p.add_argument("out"); p.add_argument("--d", type=int, required=True)
p.add_argument("--blank", action="store_true", help="leave the opened strip black for a Gemini outpaint instead of repeating columns")
a = p.parse_args()
im = Image.open(a.inp).convert("RGB"); W, H = im.size; d = abs(a.d)
out = Image.new("RGB", im.size)
if a.d < 0:
    out.paste(im.crop((d, 0, W, H)), (0, 0))
    if not a.blank: out.paste(im.crop((W - 2 * d, 0, W - d, H)), (W - d, 0))
else:
    out.paste(im.crop((0, 0, W - d, H)), (d, 0))
    if not a.blank: out.paste(im.crop((d, 0, 2 * d, H)), (0, 0))
out.save(a.out, quality=95)
print(a.out)
