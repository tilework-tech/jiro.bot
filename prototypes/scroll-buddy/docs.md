# Noridoc: prototypes/scroll-buddy

Path: @/prototypes/scroll-buddy

### Overview

- A standalone prototype of the Jiro "scroll buddy": the `>_` mascot stays fixed on the lower left of the viewport, gently bobs, and when a new section of the page settles into view, a speech bubble types a short comment about it. Requested by Martin Stübler for the jiro.bot landing page.
- [index.html](index.html) is our own mockup of the jiro.bot landing page (structure taken from the 2026-10-14 review mock `jiro-bot-review.png` in #jiro-bot-design). It only exists to exercise the animation.
- The buddy itself is two dependency-free files, [jiro-buddy.css](jiro-buddy.css) and [jiro-buddy.js](jiro-buddy.js), meant to be copied onto the real site unchanged.

### How it fits into the larger codebase

- Not deployed: it lives outside `site/`, so [build.py](../../build.py), [tools/lint.py](../../tools/lint.py) and the deploy workflow never see it. See the root [docs.md](../../docs.md).
- Porting to the real site: copy the CSS and JS next to the page, link the stylesheet in `<head>`, load the script with `defer` before `</body>`, and put `data-jiro-comment="..."` on each top-level section Jiro should comment on. Sections without the attribute are ignored, and a page with none (or only blank ones) renders no buddy. Loading the script more than once still renders a single buddy.
- Host-page integration: the buddy sits at `z-index: var(--jiro-buddy-z, 50)`; set `--jiro-buddy-z` on `:root` or `.jiro-buddy` if site chrome (nav, modals) needs to stack differently. Its elements carry a light reset (margin, padding, radius, shadow, appearance, font, letter-spacing, text-transform, alignment, min sizes) so host `button`/`p` globals do not leak in.
- Fonts: the bubble uses Inter and the mascot glyph uses IBM Plex Mono, each with system fallbacks. The buddy does not load fonts; the host page should already load them or the fallbacks show.
- Tests live in the repo-level [tests/test_scroll_buddy.py](../../tests/test_scroll_buddy.py), alongside the stdlib-only build and lint tests, but need Playwright (see Things to Know).

### Core Implementation

- On load the script finds the commented sections, renders the buddy into an `<aside aria-label="Jiro">`, and observes the sections with an `IntersectionObserver`.

```
aside.jiro-buddy
 ├─ button.jiro-buddy__mascot   "Jiro: replay comment"   (bob > hop > body spans)
 ├─ div.jiro-buddy__bubble      aria-hidden, typed text
 ├─ p.jiro-buddy__sr            role="status", aria-live="polite", full text
 └─ button.jiro-buddy__close    "Hide Jiro"
```

| Rule | Behavior |
|------|----------|
| B1 Active section | The section crossing the middle band of the viewport is active. The section active on load counts without scrolling. |
| B2 Comment once | After the active section stays active for the settle delay and has not been commented on this page load, the bubble appears and types its comment. Fast scrolling only comments on the section you stop at. |
| B3 No repeats | Returning to an already-commented section hides the bubble and does not replay it. |
| B4 Replay on click | Clicking the mascot shows the active section's comment again. |
| B5 Hide | The close button hides the buddy for the rest of the tab session, including reloads. If focus was inside the buddy, it moves to the active section (or `main`), given a temporary `tabindex="-1"` that is removed on blur. |
| B6 Reduced motion | With `prefers-reduced-motion: reduce` the mascot does not bob or hop and comments appear in full at once. |
| B7 Desktop placement | `position: fixed`, left edge within 48 px of the viewport, lower half, bubble opening to the right; does not move while scrolling. |
| B8 Narrow screens (< 768 px) | Smaller mascot docked bottom-left; comments never auto-show, tapping the mascot shows the active comment. Resizing below 768 px hides the bubble and cancels pending timers; resizing back above restarts the settle delay for the active section if it is still unseen. |
| B10 Blank comments | A section whose `data-jiro-comment` is empty after trimming can still become active (hiding any previous bubble) but never shows a bubble or announces anything. |
| B9 Screen readers | The full comment is written once into the polite status region; the visibly typed bubble is hidden from assistive tech. The region is cleared first and written 100 ms later so replays re-announce. |

### Things to Know

- The middle band is the observer's `rootMargin` of `-40%` top and bottom, so only the section crossing roughly 40%-60% of viewport height counts as visible.
- The settle delay is 600 ms. Every change of active section (and every narrow/wide switch) clears the pending settle, typing and announce timers via `hideBubble` before scheduling a new settle; the settle callback still re-checks that its section is active, unseen, and the screen is wide. When several sections intersect the band, the one containing the viewport's vertical center wins.
- State lifetimes differ: "already commented" is held in memory and resets on every page load, while "hidden" is stored in `sessionStorage` and lasts for the tab session.
- Typing advances by Unicode code points (`Array.from`), so emoji and astral characters are never split. Switching to reduced motion mid-type shows the full comment at once.
- The close button is a 24x24 px hit target at 0.7 opacity, 1 on hover or keyboard focus.
- Bob and hop animations run on inner spans inside the mascot button, not on the button itself, so the button's box stays still. That keeps it reliably clickable and lets Playwright's click (which waits for a stable box) succeed.
- The mascot is the smooth CSS version from the hero video (`video/hero-loop-v3/template13.html` on `origin/video/hero-loop-v1`): white box, `#141414` border, salmon `#f2694f` `>_` glyph and square cursor, tail at bottom right. It is not pixel art, per the team's feedback that the border should not look pixelated. Brand colors: Jiro green `#3cf06e`, salmon `#f2694f`, ink `#141414`.
- Tests: `uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py` from the repo root. They copy the buddy CSS and JS into a temp directory with their own fixture page (not [index.html](index.html)), serve it over local HTTP, and drive the system Chrome (`channel="chrome"`). They are skipped when Playwright is not installed so the stdlib-only suite still runs, but fail hard if `jiro-buddy.js` or `jiro-buddy.css` is missing.

Created and maintained by Nori.
