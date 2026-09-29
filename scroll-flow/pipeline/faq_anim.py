#!/usr/bin/env python3
"""FAQ scene loop built from the still: the five tiny sushi on the front board sit in place
and each does its own small idle (sway, stretch, wiggle, lean, breathe) via base-anchored
warps; Jiro blinks twice; lanterns flicker. Perfect loop by construction (all motions are
periodic over the clip length).  usage: faq_anim.py STILL OUT W H"""
import math, subprocess, sys, os
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__)); from loop_big import FF
still, out, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
src = np.array(Image.open(still).convert('RGB').resize((W, H), Image.LANCZOS))
S = W / 2752  # measurements below are on the 2752x1536 still
N = 192       # 8 s at 24 fps
cen = np.array([(1426, 1250), (1551, 1215), (1661, 1170), (1746, 1130), (1871, 1120)], float) * S
dirv = np.array([445., -130.]); u = dirv / np.linalg.norm(dirv); nrm = np.array([-u[1], u[0]])  # nrm: "up" off the row (screen)
if nrm[1] > 0: nrm = -nrm
Hc = 150 * S                         # character height
# per-pixel coordinates in the character band
x0, x1 = int(1300 * S), int(2000 * S); y0, y1 = int(1030 * S), int(1330 * S)
yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
base_y = {}
def weights(i):
    c = cen[i]; rel = np.stack([xx - c[0], yy - c[1]], -1)
    t = rel @ u                     # along the row
    h = -(yy - (c[1] + 18 * S))     # height above the character's seat (screen up)
    half = 62 * S
    wt = np.clip(1 - np.abs(t) / half, 0, 1) ** 0.6 * np.clip(h / Hc, 0, 1) * (h < Hc * 1.3)
    return wt.astype(np.float32), np.clip(h, 0, None).astype(np.float32)
W8 = [weights(i) for i in range(5)]
tau = 2 * math.pi
def motion(i, f):
    ph = f / N
    if i == 0:  return 2.2 * math.sin(tau * ph * 2), 0.0                                     # tuna: slow sway
    if i == 1:  s = max(0, math.sin(tau * ph)) ** 3; return 0.0, -9.0 * s                    # salmon: big stretch up once
    if i == 2:  return 1.6 * math.sin(tau * ph * 6) * (0.5 + 0.5 * math.sin(tau * ph)), 0.0  # tamago: little wiggle bursts
    if i == 3:  return 3.0 * math.sin(tau * ph + 1.3), -1.2 * (1 - math.cos(tau * ph * 2)) / 2   # ikura: lean and settle
    return 0.0, -2.5 * (1 - math.cos(tau * ph * 3)) / 2                                       # ebi: breathing bob
# Jiro's eyes: find the glowing cyan blobs in his head
hx0, hx1, hy0, hy1 = int(200 * 1.72 * S), int(700 * 1.72 * S), int(120 * 1.72 * S), int(420 * 1.72 * S)
Rh = src[hy0:hy1, hx0:hx1].astype(int)
cy = (Rh[..., 2] > 170) & (Rh[..., 2] > Rh[..., 0] + 70) & (Rh[..., 1] > 140)
ys, xs = np.nonzero(cy)
eyes = None
if len(xs):
    # split into separate eyes by gaps between cyan columns
    cols = np.unique(xs); runs = [[cols[0], cols[0]]]
    for c in cols[1:]:
        if c - runs[-1][1] > 4: runs.append([c, c])
        else: runs[-1][1] = c
    eyes = []
    for a_, b_ in runs:
        sel = (xs >= a_) & (xs <= b_)
        if sel.sum() > 30: eyes.append((hy0 + ys[sel].min(), hy0 + ys[sel].max(), hx0 + a_, hx0 + b_))
lids = []
if eyes:
    for (a, b, c, d) in eyes:
        lid = src[max(0, a - 6):a - 2, c:d + 1].mean((0, 1)) if a > 8 else np.array([220, 205, 180])
        lids.append(lid)
blink = {int(N * 0.23), int(N * 0.23) + 1, int(N * 0.23) + 2, int(N * 0.71), int(N * 0.71) + 1}
enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out], stdin=subprocess.PIPE)
for f in range(N):
    fr = src.copy()
    dx = np.zeros_like(xx); dy = np.zeros_like(yy)
    for i in range(5):
        wt, h = W8[i]; mx_, my_ = motion(i, f)
        dx += wt * mx_ * S * 1.4; dy += wt * my_ * S * 1.4
    sx = np.clip(np.round(xx - dx).astype(int), 0, W - 1); sy = np.clip(np.round(yy - dy).astype(int), 0, H - 1)
    fr[y0:y1, x0:x1] = src[sy, sx]
    if eyes and f in blink:
        for (a, b, c, d), lid in zip(eyes, lids):
            fr[a:b + 1, c:d + 1] = lid.astype(np.uint8)
            fr[(a + b) // 2:(a + b) // 2 + max(1, int(2 * S)), c:d + 1] = (30, 22, 18)
    # lanterns breathe a little
    g = 1 + 0.035 * math.sin(tau * f / N * 5) + 0.02 * math.sin(tau * f / N * 13)
    top = fr[: int(H * 0.16)].astype(np.float32)
    bright = top.mean(2, keepdims=True) > 170
    fr[: int(H * 0.16)] = np.where(bright, (top * g).clip(0, 255), top).astype(np.uint8)
    enc.stdin.write(fr.tobytes())
enc.stdin.close(); enc.wait(); print("eyes:", eyes)
