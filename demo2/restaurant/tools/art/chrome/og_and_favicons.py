# Reconstructed verbatim from the chrome-polish agent's inline commands (2026-09-29).
# Builds public/favicon-32.png, favicon.png (64), apple-touch-icon.png (180) from items/mini-jiro.png
# and public/og.jpg (1200x630 crop of art/bar.jpg + logo). Needs Silkscreen.ttf (Google Fonts, OFL):
#   curl -L -o /tmp/Silkscreen.ttf https://github.com/google/fonts/raw/main/ofl/silkscreen/Silkscreen-Regular.ttf
import os
ROOT = os.environ.get("RESTAURANT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))  # restaurant/
from PIL import Image, ImageDraw, ImageFont
FONT = os.environ.get("SILKSCREEN_TTF", "/tmp/Silkscreen.ttf")
os.chdir(ROOT + "/public")
j = Image.open('items/mini-jiro.png').convert('RGBA')
for s in (32, 64, 180):
    c = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    if s == 180: c = Image.new('RGBA', (s, s), (11, 10, 9, 255))
    w = int(s * (0.94 if s < 180 else 0.8)); h = int(w * 152 / 160)
    jj = j.resize((w, h), Image.LANCZOS if s >= 64 else Image.BOX)
    c.alpha_composite(jj, ((s - w) // 2, (s - h) // 2))
    c.save({32: 'favicon-32.png', 64: 'favicon.png', 180: 'apple-touch-icon.png'}[s])
bar = Image.open('art/bar.jpg').convert('RGB')
c = bar.crop((330, 0, 1770, 756)).resize((1200, 630), Image.LANCZOS).convert('RGBA')
g = Image.new('RGBA', (1200, 630), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
for y in range(630):
    a = max(0, (y - 330) / 300); d.line([(0, y), (1200, y)], fill=(11, 10, 9, int(235 * min(1, a) ** 1.3)))
c.alpha_composite(g)
j = Image.open('items/mini-jiro.png').convert('RGBA').resize((96, 91), Image.NEAREST)
c.alpha_composite(j, (48, 494))
d = ImageDraw.Draw(c)
f = ImageFont.truetype(FONT, 64); fb = ImageFont.truetype(FONT, 26)
def sh(xy, t, font, fill):
    d.text((xy[0], xy[1] + 4), t, font=font, fill=(0, 0, 0, 200)); d.text(xy, t, font=font, fill=fill)
sh((164, 494), 'jiro', f, (243, 230, 207, 255)); w = d.textlength('jiro', font=f)
sh((164 + w, 494), '.', f, (217, 138, 74, 255)); w2 = d.textlength('.', font=f)
sh((164 + w + w2, 494), 'bot', f, (243, 230, 207, 255))
sh((168, 566), 'your AI staff engineer  ·  by Nori', fb, (111, 220, 140, 255))
c.convert('RGB').save('og.jpg', quality=88)
