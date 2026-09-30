import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw
R=ROOT+'/public/art/'
OX,OY=2300,840; W,H=4480,1920; h=0.5
c=Image.new('RGB',(int(W*h),int(H*h)),(128,128,128))
k=Image.open(R+'kitchen.jpg').resize((960,540)); s=Image.open(R+'storage.jpg').resize((960,540))
c.paste(k,(0,0)); c.paste(s,(int(OX*h),int(OY*h)))
d=ImageDraw.Draw(c)
# belt in the gap: kitchen exit -> hole just left of storage frame
a=(1945*h,993*h); b=((OX-10)*h,(993+0.33*(OX-10-1945))*h)
d.line([a,b],fill=(43,39,35),width=30); 
import math
dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy); nx,ny=-dy/L,dx/L
for sd in (-1,1):
  o=15*sd; d.line([(a[0]+nx*o,a[1]+ny*o),(b[0]+nx*o,b[1]+ny*o)],fill=(201,129,74),width=3)
c.save('/tmp/ks-f/comp.png'); print(c.size, b)
