import numpy as np
from PIL import Image
from scipy import ndimage as nd
R='/home/sprite/org/workspace/.local/jiro.bot/restaurant/public/art/'
X0,Y0,W,H=1206,404,74,42
art=np.asarray(Image.open(R+'street.jpg').convert('RGB')).astype(int)
c=art[Y0:Y0+H,X0:X0+W]
r,g,b=c[...,0],c[...,1],c[...,2]
# eye = blue-dominant pixels (cyan core + dark-blue rim)
eye=(b>r+25)&(b>g-10)&(b>70)
lab,n=nd.label(eye); sizes=nd.sum(eye,lab,range(1,n+1))
keep=[i+1 for i,s in enumerate(sizes) if s>40]
eye=np.isin(lab,keep)
eye=nd.binary_closing(eye,iterations=1)
eyeD=nd.binary_dilation(eye,iterations=4) & (((r+g+b)>390)|(b>r-12)|eye)
print('components',len(keep),[ (np.nonzero(lab==k)[1].min()+X0,np.nonzero(lab==k)[1].max()+X0,np.nonzero(lab==k)[0].min()+Y0,np.nonzero(lab==k)[0].max()+Y0) for k in keep])
# faceplate without eyes: each row filled with the median cream of that row
bare=c.copy().astype(float)
cream=(r>170)&(g>150)&(b>120)&(r>b)&~eyeD
for y in range(H):
    xs=np.nonzero(cream[max(0,y-1):y+2].any(0))[0]
    row=c[max(0,y-1):y+2][:, xs].reshape(-1,3)
    row=row[(row[:,0]>170)&(row[:,1]>150)&(row[:,2]>120)]
    if len(row): bare[y,eyeD[y]]=np.median(row,0)
def out(img,name):
    diff=np.abs(img-c).sum(2)>6
    o=np.zeros((H,W,4),np.uint8); o[...,:3]=np.clip(img,0,255).astype(np.uint8); o[...,3]=diff*255
    Image.fromarray(o).save(R+'street/'+name)
def moved(dx,dy):
    img=bare.copy()
    ys,xs=np.nonzero(eyeD)
    for y,x in zip(ys,xs):
        yy,xx=y+dy,x+dx
        if 0<=yy<H and 0<=xx<W: img[yy,xx]=c[y,x]
    return img
out(moved(4,0),'glance.png')
out(moved(0,-4),'lookup.png')
# blink: closed lid = 3px dark bar across each eye at its vertical centre, soft cyan underline
img=bare.copy()
for k in keep:
    ys,xs=np.nonzero(lab==k)
    y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
    m=(y0+y1)//2+2
    img[m-1:m+1,x0+1:x1]=[40,46,58]
    img[m+1,x0+2:x1-1]=[88,170,196]
out(img,'blink.png')
