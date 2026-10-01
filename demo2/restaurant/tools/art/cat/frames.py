from PIL import Image, ImageEnhance
import numpy as np
def grade(p):
    im=Image.open(p).convert('RGBA'); rgb=im.convert('RGB'); a=im.getchannel('A')
    rgb=ImageEnhance.Color(rgb).enhance(0.82); rgb=ImageEnhance.Brightness(rgb).enhance(0.78)
    return np.array(Image.merge('RGBA',(*rgb.split(),a))).copy()
base=grade('cat_k.png'); blink=grade('catb_k.png')
H,W=base.shape[:2]
tail=base.copy(); TY=74; TX=52
t=np.zeros_like(base); t[TY:, :TX]=base[TY:, :TX]; tail[TY:, :TX]=0
for y in range(TY,H):
    off=int(round(3*((y-TY)/(H-TY))**2))
    for x in range(TX):
        if t[y,x,3] and x+off<W: tail[y,x+off]=t[y,x]
# ear twitch: right ear tip (columns 96..W, rows above 24) nudged 1px right and down
ear=base.copy()
cols=slice(98,W); rows=slice(0,24)
reg=base[rows,cols].copy(); ear[rows,cols]=0
# restore what's not ear (head below y 24 untouched); paste shifted
sh=np.zeros_like(reg); sh[1:,1:]=reg[:-1,:-1]
m=sh[...,3]>0; sub=ear[rows,cols]; sub[m]=sh[m]
# fill holes left under the shifted ear from original where needed at row boundary
Image.fromarray(np.concatenate([base,blink,tail,ear],1),'RGBA').save('cat_sheet.png')
bg=Image.new('RGBA',(W*4,H),(40,25,18,255)); bg.alpha_composite(Image.open('cat_sheet.png')); bg.crop((0,0,W*4,60)).resize((W*4*3,180),Image.NEAREST).save('sheet_prev.png')
print(W,H)
