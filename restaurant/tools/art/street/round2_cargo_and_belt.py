# Reconstructed from the round-2 "Street vertical belt" agent. Input: orig-street.jpg (= street.jpg after the
# polish pass) and street-e1.png (Gemini edit: "Same image ... only changes: the round sushi conveyor loop on the
# cargo box is removed; the cargo box is a closed wooden box with copper trim ..."; see prompts/gemini-calls.md).
# 1) paste the cargo box region back (feather 6) 2) paint the steel belt backing strip x 1700-1780 with 8 brackets.
import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw, ImageFilter
W = os.environ.get("WORK", "/tmp/street2")
o = Image.open(W + '/orig-street.jpg').convert('RGB')
e = Image.open(W + '/street-e1.png').convert('RGB').resize((1920, 1080), Image.LANCZOS)
m = Image.new('L', o.size, 0); ImageDraw.Draw(m).rectangle((1368, 548, 1722, 868), fill=255)
im = Image.composite(e, o, m.filter(ImageFilter.GaussianBlur(6)))
d = ImageDraw.Draw(im)
X0, X1 = 1700, 1780
for y in range(0, 1080): d.line((X0, y, X1, y), fill=(22, 24, 36))
d.line((X0, 0, X0, 1080), fill=(10, 10, 16), width=2)
d.line((X1, 0, X1, 1080), fill=(10, 10, 16), width=2)
d.line((X0 + 2, 0, X0 + 2, 1080), fill=(70, 150, 170), width=1)   # cyan neon catch on left edge
d.line((X1 - 3, 0, X1 - 3, 1080), fill=(90, 60, 110), width=1)    # violet catch on right edge
for k in range(8):
    y = 60 + k * 140
    d.rectangle((X0 - 6, y, 1806, y + 9), fill=(38, 40, 54)); d.line((X0 - 6, y, 1806, y), fill=(96, 104, 128)); d.line((X0 - 6, y + 9, 1806, y + 9), fill=(8, 8, 12))
    for bx in (X0 - 2, X1 + 4, 1798):
        d.rectangle((bx, y + 3, bx + 3, y + 6), fill=(200, 130, 80))
im.save(ROOT + '/public/art/street.jpg', quality=93)
