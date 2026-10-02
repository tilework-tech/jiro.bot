import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image
import numpy as np
def key(p):
    a=np.array(Image.open(p).convert('RGBA')).astype(int)
    r,g,b=a[...,0],a[...,1],a[...,2]
    m=(r-g>90)&(b-g>90)
    a[m,3]=0
    return Image.fromarray(a.astype('uint8'))
def save(im,out,w):
    im=im.crop(im.getbbox())
    h=round(im.height*w/im.width)
    im=im.resize((w,h),Image.NEAREST); im.save(out); print(out,im.size)
O=ROOT+'/public/mood/v06/'
save(key('plate.png'),O+'plate.png',460)
ing=key('ingr.png'); W=ing.width
arr=np.array(ing)[...,3]>0
cols=arr.any(0); 
# segments
segs=[];s=None
for x,c in enumerate(cols):
    if c and s is None: s=x
    if not c and s is not None:
        if x-s>40: segs.append((s,x))
        s=None
print(segs)
for name,(x0,x1) in zip(['rice','fish','nori','sauce','garnish'],segs):
    save(ing.crop((x0,0,x1,ing.height)),O+name+'.png',84)
