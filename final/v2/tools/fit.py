# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Fit a Gemini render onto a true pixel grid before LibreSprite indexes it.

Usage: uv run tools/fit.py IN OUT --width W [--height H] [--key] [--crop x,y,w,h]

1. Optional crop (in source pixels).
2. Optional chroma key: pixels near pure green (HSV hue 120±25°, s,v ≥ .35) become transparent.
3. Per-cell vote: every target pixel takes the dominant colour of its source cell (colours bucketed
   to 4 bits per channel, winner = mean of the winning bucket). This removes JPEG noise and the soft
   anti-aliased edges of Gemini's pseudo-pixels.
4. Palette snap to palette/jiro56.gpl in a perceptual (redmean) metric.
5. Orphan cleanup: a pixel unlike all 8 neighbours, whose neighbours agree on one colour, takes it.
"""
import argparse, colorsys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
def load_palette():
    groups, cur = {}, None
    for l in (HERE / "../palette/jiro56.gpl").read_text().splitlines():
        if l.startswith("# "):
            cur = l[2:].strip().split()[0]
        elif l.strip() and l.split()[0].isdigit():
            groups.setdefault(cur, []).append([int(v) for v in l.split()[:3]])
    return groups

GROUPS = load_palette()
PAL = np.array([c for g in GROUPS.values() for c in g], dtype=np.int32)

COOL_GATE = None

def snap(rgb):
    flat = rgb.reshape(-1, 3).astype(np.int32)
    r = (flat[:, None, 0] + PAL[None, :, 0]) / 2
    d = flat[:, None, :] - PAL[None, :, :]
    dist = (2 + r / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - r) / 256) * d[..., 2] ** 2
    if COOL_GATE is not None:
        cool = np.array([any((c == g).all() for g in GROUPS["cool"]) for c in PAL])
        warmish = (flat[:, 2] - flat[:, 0]) < COOL_GATE
        dist[np.ix_(warmish, cool)] = np.inf
    return PAL[dist.argmin(1)].reshape(rgb.shape)

def key_mask(rgb):
    """Only near-pure #00FF00 background is keyed, so green food (wasabi, edamame, cactus) survives."""
    f = rgb.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    return (g >= 0.7) & (r <= 0.5) & (b <= 0.5) & (g - np.maximum(r, b) >= 0.35)

def vote(img, alpha, W, H):
    h, w, _ = img.shape
    ys = np.minimum(np.searchsorted(np.linspace(0, h, H + 1).astype(int), np.arange(h), side="right") - 1, H - 1)
    xs = np.minimum(np.searchsorted(np.linspace(0, w, W + 1).astype(int), np.arange(w), side="right") - 1, W - 1)
    cell = (ys[:, None] * W + xs[None, :]).reshape(-1)
    rgb = img.reshape(-1, 3).astype(np.int64)
    a = alpha.reshape(-1)
    n = W * H
    cover = np.bincount(cell, weights=a, minlength=n) / np.maximum(np.bincount(cell, minlength=n), 1)
    cell, rgb = cell[a], rgb[a]
    b = rgb >> 4
    key = cell * 4096 + b[:, 0] * 256 + b[:, 1] * 16 + b[:, 2]
    uk, inv, counts = np.unique(key, return_inverse=True, return_counts=True)
    sums = np.stack([np.bincount(inv, weights=rgb[:, c], minlength=len(uk)) for c in range(3)], 1)
    kc = uk // 4096
    order = np.lexsort((-counts, kc))
    first = np.ones(len(order), bool)
    first[1:] = kc[order][1:] != kc[order][:-1]
    win = order[first]
    out = np.zeros((n, 3), np.int32)
    out[kc[win]] = (sums[win] / counts[win][:, None]).astype(np.int32)
    out_a = np.zeros(n, bool)
    out_a[kc[win]] = True
    out_a &= cover >= 0.5
    return out.reshape(H, W, 3), out_a.reshape(H, W)

def smooth_dark(rgb, a, limit, passes=2):
    """3x3 majority filter over dark, low-detail pixels so copy fields stay calm."""
    H, W, _ = rgb.shape
    for _ in range(passes):
        res = rgb.copy()
        luma = rgb @ np.array([0.299, 0.587, 0.114])
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                if not a[y, x] or luma[y, x] > limit:
                    continue
                n = rgb[y - 1:y + 2, x - 1:x + 2].reshape(-1, 3)
                vals, counts = np.unique(n, axis=0, return_counts=True)
                if counts.max() >= 5:
                    res[y, x] = vals[counts.argmax()]
        rgb = res
    return rgb

def cleanup(rgb, a):
    H, W, _ = rgb.shape
    res = rgb.copy()
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if not a[y, x]:
                continue
            c = tuple(rgb[y, x])
            n = [tuple(rgb[y + dy, x + dx]) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and a[y + dy, x + dx]]
            if len(n) == 8 and c not in n:
                vals, counts = np.unique(np.array(n), axis=0, return_counts=True)
                if counts.max() >= 6:
                    res[y, x] = vals[counts.argmax()]
    return res

def main():
    p = argparse.ArgumentParser()
    p.add_argument("inp"); p.add_argument("out")
    p.add_argument("--width", type=int, required=True); p.add_argument("--height", type=int)
    p.add_argument("--key", action="store_true"); p.add_argument("--crop")
    p.add_argument("--no-clean", action="store_true")
    p.add_argument("--groups", help="comma list of palette groups to snap to (warm,cool,accents,plates,neutrals)")
    p.add_argument("--gain", type=float, default=1.0, help="multiply colours before snapping (lifts very dark renders)")
    p.add_argument("--warm-left", type=float, default=0, help="snap the copy field (this fraction of the width from the left) to the warm ramp only")
    p.add_argument("--cool-gate", type=int, help="only let a pixel snap to the cool group when its blue exceeds its red by this much")
    p.add_argument("--smooth-dark", type=int, default=0, help="luma limit for the dark-area majority filter")
    a = p.parse_args()
    im = Image.open(a.inp).convert("RGB")
    if a.crop:
        x, y, w, h = map(int, a.crop.split(","))
        im = im.crop((x, y, x + w, y + h))
    rgb = np.asarray(im).astype(np.int32)
    alpha = ~key_mask(rgb) if a.key else np.ones(rgb.shape[:2], bool)
    H = a.height or round(a.width * im.height / im.width)
    out, oa = vote(rgb, alpha, a.width, H)
    out = np.clip(out * a.gain, 0, 255).astype(np.int32)
    global PAL, COOL_GATE
    COOL_GATE = a.cool_gate
    if a.groups:
        PAL = np.array([c for g in a.groups.split(",") for c in GROUPS[g]], dtype=np.int32)
    full = PAL
    snapped = snap(out)
    if a.warm_left:
        PAL = np.array(GROUPS["warm"], dtype=np.int32)
        cut = round(a.warm_left * out.shape[1])
        snapped[:, :cut] = snap(out[:, :cut])
        PAL = full
    out = snapped
    if not a.no_clean:
        out = cleanup(out, oa)
    if a.smooth_dark:
        out = smooth_dark(out, oa, a.smooth_dark)
    rgba = np.dstack([out, np.where(oa, 255, 0)]).astype(np.uint8)
    rgba[~oa] = 0
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(a.out)
    print(a.out, f"{a.width}x{H}")

if __name__ == "__main__":
    main()
