from PIL import Image, ImageDraw
ts=["0","0.15","0.3","0.45","0.55","0.7","0.85","0.9999"]
W,H=640,360
s=Image.new("RGB",(W*4+30,H*2+20),(20,20,20))
d=ImageDraw.Draw(s)
for i,t in enumerate(ts):
    im=Image.open(f"kitchen-storage@{t}.png").resize((W,H))
    x,y=(i%4)*(W+10),(i//4)*(H+10)
    s.paste(im,(x,y)); d.text((x+8,y+8),"t="+t,fill=(255,255,0))
s.save("sheet.png")
