# Reconstructed (final version) from the kitchen-polish agent: cuts Jiro's eye/grille patches out of
# public/art/kitchen.jpg and writes public/art/kitchen/jiro-blink.png (closed-eye lids interpolated from
# the faceplate + a 2px lid line) and jiro-talk.png (lit cyan grille pixels). Drawn at (1536,330) by kitchen.ts.
# NOTE: run against the kitchen art of commit 32eac88 (before the swinging-door edit); the door edit only
# touched x 480-800 so the Jiro area is unchanged.
import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image
import numpy as np
R = ROOT + '/public/art/'
im = Image.open(R + 'kitchen.jpg').convert('RGBA')
X0, Y0, X1, Y1 = 1536, 330, 1624, 430
base = np.asarray(im.crop((X0, Y0, X1, Y1))).astype(int)
r, g, b = base[..., 0], base[..., 1], base[..., 2]
eye = (b > r + 30) & (b > 90); eye[:8] = False; eye[52:] = False
H, W = eye.shape
blink = np.zeros_like(base)
line = [40, 26, 24, 255]
for (xa, xb) in [(0, 40), (40, W)]:
    ys, xs = np.nonzero(eye[:, xa:xb]); xs = xs + xa
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    x0e = x0 - (0 if xa == 0 else 3); x1e = x1 + 3; y0e = y0 - 3; y1e = y1 + 3
    for y in range(y0e, y1e + 1):
        rc = base[y, x1e + 2]
        lc = base[y, x0e - 2] if xa > 0 else rc
        for x in range(x0e, x1e + 1):
            f = (x - x0e) / max(1, x1e - x0e)
            blink[y, x] = (lc * (1 - f) + rc * f).astype(int); blink[y, x, 3] = 255
    mid = (y0 + y1) // 2 + 2
    blink[mid:mid + 2, x0 + 1:x1] = line
Image.fromarray(blink.astype('uint8')).save(R + 'kitchen/jiro-blink.png')
talk = np.zeros_like(base)
for y in range(405 - Y0, 421 - Y0):
    for x in range(1572 - X0, 1602 - X0):
        p = base[y, x]
        if p[0] < 150 and p[:3].sum() < 330: talk[y, x] = [140, 235, 255, 255]
Image.fromarray(talk.astype('uint8')).save(R + 'kitchen/jiro-talk.png')
