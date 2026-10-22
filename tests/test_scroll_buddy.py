import functools
import gzip
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


def page_html(sections, scripts=1, style="", main_attrs=""):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scroll buddy fixture</title>
<link rel="stylesheet" href="jiro-buddy.css">
<style>body {{ margin: 0; }} section {{ height: 120vh; }}{style}</style>
</head>
<body>
<main{main_attrs}>
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
SIDE_COMMENTS = [
    "Alpha side.", "Bravo side.", "Charlie side.", "Delta side.",
    "Echo side.", "Foxtrot side.", "Golf side.",
]
TEXT_COLUMN_STYLE = """
section { position: relative; }
.col { position: absolute; top: 0; bottom: 0; width: 50%; overflow: hidden; font: 16px/1.4 sans-serif; }
.col p { margin: 0; }
.col.left { left: 0; }
.col.right { right: 0; }
.col.full { left: 0; right: 0; width: auto; }
"""
FILLER = "Rice, fish, and a steady hand make every piece worth the wait. " * 120


def text_section(n, comment, column, side=None):
    side_attr = f' data-jiro-side="{side}"' if side else ""
    return (
        f'<section id="s{n}" data-jiro-comment="{comment}"{side_attr}>'
        f'<div class="col {column}"><p>{FILLER}</p></div></section>'
    )


PINNED_LEFT_PAGE = page_html("\n".join(
    f'<section id="s{i}" data-jiro-comment="{text}" data-jiro-side="left"><h2>Section {i}</h2></section>'
    for i, text in enumerate(COMMENTS, start=1)
))
SIDES_PAGE = page_html("\n".join([
    text_section(1, SIDE_COMMENTS[0], "full", side="left"),
    text_section(2, SIDE_COMMENTS[1], "left"),
    text_section(3, SIDE_COMMENTS[2], "right"),
]), style=TEXT_COLUMN_STYLE)
OVERRIDE_PAGE = page_html("\n".join([
    text_section(1, SIDE_COMMENTS[0], "full", side="right"),
    text_section(2, SIDE_COMMENTS[1], "left", side="left"),
]), style=TEXT_COLUMN_STYLE)
ALTERNATING_PAGE = page_html("\n".join(
    text_section(i, text, "left" if i % 2 else "right")
    for i, text in enumerate(SIDE_COMMENTS, start=1)
), style=TEXT_COLUMN_STYLE)
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

RECORD_TYPING_START = """
window.__jiroTypeStartX = {};
window.__jiroWatch = [];
new MutationObserver(() => {
  const bubble = document.querySelector('.jiro-buddy__bubble');
  const mascot = document.querySelector('.jiro-buddy__mascot');
  if (!bubble || !mascot || !bubble.checkVisibility()) return;
  const text = bubble.textContent.trim();
  if (!text) return;
  for (const comment of window.__jiroWatch) {
    if (!(comment in window.__jiroTypeStartX) && comment.startsWith(text)) {
      window.__jiroTypeStartX[comment] = mascot.getBoundingClientRect().x;
    }
  }
}).observe(document, {subtree: true, childList: true, characterData: true, attributes: true});
"""
SAMPLE_BUDDY_ANIMATIONS = """
window.__jiroSampling = false;
window.__jiroMaxAnimations = 0;
(function sample() {
  const aside = document.querySelector('.jiro-buddy');
  if (window.__jiroSampling && aside) {
    window.__jiroMaxAnimations = Math.max(
      window.__jiroMaxAnimations, aside.getAnimations({subtree: true}).length);
  }
  requestAnimationFrame(sample);
})();
"""

FLOW = [
    "Want to see me work?", "Censored them myself.", "Up here.",
    "Small diffs only.", "Not up here again.", "Thirty days on the house?",
]
FLOW_STYLE = """
section { display: flow-root; }
.perch { margin: 40vh 0 0 30vw; width: 40vw; font: 700 40px/1.1 sans-serif; }
"""
HOVER_LINES = ["Hover one.", "Hover two.", "Hover three."]
FLOW_PAGE = page_html("\n".join([
    f'<section id="s1" data-jiro-comment="{FLOW[0]}" data-jiro-ask="Show me" data-jiro-action="#s3"><h2>Hero</h2></section>',
    f'<section id="s2" data-jiro-comment="{FLOW[1]}" data-jiro-mood="eager" data-jiro-look="#look2"><h2>Ditch <span id="look2">D*vin</span></h2></section>',
    f'<section id="s3" data-jiro-comment="{FLOW[2]}" data-jiro-perch="#perch3"><h2 class="perch" id="perch3">Not market price</h2></section>',
    f'<section id="s4" data-jiro-comment="{FLOW[3]}"><h2>How</h2></section>',
    f'<section id="s5" data-jiro-comment="{FLOW[4]}" data-jiro-perch="#perch5"><h2 class="perch" id="perch5">Second perch</h2></section>',
    f'<section id="s6" data-jiro-comment="{FLOW[5]}" data-jiro-ask="Yes please" data-jiro-action="#email"><h2>Reserve</h2><input id="email" type="email" aria-label="Work email"></section>',
]), style=FLOW_STYLE, main_attrs=f' data-jiro-hovers="{"|".join(HOVER_LINES)}"')

RECORD_FLOW = """
window.__jiroLog = [];
window.__jiroMinX = Infinity;
window.__jiroLooked = [];
window.__jiroBuddyAtLoad = null;
window.__jiroShifts = 0;
addEventListener('load', () => { window.__jiroBuddyAtLoad = !!document.querySelector('.jiro-buddy'); });
new PerformanceObserver(list => {
  for (const entry of list.getEntries()) window.__jiroShifts += entry.value;
}).observe({type: 'layout-shift', buffered: true});
(function sample() {
  const aside = document.querySelector('.jiro-buddy');
  const mascot = document.querySelector('.jiro-buddy__mascot');
  if (mascot && aside && !aside.hidden) {
    const box = mascot.getBoundingClientRect();
    if (box.width) window.__jiroMinX = Math.min(window.__jiroMinX, box.x);
  }
  const log = window.__jiroLog;
  const bubble = document.querySelector('.jiro-buddy__text');
  const entry = aside ? [aside.dataset.jiroState || '', aside.dataset.jiroFace || '',
    bubble && bubble.checkVisibility() ? bubble.textContent.trim() : ''].join('|') : '';
  if (entry && log[log.length - 1] !== entry) log.push(entry);
  document.querySelectorAll('.jiro-look-target').forEach(el => {
    if (!window.__jiroLooked.includes(el.id)) window.__jiroLooked.push(el.id);
  });
  requestAnimationFrame(sample);
})();
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
        (root / "pinned-left.html").write_text(PINNED_LEFT_PAGE)
        (root / "sides.html").write_text(SIDES_PAGE)
        (root / "override.html").write_text(OVERRIDE_PAGE)
        (root / "alternating.html").write_text(ALTERNATING_PAGE)
        (root / "flow.html").write_text(FLOW_PAGE)

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

    def open_recording(self, path="index.html", script=RECORD_TEXTS, **options):
        context = self.browser.new_context(viewport=DESKTOP, **options)
        self.addCleanup(context.close)
        context.add_init_script(script)
        return self.open(path, context=context)

    def side(self, page):
        box = self.mascot(page).bounding_box()
        width = page.evaluate("document.documentElement.clientWidth")
        return "left" if box["x"] + box["width"] / 2 < width / 2 else "right"

    def assert_sits_right_with_bubble_opening_left(self, page):
        mascot = self.mascot(page).bounding_box()
        bubble = self.bubble(page).bounding_box()
        width = page.evaluate("document.documentElement.clientWidth")
        self.assertGreaterEqual(mascot["x"] + mascot["width"], width - 48)
        self.assertLessEqual(bubble["x"] + bubble["width"], mascot["x"] + 8)

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

    def test_desktop_mascot_starts_fixed_lower_left_with_bubble_opening_right(self):
        page = self.open("pinned-left.html", reduced_motion="reduce")
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

    def test_settling_on_a_left_heavy_section_moves_jiro_right_with_bubble_opening_left(self):
        page = self.open("sides.html", reduced_motion="reduce")
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[0])
        self.assertEqual(self.side(page), "left")
        self.scroll_to_section(page, 2)
        expect(self.bubble(page)).to_be_visible()
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[1])
        expect(page.get_by_role("status")).to_have_text(SIDE_COMMENTS[1])
        self.assert_sits_right_with_bubble_opening_left(page)

    def test_data_jiro_side_overrides_the_automatic_side(self):
        page = self.open("override.html", reduced_motion="reduce")
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[0])
        self.assert_sits_right_with_bubble_opening_left(page)
        self.scroll_to_section(page, 2)
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[1])
        mascot = self.mascot(page).bounding_box()
        bubble = self.bubble(page).bounding_box()
        self.assertLessEqual(mascot["x"], 48)
        self.assertGreaterEqual(bubble["x"], mascot["x"] + mascot["width"] - 8)

    def test_jiro_changes_side_at_most_three_times_per_page_load(self):
        page = self.open("alternating.html", reduced_motion="reduce")
        sides = ["left"]
        for n, comment in enumerate(SIDE_COMMENTS, start=1):
            if n > 1:
                self.scroll_to_section(page, n)
            expect(self.bubble(page)).to_have_text(comment)
            sides.append(self.side(page))
        changes = sum(a != b for a, b in zip(sides, sides[1:]))
        self.assertGreaterEqual(changes, 1, sides)
        self.assertLessEqual(changes, 3, sides)
        self.assertEqual(len(set(sides[-3:])), 1, f"kept moving after the cap: {sides}")

    def test_comment_starts_typing_only_after_jiro_has_arrived(self):
        page = self.open_recording("sides.html", script=RECORD_TYPING_START, reduced_motion="no-preference")
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[0])
        page.evaluate("comment => { window.__jiroWatch.push(comment); }", SIDE_COMMENTS[1])
        self.scroll_to_section(page, 2)
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[1])
        page.wait_for_timeout(500)
        self.assertEqual(self.side(page), "right")
        start_x = page.evaluate("comment => window.__jiroTypeStartX[comment]", SIDE_COMMENTS[1])
        self.assertIsNotNone(start_x, "never saw the comment start typing")
        self.assertAlmostEqual(start_x, self.mascot(page).bounding_box()["x"], delta=2)

    def test_reduced_motion_changes_side_instantly_without_animation(self):
        page = self.open_recording("sides.html", script=SAMPLE_BUDDY_ANIMATIONS, reduced_motion="reduce")
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[0])
        page.evaluate("window.__jiroSampling = true")
        self.scroll_to_section(page, 2)
        expect(self.bubble(page)).to_have_text(SIDE_COMMENTS[1])
        self.assertEqual(self.side(page), "right")
        page.wait_for_timeout(300)
        self.assertEqual(page.evaluate("window.__jiroMaxAnimations"), 0)
        self.assertEqual(self.running_animations(page), 0)

    def test_narrow_screen_never_changes_side(self):
        page = self.open("sides.html", viewport=NARROW, has_touch=True, is_mobile=True, reduced_motion="reduce")
        expect(self.mascot(page)).to_be_visible()
        self.scroll_to_section(page, 2)
        page.wait_for_timeout(SETTLE_MS + 200)
        self.mascot(page).tap()
        expect(self.bubble(page)).to_contain_text(SIDE_COMMENTS[1])
        page.wait_for_timeout(SETTLE_MS)
        self.assertLessEqual(self.mascot(page).bounding_box()["x"], 48)

    def test_idle_hover_layers_several_out_of_phase_motions(self):
        page = self.open(reduced_motion="no-preference")
        expect(self.mascot(page)).to_be_visible()
        page.wait_for_timeout(SETTLE_MS + QUIET_MS)
        durations = page.evaluate(
            """() => document.querySelector('.jiro-buddy__mascot')
                .getAnimations({subtree: true})
                .filter(a => a.playState === 'running')
                .map(a => a.effect.getTiming().duration)"""
        )
        self.assertGreaterEqual(len(durations), 3, durations)
        self.assertGreaterEqual(len(set(durations)), 2, durations)

    def flow_log(self, page):
        return [entry.split("|") for entry in page.evaluate("window.__jiroLog")]

    def wait_for_text(self, page, text):
        page.wait_for_function(
            """text => window.__jiroLog.some(e => e.split('|')[2] === text)""", arg=text, timeout=8000)

    def test_jiro_peeks_in_from_the_left_edge_then_settles_in_the_corner(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW, reduced_motion="no-preference")
        self.wait_for_text(page, FLOW[0])
        self.assertLess(page.evaluate("window.__jiroMinX"), 0)
        box = self.mascot(page).bounding_box()
        self.assertGreaterEqual(box["x"], 0)
        self.assertLessEqual(box["x"], 48)

    def test_jiro_thinks_with_dots_before_every_comment(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW, reduced_motion="no-preference")
        self.wait_for_text(page, FLOW[0])
        self.scroll_to_section(page, 4)
        self.wait_for_text(page, FLOW[3])
        log = self.flow_log(page)
        first = next(i for i, e in enumerate(log) if e[2] == FLOW[0])
        last_first = max(i for i, e in enumerate(log) if e[2] == FLOW[0])
        second = next(i for i, e in enumerate(log) if e[2] == FLOW[3])
        for before in (log[:first], log[last_first:second]):
            self.assertTrue(any(e[0] == "thinking" and e[1] == "dots" and e[2] == "" for e in before), log)

    def test_eager_sections_get_an_eager_beat_before_the_comment(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW, reduced_motion="no-preference")
        self.wait_for_text(page, FLOW[0])
        self.scroll_to_section(page, 2)
        self.wait_for_text(page, FLOW[1])
        log = self.flow_log(page)
        start = max(i for i, e in enumerate(log) if e[2] == FLOW[0])
        spoke = next(i for i, e in enumerate(log) if e[2] == FLOW[1])
        self.assertIn("eager", [e[0] for e in log[start:spoke]], log)

    def test_jiro_looks_at_the_thing_he_talks_about(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW, reduced_motion="no-preference")
        self.wait_for_text(page, FLOW[0])
        self.scroll_to_section(page, 2)
        self.wait_for_text(page, FLOW[1])
        self.assertIn("look2", page.evaluate("window.__jiroLooked"))
        expect(page.locator(".jiro-look-target")).to_have_count(0, timeout=5000)

    def test_a_question_offers_buttons_and_yes_takes_you_there(self):
        page = self.open("flow.html")
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        yes = page.get_by_role("button", name="Show me")
        expect(yes).to_be_visible()
        expect(page.get_by_role("button", name="Later")).to_be_visible()
        yes.click()
        page.wait_for_function(
            """() => { const r = document.getElementById('s3').getBoundingClientRect();
                       return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; }""", timeout=5000)

    def test_later_closes_the_question(self):
        page = self.open("flow.html")
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        page.get_by_role("button", name="Later").click()
        expect(self.bubble(page)).to_be_hidden()

    def test_yes_on_a_form_question_focuses_the_field(self):
        page = self.open("flow.html", reduced_motion="reduce")
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        self.scroll_to_section(page, 6)
        expect(self.bubble(page)).to_contain_text(FLOW[5])
        page.get_by_role("button", name="Yes please").click()
        expect(page.get_by_role("textbox", name="Work email")).to_be_focused()

    def test_jiro_perches_on_a_heading_and_rides_along_with_it(self):
        page = self.open("flow.html", reduced_motion="reduce")
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        self.scroll_to_section(page, 3)
        expect(self.bubble(page)).to_contain_text(FLOW[2])
        boxes = """() => [document.querySelector('.jiro-buddy__mascot'), document.getElementById('perch3')]
            .map(el => el.getBoundingClientRect().toJSON())"""
        mascot, title = page.evaluate(boxes)
        self.assertAlmostEqual(mascot["y"] + mascot["height"], title["y"], delta=16)
        self.assertGreater(mascot["x"] + mascot["width"], title["x"])
        self.assertLess(mascot["x"], title["x"] + title["width"])
        page.evaluate("window.scrollBy({top: 120, behavior: 'instant'})")
        page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        moved, title2 = page.evaluate(boxes)
        self.assertAlmostEqual(moved["y"] - mascot["y"], title2["y"] - title["y"], delta=2)
        self.assertLess(title2["y"], title["y"])

    def test_jiro_leaves_the_perch_for_his_corner_on_the_next_section(self):
        page = self.open("flow.html", reduced_motion="reduce")
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        self.scroll_to_section(page, 3)
        expect(self.bubble(page)).to_contain_text(FLOW[2])
        self.scroll_to_section(page, 4)
        expect(self.bubble(page)).to_contain_text(FLOW[3])
        box = self.mascot(page).bounding_box()
        self.assertLessEqual(DESKTOP["height"] - (box["y"] + box["height"]), 64)

    def test_jiro_perches_only_once_per_page(self):
        page = self.open("flow.html", reduced_motion="reduce")
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        self.scroll_to_section(page, 3)
        expect(self.bubble(page)).to_contain_text(FLOW[2])
        self.scroll_to_section(page, 5)
        expect(self.bubble(page)).to_contain_text(FLOW[4])
        box = self.mascot(page).bounding_box()
        self.assertLessEqual(DESKTOP["height"] - (box["y"] + box["height"]), 64)

    def test_hovering_jiro_turns_his_cursor_into_eyes(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW, reduced_motion="no-preference")
        self.wait_for_text(page, FLOW[0])
        buddy = page.get_by_role("complementary", name="Jiro")
        expect(buddy).to_have_attribute("data-jiro-face", "cursor", timeout=6000)
        self.mascot(page).hover()
        expect(buddy).to_have_attribute("data-jiro-face", "eyes")
        page.mouse.move(700, 100)
        expect(buddy).to_have_attribute("data-jiro-face", "cursor")

    def hover_jiro(self, page):
        page.mouse.move(700, 100)
        self.mascot(page).hover()

    def test_hovering_jiro_shows_a_new_line_each_time(self):
        page = self.open("flow.html", reduced_motion="reduce")
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        self.scroll_to_section(page, 4)
        expect(self.bubble(page)).to_contain_text(FLOW[3])
        shown = []
        for _ in range(2):
            self.hover_jiro(page)
            expect(self.bubble(page)).not_to_contain_text(shown[-1] if shown else FLOW[3])
            text = self.bubble(page).inner_text().strip()
            self.assertIn(text, HOVER_LINES)
            shown.append(text)
            page.wait_for_timeout(1600)
        self.assertNotEqual(shown[0], shown[1])

    def test_hovering_jiro_makes_him_dodge_a_little(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW, reduced_motion="no-preference")
        self.wait_for_text(page, FLOW[0])
        self.scroll_to_section(page, 4)
        self.wait_for_text(page, FLOW[3])
        page.mouse.move(700, 100)
        page.evaluate("""() => { const art = document.querySelector('.jiro-buddy__art');
            window.__jiroArtX = art.getBoundingClientRect().x; window.__jiroDodge = 0;
            (function sample() { window.__jiroDodge = Math.max(window.__jiroDodge,
                Math.abs(art.getBoundingClientRect().x - window.__jiroArtX)); requestAnimationFrame(sample); })(); }""")
        self.mascot(page).hover()
        page.wait_for_timeout(700)
        self.assertGreaterEqual(page.evaluate("window.__jiroDodge"), 6)

    def test_hovering_jiro_leaves_an_open_question_alone(self):
        page = self.open("flow.html", reduced_motion="reduce")
        expect(page.get_by_role("button", name="Show me")).to_be_visible()
        self.hover_jiro(page)
        page.wait_for_timeout(600)
        expect(self.bubble(page)).to_contain_text(FLOW[0])
        expect(page.get_by_role("button", name="Show me")).to_be_visible()

    def test_jiro_falls_asleep_when_left_alone_and_wakes_on_scroll(self):
        context = self.browser.new_context(viewport=DESKTOP, reduced_motion="no-preference")
        self.addCleanup(context.close)
        context.clock.install()
        page = self.open("flow.html", context=context)
        expect(self.bubble(page)).to_contain_text(FLOW[0], timeout=8000)
        buddy = page.get_by_role("complementary", name="Jiro")
        context.clock.fast_forward(25000)
        expect(buddy).to_have_attribute("data-jiro-state", "sleepy")
        page.evaluate("window.scrollBy({top: 300, behavior: 'instant'})")
        expect(buddy).not_to_have_attribute("data-jiro-state", "sleepy")

    def test_jiro_waits_until_the_page_has_loaded_before_appearing(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW)
        expect(self.mascot(page)).to_be_visible()
        self.assertIs(page.evaluate("window.__jiroBuddyAtLoad"), False)

    def test_a_full_scroll_with_jiro_causes_no_layout_shift(self):
        page = self.open_recording("flow.html", script=RECORD_FLOW, reduced_motion="no-preference")
        self.wait_for_text(page, FLOW[0])
        for n in range(2, 7):
            self.scroll_to_section(page, n)
            self.wait_for_text(page, FLOW[n - 1])
        self.assertEqual(page.evaluate("window.__jiroShifts"), 0)



class BuddyBudgetTest(unittest.TestCase):
    def test_buddy_ships_in_under_twelve_kilobytes_compressed(self):
        total = sum(len(gzip.compress((BUDDY / name).read_bytes(), 9))
                    for name in ("jiro-buddy.js", "jiro-buddy.css"))
        self.assertLess(total, 12 * 1024)


@unittest.skipUnless(HAVE_PLAYWRIGHT, "playwright is not installed")
class StitchedDesignTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = functools.partial(QuietHandler, directory=str(BUDDY))
        cls._server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=cls._server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls._server.server_address[1]}"
        cls._pw = sync_playwright().start()
        cls.browser = cls._pw.chromium.launch(channel="chrome", headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls._pw.stop()
        cls._server.shutdown()
        cls._server.server_close()

    def test_design_screenshots_load_and_jiro_greets_on_the_hero(self):
        context = self.browser.new_context(viewport=DESKTOP, reduced_motion="reduce")
        self.addCleanup(context.close)
        page = context.new_page()
        page.goto(f"{self.base}/stitched/index.html")
        page.wait_for_load_state("load")
        self.assertTrue(page.evaluate(
            "[...document.images].length > 0 && [...document.images].every(i => i.complete && i.naturalWidth > 0)"))
        self.assertGreaterEqual(page.locator("section[data-jiro-comment]").count(), 8)
        expect(page.locator(".jiro-buddy__bubble")).to_contain_text("Hi, I'm Jiro.")

    def test_every_look_and_perch_selector_points_at_a_hotspot(self):
        context = self.browser.new_context(viewport=DESKTOP)
        self.addCleanup(context.close)
        page = context.new_page()
        page.goto(f"{self.base}/stitched/index.html")
        missing = page.evaluate("""() => [...document.querySelectorAll('[data-jiro-look],[data-jiro-perch],[data-jiro-action]')]
            .flatMap(s => ['jiroLook', 'jiroPerch', 'jiroAction'].map(k => s.dataset[k]).filter(Boolean))
            .filter(sel => !document.querySelector(sel))""")
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
