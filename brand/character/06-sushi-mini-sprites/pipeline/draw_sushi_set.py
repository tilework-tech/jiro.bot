"""More sushi characters in the style of the traced gallery onigiri: ~60px native, 2px ink outline,
flat colors, round eyes, open D-smile with tongue, three blush strokes per cheek."""
from PIL import Image, ImageDraw
import math
OUT='/tmp/sprites/out'
INK=(28,28,32,255); WHITE=(255,255,255,255); RICE_SH=(238,238,243,255)
NORI=(58,58,62,255); PINK=(246,150,172,255); TONGUE=(242,140,165,255)
TUNA=(226,70,80,255); TUNA_HI=(240,110,118,255)
SALMON=(250,140,95,255); SALMON_ST=(255,215,190,255)
TAMAGO=(255,212,80,255); TAMAGO_HI=(255,236,150,255)
EBI=(255,130,110,255); EBI_ST=(255,236,228,255); EBI_TAIL=(235,90,80,255)
CUKE=(120,190,100,255); INARI=(224,160,72,255); INARI_SH=(198,132,52,255)
WASABI=(140,196,96,255); WASABI_SH=(110,168,74,255)
BG=(252,222,222,255); DOT=(255,242,242,255)
S=64

def new(): return Image.new('RGBA',(S,S),(0,0,0,0))
def dilate(m,n):
    for _ in range(n):
        out=m.copy(); W,H=m.size
        for y in range(H):
            for x in range(W):
                if m.getpixel((x,y))==0 and any(0<=x+dx<W and 0<=y+dy<H and m.getpixel((x+dx,y+dy)) for dx,dy in((1,0),(-1,0),(0,1),(0,-1))):
                    out.putpixel((x,y),255)
        m=out
    return m
def outline(im):
    a=im.split()[3]; ring=dilate(a,2)
    out=new(); out.paste(INK,(0,0),ring); out.alpha_composite(im); return out

def face(im,cx,fy):
    d=ImageDraw.Draw(im)
    for ex in (cx-15,cx+15): d.ellipse((ex-3,fy-3,ex+3,fy+3),fill=INK)
    mouth=Image.new('L',(S,S),0); dm=ImageDraw.Draw(mouth)
    dm.ellipse((cx-4,fy-4,cx+4,fy+6),fill=255); dm.rectangle((0,0,S,fy),fill=0)
    im.paste(INK,(0,0),mouth)
    for x,y in ((cx-2,fy+4),(cx-1,fy+4),(cx,fy+4),(cx+1,fy+4),(cx-1,fy+5),(cx,fy+5)): im.putpixel((x,y),TONGUE)
    for base in (cx-21,cx+14):
        for i in range(3):
            x=base+i*2; y=fy+6+i
            for k in range(3): im.putpixel((x+k,y-k),PINK)

def rice_slab(d):
    d.rounded_rectangle((8,40,55,58),radius=7,fill=WHITE)
    d.rounded_rectangle((8,52,55,58),radius=5,fill=RICE_SH)
    d.rectangle((8,48,55,53),fill=WHITE)

def tuna():
    im=new(); d=ImageDraw.Draw(im); rice_slab(d)
    d.rounded_rectangle((4,20,59,42),radius=9,fill=TUNA)
    d.line((14,23,49,23),fill=TUNA_HI,width=2)
    return im,32,29
def salmon():
    im=new(); d=ImageDraw.Draw(im); rice_slab(d)
    d.rounded_rectangle((4,20,59,42),radius=9,fill=SALMON)
    for x in (5,53):
        d.line((x,40,x+5,22),fill=SALMON_ST,width=2)
    d.line((29,40,33,34),fill=SALMON_ST,width=2)
    return im,32,29
def tamago():
    im=new(); d=ImageDraw.Draw(im); rice_slab(d)
    d.rounded_rectangle((6,18,57,42),radius=5,fill=TAMAGO)
    d.line((10,21,53,21),fill=TAMAGO_HI,width=2)
    d.rectangle((6,45,57,52),fill=NORI)
    return im,32,29
def ebi():
    im=new(); d=ImageDraw.Draw(im); rice_slab(d)
    d.polygon([(50,30),(62,22),(60,32),(62,42),(50,36)],fill=EBI_TAIL)
    d.rounded_rectangle((2,22,54,42),radius=10,fill=EBI)
    for x in (3,47):
        d.line((x,24,x+4,32),fill=EBI_ST,width=2); d.line((x+4,32,x,40),fill=EBI_ST,width=2)
    return im,30,30
def maki():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((4,4,59,59),fill=NORI); d.ellipse((9,9,54,54),fill=WHITE)
    d.rectangle((22,13,31,20),fill=TUNA); d.rectangle((32,13,41,20),fill=CUKE)
    d.rectangle((26,21,37,24),fill=TAMAGO)
    return im,32,33
def inari():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((14,10,49,30),fill=WHITE)
    for x in (18,30,41): d.ellipse((x,8,x+9,18),fill=WHITE)
    d.rounded_rectangle((6,18,57,58),radius=12,fill=INARI)
    d.rounded_rectangle((6,50,57,58),radius=8,fill=INARI_SH); d.rectangle((6,46,57,51),fill=INARI)
    d.polygon([(6,30),(57,30),(57,18),(6,18)],fill=INARI)
    d.line((12,22,51,22),fill=(240,186,100,255),width=2)
    return im,32,36
def temari():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((6,8,57,59),fill=WHITE)
    d.pieslice((6,8,57,59),180,360,fill=SALMON)
    d.ellipse((12,20,51,40),fill=WHITE)
    d.rectangle((6,34,57,40),fill=WHITE)
    for x in (12,30,46): d.line((x,30,x+4,14),fill=SALMON_ST,width=2)
    return im,32,40
def wasabi():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((4,22,59,70),fill=WASABI); d.rectangle((0,58,64,64),fill=(0,0,0,0))
    d.ellipse((14,14,36,34),fill=WASABI); d.ellipse((28,10,50,30),fill=WASABI); d.ellipse((34,20,56,36),fill=WASABI)
    d.rounded_rectangle((4,50,59,58),radius=4,fill=WASABI_SH); d.rectangle((4,46,59,51),fill=WASABI)
    # flatten bottom: cut below 58
    a=im.split()[3]
    for y in range(58,64):
        for x in range(64): im.putpixel((x,y),(0,0,0,0))
    return im,32,38

CHARS=[('tuna-nigiri',tuna),('salmon-nigiri',salmon),('tamago-nigiri',tamago),('ebi-nigiri',ebi),
       ('maki-roll',maki),('inari',inari),('temari',temari),('wasabi',wasabi)]

def on_bg(im,k):
    big=im.resize((im.width*k,im.height*k),Image.NEAREST)
    bg=Image.new('RGBA',big.size,BG); d=ImageDraw.Draw(bg); step=12*k
    for y in range(0,bg.height,step):
        for x in range(((y//step)%2)*(step//2),bg.width,step): d.ellipse((x,y,x+2*k,y+2*k),fill=DOT)
    bg.alpha_composite(big); return bg

if __name__=='__main__':
    CELL=72; sheet=Image.new('RGBA',(CELL*4,CELL*2),(0,0,0,0))
    for i,(name,fn) in enumerate(CHARS):
        im,cx,fy=fn(); im=outline(im); face(im,cx,fy)
        im.save(f'{OUT}/set-{name}-1x.png'); im.resize((S*8,S*8),Image.NEAREST).save(f'{OUT}/set-{name}-8x.png')
        sheet.alpha_composite(im,((i%4)*CELL+4,(i//4)*CELL+4))
    sheet.save(f'{OUT}/sushi-set-sheet-1x.png'); on_bg(sheet,6).save(f'{OUT}/sushi-set-sheet.png'); print('ok')
