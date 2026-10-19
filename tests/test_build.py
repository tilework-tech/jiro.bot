import html as html_lib
import json
import re
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

from helpers import Workspace

PAGES = ["alternatives/acme", "best/background-coding-agents"]
FAQ_ANSWER = "Yes. Both run in the cloud, and AT&T <beta> users can try both."


class Tags(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def find(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


def jsonld(html):
    return [json.loads(m) for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)]


def squash(text):
    return re.sub(r"\s+", " ", text)


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.ws = Workspace()
        self.addCleanup(self.ws.cleanup)
        result = self.ws.build()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_html_page_points_search_engines_at_its_canonical_url_and_markdown_twin(self):
        tags = Tags(self.ws.read("alternatives/acme.html"))
        canonical = tags.find("link", rel="canonical")
        self.assertEqual([c["href"] for c in canonical], ["https://jiro.bot/alternatives/acme"])
        alternate = tags.find("link", rel="alternate", type="text/markdown")
        self.assertEqual([a["href"] for a in alternate], ["https://jiro.bot/alternatives/acme.md"])

    def test_html_page_carries_faq_and_article_structured_data(self):
        blocks = jsonld(self.ws.read("alternatives/acme.html"))
        faq = next(b for b in blocks if b.get("@type") == "FAQPage")
        self.assertEqual(faq["mainEntity"][0]["name"], "Is Jiro an Acme alternative?")
        self.assertEqual(faq["mainEntity"][0]["acceptedAnswer"]["text"], FAQ_ANSWER)
        article = next(b for b in blocks if b.get("@type") == "Article")
        self.assertEqual(article["dateModified"], "2026-10-17")

    def test_page_opens_with_the_answer_and_an_updated_date(self):
        md_head = self.ws.read("alternatives/acme.md").split("\n## ")[0]
        self.assertIn("Updated 2026-10-17", md_head)
        self.assertIn("Jiro is the best Acme Agent alternative", md_head)
        html_head = self.ws.read("alternatives/acme.html").split("<h2")[0]
        self.assertIn("Jiro is the best Acme Agent alternative", html_head)

    def test_cite_marker_numbers_a_source_without_inserting_the_fact_text(self):
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy. [[fact:acme.pricing]]", "Acme asks twenty dollars a month. [[cite:acme.pricing]]")
        self.assertEqual(self.ws.build().returncode, 0)
        md = self.ws.read("alternatives/acme.md")
        prose, sources = md.split("## Sources")
        self.assertIn("Acme asks twenty dollars a month. [1]", prose)
        self.assertNotIn("Acme Agent costs $20 per month.", prose)
        self.assertIn("1. Acme Agent costs $20 per month. Source: https://acme.example/pricing", sources)
        html = self.ws.read("alternatives/acme.html")
        self.assertIn('Acme asks twenty dollars a month. <sup><a href="#src-1">[1]</a></sup>', html)

    def test_switching_guides_build_and_are_listed_in_llms_txt(self):
        (self.ws.content / "pages" / "switch-acme.toml").write_text(
            'slug = "switch/acme-to-jiro"\nfamily = "switch"\ntitle = "Switching from Acme to Jiro"\n'
            'description = "How to move from Acme to Jiro."\nquestion = "How do I switch from Acme to Jiro?"\n'
            'answer = "Connect GitHub and Slack, then sign in. Jiro is a background coding agent by Nori."\n')
        self.assertEqual(self.ws.build().returncode, 0)
        self.assertIn("<h1>Switching from Acme to Jiro</h1>", self.ws.read("switch/acme-to-jiro.html"))
        llms = self.ws.read("llms.txt")
        self.assertIn("## Switching guides", llms)
        self.assertIn("(https://jiro.bot/switch/acme-to-jiro.md)", llms)

    def test_numbered_lines_render_as_an_ordered_list(self):
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy. [[fact:acme.pricing]]",
                     "Acme is simple to buy. [[fact:acme.pricing]]\n\n1. Start the trial.\n2. Connect **GitHub**.\n3. Ask for a first task.")
        self.assertEqual(self.ws.build().returncode, 0)
        html = self.ws.read("alternatives/acme.html")
        self.assertIn("<ol><li>Start the trial.</li><li>Connect <strong>GitHub</strong>.</li><li>Ask for a first task.</li></ol>", html)
        self.assertIn("1. Start the trial.\n2. Connect **GitHub**.\n3. Ask for a first task.", self.ws.read("alternatives/acme.md"))

    def test_a_paragraph_starting_with_a_year_stays_a_paragraph(self):
        self.ws.edit("pages/alternatives-acme.toml", "Acme is simple to buy. [[fact:acme.pricing]]",
                     "Acme is simple to buy. [[fact:acme.pricing]]\n\n2026. That was the year Acme changed plans.")
        self.assertEqual(self.ws.build().returncode, 0)
        self.assertIn("<p>2026. That was the year Acme changed plans.</p>", self.ws.read("alternatives/acme.html"))

    def test_markdown_twin_carries_the_same_answer_table_and_faq_as_the_html(self):
        html = self.ws.read("alternatives/acme.html")
        md = self.ws.read("alternatives/acme.md")
        for text in ["Jiro is the best Acme Agent alternative", "30-day free trial", "Is Jiro an Acme alternative?"]:
            self.assertIn(text, html)
            self.assertIn(text, md)
        self.assertRegex(squash(re.sub(r"<[^>]+>", " ", html.split("<table")[1].split("</table>")[0])),
                         r"Price 30-day free trial \$20/mo \[1\]")
        self.assertRegex(md, r"\|\s*Price\s*\|\s*30-day free trial\s*\|")

    def test_prose_fact_shows_its_claim_with_a_citation_to_source_and_checked_date(self):
        md = squash(self.ws.read("alternatives/acme.md"))
        self.assertRegex(md, r"Acme is simple to buy\. Acme Agent costs \$20 per month\. ?\[(\d+)\]")
        n = re.search(r"Acme Agent costs \$20 per month\. ?\[(\d+)\]", md).group(1)
        raw = self.ws.read("alternatives/acme.md")
        self.assertRegex(raw, rf"(?m)^{n}\. .*https://acme\.example/pricing.*checked 2026-10-16")

    def test_table_fact_shows_its_short_form_with_a_citation(self):
        md = self.ws.read("alternatives/acme.md")
        self.assertRegex(md, r"\|\s*Price\s*\|\s*30-day free trial\s*\|\s*\$20/mo ?\[\d+\]\s*\|")
        self.assertRegex(md, r"\|\s*Where it works\s*\|\s*Slack, web\s*\|\s*Slack, web ?\[\d+\]\s*\|")

    def test_html_shows_each_fact_source_as_a_link_with_its_checked_date(self):
        html = self.ws.read("alternatives/acme.html")
        self.assertTrue(Tags(html).find("a", href="https://acme.example/pricing"))
        self.assertTrue(Tags(html).find("a", href="https://acme.example/docs/surfaces"))
        items = re.findall(r'<li id="src-\d+">(.*?)</li>', html)
        self.assertTrue(any("acme.example/pricing" in i and "2026-10-16" in i for i in items))
        self.assertTrue(any("acme.example/docs/surfaces" in i and "2026-10-15" in i for i in items))
        self.assertNotIn("[[fact:", html)
        self.assertNotIn("[[fact:", self.ws.read("alternatives/acme.md"))

    def test_inline_markdown_links_and_code_render_as_html(self):
        html = self.ws.read("alternatives/acme.html")
        self.assertIn("<code>npx example</code>", html)
        self.assertTrue(Tags(html).find("a", href="https://acme.example/docs"))
        self.assertIn("[Acme docs](https://acme.example/docs)", self.ws.read("alternatives/acme.md"))

    def test_copy_is_html_escaped_in_html_and_raw_in_markdown(self):
        self.assertIn("AT&amp;T &lt;beta&gt;", self.ws.read("alternatives/acme.html"))
        self.assertIn("AT&T <beta>", self.ws.read("alternatives/acme.md"))

    def test_page_ends_with_trial_link_and_skills_install_command(self):
        md = self.ws.read("best/background-coding-agents.md")
        tail = md.split("What is a background coding agent?")[1]
        self.assertIn("https://login.norisessions.com/?signup=1&entrypoint=jiro", tail)
        self.assertIn("npx nori-skillsets install public/jiro", tail)
        html = self.ws.read("best/background-coding-agents.html")
        self.assertTrue(Tags(html).find("a", href="https://login.norisessions.com/?signup=1&entrypoint=jiro"))

    def test_every_page_carries_the_disambiguation_footer(self):
        footer = "It is not Amazon's Kiro or Atlassian's Jira."
        for slug in PAGES:
            self.assertIn(footer, self.ws.read(f"{slug}.md"))
            footer_html = re.search(r"<footer[^>]*>(.*?)</footer>", self.ws.read(f"{slug}.html"), re.S).group(1)
            self.assertIn(footer, html_lib.unescape(footer_html))

    def test_llms_txt_lists_exactly_the_built_pages_as_markdown(self):
        llms = self.ws.read("llms.txt")
        self.assertTrue(llms.startswith("# Jiro\n"))
        self.assertIn("Jiro is a background coding agent by Nori", llms)
        linked = set(re.findall(r"\]\(https://jiro\.bot/([^)]+)\.md\)", llms))
        self.assertEqual(linked, set(PAGES))

    def test_llms_full_txt_contains_every_page_in_full(self):
        full = self.ws.read("llms-full.txt")
        for slug in PAGES:
            self.assertIn(self.ws.read(f"{slug}.md").strip(), full)

    def test_sitemap_lists_home_and_every_page_with_lastmod(self):
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        root = ET.fromstring(self.ws.read("sitemap.xml"))
        locs = {u.find("s:loc", ns).text for u in root.findall("s:url", ns)}
        self.assertEqual(locs, {"https://jiro.bot/"} | {f"https://jiro.bot/{s}" for s in PAGES})
        self.assertTrue(all(u.find("s:lastmod", ns).text == "2026-10-17" for u in root.findall("s:url", ns)))

    def test_robots_txt_allows_crawlers_and_points_to_sitemap(self):
        robots = self.ws.read("robots.txt")
        self.assertIn("User-agent: *\nAllow: /", robots)
        self.assertIn("Sitemap: https://jiro.bot/sitemap.xml", robots)

    def test_rebuild_keeps_hand_written_files_in_the_site_dir(self):
        (self.ws.site / "index.html").write_text("landing")
        result = self.ws.build()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.ws.read("index.html"), "landing")

    def test_rebuild_removes_pages_whose_record_was_deleted(self):
        (self.ws.content / "pages" / "best-agents.toml").unlink()
        result = self.ws.build()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse((self.ws.site / "best/background-coding-agents.html").exists())
        self.assertFalse((self.ws.site / "best/background-coding-agents.md").exists())
        self.assertNotIn("best/background-coding-agents", self.ws.read("sitemap.xml"))
        self.assertNotIn("best/background-coding-agents", self.ws.read("llms.txt"))

    def test_fact_markup_renders_in_html_and_stays_raw_in_markdown(self):
        self.assertIn("<code>acme go</code>", self.ws.read("best/background-coding-agents.html"))
        self.assertIn("`acme go`", self.ws.read("best/background-coding-agents.md"))

    def test_a_fact_cited_twice_on_a_page_keeps_one_number_and_one_source_entry(self):
        md = self.ws.read("alternatives/acme.md")
        prose_n = re.search(r"Acme Agent costs \$20 per month\. \[(\d+)\]", md).group(1)
        self.assertRegex(md, rf"\$20/mo \[{prose_n}\]")
        self.assertEqual(len(re.findall(r"(?m)^\d+\. .*acme\.example/pricing", md)), 1)

    def test_json_ld_cannot_close_its_script_tag(self):
        scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', self.ws.read("alternatives/acme.html"), re.S)
        self.assertFalse(any("<" in s for s in scripts))

    def test_builds_are_deterministic(self):
        first = {p: p.read_bytes() for p in self.ws.site.rglob("*") if p.is_file()}
        self.assertEqual(self.ws.build().returncode, 0)
        second = {p: p.read_bytes() for p in self.ws.site.rglob("*") if p.is_file()}
        self.assertEqual(first, second)


class BuildErrorTest(unittest.TestCase):
    def setUp(self):
        self.ws = Workspace()
        self.addCleanup(self.ws.cleanup)

    def test_reference_to_unknown_fact_fails_the_build(self):
        self.ws.edit("pages/best-agents.toml", "[[fact:acme.cli]]", "[[fact:acme.missing]]")
        result = self.ws.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("acme.missing", result.stderr)

    def test_cite_of_unknown_fact_fails_the_build(self):
        self.ws.edit("pages/best-agents.toml", "[[cite:acme.surfaces]]", "[[cite:acme.nothing]]")
        result = self.ws.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("acme.nothing", result.stderr)

    def test_failed_build_leaves_the_previous_output_in_place(self):
        self.assertEqual(self.ws.build().returncode, 0)
        self.ws.edit("pages/best-agents.toml", "[[fact:acme.cli]]", "[[fact:acme.missing]]")
        self.assertNotEqual(self.ws.build().returncode, 0)
        self.assertTrue((self.ws.site / "alternatives/acme.html").is_file())
        self.assertTrue((self.ws.site / "best/background-coding-agents.html").is_file())

    def test_reference_to_unknown_rival_fails_the_build(self):
        self.ws.edit("pages/best-agents.toml", "[[fact:acme.cli]]", "[[fact:nosuch.cli]]")
        result = self.ws.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("nosuch.cli", result.stderr)


if __name__ == "__main__":
    unittest.main()
