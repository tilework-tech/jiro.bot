# Builds jiro-look.png, jiro-blink.png, jiro-look-blink.png (88x100 overlays at 1536,330).
from PIL import Image; import numpy as np
from scipy import ndimage as nd
ROOT='/home/sprite/org/workspace/.local/jiro.bot/restaurant/'
art=np.asarray(Image.open(ROOT+'public/art/kitchen.jpg').convert('RGB')).astype(int)
FX,FY=1536,330
P=art[FY:FY+100,FX:FX+88].copy()
H,W=P.shape[:2]
r,g,b=P[...,0],P[...,1],P[...,2]
blue=(b>r+30)
dark=(r+g+b<200)
yy,xx=np.mgrid[0:H,0:W]
def edge(y): return 17   # face silhouette column (left)
eyeR=(xx>=52)&(xx<=77)&(yy>=17)&(yy<=48)
eyeL=(xx>=12)&(xx<=28)&(yy>=15)&(yy<=42)
# eye masks: blue plus the dark ring (blue dilated by 2 px, dark pixels only)
ring=nd.binary_dilation(blue,iterations=2)&(dark|blue)
mR=ring&eyeR; mL=ring&eyeL&(xx>=edge(yy)-1)|(blue&eyeL)
zR=nd.binary_dilation(mR,iterations=3); zL=nd.binary_dilation(mL,iterations=3)
eyeR=(xx>=50)&(xx<=79)&(yy>=15)&(yy<=50)
eyeL=(xx>=12)&(xx<=31)&(yy>=13)&(yy<=44)
cream_row={y:P[y,40] for y in range(H)}
bg=P[20,4]; ink=np.array([27,19,13])
def plate():
  Q=P.copy()
  for y in range(H):
    for x in range(W):
      off=np.abs(P[y,x]-cream_row[y]).sum()>40
      if eyeR[y,x] and (zR[y,x] or off):
        Q[y,x]=cream_row[y]
      if eyeL[y,x] and (mL[y,x] or blue[y,x] or (zL[y,x] and x>edge(y))):
        Q[y,x]=cream_row[y] if x>edge(y) else (ink if x>edge(y)-2 else bg)
  return Q
def paste(Q,m,dx,dy):
  ys,xs=np.nonzero(m)
  for y,x in zip(ys,xs):
    ny,nx=y+dy,x+dx
    if 0<=ny<H and 0<=nx<W and not (m is mL and nx<edge(ny)-1): Q[ny,nx]=P[y,x]
def lids(Q,dx,dy):
  # closed eyes: a 2-px dark line across each eye centre
  Q[31+dy:33+dy, 57+dx:73+dx]=ink
  Q[28+dy:30+dy, max(18,int(edge(28+dy))+1)+0:27+dx if dx>=0 else 27]=ink
def save(Q,name):
  diff=(np.abs(Q-P).sum(-1)>0)
  out=np.zeros((H,W,4),np.uint8); out[...,:3]=Q; out[...,3]=diff*255
  Image.fromarray(out).save(ROOT+'public/art/kitchen/'+name)
  prev=Image.fromarray(Q.astype(np.uint8)).resize((W*6,H*6),Image.NEAREST); prev.save('/tmp/kit/prev_'+name)
LOOK=(-4,4)
Q=plate(); paste(Q,mL,0,LOOK[1]); paste(Q,mR,*LOOK); save(Q,'jiro-look.png')
Q=plate(); lids(Q,0,0); save(Q,'jiro-blink.png')
Q=plate(); lids(Q,LOOK[0],LOOK[1]); save(Q,'jiro-look-blink.png')
