"""`jm review`: a static review page for a render directory (index.html beside the outputs)."""

import html
import json
import re
from pathlib import Path

from .tables import markdown

LANES = [
    ("Big moves", ("pop_in", "relocate", "edge_peek", "fly_in", "peek_landing_hop")),
    ("Hide", ("hide",)),
    ("Small moves", ("side_scoot", "small_hop")),
    ("Landing", ("landing_squash", "dust_puff")),
    ("Faces", ("express", "glance")),
    ("Talk", ("talk",)),
]


def _inline(text):
    text = html.escape(text, quote=False)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)


def md_to_html(md):
    """Enough Markdown for the generated spec tables and check report: headings, paragraphs, lists, tables."""
    out, table, items = [], [], []

    def flush():
        if table:
            head, rows = table[0], table[2:]
            out.append("<div class='scroll'><table><thead><tr>" + "".join(f"<th>{_inline(c)}</th>" for c in head)
                       + "</tr></thead><tbody>" + "".join("<tr>" + "".join(f"<td>{_inline(c)}</td>" for c in r) + "</tr>"
                                                           for r in rows) + "</tbody></table></div>")
            table.clear()
        if items:
            out.append("<ul>" + "".join(f"<li>{_inline(i)}</li>" for i in items) + "</ul>")
            items.clear()

    for line in md.splitlines():
        if line.startswith("|"):
            table.append([c.strip() for c in line.strip().strip("|").split("|")])
            continue
        if line.startswith("- "):
            items.append(line[2:])
            continue
        flush()
        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            out.append(f"<h{level + 1}>{_inline(line.lstrip('#').strip())}</h{level + 1}>")
        elif line.strip():
            out.append(f"<p>{_inline(line)}</p>")
    flush()
    return "\n".join(out)


def _lanes(timeline):
    d = timeline["duration"]
    scenes = "".join(f"<div class='scene' style='left:{a / d * 100:.3f}%;width:{(b - a) / d * 100:.3f}%'>"
                     f"<span>scene {i + 1}</span></div>" for i, (a, b) in enumerate(timeline["scenes"]))
    rows = []
    stays = [e for e in timeline["events"] if e["kind"] == "stay"]
    marks = "".join(f"<button class='ev idle' data-t='{e['start']}' style='left:{e['start'] / d * 100:.3f}%;"
                    f"width:{(e['end'] - e['start']) / d * 100:.3f}%' title='{e['idle']} {e['start']:.2f}–{e['end']:.2f}s'>"
                    f"{e['idle'].replace('idle_', '')}</button>" for e in stays)
    rows.append(f"<div class='lane'><b>Presence / hover</b><div class='track'>{marks}</div></div>")
    for label, kinds in LANES:
        evs = [e for e in timeline["events"] if e["kind"] in kinds]
        marks = "".join(
            f"<button class='ev k-{e['kind']}' data-t='{e['start']}' style='left:{e['start'] / d * 100:.3f}%;"
            f"width:max(3px,{(e['end'] - e['start']) / d * 100:.3f}%)' "
            f"title='{html.escape(e['kind'] + ' ' + e.get('face', '') + ' ' + e.get('text', ''), quote=True)} "
            f"{e['start']:.2f}–{e['end']:.2f}s'></button>" for e in evs)
        rows.append(f"<div class='lane'><b>{label}</b><div class='track'>{marks}</div></div>")
    return f"<div class='lanes'><div class='scenes'>{scenes}</div>{''.join(rows)}<div class='playhead' id='playhead'></div></div>"


def build(spec, out, title):
    out = Path(out)
    timeline = json.loads((out / "timeline.json").read_text())
    report = json.loads((out / "check.json").read_text())
    manifest = json.loads((out / "manifest.json").read_text()) if (out / "manifest.json").exists() else {}
    passed = sum(r["passed"] for r in report["rules"])
    rows = "".join(
        f"<tr class='{'ok' if r['passed'] else 'bad'}'><td><code>{html.escape(r['id'])}</code></td>"
        f"<td class='st'>{'pass' if r['passed'] else 'FAIL'}</td><td>{_inline(r['detail'])}</td></tr>"
        for r in report["rules"])
    unplaced = "".join(f"<li>{html.escape(l['text'])} <span class='muted'>({html.escape(l['reason'])})</span></li>"
                       for l in timeline.get("unplaced_lines", []))
    facts = [("Type", timeline["video_type"]), ("Seed", timeline["seed"]),
             ("Frame", f"{timeline['frame_size'][0]}×{timeline['frame_size'][1]}"),
             ("Mascot", f"{manifest.get('mascot_height_px', '?')}px tall (scale {timeline['scale']:.2f})"),
             ("Cuts", ", ".join(f"{c:g}s" for c in manifest.get("cuts", [])) + f" ({manifest.get('cuts_source', '')})"),
             ("Spec", f"v{timeline['spec_version']}"),
             ("Overlay SHA-256", f"<code>{manifest.get('overlay_rgba_sha256', '')[:16]}…</code>")]
    facts_html = "".join(f"<div><span class='lbl'>{k}</span><span>{v}</span></div>" for k, v in facts)
    debug = (out / "debug.mp4").exists()
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<style>
:root {{ color-scheme: light dark; --canvas:#f2f4f8; --sheet:#fff; --nested:#f2f4f8; --line:#dde1e6; --line-2:#c1c7cd;
  --muted:#8a8f98; --comment:#525252; --text:#393939; --fg:#161616; --green:#24a148; --green-ink:#198038;
  --red:#da1e28; --blue:#0f62fe; --yellow:#8e6a00; --magenta:#8a3ffc; --cyan:#007d79; }}
@media (prefers-color-scheme: dark) {{ :root {{ --canvas:#161616; --sheet:#1c1c1c; --nested:#262626; --line:#262626;
  --line-2:#393939; --muted:#525252; --comment:#8a8f98; --text:#dde1e6; --fg:#f2f4f8; --green:#42be65; --green-ink:#6fdc8c;
  --red:#ff9cac; --blue:#78a9ff; --yellow:#f2cc60; --magenta:#be95ff; --cyan:#08bdba; }} }}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--canvas); color:var(--text); font:15px/1.5 Inter, ui-sans-serif, system-ui, sans-serif; }}
main {{ max-width:1320px; margin:0 auto; padding:28px 24px 64px; }}
h1 {{ color:var(--fg); font-size:24px; font-weight:600; letter-spacing:-.01em; margin:0 0 4px; }}
h2 {{ color:var(--fg); font-size:18px; font-weight:600; margin:36px 0 12px; }}
h3 {{ color:var(--fg); font-size:15px; font-weight:600; margin:24px 0 8px; }}
p {{ margin:0 0 10px; }}
.muted, .lbl {{ color:var(--comment); }}
.lbl {{ font:500 12px/1.4 "IBM Plex Mono", ui-monospace, monospace; text-transform:uppercase; letter-spacing:.06em; }}
code {{ font:13px "IBM Plex Mono", ui-monospace, monospace; background:var(--nested); padding:1px 4px; border-radius:4px; }}
nav {{ display:flex; gap:16px; flex-wrap:wrap; margin:10px 0 0; font-size:13px; }}
nav a, a {{ color:var(--green-ink); text-decoration:none; }} a:hover {{ text-decoration:underline; }}
.card {{ background:var(--sheet); border:1px solid var(--line); border-radius:8px; padding:16px; }}
.facts {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-top:16px; }}
.facts div {{ display:flex; flex-direction:column; gap:2px; }}
.summary {{ font-weight:600; color:var(--fg); }} .summary .pass {{ color:var(--green-ink); }} .summary .fail {{ color:var(--red); }}
.players {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
.players .wide {{ grid-column:1 / -1; }}
figure {{ margin:0; }} figcaption {{ margin:8px 0 0; font-size:13px; color:var(--comment); }}
video {{ width:100%; display:block; border-radius:4px; border:1px solid var(--line); background:#000; }}
.checker video {{ background-color:#fff; background-image:linear-gradient(45deg,#c9cdd3 25%,transparent 25%),
  linear-gradient(-45deg,#c9cdd3 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#c9cdd3 75%),
  linear-gradient(-45deg,transparent 75%,#c9cdd3 75%); background-size:20px 20px;
  background-position:0 0,0 10px,10px -10px,-10px 0; }}
.controls {{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:0 0 12px; }}
button.btn {{ font:500 13px Inter, system-ui, sans-serif; padding:6px 12px; border-radius:6px; border:1px solid var(--line-2);
  background:var(--sheet); color:var(--fg); cursor:pointer; }} button.btn:hover {{ background:var(--nested); }}
button.primary {{ background:var(--green-ink); border-color:var(--green-ink); color:#fff; }}
select {{ font:13px Inter, system-ui, sans-serif; padding:5px 8px; border-radius:6px; border:1px solid var(--line-2); background:var(--sheet); color:var(--fg); }}
.lanes {{ position:relative; margin-top:8px; }}
.scenes {{ position:absolute; left:140px; right:0; top:0; bottom:0; }}
.scene {{ position:absolute; top:0; bottom:0; border-left:1px dashed var(--line-2); }}
.scene span {{ position:absolute; top:-18px; left:4px; font:500 11px "IBM Plex Mono", monospace; color:var(--comment); }}
.lane {{ display:flex; align-items:center; height:26px; position:relative; }}
.lane b {{ width:140px; flex:none; font:500 12px "IBM Plex Mono", monospace; color:var(--comment); text-transform:uppercase; letter-spacing:.04em; }}
.track {{ position:relative; flex:1; height:18px; border-bottom:1px solid var(--line); }}
.ev {{ position:absolute; top:2px; height:14px; border:0; border-radius:3px; padding:0 4px; cursor:pointer;
  background:var(--line-2); color:var(--fg); font:500 10px/14px "IBM Plex Mono", monospace; overflow:hidden; white-space:nowrap; text-align:left; }}
.ev.idle {{ background:var(--nested); outline:1px solid var(--line-2); }}
.k-talk {{ background:var(--blue); }} .k-hide {{ background:var(--yellow); }} .k-edge_peek, .k-fly_in {{ background:var(--magenta); }}
.k-glance {{ background:var(--cyan); }}
.playhead {{ position:absolute; top:-4px; bottom:0; width:2px; background:var(--red); left:140px; pointer-events:none; }}
.scroll {{ overflow-x:auto; }}
table {{ border-collapse:collapse; width:100%; font-size:13.5px; background:var(--sheet); }}
th {{ text-align:left; font:500 12px "IBM Plex Mono", monospace; text-transform:uppercase; letter-spacing:.04em; color:var(--comment);
  border-bottom:1px solid var(--line-2); padding:8px; vertical-align:bottom; }}
td {{ border-bottom:1px solid var(--line); padding:7px 8px; vertical-align:top; }}
tr.ok .st {{ color:var(--green-ink); font-weight:600; }} tr.bad .st {{ color:var(--red); font-weight:700; }}
.legend {{ display:flex; gap:14px; flex-wrap:wrap; font-size:13px; margin-top:8px; }}
.sw {{ display:inline-block; width:12px; height:12px; border-radius:2px; vertical-align:-2px; margin-right:6px; }}
.spec h2 {{ font-size:17px; }}
@media (max-width:900px) {{ .players {{ grid-template-columns:1fr; }} }}
</style></head><body><main>
<h1>{html.escape(title)}</h1>
<p class="muted">Jiro rendered as a transparent overlay by the <code>jiro-motion</code> skillset and measured against its motion spec.</p>
<nav><a href="#videos">Videos</a><a href="#timeline">Timeline</a><a href="#check">Checker report</a><a href="#debug">Debug view</a><a href="#spec">Spec tables</a></nav>
<div class="card facts">
<div><span class="lbl">Checker</span><span class="summary"><span class="{'pass' if report['passed'] else 'fail'}">{'PASS' if report['passed'] else 'FAIL'}</span> · {passed}/{len(report['rules'])} rules</span></div>
{facts_html}
</div>

<h2 id="videos">Videos</h2>
<div class="controls"><button class="btn primary" id="play">Play all</button><button class="btn" id="pause">Pause</button>
<label class="muted">Speed <select id="rate"><option>0.25</option><option>0.5</option><option selected>1</option><option>2</option></select></label>
<span class="muted" id="clock">0.00 s</span></div>
<div class="players">
<figure><video id="v-composite" src="composite.mp4" muted playsinline preload="auto"></video><figcaption>Composite MP4 (input + overlay)</figcaption></figure>
<figure class="checker"><video id="v-overlay" src="overlay.webm" muted playsinline preload="auto"></video><figcaption>Overlay alone on a checkerboard (<a href="overlay.webm">WebM VP9 + alpha</a> · <a href="overlay.mov">ProRes 4444 .mov</a>). WebM alpha plays in Chrome and Firefox, not Safari.</figcaption></figure>
</div>

<h2 id="timeline">Timeline</h2>
<p class="muted">Every scheduled event. Click one to seek all videos there.</p>
<div class="card">{_lanes(timeline)}</div>
{f"<h3>Lines not placed</h3><ul>{unplaced}</ul>" if unplaced else ""}

<h2 id="check">Checker report</h2>
<div class="scroll"><table><thead><tr><th>Rule</th><th>Result</th><th>Measured</th></tr></thead><tbody>{rows}</tbody></table></div>

<h2 id="debug">Debug view</h2>
{"<figure><video id='v-debug' src='debug.mp4' muted playsinline preload='auto'></video><figcaption>Detected text and chrome per sample, where his resting body may be, the centre band, and Jiro's tracked boxes.</figcaption></figure>" if debug else "<p class='muted'>Rendered with --no-debug.</p>"}
<div class="legend"><span><i class="sw" style="background:#eb3232"></i>Detected text</span><span><i class="sw" style="background:#ffa000"></i>UI chrome (dense edges)</span>
<span><i class="sw" style="background:#3cdc6e"></i>Allowed resting region</span><span><i class="sw" style="background:#dc3c3c;opacity:.4"></i>Centre band (avoid)</span>
<span><i class="sw" style="background:#00c8ff"></i>Jiro's ink box</span><span><i class="sw" style="background:#b45aff"></i>Speech bubble</span></div>

<h2 id="spec">Spec tables</h2>
<div class="spec card">{md_to_html(markdown(spec))}</div>
</main>
<script>
const vids = ['v-composite','v-overlay','v-debug'].map(id => document.getElementById(id)).filter(Boolean);
const lead = vids[0], dur = {timeline['duration']};
const playhead = document.getElementById('playhead'), clock = document.getElementById('clock');
function seek(t) {{ vids.forEach(v => {{ v.currentTime = t; }}); }}
document.getElementById('play').onclick = () => {{ seek(lead.currentTime); vids.forEach(v => v.play()); }};
document.getElementById('pause').onclick = () => vids.forEach(v => v.pause());
document.getElementById('rate').onchange = e => vids.forEach(v => {{ v.playbackRate = +e.target.value; }});
document.querySelectorAll('.ev').forEach(b => b.onclick = () => {{ seek(+b.dataset.t); }});
function tick() {{
  const t = lead.currentTime;
  vids.slice(1).forEach(v => {{ if (!lead.paused && Math.abs(v.currentTime - t) > 0.12) v.currentTime = t; }});
  const track = document.querySelector('.track');
  if (track) {{ const r = track.getBoundingClientRect(), p = track.parentElement.parentElement.getBoundingClientRect();
    playhead.style.left = (r.left - p.left + r.width * t / dur) + 'px'; }}
  clock.textContent = t.toFixed(2) + ' s';
  requestAnimationFrame(tick);
}}
requestAnimationFrame(tick);
</script>
</body></html>"""
    (out / "index.html").write_text(page)
    return str(out / "index.html")
