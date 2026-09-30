import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw
SRC=ROOT+'/public/items/'
OUT=ROOT+'/public/art/kitchen/'
INK=(42,24,18,255); PINK=(240,130,130,200); WHITE=(250,244,230,255)
# item: (face centre x, y, mood, ink)
F={'tuna':(66,104,'curious',INK),'salmon':(64,102,'happy',INK),'tamago':(44,104,'nervous',INK),
   'ikura':(78,120,'excited',WHITE),'ebi':(62,96,'smug',INK),'maki':(93,112,'curious',WHITE)}
def face(d,cx,cy,mood,ink,closed):
    ex=16
    for s in(-1,1):
        x=cx+s*ex
        if closed or mood=='happy':
            if closed and mood!='happy': d.rectangle([x-4,cy-1,x+3,cy+1],fill=ink)
            else: # ^ shape
                d.rectangle([x-5,cy,x-3,cy+1],fill=ink); d.rectangle([x-2,cy-2,x+1,cy-1],fill=ink); d.rectangle([x+2,cy,x+4,cy+1],fill=ink)
        else:
            h=11 if mood!='excited' else 12
            d.rectangle([x-4,cy-h//2,x+3,cy+h//2],fill=ink)
            d.rectangle([x-2,cy-h//2+1,x-1,cy-h//2+2],fill=(255,255,255,255) if ink==INK else (40,30,30,255))
    my=cy+10
    if mood=='curious': d.rectangle([cx-2,my,cx+1,my+3],fill=ink)
    elif mood=='happy': d.rectangle([cx-4,my,cx+3,my+1],fill=ink); d.rectangle([cx-2,my+2,cx+1,my+3],fill=ink)
    elif mood=='nervous':
        for i in range(4): d.rectangle([cx-6+i*3,my+(i%2)*2,cx-5+i*3,my+1+(i%2)*2],fill=ink)
        d.rectangle([cx+22,cy-10,cx+25,cy-4],fill=(140,200,255,230))
    elif mood=='excited': d.rectangle([cx-4,my,cx+3,my+4],fill=ink)
    elif mood=='smug': d.rectangle([cx-1,my+1,cx+5,my+2],fill=ink); d.rectangle([cx+5,my-1,cx+6,my],fill=ink)
    if ink==INK:
        for s in(-1,1): d.rectangle([cx+s*22-3,cy+4,cx+s*22+2,cy+6],fill=PINK)
for n,(cx,cy,mood,ink) in F.items():
    im=Image.open(SRC+n+'.png').convert('RGBA'); w,h=im.size
    sheet=Image.new('RGBA',(w*2,h))
    for k in(0,1):
        f=im.copy(); face(ImageDraw.Draw(f),cx,cy,mood,ink,k==1); sheet.paste(f,(k*w,0))
    sheet.save(OUT+'faq-'+n+'.png')
for n in['onigiri-happy','onigiri-sleepy']:
    im=Image.open(SRC+n+'.png').convert('RGBA'); w,h=im.size
    sheet=Image.new('RGBA',(w*2,h)); sheet.paste(im,(0,0)); sheet.paste(im,(w,0)); sheet.save(OUT+'faq-'+n+'.png')
# preview
names=list(F)+['onigiri-happy']
pv=Image.new('RGBA',(320*len(names),160),(60,40,30,255))
for i,n in enumerate(names):
    s=Image.open(OUT+'faq-'+n+'.png'); pv.alpha_composite(s,(i*320,160-s.size[1]))
pv.resize((pv.width,pv.height)).save('faces-preview.png')
