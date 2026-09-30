from PIL import Image, ImageDraw
import numpy as np
bg = Image.open('/tmp/polish-office/bg1_1920.png').convert('RGB')
a = np.array(bg).astype(float)
# 1) paint over doorways with wall planks copied from above (vertical planks)
def fill(x0, x1, y0, y1, nx):
    top = a[y0 - 1, x0:x1].copy()
    ref = a[y0 - 1:y1, nx - 3:nx + 3].mean(axis=1).mean(axis=1) + 1
    for i, y in enumerate(range(y0, y1)):
        a[y, x0:x1] = top * (ref[i + 1] / ref[0])

def patch(x0, x1, y0, y1, sy0):
    h = y1 - y0
    src = a[sy0:sy0 + h, x0:x1].copy()
    a[y0:y1, x0:x1] = src
fill(10, 160, 600, 926, 175)
fill(1770, 1915, 600, 926, 1912)
# below-bed rows on the far left/right: copy bed rows from inner columns
bed = a[900:1080, 200:260].copy()
for x in range(0, 50, 60):
    a[900:1080, 0:50] = bed[:, :50]
bedr = a[922:1080, 1600:1700].copy()
a[922:1080, 1860:1920] = bedr[:, :60]
a[922:1080, 1760:1860] = a[922:1080, 1660:1760]
# 2) darken the right edge strip (belt goes into dark wood there)
for x in range(1760, 1920):
    k = 1 - 0.55 * ((x - 1760) / 160) ** 1.2
    a[:, x] *= k
# 3) dark the far-left strip a bit for the seam
for x in range(0, 40):
    a[:, x] *= 0.6 + 0.4 * x / 40
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
d = ImageDraw.Draw(img)
# 4) floor-level hatch at x 0..60, y 905..1000
COP, COPD, COPH, INK = (201, 129, 74), (109, 63, 34), (232, 170, 110), (5, 4, 4)
d.rectangle((0, 897, 66, 1008), fill=INK)
d.rectangle((0, 897, 66, 905), fill=COPD); d.rectangle((0, 898, 64, 902), fill=COP)
d.rectangle((56, 897, 66, 1008), fill=COPD); d.rectangle((58, 899, 62, 1006), fill=COP)
d.rectangle((0, 1000, 66, 1008), fill=COPD); d.rectangle((0, 1002, 64, 1005), fill=COP)
d.line((0, 899, 60, 899), fill=COPH); d.line((59, 900, 59, 1004), fill=COPH)
for y in (910, 950, 994):  # rivets
    d.rectangle((59, y, 61, y + 2), fill=COPH)
img.save('/tmp/polish-office/bg2.png')
