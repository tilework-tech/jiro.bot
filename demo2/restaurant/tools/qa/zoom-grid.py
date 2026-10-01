import sys
from PIL import Image, ImageDraw
n,x0,y0,x1,y1,z,out=sys.argv[1],*map(int,sys.argv[2:7]),sys.argv[7]
im=Image.open(f"public/art/{n}.jpg").convert("RGB").crop((x0,y0,x1,y1))
im=im.resize(((x1-x0)*z,(y1-y0)*z),Image.NEAREST)
d=ImageDraw.Draw(im)
for x in range((x0//20+1)*20,x1,20):
    X=(x-x0)*z; d.line([(X,0),(X,im.size[1])],fill=(255,0,0) if x%100==0 else (255,255,0))
    if x%100==0: d.text((X+2,2),str(x),fill=(255,255,255))
for y in range((y0//20+1)*20,y1,20):
    Y=(y-y0)*z; d.line([(0,Y),(im.size[0],Y)],fill=(255,0,0) if y%100==0 else (255,255,0))
    if y%100==0: d.text((2,Y+2),str(y),fill=(255,255,255))
im.save(out)
