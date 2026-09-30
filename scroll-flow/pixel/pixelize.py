#!/usr/bin/env python3
"""True pixel art: force an image onto the native grid (960x540 at 2x; PX_W/PX_H/PX_S) and the shared palette.

  pixelize.py palette OUT.json IMG...        build the shared palette from several images
  pixelize.py still PALETTE.json IN OUT      IN -> OUT-native.png (480x270) + OUT.png (1920x1080, 4x nearest)

Each native pixel is the MODE of the palette colours inside its 4x4 source block (at 1920x1080), so
edges stay hard instead of averaging into in-between colours. A cleanup pass then removes isolated
single pixels. The palette comes from k-means in Lab space, weighted toward vivid colours so small
accents (eyes, lanterns, sushi) survive, plus fixed anchors. The darkest colour is never pure black.
"""
import json, sys
import numpy as np
from PIL import Image

import os
# native art size and upscale: 960x540 at 2x (was 480x270 at 4x until the client asked for finer pixels)
W, H, S = int(os.environ.get("PX_W", 960)), int(os.environ.get("PX_H", 540)), int(os.environ.get("PX_S", 2))
K = W / 480  # scale for coordinates written in the original 480x270 space
FLOOR = np.array([22, 16, 26])  # darkest allowed tone: very dark indigo-brown
ANCHORS = [  # colours that must exist in the palette (style rules + canon Jiro)
    (95, 212, 255), (200, 244, 255),          # Jiro's eye glow + core
    (246, 236, 220), (255, 250, 238),         # cream / hachimaki white
    (255, 190, 92), (255, 226, 150),          # lantern amber + hot core
    (224, 137, 76), (184, 98, 47), (122, 62, 34),  # copper light / mid / dark
    (39, 50, 92), (26, 30, 58),               # indigo happi / deep indigo
    (230, 70, 60), (250, 140, 90),            # tuna red / salmon
    FLOOR.tolist(),
]


def srgb_to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def load(path, size=(W * S, H * S)):
    return np.asarray(Image.open(path).convert("RGB").resize(size, Image.BOX)).astype(np.float64)


def build_palette(out, imgs, k=44, seed=3):
    rng = np.random.default_rng(seed)
    px = np.concatenate([load(p, (W, H)).reshape(-1, 3) for p in imgs])
    hsv_s = (px.max(1) - px.min(1)) / (px.max(1) + 1e-6)
    wgt = 1 + 5 * hsv_s * (px.max(1) / 255) ** 1.5  # boost vivid, bright pixels
    lab = srgb_to_lab(px)
    cent = lab[rng.choice(len(lab), k, replace=False, p=wgt / wgt.sum())]
    for _ in range(30):
        d = ((lab[:, None, :] - cent[None]) ** 2).sum(-1)
        a = d.argmin(1)
        for j in range(k):
            m = a == j
            if m.any(): cent[j] = (lab[m] * wgt[m, None]).sum(0) / wgt[m].sum()
    # centroid -> the actual weighted-mean RGB of its members (keeps colours real)
    d = ((lab[:, None, :] - cent[None]) ** 2).sum(-1); a = d.argmin(1)
    pal = [tuple(int(v) for v in (px[a == j] * wgt[a == j, None]).sum(0) / wgt[a == j].sum()) for j in range(k) if (a == j).any()]
    for an in ANCHORS:
        la = srgb_to_lab(np.array(an, float))
        if min(((srgb_to_lab(np.array(p, float)) - la) ** 2).sum() for p in pal) > 60: pal.append(tuple(an))
    pal = [tuple(int(v) for v in np.maximum(p, FLOOR)) if sum(p) < FLOOR.sum() else p for p in pal]
    pal = sorted(set(pal), key=lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2])
    json.dump({"colors": [list(c) for c in pal]}, open(out, "w"))
    print(len(pal), "colours ->", out)


def to_indices(rgb, pal_lab):
    lab = srgb_to_lab(rgb.reshape(-1, 3))
    out = np.empty(len(lab), np.int32)
    for i in range(0, len(lab), 200000):
        out[i:i + 200000] = ((lab[i:i + 200000, None, :] - pal_lab[None]) ** 2).sum(-1).argmin(1)
    return out.reshape(rgb.shape[:2])


def block_mode(idx, n):
    h, w = idx.shape[0] // S, idx.shape[1] // S
    b = idx[: h * S, : w * S].reshape(h, S, w, S).transpose(0, 2, 1, 3).reshape(h, w, S * S)
    counts = np.zeros((h, w, n), np.int32)
    for i in range(S * S): np.add.at(counts, (np.arange(h)[:, None], np.arange(w)[None, :], b[..., i]), 1)
    return counts.argmax(-1)


def clean(nat, passes=1):
    """Replace a pixel that differs from all 8 neighbours when 6+ of them agree on one colour."""
    for _ in range(passes):
        p = np.pad(nat, 1, mode="edge")
        nb = np.stack([p[1 + dy: 1 + dy + nat.shape[0], 1 + dx: 1 + dx + nat.shape[1]] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx], -1)
        lonely = (nb != nat[..., None]).all(-1)
        flat = nb.reshape(-1, 8)
        maj = np.array([np.bincount(r).argmax() for r in flat]).reshape(nat.shape)
        cnt = (nb == maj[..., None]).sum(-1)
        nat = np.where(lonely & (cnt >= 6), maj, nat)
    return nat


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32


def dither_smooth(nat, mean_lab, pal_lab, max_de=16.0, t_min=0.32):
    """Sparse 4x4 ordered dithering, only in smooth areas (glows, light falloff), and only between
    two neighbouring palette colours. Everywhere else the flat block colour stays."""
    h, w, _ = mean_lab.shape
    p = np.pad(mean_lab, ((1, 1), (1, 1), (0, 0)), mode="edge")
    nb = np.stack([p[1 + dy: 1 + dy + h, 1 + dx: 1 + dx + w] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)
    smooth = np.sqrt(((nb - mean_lab[None]) ** 2).sum(-1)).max(0) < 6.0     # gentle gradient, no edge
    d = ((mean_lab[..., None, :] - pal_lab[None, None]) ** 2).sum(-1)
    order = d.argsort(-1)
    c1, c2 = order[..., 0], order[..., 1]
    d1, d2 = np.sqrt(np.take_along_axis(d, c1[..., None], -1)[..., 0]), np.sqrt(np.take_along_axis(d, c2[..., None], -1)[..., 0])
    t = d1 / (d1 + d2 + 1e-9)
    close = np.sqrt(((pal_lab[c1] - pal_lab[c2]) ** 2).sum(-1)) < max_de
    thr = BAYER[np.arange(h)[:, None] % 4, np.arange(w)[None, :] % 4]
    use2 = smooth & close & (t > t_min) & (thr < t)
    out = np.where(smooth & close, c1, nat)
    return np.where(use2, c2, out)


def block_mean_lab(rgb):
    h, w = rgb.shape[0] // S, rgb.shape[1] // S
    m = rgb[: h * S, : w * S].reshape(h, S, w, S, 3).mean((1, 3))
    return srgb_to_lab(m)


def pixelize(pal_path, src, out_base, cleanup=True, dither=True):
    pal = np.array(json.load(open(pal_path))["colors"], float)
    pal_lab = srgb_to_lab(pal)
    rgb = load(src)
    idx = to_indices(rgb, pal_lab)
    nat = block_mode(idx, len(pal))
    if cleanup: nat = clean(nat)
    if dither: nat = dither_smooth(nat, block_mean_lab(rgb), pal_lab)
    rgb = pal[nat].astype(np.uint8)
    Image.fromarray(rgb).save(out_base + "-native.png")
    Image.fromarray(rgb).resize((W * S, H * S), Image.NEAREST).save(out_base + ".png")  # 1920x1080
    used = len(np.unique(nat))
    print(out_base, "colours used:", used)
    return nat


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "palette": build_palette(sys.argv[2], sys.argv[3:])
    elif cmd == "still": pixelize(sys.argv[2], sys.argv[3], sys.argv[4])
