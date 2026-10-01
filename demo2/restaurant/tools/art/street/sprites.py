# Reconstructed (final versions) from the street-polish agent.
#  r-off.png: the RAMEN "R" neon tube switched off (pink pixels of box (893,78,947,166) recoloured dark plum);
#             input is street.v1.png (= compose.py output, before the round-2 cargo-box / vertical-belt edit).
#  blink.png: Jiro's closed eyelids for street.ts, drawn at (1196,408).
import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image
import numpy as np
STREET_V1 = os.environ.get("STREET_V1", "/tmp/polish-street/street.v1.png")
im = Image.open(STREET_V1).convert('RGB')
c = np.asarray(im.crop((893, 78, 947, 166))).astype(int)
r, g, b = c[..., 0], c[..., 1], c[..., 2]
pink = (r > 190) & (b > 120) & (r - g > 60)
out = np.zeros((c.shape[0], c.shape[1], 4), np.uint8); out[pink] = [112, 52, 96, 255]
Image.fromarray(out).save(ROOT + '/public/art/street/r-off.png')
im = Image.open(ROOT + '/public/art/street.jpg').convert('RGB')
c = np.asarray(im.crop((1196, 408, 1266, 444))).astype(int)
r, g, b = c[..., 0], c[..., 1], c[..., 2]
cy = (g > 170) & (b > 170) & (r < 200)
keep = np.zeros_like(cy); keep[3:34, 2:30] = 1; keep[3:34, 38:68] = 1
cy &= keep.astype(bool)
for _ in range(2):
    p = np.pad(cy, 1); n = sum(np.roll(np.roll(p, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1))[1:-1, 1:-1] - cy
    cy &= n >= 4
out = np.zeros((c.shape[0], c.shape[1], 4), np.uint8); out[cy] = [44, 52, 62, 255]
ys = np.nonzero(cy.any(1))[0]; mid = (ys.min() + ys.max()) // 2
for yy in (mid - 1, mid, mid + 1): out[yy][cy[yy]] = [90, 210, 225, 255]
out[:9] = 0; out[30:] = 0
m = out[..., 3] > 0
pm = np.pad(m, 1); d = np.zeros_like(m)
for dy in (-1, 0, 1):
    for dx in (-1, 0, 1): d |= np.roll(np.roll(pm, dy, 0), dx, 1)[1:-1, 1:-1]
out[d & ~m] = [34, 40, 48, 255]
Image.fromarray(out).save(ROOT + '/public/art/street/blink.png')
