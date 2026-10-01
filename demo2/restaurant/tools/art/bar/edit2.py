import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw
import numpy as np
im=Image.open('bar-edit.png').convert('RGB')
a=np.asarray(im).copy()
def poly_fill(pts,c0,c1,axis):
  mk=Image.new('L',im.size,0); ImageDraw.Draw(mk).polygon(pts,fill=255)
  ys,xs=np.nonzero(np.asarray(mk))
  v=(xs-xs.min())/(max(1,xs.max()-xs.min())) if axis=='x' else (ys-ys.min())/(max(1,ys.max()-ys.min()))
  col=np.array(c0)[None,:]*(1-v[:,None])+np.array(c1)[None,:]*v[:,None]
  d=((xs+ys)%2==0)
  col[d]*=0.9
  a[ys,xs]=col.astype(np.uint8)
# left jamb reveal (inner face, catches lantern light from the left)
poly_fill([(1711,257),(1719,262),(1719,361),(1711,363)],(96,58,36),(52,31,21),'x')
# lintel underside
poly_fill([(1711,257),(1812,271),(1812,278),(1719,263)],(44,26,18),(26,15,11),'x')
# thin dark outline at the reveal edge
for y in range(262,362): a[y,1719]=(24,14,10)
Image.fromarray(a).save('bar-edit2.png')
Image.fromarray(a).save(ROOT+'/public/art/bar.jpg',quality=88,optimize=True)
Image.fromarray(a).crop((1680,230,1840,420)).resize((640,760),Image.NEAREST).save('door-edit2.png')
