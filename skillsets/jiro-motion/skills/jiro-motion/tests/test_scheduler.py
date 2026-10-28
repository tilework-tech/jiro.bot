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
            spec, tm, tl = run(scenes_of(6, 6, 6), seed=seed, video_type="release_showcase")
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
                x0, y0, x1, y1 = frame["ink_box"]
                self.assertGreaterEqual(min(x0, y0, W - x1, H - y1), margin * scale - 1, (seed, frame["t"]))

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
