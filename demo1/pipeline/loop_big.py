#!/usr/bin/env python3
"""Streaming seamless-loop cutter for large clips (same method as loop.py, without
holding the whole clip in memory).

usage: loop_big.py IN.mp4 OUT.mp4 WIDTH HEIGHT [xfade_frames=12] [crf=18]
"""
import collections, os, subprocess, sys
import numpy as np

FF = os.path.join(os.path.dirname(__file__), "..", "bin", "ffmpeg")


def frames(path, W, H):
    p = subprocess.Popen([FF, "-loglevel", "error", "-i", path, "-vf", f"scale={W}:{H}:flags=lanczos",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    p.wait()


def diff(a, b):
    return float(np.abs(a[::4, ::4].astype(np.int16) - b[::4, ::4].astype(np.int16)).mean())


def main():
    src, out, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    K = int(sys.argv[5]) if len(sys.argv) > 5 else 12
    crf = sys.argv[6] if len(sys.argv) > 6 else "18"
    head, tail, L, steps, prev = [], collections.deque(maxlen=K + 1), 0, [], None
    for f in frames(src, W, H):
        if L < K:
            head.append(f.copy())
        tail.append(f.copy())
        if prev is not None and L % 4 == 0:
            steps.append(diff(prev, f))
        prev = f; L += 1
    tail = list(tail)
    if diff(tail[-1], head[0]) < 6:  # pinned last frame duplicates the first
        L -= 1; tail = tail[:-1]
    else:
        tail = tail[1:]
    blended = [((1 - (j + 1) / (K + 1)) * tail[j].astype(np.float32) + (j + 1) / (K + 1) * head[j].astype(np.float32)).clip(0, 255).astype(np.uint8)
               for j in range(K)]
    enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                            "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out],
                           stdin=subprocess.PIPE)
    for b in blended:
        enc.stdin.write(b.tobytes())
    last = None
    for i, f in enumerate(frames(src, W, H)):
        if K <= i < L - K:
            enc.stdin.write(f.tobytes()); last = f
    enc.stdin.close(); enc.wait()
    seam = diff(last, blended[0])
    typ = float(np.median(steps))
    print(f"{out}: frames={L - K} seam={seam:.2f} typical={typ:.2f} ratio={seam / max(typ, 1e-3):.2f}")


if __name__ == "__main__":
    main()
