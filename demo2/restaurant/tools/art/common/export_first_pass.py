# Reconstructed from the lead agent (2026-09-29 19:52): cover-crop each source still to 16:9 and export the
# initial 1920x1080 scene JPEGs (q90). bar = art/src/hero-v2-still.png, pond = art/src/pond.png (both from the
# scroll-flow-3d branch), the other six = art/first/<id>.png from pipeline/first_pass.tsv. Every scene was later
# re-edited by the polish agents, so re-running this OVERWRITES the final art; use it only to rebuild from scratch.
import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image
os.chdir(ROOT)
src = {'bar': 'art/src/hero-v2-still.png', 'pond': 'art/src/pond.png'}
for i in ['office', 'dining', 'kitchen', 'storage', 'yard', 'street']: src[i] = f'art/first/{i}.png'
for k, f in src.items():
    im = Image.open(f).convert('RGB')
    w, h = im.size; tw = int(h * 16 / 9)
    if tw <= w: im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
    else:
        th = int(w * 9 / 16); im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
    im = im.resize((1920, 1080), Image.LANCZOS); im.save(f'public/art/{k}.jpg', quality=90)
