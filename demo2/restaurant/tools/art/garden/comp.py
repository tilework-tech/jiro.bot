from PIL import Image
import numpy as np
O=np.asarray(Image.open('garden.orig.jpg').convert('RGB')).astype(float)
b=np.asarray(Image.open('b.png').convert('RGB').resize((2395,1026),Image.LANCZOS)).astype(float)
H,W=O.shape[:2]
out=O.copy()
Y0,Y1=380,425   # blend band
w=np.zeros((H,1,1)); w[:Y0]=1; w[Y0:Y1,0,0]=np.linspace(1,0,Y1-Y0)
out[:1026]=b*w[:1026]+O[:1026]*(1-w[:1026])
yy,xx=np.mgrid[0:H,0:W]
# darken plaster: light, low-saturation pixels in the wall band
mx=out.max(2); mn=out.min(2); sat=(mx-mn)/(mx+1)
band=((yy>=150)&(yy<400))
lum=out.mean(2)
ld=np.hypot((xx-1194)/1.0,(yy-296)/1.2)
m=band&(sat<0.28)&(lum>48)
k=np.clip((lum-48)/40,0,1)*m*np.clip((ld-38)/60,0,1)
tint=np.stack([out[...,0]*0.50,out[...,1]*0.56,out[...,2]*0.74],-1)
out=out*(1-k[...,None])+tint*k[...,None]
# top pavement strip: darken, desaturate reflections
top=yy<92
f=np.where(top,np.clip((92-yy)/20,0,1),0)[...,None]
pav=out*0.55+np.array([10,12,26])*0.45
out=out*(1-f)+pav*f
# restore gate interior
e=((xx-2004)/(180-12))**2+((yy-305)/(172-12))**2
g=np.clip((1-e)*12,0,1)[...,None]*(yy<560)[...,None]
out=out*(1-g)+O*g
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save('garden.new.jpg',quality=92)
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).crop((0,0,2395,700)).save('prev.png')
