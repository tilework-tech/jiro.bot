#!/usr/bin/env python3
"""Build the night-delivery street (parallax layers + Jiro's bike) on a 3 px grid.

usage: /tmp/venv/bin/python src/scenes/street/build_art.py

in : src/scenes/street/src/*.png   raw Gemini stills (not served):
       far_raw.jpg, midA_raw.jpg, midB_raw.jpg   flat side elevations keyed on magenta (Gemini returns JPEG)
       join_far.jpg, join_ab.jpg, join_ba.jpg    Gemini-painted seams (make_joins.py)
       rider_raw.jpg                             Jiro on the delivery bike, keyed on magenta
       drain_src.jpg                             the old street>pond drain band (its kerb slab is reused)
out: public/art/street/*.png  (all 640x360-grid art upscaled 3x NEAREST, PNG)
       sky.png    1920x1080 static back (the scene's `art`): night sky, moon, haze
       far.png    1920-wide tile: distant skyline          (scrolls  80 px/s, period 24 s)
       mid.png    3840-wide tile: shopfronts + neon        (scrolls 160 px/s, period 24 s)
       neon.png   3840-wide tile: just the lit pixels of mid (the scene flickers them in 3 groups)
       road.png   1920-wide tile: wet asphalt + crosswalk  (scrolls 320 px/s, period  6 s)
       refl.png   3840-wide tile: mid, flipped + darkened for the wet-road reflection (moves with mid)
       front.png  1920x1080 static foreground: the belt's steel column, kerb, sidewalk, drain inlet
       rider.png  Jiro + bike with the legs, cranks and spokes removed (drawn live by street.ts)
       cone.png   1920x1080 dithered headlight beam
     public/art/tr/street-pond/drain.png  the street>pond band, re-based on this street's static bottom
     src/scenes/street/art.json  geometry for street.ts
"""
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
SRC = os.path.join(HERE, "src")
OUT = os.path.join(ROOT, "public/art/street")
PX = 3
W, H = 640, 360

# Native rows (x3 = stage px).
ROAD_Y0 = 253      # far kerb line: road starts
KERB_Y = 308       # our kerb (static foreground) starts
FAR_Y = -22        # far tile top
MID_Y = 33         # mid tile top
FAR_W, MID_W, ROAD_W = 640, 1280, 640
RIDER_X, GROUND_Y = 340, 306  # sprite left, tyre contact row

# Seam windows (see make_joins.py).
JH, JWIN, JGAP = 1008, 1792, 320
JSIDE = (JWIN - JGAP) // 2
FEATHER = 28


def load(name):
    return Image.open(os.path.join(SRC, name)).convert("RGB")


def work(name):
    im = load(name)
    return np.asarray(im.resize((round(im.width * JH / im.height), JH), Image.LANCZOS)).astype(np.float32)


def join(name):
    return np.asarray(load(f"join_{name}.jpg").resize((JWIN, JH), Image.LANCZOS)).astype(np.float32)


def seam(left, right, fill):
    """left | gap | right with the gap from `fill`, cross-faded FEATHER px into both neighbours."""
    L, R = left.copy(), right.copy()
    ramp = np.linspace(0, 1, FEATHER)[None, :, None]
    L[:, -FEATHER:] = L[:, -FEATHER:] * (1 - ramp) + fill[:, JSIDE - FEATHER:JSIDE] * ramp
    R[:, :FEATHER] = fill[:, JSIDE + JGAP:JSIDE + JGAP + FEATHER] * (1 - ramp) + R[:, :FEATHER] * ramp
    return L, fill[:, JSIDE:JSIDE + JGAP], R


def key_magenta(a):
    """Alpha from the magenta key + despill (edge pixels lose their pink cast)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    alpha = ~((r > 150) & (b > 150) & (g < 120) & (np.minimum(r, b) - g > 90))
    out = a.copy()
    k = np.clip(np.minimum(r, b) - g, 0, None)
    out[..., 0] = r - k
    out[..., 2] = b - k * 0.7
    return np.clip(out, 0, 255), alpha.astype(np.float32)


def down(rgb, alpha, w, h):
    """Premultiplied BOX downsample to the native grid, hard alpha."""
    pre = Image.fromarray(np.clip(rgb * alpha[..., None], 0, 255).astype(np.uint8)).resize((w, h), Image.BOX)
    al = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).resize((w, h), Image.BOX)).astype(np.float32) / 255
    p = np.asarray(pre).astype(np.float32)
    rgb2 = np.where(al[..., None] > 0.02, p / np.maximum(al[..., None], 1e-3), 0)
    return np.clip(rgb2, 0, 255), (al > 0.5)


WTS = np.array([0.30, 0.59, 0.11], dtype=np.float32) * 3


def palette(rgb, mask, n):
    px = rgb[mask].reshape(-1, 1, 3).astype(np.uint8)
    q = Image.fromarray(px).quantize(colors=n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    return np.array(q.getpalette()[: n * 3], dtype=np.float32).reshape(-1, 3)


def snap(rgb, pal):
    flat = rgb.reshape(-1, 3)
    out = np.empty_like(flat)
    for i in range(0, len(flat), 20000):
        d = (((flat[i:i + 20000, None, :] - pal[None]) ** 2) * WTS).sum(-1)
        out[i:i + 20000] = pal[d.argmin(1)]
    return out.reshape(rgb.shape)


def save(arr, alpha, name, scale=PX):
    h, w = arr.shape[:2]
    if alpha is None:
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    else:
        im = Image.fromarray(np.dstack([np.clip(arr, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")
    im.resize((w * scale, h * scale), Image.NEAREST).save(os.path.join(OUT, name), optimize=True)


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def hash2(x, y, k=1):
    s = np.sin(x * 127.1 * k + y * 311.7 + k * 74.7) * 43758.5453
    return s - np.floor(s)


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dtype=np.float32) / 16 + 1 / 32


# ---------------------------------------------------------------- sky (static)
def build_sky():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    top, mid, low = hexrgb("#0a0a1c"), hexrgb("#1a1633"), hexrgb("#3a2447")
    t = np.clip(ys / 150, 0, 1)
    # A few hard colour bands with an ordered dither between them (16-bit sky).
    levels = 7
    f = t * (levels - 1)
    fi = np.floor(f)
    fr = f - fi
    b = np.tile(BAYER, (H // 4 + 1, W // 4 + 1))[:H, :W]
    step = (fi + (fr > b)) / (levels - 1)
    col = np.where(step[..., None] < 0.6, top + (mid - top) * (step[..., None] / 0.6),
                   mid + (low - mid) * ((step[..., None] - 0.6) / 0.4))
    # City glow low on the horizon (warm-pink haze), dithered.
    glow = np.clip((ys - 60) / 90, 0, 1) * 0.5
    col = col + (hexrgb("#6a3050") - col) * ((glow > b)[..., None] * 0.18)
    # Moon (upper right) with a soft halo ring and two cloud bars across it.
    mx, my, mr = 560, 34, 11
    d = np.hypot(xs - mx, ys - my)
    halo = (d < mr + 14) & (d >= mr)
    col[halo & (b < 0.35 * (1 - (d - mr) / 14))] = hexrgb("#3b3a5e")
    moon = d < mr
    col[moon] = hexrgb("#e9e2c8")
    col[moon & (np.hypot(xs - mx - 3, ys - my + 2) < mr - 2) & (xs > mx + 2)] = hexrgb("#fff7de")
    for (cx, cy, r) in ((556, 30, 2.2), (563, 38, 1.6), (552, 39, 1.2)):  # craters
        col[np.hypot(xs - cx, ys - cy) < r] = hexrgb("#c9c0a6")
    for (x0, x1, y, c) in ((528, 600, 40, "#2a2544"), (470, 560, 55, "#211c38"),
                           (590, 640, 22, "#1d1a34"), (380, 470, 44, "#1b1832")):
        col[y:y + 1, x0:x1] = hexrgb(c)
        col[y + 1:y + 2, x0 + 8:x1 - 8] = hexrgb(c) * 0.85
    # Sparse stars in the upper sky (static; they twinkle in street.ts? no: kept static and faint).
    rnd = hash2(xs, ys, 3)
    star = (rnd > 0.9985) & (ys < 70) & ~moon & ~halo
    col[star] = hexrgb("#8e8cb8")
    save(col, None, "sky.png")
    return col


# ---------------------------------------------------------------- far skyline tile
def build_far():
    far = work("far_raw.jpg")
    L, G, R = seam(far, far, join("far"))
    # R is `far` with its first FEATHER columns blended from the fill; L is `far` with its last columns blended.
    tile = np.concatenate([np.concatenate([R[:, :-FEATHER], L[:, -FEATHER:]], axis=1), G], axis=1)
    rgb, a = key_magenta(tile)
    w, h = FAR_W, round(JH * FAR_W / tile.shape[1])
    rgb, a = down(rgb, a, w, h)
    # Push it back: darker, bluer, lower contrast (the headline sits over it on the left).
    lum = rgb.mean(-1, keepdims=True)
    lit = (lum > 120) & (rgb.max(-1, keepdims=True) - rgb.min(-1, keepdims=True) > 40)
    haze = hexrgb("#1c1a36")
    rgb = np.where(lit, rgb * 0.8, rgb * 0.55 + haze * 0.45)
    pal = palette(rgb, a, 28)
    rgb = snap(rgb, pal)
    global FAR_TRIM
    FAR_TRIM = int(np.argmax(a.any(1)))  # fully transparent rows on top are not shipped
    rgb, a = rgb[FAR_TRIM:], a[FAR_TRIM:]
    save(rgb, a, "far.png")
    return rgb, a


# ---------------------------------------------------------------- mid shopfront tile
SIDEWALK = 12  # native rows of far-side sidewalk repainted above ROAD_Y0 (unifies the three sources)


def build_mid():
    a, b = work("midA_raw.jpg"), work("midB_raw.jpg")
    La, Gab, Rb = seam(a, b, join("ab"))
    Lb, Gba, Ra = seam(b, a, join("ba"))
    # A (start blended from ba) ... A end (blended into ab) | gap ab | B (start from ab) ... B end | gap ba
    A = np.concatenate([Ra[:, :-FEATHER], La[:, -FEATHER:]], axis=1)
    B = np.concatenate([Rb[:, :-FEATHER], Lb[:, -FEATHER:]], axis=1)
    tile = np.concatenate([A, Gab, B, Gba], axis=1)
    rgb, al = key_magenta(tile)
    w, h = MID_W, round(JH * MID_W / tile.shape[1])
    rgb, al = down(rgb, al, w, h)
    # Cut at the far kerb: the road layer takes over from ROAD_Y0, the sidewalk strip is repainted
    # so the three Gemini sources share one pavement.
    y_road = ROAD_Y0 - MID_Y
    al[y_road:] = False
    ys, xs = np.mgrid[0:h, 0:w]
    y0 = y_road - SIDEWALK
    band = (ys >= y0) & (ys < y_road)
    # Wet paving: two tones, slab joints every 24 px (divides the tile), a lit kerb edge.
    base = np.where(((ys - y0) // 6) % 2 == 0, 1.0, 0.92)[..., None] * hexrgb("#2b2a3d")
    base = np.where(((xs % 24) == 0)[..., None], hexrgb("#1d1c2b"), base)
    base = np.where((ys == y0)[..., None], hexrgb("#1a1928"), base)
    base = np.where((ys >= y_road - 2)[..., None], hexrgb("#45465e"), base)
    base = np.where((ys == y_road - 1)[..., None], hexrgb("#6b6d88"), base)
    # Shop light spilling onto the pavement: sample the lit ground floor right above and smear it down.
    src = rgb[y0 - 14:y0 - 2].mean(0)
    spill = np.clip((src.max(-1) - 110) / 120, 0, 1)[None, :, None] * np.clip(1 - (ys - y0) / SIDEWALK, 0, 1)[..., None]
    dith = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w][..., None]
    base = np.where(dith < spill * 0.8, base * 0.5 + src[None] * 0.6, base)
    rgb[band] = base[band]
    al[band] = True
    pal = palette(rgb, al, 96)
    rgb = snap(rgb, pal)
    global MID_TRIM
    MID_TRIM = int(np.argmax(al.any(1)))
    rgb, al = rgb[MID_TRIM:y_road], al[MID_TRIM:y_road]
    save(rgb, al, "mid.png")
    # Neon / lamp pixels: saturated and bright. The scene breathes them in 3 groups (by column band).
    mx, mn = rgb.max(-1), rgb.min(-1)
    neon = al & (mx > 170) & ((mx - mn > 90) | (mx > 235))
    save(rgb, neon.astype(np.float32), "neon.png")
    global NEON_BOXES
    NEON_BOXES = []
    bw = 320 // PX  # not integral: work in stage px
    for b in range(MID_W * PX // 320):
        x0, x1 = b * 320, (b + 1) * 320
        m = np.repeat(np.repeat(neon, PX, 0), PX, 1)[:, x0:x1]
        ys, xs = np.nonzero(m)
        NEON_BOXES.append([0, 0, 0, 0] if not len(ys) else [x0 + int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)])
    return rgb, al, neon


def build_refl(mid, al):
    """Mid flipped about the far kerb, darkened; lights kept bright. Rows 0.. = road rows ROAD_Y0.."""
    n = KERB_Y - ROAD_Y0 + 6
    y_road = ROAD_Y0 - MID_Y - MID_TRIM
    rows = []
    alpha = []
    for i in range(n):
        src = y_road - SIDEWALK - 1 - int(i * 1.15)
        r = mid[max(0, src)].copy()
        a = al[max(0, src)].astype(np.float32)
        lum = r.max(-1, keepdims=True)
        r = np.where(lum > 160, r * 0.9, r * 0.42)
        rows.append(r)
        alpha.append(a)
    rgb = np.stack(rows)
    a = np.stack(alpha)
    # Streaky wet asphalt: per-row alpha fading away from the kerb, every 3rd row faint; lights stay strong.
    ys = np.arange(n)[:, None]
    bright = rgb.max(-1) > 160
    fade = np.clip(0.85 - ys / n * 0.6, 0.25, 1) * np.where((ys % 3) == 2, 0.45, 1.0)
    a = a * np.where(bright, np.minimum(1, fade * 1.3), fade)
    pal = palette(rgb, a > 0, 40)
    rgb = snap(rgb, pal)
    a = np.round(a * 6) / 6  # a few alpha steps only
    save(rgb, a, "refl.png")


# ---------------------------------------------------------------- road tile (procedural)
def build_road():
    n = KERB_Y - ROAD_Y0 + 6
    ys, xs = np.mgrid[0:n, 0:ROAD_W]
    asph = [hexrgb("#15151f"), hexrgb("#1a1a26"), hexrgb("#20202e"), hexrgb("#282838")]
    # Periodic value noise (wraps at ROAD_W) -> 4 asphalt tones.
    nz = hash2(xs % ROAD_W, ys, 5) * 0.55 + hash2((xs // 3) % (ROAD_W // 3), ys // 2, 7) * 0.45
    depth = ys / n
    tone = np.clip((nz * 1.6 - 0.35 + depth * 0.4), 0, 3.99).astype(int)
    rgb = np.stack(asph)[tone]
    # Far gutter shadow under the kerb.
    rgb[0:2] = hexrgb("#0d0d15")
    rgb[2:3] = hexrgb("#13131c")
    # Centre line: dashes 20 on / 20 off (40 divides the tile).
    cl = 20
    dash = ((xs % 40) < 20) & (ys >= cl) & (ys < cl + 2)
    rgb[dash] = hexrgb("#8d8a7a")
    rgb[dash & (ys == cl)] = hexrgb("#b3ae98")
    # Near edge line, solid.
    rgb[(ys >= n - 12) & (ys < n - 11)] = hexrgb("#6f6d62")
    # Crosswalk: 6 bars stacked in depth, sheared a little for perspective, worn with dither.
    cx0, cw = 360, 96
    for k in range(6):
        y0 = 5 + k * 8
        for y in range(y0, min(y0 + 4, n - 13)):
            sh = int((y - n / 2) * 0.35)
            x0 = cx0 + sh
            seg = (xs[y] >= x0) & (xs[y] < x0 + cw)
            wear = hash2(xs[y], np.full_like(xs[y], y), 9) < 0.86
            c = hexrgb("#a9a79d") * (0.8 + 0.2 * (y - y0 == 0))
            rgb[y][seg & wear] = c
    # Manhole cover.
    mx, my = 120, 34
    d = np.hypot((xs - mx) / 2.6, ys - my)
    rgb[(d < 5)] = hexrgb("#2c2b35")
    rgb[(d < 4.2) & ((xs + ys) % 3 == 0)] = hexrgb("#3d3c4a")
    rgb[(d >= 5) & (d < 5.8)] = hexrgb("#0e0e15")
    # Puddles: dark mirror patches with a thin light rim (the reflection reads strongest there).
    for (px_, py_, rx, ry) in ((60, 44, 30, 3), (250, 30, 22, 2), (520, 40, 40, 3), (600, 14, 18, 2), (430, 50, 14, 2)):
        d = ((xs - px_) / rx) ** 2 + ((ys - py_) / ry) ** 2
        rgb[d < 1] = hexrgb("#0f1019")
        rgb[(d >= 1) & (d < 1.5) & (ys < py_)] = hexrgb("#3a3b52")
    save(rgb, None, "road.png")
    return rgb


# ---------------------------------------------------------------- static foreground
def build_front():
    """The belt's steel column (left lane), our kerb with the belt on it, the sidewalk slab and the drain inlet.
    Everything here stays still: it belongs with the belt, not with the street going by."""
    rgb = np.zeros((H, W, 3), np.float32)
    a = np.zeros((H, W), bool)
    ys, xs = np.mgrid[0:H, 0:W]
    # Sidewalk slab: the drain band's own kerb slab (so the street>pond band continues it), mirrored.
    band = np.asarray(Image.open(os.path.join(SRC, "drain_src.jpg")).convert("RGB")).astype(np.float32)
    slab = band[130:235:3, 0:1560:3]  # 35 native rows of plain slab (the shaft sits right of it)
    s0 = H - slab.shape[0]
    rgb[s0:, :520] = slab[:, ::-1]
    rgb[s0:, 520:] = slab[:, :W - 520]
    a[s0:] = True
    # The kerb stone (top face + front face) where the belt runs.
    k0 = KERB_Y
    top = hexrgb("#4d4a60")
    rgb[k0:k0 + 1] = hexrgb("#8d8aa8")
    rgb[k0 + 1:k0 + 9] = top
    rgb[k0 + 2:k0 + 3] = hexrgb("#5d5a74")
    face = hexrgb("#2c2a3b")
    rgb[k0 + 9:s0] = face
    rgb[k0 + 9:k0 + 10] = hexrgb("#1a1824")
    rgb[s0 - 1:s0] = hexrgb("#12111a")
    # Kerb joints every 64 px, wet specks.
    for x in range(20, W, 64):
        rgb[k0 + 1:s0 - 1, x] = hexrgb("#1f1d2b")
    wet = (hash2(xs, ys, 11) > 0.93) & (ys > k0) & (ys < k0 + 9)
    rgb[wet] = hexrgb("#7d7c99")
    a[k0:s0] = True
    # Drain inlet at the right lane: iron frame + dark mouth that swallows the belt.
    x0, x1 = 566, 616
    rgb[k0 + 9:, x0:x1] = hexrgb("#07070b")
    rgb[k0 + 9:, x0:x0 + 2] = hexrgb("#2d2b36")
    rgb[k0 + 9:, x1 - 2:x1] = hexrgb("#2d2b36")
    rgb[k0 + 9:k0 + 11, x0:x1] = hexrgb("#3c3a48")
    for x in range(x0 + 4, x1 - 2, 4):
        rgb[k0 + 11:k0 + 14, x:x + 2] = hexrgb("#24222d")
    # The belt's steel column on the left lane (x 100..200 stage): an I-beam from the sky to the kerb.
    c0, c1 = 34, 67
    col = (xs >= c0) & (xs < c1) & (ys < k0)
    rgb[col] = hexrgb("#1a1822")
    rgb[col & (xs == c0)] = hexrgb("#0b0a10")
    rgb[col & (xs == c1 - 1)] = hexrgb("#0b0a10")
    rgb[col & (xs == c0 + 1)] = hexrgb("#4a4660")  # lit flange edge (street light from the right is on the other side)
    rgb[col & (xs == c1 - 2)] = hexrgb("#5e5a78")
    rgb[col & (xs == c1 - 3)] = hexrgb("#35324a")
    for y in range(12, k0, 30):  # rivet pairs + a clamp plate
        rgb[y:y + 5, c0 + 1:c1 - 1] = hexrgb("#24212f")
        rgb[y, c0 + 1:c1 - 1] = hexrgb("#3c3850")
        rgb[y + 2, c0 + 3] = hexrgb("#8a5a3a")
        rgb[y + 2, c1 - 4] = hexrgb("#8a5a3a")
    # Base plate on the kerb.
    rgb[k0 - 3:k0, c0 - 3:c1 + 3] = hexrgb("#24212f")
    rgb[k0 - 3, c0 - 3:c1 + 3] = hexrgb("#4a4660")
    a[col] = True
    a[k0 - 3:k0, c0 - 3:c1 + 3] = True
    save(rgb, a.astype(np.float32), "front.png")
    return rgb, a


# ---------------------------------------------------------------- rider sprite
S_BOX = (224, 92, 2105, 1793)      # sprite bbox in rider_raw.jpg
S_SCALE = 73 / 744                 # tyre diameter 744 raw px -> 73 native px
WHEELS = [(37.5, 132.0), (151.0, 132.0)]
HUB_R, RIM_R = 4.0, 29.5
BB = (87.3, 137.1)                 # bottom bracket (crank centre)
HIP = (77.0, 89.0)
# Frame tubes behind the legs: repainted where the legs were cut out. (p0, p1, width)
TUBES = [((83, 87), (131, 87), 3.2), ((126, 92), (88, 135), 3.6), ((68, 86), (87, 136), 3.0), ((38, 133), (87, 137), 3.0)]


def seg_dist(xs, ys, p0, p1):
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    t = np.clip(((xs - x0) * dx + (ys - y0) * dy) / (dx * dx + dy * dy), 0, 1)
    return np.hypot(xs - (x0 + t * dx), ys - (y0 + t * dy)), t


def build_rider():
    raw = np.asarray(load("rider_raw.jpg")).astype(np.float32)
    x0, y0, x1, y1 = S_BOX
    raw = raw[y0:y1, x0:x1]
    rgb, al = key_magenta(raw)
    w, h = round((x1 - x0) * S_SCALE), round((y1 - y0) * S_SCALE)
    rgb, a = down(rgb, al, w, h)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    # Spokes: light, unsaturated pixels inside the rims (the scene draws turning spokes behind).
    for (cx, cy) in WHEELS:
        d = np.hypot(xs - cx, ys - cy)
        spoke = (d > HUB_R) & (d < RIM_R) & (lum > 80) & (sat < 70)
        a &= ~spoke
    # Legs (copper, below the shorts), the chainring and the pedals: cut out, drawn live.
    # The whole triangle between seat tube, top tube and down tube (plus the pedal circle) is
    # cleared and only the tubes and the chain are painted back, so no leg fragments survive.
    zone = (((xs >= 58) & (xs <= 124) & (ys >= 90)) | ((xs >= 86) & (xs <= 124) & (ys >= 86))) & (ys <= 158)
    zone |= np.hypot(xs - BB[0], ys - BB[1]) < 17
    zone &= ~((xs < 60) & (ys < 120))
    for (cx, cy) in WHEELS:  # tyres, rims and whatever sits inside the wheels stay
        zone &= ~(np.hypot(xs - cx, ys - cy) < 36)
    copper_hi = (xs >= 88) & (xs <= 120) & (ys >= 72) & (ys < 90) & (r - b > 40) & (r > 70)
    a &= ~(zone | copper_hi)
    # Toe of the old near foot inside the rear wheel.
    a &= ~((np.hypot(xs - WHEELS[0][0], ys - WHEELS[0][1]) < 36) & (xs > 55) & (ys > 112) & (r - b > 40) & (r > 70))
    tube_lo, tube, tube_hi = hexrgb("#0e0d19"), hexrgb("#262838"), hexrgb("#4b4f68")
    for p0, p1, wd in TUBES:
        d, _ = seg_dist(xs, ys, p0, p1)
        m = zone & (d <= wd / 2 + 0.5)
        (px0, py0), (px1, py1) = p0, p1
        nx, ny = -(py1 - py0), (px1 - px0)
        l = np.hypot(nx, ny)
        side = ((xs - px0) * nx + (ys - py0) * ny) / l
        if ny > 0:
            side = -side  # "up" side = lit
        c = np.where((d > wd / 2 - 0.6)[..., None], tube_lo, np.where((side > 0.4)[..., None], tube_hi, tube))
        rgb[m] = c[m]
        a |= m
    # Chain: upper run from the chainring to the rear sprocket (dotted links), lower run under the stay.
    for (p0, p1) in (((40, 127.5), (87, 128.5)), ((40, 136.5), (87, 145.5))):
        d, t = seg_dist(xs, ys, p0, p1)
        m = zone & (d <= 0.6)
        rgb[m] = np.where(((xs[m] % 2) == 0)[..., None], hexrgb("#5a5048"), hexrgb("#1c1820"))
        a |= m
    # Palette: median cut of the sprite + a small median cut of its saturated pixels (eyes, lamp,
    # bell, stripes), so the few key colours survive.
    satm = a & (sat > 90)
    pal = np.vstack([palette(rgb, a, 60), palette(rgb, satm, 12)])
    rgb = snap(rgb, pal)
    # Eyes: glowing cyan glass (the downsample washes them out).
    eye = a & (xs >= 95) & (xs <= 122) & (ys >= 10) & (ys <= 30) & (b - r > 25) & (lum > 110)
    rgb[eye] = hexrgb("#58d8f0")
    ey, ex = np.nonzero(eye)
    for x, y in zip(ex, ey):
        if eye[y - 1, x] and eye[y + 1, x] and eye[y, x - 1] and eye[y, x + 1]:
            rgb[y, x] = hexrgb("#b8f4ff")
    global EYE_BOXES
    EYE_BOXES = []
    for side in (ex < ex.mean(), ex >= ex.mean()):
        EYE_BOXES.append([int(ex[side].min()), int(ey[side].min()), int(ex[side].max()) + 1, int(ey[side].max()) + 1])
    print("eyes", EYE_BOXES)
    save(rgb, a.astype(np.float32), "rider.png")
    Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8)).save("/tmp/street/rider_cut.png")
    return rgb, a, (w, h)


# ---------------------------------------------------------------- headlight beam
LAMP = (145.0, 73.0)  # lamp lens in the sprite (native)


def build_cone(lamp):
    lx, ly = lamp
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    dx, dy = xs - lx, ys - ly
    ang = np.arctan2(dy, dx)
    # Beam aims down-right at the road ahead; soft edges, falls off with distance.
    a0, a1 = np.radians(1), np.radians(30)
    inside = (dx > 2) & (ang > a0) & (ang < a1)
    edge = np.minimum(ang - a0, a1 - ang) / np.radians(5)
    dist = np.hypot(dx, dy)
    k = np.clip(edge, 0, 1) * np.clip(1 - dist / 230, 0, 1) * np.clip(dist / 10, 0, 1)
    # Brighter pool where the beam hits the wet road.
    road = (ys >= ROAD_Y0) & (ys < KERB_Y)
    k = np.where(road, k * 1.6, k)
    k = np.where(ys >= KERB_Y, 0, k)
    band = np.where(k > 0.6, 0.62, np.where(k > 0.32, 0.45, np.where(k > 0.1, 0.28, 0.0)))
    on = inside & (band > 0)
    rgb = np.zeros((H, W, 3), np.float32)
    rgb[:] = hexrgb("#ffd27a")
    rgb[on & (band >= 0.6)] = hexrgb("#ffe4a0")
    on = band * inside
    save(rgb, on, "cone.png")
    ys, xs = np.nonzero(on > 0)
    return [int(xs.min()) * PX, int(ys.min()) * PX, int(xs.max() + 1 - xs.min()) * PX, int(ys.max() + 1 - ys.min()) * PX]


# ---------------------------------------------------------------- street>pond drain band
def build_drain(front):
    """public/art/tr/street-pond/drain.png: the drain band (world y 960..1960) re-based on this street.
    Rows 0..120 (world 960..1080, under the street frame) become the street's own static bottom, so the
    feathered join during the transition shows the same pixels; a dark joint separates our sidewalk from
    the band's kerb slab; the drain inlet's dark mouth continues into the top of the brick shaft."""
    src = np.asarray(Image.open(os.path.join(SRC, "drain_src.jpg")).convert("RGB")).astype(np.float32)
    n = src[::3, ::3].copy()  # re-snap the JPEG to the grid (it was painted on 3 px cells)
    # Under the street frame: the street's static bottom.
    n[0:40] = front[320:360]
    # Joint between the two slab courses (world 1080..1089).
    n[40:43] = hexrgb("#12111a")
    n[40, :] = hexrgb("#0b0a10")
    # Inlet: the street's drain mouth (native x 566..616) drops into the shaft top (the old grate goes).
    n[40:50, 523:627] = hexrgb("#2d2b36")
    n[40:41, 523:627] = hexrgb("#4a4660")
    n[40:52, 566:616] = hexrgb("#07070b")
    for k in range(4):  # the mouth fades into the lit shaft
        n[52 + k, 566:616] = n[52 + k, 566:616] * (0.25 + 0.2 * k)
    Image.fromarray(np.clip(n, 0, 255).astype(np.uint8)).resize((n.shape[1] * PX, n.shape[0] * PX), Image.NEAREST).save(
        os.path.join(ROOT, "public/art/tr/street-pond/drain.png"), optimize=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    build_sky()
    build_far()
    mid, al, neon = build_mid()
    build_refl(mid, al)
    build_road()
    front, _ = build_front()
    build_drain(front)
    _, _, (rw, rh) = build_rider()
    rider_y = GROUND_Y - rh + 1
    lamp = (RIDER_X + LAMP[0], rider_y + LAMP[1])
    cone_box = build_cone(lamp)
    data = {
        "px": PX,
        "roadY0": ROAD_Y0 * PX, "kerbY": KERB_Y * PX, "farY": (FAR_Y + FAR_TRIM) * PX, "midY": (MID_Y + MID_TRIM) * PX,
        "farW": FAR_W * PX, "midW": MID_W * PX, "roadW": ROAD_W * PX,
        "rider": {"x": RIDER_X * PX, "y": rider_y * PX, "w": rw * PX, "h": rh * PX},
        "wheels": [[(RIDER_X + x) * PX, (rider_y + y) * PX] for x, y in WHEELS],
        "rimR": RIM_R * PX, "hubR": HUB_R * PX,
        "bb": [(RIDER_X + BB[0]) * PX, (rider_y + BB[1]) * PX],
        "hip": [(RIDER_X + HIP[0]) * PX, (rider_y + HIP[1]) * PX],
        "lamp": [lamp[0] * PX, lamp[1] * PX],
        "cone": cone_box,
        "neon": NEON_BOXES,
        "front": [[34 * PX - 9, 0, (67 - 34) * PX + 18, KERB_Y * PX], [0, (KERB_Y - 3) * PX, W * PX, (H - KERB_Y + 3) * PX]],
        "eyes": [[(RIDER_X + b[0]) * PX, (rider_y + b[1]) * PX, (b[2] - b[0]) * PX, (b[3] - b[1]) * PX] for b in EYE_BOXES],
    }
    json.dump(data, open(os.path.join(HERE, "art.json"), "w"), indent=1)
    print(json.dumps(data))


if __name__ == "__main__":
    main()
