#!/usr/bin/env python3
"""Keep pixel art crisp: use the high-res still wherever the clip is static and the
video only where something actually moves (feathered motion mask).

usage: crisp_composite.py CLIP.mp4 STILL.png OUT.mp4 W H [thresh=10]
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from loop_big import frames, FF  # noqa: E402

clip, still, out, W, H = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
thr = float(sys.argv[6]) if len(sys.argv) > 6 else 10

# pass 1: motion magnitude at low res
w, h = 640, 360
f0, mot = None, None
for f in frames(clip, w, h):
    g = f.astype(np.int16)
    if f0 is None:
        f0 = g; mot = np.zeros((h, w), np.float32); continue
    mot += (np.abs(g - f0).max(axis=2) > thr)
    n = globals().get("n", 0) + 1; globals()["n"] = n
frac = mot / max(1, globals().get("n", 1))
m = Image.fromarray(((frac > 0.12) * 255).astype(np.uint8))
# drop thin shimmering edges, then grow real motion regions and feather them
m = m.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(6))
m = np.array(m.resize((W, H), Image.BILINEAR)).astype(np.float32)[..., None] / 255
print("moving area:", round(float((m > 0.5).mean()) * 100, 1), "%")

# still, colour-matched to the video in static areas
st = np.array(Image.open(still).convert("RGB").resize((W, H), Image.LANCZOS)).astype(np.float32)
v0 = next(frames(clip, W, H)).astype(np.float32)
stat = (m[..., 0] < 0.05)
gain = v0[stat].mean(0) / np.maximum(st[stat].mean(0), 1)
st = (st * gain).clip(0, 255)
print("colour gain:", gain.round(3))
Image.fromarray((m[..., 0] * 255).astype(np.uint8)).save(out + ".mask.png")

enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
inv = 1 - m
for f in frames(clip, W, H):
    enc.stdin.write((st * inv + f.astype(np.float32) * m).astype(np.uint8).tobytes())
enc.stdin.close(); enc.wait()
