"""Build public/art/tr/kitchen-storage-f/world.jpg (the kitchen>storage continuous-pan world).

world.jpg (4460x1966, 1 px = 1 kitchen stage px) = outpainted back-of-house corridor
+ the exact kitchen art at (0,0) + the exact storage art at (SX,SY) scaled SS, each feathered
40 px on its inner edges (the transition draws the live rooms over the same pixels with the
same feather, so the join is invisible only if these copies match the current room art).

Rebuild whenever public/art/kitchen.jpg or public/art/storage.jpg changes:
    /tmp/venv/bin/python tools/art/transitions/ks-f-build.py           # rebuild
    /tmp/venv/bin/python tools/art/transitions/ks-f-build.py --check   # report drift only

Corridor source, in order of preference:
  1. /tmp/ks-f/gen2.png (+ void-in/void-out.png): the original Gemini outpaint (regenerate it
     with ks-f-comp.py as the layout guide if the corridor itself must change).
  2. tools/art/transitions/ks-f-base.jpg: the committed corridor painting (a copy of the
     shipped world.jpg). Room rects are overwritten by the fresh room art, so this is enough
     for room repaints that keep the belt endpoints and the rooms' outer edges roughly the same.
If a repaint changes the rooms' edges a lot, re-outpaint the joins (option 1).
"""
import os, sys
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
import numpy as np
from PIL import Image, ImageFilter
R = ROOT + '/public/art/'
OUT = R + 'tr/kitchen-storage-f/world.jpg'
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ks-f-base.jpg')
W, H = 4460, 1966
SX, SY, SS = 2470, 846, 1.035
F = 40


def mask(w, h, edges, f):
  m = np.ones((h, w), np.float32)
  x = np.arange(w)[None, :]; y = np.arange(h)[:, None]
  if 'r' in edges: m = np.minimum(m, np.clip((w - 1 - x) / f, 0, 1))
  if 'b' in edges: m = np.minimum(m, np.clip((h - 1 - y) / f, 0, 1))
  if 'l' in edges: m = np.minimum(m, np.clip(x / f, 0, 1))
  if 't' in edges: m = np.minimum(m, np.clip(y / f, 0, 1))
  return Image.fromarray((m * 255).astype(np.uint8))


def rooms():
  k = Image.open(R + 'kitchen.jpg').convert('RGB')
  sw, sh = round(1920 * SS), round(1080 * SS)
  s = Image.open(R + 'storage.jpg').convert('RGB').resize((sw, sh), Image.LANCZOS)
  return k, s


def corridor_from_gen():
  gen = Image.open('/tmp/ks-f/gen2.png').convert('RGB')
  gw = round(4480 / 1.005); gh = round(gen.height * gw / gen.width)
  gen = gen.resize((gw, gh), Image.LANCZOS)
  P = 4
  gen = gen.resize((gw // P, gh // P), Image.BOX).quantize(colors=96, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB').resize((gw // P * P, gh // P * P), Image.NEAREST)
  c = Image.new('RGB', (W, H), (12, 9, 8))
  c.paste(gen.resize((gw, gh + 60), Image.LANCZOS).crop((0, 0, gw, gh + 60)), (6, 6))
  c.paste(gen, (6, 6))
  # Repainted shadow floor over the flat dark void below the corridor.
  vi = Image.open('/tmp/ks-f/void-in.png').convert('RGB'); vo = Image.open('/tmp/ks-f/void-out.png').convert('RGB').resize(vi.size, Image.LANCZOS)
  vo = vo.resize((vi.width // 4, vi.height // 4), Image.BOX).quantize(colors=64, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB').resize((vi.width // 4 * 4, vi.height // 4 * 4), Image.NEAREST)
  lum = np.asarray(vi).astype(np.float32).mean(2)
  vm = Image.fromarray(((lum < 34) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(10))
  c.paste(vo, (1100, 1060), vm.crop((0, 0, vo.width, vo.height)))
  band = c.crop((0, 1916 - 50, SX + 60, 1916)).transpose(Image.FLIP_TOP_BOTTOM); c.paste(band, (0, 1916))
  return c


def drift():
  """Mean abs difference between the baked room copies (inside the feather) and the current art."""
  w = np.asarray(Image.open(OUT).convert('RGB')).astype(int)
  k, s = rooms()
  k = np.asarray(k).astype(int); s = np.asarray(s).astype(int)
  dk = abs(w[F:1080 - F, F:1920 - F] - k[F:1080 - F, F:1920 - F]).mean()
  dy, dx = min(s.shape[0], w.shape[0] - SY), min(s.shape[1], w.shape[1] - SX)
  ds = abs(w[SY + F:SY + dy, SX + F:SX + dx] - s[F:dy, F:dx]).mean()
  return dk, ds


if '--check' in sys.argv:
  dk, ds = drift()
  print(f'kitchen drift {dk:.2f}  storage drift {ds:.2f}  (JPEG noise is ~1-3; above ~4 means rebuild)')
  sys.exit(0 if max(dk, ds) < 4 else 1)

if os.path.exists('/tmp/ks-f/gen2.png') and '--base' not in sys.argv:
  c = corridor_from_gen(); src = 'gen2 outpaint'
else:
  c = Image.open(BASE).convert('RGB'); src = os.path.relpath(BASE, ROOT)
k, s = rooms()
c.paste(k, (0, 0), mask(1920, 1080, 'rb', F))
c.paste(s, (SX, SY), mask(s.width, s.height, 'lt', F))
c = c.crop((0, 0, W, max(H, SY + s.height)))
c.save(OUT, quality=90)
print('corridor:', src, '->', os.path.relpath(OUT, ROOT), c.size)
dk, ds = drift()
print(f'drift after build: kitchen {dk:.2f} storage {ds:.2f}')
