import sys
from PIL import Image
import numpy as np
# usage: key.py in.png out.png width
src, out, W = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = np.array(Image.open(src).convert("RGB")).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mag = (r > 150) & (b > 150) & (g < 110) & (abs(r - b) < 90)
# also pinkish fringes
fr = (r > 120) & (b > 110) & (g < (np.minimum(r, b) * 0.6))
a = np.where(mag | fr, 0, 255).astype(np.uint8)
rgba = np.dstack([im.astype(np.uint8), a])
img = Image.fromarray(rgba, "RGBA")
bb = img.getbbox()
img = img.crop(bb)
h = round(img.height * W / img.width)
img = img.resize((W, h), Image.LANCZOS)
d = np.array(img)
d[..., 3] = np.where(d[..., 3] > 128, 255, 0)
Image.fromarray(d).save(out)
print(out, W, h)
