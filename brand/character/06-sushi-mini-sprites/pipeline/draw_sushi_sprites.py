from PIL import Image, ImageDraw
import os
OUT='/tmp/sprites/out'; os.makedirs(OUT, exist_ok=True)
S=32
INK=(58,52,56,255); WHITE=(255,255,255,255); RICE_SH=(222,222,230,255)
NORI=(46,48,52,255); NORI_HI=(74,78,86,255)
SALMON=(247,142,98,255); SALMON_SH=(224,112,74,255); SALMON_ST=(255,214,190,255)
TAMAGO=(255,214,92,255); TAMAGO_SH=(236,186,60,255); TAMAGO_HI=(255,236,150,255)
CUKE=(120,190,100,255); TUNA=(236,96,96,255); EGG=(255,214,92,255)
PINK=(238,80,120,255); BLUSH=(255,170,185,255); ZZZ=(120,140,220,255)
BG=(252,222,222,255); DOT=(255,240,240,255)

def new(): return Image.new('RGBA',(S,S),(0,0,0,0))
def px(im,x,y,c):
    if 0<=x<S and 0<=y<S: im.putpixel((x,y),c)

def outline(im):
    src=im.copy(); out=im.copy()
    for y in range(S):
        for x in range(S):
            if src.getpixel((x,y))[3]==0:
                if any(0<=x+dx<S and 0<=y+dy<S and src.getpixel((x+dx,y+dy))[3]>0 for dx,dy in((1,0),(-1,0),(0,1),(0,-1))):
                    out.putpixel((x,y),INK)
    return out

# ---------- bodies ----------
def body_salmon():
    im=new(); d=ImageDraw.Draw(im)
    # rice
    d.rounded_rectangle((5,17,26,28),radius=4,fill=WHITE)
    d.rectangle((6,25,25,28),fill=RICE_SH); d.rounded_rectangle((5,17,26,28),radius=4,outline=None)
    # fix rice bottom corners shading rounded
    for x in (5,26): px(im,x,28,(0,0,0,0)); px(im,x,27,(0,0,0,0)); px(im,x,17,(0,0,0,0))
    for x in (6,25): px(im,x,28,(0,0,0,0)); px(im,x,17,(0,0,0,0)) 
    # fish slab
    d.rounded_rectangle((3,8,28,19),radius=5,fill=SALMON)
    d.rectangle((4,17,27,19),fill=SALMON_SH); 
    for x in (3,28): px(im,x,19,(0,0,0,0)); px(im,x,18,(0,0,0,0)); px(im,x,8,(0,0,0,0)); px(im,x,9,(0,0,0,0))
    for x in (4,27): px(im,x,19,(0,0,0,0)); px(im,x,8,(0,0,0,0))
    px(im,5,19,(0,0,0,0)); px(im,26,19,(0,0,0,0))
    # salmon stripes (diagonal cream)
    for sx,sy,n in ((5,10,3),(23,10,4),(6,14,2),(25,14,2)):
        for i in range(n):
            px(im,sx+i,sy+i,SALMON_ST)
    # highlight
    px(im,5,9,(255,190,160,255)); px(im,6,9,(255,190,160,255))
    for x in range(5,27): px(im,x,19,INK)
    return im, (10,11)   # face origin

def body_tamago():
    im=new(); d=ImageDraw.Draw(im)
    d.rounded_rectangle((5,17,26,28),radius=4,fill=WHITE)
    d.rectangle((6,25,25,28),fill=RICE_SH)
    for x in (5,26): px(im,x,28,(0,0,0,0)); px(im,x,27,(0,0,0,0)); px(im,x,17,(0,0,0,0))
    for x in (6,25): px(im,x,28,(0,0,0,0)); px(im,x,17,(0,0,0,0))
    d.rounded_rectangle((4,7,27,19),radius=3,fill=TAMAGO)
    d.rectangle((5,17,26,19),fill=TAMAGO_SH)
    for x in (4,27): px(im,x,19,(0,0,0,0)); px(im,x,7,(0,0,0,0))
    d.line((6,8,25,8),fill=TAMAGO_HI)
    # egg layer lines
    for y in (11,14): 
        px(im,25,y,TAMAGO_SH); px(im,24,y,TAMAGO_SH)
    for x in range(5,27): px(im,x,19,INK)
    # nori belt on the right third
    d.rectangle((20,6,24,28),fill=NORI)
    d.line((21,7,21,27),fill=NORI_HI)
    return im, (7,10)

def body_maki():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((4,4,27,27),fill=NORI)          # nori ring
    d.ellipse((6,6,25,25),fill=WHITE)         # rice
    d.ellipse((6,19,25,26),fill=RICE_SH)      # shade bottom
    d.ellipse((7,7,24,24),fill=WHITE)         # fix
    d.ellipse((7,18,24,25),fill=RICE_SH)
    d.ellipse((8,8,23,23),fill=WHITE)
    # keep a soft rice shade crescent at bottom
    for x in range(9,23): px(im,x,23,RICE_SH)
    for x in range(10,22): px(im,x,24,RICE_SH)
    # filling at top center: tuna, cucumber, tamago
    d.rectangle((12,8,15,11),fill=TUNA); d.rectangle((16,8,19,11),fill=CUKE)
    d.rectangle((13,12,18,13),fill=EGG)
    px(im,12,8,WHITE); px(im,19,8,WHITE)
    # nori highlight
    for x,y in ((7,10),(8,9),(9,8)): px(im,x,y,NORI_HI)
    return im, (11,15)

# ---------- faces ----------
def eye(im,x,y,c=INK):
    for dx in (0,1):
        for dy in (0,1,2): px(im,x+dx,y+dy,c)
def closed(im,x,y,c=INK):
    for dx in (-1,0,1,2): px(im,x+dx,y+1,c)
def closed_happy(im,x,y,c=INK):
    px(im,x-1,y+1,c); px(im,x,y,c); px(im,x+1,y,c); px(im,x+2,y+1,c)
def heart(im,x,y,c=PINK):
    for dx,dy in ((0,0),(2,0),(-1,1),(0,1),(1,1),(2,1),(3,1),(0,2),(1,2),(2,2),(1,3)): px(im,x+dx,y+dy,c)
def cheeks(im,fx,fy,c=BLUSH):
    for dx in (-3,-2,10,11): px(im,fx+dx,fy+3,c)
def mouth_smile(im,x,y,c=INK): px(im,x-1,y,c); px(im,x,y+1,c); px(im,x+1,y,c)
def mouth_o(im,x,y,c=INK):
    for dx,dy in ((0,0),(1,0),(-1,1),(2,1),(0,2),(1,2)): px(im,x+dx,y+dy,c)
def mouth_flat(im,x,y,c=INK): px(im,x-1,y,c); px(im,x,y,c); px(im,x+1,y,c)
def mouth_cat(im,x,y,c=INK): px(im,x-2,y,c); px(im,x-1,y+1,c); px(im,x,y,c); px(im,x+1,y+1,c); px(im,x+2,y,c)
def zee(im,x,y,c=ZZZ,big=True):
    pts=((0,0),(1,0),(2,0),(3,0),(2,1),(1,2),(0,3),(1,3),(2,3),(3,3)) if big else ((0,0),(1,0),(2,0),(1,1),(0,2),(1,2),(2,2))
    for dx,dy in pts: px(im,x+dx,y+dy,c)
def drop(im,x,y,c=ZZZ):
    for dx,dy in ((0,0),(-1,1),(0,1),(1,1),(-1,2),(0,2),(1,2),(0,3)): px(im,x+dx,y+dy,c)

def face(im,fx,fy,mood,ink=INK,blush=BLUSH):
    lx,rx=fx,fx+7; my=fy+4; mx=fx+4
    if mood=='happy':
        eye(im,lx,fy,ink); eye(im,rx,fy,ink); mouth_smile(im,mx,my,ink); cheeks(im,fx,fy,blush)
    elif mood=='wink':
        closed_happy(im,lx,fy,ink); eye(im,rx,fy,ink); mouth_cat(im,mx,my,ink); cheeks(im,fx,fy,blush)
    elif mood=='love':
        heart(im,lx-1,fy-1,PINK); heart(im,rx-1,fy-1,PINK); mouth_smile(im,mx,my,ink); cheeks(im,fx,fy,blush)
    elif mood=='sleepy':
        closed(im,lx,fy,ink); closed(im,rx,fy,ink); px(im,mx,my,ink); px(im,mx+1,my,ink)
        zee(im,rx+3,fy-6); zee(im,rx+8,fy-9,big=False)
    elif mood=='angry':
        eye(im,lx,fy+1,ink); eye(im,rx,fy+1,ink)
        px(im,lx-1,fy-1,ink); px(im,lx,fy-1,ink); px(im,lx+1,fy,ink); px(im,lx+2,fy,ink)
        px(im,rx+2,fy-1,ink); px(im,rx+1,fy-1,ink); px(im,rx,fy,ink); px(im,rx-1,fy,ink)
        mouth_flat(im,mx,my+1,ink)
    elif mood=='shocked':
        for ex in (lx-1,rx):
            for dx in range(3):
                for dy in range(3): px(im,ex+dx,fy+dy,ink)
            px(im,ex+1,fy+1,WHITE)
        mouth_o(im,mx-1,my,ink)
        drop(im,rx+6,fy-4)

MOODS=['happy','wink','love','sleepy','angry','shocked']
CHARS=[('salmon-nigiri',body_salmon,INK,BLUSH),('tamago-nigiri',body_tamago,INK,BLUSH),('maki-roll',body_maki,INK,BLUSH)]

def render(char,mood):
    name,fn,ink,blush=char
    im,(fx,fy)=fn()
    im=outline(im)
    face(im,fx,fy,mood,ink,blush)
    return im

def upscale(im,k): return im.resize((im.width*k,im.height*k),Image.NEAREST)

if __name__=='__main__':
    K=8; CELL=40
    sheet=Image.new('RGBA',(CELL*6,CELL*3),BG)
    d=ImageDraw.Draw(sheet)
    for y in range(0,sheet.height,8):
        for x in range(((y//8)%2)*4,sheet.width,8): d.point((x,y),DOT)
    for ci,ch in enumerate(CHARS):
        for mi,m in enumerate(MOODS):
            im=render(ch,m)
            sheet.alpha_composite(im,(mi*CELL+4,ci*CELL+4))
            if m=='happy':
                im.save(f'{OUT}/{ch[0]}-32.png'); upscale(im,K).save(f'{OUT}/{ch[0]}-256.png')
        # per-character strip
        strip=Image.new('RGBA',(S*6,S),(0,0,0,0))
        for mi,m in enumerate(MOODS): strip.alpha_composite(render(ch,m),(mi*S,0))
        strip.save(f'{OUT}/{ch[0]}-moods-32.png'); upscale(strip,K).save(f'{OUT}/{ch[0]}-moods-256.png')
    sheet.save(f'{OUT}/sushi-sprites-sheet-1x.png'); upscale(sheet,6).save(f'{OUT}/sushi-sprites-sheet.png')
    print('ok')
