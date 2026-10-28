import atexit
import json
import os
import tempfile
import unittest
from pathlib import Path

import numpy as np

from jiro_motion.check import check
from jiro_motion.draw import render_frames
from jiro_motion.scheduler import schedule, Timeline
from jiro_motion.spec import DEFAULT_SPEC, load_spec
from jiro_motion.textmap import TextMap
from jiro_motion.track import build_track

W, H = 640, 360
FPS = 15
SCENES = [(0.0, 7.0), (7.0, 14.0)]


def clean_textmap(boxes=()):
    samples = [(t / 2, list(boxes)) for t in range(28)]
    return TextMap(W, H, samples, cuts=[7.0])


def spec_variant(mutate):
    data = json.loads(Path(DEFAULT_SPEC).read_text())
    mutate(data)
    handle = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(data, handle)
    handle.close()
    atexit.register(os.unlink, handle.name)
    return load_spec(handle.name)


def produce(spec, textmap, seed=3, video_type="release_showcase", lines=("Hi, I'm Jiro.",)):
    tl = schedule(spec, video_type=video_type, duration=14.0, frame_size=(W, H), scenes=SCENES,
                  textmap=textmap, lines=list(lines), seed=seed)
    return tl, build_track(spec, tl, FPS)


def without_small(timeline):
    copy = Timeline.from_json(timeline.to_json())
    copy.events = [e for e in copy.events if e["kind"] not in ("side_scoot", "small_hop")]
    return copy


def first_stay(timeline, scene):
    return min((e for e in timeline.events if e["kind"] == "stay" and e["scene"] == scene),
               key=lambda e: e["landed"])


def failed(report):
    return {r["id"] for r in report.rules if not r["passed"]}


class CheckerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec = load_spec()
        cls.textmap = clean_textmap()
        cls.timeline, cls.track = produce(cls.spec, cls.textmap)
        cls.frames = list(render_frames(cls.spec, cls.track, (W, H)))

    def run_check(self, timeline=None, track=None, textmap=None, frames=None, video_type="release_showcase"):
        return check(self.spec, video_type=video_type,
                     timeline=self.timeline if timeline is None else timeline,
                     track=self.track if track is None else track,
                     textmap=self.textmap if textmap is None else textmap,
                     frame_size=(W, H), frames=frames)

    def test_integration_a_clean_render_passes_every_rule(self):
        report = self.run_check(frames=self.frames)
        self.assertTrue(report.passed, [r for r in report.rules if not r["passed"]])
        ids = {r["id"] for r in report.rules}
        for expected in ["amplitude:", "duration:pop_in", "curve:", "no_text_overlap", "edge_margin",
                         "count_per_scene:small", "small_spacing", "rest_before_relocate",
                         "per_minute:small", "track_matches_pixels"]:
            self.assertTrue(any(i == expected or i.startswith(expected) for i in ids), expected)

    def test_overlap_with_text_is_measured_on_pixels(self):
        stay = next(e for e in self.timeline.events if e["kind"] == "stay")
        x0, y0, x1, y1 = stay["box"]
        covered = clean_textmap([((x0 + x1) / 2 - 10, (y0 + y1) / 2 - 10, (x0 + x1) / 2 + 10, (y0 + y1) / 2 + 10)])
        report = self.run_check(textmap=covered, frames=self.frames)
        self.assertIn("no_text_overlap", failed(report))
        detail = next(r for r in report.rules if r["id"] == "no_text_overlap")
        self.assertGreater(detail["measured"]["frames"], 0)
        blank = [np.zeros_like(frame) for frame in self.frames]
        self.assertNotIn("no_text_overlap", failed(self.run_check(textmap=covered, frames=blank)))

    def test_a_render_with_a_bigger_hop_fails_the_amplitude_rule(self):
        loud = spec_variant(lambda d: d["moves"]["small_hop"]["keyframes"][1].update(ty=-12))
        timeline = without_small(self.timeline)
        stay = first_stay(timeline, 0)
        start = stay["landed"] + 2.0
        timeline.events.append({"kind": "small_hop", "start": start, "end": start + 0.5, "scene": 0})
        self.assertEqual(failed(self.run_check(timeline=timeline, track=build_track(self.spec, timeline, FPS))), set())
        report = self.run_check(timeline=timeline, track=build_track(loud, timeline, FPS))
        self.assertIn("amplitude:small_hop", failed(report))

    def test_a_render_with_a_slower_pop_in_fails_the_duration_rule(self):
        slow = spec_variant(lambda d: d["moves"]["pop_in"].update(duration_ms=1400))
        timeline, track = produce(slow, self.textmap)
        report = self.run_check(timeline=timeline, track=track)
        self.assertIn("duration:pop_in", failed(report))

    def test_too_many_small_moves_in_a_scene_fail(self):
        timeline = without_small(self.timeline)
        stay = first_stay(timeline, 0)
        for k in range(3):
            start = min(stay["landed"] + 1.0 + 2.0 * k, SCENES[0][1] - 0.6)
            timeline.events.append({"kind": "side_scoot", "start": start, "end": start + 0.5, "scene": 0})
        track = build_track(self.spec, timeline, FPS)
        report = self.run_check(timeline=timeline, track=track)
        self.assertIn("count_per_scene:small", failed(report))

    def test_small_moves_closer_than_two_seconds_fail_spacing(self):
        timeline = without_small(self.timeline)
        stay = first_stay(timeline, 0)
        for start in (stay["landed"] + 2.0, stay["landed"] + 3.0):
            timeline.events.append({"kind": "small_hop", "start": start, "end": start + 0.5, "scene": 0})
        track = build_track(self.spec, timeline, FPS)
        report = self.run_check(timeline=timeline, track=track)
        self.assertIn("small_spacing", failed(report))

    def test_pixels_that_do_not_match_the_track_fail(self):
        shifted = [np.roll(frame, 40, axis=1) for frame in self.frames]
        report = self.run_check(frames=shifted)
        self.assertIn("track_matches_pixels", failed(report))

    def test_resting_in_the_centre_band_fails(self):
        timeline = Timeline.from_json(self.timeline.to_json())
        for event in timeline.events:
            if event["kind"] == "stay":
                x0, y0, x1, y1 = event["box"]
                dx = W / 2 - (x0 + x1) / 2
                event["box"] = [x0 + dx, y0, x1 + dx, y1]
        report = self.run_check(timeline=timeline, track=build_track(self.spec, timeline, FPS))
        self.assertIn("centre_band", failed(report))

    def test_budgets_come_from_the_video_type(self):
        timeline = without_small(self.timeline)
        for scene in range(len(SCENES)):
            stay = first_stay(timeline, scene)
            for start in (stay["landed"] + 2.0, stay["landed"] + 4.0):
                start = min(start, SCENES[scene][1] - 0.6)
                timeline.events.append({"kind": "small_hop", "start": start, "end": start + 0.5, "scene": scene})
        track = build_track(self.spec, timeline, FPS)
        lively = self.run_check(timeline=timeline, track=track, video_type="release_showcase")
        calm = self.run_check(timeline=timeline, track=track, video_type="explainer")
        self.assertNotIn("count_per_scene:small", failed(lively))
        self.assertIn("count_per_scene:small", failed(calm))
        self.assertIn("per_minute:small", failed(calm))


if __name__ == "__main__":
    unittest.main()
