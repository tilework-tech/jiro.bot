# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Finish the fitted plate sprites so both plates differ only by rim colour.

Usage: uv run tools/plate-rims.py   (after cut-sheet.py has written art/work/belt/plate-grey.png)
1. The grey plate's outer edge becomes its rim colour on the upper half and the rim shadow on the lower half,
   so plates never get a dark outline.
2. The blue plate is the grey plate with the grey rim swapped for the blue rim.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GREY, BLUE, SHADOW = (0xCF, 0xD0, 0xD0), (0xC4, 0xD4, 0xE4), (0xAE, 0xB8, 0xC2)
src = ROOT / "art/work/belt/plate-grey.png"
p = np.asarray(Image.open(src).convert("RGBA")).copy()
op = p[..., 3] > 0
pad = np.pad(op, 1)
edge = op & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
lower = np.zeros_like(edge); lower[p.shape[0] // 2:] = True
p[edge & ~lower, :3] = GREY
p[edge & lower, :3] = SHADOW
Image.fromarray(p, "RGBA").save(src)
grey = (p[..., 0] == GREY[0]) & (p[..., 1] == GREY[1]) & (p[..., 2] == GREY[2])
b = p.copy(); b[grey, :3] = BLUE
Image.fromarray(b, "RGBA").save(ROOT / "art/work/belt/plate-blue.png")
print("plates finished")
