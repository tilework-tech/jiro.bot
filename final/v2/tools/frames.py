# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Build animation frames for a prop by editing a crop of the scene master with Gemini.

Usage: uv run tools/frames.py SPEC.json SPRITE_ID [--regen]

SPEC (per scene):
{
  "master": "art/gen/hero/hero-b-edit1.jpg",      # the 2K Gemini render the scene base was fitted from
  "base": "art/work/hero/base.png",               # the fitted, LibreSprite-indexed world base (W x H)
  "groups": "warm,accents,neutrals,plates",
  "sprites": { "<id>": { "crop": [x,y,w,h], "roi": [x,y,w,h], "grain": 1,
                         "frames": ["<edit prompt>", ...], "keep": [0, 1, 0, 2] } }
}
crop/roi are world units (360 across); "grain" is art px per world unit (rooms 2, detail 4). Frame 0 is always the untouched base. Each edit prompt yields one candidate; it is
refitted to the grid, aligned (±2 px) on pixels outside the roi, and only changes inside the roi survive.
"keep" orders frames into the loop. Output: art/work/<scene>/sprites/<id>.png (horizontal strip of roi frames).
"""
import json, subprocess, sys, importlib.util
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
spec_ = importlib.util.spec_from_file_location("fit", HERE / "fit.py"); fit = importlib.util.module_from_spec(spec_); spec_.loader.exec_module(fit)

ASPECTS = {"1:1": 1, "4:3": 4 / 3, "3:4": 3 / 4, "16:9": 16 / 9, "9:16": 9 / 16, "3:2": 1.5, "2:3": 2 / 3}

GAIN = 1.0
WORLD_W = 360

def fit_crop(img: Image.Image, w: int, h: int, groups: str | None) -> np.ndarray:
    rgb = np.asarray(img.convert("RGB")).astype(np.int32)
    out, oa = fit.vote(rgb, np.ones(rgb.shape[:2], bool), w, h)
    out = np.clip(out * GAIN, 0, 255).astype(np.int32)
    if groups:
        fit.PAL = np.array([c for g in groups.split(",") for c in fit.GROUPS[g]], dtype=np.int32)
    return fit.snap(out)

def significant(a, b, t=55.0):
    """Perceptual (redmean) colour distance above t: a real change, not a palette-neighbour flicker."""
    r = (a[..., 0] + b[..., 0]) / 2
    d = a - b
    dist = np.sqrt((2 + r / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - r) / 256) * d[..., 2] ** 2)
    return dist > t

def keep_blobs(mask, min_size):
    """Keep 8-connected components of at least min_size pixels, then close 1-px holes inside them."""
    H, W = mask.shape
    seen = np.zeros_like(mask)
    out = np.zeros_like(mask)
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not seen[y, x]:
                stack, comp = [(y, x)], []
                seen[y, x] = True
                while stack:
                    cy, cx = stack.pop(); comp.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True; stack.append((ny, nx))
                if len(comp) >= min_size:
                    for cy, cx in comp: out[cy, cx] = True
    pad = np.pad(out, 1)
    nb = sum(np.roll(np.roll(pad, a, 0), b, 1) for a in (-1, 0, 1) for b in (-1, 0, 1) if a or b)[1:-1, 1:-1]
    return out | (nb >= 6)

def main():
    spec_path, sid = Path(sys.argv[1]), sys.argv[2]
    regen = "--regen" in sys.argv
    spec = json.loads(spec_path.read_text())
    global GAIN
    GAIN = spec.get("gain", 1.0)
    fit.COOL_GATE = spec.get("cool_gate")
    s = spec["sprites"][sid]
    master = Image.open(ROOT / spec["master"])
    base = np.asarray(Image.open(ROOT / spec["base"]).convert("RGB")).astype(np.int32)
    H, W, _ = base.shape
    bg = W // WORLD_W  # art px per world unit in the base
    g = s.get("grain", bg)
    sx, sy = master.width / WORLD_W, master.height / (H / bg)
    cx, cy, cw, ch = s["crop"]
    rx, ry, rw, rh = s["roi"]
    src = master.crop((round(cx * sx), round(cy * sy), round((cx + cw) * sx), round((cy + ch) * sy)))
    work = ROOT / "art/work" / spec_path.stem / "frames" / sid
    work.mkdir(parents=True, exist_ok=True)
    src_path = work / "src.png"; src.save(src_path)
    ratio = cw / ch
    aspect = min(ASPECTS, key=lambda k: abs(np.log(ASPECTS[k] / ratio)))
    base_crop = fit_crop(src, cw * g, ch * g, spec.get("groups"))
    if g == bg:
        base_crop = base[cy * bg:(cy + ch) * bg, cx * bg:(cx + cw) * bg]
    ref_side = 2048 if g >= 4 else 1024
    ref_crop = fit_crop(src.resize((ref_side, round(ref_side * src.height / src.width)), Image.LANCZOS).resize(src.size, Image.LANCZOS),
                        cw * g, ch * g, spec.get("groups"))
    frames = [base_crop]
    for k, prompt in enumerate(s["frames"], start=1):
        out = work / f"edit{k}.png"
        if regen or not (out.exists() or out.with_suffix(".jpg").exists()):
            full = ("Edit this 16-bit pixel-art image. Keep the exact same framing, camera, size, pixel grid, palette and "
                    "every pixel identical except for this one small change: " + prompt +
                    " Crisp square pixels, no anti-aliasing, no new objects, no text.")
            subprocess.run(["node", str(HERE / "gen.mjs"), str(out), "--model", s.get("model", "gemini-3.1-flash-image"),
                            "--aspect", aspect, "--size", "2K" if g >= 4 else "1K", "--prompt", full, str(src_path)], check=True)
        got = out if out.exists() else out.with_suffix(".jpg")
        ed = Image.open(got).convert("RGB").resize(src.size, Image.LANCZOS)
        cand = fit_crop(ed, cw * g, ch * g, spec.get("groups"))
        # align on pixels outside the roi
        roi = np.zeros((ch * g, cw * g), bool)
        roi[(ry - cy) * g:(ry - cy + rh) * g, (rx - cx) * g:(rx - cx + rw) * g] = True
        best, bo = None, (0, 0)
        reach = 2 * g if s.get("align", True) else 0
        for dy in range(-reach, reach + 1):
            for dx in range(-reach, reach + 1):
                sh = np.roll(np.roll(cand, dy, 0), dx, 1)
                d = (np.abs(sh - base_crop).sum(2) > 0)[~roi].mean()
                if best is None or d < best: best, bo = d, (dy, dx)
        cand = np.roll(np.roll(cand, bo[0], 0), bo[1], 1)
        ref = np.roll(np.roll(ref_crop, 0, 0), 0, 1)
        froi = roi
        if k - 1 < len(s.get("frame_rois") or []) and s["frame_rois"][k - 1]:
            fx, fy, fw, fh = s["frame_rois"][k - 1]
            froi = np.zeros_like(roi)
            froi[(fy - cy) * g:(fy - cy + fh) * g, (fx - cx) * g:(fx - cx + fw) * g] = True
        changed = (significant(cand, base_crop) if s.get("compare") == "base" else significant(cand, ref) & significant(cand, base_crop)) & froi
        changed = keep_blobs(changed, s.get("min_blob", 10))
        f = base_crop.copy(); f[changed] = cand[changed]
        frames.append(f)
        print(f"{sid} frame {k}: offset {bo}, outside-roi mismatch {best:.3f}, changed {changed.sum()} px")
    alpha = None
    if s.get("mask_prompt"):
        out = work / "mask.png"
        if regen or not (out.exists() or out.with_suffix(".jpg").exists()):
            subprocess.run(["node", str(HERE / "gen.mjs"), str(out), "--model", "gemini-3-pro-image", "--aspect", aspect, "--size", "1K",
                            "--prompt", s["mask_prompt"] + " Keep the subject's pose, size and position exactly; fill everything else with flat pure #00FF00 green.", str(src_path)], check=True)
        got = out if out.exists() else out.with_suffix(".jpg")
        m = Image.open(got).convert("RGB").resize(src.size, Image.LANCZOS)
        rgbm = np.asarray(m).astype(np.int32)
        key = fit.key_mask(rgbm)
        # Gemini sometimes paints the subject green on black instead of green around it: the border tells which.
        border = np.concatenate([key[0], key[-1], key[:, 0], key[:, -1]])
        if border.mean() < 0.5:
            key = ~key
        small = np.asarray(Image.fromarray((~key * 255).astype(np.uint8)).resize((cw * g, ch * g), Image.BOX)) > 127
        pad = np.pad(small, 1)
        alpha = small | (sum(np.roll(np.roll(pad, a, 0), b, 1) for a in (-1, 0, 1) for b in (-1, 0, 1))[1:-1, 1:-1] >= 5)
    rs = slice((ry - cy) * g, (ry - cy + rh) * g), slice((rx - cx) * g, (rx - cx + rw) * g)
    outdir = ROOT / "art/work" / spec_path.stem / "sprites"
    outdir.mkdir(parents=True, exist_ok=True)
    np.save(outdir / f"{sid}-frames.npy", np.stack([f[rs] for f in frames]))
    for name, keep in (("", s.get("keep")), ("-react", s.get("reaction", {}).get("keep"))):
        if not keep or (name and len(keep) < 2):
            continue
        strip = np.concatenate([frames[k][rs] for k in keep], axis=1).astype(np.uint8)
        dst = outdir / f"{sid}{name}-fit.png"
        if alpha is not None:
            a = np.concatenate([alpha[rs]] * len(keep), axis=1)
            Image.fromarray(np.dstack([strip, np.where(a, 255, 0).astype(np.uint8)]), "RGBA").save(dst)
        else:
            Image.fromarray(strip, "RGB").save(dst)
        print(dst, strip.shape)

if __name__ == "__main__":
    main()
