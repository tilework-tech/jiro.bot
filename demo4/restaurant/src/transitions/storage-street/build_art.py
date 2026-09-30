"""Build public/art/tr/storage-street/band.png (the loft-floor-to-rooftops band).

Source: a Gemini outpaint (pipeline/gen_still.py, AR=2:3, SIZE=2K) of a 1920x2880 composite:
storage.jpg at y 0, a magenta gap, street.jpg at y 1800 (the street registers at scale 1.0,
dy +4, so its rows 1008..1800 continue straight up out of the street frame).
Takes composite rows 1008..1881 (873 px: 72 px of spare storage floor on top, then the cut
floor, crawl space, soffit and the rainy upper storeys), snaps to a 3 px grid and a 160-colour
palette. Row 796 is the street frame's top row (world OY; the street registered at dy +4);
the last 77 rows are the outpaint's copy of the street top, used under the feathered join.
usage: python build_art.py GEN.png OUT.png
"""
import sys
from PIL import Image

src, out = sys.argv[1:3]
W, TOP, H = 1920, 1008, 873
im = Image.open(src).convert("RGB").resize((W, 2880), Image.LANCZOS)
c = im.crop((0, TOP, W, TOP + H))
small = c.resize((W // 3, H // 3), Image.BOX).quantize(160, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")
small.resize((W, H), Image.NEAREST).save(out, optimize=True)
print("wrote", out)
