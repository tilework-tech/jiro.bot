#!/usr/bin/env python3
"""Copy the raw captures into the site: 256-colour palette PNGs (MEDIANCUT, no dither, optimize; 28-60 KB each)
plus states.json (indent=1). Reconstructed from the capture agent's inline step.
usage: export.py [RAW_DIR=/tmp/product/raw] [STATES=/tmp/product/states.raw.json]"""
import json, os, sys
from PIL import Image
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
raw = sys.argv[1] if len(sys.argv) > 1 else "/tmp/product/raw"
spec = json.load(open(sys.argv[2] if len(sys.argv) > 2 else "/tmp/product/states.raw.json"))
out_dir = os.path.join(ROOT, "public/ui/product"); os.makedirs(out_dir, exist_ok=True)
for id in spec["states"]:
    im = Image.open(f"{raw}/{id}.png").convert("RGB")
    q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out = f"{out_dir}/{id}.png"; q.save(out, optimize=True)
    print(id, os.path.getsize(out) // 1024, "KB")
json.dump(spec, open(f"{out_dir}/states.json", "w"), indent=1)
