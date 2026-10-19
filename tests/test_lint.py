import unittest

from helpers import Workspace


class LintTest(unittest.TestCase):
    def setUp(self):
        self.ws = Workspace()
        self.addCleanup(self.ws.cleanup)

    def build_and_lint(self):
        built = self.ws.build()
        self.assertEqual(built.returncode, 0, built.stderr)
        return self.ws.lint()

    def assert_fails(self, *needles):
        result = self.build_and_lint()
        self.assertNotEqual(result.returncode, 0, result.stdout)
        for needle in needles:
            self.assertIn(needle, result.stdout)
        return result

    def test_clean_pages_pass_and_each_page_is_reported(self):
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("PASS alternatives/acme", result.stdout)
        self.assertIn("PASS best/background-coding-agents", result.stdout)

    def test_unbuilt_site_fails_every_page(self):
        result = self.ws.lint()
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn("FAIL alternatives/acme", result.stdout)
        self.assertIn("FAIL best/background-coding-agents", result.stdout)

    def test_site_built_from_older_content_fails_as_stale(self):
        self.assertEqual(self.ws.build().returncode, 0)
        self.ws.edit("pages/best-agents.toml", "An agent that works on its own", "An agent that works alone")
        result = self.ws.lint()
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn("stale", result.stdout)

    def test_tk_placeholder_in_copy_fails_only_that_page(self):
        self.ws.edit("pages/alternatives-acme.toml", "Yes. Both run", "Yes. [TK confirm] Both run")
        self.assert_fails("FAIL alternatives/acme", "TK placeholder", "PASS best/background-coding-agents")

    def test_tk_placeholder_in_page_title_fails(self):
        self.ws.edit("pages/best-agents.toml", 'title = "Best background coding agents (2026)"', 'title = "Best background coding agents TK"')
        self.assert_fails("FAIL best/background-coding-agents", "TK placeholder")

    def test_words_containing_tk_are_not_placeholders(self):
        self.ws.edit("pages/alternatives-acme.toml", "Yes. Both run", "Yes. A TKO for Atkins fans. Both run")
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_tk_placeholder_in_a_fact_fails_every_page_that_shows_it(self):
        self.ws.edit("facts/acme.toml", 'text = "Acme Agent works from Slack and the web."', 'text = "Acme Agent works from Slack and the web TK."')
        self.assert_fails("FAIL alternatives/acme", "FAIL best/background-coding-agents", "TK placeholder")

    def test_page_without_the_entity_sentence_in_its_answer_fails(self):
        self.ws.edit("pages/best-agents.toml", " Jiro is a background coding agent by Nori.", "")
        self.assert_fails("FAIL best/background-coding-agents", "entity sentence")

    def test_entity_sentence_outside_the_answer_does_not_count(self):
        self.ws.edit("pages/best-agents.toml", " Jiro is a background coding agent by Nori.", "")
        self.ws.edit("pages/best-agents.toml", 'a = "An agent that works on its own in the cloud."', 'a = "Jiro is a background coding agent by Nori."')
        self.assert_fails("FAIL best/background-coding-agents", "entity sentence")

    def test_pages_sharing_an_eight_word_phrase_both_fail_as_overlap(self):
        line = " We review every change before it lands on main."
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy.", "Acme is simple to buy." + line)
        self.ws.edit("pages/best-agents.toml", 'a = "An agent that works on its own in the cloud."', 'a = "An agent that works on its own in the cloud.' + line + '"')
        result = self.assert_fails("FAIL alternatives/acme", "FAIL best/background-coding-agents", "shared with best/background-coding-agents")
        self.assertIn("before it lands on main", result.stdout)

    def test_quoting_the_same_fact_in_prose_on_two_pages_fails_as_overlap(self):
        self.ws.edit("pages/best-agents.toml", "[[cite:acme.surfaces]]", "[[fact:acme.surfaces]]")
        self.assert_fails("FAIL alternatives/acme", "FAIL best/background-coding-agents", "acme agent works from slack and the web")

    def test_shared_table_cells_are_not_overlap(self):
        cell = "Bring your own Claude or ChatGPT subscription, no token markup"
        self.ws.edit("pages/alternatives-acme.toml", '["Price", "30-day free trial"', f'["Price", "{cell}"')
        self.ws.edit("pages/best-agents.toml", 'heading = "The list"',
                     f'heading = "The list"\nbody = "Short list."\n\n[table]\ncolumns = ["", "Jiro"]\nrows = [["Price", "{cell}"]]\n\n[[section]]\nheading = "More"')
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_page_with_uniform_sentence_lengths_fails(self):
        flat = " ".join(f"Jiro opens a pull request {n}." for n in range(20))
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy.", "Acme is simple to buy. " + flat)
        self.assert_fails("FAIL alternatives/acme", "sentence lengths too uniform", "PASS best/background-coding-agents")

    def test_page_with_varied_sentence_lengths_passes(self):
        words = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet", "kilo", "lima", "mike",
                 "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray", "yankee"]
        lengths = [3, 18, 7, 25, 4, 12, 30, 5, 9, 21, 2, 15, 6, 27, 10, 3, 19, 8, 24, 5]
        sentences, i = [], 0
        for n in lengths:
            sentences.append(" ".join(words[(i + k) % len(words)] + str(i + k) for k in range(n)).capitalize() + ".")
            i += n
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy.", "Acme is simple to buy. " + " ".join(sentences))
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_pages_sharing_only_a_seven_word_phrase_pass(self):
        line = " We review every change before it lands."
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy.", "Acme is simple to buy." + line)
        self.ws.edit("pages/best-agents.toml", 'a = "An agent that works on its own in the cloud."', 'a = "An agent that works on its own in the cloud.' + line + '"')
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_short_page_with_uniform_sentences_is_not_judged(self):
        flat = " ".join(f"Jiro opens a pull request {n}." for n in range(6))
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy.", "Acme is simple to buy. " + flat)
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_pages_linking_to_the_same_long_url_are_not_overlap(self):
        link = " Read the [guide](https://jiro.bot/switch/acme-agent-to-jiro-for-small-teams)."
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy.", "Acme is simple to buy." + link)
        self.ws.edit("pages/best-agents.toml", 'a = "An agent that works on its own in the cloud."', 'a = "An agent that works on its own in the cloud.' + link + '"')
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_pages_sharing_a_bare_url_are_not_overlap(self):
        url = " See https://jiro.bot/switch/acme-agent-to-jiro-for-small-teams for details."
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy.", "Acme is simple to buy." + url)
        self.ws.edit("pages/best-agents.toml", 'a = "An agent that works on its own in the cloud."', 'a = "An agent that works on its own in the cloud.' + url + '"')
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_unshipped_claim_in_page_copy_fails(self):
        self.ws.edit("pages/alternatives-acme.toml", "Yes. Both run", "Yes. Jiro opens Draft PRs only. Both run")
        self.assert_fails("FAIL alternatives/acme", "draft PRs only")

    def test_denied_phrase_in_a_rival_fact_is_allowed(self):
        self.ws.edit("facts/acme.toml", 'text = "Acme Agent works from Slack and the web."', 'text = "Acme Agent never merges and works from Slack and the web."')
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_fact_without_source_fails_pages_that_show_it(self):
        self.ws.edit("facts/acme.toml", 'source = "https://acme.example/pricing"\n', "")
        self.assert_fails("acme.pricing", "FAIL alternatives/acme", "PASS best/background-coding-agents")

    def test_fact_with_plain_http_source_fails(self):
        self.ws.edit("facts/acme.toml", 'source = "https://acme.example/pricing"', 'source = "http://acme.example/pricing"')
        self.assert_fails("acme.pricing", "FAIL alternatives/acme")

    def test_fact_without_checked_date_fails_pages_that_show_it(self):
        self.ws.edit("facts/acme.toml", 'checked = "2026-10-15"\n', "")
        self.assert_fails("acme.surfaces", "FAIL best/background-coding-agents")

    def test_fact_checked_exactly_max_age_before_site_updated_date_passes(self):
        self.ws.edit("facts/acme.toml", 'checked = "2026-10-16"', 'checked = "2026-09-17"')
        result = self.build_and_lint()
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_fact_checked_one_day_past_max_age_fails(self):
        self.ws.edit("facts/acme.toml", 'checked = "2026-10-16"', 'checked = "2026-09-16"')
        self.assert_fails("acme.pricing", "FAIL alternatives/acme", "PASS best/background-coding-agents")

    def test_fact_checked_after_site_updated_date_fails(self):
        self.ws.edit("facts/acme.toml", 'checked = "2026-10-16"', 'checked = "2026-10-20"')
        self.assert_fails("acme.pricing", "FAIL alternatives/acme")


if __name__ == "__main__":
    unittest.main()
