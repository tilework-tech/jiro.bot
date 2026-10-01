from PIL import Image, ImageDraw
import sys
ts=sys.argv[1:]
ims=[Image.open(f'/tmp/ks-f/f-{t}.png').resize((800,450)) for t in ts]
S=Image.new('RGB',(1600,(450+24)*((len(ims)+1)//2)),(0,0,0)); d=ImageDraw.Draw(S)
for i,(t,im) in enumerate(zip(ts,ims)):
  x,y=(i%2)*800,(i//2)*474; S.paste(im,(x,y+24)); d.text((x+6,y+6),'t='+t,fill=(255,255,255))
S.save('/tmp/ks-f/sheet.png')
