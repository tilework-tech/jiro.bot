#!/usr/bin/env python3
"""Paste back ONE region of a Gemini "Same image ... only change: ..." edit onto the original art.

usage: pasteback.py ORIG.jpg EDIT.png OUT.jpg x0 y0 x1 y1 [feather=5] [quality=93|keep]

The edit is resized to the original's size (LANCZOS), the rectangle is feathered with a Gaussian blur and
composited, so every pixel outside the rectangle keeps the original values. This is the pattern every scene
edit used (pond bridge: 1560,0,1730,285 f5; street cargo box: 1368,548,1722,868 f6; kitchen doors: an edit of a
480x640 crop, pasted at 340,90 with a 2.5 px feathered box, then only 480,180-800,640 pasted into the original
JPEG and saved with quality='keep' so the untouched area is bit-identical apart from re-encode noise).
"""
import sys
from PIL import Image, ImageDraw, ImageFilter

orig, edit, out, *rest = sys.argv[1:]
x0, y0, x1, y1 = map(int, rest[:4])
feather = float(rest[4]) if len(rest) > 4 else 5
q = rest[5] if len(rest) > 5 else "93"
o = Image.open(orig); o.load()
e = Image.open(edit).convert("RGB").resize(o.size, Image.LANCZOS)
m = Image.new("L", o.size, 0)
ImageDraw.Draw(m).rectangle((x0, y0, x1, y1), fill=255)
if feather > 0:
    m = m.filter(ImageFilter.GaussianBlur(feather))
res = Image.composite(e, o.convert("RGB"), m)
if q == "keep" and o.format == "JPEG":
    o.paste(res.crop((x0, y0, x1, y1)), (x0, y0))  # keep original quant tables
    o.save(out, quality="keep")
else:
    res.save(out, quality=int(q))
print("wrote", out)
