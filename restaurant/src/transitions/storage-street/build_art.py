"""Build public/art/tr/storage-street/band.png (the loft-floor-to-night-sky band, 1920x873).

Sources:
  src/transitions/storage-street/band_v1.png  the previous band (a Gemini outpaint, 3 px grid, 160 colours):
                                              only its rows 0..SOFFIT (spare storage floor, the cut floor,
                                              the crawl space and the loft's soffit beam) are kept.
  public/art/street/sky.png, front.png         the street's STATIC top (built by src/scenes/street/build_art.py).

Below the soffit the band is open night sky: the street's own sky colour continued upward (plus a few
faint stars and cloud streaks), with the belt's steel column (same rivet plates, same phase) running
from the soffit down into the street's column. Rows JOIN..873 are a pixel copy of the street's top
rows, so the feathered join at world OY shows identical pixels on both sides. The street's scrolling
layers start well below its top edge (far skyline at y >= 138), so nothing that moves meets the join.
usage: python build_art.py   (from anywhere)
"""
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
W, H, JOIN, SOFFIT = 1920, 873, 796, 327
PX = 3


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def main():
    old = np.asarray(Image.open(os.path.join(HERE, "band_v1.png")).convert("RGB")).astype(np.float32)
    sky = np.asarray(Image.open(os.path.join(ROOT, "public/art/street/sky.png")).convert("RGB")).astype(np.float32)
    front = np.asarray(Image.open(os.path.join(ROOT, "public/art/street/front.png")).convert("RGBA")).astype(np.float32)
    out = np.zeros((H, W, 3), np.float32)
    out[:SOFFIT] = old[:SOFFIT]
    # Open sky: the street sky's top colour, continued up to the soffit.
    ys, xs = np.mgrid[SOFFIT:JOIN, 0:W]
    vals, cnt = np.unique(sky[0].reshape(-1, 3), axis=0, return_counts=True)
    out[SOFFIT:JOIN] = vals[cnt.argmax()]  # the sky's top colour (row 0 also carries a star or two)
    n = ((xs // PX) * 928371 + (ys // PX) * 12345) % 9973
    star = (n < 6) & ((xs // PX) % 7 == 3)
    out[SOFFIT:JOIN][star] = hexrgb("#6f6d98")
    for (x0, x1, y) in ((300, 720, 520), (1060, 1500, 610), (1350, 1800, 450), (600, 900, 700)):
        out[y:y + PX, x0:x1] = hexrgb("#15142a")
        out[y + PX:y + 2 * PX, x0 + 24:x1 - 24] = hexrgb("#121126")
    # Under the soffit a dark lip (the beam's shadow edge) so the sky starts cleanly.
    out[SOFFIT:SOFFIT + PX] = hexrgb("#0b0a10")
    # The street's top rows (sky + static column), pixel for pixel.
    top = sky[0:H - JOIN].copy()
    f = front[0:H - JOIN]
    a = f[..., 3:4] / 255
    out[JOIN:] = top * (1 - a) + f[..., :3] * a
    # Steel column from the soffit down to the join, same pattern/phase as front.png (street y = r - JOIN).
    c0, c1 = 34 * PX, 67 * PX
    for r in range(SOFFIT + PX, JOIN):
        yn = (r - JOIN) // PX  # native street row (negative above the street)
        row = out[r]
        row[c0:c1] = hexrgb("#1a1822")
        row[c0:c0 + PX] = hexrgb("#0b0a10")
        row[c1 - PX:c1] = hexrgb("#0b0a10")
        row[c0 + PX:c0 + 2 * PX] = hexrgb("#4a4660")
        row[c1 - 2 * PX:c1 - PX] = hexrgb("#5e5a78")
        row[c1 - 3 * PX:c1 - 2 * PX] = hexrgb("#35324a")
        k = (yn - 12) % 30
        if k < 5:
            row[c0 + PX:c1 - PX] = hexrgb("#24212f")
            if k == 0:
                row[c0 + PX:c1 - PX] = hexrgb("#3c3850")
            if k == 2:
                row[c0 + 3 * PX:c0 + 4 * PX] = hexrgb("#8a5a3a")
                row[c1 - 4 * PX:c1 - 3 * PX] = hexrgb("#8a5a3a")
    # Column head: a bracket bolted to the soffit.
    out[SOFFIT:SOFFIT + 4 * PX, c0 - 4 * PX:c1 + 4 * PX] = hexrgb("#24212f")
    out[SOFFIT + 3 * PX:SOFFIT + 4 * PX, c0 - 4 * PX:c1 + 4 * PX] = hexrgb("#12111a")
    out[SOFFIT:SOFFIT + PX, c0 - 4 * PX:c1 + 4 * PX] = hexrgb("#4a4660")
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(
        os.path.join(ROOT, "public/art/tr/storage-street/band.png"), optimize=True)
    print("wrote band.png")


if __name__ == "__main__":
    main()
