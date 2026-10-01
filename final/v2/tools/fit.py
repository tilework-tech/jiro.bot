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

def snap(rgb):
    flat = rgb.reshape(-1, 3).astype(np.int32)
    r = (flat[:, None, 0] + PAL[None, :, 0]) / 2
    d = flat[:, None, :] - PAL[None, :, :]
    dist = (2 + r / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - r) / 256) * d[..., 2] ** 2
    return PAL[dist.argmin(1)].reshape(rgb.shape)

def key_mask(rgb):
    """Only near-pure #00FF00 background is keyed, so green food (wasabi, edamame, cactus) survives."""
    f = rgb.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    return (g >= 0.7) & (r <= 0.5) & (b <= 0.5) & (g - np.maximum(r, b) >= 0.35)

def vote(img, alpha, W, H):
    h, w, _ = img.shape
    out = np.zeros((H, W, 3), np.int32)
    out_a = np.zeros((H, W), bool)
    ys = np.linspace(0, h, H + 1).astype(int)
    xs = np.linspace(0, w, W + 1).astype(int)
    for j in range(H):
        for i in range(W):
            cell = img[ys[j]:ys[j + 1], xs[i]:xs[i + 1]].reshape(-1, 3)
            a = alpha[ys[j]:ys[j + 1], xs[i]:xs[i + 1]].reshape(-1)
            if a.mean() < 0.5:
                continue
            cell = cell[a]
            b = (cell >> 4)
            codes = b[:, 0] * 256 + b[:, 1] * 16 + b[:, 2]
            vals, counts = np.unique(codes, return_counts=True)
            win = vals[counts.argmax()]
            out[j, i] = cell[codes == win].mean(0)
            out_a[j, i] = True
    return out, out_a

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
    global PAL
    if a.groups:
        PAL = np.array([c for g in a.groups.split(",") for c in GROUPS[g]], dtype=np.int32)
    out = snap(out)
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
