#!/usr/bin/env python3
"""Shrink a scene loop into a pool of light and put the rest of the frame in shadow.
usage: small_scene.py IN.mp4 STILL.png OUT.mp4 W H crop_x0 crop_x1 scale ox oy fg_gain bg_mode
  crop_x0/x1: horizontal fraction of the source to keep; scale: size of the kept part vs frame;
  ox/oy: top-left of the placed scene as fractions; bg_mode: 'wall' (dark stretch of the still's
  right edge) or 'blur' (blurred, darkened still)."""
import subprocess, sys, os
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from loop_big import frames, FF
src, still, out = sys.argv[1:4]; W, H = int(sys.argv[4]), int(sys.argv[5])
cx0, cx1, sc, ox, oy, gain = map(float, sys.argv[6:12]); mode = sys.argv[12]
st = Image.open(still).convert('RGB'); sw, sh = st.size
if mode == 'wall':
    bg = st.crop((int(sw * 0.66), 0, sw, sh)).resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
    bg = np.array(bg).astype(np.float32) * 0.32
else:
    bg = np.array(st.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(28))).astype(np.float32) * 0.14
cw = int(W * (cx1 - cx0)); fw, fh = int(cw * sc), int(H * sc); X, Y = int(W * ox), int(H * oy)
yy, xx = np.mgrid[0:fh, 0:fw]
m = (np.clip(np.minimum(xx / 70, (fw - xx) / 70), 0, 1) * np.clip(np.minimum(yy / 70, (fh - yy) / 70), 0, 1))[..., None].astype(np.float32)
x0c = int(W * cx0)
enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out], stdin=subprocess.PIPE)
for f in frames(src, W, H):
    fg = np.array(Image.fromarray(f[:, x0c:x0c + cw]).resize((fw, fh), Image.LANCZOS)).astype(np.float32) * gain
    o = bg.copy(); x1, y1 = min(W, X + fw), min(H, Y + fh)
    reg = o[Y:y1, X:x1]; mm = m[:y1 - Y, :x1 - X]
    o[Y:y1, X:x1] = reg * (1 - mm) + fg[:y1 - Y, :x1 - X] * mm
    enc.stdin.write(o.clip(0, 255).astype(np.uint8).tobytes())
enc.stdin.close(); enc.wait()
