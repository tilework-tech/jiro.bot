# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Animation frames for a belt item: Gemini edits of its sprite-sheet cell, fitted on one shared box.

Usage: uv run tools/item-frames.py SHEET CELL_INDEX NAME --scale K --max N --prompt "..." [--prompt "..."]
Writes art/work/belt/items/<NAME>.png as a horizontal strip: frame 0 is the original, then one per prompt.
"""
import argparse, importlib.util, subprocess
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent; ROOT = HERE.parent
spec = importlib.util.spec_from_file_location("fit", HERE / "fit.py"); fit = importlib.util.module_from_spec(spec); spec.loader.exec_module(fit)

p = argparse.ArgumentParser()
p.add_argument("sheet"); p.add_argument("cell", type=int); p.add_argument("name")
p.add_argument("--grid", default="4x4"); p.add_argument("--scale", type=float, required=True); p.add_argument("--max", type=int, default=22)
p.add_argument("--prompt", action="append", default=[])
a = p.parse_args()
cols, rows = map(int, a.grid.split("x"))
im = Image.open(a.sheet).convert("RGB"); W, H = im.size
r, c = divmod(a.cell, cols)
x0, x1, y0, y1 = int(W * c / cols), int(W * (c + 1) / cols), int(H * r / rows), int(H * (r + 1) / rows)
tx, ty = int((x1 - x0) * 0.04), int((y1 - y0) * 0.04)
cell = im.crop((x0 + tx, y0 + ty, x1 - tx, y1 - ty))
work = ROOT / "art/work/belt/frames" / a.name; work.mkdir(parents=True, exist_ok=True)
cell.save(work / "cell.png")
cells = [np.asarray(cell).astype(np.int32)]
for k, prompt in enumerate(a.prompt, 1):
    out = work / f"edit{k}.png"
    if not (out.exists() or out.with_suffix(".jpg").exists()):
        subprocess.run(["node", str(HERE / "gen.mjs"), str(out), "--model", "gemini-3-pro-image", "--aspect", "1:1", "--size", "1K", "--prompt",
                        "Edit this sprite on flat #00FF00 green. Keep the same character, drawing style, size, position and colours; "
                        "change only this: " + prompt + " Keep the flat pure #00FF00 background.",
                        str(work / "cell.png")], check=True)
    got = out if out.exists() else out.with_suffix(".jpg")
    cells.append(np.asarray(Image.open(got).convert("RGB").resize(cell.size, Image.LANCZOS)).astype(np.int32))
masks = [~fit.key_mask(x) for x in cells]
union = np.any(masks, axis=0)
ys, xs = np.where(union)
box = (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)
h, w = box[1] - box[0], box[3] - box[2]
k = a.scale if max(h, w) * a.scale <= a.max else a.max / max(h, w)
tw, th = max(4, round(w * k)), max(4, round(h * k))
frames = []
for x, m in zip(cells, masks):
    crop = x[box[0]:box[1], box[2]:box[3]]; mm = m[box[0]:box[1], box[2]:box[3]]
    spr, al = fit.vote(crop, mm, tw, th); spr = fit.snap(spr); spr = fit.cleanup(spr, al)
    rgba = np.dstack([spr, np.where(al, 255, 0)]).astype(np.uint8); rgba[~al] = 0
    frames.append(rgba)
Image.fromarray(np.concatenate(frames, axis=1), "RGBA").save(ROOT / "art/work/belt/items" / f"{a.name}.png")
print(a.name, tw, th, len(frames))
