import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageFilter
import numpy as np
src = Image.open('post2.png').convert('RGB').crop((100, 600, 1440, 2050))
a = np.array(src).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = (g > 150) & (g > r * 1.5) & (g > b * 1.5)
alpha = np.where(green, 0.0, 1.0)
# kill 2px fringe
al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))
alpha = np.array(al).astype(float) / 255
# grade: dark, near silhouette; warm left rim, cool right
H, W = alpha.shape
x = np.linspace(0, 1, W)[None, :]
rgb = a * 0.72
rgb[..., 0] *= 1 + 0.25 * np.clip(1 - x * 4, 0, 1)
rgb[..., 2] *= 1 + 0.35 * np.clip(x * 3 - 2, 0, 1)
rgb = rgb * 0.85 + np.array([10, 7, 6]) * 0.15
S = 0.8
PAD = 150
w, h = int(W * S), int(H * S)
pm = np.dstack([rgb * alpha[..., None], alpha * 255])
im = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), 'RGBA').resize((w, h), Image.LANCZOS)
canvas = Image.new('RGBA', (w + 2 * PAD, h), (0, 0, 0, 0))
canvas.paste(im, (PAD, 0))
# chunky pixel blur: blur at 1/B scale, upscale nearest
B = 6
cw, ch = canvas.size
lo = canvas.resize((cw // B, ch // B), Image.BOX).filter(ImageFilter.GaussianBlur(1.3))
hi = lo.resize((cw // B * B, ch // B * B), Image.NEAREST)
p = np.array(hi).astype(float)
al = p[..., 3:4] / 255
rgbu = np.where(al > 0.004, p[..., :3] / np.maximum(al, 1e-3), 0)
out = np.dstack([np.clip(rgbu, 0, 255), p[..., 3]]).astype(np.uint8)
Image.fromarray(out, 'RGBA').save(ROOT+'/public/art/tr/kitchen-storage-e/shelf.png', optimize=True)
print(hi.size, 'core', w, 'pad', PAD)
