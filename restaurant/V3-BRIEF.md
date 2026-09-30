# V3 brief — "one single animation" (Martin, 2026-09-30 17:42 UTC)

Branch `restaurant-belt-v3`, forked from `restaurant-belt` (PR #6). PR #6's docs (`docs/`) describe the whole build; they remain the reference for anything not overridden here.

## Why this round exists

Martin screen-recorded the PR #6 site. It was opened with `?t=<unix time>` which in this engine FREEZES the animation clock, so in his recording the belt and the ambient animations were stopped. He still says "the flow is still the best flow we had". So: keep the scene order and transitions of PR #6, make everything move, and add the life he asks for below. (The recording itself could not be downloaded: Slack's 100 MB limit.)

## Martin's request (verbatim)

> <@U0ASASJJFAL> help me recreate this scrolling animation from a video recording.
> 
> keep in mind that the belt and most of the other small animations stopped because the website was no longer loading properly but the flow is still the best flow we had.
> 
> you gentle animations in every scene to make the scene look more alife and interactive, like let the curtains move a bit in the breeze, have the people at the bar move a bit but very different than any other person in the bar.
> 
> give jiro bot some small movement in each scene, like his eyes blinking from time to time, or the small things in the aquarium, between the walls or somewhere else just move.
> 
> the conveier belt has to move smoothly and coninously as well, following the best pracices especially in the corners, have some plates move independently and maybe move over to another plate to chat.
> 
> some plates are just falling off the belt, some small creatures like the little black dust spirits in spirited away can run around in a very simple pixelated form between the walls, etc.
> 
> Jiro on the bike should be replaced with a new screet bicycle scene similar to the other video i attached. animate the koi at the end scnene to somtimes jump up and swallow the sushi sometimes wait in the water for it. some beaitiful ripples on the pond from the other shadows of the fish and some wind in the grass should be animated.
> 
> animate each scene to have minimal movement, but animate every scene sufficiently to not look static.
> 
> the belt should move smoothly and continoulsy from scene one until the last scene, it should all be one single animation so that there are no interruptions of the flow. Give the things on the belt some irregularity, like not all spots are taken, often there are big gaps, between, make all the plates be somewhat homogenious in color, but the things on top of it should be really funny, surprising suhsi related and contain a plathora of easter eggs, if you click and pull the plates off they sometimes dissapear and sometimes if they are places on a flat surface anywhere in a scene they should stay there and remain on the counter for example and maybe it stays there or the sushi grows two small legs and starts walking a bit around on the surface.
> 
> 1. Make it entertaining and a bit silly with lot's of easter eggs, and random stuff you can click and discover things. Include 1 mini games that are immediately recognizable, and have some things especially on the conveyer belt be totally absurd, in the best of comic and animal way.
> 2. The scrolling should follow though a restaurant individual rooms, like start at the bar, go the the restaurant, kitchen, storage room, back room for washing plates outdoors, and then on the bike delivering stuff in the last view. 
> 3. use some of the desing decision we made here: <https://github.com/tilework-tech/jiro.bot/blob/jiro-site/brand/DESIGN-LOG.md|github.com/tilework-tech/jiro.bot/blob/…/DESIGN-LOG.md>
> launch many many subagents to work on the logic of the belt and how it transitions from room to room, to be wild but not unrealistic, be creative about through which parts of a wall you go, and after all the transitions between scenes are worked out launch at least 10 different sub agents to polish each scene visually, making it a simple and polished pixel art by itself with minimal animaiton, so no big movements like walking around but the belt is always moving at the same speed though each scene.

## Decisions (lead)

- **Scene order unchanged:** bar → office → dining → kitchen → storage → pantry → street → pond, same transitions. Do not add or remove rooms.
- **One mini game:** Flappy Koi (pond) stays. Hose Snake is removed (storage keeps the coiled hose as decoration only, clicking it can be an egg).
- **Street:** Jiro on the cargo trike is replaced by a NEW street bicycle scene: Jiro on a normal city/delivery bicycle (not a trike, not a motorcycle), stopped at a red light in neon rain with one foot down, delivery box on the rear rack, relaxed idle only (breathing, blink, head tilt, the light cycles). Martin's reference video was a night-street motorcycle loop; make the bike version of that mood.
- **Pond:** the koi sometimes jumps and swallows a plate, sometimes waits in the water under the pier for one; ripples from fish shadows; wind in the grass/reeds.
- **Freeze param renamed:** `?t=` no longer freezes time (so old links animate). Use `?freeze=<seconds>` for deterministic screenshots. Cache-busters are `?v=`.

## Rules (all agents)

- **One belt, one animation.** Exactly one belt, never branching, always moving at `BELT_SPEED` in every scene and transition. A plate is a single object from the bar wall to the koi: same item, same position continuity, across every room and transition (global plate identity, see engine notes in `src/engine/belt.ts`).
- **Irregular belt:** many empty slots and often big gaps. Plates are homogeneous (one ceramic plate style, slight variation at most). What sits on them is the fun part.
- **Minimal ambient motion.** Small, slow, loop-safe (pure functions of time, periods dividing `LOOP` = 24 s, or deterministic aperiodic noise). No walking around, no big movements. Every scene must still visibly breathe: curtains in a breeze, customers each moving differently, Jiro blinking now and then, tiny things in aquarium/walls.
- **Corners:** belt curves follow real kaiten/baggage-carousel practice: rounded (radius ≥ 1.2× belt width), slats fan open on the outside of a turn, no kinks.
- **Jiro canon:** copper dome, cream faceplate, two blue eyes, speaker-grille mouth, white hachimaki, indigo striped happi with rolled sleeves, slim copper arms. No shoulder pads, apron, visor, or red disc. No Jiro in the dining room or on the pond bridge.
- **Pixel art:** crisp, snapped to whole pixels, `imageSmoothingEnabled = false` for sprites. 16-bit premium look (see `docs/06-art-and-tooling.md` and `pipeline/gen_still.py` STYLE).
- Never use the word "soak".

## How to work

- Dev server: `http://localhost:3000` (vite, HMR). Never start, stop or restart it.
- Screenshots: `cd tools && node qa/seg.mjs /tmp/<you> --w=1280 "<seg>:<tt>" ...` (seg = scene id or `from>to`, tt 0..1). Add `--t=<s>` to set the frozen time. Look at your screenshots (Read the png) before reporting.
- Motion check: take the same segment at several `--t` values (e.g. 0, 3, 6, 12) and compare.
- Art generation: `/tmp/venv/bin/python pipeline/gen_still.py OUT.png "prompt" refs...` (Gemini, `GEMINI_API_KEY` is set). Python with Pillow/numpy: `/tmp/venv/bin/python`.
- Type check: `npx tsc --noEmit` from `restaurant/`.
- Only edit files you own (listed in your task). Need a change elsewhere? Put it in your report. Don't commit; the lead commits.
- Report ≤ 12 lines: what changed, files, what you verified, open issues.
