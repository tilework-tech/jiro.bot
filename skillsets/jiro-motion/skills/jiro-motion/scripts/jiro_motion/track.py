"""Evaluate a timeline into Jiro's pose on every frame.

The pose mirrors the v6 DOM: an aside (position, pop-in, peek, flight,
fades) holding nested bob > drift > tilt > squash > hop layers around the
art, plus the shadow, dust puff, z's and speech bubble. Each frame records
the channel values per layer (what the checker measures), the resulting
matrices (what the drawer paints) and the ink and bubble boxes.
"""

import json
import math


from .geometry import Mascot, affine, apply_box, union
from .spec import ease, parse_easing

HOP_EVENTS = ("landing_squash", "peek_landing_hop", "side_scoot", "small_hop", "express_squash", "talk_squash")
IDENTITY = {"tx": 0.0, "ty": 0.0, "rot": 0.0, "sx": 1.0, "sy": 1.0, "opacity": 1.0}


def _compose(parts):
    out = dict(IDENTITY)
    for p in parts:
        out["tx"] += p.get("tx", 0.0)
        out["ty"] += p.get("ty", 0.0)
        out["rot"] += p.get("rot", 0.0)
        out["sx"] *= p.get("sx", 1.0)
        out["sy"] *= p.get("sy", 1.0)
        out["opacity"] *= p.get("opacity", 1.0)
    return out


def _m(ch, origin):
    return affine(ch.get("tx", 0.0), ch.get("ty", 0.0), ch.get("rot", 0.0), ch.get("sx", 1.0), ch.get("sy", 1.0), origin)


class Track:
    def __init__(self, frames, fps, frame_size, scale):
        self.frames, self.fps, self.frame_size, self.scale = frames, fps, tuple(frame_size), scale

    def to_json(self):
        def clean(v):
            if isinstance(v, float):
                return round(v, 4)
            if isinstance(v, dict):
                return {k: clean(x) for k, x in v.items() if not k.startswith("_")}
            if isinstance(v, (list, tuple)):
                return [clean(x) for x in v]
            return v
        return json.dumps({"fps": self.fps, "frame_size": list(self.frame_size), "scale": self.scale,
                           "frames": clean(self.frames)})


def load_track(text):
    data = json.loads(text)
    return Track(data["frames"], data["fps"], data["frame_size"], data["scale"])


class _Pose:
    def __init__(self, spec, timeline):
        self.spec, self.tl = spec, timeline
        self.s = timeline.scale
        self.m = Mascot(spec, self.s)
        self.stays = sorted((e for e in timeline.events if e["kind"] == "stay"), key=lambda e: e["start"])
        self.by_kind = {}
        for e in timeline.events:
            self.by_kind.setdefault(e["kind"], []).append(e)
        o = spec.layers["origins"]
        w, ah = self.m.w, self.m.art_h
        self.origin = {name: (o[name][0] * w, o[name][1] * ah) for name in ("bob", "drift", "tilt", "squash", "hop", "art")}
        self.origin["aside"] = (o["aside"][0] * w, o["aside"][1] * self.m.h)
        stretch = spec.moves["talk_stretch"]
        self.stretch_to = stretch["to"]
        self.stretch_ms = stretch["transition_ms"]
        self.stretch_ease = parse_easing(stretch["transition"])
        glance = spec.moves["glance"]["transition"].split(" ", 1)
        self.glance_ms = float(glance[0].rstrip("ms"))
        self.glance_ease = parse_easing(glance[1])

    def active(self, kind, t):
        return [e for e in self.by_kind.get(kind, []) if e["start"] <= t < e["end"]]

    def stay_at(self, t):
        for stay in self.stays:
            if stay["start"] <= t < stay["end"]:
                return stay
        return None

    def aside(self, stay, t):
        x0, y0 = stay["box"][0], stay["box"][1]
        ch = dict(IDENTITY)
        pos = [x0, y0]
        for kind in ("pop_in", "relocate", "hide"):
            for e in self.active(kind, t):
                ch = _compose([ch, self.spec.sample(kind, (t - e["start"]) * 1000, self.s)])
        for e in self.active("edge_peek", t):
            c = self.spec.sample("edge_peek", (t - e["start"]) * 1000, self.s)
            pos = [e["out_x"] + (e["edge_x"] - e["out_x"]) * c["edge_mix"], e["y"]]
            ch["opacity"] *= c["opacity"]
        for e in self.active("fly_in", t):
            arc = self.spec.moves["fly_in"]["arc"]
            u = (t - e["start"]) / (e["end"] - e["start"])
            k = (1 - math.cos(math.pi * u)) / 2
            (fx, fy), (tx, ty) = e["from"], e["to"]
            lift = arc["lift_down"] if ty > fy else arc["lift_up"]
            cy = min(fy, ty) - lift * self.s
            pos = [fx + (tx - fx) * k, (1 - k) ** 2 * fy + 2 * (1 - k) * k * cy + k * k * ty]
            direction = 1 if fx < tx else -1
            ch["rot"] += arc["rot_peak"] * math.sin(math.pi * u) * direction
        return pos, ch

    def stretch(self, t):
        sx = sy = 1.0
        to = self.stretch_to
        for e in self.by_kind.get("talk", []):
            if e["start"] <= t < e["end"]:
                k = ease(self.stretch_ease, min((t - e["start"]) * 1000 / self.stretch_ms, 1.0))
                return {"sx": 1 + (to["sx"] - 1) * k, "sy": 1 + (to["sy"] - 1) * k}
            if e["end"] <= t < e["end"] + self.stretch_ms / 1000:
                k = ease(self.stretch_ease, (t - e["end"]) * 1000 / self.stretch_ms)
                return {"sx": to["sx"] + (1 - to["sx"]) * k, "sy": to["sy"] + (1 - to["sy"]) * k}
        return {"sx": sx, "sy": sy}

    def face(self, stay, t):
        rest = self.spec.idles[stay["idle"]].get("face", "cursor")
        if self.active("talk", t):
            return "cursor", 0.0, 0.0
        for e in self.active("express", t):
            return e["face"], 0.0, 0.0
        for e in self.by_kind.get("glance", []):
            end_out = e["end"] + self.glance_ms / 1000
            if e["start"] <= t < end_out:
                if t < e["end"]:
                    k = ease(self.glance_ease, min((t - e["start"]) * 1000 / self.glance_ms, 1.0))
                else:
                    k = 1 - ease(self.glance_ease, (t - e["end"]) * 1000 / self.glance_ms)
                return ("glance" if t < e["end"] else rest), e["gx"] * k, e["gy"] * k
        return rest, 0.0, 0.0

    def frame(self, t):
        stay = self.stay_at(t)
        if stay is None:
            return {"t": t, "visible": False, "opacity": 0.0, "ink_box": None, "bubble_box": None, "active": []}
        m, s = self.m, self.s
        pos, aside_ch = self.aside(stay, t)
        idle_t = (t - stay["start"]) * 1000
        idle = self.spec.sample_idle(stay["idle"], idle_t, s)
        hop_events = sorted((e for kind in HOP_EVENTS for e in self.active(kind, t)), key=lambda e: e["start"])
        hop_source = hop_events[-1] if hop_events else None
        hop = _compose([self.spec.sample(hop_source["kind"], (t - hop_source["start"]) * 1000, s)] if hop_source else [])
        art = self.stretch(t)
        idle_def = self.spec.idles[stay["idle"]]
        art_opacity = self.spec.mascot["art"]["sleepy_opacity"] if idle_def.get("dim") else 1.0
        face, gx, gy = self.face(stay, t)
        layers = {"aside": aside_ch, "hop": hop, "art": art}
        for name in ("bob", "drift", "tilt", "squash"):
            layers[name] = idle.get(name, dict(IDENTITY))
        aside_m = affine(pos[0], pos[1]) @ _m(aside_ch, self.origin["aside"])
        chain = aside_m
        for name in ("bob", "drift", "tilt", "squash", "hop"):
            chain = chain @ _m(layers[name], self.origin[name])
        art_m = chain @ _m(art, self.origin["art"])
        boxes = [apply_box(art_m, m.art_ink)]
        shadow_ch = idle.get("shadow", dict(IDENTITY))
        sh = m.shadow
        shadow_m = aside_m @ _m(shadow_ch, ((sh[0] + sh[2]) / 2, (sh[1] + sh[3]) / 2))
        boxes.append(apply_box(shadow_m, sh))
        puff = None
        for e in self.active("dust_puff", t):
            puff = self.spec.sample("dust_puff", (t - e["start"]) * 1000, s)
        puff_m = None
        if puff:
            pf = m.puff
            puff_m = aside_m @ _m(puff, ((pf[0] + pf[2]) / 2, pf[3] - 2 * s))
            boxes.append(apply_box(puff_m, pf))
        zzz = idle.get("zzz")
        zzz_m = None
        if zzz and zzz["opacity"] > 0.01:
            zzz_m = chain @ _m({"tx": zzz["tx"], "ty": zzz["ty"]}, (0, 0))
            boxes.append(apply_box(zzz_m, m.zzz))
        bubble = None
        for e in self.active("talk", t):
            layout = e["bubble"]
            pop = self.spec.sample("bubble_pop", (t - e["start"]) * 1000, s)
            bx0, by0, bx1, by1 = layout["box"]
            origin = ((bx0 + bx1) / 2, by1 if not layout["below"] else by1)
            bubble_m = _m(pop, origin)
            per_char = self.spec.moves["talk"]["type_ms_per_char"]
            shown = min(len(e["text"]), 1 + int((t - e["start"]) * 1000 // per_char))
            bubble = {"layout": layout, "text": e["text"], "shown": shown, "opacity": pop["opacity"],
                      "matrix": bubble_m.tolist(), "box": apply_box(bubble_m, layout["box"])}
        opacity = aside_ch["opacity"]
        eyes = self.spec.sample_loop(self.spec.faces["eyes"]["blink"], t * 1000)["sy"] if face == "eyes" else 1.0
        blink = self.spec.faces["cursor"]["blink_ms"]
        return {
            "t": t, "visible": opacity > 1e-3, "opacity": opacity, "idle": stay["idle"], "face": face,
            "glance": [gx, gy], "eyes_sy": eyes, "cursor_on": (t * 1000) % blink < blink / 2,
            "art_opacity": art_opacity, "layers": layers, "shadow": shadow_ch,
            "puff": puff, "zzz": zzz,
            "matrices": {"art": art_m.tolist(), "shadow": shadow_m.tolist(),
                         "puff": puff_m.tolist() if puff_m is not None else None,
                         "zzz": zzz_m.tolist() if zzz_m is not None else None},
            "ink_box": union(boxes) if opacity > 1e-3 else None,
            "bubble": bubble,
            "bubble_box": bubble["box"] if bubble and bubble["opacity"] > 1e-3 and opacity > 1e-3 else None,
            "rest_box": list(stay["box"]),
            "hop_source": [hop_source["kind"], hop_source["start"]] if hop_source else None,
            "active": sorted({e["kind"] for e in self.tl.events if e["kind"] != "stay" and e["start"] <= t < e["end"]}),
        }


def build_track(spec, timeline, fps):
    pose = _Pose(spec, timeline)
    count = int(round(timeline.duration * fps))
    frames = [pose.frame(n / fps) for n in range(count)]
    return Track(frames, fps, timeline.frame_size, timeline.scale)
