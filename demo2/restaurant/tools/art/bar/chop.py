import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw
import numpy as np
OUT=ROOT+'/public/art/bar/'
im=Image.open('bar-orig.jpg').convert('RGB')
# fix blink sprite seam: single face colour
b=Image.open(OUT+'jiro-blink.png'); ba=np.asarray(b).copy()
face=np.array(im.getpixel((968,264)))
m=(ba[...,3]>0)&(ba[...,0]>100)
ba[m,:3]=face
Image.fromarray(ba).save(OUT+'jiro-blink.png')
x0,y0,x1,y1=1540,612,1614,698
poly=[(1566,626),(1590,614),(1607,618),(1609,652),(1598,678),(1572,694),(1548,694),(1544,672),(1562,660)]
mk=Image.new('L',im.size,0); ImageDraw.Draw(mk).polygon(poly,fill=255)
spr=im.copy(); spr.putalpha(mk); spr=spr.crop((x0,y0,x1,y1)); spr.save(OUT+'chop.png')
for dy in (0,3):
  c=im.copy(); c.alpha_composite if False else None
  c=c.convert('RGBA'); c.alpha_composite(spr,(x0,y0-dy))
  c.crop((1500,580,1650,720)).resize((600,560),Image.NEAREST).save(f'chop{dy}.png')
