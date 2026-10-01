from PIL import Image, ImageFilter
import numpy as np
im=np.array(Image.open('gen/koisheet1.png').convert('RGB')).astype(int)
r,g,b=im[...,0],im[...,1],im[...,2]
mag=(r>170)&(b>170)&(g<110)
# despill fringe: pixels magenta-ish
fringe=(r-g>90)&(b-g>60)
alpha=np.where(mag|fringe,0,255).astype(np.uint8)
cols=(alpha>0).sum(0)
# split columns
segs=[];inside=False
for x,c in enumerate(cols):
  if c>3 and not inside: s=x;inside=True
  elif c<=3 and inside:
    if x-s>100: segs.append((s,x))
    inside=False
print(segs)
rgba=np.dstack([im.astype(np.uint8),alpha])
S=0.27
for i,(x0,x1) in enumerate(segs):
  a=alpha[:,x0:x1]; ys=np.where(a.sum(1)>0)[0]
  crop=Image.fromarray(rgba[ys[0]:ys[-1]+1,x0:x1])
  w,h=crop.size
  # premultiply-ish downscale: use box on rgb with alpha
  out=crop.resize((round(w*S),round(h*S)),Image.BOX)
  arr=np.array(out); arr[...,3]=np.where(arr[...,3]>140,255,0)
  Image.fromarray(arr).save(f'koi_f{i}.png'); print(i,out.size)
