import unittest

from jiro_motion.scheduler import schedule
from jiro_motion.spec import load_spec
from jiro_motion.textmap import TextMap
from jiro_motion.track import build_track

W, H = 1280, 720
FPS = 30


def scenes_of(*lengths):
    out, t = [], 0.0
    for length in lengths:
        out.append((t, t + length))
        t += length
    return out


def textmap(scenes, boxes_at=lambda t: [], step=0.5):
    samples = []
    for start, end in scenes:
        t = start
        while t < end - 1e-9:
            samples.append((round(t, 3), boxes_at(t)))
            t += step
    return TextMap(W, H, samples, cuts=[s for s, _ in scenes[1:]])


def run(scenes, boxes_at=lambda t: [], video_type="product_demo", lines=(), seed=0, size=(W, H)):
    spec = load_spec()
    tm = textmap(scenes, boxes_at)
    tl = schedule(spec, video_type=video_type, duration=scenes[-1][1], frame_size=size,
                  scenes=scenes, textmap=tm, lines=list(lines), seed=seed)
    return spec, tm, tl


def kinds(tl, *names):
    return [e for e in tl.events if e["kind"] in names]


def intersects(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def scene_of(scenes, t):
    for i, (s, e) in enumerate(scenes):
        if s <= t < e:
            return i
    return len(scenes) - 1


class DeterminismTest(unittest.TestCase):
    def test_same_seed_same_timeline(self):
        scenes = scenes_of(8, 7, 9)
        _, _, a = run(scenes, seed=7, lines=["Hi, I'm Jiro."])
        _, _, b = run(scenes, seed=7, lines=["Hi, I'm Jiro."])
        self.assertEqual(a.to_json(), b.to_json())

    def test_different_seeds_vary_the_timeline(self):
        scenes = scenes_of(8, 7, 9, 8)
        outputs = {run(scenes, seed=s)[2].to_json() for s in range(5)}
        self.assertGreater(len(outputs), 1)


class VocabularyTest(unittest.TestCase):
    def test_first_appearance_is_a_single_pop_in(self):
        for seed in range(10):
            _, _, tl = run(scenes_of(8, 7, 9), seed=seed)
            pops = kinds(tl, "pop_in")
            self.assertEqual(len(pops), 1)
            first_visible = min(e["start"] for e in tl.events if e["kind"] in ("pop_in", "relocate", "edge_peek"))
            self.assertEqual(pops[0]["start"], first_visible)

    def test_edge_peek_at_most_once_and_followed_by_fly_in_and_hop(self):
        seen = 0
        for seed in range(15):
            _, _, tl = run(scenes_of(6, 6, 6, 6, 6), video_type="release_showcase", seed=seed)
            peeks = kinds(tl, "edge_peek")
            self.assertLessEqual(len(peeks), 1)
            for peek in peeks:
                fly = [e for e in kinds(tl, "fly_in") if abs(e["start"] - peek["end"]) < 1e-6]
                self.assertEqual(len(fly), 1)
                hop = [e for e in kinds(tl, "peek_landing_hop") if abs(e["start"] - fly[0]["end"]) < 1e-6]
                self.assertEqual(len(hop), 1)
                seen += 1
        self.assertGreater(seen, 0)

    def test_release_showcase_uses_its_peek(self):
        used = sum(bool(kinds(run(scenes_of(6, 6, 6, 6), video_type="release_showcase", seed=s)[2], "edge_peek"))
                   for s in range(10))
        self.assertEqual(used, 10)

    def test_every_landing_gets_a_squash_and_puff(self):
        _, _, tl = run(scenes_of(6, 6, 6, 6), video_type="release_showcase", seed=3)
        landings = [e for e in tl.events if e["kind"] in ("pop_in", "relocate", "fly_in")]
        self.assertTrue(landings)
        squashes = kinds(tl, "landing_squash")
        puffs = kinds(tl, "dust_puff")
        self.assertEqual(len(squashes), len(landings))
        self.assertEqual(len(puffs), len(landings))

    def test_every_stay_has_one_idle_hover(self):
        _, _, tl = run(scenes_of(8, 8, 8), seed=1)
        stays = kinds(tl, "stay")
        self.assertTrue(stays)
        for stay in stays:
            self.assertIn(stay["idle"], load_spec().idles)


class BudgetTest(unittest.TestCase):
    def assert_budgets(self, scenes, video_type, seeds=range(20), lines=()):
        spec = load_spec()
        per_scene = spec.budgets["per_scene"]
        smalls = 0
        for seed in seeds:
            _, _, tl = run(scenes, video_type=video_type, seed=seed, lines=lines)
            for i in range(len(scenes)):
                def in_scene(names):
                    return [e for e in tl.events if e["kind"] in names and scene_of(scenes, e["start"]) == i]
                self.assertLessEqual(len(in_scene(spec.budgets["big_moves"])), per_scene["big"], (seed, i))
                small = sorted(in_scene(spec.budgets["small_moves"]), key=lambda e: e["start"])
                smalls += len(small)
                self.assertLessEqual(len(small), min(per_scene["small"], spec.type(video_type)["small_per_scene"]))
                for a, b in zip(small, small[1:]):
                    self.assertGreaterEqual(b["start"] - a["start"], 2.0 - 1e-6)
                self.assertLessEqual(len(in_scene(["talk"])), per_scene["lines"])
                bouncy = [e for e in in_scene(["stay"]) if e["idle"] in spec.budgets["bouncy_hovers"]]
                self.assertLessEqual(len(bouncy), per_scene["bouncy_hover"])
        self.assertGreater(smalls, 0)

    def test_per_scene_budgets_hold_for_every_type(self):
        for video_type in load_spec().types:
            self.assert_budgets(scenes_of(7, 9, 6, 8), video_type, seeds=range(8),
                                lines=["One.", "Two.", "Three.", "Four."])

    def test_rests_two_seconds_before_relocating(self):
        compared = 0
        for seed in range(15):
            _, _, tl = run(scenes_of(3, 3, 3, 3, 3, 3), video_type="social_short", seed=seed)
            landings = sorted(e["landed"] for e in kinds(tl, "stay"))
            for reloc in kinds(tl, "relocate", "edge_peek"):
                before = [t for t in landings if t <= reloc["start"]]
                if before:
                    compared += 1
                    self.assertGreaterEqual(reloc["start"] - before[-1], 2.0 - 1e-6)
        self.assertGreater(compared, 0)

    def test_per_minute_caps_hold_on_a_long_video(self):
        spec = load_spec()
        scenes = scenes_of(*([8] * 30))
        for video_type in spec.types:
            caps = spec.type(video_type)["per_minute"]
            _, _, tl = run(scenes, video_type=video_type, seed=2, lines=[f"Line {i}." for i in range(30)])
            groups = {"big": spec.budgets["big_moves"], "small": spec.budgets["small_moves"], "lines": ["talk"]}
            for key, names in groups.items():
                starts = sorted(e["start"] for e in kinds(tl, *names))
                self.assertGreater(len(starts), 0, (video_type, key))
                for i, t in enumerate(starts):
                    in_window = [s for s in starts[i:] if s < t + 60]
                    self.assertLessEqual(len(in_window), caps[key], (video_type, key, t))

    def test_quiet_after_n_lines(self):
        spec = load_spec()
        _, _, tl = run(scenes_of(*([8] * 10)), video_type="social_short", seed=0,
                       lines=[f"Line {i}." for i in range(10)])
        self.assertEqual(len(kinds(tl, "talk")), spec.type("social_short")["quiet_after_lines"])


class CutSafetyTest(unittest.TestCase):
    def test_gone_before_a_cut_reveals_text_over_his_spot(self):
        # Real text maps sample one frame after each cut, so the first sample of the new scene is at cut + 0.04.
        cut = 10.02
        samples = [(round(t * 0.5, 3), []) for t in range(20) if t * 0.5 < cut]
        samples += [(round(cut + 0.04 + k * 0.5, 3), [(0, 0, W, H)]) for k in range(10)]
        tm = TextMap(W, H, samples, cuts=[cut])
        spec = load_spec()
        tl = schedule(spec, video_type="product_demo", duration=15.0, frame_size=(W, H),
                      scenes=[(0, cut), (cut, 15.0)], textmap=tm, seed=0)
        track = build_track(spec, tl, FPS)
        self.assertTrue(any(f["visible"] for f in track.frames if f["t"] < cut))
        self.assertFalse(any(f["visible"] for f in track.frames if f["t"] >= cut))

    def test_never_vanishes_without_a_fade(self):
        for video_type in ("release_showcase", "social_short", "product_demo"):
            for seed in range(4):
                scenes = scenes_of(6, 3, 6, 5)
                def boxes_at(t):
                    return [(0, 0, W, H)] if 9 <= t < 15 else []
                _, _, tl = run(scenes, boxes_at=boxes_at, video_type=video_type, seed=seed)
                hides = {round(e["end"], 6) for e in kinds(tl, "hide")}
                arrivals = {round(e["start"], 6) for e in kinds(tl, "pop_in", "relocate", "edge_peek")}
                for stay in kinds(tl, "stay"):
                    end = round(stay["end"], 6)
                    self.assertTrue(end == round(tl.duration, 6) or end in hides or end in arrivals,
                                    (video_type, seed, stay["start"], stay["end"]))

    def test_arrivals_finish_inside_their_scene(self):
        for video_type in ("release_showcase", "social_short", "product_demo"):
            for seed in range(6):
                scenes = scenes_of(1.0, 2.0, 2.7, 6, 1.2, 5)
                _, _, tl = run(scenes, video_type=video_type, seed=seed)
                for stay in kinds(tl, "stay"):
                    self.assertEqual(scene_of(scenes, stay["start"]), scene_of(scenes, stay["landed"] - 1e-6),
                                     (video_type, seed, stay["start"], stay["landed"]))

    def test_a_scene_without_text_samples_is_never_treated_as_clear(self):
        samples = [(t / 2, []) for t in range(10)]
        tm = TextMap(W, H, samples, cuts=[5.0])
        spec = load_spec()
        tl = schedule(spec, video_type="release_showcase", duration=10.0, frame_size=(W, H),
                      scenes=[(0, 5.0), (5.0, 10.0)], textmap=tm, seed=0)
        track = build_track(spec, tl, FPS)
        self.assertFalse(any(f["visible"] for f in track.frames if f["t"] >= 5.0))

    def test_same_timeline_after_a_textmap_round_trip(self):
        import os
        import tempfile
        boxes = [(100.37, 40.2, 600.91, 90.55), (700.1, 400.3, 1200.7, 520.9)]
        scenes = scenes_of(8, 8)
        spec, tm, tl = run(scenes, boxes_at=lambda t: boxes, seed=5, lines=["Hi, I'm Jiro."])
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "textmap.json")
            tm.save(path)
            again = TextMap.load(path)
        tl2 = schedule(spec, video_type="product_demo", duration=16.0, frame_size=(W, H), scenes=scenes,
                       textmap=again, lines=["Hi, I'm Jiro."], seed=5)
        self.assertEqual(tl.to_json(), tl2.to_json())


class LinesTest(unittest.TestCase):
    def test_each_line_spoken_once_after_landing(self):
        spec = load_spec()
        lines = ["Hi, I'm Jiro.", "Fewer lines. Same fix."]
        _, _, tl = run(scenes_of(9, 9, 9), lines=lines, seed=4)
        talks = kinds(tl, "talk")
        self.assertEqual(sorted(t["text"] for t in talks), sorted(lines))
        landings = sorted(e["landed"] for e in kinds(tl, "stay"))
        for talk in talks:
            before = [t for t in landings if t <= talk["start"]]
            self.assertGreaterEqual(talk["start"] - before[-1], spec.budgets["line_after_landing_ms"] / 1000 - 1e-6)

    def test_line_pinned_to_a_scene_is_spoken_there(self):
        scenes = scenes_of(9, 9, 9)
        _, _, tl = run(scenes, lines=[{"text": "Third scene.", "scene": 2}], seed=1)
        talks = kinds(tl, "talk")
        self.assertEqual(len(talks), 1)
        self.assertEqual(scene_of(scenes, talks[0]["start"]), 2)

    def test_line_without_room_is_reported_not_dropped_silently(self):
        scenes = scenes_of(3)
        _, _, tl = run(scenes, lines=["Too long for a three second clip."], seed=0)
        self.assertEqual(kinds(tl, "talk"), [])
        self.assertEqual(len(tl.unplaced_lines), 1)

    def test_a_line_fits_a_shot_with_about_four_point_three_seconds_after_landing(self):
        line = "Hold on, this part matters a lot."
        typing = 0.028 * (len(line) - 1)
        spoken = 0.9 + typing + 2.5
        self.assertAlmostEqual(spoken, 4.3, delta=0.01)
        release = 0.28
        landed = kinds(run(scenes_of(9))[2], "stay")[0]["landed"]

        _, _, tl = run(scenes_of(landed + spoken + release + 0.05), lines=[line])
        talks = kinds(tl, "talk")
        self.assertEqual(len(talks), 1, tl.unplaced_lines)
        self.assertAlmostEqual(talks[0]["start"] - landed, 0.9, places=6)
        self.assertAlmostEqual(talks[0]["end"] - talks[0]["start"], typing + 2.5, places=6)

        _, _, tl = run(scenes_of(landed + spoken + 0.1), lines=[line])
        self.assertEqual(kinds(tl, "talk"), [], "the shell's release after the bubble closes must fit too")
        self.assertEqual(len(tl.unplaced_lines), 1)

        _, _, tl = run(scenes_of(landed + spoken - 0.1), lines=[line])
        self.assertEqual(kinds(tl, "talk"), [])
        self.assertEqual(len(tl.unplaced_lines), 1)
        self.assertIn("2.5 s hold", tl.unplaced_lines[0]["reason"])

    def test_a_line_held_back_by_the_per_minute_cap_says_so(self):
        lines = [{"text": f"Line {i}.", "scene": i} for i in range(4)]
        _, _, tl = run(scenes_of(8, 8, 8, 8), lines=lines)
        self.assertEqual(len(kinds(tl, "talk")), 3)
        self.assertEqual([u["text"] for u in tl.unplaced_lines], ["Line 3."])
        reason = tl.unplaced_lines[0]["reason"]
        self.assertIn("3 lines per minute", reason)
        self.assertNotIn("needs", reason)


class TextAvoidanceTest(unittest.TestCase):
    def test_never_covers_text(self):
        boxes = [(0, 0, W, 180), (0, 300, 900, 420), (300, 560, W, 720)]
        for seed in range(6):
            spec, tm, tl = run(scenes_of(10, 10, 10), boxes_at=lambda t: boxes, seed=seed,
                               lines=["Hi, I'm Jiro."], video_type="release_showcase")
            track = build_track(spec, tl, FPS)
            self.assertTrue(any(f["visible"] for f in track.frames), seed)
            self.assertEqual(len(kinds(tl, "talk")), 1, seed)
            for frame in track.frames:
                for box in (frame["ink_box"], frame["bubble_box"]):
                    if frame["visible"] and box:
                        for text in boxes:
                            self.assertFalse(intersects(box, text), (seed, frame["t"], box, text))

    def test_hides_when_no_clear_region(self):
        scenes = scenes_of(6, 6, 6)
        def boxes_at(t):
            return [(0, 0, W, H)] if 6 <= t < 12 else []
        spec, tm, tl = run(scenes, boxes_at=boxes_at, seed=0)
        track = build_track(spec, tl, FPS)
        visible = {round(f["t"], 3) for f in track.frames if f["visible"]}
        self.assertFalse(any(6 <= t < 12 for t in visible))
        self.assertTrue(any(t < 6 for t in visible))
        self.assertTrue(any(t >= 12 for t in visible))

    def test_leaves_before_text_appears_mid_scene(self):
        scenes = scenes_of(12)
        def boxes_at(t):
            return [(0, 0, W, H // 2)] if t < 5 else [(0, 0, W, H)]
        spec, tm, tl = run(scenes, boxes_at=boxes_at, seed=0)
        track = build_track(spec, tl, FPS)
        self.assertTrue(any(f["visible"] for f in track.frames if f["t"] < 4.5))
        self.assertFalse(any(f["visible"] for f in track.frames if f["t"] >= 5))

    def test_keeps_out_of_the_centre_band_and_off_the_edges(self):
        spec = load_spec()
        lo, hi = spec.placement["centre_band"]
        margin = spec.placement["edge_margin"]
        for seed in range(8):
            spec, tm, tl = run(scenes_of(9, 9, 9), seed=seed, video_type="release_showcase",
                               lines=["A line long enough to need a wide bubble near an edge.", "Short.", "Hi."])
            scale = tl.scale
            for stay in kinds(tl, "stay"):
                x0, y0, x1, y1 = stay["box"]
                cx = (x0 + x1) / 2
                self.assertFalse(lo * W < cx < hi * W, (seed, stay))
            track = build_track(spec, tl, FPS)
            peeking = [(e["start"], e["end"]) for e in kinds(tl, "edge_peek", "fly_in")]
            for frame in track.frames:
                if not frame["visible"] or any(s <= frame["t"] <= e for s, e in peeking):
                    continue
                for box in (frame["ink_box"], frame["bubble_box"]):
                    if box:
                        x0, y0, x1, y1 = box
                        self.assertGreaterEqual(min(x0, y0, W - x1, H - y1), margin * scale - 1, (seed, frame["t"]))

    def test_bubble_pop_stays_inside_the_edge_margin(self):
        spec = load_spec()
        boxes = [(200, 100, W, H)]
        spec, tm, tl = run(scenes_of(10), boxes_at=lambda t: boxes, seed=0,
                           lines=["A line long enough to need a wide bubble near the edge."])
        self.assertEqual(len(kinds(tl, "talk")), 1)
        track = build_track(spec, tl, FPS)
        margin = spec.placement["edge_margin"] * tl.scale
        bubbles = [f["bubble_box"] for f in track.frames if f["visible"] and f["bubble_box"]]
        self.assertTrue(bubbles)
        self.assertGreaterEqual(min(b[0] for b in bubbles), margin - 1)

    def test_portrait_frames_drop_the_centre_band(self):
        spec = load_spec()
        lo, hi = spec.placement["centre_band"]
        size = (720, 1280)
        centred = 0
        for seed in range(10):
            tm = TextMap(720, 1280, [(t / 2, [(0, 0, 220, 1280), (500, 0, 720, 1280)]) for t in range(16)], cuts=[])
            tl = schedule(spec, video_type="social_short", duration=8, frame_size=size,
                          scenes=[(0, 8)], textmap=tm, seed=seed)
            for stay in kinds(tl, "stay"):
                cx = (stay["box"][0] + stay["box"][2]) / 2
                centred += lo * 720 < cx < hi * 720
        self.assertGreater(centred, 0)


if __name__ == "__main__":
    unittest.main()
