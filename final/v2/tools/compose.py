# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Take the columns right of X0 (fraction of width) from OVER and the rest from BASE. Used when an edit pass
fixes the action area but roughens the calm copy field. Usage: uv run tools/compose.py OUT BASE OVER --x0 0.4"""
import argparse
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument("out"); p.add_argument("base"); p.add_argument("over"); p.add_argument("--x0", type=float, required=True)
a = p.parse_args()
base = Image.open(a.base).convert("RGB")
over = Image.open(a.over).convert("RGB").resize(base.size)
cut = round(a.x0 * base.width)
base.paste(over.crop((cut, 0, base.width, base.height)), (cut, 0))
base.save(a.out, quality=95)
print(a.out)
