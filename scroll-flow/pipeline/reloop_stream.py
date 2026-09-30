# reloop.py SRC DST K : seamless loop by crossfading the last K frames into the first K (head dropped).
# Streams frames (1440p fits in memory); the output's last frame flows into its first as a normal step.
import subprocess, numpy as np, sys, re, collections
src, dst, K = sys.argv[1], sys.argv[2], int(sys.argv[3])
info = subprocess.run(["ffmpeg","-i",src], capture_output=True, text=True).stderr
W, H = map(int, re.search(r", (\d{3,5})x(\d{3,5})", info).groups())
dec = subprocess.Popen(["ffmpeg","-v","error","-i",src,"-f","rawvideo","-pix_fmt","rgb24","-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r","24","-i","-",
  "-c:v","libx264","-profile:v","high","-pix_fmt","yuv420p","-crf",__import__("os").environ.get("CRF","19"),"-preset","slow","-g","48","-x264-params","keyint=48:min-keyint=48:scenecut=0:open-gop=0","-tune","film","-movflags","+faststart","-an",dst], stdin=subprocess.PIPE)
sz = W*H*3; head = []; tail = collections.deque(); n = 0
while True:
    b = dec.stdout.read(sz)
    if len(b) < sz: break
    n += 1
    if len(head) < K: head.append(np.frombuffer(b, np.uint8).astype(np.float32)); continue
    tail.append(b)
    if len(tail) > K: enc.stdin.write(tail.popleft())
for j, b in enumerate(tail):
    a = (j + 1) / (K + 1)
    enc.stdin.write(((1 - a) * np.frombuffer(b, np.uint8) + a * head[j]).round().astype(np.uint8).tobytes())
enc.stdin.close(); enc.wait(); print(src, "frames", n, "->", n - K)
