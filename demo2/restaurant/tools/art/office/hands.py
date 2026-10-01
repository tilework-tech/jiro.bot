# Reconstructed from the office-polish agent: the two typing-hand patches are plain crops of the composed
# office frame (office_full.png = output of sprite.py before the final lamp-spill dim). office.ts bobs them 2px.
import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image
im = Image.open(os.environ.get("OFFICE_FULL", "/tmp/polish-office/office_full.png"))
D = ROOT + '/public/art/office/'
im.crop((1656, 795, 1690, 821)).save(D + 'hand-r.png')
im.crop((1625, 811, 1656, 835)).save(D + 'hand-l.png')
