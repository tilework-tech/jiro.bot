"""Pixel copy of the second onigiri in Martin's reference gallery.
The silhouette is traced from the reference pixels; outline, nori, and face are repainted crisply."""
from PIL import Image, ImageDraw
OUT='/tmp/sprites/out'
INK=(28,28,32,255); WHITE=(255,255,255,255)
NORI=(58,58,62,255); PINK=(246,150,172,255); TONGUE=(242,140,165,255)
BG=(252,222,222,255); DOT=(255,242,242,255)
PAL={'bg':(252,222,222),'dot':(255,242,242),'ink':(28,28,32),'nori':(58,58,62),'curl':(100,100,106),'white':(255,255,255),'pink':(246,150,172),'wm':(240,205,205)}
BODY_CLASSES={'ink','nori','curl','white','pink'}

def trace_mask():
    im=Image.open('../../../reference/onigiri-faces-reference.png').convert('RGB'); w,h=im.size; cw=w/6; ch=h/5
    c=im.crop((int(cw*1)-4,0,int(cw*2)+4,int(ch)+6)); W,H=c.size
    near=lambda p:min(PAL,key=lambda k:sum((a-b)**2 for a,b in zip(p,PAL[k])))
    m=Image.new('L',(W,H),0)
    for y in range(H):
        for x in range(W):
            if near(c.getpixel((x,y))) in BODY_CLASSES: m.putpixel((x,y),255)
    # fill: keep only the largest blob rows 11..62 and close single-pixel gaps horizontally
    for y in range(H):
        xs=[x for x in range(W) if m.getpixel((x,y))]
        if y<12 or y>62 or not xs:
            for x in range(W): m.putpixel((x,y),0)
        else:
            if y==12: xs=[34,43]
            for x in range(xs[0],xs[-1]+1): m.putpixel((x,y),255)
    return m

def erode(m,n):
    for _ in range(n):
        out=m.copy(); W,H=m.size
        for y in range(H):
            for x in range(W):
                if m.getpixel((x,y)) and any(not(0<=x+dx<W and 0<=y+dy<H) or m.getpixel((x+dx,y+dy))==0 for dx,dy in((1,0),(-1,0),(0,1),(0,-1))):
                    out.putpixel((x,y),0)
        m=out
    return m

def render():
    body=trace_mask(); W,H=body.size
    inner=erode(body,2)
    im=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
    im.paste(INK,(0,0),body); im.paste(WHITE,(0,0),inner)
    # nori: x 28..51, down to row 33, clipped to the rice interior
    nori=Image.new('L',(W,H),0); dn=ImageDraw.Draw(nori); dn.rectangle((28,0,51,33),fill=255)
    nori=Image.composite(nori,Image.new('L',(W,H),0),inner); im.paste(NORI,(0,0),nori)
    # lifted bottom-right corner: dark wedge bounded by a shallow curve
    wedge=[(49,24),(48,25),(48,26),(47,27),(46,28),(45,29),(44,30),(42,31),(40,32),(40,33),(51,33),(51,24)]
    wm=Image.new('L',(W,H),0); ImageDraw.Draw(wm).polygon(wedge,fill=255)
    wm=Image.composite(wm,Image.new('L',(W,H),0),nori); im.paste(INK,(0,0),wm)
    # eyes: round, 7px, centers (24,43) and (54,43)
    for ex in (24,54): d.ellipse((ex-3,40,ex+3,46),fill=INK)
    # mouth: flat top at row 44, rounded bottom to row 49, x 35..43
    mouth=Image.new('L',(W,H),0); dm=ImageDraw.Draw(mouth)
    dm.ellipse((35,39,43,49),fill=255); dm.rectangle((0,0,W,43),fill=0)
    im.paste(INK,(0,0),mouth)
    for x,y in ((37,47),(38,47),(39,47),(40,47),(38,48),(39,48)): im.putpixel((x,y),TONGUE)
    # cheeks: three short "/" blush strokes per side
    for base in (18,53):
        for i in range(3):
            x=base+i*2; y=49+i
            im.putpixel((x,y),PINK); im.putpixel((x+1,y-1),PINK); im.putpixel((x+2,y-2),PINK)
    return im

def on_bg(im,k):
    big=im.resize((im.width*k,im.height*k),Image.NEAREST)
    bg=Image.new('RGBA',big.size,BG); d=ImageDraw.Draw(bg); step=12*k
    for y in range(0,bg.height,step):
        for x in range(((y//step)%2)*(step//2),bg.width,step): d.ellipse((x,y,x+2*k,y+2*k),fill=DOT)
    bg.alpha_composite(big); return bg

if __name__=='__main__':
    im=render()
    # trim to the body with a 4px margin
    bb=im.getbbox(); im=im.crop((bb[0]-4,bb[1]-4,bb[2]+4,bb[3]+4))
    im.save(f'{OUT}/onigiri-copy-1x.png'); print(im.size)
    im.resize((im.width*8,im.height*8),Image.NEAREST).save(f'{OUT}/onigiri-copy-8x.png')
    on_bg(im,8).save(f'{OUT}/onigiri-copy-8x-bg.png')
    ref=Image.open('/tmp/sprites/ref2-crop.png').convert('RGBA')
    mine=on_bg(im,8); cmp=Image.new('RGBA',(ref.width+mine.width+40,max(ref.height,mine.height)),BG)
    cmp.alpha_composite(ref,(0,0)); cmp.alpha_composite(mine,(ref.width+40,0)); cmp.save(f'{OUT}/_cmp.png'); print('ok')
