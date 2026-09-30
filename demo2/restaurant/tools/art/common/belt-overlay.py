import sys,json
from PIL import Image, ImageDraw
pts=json.loads(sys.argv[1]); w=float(sys.argv[2])
im=Image.open('yard_new.png').convert('RGB'); d=ImageDraw.Draw(im)
import math
for i in range(len(pts)-1):
  (x0,y0,s0),(x1,y1,s1)=pts[i],pts[i+1]
  d.line([(x0,y0),(x1,y1)],fill=(0,255,0),width=2)
  L=math.hypot(x1-x0,y1-y0); nx,ny=-(y1-y0)/L,(x1-x0)/L
  for s,(x,y) in ((s0,(x0,y0)),(s1,(x1,y1))):
    h=w*s/2; d.line([(x-nx*h,y-ny*h),(x+nx*h,y+ny*h)],fill=(255,0,255),width=2)
  for k in range(0,int(L),20):
    f=k/L; x=x0+(x1-x0)*f; y=y0+(y1-y0)*f; s=s0+(s1-s0)*f; h=w*s/2
    d.point([(x-nx*h,y-ny*h),(x+nx*h,y+ny*h)],fill=(255,255,0))
im.crop((0,700,500,1000)).resize((1000,600),Image.NEAREST).save('ov_left.png')
im.crop((1300,480,1920,1000)).save('ov_right.png')
