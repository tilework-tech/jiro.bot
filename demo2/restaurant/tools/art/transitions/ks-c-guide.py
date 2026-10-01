from PIL import Image, ImageDraw
OX,OY=2640,1485
W,H=OX+1920,OY+1080
g=Image.new("RGB",(W,H),(0,0,0))
g.paste(Image.open("public/art/kitchen.jpg"),(0,0))
g.paste(Image.open("public/art/storage.jpg"),(OX,OY))
d=ImageDraw.Draw(g)
def chaikin(p,n):
    for _ in range(n):
        o=[p[0]]
        for i in range(len(p)-1):
            a,b=p[i],p[i+1]
            q=tuple(a[j]*.75+b[j]*.25 for j in range(3)); r=tuple(a[j]*.25+b[j]*.75 for j in range(3))
            if i>0:o.append(q)
            if i<len(p)-2:o.append(r)
        o.append(p[-1]);p=o
    return p
pts=chaikin([(1945,993,1.12),(2090,1036,1.12),(2260,1175,1.08),(2600,1515,1.0)],3)
xy=[(x,y) for x,y,s in pts]
d.line(xy,fill=(160,96,52),width=74)
d.line(xy,fill=(43,39,35),width=60)
# the hole at the bottom
d.rectangle((2560,1455,2660,1560),fill=(5,4,4))
g.save("/tmp/ks-c/guide_full.png")
g.resize((1920,round(1920*H/W))).save("/tmp/ks-c/guide.png")
print(W,H)
