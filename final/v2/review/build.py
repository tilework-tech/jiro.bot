import markdown, pathlib, html, datetime
root = pathlib.Path(__file__).resolve().parent.parent
out = root / "review"
docs = [("DESIGN-BRIEF.md","Design brief v2.1"),("BELT-SPEC.md","Belt spec"),("CHANGES-FROM-DRAFT.md","Changes + open questions"),("PLAN.md","Implementation plan")]
css = """body{max-width:980px;margin:2rem auto;padding:0 1rem;font:16px/1.55 -apple-system,Segoe UI,sans-serif;background:#130a0c;color:#efdabd}
a{color:#5fd4ff}h1,h2,h3{color:#f6ba64}table{border-collapse:collapse;font-size:14px}td,th{border:1px solid #48231b;padding:4px 8px;vertical-align:top}
code{background:#241510;padding:1px 4px;border-radius:3px}pre{background:#241510;padding:10px;overflow:auto}img{max-width:100%;image-rendering:pixelated;border:1px solid #48231b}
nav a{margin-right:14px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}"""
nav = '<nav><a href="index.html">Overview</a>' + "".join(f'<a href="{p[:-3].lower()}.html">{t}</a>' for p,t in docs) + "</nav>"
for p,t in docs:
    body = markdown.markdown((root/p).read_text(), extensions=["tables","fenced_code"])
    (out/(p[:-3].lower()+".html")).write_text(f"<!doctype html><meta charset=utf-8><title>{t}</title><style>{css}</style>{nav}{body}")
contacts = sorted(out.glob("contact-*.jpg"))
names = {"v01_0609":"01 · 3D-scroll hero","v02_0610":"02 · product demo","v03_0610b":"03 · pricing (static tags)","v04_0611":"04 · koi pond","v05_0611b":"05 · two kitchens comparison","v06_0612":"06 · tour transition → pond","v07_0613":"07 · sketch hero","v08_0613b":"08 · sketch 90° transition","v09_0614":"09 · sketch hero → workshop","v10_bike_in_rain":"10 · bike in rain (motion ref)"}
cards = "".join(f'<figure><img src="{c.name}"><figcaption>{names.get(c.stem[8:],c.stem)} — every 0.5 s</figcaption></figure>' for c in contacts)
idx = f"""<!doctype html><meta charset=utf-8><title>jiro.bot v2.1 review</title><style>{css}</style>{nav}
<h1>jiro.bot — final site, design round (v2.1)</h1>
<p>Built {datetime.datetime.utcnow():%Y-%m-%d %H:%M} UTC. Branch <code>site/final-pixel-restaurant</code>.</p>
<h2>Style probe (one Gemini 3 Pro Image call, canon #19 as reference, unprocessed)</h2>
<img src="../art/probe/style-probe-gemini-3-pro-image.png" alt="style probe">
<p>Not final art. Shows the palette direction, white plates with faint grey-blue rim, off-centre items, no mouth, pupil-free eyes. Final assets go through grid-snap → 48-colour palette → LibreSprite .ase/sheet export.</p>
<h2>Documents</h2><ul>{"".join(f'<li><a href="{p[:-3].lower()}.html">{t}</a></li>' for p,t in docs)}</ul>
<h2>All ten videos, captured at 0.5 s</h2><div class=grid>{cards}</div>"""
(out/"index.html").write_text(idx)
print("ok", [p.name for p in out.iterdir()])
