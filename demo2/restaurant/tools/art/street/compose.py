import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
o = Image.open('/tmp/polish-street/street.orig.jpg').convert('RGB')
t = Image.open('/tmp/polish-street/tray1_1920.png').convert('RGB')
# 1) paste gemini tray (ellipse mask, feathered) around the loop
m = Image.new('L', o.size, 0)
ImageDraw.Draw(m).ellipse((1493-150, 607-72, 1493+150, 607+70), fill=255)
m = m.filter(ImageFilter.GaussianBlur(5))
img = Image.composite(t, o, m)
# 2) paint the inner well exactly inside the code tread's inner edge
N = 28
pts = []
for i in range(N):
    a = i / N * math.tau
    pts.append((1493 + math.cos(a) * 118, 607 + math.sin(a) * 44, 0.72 + 0.1 * math.sin(a)))
inner = []
for i in range(N):
    x, y, s = pts[i]
    xa, ya, _ = pts[i - 1]; xb, yb, _ = pts[(i + 1) % N]
    dx, dy = xb - xa, yb - ya; l = math.hypot(dx, dy)
    nx, ny = -dy / l, dx / l  # left normal (points inward for this CW-in-screen loop?)
    # choose the normal that points toward the centre
    if (1493 - x) * nx + (607 - y) * ny < 0: nx, ny = -nx, -ny
    k = 44 * s / 2 - 2
    inner.append((x + nx * k, y + ny * k))
P = 3  # pixel block
W, H = 1920, 1080
lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mask).polygon(inner, fill=255)
mk = np.asarray(mask) > 127
arr = np.asarray(img).copy()
ys, xs = np.nonzero(mk)
cy = 607
for y, x in zip(ys, xs):
    bx, by = (x // P) * P, (y // P) * P
    # depth: darker near the far (top) inner wall
    col = np.array([52, 30, 22], float)
    # far inner wall band (lit copper-brown wall seen from above)
    top_edge = np.interp(bx, [p[0] for p in sorted(inner)], [0]*len(inner))
    arr[y, x] = col
# vertical-ish plank seams + far-wall band via a second pass on the block grid
img2 = Image.fromarray(arr)
d = ImageDraw.Draw(img2)
def blk(x, y, c):
    x, y = (int(x) // P) * P, (int(y) // P) * P
    if mk[min(H-1,y+1), min(W-1,x+1)]:
        d.rectangle((x, y, x + P - 1, y + P - 1), fill=c)
# far inner wall: for each column, the top-most mask pixels get a warm wall band ~9px tall
for x in range(0, W, P):
    col = np.nonzero(mk[:, x])[0]
    if len(col) == 0: continue
    y0 = col.min()
    y1 = col.max()
    for yy in range(y0, min(y0 + 12, y1), P):
        f = (yy - y0) / 12
        c = (int(120 - 50 * f), int(66 - 28 * f), int(40 - 16 * f))
        blk(x, yy, c)
    # near inner wall shadow line at bottom
    blk(x, y1 - 2, (30, 16, 12))
    # planks: every 18px a darker seam
    if (x - 1380) % 18 < P:
        for yy in range(y0 + 12, y1 - 3, P):
            blk(x, yy, (38, 21, 16))
# dither highlight on well floor
for x in range(1400, 1590, P * 2):
    for y in range(612, 632, P * 2):
        if ((x // P + y // P) % 2 == 0): blk(x, y, (62, 37, 27))
# copper hub (delivery bell) in the centre
cx, cyy = 1493, 612
for y in range(cyy - 9, cyy + 10, P):
    for x in range(cx - 21, cx + 22, P):
        e = ((x - cx) / 21) ** 2 + ((y - cyy) / 9) ** 2
        if e <= 1:
            c = (201, 129, 74) if y < cyy - 1 else (140, 82, 44)
            if e > 0.62: c = (100, 58, 34)
            blk(x, y, c)
blk(cx - 9, cyy - 6, (255, 214, 160)); blk(cx - 6, cyy - 6, (240, 180, 120))
img2.save('/tmp/polish-street/street.v1.png')
img2.crop((1300, 480, 1700, 720)).resize((1200, 720), Image.NEAREST).save('/tmp/polish-street/crop_v1.png')
