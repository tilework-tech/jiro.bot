import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw
OUT=ROOT+'/public/art/bar/'
im=Image.open('bar-orig.jpg').convert('RGB')
x0,y0,x1,y1=806,622,880,676
poly=[(814,632),(840,626),(862,632),(876,650),(872,668),(852,672),(832,668),(818,660),(810,646)]
mk=Image.new('L',im.size,0); ImageDraw.Draw(mk).polygon(poly,fill=255)
spr=im.copy(); spr.putalpha(mk); spr=spr.crop((x0,y0,x1,y1)); spr.save(OUT+'chop-mid.png')
for dy in (0,3):
  c=im.convert('RGBA'); c.alpha_composite(spr,(x0,y0-dy))
  c.crop((770,590,910,700)).resize((700,550),Image.NEAREST).save(f'chopm{dy}.png')
