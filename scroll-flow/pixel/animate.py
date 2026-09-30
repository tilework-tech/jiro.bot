#!/usr/bin/env python3
"""Turn a Veo clip of a pixel still into a true-pixel-art seamless loop.

  animate.py SCENE RAW.mp4 OUT.mp4 [--static x0,y0,x1,y1;...] [--fps 12] [--min-motion 0.25]

- Every frame is snapped to the 480x270 grid and the shared palette (mode of each 4x4 block), just
  like the stills, via a 32k-entry RGB->palette lookup table.
- Pixels that change in fewer than --min-motion of the frames are held to the still, so nothing
  shimmers; --static rectangles (native 480x270 coords) are always held (e.g. Jiro's face).
- Moving pixels get a 3-frame temporal majority filter to remove one-frame flicker.
- 24 fps Veo output is sampled down to --fps (sprite-style animation) and the duplicated end frame
  is dropped. Frame 0 is the still itself, so the clip starts and ends on the poster.
- Output: 1920x1080 H.264 (each native pixel is an aligned 4x4 block, so 4:2:0 chroma stays exact)
  plus OUT-native/ PNG frames. Prints the loop seam vs the typical frame step.
"""
import argparse, json, os, subprocess
import numpy as np
from PIL import Image
import imageio_ffmpeg
from pixelize import srgb_to_lab, W, H, S, K

FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = os.path.dirname(os.path.abspath(__file__))


def lut_for(pal):
    g = np.arange(32) * 8 + 4
    rgb = np.stack(np.meshgrid(g, g, g, indexing="ij"), -1).reshape(-1, 3).astype(float)
    d = ((srgb_to_lab(rgb)[:, None, :] - srgb_to_lab(pal)[None]) ** 2).sum(-1)
    return d.argmin(1).astype(np.uint8)


def frames(path):
    p = subprocess.Popen([FF, "-v", "error", "-i", path, "-vf", f"scale={W*S}:{H*S}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * S * H * S * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(H * S, W * S, 3)


def snap(frame, lut, npal):
    q = frame.astype(np.int32) >> 3
    idx = lut[(q[..., 0] << 10) | (q[..., 1] << 5) | q[..., 2]]
    b = idx.reshape(H, S, W, S).transpose(0, 2, 1, 3).reshape(H, W, S * S)
    counts = np.zeros((H, W, npal), np.int16)
    for i in range(S * S):
        np.add.at(counts, (np.arange(H)[:, None], np.arange(W)[None, :], b[..., i]), 1)
    return counts.argmax(-1).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scene"); ap.add_argument("raw"); ap.add_argument("out")
    ap.add_argument("--static", default=""); ap.add_argument("--fps", type=int, default=12)
    ap.add_argument("--min-motion", type=float, default=0.15)
    ap.add_argument("--no-open", action="store_true", help="keep 1 px detail such as rain (skip speckle removal)")
    a = ap.parse_args()
    pal = np.array(json.load(open(os.path.join(HERE, "palette.json")))["colors"], float)
    lut = lut_for(pal)
    still_rgb = np.asarray(Image.open(os.path.join(HERE, "out", f"{a.scene}-native.png")).convert("RGB")).astype(int)
    still = ((still_rgb[..., None, :] - pal[None, None].astype(int)) ** 2).sum(-1).argmin(-1).astype(np.uint8)

    step = max(1, round(24 / a.fps))
    raw = [f for i, f in enumerate(frames(a.raw)) if i % step == 0]
    if len(raw) > 2 and np.abs(raw[-1].astype(int) - raw[0]).mean() < 4: raw = raw[:-1]   # duplicated end frame
    small = lambda f: f.reshape(H, S, W, S, 3).mean((1, 3))
    still_f = still_rgb.astype(float)
    f0 = small(raw[0])
    # 1) colour-correct every frame to the still: affine RGB fit on pixels that barely changed vs Veo frame 0
    corr, labs = [], []
    for f in raw:
        sm = small(f)
        calm = (np.abs(sm - f0).sum(-1) < 18).reshape(-1)
        X = np.c_[sm.reshape(-1, 3)[calm], np.ones(calm.sum())]
        A, *_ = np.linalg.lstsq(X, still_f.reshape(-1, 3)[calm], rcond=None)
        big = np.clip(np.c_[f.reshape(-1, 3), np.ones(f.shape[0] * f.shape[1])] @ A, 0, 255).reshape(f.shape).astype(np.uint8)
        corr.append(big); labs.append(srgb_to_lab(small(big)))
    labs = np.stack(labs)
    # 2) motion = real colour change vs Veo's own first frame (not vs the pixel still)
    de = np.sqrt(((labs - labs[0][None]) ** 2).sum(-1))
    moving = (de > 10).mean(0) >= a.min_motion
    # opening (erode, then dilate) drops isolated speckle, e.g. flickering dither in a glow
    e = np.pad(moving, 1)
    if not a.no_open: moving = np.all([e[1 + dy:1 + dy + H, 1 + dx:1 + dx + W] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)
    e = np.pad(moving, 1)
    if not a.no_open: moving = np.any([e[1 + dy:1 + dy + H, 1 + dx:1 + dx + W] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)
    m = np.pad(moving, 1)
    moving = np.any([m[1 + dy:1 + dy + H, 1 + dx:1 + dx + W] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)
    for r in filter(None, a.static.split(";")):
        x0, y0, x1, y1 = (int(round(v * K)) for v in map(int, r.split(","))); moving[y0:y1, x0:x1] = False  # rects in 480x270 space
    seq = np.stack([snap(f, lut, len(pal)) for f in corr])
    # 3) 3-frame temporal majority (cyclic) on moving pixels; everything else is the still
    prev, nxt = np.roll(seq, 1, 0), np.roll(seq, -1, 0)
    # a moving pixel only departs from the still in frames where it has actually changed
    changed = de > 8
    changed = changed | (np.roll(changed, 1, 0) & np.roll(changed, -1, 0))   # close 1-frame gaps
    seq = np.where(moving[None] & changed, np.where(prev == nxt, prev, seq), still[None])
    # 4) loop end: the frame in the last quarter that is closest to the start
    tail = range(len(seq) * 3 // 4, len(seq))
    end = min(tail, key=lambda i: (seq[i] != still).sum())
    seq = seq[:end]
    seq[0] = still
    # 5) pixel dissolve over the last K frames back into the still (scattered order, no crossfade colours)
    KD = min(8, len(seq) // 4)
    rank = np.random.default_rng(1).random((H, W))
    for j in range(KD):
        i = len(seq) - KD + j
        back = rank < (j + 1) / (KD + 1)
        seq[i] = np.where(back, still, seq[i])
    steps = [(seq[i] != seq[i + 1]).sum() for i in range(len(seq) - 1)]
    seam = (seq[-1] != seq[0]).sum()
    print(f"{a.scene}: {len(seq)} frames @ {a.fps} fps, moving {moving.mean()*100:.1f}% of pixels, "
          f"seam {seam} px vs median step {int(np.median(steps))} px (ratio {seam / max(1, np.median(steps)):.2f})")

    nd = a.out[:-4] + "-native"; os.makedirs(nd, exist_ok=True)
    for old in os.listdir(nd): os.remove(os.path.join(nd, old))
    enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W*S}x{H*S}", "-r", str(a.fps), "-i", "-",
                            "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-profile:v", "high",
                            "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
    for i, f in enumerate(seq):
        rgb = pal[f].astype(np.uint8)
        Image.fromarray(rgb).save(f"{nd}/{i:03d}.png")
        enc.stdin.write(np.repeat(np.repeat(rgb, S, 0), S, 1).tobytes())
    enc.stdin.close(); enc.wait()
    print("wrote", a.out)


if __name__ == "__main__":
    main()
