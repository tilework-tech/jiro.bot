"""Turn a video's scenes and text map into Jiro's timeline.

v6 is scroll-driven; a video is not. The translation:

- a website "pass" (one scroll direction) becomes a scene (shot);
- per-pass limits become per-scene limits, plus per-minute caps from the
  video type;
- "follow to the next section" becomes "relocate after a cut" (every cut, or
  only when his spot is about to be covered, depending on the type);
- "the old spot scrolled off-screen" (the edge-peek trigger) becomes "his
  first arrival in a new scene";
- the website's text avoidance becomes a hard rule against detected text over
  time: he only rests where his whole footprint stays clear for as long as he
  is there, and hides when nowhere is clear.

All randomness comes from one seeded generator, so a seed fixes the timeline.
"""

import json
import math
import random

import numpy as np

from .geometry import Mascot, bubble_boxes, bubble_layout, scale_for


class Timeline:
    def __init__(self, **fields):
        self.events = fields.get("events", [])
        self.scenes = [tuple(s) for s in fields.get("scenes", [])]
        self.frame_size = tuple(fields.get("frame_size", (0, 0)))
        self.scale = fields.get("scale", 1.0)
        self.video_type = fields.get("video_type")
        self.seed = fields.get("seed", 0)
        self.duration = fields.get("duration", 0.0)
        self.unplaced_lines = fields.get("unplaced_lines", [])
        self.spec_version = fields.get("spec_version")

    def to_json(self):
        def clean(value):
            if isinstance(value, float):
                return round(value, 4)
            if isinstance(value, dict):
                return {k: clean(v) for k, v in sorted(value.items())}
            if isinstance(value, (list, tuple)):
                return [clean(v) for v in value]
            return value

        events = sorted(self.events, key=lambda e: (e["start"], e["kind"]))
        return json.dumps(clean({
            "spec_version": self.spec_version, "video_type": self.video_type, "seed": self.seed,
            "duration": self.duration, "frame_size": list(self.frame_size), "scale": self.scale,
            "scenes": [list(s) for s in self.scenes], "unplaced_lines": self.unplaced_lines,
            "events": events,
        }), indent=1)

    @classmethod
    def from_json(cls, text):
        return cls(**json.loads(text))


def _normalise_lines(lines):
    out = []
    for i, line in enumerate(lines or []):
        if isinstance(line, str):
            line = {"text": line}
        out.append({"text": line["text"], "scene": line.get("scene"), "at": line.get("at"), "index": i})
    return out


class _Planner:
    def __init__(self, spec, video_type, duration, frame_size, scenes, textmap, lines, seed, mascot_height):
        self.spec, self.tm = spec, textmap
        self.kind = spec.type(video_type)
        self.video_type = video_type
        self.W, self.H = frame_size
        self.duration = float(duration)
        self.scenes = [(float(a), float(b)) for a, b in (scenes or [(0.0, duration)])]
        self.rng = random.Random(seed)
        self.seed = seed
        self.s = scale_for(spec, self.H, mascot_height)
        self.m = Mascot(spec, self.s)
        self.budgets = spec.budgets
        self.events = []
        self.lines = _normalise_lines(lines)
        for line in self.lines:
            if line["at"] is not None and line["scene"] is None:
                line["scene"] = self.scene_at(float(line["at"]))
        self.said = 0
        self.popped = False
        self.peeks = 0
        self.peek_roll = None
        self.last_landed = None
        self.starts = {"big": [], "small": [], "lines": []}
        self.scene_state = {}
        self.landscape = self.W >= self.H
        self.candidates = self._candidates()
        self.mascot_boxes = np.array([self.box(c) for c in self.candidates]).reshape(-1, 4)
        self.footprints = np.array([self.m.footprint(*c) for c in self.candidates]).reshape(-1, 4)

    def ms(self, name):
        return self.spec.duration(name) / 1000.0

    def scene_at(self, t):
        for i, (a, b) in enumerate(self.scenes):
            if a <= t < b:
                return i
        return len(self.scenes) - 1

    def state(self, i):
        return self.scene_state.setdefault(i, {"big": 0, "small": 0, "talks": 0, "bouncy": False, "seen": False})

    def add(self, kind, start, end, **data):
        event = {"kind": kind, "start": start, "end": end, "scene": self.scene_at(start), **data}
        self.events.append(event)
        return event

    def per_minute_ok(self, group, t):
        cap = self.kind["per_minute"][group]
        return sum(1 for s in self.starts[group] if t - 60 < s <= t + 1e-9) < cap

    def per_minute_next(self, group, t):
        """Earliest time >= t at which one more event of the group fits the per-minute cap."""
        while not self.per_minute_ok(group, t):
            window = sorted(s for s in self.starts[group] if t - 60 < s <= t + 1e-9)
            t = window[0] + 60 + 1e-3
        return t

    # Placement -----------------------------------------------------------

    def _candidates(self):
        m = self.m
        e = m.envelope
        step = 4.0
        x_lo = m.margin + e["side"]
        x_hi = self.W - m.margin - max(m.w, m.zzz[2]) - e["side"]
        y_lo = m.margin - min(m.zzz[1], 0) + e["up"]
        y_hi = self.H - m.margin - m.h - e["down"]
        lo, hi = self.spec.placement["centre_band"]
        out = []
        if x_hi < x_lo or y_hi < y_lo:
            return out
        nx, ny = int((x_hi - x_lo) // step) + 1, int((y_hi - y_lo) // step) + 1
        for ix in range(nx):
            x = x_lo + ix * step
            cx = x + m.w / 2
            if self.landscape and lo * self.W < cx < hi * self.W:
                continue
            for iy in range(ny):
                out.append((x, y_lo + iy * step))
        return out

    def box(self, spot):
        x, y = spot
        return [x, y, x + self.m.w, y + self.m.h]

    def pick_spot(self, t0, t1, prev, talk=None):
        """Best clear spot over [t0, t1]; with a pending line, prefer spots with room for its bubble."""
        if talk is not None:
            spot = self._best_spot(t0, t1, prev, talk)
            if spot is not None:
                return spot
        return self._best_spot(t0, t1, prev, None)

    def _best_spot(self, t0, t1, prev, talk):
        if not self.candidates:
            return None
        spots = self.candidates
        free = self.tm.free_many(self.footprints, t0, t1)
        idx = np.flatnonzero(free)
        if talk is not None and len(idx):
            boxes = bubble_boxes(self.spec, self.s, talk[0], self.mascot_boxes[idx], (self.W, self.H))
            inside = (boxes[:, 0] >= 0) & (boxes[:, 1] >= 0) & (boxes[:, 2] <= self.W) & (boxes[:, 3] <= self.H)
            idx = idx[inside & self.tm.free_many(boxes, talk[1], talk[2], self.m.pad)]
        if not len(idx):
            return None
        score = 400 * self.tm.cost_many(self.footprints[idx], t0, t1)
        score = score + np.array([self.rng.random() for _ in range(len(idx))]) * 6
        if prev is not None:
            pts = np.asarray(spots)[idx]
            score = score + 30 * np.hypot(pts[:, 0] - prev[0], pts[:, 1] - prev[1]) / math.hypot(self.W, self.H)
        return spots[int(idx[int(np.argmin(score))])]

    # Arrivals ------------------------------------------------------------

    def arrival_time(self, t, i, after_cut):
        a, b = self.scenes[i]
        ta = t
        if after_cut:
            first = self.budgets["first_appearance_ms"] if i == 0 else self.kind["settle_after_cut_ms"]
            ta = max(ta, a + first / 1000.0)
        if self.last_landed is not None:
            ta = max(ta, self.last_landed + self.budgets["rest_before_relocate_ms"] / 1000.0)
        return self.per_minute_next("big", ta)

    def peek_geometry(self, spot):
        m, pl = self.m, self.spec.placement
        x, y = spot
        right = x + m.w / 2 > self.W / 2
        py = min(max(y, self.H * pl["peek_y_range"][0]), self.H * pl["peek_y_range"][1])
        edge = self.W - m.w * pl["peek_visible_fraction"] if right else -m.w * (1 - pl["peek_visible_fraction"])
        out = self.W + m.w * pl["peek_out_right"] if right else -m.w * pl["peek_out_left"]
        return {"side": "right" if right else "left", "y": py, "edge_x": edge, "out_x": out}

    def arc_points(self, start, end, steps):
        arc = self.spec.moves["fly_in"]["arc"]
        (fx, fy), (tx, ty) = start, end
        lift = arc["lift_down"] if ty > fy else arc["lift_up"]
        cy = min(fy, ty) - lift * self.s
        out = []
        for k in range(steps + 1):
            u = k / steps
            e = (1 - math.cos(math.pi * u)) / 2
            px = fx + (tx - fx) * e
            py = (1 - e) ** 2 * fy + 2 * (1 - e) * e * cy + e * e * ty
            out.append((u, px, py))
        return out

    def peek_clear(self, ta, spot):
        g = self.peek_geometry(spot)
        m = self.m
        peek_end = ta + self.ms("edge_peek")
        cx0, cy0, cx1, cy1 = m.core(g["edge_x"], g["y"])
        visible = (max(cx0, 0), cy0, min(cx1, self.W), cy1)
        if not self.tm.is_free(visible, ta, peek_end, m.pad):
            return None
        fly = self.ms("fly_in")
        for u, px, py in self.arc_points((g["out_x"], g["y"]), spot, 12):
            t = peek_end + u * fly
            if not self.tm.is_free(self.m.core(px, py), t - fly / 12, t + fly / 12, m.pad):
                return None
        return g

    def arrive(self, t, i, after_cut, prev, deadline=None):
        """Plan an arrival in scene i at or after t. Returns the new stay, or None."""
        a, b = self.scenes[i]
        st = self.state(i)
        if st["big"] >= self.budgets["per_scene"]["big"]:
            return None
        ta = self.arrival_time(t, i, after_cut)
        min_stay = self.budgets["min_stay_ms"] / 1000.0
        last = b - 0.25 if deadline is None else min(b - 0.25, deadline)
        while ta <= last:
            if not self.popped:
                kind = "pop_in"
            else:
                kind = "relocate"
                peek = self.kind["edge_peek"]
                if (after_cut and not st["seen"] and self.landscape and self.peeks < peek["max_per_video"]):
                    if self.peek_roll is None:
                        self.peek_roll = self.rng.random() < peek["chance"]
                    if self.peek_roll:
                        kind = "edge_peek"
            leads = {"pop_in": self.ms("pop_in") + self.ms("landing_squash"),
                     "relocate": self.ms("relocate") + self.ms("landing_squash"),
                     "edge_peek": self.ms("edge_peek") + self.ms("fly_in") + self.ms("peek_landing_hop")}
            if kind == "edge_peek" and ta + leads[kind] > b:
                kind = "relocate"
            if ta + leads[kind] > b:
                return None
            spot = self.pick_spot(ta, min(ta + leads[kind] + min_stay, self.duration), prev,
                                  self.pending_talk(i, ta + leads[kind]))
            geometry = None
            if spot is not None and kind == "edge_peek":
                geometry = self.peek_clear(ta, spot)
                if geometry is None:
                    kind = "relocate"
            if spot is not None:
                return self._land(kind, ta, spot, i, geometry)
            ta += 0.5
        return None

    def _land(self, kind, ta, spot, i, geometry):
        st = self.state(i)
        box = self.box(spot)
        if kind == "pop_in":
            self.add("pop_in", ta, ta + self.ms("pop_in"), box=box)
            touch = ta + self.ms("pop_in")
            landed = touch + self.ms("landing_squash")
            self.popped = True
        elif kind == "relocate":
            self.add("relocate", ta, ta + self.ms("relocate"), box=box)
            touch = ta + self.ms("relocate")
            landed = touch + self.ms("landing_squash")
        else:
            peek_end = ta + self.ms("edge_peek")
            fly_end = peek_end + self.ms("fly_in")
            self.add("edge_peek", ta, peek_end, box=box, **geometry)
            self.add("fly_in", peek_end, fly_end, box=box, **{"from": [geometry["out_x"], geometry["y"]], "to": list(spot)})
            touch = peek_end + self.ms("fly_in") * self.spec.moves["fly_in"]["arc"]["land_at"]
            self.add("peek_landing_hop", fly_end, fly_end + self.ms("peek_landing_hop"))
            landed = fly_end + self.ms("peek_landing_hop")
            self.peeks += 1
        self.add("dust_puff", touch, touch + self.ms("dust_puff"))
        self.add("landing_squash", touch, touch + self.ms("landing_squash"))
        self.starts["big"].append(ta)
        st["big"] += 1
        st["seen"] = True
        idle = self.pick_idle(st)
        stay = self.add("stay", ta, None, box=box, landed=landed, idle=idle, arrival=kind)
        self.last_landed = landed
        hold = self.spec.faces["happy"]["hold_ms"] / 1000.0
        self.add("express", landed, landed + hold, face="happy")
        self.add("express_squash", landed, landed + self.ms("express_squash"))
        stay["_next_beat"] = landed + hold + self.kind["rest_beat_ms"] / 1000.0
        stay["_beats"] = 0
        stay["_last_small"] = None
        stay["_busy"] = [(landed, landed + hold)]
        return stay

    def pick_idle(self, st):
        odds = dict(self.kind["idle_odds"])
        if st["bouncy"]:
            odds = {k: v for k, v in odds.items() if k not in self.budgets["bouncy_hovers"]}
        names = sorted(odds)
        total = sum(odds[n] for n in names)
        roll = self.rng.random() * total
        for name in names:
            roll -= odds[name]
            if roll < 0:
                break
        if name in self.budgets["bouncy_hovers"]:
            st["bouncy"] = True
        return name

    # Rest-time activity ---------------------------------------------------

    def talk_length(self, text):
        talk = self.spec.moves["talk"]
        return talk["type_ms_per_char"] / 1000.0 * (len(text) - 1) + talk["hold_ms"] / 1000.0

    def pending_talk(self, i, landed):
        """(text, start, end) of the line he would say after landing at `landed` in scene i, if any."""
        st = self.state(i)
        line = self.next_line(i)
        if not line or st["talks"] >= self.budgets["per_scene"]["lines"] or self.said >= self.kind["quiet_after_lines"]:
            return None
        start = landed + self.budgets["line_after_landing_ms"] / 1000.0
        return (line["text"], start, start + self.talk_length(line["text"]))

    def next_line(self, i):
        pinned = [line for line in self.lines if line["scene"] == i]
        if pinned:
            return pinned[0]
        free = [line for line in self.lines if line["scene"] is None]
        return free[0] if free else None

    def plan_rest(self, stay, i, a, b, carried):
        """Lines, small moves and rest beats for a stay between a and b (both inside scene i)."""
        st = self.state(i)
        s0, _ = self.scenes[i]
        settle = self.kind["settle_after_cut_ms"] / 1000.0
        anchor = stay["landed"] if not carried else max(stay["landed"], s0 + settle)
        busy = stay["_busy"]

        line = self.next_line(i)
        if (line and st["talks"] < self.budgets["per_scene"]["lines"] and self.said < self.kind["quiet_after_lines"]):
            tl = max(anchor + self.budgets["line_after_landing_ms"] / 1000.0, a)
            if line["at"] is not None:
                tl = max(tl, float(line["at"]))
            length = self.talk_length(line["text"]) + self.spec.moves["talk_stretch"]["transition_ms"] / 1000.0
            capped = self.per_minute_next("lines", tl)
            if tl + length > b:
                line["_reason"] = (f"needs {tl + length - anchor:.1f} s after landing "
                                   f"({self.budgets['line_after_landing_ms'] / 1000:g} s wait, typing, "
                                   f"{self.spec.moves['talk']['hold_ms'] / 1000:g} s hold); scene {i + 1} had "
                                   f"{max(b - anchor, 0):.1f} s")
            elif capped + length > b:
                line["_reason"] = (f"the limit of {self.kind['per_minute']['lines']} lines per minute for this video type "
                                   f"leaves no room before he has to move or hide at {b:.1f} s in scene {i + 1}")
            else:
                tl = capped
                end = tl + self.talk_length(line["text"])
                release = end + self.spec.moves["talk_stretch"]["transition_ms"] / 1000.0
                layout = bubble_layout(self.spec, self.s, line["text"], stay["box"], (self.W, self.H))
                bx0, by0, bx1, by1 = layout["reach"]
                inside = bx0 >= 0 and by0 >= 0 and bx1 <= self.W and by1 <= self.H
                if not (inside and self.tm.is_free(layout["reach"], tl, end, self.m.pad)):
                    line["_reason"] = f"no clear space for the bubble next to his spot in scene {i + 1}"
                else:
                    self.add("talk", tl, end, text=line["text"], bubble=layout)
                    self.add("talk_squash", tl, tl + self.ms("talk_squash"))
                    self.lines.remove(line)
                    self.said += 1
                    st["talks"] += 1
                    self.starts["lines"].append(tl)
                    busy.append((tl, release))

        gap = self.budgets["small_min_gap_ms"] / 1000.0
        first = self.budgets["first_small_after_landing_ms"] / 1000.0
        allowed = min(self.budgets["per_scene"]["small"], self.kind["small_per_scene"])
        ts = max(stay["landed"] + first, (s0 + settle) if carried else a, a)
        if stay["_last_small"] is not None:
            ts = max(ts, stay["_last_small"] + gap)
        small = self.ms("side_scoot")
        while st["small"] < allowed and ts + small <= b:
            clash = [end for start, end in busy if start < ts + small and ts < end]
            if clash:
                ts = max(clash)
                continue
            if not self.per_minute_ok("small", ts):
                ts = self.per_minute_next("small", ts)
                continue
            kind = "side_scoot" if self.rng.random() < 0.5 else "small_hop"
            self.add(kind, ts, ts + small)
            self.starts["small"].append(ts)
            st["small"] += 1
            stay["_last_small"] = ts
            busy.append((ts, ts + small))
            ts += gap

        beat = self.kind["rest_beat_ms"] / 1000.0
        glance_ms = self.ms("glance")
        hold = self.spec.faces["happy"]["hold_ms"] / 1000.0
        stay["_next_beat"] = max(stay["_next_beat"], a)
        while stay["_next_beat"] < b:
            tb = stay["_next_beat"]
            stay["_beats"] += 1
            glance = stay["_beats"] % 2 == 1
            length = glance_ms if glance else hold
            if tb + length > b:
                stay["_beats"] -= 1
                break
            if any(start < tb + length and tb < end for start, end in busy):
                stay["_beats"] -= 1
                stay["_next_beat"] = tb + beat
                continue
            if glance:
                target = self.glance_target(stay, tb)
                if target is not None:
                    self.add("glance", tb, tb + glance_ms, **target)
                    busy.append((tb, tb + glance_ms))
            else:
                face = "happy" if self.rng.random() < 0.5 else "eyes"
                self.add("express", tb, tb + hold, face=face)
                self.add("express_squash", tb, tb + self.ms("express_squash"))
                busy.append((tb, tb + hold))
            stay["_next_beat"] = tb + length + beat

    def glance_target(self, stay, t):
        x0, y0, x1, y1 = stay["box"]
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        reach = self.spec.moves["glance"]["reach"] * self.s
        near = []
        for bx0, by0, bx1, by1, _ in self.tm.boxes_at(t):
            tx, ty = (bx0 + bx1) / 2, (by0 + by1) / 2
            d = math.hypot(tx - cx, ty - cy)
            if 0 < d < reach:
                near.append((d, tx, ty, [bx0, by0, bx1, by1]))
        if not near:
            return None
        near.sort(key=lambda n: (round(n[0], 3), n[1], n[2]))
        d, tx, ty, box = near[self.rng.randrange(len(near))]
        shift = self.spec.moves["glance"]["shift"]
        return {"gx": shift * (tx - cx) / d, "gy": shift * (ty - cy) / d, "target": box}

    # Main loop -----------------------------------------------------------

    def run(self):
        t = 0.0
        stay = None
        fresh = False
        free_end = None
        hide = self.ms("hide")
        every_cut = self.kind["relocate_policy"] == "every_cut"
        while t < self.duration - 1e-6:
            i = self.scene_at(t)
            a, b = self.scenes[i]
            b = min(b, self.duration)
            if stay is None:
                stay = self.arrive(t, i, after_cut=not self.state(i)["seen"], prev=self._last_spot())
                if stay is None:
                    t = b
                    continue
                free_end = self.tm.free_until(self.m.footprint(*stay["box"][:2]), stay["start"], self.duration)
                t, fresh = stay["landed"], True
                if t >= b - 1e-9:
                    fresh = False
                    continue
            carried = not fresh and abs(t - a) < 1e-9
            fresh = False
            vanish_by = free_end - hide if free_end < self.duration - 1e-6 else self.duration
            seg_end = min(b, vanish_by)
            relocate_at = None
            if carried and every_cut and self.state(i)["big"] < self.budgets["per_scene"]["big"]:
                candidate = self.arrival_time(a, i, after_cut=True)
                if candidate < seg_end:
                    relocate_at = candidate
            if relocate_at is not None:
                if relocate_at > t:
                    self.plan_rest(stay, i, t, relocate_at, carried)
                nxt = self.arrive(relocate_at, i, after_cut=True, prev=stay["box"][:2], deadline=seg_end - 1e-3)
                if nxt is not None:
                    stay["end"] = nxt["start"]
                    stay = nxt
                    free_end = self.tm.free_until(self.m.footprint(*stay["box"][:2]), stay["start"], self.duration)
                    t, fresh = stay["landed"], True
                    continue
                t = relocate_at
            if seg_end > t:
                self.plan_rest(stay, i, t, seg_end, carried)
            if vanish_by >= b - 1e-9:
                t = b
                continue
            vanish = max(vanish_by, t)
            nxt = None
            if self.scene_at(free_end + 0.01) == i:
                nxt = self.arrive(vanish, i, after_cut=False, prev=stay["box"][:2], deadline=free_end - 0.05)
            if nxt is not None:
                stay["end"] = nxt["start"]
                stay = nxt
                free_end = self.tm.free_until(self.m.footprint(*stay["box"][:2]), stay["start"], self.duration)
                t, fresh = stay["landed"], True
                continue
            self.add("hide", vanish, vanish + hide)
            stay["end"] = vanish + hide
            stay, t = None, vanish + hide
        if stay is not None:
            stay["end"] = self.duration
        unplaced = [{"text": line["text"], "scene": line["scene"],
                     "reason": "quiet after enough lines" if self.said >= self.kind["quiet_after_lines"]
                     else line.get("_reason", "no stay in a scene with room for it")} for line in self.lines]
        for event in self.events:
            for key in [k for k in event if k.startswith("_")]:
                del event[key]
        return Timeline(events=self.events, scenes=self.scenes, frame_size=(self.W, self.H), scale=self.s,
                        video_type=self.video_type, seed=self.seed, duration=self.duration,
                        unplaced_lines=unplaced, spec_version=self.spec.data["version"])

    def _last_spot(self):
        stays = [e for e in self.events if e["kind"] == "stay"]
        return stays[-1]["box"][:2] if stays else None


def schedule(spec, *, video_type, duration, frame_size, scenes=None, textmap, lines=(), seed=0, mascot_height=None):
    planner = _Planner(spec, video_type, duration, frame_size, scenes, textmap, lines, seed, mascot_height)
    return planner.run()
