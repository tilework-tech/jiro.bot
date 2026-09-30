import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
import numpy as np, sys
from PIL import Image
R=ROOT+"/public/art/"
P=Image.open(sys.argv[1]).convert("L")
D=4
Pa=np.asarray(P.resize((P.width//D,P.height//D)),dtype=np.float32)
def reg(src,ex,ey,ew):
    S=Image.open(R+src).convert("L")
    best=None
    for w in range(int(ew*0.88),int(ew*1.12),4):
        h=round(w*1080/1920)
        T=np.asarray(S.resize((w//D,h//D)),dtype=np.float32)
        # crop interior to allow partial
        T=T[2:-2,2:-2]; th,tw=T.shape
        for y in range(max(0,(ey-120)//D),min(Pa.shape[0]-th,(ey+120)//D)):
            for x in range(max(0,(ex-120)//D),min(Pa.shape[1]-tw,(ex+120)//D)):
                pass
        # vectorized via sliding window
        from numpy.lib.stride_tricks import sliding_window_view as sw
        y0=max(0,(ey-120)//D); x0=max(0,(ex-120)//D)
        sub=Pa[y0:min(Pa.shape[0],(ey+120)//D+th), x0:min(Pa.shape[1],(ex+120)//D+tw)]
        if sub.shape[0]<th or sub.shape[1]<tw: continue
        V=sw(sub,(th,tw))
        e=((V-T)**2).mean(axis=(2,3))
        iy,ix=np.unravel_index(e.argmin(),e.shape)
        c=(e.min(),w,(x0+ix)*D-2*D,(y0+iy)*D-2*D)
        if best is None or c[0]<best[0]: best=c
    return best
print("kitchen",reg("kitchen.jpg",0,0,1159))
print("storage",reg("storage.jpg",int(sys.argv[2]),int(sys.argv[3]),1159))
