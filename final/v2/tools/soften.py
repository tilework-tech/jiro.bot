# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Blur a pixel-art master so it carries no pixel grid. Gemini copies the grid of any image it edits, so a
grid-free sketch is what lets it repaint the same composition with finer detail (see art/README.md, "Detail").

Usage: uv run tools/soften.py IN OUT [--radius 1.2]
"""
import argparse
from PIL import Image, ImageFilter

p = argparse.ArgumentParser()
p.add_argument("inp"); p.add_argument("out"); p.add_argument("--radius", type=float, default=1.2)
a = p.parse_args()
im = Image.open(a.inp).convert("RGB")
small = im.resize((im.width // 4, im.height // 4), Image.LANCZOS).filter(ImageFilter.GaussianBlur(a.radius))
small.resize(im.size, Image.BICUBIC).save(a.out)
print(a.out)
