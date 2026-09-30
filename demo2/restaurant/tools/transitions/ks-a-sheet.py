import sys, glob
from PIL import Image, ImageDraw, ImageChops
ts = "0.001,0.14,0.28,0.42,0.56,0.7,0.85,0.9999".split(",")
ims = [Image.open(f"/tmp/ks-a/f-{t}.png").convert("RGB") for t in ts]
print("size", ims[0].size)
W, H = 960, 540
sheet = Image.new("RGB", (W * 2, H * 4), "black")
for i, (t, im) in enumerate(zip(ts, ims)):
    im = im.resize((W, H))
    ImageDraw.Draw(im).text((10, 10), f"t={t}", fill="white")
    sheet.paste(im, ((i % 2) * W, (i // 2) * H))
sheet.save("/tmp/ks-a/sheet.png")
for a, b in [("0.001", "kitchen"), ("0.9999", "storage")]:
    d = ImageChops.difference(Image.open(f"/tmp/ks-a/f-{a}.png").convert("RGB"), Image.open(f"/tmp/ks-a/{b}.png").convert("RGB"))
    print(a, b, "max diff", max(x[1] for x in d.getextrema()), "bbox", d.getbbox())
