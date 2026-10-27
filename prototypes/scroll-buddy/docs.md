# Noridoc: scroll-buddy

Path: @/prototypes/scroll-buddy

### Overview

- A working, scrollable prototype of "Jiro the scroll buddy": a small mascot that rests in blank space beside landing-page sections, travels with the reader, makes one short remark per scroll pass, looks at nearby things while resting, and can be dragged and pinned anywhere on screen.
- Status on 2026-10-27 (v6): on `feat/jiro-scroll-buddy` in `tilework-tech/jiro.bot`, not merged and not deployed. [index.html](index.html) is a hand-built reconstruction of the landing page, not Maddy's final HTML; her template ZIP and the `restore-copy-editor` bundle have not been received.
- [jiro-buddy.js](jiro-buddy.js) and [jiro-buddy.css](jiro-buddy.css) are the dependency-free runtime meant to be transplanted onto the real page. The folder root is the editable working copy (currently identical to v6); [versions/](versions/) holds frozen, self-contained snapshots of earlier versions. Everything else (moodboards, QA script, older demos) supports designing and checking it.
- [HANDOFF.md](HANDOFF.md) is the primary entry point for anyone continuing the project (links, how to run, movement catalogue, open items); [CONTINUE.md](CONTINUE.md) holds session-to-session engineering notes.

### How it fits into the larger codebase

- Lives under `prototypes/`, outside `site/`, so [build.py](../../build.py), [tools/lint.py](../../tools/lint.py) and the deploy workflow never see it. Porting means copying the two buddy files and the section attributes onto the real page (see [root docs](../../docs.md)).
- The host page opts in purely through `data-jiro-*` attributes on sections; the script finds them, builds its own `<aside>`, and touches the host page only by temporarily hiding a docked logo and adding the `.jiro-look-target` outline class.
- Browser-level state lives in `sessionStorage` only: `jiro-buddy-hidden` (closed for this tab) and `jiro-buddy-pin` (dragged position, `{x, y}` viewport pixels). Nothing is sent anywhere.
- Regression gates: [tests/test_scroll_buddy.py](../../tests/test_scroll_buddy.py) is the v6 behaviour suite (headless system Chrome against fixture pages), and [qa/check_motion.py](qa/check_motion.py) is a pass/placement check against the mockup in the session's headed Chrome.

```
host page sections (data-jiro-comment, -anchor, -merge, -ask, -action)
        │
        ▼
jiro-buddy.js ── IntersectionObserver + scroll ──> nearestToCenter() ──> setActive()
   │                                                   │
   │  direction pass (updateDirection)                 ├─ pinned? stay put, passLine()
   │  speech (passLine / click / auto-close)           └─ travelTo(): edge peek | small gesture | quiet jump
   │  rest loop (glance / expression)                          │
   │  drag + keys (pin, sessionStorage)                        ▼
   ▼                                                    finishMove(): pickIdle, ^_^ face, small beats, passLine
<aside class="jiro-buddy" data-jiro-state/-motion/-face/-move/-talking>  styled by jiro-buddy.css
```

### Core Implementation

**Section selection and pacing.** `nearestToCenter()` scans every section with `data-jiro-comment` and picks the one under the viewport's vertical centre, fed by an `IntersectionObserver` and a passive scroll listener, so a fast jump from hero to footer targets the footer directly. The first placement pops in over 700 ms. A nearby section change waits 1200 ms and respects a 2000 ms minimum dwell at the current spot; a jump of two or more section indices is handled after 450 ms. Every section change calls `hideBubble()`, which bumps a run token so stale timers no-op.

**Direction passes.** `updateDirection()` starts a pass on the first scroll movement; 60 px of accumulated movement in the opposite direction starts a new one, shorter reversals are jitter. A pass records where it started; once it has travelled at least half the scrollable height it counts as a "long" pass (once per pass).

**Motion per pass.** The large glide and large spring moves from v5 are gone. In each pass:

| Beat | Rule |
|---|---|
| Edge peek (`large-peek`) | Once per page load, wide screens only, when his previous spot is offscreen. 2400 ms peek (about 1.2 s visible at the nearer edge), then an 850 ms bounded flight and a 340 ms landing bounce. |
| Small gestures (`small-scoot` / `small-hop`) | Up to two per pass: a 7 px side scoot or a 5 px hop, 500 ms each. If the reader stops, the remaining ones play at the resting spot, spaced by 2000 ms. |
| Anything else (`game-idle`) | Quiet reposition with a short fade. |

`data-jiro-move` carries the label of the latest beat (the QA script reads it).

**Idle styles on landing.** `finishMove()` calls `pickIdle()`, which sets `data-jiro-motion` randomly from `game` (weighted twice), `sleepy`, `spring`, `eager`. The bouncy styles (`spring`, `eager`) are allowed at most once per pass. Sleepy shows the `-_-` face, dims the art and shows z's; that CSS is keyed on `data-jiro-motion="sleepy"`. Each landing also shows the `^_^` "happy" face for 900 ms with a small squash.

**Rest loop (looks at stuff, expressions).** `rest()` runs on its own timer, separate from the speech timers, with 5 s beats. Beats alternate between a glance and an expression. A glance picks a random visible `h2`, `h3`, `button`, `a`, `img`, `td` or `article` inside `main` within 520 px of him, nudges the face 3 px toward it via `--jiro-gx/--jiro-gy`, and gives it `.jiro-look-target` (a dashed salmon outline that cannot be mistaken for the green focus ring; no layout change) for 1.3 s. An expression is `^_^` or `o_o` with a small squash. Beats are skipped while moving, dragging or speaking, and the loop does not run under reduced motion.

**Speech.** Silent on load. `passLine()` gives exactly one line per direction pass, about 900 ms after he settles, about the section he sits on. Sections already commented on are skipped, so a later landing in the same pass may speak instead. Lines auto-close after 4.5 s, or 9 s when the section has an ask button. After four long passes he goes quiet: no more pass lines until the mascot is clicked. Clicking always speaks about his current spot and resets quiet mode, the long-pass count and the already-said set. Text comes from `data-jiro-comment`.

**Grows into the bubble.** While a line is shown, `data-jiro-talking` is set and the art scales to (1.05, 1.12) from its bottom edge, shrinking back on close. No stretch under reduced motion.

**Drag and pin.** Pointer Events with pointer capture on the mascot button. Movement under 5 px is a click. While held: `o_o` face, a dangle animation, `data-jiro-state="held"`. On drop he is pinned exactly where dropped (clamped to the viewport): `position: fixed`, stays put while scrolling, no section travel, peek or logo docking, and the position is saved to `jiro-buddy-pin` and restored on reload in the same tab. Arrow keys move him 24 px (96 px with Shift) and also pin him, without scrolling the page. Works at every width. A pinned Jiro still gets one pass line per pass, about the section under his centre (`spotSection()`).

### Things to Know

- Why it behaves this way: v4 sat near section centres and auto-commented on every section, which Martin found too central and erratic; v5 went fully silent with one large move per pass. v6 (Martin, 2026-10-27) keeps the side placement, brings back a single remark per pass, drops the large glide/spring, and adds idle variety, glances and free drag-to-pin ("exactly where you drop it"). The mockup's top follows Maddy's 2026-10-19 screenshot and lower sections the 2026-10-14 review mock; the mascot art is the smooth balloon with a pixel `>_` face that Martin picked.
- `hideBubble()` = cancel all speech/gesture timers + `closeBubble()`. `closeBubble()` only hides the visuals. Auto-close uses `closeBubble()` so pending small gestures in the pass keep running; section changes use `hideBubble()`.
- `touch-action: none` is set on the mascot only, so a phone page still scrolls when you swipe anywhere else. A click that ends a drag is swallowed so dropping never triggers speech.
- Placement: every mockup section has `data-jiro-anchor` pointing at an image or a one-pixel `.jiro-rest` marker in blank space, alternating left and right on desktop. `spotFor()` measures readable text with `Range.getClientRects()`, samples nearby candidates when the anchor overlaps text or is out of view, rejects ones covering a heading, and keeps his centre out of the middle 35% to 65% of wide viewports. If nothing clear exists it keeps the planned anchor, which may be offscreen. Flight paths may pass near content; resting points are the protected targets.
- Logo docking: `data-jiro-merge` points at a likeness (Ditch card, FAQ reserve seal). `merge()` hides it only when Jiro's centre matches it within 12 px, scale capped at 2.4; it is restored when he moves, closes, or is grabbed. Pinned Jiro never docks.
- Reduced motion (`prefers-reduced-motion: reduce`): no CSS idle, no Web Animations, no rest loop, no stretch; lines appear in full. Placement, speech and docking still work. Speech uses a visible paragraph plus an `aria-live` status announced once. Ask buttons (Yes / Later) come from `data-jiro-ask`; Yes scrolls to and focuses `data-jiro-action`. The close button hides him for the tab.
- No layout shift: the `<aside>` is absolutely positioned (fixed when pinned) and moved with `translate`.
- Gzip budget: the two buddy files must stay under 12,288 bytes compressed (enforced by the budget test). v6 is at about 12,244 bytes, so further additions need trimming elsewhere.
- Un-pinning: there is no control for it. Dragging again re-pins; only clearing the tab session returns him to section travel.
- Host-page attributes:

| Attribute | Behaviour |
|---|---|
| `data-jiro-comment` | Required to opt a section in; the line he says about it. |
| `data-jiro-anchor` | Preferred resting point selector; section centre if absent. |
| `data-jiro-mobile-anchor` | Fallback when the main anchor has no rendered size. |
| `data-jiro-merge` | Logo he can dock into. |
| `data-jiro-ask` | Label for the affirmative button in the bubble (also lengthens auto-close to 9 s). |
| `data-jiro-action` | Target scrolled to and focused on Yes. |

- v4 attributes (`data-jiro-hovers`, `data-jiro-look`, `data-jiro-mood`, `data-jiro-click`) are inactive. [stitched/](stitched/) is a legacy screenshot demo that still uses them; its markup tests remain in the suite. [share/](share/) video and stills predate v6.
- Layout and how to open things (serve the folder with `python3 -m http.server 4320 --directory prototypes/scroll-buddy` from the repo root):

| Path | What it is | URL on port 4320 |
|---|---|---|
| root `index.html` + buddy files | Working copy, the only files the tests and QA script target | `/` |
| [versions/v6/](versions/v6/), [versions/v5/](versions/v5/) | Frozen copies of `index.html`, `jiro-buddy.js`, `jiro-buddy.css`, `jiro-v3.svg` from commits `025ab6b` (v6) and `2b66db4` (v5). Never edited; add a new `versions/vN/` when a version ships to Martin | `/versions/v6/`, `/versions/v5/` |
| [moodboard/handoff.html](moodboard/handoff.html) | Generated, self-contained board of every v6 movement (big, small, idle hovers, faces and looks, talking, clicks and controls) with frequency/where chips, a per-pass budget, a placement map and the comment-spot table | `/moodboard/handoff.html` |
| other [moodboard/](moodboard/) pages | Design history boards (see below) | `/moodboard/<name>.html` |

- [moodboard/handoff.html](moodboard/handoff.html) inlines the mascot art paths from [jiro-buddy.js](jiro-buddy.js) and the comment rows from [index.html](index.html) at generation time. It does not read them live, so it goes stale when either changes and must be regenerated or hand-edited.
- Moodboards in [moodboard/](moodboard/) are design history: the original 5 by 5 board ([moodboard/index.html](moodboard/index.html), source of the v6 picks A2-A5, B3, B5, C4, D4), earlier interaction/expression boards, and the motion board [moodboard/motion.html](moodboard/motion.html) whose low/medium/high examples no longer match v6 exactly (glide and spring arrival are not live). Run them through [moodboard/serve.py](moodboard/serve.py) so Save works. Only `picks-motion.json` is tracked; picks for the other boards are gitignored.
- Running the gates (from the repo root unless noted):

```bash
uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py   # v6 suite, headless system Chrome, ~8 min
cd prototypes/scroll-buddy && uv run --no-project --with playwright python qa/check_motion.py   # needs port 4320 preview + session Chrome on CDP 9222
node --check prototypes/scroll-buddy/jiro-buddy.js
```

`qa/check_motion.py` asserts each fast pass shows only `large-peek`, `small-*` or `game-idle` moves with at least two small ones, ends in one of the four idle styles, has the bubble closed after 13 s, and keeps the mascot off heading glyphs in hero, pricing and bakeoff at 1440 px and 390 px.

Created and maintained by Nori.
