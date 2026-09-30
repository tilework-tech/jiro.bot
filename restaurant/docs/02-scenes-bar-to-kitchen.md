# 02 · Scenes: bar, office, dining, kitchen

Recreation spec for the first four rooms of Jiro's Restaurant. It covers the art, belt, surfaces, ambient animation, DOM, hotspots, easter eggs, and enter/leave hooks. Anyone with this file and the committed assets should be able to rebuild these rooms pixel for pixel.

Source files: `src/scenes/{bar,office,dining,kitchen}.{ts,css}`, `src/content/{copy,product,compare}.ts`, `public/ui/product/states.json`, `public/ui/compare/compare.json`. Global CSS lives in `src/style.css`.

## 0. Conventions shared by all four scenes

- **Stage.** Every coordinate is in stage space: a fixed 1920×1080 canvas. The canvas and the DOM layer `#ui` (also 1920×1080) share one transform that scales them to the viewport. Every scene art file is 1920×1080 and is drawn at `(0,0,1920,1080)`.
- **Draw order per frame** (`renderScene` in `src/engine/stage.ts`):
  1. The art JPEG.
  2. `under(g, now, api)`.
  3. The belt tread and plates (`drawBeltFull`). Belt `style` is not set in these four scenes, so it defaults to `"full"`: tread (with pixel slats), rails and plates are drawn by the engine.
  4. Dragged or rested plates.
  5. `over(g, now, api)`.
- **Clocks.**
  - `now` is the ambient clock: `performance.now()/1000`, or the `?freeze=` URL value when the time is frozen (`?t=` is ignored since v3).
  - `LOOP = 24` s. Every periodic ambient period divides 24, or the motion is scheduled inside one loop.
  - Click reactions use a separate wall clock, `performance.now()/1000`, so they play even with `?freeze=`.
- **Belt** (engine, see `01-engine.md` §7): `BELT_SPEED = 46` world units/s, slots every `PLATE_GAP = 130` world units, slats every `SLAT = 26`. The belt width default is 64 and the plate default is 52. When a scene omits `fadeIn` or `fadeOut`, they default to 40. A `BeltPt` is `[x, y, scale]`; scale multiplies width, plate size and local speed.
  - There is one belt with **global plate ids**: scene `phase` values are overwritten by the engine's chain at `start()`, and the item, glaze, occupancy (many empty slots), chats and falls of a plate depend only on its id. Scenes have no per-scene key or item pool.
  - **Falls** happen only inside each scene's `FALL_ZONES` entry in `src/engine/belt.ts` (fraction of the scene path, per-zone probability, drop in px). The entry is listed under each scene's Belt section below.
- **Hold.** `hold` is the scroll length of the scene in viewport heights.
- **FX helpers** (`src/engine/fx.ts`), used verbatim below:
  - `wave(now, period, phase) = sin(((now % 24)/period)·2π + phase)`.
  - `glow(g, x, y, r, color, now, amt=.08, period=6, seed=0)`: a radial gradient from `color` to transparent. The radius is `r·(1 + amt·(0.6·wave(now,period,seed) + 0.4·wave(now,period/3,seed·2.1)))`. It uses `globalCompositeOperation="lighter"` and fills the square `x±1.3r, y±1.3r`.
  - `steam(g, x, y, now, seed=0, h=120, px=6, alpha=.22)`: 7 puffs on a 6 s cycle, with puff `i` offset by `i·6/7 + seed`. For fraction `f` (0 to 1):
    - `yy = y − f·h`
    - `xx = x + sin(f·5 + i + seed)·10·f`
    - `r = px·(1+2f)`
    - alpha is `alpha·sin(fπ)` and the fill is `#f3eee4`.
    - The rect is snapped to a `px` grid: x `round((xx−r)/px)·px`, y `round((yy−r/2)/px)·px`, size `round(2r/px)·px` × `round(r/px)·px`.
  - `shade(g, x, y, w, h, alpha, feather, side)`: a linear gradient of `rgba(8,6,5,alpha)` that stays solid until `1 − feather/w` of the way across, then fades to 0.
  - `motes(g, now, x0, y0, w, h, n, color)`: `n` 3×3 px motes rising through the rect. Mote `i` has period 12, 18 or 24 (by `i%3`) and x = `x0 + ((i·0.618)%1)·w + sin(f·2π+i)·14`. Alpha is `0.6·sin(fπ)`.
- **DOM helpers** (`src/engine/dom.ts`):
  - `html(el, markup)` appends the first element of the markup.
  - `place(el, x, y, w?, h?)` sets absolute left/top/width/height in stage px.
  - `hotspot(parent, x, y, w, h, title, onClick)` creates a transparent `<button class="hit">` with `title` and `aria-label` set to `title`. Clicks call `stopPropagation`. Global CSS: `.hit:focus-visible { outline: 2px dashed var(--copper) }`.
  - `bubble(parent, x, y, text, ms=2600, cls="")` creates a `<div class="bubble cls">` placed at (x, y) whose top-left is the anchor, and returns a remover.
    - Global bubble CSS: cream `#f3e6cf` background, `#1b130d` text, `22px/1.35` sans, padding `14px 18px`, `max-width 420px`, `3px solid #1b130d` border, `0 5px 0 rgba(0,0,0,.5)` shadow.
    - It enters from `translateY(10px) scale(.96)` at opacity 0 with a `.2s` transition, uses `z-index 3`, and ignores pointer events.
    - It is removed after `ms`, with a 300 ms fade.
- **Eggs.** Every `api.egg(id, text)` call shows `text` as a cream toast. The first call per id (persisted in `localStorage["jiro-eggs"]`) also counts the egg, stays for 3600 ms and wears a green pixel tag "Easter egg `<n>/<total>` found!". Repeat calls show a plain toast. Every scene declares its egg ids up front with `declareEggs([...])`.
- **Dropping plates.** A dragged plate dropped with its bottom centre inside a surface polygon settles there at `surface.scale` with a small bounce, plays sfx `blip`, and calls egg `plate-parked` with the surface's `say` text. The first park anywhere counts the egg; every later park still toasts that surface's line. About 1 in 3 parked plates later grows two pixel legs and potters along its drop row, never leaving the polygon (only if the row is wider than the plate; see `01-engine.md` §8.2). Picking a plate off the belt removes it from every later room too.
- **Tokens:**
  - colours: `--ink #0b0a09`, `--cream #f3e6cf`, `--muted #bfae95`, `--copper #d98a4a`, `--green #6fdc8c`
  - fonts: `--px "Silkscreen"`, `--sans "Instrument Sans"`, `--mono "JetBrains Mono"`
- **Global copy CSS:**
  - `.copy { position:absolute }`
  - `.kicker { 20px/1 px font; copper; letter-spacing .04em; margin 0 0 22px }`
  - `.px { px font, 400, cream, text-shadow 0 4px 0 rgba(0,0,0,.6), letter-spacing .01em }`
  - `h1.px 76px/1.08`, `h2.px 56px/1.05`
  - `.lede { 27px/1.45; #e7d8bf; margin 24px 0 0; max-width 34ch; text-shadow 0 2px 8px rgba(0,0,0,.8) }`
  - `.hint { 18px mono; muted; margin-top 40px }`
- **Layer visibility.** Each scene's DOM lives in `<div class="layer scene-ui" data-id="<id>">`. Opacity is 1 while the scene holds. It cross-fades during transitions: the `from` layer fades out over t 0 to 0.12 and the `to` layer fades in over t 0.88 to 1. The class `live` is set while opacity > 0.5, and only `.live` layers receive pointer events (buttons, links, `.hot`, `video`, `figure`).
- **Hooks.** `enter()` fires when the scroll lands on the scene hold; `leave()` fires when it leaves.

Scene order and scroll lengths:

| # | id | `room` (rail label) | `mood` | `hold` |
|---|----|--------------------|--------|--------|
| 1 | `bar` | Bar | bustling | 1.2 |
| 2 | `office` | Back office | quiet | 1.6 |
| 3 | `dining` | Dining room | bustling | 1.3 |
| 4 | `kitchen` | Kitchen | bustling | 1.6 |

Reference screenshots were taken with `seg.mjs` on the PR #6 build (`?seg=<id>&tt=0.5&t=5`, which is `&freeze=5` today; 1600×900 viewport, 2.5 s settle). They were downscaled to 1600 px JPEG q80. A fresh visitor sees the drag hint, full glints and 0 eggs.

---

## 1. `bar`: the sushi bar (hero)

![bar](img/scene-bar.jpg)

### Purpose and mood
This is the hero room: busy, warm and lantern-lit. Jiro stands behind the counter and the regulars eat at the bar. The left 40% of the room is darkened in code so the headline and CTAs read cleanly. The belt runs up the diagonal counter rail and disappears into a dark hole in the wall at the upper right, the "reversed flow" from the bible. Plates flow *into* the wall.

### Art
- `public/art/bar.jpg`: 1920×1080 RGB JPEG (427 462 bytes). Isometric 16-bit pixel art, seen from above and to the front-left.
  - **Left (x 0 to 230, y 90 to 600):** the street entrance, with a cream split noren and a dark wooden lattice sliding door. A green floor mat sits at about (0 to 250, 610 to 720).
  - **Paper lanterns:** four hang from the ceiling, centred at (440,110), (728,140), (1224,140) and (1622,105).
  - **Upper-left wall shelf:** sake jars, a green pot and a lidded box at about 548 to 700 × 0 to 200. Three glazed crocks sit on the back counter at about 630 to 800 × 245 to 360.
  - **Back wall behind Jiro:** a **green noren** at x 818 to 952, y about 40 to 334. To its right is an **indigo noren** with white kana (きゅり…) at about 965 to 1170 × 60 to 230.
  - **Jiro** stands centre at about x 830 to 1120, y 170 to 500. He has a copper dome head with a white hachimaki knot on his right, a cream faceplate with **two glowing blue eyes** centred at (952,262) and (986,263), and a speaker grille. He wears an indigo-striped happi and has copper arms. His hands rest on the cutting board at about y 450 to 500, holding a tuna nigiri and an onigiri. A tea cup stands by his right hand at about (1212,540).
  - **Sake bottles** stand behind his left shoulder at x 1060 to 1210, y 215 to 345: three bottles with white labels (one reads 助).
  - **Right back shelves:** tea cups on two tiers (1280 to 1470, 10 to 250), a **stack of white plates** at 1478 to 1600, 160 to 268, and two crates of fish and vegetables at 1270 to 1600, 290 to 420.
  - **Far right:** a tall shelf with jars (1760 to 1920, 40 to 170). Below it is the **dark wall opening** where the belt goes in: the black hole is about x 1712 to 1812, y 250 to 450, and its right wooden jamb is x 1811 to 1833, y 244 to 422.
  - **Counter:** an L-shaped wooden bar runs from the left door down to the centre. Four regulars sit on stools at the front, from left to right: a woman in a purple sweater (about 260 to 420), a man in a navy jacket, a man in a brown jacket (about 650 to 870), and in the gap a condiment tray with soy bottles at about 1050 to 1180 × 640 to 712.
  - **The diagonal counter rail** (the belt's bed) runs from bottom centre (about 650,1080) up to the opening (about 1800,380).
  - **Far-end regular:** a man in an olive jacket sits on a stool on the right at about 1510 to 1780 × 510 to 1000, holding chopsticks and a tea cup (steam at 1546,620).
- `public/art/bar/jiro-blink.png`: 66×37 RGBA. Two cream eyelids (oval) with a dark-teal closed-eye line, drawn at (936,244).
- `public/art/bar/chop.png`: 74×86 RGBA. The far-end regular's hand and chopsticks and a sushi piece, drawn at (1540, 612 − lift).
- `public/art/bar/chop-mid.png`: 74×54 RGBA. Still committed but **no longer used** (the brown-jacket regular now moves via `parts.png`).
- `public/art/bar/parts.png`: 1024×466 RGBA atlas of moving parts cut from `bar.jpg`, built by `tools/art/bar/parts.py` (`/tmp/venv/bin/python`, Pillow + numpy).
  - Each part is a hand-drawn polygon mask over the art. Parts that move away from their home get a `-bg` twin: the same rect with the masked pixels inpainted (mean of horizontal and vertical linear interpolation between unmasked neighbours), drawn first so the vacated sliver is clean.
  - `noren-cloth` is the back-noren region (820,44)–(1175,346) minus the things standing in front of it (Jiro's head and the sake bottles, found by colour tests for green/indigo cloth and white kana); `noren-occ` is those occluders.
  - Parts are shelf-packed into the 1024-wide atlas; the script prints the `PARTS` table (`name → [sx, sy, w, h, homeX, homeY]`) that is pasted verbatim into `bar.ts`.

  | part | home x,y | w×h | `-bg` patch |
  |---|---|---|---|
  | noren-cloth / noren-occ | 820,44 / 925,160 | 355×302 / 250×186 | no |
  | woman-head / woman-hands | 282,399 / 363,515 | 100×108 / 42×39 | hands only |
  | navy-head | 484,397 | 107×137 | yes |
  | brown-body / brown-head / brown-hand | 656,591 / 704,484 / 810,622 | 204×180 / 98×109 / 76×76 | no |
  | olive-head / olive-toe | 1610,507 / 1540,965 | 104×116 / 45×40 | yes |
  | jiro-jaw / jiro-hand | 947,291 / 947,439 | 51×23 / 86×65 | yes |

### Belt
```ts
belt: { pts: [[662,1122,1.06],[900,956,1.0],[1200,752,0.9],[1500,554,0.8],[1700,426,0.73],[1768,386,0.71]],
        width: 58, plate: 54, fadeOut: 70 }   // fadeIn defaults to 40
```
- The belt rides the flat top of the diagonal rail. The scale per point follows the measured top-face width of the rail, so the perspective narrows as it recedes. It starts below the bottom edge at y 1122 and ends inside the opening.
- **Recess** (drawn in `under`, before the belt): for each segment, a stroke `rgba(20,10,4,.28)` with `lineCap butt` and width `58·avg(scale)+10`, from `(x0,y0+3)` to `(x1,y1+3)`. It reads as a channel rather than a sticker.
- **Into the wall** (`over`):
  1. Clip to the polygon (1712,250) (1812,250) (1812,400) (1712,450).
  2. Fill rect (1712,250,100,200) with a linear gradient. It runs from 15% of the way along the last segment, from (1700,426) toward (1768,386), to (1768,386), with stops `0 rgba(6,4,5,0)`, `.8 rgba(6,4,5,.8)` and `1 rgba(6,4,5,.94)`.
  3. Redraw the art slice JAMB `{x:1811,y:244,w:22,h:178}` 1:1 over the belt, with smoothing off, so plates slide *behind* the right jamb.
- **Falls:** `FALL_ZONES.bar = {from .26, to .46, p .08, drop 190}`, so plates only tip off the middle of the rail, never near the opening.

### Surfaces (drop targets)
Rows are chosen so a plate that grows legs paces only over bare wood, never through a cup, bottle, hand or head. The three shelves are built by `shelf(x0, x1, yl, yr, depth, scale, say)`: a strip cut into 32 px-wide tiles, `[x, y(x)−depth] [xe, y(xe)−depth] [xe, y(xe)] [x, y(x)]` with `y` interpolated from `yl` to `yr`. A tile is narrower than a plate, so shelved plates never grow legs.

| poly | scale | say |
|------|-------|-----|
| (830,556) (1105,556) (1105,606) (830,606) | 0.9 | Jiro inspects it. LGTM. Back to work. |
| (1352,764) (1512,764) (1432,815) (1345,815) (1282,800) | 0.84 | The regular at the end adds it to his tab. His tab is all green checks. |
| (1738,524) (1880,524) (1746,604) (1738,604) | 0.78 | Saved a seat for a friend. The friend is a plate. |
| `shelf(1262, 1454, 98, 116, 16)` | 0.62 | Top shelf. Reserved for plates with excellent test coverage. |
| `shelf(1256, 1460, 252, 262, 14)` | 0.66 | Shelved. Like that refactor. Jiro will get to it. |
| `shelf(556, 668, 186, 186, 14)` | 0.6 | Up with the pickled plums. It will age like good documentation. |

In order: the raised plank between the regulars and Jiro (clear of his hands, the tall cup and the bowls), the far-end counter corner in front of the soy bottle, the upper-right counter end beside the olive regular's head, the top cup shelf, the fish-crate shelf, and the upper-left jar shelf. There is no longer a surface on the front counter.

### Ambient animation (all in `under` unless noted; `imageSmoothingEnabled=false` for sprite work)
Helpers: `t = now mod 24`. `pulse(now, period, at, len, ease)` is 1 for `len` seconds starting at `at` in every `period` (of the loop), with linear ramps of `ease`. `inWin(now, period, at, len)` returns the seconds into that window, or −1 outside it. `q2` snaps to the art's 2 px pitch; `smooth` is smoothstep on 0..1. `part(name, dx, dy, patch)` draws an atlas part at its home plus the offset, drawing its `-bg` patch first when `patch` is set.

1. **Noren in a breeze.** Both curtains sway row by row in 2 px strips; the wave runs down the cloth and grows toward the hem.
   - `sway(y) = q2(amp·(1+gust)·k·w)`, with `k = ((y−top)/(hem−top))^1.5` and `w = 0.75·wave(now,8,−lag−(y−top)/90) + 0.25·wave(now,6,−lag·1.7−(y−top)/60)`.
   - **Door noren** (cream, left): strips `[x0,x1,top,hem,amp,lag]` = `[0,81,128,402,4,0]` and `[81,175,118,398,4,0.9]`, copied row by row from the art (`artSlice`) inside a clip around each strip. `gust` is `1.2·sin(π·a/2.4)` for 2.4 s after the door-curtain click, else 0.
   - **Back noren** (green and indigo): strips `[826,891,52,338,3,.4]`, `[891,956,52,300,3,1.1]`, `[964,1052,60,240,2,1.8]`, `[1052,1141,60,238,2,2.4]`, `[1141,1174,60,236,2,3.0]`. Rows come from the `noren-cloth` part so Jiro and the bottles never smear; if any row moved, `noren-occ` is redrawn on top. `gust` is `1.2·sin(π·a/2)` for 2 s after the noren click.
2. **Jiro** (he is concentrating, so only small things move):
   - **Hum:** during windows 6.0–6.9 s and 19.4–19.9 s of the loop, on even 0.15 s frames, `jiro-jaw` is drawn 2 px lower (patched), so the grille dips.
   - **Onigiri press:** during 11.0–11.9 s and 22.2–23.1 s, on even 0.3 s frames, `jiro-hand` is drawn 2 px lower (patched).
   - **Blink:** `pulse` blinks of 0.16 s at 2.6, 14.8 and 21.4 s, 0.14 s at 9.3 s, and 0.12 s at 15.12 s (a double blink with the one at 14.8). While blinking, draw `jiro-blink.png` at (936,244). Otherwise draw two eye glows: `glow(952,262,26,"rgba(90,220,255,.16)",now,.25,4,.5)` and `glow(986,263,26,…,.9)`. Blinking is suppressed while a poke reaction plays (see hotspots).
3. **Four regulars, four tempers** (each moves differently):
   - **Woman by the door, the statue:** every 12 s at 4 s (or for 2.4 s after the "sip" click), for 2.4 s, `sip = smooth(st/0.5)·smooth((2.4−st)/0.5)`. `woman-head` is drawn at `(−q2(2·sip), −q2(2·sip))` and `woman-hands` (patched) at `(0, −q2(4·sip))`: she lifts her cup and sips.
   - **Navy jacket, nodding off:** with `nt = t mod 12`, `drop` is 0 until 1 s, sinks `smooth((nt−1)/8)·4` px until 9 s, jerks to −2 for 0.12 s, then 0. For 3 s after the "nap" click, `drop` is −2 for 0.12 s then 0 (awake). `navy-head` (patched) at `(q2(drop/2), q2(drop))`.
   - **Brown jacket, laughing:** windows 3.0–5.2, 10.0–10.6 and 15.0–16.6 s (or 2.4 s after the "laugh" click). `shake` is −2 on odd 1/9 s frames. Draw `brown-body` at dy `shake`, `brown-head` at dy `shake−2`, and `brown-hand` at `(q2(2·wv), shake − q2(4·|wv|))` with `wv = sin(2π·lt/0.8)`: his chopsticks conduct the joke.
   - **Olive jacket at the far end, grooving:** 12.5–20.0 s (or 3 s after the customer click). On a 0.5 s beat, for the first 0.18 s `olive-head` (patched) is drawn 2 px down, alternating 2 px right every other beat; from 0.25 to 0.4 s `olive-toe` (patched) is drawn 2 px up (toe tap). Separately, his chopsticks lift a bite during 1.0–3.6 s of every 12 s, `lift = q2(4·sin(π·cw/2.6))`, `chop.png` at (1540, 612−lift).
4. **Glints on glassy things**, one at a time: a 0.9 s pixel sparkle (a `#fff6dc` 2×2 core with arms growing 1 to 3 cells and fading, `sin(fπ)`) at `[second, x, y]` = [1.2,1070,236] [4.4,1500,190] [7.1,1120,240] [9.8,587,64] [12.6,1174,252] [15.3,1494,50] [18.0,1326,180] [20.7,1560,58] [23.0,1119,282].
5. **Shading for the hero copy:**
   - `shade(g,0,0,960,1080,0.66,460,"left")`: solid 0.66 to x≈500, fading to 0 at x=960.
   - Then a radial pool at (420,520), r 40 to 560, `rgba(8,6,5,.38)` to 0, filling (0,0,1000,1080).
6. **Lantern breathing.** For each lantern i: `glow(x,y,170,"rgba(255,190,110,.20)",now,.1,6,i)`.
7. **Tea steam.**
   - Jiro's cup: `steam(1212,530,now,.3,70,4,.14)`
   - Middle regular: `steam(897,628,now,2.2,80,4,.14)`
   - Far-end regular: `steam(1546,620,now,4.1,70,4,.13)`
   - For 2.2 s after the tea click, an extra fast plume `steam(1212,526, a·3, 1.3, 120, 4, .34)` fades out over its last 0.6 s.
8. **Moth** circling the lantern above the sake shelf: an 8 s lap, `x = q2(1224 + 50cos α + 6 sin 3α)`, `y = q2(146 + 20 sin α + 4 sin 5α)`, `α = 2π·t/8`. `#3b2717` 2×2 body plus two 4×2 wings, up or down on alternate 0.1 s frames.
9. **Belt recess** (see Belt), drawn last in `under`.
10. **The cat in the wall** (`over`).
   - Eyes = `max(pulse(now,24,14,2.4,0.4)·(1 − pulse(now,24,15.1,.14,.01)), clickPeek)`. They open from 14.0 to 16.4 s each loop with 0.4 s fades and blink at 15.1 s.
   - Pixels: `#f5c451` rects (1768,296,3,2) and (1780,297,3,2) at alpha=eyes, plus halos (1767,295,5,4) and (1779,296,5,4) at alpha=eyes·0.3.
   - Click peek (since click `p` < 1.8 s): `min(1, p/0.2, (1.8−p)/0.3)`, forced to 0 for 0.9<p<1.02 (a blink).

### DOM
Hero copy block: `<section class="copy hero-copy" style="left:110px;top:210px;width:760px">`.
- `p.kicker`: **Counter open · 24/7**
- `h1.px`: **Jiro, your AI staff engineer** (76px Silkscreen)
- `p.lede`: **Cloud coding agents from Nori, the infrastructure for your agent army. Bring your own subscription.** It gets an extra `text-shadow: 0 2px 0 rgba(0,0,0,.55), 0 0 18px rgba(8,6,5,.9)`.
- `div.ctas` (flex, gap 16, margin-top 38). Both links use `target="_blank" rel="noopener"`.
  - `a.btn.primary` to `https://noriagentic.com/`: **Get started for free**. Green background, text `#07130b`, shadow `0 5px 0 #2d7a45`.
  - `a.btn.ghost` to `https://noriagentic.com/book-a-demo.html`: **Book a demo**. Background `rgba(10,8,7,.6)`, `2px solid rgba(243,230,207,.5)`.
  - `.btn` is `20px/1` px font with padding `18px 24px`. On hover it gets `brightness(1.1)` and `translateY(-1px)`.
- `p.hint` (14px mono in this scene, `text-shadow 0 1px 0 #000, 0 0 10px rgba(8,6,5,.9)`): **Psst: almost everything here is clickable.** followed by `<button class="try-lantern">`**Try the lantern.**</button>.
  - The button inherits the font, is copper, has a `2px dotted rgba(217,138,74,.6)` bottom border, and turns `#f5c451` on hover.
  - Clicking it triggers lantern #2 (see hotspots).

Hover affordance on every bar hotspot (`.bar-hit`):
- The native `title` is removed. A child `<span class="bar-tag">` holds a tiny verb.
- **Hover or focus-visible:** eight 16×3 / 3×16 gradient strips in `rgba(245,196,81,.9)` form pixel corner brackets, plus a radial glow `rgba(255,205,130,.16)` to 0.
- **Tag:** absolutely positioned at `left 50%; top −30px`. It uses `14px/1` px font, `letter-spacing .04em`, ink text on `#f5c451`, padding `5px 8px 4px`, and shadow `0 3px 0 rgba(0,0,0,.55)`. It rises from `translate(−50%,4px)` at opacity 0 to `translate(−50%,0)` at opacity 1, over `.15s` with `steps(2)` on the transform.
- `mousedown` calls `preventDefault` so clicking doesn't focus and nudge the scroll.
- The wall opening also gets `cursor: zoom-in` (`.peek`).

### Hotspots and easter eggs
| # | name (aria) | rect x,y,w,h | hover tag | on click | sfx | bubble (x,y,ms) | egg id: toast |
|---|---|---|---|---|---|---|---|
| 1 | Jiro | 900,160,240,340 | poke Jiro | Cycles lines; eyes flare | blip | 1110,150 (2600): cycles "Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef." | `bar-jiro` on the **5th** click: "You poked Jiro five times. He noted it in the retro." |
| 2 | Sake bottles | 1060,215,150,140 | sake? | Bottles jiggle | chime | 1150,360 (1400): "clink." | `bar-sake`: "Sake is for after the deploy." |
| 3 to 6 | Lantern ×4 | (x−55, y−90, 110, 170) for each lantern: 385,20 · 673,50 · 1169,50 · 1567,15 | tap the lantern | Flicker then flare | pop | none | `bar-lantern`: "The lantern flickers. Somewhere, a flaky test passes." |
| 7 | Customer | 1622,522,108,318 | say hi | Olive regular grooves for 3 s | pop | 1330,440: "I asked for one fix. I got a fix, tests, and a changelog." | `bar-customer`: "The regulars are very happy." |
| 8 | Stack of plates | 1478,160,124,108 | count them | Stack jiggles | bonk | none | `bar-plates`: "Twelve plates deep. Jiro calls it the call stack. Please don't pop from the middle." |
| 9 | Soy sauce | 1050,640,130,72 | soy | none | blip | none | `bar-soy`: "Low-sodium soy. Like the logs: just enough salt to be useful." |
| 10 | Wall opening | 1712,256,98,104 (`cursor: zoom-in`) | peek inside | Cat eyes open 1.8 s | meow | 1470,200: "mrrp? (the wall cat approves this PR)" | `bar-opening`: "There's a cat in the wall. It has read access to every plate." |
| 11 | Noren curtain | 826,48,70,120 | staff only | Back noren gusts for 2 s | whoosh | none | `bar-noren`: "Staff only. Behind this curtain: the on-call rotation, and a very tired rice cooker." |
| 12 | Tea-sipping regular | 360,512,48,40 | shh | She sips (2.4 s) | blip | none | `bar-sip`: "She has been nursing that one cup of tea since the last major version. Respect." |
| 13 | Sleepy regular | 450,680,190,80 | wake him | He jerks awake, stays up 3 s | bonk | 470,700: "zzz... hm? is CI green yet? ...wake me when it's green." | `bar-nap`: "He is waiting on a 40-minute build. He will be here a while." |
| 14 | Laughing regular | 655,610,195,160 | what's funny? | He laughs for 2.4 s | quack | 640,790: "HA! The commit message just says 'fix the fix of the fix'." | `bar-laugh`: "He is reading your git log out loud. It is his favourite comedy." |
| 15 | Fish crate | 1400,300,200,110 | fresh? | Crate flops | splash | 1330,420 (1200): "flop." | `bar-fish`: "The mackerel is fresher than your dependencies." |
| 16 | Door curtain | 0,96,175,110 | who's there? | Door noren gusts for 2.4 s | whoosh | none | `bar-door`: "Someone pushed through the noren. It was the wind. The wind wants omakase." |
| 17 | Empty stool | 1788,650,128,220 | sit? | Stool wobbles | bonk | 1560,640 (1800): "Reserved for your next PR." | `bar-stool`: "The empty stool is yours. Jiro keeps it warm with a heat lamp and good intentions." |
| 18 | Jiro's tea | 1180,520,64,50 | tea | Steam plume (ambient 7) | chime | none | `bar-tea`: "Jiro's tea: 100% sencha, 0% hallucination." |

Declared eggs: `bar-jiro, bar-sake, bar-lantern, bar-customer, bar-plates, bar-soy, bar-opening, bar-noren, bar-sip, bar-nap, bar-laugh, bar-fish, bar-door, bar-stool, bar-tea`.

Click reactions, all timed by wall-clock `since(key)`. `f2(k,dur)` returns +1 or −1, alternating every 0.1 s, for `dur` seconds after the click:
- **Jiro.** For 0 to 0.1 s and 0.2 to 0.3 s the blink sprite is suppressed and the normal glow shows. For 0.1 to 0.2 s and 0.3 to 0.5 s two bright flares are added over the eyes: `glow(952,262,40,"rgba(120,235,255,.55)",now,0)` and the same at (986,263). The effect reads as the eyes flaring twice.
- **Sake.** For 0.6 s the art slice (1100,214,112,132) is redrawn shifted x by ±2 px.
- **Customer, sip, nap, laugh, door, noren, tea.** They restart the ambient motions above (items 1, 3 and 7).
- **Plates.** For 0.4 s the art slice (1484,166,116,48) is redrawn shifted x by ±2 px.
- **Fish crate.** For 0.8 s the art slice (1420,316,172,70) is redrawn 2 px higher on +1 frames.
- **Stool.** For 0.6 s the art slice (1786,640,132,240) is redrawn shifted x by ±2 px.
- **Lantern i** (key `lantern<i>`), drawn in `under` after the lantern glow:
  - For a<0.1 s and 0.2 to 0.3 s, a dark rect `rgba(20,10,4,.55)` covers (x−52, y−62, 104, 130).
  - For 0.3 to 0.9 s a flare plays: `glow(x,y,190,"rgba(255,200,120,α)",now,0,6,i)` with `α = 0.45·(1−(a−0.3)/0.6)`.
- **Opening.** The cat-eye peek described in ambient item 10.

### The 5 "click me" glints (the hero's affordance targets)
Each glint is an `<i class="bar-glint">` at `(x−22, y−22)`, 44×44, holding an 11×11 `crispEdges` SVG pixel sparkle. The sparkle is a plus-shaped star in `#fff3d6` with a single `#f5c451` centre pixel. The SVG path data:
```
fill #fff3d6: M5 0h1v3h-1zM5 8h1v3h-1zM0 5h3v1h-3zM8 5h3v1h-3zM4 4h3v3h-3zM5 3h1v1h-1zM5 7h1v1h-1zM3 5h1v1h-1zM7 5h1v1h-1z
fill #f5c451: M5 5h1v1h-1z
```

| key | centre (x,y) | slot | `animation-delay` | quieted by |
|---|---|---|---|---|
| lantern | 1284,96 (lantern #2, upper right) | 0 | 0.8s | lantern #2 hotspot or the "Try the lantern." button |
| jiro | 1074,150 | 1 | 3.2s | Jiro hotspot |
| customer | 1716,530 | 2 | 5.6s | Customer hotspot |
| sake | 1200,226 | 3 | 8.0s | Sake hotspot |
| opening | 1792,246 | 4 | 10.4s | Wall-opening hotspot |

- **Schedule:** `animation: bar-glint 12s steps(1,end) infinite both`. The delay is `0.8 + slot·2.4` s, so exactly one glint sparkles at a time, 2.4 s apart, and each glints once per 12 s.
- **Keyframes** (opacity / scale):
  - 0%: 0 / 0
  - 1.5%: .7 / .4
  - 3%: 1 / .7
  - 5%: 1 / 1
  - 7.5%: 1 / .7
  - 9.5%: .7 / .4
  - 11%: 0 / 0
  - 100%: 0 / 0
- With `steps(1,end)` the sparkle pops through pixel sizes, visible for about 1.32 s of each 12 s.
- `filter: drop-shadow(0 0 6px rgba(255,214,130,.9))`, `z-index 2`, `pointer-events none`.
- **Quieting:** a glint goes quiet (`.quiet { opacity:0 !important; animation:none }` with a `.6s` opacity transition) once its target is clicked. Poked keys persist in `localStorage["jiro-bar-poked"]` as a JSON array, so return visits stay calm.
- **Reduced motion:** no animation; `opacity .55; scale(.7)`.

### Drag hint (one-time)
- Rendered only if `localStorage["jiro-dragged"]` is unset: `<div class="bar-drag">` at `left 610px; top 872px`. It is a column flex container with `pointer-events none`.
  - `<span>`**drag a plate**</span>: 16px/1 px font, cream, `letter-spacing .04em`, background `rgba(11,10,9,.72)`, padding `6px 9px 5px`, shadow `0 3px 0 rgba(0,0,0,.5)`, `rotate(-4deg)`.
  - Below it, a hand-drawn pixel arrow SVG: viewBox 60×44 rendered at 120×88, `crispEdges`, fill `#f3e6cf`, margin `2px 0 0 40px`, `drop-shadow(0 2px 0 rgba(0,0,0,.7))`. The arrow curves from top-left down to bottom-right and ends in an arrowhead pointing down-right at the belt. Path:
    ```
    M2 4h6v2h-6zM8 6h6v2h-6zM14 8h4v2h-4zM18 10h4v2h-4zM22 12h2v2h-2zM24 14h2v2h-2zM26 16h2v2h-2zM28 18h2v2h-2zM30 20h2v4h-2zM32 24h2v2h-2zM34 26h2v2h-2zM36 28h2v2h-2zM38 30h2v2h-2zM40 32h2v2h-2zM42 34h2v2h-2zM44 36h2v2h-2zM46 38h2v2h-2zM40 40h10v2h-10zM48 30h2v10h-2z
    ```
- **Bob:** `bar-drag-bob 6s ease-in-out infinite`, from translate(0,0) to (3px,3px) at 50%.
- **Dismissal:** a `MutationObserver` watches `#frame`'s class. The first time `#frame` gets `.dragging` (a plate drag anywhere on the site), it sets `localStorage["jiro-dragged"]="1"`, adds `.gone` (opacity 0 over `.5s`), removes the node after 600 ms, and disconnects.
- **Reduced motion:** no bob.

### Enter / leave
None. The bar has no `enter`, `leave` or `click` hooks.

---

## 2. `office`: the back office (product tour)

![office](img/scene-office.jpg)

### Purpose and mood
A quiet, almost dark back room. A large clickable window of the real Nori Sessions UI (Playwright captures on fake data) fills the left two-thirds. The right column holds the title and a live caption. Tiny Jiro types at a tiny desk in the bottom-right corner, lit by a desk lamp, just above the belt. The belt runs straight across the bottom, left to right. It enters through a hatch at the far left, which is the bar's wall opening seen from behind.

### Art
- `public/art/office.jpg`: 1920×1080 RGB JPEG (135 263 bytes).
  - A dark aubergine-brown **vertical-plank wood wall** (planks about 45 to 50 px wide) fills the frame. A darker central area, x about 190 to 1740, is where the product window floats. A faint warm arc of lamplight spreads from the lower right (dithered, about 1000 to 1900 × 450 to 920).
  - **Desk group:**
    - Tiny desk at about x 1515 to 1700, y 800 to 925.
    - Beige CRT with a green terminal screen, housing about 1535 to 1645 × 700 to 820. The glass is a 2:1 isometric parallelogram `SCR = {x0:1586, x1:1631, top0:742, h:47}`: its top edge is `scrTop(x) = 742 − (x−1586)/2`, and on-screen cells snap to `cellY(x) = 742 − floor((x−1586)/4)·2`.
    - Yellow sticky notes under the screen at about 1586 to 1642 × 788 to 812.
    - Keyboard at about 1595 to 1680 × 790 to 850.
    - Green tea cup at about (1602,832).
    - Brass desk lamp with bulb at **(1667,746)**; stem at about 1650 to 1684 × 715 to 785.
  - **Jiro**, seated in three-quarter back view, spans about 1650 to 1790 × 700 to 925. He has the copper dome, white hachimaki, striped happi and copper hands on the keys. His visible eye is the rect **(1694,742) 10×14** with a blue glow.
  - The desk group has a 2 px pixel grid, so every code overlay is drawn in 2 px cells snapped to even coordinates.
  - **Belt, painted in the art:**
    - top copper rail line at y ≈ 925 to 935
    - dark tread with scalloped slat marks at y ≈ 940 to 995
    - thick copper front rail at y ≈ 1000 to 1035
    - dark floor strip below
  - **Hatch:** a black square with a copper frame at x 0 to 66, y ≈ 897 to 1008, at the left end of the belt.
- `public/art/office/hand-l.png` (31×24 RGB) and `hand-r.png` (34×26 RGB): opaque cut-outs of Jiro's copper hands on the keyboard, in two poses. Each includes its keyboard background, so it just overwrites the art.
- **Code-painted props** (no files; 2 px-cell character-map sprites cached as canvases, palette `PAL` in `office.ts`):
  - Wall shelf at **(1422,628)**, a 120×56 canvas: plank on two brackets with its wall shadow, four upright books (navy, rust, grey, green; gilt bands), one leaning book, a flat navy book, and a bonsai at the right end.
  - Lucky cat (8×10 cells) sitting on the flat book at (1494,632), with a 3×3-cell 2-frame beckoning paw at (1490,634).
  - Air vent at **(1798,604)**, 48×24, with louvres and four screws.
  - Sticky note taped to the wall at **(1812,636)**, 10×10 cells (`#c4a64e`, pen lines), animated (ambient 3).
  - Desk drawer front at **(1544,858)**, 44×16, on the desk's left side panel (2:1 slope), with a brass knob. A rubber duck (7×6 cells) lives inside.
  - Moth (5×3 cells, 2 wing frames).

### Belt
```ts
belt: { pts: [[-20,955],[1940,955]], width: 56, plate: 46, fadeIn: 60, fadeOut: 60 }
```
Horizontal at y 955, left to right, scale 1. The engine tread is drawn over the painted belt. The fades hide plates in the hatch on the left and off the right edge.
- **Falls:** `FALL_ZONES.office = {from .06, to .94, p .05, drop 88}`.

### Surfaces
| poly | scale | say |
|---|---|---|
| (1515,818) (1550,805) (1600,815) (1602,828) (1660,845) (1700,858) (1692,876) (1600,852) (1518,829) | 0.5 | Desk lunch. Crumbs in the keyboard are a feature. |
| (1538,725) (1566,703) (1622,698) (1644,707) (1641,717) (1580,728) | 0.46 | Warm. Keeps the tamago toasty. |
| (1690,718) (1704,703) (1742,703) (1757,716) (1741,724) (1700,724) | 0.46 | Balanced on Jiro's head. He keeps typing. |
| (1462,650) (1490,650) (1490,662) (1462,662) | 0.42 | Shelved between the books. Filed under: lunch, later. |

In order: the desk top, the top of the CRT, Jiro's head, and the wall shelf between the books and the lucky cat. The plates are tiny because the desk is tiny.

### Ambient animation
All drawn in `under` in this order, except where noted. `t` is the wall clock (click state); `h01(n, salt)` is an integer hash to 0..1.
1. **Shelf and lucky cat.** The shelf canvas is drawn at (1422,628). The cat's paw beckons in the first 0.5 s of every 3 s (frames alternate at 6 Hz), and at 8 Hz for 2 s after a cat click. Books egg: for 1.6 s the green book (canvas x 24 to 34) lifts up to 8 px (`sin` ease) over a dark gap.
2. **Vent**, static.
3. **Sticky note** in the vent's airflow. `air = 0.5+0.5·(0.6·wave(now,4) + 0.4·wave(now,1.5,1))`; a vent click adds `gust = sin(π·a/2.2)` for 2.2 s. The bottom `lift = min(4, round(1.6·air + 3.2·gust))` rows curl up (drawn darker), and each row below the tape ripples `ev(sin(2π·now/0.75 + 0.9r)·k²·(1.2 + 3·gust))` px.
4. **Lamp light** while the lamp is on (wall clock ≥ `lampOffUntil`):
   - `glow(1650,810,240,"rgba(255,180,100,.06)",now,.06,12)`
   - Bulb: `glow(1667,746,60,"rgba(255,210,140,.2)",now,.08,8,1)`
   - Beam: the quad (1656,752) (1680,752) (1712,836) (1622,836), a `lighter` vertical gradient `rgba(255,210,140,.10)` to 0 at alpha `0.85 + 0.15·wave(now,8)`. Inside it, 9 dust motes (2×2 `#ffe2b0`, periods 12/24/8 s) drift down and sideways, the cone widening as they fall.
5. **CRT glow:** `glow(1610,756,80,"rgba(120,255,150,.08)",now,.12,4,1)`.
6. **CRT screen** (clipped to the `SCR` parallelogram), a live terminal that follows the typing:
   - Background `#171d24`. Six command slots of 16 keystrokes each per loop (`keystrokes(now)` = seconds of typing so far × `RATE`, `RATE = 96 / 14.9 s`), so the screen is identical at 0 and 24 s.
   - Each slot is a command row (prompt pixel `#b6ffc8` then `cmdLen = 5..11` hashed 2×2 glyph cells in `#8ff0a8`) typed as the keys go down, and an output row (`outLen = 6..17` cells, `#4fae72`) printed 3 keystrokes after the command ends. Rows are 4 px apart, follow the glass slope, and the last 10 are visible.
   - A cursor sits after the command being typed; while Jiro thinks it blinks (`now mod 1 < 0.5`).
   - Phosphor overlay `#7dff9a` at alpha `0.05 + 0.03·(0.5+0.5·wave(now,4)) + 0.015·wave(now,0.25)`; scanlines (1 px black at .22 every 2 px, following the slope); a 4 px `#b6ffc8` band at .1 rolling down every 6 s; a small white glass highlight in the top-left corner.
   - **Screensaver** (6 s after a CRT click): `#0c0f18` background, three winged nigiri (2-frame flap at 5 Hz) gliding from upper right to lower left, and four green stars.
7. **Typing hands.** Bursts in the loop: 0.4–2.6, 3.4–6.1, 7.0–7.8, 9.2–12.6, 13.4–14.2, 15.6–18.4 and 19.3–21.5 s, with thinking pauses between. While typing, a hand is drawn while the fractional keystroke is ≤ 0.6 (finger down), alternating by keystroke parity (a hashed 30% repeat the same hand). `hand-r.png` at (1656,793) or `hand-l.png` at (1625,809).
8. **Eye.** Each 4 s window (6 per loop) is hashed: 25% skip the blink; otherwise a 0.2 s blink at `0.4 + 3·h` s (half-lid 0.05 s, closed 0.1 s, half-lid 0.05 s), and 30% add a second blink 0.32 s later. The lid is `#cfb690` over the eye rect (full or half height) with a 2 px `#a08a66` lower edge; closed adds a 4×2 `#3a5a6c` line at (1697,750). Open: `glow(1699,748,10,"rgba(120,200,255,.32)",now,.15,6,2)`.
9. **Drawer** (drawer egg): opens over 0.3 s, holds, closes 4.0–4.3 s. The front slides out in up to 4 steps of (−4,+2), showing the dark interior; once more than 60% open the duck bobs up out of it.
10. **Lamp off:** a radial dark `rgba(6,4,4,.6)` to 0 (r 20 to 300 around 1660,780) over (1360,480,560,446), the bulb painted dark `#3a2418` (1660,744,14,6), and an extra CRT glow `glow(1610,756,60,"rgba(120,255,150,.12)",…)`: the CRT is the only light.
11. **Tea steam:** `steam(1602,832,now,0,40,2,.3)`.
12. **Moth.** Flits under the shade around (1668,758) (x: 16 px at 1.5 s plus 5 px at 0.8 s; y: 7 px at 2 s plus 3 px at 0.6 s; wings at 12 Hz). From about 13.4 to 19.6 s it eases onto the shade's crown (1664,716) and rests, flicking its wings every 3 s. With the lamp off it flutters at the CRT around (1612,736). After a moth click it does a startled 1.2 s loop-the-loop. Its hotspot button follows it every frame.
13. **`over`:** `shade(g,0,0,1920,180,0.5,180,"top")` darkens the top edge from 0.5 to 0 over 180 px. It sits under the site header.

### DOM
- `<section class="copy office-head" style="left:1370px;top:100px;width:440px">`:
  - `p.kicker` **Back office**
  - `h2.px` **Your agents, on shift.** at 46px (override in `style.css`)
- **Product window** (`mountProduct`, `src/content/product.ts`): `div.product-win` placed at **x 60, y 80, width 1250**. Everything uses border-box sizing. It is about 830 px tall, so the bottom sits near y 912, just above the belt.
  - The window has background `#0f0d0c`, `2px solid rgba(243,230,207,.16)`, and shadow `0 30px 80px rgba(0,0,0,.7), 0 0 0 1px #000`.
  - `.chrome`: flex, gap 8, padding `10px 14px`, background `#1a1714`, bottom border `1px rgba(243,230,207,.1)`.
    - Three 12 px circles in `#3a332d` (traffic lights).
    - `span.url`: 15px mono, muted, margin-left 12, background `#0f0d0c`, padding `5px 14px`, radius 6. Its initial text is "norisessions.com", replaced on load by `spec.url`, which is **acme.norisessions.com**.
  - `.screen`: relative, full width, `aspect-ratio` set from JSON to `1600 / 1000` (CSS fallback 16/10), background `#111`.
    - `<img alt="Nori Sessions">` with `object-fit: cover`.
    - `div.hots`, absolutely filling the screen.
- **Caption column:** `div.product-cap` placed at **x 1370, y 380, width 400**.
  - `p.hint`: **Click around. It's the real Nori UI.** 16px px font, green, margin `0 0 18px`.
  - `p.caption`: the current state caption. `26px/1.45` sans, `#e7d8bf`, `min-height 5.8em`, `text-shadow 0 2px 8px #000`.
  - `p.steps`: **`<n> of 10 screens explored`**. 15px mono, muted, margin-top 16.
  - If the JSON fetch fails, the caption shows **Product capture loading…**.
- **Hot zones:**
  - Each hotspot is a `<button class="hot">` positioned in % of the screenshot. The first in each state gets `.lead`.
  - Style: transparent, `2px solid transparent`, radius 6. On hover: background `rgba(111,220,140,.12)` with a green border.
  - `.lead` pulses: `hotpulse 3s ease-in-out infinite`, with box-shadow going from `0 0 0 0 rgba(111,220,140,0)` to `0 0 0 4px rgba(111,220,140,.35)` at 50%.
  - Each has `title` and `aria-label` set to the label. A click plays sfx `pop` and calls `go(to)`.
- **Loading:** all 10 state images are preloaded on load, and the tour starts at `chat`. Each `go()` adds the state to `visited` and updates the steps text. When all 10 are visited it fires egg `product-tour`: "You clicked through the whole product. Jiro would hire you."
- **Scene CSS** (`office.css`):
  - `.bubble.office-bubble { font-size 18px; max-width 300px; padding 10px 14px }`
  - `.hit:hover { background: radial-gradient(closest-side, rgba(243,230,207,.08), transparent) }`

### Product states (`public/ui/product/states.json`)
- `width 1600, height 1000, start "chat", url "acme.norisessions.com"`. Every image is `ui/product/<id>.png`: 1600×1000, palette PNG.
- Hotspot rects are fractions of the screenshot, given as x, y, w, h.
- The screenshots show a dark Nori Sessions UI. On the left is a sidebar (logo "nori", Chat, Projects, Automations, Integrations, Search, filters). Its session list includes "Fix flaky checkout test", "jiro: refactor tuna-inventory service", "Nightly dependency bum…", "#alerts · payment webh…", "Add coupon codes to the…", "Draft the Q4 on-call runb…", "Omakase menu page: da…", "Postgres 17 upgrade plan" and "Wasabi feature flag clean…", with the user hana@acme.dev. The main pane is the chat for "@nori checkout.spec.ts has failed 3 of the last 10 CI runs on acme/checkout…".

| state | caption (verbatim) | hotspots (count): label → to @ x,y,w,h |
|---|---|---|
| `chat` | Mention @nori in Slack and a session spins up on its own machine. Watch it work and steer it from here. | **8**: Expand the work: every tool call → work @ .3544,.0705,.1013,.022 · Artifacts → code @ .7931,.0035,.0706,.036 · Open checkout.spec.ts → code @ .3544,.5219,.1053,.036 · New chat → new @ .9106,.0035,.0638,.036 · Conversation actions → menu @ .1375,.3691,.0188,.03 · Open "jiro: refactor tuna-inventory service" → done @ .0031,.3996,.1556,.038 · Chat: start a new session → new @ .0031,.045,.1556,.038 · Account and settings → settings @ .0031,.957,.1356,.038 |
| `work` | Every turn folds its work: thoughts, file reads, edits and commands, one click away. | **5**: Fold the work away → chat @ .3544,.1935,.1013,.022 · Open "Fix flaky checkout test" → chat @ .0031,.3656,.1556,.038 · Open "jiro: refactor tuna-inventory service" → done @ .0031,.3996,.1556,.038 · Chat: start a new session → new @ .0031,.045,.1556,.038 · Account and settings → settings @ .0031,.957,.1356,.038 |
| `code` | Code, tables and pull requests the agent produces collect in the artifacts pane. | **5**: Close artifacts → chat @ .9758,.011,.0161,.026 · then the same 4 sidebar hotspots as `work` (Fix flaky → chat, jiro: refactor → done, new session → new, settings → settings) |
| `done` | Finished work lands as a pull request with CI green. The session stays live for follow-ups. | **5**: Open the pull request → pr @ .3544,.5251,.232,.036 · New chat → new @ .9106,.0035,.0638,.036 · Open "Fix flaky checkout test" → chat @ .0031,.3656,.1556,.038 · Chat: start a new session → new @ .0031,.045,.1556,.038 · Account and settings → settings @ .0031,.957,.1356,.038 |
| `pr` | Pull requests open straight from the conversation. | **5**: Close → done @ .9758,.011,.0161,.026 · then the 4 sidebar hotspots as in `work` |
| `new` | Start a session from the web: pick a model and skillset, and a fresh machine picks it up. | **4**: Switch model → model @ .3685,.6148,.0676,.034 · Open "Fix flaky checkout test" → chat @ .0031,.3656,.1556,.038 · Open "jiro: refactor tuna-inventory service" → done @ .0031,.3996,.1556,.038 · Account and settings → settings @ .0031,.957,.1356,.038 |
| `model` | Switch models per session: Claude, Codex and more from one picker. | **2**: Use Claude Opus 5.5 → new @ .3692,.461,.1729,.038 · Close the picker → new @ .3685,.6148,.0676,.034 |
| `menu` | Every session is a real machine: rename it, archive it, or release it back to the pool. | **2**: Release → release @ .0656,.4894,.0875,.0348 · Close the menu → chat @ .1375,.3691,.0188,.03 |
| `release` | Releasing stops the agent and returns its machine to the pool. | **1**: Cancel → chat @ .5156,.527,.0522,.04 |
| `settings` | Completion alerts, connected integrations and org settings live one click away. | **1**: Close settings → chat @ .2377,.0123,.0161,.026 |

Total: 10 states and 38 hotspots.

### Hotspots and easter eggs (office)
Plain `.hit` buttons with a native title.

| name | rect | sfx | effect | egg id: toast |
|---|---|---|---|---|
| Tiny Jiro | 1668,700,124,190 | blip | bubble at 1500,640 for 2800 ms, class `office-bubble`, cycling "Shh. I'm in the middle of a refactor." / "Twelve agents on shift. I'm just the night manager." / "It works on my machine. And on yours. That's the point." / "I don't need a bigger desk. I need fewer flaky tests." | `office-jiro`: "Tiny Jiro works in the corner so the product gets the spotlight." |
| CRT | 1580,712,58,80 | chime | 6 s flying-nigiri screensaver (ambient 6) | `office-crt`: "Screensaver engaged: flying nigiri. Jiro's After Dark license from 1994 still works." |
| Tea | 1588,822,28,26 | blip | none | `office-tea`: "Genmaicha at 62 °C: Jiro's only unpinned dependency." |
| Desk lamp | 1650,712,34,44 | bonk | Toggle: if on, off for 4 s (`lampOffUntil = t+4`); if already off, back on immediately | `office-lamp`: "Lights out. Jiro keeps typing, the moth switches to the CRT." |
| Sticky notes | 1586,788,56,24 | pop | none | `office-sticky`: "Sticky note: \"TODO: stop writing TODO notes. (J)\"" (the note text is wrapped in real double quotes) |
| Desk drawer | 1528,850,72,40 | quack | Drawer opens, duck bobs (ambient 9); ignored until the previous opening has closed | `office-drawer`: "Bottom drawer: one rubber duck. Senior debugging staff, on call since forever." |
| Air vent | 1792,598,60,90 | whoosh | 2.2 s gust on the sticky note | `office-vent`: "The vent note reads \"do not block airflow\". It is the only thing blocking airflow." |
| Lucky cat | 1488,622,30,36 | coin | Paw beckons fast for 2 s | `office-cat`: "The lucky cat beckons green builds. Results so far: suspiciously good." |
| Books | 1422,628,42,30 | pop | Green book slides up and back (1.6 s) | `office-books`: "\"Clean Code for Robots\", 2nd edition. Chapter 1: stop oiling your keyboard." |
| Moth | 44×44 at (moth x−22, y−22), moves every frame | blip | 1.2 s loop-the-loop | `office-moth`: "The moth has been assigned to the lamp. It declined the reassignment." |
| Hatch | 0,897,66,111 | bonk | bubble at 30,830 for 2400 ms, class `office-bubble`: "Knock knock. It's a plate. It's on a deadline." | `office-hatch`: "The hatch from the bar: every plate passes the mouse family's code review first." |

Declared eggs: `office-jiro, office-crt, product-tour, office-tea, office-lamp, office-hatch, office-sticky, office-drawer, office-moth, office-vent, office-cat, office-books`.

### Enter / leave
None.

---

## 3. `dining`: the dining room (comparison)

![dining](img/scene-dining.jpg)

### Purpose and mood
A busy dining room full of customers, with no Jiro. Two large recording windows fill the screen and show the same ticket solved by a "Generic agent" and by "Jiro". The room is pushed into the background with a canvas desaturate-and-dim pass (the art file is untouched). The belt runs bright and wide along the counter in the foreground.

### Art
- `public/art/dining.jpg`: 1920×1080 RGB JPEG (277 953 bytes). A front-on view across the sushi counter into the dining room.
  - Two big wooden pillars stand at the left (x 0 to 110).
  - Ceiling beams at the top carry **six paper lanterns**, centred at (58,68), (270,92), (630,160), (1302,160), (1660,92) and (1873,68).
  - **Three swags of string lights** hang along y ≈ 70 to 110, from x 342 to 1583 (30 bulbs, coordinates listed under ambient item 10).
  - Plain grey-brown plaster wall panels with dark wood framing sit between y 170 and 440.
  - **Diners:** about 30 people in casual clothes sit at eight low wooden tables on tatami: a back row at y ≈ 430 to 600 and a front row of four tables at y ≈ 610 to 750. Front tables span x 158 to 548, 576 to 928, 992 to 1348 and 1374 to 1772; back tables sit at about 506 to 652 and 734 to 884.
  - **Double swinging kitchen doors** with round **portholes** at (1402,318) and (1546,318) span x ≈ 1335 to 1615, y 205 to 545.
  - An indigo noren doorway with a monstera plant sits to their right (x ≈ 1660 to 1820).
  - **Foreground:** a wooden counter top from y ≈ 755 to 960, with a recessed dark belt trough across it at about x 170 to 1850, y 775 to 805. Below it are the dark counter front and floor (y 960 to 1080).
- No sprite files. Diner, noren and lantern motion is cut from the art at runtime; the margin critters (spider, mouse, waiter cat) are painted in code in 5 px cells (`PX = 5`, the art's pixel).

### Belt
```ts
belt: { pts: [[-30,824,1.55],[1950,824,1.55]], width: 72, plate: 50, fadeIn: 30, fadeOut: 30 }
```
- Horizontal at y 824, left to right, scale 1.55. The effective width is about 112 px (y ≈ 768 to 880) and the plate diameter is about 78 px. Local speed is ×1.55.
- It covers the painted trough and the counter edge.
- **Falls:** `FALL_ZONES.dining = {from .08, to .92, p .05, drop 150}`.

### Surfaces
| poly | scale | say |
|---|---|---|
| (176,612) (548,612) (548,694) (158,694) | 0.95 | Table 4 didn't order this. They're keeping it. |
| (578,612) (928,612) (928,694) (576,694) | 0.95 | Table 7 is splitting it four ways. Git blame says it was you. |
| (992,612) (1348,612) (1348,694) (992,694) | 0.95 | Table 9 reviewed it. LGTM, very tasty. |
| (1376,610) (1770,610) (1772,694) (1374,694) | 0.95 | Table 12 thinks it's a free sample. Technically, it is. |
| (512,498) (652,498) (646,562) (506,562) | 0.72 | Table 2 asked for no wasabi. Jiro already filed a ticket. |
| (734,496) (884,496) (884,548) (734,548) | 0.72 | Table 3 is photographing it for the changelog. |
| (1098,500) (1204,500) (1210,550) (1094,550) | 0.72 | Table 5 is on a date. The plate is now part of the date. |
| (0,892) (1790,892) (1790,938) (0,938) | 1.4 | Parked on the counter. Jiro wipes around it, silently judging. |

The counter strip stops at x 1790, short of the waiter cat.

The tables sit behind the windows. **While a plate is being dragged** (`#frame.dragging`), `.cmp` and `.compare-head` drop to `opacity .06` (`.25s` transition on `.cmp`) so the tables show through.

### Ambient animation
Helpers (`t = now mod 24`): `ph(now, per)` = fraction through a period; `bump(now, per, a, b, ease=.2)` = a 0..1 trapezoid inside `[a,b)` of the period; `beat(now, per, a, b, hz)` = 1 on alternate beats of `hz` inside `[a,b)`. `slide(x,y,w,h,dx,dy)` redraws an art rect moved by (dx,dy) after refilling the vacated strip with the art just outside the rect. `shear(x,y,w,h,off)` shifts each 5 px row of an art rect by `off(rowFraction)` whole px.

1. **Diners** (`under`, smoothing off, only when the art is 1920 wide). Each diner has one distinct small motion, drawn back to front with `slide`. Most sit behind the windows and show at the edges or when the windows step aside during a drag.

   | x,y,w,h | motion (dx, dy) | who |
   |---|---|---|
   | 426,558,30,42 | `(0, −round(6·bump(12, .10, .42, .25)))` | brown jacket, back left: raises his cup |
   | 474,428,48,68 | `(0, −3·beat(12, .55, .8, 2.5))` | little girl, back left: bounces in her seat |
   | 1412,500,66,58 | `(round(2·bump(24, .2, .34, .15)), −3·beat(24, .22, .32, 5))` | pink sweater: laughs, then settles |
   | 1206,420,44,64 and 1250,434,50,66 | `(±round(4·bump(24, .45, .8, .12)), 0)` | couple, back right: lean in toward each other |
   | 788,560,56,48 | `(0, −3)` while `bump(8, .1, .32) > .5` | light-blue shirt: lifts his chopsticks |
   | 312,562,50,44 | `(0, −2)` while `bump(6, .6, .8) > .5` | left woman, front table: chopsticks |
   | 1566,478,70,100 | `(0, −2·beat(24, .3, .45, 3))` | man by the doors: chews (tiny nods) |
   | 1198,502,52,60 | `(round(2·bump(12, .7, .9)), 0)` | scarf woman: glances over |
   | 1658,552,66,60 | `(−round(2·bump(24, .55, .8)), 0)` | blue shirt, right: turns to his friend |
2. **Noren in a draught** by the kitchen doors: panels x 1662–1711, 1712–1777 and 1778–1823, rows y 214 (pinned) to 362 (hem). `shear` offset `round(4·gust·f²·wave(now,4, 1.3i + 1.2f))`, `gust = 0.55 + 0.45·max(0, wave(now,12,.3))`.
3. **Lanterns sway** from their cords. `shear` of each rect `[x,y,w,h,period,phase]` = [0,0,126,156,8,.4] [210,10,120,170,6,1.9] [586,100,84,124,12,3.1] [1250,100,84,124,8,4.4] [1590,10,122,176,6,5.2] [1790,0,130,160,12,.9], with offset `round(sway·f)` and `sway = 4·(0.75·wave(now,per,p) + 0.25·wave(now,per/2,1.7p))`: the bottom moves at most 4 px.
4. **Tea steam:** `steam(x,y,now,seed,56,3,.16)` at (890,604) seed 0, (1266,608) seed 2.2, and (617,632) seed 4.1.
5. **Dim pass** (`LEDGE = 768`):
   1. With `globalCompositeOperation="saturation"`, fill `rgba(128,128,128,.5)` over y 0 to 768 and `rgba(128,128,128,.2)` over y 768 to 1080. This half-desaturates the room above the counter and lightly desaturates the counter.
   2. With `source-over`, fill a vertical gradient over y 0 to 768 with stops `0 rgba(7,5,4,.56)`, `.75 rgba(7,5,4,.5)` and `1 rgba(7,5,4,.36)`.
   3. Fill `rgba(7,5,4,.2)` over y 768 to 1080.

   The belt is drawn after this pass, so it stays bright.
6. **Lanterns through the dim**, for each `[x,y,r]` = (58,68,170), (270,92,190), (630,160,150), (1302,160,150), (1660,92,190), (1873,68,170), with `gx = x + 0.55·sway_i` so the glow follows the sway:
   - `glow(gx,y,r·0.8,"rgba(255,196,120,.3)",now,.08,6,i)`
   - `glow(gx,y,r·0.3,"rgba(255,214,150,.22)",now,.05,12,i+1)`

   Portholes: `glow(x,y,60,"rgba(255,210,130,.16)",now,.12,8,i·2)` at (1402,318) and (1546,318).
7. **Flaky-lantern egg** (`FLICK = 4`, the lantern at (1660,92) in the top right, visible above the windows). For 1.6 s after a click, on frames where `floor(elapsed·7)` is even, skip that lantern's glows and fill `rgba(10,6,4,.6)` over (1602,12,122,165). It flickers at about 3.5 Hz.
8. **Spider** on a thread in the gap between the windows (x 945), drawn after the dim. Thread `rgba(225,205,175,.42)` 1 px from y 124; body 9×13 `#2a1c15` with a lantern rim-light and two pale eye pixels, 3 legs a side on a 2 Hz 2-frame cycle. It drifts at `y = 236 + snap5(26·wave(now,24,.6) + 8·wave(now,8,1.3))`. Click: zips up to y 150 in 0.35 s, hangs until 1.8 s, and lowers back over 1.4 s.
9. **Mouse hole** in the counter front, centre-bottom (612,1046): a dark arch with a `#3a2630` frame. Two pale eyes glint inside; the mouse peeks out once per loop (14.5–18 s, half out for the first and last 0.5 s) and fully for 2.4 s after a click; it blinks when `t mod 6 > 5.85`.
10. **String-light twinkle** (`over`, `lighter`). For each of the 30 bulbs:
    - `a = 0.1 + 0.12·(0.5+0.5·wave(now,[6,8,12,24][i%4], i·1.9))`
    - Lights egg: for 3.5 s a chase runs along the string, `a = ((floor(elapsed·14) − i) mod 6) < 2 ? .55 : .04`.
    - Draw an 8×8 core `rgba(255,205,120,a)` centred on the bulb and an 18×18 halo `rgba(255,190,100,a·.35)`.
    - Bulbs: (342,86) (382,98) (425,106) (476,106) (515,100) (552,86) (583,72) (660,72) (689,86) (728,98) (767,106) (818,106) (861,98) (901,87) (936,72) (985,71) (1020,86) (1062,99) (1104,106) (1155,106) (1194,99) (1231,86) (1261,72) (1342,72) (1373,87) (1408,96) (1448,106) (1499,106) (1543,100) (1583,87).
11. **Waiter cat** (`over`, so plates pass behind it) sitting on the counter's right corner, bottom-left at (1812,934): an orange-and-cream cat in 5 px cells (13×9 head, 13×7 body with a bow tie, 3-frame tail) with a soft contact shadow. The tail flicks at 0.70–0.86 of every 6 s; it blinks every 4 s (`t mod 4 < 0.14`) and at 13.0–13.12 s; the right ear twitches at 17.0–17.25 s. Click: a 1.6 s waiter's bow (head dips 2 cells, eyes shut).

### DOM (`mountCompare`, `src/content/compare.ts` + `dining.css`)
- **Header:** `<section class="copy compare-head">` placed at **x 30, y 74, width 1560**. It is flex with baseline alignment, `gap 26px` and `nowrap`.
  - `h2.px`: the default text **Same ticket. Two kitchens.**, replaced by `spec.title` (the same string). 32px, line-height 1.
  - `p.ticket`: **Ticket #482 · Checkout total is wrong when a coupon and a gift card are combined**. 18px mono, muted, margin 0, `text-shadow 0 2px 0 rgba(0,0,0,.8)`, ellipsis on overflow.
- **Two windows:** `<figure class="cmp left|right" data-side tabindex="0" role="button">`.
  - Positions: `COMPARE_BOX.left = [28,128,902]` and `right = [960,128,902]` (x, y, width). The height is automatic, about 604 px, so the bottoms sit at about y 732, just above the belt.
  - Frame: margin 0, `cursor:pointer`, `z-index 1`, background `#0e0c0b`, `border 6px solid #3b2517`, `outline 2px solid #1a0f08`.
    - Box-shadow: `inset 0 0 0 2px rgba(217,138,74,.45), 0 18px 40px rgba(0,0,0,.7)`.
    - The right window adds a green inner line and glow: `inset 0 0 0 2px rgba(111,220,140,.55), …, 0 0 30px rgba(111,220,140,.14)`.
    - Transitions: `box-shadow .2s, opacity .25s`.
  - **Hover and focus:**
    - Left: inset copper line, shadow `0 22px 46px rgba(0,0,0,.75)`, copper outline.
    - Right: inset green line, `0 0 34px rgba(111,220,140,.22)`, green outline.
  - `figcaption`: flex, baseline, gap 18, padding `8px 12px 7px`, background `#1a1714`, nowrap.
    - `<b>` label: 19px px font. It is **Generic agent** on the left in cream and **Jiro** on the right in green.
    - `span.verdict`: `margin-left:auto`, 15px mono, ellipsis. The left verdict is cream and the right is `#cfe9d5`.
  - `<video muted playsinline loop preload="auto">` with `display:block`, `width 100%`, `aspect-ratio 16/10`, background `#0b0a09`. The rendered size is about 890×556.
  - The `title` is the stats joined by " · ". The `aria-label` is "`<label>: <verdict> <stats joined by ", ">. Click to replay.`". **Stats are not rendered visibly.** They live only in the title and aria-label.
- **Scene bubble override:** `.bubble { font-size 20px; max-width 360px }`.

### Compare data (`public/ui/compare/compare.json`)

| | left | right |
|---|---|---|
| label | Generic agent | Jiro |
| verdict | Says “All tests pass”. The combo total is still wrong. | Failing test first, root cause named, one-function fix. |
| stats | 7 files · +149 −29 / 16× as any / 1 test skipped / 0 new tests | 2 files · +32 −8 / 114 tests passing / 2 regression tests / PR #483 opened |
| video | ui/compare/generic.mp4 | ui/compare/jiro.mp4 |
| poster | ui/compare/generic.jpg (1280×800) | ui/compare/jiro.jpg (1280×800) |

- The title is "Same ticket. Two kitchens." and the task is "Ticket #482 · Checkout total is wrong when a coupon and a gift card are combined".
- The verdict quotes are curly (“ ”), and the minus signs are U+2212 (−).
- **Videos:** both are H.264 (`avc1`), 1280×800, 25 fps (849 frames, timescale 12800, 512 ticks per frame), **34.0 s** long, and loop. `generic.mp4` is 2 678 573 bytes and `jiro.mp4` is 2 559 639 bytes.
- **Video content:** Playwright recordings of a mock terminal agent pane, with a "● ● ● `<name>` · checkout-svc" title bar, a "working" status and the ticket quote at the top.
  - The generic agent says "I'll fix the checkout total calculation! Let me explore the codebase." and then searches "total|coupon|gift" (47 matches in 19 files).
  - Jiro reads `src/checkout/total.ts` and `src/checkout/adjustments.ts` first.
- **Click behaviour:** a click (or Enter / Space) on a window sets `video.currentTime = 0`, calls `play()`, and plays sfx `blip`. Clicks per side are counted:
  - The 3rd left replay fires egg `slop`: "You watched the generic agent three times. It still didn't run the tests."
  - The 3rd right replay fires egg `dining-jiro`: "Third replay. The diff is still 32 lines. Watching harder won't make it longer."
- **Dim overlay:** there is no DOM overlay. The "dim" is the canvas pass in ambient item 5. While a plate is dragged, the windows and header go to 6% opacity.

### Hotspots and easter eggs
| name | rect | sfx | effect | egg id: toast |
|---|---|---|---|---|
| Lantern | 1608,22,104,110 (lantern 4 at 1660,92) | bonk | flicker 1.6 s | `dining-lantern`: "Flaky lantern. The generic agent marked it @skip. Jiro filed a bug." |
| Left window | 28,128,902×~604 | blip | replay | `slop` on the 3rd click (text above) |
| Right window | 960,128,902×~604 | blip | replay | `dining-jiro` on the 3rd click (text above) |
| Spider | 931,140,28,150 | whoosh | zips up the thread | `dining-spider`: "Not a bug. It's the thing that eats the bugs. It stays." |
| Waiter cat | 1802,854,78,82 | meow | bows | `dining-cat`: "The waiter cat bows. It takes no orders, but it accepts all tuna." |
| Mouse hole | 590,1014,60,34 | blip | mouse peeks out 2.4 s | `dining-mouse`: "A mouse. It's waiting for a plate to fall off the belt. It has been waiting since v1." |
| String lights | 330,62,1270,50 | chime | 3.5 s chase | `dining-lights`: "Wired in series: one bulb fails, they all fail. Jiro rewired them in parallel." |

Declared eggs: `slop, dining-jiro, dining-lantern, dining-spider, dining-cat, dining-mouse, dining-lights`.

### Enter / leave
- `enter()`: every `<video>` in the layer gets `currentTime = 0; play()`, so both recordings start in sync from the beginning each time you arrive.
- `leave()`: every video is paused.

---

## 4. `kitchen`: the kitchen (FAQ)

![kitchen](img/scene-kitchen.jpg)

### Purpose and mood
A lively, warm kitchen. Jiro stands at the cutting board on the right, with the pass shelf and rice tub in the middle and open saloon-style swinging doors on the left leading into the dim dining room. Eight kawaii sushi sit on the customer ledge in front, each with a bobbing "?" bubble. Clicking one makes Jiro answer in a big comic speech bubble whose tail comes from his speaker grille, and the grille lights up while he talks. The belt comes out of the doorway behind the left door leaf and runs diagonally down to the bottom-right edge. The bible calls the mood "medium"; the code says `bustling`.

### Art
- `public/art/kitchen.jpg`: 1920×1080 RGB JPEG (354 674 bytes). Isometric view from the front-left.
  - **Left third:** a brown tiled wall, darkened in code. The **doorway** (frame about x 470 to 790, y 95 to 690) holds two **open swinging door leaves** with porthole windows, swung toward the viewer:
    - left leaf outline (499,304) (512,280) (530,246) (553,241) (554,543) (505,599) (499,599)
    - right leaf outline (696,221) (720,221) (752,256) (782,275) (782,557) (696,520)
    - Behind them is the dim dining room with a small hanging oil lamp at about (635,300).
  - **Three ceiling lanterns** at (941,40), (1406,48) and (1872,78).
  - **Pass shelf**, about 810 to 1370 × 120 to 480: stacks of plates and bowls on top, and an under-shelf heat-lamp strip glowing orange at about (950 to 1260, 200 to 250). Trays of gunkan maki and nigiri sit on the lower shelf at about 910 to 1360 × 310 to 430.
  - **Knife rack** on the wall with three knives, blades at x ≈ 1392, 1433 and 1478, y ≈ 185 to 340.
  - **Jiro** stands at about 1400 to 1780 × 250 to 750, facing us: copper dome, hachimaki with the knot on his left, faceplate with two blue eyes, speaker grille around **(1560 to 1600, 405 to 425)**. The tail target MOUTH is (1560,414). His copper hands rest on a wooden cutting board, about 1330 to 1785 × 650 to 800.
  - **Stove** with a steaming pot on the far right, about 1770 to 1910 × 355 to 520.
  - **Rice hangiri tub**, steaming, at about 1050 to 1260 × 495 to 640. A **plate stack** stands left of it at about 920 to 1045 × 520 to 650. A sink with a wooden board sits at about 1260 to 1500 × 400 to 580.
  - **Pass counter:** a stainless top with a tile-edged trough runs diagonally from the doorway (about 505,560) to the bottom right. This is the belt line.
  - **Customer ledge:** a wooden ledge in front of it, top-surface centre line `y = 855 + (x − 700)·0.37`.
  - **Bottom right:** stacked bowls and a wooden tub lid at about 1730 to 1920 × 740 to 900.
- Face overlays `jiro-blink.png`, `jiro-look.png` and `jiro-look-blink.png`: 88×100 RGBA, drawn at **(1536,330)** (`FACE_X, FACE_Y`). All three are built from the art by `tools/art/kitchen/face.py` (Pillow, numpy, scipy): it cuts the 88×100 face patch, finds each eye (blue pixels plus the dark ring around them), paints the eyes out with the faceplate's cream per row, then:
  - `jiro-look`: pastes the eyes back shifted toward the ledge (right eye −4,+4; left eye 0,+4), so he glances down-left by one art pixel;
  - `jiro-blink`: a 2 px ink line across each eye centre;
  - `jiro-look-blink`: the same lines at the look offset.

  Only pixels that differ from the art are opaque.
- `public/art/kitchen/jiro-talk.png`: 88×100 RGBA, drawn at **(1536,330)**. Only the grille bars in bright cyan (about 5 vertical bars near the bottom right of the patch), so the grille lights up.
- `public/art/kitchen/faq-<item>.png`: 2-frame horizontal sprite sheets, 320 px wide (two 160 px frames). Frame 0 is eyes open and frame 1 is the blink or alternate face. All are kawaii sushi with tiny faces:

  | item | size | subject |
  |---|---|---|
  | tuna | 320×128 | maguro nigiri |
  | salmon | 320×125 | salmon nigiri |
  | tamago | 320×126 | egg nigiri with nori band |
  | ikura | 320×160 | ikura gunkan |
  | maki | 320×133 | three hosomaki |
  | ebi | 320×132 | shrimp nigiri |
  | onigiri-happy | 320×160 | smiling onigiri with blush |
  | onigiri-sleepy | 320×160 | sleeping onigiri, eyes closed |
- `public/items/cat.png`: 160×103 RGBA, the shared kitchen-cat sprite.

### Belt
```ts
belt: { pts: [[505,560,0.784],[1945,993,1.12]], width: 54, plate: 50, fadeIn: 70, fadeOut: 20 }
```
- A single straight diagonal. Plates appear out of the dim doorway behind the left door leaf, fading in over 70 px, and follow the painted trough off the right edge. The kitchen→storage transition continues it.
- **Falls:** `FALL_ZONES.kitchen = {from .56, to .9, p .05, drop 140}`, on the lower right of the pass, clear of the doors.
- **Door leaves in `over`** (drawn over the belt so plates come from *behind* the left leaf). For each leaf `i` with hinge x `hx` (499 for the left leaf, 782 for the right):
  - Take the leaf's bounding box (left: x 499 to 554, w 55, y 241 to 599; right: x 696 to 782, w 86, y 221 to 557).
  - Draught sway: `sway = 1.5·(1 − cos(2π(now + 4i)/12))/2` px, at most 1.5 px at the free edge, 12 s period.
  - Kick after a click: `kick = |sin(6·age)|·e^(−2.2·age)` for age < 2 s, otherwise 0.
  - Horizontal scale about the hinge: `sx = 1 + sway/w + 1.1·kick`. Translate(hx), scale(sx,1), translate(−hx).
  - Clip to the leaf polygon, then draw the art bbox 1:1. If kick > .02, fill `rgba(8,5,3, .25·min(1,kick))` over the bbox (a leaf turning away catches less light).
  - Reset the transform and re-apply `shade(0,0,900,1080,.5,500,"left")` inside the clip so the leaf matches the shaded wall.

### Surfaces
| poly | scale | say |
|---|---|---|
| (466,800) (545,766) (600,757) (1585,1080) (1161,1080) (470,812) | 0.95 | On the pass. Order up! |
| (1332,694) (1420,650) (1560,658) (1742,662) (1784,732) (1690,802) (1334,704) | 0.9 | On the cutting board. Jiro eyes it with a knife. |
| (812,426) (860,396) (1010,352) (1160,322) (1342,316) (1372,338) (1300,374) (1000,432) (828,456) | 0.72 | Back on the shelf, next to its friends. |
| (812,180) (1000,152) (1330,118) (1342,134) (1000,184) (818,204) | 0.62 | Top shelf. Reserved for the good plates. |
| (1768,498) (1920,466) (1920,562) (1782,548) | 0.82 | Seared. Jiro approves. |

In order: the customer ledge, the cutting board, the pass shelf, the top shelf, and the stove. The rice tub is deliberately not a surface.

### Ambient animation (`under`)
1. `shade(g,0,0,900,1080,0.5,500,"left")`: solid 0.5 to x=400, fading to 0 at x=900. This darkens the left wall and doorway so the header reads.
2. **Jiro's face** (smoothing off):
   - Blink when `now mod 6 ∈ (5.2,5.34)` or `now mod 24 ∈ (17.52,17.64)`, which gives a double blink near 17.5 s.
   - Look toward the ledge during 8.0–10.6 s of each loop, and after an answer until `lookUntil = talkUntil + 1.5` (wall clock; reset on close and `leave`).
   - Overlay: `jiro-look-blink` (look and blink), `jiro-look`, `jiro-blink`, or nothing.
3. **Talking grille:**
   - While wall-clock `t < talkUntil`, the grille flickers like a level meter on 0.13 s frames cycling through three states (`floor(t/0.13) mod 3`): full `jiro-talk.png`, only its bottom 16 rows (source y 84 to 100, "low bars"), and dark. On the two lit frames it also draws `glow(1586,413,34,"rgba(120,220,255,.35)",now,0,6)`.
   - Talk length: `min(5, 1.2 + answer.length/45)` s for a FAQ answer, and 1.2 s for a poke.
4. **Lantern breathing:** `glow(x,y,190,"rgba(255,190,110,.16)",now,.08,6,i·1.3)` at (941,40), (1406,48) and (1872,78).
5. **Heat lamp:** `glow(1030,250,170,"rgba(255,160,70,.13)",now,.1,8,3)` and `glow(1200,250,…,4.2)`.
6. **Steam:**
   - Rice tub: `steam(1160,528,now,.1,150,6,.2)` and `steam(1185,530,now,3.1,120,6,.14)`
   - Pot: `steam(1838,378,now,1.7,140,6,.2)`
7. **Knife glints:**
   - For knives at x 1392, 1433 and 1478 (i = 0, 1, 2): `f = ((now + 2.67i) % 8)/0.7`, active while f<1 (0.7 s per knife, one knife after another within each 8 s).
   - The sparkle slides down the blade at `y = 200 + 90f`. Alpha is `0.9·sin(fπ)` and the colour is `#fffaf0`.
   - It is a plus shape: a vertical 3×12 at `(x−1, y−6)` plus a horizontal 11×3 at `(x−5, y−1)`, with coordinates rounded.
8. **Ladle** hanging off the end of the knife rack (smoothing off): a 9×24 character-map sprite in 4 px cells (the art's grid; `k #1b1216`, `l #c6babc`, `s #8a7f84`, `d #5b464b`), pivoting at (1506,234) on the top of column 4. Angle `0.045·sin(2π·t/6) + 0.02·sin(2π·t/4 + 1)` rad (draught sway, about one sprite pixel at the bowl), plus `0.32·sin(7a)·e^(−1.6a)` for 3 s after a click. Each cell is rotated, then snapped to the 4 px grid.
9. **Leaky tap** over the sink, one `#d8ecf2` drop every 4 s at (1380,472): it swells for the first 62% (2 then 4 px tall, alpha .25 to .85), falls 28 px (quadratic, snapped to 4 px) until 74%, then splashes as two 4×4 dots at (1376,500) and (1384,500) until 80%.
10. **Soot sprite under the stove**, clipped to the dark gap polygon (1768,652) (1900,692) (1920,696) (1920,744) (1792,744) (1768,716). Drawn with `drawSoot` from `src/transitions/bar-office/soot.ts` (seed 7, feet at y 740, x snapped to 4). Once per loop it scurries in from x 1916 to 1848 (9.0–9.8 s), looks left, ahead, then right (switching at 11.2 and 12.6 s), blinks at 10.3 and 12.0 s, and scurries back out (13.2–14.2 s). Click: it pops out 76 px wide-eyed within 0.25 s, stares until 1.4 s, and is back under by 2.4 s.
11. **Question sushi life** (`sushiLife`, run from `under` every frame; see DOM).
12. **`over`:** the door leaves (see Belt), drawn with smoothing off.

### DOM
- **Header** `<section class="copy k-head">` at `left 96px; top 96px; width 390px`:
  - `p.kicker` (15px, nowrap): **Kitchen · questions from the pass**
  - `h2.px`: **Ask the chef.**
  - `p.lede` (25px, `max-width 16em`): **Every sushi on the ledge has a question. Click one and Jiro answers.**
- **Question sushi.** There are 8 `<button class="faq-sushi" aria-label="<q>">`. For index i:
  - Position: `x = 580 + 82i`, `y = 852 + (x−700)·0.37 + (i odd ? +5 : −5)`, which alternates back and front rows.
  - Scale: `s = 0.86 + 0.022i`.
  - Size: `w = round(76s)` and `h = round(w·aspect)`, where aspect is the frame's h/w (tuna 128/160, salmon 125/160, tamago 126/160, ikura 1, maki 133/160, ebi 132/160, onigiri 1).
  - Placement: `(x − w/2, y − h, w, h)`, so the bottom centre sits on the ledge line.
  - Inline style: only `z-index: 10 + i%2`. All motion is driven from `kitchen.ts` (see "Sushi life" below).

  Computed:

  | i | item | x | y (bottom) | w×h | left,top | question (tooltip + aria) |
  |---|---|---|---|---|---|---|
  | 0 | tuna | 580 | 802.6 | 65×52 | 547.5,750.6 | Which coding agents can I run? |
  | 1 | salmon | 662 | 842.94 | 67×52 | 628.5,790.94 | Does it work with non-engineering tools? |
  | 2 | tamago | 744 | 863.28 | 69×54 | 709.5,809.28 | What does an agent's environment look like? |
  | 3 | ikura | 826 | 903.62 | 70×70 | 791,833.62 | How does billing work? |
  | 4 | maki | 908 | 923.96 | 72×60 | 872,863.96 | Is the output always a pull request? |
  | 5 | ebi | 990 | 964.3 | 74×61 | 953,903.3 | What repositories can I use? |
  | 6 | onigiri-happy | 1072 | 984.64 | 75×75 | 1034.5,909.64 | Is Jiro a real sushi chef? |
  | 7 | onigiri-sleepy | 1154 | 1024.98 | 77×77 | 1115.5,947.98 | Does Jiro ever sleep? |

  Each button contains:
  - `span.shadow`: `left 6%; right 2%; bottom −5px; height 12px`, radial `rgba(0,0,0,.55)` to 0.
  - `span.sprite`: the background is the sheet at `background-size 200% 100%`, `image-rendering: pixelated`, `transform-origin 50% 100%`, and `transform: translateY(var(--lift,0px)) rotate(var(--r,0deg)) scale(var(--sx,1), var(--sy,1))` with no transition.
    - Hover, focus-visible and `.on` set `--lift: -4px`.
  - `span.qb` "?": a 40×38 grid-centred cell at `bottom: calc(100% + 16px)`, centred horizontally, with `24px/1` px font.
    - Paper `#f6ead2` background and ink `#1b130d` text. The pixel border is four 3 px box-shadows in ink plus a drop shadow `0 7px 0 rgba(0,0,0,.35)`.
    - The `::after` tail is a 6×6 ink square at `top: calc(100% + 3px)` with `margin-left −5px` and `box-shadow 3px 3px 0 ink`.
    - Bob: set from code (see below), 0 to −7 px.
    - States: `.asked` green background; `.on` copper background with paper text, and `::before` overlays a copper "!"; hover `#fff6e4`.
  - `span.tip`: the question text, at `bottom: calc(100% + 70px)`, nowrap, background `#15110e`, cream, 19px sans, padding `7px 12px`, ring `0 0 0 2px rgba(243,230,207,.35)`.
    - Visible on hover and focus (`.15s`). Hidden while an answer is open (`.k-open`).
    - Focus-visible: `2px dashed copper` outline, offset 6.
- **Sushi life** (`sushiLife(now)`, pure functions of `now`, so they freeze with `?freeze=`). For sushi `i`:
  - Breathing: `br = 0.5 − 0.5·cos(2π·((now + 1.9i) mod 24)/per)` with `per = [6,8,12,6,8,12,6,8][i]`; `sy = 1 + .035·br`, `sx = 1 − .02·br`.
  - Habit: a 1.6 s window once per 12 s, staggered by `1.5i`, with `on = sin(π·w/1.6)`. By `i mod 4`: 0 wiggles (`r = 3·sin(7w)·on` deg), 1 turns to look around (`sx ·= 1 − .12·on`), 2 yawns (`sy ·= 1 + .06·on`, `sx ·= 1 − .05·on`), 3 leans over to its neighbour (`r = −4·on`).
  - While `.on` (being answered) it faces Jiro: `sx ·= 0.9`, `r += 2`.
  - Blink: `background-position: 100% 0` (frame 1) when `(now + 2.3i) mod 6 > 5.7`, i.e. 0.3 s every 6 s.
  - "?" bob: `transform: translate(-50%, −bob px)` with `bob = round(7·(0.5 − 0.5·cos(2π·((now + 1.37i) mod 24)/6)))`, whole pixels.
- **Answer overlay:** `div.k-ask[aria-live=polite]`, `position:absolute; inset:0; z-index 30; pointer-events none`. It contains:
  - `svg.k-tail`: 1920×1080, `overflow visible`, holding one `<path>` with fill paper `#f6ead2`, stroke ink, `stroke-width 6`, `stroke-linejoin miter`.
  - `div.k-answer[role=dialog][aria-label="Jiro's answer"]`, placed at **x 470, y 270, width 900**.
    - Padding `30px 44px 36px`, paper background, ink text. The pixel border is 6 px ink box-shadows on 4 sides plus `0 16px 0 rgba(0,0,0,.45)`.
    - Closed: `transform: scale(.55) translate(30%,10%)`, `transform-origin 100% 20%`, opacity 0.
    - Open (`.k-ask.on`): `transform:none; opacity:1`, with `transition: transform .3s cubic-bezier(.2,1.35,.4,1), opacity .18s`. It pops out from Jiro's side.
    - `button.x` "×" (aria "Close answer"): absolute `right 14 top 12`, 48×48, `40px/1` sans, ink. Hover background `rgba(27,19,13,.08)`.
    - `p.who`: **Jiro says**. `16px/1` px font, `#7c5a3c`, `letter-spacing .08em`, uppercase, margin-bottom 14.
    - `p.q`: the question, `30px/1.2` px font, `#8a4a1e`, margin-bottom 18, padding-right 40.
    - `p.a`: the answer, `500 31px/1.42` sans.
  - `i.k-plug`: a paper rectangle that hides the stroke seam where the tail meets the card.
  - The tail and plug fade in (`.15s`, delay `.08s` when opening).
  - Pointer events: only the live, open card receives them.
- **Tail geometry** (computed on open):
  - `r = 470+900 = 1370`, `h = card.offsetHeight`, `y0 = 270 + min(70, 0.25h)`, `y1 = y0 + 70`.
  - Path: `M r−20 y0 Q r+90 y0+6 1560 414 Q r+80 y1−6 r−20 y1 Z`.
  - Plug: `place(plug, r−8, y0+5, 14, y1−y0−10)`.
- **Opening a question:**
  1. `stopPropagation`, sfx `blip`.
  2. Remove `.on` from the other sushi; add `.on` and `.asked` to this one.
  3. Fill in q and a.
  4. Restart the pop: remove `.on`, force a reflow, lay out the tail, add `.on`.
  5. Add `.k-open` to the layer.
  6. Set `talkUntil`, and `lookUntil = talkUntil + 1.5`.
  7. Record the index. When all 8 have been asked, fire egg `faq-all`: "You asked every question. Jiro is impressed. And a little tired."
- **Closing:** the × button, the **Escape** key (a global keydown listener, active only while open), any canvas click in the scene (the scene's `click()` clicks the open card's `.x` and returns false), or `leave()`. Closing removes `.on` and `.k-open`, sets `talkUntil = 0` and `lookUntil = 0`, and clears `.on` from the sushi. Clicks inside the card stop propagation.
- **Scene CSS extras:**
  - `.bubble.k-small { font-size 24px; white-space nowrap; max-width none }`
  - Kitchen cat: `div.k-cat` placed at **935,452, 100×74**, `overflow hidden`, `pointer-events none`. Inside is `<img src=items/cat.png>` pinned bottom-left at 100% width, pixelated, `translateY(105%)` when hidden and `translateY(18%)` when `.on`, with `transition .45s cubic-bezier(.3,1.4,.5,1)` (springy peek).
  - Rice name tag: `div.k-grain` (zero-size anchor, `pointer-events none`, opacity 0 → 1 over `.2s` with `.on`; hidden while an answer is open). It holds a 12×8 `#fffbea` grain with a 4 px ink ring at the anchor, a 4×32 ink string above it, and a paper `span.tag` (14px/1.3 px font, 4 px ink pixel border, drop shadow) reading a red `#b8402c` **HELLO** band, "my name is", and the name in 18px `#8a4a1e`. The tag pops from `translateY(8px) scale(.6)` with `.3s cubic-bezier(.2,1.5,.4,1)`.

### FAQ copy (`src/content/copy.ts`, verbatim)
| item | q | a |
|---|---|---|
| tuna | Which coding agents can I run? | Claude Code, Codex, and Cursor. Any agent that speaks the Agent Client Protocol can be registered alongside them. Every agent runs on the same environment primitives, so you can mix agents across tasks or run several inside one workspace. |
| salmon | Does it work with non-engineering tools? | Yes. Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe, and Gmail, plus hundreds more. Ops, finance, and data teams describe the work in Slack the way they would ask a teammate. No CLI and no new dashboard. |
| tamago | What does an agent's environment look like? | Each agent works in an isolated cloud environment with your repository, tools, dependencies, and services ready to use. |
| ikura | How does billing work? | Plans are sized by runtimes. The free trial runs five for 30 days, Developer gives one user up to three persistent runtimes, and Team gives multiple users five shared ones. Runtimes sleep when idle and wake on demand. |
| maki | Is the output always a pull request? | No. A pull request, commit, comment, or completed task for you to review, merge, or send back. It can also be a file: a document, a spreadsheet, a presentation. |
| ebi | What repositories can I use? | Any GitHub repository you have access to. Connect your GitHub account and select which repos to enable. |
| onigiri-happy | Is Jiro a real sushi chef? | Jiro is a real staff engineer. The sushi is load-bearing metaphor. Please do not eat the rock. |
| onigiri-sleepy | Does Jiro ever sleep? | Runtimes sleep when idle and wake on demand, so you only pay for work. Jiro himself blinks every six seconds and calls it a nap. |

### Hotspots and easter eggs (kitchen)
| name | rect | sfx | effect | egg id: toast |
|---|---|---|---|---|
| Pot | 1770,350,140,130 | splash | none | `kitchen-pot`: "Miso, simmering since the last on-call rotation." |
| Knives | 1370,180,130,150 | chime | none | `kitchen-knife`: "The third knife is called git reset --hard. Nobody touches it." |
| Jiro | 1515,250,200,280 | blip | Kills the previous poke bubble; new bubble at 1330,205 for 2400 ms, class `k-small`, cycling "Yes, chef?" / "Please don't poke the staff engineer." / "I'm reviewing the rice. It's passing." / "Ask a sushi. They know things." / "Beep. That was a sigh."; grille talks 1.2 s | `kitchen-jiro`: "You poked Jiro. He logged it as a minor incident." |
| Plate stack | 925,520,125,140 | meow | The cat peeks up over the plate stack for 2600 ms (the timer restarts on re-click) | `kitchen-cat`: "The kitchen cat. Job title: QA. Salary: tuna." |
| Swinging doors | 500,250,280,270 | whoosh | `kickAt = now`: both leaves flap toward closed and settle over 2 s | `kitchen-doors`: "Staff and plates only. The duck has a special exemption." |
| Ladle | 1484,226,50,104 | bonk | damped swing, 3 s | `kitchen-ladle`: "The ladle swings whenever a deploy goes out. It is swinging now." |
| Tap | 1360,440,44,64 | splash | none (it always drips) | `kitchen-tap`: "The tap has dripped since 2019. There is a ticket. It is in the backlog." |
| Under the stove | 1772,664,118,80 | pop | soot sprite pops out (2.4 s) | `kitchen-soot`: "A soot sprite lives under the stove. It eats crumbs. Mostly crumbs." |
| Rice tub | 1070,500,170,56 | chime | Name tag on a grain for 3800 ms (restarts on re-click). Each click moves to the next grain `(1112,524) (1188,516) (1148,540) (1216,532) (1092,540) (1164,512)` and name: `STEVE` · `GRAIN #4812` · `LINDA (QA)` · `BARTHOLOMEW` · `KEVIN, INTERN` · `THE CHOSEN ONE` | `kitchen-rice`: "One grain of rice got a name tag. His name is Steve. He has seniority." |
| 8 question sushi | see table | blip | open answer | `faq-all` after all 8 |

Declared eggs: `faq-all, kitchen-pot, kitchen-knife, kitchen-jiro, kitchen-cat, kitchen-doors, kitchen-rice, kitchen-ladle, kitchen-soot, kitchen-tap`.

`mount` preloads `art/kitchen/jiro-blink.png`, `jiro-talk.png`, `jiro-look.png` and `jiro-look-blink.png`.

### Enter / leave
- No `enter`.
- `leave()` removes `.on` from the open `.k-ask`, removes `.k-open` from the layer, and sets `talkUntil = 0` and `lookUntil = 0`. The sushi keep their `.asked` green state.
- `click()` closes any open answer and never consumes the click.

---

## 5. Rebuild checklist
1. **Art.** Put the four 1920×1080 JPEGs and the sprite PNGs listed above in `public/art/…`, and the product and compare captures in `public/ui/…`. All art uses `imageSmoothingEnabled = false` when sliced.
2. **Scene defs.** Register the four `SceneDef`s in scroll order bar, office, dining, kitchen, with the `hold` values in §0.
3. **Numbers.** Copy every coordinate, period and string from this file. The ambient functions are pure functions of `now`, so check a rebuild by rendering the same `?seg=<id>&tt=0.5&freeze=5` frame and diffing it against `docs/img/scene-<id>.jpg` (those references predate V3, so V3 ambient overlays will differ).
4. **Reset state.** To see the first-visit state (glints, drag hint), clear `localStorage` keys `jiro-bar-poked`, `jiro-dragged`, `jiro-eggs` and `jiro-egg-notes`.
