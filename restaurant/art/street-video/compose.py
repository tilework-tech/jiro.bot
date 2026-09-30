#!/usr/bin/env python3
"""Replace the rider/vehicle in a video with motion-aligned clean background patches.

The exact source footage is retained outside mask.png. Generated keyframes are
already aligned; optical feature matches move their hidden-region pixels with
nearby storefronts and road. No external model is called by this script.

Dependencies: numpy, opencv-python-headless, scipy, imageio-ffmpeg.
Usage: python compose.py --source original.mp4 --keyframe-dir . --output clean.mp4
"""
import argparse
from pathlib import Path
import subprocess
import cv2
import imageio_ffmpeg
import numpy as np
from scipy.spatial import cKDTree

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--keyframe-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--poster', type=Path)
args = parser.parse_args()
cv2.setNumThreads(2)
cap = cv2.VideoCapture(str(args.source))
fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
while True:
    ok, frame = cap.read()
    if not ok: break
    frames.append(frame)
cap.release()
if len(frames) != 168 or abs(fps - 24) > .01:
    raise ValueError('This compositor expects the original 168-frame, 24fps clip.')
H, W = frames[0].shape[:2]
mask = cv2.imread(str(args.keyframe_dir / 'mask.png'), cv2.IMREAD_GRAYSCALE)
if mask is None or mask.shape != (H, W):
    raise ValueError('mask.png must match the video dimensions.')
alpha = cv2.GaussianBlur(mask.astype(np.float32) / 255, (19,19), 0)[:,:,None]
sift = cv2.SIFT_create(5000)
matcher = cv2.BFMatcher()
features = [sift.detectAndCompute(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), 255-mask) for f in frames]
xx, yy = np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
grid = np.column_stack([xx.ravel(), yy.ravel()])

def keywarp(target,key):
 clean=cv2.imread(str(args.keyframe_dir / f'key-{key:03}.png')); kp1,d1=features[target];kp2,d2=features[key]
 pairs=matcher.knnMatch(d1,d2,k=2); good=[a for a,b in pairs if a.distance<.72*b.distance]
 if len(good)<20:return clean
 p=np.array([kp1[m.queryIdx].pt for m in good]);q=np.array([kp2[m.trainIdx].pt for m in good]);delta=q-p
 _,nn=cKDTree(p).query(p,k=min(10,len(p)));med=np.median(delta[nn],axis=1);valid=np.linalg.norm(delta-med,axis=1)<30
 p,q=p[valid],q[valid]
 if len(p)<4:return clean
 # Local planar motion preserves doors and curb lines more reliably than unconstrained mesh extrapolation.
 maps=[]
 for ylo,yhi in [(150,540),(500,720)]:
  valid=(p[:,1]>=ylo)&(p[:,1]<=yhi)&(p[:,0]<1050)
  if sum(valid)<12:valid=(p[:,1]>=ylo)&(p[:,1]<=yhi)
  if sum(valid)<4:valid=np.ones(len(p),dtype=bool)
  M,inl=cv2.estimateAffinePartial2D(p[valid],q[valid],method=cv2.RANSAC,ransacReprojThreshold=6,maxIters=5000)
  if M is None:M=np.array([[1,0,np.median(delta[:,0])],[0,1,np.median(delta[:,1])]])
  dest=grid@M[:,:2].T+M[:,2];maps.append(dest.reshape(H,W,2).astype(np.float32))
 mix=np.clip((yy-500)/60,0,1)[:,:,None];mapped=maps[0]*(1-mix)+maps[1]*mix
 return cv2.remap(clean,mapped[:,:,0],mapped[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)

keys = [0,42,84,126]
args.output.parent.mkdir(parents=True,exist_ok=True)
proc = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-f', 'rawvideo',
    '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', '24', '-i', '-', '-an',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-threads', '2', '-movflags', '+faststart', str(args.output)], stdin=subprocess.PIPE)
max_outside = 0
for i in range(168):
    if i in keys:
        clean = cv2.imread(str(args.keyframe_dir / f'key-{i:03}.png')).astype(np.float32)
    elif i > 126:
        # The original clip dissolves back to its opening over frames144–167.
        t = np.clip((i-144)/24,0,1)
        a = keywarp(i,126)
        clean = a*(1-t)+keywarp(i,0)*t if t>0 else a
    else:
        lo=max(k for k in keys if k<=i); hi=min(k for k in keys if k>=i)
        t=(i-lo)/(hi-lo)
        clean=keywarp(i,lo)*(1-t)+keywarp(i,hi)*t
    out=np.clip(frames[i]*(1-alpha)+clean*alpha,0,255).astype(np.uint8)
    outside=alpha[:,:,0]==0
    max_outside=max(max_outside,int(np.max(np.abs(out[outside].astype(int)-frames[i][outside].astype(int)))))
    proc.stdin.write(out.tobytes())
    if i==126 and args.poster:
        args.poster.parent.mkdir(parents=True,exist_ok=True)
        cv2.imwrite(str(args.poster),out)
proc.stdin.close()
if proc.wait(): raise RuntimeError('ffmpeg encoding failed')
print(f'Unmasked pixels: {np.mean(alpha[:,:,0]==0):.4%}; maximum pre-encode difference: {max_outside}')
