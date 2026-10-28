"""Human-readable motion spec tables, generated from motion-spec.json.

spec/MOTION-SPEC.md is this module's output; a test fails if the two drift.
"""


def _num(v):
    return f"{v:g}"


def _range(spec, move):
    identity = {"tx": 0, "ty": 0, "rot": 0, "sx": 1, "sy": 1, "opacity": 1}
    values = {}
    for frame in spec.moves[move].get("keyframes", []):
        for ch, v in frame.items():
            if ch in identity and isinstance(v, (int, float)):
                values.setdefault(ch, []).append(v)
    out = []
    names = {"tx": "x {}px", "ty": "y {}px", "rot": "{}°", "sx": "x ×{}", "sy": "y ×{}", "opacity": "opacity {}"}
    for ch, vs in values.items():
        lo, hi = min(vs + [identity[ch]]), max(vs + [identity[ch]])
        if lo == hi:
            continue
        if ch in ("tx", "ty", "rot"):
            span = f"{lo:+g}…{hi:+g}" if lo < 0 < hi else f"{(lo if lo < 0 else hi):+g}"
        else:
            span = f"{lo:g}…{hi:g}"
        out.append(names[ch].format(span))
    return ", ".join(out) or "—"


def _quality(move):
    easings = {move.get("easing", "linear")}
    easings |= {f["ease"] for f in move.get("keyframes", []) if "ease" in f}
    easings.discard("linear")
    over = any("cubic-bezier" in e and any(float(v) > 1 for v in e[13:-1].split(",")[1::2]) for e in easings)
    text = ", ".join(sorted(easings)) or "linear"
    return text + (" (overshoots)" if over else "")


def markdown(spec):
    d = spec.data
    b = spec.budgets
    types = spec.types
    L = []
    w = L.append
    w("# Jiro motion spec")
    w("")
    w(f"Generated from `motion-spec.json` (version {d['version']}) by `jm tables`. Do not edit by hand: change the JSON, "
      "then run `scripts/jm tables --write spec/MOTION-SPEC.md`.")
    w("")
    w(f"Source: `{d['source']['repo']}` branch `{d['source']['branch']}` at `{d['source']['commit']}` ({d['source']['approved']}).")
    w("")
    w(f"Units: lengths are px at the reference mascot box ({d['mascot']['ref_width']}×{d['mascot']['ref_height']}) and scale "
      f"with the render (`s = mascot height / {d['mascot']['ref_height']}`; default mascot height is "
      f"{d['mascot']['default_height_fraction']:.0%} of the frame height). Times in ms. Angles in degrees.")
    w("")
    w("## From scroll passes to scenes")
    w("")
    w("| v6 (website) | jiro-motion (video) |")
    w("|---|---|")
    w("| A pass: one scroll direction; reversing 60px starts a new one | A scene: the footage between two cuts (given or auto-detected) |")
    w("| Limits per pass | The same limits per scene, plus per-minute caps from the video type |")
    w("| Follow to the next section after 1.2 s of stillness | Relocate after a cut, after the type's settle time (every cut, or only when needed) |")
    w("| Edge peek when his old spot scrolled off-screen | Edge peek on his first arrival in a new scene (landscape frames only) |")
    w("| Never cover headings and text in the DOM | Never cover text or UI chrome detected in the frames, for his whole stay |")
    w("| Rests where `spotFor()` finds clear space | Rests where the footprint (body + every move's reach + padding) stays clear; hides if nowhere is |")
    w("| Quiet after 4 long passes, reset by a click | Quiet after the type's `quiet_after_lines` lines |")
    w("")
    w("## Limits per scene")
    w("")
    w("| Rule | Limit |")
    w("|---|---|")
    w(f"| Big moves ({', '.join(b['big_moves'])}) | at most {b['per_scene']['big']} per scene |")
    w(f"| Small moves ({', '.join(b['small_moves'])}) | at most {b['per_scene']['small']} per scene (fewer for some types), at least {_num(b['small_min_gap_ms'])} ms apart, first one {_num(b['first_small_after_landing_ms'])} ms after landing |")
    w(f"| Spoken lines | at most {b['per_scene']['lines']} per scene, {_num(b['line_after_landing_ms'])} ms after landing; never cut off by a scene change |")
    w(f"| Bouncy hover ({', '.join(b['bouncy_hovers'])}) | at most {b['per_scene']['bouncy_hover']} per scene |")
    w(f"| Rest before relocating | at least {_num(b['rest_before_relocate_ms'])} ms after the last landing |")
    w(f"| Pop-in | {b['per_video']['pop_in']} per video, always his first appearance |")
    w(f"| Minimum clear stay | a spot must stay clear for {_num(b['min_stay_ms'])} ms after he lands |")
    w("")
    w("## Movements")
    w("")
    w("| Movement | Kind | Range | Duration | Quality | Notes |")
    w("|---|---|---|---|---|---|")
    for name, m in spec.moves.items():
        if name in ("talk", "talk_stretch", "glance"):
            continue
        dur = f"{_num(m['duration_ms'])} ms" if "duration_ms" in m else "—"
        rng = _range(spec, name) if "keyframes" in m else "—"
        if name == "edge_peek":
            p = spec.placement
            rng = f"{p['peek_visible_fraction']:.0%} of him visible at the side edge, y within {p['peek_y_range'][0]:.0%}–{p['peek_y_range'][1]:.0%} of the height"
        if name == "fly_in":
            a = m["arc"]
            rng = f"arc lifts {a['lift_up']}px (or {a['lift_down']}px when descending), tilts up to {a['rot_peak']}°"
            quality = f"{a['path_easing']} path, landing squash at {a['land_at']:.0%}"
        else:
            quality = _quality(m)
        w(f"| {m['label']} (`{name}`) | {m['category']} | {rng} | {dur} | {quality} | {m.get('notes', '')} |")
    st, gl, tk = spec.moves["talk_stretch"], spec.moves["glance"], spec.moves["talk"]
    w(f"| {st['label']} (`talk_stretch`) | talk | x ×{st['to']['sx']}, y ×{st['to']['sy']} | {st['transition_ms']} ms in and out | {st['transition']} (overshoots) | {st['notes']} |")
    w(f"| {tk['label']} (`talk`) | talk | — | {tk['type_ms_per_char']} ms per character + {_num(tk['hold_ms'])} ms hold | — | {tk['notes']} |")
    w(f"| {gl['label']} (`glance`) | face | {gl['shift']} SVG units toward a text box within {gl['reach']}px | {_num(gl['duration_ms'])} ms | {gl['transition']} | {gl['notes']} |")
    w("")
    w("## Idle hovers (exactly one runs; re-picked on every landing)")
    w("")
    w("| Hover | Motion | Bouncy | " + " | ".join(spec.type(t)["label"] for t in types) + " |")
    w("|---|---|---|" + "---|" * len(types))
    for name, idle in spec.idles.items():
        odds = " | ".join(f"{spec.type(t)['idle_odds'][name]:.0%}" for t in types)
        w(f"| {idle['label']} (`{name}`) | {idle['notes']} | {'yes' if idle['bouncy'] else 'no'} | {odds} |")
    w("")
    w("## Faces")
    w("")
    w("| Face | When |")
    w("|---|---|")
    for name, face in spec.faces.items():
        w(f"| `{face['glyph']}` ({name}) | {face['when']} |")
    w(f"| glance | the `>_` face shifted toward something; resting beats alternate glance and expression every {_num(d['rest']['beat_ms'])} ms in v6 |")
    w("")
    statuses = {spec.type(t)["status"] for t in types}
    w("## Frequency by video type" + (f" ({statuses.pop()})" if len(statuses) == 1 else ""))
    w("")
    w("Rows are movements, columns are video types. Everything not listed follows the per-scene limits above for every type.")
    w("")
    w("| Movement | " + " | ".join(f"{spec.type(t)['label']} (`{t}`)" for t in types) + " |")
    w("|---|" + "---|" * len(types))

    def row(label, fn):
        w(f"| {label} | " + " | ".join(fn(spec.type(t)) for t in types) + " |")

    row("Pop-in", lambda k: "once, first appearance")
    row("Edge peek → fly in → landing hop", lambda k: f"≤{k['edge_peek']['max_per_video']} per video; {k['edge_peek']['chance']:.0%} chance on the first arrival after a cut")
    row("Relocate", lambda k: ("after every cut" if k["relocate_policy"] == "every_cut" else "only when his spot will be covered")
        + f", {_num(k['settle_after_cut_ms'])} ms after the cut")
    row("Big moves per minute", lambda k: f"≤{k['per_minute']['big']}")
    row("Side scoot / small hop (50/50)", lambda k: f"≤{min(b['per_scene']['small'], k['small_per_scene'])} per scene, ≤{k['per_minute']['small']} per minute, ≥2 s apart")
    row("Landing squash + dust puff", lambda k: "every landing")
    for name, idle in spec.idles.items():
        row(idle["label"], lambda k, n=name: f"{k['idle_odds'][n]:.0%} of landings" + (" (≤1 bouncy per scene)" if spec.idles[n]["bouncy"] else ""))
    row("Glance / expression beats", lambda k: f"every {_num(k['rest_beat_ms'])} ms at rest, alternating")
    row("Spoken lines", lambda k: f"≤1 per scene, ≤{k['per_minute']['lines']} per minute, quiet after {k['quiet_after_lines']}")
    row("Hide", lambda k: "whenever text will reach his spot and no clear spot is free")
    w("")
    for t in types:
        k = spec.type(t)
        w(f"- **{k['label']}** (`{t}`, {k['status']}): {k['description']}")
    w("")
    w("## Placement")
    w("")
    p = spec.placement
    w("| Rule | Value |")
    w("|---|---|")
    w(f"| Never cover | detected text and UI chrome, padded by {p['text_padding']}px, for the whole time he is there (rest, bubble, peek and flight) |")
    w(f"| Centre band | no resting spot centred in {p['centre_band'][0]:.0%}–{p['centre_band'][1]:.0%} of the width ({p['centre_band_applies']}) |")
    w(f"| Edges | at least {p['edge_margin']}px from every edge, except during the edge peek and its flight |")
    w(f"| Prefer | {p['prefer']} |")
    w(f"| UI chrome | non-text regions whose edge density exceeds {p['chrome_edge_density']} |")
    w("")
    w("## Dropped from v6")
    w("")
    w("| What | Why |")
    w("|---|---|")
    for item in d["dropped_from_v6"]:
        w(f"| {item['what']} | {item['why']} |")
    w("")
    w("## Checker tolerances")
    w("")
    w("| Measure | Tolerance |")
    w("|---|---|")
    for k, v in spec.tolerances.items():
        w(f"| `{k}` | {v:g} |")
    return "\n".join(L) + "\n"
