# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Cut-outs for click reactions that move the drawn object instead of swapping in a second picture.

Usage: uv run tools/motion.py SPEC.json SPRITE_ID [--regen]

For a sprite with `"motion"` and `"subject"` in its spec (run tools/frames.py first so its crop exists):
1. A Gemini green-key silhouette of the subject (reused from frames.py's mask when present) gives a clean alpha.
2. A Gemini edit of the same crop with the subject removed gives the background behind it ("under").
3. Both are fitted at the sprite's grain; the under patch is aligned to frame 0 (±2 grain px, on pixels away from
   the subject) and kept only over the subject's silhouette plus a small margin, so it blends into the room.
Writes art/work/<scene>/sprites/<id>-cut.png (frame 0, subject only) and <id>-under.png (background, masked),
both covering the sprite's whole crop, and <id>-motion.json (the subject's pivot points in world units).
"""
import json, subprocess, sys, importlib.util
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
_s = importlib.util.spec_from_file_location("frames", HERE / "frames.py"); frames = importlib.util.module_from_spec(_s); _s.loader.exec_module(frames)
fit = frames.fit

def gem(out: Path, prompt: str, src: Path, size="1K", model="gemini-3-pro-image", aspect="1:1"):
    subprocess.run(["node", str(HERE / "gen.mjs"), str(out), "--model", model, "--aspect", aspect, "--size", size, "--prompt", prompt, str(src)], check=True)
    return out if out.exists() else out.with_suffix(".jpg")

def dilate(m, r):
    out = m.copy()
    for _ in range(r):
        p = np.pad(out, 1)
        out = p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    return out

def grow_fill(img, hole):
    """Fill `hole` from its edges inwards: each pass gives border pixels the most common colour among filled neighbours."""
    out = img.copy()
    todo = hole.copy()
    H, W = todo.shape
    while todo.any():
        known = ~todo
        p = np.pad(known, 1)
        edge = todo & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
        if not edge.any():
            break
        for y, x in zip(*np.where(edge)):
            nb = [out[yy, xx] for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1), (y - 1, x - 1), (y + 1, x + 1), (y - 1, x + 1), (y + 1, x - 1))
                  if 0 <= yy < H and 0 <= xx < W and known[yy, xx]]
            vals, counts = np.unique(np.array(nb), axis=0, return_counts=True)
            out[y, x] = vals[counts.argmax()]
        todo &= ~edge
    return out

def main():
    spec_path, sid = Path(sys.argv[1]), sys.argv[2]
    regen = "--regen" in sys.argv
    spec = json.loads(spec_path.read_text())
    frames.GAIN = spec.get("gain", 1.0)
    fit.COOL_GATE = spec.get("cool_gate")
    s = spec["sprites"][sid]
    base = np.asarray(Image.open(ROOT / spec["base"]).convert("RGB")).astype(np.int32)
    bg = base.shape[1] // frames.WORLD_W
    g = s.get("grain", bg)
    cx, cy, cw, ch = s["crop"]
    work = ROOT / "art/work" / spec_path.stem / "frames" / sid
    src_path = work / "src.png"
    src = Image.open(src_path)
    ratio = cw / ch
    aspect = min(frames.ASPECTS, key=lambda k: abs(np.log(frames.ASPECTS[k] / ratio)))
    W, H = cw * g, ch * g
    f0 = base[cy * bg:(cy + ch) * bg, cx * bg:(cx + cw) * bg] if g == bg else frames.fit_crop(src, W, H, spec.get("groups"))

    # 1. silhouette (Gemini answers green-around-subject, green-on-black or white-on-black; the border tells which)
    def silhouette(path):
        m = np.asarray(Image.open(path).convert("RGB").resize(src.size, Image.LANCZOS)).astype(np.int32)
        key = fit.key_mask(m)
        if key.mean() < 0.02:  # no green at all: a black-and-white matte
            key = m.mean(2) < 128
        border = np.concatenate([key[0], key[-1], key[:, 0], key[:, -1]])
        if border.mean() < 0.5:
            key = ~key
        return np.asarray(Image.fromarray((~key * 255).astype(np.uint8)).resize((W, H), Image.BOX)) > 127
    mask_file = next((p for p in (work / "mask.png", work / "mask.jpg") if s.get("mask_prompt") and p.exists()), None)
    mask_file = mask_file or next((p for p in (work / "cut-mask.png", work / "cut-mask.jpg") if p.exists() and not regen), None)
    prompt = (f"Isolate the {s['subject']}: keep only the {s['subject']} exactly as it is. Keep its pose, size and position exactly; "
              "fill everything else with flat pure #00FF00 green.")
    if mask_file is None:
        mask_file = gem(work / "cut-mask.png", prompt, src_path, aspect=aspect)
    alpha = silhouette(mask_file)
    if not 0.02 < alpha.mean() < 0.9:
        mask_file = gem(work / "cut-mask.png", "Make a cut-out matte. " + prompt + " The background must be bright green, not the original picture.", src_path, aspect=aspect)
        alpha = silhouette(mask_file)
    if not 0.02 < alpha.mean() < 0.9:
        raise SystemExit(f"{sid}: no usable silhouette from {mask_file}")

    # 2. the background behind it
    clean = next((p for p in (work / "clean.png", work / "clean.jpg") if p.exists()), None)
    if regen or clean is None:
        clean = gem(work / "clean.png", f"Edit this image: remove the {s['subject']} completely. Repaint the area where it was as the natural "
                    "continuation of what is behind it (wall, floor, shelf, counter or water), in exactly the same style, colours and lighting. "
                    "Keep everything else identical. No text.", src_path, size="2K", aspect=aspect)
    ed = Image.open(clean).convert("RGB").resize(src.size, Image.LANCZOS)
    under = frames.fit_crop(ed, W, H, spec.get("groups"))
    away = ~dilate(alpha, 3 * g)
    best, bo = None, (0, 0)
    for dy in range(-2 * g, 2 * g + 1):
        for dx in range(-2 * g, 2 * g + 1):
            sh = np.roll(np.roll(under, dy, 0), dx, 1)
            d = (np.abs(sh - f0).sum(2) > 0)[away].mean()
            if best is None or d < best: best, bo = d, (dy, dx)
    under = np.roll(np.roll(under, bo[0], 0), bo[1], 1)
    cover = dilate(alpha, max(2, g // 2))
    # Use Gemini's background only when it lined up and the subject is really gone; otherwise grow the surrounding
    # room inwards over the silhouette (a scripted fill, palette-snapped like everything else).
    gone = (np.abs(under - f0).sum(2) > 60)[alpha].mean()
    at_edge = max(abs(bo[0]), abs(bo[1])) >= 2 * g - 2
    source = "gemini"
    if s.get("under") == "fill" or at_edge or gone < 0.6 or best > 0.8:
        cover = dilate(alpha, 2 * g)  # grow from real background, past any fringe the silhouette missed
        under, source = grow_fill(f0, cover), "fill"
    out = ROOT / "art/work" / spec_path.stem / "sprites"
    out.mkdir(parents=True, exist_ok=True)
    cut = np.dstack([f0, np.where(alpha, 255, 0)]).astype(np.uint8); cut[~alpha] = 0
    Image.fromarray(cut, "RGBA").save(out / f"{sid}-cut.png")
    und = np.dstack([under, np.where(cover, 255, 0)]).astype(np.uint8); und[~cover] = 0
    Image.fromarray(und, "RGBA").save(out / f"{sid}-under.png")
    ys, xs = np.where(alpha)
    piv = {"bottom": [cx + (xs.min() + xs.max() + 1) / 2 / g, cy + (ys.max() + 1) / g],
           "top": [cx + (xs.min() + xs.max() + 1) / 2 / g, cy + ys.min() / g]}
    (out / f"{sid}-motion.json").write_text(json.dumps(piv))
    print(f"{sid}: background from {source} (offset {bo}, mismatch {best:.3f}, removed {gone:.2f}), subject {alpha.mean():.2f} of crop")

if __name__ == "__main__":
    main()
