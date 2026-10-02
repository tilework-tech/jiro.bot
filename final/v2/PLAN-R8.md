# Jiro.bot v2 round 8 Implementation Plan

**Goal:** Martin's request of 2026-10-02, on top of PR #14: (1) the belt must not shake up and down while the page scrolls; (2) scrolling should feel like Demo1's; (3) every scene's text replaced with his minimal copy, and everything else removed.

**Architecture:**
- Belt lock: the root cause of the shake is that `#belt` was a `position: fixed` full-viewport canvas redrawn each animation frame from `scrollY`. Native and compositor scrolling move the page before the next frame, so the belt trailed the art by a frame. The canvas moves into `#stage` as `position: absolute`, a screen and a half tall, with its top at a whole-CSS-px page y (`anchor`); all drawing uses page y minus `anchor`, and the canvas is re-anchored when the view nears either edge. The browser then moves belt and art together. Its height is set in px from `innerHeight`, which also fixes the old `100vh` vs `innerHeight` stretch on phones.
- Scrolling: `belt/snap.ts` and the timed ease-in-out glides in `main.ts` are removed. A new pure `belt/scroller.ts` (`createScroller({spans, vh, reduced})`) ports Demo1's mechanics: input moves a target, 1:1 inside a scene taller than the screen and with resistance `0.55 + min(f, 1 − f)` through a band (650 px wheel or 420 px drag per ride); after 160 ms of quiet or a finger lift, a push past 7% of the band commits to the next scene, otherwise it springs back; at most one scene per gesture; after a commit, momentum is ignored for 450 ms, +140 ms per event, capped at 1400 ms; the shown position eases exponentially (6/s during input, 2.6/s settling); reduced motion lands at once. The document still scrolls natively as the output: `main.ts` writes `scroller.tick()` to `scrollTo` each frame and treats any other scroll (links, focus, find-in-page, scripts) as `moved()`, settled by the same 7% rule. Wheel and touch listeners are non-passive. Keys: arrows ±100 px of wheel, PageUp/PageDown/Space one scene, Home/End. The belt runs 1.5× while riding.
- Copy: Martin's lines per scene in `index.html`; FAQ unchanged (live, verbatim); price tags from `PLANS` in `content.ts`. Removed: the product demo panel (`initDemo`, `demo-pr` egg), the compare replays (`initCompare`), the comparison table (`initTable`), the FAQ heading and hint, Enterprise, price bullets, Japanese labels, the Start-free CTA and fine print, the pond CTAs and still-page link, the cabinet and stall labels (aria-labels kept), and the header egg tracker. The still page reads its copy from `index.html` and `content.ts`.

## Testing Plan
- Unit (`tests/unit/scroller.test.ts`): spring-back on a small push; one ride per gesture however hard; momentum ignored after a ride; reversal before commit springs back; ends stay put; free scrolling inside a tall scene; drag rides only after release; keys step one scene; foreign jumps never rest in a band and follow the 7% rule; `riding()` during a ride; reduced motion lands at once.
- E2E (`tests/e2e/scroll.spec.ts`): a `scrollBy` moves the belt's rect exactly with a scene canvas within one task; belt pixels sit under reported plates down to the pond; a wheel flick rides to the next scene; a nudge springs back; momentum does not carry past the next scene; keyboard steps; free scrolling at 1440 × 700; phone swipe rides and a tiny one springs back (Chromium).
- E2E (`tests/e2e/copy.spec.ts`): each scene shows exactly its new copy; "Reserve a seat" top right on every scene; header has only the logo and the CTA; the FAQ answer is hidden until a question is clicked; the title.
- Removed with their features: `snap.test.ts`, `product.spec.ts`, the replay, table-board and tracker tests. `helpers.settled` waits on `__jiro.scroll().resting`; `tracker()` reads `__jiro.eggs()`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Open questions and decisions

Martin replied "go ahead" without answering the open questions, so the plan's defaults were used:

| Question | Default used |
| --- | --- |
| Keep the product demo panel, compare replays, comparison table? | Removed |
| Where does "Reserve a seat" go? | `https://noriagentic.com/` (no trial signup URL known yet) |
| Prices as "$99" or "$99/mo"? | With `/mo` |
| Keep an Enterprise tag? | Dropped |
| Apply light copy edits? | Yes: "subscription" lowercase; "Jiro works, opinionated, inside … Slack, and web" |
| Keep the egg tracker in the header? | Removed; eggs still count and show a "Found:" toast |

## Status: implemented

Built as planned (`site/src/belt/scroller.ts`, `site/src/beltView.ts`, `site/src/main.ts`, `site/index.html`, `site/src/content.ts`, `site/tools/build-still.mjs`; see `site/docs.md`). Notes:

- A carried plate keeps its touch: `beltView.ts` calls `preventDefault` on `touchmove` while dragging, and the scroller ignores a `touchmove` that is already `defaultPrevented`. Nested scrollables and ctrl-zoom also keep native behaviour.
- `window.__jiro` gained `scroll()` and `eggs()` for the tests.
- WebKit e2e could not run in this session (missing system libraries, no sudo). Safari and a real iOS device still need checking.
