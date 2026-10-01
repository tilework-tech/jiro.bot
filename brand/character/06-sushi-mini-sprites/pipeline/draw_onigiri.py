import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import draw_sushi_sprites as D
from draw_sushi_sprites import INK, WHITE, RICE_SH, NORI, NORI_HI, BG, DOT, MOODS, px
OUT='/tmp/sprites/out'

import math
def hull_of_disks(d, disks, fill):
    pts=[]
    for (cx,cy,r) in disks:
        for i in range(96):
            a=2*math.pi*i/96; pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    pts=sorted(set(pts))
    def cross(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lower=[]
    for p in pts:
        while len(lower)>=2 and cross(lower[-2],lower[-1],p)<=0: lower.pop()
        lower.append(p)
    upper=[]
    for p in reversed(pts):
        while len(upper)>=2 and cross(upper[-2],upper[-1],p)<=0: upper.pop()
        upper.append(p)
    d.polygon(lower[:-1]+upper[:-1], fill=fill)

def body(S):
    im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    w=S
    hull_of_disks(d,[(S*0.5,S*0.30,S*0.24),(S*0.20,S*0.80,S*0.16),(S*0.80,S*0.80,S*0.16)],WHITE)
    # shade: a rim along the bottom-left edge (body minus body shifted up-right)
    t=max(1,S//20)
    a=im.split()[3]; shifted=Image.new('L',(S,S),0); shifted.paste(a,(t,-t))
    rim=Image.eval(a,lambda v:255 if v else 0)
    for y in range(S):
        for x in range(S):
            if a.getpixel((x,y)) and not shifted.getpixel((x,y)) and y>S*0.55: im.putpixel((x,y),RICE_SH)
    # nori cap: flat-topped rounded rectangle sitting on the apex
    nw=S*0.38; nh=S*0.27; ny=S*0.05
    d.rounded_rectangle((w*0.5-nw/2, ny, w*0.5+nw/2, ny+nh), radius=max(1,int(S*0.05)), fill=NORI)
    d.line((w*0.5-nw/2+2, ny+1, w*0.5+nw/2-2, ny+1), fill=NORI_HI)
    return im

def face_origin(S): return (12, 17)   # for the 32-grid face layer

def render(S, mood):
    im=D.outline(body(S))
    if S==32:
        D.face(im,*face_origin(32),mood); return im
    k=S//32
    fl=Image.new('RGBA',(32,32),(0,0,0,0)); D.face(fl,*face_origin(32),mood)
    fl=fl.resize((S,S),Image.NEAREST); im.alpha_composite(fl); return im

if __name__=='__main__':
    for S in (32,64):
        for m in MOODS:
            im=render(S,m)
            if m=='happy':
                im.save(f'{OUT}/onigiri-{S}.png'); D.upscale(im,512//S).save(f'{OUT}/onigiri-{S}-512.png')
        strip=Image.new('RGBA',(S*6,S),(0,0,0,0))
        for i,m in enumerate(MOODS): strip.alpha_composite(render(S,m),(i*S,0))
        strip.save(f'{OUT}/onigiri-{S}-moods.png'); D.upscale(strip,256//S).save(f'{OUT}/onigiri-{S}-moods-big.png')
    # sheet on the gallery backdrop, 64 version
    S=64; CELL=80
    sheet=Image.new('RGBA',(CELL*6,CELL),BG); d=ImageDraw.Draw(sheet)
    for y in range(0,sheet.height,16):
        for x in range(((y//16)%2)*8,sheet.width,16): d.rectangle((x,y,x+1,y+1),fill=DOT)
    for i,m in enumerate(MOODS): sheet.alpha_composite(render(S,m),(i*CELL+8,8))
    D.upscale(sheet,3).save(f'{OUT}/onigiri-sheet.png')
    print('ok')
