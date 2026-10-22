"""Writes index.html: the jiro.bot design screenshots cut into sections, with the scroll buddy on top.

Run from anywhere: python3 make.py. Coordinates are source-image pixels.
"""
import html
import pathlib

HERE = pathlib.Path(__file__).parent
FIGMA = ("figma-2026-10-19.png", 1280, 1068, 32, 1190)
REVIEW = ("review-2026-10-14.png", 1285, 3912, 60, 1180)

HOVERS = "Yes, the bite mark is on purpose.|Still here. Still reviewing.|I read over your shoulder. Kindly.|No lorem ipsum on my watch.|Tickles. Back to work."

# (id, image, y0, y1, label, attrs, hotspots[(id, x0, y0, x1, y1, tag)])
SECTIONS = [
    ("nav", FIGMA, 41, 95, "Navigation", {}, []),
    ("hero", FIGMA, 95, 627, "The tasteful software engineer",
     {"comment": "Hi, I'm Jiro.", "side": "left"}, []),
    ("ditch", FIGMA, 627, 1051, "Ditch D*vin. Forget F*ctory. Stop slopping around.",
     {"comment": "I censored them myself. Professional courtesy.", "mood": "eager",
      "look": "#censor-devin", "side": "left"},
     [("censor-devin", 236, 718, 420, 790, "div")]),
    ("video", REVIEW, 686, 1277, "Most agents optimize for output",
     {"comment": "Fewer lines. Same fix. You're welcome.", "look": "#video-frame", "side": "right"},
     [("video-frame", 102, 898, 1201, 1239, "div")]),
    ("pillars", REVIEW, 1277, 1408, "Quality over volume, missteps caught early, called in",
     {"comment": "The cheapest bug is the one I flag before the PR.", "side": "right"}, []),
    ("how", REVIEW, 1408, 1887, "How he works",
     {"comment": "Plain words are fine. I'll ask if it's unclear.", "side": "left"}, []),
    ("pricing", REVIEW, 1887, 2374, "Pricing: Not market price",
     {"comment": "Thirty days on the house. Pull up a stool?", "ask": "Yes please",
      "action": "#email", "perch": "#pricing-title"},
     [("pricing-title", 88, 1934, 380, 1988, "div")]),
    ("bakeoff", REVIEW, 2374, 3035, "Cloud Agent Bakeoff",
     {"comment": "The green column is mine. Biased, but sourced.", "look": "#col-jiro", "side": "right"},
     [("col-jiro", 288, 2514, 586, 2996, "div")]),
    ("faq", REVIEW, 3035, 3554, "FAQ and reserve a seat",
     {"comment": "Yes, you can bring your current subscription.", "side": "right"},
     [("email", 898, 3256, 1213, 3294, "input")]),
    ("footer", REVIEW, 3554, 3852, "Built by the Nori team", {}, []),
]


def pct(n):
    return f"{n:.4f}%"


def section(sid, image, y0, y1, label, attrs, hotspots):
    src, img_w, _, x0, w = image
    h = y1 - y0
    data = "".join(f' data-jiro-{k}="{html.escape(v)}"' for k, v in attrs.items())
    spots = []
    for hid, hx0, hy0, hx1, hy1, tag in hotspots:
        style = (f"left:{pct((hx0 - x0) / w * 100)};top:{pct((hy0 - y0) / h * 100)};"
                 f"width:{pct((hx1 - hx0) / w * 100)};height:{pct((hy1 - hy0) / h * 100)}")
        if tag == "input":
            spots.append(f'<input id="{hid}" class="spot spot--input" type="email" aria-label="Work email" style="{style}">')
        else:
            spots.append(f'<div id="{hid}" class="spot" style="{style}"></div>')
    img_style = (f"width:{pct(img_w / w * 100)};margin-left:{pct(-x0 / w * 100)};"
                 f"margin-top:{pct(-y0 / w * 100)}")
    return (f'    <section id="{sid}" class="shot" aria-label="{html.escape(label)}" style="aspect-ratio:{w}/{h}"{data}>\n'
            f'      <img src="{src}" alt="" style="{img_style}">\n'
            + "".join(f"      {s}\n" for s in spots)
            + "    </section>\n")


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>jiro.bot · design screenshots + Jiro scroll buddy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../jiro-buddy.css">
<style>
  html, body { margin: 0; background: #f7f8f6; }
  .page { max-width: 1190px; margin: 0 auto; padding: 24px 16px 48px; }
  .note { font: 500 12px/1.4 "Geist Mono", ui-monospace, monospace; color: #6b6f6a; margin: 0 0 12px; }
  main { background: #37fb67; }
  .shot { position: relative; overflow: hidden; display: block; }
  .shot img { display: block; max-width: none; user-select: none; -webkit-user-drag: none; }
  .spot { position: absolute; border-radius: 2px; }
  .spot--input { box-sizing: border-box; border: 0; background: transparent; padding: 0 8px;
                 font: 13px "Geist Mono", ui-monospace, monospace; color: #111; }
  .spot--input:focus { outline: 2px solid #37fb67; background: #fff; }
</style>
</head>
<body>
<div class="page">
  <p class="note">Top: Maddy's Figma, 2026-10-19 · below: review mock, 2026-10-14 · screenshots, not live HTML</p>
  <main data-jiro-hovers="{hovers}">
{sections}  </main>
</div>
<script src="../jiro-buddy.js" defer></script>
</body>
</html>
"""

if __name__ == "__main__":
    body = "".join(section(*s) for s in SECTIONS)
    (HERE / "index.html").write_text(PAGE.replace("{hovers}", html.escape(HOVERS)).replace("{sections}", body))
