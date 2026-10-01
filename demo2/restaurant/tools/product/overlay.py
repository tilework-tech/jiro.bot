import json
from PIL import Image, ImageDraw
spec=json.load(open('/tmp/product/states.raw.json'))
for id,s in spec['states'].items():
    im=Image.open(f'/tmp/product/raw/{id}.png').convert('RGB'); d=ImageDraw.Draw(im)
    for h in s['hotspots']:
        x,y,w,hh=h['x']*1600,h['y']*1000,h['w']*1600,h['h']*1000
        d.rectangle([x,y,x+w,y+hh],outline=(255,0,255),width=2); d.text((x+2,y+hh+1),h['to'],fill=(255,0,255))
    im.save(f'/tmp/product/ov-{id}.png')
