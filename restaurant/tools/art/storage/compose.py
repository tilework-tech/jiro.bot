import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageFilter, ImageDraw
import numpy as np, json
R=ROOT
base=Image.open('/tmp/polish-storage/e2b_1080.png').convert('RGB')
A=np.asarray(base).astype(float)
H,W=A.shape[:2]
yy,xx=np.mgrid[0:H,0:W]
belt=lambda x: 441+0.471*(x-440)
# 1) deep shadow on the right, above the belt (copy block), and top strip
kx=np.clip((xx-1150)/300,0,1)            # 0 at 1150 -> 1 at 1450
above=np.clip((belt(xx)-40-yy)/60,0,1)     # only above the belt
dark=1-0.62*kx*above
top=1-0.35*np.clip((110-yy)/110,0,1)
A*= (dark*top)[...,None]
out=Image.fromarray(np.clip(A,0,255).astype(np.uint8))

# 2) sacks
cells=Image.open('/tmp/polish-storage/sack_cells.png')
c=np.asarray(cells).astype(int)
rice=(c[...,0]>185)&(c[...,1]>165)&(c[...,2]>130)&(c[...,3]>0)
along=(160,76); step=(-172,80); P0=(620,655)
rims=Image.new('RGBA',(W,H),(0,0,0,0))
holes=[]
sh=Image.new('L',(W,H),0); dsh=ImageDraw.Draw(sh)
placed=[]
for r in range(3):
  for i in range(3):
    mx=P0[0]+i*along[0]+r*step[0]; my=P0[1]+i*along[1]+r*step[1]
    s=0.96+0.04*r
    cw=round(cells.width*3.5*s); ch=round(cells.height*3.5*s)
    sp=cells.resize((cw,ch),Image.NEAREST)
    rm=Image.fromarray((rice*255).astype(np.uint8)).resize((cw,ch),Image.NEAREST)
    ra=np.asarray(rm)>0
    ys,xs=np.where(ra)
    mcx=(xs.min()+xs.max())/2; mcy=(ys.min()+ys.max())/2
    ox=round(mx-mcx); oy=round(my-mcy)
    placed.append((oy,ox,sp,ra,s,mx,my))
    # base shadow
    bx=ox+cw/2; by=oy+ch-6
    dsh.ellipse([bx-cw*0.55,by-ch*0.12,bx+cw*0.55,by+ch*0.12],fill=190)
sh=sh.filter(ImageFilter.GaussianBlur(10))
O=np.asarray(out).astype(float)
O*= (1-np.asarray(sh)/255*0.8)[...,None]
out=Image.fromarray(O.astype(np.uint8))
placed.sort(key=lambda p:p[0])
for oy,ox,sp,ra,s,mx,my in placed:
  a=np.asarray(sp).astype(float)
  d=np.hypot(mx-430,my-800)
  f=0.58+0.34*np.exp(-d*d/(2*380*380))
  hh=a.shape[0]; grad=np.linspace(1.0,0.72,hh)[:,None]
  a[...,:3]*=f*grad[...,None]
  spr=Image.fromarray(np.clip(a,0,255).astype(np.uint8),'RGBA')
  out.paste(spr,(ox,oy),spr)
  # front rim = sprite pixels below the rice's lower edge in rice columns
  alpha=np.asarray(sp)[...,3]>0
  front=np.zeros_like(alpha)
  cols=np.where(ra.any(0))[0]
  for x in cols:
    yb=np.where(ra[:,x])[0].max()
    front[yb+1:,x]=alpha[yb+1:,x]
  fa=a.copy(); fa[...,3]=np.where(front,255,0)
  fimg=Image.fromarray(np.clip(fa,0,255).astype(np.uint8),'RGBA')
  rims.alpha_composite(fimg,(ox,oy))
  cx=round(ox+(cols.min()+cols.max())/2)
  ybc=np.where(ra[:,int((cols.min()+cols.max())/2)])[0].max()+oy
  holes.append([cx, int(ybc+12+10)])
out.save('/tmp/polish-storage/storage_new.png')
out.save(R+'/public/art/storage.jpg',quality=88,optimize=True)
bb=rims.getbbox(); rims.crop(bb).save(R+'/public/art/storage/rims.png',optimize=True)
json.dump({'holes':holes,'rims_at':bb[:2]},open('/tmp/polish-storage/holes.json','w'))
print(holes,bb)
