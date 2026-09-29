import subprocess, numpy as np, glob, os
for f in sorted(glob.glob('repo/scroll/media/*.mp4')):
    raw = subprocess.run(['bin/ffmpeg','-v','error','-i',f,'-vf','scale=160:90','-f','rawvideo','-pix_fmt','gray','-'],capture_output=True).stdout
    a = np.frombuffer(raw,np.uint8).reshape(-1,90,160).astype(float)
    steps = np.abs(np.diff(a,axis=0)).mean(axis=(1,2))
    seam = np.abs(a[-1]-a[0]).mean()
    print(f"{os.path.basename(f):18s} frames={len(a)} seam={seam:.2f} median_step={np.median(steps):.2f} max_step={steps.max():.2f} {'OK' if seam<=steps.max() else 'JUMP'}")
