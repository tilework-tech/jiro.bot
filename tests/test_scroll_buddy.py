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

COMMENTS = [
    "Alpha comment.", "Bravo comment.", "Charlie comment.", "Delta comment.",
    "Echo comment.", "Foxtrot comment.", "Golf comment.", "Hotel comment.",
]
DESKTOP = {"width": 1440, "height": 900}
NARROW = {"width": 390, "height": 844}
PASS_MS = 7500
REST_MS = 4000
IDLE_STYLES = {"game", "spring", "eager", "sleepy"}
BOUNCY_STYLES = {"spring", "eager"}


def page_html(sections, scripts=1):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scroll buddy fixture</title>
<link rel="stylesheet" href="jiro-buddy.css">
<style>body {{ margin: 0; }} section {{ height: 120vh; position: relative; }} .card {{ position: absolute; right: 8%; top: 40%; width: 180px; height: 60px; }}</style>
</head>
<body>
<main>
{sections}
</main>
{'<script src="jiro-buddy.js" defer></script>' * scripts}
</body>
</html>
"""


SECTIONS = "\n".join(
    f'<section id="s{i}" data-jiro-comment="{text}"><h2>Section {i}</h2><button class="card" id="card{i}">Card {i}</button></section>'
    for i, text in enumerate(COMMENTS, start=1)
)
COMMENTED_PAGE = page_html(SECTIONS)
DOUBLE_SCRIPT_PAGE = page_html(SECTIONS, scripts=2)
PLAIN_PAGE = page_html("\n".join(f'<section id="s{i}"><h2>Section {i}</h2></section>' for i in range(1, 6)))

SEEDED_RANDOM = """
(() => {
  let seed = 20261027;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
})();
"""

RECORD = SEEDED_RANDOM + """
window.__lines = [];
window.__styles = [];
window.__faces = [];
window.__errors = [];
window.__shifts = 0;
addEventListener('error', e => window.__errors.push(String(e.message)));
new PerformanceObserver(list => {
  for (const entry of list.getEntries()) window.__shifts += entry.value;
}).observe({type: 'layout-shift', buffered: true});
new MutationObserver(records => {
  for (const record of records) {
    const node = record.target.nodeType === 1 ? record.target : record.target.parentElement;
    if (!node) continue;
    const status = node.closest('[role=status]');
    if (status && record.type !== 'attributes') {
      const text = status.textContent.trim();
      if (text) window.__lines.push({text, at: performance.now()});
    }
    if (record.type === 'attributes' && node.matches('.jiro-buddy')) {
      if (record.attributeName === 'data-jiro-motion') {
        window.__styles.push({style: node.dataset.jiroMotion, pass: window.__pass || 0});
      }
      if (record.attributeName === 'data-jiro-face') {
        window.__faces.push({face: node.dataset.jiroFace, at: performance.now()});
      }
    }
  }
}).observe(document, {subtree: true, childList: true, characterData: true, attributes: true,
  attributeFilter: ['data-jiro-motion', 'data-jiro-face']});
"""

SAMPLE_EDGE = """
window.__edge = [];
(function sample() {
  const mascot = document.querySelector('.jiro-buddy__mascot');
  if (mascot) {
    const r = mascot.getBoundingClientRect();
    const partly = r.width && r.bottom > 0 && r.top < innerHeight &&
      ((r.left < 0 && r.right > 0) || (r.right > innerWidth && r.left < innerWidth));
    window.__edge.push([performance.now(), partly]);
  }
  requestAnimationFrame(sample);
})();
"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(directory):
    handler = functools.partial(QuietHandler, directory=str(directory))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}"


@unittest.skipUnless(HAVE_PLAYWRIGHT, "playwright is not installed")
class BuddyTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        root = pathlib.Path(cls._tmp.name)
        for name in ("jiro-buddy.js", "jiro-buddy.css"):
            shutil.copy(BUDDY / name, root / name)
        (root / "index.html").write_text(COMMENTED_PAGE)
        (root / "double.html").write_text(DOUBLE_SCRIPT_PAGE)
        (root / "plain.html").write_text(PLAIN_PAGE)
        cls._fixtures, cls.base = serve(root)
        cls._mockup, cls.mockup = serve(BUDDY)
        cls._pw = sync_playwright().start()
        cls.browser = cls._pw.chromium.launch(channel="chrome", headless=True)
        expect.set_options(timeout=5000)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls._pw.stop()
        for server in (cls._fixtures, cls._mockup):
            server.shutdown()
            server.server_close()
        cls._tmp.cleanup()

    def open(self, url=None, viewport=DESKTOP, **options):
        context = self.browser.new_context(viewport=viewport, **options)
        self.addCleanup(context.close)
        context.add_init_script(RECORD)
        page = context.new_page()
        page.goto(url or f"{self.base}/index.html")
        expect(self.mascot(page)).to_be_visible()
        page.wait_for_timeout(1500)
        return page

    def mascot(self, page):
        return page.locator(".jiro-buddy__mascot")

    def bubble(self, page):
        return page.locator(".jiro-buddy__bubble")

    def scroll_to(self, page, section_id, wait=PASS_MS):
        page.evaluate(
            """id => {
                const r = document.getElementById(id).getBoundingClientRect();
                window.scrollTo({top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: 'instant'});
            }""",
            section_id,
        )
        page.wait_for_timeout(wait)

    def scroll_to_end(self, page, end, wait=PASS_MS):
        page.evaluate("end => window.scrollTo({top: end === 'bottom' ? document.documentElement.scrollHeight : 0, behavior: 'instant'})", end)
        page.wait_for_timeout(wait)

    def lines(self, page):
        return [entry["text"] for entry in page.evaluate("window.__lines")]

    def comment_under_jiro(self, page):
        return page.evaluate(
            """() => {
                const m = document.querySelector('.jiro-buddy__mascot').getBoundingClientRect();
                const y = m.top + m.height / 2;
                const hit = [...document.querySelectorAll('[data-jiro-comment]')].find(s => {
                    const r = s.getBoundingClientRect();
                    return r.top <= y && y <= r.bottom;
                });
                return hit ? hit.dataset.jiroComment : null;
            }"""
        )

    def mascot_center(self, page):
        box = self.mascot(page).bounding_box()
        return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2

    def drag(self, page, dx, dy, steps=12):
        x, y = self.mascot_center(page)
        page.mouse.move(x, y)
        page.mouse.down()
        page.mouse.move(x + dx, y + dy, steps=steps)
        page.mouse.up()
        return x + dx, y + dy


class SpeechTest(BuddyTestCase):
    def test_loading_the_page_says_nothing(self):
        page = self.open()
        page.wait_for_timeout(3000)
        self.assertEqual(self.lines(page), [])
        expect(self.bubble(page)).to_be_hidden()

    def test_a_scroll_down_gives_one_line_about_where_he_sits(self):
        page = self.open()
        self.scroll_to(page, "s3")
        self.assertEqual(self.lines(page), [self.comment_under_jiro(page)])
        self.scroll_to(page, "s5")
        self.assertEqual(len(self.lines(page)), 1, self.lines(page))

    def test_scrolling_back_up_gives_one_new_line(self):
        page = self.open()
        self.scroll_to(page, "s4")
        self.scroll_to(page, "s2")
        lines = self.lines(page)
        self.assertEqual(len(lines), 2, lines)
        self.assertEqual(lines[1], self.comment_under_jiro(page))

    def test_a_pass_line_hides_by_itself(self):
        page = self.open()
        self.scroll_to(page, "s3", wait=0)
        expect(self.bubble(page)).to_be_visible(timeout=PASS_MS)
        expect(self.bubble(page)).to_be_hidden(timeout=8000)

    def test_he_skips_sections_he_already_commented_on(self):
        page = self.open()
        self.scroll_to(page, "s4")
        self.scroll_to(page, "s1")
        self.scroll_to(page, "s4")
        lines = self.lines(page)
        self.assertEqual(len(lines), 2, lines)
        self.assertEqual(len(set(lines)), 2, lines)

    def test_clicking_him_always_says_where_he_sits(self):
        page = self.open()
        self.scroll_to(page, "s3")
        self.mascot(page).click()
        page.wait_for_timeout(600)
        lines = self.lines(page)
        self.assertEqual(lines[-1], self.comment_under_jiro(page))
        self.assertEqual(lines.count(lines[-1]), 2, lines)

    def test_after_four_long_passes_he_goes_quiet_until_clicked(self):
        page = self.open()
        for end in ("bottom", "top", "bottom", "top"):
            self.scroll_to_end(page, end)
        said = len(self.lines(page))
        self.scroll_to(page, "s4")
        self.assertEqual(len(self.lines(page)), said, "spoke while quiet")
        self.mascot(page).click()
        page.wait_for_timeout(600)
        self.assertEqual(self.lines(page)[-1], self.comment_under_jiro(page))
        self.scroll_to(page, "s2")
        self.assertEqual(len(self.lines(page)), said + 2, self.lines(page))

    def test_short_passes_do_not_make_him_quiet(self):
        page = self.open()
        for target in ("s3", "s2", "s4", "s1", "s5"):
            self.scroll_to(page, target)
        self.assertEqual(len(self.lines(page)), 5, self.lines(page))

    def test_speaking_stretches_his_shell_and_it_shrinks_back(self):
        page = self.open()
        art = page.locator(".jiro-buddy__art")
        heights = []
        for _ in range(20):
            heights.append(art.bounding_box()["height"])
            page.wait_for_timeout(100)
        rest = max(heights)
        self.mascot(page).click()
        page.wait_for_timeout(500)
        self.assertGreater(art.bounding_box()["height"], rest * 1.06)
        expect(self.bubble(page)).to_be_hidden(timeout=9000)
        page.wait_for_timeout(600)
        self.assertLessEqual(art.bounding_box()["height"], rest * 1.02)


class MotionTest(BuddyTestCase):
    def walk(self, page, order, wait=REST_MS + 2500):
        previous = page.evaluate("scrollY")
        passes = 0
        last_sign = 0
        for section_id in order:
            target = page.evaluate(
                "id => { const r = document.getElementById(id).getBoundingClientRect(); return scrollY + r.top + r.height / 2 - innerHeight / 2; }",
                section_id)
            sign = 1 if target > previous else -1
            if sign != last_sign:
                passes += 1
                last_sign = sign
            page.evaluate("n => { window.__pass = n; }", passes)
            previous = target
            self.scroll_to(page, section_id, wait=wait)

    def test_idle_style_varies_and_bouncy_styles_show_once_per_pass_at_most(self):
        page = self.open()
        self.walk(page, ["s2", "s3", "s4", "s5", "s6", "s7", "s8", "s7", "s6", "s5", "s4", "s3", "s2", "s1"])
        styles = page.evaluate("window.__styles")
        seen = {entry["style"] for entry in styles}
        self.assertTrue(seen <= IDLE_STYLES, seen)
        self.assertGreaterEqual(len(seen), 3, styles)
        for walk_pass in (1, 2):
            bouncy = [e for e in styles if e["pass"] == walk_pass and e["style"] in BOUNCY_STYLES]
            self.assertLessEqual(len(bouncy), 1, styles)

    def test_resting_hover_stays_within_seven_pixels(self):
        page = self.open()
        self.scroll_to(page, "s3", wait=PASS_MS)
        expect(self.bubble(page)).to_be_hidden(timeout=9000)
        page.wait_for_timeout(600)
        spread = page.evaluate(
            """() => new Promise(done => {
                const art = document.querySelector('.jiro-buddy__art');
                const button = document.querySelector('.jiro-buddy__mascot');
                const ys = [], xs = [];
                const end = performance.now() + 4000;
                (function sample() {
                    const a = art.getBoundingClientRect(), b = button.getBoundingClientRect();
                    ys.push(a.top - b.top); xs.push(a.left - b.left);
                    if (performance.now() < end) requestAnimationFrame(sample);
                    else done([Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]);
                })();
            })"""
        )
        self.assertLessEqual(spread[0], 7, spread)
        self.assertLessEqual(spread[1], 7, spread)

    def test_passes_use_only_small_moves_apart_from_the_edge_peek(self):
        page = self.open()
        page.evaluate("""() => {
            window.__hops = [];
            const art = document.querySelector('.jiro-buddy__art');
            const button = document.querySelector('.jiro-buddy__mascot');
            const bubble = document.querySelector('.jiro-buddy__bubble');
            (function sample() {
                const a = art.getBoundingClientRect(), b = button.getBoundingClientRect();
                if (bubble.hidden) window.__hops.push(Math.hypot(a.left - b.left, a.top - b.top));
                requestAnimationFrame(sample);
            })();
        }""")
        self.walk(page, ["s2", "s3", "s4", "s3", "s2"])
        self.assertLessEqual(max(page.evaluate("window.__hops")), 15, "small gestures (about 7px) plus hover; a large move is 17px or more")

    def test_a_long_jump_has_him_peek_in_from_the_edge_first(self):
        page = self.open()
        page.evaluate(SAMPLE_EDGE)
        self.scroll_to_end(page, "bottom")
        samples = page.evaluate("window.__edge")
        longest = run_start = 0
        for at, partly in samples:
            if partly and not run_start:
                run_start = at
            if not partly and run_start:
                longest = max(longest, at - run_start)
                run_start = 0
        self.assertGreaterEqual(longest, 800)
        box = self.mascot(page).bounding_box()
        self.assertTrue(0 <= box["x"] and box["x"] + box["width"] <= DESKTOP["width"], box)

    def test_his_face_changes_expression_while_resting(self):
        page = self.open()
        self.scroll_to(page, "s3", wait=PASS_MS + 2000)
        page.evaluate("window.__faces = []")
        page.wait_for_timeout(16000)
        faces = {entry["face"] for entry in page.evaluate("window.__faces")}
        self.assertGreaterEqual(len(faces - {"cursor"}), 2, faces)

    def test_he_looks_at_nearby_things_without_moving_the_page(self):
        page = self.open()
        self.scroll_to(page, "s3", wait=PASS_MS)
        before = page.evaluate("scrollY")
        page.evaluate("""() => {
            window.__lit = new Set();
            (function sample() {
                document.querySelectorAll('main *').forEach(el => {
                    if (getComputedStyle(el).outlineStyle !== 'none') window.__lit.add(el.id || el.tagName);
                });
                requestAnimationFrame(sample);
            })();
        }""")
        page.wait_for_timeout(16000)
        self.assertGreater(page.evaluate("window.__lit.size"), 0)
        self.assertEqual(page.evaluate("scrollY"), before)
        self.assertLess(page.evaluate("window.__shifts"), 0.01)


class DragTest(BuddyTestCase):
    def test_dragging_moves_him_with_the_pointer_and_he_stays_on_screen_there(self):
        page = self.open()
        x, y = self.drag(page, -400, 120)
        cx, cy = self.mascot_center(page)
        self.assertAlmostEqual(cx, x, delta=4)
        self.assertAlmostEqual(cy, y, delta=4)
        self.scroll_to(page, "s5")
        cx, cy = self.mascot_center(page)
        self.assertAlmostEqual(cx, x, delta=4)
        self.assertAlmostEqual(cy, y, delta=4)

    def test_a_dropped_jiro_keeps_his_spot_after_a_reload(self):
        page = self.open()
        x, y = self.drag(page, -300, -100)
        page.reload()
        expect(self.mascot(page)).to_be_visible()
        page.wait_for_timeout(1500)
        cx, cy = self.mascot_center(page)
        self.assertAlmostEqual(cx, x, delta=4)
        self.assertAlmostEqual(cy, y, delta=4)

    def test_dropping_does_not_make_him_talk_but_a_small_wobble_is_a_click(self):
        page = self.open()
        self.drag(page, 200, 60)
        page.wait_for_timeout(800)
        self.assertEqual(self.lines(page), [])
        self.drag(page, 3, 0, steps=3)
        page.wait_for_timeout(600)
        self.assertEqual(self.lines(page), [self.comment_under_jiro(page)])

    def test_a_dropped_jiro_comments_on_the_section_under_him_once_per_pass(self):
        page = self.open()
        self.drag(page, -500, 0)
        self.scroll_to(page, "s4")
        self.scroll_to(page, "s6")
        lines = self.lines(page)
        self.assertEqual(len(lines), 1, lines)
        self.assertIn(lines[0], COMMENTS[2:5])

    def test_arrow_keys_move_him_too(self):
        page = self.open()
        x, y = self.mascot_center(page)
        before = page.evaluate("scrollY")
        self.mascot(page).focus()
        page.keyboard.press("ArrowRight")
        page.keyboard.press("ArrowUp")
        page.wait_for_timeout(400)
        cx, cy = self.mascot_center(page)
        self.assertGreater(cx, x + 10)
        self.assertLess(cy, y - 10)
        self.assertEqual(page.evaluate("scrollY"), before)

    def test_touch_drag_moves_him_on_a_phone_and_the_page_still_scrolls(self):
        page = self.open(viewport=NARROW, has_touch=True, is_mobile=True)
        cdp = page.context.new_cdp_session(page)
        x, y = self.mascot_center(page)
        start_scroll = page.evaluate("scrollY")

        def touch(kind, px, py):
            points = [] if kind == "touchEnd" else [{"x": px, "y": py}]
            cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

        touch("touchStart", x, y)
        for i in range(1, 11):
            touch("touchMove", x + 12 * i, y - 20 * i)
        touch("touchEnd", x + 120, y - 200)
        page.wait_for_timeout(500)
        cx, cy = self.mascot_center(page)
        self.assertAlmostEqual(cx, x + 120, delta=6)
        self.assertAlmostEqual(cy, y - 200, delta=6)
        self.assertEqual(page.evaluate("scrollY"), start_scroll)
        before = page.evaluate("scrollY")
        touch("touchStart", 40, 700)
        for i in range(1, 11):
            touch("touchMove", 40, 700 - 40 * i)
        touch("touchEnd", 40, 300)
        page.wait_for_timeout(500)
        self.assertGreater(page.evaluate("scrollY"), before + 100)


class ReducedMotionTest(BuddyTestCase):
    def test_reduced_motion_keeps_him_still_and_lines_appear_in_full(self):
        page = self.open(reduced_motion="reduce")
        self.scroll_to(page, "s3", wait=4000)
        running = page.evaluate(
            "document.querySelector('.jiro-buddy').getAnimations({subtree: true}).filter(a => a.playState === 'running').length")
        self.assertEqual(running, 0)
        self.mascot(page).click()
        expect(page.locator(".jiro-buddy__text")).to_have_text(self.comment_under_jiro(page), timeout=200)


class PageTest(BuddyTestCase):
    def test_page_without_commented_sections_renders_no_buddy(self):
        context = self.browser.new_context(viewport=DESKTOP)
        self.addCleanup(context.close)
        page = context.new_page()
        page.goto(f"{self.base}/plain.html")
        page.wait_for_timeout(1500)
        self.assertEqual(page.locator(".jiro-buddy").count(), 0)

    def test_loading_the_script_twice_renders_one_buddy(self):
        page = self.open(f"{self.base}/double.html")
        self.assertEqual(page.locator(".jiro-buddy").count(), 1)

    def test_hiding_jiro_lasts_across_reloads_in_the_same_tab(self):
        page = self.open()
        page.get_by_role("button", name="Hide Jiro").click()
        expect(page.locator(".jiro-buddy")).to_be_hidden()
        page.reload()
        page.wait_for_timeout(1500)
        self.assertEqual(page.locator(".jiro-buddy__mascot:visible").count(), 0)

    def test_a_new_tab_starts_fresh_after_hiding_or_dropping_him(self):
        page = self.open()
        x, y = self.drag(page, -300, -100)
        page.get_by_role("button", name="Hide Jiro").click()
        fresh = self.open()
        cx, cy = self.mascot_center(fresh)
        self.assertGreater(abs(cx - x) + abs(cy - y), 50)

    def test_yes_on_the_pricing_line_takes_you_to_the_email_field(self):
        page = self.open(f"{self.mockup}/index.html")
        self.scroll_to(page, "pricing", wait=4500)
        self.mascot(page).click()
        page.get_by_role("button", name="Yes please").click()
        expect(page.locator("#email")).to_be_focused()
        expect(self.bubble(page)).to_be_hidden()

    def test_mockup_full_scroll_has_no_errors_and_never_covers_a_heading(self):
        for viewport in (DESKTOP, NARROW):
            with self.subTest(width=viewport["width"]):
                page = self.open(f"{self.mockup}/index.html", viewport=viewport)
                for section_id in ("hero", "pricing", "bakeoff"):
                    self.scroll_to(page, section_id, wait=4500)
                    covered = page.evaluate(
                        """id => {
                            const m = document.querySelector('.jiro-buddy__mascot').getBoundingClientRect();
                            return [...document.getElementById(id).querySelectorAll('h1,h2,h3')].some(h => {
                                const range = document.createRange();
                                range.selectNodeContents(h);
                                return [...range.getClientRects()].some(r => r.width && r.height &&
                                    m.left < r.right && m.right > r.left && m.top < r.bottom && m.bottom > r.top);
                            });
                        }""",
                        section_id,
                    )
                    self.assertFalse(covered, f"Jiro covers a heading in #{section_id} at {viewport['width']}px")
                self.assertEqual(page.evaluate("window.__errors"), [])


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

    def test_every_look_anchor_and_action_selector_points_at_a_hotspot(self):
        context = self.browser.new_context(viewport=DESKTOP)
        self.addCleanup(context.close)
        page = context.new_page()
        page.goto(f"{self.base}/stitched/index.html")
        missing = page.evaluate("""() => [...document.querySelectorAll('[data-jiro-look],[data-jiro-anchor],[data-jiro-action]')]
            .flatMap(s => ['jiroLook', 'jiroAnchor', 'jiroAction'].map(k => s.dataset[k]).filter(Boolean))
            .filter(sel => !document.querySelector(sel))""")
        self.assertEqual(missing, [])

    def test_every_commented_section_has_an_anchor_inside_the_middle_two_thirds(self):
        context = self.browser.new_context(viewport=DESKTOP)
        self.addCleanup(context.close)
        page = context.new_page()
        page.goto(f"{self.base}/stitched/index.html")
        result = page.evaluate("""() => {
            const band = document.querySelector('main').getBoundingClientRect();
            return [...document.querySelectorAll('[data-jiro-comment]')].map(s => {
                const a = document.querySelector(s.dataset.jiroAnchor || 'none');
                if (!a) return [s.id, null];
                const r = a.getBoundingClientRect();
                return [s.id, ((r.left + r.width / 2) - band.left) / band.width];
            });
        }""")
        for sid, at in result:
            self.assertIsNotNone(at, f"#{sid} has no anchor")
            self.assertTrue(0.17 <= at <= 0.83, f"#{sid} anchor at {at:.2f} of the width")


if __name__ == "__main__":
    unittest.main()
