#!/usr/bin/env python3
"""Animate Jiro's hinged jaw plate by hand (no mouth): the plate drops a few pixels in
chatty bursts and closes again, periodic over the loop so the seam stays invisible.
usage: jaw.py IN.mp4 OUT.mp4 W H x0 y0 x1 y1 (jaw box in 1600x900 grid)"""
import math, os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from loop_big import frames, FF
src, out, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
k = W / 1600
x0, y0, x1, y1 = [int(float(v) * k) for v in sys.argv[5:9]]
fs = list(frames(src, W, H)); L = len(fs)
jaw = fs[0][y0:y1 + 6, x0:x1].copy()
jr, jg, jb = [jaw[..., c].astype(int) for c in range(3)]
copper = (jr > jg + 25) & (jr > jb + 45)          # only the copper jaw plate moves; the cream faceplate stays
from PIL import Image, ImageFilter
cm = Image.fromarray((copper * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
copper = np.array(cm) > 127
copper[: int(float(os.environ.get("JAW_TOP", "0")) * k)] = False   # nothing above the faceplate's lower edge moves
enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out], stdin=subprocess.PIPE)
maxd = max(2, round(7 * k / 1.6))
for i, f in enumerate(fs):
    u = i / L
    burst = lambda a, b: max(0.0, math.sin(math.pi * (u - a) / (b - a))) if a < u < b else 0.0
    talk = burst(0.08, 0.42) + burst(0.58, 0.86) * 0.8
    d = int(round(maxd * talk * abs(math.sin(math.pi * 13 * u))))
    g = f.copy()
    if d > 0:
        reg = g[y0:y1 + 6 + d, x0:x1]
        reg[:y1 + 6 - y0][copper] = (26, 18, 16)                   # dark hinge gap where the plate was
        dst = np.zeros(reg.shape[:2], bool); dst[d:d + copper.shape[0]] = copper
        src_px = jaw[copper]
        reg[dst] = src_px                                          # plate dropped by d px
    enc.stdin.write(g.tobytes())
enc.stdin.close(); enc.wait()
print("frames", L, "max drop", maxd)
