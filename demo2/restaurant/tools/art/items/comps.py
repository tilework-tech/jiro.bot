import numpy as np, sys
from PIL import Image
from collections import deque
def fg_mask(a):
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    bg=(g < np.minimum(r,b)-70) & (r>110) & (b>110)
    return ~bg
def label(mask, step=4):
    # label on downsampled mask for speed
    m=mask[::step,::step]; H,W=m.shape; lab=np.zeros((H,W),int); n=0; sizes=[]
    for y in range(H):
        for x in range(W):
            if m[y,x] and not lab[y,x]:
                n+=1; q=deque([(y,x)]); lab[y,x]=n; c=0; ys=[];xs=[]
                while q:
                    cy,cx=q.popleft(); c+=1; ys.append(cy); xs.append(cx)
                    for dy in(-1,0,1):
                        for dx in(-1,0,1):
                            ny,nx=cy+dy,cx+dx
                            if 0<=ny<H and 0<=nx<W and m[ny,nx] and not lab[ny,nx]:
                                lab[ny,nx]=n; q.append((ny,nx))
                sizes.append((n,c,min(xs)*step,min(ys)*step,max(xs)*step+step,max(ys)*step+step))
    return lab,sizes
if __name__=='__main__':
    a=np.array(Image.open(sys.argv[1]).convert('RGB'))
    lab,s=label(fg_mask(a))
    for t in sorted(s,key=lambda t:-t[1]):
        if t[1]>30: print(t)
