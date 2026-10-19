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
- `moodboard/` is a live 5x5 board of animation variants (rows: speed and hover feel, position and looking around, face and blinking, shape and form, text and helpfulness) for picking the direction. `python3 moodboard/serve.py --port N` serves it; stars and notes are saved to an untracked `picks.json`.
- Tests live in the repo-level [tests/test_scroll_buddy.py](../../tests/test_scroll_buddy.py), alongside the stdlib-only build and lint tests, but need Playwright (see Things to Know).

### Core Implementation

- On load the script finds the commented sections, renders the buddy into an `<aside aria-label="Jiro">`, and observes the sections with an `IntersectionObserver`.

```
aside.jiro-buddy
 ├─ button.jiro-buddy__mascot   "Jiro: replay comment"   (figure > bob > drift > tilt > squash > hop > SVG art, plus ground shadow)
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
| B7 Desktop placement | `position: fixed` in the lower half of the viewport, starting bottom-left (left edge within 48 px). The bubble always opens toward the page center: right of the mascot on the left side, left of it on the right side. The mascot does not drift with the page while scrolling. |
| B11 Side changes | On wide screens, when a section settles, Jiro moves to whichever bottom corner (left or right) overlaps less visible text, or to the side named by an optional `data-jiro-side="left|right"` on the section. He makes at most 3 side changes per page load; after that he stays put. The move is a short flight (an arc across the bottom of the viewport) and finishes before the comment starts typing. With reduced motion he changes side instantly with no animation. Narrow screens never change side. |
| B12 Idle hover | With motion allowed, the idle hover combines several out-of-phase motions (vertical bob, slight horizontal drift, small tilt, gentle squash and stretch) and a ground shadow that shrinks as he rises, so it does not read as one mechanical loop. |
| B8 Narrow screens (< 768 px) | Smaller mascot docked bottom-left; comments never auto-show, tapping the mascot shows the active comment. Resizing below 768 px hides the bubble and cancels pending timers; resizing back above restarts the settle delay for the active section if it is still unseen. |
| B10 Blank comments | A section whose `data-jiro-comment` is empty after trimming can still become active (hiding any previous bubble) but never shows a bubble or announces anything. |
| B9 Screen readers | The full comment is written once into the polite status region; the visibly typed bubble is hidden from assistive tech. The region is cleared first and written 100 ms later so replays re-announce. |

### Things to Know

- The middle band is the observer's `rootMargin` of `-40%` top and bottom, so only the section crossing roughly 40%-60% of viewport height counts as visible.
- The settle delay is 600 ms. Every change of active section (and every narrow/wide switch) clears the pending settle, typing and announce timers via `hideBubble` before scheduling a new settle; the settle callback still re-checks that its section is active, unseen, and the screen is wide. When several sections intersect the band, the one containing the viewport's vertical center wins.
- State lifetimes differ: "already commented" is held in memory and resets on every page load, while "hidden" is stored in `sessionStorage` and lasts for the tab session.
- Typing advances by Unicode code points (`Array.from`), so emoji and astral characters are never split. Switching to reduced motion mid-type shows the full comment at once.
- The close button is a 24x24 px hit target at 0.7 opacity, 1 on hover or keyboard focus.
- Side choice measures all visible page text (not only the active section, which is often shorter than the viewport) inside a 420x160 px footprint at each bottom corner, and switches only when the other corner holds clearly less. The right side is plain CSS (`right: 24px`, bubble opening left); the flight animates between the two spots with the Web Animations API, and typing waits for its `finished` promise. The mockup's `#video` section carries `data-jiro-side="left"` because neither corner has text there.
- Bob and hop animations run on inner spans inside the mascot button, not on the button itself, so the button's box stays still. That keeps it reliably clickable and lets Playwright's click (which waits for a stable box) succeed.
- The mascot is an inline SVG redrawn from the Jiro reference Martin Stübler shared on 2026-10-19: a round cream (`#f8f6f0`) speech bubble with a thick, round-capped dark green (`#173d2b`) outline that leaves a gap at the top right, a tail at the bottom left, a pixel-stepped salmon `#f2694f` `>_` glyph with a block cursor, and a flat ground shadow. The outline is smooth (not pixelated); only the glyph is pixel art. When Jiro sits on the right side, only the bubble shell is mirrored (tail toward the outer edge, matching the left-side pose) while the glyph still reads `>_`.
- Tests: `uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py` from the repo root. They copy the buddy CSS and JS into a temp directory with their own fixture page (not [index.html](index.html)), serve it over local HTTP, and drive the system Chrome (`channel="chrome"`). They are skipped when Playwright is not installed so the stdlib-only suite still runs, but fail hard if `jiro-buddy.js` or `jiro-buddy.css` is missing.

Created and maintained by Nori.
