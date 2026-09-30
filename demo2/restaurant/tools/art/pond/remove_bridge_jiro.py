# Reconstructed from the round-2 agent: paste back only the bridge area of a Gemini edit
# ("Same image ... only change: the robot standing on the arched wooden bridge at the top right is removed").
import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw, ImageFilter
W = os.environ.get("WORK", "/tmp/street2")
o = Image.open(W + '/orig-pond.jpg').convert('RGB')
e = Image.open(W + '/pond-e1.png').convert('RGB').resize((1920, 1080), Image.LANCZOS)
m = Image.new('L', o.size, 0); ImageDraw.Draw(m).rectangle((1560, 0, 1730, 285), fill=255)
Image.composite(e, o, m.filter(ImageFilter.GaussianBlur(5))).save(ROOT + '/public/art/pond.jpg', quality=93)
