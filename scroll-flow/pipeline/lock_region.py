#!/usr/bin/env python3
"""Freeze a region of a clip to the still (feathered rect). usage: lock_region.py IN OUT STILL x0 y0 x1 y1 (fractions)"""
import sys, subprocess, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, __import__("os").path.dirname(__file__)); import loop
src, out, still = sys.argv[1:4]; x0, y0, x1, y1 = map(float, sys.argv[4:8])
f = loop.read(src); H, W = f.shape[1:3]
st = np.array(Image.open(still).convert("RGB").resize((W, H), Image.LANCZOS)).astype(np.float32)
# use the clip's own first frame (colour-matched to the video) rather than the still
st = f[0].astype(np.float32)
m = Image.new("L", (W, H), 0); m.paste(255, (int(x0*W), int(y0*H), int(x1*W), int(y1*H)))
m = np.array(m.filter(ImageFilter.GaussianBlur(24))).astype(np.float32)[..., None] / 255
o = (f * (1 - m) + st * m).clip(0, 255).astype(np.uint8)
enc = subprocess.Popen([loop.FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
    "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
enc.stdin.write(o.tobytes()); enc.stdin.close(); enc.wait()
