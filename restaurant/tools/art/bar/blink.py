import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw
import numpy as np
OUT=ROOT+'/public/art/bar/'
im=Image.open('bar-orig.jpg').convert('RGB'); A=np.asarray(im).astype(float)
x0,y0,x1,y1=936,244,1002,281
c=A[y0:y1,x0:x1].copy(); alpha=np.zeros(c.shape[:2],np.uint8)
YY,XX=np.mgrid[y0:y1,x0:x1]
for (ex0,ey0,ex1,ey1) in [(940,249,962,275),(975,250,998,276)]:
  cx,cy=(ex0+ex1)/2,(ey0+ey1)/2; rx,ry=(ex1-ex0)/2+2,(ey1-ey0)/2+2
  r=((XX-cx)/rx)**2+((YY-cy)/ry)**2
  inside=(r<=1.0)&~((c[...,1]>c[...,0]+8)&(c[...,2]<c[...,1]-25)&(c[...,1]>70))&(XX>=(943 if ex0<950 else 0))
  ring=(r>1.15)&(r<1.8)&(c[...,0]>150)&(c[...,0]-c[...,1]<40)
  # per-row ring colour so the faceplate's vertical shading continues across the lid
  for yy in range(c.shape[0]):
    row=inside[yy]
    if not row.any(): continue
    rr=ring[max(0,yy-2):yy+3]
    src=c[max(0,yy-2):yy+3][rr]
    col=src.mean(0) if len(src) else np.array([190.,172,152])
    c[yy,row]=col; alpha[yy,row]=255
  ly=int(round(cy))+1
  for x in range(ex0+3,ex1-2):
    c[ly-y0,x-x0]=(22,30,44); c[ly-y0+1,x-x0]=(22,30,44); c[ly-y0+2,x-x0]=(80,160,185)
    alpha[ly-y0:ly-y0+3,x-x0]=255
out=Image.fromarray(np.dstack([np.clip(c,0,255).astype(np.uint8),alpha]))
out.save(OUT+'jiro-blink.png')
comp=im.convert('RGBA'); comp.alpha_composite(out,(x0,y0))
comp.crop((920,230,1015,300)).resize((570,420),Image.NEAREST).save('blink-comp.png')
# face contour where the left eye used to touch the edge
b=np.asarray(Image.open(OUT+'jiro-blink.png')).copy()
for yy in range(b.shape[0]):
  xs=np.nonzero(b[yy,:,3])[0]
  xs=xs[xs<20]
  if len(xs) and xs.min()==7: b[yy,xs.min(),:3]=(28,20,18); b[yy,xs.min()+1,:3]=(60,45,40)
Image.fromarray(b).save(OUT+'jiro-blink.png')
comp=im.convert('RGBA'); comp.alpha_composite(Image.fromarray(b),(x0,y0))
comp.crop((920,230,1015,300)).resize((570,420),Image.NEAREST).save('blink-comp.png')
