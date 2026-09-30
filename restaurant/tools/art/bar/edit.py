from PIL import Image, ImageDraw
import numpy as np
im=Image.open('bar-orig.jpg').convert('RGB')
a=np.asarray(im).astype(float)
H,W=a.shape[:2]
# 1) doorway interior -> deep dark with slight warm floor bounce
mask=Image.new('L',(W,H),0)
ImageDraw.Draw(mask).polygon([(1711,257),(1812,271),(1812,367),(1711,363)],fill=255)
m=np.asarray(mask)>0
ys,xs=np.nonzero(m)
t=(ys-257)/110.0
top=np.array([6,4,6.]); bot=np.array([26,15,11.])
col=top[None,:]*(1-t[:,None])+bot[None,:]*t[:,None]
# faint dither on the bottom band
dith=((xs+ys)%2==0)&(t>0.6)
col[dith]*=1.25
a[ys,xs]=col
# 2) beam top inside doorway sinks into shadow toward the right jamb
for x in range(1712,1812):
  f=(x-1712)/100.0
  k=1-0.6*f**1.3
  a[355:420,x]*=k
# keep the jamb/wall below y=395 at x>1790 untouched? restore rows below the beam front edge
out=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
# restore anything under front edge line (beam front face + wall) from original: front edge y ~ 387 at 1812, slope -0.61
o=np.asarray(im)
res=np.asarray(out).copy()
for x in range(1712,1812):
  yf=int(387+(1812-x)*0.61)+2
  res[yf:420,x]=o[yf:420,x]
Image.fromarray(res).save('bar-edit.png')
Image.fromarray(res).crop((1640,220,1880,500)).resize((960,1120),Image.NEAREST).save('door-edit.png')
