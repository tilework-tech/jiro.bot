import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
import numpy as np
from PIL import Image, ImageFilter
R=ROOT+'/public/art/'
W,H=4460,1966
SX,SY,SS=2470,846,1.035
gen=Image.open('/tmp/ks-f/gen2.png').convert('RGB')
gw=round(4480/1.005); gh=round(gen.height*gw/gen.width)
gen=gen.resize((gw,gh),Image.LANCZOS)
P=4
gen=gen.resize((gw//P,gh//P),Image.BOX).quantize(colors=96,method=Image.MEDIANCUT,dither=Image.NONE).convert('RGB').resize((gw//P*P,gh//P*P),Image.NEAREST)
c=Image.new('RGB',(W,H),(12,9,8))
# stretch last rows to cover bottom
c.paste(gen.resize((gw,gh+60),Image.LANCZOS).crop((0,0,gw,gh+60)),(6,6))
c.paste(gen,(6,6))
# Repainted shadow floor over the flat dark void below the corridor.
vi=Image.open('/tmp/ks-f/void-in.png').convert('RGB'); vo=Image.open('/tmp/ks-f/void-out.png').convert('RGB').resize(vi.size,Image.LANCZOS)
vo=vo.resize((vi.width//4,vi.height//4),Image.BOX).quantize(colors=64,method=Image.MEDIANCUT,dither=Image.NONE).convert('RGB').resize((vi.width//4*4,vi.height//4*4),Image.NEAREST)
va=np.asarray(vi).astype(np.float32); lum=va.mean(2)
vm=Image.fromarray(((lum<34)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(10))
c.paste(vo,(1100,1060),vm.crop((0,0,vo.width,vo.height)))
band=c.crop((0,1916-50,SX+60,1916)).transpose(Image.FLIP_TOP_BOTTOM); c.paste(band,(0,1916))
def mask(w,h,edges,f):
  m=np.ones((h,w),np.float32)
  x=np.arange(w)[None,:]; y=np.arange(h)[:,None]
  if 'r' in edges: m=np.minimum(m,np.clip((w-1-x)/f,0,1))
  if 'b' in edges: m=np.minimum(m,np.clip((h-1-y)/f,0,1))
  if 'l' in edges: m=np.minimum(m,np.clip(x/f,0,1))
  if 't' in edges: m=np.minimum(m,np.clip(y/f,0,1))
  return Image.fromarray((m*255).astype(np.uint8))
k=Image.open(R+'kitchen.jpg').convert('RGB')
c.paste(k,(0,0),mask(1920,1080,'rb',40))
s=Image.open(R+'storage.jpg').convert('RGB'); sw,sh=round(1920*SS),round(1080*SS)
s=s.resize((sw,sh),Image.LANCZOS)
c.paste(s,(SX,SY),mask(sw,sh,'lt',40))
c=c.crop((0,0,W,max(H,SY+sh)))
print(c.size)
c.save(ROOT+'/public/art/tr/kitchen-storage-f/world.jpg',quality=90)
c.resize((c.width//2,c.height//2)).save('/tmp/ks-f/world-half.png')
