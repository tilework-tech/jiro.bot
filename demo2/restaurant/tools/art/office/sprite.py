import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image
import numpy as np
X, Y, W = 1515, 700, 270
s = Image.open('/tmp/polish-office/spr1_key.png')
H = round(s.height * W / s.width)
sm = s.resize((W, H), Image.LANCZOS)
arr = np.array(sm).astype(float)
al = arr[..., 3]
arr[..., :3] *= 0.92
arr[..., 3] = np.where(al > 110, 255, 0)
# clip at the belt bed top
cut = 926 - Y
arr[cut:, :, 3] = 0
spr = Image.fromarray(arr.astype(np.uint8))
spr.save('/tmp/polish-office/spr_small.png')
bg = Image.open('/tmp/polish-office/bg2.png').convert('RGBA')
# soft contact shadow on the wall behind the desk
sh = Image.new('RGBA', bg.size, (0, 0, 0, 0))
sa = np.array(spr)[..., 3]
shadow = np.zeros((bg.height, bg.width, 4), np.uint8)
shadow[Y + 6:Y + 6 + sa.shape[0], X + 10:X + 10 + sa.shape[1], 3] = (sa * 0.45).astype(np.uint8)[: bg.height - Y - 6]
shadow[926:, :, 3] = 0
bg = Image.alpha_composite(bg, Image.fromarray(shadow))
bg.alpha_composite(spr, (X, Y))
bg = bg.convert('RGB')
bg.save('/tmp/polish-office/office_full.png')
bg.save(ROOT+'/public/art/office.jpg', quality=88, optimize=True)
bg.crop((1450, 650, 1850, 1000)).resize((800, 700), Image.NEAREST).save('/tmp/polish-office/c3.png')
print(H)
# Keep the text column low-contrast: dim the lamp spill above the desk.
a = np.array(Image.open('/tmp/polish-office/office_full.png')).astype(float)
yy, xx = np.mgrid[0:1080, 0:1920]
fy = np.clip((720 - yy) / 120, 0, 1)
fx = np.clip((xx - 1000) / 250, 0, 1)
a *= (1 - 0.3 * fy * fx)[..., None]
out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
out.save(ROOT+'/public/art/office.jpg', quality=88, optimize=True)
