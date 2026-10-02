import numpy as np, sys
from PIL import Image
from comps import fg_mask,label
a=np.array(Image.open(sys.argv[1]).convert('RGB'))
x0,y0,x1,y1=map(int,sys.argv[2:6])
m=fg_mask(a[y0:y1,x0:x1])
lab,s=label(m,step=1)
for t in sorted(s,key=lambda t:-t[1])[:5]: print(t[0],t[1],t[2]+x0,t[3]+y0,t[4]+x0,t[5]+y0)
