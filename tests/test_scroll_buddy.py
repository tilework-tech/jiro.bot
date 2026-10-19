import functools
import http.server
import pathlib
import shutil
import tempfile
import threading
import unittest

try:
    from playwright.sync_api import expect, sync_playwright
    HAVE_PLAYWRIGHT = True
except ImportError:
    HAVE_PLAYWRIGHT = False

REPO = pathlib.Path(__file__).resolve().parent.parent
BUDDY = REPO / "prototypes" / "scroll-buddy"

COMMENTS = ["Alpha comment.", "Bravo comment.", "Charlie comment.", "Delta comment.", "Echo comment."]
DESKTOP = {"width": 1440, "height": 900}
NARROW = {"width": 390, "height": 844}
SETTLE_MS = 600
QUIET_MS = 1500


def page_html(sections, scripts=1):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scroll buddy fixture</title>
<link rel="stylesheet" href="jiro-buddy.css">
<style>body {{ margin: 0; }} section {{ height: 120vh; }}</style>
</head>
<body>
<main>
{sections}
</main>
{'<script src="jiro-buddy.js" defer></script>' * scripts}
</body>
</html>
"""


COMMENTED_PAGE = page_html("\n".join(
    f'<section id="s{i}" data-jiro-comment="{text}"><h2>Section {i}</h2></section>'
    for i, text in enumerate(COMMENTS, start=1)
))
BLANK_COMMENT_PAGE = page_html("\n".join([
    f'<section id="s1" data-jiro-comment="{COMMENTS[0]}"><h2>Section 1</h2></section>',
    '<section id="s2" data-jiro-comment=""><h2>Section 2</h2></section>',
    '<section id="s3" data-jiro-comment="   "><h2>Section 3</h2></section>',
    f'<section id="s4" data-jiro-comment="{COMMENTS[3]}"><h2>Section 4</h2></section>',
]))
DOUBLE_SCRIPT_PAGE = page_html("\n".join(
    f'<section id="s{i}" data-jiro-comment="{text}"><h2>Section {i}</h2></section>'
    for i, text in enumerate(COMMENTS, start=1)
), scripts=2)
PLAIN_PAGE = page_html("\n".join(
    f'<section id="s{i}"><h2>Section {i}</h2></section>' for i in range(1, 6)
))

RECORD_TEXTS = """
window.__jiroTexts = [];
new MutationObserver(() => {
  for (const sel of ['.jiro-buddy__bubble', '.jiro-buddy [role=status]']) {
    const el = document.querySelector(sel);
    const text = el && el.textContent.trim();
    const seen = window.__jiroTexts;
    if (text && seen[seen.length - 1] !== text) seen.push(text);
  }
}).observe(document, {subtree: true, childList: true, characterData: true, attributes: true});
"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@unittest.skipUnless(HAVE_PLAYWRIGHT, "playwright is not installed")
class ScrollBuddyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        root = pathlib.Path(cls._tmp.name)
        for name in ("jiro-buddy.js", "jiro-buddy.css"):
            shutil.copy(BUDDY / name, root / name)
        (root / "index.html").write_text(COMMENTED_PAGE)
        (root / "blank.html").write_text(BLANK_COMMENT_PAGE)
        (root / "double.html").write_text(DOUBLE_SCRIPT_PAGE)
        (root / "plain.html").write_text(PLAIN_PAGE)

        handler = functools.partial(QuietHandler, directory=str(root))
        cls._server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=cls._server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls._server.server_address[1]}"

        cls._pw = sync_playwright().start()
        cls.browser = cls._pw.chromium.launch(channel="chrome", headless=True)
        expect.set_options(timeout=5000)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls._pw.stop()
        cls._server.shutdown()
        cls._server.server_close()
        cls._tmp.cleanup()

    def open(self, path="index.html", viewport=DESKTOP, context=None, **options):
        if context is None:
            context = self.browser.new_context(viewport=viewport, **options)
            self.addCleanup(context.close)
        page = context.new_page()
        page.goto(f"{self.base}/{path}")
        return page

    def scroll_to_section(self, page, n):
        page.evaluate(
            """n => {
                const el = document.getElementById('s' + n);
                window.scrollTo({top: el.offsetTop + el.offsetHeight / 2 - innerHeight / 2, behavior: 'instant'});
            }""",
            n,
        )

    def mascot(self, page):
        return page.get_by_role("button", name="Jiro: replay comment")

    def bubble(self, page):
        return page.locator(".jiro-buddy__bubble")

    def open_recording(self, **options):
        context = self.browser.new_context(viewport=DESKTOP, **options)
        self.addCleanup(context.close)
        context.add_init_script(RECORD_TEXTS)
        return self.open(context=context)

    def running_animations(self, page):
        return page.evaluate(
            """() => {
                const m = document.querySelector('.jiro-buddy__mascot');
                return m ? m.getAnimations({subtree: true}).filter(a => a.playState === 'running').length : -1;
            }"""
        )

    def test_section_active_on_load_is_commented_in_bubble_and_status_region(self):
        page = self.open()
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        expect(page.get_by_role("status")).to_have_text(COMMENTS[0])

    def test_stopping_on_a_section_shows_its_comment(self):
        page = self.open()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        self.scroll_to_section(page, 3)
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_contain_text(COMMENTS[2])

    def test_scrolling_fast_through_sections_only_comments_on_the_one_stopped_at(self):
        page = self.open_recording()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        for n in (2, 3, 4):
            self.scroll_to_section(page, n)
            page.wait_for_timeout(150)
        self.scroll_to_section(page, 5)
        expect(self.bubble(page)).to_contain_text(COMMENTS[4])
        expect(page.get_by_role("status")).to_have_text(COMMENTS[4])
        texts = page.evaluate("window.__jiroTexts")
        for skipped in COMMENTS[1:4]:
            started = any(skipped.startswith(t) or skipped in t for t in texts)
            self.assertFalse(started, f"{skipped!r} was shown: {texts}")

    def test_returning_to_a_commented_section_hides_the_bubble_without_replaying(self):
        page = self.open()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        self.scroll_to_section(page, 2)
        expect(self.bubble(page)).to_contain_text(COMMENTS[1])
        self.scroll_to_section(page, 1)
        expect(self.bubble(page)).to_be_hidden()
        page.wait_for_timeout(QUIET_MS)
        expect(self.bubble(page)).to_be_hidden(timeout=100)

    def test_clicking_the_mascot_replays_the_active_sections_comment(self):
        page = self.open()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        self.scroll_to_section(page, 2)
        expect(self.bubble(page)).to_contain_text(COMMENTS[1])
        self.scroll_to_section(page, 1)
        expect(self.bubble(page)).to_be_hidden()
        self.mascot(page).click()
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])

    def test_hiding_jiro_lasts_across_reloads_in_the_same_tab_session(self):
        page = self.open()
        buddy = page.get_by_role("complementary", name="Jiro")
        expect(buddy).to_be_visible()
        page.get_by_role("button", name="Hide Jiro").click()
        expect(buddy).to_be_hidden()
        page.reload()
        page.wait_for_timeout(QUIET_MS)
        expect(buddy).to_be_hidden(timeout=100)
        expect(self.mascot(page)).to_be_hidden(timeout=100)

    def test_hiding_jiro_does_not_carry_over_to_a_new_tab_session(self):
        page = self.open()
        close = page.get_by_role("button", name="Hide Jiro")
        expect(close).to_be_visible()
        close.click()
        expect(page.get_by_role("complementary", name="Jiro")).to_be_hidden()
        fresh = self.open()
        expect(self.mascot(fresh)).to_be_visible()

    def test_reduced_motion_stills_the_mascot_and_shows_the_comment_at_once(self):
        page = self.open_recording(reduced_motion="reduce")
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_have_text(COMMENTS[0])
        self.assertEqual(page.evaluate("window.__jiroTexts"), [COMMENTS[0]])
        self.assertEqual(self.running_animations(page), 0)

    def test_mascot_bobs_when_motion_is_allowed(self):
        page = self.open(reduced_motion="no-preference")
        expect(self.mascot(page)).to_be_visible()
        page.wait_for_function(
            """() => {
                const m = document.querySelector('.jiro-buddy__mascot');
                return m && m.getAnimations({subtree: true}).some(a => a.playState === 'running');
            }""",
            timeout=3000,
        )
        self.assertGreaterEqual(self.running_animations(page), 1)

    def test_desktop_mascot_sits_fixed_lower_left_with_bubble_opening_right(self):
        page = self.open(reduced_motion="reduce")
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        mascot = self.mascot(page).bounding_box()
        bubble = self.bubble(page).bounding_box()
        self.assertIsNotNone(mascot)
        self.assertLessEqual(mascot["x"], 48)
        self.assertGreater(mascot["y"] + mascot["height"] / 2, DESKTOP["height"] / 2)
        self.assertGreaterEqual(bubble["x"], mascot["x"] + mascot["width"] - 8)
        page.evaluate("window.scrollTo({top: 2000, behavior: 'instant'})")
        page.wait_for_function("window.scrollY >= 2000")
        after = self.mascot(page).bounding_box()
        for key in ("x", "y", "width", "height"):
            self.assertAlmostEqual(after[key], mascot[key], delta=0.5, msg=key)

    def test_narrow_screen_never_auto_shows_a_comment(self):
        page = self.open(viewport=NARROW)
        expect(self.mascot(page)).to_be_visible()
        page.wait_for_timeout(SETTLE_MS + QUIET_MS)
        expect(self.bubble(page)).to_be_hidden(timeout=100)

    def test_narrow_screen_mascot_is_smaller_and_docked_bottom_left(self):
        desktop = self.mascot(self.open(reduced_motion="reduce"))
        narrow_page = self.open(viewport=NARROW, reduced_motion="reduce")
        narrow = self.mascot(narrow_page)
        expect(desktop).to_be_visible()
        expect(narrow).to_be_visible()
        desktop_box, narrow_box = desktop.bounding_box(), narrow.bounding_box()
        self.assertLess(narrow_box["width"], desktop_box["width"])
        self.assertLessEqual(narrow_box["x"], 48)
        bottom_gap = NARROW["height"] - (narrow_box["y"] + narrow_box["height"])
        self.assertGreaterEqual(bottom_gap, 0)
        self.assertLessEqual(bottom_gap, 48)

    def test_narrow_screen_tapping_the_mascot_shows_the_active_sections_comment(self):
        page = self.open(viewport=NARROW, has_touch=True, is_mobile=True)
        expect(self.mascot(page)).to_be_visible()
        self.scroll_to_section(page, 2)
        page.wait_for_timeout(SETTLE_MS + 200)
        expect(self.bubble(page)).to_be_hidden(timeout=100)
        self.mascot(page).tap()
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_contain_text(COMMENTS[1])

    def test_page_without_commented_sections_renders_no_buddy(self):
        page = self.open("plain.html")
        page.wait_for_load_state("load")
        page.wait_for_timeout(QUIET_MS)
        expect(page.get_by_role("complementary", name="Jiro")).to_have_count(0, timeout=100)
        expect(self.mascot(page)).to_have_count(0, timeout=100)
        expect(page.locator(".jiro-buddy")).to_have_count(0, timeout=100)

    def test_resizing_to_narrow_hides_the_visible_comment(self):
        page = self.open()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        page.set_viewport_size(NARROW)
        expect(self.bubble(page)).to_be_hidden()
        page.wait_for_timeout(SETTLE_MS + QUIET_MS)
        expect(self.bubble(page)).to_be_hidden(timeout=100)

    def test_resizing_to_wide_comments_on_the_unseen_active_section(self):
        page = self.open(viewport=NARROW)
        expect(self.mascot(page)).to_be_visible()
        page.wait_for_timeout(SETTLE_MS + 200)
        expect(self.bubble(page)).to_be_hidden(timeout=100)
        page.set_viewport_size(DESKTOP)
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])

    def test_sections_with_blank_comments_show_no_bubble(self):
        page = self.open("blank.html")
        expect(self.bubble(page)).to_contain_text(COMMENTS[0])
        for n in (2, 3):
            self.scroll_to_section(page, n)
            expect(self.bubble(page)).to_be_hidden()
            page.wait_for_timeout(SETTLE_MS + 400)
            expect(self.bubble(page)).to_be_hidden(timeout=100)
        self.scroll_to_section(page, 4)
        expect(self.bubble(page)).to_contain_text(COMMENTS[3])

    def test_hiding_jiro_with_the_keyboard_keeps_focus_on_the_page_content(self):
        page = self.open()
        close = page.get_by_role("button", name="Hide Jiro")
        expect(close).to_be_visible()
        close.focus()
        page.keyboard.press("Enter")
        expect(page.get_by_role("complementary", name="Jiro")).to_be_hidden()
        focused = page.evaluate(
            """() => {
                const el = document.activeElement;
                if (!el || el === document.body || el === document.documentElement) return null;
                return {inMain: !!el.closest('main'), inBuddy: !!el.closest('.jiro-buddy')};
            }"""
        )
        self.assertIsNotNone(focused, "focus fell back to the document body")
        self.assertTrue(focused["inMain"], focused)
        self.assertFalse(focused["inBuddy"], focused)

    def test_loading_the_script_twice_renders_one_buddy(self):
        page = self.open("double.html")
        expect(self.mascot(page)).to_be_visible()
        page.wait_for_timeout(SETTLE_MS)
        expect(page.locator(".jiro-buddy")).to_have_count(1, timeout=100)


if __name__ == "__main__":
    unittest.main()
