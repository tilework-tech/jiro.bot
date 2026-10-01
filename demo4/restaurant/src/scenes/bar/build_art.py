#!/usr/bin/env python3
"""Build the hero (bar) art on a 3 px grid from the raw Gemini still.

usage: /tmp/venv/bin/python src/scenes/bar/build_art.py

in : src/scenes/bar/source.png   raw Gemini still (2752x1536, not served)
out: public/art/bar/room.png     1920x1080, 640x360 native pixels upscaled 3x NEAREST, ~100 colours
     public/art/bar/sprites.png  animation frames (3x, transparent), atlas in art.json
     src/scenes/bar/art.json     belt geometry, trough bands and sprite atlas (read by bar.ts)

Steps: LANCZOS down to the native grid, paint the left side darker (quiet headline column),
quantize to a limited palette (median cut + fixed key colours: eyes, belt), repaint the belt
trough crisply along a straight fitted line, then cut the animation frames from the result.
"""
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
SRC = os.path.join(HERE, "source.png")
OUT_ART = os.path.join(ROOT, "public/art/bar/room.png")
OUT_SPR = os.path.join(ROOT, "public/art/bar/sprites.png")
OUT_JSON = os.path.join(HERE, "art.json")

PX = 3
W, H = 640, 360  # native grid
N_COLOURS = 88

# ---- Belt: straight line fitted to the Gemini belt (stage px). Centre x(y) and grey half-width(y).
C0, C1 = 2210.73, -1.38741  # centre x = C0 + C1 * y
H0, H1 = 57.28, 0.02457     # half-width of the belt surface (horizontal px) = H0 + H1 * y
REF = 84.0                  # half-width at the bottom edge: band offsets are in these units
SILL = 268                  # stage y where the belt comes out of the wall opening
OPEN_X1 = 1902              # right inner edge of the opening (the right post occludes beyond)

def cx(y): return C0 + C1 * y
def hw(y): return H0 + H1 * y

# Cross-section, far rail (negative, up-left) to the near side (positive, toward the customers).
# [r0, r1, colour] in REF units (horizontal stage px at the bottom edge, scaled with hw(y) above).
BANDS = [
    [-146, -138, "#1b1212"],  # outline
    [-138, -124, "#b9683e"],  # far rail top
    [-124, -118, "#e08a52"],  # its lit inner edge
    [-118, -102, "#6d3021"],  # far rail inner face
    [-102, -90, "#4c2119"],
    [-90, -84, "#1b1212"],    # gutter
    [-84, -72, "#2b2522"],    # belt, shaded under the far rail
    [-72, 84, "#3b3430"],     # belt surface (the engine animates slat seams on it)
    [84, 90, "#1b1212"],      # gutter
    [90, 96, "#e08a52"],      # near rail, lit edge
    [96, 114, "#b9683e"],     # near rail top
    [114, 120, "#1b1212"],
    [120, 136, "#5e2a1e"],    # front face of the trough
    [136, 142, "#1b1212"],    # outline
]
BAND_MIN, BAND_MAX = BANDS[0][0], BANDS[-1][1]
SHADOW = [142, 154]           # hard contact shadow on the counter, near side (counter darkened)

EYE = "#58d8f0"
EYE_HI = "#b8f4ff"
EYES = [(395, 92, 5, 7), (409, 92, 5, 7)]  # native x, y, w, h of the eye glass


def hexrgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def left_ramp(x):
    """Darkness painted into the art: calm, dark headline column on the left."""
    xs = x * PX + 1.5
    t = np.clip((xs - 560) / (900 - 560), 0, 1)
    t = t * t * (3 - 2 * t)
    return 0.62 + 0.38 * t


# ---- Animation frames ---------------------------------------------------------------------
# Each animated part is a native-px box. A frame = the box with a masked part moved by a whole
# native px; the pixels it uncovers are filled from the nearest unmasked pixel (same palette).

def lum(a):
    return a[..., :3].astype(np.float32).mean(-1)


def sat(a):
    a = a[..., :3].astype(np.int32)
    return a.max(-1) - a.min(-1)


def ellipse(box, cx, cy, rx, ry):
    x0, y0, x1, y1 = box
    ys, xs = np.mgrid[y0:y1, x0:x1]
    return ((xs + 0.5 - cx) / rx) ** 2 + ((ys + 0.5 - cy) / ry) ** 2 <= 1


def dilate(m, extra):
    out = m.copy()
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        sh = np.roll(np.roll(m, dy, 0), dx, 1)
        out |= sh & extra
    return out


def fill_from_neighbours(img, hole):
    img = img.copy()
    hole = hole.copy()
    H_, W_ = hole.shape
    while hole.any():
        nxt = hole.copy()
        for y, x in zip(*np.nonzero(hole)):
            for dy, dx in ((1, 0), (0, -1), (0, 1), (-1, 0)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H_ and 0 <= xx < W_ and not hole[yy, xx]:
                    img[y, x] = img[yy, xx]
                    nxt[y, x] = False
                    break
        if (nxt == hole).all():
            break
        hole = nxt
    return img


def moved(q, box, mask, parts, fill=None):
    """parts: [(mask, dx, dy)]. Returns the box with every masked part shifted."""
    x0, y0, x1, y1 = box
    base = q[y0:y1, x0:x1].copy()
    union = np.zeros(mask.shape, bool)
    for m, _, _ in parts:
        union |= m
    if fill is None:
        clean = fill_from_neighbours(base, union)
    else:
        clean = base.copy()
        clean[union] = fill
    out = clean.copy()
    for m, dx, dy in parts:
        ys, xs = np.nonzero(m)
        ty, tx = ys + dy, xs + dx
        ok = (ty >= 0) & (ty < base.shape[0]) & (tx >= 0) & (tx < base.shape[1])
        out[ty[ok], tx[ok]] = base[ys[ok], xs[ok]]
    return out


def snap(a, pal):
    flat = a.reshape(-1, 3).astype(np.float32)
    d = (((flat[:, None, :] - pal[None]) ** 2)).sum(-1)
    return pal[d.argmin(1)].reshape(a.shape).astype(np.uint8)


def build_sprites(q, pal):
    frames = []  # (name, box, rgb array)

    def box_of(b):
        x0, y0, x1, y1 = b
        return q[y0:y1, x0:x1]

    # Knife hand: the blade (light, low saturation) plus its dark outline, and the fist.
    KB = (376, 160, 442, 194)
    sub = box_of(KB)
    L, S = lum(sub), sat(sub)
    ys, xs = np.mgrid[KB[1]:KB[3], KB[0]:KB[2]]
    blade = (L > 150) & (S < 80) & (xs >= 401) & (ys >= 174) & (ys <= 191)
    blade = dilate(blade, (L < 60) & (xs >= 400))
    fist = ellipse(KB, 390.5, 174.5, 7, 6)
    knife = blade | fist
    for k, (dx, dy) in enumerate(((1, 0), (2, 1))):  # a short push stroke along the blade
        frames.append((f"knife{k + 1}", KB, moved(q, KB, knife, [(knife, dx, dy)])))

    # Lower customer (laughing): the head bobs up one px.
    LB = (480, 222, 522, 266)
    head = ellipse(LB, 501, 244, 17, 19.5)
    frames.append(("laugh1", LB, moved(q, LB, head, [(head, 0, -1)])))

    # Upper customer (eating): the chopstick hand lifts, the head dips.
    UB = (570, 142, 622, 190)
    uhead = ellipse(UB, 599, 162, 16, 17) & ~ellipse(UB, 584, 178, 7, 5)
    hand = ellipse(UB, 584.5, 177.5, 6.5, 4.5)
    frames.append(("eat1", UB, moved(q, UB, uhead | hand, [(hand, 0, -1)])))
    frames.append(("eat2", UB, moved(q, UB, uhead | hand, [(hand, 0, -2), (uhead, 0, 1)])))

    # Noren: the lower half of each panel sways one px (panels move independently).
    NB = (268, 44, 342, 86)
    sub = box_of(NB)
    ys, xs = np.mgrid[NB[1]:NB[3], NB[0]:NB[2]]
    cloth = (sub[..., 2].astype(int) > sub[..., 0].astype(int) + 6) & (lum(sub) > 35)
    low = cloth & (ys >= 58)
    lp, rp = low & (xs <= 304), low & (xs >= 305)
    dark = q[88, 300]
    for name, parts in (("norenA", [(lp, -1, 0), (rp, 1, 0)]), ("norenB", [(lp, 1, 0), (rp, -1, 0)])):
        frames.append((name, NB, moved(q, NB, lp | rp, parts, fill=dark)))

    # Lanterns: a brighter and a dimmer copy (the scene cross-fades them for breathing and flicker).
    for i, b in enumerate(((354, 8, 387, 56), (429, 8, 462, 56), (538, 8, 571, 56))):
        sub = box_of(b).astype(np.float32)
        glow = lum(sub) > 150
        br = sub.copy()
        br[glow] = np.minimum(255, br[glow] * 1.12 + 10)
        frames.append((f"lanternHi{i}", b, snap(br, pal)))
        dm = sub.copy()
        dm[glow] = dm[glow] * 0.86
        frames.append((f"lanternLo{i}", b, snap(dm, pal)))

    # Pack into one atlas, 3x NEAREST, a column of frames.
    pad = 2
    wmax = max(b[2] - b[0] for _, b, _ in frames)
    htot = sum(b[3] - b[1] + pad for _, b, _ in frames)
    sheet = np.zeros((htot, wmax, 3), np.uint8)
    atlas = {}
    y = 0
    for name, b, img in frames:
        h_, w_ = img.shape[:2]
        sheet[y:y + h_, :w_] = img
        atlas[name] = [0, y * PX, w_ * PX, h_ * PX, b[0] * PX, b[1] * PX]  # sx, sy, w, h, dest x, dest y
        y += h_ + pad
    Image.fromarray(sheet).resize((wmax * PX, htot * PX), Image.NEAREST).save(OUT_SPR, optimize=True)
    return atlas


def main():
    src = Image.open(SRC).convert("RGB")
    a = np.asarray(src.resize((W, H), Image.LANCZOS)).astype(np.float32)
    xs = np.arange(W)[None, :]
    a *= left_ramp(xs)[..., None] if a.ndim == 3 else 1

    # Palette: median cut of the (darkened) picture plus fixed key colours.
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    pal_img = img.quantize(colors=N_COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(pal_img.getpalette()[: N_COLOURS * 3], dtype=np.float32).reshape(-1, 3)
    fixed = [hexrgb(c) for _, _, c in BANDS]
    pal = np.vstack([pal, np.array(fixed, dtype=np.float32)])
    flat = a.reshape(-1, 3)
    # Nearest palette colour (perceptual-ish weights).
    wts = np.array([0.30, 0.59, 0.11], dtype=np.float32) * 3
    idx = np.empty(len(flat), dtype=np.int32)
    for i in range(0, len(flat), 20000):
        d = (((flat[i:i + 20000, None, :] - pal[None]) ** 2) * wts).sum(-1)
        idx[i:i + 20000] = d.argmin(1)
    q = pal[idx].reshape(H, W, 3)

    # ---- Trough, repainted cell by cell on the native grid.
    # Each row: band edges are whole native px from the row's rounded centre, so every band keeps
    # a constant width along the diagonal and the stairs stay parallel (clean pixel-art lines).
    band_cols = [(r0, r1, np.array(hexrgb(c), dtype=np.float32)) for r0, r1, c in BANDS]
    edges = [BAND_MIN] + [b[1] for b in BANDS]
    for j in range(H):
        y = j * PX + 1.5
        if y < SILL - 60:
            continue
        c, h = cx(y), hw(y)
        ci = round((c - 1.5) / PX)
        k = h / REF / PX  # native px per REF unit on this row
        e = [ci + round(r * k) for r in edges]
        es = ci + round(SHADOW[1] * k)
        if y < 420:
            # Near the opening the Gemini rail bends away from the fitted line: extend what lies
            # beyond the far outline over its leftovers.
            f0 = ci + round(-164 * k)
            for i in range(max(0, f0 + 1), e[0]):
                q[j, i] = q[j, f0]
        for i in range(max(0, e[0]), min(W, es)):
            x = i * PX + 1.5
            if y < SILL and x > OPEN_X1:
                continue
            if i >= e[-1]:
                if y >= SILL:
                    q[j, i] = q[j, i] * 0.62
                continue
            b = max(n for n in range(len(BANDS)) if e[n] <= i)
            dk = 1.0
            if y < SILL:  # inside the dark opening
                dk = 0.42 if y > SILL - 24 else 0.2
            q[j, i] = band_cols[b][2] * dk
    # Re-snap anything we darkened to the palette.
    flat = q.reshape(-1, 3)
    for i in range(0, len(flat), 20000):
        d = (((flat[i:i + 20000, None, :] - pal[None]) ** 2) * wts).sum(-1)
        flat[i:i + 20000] = pal[d.argmin(1)]
    q = flat.reshape(H, W, 3)

    # ---- Eyes: glowing glass (the median cut drops the few cyan pixels).
    for (x, y, w, h) in EYES:
        q[y:y + h, x:x + w] = hexrgb(EYE)
        q[y + 1:y + h - 1, x + 1:x + w - 1] = hexrgb(EYE_HI)

    native = Image.fromarray(np.clip(q, 0, 255).astype(np.uint8))
    native.save("/tmp/bar-native.png")  # debugging aid
    atlas = build_sprites(q.astype(np.uint8), pal)
    os.makedirs(os.path.dirname(OUT_ART), exist_ok=True)
    native.resize((W * PX, H * PX), Image.NEAREST).save(OUT_ART, optimize=True)
    print("colours:", len(native.getcolors(1 << 16)))

    data = {
        "px": PX,
        "belt": {"c": [C0, C1], "hw": [H0, H1], "ref": REF, "sill": SILL, "openX1": OPEN_X1},
        "bands": BANDS,
        "shadow": SHADOW,
        "eyes": [[x * PX, y * PX, w * PX, h * PX] for (x, y, w, h) in EYES],
        "lid": [int(v) for v in q[95, 403]],
        "sprites": atlas,
    }
    json.dump(data, open(OUT_JSON, "w"), separators=(",", ":"))


if __name__ == "__main__":
    main()
