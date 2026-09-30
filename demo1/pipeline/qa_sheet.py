#!/usr/bin/env python3
"""Contact sheet of 6 evenly spaced frames per clip. usage: qa_sheet.py OUT.jpg clip1.mp4 [clip2 ...]"""
import sys, numpy as np
from PIL import Image
sys.path.insert(0, __import__("os").path.dirname(__file__))
import loop

out, *clips = sys.argv[1:]
W, H, N = 480, 270, 6
sheet = Image.new("RGB", (W * N, H * len(clips)))
for r, c in enumerate(clips):
    f = loop.read(c)
    for k in range(N):
        i = int(k * (len(f) - 1) / (N - 1))
        sheet.paste(Image.fromarray(f[i]).resize((W, H)), (k * W, r * H))
sheet.save(out, quality=82)
