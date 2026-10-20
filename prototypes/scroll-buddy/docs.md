# Noridoc: prototypes/scroll-buddy

Path: @/prototypes/scroll-buddy

### Overview

- A standalone prototype of the Jiro "scroll buddy": the mascot lives in a bottom corner of the viewport, hovers, and when a new section of the page settles into view he moves, looks at what he is about to talk about, thinks, and types one short comment (sometimes a question with Yes/Later buttons) in a speech bubble. Requested by Martin Stübler for the jiro.bot landing page.
- v3 (2026-10-20) is Martin's pick from the moodboard (tiles A2, A4, A5, B1-B5, C1-C3, C5, D4, E3, posted in Slack #growth-agent-work) combined into one scroll-driven flow: "playful like a computer game but high quality, easy on page load".
- The buddy itself is two dependency-free files, [jiro-buddy.css](jiro-buddy.css) and [jiro-buddy.js](jiro-buddy.js), meant to be copied onto the real site unchanged. [index.html](index.html) is a mockup of the jiro.bot landing page that exists only to exercise them, and [share/](share/index.html) is the team-facing explainer.

### How it fits into the larger codebase

- Not deployed: it lives outside `site/`, so [build.py](../../build.py), [tools/lint.py](../../tools/lint.py) and the deploy workflow never see it. See the root [docs.md](../../docs.md).
- Porting to the real site: copy the CSS and JS next to the page, link the stylesheet in `<head>`, load the script with `defer` before `</body>`, and annotate top-level sections with the `data-jiro-*` contract below. Sections without `data-jiro-comment` are ignored, and a page with none (or only blank ones) renders no buddy. Loading the script more than once still renders a single buddy.

| Section attribute | Effect |
|---|---|
| `data-jiro-comment="..."` | The line Jiro says. Required to be observed at all. |
| `data-jiro-side="left\|right"` | Pins the corner for this section instead of the automatic choice. |
| `data-jiro-mood="eager"` | Adds an eager double-hop before he looks and speaks. |
| `data-jiro-look="selector"` | Element he looks at; it gets the `.jiro-look-target` highlight. |
| `data-jiro-ask="Label"` + `data-jiro-action="selector"` | Turns the comment into a question with a Yes button (labelled `Label`) and Later. |
| `data-jiro-perch="selector"` | Heading he may sit on instead of his corner. |

- Selectors are resolved with `document.querySelector` at use time; an invalid or unmatched selector is treated as absent.
- Host-page integration: the buddy sits at `z-index: var(--jiro-buddy-z, 50)`; set `--jiro-buddy-z` on `:root` or `.jiro-buddy` if site chrome needs to stack differently. Its elements carry a light reset so host `button`/`p` globals do not leak in. `.jiro-look-target` is the one class the buddy puts on host elements (green outline plus a dark ring, pulsing when motion is allowed), so host styles can override it.
- Fonts: the bubble asks for Inter and the Yes/Later buttons for Geist Mono, each with system fallbacks. The buddy does not load fonts; the host page should already load them or the fallbacks show.
- The mockup [index.html](index.html) follows Maddy's 2026-10-19 Figma screenshot for the top of the page and the earlier 2026-10-14 review mock (`jiro-bot-review.png` in #jiro-bot-design) below it, with the `data-jiro-*` contract on each section. It pins sides so the tour reads well: hero and ditch left, video and pillars right, how left, bakeoff and faq right; pricing has no side and perches on its heading. [jiro-v3.svg](jiro-v3.svg) is the standalone mascot art used for the "CALL HIM IN" card and other in-page images.
- `moodboard/` is the live 5x5 board of animation variants the v3 picks came from (rows A-E: speed and hover feel, position and looking around, face and blinking, shape and form, text and helpfulness). `python3 moodboard/serve.py --port N` serves it; stars and notes are saved to an untracked `picks.json`.
- `share/` is a static explainer for the team: [share/index.html](share/index.html) walks the flow section by section with stills from `share/stills/`, a rules table, and `share/jiro-buddy-flow.mp4`, a 56 s 1440x900 recording of one top-to-bottom scroll with the 20 s idle segment sped up 9x. It links back to `../index.html` as the live demo.
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

- The aside exposes its state for CSS and tests. `data-jiro-state` is one of `idle`, `flying`, `eager`, `looking`, `thinking`, `speaking`, `sleepy`. `data-jiro-face` is one of `cursor` (`>_` with a blinking block cursor, tile C1), `glance` (the same face shifted toward a target, C3), `eyes` (two blinking pixel eyes while hovered, C2), `dots` (bouncing thinking dots, C5), `sleepy` (`-_-`). Hover overrides every face except `dots`.
- Per-section sequence, run by `perform` after the settle delay:

```
settle (600 ms) ─> wait for entrance ─> move ─> [eager hops] ─> look ─> think ─> speak
                                         │                        │       │        │
                     perch / side flight / leave perch     glance face  dots   bubble grows,
                                                           + highlight  750ms  text types
```

| Rule | Behavior |
|------|----------|
| B1 Active section | The section crossing the middle band of the viewport is active. The section active on load counts without scrolling. |
| B2 Comment once | After the active section stays active for the settle delay and has not been commented on this page load, Jiro runs the per-section sequence (B14) and the bubble types its comment. Fast scrolling only comments on the section you stop at. |
| B3 No repeats | Returning to an already-commented section hides the bubble and does not replay it. |
| B4 Replay on click | Clicking the mascot shows the active section's comment again straight away (no look or think), with a small hop. |
| B5 Hide | The close button hides the buddy for the rest of the tab session, including reloads, and stops observing and the sleep timer. If focus was inside the buddy, it moves to the active section (or `main`), given a temporary `tabindex="-1"` that is removed on blur. |
| B6 Reduced motion | With `prefers-reduced-motion: reduce` there is no entrance, hover, hop, flight or thinking beat; moves are instant, the look highlight still applies, and comments appear in full at once. |
| B7 Desktop placement | `position: fixed` in a bottom corner, starting bottom-left (left edge within 48 px). The bubble always opens toward the page center: right of the mascot on the left side, left of it on the right side or when perched on the right half. Outside a perch the mascot does not move with the page while scrolling. |
| B8 Narrow screens (< 768 px) | Smaller mascot docked bottom-left; no entrance, comments never auto-show, tapping the mascot shows the active comment. Resizing below 768 px lands any flight, leaves any perch, hides the bubble and cancels pending timers; resizing back above restarts the settle delay for the active section if it is still unseen. |
| B9 Screen readers | Only the comment text is written, once, into the polite status region; the typed `p.jiro-buddy__text` is hidden from assistive tech, while the Yes/Later buttons in the bubble stay reachable. The region is cleared first and written 100 ms later so replays re-announce. |
| B10 Blank comments | A section whose `data-jiro-comment` is empty after trimming can still become active (hiding any previous bubble) and still moves, hops and looks, but never shows a bubble or announces anything. |
| B11 Side changes | On wide screens, when a section settles, Jiro moves to whichever bottom corner overlaps less visible text, or to the pinned `data-jiro-side`. At most 3 side changes per page load; after that he stays put. A move is a short arc flight across the bottom of the viewport that ends with a dust puff and squash, and finishes before anything else in the sequence. Narrow screens never change side. |
| B12 Idle hover | With motion allowed, the idle hover combines several out-of-phase motions (vertical bob, slight horizontal drift, small tilt, gentle squash and stretch) and a ground shadow that shrinks as he rises (tile A2). |
| B13 Entrance | On wide screens with motion, he peeks half in from the left edge with a glance, ducks back, then hops in and lands with a dust puff (tiles B3, C3). The first comment waits for the entrance to finish. |
| B14 Section sequence | Move (perch, side flight, or leaving the perch), then an eager double-hop for `data-jiro-mood="eager"` (A4), then look: the `data-jiro-look` element gets `.jiro-look-target` and the glance face points toward it for 700 ms (B5); the highlight is cleared about 1.8 s after he finishes speaking. Then think: `dots` face for 750 ms (C5). Then speak: the bubble grows out of the body with a squash (D4) and the text types. |
| B15 Questions | With `data-jiro-ask` and `data-jiro-action`, Yes (labelled with the ask text) and Later appear once typing finishes (E3). Yes closes the bubble, scrolls the action target to the viewport center (smooth unless reduced motion), and focuses it if it is a form control, button or link. Later just closes the bubble. |
| B16 Perch | When a section names a `data-jiro-perch` heading that is fully on screen (top below 120 px), Jiro flies onto its top edge near its right end and then rides along with the page (B4). At most 1 perch per page load; perch flights do not count as side changes. When a section without that perch becomes active he leaves at once and returns to his corner; if the perch has scrolled offscreen he pops up from the bottom edge instead of flying. |
| B17 Sleepy | After 20 s with no scroll, pointer, key, touch or wheel activity while idle, the bubble closes, the face goes `-_-`, z's drift up and the bob slows (A5). Any of those events wakes him with a hop. |
| B18 Zero layout shift | The bubble and close button are absolutely positioned, so the aside's box is just the mascot and nothing he does moves page content. The close button always sits at the mascot's top-left. |

### Things to Know

- Rule numbers (B1-B18 above) are this doc's numbering, not moodboard tile IDs; tiles are always written as "tile X#".
- The middle band is the observer's `rootMargin` of `-40%` top and bottom. When several sections intersect it, the one containing the viewport's vertical center wins.
- Every change of active section (and every narrow/wide switch) calls `hideBubble`, which bumps a `run` token and clears all pending timers. Every awaited step in `perform` checks the token, so scrolling away mid-sequence abandons it cleanly; the settle callback still re-checks that its section is active, unseen, and the screen is wide.
- Typing never resizes the bubble: the untyped remainder sits in `data-rest` and is rendered invisibly by `::after { content: attr(data-rest) }`, and the Yes/Later row is laid out but `visibility: hidden` until typing finishes. Typing advances by Unicode code points (`Array.from`). Switching to reduced motion mid-type shows the full comment at once.
- Perching works by computing the landing spot in page coordinates, flying there in fixed mode with a forwards-filled animation, then switching to `.jiro-buddy--perched` (`position: absolute` with page-relative `left`/`right`/`bottom`) and cancelling the animation, so the swap is invisible and causes no shift. Window resize re-places him on the perch. The offscreen exit hides the aside for one frame (`display: none`) while it is moved back to the corner, then animates it up from below.
- Side choice measures all visible page text (not only the active section) inside a 420x160 px footprint at each bottom corner, clipping text to any overflow-clipping ancestor, and switches only when the other corner holds less than 70% as much. Right side and perch-on-right-half are plain CSS (`.jiro-buddy--right` / `.jiro-buddy--flip`: row-reverse, bubble and tail mirrored).
- Animation layering: idle hover is CSS keyframes on the nested spans; hops, squashes, flights, the entrance and the perch pop-up use the Web Animations API, and sequence steps await their `finished` promises. Motion runs on inner spans or the aside, never the mascot button's own box, so it stays reliably clickable and Playwright's stable-box click succeeds.
- The mascot art is the official "V3 traced balloon pixel" asset from Maddy's 2026-10-19 lineup, inlined as SVG (viewBox `0 -1 62 56`): a cream body fill simplified to a stepped pixel path, the dark green traced outline path drawn at 1/8 scale, and salmon pixel-art faces with `crispEdges`. All faces are rendered once and toggled by `data-jiro-face` in CSS. On the right side or a right-half perch only the body shell is mirrored, so the face still reads `>_`.
- State lifetimes differ: "already commented" and the side-change and perch counts are in memory and reset on every page load, while "hidden" is stored in `sessionStorage` (`jiro-buddy-hidden`) and lasts for the tab session.
- Budget: the JS and CSS together are about 9.6 KB gzipped; `BuddyBudgetTest` fails if they reach 12 KB.
- Tests: `uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py` from the repo root. The browser tests copy the buddy CSS and JS into a temp directory with their own fixture pages (not [index.html](index.html)), serve them over local HTTP, and drive the system Chrome (`channel="chrome"`). `FLOW_PAGE` covers the v3 sequence (question, eager look, perch, second perch, form question); an init script records each state/face/text change per animation frame and sums layout shifts from a `PerformanceObserver`, and the sleepy test uses Playwright's fake clock. The browser tests are skipped without Playwright but fail hard if `jiro-buddy.js` or `jiro-buddy.css` is missing; `BuddyBudgetTest` is stdlib-only and always runs.

Created and maintained by Nori.
