import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
import numpy as np
from PIL import Image
R=ROOT+'/public/art/'
g=Image.open('/tmp/ks-f/gen2.png').convert('L')
q=0.5
gw=np.asarray(g.resize((int(4480*q),int(1920*q)),Image.LANCZOS),dtype=np.float32)
def find(name, guess, scales, rng):
  best=None
  for s in scales:
    t=np.asarray(Image.open(R+name).convert('L').resize((round(1920*q*s),round(1080*q*s)),Image.LANCZOS),dtype=np.float32)
    th,tw=t.shape; p=t[th//5:th*4//5, tw//5:tw*4//5]; p=(p-p.mean())/p.std()
    gx,gy=round(guess[0]*q)+tw//5, round(guess[1]*q)+th//5
    for dy in range(-rng,rng+1):
      for dx in range(-rng,rng+1):
        y,x=gy+dy,gx+dx
        w=gw[y:y+p.shape[0],x:x+p.shape[1]]
        if w.shape!=p.shape: continue
        w=(w-w.mean())/(w.std()+1e-6); c=(w*p).mean()
        if best is None or c>best[0]: best=(float(c),s,(x-tw//5)/q,(y-th//5)/q)
  return best
print('kitchen',find('kitchen.jpg',(0,0),[0.99,0.995,1.0,1.005],6))
print('storage',find('storage.jpg',(2488,852),[1.025,1.03,1.035,1.04,1.045,1.05],12))
