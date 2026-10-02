# Jiro.bot v2 round 6 Implementation Plan

**Goal:** Martin's review of the full build (Slack, 2026-10-02): (1) belt 50% faster, food always upright, ~40% more food; (2) magnetic scrolling that always glides to a real scene, with the belt running 50% faster during the glide; (3) click reactions that move the drawn object instead of swapping in a mismatched second picture; (4) the comparison board styled like video 07, without its bottom line; (5) price tags styled like video 03.

**Architecture:**
- Belt: rest speed 4 → 6 units/s; items never rotate; item share of plates ~50% → ~70%.
- Scroll: a pure `snap.ts` decides where the page may rest: each stop's top, or anywhere inside a stop taller than the screen. A wheel gesture glides (ease-in-out, ~0.9 s) to the next/previous resting place after a 0.25 s belt lead; any other scroll (touch, keys, scrollbar) that ends between resting places glides to the nearest one in its direction. During a glide the belt runs at 1.5× rest; it settles back when the glide lands. Replaces the 6× surge.
- Reactions: each clickable creature/prop gets a Gemini green-key silhouette (its frame 0 cut out cleanly) and a Gemini "remove the object" patch of the background behind it. A click hides the object with the patch (only within the dilated silhouette) and moves the cut-out with a transform (hop with squash and stretch, wobble, swing from the top, wiggle). Ambient loops and Jiro's jaw/blink stay as they are; state changes (traffic light, candle) keep their frames.
- Board and tags: HTML/CSS only, live noriagentic.com copy unchanged.

## Decisions
- "Remove the bottom line": the video's board ends in a legend and "Competitor cells are draft copy…" line; it is dropped. The video's yes/partly/no dot rows were unverified draft claims, so the board keeps the live table text in the video's styling (dark slate on a rail with copper clips, orange eyebrow, wide pixel title, Nori column outlined in green, dashed row rules).
- Tags: video 03's paper tags on strings with pins, pixel title, JP subtitle, pixel price, bulleted features (the live feature text split at commas), the highlighted card orange and hanging lower, one CTA button under them, fine print below. Four live plans, not the video's three placeholder plans.

## Testing Plan
- Unit: snap targets (next/previous stop for a wheel; nearest resting place in the scroll direction after a free scroll; free scrolling inside a tall stop); journey speed is 1.5× rest during a glide and rest after it.
- Unit: stream gives items on ~70% of plates; e2e: no item is ever drawn rotated (`platesInView` reports angle 0) on any run.
- E2E: wheel from the hero lands exactly on the product stop; a free scroll left in a band glides to a stop; belt speed ~1.5× while gliding, rest after.
- E2E: clicking a creature moves its drawn pixels (the region around it changes while it plays) and the scene looks the same as before once it ends; the reaction draws no old copy of the object (the object's original spot shows the background patch mid-motion).
- E2E: the board has no footer line and its Nori column is outlined; the price tags show bullets, pins, and one CTA.

NOTE: I will write *all* tests before I add any implementation behavior.

**Question** none blocking.

## Status: implemented with deviations

All five items are built; Vitest passes 49/49 (new `snap.test.ts`, rewritten `motion.test.ts`, stream fill now 62–78% of plates). Docs: `site/docs.md`, `art/README.md` (`tools/motion.py`), `DESIGN-BRIEF.md` §1, §5–§7, §9.

Deviations from the plan above:
- **Scroll.** Glide length is 650–1100 ms by distance rather than a fixed ~0.9 s. Wheel gestures need 4 px of accumulated delta before acting (trackpads open with 1–2 px nudges); a new gesture starts after 250 ms of wheel silence, and the rest of a gesture, its inertia and the 200 ms after landing are swallowed. Free scrolls glide only after 160 ms of quiet with no finger down and no scrollbar drag. A small overshoot (<20% of a screen) past a tall stop's end settles back onto it instead of gliding forward. A resize cancels any glide and re-snaps. Reduced motion jumps (1 ms glide, no lead).
- **Reactions.** The planned "wiggle" kind became `stretch` (the sleeping cats); kinds are hop, stretch, wobble and swing. Gemini's background edit is used only when it aligns, the subject is really gone (≥60% of silhouette pixels changed) and the mismatch is ≤0.8; otherwise `tools/motion.py` grows the surrounding room over the silhouette (dilated by 2 units) with a scripted fill. The patch is drawn under all other sprites rather than clipped per object. 23 sprites move; stop 4's half-hidden spirit could not be cut out cleanly and lost its click reaction (its egg keeps its line). Reduced motion disables the moves.
- **Board.** No source line at all: the attribution moved into the table's `aria-label` and the still page.
- **Tags.** Each whole tag is the link (no per-tag CTA); one "Start free" CTA under them. Four in a row on desktop, two columns between 761–1150 px and on phones. The wider tags covered the street's shop-lantern egg (removed) and part of the traffic-light egg (click area shortened); `.price-wrap` lets clicks through except on tags and CTA.
- **Gemini.** 47 calls, all `gemini-3-pro-image` at 1K/2K for silhouettes and background edits (about $6.30); see `README.md`.
