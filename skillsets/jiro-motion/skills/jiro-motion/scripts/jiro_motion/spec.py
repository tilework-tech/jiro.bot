"""Load, validate and sample the Jiro motion spec (spec/motion-spec.json).

Sampling follows Web Animations semantics, which is what v6 runs on: the
effect easing maps overall progress first, then each channel interpolates
between the keyframes that define it, eased by the starting keyframe's
segment easing. Segment easings may overshoot (cubic-bezier y > 1), which is
where pop-in and the talk stretch get their bounce.
"""

import json
import math
import re
from pathlib import Path

DEFAULT_SPEC = Path(__file__).resolve().parents[2] / "spec" / "motion-spec.json"

CHANNELS = {"tx": 0.0, "ty": 0.0, "rot": 0.0, "sx": 1.0, "sy": 1.0, "opacity": 1.0, "edge_mix": 0.0}
LENGTH_CHANNELS = ("tx", "ty")
NAMED_EASINGS = {
    "linear": None,
    "ease": (0.25, 0.1, 0.25, 1.0),
    "ease-in": (0.42, 0.0, 1.0, 1.0),
    "ease-out": (0.0, 0.0, 0.58, 1.0),
    "ease-in-out": (0.42, 0.0, 0.58, 1.0),
}
SYMBOLIC_X = {"out": 0.0, "edge": 1.0}


class SpecError(ValueError):
    pass


def parse_easing(text):
    text = (text or "linear").strip()
    if text in NAMED_EASINGS:
        return NAMED_EASINGS[text]
    match = re.fullmatch(r"cubic-bezier\(([^)]*)\)", text)
    if not match:
        raise SpecError(f"unknown easing {text!r}")
    points = tuple(float(v) for v in match.group(1).split(","))
    if len(points) != 4 or not (0 <= points[0] <= 1 and 0 <= points[2] <= 1):
        raise SpecError(f"bad cubic-bezier {text!r}")
    return points


def ease(points, x):
    if points is None:
        return x
    if x <= 0:
        return 0.0 if x == 0 else x
    if x >= 1:
        return 1.0
    x1, y1, x2, y2 = points

    def bez(a, b, u):
        return 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3

    lo, hi = 0.0, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if bez(x1, x2, mid) < x:
            lo = mid
        else:
            hi = mid
    return bez(y1, y2, (lo + hi) / 2)


def _channel_tracks(keyframes, default_ease):
    tracks = {}
    for frame in keyframes:
        segment = parse_easing(frame.get("ease", default_ease))
        for name, value in frame.items():
            if name in ("o", "ease"):
                continue
            if name == "x":
                name, value = "edge_mix", SYMBOLIC_X[value]
            tracks.setdefault(name, []).append((frame["o"], float(value), segment))
    for name, points in tracks.items():
        if points[0][0] > 0:
            points.insert(0, (0.0, CHANNELS[name], None))
        if points[-1][0] < 1:
            points.append((1.0, CHANNELS[name], None))
    return tracks


def _interpolate(tracks, progress, scale):
    out = {}
    for name, points in tracks.items():
        value = points[-1][1]
        for (o0, v0, seg), (o1, v1, _) in zip(points, points[1:]):
            if progress <= o1 or (o1 == points[-1][0]):
                local = 0.0 if o1 == o0 else min(max((progress - o0) / (o1 - o0), 0.0), 1.0)
                value = v0 + (v1 - v0) * ease(seg, local)
                break
        out[name] = value * scale if name in LENGTH_CHANNELS else value
    return out


class Spec:
    def __init__(self, data, path):
        self.data = data
        self.path = Path(path)
        self.moves = data["moves"]
        self.idles = data["idles"]
        self.faces = data["faces"]
        self.budgets = data["budgets"]
        self.placement = data["placement"]
        self.mascot = data["mascot"]
        self.tolerances = data["tolerances"]
        self.rest = data["rest"]
        self.layers = data["layers"]
        self.types = list(data["types"])
        self._tracks = {}
        for name, move in self.moves.items():
            if "keyframes" in move:
                self._tracks[name] = (_channel_tracks(move["keyframes"], "linear"), parse_easing(move.get("easing")))
        for name, idle in self.idles.items():
            for layer, spec in idle["layers"].items():
                self._tracks[(name, layer)] = (_channel_tracks(spec["keyframes"], spec.get("ease", "ease-in-out")), None)

    def type(self, name):
        if name not in self.data["types"]:
            raise SpecError(f"unknown video type {name!r}; known types: {', '.join(self.types)}")
        return self.data["types"][name]

    def duration(self, move):
        return self.moves[move]["duration_ms"]

    def sample(self, move, t_ms, scale=1.0):
        """Channel values of a keyframed move at t_ms after it starts."""
        tracks, effect = self._tracks[move]
        progress = ease(effect, min(max(t_ms / self.moves[move]["duration_ms"], 0.0), 1.0))
        return _interpolate(tracks, progress, scale)

    def sample_idle(self, idle, t_ms, scale=1.0):
        """Per-layer channel values of a looping idle hover at t_ms after it started."""
        out = {}
        for layer, spec in self.idles[idle]["layers"].items():
            tracks, _ = self._tracks[(idle, layer)]
            progress = (t_ms % spec["period_ms"]) / spec["period_ms"]
            out[layer] = _interpolate(tracks, progress, scale)
        return out

    def sample_loop(self, loop, t_ms):
        """Channel values of a looping keyframe block such as faces.eyes.blink."""
        key = id(loop)
        if key not in self._tracks:
            self._tracks[key] = (_channel_tracks(loop["keyframes"], loop.get("ease", "linear")), None)
        tracks, _ = self._tracks[key]
        return _interpolate(tracks, (t_ms % loop["period_ms"]) / loop["period_ms"], 1.0)

    def keyframe_extremes(self, move, scale=1.0):
        """Largest deviation from identity each channel reaches at a keyframe."""
        out = {}
        for frame in self.moves[move].get("keyframes", []):
            for name, value in frame.items():
                if name in CHANNELS and isinstance(value, (int, float)):
                    dev = (value - CHANNELS[name]) * (scale if name in LENGTH_CHANNELS else 1)
                    if abs(dev) > abs(out.get(name, 0.0)):
                        out[name] = dev
        return out

    def envelope(self, scale=1.0):
        """Most any rest-time move or hover can push the art from its spot, in px."""
        up = down = side = 0.0
        sources = [self.moves[m] for m in self.moves if self.moves[m].get("layer") == "hop"]
        for source in sources:
            for frame in source.get("keyframes", []):
                up = max(up, -frame.get("ty", 0))
                down = max(down, frame.get("ty", 0))
                side = max(side, abs(frame.get("tx", 0)))
        for idle in self.idles.values():
            for spec in idle["layers"].values():
                for frame in spec["keyframes"]:
                    up = max(up, -frame.get("ty", 0))
                    down = max(down, frame.get("ty", 0))
                    side = max(side, abs(frame.get("tx", 0)))
        stretch = self.moves["talk_stretch"]["to"]
        overshoot = 1.25
        up += self.mascot["art"]["art_height"] * (stretch["sy"] - 1) * overshoot
        side += self.mascot["ref_width"] * (stretch["sx"] - 1) / 2 * overshoot + 2
        return {"up": up * scale, "down": down * scale, "side": side * scale}


def _validate(data):
    moves, idles = data.get("moves", {}), data.get("idles", {})
    for name, move in moves.items():
        if "duration_ms" in move and not (isinstance(move["duration_ms"], (int, float)) and move["duration_ms"] > 0):
            raise SpecError(f"move {name}: duration_ms must be positive")
        frames = move.get("keyframes")
        if frames is not None:
            offsets = [f.get("o") for f in frames]
            if any(not isinstance(o, (int, float)) or o < 0 or o > 1 for o in offsets) or offsets != sorted(offsets):
                raise SpecError(f"move {name}: keyframe offsets must be ascending within 0..1")
            for frame in frames:
                if "ease" in frame:
                    parse_easing(frame["ease"])
        if "easing" in move:
            parse_easing(move["easing"])
    for name, idle in idles.items():
        for layer, spec in idle["layers"].items():
            if spec.get("period_ms", 0) <= 0:
                raise SpecError(f"idle {name}.{layer}: period_ms must be positive")
            offsets = [f["o"] for f in spec["keyframes"]]
            if offsets != sorted(offsets) or offsets[0] < 0 or offsets[-1] > 1:
                raise SpecError(f"idle {name}.{layer}: keyframe offsets must be ascending within 0..1")
    budgets = data["budgets"]
    for key in ("big_moves", "small_moves"):
        for move in budgets[key]:
            if move not in moves:
                raise SpecError(f"budgets.{key} names unknown move {move!r}")
    for idle in budgets["bouncy_hovers"]:
        if idle not in idles:
            raise SpecError(f"budgets.bouncy_hovers names unknown hover {idle!r}")
    required = ("idle_odds", "relocate_policy", "settle_after_cut_ms", "edge_peek", "per_minute",
                "small_per_scene", "quiet_after_lines", "rest_beat_ms")
    for name, video_type in data["types"].items():
        missing = [k for k in required if k not in video_type]
        if missing:
            raise SpecError(f"type {name}: missing {', '.join(missing)}")
        unknown = [k for k in video_type["idle_odds"] if k not in idles]
        if unknown:
            raise SpecError(f"type {name}: idle_odds names unknown hover {', '.join(unknown)}")
        total = sum(video_type["idle_odds"].values())
        if not math.isclose(total, 1.0, abs_tol=1e-6):
            raise SpecError(f"type {name}: idle_odds sum to {total:g}, not 1")
        if video_type["relocate_policy"] not in ("when_needed", "every_cut"):
            raise SpecError(f"type {name}: relocate_policy must be when_needed or every_cut")


def load_spec(path=None):
    path = Path(path or DEFAULT_SPEC)
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as error:
        raise SpecError(f"{path}: {error}") from error
    _validate(data)
    return Spec(data, path)
