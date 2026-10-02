"""Build public/art/tr/dining-kitchen/between.png (the floor cutaway between dining and kitchen).

Source: a Gemini still (gen_still.py, AR=21:9, refs kitchen.jpg + kitchen-storage/between.png):
a side cross-section of the floor under the dining room, a dim plaster/brick wall, copper pipes,
a hanging bulb, a mouse-sized sushi bar doorway, and an empty wooden shaft on the right.
Resizes to 1920 wide, shifts the picture so the shaft it is centred on the right lane (x 1770), crops the
band height, snaps to a 3 px pixel grid and a 160-colour palette.
usage: python build_art.py SRC.png OUT.png [BAND_H]
"""
import sys
from PIL import Image

src, out = sys.argv[1:3]
H = int(sys.argv[3]) if len(sys.argv) > 3 else 802
W = 1920
im = Image.open(src).convert("RGB")
c = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)

# Shaft (posts x 1455-1772, centre ~1614 at this scale) -> centre on the lane, x 1770:
# shift the whole picture right and fill the (very dark) left edge with its own mirror.
SHIFT = 156
moved = c.crop((0, 0, W - SHIFT, c.height))
fill = c.crop((0, 0, SHIFT, c.height)).transpose(Image.FLIP_LEFT_RIGHT)
c.paste(moved, (SHIFT, 0))
c.paste(fill, (0, 0))

c = c.crop((0, 0, W, H))
P = 3
small = c.resize((W // P, H // P), Image.BOX).quantize(160, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")
small.resize((W // P * P, H // P * P), Image.NEAREST).save(out)
print("wrote", out, small.size)
