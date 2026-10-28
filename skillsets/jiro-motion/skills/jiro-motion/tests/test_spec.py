import atexit
import json
import os
import tempfile
import unittest
from pathlib import Path

from jiro_motion.spec import SpecError, load_spec, DEFAULT_SPEC


def write_variant(mutate):
    data = json.loads(Path(DEFAULT_SPEC).read_text())
    mutate(data)
    handle = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(data, handle)
    handle.close()
    atexit.register(os.unlink, handle.name)
    return handle.name


class LoadSpecTest(unittest.TestCase):
    def test_default_spec_covers_the_v6_vocabulary(self):
        spec = load_spec()
        for move in ["pop_in", "edge_peek", "fly_in", "peek_landing_hop", "relocate",
                     "side_scoot", "small_hop", "landing_squash", "dust_puff", "glance",
                     "talk", "talk_stretch", "bubble_pop"]:
            self.assertIn(move, spec.moves)
        self.assertEqual(sorted(spec.idles), ["idle_eager", "idle_game", "idle_sleepy", "idle_spring"])
        self.assertEqual(sorted(spec.faces), ["cursor", "eyes", "happy", "sleepy"])

    def test_small_hop_peaks_at_five_px_up(self):
        spec = load_spec()
        self.assertAlmostEqual(min(spec.sample("small_hop", t)["ty"] for t in range(501)), -5, delta=0.02)
        between = spec.sample("small_hop", 120)["ty"]
        self.assertTrue(-5 < between < 0, between)
        self.assertAlmostEqual(spec.sample("small_hop", 0)["ty"], 0, places=3)
        self.assertAlmostEqual(spec.sample("small_hop", 500)["ty"], 0, places=3)

    def test_side_scoot_moves_seven_px_and_tilts_two_degrees(self):
        spec = load_spec()
        samples = [spec.sample("side_scoot", t) for t in range(501)]
        self.assertAlmostEqual(max(s["tx"] for s in samples), 7, delta=0.02)
        self.assertAlmostEqual(max(s["rot"] for s in samples), 2, delta=0.02)

    def test_amplitudes_scale_with_mascot_size(self):
        spec = load_spec()
        for t in (60, 240, 410):
            self.assertAlmostEqual(spec.sample("small_hop", t, scale=2)["ty"], 2 * spec.sample("small_hop", t)["ty"])
            self.assertAlmostEqual(spec.sample("side_scoot", t, scale=2)["rot"], spec.sample("side_scoot", t)["rot"])

    def test_pop_in_overshoots_before_settling(self):
        spec = load_spec()
        samples = [spec.sample("pop_in", t) for t in range(0, 701, 10)]
        self.assertLess(min(s["ty"] for s in samples), -5)
        self.assertGreater(max(s["sx"] for s in samples), 1.0)
        self.assertAlmostEqual(samples[-1]["sx"], 1, places=3)
        self.assertAlmostEqual(samples[0]["opacity"], 0, places=3)

    def test_idle_hovers_loop_over_their_period(self):
        spec = load_spec()
        game = spec.sample_idle("idle_game", 4100 / 2)
        self.assertAlmostEqual(game["bob"]["ty"], -3.5, places=3)
        for t in (700, 1913, 3333):
            self.assertAlmostEqual(spec.sample_idle("idle_game", t)["bob"]["ty"],
                                   spec.sample_idle("idle_game", t + 4100)["bob"]["ty"], places=6)

    def test_unknown_type_names_the_known_ones(self):
        spec = load_spec()
        with self.assertRaises(SpecError) as caught:
            spec.type("wedding_video")
        self.assertIn("product_demo", str(caught.exception))

    def test_rejects_idle_odds_that_do_not_sum_to_one(self):
        path = write_variant(lambda d: d["types"]["product_demo"]["idle_odds"].update(idle_game=0.9))
        with self.assertRaises(SpecError) as caught:
            load_spec(path)
        self.assertIn("product_demo", str(caught.exception))

    def test_rejects_odds_for_an_unknown_hover(self):
        path = write_variant(lambda d: d["types"]["explainer"]["idle_odds"].update(idle_moonwalk=0.0))
        with self.assertRaises(SpecError) as caught:
            load_spec(path)
        self.assertIn("idle_moonwalk", str(caught.exception))

    def test_rejects_non_positive_durations(self):
        path = write_variant(lambda d: d["moves"]["small_hop"].update(duration_ms=0))
        with self.assertRaises(SpecError) as caught:
            load_spec(path)
        self.assertIn("small_hop", str(caught.exception))

    def test_rejects_keyframes_out_of_order(self):
        def mutate(d):
            d["moves"]["small_hop"]["keyframes"][1]["o"] = 1.2
        with self.assertRaises(SpecError) as caught:
            load_spec(write_variant(mutate))
        self.assertIn("small_hop", str(caught.exception))

    def test_rejects_budget_naming_an_unknown_move(self):
        path = write_variant(lambda d: d["budgets"]["small_moves"].append("cartwheel"))
        with self.assertRaises(SpecError) as caught:
            load_spec(path)
        self.assertIn("cartwheel", str(caught.exception))


class TablesTest(unittest.TestCase):
    def test_committed_tables_are_generated_from_the_json(self):
        from jiro_motion.tables import markdown
        committed = (Path(DEFAULT_SPEC).parent / "MOTION-SPEC.md").read_text()
        self.assertEqual(committed, markdown(load_spec()),
                         "spec/MOTION-SPEC.md is stale: run scripts/jm tables --write spec/MOTION-SPEC.md")

    def test_tables_reflect_a_changed_limit(self):
        from jiro_motion.tables import markdown
        path = write_variant(lambda d: d["types"]["explainer"]["per_minute"].update(small=7))
        self.assertIn("≤7 per minute", markdown(load_spec(path)))


if __name__ == "__main__":
    unittest.main()
