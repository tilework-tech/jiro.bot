# Jiro motion spec

Generated from `motion-spec.json` (version 1.0.0) by `jm tables`. Do not edit by hand: change the JSON, then run `scripts/jm tables --write spec/MOTION-SPEC.md`.

Source: `tilework-tech/jiro.bot` branch `feat/jiro-scroll-buddy` at `6af9118` (v6, approved by Martin Stübler on 2026-10-27).

Units: lengths are px at the reference mascot box (92×90) and scale with the render (`s = mascot height / 90`; default mascot height is 10% of the frame height). Times in ms. Angles in degrees.

## From scroll passes to scenes

| v6 (website) | jiro-motion (video) |
|---|---|
| A pass: one scroll direction; reversing 60px starts a new one | A scene: the footage between two cuts (given or auto-detected) |
| Limits per pass | The same limits per scene, plus per-minute caps from the video type |
| Follow to the next section after 1.2 s of stillness | Relocate after a cut, after the type's settle time (every cut, or only when needed) |
| Edge peek when his old spot scrolled off-screen | Edge peek on his first arrival in a new scene (landscape frames only) |
| Never cover headings and text in the DOM | Never cover text or UI chrome detected in the frames, for his whole stay |
| Rests where `spotFor()` finds clear space | Rests where the footprint (body + every move's reach + padding) stays clear; hides if nowhere is |
| Quiet after 4 long passes, reset by a click | Quiet after the type's `quiet_after_lines` lines |

## Limits per scene

| Rule | Limit |
|---|---|
| Big moves (pop_in, edge_peek, relocate) | at most 1 per scene |
| Small moves (side_scoot, small_hop) | at most 2 per scene (fewer for some types), at least 2000 ms apart, first one 2000 ms after landing |
| Spoken lines | at most 1 per scene, 900 ms after landing; never cut off by a scene change |
| Bouncy hover (idle_spring, idle_eager) | at most 1 per scene |
| Rest before relocating | at least 2000 ms after the last landing |
| Pop-in | 1 per video, always his first appearance |
| Minimum clear stay | a spot must stay clear for 2500 ms after he lands |

## Movements

| Movement | Kind | Range | Duration | Quality | Notes |
|---|---|---|---|---|---|
| Pop-in (`pop_in`) | big | y -10…+24px, x ×0.3…1.06, y ×0.3…1, opacity 0…1 | 700 ms | cubic-bezier(.3,1.5,.5,1), ease-out (overshoots) | Scales from 30% with an overshoot. First appearance only. |
| Edge peek (`edge_peek`) | big | 28% of him visible at the side edge, y within 22%–68% of the height | 2400 ms | ease-in-out | About 1.2 s visible with 28% of him showing at the nearer side edge. The only move allowed closer than 8px to the edge. |
| Fly in (after the peek) (`fly_in`) | big | arc lifts 18px (or 6px when descending), tilts up to 2° | 850 ms | cosine path, landing squash at 90% | Low quadratic arc from the off-screen point to the spot, tilting up to 2 degrees; the landing squash and puff fire at 90% of the flight. |
| Peek landing hop (`peek_landing_hop`) | big | y -8px | 340 ms | ease-out | 8px, his largest in-place move. Only with the edge peek. |
| Relocate (follow to the next scene) (`relocate`) | big | opacity 0…1 | 300 ms | ease-out | Vanishes from the old spot and fades in at the new one. Always after at least 2 s of rest. |
| Hide (no clear region) (`hide`) | safety | opacity 0…1 | 300 ms | ease-out | Video-only: the mirror of the relocate fade. Used when text is about to reach his spot and there is no clear place to go. Not a big move; unlimited. |
| Landing squash (`landing_squash`) | landing | x ×1…1.04, y ×0.96…1 | 180 ms | ease-out | A 4% squash on every landing, with the dust puff. |
| Dust puff (`dust_puff`) | landing | opacity 0…1, x ×0.6…1.5, y ×0.6…1, y -3px | 420 ms | ease-out |  |
| Side scoot (`side_scoot`) | small | x +7px, y -3px, +2° | 500 ms | ease-in-out | 7px sideways with a 2 degree tilt. |
| Small hop (`small_hop`) | small | y -5px, x ×0.99…1, y ×1…1.01 | 500 ms | ease-in-out | 5px up. |
| Expression squash (`express_squash`) | face | x ×1…1.03, y ×0.97…1 | 200 ms | ease-out |  |
| Talk squash (`talk_squash`) | talk | x ×0.9…1, y ×1…1.12 | 300 ms | ease-out |  |
| Bubble pop (`bubble_pop`) | talk | opacity 0…1, x ×0.15…1, y ×0.3…1 | 340 ms | cubic-bezier(.2,1.4,.4,1) (overshoots) |  |
| Shell grows into the bubble (`talk_stretch`) | talk | x ×1.05, y ×1.12 | 280 ms in and out | cubic-bezier(.3,1.4,.5,1) (overshoots) | Held while the bubble is open, then shrinks back with the same overshooting transition. |
| Typed line (`talk`) | talk | — | 28 ms per character + 2500 ms hold | — | Types out at 28 ms per character, holds 2.5 s, then closes. Hold shortened from v6's 4.5 s for video, approved by Martin Stübler on 2026-10-28. |
| Glance (`glance`) | face | 3 SVG units toward a text box within 520px | 1300 ms | 220ms cubic-bezier(.3,.7,.4,1) | Face shifts 3 SVG units (about 4.5px at 92px) towards a random detected text box within 520px. |

## Idle hovers (exactly one runs; re-picked on every landing)

| Hover | Motion | Bouncy | Product demo | Release / feature showcase | Short social clip | Talking head / explainer |
|---|---|---|---|---|---|---|
| Game idle (A2) (`idle_game`) | 3.5px bob, ±0.75px drift, ±1.5° tilt, soft squash, 4.1 s. | no | 40% | 40% | 30% | 60% |
| Sleepy (A5) (`idle_sleepy`) | 2px sink over 7.3 s, dimmed to 82%, -_- face, z's. | no | 20% | 10% | 10% | 20% |
| Bouncy spring (A3) (`idle_spring`) | 6px hops with squash, 3.5 s. | yes | 20% | 25% | 30% | 10% |
| Eager jitter (A4) (`idle_eager`) | 2.5px double bob, 2.7 s. | yes | 20% | 25% | 30% | 10% |

## Faces

| Face | When |
|---|---|
| `>_` (cursor) | default, with the block cursor blinking every 1060 ms (steps) |
| `^_^` (happy) | 900 ms on every landing; also a resting expression |
| `o_o` (eyes) | resting expression (blinks: scaleY .15 at 90% and 93.5% of 4200 ms) |
| `-_-` (sleepy) | for as long as the sleepy hover runs |
| glance | the `>_` face shifted toward something; resting beats alternate glance and expression every 5000 ms in v6 |

## Frequency by video type (approved by Martin Stübler on 2026-10-28)

Rows are movements, columns are video types. Everything not listed follows the per-scene limits above for every type.

| Movement | Product demo (`product_demo`) | Release / feature showcase (`release_showcase`) | Short social clip (`social_short`) | Talking head / explainer (`explainer`) |
|---|---|---|---|---|
| Pop-in | once, first appearance | once, first appearance | once, first appearance | once, first appearance |
| Edge peek → fly in → landing hop | ≤1 per video; 60% chance on the first arrival after a cut | ≤1 per video; 100% chance on the first arrival after a cut | ≤1 per video; 100% chance on the first arrival after a cut | ≤1 per video; 30% chance on the first arrival after a cut |
| Relocate | only when his spot will be covered, 1200 ms after the cut | after every cut, 1200 ms after the cut | after every cut, 450 ms after the cut | only when his spot will be covered, 1200 ms after the cut |
| Big moves per minute | ≤4 | ≤6 | ≤8 | ≤2 |
| Side scoot / small hop (50/50) | ≤2 per scene, ≤4 per minute, ≥2 s apart | ≤2 per scene, ≤6 per minute, ≥2 s apart | ≤2 per scene, ≤8 per minute, ≥2 s apart | ≤1 per scene, ≤2 per minute, ≥2 s apart |
| Landing squash + dust puff | every landing | every landing | every landing | every landing |
| Game idle (A2) | 40% of landings | 40% of landings | 30% of landings | 60% of landings |
| Sleepy (A5) | 20% of landings | 10% of landings | 10% of landings | 20% of landings |
| Bouncy spring (A3) | 20% of landings (≤1 bouncy per scene) | 25% of landings (≤1 bouncy per scene) | 30% of landings (≤1 bouncy per scene) | 10% of landings (≤1 bouncy per scene) |
| Eager jitter (A4) | 20% of landings (≤1 bouncy per scene) | 25% of landings (≤1 bouncy per scene) | 30% of landings (≤1 bouncy per scene) | 10% of landings (≤1 bouncy per scene) |
| Glance / expression beats | every 5000 ms at rest, alternating | every 5000 ms at rest, alternating | every 4000 ms at rest, alternating | every 6000 ms at rest, alternating |
| Spoken lines | ≤1 per scene, ≤3 per minute, quiet after 4 | ≤1 per scene, ≤3 per minute, quiet after 4 | ≤1 per scene, ≤4 per minute, quiet after 3 | ≤1 per scene, ≤2 per minute, quiet after 3 |
| Hide | whenever text will reach his spot and no clear spot is free | whenever text will reach his spot and no clear spot is free | whenever text will reach his spot and no clear spot is free | whenever text will reach his spot and no clear spot is free |

- **Product demo** (`product_demo`, approved by Martin Stübler on 2026-10-28): Screen recording of the product with UI text everywhere. Calm, closest to v6.
- **Release / feature showcase** (`release_showcase`, approved by Martin Stübler on 2026-10-28): Short high-production cut (making-feature-showcases). Livelier: follows every cut, peeks once.
- **Short social clip** (`social_short`, approved by Martin Stübler on 2026-10-28): Under 60 s, often vertical. Fast settle, most bouncy, fewest lines in total.
- **Talking head / explainer** (`explainer`, approved by Martin Stübler on 2026-10-28): A person is speaking; Jiro is a quiet companion. Fewest moves, mostly game idle.

## Placement

| Rule | Value |
|---|---|
| Never cover | detected text and UI chrome, padded by 8px, for the whole time he is there (rest, bubble, peek and flight) |
| Centre band | no resting spot centred in 35%–65% of the width (landscape frames (width >= height); the v6 rule applied on screens 768px and wider) |
| Edges | at least 8px from every edge, except during the edge peek and its flight |
| Prefer | flat, low-edge-density areas in the outer bands; stay near the previous spot |
| UI chrome | non-text regions whose edge density exceeds 0.18 |

## Dropped from v6

| What | Why |
|---|---|
| Drag and drop, held dangle, drop pinning | Needs a pointer; a rendered video has no user input. |
| Arrow-key nudge | Needs keyboard focus on a live page. |
| Logo docking (Ditch, FAQ) | Depends on specific jiro.bot DOM logos; arbitrary footage has none to replace. |
| × close button and hide-for-tab | Interactive control; the video equivalent is simply not rendering him. |
| Click-to-speak, ask line with Yes/Later buttons | Needs clicks. Lines come from the --lines file instead. |
| Hover o_o face | No pointer. o_o stays as a resting expression. |
| Dashed salmon outline on the glance target | Would draw onto the footage, which is outside Jiro's overlay. The 3px face shift stays. |
| Screen-reader live region | No DOM. Burn captions separately if needed. |
| Quiet mode reset by click; 'long pass' counter | No clicks and no scrolling. Replaced by quiet_after_lines per video type. |
| Phone layout (56px mascot, phone anchors) | Size is set by --mascot-height instead; portrait frames drop the centre-band rule, as phones did. |
| Reduced-motion variant | A rendered clip has no user preference; render with --type explainer for the calmest result. |
| The small gesture played during a relocation | A relocation in video is a fade with no travel, so the gesture would play at a spot he has just left. Small moves play at rest only. |

## Checker tolerances

| Measure | Tolerance |
|---|---|
| `amplitude_px` | 0.35 |
| `angle_deg` | 0.1 |
| `scale` | 0.004 |
| `opacity` | 0.01 |
| `duration_frames` | 1 |
| `curve_px` | 0.5 |
| `pixel_bbox_px` | 3 |
