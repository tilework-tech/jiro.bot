"""Build public/art/tr/kitchen-storage/between.png (the floor-to-ceiling cutaway band).

Source: a Gemini still (gen_still.py, AR=21:9, refs kitchen.jpg + storage.jpg + canon) at
/tmp/ks/gen1.png. Crops the between-floors band, patches the right lane column (where the
belt runs) with the storage room's dark wall planks and repeated joist ends, then snaps to a
4 px pixel grid and a 160-colour palette.
usage: python build_art.py SRC.png STORAGE.jpg OUT.png
"""
import sys
from PIL import Image

src, storage, out = sys.argv[1:4]
W, H = 1920, 632
im = Image.open(src).convert("RGB")
c = im.crop((0, 110, 3168, 110 + round(632 * 3168 / 1920))).resize((W, H), Image.LANCZOS)

# Hide the stray kitchen hatch/lift bottom painted on the floor top (x 1225-1515, y 0-52).
c.paste(c.crop((930, 0, 1220, 52)), (1225, 0))

# Right lane column: back wall of dark storage planks, then slab + joists + ceiling beam.
X0 = 1612
st = Image.open(storage).convert("RGB")
wall = st.crop((20, 120, 20 + (W - X0), 120 + H)).point(lambda v: int(v * 0.95))
c.paste(wall, (X0, 0))
c.paste(c.crop((1000, 0, 1000 + W - X0, 86)), (X0, 0))           # floorboards
joist = c.crop((1498, 86, 1572, 174))                                # one joist end
for x in (X0 + 60, X0 + 230):
    c.paste(joist, (x, 86))
c.paste(c.crop((1000, 576, 1000 + W - X0, H)), (X0, 576))         # storage ceiling beam
c.paste(c.crop((1570, 0, 1616, H)), (X0 - 4, 0))                   # keep the post edge crisp

# Crisp pixels: 4 px grid, adaptive palette.
small = c.resize((W // 4, H // 4), Image.BOX).quantize(160, method=Image.FASTOCTREE, dither=Image.NONE).convert("RGB")
small.resize((W, H), Image.NEAREST).save(out)
print("wrote", out)
