#!/usr/bin/env python3
"""Turn a first=last-frame Veo clip into a seamless loop and report the seam.

usage: loop.py IN.mp4 OUT.mp4 [xfade_frames=8]
Drops the duplicated end frame, then blends the tail into the head so the last
output frame flows straight into the first. Prints seam diff vs typical
frame-to-frame diff (ratio <= ~1.2 means no visible jump).
"""
import subprocess, sys, numpy as np

FF = __import__("os").path.join(__import__("os").path.dirname(__file__), "..", "bin", "ffmpeg")
W, H = 1920, 1080


def read(path):
    p = subprocess.run([FF, "-loglevel", "error", "-i", path, "-vf", f"scale={W}:{H}:flags=lanczos",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(-1, H, W, 3)


def diff(a, b):
    return float(np.abs(a.astype(np.int16) - b.astype(np.int16)).mean())


def main():
    src, out = sys.argv[1:3]
    K = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    f = read(src)
    if diff(f[-1], f[0]) < 6:  # pinned last frame duplicates the first
        f = f[:-1]
    L = len(f)
    o = f[:L - K].astype(np.float32).copy()
    for j in range(K):
        a = (j + 1) / (K + 1)
        o[j] = (1 - a) * f[L - K + j] + a * f[j]
    o = o.clip(0, 255).astype(np.uint8)
    steps = [diff(o[i], o[i + 1]) for i in range(0, len(o) - 1, 3)]
    seam = diff(o[-1], o[0])
    typ = float(np.median(steps))
    print(f"{out}: frames={len(o)} seam={seam:.2f} typical={typ:.2f} ratio={seam / max(typ, 1e-3):.2f}")
    enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", "24", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "20",
                            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out], stdin=subprocess.PIPE)
    enc.stdin.write(o.tobytes()); enc.stdin.close(); enc.wait()


if __name__ == "__main__":
    main()
