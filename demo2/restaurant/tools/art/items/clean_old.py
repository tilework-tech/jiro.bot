import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
import numpy as np, glob, os
from PIL import Image
from extract import fix_fringe, tint, edge
for f in sorted(glob.glob('orig-items/*.png')):
    a=np.array(Image.open(f).convert('RGBA'))
    rgb=a[...,:3].copy(); al=a[...,3]>=128
    before=int((al&(tint(rgb)>45)&(rgb[...,2].astype(int)>rgb[...,1].astype(int)+35)).sum())
    rgb,al=fix_fringe(rgb,al,it=2,recolor=True)
    out=np.dstack([rgb,(al*255).astype(np.uint8)])
    out[~al]=0
    Image.fromarray(out,'RGBA').save(ROOT+'/public/items/'+os.path.basename(f))
    print(os.path.basename(f),before,int((al&(tint(rgb)>45)&(rgb[...,2].astype(int)>rgb[...,1].astype(int)+35)).sum()))
