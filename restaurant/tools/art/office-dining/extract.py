# Builds the animated-aquarium assets for office>dining from the original wall art:
# wall-empty.jpg (fish, bubbles, weeds removed by harmonic inpainting) + RGBA sprites.
import json, numpy as np
from PIL import Image
from scipy import ndimage as nd
D='/home/sprite/org/workspace/.local/jiro.bot/restaurant/public/art/tr/office-dining/'
src = np.asarray(Image.open(D+'wall.jpg').convert('RGB')).astype(float)
img = src.copy()

def harmonic(a, unknown, iters=1500):
    a = a.copy()
    # init unknown with mean of known neighbours ring
    k = ~unknown
    a[unknown] = a[k].mean(0) if k.any() else 0
    for _ in range(iters):
        p = np.pad(a, ((1,1),(1,1),(0,0)), mode='edge')
        avg = (p[:-2,1:-1]+p[2:,1:-1]+p[1:-1,:-2]+p[1:-1,2:])/4
        a[unknown] = avg[unknown]
    return a

def lum(a): return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11

FISH = {  # name: (x, y, w, h) padded boxes in image px
 'minnow1': (330, 572, 96, 50), 'koi2': (550, 564, 110, 130), 'gold1': (976, 567, 130, 101),
 'minnow2': (1082, 668, 96, 46), 'koi1': (440, 613, 110, 134), 'gold2': (564, 790, 125, 84),
 'puffer': (806, 695, 200, 180),
}
BUBBLES = [(962,517,23,23),(981,552,20,22),(801,557,15,15),(969,585,19,19),(1126,602,27,27),(827,610,36,34),
 (795,644,36,36),(1065,677,9,9),(413,681,14,15),(1063,689,9,9),(821,693,22,22),(1043,700,22,24),(1069,718,30,33),
 (653,731,15,15),(671,750,25,25),(1071,751,10,11),(439,773,22,23),(673,799,16,16),(429,814,34,35),(290,648,20,20),(1138,603,20,20)]
meta = {}
removed = np.zeros(src.shape[:2], bool)
for name,(x,y,w,h) in FISH.items():
    reg = src[y:y+h, x:x+w]
    unk = np.zeros((h,w),bool); unk[2:-2,2:-2] = True
    bg = harmonic(reg, unk, 800)
    d = np.sqrt(((reg-bg)**2).sum(-1))
    col = (reg[...,0] > reg[...,2]-5) | (lum(reg) > 150)   # warm or white = fish
    m = (d > 34) & (col | (lum(reg) < 55))
    m = nd.binary_closing(m, iterations=2)
    m = nd.binary_fill_holes(m)
    lab, n = nd.label(m); 
    if n: 
        sizes = nd.sum(m, lab, range(1,n+1)); m = lab == (1+int(np.argmax(sizes)))
    m = nd.binary_fill_holes(m)
    alpha = nd.binary_dilation(m, iterations=1)
    green = (reg[...,1] > reg[...,2]+8) & (reg[...,1] > reg[...,0]+18)
    if name == 'minnow2': alpha &= ~nd.binary_dilation(green, iterations=2)
    rgba = np.dstack([reg, alpha*255]).astype(np.uint8)
    ys, xs = np.where(alpha)
    y0,y1,x0,x1 = ys.min(), ys.max()+1, xs.min(), xs.max()+1
    Image.fromarray(rgba[y0:y1,x0:x1]).save(D+f'{name}.png')
    meta[name] = [int(x+x0), int(y+y0), int(x1-x0), int(y1-y0)]
    removed[y:y+h, x:x+w] |= nd.binary_dilation(m, iterations=6)
for (x,y,w,h) in BUBBLES:
    removed[y-2:y+h+2, x-2:x+w+2] = True
# Weeds: green + their dark outlines, inside the tank (water + gravel top).
TX0,TX1,TY0,TY1 = 248,1255,600,935
reg = src[TY0:TY1, TX0:TX1]
g = (reg[...,1] > reg[...,2]+8) & (reg[...,1] > reg[...,0]+18)
g = nd.binary_opening(g, iterations=1)
dark = lum(reg) < 70
wm = g | (nd.binary_dilation(g, iterations=2) & dark)
wm = nd.binary_closing(wm, iterations=1)
lab, n = nd.label(nd.binary_dilation(wm, iterations=4))
weeds = []
for i, s in enumerate(nd.find_objects(lab)):
    comp = (lab[s] == i+1) & wm[s]
    if comp.sum() < 400 or s[0].start+TY0 > 900: continue
    ys, xs = np.where(comp)
    y0,y1,x0,x1 = ys.min(), ys.max()+1, xs.min(), xs.max()+1
    sub = comp[y0:y1, x0:x1]
    alpha = nd.binary_dilation(sub, iterations=1)
    gy, gx = s[0].start+y0+TY0, s[1].start+x0+TX0
    rgba = np.dstack([src[gy:gy+sub.shape[0], gx:gx+sub.shape[1]], alpha*255]).astype(np.uint8)
    k = len(weeds)
    Image.fromarray(rgba).save(D+f'weed{k}.png')
    weeds.append([int(gx), int(gy), int(sub.shape[1]), int(sub.shape[0])])
    full = np.zeros(src.shape[:2], bool); full[gy:gy+sub.shape[0], gx:gx+sub.shape[1]] = alpha
    removed |= nd.binary_dilation(full, iterations=5) & (np.arange(src.shape[0])[:,None] < 905)
meta['weeds'] = weeds
# Inpaint removed pixels, but only inside the water box (never frame / gravel).
box = np.zeros_like(removed); box[505:905, 246:1258] = True
removed &= box
Y0,Y1,X0,X1 = 500, 910, 240, 1262
sub = img[Y0:Y1, X0:X1]
sub = harmonic(sub, removed[Y0:Y1, X0:X1], 3000)
# a little texture so the fill is not glassy
rng = np.random.default_rng(1)
noise = rng.normal(0, 2.2, sub.shape[:2])[..., None]
r = removed[Y0:Y1, X0:X1]
sub[r] += noise[r]
img[Y0:Y1, X0:X1] = sub
Image.fromarray(np.clip(img,0,255).astype(np.uint8)).save(D+'wall-empty.jpg', quality=93)
Image.fromarray((removed*255).astype(np.uint8)).save('/tmp/od/removed.png')
print(json.dumps(meta))
