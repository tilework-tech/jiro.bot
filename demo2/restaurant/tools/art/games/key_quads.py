import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image
import numpy as np, sys
OUT=ROOT+"/public/games/"
def key(im):
    a=np.array(im.convert("RGBA")).astype(int)
    r,g,b=a[...,0],a[...,1],a[...,2]
    mag=(r>170)&(b>170)&(g<110)
    # soften: pinkish fringe -> also drop
    fr=(r-g>90)&(b-g>90)
    a[...,3]=np.where(mag|fr,0,255)
    return Image.fromarray(a.astype('uint8'))
def quads(src,names,size):
    im=Image.open(src); W,H=im.size
    for i,n in enumerate(names):
        if not n: continue
        x,y=(i%2)*W//2,(i//2)*H//2
        q=key(im.crop((x,y,x+W//2,y+H//2)))
        bb=q.getbbox(); q=q.crop(bb)
        q.thumbnail((size,size),Image.LANCZOS)
        a=np.array(q); a[...,3]=np.where(a[...,3]>120,255,0); q=Image.fromarray(a)
        q.save(OUT+n+".png"); print(n,q.size)
quads("bug.png",["bug-a","bug-b","bug-gold","bug-dizzy"],160)
quads("mallet.png",["mallet","bonk-star",None,"dizzy"],160)
quads("koi.png",["koi-a","koi-b","koi-gulp","koi-dizzy"],160)
im=Image.open("pondbg.png").convert("RGB"); im=im.resize((480,int(480*im.size[1]/im.size[0])),Image.LANCZOS); im.save(OUT+"pond-bg.png"); print(im.size)
im=Image.open("lawn.png").convert("RGB"); W,H=im.size; im=im.crop((int(W*.12),int(H*.1),int(W*.88),int(H*.9))).resize((288,180),Image.LANCZOS); im.save(OUT+"lawn.png"); print(im.size)
