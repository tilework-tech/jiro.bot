# Noridoc: prototypes/scroll-buddy

Path: @/prototypes/scroll-buddy

### Overview

- A standalone prototype of the Jiro "scroll buddy": the mascot lives inside the page, sitting on one planned spot (anchor) per section within the middle two thirds of the content column, riding along with the page as it scrolls, and hopping to the next section's anchor when that section takes over the middle of the viewport. Once the section settles he looks at what he is about to talk about, thinks, and types one short comment (sometimes a question with Yes/Later buttons) in a speech bubble. Requested by Martin Stübler for the jiro.bot landing page.
- v3 (2026-10-20) is Martin's pick from the moodboard (tiles A2, A4, A5, B1-B5, C1-C3, C5, D4, E3, posted in Slack #growth-agent-work) combined into one scroll-driven flow: "playful like a computer game but high quality, easy on page load".
- v4 (2026-10-23) moves him off the corners and into the page because the corner version "looks too much like Clippy": he must stay within the middle 66% (33% either side of the centre line). Tiles B1 (corner), B2 (side flits) and B3 (peek from the edge) were dropped; B4 (perch) became the default.
- The buddy itself is two dependency-free files, [jiro-buddy.css](jiro-buddy.css) and [jiro-buddy.js](jiro-buddy.js), meant to be copied onto the real site unchanged. [index.html](index.html) is a mockup of the jiro.bot landing page that exists only to exercise them, and [share/](share/index.html) is the team-facing explainer.

### How it fits into the larger codebase

- Not deployed: it lives outside `site/`, so [build.py](../../build.py), [tools/lint.py](../../tools/lint.py) and the deploy workflow never see it. See the root [docs.md](../../docs.md).
- Porting to the real site: copy the CSS and JS next to the page, link the stylesheet in `<head>`, load the script with `defer` before `</body>`, and annotate top-level sections with the `data-jiro-*` contract below. Sections without `data-jiro-comment` are ignored, and a page with none (or only blank ones) renders no buddy. Loading the script more than once still renders a single buddy.

| Section attribute | Effect |
|---|---|
| `data-jiro-comment="..."` | The line Jiro says. Required to be observed at all. |
| `data-jiro-anchor="selector"` | Where he sits for this section: he centres on the element's box (horizontally clamped into the band). Without one he centres on the section itself. Design a Jiro-sized empty spot and point at it. |
| `data-jiro-mood="eager"` | Adds an eager double-hop before he looks and speaks. |
| `data-jiro-hovers="a|b|c"` | On any one element (the mockup uses `<main>`): the lines he cycles through when hovered. |
| `data-jiro-look="selector"` | Element he looks at; it gets the `.jiro-look-target` highlight. |
| `data-jiro-ask="Label"` + `data-jiro-action="selector"` | Turns the comment into a question with a Yes button (labelled `Label`) and Later. |
| `data-jiro-band` | Optional, on one element: the column whose middle 66% he stays in. Defaults to `<main>`, then `<body>`. |
| `data-jiro-click="a|b"` | On any element (or a section): the lines he says when it is clicked, cycling per click. A section without one falls back to its comment. |

- Selectors are resolved with `document.querySelector` at use time; an invalid or unmatched selector is treated as absent.
- Host-page integration: the buddy sits at `z-index: var(--jiro-buddy-z, 50)`; set `--jiro-buddy-z` on `:root` or `.jiro-buddy` if site chrome needs to stack differently. Its elements carry a light reset so host `button`/`p` globals do not leak in. `.jiro-look-target` is the one class the buddy puts on host elements (green outline plus a dark ring, pulsing when motion is allowed), so host styles can override it.
- Fonts: the bubble asks for Inter and the Yes/Later buttons for Geist Mono, each with system fallbacks. The buddy does not load fonts; the host page should already load them or the fallbacks show.
- The mockup [index.html](index.html) follows Maddy's 2026-10-19 Figma screenshot for the top of the page and the earlier 2026-10-14 review mock (`jiro-bot-review.png` in #jiro-bot-design) below it, with the `data-jiro-*` contract on each section. Only pricing names an anchor (its heading); the other sections use the section-centre fallback. [jiro-v3.svg](jiro-v3.svg) is the standalone mascot art used for the "CALL HIM IN" card and other in-page images.
- `stitched/` is the buddy over the real designs instead of a rebuild: [stitched/make.py](stitched/make.py) cuts Maddy's 2026-10-19 Figma screenshot (nav, hero, ditch) and the 2026-10-14 review mock (video through footer) into `<section>` crops by source-pixel coordinates, adds the same `data-jiro-*` attributes as the mockup, and writes `stitched/index.html`. Look targets (`#censor-devin`, `#video-frame`, `#col-jiro`) and one anchor per commented section (`#jiro-hero` … `#jiro-faq`, 20 px source boxes marking where his centre goes, all inside the middle 66%) are invisible percentage-positioned hotspots over the image, and `#email` is a transparent real input over the drawn field. Text in the page is pixels, so it is desktop-only and reflects whatever the two screenshots show; rerun `make.py` after replacing an image or moving a cut.
- `moodboard/` is the live 5x5 board of animation variants the v3 picks came from (rows A-E: speed and hover feel, position and looking around, face and blinking, shape and form, text and helpfulness). `python3 moodboard/serve.py --port N` serves it; stars and notes are saved to an untracked `picks.json`. `moodboard/interactions.html` is a second 5x5 board of click and drag ideas (rows A-E: clicking Jiro, clicking parts of the page, drag and place, easter eggs, helpful actions); every tile is a clickable or draggable mini-scene, and its picks save to the untracked `picks-interactions.json` (serve.py accepts any `picks-<name>.json`). `moodboard/expressions.html` is a third 5x5 board (rows A-E: antennas, head pose, timing, expressions, on the page) of head-and-antenna expressions learned from the Reachy robot video Cliff shared: the face stays `>_` and the two free ends of the outline at the top gap act as antennas. It is drawn with a simplified inline SVG of the V3 bubble (separate end strokes that can rotate), not the shipping art; picks save to `picks-expressions.json`. Its reference strip loads key frames from an untracked `moodboard/reachy/` folder (third-party video frames, not committed).
- `share/` (still showing the v3 corner flow, not yet re-recorded for v4) is a static explainer for the team: [share/index.html](share/index.html) walks the flow section by section with stills from `share/stills/`, a rules table, and `share/jiro-buddy-flow.mp4`, a 56 s 1440x900 recording of one top-to-bottom scroll with the 20 s idle segment sped up 9x. It links back to `../index.html` as the live demo.
- Tests live in the repo-level [tests/test_scroll_buddy.py](../../tests/test_scroll_buddy.py), alongside the stdlib-only build and lint tests (see Things to Know).

### Core Implementation

- Startup is deferred so the buddy never competes with page load: the script waits for `window` `load`, then `requestIdleCallback` (500 ms timeout, `setTimeout` fallback), then finds the commented sections, renders into an `<aside aria-label="Jiro">`, and observes the sections with an `IntersectionObserver`.

```
aside.jiro-buddy  [data-jiro-state, data-jiro-face]
 ├─ button.jiro-buddy__mascot   "Jiro: replay comment"
 │    figure > bob > drift > tilt > squash > hop > SVG art + z's
 │    figure > ground shadow, dust puff
 ├─ div.jiro-buddy__bubble      absolutely positioned
 │    ├─ p.jiro-buddy__text     aria-hidden, typed text
 │    └─ div.jiro-buddy__acts   Yes / Later buttons (questions only)
 ├─ p.jiro-buddy__sr            role="status", aria-live="polite", full text
 └─ button.jiro-buddy__close    "Hide Jiro"
```

- The aside exposes its state for CSS and tests. `data-jiro-state` is one of `idle`, `flying`, `eager`, `looking`, `thinking`, `speaking`, `sleepy`. `data-jiro-face` is one of `cursor` (`>_` with a blinking block cursor, tile C1), `glance` (the same face shifted toward a target, C3), `eyes` (two blinking pixel eyes while hovered, C2), `dots` (bouncing thinking dots, C5), `sleepy` (`-_-`). Hover overrides every face except `dots` and `sleepy`.
- Per-section sequence, run by `perform` after the settle delay:

```
active change ─> hop to anchor (starts at once)
settle (600 ms) ─> wait for entrance + hop ─> [eager hops] ─> look ─> think ─> speak
                                                               │       │        │
                                                        glance face  dots   bubble grows,
                                                        + highlight  750ms  text types
```

| Rule | Behavior |
|------|----------|
| B1 Active section | The section crossing the middle band of the viewport is active. The section active on load counts without scrolling. |
| B2 Comment once | After the active section stays active for the settle delay and has not been commented on this page load, Jiro runs the per-section sequence (B14) and the bubble types its comment. Fast scrolling only comments on the section you stop at. |
| B3 No repeats | Returning to an already-commented section hides the bubble and does not replay it. |
| B4 Replay on click | Clicking the mascot shows the active section's comment again straight away (no look or think), with a small hop. |
| B19 Hover quips | When a mouse pointer enters the mascot on a wide screen while he is idle or asleep, he does a small dodge hop away from the page centre (560 ms on the inner hop span, so the button box stays put) and types the next line from `data-jiro-hovers`, cycling in order. It is skipped while a question's buttons are showing, during a section sequence, within 1.2 s of the previous quip, or when no lines are configured. Hover lines do not mark sections as seen. |
| B21 Click comments | On a wide screen, clicking anywhere on the page outside the buddy makes him comment on what was clicked: the nearest `data-jiro-click` element inside the clicked section (or anywhere, outside commented sections), else the section's own `data-jiro-click`, else its comment. Lines cycle per element and repeat on every click, unlike scroll comments. A clicked element other than the section itself gets `.jiro-look-target`; the glance points at the click. The click marks its section seen, and for 1.2 s afterwards section changes (e.g. a link jumping down the page) keep the click comment instead of replacing it. The click itself is never intercepted. Narrow screens ignore page clicks. |
| B5 Hide | The close button hides the buddy for the rest of the tab session, including reloads, and stops observing and the sleep timer. If focus was inside the buddy, it moves to the active section (or `main`), given a temporary `tabindex="-1"` that is removed on blur. |
| B6 Reduced motion | With `prefers-reduced-motion: reduce` there is no entrance, hover, hop, flight or thinking beat; moves are instant, the look highlight still applies, and comments appear in full at once. |
| B7 Placement | The aside is `position: absolute` at the page origin and placed with the CSS `translate` property in page coordinates, so he is part of the page and scrolls with it; nothing about him is fixed to the viewport. His centre sits on the active section's anchor (or the section's centre), with the horizontal centre clamped to the middle 66% of the band (17% off-limits each side). The speech bubble opens above him, centred on him and nudged sideways only to stay 8 px inside the viewport (the tail keeps pointing at him); if there is no room above, it opens below. |
| B8 Narrow screens (< 768 px) | Smaller mascot, same anchors and hops; comments never auto-show and page clicks are ignored, tapping the mascot shows the active comment. Resizing below 768 px lands any flight, re-places him on the active anchor, hides the bubble and cancels pending timers; resizing back above restarts the settle delay for the active section if it is still unseen. |
| B9 Screen readers | Only the comment text is written, once, into the polite status region; the typed `p.jiro-buddy__text` is hidden from assistive tech, while the Yes/Later buttons in the bubble stay reachable. The region is cleared first and written 100 ms later so replays re-announce. |
| B10 Blank comments | A section whose `data-jiro-comment` is empty after trimming can still become active (hiding any previous bubble) and still moves, hops and looks, but never shows a bubble or announces anything. |
| B11 Hops | Every change of active section hops him to the new anchor at once (the comment still waits for the settle delay). A hop is one 1.1 s flight in page coordinates: a short crouch, then a single continuous glide (progress on one sine ease, height on one sine arc lifted 70 px above the straight line, sampled into 20 linear keyframes so speed never dips mid-air), ending with a dust puff and squash. Because both ends are page-attached, scrolling during a hop cannot make him snap. A hop started mid-flight begins from wherever he visibly is. If the previous anchor has scrolled out of view, the hop starts from just outside the nearest viewport edge, so he glides in from the top or bottom instead of crossing the whole page. |
| B12 Idle hover | With motion allowed, the idle hover combines several out-of-phase motions (vertical bob, slight horizontal drift, small tilt, gentle squash and stretch) and a ground shadow that shrinks as he rises (tile A2). |
| B13 Entrance | He first appears on the active section's anchor with a 700 ms pop (scale up from 0.3 with an overshoot), then a dust puff and squash; he never enters from a page edge. Before that first placement the aside is hidden. The first comment waits for the entrance. |
| B14 Section sequence | Wait for the hop to land, then an eager double-hop for `data-jiro-mood="eager"` (A4), then look: the `data-jiro-look` element gets `.jiro-look-target` and the glance face points toward it for 700 ms (B5); the highlight is cleared about 1.8 s after he finishes speaking. Then think: `dots` face for 750 ms (C5). Then speak: the bubble grows out of the body with a squash (D4) and the text types. |
| B15 Questions | With `data-jiro-ask` and `data-jiro-action`, Yes (labelled with the ask text) and Later appear once typing finishes (E3). Yes closes the bubble, scrolls the action target to the viewport center (smooth unless reduced motion), and focuses it if it is a form control, button or link. Later just closes the bubble. |
| B17 Sleepy | After 20 s with no scroll, pointer, key, touch or wheel activity while idle, the bubble closes, the face goes `-_-`, z's drift up and the bob slows (A5). Any of those events wakes him with a hop. |
| B18 Zero layout shift | The bubble and close button are absolutely positioned and all placement is `translate` (never `left`/`top`), so nothing he does moves page content or registers a layout shift. The close button always sits at the mascot's top-left. |

### Things to Know

- Rule numbers (B1-B21 above) are this doc's numbering, not moodboard tile IDs; tiles are always written as "tile X#".
- The middle band is the observer's `rootMargin` of `-40%` top and bottom. When several sections intersect it, the one containing the viewport's vertical center wins.
- Every change of active section (and every narrow/wide switch) calls `hideBubble`, which bumps a `run` token and clears all pending timers. Every awaited step in `perform` checks the token, so scrolling away mid-sequence abandons it cleanly; the settle callback still re-checks that its section is active, unseen, and the screen is wide.
- Typing never resizes the bubble: the untyped remainder sits in `data-rest` and is rendered invisibly by `::after { content: attr(data-rest) }`, and the Yes/Later row is laid out but `visibility: hidden` until typing finishes. Typing advances by Unicode code points (`Array.from`). Switching to reduced motion mid-type shows the full comment at once.
- Window resize re-places him on the active anchor (unless a hop is running). Anchors are measured at hop time, so an anchor whose layout changes later is only picked up on the next hop or resize.
- The clamp is horizontal only; vertical position always follows the anchor. Speech bubbles can therefore cover page text for a few seconds; designing empty slots next to anchors is the clean fix.
- Animation layering: idle hover is CSS keyframes on the nested spans; hops, squashes, flights and the entrance pop use the Web Animations API, and sequence steps await their `finished` promises. Motion runs on inner spans or the aside, never the mascot button's own box, so it stays reliably clickable and Playwright's stable-box click succeeds.
- The mascot art is the official "V3 traced balloon pixel" asset from Maddy's 2026-10-19 lineup, inlined as SVG (viewBox `0 -1 62 56`): a cream body fill simplified to a stepped pixel path, the dark green traced outline path drawn at 1/8 scale, and salmon pixel-art faces with `crispEdges`. All faces are rendered once and toggled by `data-jiro-face` in CSS. The art is never mirrored.
- State lifetimes differ: "already commented" is in memory and resets on every page load, while "hidden" (`jiro-buddy-hidden`) is stored in `sessionStorage` and lasts for the tab session.
- Budget: the JS and CSS together are about 9.1 KB gzipped; `BuddyBudgetTest` fails if they reach 12 KB.
- Tests: `uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py` from the repo root. The browser tests copy the buddy CSS and JS into a temp directory with their own fixture pages (not [index.html](index.html)), serve them over local HTTP, and drive the system Chrome (`channel="chrome"`). `StitchedDesignTest` serves the prototype folder itself and checks that `stitched/index.html` loads its images, greets on the hero, that every look/anchor/action selector resolves, and that every commented section's anchor lies in the middle 66%. `ANCHOR_PAGE` covers placement (anchor, clamp to either side of the band, section-centre fallback, riding with the scroll, bubble above, glide and no-snap checks sampled per frame); `FLOW_PAGE` covers the sequence (question, eager look, heading anchors, form question); an init script records each state/face/text change per animation frame and sums layout shifts from a `PerformanceObserver`, and the sleepy test uses Playwright's fake clock. The browser tests are skipped without Playwright but fail hard if `jiro-buddy.js` or `jiro-buddy.css` is missing; `BuddyBudgetTest` is stdlib-only and always runs.

Created and maintained by Nori.
