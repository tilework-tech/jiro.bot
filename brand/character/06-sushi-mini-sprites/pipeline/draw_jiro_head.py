"""Jiro head, clean front view, in the traced-onigiri pixel style (64x64, 2px ink outline, flat colors)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from draw_sushi_set import new, outline, on_bg, INK, WHITE, S, OUT
COPPER=(212,122,62,255); COPPER_SH=(164,86,42,255); COPPER_HI=(242,164,96,255); RIVET=(120,62,30,255)
CREAM=(247,233,206,255); CREAM_SH=(224,206,174,255)
BAND=(255,255,255,255); BAND_SH=(214,218,228,255)
BLUE=(52,160,236,255); CYAN=(150,228,255,255); GLOW=(90,190,245,255)
GRILLE=(104,92,80,255); NECK=(44,44,52,255)
KNOT=False

def head():
    im=new(); d=ImageDraw.Draw(im)
    d.rounded_rectangle((23,54,40,63),radius=3,fill=NECK)
    for ex in (3,51):
        d.ellipse((ex,33,ex+10,45),fill=COPPER); d.ellipse((ex+3,36,ex+7,42),fill=COPPER_SH)
    d.rounded_rectangle((8,30,55,56),radius=9,fill=COPPER)
    d.rounded_rectangle((8,49,55,56),radius=6,fill=COPPER_SH); d.rectangle((8,45,55,50),fill=COPPER)
    d.rounded_rectangle((14,31,49,58),radius=7,fill=CREAM)
    d.rounded_rectangle((14,52,49,58),radius=5,fill=CREAM_SH); d.rectangle((14,48,49,53),fill=CREAM)
    # dome, clipped at the band
    dome=new(); dd=ImageDraw.Draw(dome)
    dd.ellipse((7,2,56,46),fill=COPPER)
    panel=Image.new('L',(S,S),0); ImageDraw.Draw(panel).ellipse((13,6,50,44),fill=255)
    dome.paste(CREAM,(0,0),panel)
    dd.ellipse((24,7,39,13),fill=(255,247,228,255))
    for x,y in ((10,22),(53,22),(14,12),(49,12),(31,4),(9,17),(54,17)): dd.rectangle((x,y,x+1,y+1),fill=RIVET)
    clip=Image.new('L',(S,S),0); ImageDraw.Draw(clip).rectangle((0,0,S,29),fill=255)
    im.alpha_composite(Image.composite(dome,new(),clip))
    # hachimaki band with twist
    d.rounded_rectangle((5,26,58,33),radius=3,fill=BAND)
    for x in range(7,30,6): d.line((x,32,x+4,27),fill=BAND_SH,width=1)
    for x in range(33,56,6): d.line((x+4,32,x,27),fill=BAND_SH,width=1)
    if KNOT:
        d.line((59,31,62,47),fill=INK,width=5); d.line((56,31,52,45),fill=INK,width=5)
        d.line((59,31,62,47),fill=BAND,width=3); d.line((56,31,52,45),fill=BAND,width=3)
        d.ellipse((52,22,63,34),fill=INK); d.ellipse((53,23,62,33),fill=BAND); d.ellipse((56,26,59,29),fill=BAND_SH)
    # eyes
    for ex in (17,35):
        d.rounded_rectangle((ex,36,ex+11,45),radius=3,fill=INK)
        d.rounded_rectangle((ex+1,37,ex+10,44),radius=3,fill=BLUE)
        d.rounded_rectangle((ex+3,39,ex+8,42),radius=2,fill=CYAN)
        im.putpixel((ex+3,38),WHITE); im.putpixel((ex+4,38),WHITE)
    # speaker grille
    d.rounded_rectangle((25,50,38,55),radius=2,fill=GRILLE)
    for x in (27,30,33,36): d.line((x,51,x,54),fill=INK)
    if not KNOT:
        from PIL import ImageOps
        left=im.crop((0,0,32,64)); im.paste(ImageOps.mirror(left),(32,0))
    return im

if __name__=='__main__':
    im=outline(head())
    # mirror-check: enforce exact left-right symmetry
    from PIL import ImageOps
    assert im.tobytes()==ImageOps.mirror(im).tobytes(), 'not symmetric'
    im.save(f'{OUT}/jiro-head-1x.png'); im.resize((512,512),Image.NEAREST).save(f'{OUT}/jiro-head-8x.png')
    on_bg(im,8).save(f'{OUT}/jiro-head-8x-bg.png')
    # dark backdrop variant for Slack
    big=im.resize((512,512),Image.NEAREST); dark=Image.new('RGBA',(512,512),(30,32,38,255)); dark.alpha_composite(big); dark.save(f'{OUT}/jiro-head-8x-dark.png')
    print('ok')
