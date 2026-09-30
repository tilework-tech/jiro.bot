# seam_check.py CLIP... : loop join vs normal frame steps, measured at 160x90 so H.264 noise averages out.
# A join at or below the clip's own max step reads as a normal frame; "ratio" is seam / median step.
import subprocess, numpy as np, sys
for f in sys.argv[1:]:
  W,H=160,90
  raw=subprocess.run(["ffmpeg","-v","error","-i",f,"-vf",f"scale={W}:{H}","-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
  fr=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.float32)
  d=np.abs(np.diff(fr,axis=0)).mean(axis=(1,2,3)); seam=np.abs(fr[0]-fr[-1]).mean()
  print(f"{f.split('/')[-1]:26s} n={len(fr)} typical={np.median(d):.3f} p95={np.percentile(d,95):.3f} max={d.max():.3f}@{d.argmax()} seam={seam:.3f} ratio={seam/np.median(d):.2f}")
