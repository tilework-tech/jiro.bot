import sys
from PIL import Image, ImageDraw
im=Image.open('bar-orig.jpg').convert('RGB')
d=ImageDraw.Draw(im)
# candidate lines
L=[((600,1070),(1780,340),(0,255,0)), ((800,1080),(1800,400),(0,255,255))]
for a,b,c in L: d.line([a,b],fill=c,width=1)
for x in range(600,1900,100): d.line([(x,300),(x,1080)],fill=(255,0,255),width=1)
im.crop((550,280,1900,1080)).save('ov.png')
for i,(x0,y0,x1,y1) in enumerate([(600,850,1000,1080),(1000,600,1400,860),(1400,330,1850,640)]):
  im.crop((x0,y0,x1,y1)).resize(((x1-x0)*3,(y1-y0)*3),Image.NEAREST).save(f'ov{i}.png')
