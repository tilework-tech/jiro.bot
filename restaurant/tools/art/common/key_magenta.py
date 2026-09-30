#!/usr/bin/env python3
"""Key a Gemini sprite generated on flat magenta #FF00FF and downscale it to a crisp pixel sprite.

usage: key_magenta.py SRC.png OUT.png WIDTH

Same algorithm as tools/art/cat/key.py (the cleanest of the keyers used): magenta score min(r,b)-g > 60 is
background; the mask is eroded 2 px (MinFilter 5) to eat the anti-aliased fringe; remaining pinkish pixels
(b>g+25 and r>g+25) are dropped; the crop is premultiplied, BOX-downsampled to WIDTH, un-premultiplied and
alpha is thresholded at 128 (hard 1-bit edges). Other keyers in tools/art/** use the simpler rule
(r>170)&(b>170)&(g<110) plus a fringe rule (r-g>90)&(b-g>60..90).
"""
import runpy, sys, os
sys.argv = [os.path.join(os.path.dirname(__file__), "../cat/key.py")] + sys.argv[1:]
runpy.run_path(sys.argv[0], run_name="__main__")
