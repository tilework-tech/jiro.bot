"""Measure a rendered Jiro against the motion spec and report pass/fail per rule.

Three kinds of evidence:
- the timeline (what was scheduled): counts, spacing and budgets;
- the track (per-frame layer channels): amplitudes, durations and curve shape
  of every move, measured on the frames where that move drives its layer;
- the rendered pixels (alpha of the overlay): text overlap, edge margins, and
  a cross-check that the pixels are where the track says, so the track
  measurements describe what was actually drawn.
"""

import json
import math

import numpy as np

from .geometry import intersects

HOP_MOVES = ("landing_squash", "peek_landing_hop", "side_scoot", "small_hop", "express_squash", "talk_squash")
ASIDE_MOVES = ("pop_in", "relocate", "hide")
ALLOWED_FACES = {"cursor", "glance", "happy", "eyes", "sleepy"}
ALPHA_ON = 8


class Report:
    def __init__(self, rules, meta):
        self.rules, self.meta = rules, meta

    @property
    def passed(self):
        return all(r["passed"] for r in self.rules)

    def to_json(self):
        return json.dumps({"passed": self.passed, "meta": self.meta, "rules": self.rules}, indent=1, default=float)

    def to_markdown(self):
        lines = [f"# Jiro motion check: {'PASS' if self.passed else 'FAIL'}", "",
                 f"{sum(r['passed'] for r in self.rules)}/{len(self.rules)} rules pass. "
                 f"Type `{self.meta['video_type']}`, seed {self.meta['seed']}, scale {self.meta['scale']:.3f}.", "",
                 "| Rule | Result | Detail |", "|---|---|---|"]
        for r in self.rules:
            lines.append(f"| `{r['id']}` | {'pass' if r['passed'] else '**FAIL**'} | {r['detail']} |")
        return "\n".join(lines) + "\n"


class _Checker:
    def __init__(self, spec, video_type, timeline, track, textmap, frame_size):
        self.spec, self.tl, self.track, self.tm = spec, timeline, track, textmap
        self.kind = spec.type(video_type)
        self.video_type = video_type
        self.W, self.H = frame_size
        self.s = timeline.scale
        self.tol = spec.tolerances
        self.frame_dt = 1.0 / track.fps
        self.rules = []
        self.events = sorted(timeline.events, key=lambda e: e["start"])

    def rule(self, rule_id, passed, detail, measured=None):
        self.rules.append({"id": rule_id, "passed": bool(passed), "detail": detail, "measured": measured or {}})

    def of(self, *kinds):
        return [e for e in self.events if e["kind"] in kinds]

    def landings(self):
        return sorted(e["landed"] for e in self.of("stay"))

    # Motion quality ------------------------------------------------------

    def frames_driven_by(self, event, layer):
        out = []
        for f in self.track.frames:
            if not f["visible"] or not (event["start"] <= f["t"] < event["end"]):
                continue
            if layer == "hop":
                src = f.get("hop_source")
                if not src or src[0] != event["kind"] or abs(src[1] - event["start"]) > 1e-6:
                    continue
            out.append(f)
        return out

    def check_moves(self):
        tol_len = self.tol["amplitude_px"] * max(self.s, 1)
        tol_for = {"tx": tol_len, "ty": tol_len, "rot": self.tol["angle_deg"], "sx": self.tol["scale"],
                   "sy": self.tol["scale"], "opacity": self.tol["opacity"]}
        for move in HOP_MOVES + ASIDE_MOVES:
            events = self.of(move)
            if not events:
                continue
            layer = "hop" if move in HOP_MOVES else "aside"
            expected_ms = self.spec.duration(move)
            bad_durations = [round(e["end"] - e["start"], 3) for e in events
                             if abs((e["end"] - e["start"]) * 1000 - expected_ms) > self.tol["duration_frames"] * self.frame_dt * 1000]
            self.rule(f"duration:{move}", not bad_durations,
                      f"{len(events)} plays, spec {expected_ms:g} ms" + (f"; off: {bad_durations}" if bad_durations else ""),
                      {"plays": len(events), "spec_ms": expected_ms, "off": bad_durations})
            extremes = self.spec.keyframe_extremes(move, self.s)
            worst_amp, worst_curve, worst_over = 0.0, 0.0, []
            for e in events:
                frames = self.frames_driven_by(e, layer)
                if not frames:
                    continue
                for ch, peak in extremes.items():
                    if move in ASIDE_MOVES and ch not in ("ty", "sx", "sy", "opacity"):
                        continue
                    measured = [f["layers"][layer][ch] for f in frames]
                    expected = [self.spec.sample(move, (f["t"] - e["start"]) * 1000, self.s)[ch] for f in frames]
                    identity = 1.0 if ch in ("sx", "sy", "opacity") else 0.0
                    m_peak = max(measured, key=lambda v: abs(v - identity)) - identity
                    e_peak = max(expected, key=lambda v: abs(v - identity)) - identity
                    worst_amp = max(worst_amp, abs(m_peak - e_peak) / tol_for[ch])
                    worst_curve = max(worst_curve, max(abs(a - b) for a, b in zip(measured, expected)) / tol_for[ch])
                    overshoot_ok = abs(m_peak) <= abs(peak) * 1.0 + tol_for[ch] or ch == "opacity"
                    if not overshoot_ok and not self._overshoots_by_design(move):
                        worst_over.append((ch, round(m_peak, 3), round(peak, 3)))
            amp_ok = worst_amp <= 1.0 and not worst_over
            self.rule(f"amplitude:{move}", amp_ok,
                      f"peaks within tolerance (worst {worst_amp:.2f}x tol)" if amp_ok
                      else f"peak off by {worst_amp:.2f}x tolerance; beyond keyframe range: {worst_over}",
                      {"worst_ratio": round(worst_amp, 3), "beyond": worst_over,
                       "spec_peaks": {k: round(v, 3) for k, v in extremes.items()}})
            curve_ok = worst_curve <= self.tol["curve_px"] / self.tol["amplitude_px"] + 1e-9
            self.rule(f"curve:{move}", curve_ok,
                      f"easing and overshoot follow the spec curve (worst {worst_curve:.2f}x tol)",
                      {"worst_ratio": round(worst_curve, 3)})

    def _overshoots_by_design(self, move):
        frames = self.spec.moves[move].get("keyframes", [])
        return any("cubic-bezier" in f.get("ease", "") for f in frames)

    def check_idles(self):
        for idle, spec in self.spec.idles.items():
            stays = [e for e in self.of("stay") if e["idle"] == idle]
            if not stays:
                continue
            bob = spec["layers"]["bob"]
            values = [k.get("ty", 0.0) for k in bob["keyframes"]]
            spec_range = (max(values) - min(values)) * self.s
            worst = 0.0
            for stay in stays:
                ty = [f["layers"]["bob"]["ty"] for f in self.track.frames
                      if f["visible"] and stay["landed"] <= f["t"] < stay["end"]]
                if ty:
                    worst = max(worst, (max(ty) - min(ty)) - spec_range)
            ok = worst <= self.tol["amplitude_px"] * max(self.s, 1)
            self.rule(f"amplitude:{idle}", ok, f"bob range never exceeds {spec_range:.2f}px", {"excess_px": round(worst, 3)})

    def check_talk(self):
        talks = self.of("talk")
        if not talks:
            return
        per_char, hold = self.spec.moves["talk"]["type_ms_per_char"], self.spec.moves["talk"]["hold_ms"]
        off = [t["text"] for t in talks
               if abs((t["end"] - t["start"]) * 1000 - (per_char * (len(t["text"]) - 1) + hold)) > self.frame_dt * 1000]
        self.rule("duration:talk", not off, f"{per_char} ms per character then a {hold} ms hold", {"off": off})
        to = self.spec.moves["talk_stretch"]["to"]
        peaks = [f["layers"]["art"]["sy"] for f in self.track.frames if f["visible"] and "talk" in f["active"]]
        peak = max(peaks) if peaks else 1.0
        ok = to["sy"] - 0.01 <= peak <= 1 + (to["sy"] - 1) * 1.35
        self.rule("amplitude:talk_stretch", ok, f"shell grows to {peak:.3f} tall (spec {to['sy']} with overshoot)",
                  {"peak_sy": round(peak, 4)})

    # Budgets ---------------------------------------------------------------

    def scene_of(self, t):
        for i, (a, b) in enumerate(self.tl.scenes):
            if a <= t < b:
                return i
        return len(self.tl.scenes) - 1

    def check_budgets(self):
        b = self.spec.budgets
        per_scene = dict(b["per_scene"])
        per_scene["small"] = min(per_scene["small"], self.kind["small_per_scene"])
        groups = {"big": b["big_moves"], "small": b["small_moves"], "lines": ["talk"]}
        for key, kinds in groups.items():
            counts = {}
            for e in self.of(*kinds):
                counts[self.scene_of(e["start"])] = counts.get(self.scene_of(e["start"]), 0) + 1
            worst = max(counts.values(), default=0)
            self.rule(f"count_per_scene:{key}", worst <= per_scene[key],
                      f"at most {worst} per scene (limit {per_scene[key]})", {"per_scene": counts})
            starts = sorted(e["start"] for e in self.of(*kinds))
            cap = self.kind["per_minute"][key]
            worst = max((sum(1 for s in starts[i:] if s < t + 60) for i, t in enumerate(starts)), default=0)
            self.rule(f"per_minute:{key}", worst <= cap, f"at most {worst} in any 60 s (cap {cap})", {"worst": worst})
        bouncy = {}
        for e in self.of("stay"):
            if e["idle"] in b["bouncy_hovers"]:
                bouncy[self.scene_of(e["start"])] = bouncy.get(self.scene_of(e["start"]), 0) + 1
        worst = max(bouncy.values(), default=0)
        self.rule("count_per_scene:bouncy_hover", worst <= per_scene["bouncy_hover"],
                  f"at most {worst} bouncy hover per scene (limit {per_scene['bouncy_hover']})", {"per_scene": bouncy})

        smalls = sorted(e["start"] for e in self.of(*b["small_moves"]))
        gaps = [round(y - x, 3) for x, y in zip(smalls, smalls[1:])]
        need = b["small_min_gap_ms"] / 1000
        self.rule("small_spacing", all(g >= need - 1e-6 for g in gaps),
                  f"smallest gap {min(gaps, default=float('inf')):.2f} s (need {need:g} s)", {"gaps": gaps})
        landings = self.landings()
        first = b["first_small_after_landing_ms"] / 1000
        early = [s for s in smalls if any(0 <= s - l < first - 1e-6 for l in landings)]
        self.rule("first_small_after_landing", not early, f"small moves wait {first:g} s after landing", {"early": early})

        rest = b["rest_before_relocate_ms"] / 1000
        short = []
        for e in self.of("relocate", "edge_peek"):
            before = [l for l in landings if l <= e["start"] + 1e-9]
            if before and e["start"] - before[-1] < rest - 1e-6:
                short.append(round(e["start"] - before[-1], 3))
        self.rule("rest_before_relocate", not short, f"at least {rest:g} s of rest before relocating", {"short": short})

        pops = self.of("pop_in")
        arrivals = self.of("pop_in", "relocate", "edge_peek")
        first_ok = not arrivals or arrivals[0]["kind"] == "pop_in"
        self.rule("pop_in_once", len(pops) <= b["per_video"]["pop_in"] and first_ok,
                  f"{len(pops)} pop-in, first arrival is {'a pop-in' if first_ok else arrivals[0]['kind']}")
        peeks = self.of("edge_peek")
        cap = self.kind["edge_peek"]["max_per_video"]
        self.rule("edge_peek_per_video", len(peeks) <= cap, f"{len(peeks)} edge peek(s) (cap {cap})")
        fly_ok = all(any(abs(f["start"] - p["end"]) < 1e-6 for f in self.of("fly_in")) for p in peeks)
        self.rule("edge_peek_sequence", fly_ok, "every peek flies in and lands with the 8px hop")

        n_land = len(self.of("pop_in", "relocate", "fly_in"))
        self.rule("landing_squash_every_landing",
                  len(self.of("landing_squash")) == n_land and len(self.of("dust_puff")) == n_land,
                  f"{n_land} landings, {len(self.of('landing_squash'))} squashes, {len(self.of('dust_puff'))} puffs")

        delay = b["line_after_landing_ms"] / 1000
        early_lines = []
        for talk in self.of("talk"):
            before = [l for l in landings if l <= talk["start"] + 1e-9]
            if not before or talk["start"] - before[-1] < delay - 1e-6:
                early_lines.append(talk["text"])
        self.rule("line_after_landing", not early_lines, f"lines start {delay:g} s or more after landing",
                  {"early": early_lines})
        quiet = self.kind["quiet_after_lines"]
        self.rule("quiet_after_lines", len(self.of("talk")) <= quiet, f"{len(self.of('talk'))} lines (quiet after {quiet})")
        faces = {f["face"] for f in self.track.frames if f["visible"]}
        self.rule("faces_allowed", faces <= ALLOWED_FACES, f"faces used: {', '.join(sorted(faces))}")

    # Placement ---------------------------------------------------------------

    def check_placement_from_track(self):
        lo, hi = self.spec.placement["centre_band"]
        if self.W >= self.H:
            centred = [e["box"] for e in self.of("stay") if lo * self.W < (e["box"][0] + e["box"][2]) / 2 < hi * self.W]
            self.rule("centre_band", not centred, f"no resting spot centred in {lo:.0%}-{hi:.0%} of the width",
                      {"centred": centred})
        else:
            self.rule("centre_band", True, "portrait frame: the centre-band rule does not apply")

    def peeking(self, t):
        return any(e["start"] <= t < e["end"] for e in self.of("edge_peek", "fly_in"))

    def check_pixels(self, frames):
        pad = self.spec.placement["text_padding"] * self.s
        margin = self.spec.placement["edge_margin"] * self.s
        tol = self.tol["pixel_bbox_px"]
        overlap, clearance, edge, mismatch = [], [], [], []
        images = frames if frames is not None else [None] * len(self.track.frames)
        for f, img in zip(self.track.frames, images):
            t = f["t"]
            alpha = img[..., 3] > ALPHA_ON if img is not None else None
            if alpha is not None:
                rows, cols = np.flatnonzero(alpha.any(axis=1)), np.flatnonzero(alpha.any(axis=0))
                pixel_box = [cols[0], rows[0], cols[-1] + 1, rows[-1] + 1] if len(rows) else None
                drawn = [b for b in (f["ink_box"], f["bubble_box"]) if b]
                expect = None
                if drawn:
                    expect = [max(min(b[0] for b in drawn), 0), max(min(b[1] for b in drawn), 0),
                              min(max(b[2] for b in drawn), self.W), min(max(b[3] for b in drawn), self.H)]
                if pixel_box is not None and expect is not None:
                    if any(p < e - tol for p, e in zip(pixel_box[:2], expect[:2])) or \
                       any(p > e + tol for p, e in zip(pixel_box[2:], expect[2:])):
                        mismatch.append(round(t, 3))
                elif pixel_box is not None and expect is None:
                    mismatch.append(round(t, 3))
                elif (pixel_box is None and expect is not None and f["opacity"] > 0.05
                      and expect[2] - expect[0] > tol and expect[3] - expect[1] > tol):
                    mismatch.append(round(t, 3))
            else:
                pixel_box = None
            for box in self.tm.boxes_at(t):
                x0, y0, x1, y1 = (int(math.floor(box[0])), int(math.floor(box[1])),
                                  int(math.ceil(box[2])), int(math.ceil(box[3])))
                if alpha is not None:
                    hit = alpha[max(y0, 0):max(y1, 0), max(x0, 0):max(x1, 0)].any()
                    near = alpha[max(int(y0 - pad), 0):max(int(y1 + pad), 0), max(int(x0 - pad), 0):max(int(x1 + pad), 0)].any()
                else:
                    shapes = [b for b in (f["ink_box"], f["bubble_box"]) if b and f["visible"]]
                    hit = any(intersects(s, box) for s in shapes)
                    near = any(intersects(s, (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)) for s in shapes)
                if hit:
                    overlap.append(round(t, 3))
                    break
                if near:
                    clearance.append(round(t, 3))
            box = pixel_box if alpha is not None else (f["ink_box"] if f["visible"] else None)
            if box is not None and not self.peeking(t):
                if min(box[0], box[1], self.W - box[2], self.H - box[3]) < margin - 1:
                    edge.append(round(t, 3))
        source = "rendered pixels" if frames is not None else "track boxes"
        self.rule("no_text_overlap", not overlap,
                  f"{len(overlap)} frames touch detected text ({source})" + (f", first at {overlap[0]} s" if overlap else ""),
                  {"frames": len(overlap), "times": overlap[:20], "source": source})
        self.rule("text_clearance", not clearance,
                  f"{len(set(clearance))} frames inside the {pad:.1f}px padding around text ({source})",
                  {"frames": len(set(clearance)), "times": sorted(set(clearance))[:20]})
        self.rule("edge_margin", not edge, f"{len(edge)} frames closer than {margin:.1f}px to the edge outside the peek",
                  {"frames": len(edge), "times": edge[:20]})
        if frames is not None:
            self.rule("track_matches_pixels", not mismatch,
                      f"{len(mismatch)} frames where the drawn pixels leave the tracked box by more than {tol}px",
                      {"frames": len(mismatch), "times": mismatch[:20]})


def check(spec, *, video_type, timeline, track, textmap, frame_size, frames=None):
    c = _Checker(spec, video_type, timeline, track, textmap, frame_size)
    c.check_moves()
    c.check_idles()
    c.check_talk()
    c.check_budgets()
    c.check_placement_from_track()
    c.check_pixels(frames)
    meta = {"video_type": video_type, "seed": timeline.seed, "scale": timeline.scale,
            "spec_version": spec.data["version"], "frames": len(track.frames), "fps": track.fps,
            "pixels_checked": frames is not None}
    return Report(c.rules, meta)
