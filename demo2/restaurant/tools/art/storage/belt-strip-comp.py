import sys
from PIL import Image, ImageDraw, ImageFilter
o=Image.open('orig.jpg').convert('RGB')
g=Image.open(sys.argv[1]).convert('RGB')
m=Image.new('L',(1920,1080),0)
d=ImageDraw.Draw(m)
L=lambda x:441+0.471*(x-440)+float(sys.argv[3])
poly=[(0,L(0)),(1180,L(1180)),(1180,1080),(0,1080)]
d.polygon(poly,fill=255)
m=m.filter(ImageFilter.GaussianBlur(4))
Image.composite(g,o,m).save(sys.argv[2])
