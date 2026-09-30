# Cut moving-part sprites (+ clean background patches) for the bar scene from public/art/bar.jpg.
# Output: public/art/bar/parts.png (atlas) and prints a TS table of {sx,sy,w,h,x,y} per part.
import json, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = "/home/sprite/org/workspace/.local/jiro.bot/restaurant"
art = np.asarray(Image.open(f"{ROOT}/public/art/bar.jpg").convert("RGB")).astype(np.int32)
H, W, _ = art.shape

def polymask(poly):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in poly], fill=255)
    return np.asarray(m) > 0

def inpaint(mask):
    """Fill masked pixels: average of horizontal and vertical linear interpolation between unmasked neighbours."""
    out = art.copy().astype(float)
    ys, xs = np.nonzero(mask)
    for y, x in zip(ys, xs):
        acc = [];
        for dy, dx in ((0, 1), (1, 0)):
            a = b = None
            for s in range(1, 200):
                yy, xx = y - dy * s, x - dx * s
                if 0 <= yy < H and 0 <= xx < W and not mask[yy, xx]: a = (s, art[yy, xx]); break
            for s in range(1, 200):
                yy, xx = y + dy * s, x + dx * s
                if 0 <= yy < H and 0 <= xx < W and not mask[yy, xx]: b = (s, art[yy, xx]); break
            if a and b:
                acc.append((a[1] * b[0] + b[1] * a[0]) / (a[0] + b[0]))
            elif a or b:
                acc.append((a or b)[1])
        out[y, x] = np.mean(acc, axis=0)
    return out.clip(0, 255).astype(np.uint8)

def rgba(mask, src=None):
    src = art if src is None else src
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    a = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    a[..., :3] = src[y0:y1, x0:x1]
    a[..., 3] = mask[y0:y1, x0:x1] * 255
    return a, int(x0), int(y0)

parts = {}
def add(name, mask, patch=False):
    parts[name] = rgba(mask)
    if patch:
        # patch covers the part grown by 4 px downward/upward so vacated slivers are clean
        clean = inpaint(mask)
        parts[name + "-bg"] = rgba(mask, clean)

P = {
    "woman-head": [(284,420),(298,404),(330,399),(362,404),(378,418),(381,440),(377,465),(379,500),(360,506),(290,506),(282,470)],
    "woman-hands": [(365,524),(376,515),(399,515),(404,528),(400,553),(372,553),(363,540)],
    "navy-head": [(484,455),(492,440),(515,428),(545,416),(548,401),(582,397),(590,418),(585,440),(588,458),(578,470),(574,480),(574,533),(484,533)],
    "brown-head": [(704,520),(712,500),(730,488),(760,484),(785,488),(797,500),(801,520),(792,540),(788,565),(783,588),(760,592),(712,590),(704,560)],
    "brown-body": [(664,610),(690,596),(712,590),(770,590),(795,600),(815,618),(840,625),(868,628),(880,640),(884,665),(874,684),(850,700),(828,716),(806,722),(792,735),(790,770),(662,770),(656,700),(658,640)],
    "brown-hand": [(812,622),(840,624),(868,626),(882,640),(885,668),(874,686),(852,697),(826,691),(810,660)],
    "olive-head": [(1612,530),(1625,511),(1660,507),(1700,514),(1713,535),(1713,600),(1695,612),(1665,618),(1640,622),(1622,615),(1618,580),(1610,560)],
    "olive-toe": [(1540,968),(1582,965),(1584,1004),(1542,1001)],
    "jiro-jaw": [(947,291),(997,291),(997,313),(949,313)],
    "jiro-hand": [(950,445),(962,439),(985,447),(1000,451),(1010,454),(1031,469),(1032,490),(1015,501),(975,503),(951,496),(947,470)],
}
masks = {k: polymask(v) for k, v in P.items()}
masks["brown-body"] &= ~masks["brown-hand"]
masks["brown-body"] &= ~masks["brown-head"]
for k in P:
    add(k, masks[k], patch=k in ("woman-hands", "navy-head", "olive-head", "olive-toe", "jiro-jaw", "jiro-hand"))

# Noren: cloth sprite (region minus things in front of it) and the occluders in front (Jiro, bottles).
R = (820, 44, 1175, 346)
occ_poly = polymask([(925,346),(928,210),(945,180),(975,162),(1015,158),(1042,158),(1072,168),(1076,215),(1062,240),(1066,300),(1072,346)]) \
         | polymask([(1058,346),(1060,224),(1078,210),(1100,214),(1112,220),(1140,214),(1152,224),(1166,230),(1175,232),(1175,346)])
r, g, b = art[..., 0], art[..., 1], art[..., 2]
yy, xx = np.mgrid[0:H, 0:W]
green = (g > r * 0.92) & (g > b + 8)
indigo = (b > r + 4) & (b >= g - 4) & (yy < 238)
kana = (art.mean(2) > 140) & (yy < 166) & ~((xx > 1038) & (xx < 1072))
lum = art.mean(2)
cloth_col = (green & (xx < 955)) | (indigo & (lum < 110)) | (kana & (yy < 158))
occ = occ_poly & ~cloth_col
def dil(m, n):
    for _ in range(n):
        o = m.copy(); o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]; m = o
    return m
occ = (~dil(~dil(occ, 2), 2)) & occ_poly
reg = np.zeros((H, W), bool); reg[R[1]:R[3], R[0]:R[2]] = True
occ &= reg
cloth = reg & ~occ
parts["noren-cloth"] = rgba(cloth)
parts["noren-occ"] = rgba(occ)

# Pack atlas (simple shelf packing).
names = list(parts)
names.sort(key=lambda n: -parts[n][0].shape[0])
AW = 1024; x = y = sh = 0; place = {}
for n in names:
    a = parts[n][0]; h, w = a.shape[:2]
    if x + w > AW: x = 0; y += sh + 2; sh = 0
    place[n] = (x, y); x += w + 2; sh = max(sh, h)
AH = y + sh
atlas = np.zeros((AH, AW, 4), np.uint8)
table = {}
for n in names:
    a, ox, oy = parts[n]; px, py = place[n]; h, w = a.shape[:2]
    atlas[py:py + h, px:px + w] = a
    table[n] = [px, py, w, h, ox, oy]
Image.fromarray(atlas).save(f"{ROOT}/public/art/bar/parts.png", optimize=True)
print(json.dumps(table))
