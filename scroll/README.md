# Jiro.bot scroll flow

A single-page scroll experience: one conveyor belt runs from the hero to the footer and never stops.
Scrolling flies the camera along it between full-screen animated scenes.

Run it: serve this folder statically (`python3 -m http.server 3000`) and open it in desktop Chrome.
Add `?nosnap` to disable settle-on-scene, or `?g=7.7` to jump to a timeline position (in screen heights).

## Sections

| # | Section | Scene video | Camera |
|---|---|---|---|
| 0 | Hero, one button top right, no menu | `hero` (approved v6 bar loop) | slow push-in, drops onto the belt |
| 1 | Clickable product demo | `s1-shoulder`, coding at a CRT | dives into the CRT, demo runs on its screen, then pans to the hands |
| 2 | Same-prompt side-by-side videos | `s2-topdown`, bird's-eye serving | barrel roll in, top-down, rotates 90° onto Jiro |
| 3 | Comparison: Devin, Factory, Cursor Cloud | `s3-tuna` then `s3b-knife` | zooms into the knife, crossfades to the close-up |
| 4 | FAQ as thought bubbles over the food | `s4-teaching`, apprentice bots | reverse barrel roll in, slow pan, close-up on the nigiri |
| 5 | Pricing painted on the hanging board | `s5-menuboard` | zooms until the board fills the screen, then onto Jiro |
| 6 | Footer | `s6-tea`, then `s6b-bento` after 7 s idle | pull-out |

The standalone CTA section from the sketch was removed at Martin's request (2026-09-29).

## Easter eggs (15)

Poke plates: sushi explodes, bomb (chain reaction), wasabi, pufferfish, bug, rubber duck, cat, apprentice bot, onigiri (jokes), gold plate (omakase turbo).
Drag and throw any plate. Merge the PR in the demo. Type `omakase`. Konami code. Sit on the footer for 7 s.

## Pipeline

`pipeline/` has the scripts that made the media, with the chosen stills in `pipeline/stills/`.

1. `gen_stills.py`: Gemini 3 Pro Image with the #19 canon and the approved bar still as references, two takes per scene.
2. `gen_videos.py`: Veo 3.1, 8 s at 1080p, with the still as both first and last frame.
3. `loop.sh`: drops the duplicate end frame and blends the last 12 frames into the head, so the last frame steps straight into frame 0.
4. `seam.py`: checks each loop's wrap against its normal frame-to-frame steps.

The scripts expect the `brand/` tree from the `brand/design-log` branch for the reference images.

## Open items

- Factory column is placeholder copy, marked pending verification on the page.
- Side-by-side videos are sushi stand-ins for the real same-prompt agent comparison.
- Links point to noriagentic.com as placeholders.
