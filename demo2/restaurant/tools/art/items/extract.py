import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
import numpy as np, sys
from PIL import Image
from comps import fg_mask,label
OUT=ROOT+'/public/items/'
def tint(a):
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    return (r+b)//2-g
def edge(alpha):
    t=np.zeros_like(alpha)
    t[1:]|=~alpha[:-1]; t[:-1]|=~alpha[1:]; t[:,1:]|=~alpha[:,:-1]; t[:,:-1]|=~alpha[:,1:]
    t[0]=t[-1]=True; t[:,0]=t[:,-1]=True
    return alpha&t
def fix_fringe(rgb, alpha, thr=45, it=3, recolor=False):
    for _ in range(it):
        e=edge(alpha)&(tint(rgb)>thr)
        # don't eat genuinely pink content: only pixels also reasonably magenta-ish (b high)
        e&=(rgb[...,2].astype(int)>rgb[...,1].astype(int)+35)
        if not e.any(): break
        if recolor:
            rgb[e]=(27,18,16)
        else:
            alpha=alpha&~e
    return rgb,alpha
def extract(sheet,box,name,keep=1,maxdim=160):
    a=np.array(Image.open(sheet).convert('RGB'))
    x0,y0,x1,y1=box; c=a[y0:y1,x0:x1].copy()
    m=fg_mask(c)
    lab,s=label(m,step=1)
    big=[t[0] for t in sorted(s,key=lambda t:-t[1])[:keep]]
    m=np.isin(lab,big)
    c,m=fix_fringe(c,m,it=4)
    ys,xs=np.where(m); c=c[ys.min():ys.max()+1,xs.min():xs.max()+1]; m=m[ys.min():ys.max()+1,xs.min():xs.max()+1]
    im=Image.fromarray(np.dstack([c,(m*255).astype(np.uint8)]),'RGBA')
    f=maxdim/max(im.size); im=im.resize((max(1,round(im.width*f)),max(1,round(im.height*f))),Image.NEAREST)
    im.save(OUT+name+'.png'); print(name,im.size)
if __name__=='__main__':
    A,B='sheetA.png','sheetB.png'
    for sheet,box,name,keep in [
        (A,(100,55,590,630),'hamster',1),(A,(775,60,1275,625),'octopus',1),(A,(45,790,645,1260),'crab',1),
        (A,(750,750,1300,1300),'frog',1),(A,(1425,750,1990,1300),'sloth',1),(A,(115,1430,575,1990),'sumo',1),
        (B,(75,150,595,550),'googly',1),(B,(845,55,1205,640),'ufo',1),(B,(1440,100,1980,610),'raccoon',1),
        (B,(35,745,645,1310),'seal',1),(B,(805,730,1290,1310),'cat-maki',1),(B,(1450,760,1960,1300),'shiba',1)]:
        extract(sheet,box,name,keep)
