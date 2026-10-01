from PIL import Image
import numpy as np
src=np.asarray(Image.open('/tmp/polish-storage/e3_sack.png').convert('RGB')).astype(int)
r,g,b=src[...,0],src[...,1],src[...,2]
mag=(r>170)&(b>170)&(g<110)
a=(~mag).astype(np.uint8)*255
# largest region bbox: restrict to sack area
a[:, 1845:]=0; a[1860:,:]=0; a[:,:140]=0
rgba=np.dstack([src.astype(np.uint8),a])
im=Image.fromarray(rgba,'RGBA')
bb=im.getbbox(); im=im.crop(bb)
print('bbox',bb)
CELL=38
cw,ch=round(im.width/CELL),round(im.height/CELL)
small=im.resize((cw,ch),Image.BOX)
sa=np.asarray(small).copy(); sa[...,3]=np.where(sa[...,3]>140,255,0)
small=Image.fromarray(sa,'RGBA')
small.save('/tmp/polish-storage/sack_cells.png')
print('cells',cw,ch)
