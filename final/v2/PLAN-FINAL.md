# Jiro.bot v2 final build Implementation Plan

**Status: implemented** (2026-10-02, at the final review; see `README.md` and `site/docs.md`). All seven stops and six bands are built and mounted. Deviations from this plan:

- **Band heights.** The art set them, not the plan: band 3 is 110 (planned 80), band 4 108 (planned 80), band 5 125 (planned 100). `BANDS` is now 153, 86, 100, 110, 108, 125.
- **Belt route.** As decided, but concretely: one straight run down the right shaft at x = 320 from stop 3 all the way to the pond, hidden behind the garden wall, bridge and stall, then a single hidden 90° turn onto the trestle (`POND_TRESTLE` = 93.75/202 of the pond) and left to x = −60, hidden again past the trestle's far end. The earlier placeholder route (right, then left across the FAQ floor, down the left edge past the street, then right across the pond) is gone. The FAQ and street masters and band 4 were shifted sideways (`tools/shift-x.py`, with a Gemini outpaint of the opened strip for the two stops) so their painted shaft lines up with x = 320.
- **FAQ copy.** The live FAQ verbatim, six questions including "What repositories can I use?", replacing the five shortened questions carried over from PR #13.
- **Pricing.** The heading is the live "Pay per agent, no hidden fees." under our own kicker, "Delivery · all night". Only each tag's CTA is a link, and Enterprise's goes to a `mailto:` instead of the pricing page.
- **Koi aiming fix.** The first version leapt at a random x and, especially on phones, often came down on bare belt. Each leap is now aimed so its descent (t ≈ 0.79, 34.8 units left of the arc's centre) lands on the fullest run of visible food, the bite was widened (every item within 34 units while the koi falls back within 30 units of the belt line), and after code review the arc was lowered (80 units) and narrowed (120) and its centre clamped so the whole leap stays over the painted water; the koi is drawn at 80% so it crosses the pond copy only briefly.
- **Eggs.** The tracker total is 87 (≥ 54 required).
- **Memory test side effect.** Scene canvases far off screen are now 1 × 1, so the existing density tests in `tests/e2e/compare.spec.ts` only check canvases within a screen of the viewport.

**Goal:** Finish the whole scroll in one pass (Martin, 2026-10-01: "build the entire scroll animation until the very end in one go… come back with one final review link"): band 3, stop 5 FAQ counter, band 4, stop 6 night-street pricing, band 5 garden wall, stop 7 koi pond with the koi ending and Daily Roll, plus the brief's remaining delivery items (no-JS still page, ≥ 54 eggs, reduced motion, memory on long pages).

**Architecture:** Same art pipeline and grains as stops 3–4 (4K Gemini illustration → `fit.py`, rooms grain 4, characters/props grain 8). Copy is HTML. Daily Roll reuses the stop-4 cabinet embed (`games/cabinet/?game=daily`). The koi is a grain-8 sprite strip animated on the belt canvas along a parabola; it removes the items (not the plates) on the slots it passes over. Scene canvases far off-screen are released and repainted when they come back.

**Tech Stack:** unchanged.

## Decisions taken without a stop (all from earlier notes)

- **Belt:** after stop 4 it stays in the right-hand shaft straight down through band 3, FAQ, band 4, street and band 5 ("have the belt go straight down and don't interface with the bike at all… then go straight down to the pond", 2026-09-29), then one 90° turn onto the pond trestle, leaving the frame at the left. No bend touches a copy field.
- **Koi:** auto-leaps a few seconds after the pond is in view, then every ~25 s, and when a plate is dropped in the water; eats every item in its arc ("eat a whole lot of the belt"); plates continue empty. Off under reduced motion.
- **FAQ:** the live noriagentic.com FAQ, verbatim (fetched 2026-10-02 00:49 UTC), six questions: five sushi and a teacup on plates along the counter carry the question bubbles; Jiro answers beside them, jaw-only.
- **Pricing:** live plans verbatim, heading "Pay per agent, no hidden fees.", the live fine print; hanging paper tags in the dark alley copy field; Jiro on a bicycle at a light, one foot down.
- **Pond:** no Jiro. Daily Roll at a small yatai stall on the bank.
- **Bands:** band 3 storage cutaway with a dust-spirit bunk room (80); band 4 street drain/sewer cross-section (50 → 80); band 5 garden wall with tile coping and a moon gate the belt passes through (70 → 100).

## Testing Plan

**Page (Playwright, all four projects):**
- Stops appear in order hero → product → compare → table → faq → price → pond.
- FAQ: six question buttons; clicking one shows its verbatim live answer in Jiro's bubble and counts an egg.
- Price: four plans with live names and prices, heading and fine print, readable without interaction.
- Pond: the belt reaches the pond; with the pond in view the koi leaps and plates in its arc lose their items; dropping a plate in the water feeds the koi; reduced motion: no koi.
- Daily Roll plays inside the stall (iframe in the stop, palette-only pixels, pauses off-screen).
- The full journey: at least 54 eggs registered, all reachable; no console errors scrolling top to bottom.
- `/still/` with JavaScript disabled shows all seven stops with their copy.
- Memory: after scrolling to the pond, the hero canvas is released (backing ≤ 1 px²) and is repainted when scrolled back.

**Art (Vitest):** existing palette/resolution/loop/motion tests cover the new exports; koi strip exists at grain 8.

NOTE: I will write *all* tests before I add any implementation behavior.

## Tasks
1. Tests (RED). 2. Art for six scenes + koi. 3. Page: sections, content, FAQ/answer, pricing, pond CTA, Daily Roll, koi, route, layout, canvas release, `/still/`. 4. Docs, capture, PR, final URL.

**Testing Details** Behaviour is checked where the visitor sees it: text on screen, buttons, iframe position and pixels, belt plate state, canvas sizes, a JS-off page.

**Implementation Details**
- Koi: `koi.ts` (pure: trajectory, which slots it passes) + renderer hook in `beltView`; slot items hidden via a new `eaten` override.
- Release: a scene more than 1.5 viewports away sets its canvas to 1 × 1; on return it reallocates and forces a full redraw.
- `/still/`: static `public/still/index.html` with each stop's base PNG and the same copy.

**Question** none blocking; the open items go in the final reply.

---
