import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw
import numpy as np
OUT=ROOT+'/public/art/bar/'
im=Image.open('bar-orig.jpg').convert('RGB')
# --- blink: eyes closed
x0,y0,x1,y1=938,246,1000,279
c=np.asarray(im.crop((x0,y0,x1,y1))).astype(int).copy()
face=np.array(im.getpixel((968,262)))
face2=np.array(im.getpixel((968,256)))
alpha=np.zeros(c.shape[:2],np.uint8)
for (ex0,ey0,ex1,ey1) in [(940,249,962,275),(975,250,998,276)]:
  cx,cy=(ex0+ex1)/2,(ey0+ey1)/2; rx,ry=(ex1-ex0)/2,(ey1-ey0)/2
  for y in range(ey0,ey1+1):
    for x in range(ex0,ex1+1):
      if ((x-cx)/rx)**2+((y-cy)/ry)**2<=1.0:
        yy,xx=y-y0,x-x0
        c[yy,xx]=face if y>cy-4 else face2
        alpha[yy,xx]=255
  # closed eye: dark lid line + faint cyan glow under it
  ly=int(cy)+1
  for x in range(ex0+4,ex1-3):
    c[ly-y0,x-x0]=(20,30,45); alpha[ly-y0,x-x0]=255
    c[ly-y0+1,x-x0]=(20,30,45)
    c[ly-y0+2,x-x0]=(90,170,190)
Image.fromarray(np.dstack([c.astype(np.uint8),alpha])).save(OUT+'jiro-blink.png')
Image.fromarray(np.dstack([c.astype(np.uint8),alpha])).resize(((x1-x0)*8,(y1-y0)*8),Image.NEAREST).save('blink-big.png')
