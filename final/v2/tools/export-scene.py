# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Index a scene's base and sprite strips with LibreSprite and write site/public/art/<scene>/scene.json.

Usage: uv run tools/export-scene.py art/specs/<scene>.json [--extra extra.json]
LibreSprite sources (.ase) are kept in art/src/ase/<scene>/.
"""
import json, subprocess, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec_path = Path(sys.argv[1]); scene = spec_path.stem
spec = json.loads(spec_path.read_text())
work = ROOT / "art/work" / scene
pub = ROOT / "site/public/art" / scene
ase = ROOT / "art/src/ase" / scene
pub.mkdir(parents=True, exist_ok=True); ase.mkdir(parents=True, exist_ok=True)

jobs = [(ROOT / spec["base"], "base")]
entries = []
for sid, s in spec["sprites"].items():
    g = s.get("grain", Image.open(ROOT / spec["base"]).width // 360)
    rx, ry, rw, rh = s["roi"]
    for suffix, keep, durations, trigger in (("", s.get("keep"), s.get("durations"), False),
                                              ("-react", s.get("reaction", {}).get("keep"), s.get("reaction", {}).get("durations"), True)):
        if not keep or (trigger and len(keep) < 2):
            continue
        name = f"{sid}{suffix}"
        jobs.append((work / "sprites" / f"{name}-fit.png", name))
        e = {"id": name, "src": f"{name}.png", "x": rx, "y": ry, "w": rw, "h": rh, "grain": g,
             "frames": len(keep), "durations": durations}
        if trigger:
            e["trigger"] = True
        if s.get("egg"):
            e["egg"] = s["egg"]
        if s.get("motion") and not trigger:
            mj = json.loads((work / "sprites" / f"{sid}-motion.json").read_text())
            cx, cy, cw, ch = s["crop"]
            e["motion"] = {"kind": s["motion"], "cut": f"{sid}-cut.png", "under": f"{sid}-under.png",
                           "x": cx, "y": cy, "w": cw, "h": ch, "bottom": mj["bottom"], "top": mj["top"]}
            jobs.append((work / "sprites" / f"{sid}-cut.png", f"{sid}-cut"))
            jobs.append((work / "sprites" / f"{sid}-under.png", f"{sid}-under"))
        entries.append(e)

def run(job):
    src, name = job
    subprocess.run([str(ROOT / "tools/ls-index.sh"), str(src), str(ase / name)], check=True, stdout=subprocess.DEVNULL)
    Image.open(ase / f"{name}.png").save(pub / f"{name}.png")
    return name

with ThreadPoolExecutor(4) as ex:
    for n in ex.map(run, jobs):
        print("indexed", n)

base = Image.open(pub / "base.png")
bg = base.width // 360
loop = max(sum(e["durations"]) for e in entries if not e.get("trigger"))
out = {"id": scene, "size": [base.width // bg, base.height // bg], "loop": loop, "layers": [{"src": "base.png", "grain": bg}], "sprites": entries}
extra = spec.get("scene", {})
out.update(extra)
(pub / "scene.json").write_text(json.dumps(out, indent=1))
print(pub / "scene.json", len(entries), "sprites")
