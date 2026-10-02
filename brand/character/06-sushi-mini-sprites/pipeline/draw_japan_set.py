"""Non-food Japan characters in the traced-onigiri style (shares face/outline helpers with the sushi set)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import math
from draw_sushi_set import new, outline, face, on_bg, INK, WHITE, PINK, NORI, S, OUT
RED=(228,64,70,255); RED_SH=(196,44,56,255); GOLD=(246,196,70,255); GOLD_SH=(214,160,40,255)
CREAM=(255,246,228,255); SKIN=(255,230,208,255); HAIR=(34,32,38,255)
LANTERN=(248,120,70,255); LANTERN_RIB=(222,92,52,255)
FUJI=(96,132,196,255); FUJI_SH=(70,104,170,255); SNOW=(255,255,255,255)
KOI=(236,96,96,255); KOI_SC=(255,196,196,255); KOI_FIN=(210,70,80,255)
SAKURA=(250,176,196,255); SAKURA_SH=(238,140,168,255); STAMEN=(250,210,90,255)
PLATE_BLUE=(70,110,190,255); PLATE_RIM=(230,236,246,255)
TANUKI=(150,100,60,255); TANUKI_BELLY=(226,196,146,255); STRAW=(222,186,96,255); STRAW_SH=(190,150,70,255)
WOOD=(150,110,70,255)

def maneki():
    im=new(); d=ImageDraw.Draw(im)
    d.polygon([(8,22),(12,2),(24,14)],fill=WHITE); d.polygon([(55,22),(51,2),(39,14)],fill=WHITE)
    d.polygon([(11,18),(13,7),(21,14)],fill=PINK); d.polygon([(52,18),(50,7),(42,14)],fill=PINK)
    d.rounded_rectangle((12,42,51,60),radius=8,fill=WHITE)
    d.ellipse((4,8,59,50),fill=WHITE)
    d.rectangle((14,46,49,50),fill=RED); d.ellipse((28,47,36,55),fill=GOLD)
    d.ellipse((46,34,62,50),fill=WHITE); d.line((50,40,58,40),fill=(236,220,220,255),width=1)
    d.rounded_rectangle((20,52,43,60),radius=4,fill=GOLD); d.line((24,56,39,56),fill=GOLD_SH,width=1)
    return im,32,29
def daruma():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((5,4,58,62),fill=RED); d.rectangle((0,58,64,64),fill=(0,0,0,0))
    d.ellipse((5,36,58,62),fill=RED)
    for y in range(59,64):
        for x in range(64): im.putpixel((x,y),(0,0,0,0))
    d.ellipse((9,16,54,52),fill=CREAM)
    d.ellipse((24,54,39,60),fill=GOLD)
    return im,32,33
def lantern():
    im=new(); d=ImageDraw.Draw(im)
    d.rounded_rectangle((20,2,43,10),radius=3,fill=NORI); d.rounded_rectangle((20,54,43,60),radius=3,fill=NORI)
    d.ellipse((6,6,57,58),fill=LANTERN)
    for y in (14,20,26,38,44,50): d.line((8,y,55,y),fill=LANTERN_RIB,width=1)
    d.line((31,60,31,63),fill=RED); d.line((33,60,33,63),fill=RED)
    return im,32,31
def fuji():
    im=new(); d=ImageDraw.Draw(im)
    pts=[(0,60),(14,30),(26,8),(38,8),(50,30),(63,60)]
    d.polygon(pts,fill=FUJI)
    d.polygon([(0,60),(63,60),(63,56),(0,56)],fill=FUJI_SH)
    snow=[(22,18),(26,8),(38,8),(42,18),(40,24),(36,20),(32,26),(28,20),(24,24)]
    d.polygon(snow,fill=SNOW)
    d.ellipse((2,2,12,12),fill=RED)
    return im,32,41
def koinobori():
    im=new(); d=ImageDraw.Draw(im)
    d.polygon([(46,20),(63,12),(60,32),(63,52),(46,44)],fill=KOI_FIN)
    d.rounded_rectangle((2,16,52,48),radius=14,fill=KOI)
    body=Image.new('L',(S,S),0); ImageDraw.Draw(body).rounded_rectangle((4,18,50,46),radius=12,fill=255)
    sc=new(); ds=ImageDraw.Draw(sc)
    for cx in (44,52):
        for cy in (20,32,44): ds.ellipse((cx-5,cy-5,cx+5,cy+5),outline=KOI_SC,width=2)
    sc=Image.composite(sc,new(),body); im.alpha_composite(sc)
    d.ellipse((0,20,7,44),fill=KOI_FIN)
    d.polygon([(22,16),(30,6),(36,16)],fill=KOI_FIN); d.polygon([(22,48),(30,58),(36,48)],fill=KOI_FIN)
    return im,24,30
def sakura():
    im=new(); d=ImageDraw.Draw(im)
    for i in range(5):
        a=-math.pi/2+i*2*math.pi/5; cx=32+16*math.cos(a); cy=32+16*math.sin(a)
        d.ellipse((cx-13,cy-13,cx+13,cy+13),fill=SAKURA)
        nx=32+28*math.cos(a); ny=32+28*math.sin(a); d.ellipse((nx-3,ny-3,nx+3,ny+3),fill=(0,0,0,0))
    d.ellipse((18,18,45,45),fill=SAKURA)
    return im,32,34
def kokeshi():
    im=new(); d=ImageDraw.Draw(im)
    d.rounded_rectangle((16,40,47,61),radius=6,fill=RED)
    for x,y in ((22,48),(32,54),(40,46)): d.ellipse((x-2,y-2,x+2,y+2),fill=WHITE)
    d.ellipse((10,4,53,46),fill=SKIN)
    hair=Image.new('L',(S,S),0); dh=ImageDraw.Draw(hair); dh.ellipse((10,4,53,46),fill=255); dh.rectangle((0,22,64,64),fill=0)
    dh.polygon([(10,22),(18,22),(22,16),(26,22),(32,15),(38,22),(42,16),(46,22),(53,22),(53,30),(10,30)],fill=255)
    dh.rectangle((10,22,13,32),fill=255); dh.rectangle((50,22,53,32),fill=255)
    im.paste(HAIR,(0,0),hair)
    d.ellipse((26,2,37,9),fill=RED)
    return im,32,33
def uchiwa():
    im=new(); d=ImageDraw.Draw(im)
    d.rounded_rectangle((28,50,35,63),radius=2,fill=WOOD)
    d.ellipse((4,2,59,56),fill=RED); d.ellipse((9,7,54,51),fill=CREAM)
    return im,32,30
def plate():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((2,2,61,61),fill=PLATE_RIM); d.ellipse((5,5,58,58),fill=PLATE_BLUE); d.ellipse((10,10,53,53),fill=WHITE)
    for i in range(12):
        a=i*math.pi/6; x=31.5+25*math.cos(a); y=31.5+25*math.sin(a); d.ellipse((x-1,y-1,x+1,y+1),fill=WHITE)
    return im,32,33
def tanuki():
    im=new(); d=ImageDraw.Draw(im)
    d.ellipse((6,16,57,62),fill=TANUKI)
    for y in range(60,64):
        for x in range(64): im.putpixel((x,y),(0,0,0,0))
    d.ellipse((14,40,49,62),fill=TANUKI_BELLY); d.rectangle((0,60,64,64),fill=(0,0,0,0))
    d.polygon([(2,22),(32,4),(61,22)],fill=STRAW); d.rectangle((2,20,61,24),fill=STRAW_SH)
    d.ellipse((4,38,18,50),fill=TANUKI); d.ellipse((45,38,59,50),fill=TANUKI)
    return im,32,31

CHARS=[('maneki-neko',maneki),('daruma',daruma),('chochin-lantern',lantern),('mount-fuji',fuji),('koinobori',koinobori),
       ('sakura',sakura),('kokeshi',kokeshi),('uchiwa-fan',uchiwa),('sushi-plate',plate),('tanuki',tanuki)]

if __name__=='__main__':
    CELL=72; sheet=Image.new('RGBA',(CELL*5,CELL*2),(0,0,0,0))
    for i,(name,fn) in enumerate(CHARS):
        im,cx,fy=fn(); im=outline(im); face(im,cx,fy)
        im.save(f'{OUT}/jp-{name}-1x.png'); im.resize((S*8,S*8),Image.NEAREST).save(f'{OUT}/jp-{name}-8x.png')
        sheet.alpha_composite(im,((i%5)*CELL+4,(i//5)*CELL+4))
    sheet.save(f'{OUT}/japan-set-sheet-1x.png'); on_bg(sheet,5).save(f'{OUT}/japan-set-sheet.png'); print('ok')
