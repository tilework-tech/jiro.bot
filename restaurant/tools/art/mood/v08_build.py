import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
# v08 butcher's chart assets: cut sprites, ghost, parchment, board, knife.
from PIL import Image, ImageDraw
import json, random
OUT = ROOT+"/public/mood/v08/"
src = Image.open("/tmp/v08/fishq.png").convert("RGBA")
W, H = src.size
p = src.load()
INK = (43, 26, 18, 255)

def interp(pts, v):  # pts [(a,b)], returns b at a=v
    for (a0, b0), (a1, b1) in zip(pts, pts[1:]):
        if a0 <= v <= a1:
            return b0 + (b1 - b0) * (v - a0) / max(1e-6, a1 - a0)
    return pts[0][1] if v < pts[0][0] else pts[-1][1]

G = [(0, 110), (77, 118), (110, 138), (140, 140), (173, 132), (221, 124)]  # y -> x
LAT = [(100, 88), (145, 82), (195, 78), (245, 80), (270, 85), (295, 87), (320, 95), (345, 103), (370, 110), (445, 115), (520, 115)]
M = [(186, 132), (285, 132), (362, 127)]
def cut(x, y):
    if x < interp(G, y):
        return "noten" if y < 127 else "hoho"
    if x < 188:
        return "kama"
    if x >= 446:
        return "onomi"
    if y < interp(LAT, x):
        return "sekami" if x < 285 else "seshimo"
    if x < 285:
        return "chutoro" if y < interp(M, x) else "otoro"
    if x < 362:
        return "haranaka" if y < interp(M, x) else "jabara"
    return "harashimo"

ids = {}
for y in range(H):
    for x in range(W):
        if p[x, y][3]:
            ids[(x, y)] = cut(x, y)
names = sorted(set(ids.values()))
# vintage mute
def mute(c):
    r, g, b, a = c
    t = 0.18
    return (round(r * (1 - t) + 214 * t), round(g * (1 - t) + 190 * t), round(b * (1 - t) + 150 * t), a)

meta = {}
ghost = Image.new("RGBA", (W, H))
gp = ghost.load()
for n in names:
    pts = [k for k, v in ids.items() if v == n]
    xs = [k[0] for k in pts]; ys = [k[1] for k in pts]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs) + 1, max(ys) + 1
    im = Image.new("RGBA", (x1 - x0, y1 - y0))
    ip = im.load()
    for (x, y) in pts:
        border_int = any(ids.get((x + dx, y + dy), n) != n for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        border_any = any(ids.get((x + dx, y + dy)) != n for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        c = mute(p[x, y])
        if border_int and (x + y) % 3 != 0:
            c = INK
        ip[x - x0, y - y0] = c
        # ghost: pale cavity with dotted outline + sparse hatch
        if border_any:
            gp[x, y] = (110, 80, 52, 255) if (x + y) % 2 == 0 else (0, 0, 0, 0)
        elif (x - y) % 6 == 0:
            gp[x, y] = (196, 172, 132, 255)
        else:
            gp[x, y] = (226, 208, 174, 150)
    im.save(OUT + f"cut-{n}.png")
    cx = sum(xs) / len(xs); cy = sum(ys) / len(ys)
    meta[n] = dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0, cx=round(cx), cy=round(cy))
ghost.save(OUT + "ghost.png")

# id map (one byte per pixel, index into names) as png L
idm = Image.new("L", (W, H), 0)
for (x, y), v in ids.items():
    idm.putpixel((x, y), names.index(v) + 1)
print(json.dumps(dict(W=W, H=H, names=names, meta=meta)))

# parchment 550x350 (displayed 2x = 1100x700)
random.seed(8)
PW, PH = 550, 350
par = Image.new("RGB", (PW, PH))
pp = par.load()
stains = [(random.randint(0, PW), random.randint(0, PH), random.randint(20, 70)) for _ in range(9)]
for y in range(PH):
    for x in range(PW):
        base = [236, 222, 192]
        n = random.random()
        d = 0
        for sx, sy, r in stains:
            dd = ((x - sx) ** 2 + (y - sy) ** 2) ** .5
            if dd < r: d += (1 - dd / r) * 14
        # edge burn
        e = min(x, y, PW - 1 - x, PH - 1 - y)
        if e < 18: d += (18 - e) * 1.6
        if n < 0.10: d += 7
        elif n > 0.97: d -= 5
        # dither quantize to steps of 6
        k = round(d / 6) * 6
        pp[x, y] = (base[0] - k, base[1] - round(k * 1.15), base[2] - round(k * 1.5))
par.save(OUT + "parchment.png")

# cutting board 260x120 (displayed 2x)
BW, BH = 260, 116
bd = Image.new("RGBA", (BW, BH), (0, 0, 0, 0))
bp = bd.load()
for y in range(BH):
    for x in range(BW):
        if y >= BH - 8:
            if 4 <= x < BW - 4:
                bp[x, y] = (122, 78, 44, 255) if y < BH - 4 else (0, 0, 0, 90)
            continue
        c = [214, 176, 124]
        g = (y * 7 + int(6 * __import__("math").sin(x / 23 + y / 9))) % 19
        if g == 0: c = [188, 148, 98]
        elif g == 1 and x % 3: c = [200, 162, 110]
        if random.random() < .04: c = [c[0] - 10, c[1] - 10, c[2] - 8]
        if y == 0 or x == 0 or x == BW - 1: c = [236, 204, 150]
        if y == BH - 9: c = [150, 104, 62]
        bp[x, y] = (*c, 255)
bd.save(OUT + "board.png")

# yanagiba knife 120x14
K = Image.new("RGBA", (124, 16), (0, 0, 0, 0))
kd = ImageDraw.Draw(K)
kd.polygon([(0, 8), (10, 3), (86, 3), (86, 12), (6, 12)], fill=(210, 214, 222, 255))
kd.line([(10, 3), (86, 3)], fill=(250, 250, 255, 255))
kd.line([(6, 12), (86, 12)], fill=(120, 124, 134, 255))
kd.line([(4, 10), (86, 10)], fill=(172, 176, 186, 255))
kd.rectangle([86, 2, 92, 13], fill=(40, 28, 22, 255))
kd.rectangle([92, 3, 123, 12], fill=(150, 98, 56, 255))
kd.line([(92, 4), (123, 4)], fill=(190, 132, 80, 255))
kd.line([(92, 11), (123, 11)], fill=(104, 64, 34, 255))
K.save(OUT + "knife.png")
