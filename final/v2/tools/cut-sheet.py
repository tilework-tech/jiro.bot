# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Cut a Gemini sprite sheet on flat green into individual fitted sprites.

Usage: uv run tools/cut-sheet.py SHEET OUTDIR --grid 4x4 --names a,b,... --scale K [--groups ...]
Every item in the sheet uses the same scale K (target px per source px) so relative sizes survive.
Cells are trimmed by 4% to drop grid lines; the green key becomes transparency.
"""
import argparse, importlib.util
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("fit", HERE / "fit.py"); fit = importlib.util.module_from_spec(spec); spec.loader.exec_module(fit)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("sheet"); p.add_argument("outdir")
    p.add_argument("--grid", default="4x4"); p.add_argument("--names", required=True)
    p.add_argument("--scale", type=float, required=True); p.add_argument("--groups")
    p.add_argument("--max", type=int, default=0, help="cap the larger side of any sprite")
    a = p.parse_args()
    cols, rows = map(int, a.grid.split("x"))
    names = a.names.split(",")
    im = Image.open(a.sheet).convert("RGB")
    rgb = np.asarray(im).astype(np.int32)
    H, W, _ = rgb.shape
    if a.groups:
        fit.PAL = np.array([c for g in a.groups.split(",") for c in fit.GROUPS[g]], dtype=np.int32)
    out = Path(a.outdir); out.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(names):
        if not name or name == "-":
            continue
        r, c = divmod(i, cols)
        x0, x1 = int(W * c / cols), int(W * (c + 1) / cols)
        y0, y1 = int(H * r / rows), int(H * (r + 1) / rows)
        tx, ty = int((x1 - x0) * 0.04), int((y1 - y0) * 0.04)
        cell = rgb[y0 + ty:y1 - ty, x0 + tx:x1 - tx]
        fg = ~fit.key_mask(cell)
        # ignore near-black grid remnants touching the cell border
        ys, xs = np.where(fg)
        y_lo, y_hi, x_lo, x_hi = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = cell[y_lo:y_hi, x_lo:x_hi]; m = fg[y_lo:y_hi, x_lo:x_hi]
        k = a.scale
        if a.max and max(crop.shape[:2]) * k > a.max:
            k = a.max / max(crop.shape[:2])
        tw, th = max(4, round(crop.shape[1] * k)), max(4, round(crop.shape[0] * k))
        sprite, alpha = fit.vote(crop, m, tw, th)
        sprite = fit.snap(sprite)
        sprite = fit.cleanup(sprite, alpha)
        rgba = np.dstack([sprite, np.where(alpha, 255, 0)]).astype(np.uint8); rgba[~alpha] = 0
        Image.fromarray(rgba, "RGBA").save(out / f"{name}.png")
        print(name, tw, th)

if __name__ == "__main__":
    main()
