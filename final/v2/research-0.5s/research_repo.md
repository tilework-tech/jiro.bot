# jiro.bot repo research (branch `site/final-pixel-restaurant`)

Repo: `/home/sprite/org/workspace/jiro.bot`. Branch `site/final-pixel-restaurant` is at `9904fcd`, byte-identical to `origin/jiro-site` (3 commits: landing page `66bdf55`, brand/ `98223de`, final moodboard `cf7595a`). Working tree has no local changes. All line numbers below are from this branch unless a `origin/<branch>:` prefix is given.

**Headline finding:** nothing on this branch mentions games, koi, mice, dust creatures or whack-a-mole. All of that lives on other remote branches of the same repo, and a v2 design brief + plan + open-questions file dated 2026-10-01 already exists at `origin/jiro-final-v2:final/v2/`. See sections 2 and 6.

---

## 1. Architecture of `src/`

Vite + TypeScript, no framework. `index.html` is a normal DOM landing page; one full-viewport fixed `<canvas id="world">` (z-index 40, `pointer-events:none`, `src/style.css:96-103`) is drawn over it with sushi bodies, a conveyor belt, particles and a chopstick cursor. Three small pixel canvases (`#jiro` 179x179, `#diner` 48x56, `#you` 72x56; `index.html:72,91,138`) are upscaled by CSS with `image-rendering: pixelated` (`.pixel` at `style.css:113-116`, `#jiro` at `573-579`).

| File | Role | Public API / types |
|---|---|---|
| `src/main.ts` (688 lines) | Page wiring: discovery store + toasts, hints, sound button, belt anchor layout, World hooks (feeding Jiro/diner/you), hero sushi + rock spawn, DOM delights (reveal, tilt, turbo belt, lamp click, noren springs, bubbles), frame-rate governor, main RAF loop, SVG-texture baking, boot. | No exports. Exposes `window.jiro = { world, force: forceNext, rain: rainSushi, sprite }` (L681). |
| `src/world.ts` (1347) | Physics world + renderer. | `type State = 'belt'\|'held'\|'free'\|'script'\|'gone'` (L9); `interface Trick` (L11-25: `id, mood?, physics?, update(dt):boolean, drawBack/drawFront/drawWorld?, onGround?, onPickup?():boolean, onRelease?():boolean, end?`); `class Body` (L71-166: kind, x,y,vx,vy,a,va,scale,plate,mood,variant,flip,group,trick,tween,...; `mass`, `inertia`, `radius`, `say(mood,t)`, `kick`); `interface Plate {s, body, color}` (L168); `interface Hooks` (L190-198: `onPickup,onRelease(b,speed,shaken),onImpact,onMerge,onBeltSpawn,tryFeed(b,cx,cy):boolean,hover`); `class World` (L207): `belt`, `plates`, `bodies`, `beltSpeed=62` px/s, `beltBoost/beltBoostTarget`, `plateGap=128`, `maxBodies=64`, `maxDpr=2`, `reduced` (prefers-reduced-motion), `beltAnchors` callback, `spawn/remove/free/attach/serveOne/hit/grab/release/step/render/resize/layout/measureSolids/viewport/visible/setTrick`. |
| `src/belt.ts` (118) | Conveyor path geometry. | `interface BeltPoint {x,y,tx,ty}`; `class Belt { pts, length, width=64; build(anchors,[x,y][], radius); at(s); nearest(x,y); visibleRanges(top,bottom) }`. |
| `src/tricks.ts` (1505) | "Surprise engine": 35 tricks, bag selection, pickup/release reactions. | `TrickMeta {id,name,desc,icon}`; `TRICKS: TrickMeta[]` (L15-51); `initTricks({w, discover})`; `setDiscovered(Set)`; `onRelease(b, speed, shaken, origin)`; `onPickup(b):boolean`; `display(b, anchor)`; `janitor(b)`; `rainSushi(n)`; `forceNext(id)`; re-exports `NIGIRI`. |
| `src/sushi.ts` (853) | Procedural sushi art baked to offscreen canvases + live faces. | `type Kind` (18 kinds, L4-22: salmon, maguro, hamachi, tamago, ebi, unagi, kappa, sakemaki, ikura, onigiri, rock, rice, topping-*); `type Variant = 'normal'\|'stone'\|'gold'\|'pixel'`; `BELT_KINDS`, `NIGIRI`, `SPECS: Record<Kind, Spec{w,h,r,face,name,round}>`; `toppingOf/nigiriOf`; `drawKind(c,kind,seed)`; `sprite(kind,variant)` (3x bake, cache); `spriteOffset(kind)`; `type Mood` (11 moods, L688); `drawFace(...)`. |
| `src/jiroSprite.ts` (202) | Jiro's 20-frame sushi-making loop + live eyes/mouth/lamp glow. | `S=179`; `interface Frame`; `LAMP` rect; `loadFrames()`; `type JiroMood`; `class Jiro { set(mood,dur); serve() /*no-op*/; look(dx,dy); mouthNorm(); catHit(nx,ny); update(dt); onServe?: () => void; hungry }`. |
| `src/chars.ts` (289) | Hand-placed pixel characters. | `class Diner` (state machine idle/reach/bring/chew, `grab()`, `feed()`, `tip()`), `class You` (`feed()`, typing/notification idle); re-exports `Jiro`. |
| `src/fx.ts` (305) | Particles, floating text, shake, flash in document coords. | `type PType` (14), `BurstOpts`, `class FX { burst, ring, text, shake, doFlash, update, draw }`. |
| `src/audio.ts` (213) | Web-Audio synthesized SFX, no files. | `unlockAudio, isSoundOn, setSound, sfx.{pick,drop,thud,squish,boing,pop,whoosh,crunch,chomp,chime,discover,poof,rocket,boom,blip,chirp,splash,kyaa,whistle,snore,note,zap,click}`; persisted in `localStorage['jiro-sound']` (L6). |
| `src/style.css` (1384) | Design tokens (`:root` L2-25: ink/paper/hinoki/lacquer/salmon/wasabi/indigo/cyan, fonts Fraunces/Instrument Sans/JetBrains Mono/Shippori Mincho/Silkscreen, `--belt-lane: 118px` desktop, 70px at ≤980, 56px at ≤640), layout, toasts, lite mode. | n/a |

### Belt path: definition and sampling
- Anchors are computed from DOM rects in `main.ts:123-149` (`w.beltAnchors`). Desktop: `p0` = just under the Jiro canvas (x at 84% of its width) → 30px down → `(hero.l+40, counter.t+150)` → down the left edge to `antislop.t+36` → across to `hero.r-50` → down to `reserve.b-70`. So the on-page belt has **four 90° corners** on desktop (two on mobile), belt width 64 (48/40 on mobile).
- `Belt.build()` (`belt.ts:18-64`) replaces every interior corner with a quadratic Bezier arc of radius `min(radius, d1/2, d2/2)`; `World.layout()` passes radius 80 (50 when width < 50) (`world.ts:268`). The polyline is then resampled every `STEP = 3` px into `pts[]` with unit tangents; `length = (n-1)*3`.
- `at(s)` interpolates by arclength (`belt.ts:66-75`); `nearest(x,y)` does a coarse every-8th scan then refines (`77-99`); `visibleRanges()` returns index ranges within the viewport ±80px for cheap drawing (`103-117`).
- Plates are `{s, body, color}` with `s` advanced by `beltSpeed * beltBoost * (reduced ? 0.4 : 1) * dt` and wrapped at `length` (`world.ts:442-475`); 8% chance a wrapped plate's body is removed ("Jiro clears the odd plate"). `seedPlates()` fills `max(6, L/128)` plates, 86% occupied (`341-355`). `serveOne()` puts a new body on the first free plate with `s < 160` (`425-440`), triggered by `jiro.onServe` when the sprite hits its `serve: true` frame (`main.ts:328`, `jiroSprite.ts:114`).
- Rendering (`world.ts:1070-1148`): the belt is a stroked polyline through `pts` (every 2nd point), with a stacked translucent "fake shadow", rim strokes, and **moving slats via `setLineDash([24,4])` + `lineDashOffset = -beltOffset`**. A radial "drop here" glow appears near the cursor while holding. `drawHatch()` (`1151-1172`) draws a dark kitchen hatch with 4 swaying noren panels at the belt's **end** point, so plates ride into the hatch at the bottom of the page.

### Items: drawing and rotation
- Each `(kind, variant)` is baked once at 3x into an offscreen canvas (`sushi.ts:608-681`); stone/gold are composite-op tints re-masked to the silhouette; `pixel` variant downsamples by 14 with a hard alpha threshold and upscales with smoothing off.
- `World.drawBody()` (`world.ts:1237-1278`): `translate(x,y); rotate(b.a); scale(s*(1+sq)*flip, s*(1-sq))` where `s` includes `pop` (spawn bounce) and belt-width scaling; `drawImage(sprite, -w/2, -h/2)`; then the face is drawn live via `drawFace()` (mood, blink, look-at-pointer, blush); crown if `scale >= 1.9`. The `pixel` variant snaps position to a 6px grid and angle to π/4 (`1244-1248`). On the belt, `b.a` is eased to 0 every frame (`472`), i.e. items do **not** rotate with the belt tangent.
- Draw order: belt riders sorted by y, then free/script bodies, held body last (`1027-1038`).

### Drag / pick-up with chopsticks
- `bindInput()` (`world.ts:882-972`): `pointerdown` (capture) → `hit()` ellipse test in body-local space (`862-880`) → `grab(b)`; `touchstart/touchmove` prevented while holding; `pointerup/cancel/blur` → `release()`; scroll updates pointer doc coords. Pointer velocity is a 0.4-smoothed estimate (`889-893`).
- `grab()` (`974-1005`): cancels tween, asks the trick `onPickup()` whether to survive, detaches from plate, stores the local grab point (`grabX/grabY`), plays `sfx.pick`, calls `hooks.onPickup` (main.ts hides the hint and runs `tricks.onPickup` which may make the piece "slippery", peel its topping, or act shy; `tricks.ts:1441-1486`).
- While held, `joint()` (`589-618`) applies a soft mouse-joint impulse at the grab point so pieces dangle/swing; held mass is 6x in pair collisions. Shake detection accumulates `shakeScore` on velocity sign flips > 600 px/s (`530-537`).
- `release()` (`1007-1023`): sets velocity from pointer velocity (clamped ±3200), then in order: `trick.onRelease()` → `hooks.tryFeed()` (drop on Jiro/diner/you canvases) → re-attach to belt if `speed < 700` and within `width/2+16` of the belt → `hooks.onRelease` → `tricks.onRelease` (reunite topping+rice, forced trick, dizzy if shaken, 4% gold, >1500 px/s = boomerang/comet, first release = takecopter, 10% nothing, else draw from the bag).
- Cursor: `drawCursor()` (`1306-1346`) draws two chopsticks at the pointer (open when hovering, closed when holding) and toggles `body.cursor-grab`.

### Discoveries (easter eggs) and toasts
- `TRICKS` (35 entries, `tricks.ts:15-51`) is the registry; `#tricks-total` shows `TRICKS.length` (`main.ts:33`).
- Found set persisted in `localStorage['jiro-tricks-v1']` (`main.ts:28-30`); `setDiscovered(found)` lets the trick bag favour unseen ones (`tricks.ts:1346-1351`).
- `discover(id)` (`main.ts:53-71`): dedupes, saves, bumps the `#tricks-pill`, plays `sfx.discover`, `toast(icon, "New surprise · n/35", name, desc)`; at 35/35 shows "Itamae certified" and `rainSushi(24)`. Toasts are DOM nodes in `#toasts`, max 3, auto-remove after 3.8s (`37-51`).
- Clicking the pill shows a hint for a random undiscovered trick (`HINTS`, `73-101`).

### The 35 tricks (`tricks.ts:15-51`), one line each
Release-bag tricks (`RELEASE`, L1320-1338; some wait for landing via `afterLanding`):
1. `takecopter` Take-copter: grows a propeller and flies a sine lap for 4.4s, then "battery low" (always the first release, L1431).
2. `legs` Little legs: grows legs, walks/hops back toward the belt and re-attaches ("hup!").
3. `mitosis` Mitosis: splits into three 0.6-scale copies in a group; `regroup` pulls them back; merging them says "whole again".
4. `rocket` Wasabi rocket: fuse → launches to the top of the viewport → confetti boom → parachute descent.
5. `stone` Stone cold: becomes a heavy grey stone, cracks the floor on landing, un-stones after 4s.
6. `bouncy` Super bouncy: restitution 1.02, 7 boings with stars.
7. `fish` Fresh catch: flops 5 times with droplets then "sploosh" back onto the belt (fishy kinds only).
8. `ninja` Ninja vanish: smoke poof, throwing star, reappears on a random visible empty plate.
9. `dance` Conga line: hops in a line playing notes; up to 6 free pieces follow its trail.
10. `sleepy` Food coma: sleeps with Z's and snores; wakes with "!!" when the pointer comes within 80px.
11. `magnet` Group hug: pulls nearby free and belt pieces in with hearts, then releases them.
12. `pixel` 8-bit mode: swaps to the pixel variant and snaps motion; blips on impacts.
13. `chopsticks` Hashi from above: giant chopsticks descend, carry the piece back to the belt (also used quietly as the janitor, L1488).
14. `hatch` It was an egg: tamago shakes, a chick hatches, hops 3 times and flies away.
15. `backflip` Shrimp flip: ebi launches with spin and gets scored 9.9 / 10 / 9.8.
16. `wheel` Wheel mode: maki/rock rolls along the ground with sparks, reversing when stuck.
17. `balloon` Inflatable: inflates to 1.75x, floats, then "pfffft" deflates erratically.
Release-path specials (not in the bag):
18. `slippery` Slippery!: on pickup (≥3rd), 14% chance it squirms out of your grip (L1445).
19. `peel` Topping thief: on pickup, the fish lifts off and an angry rice body is spawned (L1459).
20. `reunite` Reunited: drop a topping within 90px of free rice → recombine (L1388).
21. `shy` Shy one: on pickup, blushes with hearts, "kyaa!" (L1474).
22. `boomerang` Boomerang: throw >1500 px/s → arcs back to the throw origin, "catch!" (L1427).
23. `comet` Comet: throw >1500 px/s → flaming trail, explodes on impact (L1427).
24. `dizzy` Shaken, not stirred: release after shaking → rice sprays, dizzy hops (L1413).
25. `fusion` Sushi fusion: two identical normal pieces collide while free → merge into a bigger one (`world.ts:800-816`, `main.ts:260-292`).
26. `mega` Mega sushi: fused scale ≥1.9 → crown, chime, shake.
27. `gold` Omakase gold: 4% per release (guaranteed on release #9) → gold variant with sparkles.
Page interactions (in `main.ts`):
28. `feed` Feed the chef: drop sushi on the Jiro canvas (L202-232).
29. `rocks` Jiro eats rocks: drop the rock (spawned on the "Jiro eats rocks" table, L353) or a stone piece on Jiro → crunch, shards, shake, respawns rock.
30. `diner` Table service: drop sushi on the diner canvas (L301-310).
31. `you` Snack break: drop sushi on the "you" canvas (L311-321).
32. `turbo` Turbo belt: hover "He makes you faster." → `beltBoostTarget = 6` (L397-405).
33. `hello` Irasshaimase: click Jiro → hop and a line (L417-423).
34. `cat` Lucky lantern: click the paper lamp region of the Jiro canvas (`LAMP` rect, `jiroSprite.ts:24,90-94`) → `rainSushi(10)` (L408-416).
35. `bubbles` Bubble wrap: pop 10 rising DOM bubbles in the hero (L454-486).

### Koi / ending
Not present on this branch. The only "ending" is the 35/35 toast + `rainSushi(24)`. The koi pond finale exists on the restaurant/final branches (section 2).

### Assets loaded at runtime
- `src/assets/jiro-make.png` (3580x179 RGBA, 20 frames of 179x179) via Vite import and `src/assets/jiro-make.json` (frame `ms`, `serve`, `headDy`) (`jiroSprite.ts:7-8`).
- Google Fonts (Fraunces, Instrument Sans, JetBrains Mono, Shippori Mincho B1, Silkscreen) from `index.html:13`.
- `/favicon.svg` (`public/favicon.svg`).
- SVG `feTurbulence` textures from CSS vars `--wood`/`--grain` are rasterised once to blobs (`main.ts:641-658`).
- **Unreferenced**: `public/sprites/jiro-frame0.png`, `public/sprites/jiro-make.png`, `public/sprites/jiro-making-sushi.gif` (537x537, 20 frames), `src/assets/jiro-base.png` (179x179). `grep` finds no code references; only `README.md:38` mentions the GIF.
- Everything else (sushi, plates, belt, particles, diner, you) is drawn procedurally.

### devicePixelRatio / image-rendering
- `World.resize()` (`world.ts:250-257`): `dpr = min(maxDpr=2, devicePixelRatio)`; canvas backing store = viewport × dpr; `render()` does `setTransform(dpr,0,0,dpr,0,0)` then `translate(-scrollX+shakeX, -scrollY+shakeY)` so all drawing is in document px (`1040-1068`).
- Frame-rate governor (`main.ts:492-510`): if < 32 fps over the first ~4s (after 3s), adds `html.lite` (drops grain/lamp-glow/backdrop-filter, `style.css:1369-1384`) and forces `maxDpr = 1`. `?lite` query forces it.
- Pixel canvases rely on CSS `image-rendering: pixelated/crisp-edges`; the world canvas is **not** pixel-art (vector gradients, `filter: blur(2px)` in `sushi.ts:167,310`).
- `prefers-reduced-motion`: belt at 0.4x (`world.ts:446`), grain animation off, reveal transitions near-instant (`style.css:1359-1367`).

Stale comments: `jiroSprite.ts:1-5` says frames are pre-rendered by `art/builder.js + art/choreo.js` — those files do not exist; the real pipeline is `art/gen.mjs → fit.mjs → compose.mjs`. `headDy: f.headDy ? 0 : 0` (`jiroSprite.ts:34`) is dead. `Jiro.serve()` is an empty stub (`72-73`) and `hooks.onBeltSpawn → jiro.serve()` (`main.ts:293-295`) is therefore a no-op.

---

## 2. The two "games"

### On this branch
Searching `README.md`, `brand/DESIGN-LOG.md`, `brand/thread/slack-thread-export.md`, `src/tricks.ts`, `index.html`, `src/main.ts` for game/play/mini/catch/whack/mole/memory/rhythm/chopstick/arcade/score/timer/highscore finds **no games**. Hits are incidental: `README.md:3` "A sushi bar you can play with", the `fish` trick named "Fresh catch" (`tricks.ts:22`), Martin's "look realistic like in a computer game" (`slack-thread-export.md:296`), and Jiro's Pyxel/Phaser library remark (`:113`). The 35 tricks are not games.

### Where the games are documented: `origin/games/sushi-rush-daily-roll`
`docs/games.md` (and byte-identical `origin/jiro-final-v2:final/research/GAMES-SOURCE.md`) is the canonical doc. Quoted verbatim:

> The canonical game page is `/games/arcade/`. It contains Sushi Rush and Daily Roll side by side, with the approved Japanese sushi-counter theme and mouse controls. This is the version to maintain. Both games are plain JavaScript; Vite copies `public/games/` into the static build.
>
> - **Sushi Rush:** click to jump plates, chopsticks, soy bottles and flying fish. Runner stages last 12 seconds and speed up. After three runner stages, the Giant Puffer boss maze appears: steer with the cursor and eat 40 rice to earn 500 points and return to running. One boss collision ends the run.
> - **Daily Roll:** point to steer the maki at the next junction. Clear the rice; salmon roe makes ghosts edible. There are three lives. The UTC date seeds the map and ghost cast so everyone gets the same daily challenge.
> - The keyboard is not captured; Space and arrow keys can scroll the page.
>
> The first finished Daily Roll run of the day is the official score; later runs are practice. … Best scores (`sushi-best-<id>`) and daily scores (`jiro-daily-YYYY-MM-DD`) stay in browser storage. No scores are sent to a server.

That branch's `README.md` adds a "## Mini-games" section: "The final arcade lives at `/games/arcade/`: Sushi Rush and Daily Roll side by side, with mouse controls and a Japanese sushi-counter theme. Static files are in `public/games/`."

Files (plain JS, no bundler): `public/games/arcade/{index.html,arcade.css,arcade.js(111 lines),theme.js(71),japanese-labels.ttf,FONT-LICENSE.txt}`, `public/games/shared/{engine.js(642),maps.js(62)}`, `public/games/sushi-rush/game.js(57)`, `public/games/daily-roll/game.js(42)`. Commit history: `200185f` baseline → `44445d3` polish → `a81b2c1` revert of the polish → `1520ab8` "Keep the simple versions" → `50f25c9` mouse-only arcade page → `8d4286e` Japanese theme → `26dcd57` "Keep the final mouse arcade as the only game entry point".

How the two are meant to be placed in the final site: `origin/jiro-final-v2:final/v2/DESIGN-BRIEF.md` §8: "**Sushi Rush** (runner + Giant Puffer boss) lives in stop 4 as a pixel arcade cabinet beside the table; **Daily Roll** (daily maze) lives in stop 7 as a pond-side stall. Both play in place (not a modal), activate on click, pause on leave, release scroll keys. Re-skinned to the master palette." `QUESTIONS.md` #6 asks Martin: "Confirm these are the two you meant." (unanswered in the repo). PR #13's `final/DESIGN-BRIEF.md` stops 4 and 7 say the same.

### Earlier games and the whack-a-mole rejection
The restaurant branches (`origin/restaurant-belt`, `-v3`, `demo2`, `demo4`) originally shipped three games — `restaurant/BIBLE.md:24` "Mini game 1: Whack-a-Bug (whack-a-mole)" in the storage room, Hose Snake, and "Mini game 3: Flappy Koi" (`:27`).
- Rejected, verbatim Martin: round 2 (`origin/restaurant-belt-v3:restaurant/docs/00-history.md:44`) "cancel the wackamole and instead make the game of a small fish that you can navigate to eat smaller fish and grow"; 2026-09-30 17:06 UTC (`origin/demo4:restaurant/docs/FEEDBACK-LOG.md`, item 5) "remove the wack a mole game and have the sushi sit on an esthetic pleasing counter … jiro bot off to the side answer wuestions in a bubble"; item 6 "cut the snake slide".
- The synthesized master prompt (`origin/jiro-final-v2:demo5/site/docs/FEEDBACK-VERBATIM.md`, end): "If we add sushi-themed mini games, show clickable prototypes and get approval for the chosen games after the core scroll works; **do not reintroduce rejected whack-a-mole** or disrupt the main journey."
- "Fish Frenzy" (fish-eat-fish) was built in round 2 and reverted in round 3 ("revert the aquarium to the previous version", `00-history.md:59,98`).
- V3 kept **Flappy Koi as the only mini game** (`restaurant/V3-BRIEF.md:37`; mechanics in `restaurant/docs/03-scenes-storage-to-pond-and-games.md:1150-1256`: 240x160 internal canvas, GRAV 560, FLAP −168, bamboo posts every 96px with every 7th a chopstick pair, sushi pickups +2/gold +5, medals, eggs `flappy-5/10/20`, localStorage `jiro-best-flappy`). The 2026-10-01 v2 brief supersedes this with Sushi Rush + Daily Roll.

So: "the two games" = **Sushi Rush** and **Daily Roll**; **whack-a-mole/Whack-a-Bug is explicitly rejected**; Hose Snake and Fish Frenzy were also cut; Flappy Koi is a third, now-superseded candidate.

---

## 3. Art pipeline (`art/`)

| Script | What it does |
|---|---|
| `art/gen.mjs` (18 lines) | `node art/gen.mjs out.png "prompt" ref1.png [ref2.png …]`. Model from `process.env.MODEL`, default `gemini-3-pro-image` (L5). Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}` (L8). Reference images are passed as `inline_data {mime_type:'image/png', data: base64}` parts followed by the text prompt (L6-7). `generationConfig: { responseModalities: ['IMAGE','TEXT'], imageConfig: { aspectRatio: '1:1' } }` (L11). Writes the first inline image part to `out`. |
| `art/fit.mjs` (32) | `node art/fit.mjs ref.png in.jpg out.png [in2 out2 …]`. `createRequire('/home/sprite/.nori/browser-scripts/')` to load `playwright-core` (L4-5), `chromium.connectOverCDP('http://127.0.0.1:9222')` (L10) — drives the session browser; injects `fit.js` into a blank page and runs `align → resample → snap` in-page, returning a data URL. Static-region mask for alignment: `y < 100 && !(x > 118 && y > 45)` (wall, noren, bottles, lamp, head/shoulders; L21). |
| `art/fit.js` (79, browser-side `window.JiroFit`) | `S = 179`. `align()` brute-forces scale (±6% of `W/179` in 0.5% steps) and offset (±24 px in 3 px steps) minimising RGB error over the static region, then refines (L8-35). `resample()` averages a 3x3 sub-sample of each 179-grid cell centre (L37-51). `snap()` builds the palette from every unique colour in the reference and maps each pixel to the nearest by luma-weighted distance (0.3/0.59/0.11) with a 6-bit cache (L53-76). |
| `art/compose.mjs` (75) | Reads `art/sequence.json`, loads each frame via CDP, locks every pixel above `lockAbove` (56) and every pixel whose RGB distance to frame 0 is ≤ `thresh` (30); grows the change mask 3x, shrinks 1x, keeps only connected components touching the forearm anchors `[[10,110,75,160],[108,92,140,117]]`, reverts everything else to frame 0 (L22-64). Writes `src/assets/jiro-make.png` (sheet) and `src/assets/jiro-make.json` (L71-72). |
| `art/sequence.json` | 20 frames: 10 keys `gen/v2/keys/k0..k8,k6b` + in-betweens `f-ib*`; timings 150-900 ms; `k6b` has `serve: true`. Notes describe the choreography (pinch slice → lift → lay on rice → press → hold up → lower → push off bottom → rice tub → fresh ball). |

Env/tooling needs: `GEMINI_API_KEY` (set in this session), optional `MODEL`; Node 22 (present); `playwright-core` installed under `~/.nori/browser-scripts/` (**the directory does not exist on this machine yet**; `skills/using-a-web-browser/SKILL.md:27-28` says to `npm install playwright-core` there); the session Chrome's CDP on `127.0.0.1:9222` (not verified reachable from this shell). No ffmpeg on PATH; `~/.venv-media` has `imageio_ffmpeg` (ffmpeg 7.0.2 binary) and Pillow.

Reusability for new scene backgrounds / belt items: `gen.mjs` is a generic Gemini image call (any prompt, any refs) and can be reused as-is, but only at 1:1 aspect; change `imageConfig.aspectRatio` (e.g. `16:9`) and consider `gemini-3.1-flash-image` for sprites as the v2 plan proposes. `fit.js` is **specific** to re-aligning a redraw onto a known 179x179 reference (alignment needs a static reference region; palette snap takes the palette from the reference, not a fixed `.gpl`). For new scenes you need a different grid-fit (the v2 plan's `tools/fit.py`: pseudo-pixel grid detection, per-cell mode downscale, palette snap to `jiro48.gpl`, orphan cleanup, green-key alpha). `compose.mjs` is specific to Jiro's arm animation. Richer, already-written reference pipelines exist on other branches: `origin/jiro-final-v2:demo1/pipeline/{gen_still.py,gen_veo.py,crisp_composite.py,lock_region.py,loop.py,…}` and `origin/restaurant-belt-v3:restaurant/pipeline/gen_still.py` (model `gemini-3-pro-image-preview`, 2K 16:9, STYLE prefix) — see `restaurant/docs/06-art-and-tooling.md` there.

---

## 4. `brand/` docs and assets

### `brand/DESIGN-LOG.md` summary (Slack #C0BGDN7PK3K, 2026-09-28 16:00 → 09-29 01:00 UTC)
- R1 16-bit sprite (64x64, 26 colours) — kept copper dome, cream faceplate, blue eyes, hachimaki, striped happi.
- R2 Caves of Qud palette scene, 16x24 tile, 24-tile sushi bestiary (onigiri moods etc.).
- R3 Hand-drawn Slack icon candidates (front, front-focused with red hinomaru disc, ¾ L/R); Jiro's pick front-focused; none approved.
- R4 "Aseprite" → actually LibreSprite headless; Pillow quantize 128/96 px, 28 colours; 96px clean variant dropped (damaged headband).
- R5 Moodboard of 10 jobs/angles — Martin "i like them"; strongest 01, 04, 07, 09; weakest 05.
- R6 Character iterations REF + 1-17: **chosen** 3 (rolled sleeves, slim copper arms) + 10 (speaker-grille mouth); **rejected** 4 rice-tin head, 5 visor band, 6 smooth dome (faceplate lost); 12 mittens uneven; 14/17 lost the headband. Martin: "i like 3 with the mouth of 10, and pls flip it so that he looks to the left" → #18 (original orientation), **#19 = canon (mirrored, faces left, bottle kanji redrawn)**.
- R7 Bar scene moodboard (10, with #19 as ref) — Martin liked 1, 5, 6, 10; fidelity slips in #7 (apron) and #8 (half-rolled sleeves).
- R8 Hero banners 2560x768, left 45% quiet, treatments A (outpaint interior, Jiro's pick) / B (plank wall) / C (pixel fade); B/C and clean files lost.
- R9-13 Belt edits: v1 **rejected** ("you can't combine them, it can always only be one single belt"); v2 one belt accepted; v3 straight belt to bottom-left, plain wood before customers; v4 belt from the wall; v5 Martin's five-point rejection of v4 (belt started mid-counter, too fast, plates falling onto belt, Jiro moving too much, curtains moving) → **v5 FINAL: belt visibly enters a dark opening under the bottle shelf**.
- Animation: all Veo 3.1 image-to-video + ffmpeg seamless loop; v1 Martin chose smooth A1; v3 pinned first/last frame; v4 "really bad"; v5 strict motion prompt, Martin chose smooth; **v6 = v5 reversed so plates flow into the wall — approved "great"**.
- Open items: no #19-based Slack icon; hero banner copy unset; pipeline scripts need rebuilding.

`brand/README.md` adds the canon description (L41-55), the **rejected list** (bulky shoulder pads, rice-tin/visor heads, mouth as a drawn line, mitten hands, aprons, red hinomaru disc), **scene rules** (L57-62: exactly one belt, "never a belt that branches or turns a corner", starts in a wall opening under the bottle shelf, straight line past Jiro, exits bottom-left; counters without belt plain wood; customers backs to camera) and **animation rules** (L64-72: belt ≈ one plate-width per clip, plates enter/leave only via opening/frame edge, Jiro in pose, curtains barely move, seamless loop, flow toward the wall). The thread ends (`slack-thread-export.md:466-470`) with Martin approving documentation options 1 (git repo) and 2 (Drive), "no need to do 3 and 4" (Linear, careful design log) — though `brand/final/index.html:64` footer cites Linear GTM-55…63 anyway.

### Canonical assets
- **Jiro canon reference:** `brand/character/05-design-iterations/19-CANON-rolled-sleeves-grille-mouth-facing-left.png` (1024x1024). Runtime 179x179 base of the same scene: `art/gen/v2/base.png` / `src/assets/jiro-base.png` / `public/sprites/jiro-frame0.png`.
- **Approved bar still:** `brand/scenes/04-belt-edits/v5-FINAL-belt-into-wall-opening/01.jpg` (1376x768).
- **Approved loop:** `brand/animation/v6-FINAL-reversed-flow.mp4` — H.264 1920x1080, 24 fps, 7.96 s, ~9.7 MB.
- Original art: `brand/reference/jiro-original.png` (638x640 RGBA).

### Every image asset with dimensions (PIL)
```
brand/character/01-16bit/jiro-16bit-scene-768.png              768x768   RGB
brand/character/01-16bit/jiro-16bit-sprite-512.png             512x512   RGBA
brand/character/02-caves-of-qud/jiro-qud-map-v1.png            896x576   RGB
brand/character/02-caves-of-qud/jiro-qud-map-v2.png            896x768   RGB
brand/character/02-caves-of-qud/jiro-qud-scene-768.png         768x768   RGB
brand/character/02-caves-of-qud/jiro-qud-sushi-bestiary.png    1248x888  RGB
brand/character/02-caves-of-qud/jiro-qud-tile-192x288.png      192x288   RGB
brand/character/03-icons-handdrawn/icon-front-768.png          768x768   RGB
brand/character/03-icons-handdrawn/icon-front-focused-768.png  768x768   RGB
brand/character/03-icons-handdrawn/icon-three-quarter-left-768.png   768x768 RGB
brand/character/03-icons-handdrawn/icon-three-quarter-right-768.png  768x768 RGB
brand/character/04-icons-aseprite/icon-128-dimmed-scene-6x.png 768x768   P
brand/character/04-icons-aseprite/icon-128-flat-backdrop-6x.png 768x768  P
brand/character/04-icons-aseprite/scene-128-6x.png             768x768   P
brand/character/04-icons-aseprite/jiro-aseprite-files.zip      (236 KB, .ase bundle)
brand/character/05-design-iterations/18-rolled-sleeves-grille-mouth.png                 1024x1024 RGB
brand/character/05-design-iterations/19-CANON-rolled-sleeves-grille-mouth-facing-left.png 1024x1024 RGB
brand/character/05-design-iterations/contact-sheet-numbered.jpg   2374x1192 RGB
brand/character/05-design-iterations/contact-sheet-unnumbered.jpg 2374x1192 RGB
brand/final/jiro-final-moodboard.jpg                           2400x2683 RGB
brand/final/jiro-final-moodboard.png                           2400x2683 RGB
brand/reference/jiro-original.png                              638x640   RGBA
brand/reference/onigiri-faces-reference.png                    429x324   RGBA
brand/scenes/01-moodboard/contact-sheet.jpg                    2632x1060 RGB
brand/scenes/02-bar-moodboard/contact-sheet.jpg                1310x1860 RGB
brand/scenes/03-hero-banners/01A-interior-mock.png             2560x768  RGB
brand/scenes/03-hero-banners/05A-interior-mock.png             2560x768  RGB
brand/scenes/03-hero-banners/06A-interior-mock.png             2560x768  RGB
brand/scenes/03-hero-banners/10A-interior-mock.png             2560x768  RGB
brand/scenes/04-belt-edits/v1-multi-belt/{01,02,02-alt,04}.jpg 1376x768  RGB
brand/scenes/04-belt-edits/v2-single-belt/{01,02,04}.jpg       1376x768  RGB
brand/scenes/04-belt-edits/v3-straight-belt-bottom-left/01.jpg 1376x768  RGB
brand/scenes/04-belt-edits/v4-belt-from-wall/01.jpg            1376x768  RGB
brand/scenes/04-belt-edits/v5-FINAL-belt-into-wall-opening/01.jpg 1376x768 RGB
brand/animation/v6-FINAL-reversed-flow.mp4                     1920x1080 24fps 7.96s
public/favicon.svg                                             64x64 viewBox (nigiri on dark rounded square)
public/sprites/jiro-frame0.png                                 179x179   RGBA
public/sprites/jiro-make.png                                   3580x179  RGBA (20 frames)
public/sprites/jiro-making-sushi.gif                           537x537   P, 20 frames
src/assets/jiro-base.png                                       179x179   RGBA
src/assets/jiro-make.png                                       3580x179  RGBA
art/gen/v2/base.png + keys/k0..k8,k6b + f-ib*.png (21 files)   179x179   RGBA
```

---

## 5. `index.html`, scripts, config, tests

`index.html` (188 lines): title "jiro.bot — your AI Staff Engineer", description "Bring your own subscription." Structure: `.grain` overlay, `#world` canvas, fixed `.nav` (logo, Menu / Anti slop / Reserve, `#tricks-pill` "✦ 0/0", `#sound-btn`), `main#top`: `#hero` (`#hero-box` with lamp glow, `#noren` 次郎寿司 panels, eyebrow "Counter open · 24/7", H1 "Jiro, your AI Staff Engineer", sub "Bring your own subscription.", CTAs "Take a seat" / "See the menu ↓", BYO list Claude/Codex/Gemini, `#jiro-stage` with `#jiro` canvas + `#jiro-speech`, `#bubbles`, `#hint` "psst — pick up the sushi", `.ledge`), `#menu` (diner canvas + three `.table` boards: 岩 "Jiro eats rocks." / 速 "He makes you faster." (hover = turbo) / 夜 "He never leaves the counter."), `#seat` (席 Seat 04, "This one's yours.", `#you` canvas), `#antislop` (問 "Asks before he cuts." chat mock; 味 "Tastes before he serves." receipt mock), `footer#reserve` (予約, "Omakase for your backlog.", mailto hello@noriagentic.com "Reserve a seat", fine print "Made by a robot who eats rocks · Nori · No sushi was harmed."), `#toasts`. `.solid` elements are physics colliders and `.ledge` one-way platforms (`world.ts:277-291`).

`package.json`: `dev` = `vite --host 0.0.0.0 --port 5173`, `build` = `tsc --noEmit && vite build`, `preview` on 4173. devDeps only `typescript ^5.6`, `vite ^6`. No `node_modules` installed in the checkout. `vite.config.ts`: `server.allowedHosts: true`, `hmr.clientPort: 443`, `preview.allowedHosts: true`. `tsconfig.json`: ES2022, bundler resolution, strict, noEmit, `include: ["src"]`. `.gitignore`: node_modules, dist, *.log, .DS_Store.

**Tests: none** anywhere in the repo, on any branch (no `vitest`/`@playwright/test`/`jsdom`/`happy-dom` in any package.json). `origin/jiro-final-v2:final/v2/QUESTIONS.md` #12 already asks Martin "May I add Vitest and @playwright/test?" and `PLAN.md` specifies Vitest for the belt model and art files + Playwright (Chromium + WebKit) for page tests.
Recommendation for TDD: `npm i -D vitest happy-dom` (ask first per workspace rules; Vitest 3 pairs with Vite 6). Pure modules are directly testable with no DOM: `src/belt.ts` (build/at/nearest/visibleRanges), `SPECS`/`toppingOf`/`nigiriOf` in `sushi.ts`, and the trick selection logic if `RELEASE`/`draw` are exposed or a `World` stub is injected via `initTricks`. Anything touching `CanvasRenderingContext2D` (`sprite()`, `drawFace`, `World.render`) will throw under jsdom/happy-dom (no canvas) — either stub `getContext` or keep rendering out of unit tests. For browser-level checks use `@playwright/test` with `npx playwright install chromium` (system libs may be missing in this sandbox; the fallback is `playwright-core` + `connectOverCDP('http://127.0.0.1:9222')` against the session browser, which is what `art/fit.mjs` already does). Add `"test": "vitest run"` to `package.json`; `tsconfig` `include` would need the test folder or a separate `tsconfig.test.json`.

---

## 6. Conflicts with the new brief

The repo already contains a written v2 brief at `origin/jiro-final-v2:final/v2/DESIGN-BRIEF.md` (2026-10-01, "proposal for Martin's review") plus `PLAN.md` and `QUESTIONS.md`; PR #13's v1 is at `final/DESIGN-BRIEF.md` and the synthesized "master prompt" is at the end of `demo5/site/docs/FEEDBACK-VERBATIM.md`. Conflicts between this branch / brand docs and that direction:

1. **Belt corners.** `brand/README.md:59` "Exactly one conveyor belt per scene. Never two belts, never a belt that branches or turns a corner." and `:60` "runs in one straight line past Jiro" vs. v2 §5 "straight runs plus **90° bends only**, each with a centre radius ≥ 1.5 belt widths". Martin's own words cut both ways: 2026-09-29 00:45 "don't have this ghost belt appear angeled 90 degrees to the right, just lead it straight out of the image" (`slack-thread-export.md:394`); 2026-09-30 17:06 items 3/6 "don't do a 90 degree rotation… cut… the unrealistic 90 degree angle the belt is going" (`origin/demo4:restaurant/docs/FEEDBACK-LOG.md`); master prompt: "never introduce… sharp kinks, or unexplained 90-degree turns"; but also "small angle tilt of maximum 90 degree… keep the camera fixed like in old computergames like zelda" (`FEEDBACK-VERBATIM.md:952`) and the v2 `QUESTIONS.md` #3 quotes a 2026-10-01 message as "Only 90° turns". The current page's belt itself has four rounded corners (radius 80px ≈ 1.25 belt widths, `world.ts:268`) and is not straight. The V3 restaurant rule was radius ≥ 1.2× belt width with fanned slats (`restaurant/V3-BRIEF.md`, "Corners"). Whatever the new brief says about turns, it contradicts `brand/README.md:59` and that line should be amended or scoped to "stills/loops".
2. **Belt direction/origin.** Approved loop v6 flows **toward** the wall (plates vanish into the opening; `brand/README.md:72`), and the current site ends the belt at a kitchen hatch (`world.ts:1151`). v2 §5 and the master prompt want plates to **emerge** from a lit hatch in the hero's back wall and flow downward to the pond.
3. **Mice vs dust creatures.** Round-3 feedback "eliminate the entire mouse family scene and put fat and bored cat there" (`00-history.md:95`); master prompt "Replace wall mice with small black fuzzy dust creatures"; v1 brief "Avoid wall mice"; v2 §7 "Dust spirits (original design…)" and `QUESTIONS.md` #7 (not Ghibli-copied, copyright). Note V3's storage room still has a code-drawn **mouse + mouse-trap egg** (`restaurant/docs/03-scenes…md:142-143,180-181`) and `demo4` still ships `public/art/tr/bar-office/mice.png` — if any of that is reused it conflicts. This branch has neither.
4. **Whack-a-mole.** Rejected twice by Martin (section 2) and the master prompt forbids reintroducing it. This branch has no games at all, so there is nothing to remove here, but nothing to reuse either; the two approved candidates are on `origin/games/sushi-rush-daily-roll`.
5. **Jiro's mouth.** Brand canon `brand/README.md:46` "No mouth line; a small speaker grille where the mouth would be" vs. v2 §4 "**No drawn mouth.** The chin is a plain jaw plate that drops 1–2 art px… No grille that reads as teeth" and master prompt "no drawn mouth, only small jaw motion… in the product scene no pupils". The current sprite draws a mouth when chewing/hungry (`jiroSprite.ts:184-199`) and draws pupils/looking eyes (`149-182`).
6. **Plates.** Current `PLATE_COLORS` are red/blue/gold/black/green/grey (`world.ts:174`) vs. v2 §5 "all white, faint grey-blue rim, no other colour, no dark outline". Fill: current 86% occupied vs. v2 ~50% seeded with gaps.
7. **Belt speed and boost.** Current 62 px/s with a 6x hover "turbo" (`world.ts:219`, `main.ts:399`) and 0.4x under reduced motion vs. v2 §5 rest 16 px/s at 1440, ≤4x surge only on scroll, never reverses; §9 reduced-motion 25% + koi off. Brand animation rule: ≈ one plate-width per 8 s clip.
8. **Medium.** Current sushi/belt/plates/particles are vector-canvas with gradients and `blur(2px)` (`sushi.ts:167,310`), not pixel art, and faces are vector; v2 §3 mandates 16-bit pixel art, Gemini + LibreSprite, 48-colour palette, two grains (4 CSS px world / 2 CSS px hero), no dither.
9. **Page model.** Current site is a DOM landing page with the belt wandering between copy sections; v2 is seven full-screen stops in a fixed ¾ view with native scroll + soft settle, joining bands, copy field on the left 40-45%.
10. **Eggs.** 35 tricks with a nav-right pill (`index.html:32-35`) vs. v2 §7 ≥ 54 eggs with a top-centre tracker "🍣 7 / 54" and the games counted as eggs.
11. **Physics gags vs. restraint.** Current tricks are loud (rockets, explosions, conga lines, sushi rain) and many fire automatically on every release; v2 §5/§9 want ≤ 5% of pixels moving, scheduled rare events ("once or twice per visit"), and Martin's "no more than one or two times on the whole site" (`FEEDBACK-VERBATIM.md:571`). The current `rainSushi`, fusion, turbo and conga behaviours conflict with that tone.
12. **Jiro pose / canon slips.** Brand rejects aprons; brand animation rule "Jiro stays in pose: small finger motion and an occasional blink at most" — the current 20-frame loop has full arm choreography (`art/sequence.json`), which v2 §4 also tightens to "one tiny hand or knife motion per loop".
13. **Belt turn rule in brand vs. the current code** (independent of the new brief): `brand/README.md:59` is already violated by `main.ts:123-149`. The brand rules were written for Veo stills/loops, not the interactive page; the doc does not say so.

---

## Outdated / inconsistent documentation on this branch
- `src/jiroSprite.ts:1-5` references `art/builder.js` + `art/choreo.js`, which do not exist (actual: `art/gen.mjs`, `fit.mjs`, `compose.mjs`).
- `README.md:38` and `public/sprites/*`, `src/assets/jiro-base.png`: exported duplicates not used by code.
- `brand/README.md:74` "Pipeline (as used, scripts not preserved)" is true for the scene/loop pipeline; rebuilt versions now exist on other branches (`origin/jiro-final-v2:demo1/pipeline/`, `origin/restaurant-belt-v3:restaurant/pipeline/`), not mentioned here.
- `brand/final/index.html:64` cites Linear GTM-55…63, although Martin said "no need to do 3 and 4" (Linear/log) in `slack-thread-export.md:466-470`.
- `art/fit.mjs:4` and `compose.mjs:5` hard-code `/home/sprite/.nori/browser-scripts/` which is absent on this machine; scripts fail until `playwright-core` is installed there.

## Related material outside this branch (for the parent)
- `origin/jiro-final-v2:final/v2/{DESIGN-BRIEF.md,PLAN.md,QUESTIONS.md,research/video-01..09.md}` — a complete v2 brief/plan/tests outline dated today (commit `9423288`). The nine Slack recordings it analyses are byte-identical to the `.mov` files in `/home/sprite/org/workspace/jiro.bot-media/` (`v01_0609.mov` … `v09_0614.mov`; `v10_bike_in_rain.mov` = PR #13 "video 10", rain/motion reference only). Frame dumps are in `jiro.bot-media/frames/vNN_*/` and crops in `analysis/tmp_v06/`.
- `origin/work/jiro-final-experience` (PR #13): `final/site/` (Vite + TS, `src/{belt.ts,content.ts,main.ts,passes.ts}`), `FINAL-ASSEMBLY.md`, `DEMOS.md`, four preserved demos (`demo1/`, `demo2/`, `demo4/`, `demo5/`) with reconstruction docs.
- `origin/restaurant-belt-v3:restaurant/docs/01-engine.md` (belt engine with global plate ids, filleted corners, slat fans, plate life), `03-scenes-storage-to-pond-and-games.md` (koi fates: leap 55% / miss 12% / wait, timing constants L886-1000; Flappy Koi L1150-1256; belt item catalogue L1256+).
- `origin/games/sushi-rush-daily-roll:public/games/` — the two approved game candidates.
- Branch `site/final-pixel-restaurant` currently has no commits of its own; it is a fresh pointer at `origin/jiro-site`.
