#!/usr/bin/env python3
"""Hand-animated pixel idles on top of a native frame sequence (or a still), 1 native pixel at a time.

  idle.py SCENE OUT.mp4 [--frames DIR | --n 96] --ops ops.json

ops.json is a list, applied back to front, each reading from the still so nothing drifts:
  {"op": "stretch", "rect": [x0,y0,x1,y1], "pivot": y, "on": [frames], "exclude_from": [x0,y0,x1,y1]}
      rows above `pivot` inside rect move up 1 px (the row at pivot repeats), so the base stays put
  {"op": "lean", ..., "dx": {frame: +1|-1}}   rows above pivot shift sideways 1 px
  {"op": "jaw", "rect": [...], "on": [...]}    rect drops 1 px, opening a 1 px dark gap (no mouth)
  {"op": "blink", "rect": [...], "on": [...]}  bright eye pixels dim to the next darker palette colour
  {"op": "flicker", "rect": [...], "on": [...]} the brightest colours in rect step down one palette shade
`exclude_from` samples colours (e.g. the board) that are never moved, so overlapping neighbours stay put.
"""
import argparse, glob, json, os, subprocess
import numpy as np
from PIL import Image
import imageio_ffmpeg
from pixelize import srgb_to_lab, W, H, S

FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scene"); ap.add_argument("out"); ap.add_argument("--frames"); ap.add_argument("--n", type=int, default=96)
    ap.add_argument("--ops", required=True); ap.add_argument("--fps", type=int, default=12)
    a = ap.parse_args()
    pal = np.array(json.load(open(os.path.join(HERE, "palette.json")))["colors"])
    lum = pal @ [0.3, 0.59, 0.11]
    def idx(rgb): return ((rgb[..., None, :].astype(int) - pal[None, None]) ** 2).sum(-1).argmin(-1)
    still = idx(np.asarray(Image.open(os.path.join(HERE, "out", f"{a.scene}-native.png")).convert("RGB")))
    if a.frames: seq = np.stack([idx(np.asarray(Image.open(f).convert("RGB"))) for f in sorted(glob.glob(a.frames + "/*.png"))])
    else: seq = np.repeat(still[None], a.n, 0)
    n = len(seq)
    ops = json.load(open(a.ops))
    darker = {}
    for i in range(len(pal)):  # nearest palette colour that is darker, same-ish hue
        cand = [j for j in range(len(pal)) if lum[j] < lum[i] - 8]
        darker[i] = min(cand, key=lambda j: ((srgb_to_lab(pal[j].astype(float)) - srgb_to_lab(pal[i].astype(float))) ** 2).sum()) if cand else i
    for o in ops:
        x0, y0, x1, y1 = o["rect"]
        src = still[y0:y1, x0:x1]
        keep = np.ones_like(src, bool)
        if "exclude_from" in o:
            ex0, ey0, ex1, ey1 = o["exclude_from"]
            keep = ~np.isin(src, np.unique(still[ey0:ey1, ex0:ex1]))
        on = {int(k) % n: v for k, v in o.get("dx", {}).items()} if o["op"] == "lean" else {f % n: 1 for f in o.get("on", [])}
        for f, v in on.items():
            fr = seq[f]
            if o["op"] in ("stretch", "lean"):
                p = o["pivot"] - y0
                moved = src.copy(); mk = keep.copy()
                if o["op"] == "stretch":
                    moved[:p] = src[1:p + 1]; mk[:p] = keep[1:p + 1]
                else:
                    mk[:p] = False
                    if v > 0: moved[:p, v:] = src[:p, :-v]; mk[:p, v:] = keep[:p, :-v]
                    else: moved[:p, :v] = src[:p, -v:]; mk[:p, :v] = keep[:p, -v:]
                region = fr[y0:y1, x0:x1]
                # clear the character's old pixels above the pivot, then draw the moved ones
                clear = keep.copy(); clear[p:] = False
                region[clear] = still[y0:y1, x0:x1][clear] if "bg" not in o else o["bg"]
                if "exclude_from" in o:  # uncovered pixels take the board colour just below them
                    below = np.vstack([region[1:], region[-1:]]); region[clear & ~mk] = below[clear & ~mk]
                region[mk] = moved[mk]
            elif o["op"] == "jaw":
                region = fr[y0:y1, x0:x1]
                region[1:] = src[:-1]; region[0] = int(np.argmin(lum))
            elif o["op"] in ("blink", "flicker"):
                region = fr[y0:y1, x0:x1]
                thr = np.percentile(lum[src], 80)
                m = lum[src] >= thr
                region[m] = np.vectorize(darker.get)(src[m])
    nd = a.out[:-4] + "-native"; os.makedirs(nd, exist_ok=True)
    for f in glob.glob(nd + "/*.png"): os.remove(f)
    enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W*S}x{H*S}", "-r", str(a.fps), "-i", "-",
                            "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
    for i, f in enumerate(seq):
        rgb = pal[f].astype(np.uint8)
        Image.fromarray(rgb).save(f"{nd}/{i:03d}.png")
        enc.stdin.write(np.repeat(np.repeat(rgb, S, 0), S, 1).tobytes())
    enc.stdin.close(); enc.wait()
    print(a.scene, n, "frames ->", a.out)


if __name__ == "__main__":
    main()
