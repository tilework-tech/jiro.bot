#!/usr/bin/env python3
"""Remove pupils from Jiro's glowing eyes: in a head region, find the cyan eye blobs and
paint any dark pixels inside them with the eye's own glow colour.
usage: nopupils.py IN OUT W H x0 y0 x1 y1"""
import os, subprocess, sys
from collections import deque
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from loop_big import frames, FF
src, out, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
x0, y0, x1, y1 = map(int, sys.argv[5:9])
enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out], stdin=subprocess.PIPE)
fixed = 0
for f in frames(src, W, H):
    g = f.copy(); R = g[y0:y1, x0:x1].astype(int)
    cyan = (R[..., 2] > 150) & (R[..., 2] > R[..., 0] + 60) & (R[..., 1] > 110)
    seen = np.zeros_like(cyan); h, w = cyan.shape
    for sy, sx in zip(*np.nonzero(cyan)):
        if seen[sy, sx]: continue
        q = deque([(sy, sx)]); seen[sy, sx] = True; pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = y+dy, x+dx
                if 0 <= ny < h and 0 <= nx < w and cyan[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(pts) < 40: continue
        ys, xs = np.array(pts).T
        by0, by1, bx0, bx1 = ys.min(), ys.max(), xs.min(), xs.max()
        box = R[by0:by1+1, bx0:bx1+1]
        glow = np.median(box[cyan[by0:by1+1, bx0:bx1+1]], axis=0)
        inner = np.zeros(box.shape[:2], bool); inner[1:-1, 1:-1] = True
        dark = (box.sum(2) < 330) & inner
        if dark.any():
            box[dark] = glow; fixed += 1
    g[y0:y1, x0:x1] = R.clip(0, 255).astype(np.uint8)
    enc.stdin.write(g.tobytes())
enc.stdin.close(); enc.wait(); print("patched eye regions:", fixed)
