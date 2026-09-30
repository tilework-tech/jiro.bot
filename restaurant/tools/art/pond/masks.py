# Generates public/art/pond/{water,grass}.png: art-grid-aligned alpha masks for the pond overlays.
from cells import *
from scipy import ndimage
from PIL import ImageDraw
OUT='/home/sprite/org/workspace/.local/jiro.bot/restaurant/public/art/pond/'
import os; os.makedirs(OUT,exist_ok=True)
C=cellcolor(); r,g,b=C[...,0],C[...,1],C[...,2]
lum=(r+g+b)/3
water=((b-r>18)&(b-g>8)) | ((lum>120)&(b>100)&(r<240)&(np.abs(r-b)<80)&(g>150))
water=ndimage.binary_opening(water,iterations=1)|((b-r>30)&(b-g>15))
# grass: yellow-green, not blue
grass=(g>b+12)&(r>b)&(lum>40)&(g>0.8*r)&(lum<170)
banks=Image.new('L',(1920,1080),0); d=ImageDraw.Draw(banks)
for poly in [
  [(0,700),(150,720),(300,790),(420,880),(500,980),(520,1080),(0,1080)],
  [(1560,760),(1700,690),(1920,620),(1920,1080),(1620,1080),(1540,990),(1540,900)],
  [(860,40),(1000,0),(1380,0),(1400,120),(1380,250),(1250,285),(1080,285),(980,260),(880,200)],
  [(1640,0),(1920,0),(1920,120),(1700,80)],
]: d.polygon(poly,fill=255)
B=np.asarray(banks)
def to_stage(M):
    ys=np.arange(1080); xs=np.arange(1920)
    ci=np.floor((xs+0.5-GX)/P).astype(int)+1; cj=np.floor((ys+0.5-GY)/P).astype(int)+1
    return M[np.clip(cj,0,M.shape[0]-1)][:,np.clip(ci,0,M.shape[1]-1)]
W=to_stage(water); G=to_stage(grass)&(B>0)
Image.fromarray((W*255).astype(np.uint8)).save('/tmp/pond/water_dbg.png')
def save(M,name):
    im=np.zeros((1080,1920,4),np.uint8); im[...,:3]=255; im[...,3]=M*255
    Image.fromarray(im,'RGBA').save(OUT+name,optimize=True)
save(W,'water.png'); save(G,'grass.png')
art=Image.open('/home/sprite/org/workspace/.local/jiro.bot/restaurant/public/art/pond.jpg').convert('RGB')
ov=np.asarray(art).copy(); ov[W]=(ov[W]*0.4+np.array([255,0,0])*0.6).astype(np.uint8); ov[G]=(ov[G]*0.4+np.array([0,255,255])*0.6).astype(np.uint8)
Image.fromarray(ov).resize((960,540)).save('/tmp/pond/mask_ov.png')
# Reed clumps sway (pond.ts REEDS): keep the wind sheen off them.
G2=G.copy()
for (x0,y0,x1,y1) in [(836,64,1100,318),(1255,140,1365,335),(0,520,195,745),(275,700,505,935),(1598,612,1725,782),(1622,370,1728,470)]:
    G2[y0:y1,x0:x1]=False
save(G2,'grass.png')
