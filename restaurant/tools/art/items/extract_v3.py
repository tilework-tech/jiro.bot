"""V3 belt items: cut 5 Gemini 2x2 magenta sheets (see docs/06 §8.6) into public/items/*.png.
usage: extract_v3.py SHEETDIR   (expects sheet1.png..sheet5.png, 2048x2048)
Key: magenta (comps.fg_mask) -> keep all connected components >= 0.2% of the largest (keeps zzz, sweat,
smoke, flags) -> fringe fix -> crop -> NEAREST so max side = 160 -> hard alpha."""
import os, sys, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from comps import fg_mask
from extract import fix_fringe
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
NAMES = [["sumo-penguin", "hardhat", "hermit", "plank"],
         ["cat-nap", "lifeguard", "cactus", "puffer-inflate"],
         ["otter", "ant-bridge", "wasabi-dragon", "mochi-ghost"],
         ["octo-dj", "treasure-bento", "lgtm", "not-found"],
         ["ginger-boat", "uni-hog", "tempura-bag", "narwhal"]]
def cut(a, name):
    m = fg_mask(a)
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= 0.002 * sizes.max()]
    m = np.isin(lab, keep)
    c, m = fix_fringe(a.copy(), m, it=4)
    ys, xs = np.where(m)
    c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray(np.dstack([c, (m * 255).astype(np.uint8)]), "RGBA")
    f = 160 / max(im.size)
    im = im.resize((max(1, round(im.width * f)), max(1, round(im.height * f))), Image.NEAREST)
    im.save(f"{ROOT}/public/items/{name}.png"); print(name, im.size, len(keep), "comps")
d = sys.argv[1]
for i, row in enumerate(NAMES):
    a = np.array(Image.open(f"{d}/sheet{i+1}.png").convert("RGB"))
    H, W = a.shape[:2]
    for q, name in enumerate(row):
        y, x = divmod(q, 2)
        cut(a[y * H // 2:(y + 1) * H // 2, x * W // 2:(x + 1) * W // 2], name)
