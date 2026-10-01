import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
import numpy as np, sys
from PIL import Image
R=ROOT+'/public/art/'
g=Image.open(sys.argv[1]).convert('L'); G=6336/4480  # gen px per world px (if world 4480 wide)
# work at quarter world scale
q=0.25
gw=np.asarray(g.resize((int(4480*q),int(1920*q))),dtype=np.float32)
def find(name, guess, scales):
  best=None
  for s in scales:
    t=np.asarray(Image.open(R+name).convert('L').resize((int(1920*q*s),int(1080*q*s))),dtype=np.float32)
    # central patch
    th,tw=t.shape; p=t[th//5:th*4//5, tw//5:tw*4//5]; p=(p-p.mean())/p.std()
    gx,gy=int(guess[0]*q)+tw//5, int(guess[1]*q)+th//5
    for dy in range(-40,41,1):
      for dx in range(-50,51,1):
        y,x=gy+dy,gx+dx
        if y<0 or x<0 or y+p.shape[0]>gw.shape[0] or x+p.shape[1]>gw.shape[1]: continue
        w=gw[y:y+p.shape[0],x:x+p.shape[1]]; w=(w-w.mean())/(w.std()+1e-6)
        c=(w*p).mean()
        if best is None or c>best[0]: best=(c,s,(x-tw//5)/q,(y-th//5)/q)
  return best
print('kitchen',find('kitchen.jpg',(0,0),[0.98,1.0,1.02]))
print('storage',find('storage.jpg',(2300,840),[1.02,1.04,1.06,1.08,1.1]))
