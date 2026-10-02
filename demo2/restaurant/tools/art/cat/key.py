from PIL import Image, ImageFilter
import numpy as np, sys
src, out, W = sys.argv[1], sys.argv[2], int(sys.argv[3])
a=np.array(Image.open(src).convert('RGB')).astype(float)
r,g,b=a[...,0],a[...,1],a[...,2]
# magenta score: high r & b, low g
mag = np.minimum(r,b) - g
bg = mag > 60
m = Image.fromarray(((~bg)*255).astype(np.uint8))
m = m.filter(ImageFilter.MinFilter(5))  # erode 2px to eat fringe
alpha = np.array(m)>0
# drop any leftover pinkish pixel (b notably > g in orange/brown cat is unusual)
pink = (b > g + 25) & (r > g + 25)
alpha &= ~pink
ys,xs=np.where(alpha); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
rgba=np.dstack([a, alpha*255.0])[y0:y1,x0:x1]
H=round(W*(y1-y0)/(x1-x0))
# premultiplied box downsample
pm=rgba.copy(); pm[...,:3]*=pm[...,3:4]/255
im=Image.fromarray(pm.astype(np.uint8),'RGBA')
chs=[np.array(Image.fromarray(pm[...,i].astype(np.uint8)).resize((W,H),Image.BOX)).astype(float) for i in range(4)]
A=chs[3]; keep=A>=128
o=np.zeros((H,W,4),np.uint8)
for i in range(3): o[...,i]=np.where(keep, np.clip(chs[i]*255/np.maximum(A,1),0,255),0)
o[...,3]=keep*255
R,G,B=o[...,0].astype(int),o[...,1].astype(int),o[...,2].astype(int)
bad=keep&(B>G+20)&(R>G+20)
print('pink left',bad.sum(), 'size',W,H)
o[bad,3]=0
Image.fromarray(o,'RGBA').save(out)
