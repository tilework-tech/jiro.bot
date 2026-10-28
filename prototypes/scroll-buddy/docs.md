# Noridoc: scroll-buddy

Path: @/prototypes/scroll-buddy

### Overview

- A working, scrollable prototype of "Jiro the scroll buddy": a small mascot that rests in blank space beside landing-page sections, travels with the reader, makes one short remark per scroll pass, looks at nearby things while resting, and can be dragged and pinned anywhere on screen.
- Status on 2026-10-28 (v7): on `feat/jiro-scroll-buddy` in `tilework-tech/jiro.bot`, not merged and not deployed. [index.html](index.html) is a hand-built reconstruction of the landing page, not Maddy's final HTML; her template ZIP and the `restore-copy-editor` bundle have not been received.
- [jiro-buddy.js](jiro-buddy.js) and [jiro-buddy.css](jiro-buddy.css) are the dependency-free runtime meant to be transplanted onto the real page. The folder root is the editable working copy (currently identical to v7); [versions/](versions/) holds frozen, self-contained snapshots of each version shown to Martin. Everything else (moodboards, QA script, older demos) supports designing and checking it.
- [HANDOFF.md](HANDOFF.md) is the primary entry point for anyone continuing the project (links, how to run, movement catalogue, open items); [CONTINUE.md](CONTINUE.md) holds session-to-session engineering notes.

### How it fits into the larger codebase

- Lives under `prototypes/`, outside `site/`, so [build.py](../../build.py), [tools/lint.py](../../tools/lint.py) and the deploy workflow never see it. Porting means copying the two buddy files and the section attributes onto the real page (see [root docs](../../docs.md)).
- The host page opts in purely through `data-jiro-*` attributes on sections; the script finds them, builds its own `<aside>`, and touches the host page only by temporarily hiding a docked logo and adding the `.jiro-look-target` outline class.
- Browser-level state lives in `sessionStorage` only: `jiro-buddy-hidden` (closed for this tab) and `jiro-buddy-pin` (dragged position, `{x, y}` viewport pixels). Nothing is sent anywhere.
- Regression gates: [tests/test_scroll_buddy.py](../../tests/test_scroll_buddy.py) is the v7 behaviour suite (headless system Chrome against fixture pages), and [qa/check_motion.py](qa/check_motion.py) is a pass/placement check against the mockup in the session's headed Chrome.

```
host page sections (data-jiro-comment, -anchor, -merge, -peek, -ask, -action)
        │
        ▼
jiro-buddy.js ── IntersectionObserver + scroll ──> nearestToCenter() ──> setActive()
   │                                                   │
   │  direction pass (updateDirection)                 ├─ pinned? stay put, passLine()
   │  speech (passLine / click / auto-close)           └─ travelTo(): peek behind | edge peek | small gesture | quiet jump
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
| Peek behind (`large-peek-behind`) | Once per pass, checked first. Wide screens, motion allowed, not pinned, when the target section has `data-jiro-peek` and that element is on screen. He starts tucked behind the element, slides out until about 30% shows at its side edge nearest his resting spot, holds (2000 ms total), then hops in. |
| Edge peek (`large-peek`) | Once per page load (`MAX_PEEKS`), wide screens only, when his previous spot is offscreen or on the first downward section change. 2400 ms peek (about 1.2 s visible at the nearer edge), then the hop-in. |
| Hop-in (both peeks, `hopIn()`) | The peek pose is held (`fill: forwards`) through a 220 ms crouch (squash 1.06/0.92) and only cancelled as the 850 ms low arc to his spot starts, then an 8 px landing hop. |
| Small gestures (`small-scoot` / `small-hop`) | Up to two per pass: a 7 px side scoot or a 5 px hop, 500 ms each. If the reader stops, the remaining ones play at the resting spot, spaced by 2000 ms. |
| Anything else (`game-idle`) | Quiet reposition with a short fade. |

`data-jiro-move` carries the label of the latest beat (the QA script reads it). Because the two peeks have separate limits, the first downward pass on a page with a `data-jiro-peek` section can contain both big moves (approved by Martin).

**Idle styles on landing.** `finishMove()` calls `pickIdle()`, which sets `data-jiro-motion` randomly from `game` (weighted twice), `sleepy`, `spring`, `eager`. The bouncy styles (`spring`, `eager`) are allowed at most once per pass. Sleepy shows the `-_-` face, dims the art and shows z's; that CSS is keyed on `data-jiro-motion="sleepy"`. Each landing also shows the `^_^` "happy" face for 900 ms with a small squash.

**Rest loop (looks at stuff, expressions).** `rest()` runs on its own timer, separate from the speech timers, with 5 s beats. Beats alternate between a glance and an expression. A glance picks a random visible `h2`, `h3`, `button`, `a`, `img`, `td` or `article` inside `main` within 520 px of him, nudges the face 3 px toward it via `--jiro-gx/--jiro-gy`, and gives it `.jiro-look-target` (a dashed salmon outline that cannot be mistaken for the green focus ring; no layout change) for 1.3 s. An expression is `^_^` or `o_o` with a small squash. Beats are skipped while moving, dragging or speaking, and the loop does not run under reduced motion.

**Speech.** Silent on load. `passLine()` gives exactly one line per direction pass, about 900 ms after he settles, about the section he sits on. Sections already commented on are skipped, so a later landing in the same pass may speak instead. Lines auto-close after 4.5 s, or 9 s when the section has an ask button. After four long passes he goes quiet: no more pass lines until the mascot is clicked. Clicking always speaks about his current spot and resets quiet mode, the long-pass count and the already-said set. Text comes from `data-jiro-comment`.

**Grows into the bubble.** While a line is shown, `data-jiro-talking` is set and the art scales to (1.05, 1.12) from its bottom edge, shrinking back on close. No stretch under reduced motion.

**Drag and pin.** Pointer Events with pointer capture on the mascot button. Movement under 5 px is a click. While held: `o_o` face, a dangle animation, `data-jiro-state="held"`. On drop he is pinned exactly where dropped (clamped to the viewport): `position: fixed`, stays put while scrolling, no section travel, peek or logo docking, and the position is saved to `jiro-buddy-pin` and restored on reload in the same tab. Arrow keys move him 24 px (96 px with Shift) and also pin him, without scrolling the page. Works at every width. A pinned Jiro still gets one pass line per pass, about the section under his centre (`spotSection()`).

### Things to Know

- Why it behaves this way: v4 sat near section centres and auto-commented on every section, which Martin found too central and erratic; v5 went fully silent with one large move per pass. v6 (Martin, 2026-10-27) keeps the side placement, brings back a single remark per pass, drops the large glide/spring, and adds idle variety, glances and free drag-to-pin ("exactly where you drop it"). v7 (Martin, 2026-10-28) fixes the edge peek never firing for readers who scroll in short flicks and pause (their previous spot never fully left the screen, so he only made small moves), adds the peek from behind a marked element, and enlarges the game idle. The mockup's top follows Maddy's 2026-10-19 screenshot and lower sections the 2026-10-14 review mock; the mascot art is the smooth balloon with a pixel `>_` face that Martin picked.
- `hideBubble()` = cancel all speech/gesture timers + `closeBubble()`. `closeBubble()` only hides the visuals. Auto-close uses `closeBubble()` so pending small gestures in the pass keep running; section changes use `hideBubble()`.
- `touch-action: none` is set on the mascot only, so a phone page still scrolls when you swipe anywhere else. A click that ends a drag is swallowed so dropping never triggers speech.
- Peek behind: `peekBehind()` raises the `data-jiro-peek` element's inline `z-index` to the buddy's computed z-index + 1 for the move and restores the previous inline value when the move ends or is interrupted (`lower()`, also called from `landFlight()`). This only works when the element is positioned and no ancestor creates its own stacking context; `#video-frame` is `position: relative` and the sections set no z-index or transform. The element must also be wider and taller than Jiro. His vertical position is clamped inside the element's box with 8 px margins. On the landing page `#video` points at `#video-frame`. The once-per-pass flag is `journey.covered`, reset with every new pass; it does not consume `MAX_PEEKS`.
- Before a peek, the hop-in used to cancel the peek animation before the crouch, so he flashed at his resting spot for about 230 ms before flying in; holding the pose with `fill: forwards` until the arc starts removes that.
- Game idle (A2) amplitudes: 5.25 px bob, ±1.1 px drift, ±2.25° tilt (v6 values ×1.5, same timing, no scale change). Eager has its own `jiro-buddy-eager-drift` / `-tilt` keyframes holding the old ±0.75 px / ±1.5° values, so changing the shared drift/tilt keyframes only affects game idle.
- Placement: every mockup section has `data-jiro-anchor` pointing at an image or a one-pixel `.jiro-rest` marker in blank space, alternating left and right on desktop. `spotFor()` measures readable text with `Range.getClientRects()`, samples nearby candidates when the anchor overlaps text or is out of view, rejects ones covering a heading, and keeps his centre out of the middle 35% to 65% of wide viewports. If nothing clear exists it keeps the planned anchor, which may be offscreen. Flight paths may pass near content; resting points are the protected targets.
- Logo docking: `data-jiro-merge` points at a likeness (Ditch card, FAQ reserve seal). `merge()` hides it only when Jiro's centre matches it within 12 px, scale capped at 2.4; it is restored when he moves, closes, or is grabbed. Pinned Jiro never docks.
- Reduced motion (`prefers-reduced-motion: reduce`): no CSS idle, no Web Animations, no rest loop, no stretch; lines appear in full. Placement, speech and docking still work. Speech uses a visible paragraph plus an `aria-live` status announced once. Ask buttons (Yes / Later) come from `data-jiro-ask`; Yes scrolls to and focuses `data-jiro-action`. The close button hides him for the tab.
- No layout shift: the `<aside>` is absolutely positioned (fixed when pinned) and moved with `translate`.
- Gzip budget: the two buddy files must stay under 13,312 bytes (13 KB) compressed, enforced by the budget test. Martin approved raising it from 12 KB for v7; v7 is at about 12,600 bytes.
- Un-pinning: there is no control for it. Dragging again re-pins; only clearing the tab session returns him to section travel.
- Host-page attributes:

| Attribute | Behaviour |
|---|---|
| `data-jiro-comment` | Required to opt a section in; the line he says about it. |
| `data-jiro-anchor` | Preferred resting point selector; section centre if absent. |
| `data-jiro-mobile-anchor` | Fallback when the main anchor has no rendered size. |
| `data-jiro-merge` | Logo he can dock into. |
| `data-jiro-peek` | Element he peeks out from behind when travelling into the section (once per pass, desktop). |
| `data-jiro-ask` | Label for the affirmative button in the bubble (also lengthens auto-close to 9 s). |
| `data-jiro-action` | Target scrolled to and focused on Yes. |

- v4 attributes (`data-jiro-hovers`, `data-jiro-look`, `data-jiro-mood`, `data-jiro-click`) are inactive. [stitched/](stitched/) is a legacy screenshot demo that still uses them; its markup tests remain in the suite. [share/](share/) video and stills predate v6.
- Layout and how to open things (serve the folder with `python3 -m http.server 4320 --directory prototypes/scroll-buddy` from the repo root):

| Path | What it is | URL on port 4320 |
|---|---|---|
| root `index.html` + buddy files | Working copy, the only files the tests and QA script target | `/` |
| [versions/v7/](versions/v7/), [versions/v6/](versions/v6/), [versions/v5/](versions/v5/) | Frozen copies of `index.html`, `jiro-buddy.js`, `jiro-buddy.css`, `jiro-v3.svg` (v7 from the 2026-10-28 working copy, v6 from `025ab6b`, v5 from `2b66db4`). v6 also has a single-file build, `jiro-scroll-buddy-v6.html`; v7 has none yet. Never edited; add a new `versions/vN/` when a version ships to Martin | `/versions/v7/`, `/versions/v6/`, `/versions/v5/` |
| [moodboard/handoff.html](moodboard/handoff.html) | Generated, self-contained board of v6 movements (not regenerated for v7, so it lacks the peek behind and shows the smaller game idle) (big, small, idle hovers, faces and looks, talking, clicks and controls) with frequency/where chips, a per-pass budget, a placement map and the comment-spot table | `/moodboard/handoff.html` |
| other [moodboard/](moodboard/) pages | Design history boards (see below) | `/moodboard/<name>.html` |

- [moodboard/handoff.html](moodboard/handoff.html) inlines the mascot art paths from [jiro-buddy.js](jiro-buddy.js) and the comment rows from [index.html](index.html) at generation time. It does not read them live, so it goes stale when either changes and must be regenerated or hand-edited.
- Moodboards in [moodboard/](moodboard/) are design history: the original 5 by 5 board ([moodboard/index.html](moodboard/index.html), source of the v6 picks A2-A5, B3, B5, C4, D4), earlier interaction/expression boards, and the motion board [moodboard/motion.html](moodboard/motion.html) whose low/medium/high examples no longer match v6 exactly (glide and spring arrival are not live). Run them through [moodboard/serve.py](moodboard/serve.py) so Save works. Only `picks-motion.json` is tracked; picks for the other boards are gitignored.
- Running the gates (from the repo root unless noted):

```bash
uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py   # v7 suite, headless system Chrome, ~13 min
cd prototypes/scroll-buddy && uv run --no-project --with playwright python qa/check_motion.py   # needs port 4320 preview + session Chrome on CDP 9222
node --check prototypes/scroll-buddy/jiro-buddy.js
```

`qa/check_motion.py` asserts each fast pass shows only `large-peek`, `large-peek-behind`, `small-*` or `game-idle` moves with at least two small ones, ends in one of the four idle styles, has the bubble closed after 13 s, and keeps the mascot off heading glyphs in hero, pricing and bakeoff at 1440 px and 390 px.

Created and maintained by Nori.
