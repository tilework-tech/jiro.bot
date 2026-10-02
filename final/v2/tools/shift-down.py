# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Shift a master down by D px (same canvas size): the bottom D rows are dropped and the top D rows are left
flat black for Gemini to outpaint. Usage: uv run tools/shift-down.py IN OUT --d D"""
import argparse
from PIL import Image

p = argparse.ArgumentParser(); p.add_argument("inp"); p.add_argument("out"); p.add_argument("--d", type=int, required=True)
a = p.parse_args()
im = Image.open(a.inp).convert("RGB")
out = Image.new("RGB", im.size, (0, 0, 0))
out.paste(im.crop((0, 0, im.width, im.height - a.d)), (0, a.d))
out.save(a.out, quality=95)
print(a.out)
