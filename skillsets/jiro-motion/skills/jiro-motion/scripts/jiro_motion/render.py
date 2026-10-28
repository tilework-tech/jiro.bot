"""`jm render`: footage in, Jiro overlay (WebM + ProRes 4444) and composited MP4 out."""

import hashlib
import json
import sys
import time
from pathlib import Path

import cv2
import numpy as np

from . import video
from .check import check
from .draw import Painter
from .scheduler import Timeline, _Planner, schedule
from .spec import load_spec
from .textdetect import build_textmap
from .track import build_track, load_track
from .textmap import TextMap


def log(msg):
    print(f"[jiro-motion] {msg}", file=sys.stderr, flush=True)


def read_lines(path):
    if not path:
        return []
    text = Path(path).read_text()
    if path.endswith(".json"):
        return json.loads(text)
    return [line.strip() for line in text.splitlines() if line.strip()]


def parse_cuts(arg, path, info):
    if arg == "none":
        return []
    if arg:
        return sorted(float(v) for v in arg.split(",") if v.strip())
    cuts = video.detect_cuts(path)
    return [c for c in cuts if 0.3 < c < info["duration"] - 0.3]


def scenes_from(cuts, duration):
    bounds = [0.0] + list(cuts) + [duration]
    return [(a, b) for a, b in zip(bounds, bounds[1:]) if b - a > 1e-3]


class AllowedRegions:
    """Where his resting body may be at each text sample (for the debug view), built on demand."""

    def __init__(self, spec, textmap, timeline):
        self.planner = _Planner(spec, timeline.video_type, timeline.duration, timeline.frame_size, timeline.scenes,
                                textmap, [], 0, timeline.scale * spec.mascot["ref_height"])
        self.textmap = textmap
        self.W, self.H = timeline.frame_size
        self.cache = {}

    def at(self, t):
        if t not in self.cache:
            if len(self.cache) > 4:
                self.cache.clear()
            mask = np.zeros((self.H, self.W), dtype=bool)
            if len(self.planner.footprints):
                free = self.textmap.free_many(self.planner.footprints, t, t)
                for x0, y0, x1, y1 in self.planner.mascot_boxes[np.flatnonzero(free)]:
                    mask[int(y0):int(y1), int(x0):int(x1)] = True
            self.cache[t] = mask
        return self.cache[t]


def debug_frame(rgb, overlay, frame, textmap, masks, timeline, spec):
    """Composite plus detected boxes, allowed regions, centre band and Jiro's boxes."""
    img = rgb.astype(np.float32)
    t = frame["t"]
    idx = textmap.sample_indices(t, t)
    if idx:
        mask = masks.at(textmap.times[idx[0]])
        for i in idx[1:]:
            mask = mask & masks.at(textmap.times[i])
        img[mask] = img[mask] * 0.65 + np.array([60, 220, 110]) * 0.35
    W, H = timeline.frame_size
    if W >= H:
        lo, hi = spec.placement["centre_band"]
        band = img[:, int(lo * W):int(hi * W)]
        band[:] = band * 0.85 + np.array([220, 60, 60]) * 0.15
    a = overlay[..., 3:4].astype(np.float32) / 255
    img = img * (1 - a) + overlay[..., :3].astype(np.float32) * a
    out = np.ascontiguousarray(img.clip(0, 255).astype(np.uint8))
    for x0, y0, x1, y1, label in textmap.boxes_at(t):
        colour = (235, 50, 50) if label == "text" else (255, 160, 0)
        cv2.rectangle(out, (int(x0), int(y0)), (int(x1), int(y1)), colour, 2)
    for box, colour in ((frame.get("ink_box"), (0, 200, 255)), (frame.get("bubble_box"), (180, 90, 255))):
        if box and frame["visible"]:
            cv2.rectangle(out, (int(box[0]), int(box[1])), (int(box[2]), int(box[3])), colour, 2)
    scene = textmap.scene_index(t)
    label = f"{t:6.2f}s  scene {scene + 1}  " + " ".join(frame.get("active", []))
    cv2.rectangle(out, (0, 0), (W, 34), (20, 20, 20), -1)
    cv2.putText(out, label, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
    return out


def run(args):
    started = time.time()
    spec = load_spec(args.spec)
    spec.type(args.type)
    src = Path(args.input)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    info = video.probe(src)
    fps = info["fps"]
    log(f"input {info['width']}x{info['height']} {fps:g} fps {info['duration']:.2f}s audio={info['audio']}")

    cuts = parse_cuts(args.cuts, src, info)
    scenes = scenes_from(cuts, info["duration"])
    log(f"{len(scenes)} scene(s); cuts at {cuts} ({'given' if args.cuts else 'auto-detected'})")

    textmap_path = out / "textmap.json"
    if args.reuse_textmap and textmap_path.exists():
        textmap = TextMap.load(textmap_path)
        log("reusing textmap.json")
    else:
        textmap = build_textmap(src, info, cuts, interval=args.sample_interval,
                                chrome_threshold=spec.placement["chrome_edge_density"],
                                progress=lambda n, total: log(f"text detection {n}/{total}") if n % 10 == 0 or n == total else None)
        textmap.save(textmap_path)
        textmap = TextMap.load(textmap_path)

    lines = read_lines(args.lines)
    timeline = schedule(spec, video_type=args.type, duration=info["duration"], frame_size=(info["width"], info["height"]),
                        scenes=scenes, textmap=textmap, lines=lines, seed=args.seed, mascot_height=args.mascot_height)
    (out / "timeline.json").write_text(timeline.to_json())
    for line in timeline.unplaced_lines:
        log(f"line not placed ({line['reason']}): {line['text']!r}")
    track = build_track(spec, timeline, fps)
    (out / "track.json").write_text(track.to_json())

    size = (info["width"], info["height"])
    painter = Painter(spec, timeline.scale)
    writer = video.OverlayWriter(out / "overlay.webm", out / "overlay.mov", size, fps)
    digest = hashlib.sha256()
    for frame in track.frames:
        rgba = painter.paint(frame, size)
        digest.update(rgba.tobytes())
        writer.write(rgba)
    writer.close()
    log("overlay written (overlay.webm, overlay.mov)")
    video.composite(src, out / "overlay.mov", out / "composite.mp4", info["audio"])
    log("composite.mp4 written")

    report = run_check(spec, args.type, out, textmap)
    if not args.no_debug:
        masks = AllowedRegions(spec, textmap, timeline)
        dbg = video.Mp4Writer(out / "debug.mp4", size, fps, crf=23)
        for frame, rgb in zip(track.frames, video.frames(src)):
            dbg.write(debug_frame(rgb, painter.paint(frame, size), frame, textmap, masks, timeline, spec))
        dbg.close()
        log("debug.mp4 written")

    manifest = {
        "input": str(src.resolve()), "type": args.type, "seed": args.seed, "spec": str(spec.path),
        "spec_version": spec.data["version"], "fps": fps, "size": list(size), "duration": info["duration"],
        "cuts": cuts, "cuts_source": "given" if args.cuts else "auto (frame-difference spikes)", "scale": timeline.scale,
        "mascot_height_px": round(timeline.scale * spec.mascot["ref_height"], 2),
        "lines": lines, "unplaced_lines": timeline.unplaced_lines, "overlay_rgba_sha256": digest.hexdigest(),
        "check_passed": report.passed, "seconds": round(time.time() - started, 1),
        "files": sorted(p.name for p in out.iterdir() if p.is_file()),
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1))
    log(f"check {'PASS' if report.passed else 'FAIL'}: {sum(r['passed'] for r in report.rules)}/{len(report.rules)} rules")
    log(f"done in {manifest['seconds']}s -> {out}")
    return 0 if report.passed else 2


def webm_alpha_rule(out):
    """The WebM's alpha must match the ProRes alpha (VP9 alpha is lossy, so allow faint ringing)."""
    frames, bad, ink = 0, 0, 0
    worst = 0.0
    for mov, webm in zip(video.frames(out / "overlay.mov", pix_fmt="rgba"),
                         video.frames(out / "overlay.webm", pix_fmt="rgba", decoder="libvpx-vp9")):
        frames += 1
        a, b = mov[..., 3].astype(np.int16), webm[..., 3].astype(np.int16)
        drawn = int((a > 8).sum())
        if not drawn:
            if (b > 96).any():
                bad += 1
            continue
        ink += 1
        off = int((np.abs(a - b) > 96).sum()) / drawn
        worst = max(worst, off)
        if off > 0.01:
            bad += 1
    ok = frames > 0 and ink > 0 and bad == 0
    return {"id": "overlay_webm_alpha", "passed": ok,
            "detail": f"WebM decodes with alpha: {frames} frames; worst frame has {worst:.2%} of Jiro's pixels "
                      f"off by >96/255 alpha vs ProRes ({bad} frames over 1%)",
            "measured": {"frames": frames, "frames_with_jiro": ink, "bad": bad, "worst_fraction": round(worst, 5)}}


def run_check(spec, video_type, out, textmap=None):
    out = Path(out)
    timeline = Timeline.from_json((out / "timeline.json").read_text())
    track = load_track((out / "track.json").read_text())
    textmap = textmap or TextMap.load(out / "textmap.json")
    report = check(spec, video_type=video_type, timeline=timeline, track=track, textmap=textmap,
                   frame_size=timeline.frame_size, frames=video.frames(out / "overlay.mov", pix_fmt="rgba"))
    report.rules.append(webm_alpha_rule(out))
    (out / "check.json").write_text(report.to_json())
    (out / "check.md").write_text(report.to_markdown())
    return report
