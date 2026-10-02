# Jiro.bot v2 round 7 Implementation Plan

**Goal:** Martin's notes of 2026-10-02: (1) clicking plates makes them explode or do other funny things; a plate dragged to another part of the belt stays there and rides on; a plate put on any flat surface in any scene rests there; (2) no light or animation may look like "a square appearing over it"; (3) bring back the small living details of the reference videos: fireflies (occasionally swarming), pond ripples, rain and puddle splashes, steam, people moving more.

**Architecture:**
- Plates: a pure `belt/effects.ts` maps each plate's seeded effect to a named reaction, about 40% of them explosions (the item bursts into its own colours and re-forms). Empty plates spin. `resolveDrop` gains a `belt` outcome: a drop on the belt line puts the plate on the nearest bare slot there (`moved` override), so it rides on from where it was put. Every stop and band gets generous floor/counter/table/shelf surfaces.
- Ambient effects: a new `fx.ts` draws procedural effects on a scene's canvas from `scene.json` `fx` entries (world units): `glow` (a soft radial halo breathing ±2–5% over 2–4 s, additive, no box), `fireflies` (drifting, twinkling; every ~20 s they gather into an orbiting swarm and drift apart), `ripples` (thin elliptical rings that grow and fade), `rain` (slanted streaks), `splash` (puddle crowns and rings), `steam` (soft rising wisps), `fish` (slow under-water shadows). All 2-frame light swaps (lanterns, toro, lamp, coin, candle, fireflies) are removed and replaced by `glow`/`fireflies`.
- People: sprites can carry an `idle` motion that plays by itself every few seconds using the round-6 cut-out machinery: diners nod and lean, Jiro breathes, Jiro on the bike sways.

## Testing Plan
- Unit: effect table gives ≥35% explosions and every effect is visible; `resolveDrop` returns `belt` on the belt line; fireflies: count stays constant, a swarm gathers them within a small radius and releases them; ripples grow and fade to nothing.
- E2E: clicking a food plate twice in a row always animates; a plate dragged along the belt rides on from the new spot; a plate dropped on the street (stop 6) and on the pond bank rests there after scrolling away and back; no scene has a frame-swapped light sprite and every stop has glows; the pond's water changes over time where no sprite is (ripples/fish); fireflies swarm within 40 s at the pond; hero diners move by themselves (their region changes beyond their frame loop).

NOTE: I will write *all* tests before I add any implementation behavior.

**Question** No firefly swarm appears in the logged frames of the nine videos; Martin remembers one, so it is built as an occasional event (every ~20–30 s).

## Status: implemented

Built as planned (`site/src/belt/effects.ts`, `site/src/fx.ts`, `site/src/fxModel.ts`, `idle` in `site/src/scene.ts`; see `site/docs.md`). Deviations:

- **Plates.** `plateEffect` explodes for effect indices with `i % 5` of 0 or 2 (40%, 1.4 s, 70 particles plus sparkles, the item growing back) and otherwise cycles through twelve gags so each one occurs. A plate's shown state now comes from one function, `slotPlate`, over a new `moved` override. Beyond the plan: dropping on an empty plate swaps that plate to the dragged plate's old slot; a picked-up plate let go nowhere is restored exactly (a moved plate stays moved); the koi eats food on moved plates, which keep their place; empty plates can be clicked (they spin) but not dragged.
- **Surfaces** were widened in the hero, compare, table, street, pond and FAQ specs only; the bands kept the surfaces they already had.
- **Effects.** A `drip` kind was added for band 3's faucet. Besides the light sprites, the firefly, tea, cup and faucet sprites were removed too (replaced by fireflies and steam/drip). The compare stop has steam but no glow, so the e2e check is at least 12 glows across scenes rather than glows in every stop (14 are declared). Effects scenes cache layers and sprites in a composite canvas and draw effects over a copy at ~30 fps with real elapsed time; under reduced motion they are drawn once, still.
- **People.** Idle moves need a motion cut-out, so `tools/motion.py` ran for the hero diners and the hero, FAQ and street Jiros (7 Gemini calls); `tools/export-scene.py` now exports `idle` and a motion block with no `kind` for idle-only sprites, and falls back to an 8 s scene loop when a scene has no ambient sprites (the pond). A click reaction (Jiro's jaw) cancels an idle move.
- **Tests.** The swarm e2e waits up to 45 s, not 40. A `__jiro.fx(sceneId)` hook reports swarming and effect kinds.
- **Question answered by the build:** no firefly swarm appears in the logged video frames, so it is an occasional event (pond about every 22 s, band 5 about every 30 s). The references show lanterns steady or breathing ±2–5%, which the glows follow (±5%).
