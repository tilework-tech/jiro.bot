# 01 · Engine and site chrome

This document covers the runtime underneath the rooms: the stage, the scroll-to-segment mapping, the render loop, the conveyor belt and plates, drag-and-drop, the item catalogue, easter eggs, sound, and all site chrome that sits outside the 1920x1080 stage. It is written so the engine can be rebuilt byte-for-byte in behaviour from this file plus the committed assets. Individual scenes and transitions are documented in their own docs. They are referenced here only through their contracts.

The code blocks marked **verbatim** are copied exactly from source. Reproduce them exactly: they encode pixel-level and hash-level behaviour that is hard to re-derive.

Files covered (all paths relative to `restaurant/`):

| File | Lines | Role |
|---|---|---|
| `package.json` | 11 | scripts + devDeps |
| `vite.config.ts` | 2 | base `./`, allowed hosts |
| `tsconfig.json` | 7 | strict TS, bundler resolution |
| `index.html` | 84 | meta/OG, fonts, inline loader, `#app` |
| `src/main.ts` | 96 | scene/transition list, global secrets, console egg |
| `src/chrome.ts` | 102 | scroll hint, egg ledger, rail progress, rotate card |
| `src/style.css` | 247 | chrome CSS + shared stage-space component CSS |
| `src/engine/types.ts` | 116 | constants + contracts |
| `src/engine/stage.ts` | 378 | `start()`: DOM skeleton, fit, API, input, render loop |
| `src/engine/belt.ts` | 266 | path baking, tread, plate positions, plate sprite, hit test |
| `src/engine/drag.ts` | 192 | drag/drop, rested plates, return/vanish/explode anims |
| `src/engine/items.ts` | 104 | item catalogue, deterministic item/rim hashing |
| `src/engine/eggs.ts` | 52 | egg registry + localStorage |
| `src/engine/sfx.ts` | 59 | WebAudio synth |
| `src/engine/fx.ts` | 105 | loop-safe ambient helpers for scenes |
| `src/engine/dom.ts` | 43 | DOM helpers for scene layers |

---

## 1. Toolchain

`package.json` (**verbatim**):

```json
{
  "name": "jiro-restaurant",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 0.0.0.0 --port 3000"
  },
  "devDependencies": { "typescript": "^5.6.0", "vite": "^6.0.0" }
}
```

`vite.config.ts` (**verbatim**). `base: "./"` makes every asset URL relative, so the build works from any sub-path. `allowedHosts: true` is required behind the Nori session proxy.

```ts
import { defineConfig } from "vite";
export default defineConfig({ base: "./", server: { allowedHosts: true }, preview: { allowedHosts: true } });
```

`tsconfig.json` (**verbatim**):

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler", "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true, "noUnusedLocals": false, "skipLibCheck": true, "resolveJsonModule": true, "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`.gitignore`: `node_modules`, `dist`, `art/first/*.log`.

The project uses no framework and has no runtime dependencies. Static assets live in `public/`, which Vite serves at the root. Those assets are `art/*.jpg` and subfolders, `items/*.png`, `end/`, `games/`, `mood/`, `ui/`, the favicons, and `og.jpg`. All runtime URLs are built as `${import.meta.env.BASE_URL}${path}`, so they are relative.

---

## 2. index.html

Head, in order:

- `<meta charset="UTF-8">`, viewport `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- Title: `Jiro's Restaurant · jiro.bot, your AI staff engineer by Nori`.
- Description: `Jiro is your AI staff engineer: cloud coding agents from Nori, the infrastructure for your agent army. Follow the sushi belt through the restaurant. Mind the rubber duck.`
- `theme-color` `#0b0a09`.
- OG tags:
  - `og:type` = `website`
  - `og:site_name` = `jiro.bot`
  - `og:title` = `Jiro's Restaurant · your AI staff engineer`
  - `og:description` = `Cloud coding agents from Nori, served on a conveyor belt. Scroll to follow the belt; click anything that looks clickable.`
  - `og:url` = `https://jiro.bot/`
  - `og:image` = `https://jiro.bot/og.jpg`, 1200x630
  - `og:image:alt` = `Jiro, a copper robot sushi chef, behind a pixel-art sushi bar`
- Twitter tags:
  - `twitter:card` = `summary_large_image`
  - `twitter:title` = same as `og:title`
  - `twitter:description` = `Cloud coding agents from Nori, served on a conveyor belt.`
  - `twitter:image` = `https://jiro.bot/og.jpg`
- Icons: `./favicon-32.png` (32x32), `./favicon.png` (64x64), `apple-touch-icon` `./apple-touch-icon.png`.
- `<link rel="preload" as="image" href="./art/bar.jpg">`.
- **Fonts** (Google Fonts, with preconnects to `fonts.googleapis.com` and `fonts.gstatic.com` crossorigin):
  `https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=JetBrains+Mono:wght@400;600&family=Silkscreen&display=swap`
- Inline `<style>` for the loader. It is inlined so the loader paints before the bundle arrives:

```css
html, body { margin: 0; background: #0b0a09; }
#loader { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; background: #0b0a09; color: #f3e6cf; font: 400 18px/1.4 "Silkscreen", monospace; transition: opacity .5s; }
#loader.done { opacity: 0; pointer-events: none; }
#loader .ld { display: grid; justify-items: center; gap: 18px; }
#loader img { width: 80px; height: 76px; image-rendering: pixelated; animation: ld-bob 1.2s steps(2) infinite; }
#loader .bar { width: 180px; height: 12px; border: 2px solid #f3e6cf; padding: 2px; }
#loader .bar i { display: block; height: 100%; width: 0; background: #6fdc8c; transition: width .3s steps(6); }
#loader small { font: 12px "JetBrains Mono", monospace; color: #bfae95; }
@keyframes ld-bob { 50% { transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { #loader, #loader * { animation: none !important; transition: none !important; } }
```

Body, in order:

1. `#loader` (`role="status" aria-live="polite"`) containing `.ld` with:
   - `<img src="./items/mini-jiro.png" alt="">`
   - `<span>Preparing the rice…</span>`
   - `.bar > i`
   - `<small>seasoning with vinegar</small>`
2. Inline loader script (classic, not a module). See §13.1.
3. `<div id="app"></div>`. The engine builds everything inside it.
4. `<noscript>`: `Jiro's Restaurant needs JavaScript to run the conveyor belt. Meanwhile: <a href="https://noriagentic.com/">noriagentic.com</a>`. Inline styles: cream text, sans-serif, 24px padding. The link is `#6fdc8c`.
5. `<script type="module" src="/src/main.ts">`.

---

## 3. Contracts: `src/engine/types.ts` (verbatim)

```ts
// Shared contracts between the engine, scenes, and transitions.
// Every coordinate is in stage space: a fixed 1920x1080 canvas.

export const STAGE_W = 1920;
export const STAGE_H = 1080;
/** Belt speed in stage px per second at scale 1. Identical in every scene and transition. */
export const BELT_SPEED = 46;
/** Distance between plate slots along the belt at scale 1 (world units). Many slots are empty. */
export const PLATE_GAP = 130;
/** Tread slat pitch in world units. Divides PLATE_GAP so seams stay continuous when phases shift by whole slots. */
export const SLAT = 26;
/** Master ambient loop length in seconds; periodic ambient motion should divide this. */
export const LOOP = 24;

/** [x, y, scale]. scale multiplies belt width, plate size, and local speed (perspective). */
export type BeltPt = [number, number, number?];

export interface BeltPath {
  pts: BeltPt[];
  /** Closed loop (e.g. the belt on the delivery bike). */
  closed?: boolean;
  /** 'full' draws tread + rails; 'seams' only animates slat seams over belt already painted in the art; 'none' draws plates only. */
  style?: "full" | "seams" | "none";
  /** Belt width in px at scale 1 (default 64). */
  width?: number;
  /** Plate size in px at scale 1 (default 52). */
  plate?: number;
  /**
   * Belt phase: plate slot `id` sits at local u = now * BELT_SPEED + phase - id * PLATE_GAP.
   * Scene belts: the engine OVERWRITES this at start() by chaining scenes in scroll order
   * (see engine/belt.ts setChain), so read it lazily (per frame), never at module load.
   * Transition paths: derive it with beltPhase(sceneId, u).
   */
  phase?: number;
  /** Deprecated and ignored: items depend only on the global plate id. */
  pool?: string[];
  /** Draw a darkness mask this many px at either end so plates vanish into wall openings. */
  fadeIn?: number;
  fadeOut?: number;
}

export interface Plate {
  x: number; y: number; s: number; angle: number;
  item: string; rim: string; key: string; alpha: number;
  /** Global plate id (same in every room and transition). */
  id?: number;
  /** Rotation in radians around the plate centre (wobble / tipping over). */
  rot?: number;
  /** Tiny speech-bubble glyph shown above the plate ("dots", "bang", "heart", "fish", "q", "note"). */
  bubble?: string;
  /** 0..1 while the plate lies shattered on the floor (drawn as shards, not hittable). */
  shatter?: number;
  /** True while falling / shattering: drawn but not clickable or draggable. */
  falling?: boolean;
  /** Walking legs: frame 0/1 of the 2-frame cycle; `dir` = facing (+1 right, -1 left). */
  legs?: 0 | 1;
  dir?: number;
}

export interface Api {
  /** Called once per egg id; shows a toast and bumps the counter. */
  egg(id: string, text: string): void;
  toast(text: string, ms?: number): void;
  sfx(name: "pop" | "blip" | "quack" | "boom" | "coin" | "meow" | "splash" | "whoosh" | "bonk" | "chime"): void;
  /** Image cache (url -> HTMLImageElement, loaded or not). */
  img(url: string): HTMLImageElement;
  /** Draw a scene's full frame (art + ambient + belt + plates) into g with an optional camera. Used by transitions. */
  drawScene(id: string, g: CanvasRenderingContext2D, now: number, cam?: Camera): void;
  /**
   * Draw the belt tread + plates for an arbitrary path at the global belt speed. Returns the plates drawn.
   * `phase` (number) overrides path.phase; get it from beltPhase(sceneId, u) so plate ids are global.
   * A string is accepted for legacy call sites and ignored (ids never depend on a key any more).
   */
  drawBelt(g: CanvasRenderingContext2D, path: BeltPath, now: number, phase?: number | string): Plate[];
  /** Current scene plates hit test in stage coords. */
  plateAt(x: number, y: number): Plate | null;
  /** Scroll smoothly to a segment id (scene id or "from>to"). */
  goto(id: string): void;
  /** Convert a client (mouse) point into stage coordinates. */
  toStage(clientX: number, clientY: number): [number, number];
  reducedMotion: boolean;
}

export interface Camera {
  /** Zoom factor around (cx, cy) in stage space; 1 = identity. */
  zoom?: number; cx?: number; cy?: number;
  /** Additional translation in stage px after zoom. */
  dx?: number; dy?: number;
  rot?: number;
  alpha?: number;
}

/** A surface in a room where a dragged plate can rest (counter, table, shelf, pier). */
export interface Surface {
  /** Polygon in stage coords; the plate's drop point (its bottom centre) must be inside. */
  poly: [number, number][];
  /** Plate scale when resting here (perspective); default: the scale it was picked up at. */
  scale?: number;
  /** Toast line when a plate is parked here (first park counts as an egg). */
  say?: string;
}

export interface SceneDef {
  id: string;
  /** Short room name shown in the side rail. */
  room: string;
  art: string;
  mood: "bustling" | "quiet";
  belt: BeltPath;
  /** Where dragged plates may rest. Drops elsewhere zoom back to the belt, vanish, or explode. */
  surfaces?: Surface[];
  /** Scroll length of the hold in viewport heights. */
  hold: number;
  /** Draw ambient animation over the art, under the belt (stage coords). */
  under?(g: CanvasRenderingContext2D, now: number, api: Api): void;
  /** Draw ambient animation over the belt (steam, rain, light shafts). */
  over?(g: CanvasRenderingContext2D, now: number, api: Api): void;
  /** Build DOM content inside `el` (a 1920x1080 absolutely positioned layer). */
  mount?(el: HTMLElement, api: Api): void;
  /** Stage-space click on the canvas (after plate clicks are handled). Return true if consumed. */
  click?(x: number, y: number, api: Api): boolean;
  /** Called when a plate is clicked in this scene; return true to override the default reaction. */
  plateClick?(p: Plate, api: Api): boolean;
  enter?(api: Api): void;
  leave?(api: Api): void;
}

export interface TransitionDef {
  from: string;
  to: string;
  /** Scroll length in viewport heights. */
  length: number;
  /** One-line description of the belt's route through the wall. */
  route: string;
  /**
   * World length of belt between the end of the `from` scene path and the start of the `to`
   * scene path (hidden in walls or drawn by this transition). The engine chains scene phases
   * with it: phase[to] = phase[from] - pathLength(from) - gap. Undeclared: the engine picks the
   * smallest gap >= 0 that keeps the `to` belt's declared phase residue mod PLATE_GAP.
   */
  gap?: number;
  /** t in [0,1]. At t=0 must equal the `from` scene frame, at t=1 the `to` scene frame. */
  render(g: CanvasRenderingContext2D, t: number, now: number, api: Api): void;
  mount?(el: HTMLElement, api: Api): void;
  /** Called every frame while active with the same t (for DOM overlays). */
  update?(el: HTMLElement, t: number, now: number, api: Api): void;
}
```

Notes on the contract:

- **Doc-comment mismatch in `fadeIn`/`fadeOut`.** The comment says "darkness mask", but the engine actually does a **linear alpha fade** of the plates over that many world units at each end of an **open** path. Defaults are 40/40. It is ignored on closed paths. For real darkness masks, scenes use `fx.hole()`.
- `Plate.angle` is computed as the path tangent angle. Plate drawing never uses it.
- Scene `mood` is declared data. The engine itself never reads it.
- `SceneDef.click`'s return value is ignored by the engine.
- `pool` is supported, but **no scene currently sets it**, so every belt draws from the global catalogue. Transitions copy `pool: x.belt.pool`, which is `undefined`.

---

## 4. Architecture and data flow

```
index.html ─ inline loader (removes itself)
           └ main.ts
               ├ import style.css
               ├ declareEggs([...9 global ids])        (scene modules also declareEggs at import time)
               ├ api = start(scenes[8], transitions[7])  (engine/stage.ts)
               │    ├ preloadItems()                     → new Image() for every ITEMS key
               │    ├ build segment list                 → throws "missing transition a>b" if absent
               │    ├ #app.innerHTML = skeleton           (scroll spacer, #frame{canvas#stage, #ui}, header, rail, eggbox, hint, toast)
               │    ├ fit() + resize listener
               │    ├ Api object, Drag instance
               │    ├ one DOM layer per segment in #ui, then call def.mount(el, api)
               │    ├ rail buttons, click/keyboard/pointer handlers
               │    └ requestAnimationFrame(tick)
               ├ setupChrome(api)                         (chrome.ts)
               └ global secrets (Konami, typed words, logo taps, tab-away, window.jiro)
```

### 4.1 Scene and transition order (`src/main.ts`)

```ts
start(
  [bar, office, dining, kitchen, storage, pantry, street, pond],
  [barOffice, officeDining, diningKitchen, kitchenStorage, storagePantry, pantryStreet, streetPond],
);
```

Import sources:

| Name | Module |
|---|---|
| `kitchenStorage` | `kitchenStorageF` from `./transitions/kitchen-storage-f` |
| `pantryStreet` | `./transitions/storage-street`, defined as `{ ...storageStreet, from: "pantry" }` |
| `storagePantry` | `./transitions/storage-pantry` |

Transitions are looked up by the key `` `${from}>${to}` ``. The transitions array order does not matter.

### 4.2 Stage geometry and `fit()`

The stage is a fixed 1920x1080 coordinate space (`STAGE_W`, `STAGE_H`). The canvas `#stage` has a backing store of exactly 1920x1080. The engine never resizes it and ignores `devicePixelRatio`. The DOM overlay `#ui` is a 1920x1080 box. Both get the **same CSS transform**, with `transform-origin: 0 0`. Both are `position:absolute` inside `#frame`, which is `position:fixed; inset:0; overflow:hidden`.

**Verbatim:**

```ts
let scale = 1, ox = 0, oy = 0;
function fit() {
  const vw = innerWidth, vh = innerHeight;
  // Contain, but allow up to 12% crop on each axis so typical screens fill edge to edge.
  const sc = Math.max(vw / STAGE_W, vh / STAGE_H);
  const sn = Math.min(vw / STAGE_W, vh / STAGE_H);
  scale = Math.min(sc, sn * 1.12);
  ox = (vw - STAGE_W * scale) / 2;
  oy = (vh - STAGE_H * scale) / 2;
  const tf = `translate(${ox}px, ${oy}px) scale(${scale})`;
  canvas.style.transform = tf;
  ui.style.transform = tf;
}
addEventListener("resize", fit);
fit();
```

What the rule does:

- The scale is "cover" (`sc`), capped at 1.12 × "contain" (`sn`).
- The stage can therefore overflow the viewport by at most 12% of the viewport on the tight axis, split evenly between both sides and centred. That is at most 1 − 1/1.12 ≈ 10.7% of the stage cropped.
- If the viewport aspect ratio is within about 12% of 16:9, the stage fills edge to edge. Otherwise the leftover is letterboxed on `#frame`'s `--ink` background.

Examples:

| Viewport | contain | cover | scale | Result |
|---|---|---|---|---|
| 1920x1080 | 1 | 1 | 1 | exact |
| 1440x900 (16:10) | 0.75 | 0.8333 | 0.8333 | fills. Stage is 1600 px wide, 80 viewport px cropped per side (96 stage px) |
| 2560x1080 (21:9) | 1 | 1.333 | 1.12 | stage 2150x1210. Vertical crop 65 px per side, letterbox 205 px left and right |
| 390x844 portrait | 0.2031 | 0.7815 | 0.2275 | stage 437x246 centred, 23 px side crop, big vertical letterbox (hence the rotate card) |

Client to stage conversion (`api.toStage`): `[(cx - ox) / scale, (cy - oy) / scale]`.

### 4.3 DOM skeleton built by `start()` (`src/engine/stage.ts` L48–75)

In `#app`, in order. `BASE` = `import.meta.env.BASE_URL`.

```html
<div id="scroll" style="height:${(total + 1) * 100}vh"></div>
<div id="frame">
  <canvas id="stage" width="1920" height="1080"></canvas>
  <div id="ui"></div>
</div>
<header class="top">
  <a class="logo" href="#bar" data-goto="bar" aria-label="jiro.bot, back to the bar"><img src="${BASE}items/mini-jiro.png" alt="" width="34" height="32" /><b>jiro<span>.</span>bot</b></a>
  <a class="by" href="https://noriagentic.com" target="_blank" rel="noopener">by <em>Nori</em></a>
  <div class="top-right">
    <button class="snd[ off]" id="sound" aria-pressed="${soundOn}" aria-label="Sound" title="Sound on/off">
      <svg viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true">
        <path fill="currentColor" d="M1 6h3v4H1zM4 5h2v6H4zM6 3h2v10H6z"/>
        <path class="w" fill="currentColor" d="M10 6h1v4h-1zM12 4h1v8h-1zM11 5h1v1h-1zM11 10h1v1h-1zM14 3h1v10h-1zM13 2h1v1h-1zM13 13h1v1h-1z"/>
        <path class="x" fill="currentColor" d="M10 5h2v2h-2zM12 7h2v2h-2zM14 5h1v2h-1zM10 9h2v2h-2zM14 9h1v2h-1z"/>
      </svg>
    </button>
    <a class="cta" href="https://noriagentic.com/" target="_blank" rel="noopener">Reserve a seat</a>
  </div>
</header>
<nav class="rail" aria-label="Rooms"><div class="track" aria-hidden="true"><b></b></div></nav>
<div class="eggbox">
  <button class="eggs" id="eggs" aria-expanded="false" aria-controls="eggpop" title="Easter eggs found"></button>
  <div class="eggpop" id="eggpop" role="dialog" aria-label="Easter eggs found" hidden></div>
</div>
<div class="scroll-hint" aria-hidden="true"><span>scroll to follow the belt</span><i></i></div>
<div class="toast" id="toast" role="status" aria-live="polite"><img src="${BASE}items/mini-jiro.png" alt="" /><p></p></div>
```

The SVG is a pixel speaker: `.w` holds the sound waves, and `.x` is the mute cross shown when `.off` is set.

Then, for every segment in order (scenes and transitions), the engine:

1. creates `<div class="layer scene-ui|tr-ui" data-id="<seg id>">`,
2. appends it to `#ui`,
3. immediately calls `def.mount?.(el, api)`.

Scene layers use the class `scene-ui`. Transition layers use `tr-ui`.

Next, for every scene, the rail gets:

```html
<button data-goto="<id>" aria-label="Go to the <room>"><i></i><span><room></span></button>
```

This comes after the `.track`.

A delegated click handler on `#app` handles any `[data-goto]`: `preventDefault()`, then `api.goto(id)`. This covers the logo, the rail, and any scene markup that uses `data-goto`.

---

## 5. Scroll → segment mapping

### 5.1 Segments

`segs` alternates scene holds and transitions:

```
scene[0], tr(0>1), scene[1], tr(1>2), …, scene[n-1]
```

Each entry has `start` and `len` in **viewport heights (vh units of scroll)**. `len` is `SceneDef.hold` for a scene and `TransitionDef.length` for a transition. `total` is the sum of all lengths.

The scroll spacer is `(total + 1) * 100vh` tall. The maximum `scrollY / innerHeight` is therefore exactly `total`.

Current table, computed from the `hold`/`length` values in `src/scenes/*.ts` and `src/transitions/*.ts`:

| # | Segment id | Kind | Source (hold/length) | start | len | end |
|---|---|---|---|---|---|---|
| 0 | `bar` | scene | `scenes/bar.ts` hold 1.2 | 0.00 | 1.2 | 1.20 |
| 1 | `bar>office` | tr | `transitions/bar-office.ts` length 0.9 | 1.20 | 0.9 | 2.10 |
| 2 | `office` | scene | `scenes/office.ts` hold 1.6 | 2.10 | 1.6 | 3.70 |
| 3 | `office>dining` | tr | `transitions/office-dining.ts` length 2 | 3.70 | 2.0 | 5.70 |
| 4 | `dining` | scene | `scenes/dining.ts` hold 1.3 | 5.70 | 1.3 | 7.00 |
| 5 | `dining>kitchen` | tr | `transitions/dining-kitchen.ts` length 0.7 | 7.00 | 0.7 | 7.70 |
| 6 | `kitchen` | scene | `scenes/kitchen.ts` hold 1.6 | 7.70 | 1.6 | 9.30 |
| 7 | `kitchen>storage` | tr | `transitions/kitchen-storage-f.ts` length 0.7 | 9.30 | 0.7 | 10.00 |
| 8 | `storage` | scene | `scenes/storage.ts` hold 1.1 | 10.00 | 1.1 | 11.10 |
| 9 | `storage>pantry` | tr | `transitions/storage-pantry.ts` length 0.35 | 11.10 | 0.35 | 11.45 |
| 10 | `pantry` | scene | `scenes/pantry.ts` hold 1.5 (spreads `storage`) | 11.45 | 1.5 | 12.95 |
| 11 | `pantry>street` | tr | `transitions/storage-street.ts` length 0.7 (`pantryStreet`) | 12.95 | 0.7 | 13.65 |
| 12 | `street` | scene | `scenes/street.ts` hold 1.6 | 13.65 | 1.6 | 15.25 |
| 13 | `street>pond` | tr | `transitions/street-pond.ts` length 0.8 | 15.25 | 0.8 | 16.05 |
| 14 | `pond` | scene | `scenes/pond.ts` hold 1.8 | 16.05 | 1.8 | 17.85 |

`total = 17.85`. The spacer is `1885vh`.

Scenes in rail order, with the room label and keyboard digit for each:

| Digit | Scene id | Room label |
|---|---|---|
| 1 | `bar` | Bar |
| 2 | `office` | Back office |
| 3 | `dining` | Dining room |
| 4 | `kitchen` | Kitchen |
| 5 | `storage` | Storage |
| 6 | `pantry` | MCP pantry |
| 7 | `street` | Delivery |
| 8 | `pond` | Koi pond |

The segment list is exposed for tooling as `window.__segs = [{id, start, len}, …]`.

### 5.2 Smoothing and segment choice (per frame)

```ts
const target = fixedP ? parseFloat(fixedP) : scrollY / innerHeight;
shown += (target - shown) * (reducedMotion || fixedP ? 1 : 0.18);
if (Math.abs(target - shown) < 0.0005) shown = target;
const p = Math.max(0, Math.min(total - 0.0001, shown));
const seg = segs.find((s) => p >= s.start && p < s.start + s.len) ?? segs[segs.length - 1];
```

- `shown` starts at `scrollY / innerHeight`.
- The smoothing factor is **0.18 per animation frame**. It is frame-rate dependent (no dt), and the value snaps to target within 0.0005 vh.
- Transition progress: `t = clamp01((p - seg.start) / seg.len)`.

### 5.3 `api.goto(id)`

The engine finds the segment by id: a scene id, or `"from>to"`. It then calls:

```js
scrollTo({ top: (start + (scene ? 0.02 : 0)) * innerHeight, behavior: reducedMotion ? "auto" : "smooth" })
```

The +0.02 vh nudge lands safely inside the scene rather than on the boundary. Unknown ids do nothing.

### 5.4 Hash deep links

- **On load:** if `location.hash` is longer than 1 character, the engine calls `setTimeout(() => api.goto(hash.slice(1)), 50)`. For example, `#kitchen`.
- **While scrolling:** whenever the current scene changes to a non-empty scene, the engine calls `history.replaceState(null, "", "#<sceneId>")`. The hash is not updated during transitions.

---

## 6. Render loop (`tick`, `stage.ts` L298–367)

Every `requestAnimationFrame`, in this exact order:

1. **Time.** `now = ?t ? parseFloat(?t) : performance.now()/1000`, in seconds. It is used for all scene, belt, and transition drawing.
2. **Scroll.** Compute `target`, update `shown`, clamp to `p`, pick `seg`, and set `active = seg` (§5.2).
3. **Reset context.** `g.setTransform(1,0,0,1,0,0); g.globalAlpha = 1; g.imageSmoothingEnabled = true;`. There is **no clearRect**. Every frame fully repaints the art or a `#0b0a09` fill.
4. **Draw.**
   - **Scene:** `renderScene(def, g, now, undefined, live=true)`, then `drag.drawHeld(g, def.belt.plate ?? 52)`, so the held plate is on top of everything, including `over`.
   - **Transition:** `g.save(); def.render(g, t, now, api); g.restore(); def.update?.(layer, t, now, api)`.
5. **Plate-click pops.** Iterate backwards. Pops use real time (`performance.now()/1000`), not `?t`. A pop is removed when its age exceeds 0.7 s **or** the current segment is not a scene. Each live pop is drawn as:
   - `globalAlpha = 1 - age/0.7`
   - colour by kind: boom `#ff9d3a`, coin `#ffd84a`, spark `#f3e6cf`
   - 8 squares of 6x6 at angles `k/8·2π`, radius `r = 10 + age·70`
   - square positions: `(round(x + cos·r) - 3, round(y + sin·r·0.7) - 3)`
6. **DOM layer visibility.** For every segment layer:
   - `o = 1` if it is the active segment, else 0.
   - If the active segment is a transition with progress `t`:
     - the `from` scene layer gets `o = 1 - smooth(0, 0.12, t)`
     - the `to` scene layer gets `o = smooth(0.88, 1, t)`
     - the transition's own layer stays at 1
   - Apply `style.opacity = o` and `style.visibility = o > 0.01 ? "visible" : "hidden"`.
   - Toggle class `live` when `o > 0.5`. CSS only enables pointer events inside `.live` layers.
7. **Scene change bookkeeping.** `curScene` is the scene id, or `""` during a transition. If it differs from the last value:
   - call the old scene's `leave?.(api)` and the new scene's `enter?.(api)`
   - set rail button `.on` + `aria-current="location"` on the matching button and remove both elsewhere
   - `replaceState` the hash (scenes only)

   Because transitions yield `""`, `leave` fires when a transition **starts**, and `enter` fires when the next scene's hold begins.
8. `document.body.dataset.segment = seg.id`. Scene or transition CSS can key off `body[data-segment="…"]`.
9. `requestAnimationFrame(tick)`.

`renderScene(s, gg, now, cam, live)` is **verbatim** below. `api.drawScene(id, g, now, cam)` calls it with `live=false`.

```ts
function renderScene(s: SceneDef, gg: CanvasRenderingContext2D, now: number, cam: Camera | undefined, live: boolean) {
  gg.save();
  if (cam) {
    const z = cam.zoom ?? 1, cx = cam.cx ?? STAGE_W / 2, cy = cam.cy ?? STAGE_H / 2;
    gg.globalAlpha = cam.alpha ?? 1;
    gg.translate(STAGE_W / 2 + (cam.dx ?? 0), STAGE_H / 2 + (cam.dy ?? 0));
    if (cam.rot) gg.rotate(cam.rot);
    gg.scale(z, z);
    gg.translate(-cx, -cy);
  }
  const art = img(s.art);
  if (art.complete && art.naturalWidth) gg.drawImage(art, 0, 0, STAGE_W, STAGE_H);
  else { gg.fillStyle = "#0b0a09"; gg.fillRect(0, 0, STAGE_W, STAGE_H); }
  s.under?.(gg, now, api);
  const plates = drawBeltFull(gg, s.belt, now, s.id, drag.hidden).filter((p) => !drag.hidden.has(p.key));
  drag.drawScene(gg, s, now);
  if (live) { scenePlates = plates; sceneBeltSize = s.belt.plate ?? 52; }
  s.over?.(gg, now, api);
  gg.restore();
}
```

Per-scene layer order:

1. art
2. `under`
3. belt tread
4. belt plates, skipping hidden ones
5. rested plates and drag animations
6. `over`
7. the held plate, drawn later and only for the live scene

The camera maps stage point `(cx, cy)` to the screen centre plus `(dx, dy)`, rotated by `rot` and zoomed by `zoom`.

`img(url)` is a global `Map` cache of `HTMLImageElement`. URLs starting with `http` or `data:` are used as-is. Anything else becomes `BASE_URL + url` with any leading `/` stripped.

Helpers exported from `stage.ts`:

```ts
export function smooth(a, b, t) { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); } // smoothstep
export function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }       // easeInOutCubic
```

---

## 7. The belt (`src/engine/belt.ts`) — v3: one belt, global plate identity

### 7.1 Model

A belt path is a polyline of `[x, y, scale?]` points (scale = perspective; it multiplies belt width, plate size and local screen speed). The engine works in **world distance** `u` = screen distance / local scale. Everything moves at `BELT_SPEED = 46` world units/s, so a plate at scale `s` moves `46·s` px/s.

**Slots and global ids.** Slots are `PLATE_GAP = 130` world units apart. On any path, global slot `id` sits at

```
u = now·46 + path.phase − id·130
```

and scene phases are **chained** at `start()` (`setChain`), so a plate leaving scene *i* re-enters scene *i+1* with the same id. Everything about a plate (occupancy, item, glaze, chats, falls) depends only on its id (and time), so it is the same object in every room and transition, from the bar wall to the koi.

### 7.2 Phase chain (`setChain`, called by `stage.start`)

```
phase[0]   = bar.belt.phase ?? 0
phase[i+1] = phase[i] − pathLength(scene i) − gap(i)
```

- `gap(i)` = `TransitionDef.gap` of the `i>i+1` transition: world length of belt between the end of the from-scene path and the start of the to-scene path (hidden in walls or drawn by the transition).
- Undeclared: the smallest gap ≥ 0 that keeps scene *i+1*'s declared phase residue mod 130 (so pre-v3 positions stay put; identities do not).
- Consecutive scenes sharing one belt object (storage → pantry) share the phase (gap reported as `−U`).
- The engine **writes** the chained value into `scene.belt.phase`. Read it lazily (per frame / lazily built geometry), never at module load: modules load before `start()`.
- Global belt distance of a plate: `J = globalU(id, now) = now·46 + phase[0] − id·130`. Scene *i* covers `J ∈ [off_i, off_i + U_i]`, `off_i = phase[0] − phase[i]`.
- `window.__chain` lists `{id, phase, U, off, gap}`; `node tools/qa/chain.mjs` prints it, `node tools/qa/align.mjs` lists every path each transition draws with its `off` and the delta at joins (0 = same plate continues; delta/130 = slot shift).

### 7.3 Exported API (for scenes and transitions)

| Export | Meaning |
|---|---|
| `beltPhase(sceneId, u = 0)` | Phase for a path whose `u = 0` sits at local `u` on that scene's belt. `beltPhase("kitchen", pathLength(kitchen.belt))` starts a path where the kitchen belt ends; negative `u` feeds a scene from before its start. |
| `globalU(id, now)` | Global belt distance `J` of plate `id`. |
| `plateIdAt(path, u, now, phase?)` | Nearest slot id at local `u` on a path. |
| `slotOccupied(id)` | Does the slot carry a plate (~47 % do; clustered runs). |
| `itemOf(id)` / `itemFor(id)` | Item on plate `id` (legacy `key`/`pool` args ignored). `rimFor(id)` = glaze. |
| `plateBehaviour(id, now)` | `{du, off, drop, rot, bubble, shatter, falling, gone}`: chat slide, fall stage, bubble glyph. |
| `fallAt(id)` | Global `J` where the plate starts to wobble off, or `null`. |
| `chainInfo()` | The chain links. |
| `platesOn(path, now, phase?)` | Plates on a path with life applied (skips empty and fallen slots). Returns `Plate` with `id`, `rot`, `bubble`, `shatter`, `falling`. |
| `drawTread`, `drawPlates`, `drawBeltFull(g, path, now, phase?, hidden?)`, `pointAt`, `pathLength`, `hitPlate` | As before; string keys are accepted and ignored. |
| `api.drawBelt(g, path, now, phase?)` | Same as `drawBeltFull`; a number overrides `path.phase`. |

Pond-style scenes that animate plates past the end of a path must use `slotOccupied(id)`, `plateBehaviour(id, now).gone` and `itemFor(id)` with the global id `floor((now·46 + phase − U)/130)`.

### 7.4 Occupancy (irregular belt)

Deterministic per 32-slot block (`hash(block, "occ")`): alternating runs, plate runs from `[1,2,2,3,3,3,4,4]`, empty runs from `[1,1,2,3,3,4,5,6]` (~53 % empty, big gaps common). The bar (≈11.6 slots) typically shows 4–9 plates. Absurd items stay ≈ 1 in 5 of occupied plates (catalogue weights, §9).

### 7.5 Plate life (pure functions of id + time)

- **Chat.** Pair `(a, a+1)` (both occupied, neither falls, `hash < 0.45`, never overlapping another pair) chats once every 2800 world units of travel at a hashed offset. One plate (hashed) slides 70 world units toward the other at 8 u/s (≈ 8.8 s), both show a 5×5 pixel bubble (`dots`, `bang`, `heart`, `fish`, `q`, `note`) for ≈ 4.5 s, then it drifts back.
- **Fall.** ≈ 1 in 30 plates. The start `J` is hashed into the usable span of a non-final scene belt (≥ 160–220 world units clear of both ends, so never inside a wall opening; pond excluded). Timeline: wobble 1.8 s → slide over the rail 1.1 s (toward the viewer, `ny > 0` side) → stops travelling, tips and drops 110 px·s (gravity 900) → 6 pixel shards for 1 s → `gone` for the rest of the journey (every later room skips it).
- **Hop.** Animal items still hop 1 px tied to position.
- `?debugplates=1`: all eligible pairs chat every 1100 u, 1 in 3 plates falls, every rested plate grows legs after 0.6 s.

### 7.6 Baking and corners

`bake(path)` (cached per path object in a `WeakMap`, including rail edge polylines) first **fillets** every interior polyline corner with a circular arc: radius `1.2 × width × scale` at the vertex, clamped so the tangent length is ≤ half the shorter adjacent segment. Then it resamples every ≤ 6 px with cumulative `u`. `pointAt` interpolates position, scale and heading. Transition paths that build their own arcs (e.g. street>pond `corner()`) are kept as drawn; they should use a centre-line radius ≥ 1.2 × width.

### 7.7 Tread (`drawTread`)

- `full`: shadow (+8·s), body `#2b2723`, **slats**, rails (`#6d3f22` 7 px under `#c9814a` 4 px, round joins).
- **Slats** every `SLAT = 26` world units (divides 130, so seams stay continuous when phases shift by whole slots). Each seam is a crescent bowing forward (edges trail by `0.32·half-width`), perpendicular to the path. The seam is a dark gap wedge (`#0e0c0b`) 2 px wide plus the extra spacing on the **outside** of a curve (`−κ·offset·SLAT·s·0.9`), so slats fan open outside and stay tight inside; a `#4a433b` lip line marks the overlapping slat.
- `seams`: only the crescent seams (for belts painted into the art). `none`: plates only.

### 7.8 Plates

One ceramic style: cream glaze (three near-identical glazes, `rimFor(id)`), a thin warm-brown rim band, shaded well, foot ring, glint, dark 1 px outline, contact shadow; pixel sprites cached per (glaze, diameter). `drawPlates` handles `rot` (wobble/tip), `bubble`, `shatter` (shards), `legs`/`dir` (walking rested plates, item mirrored when walking left). `hitPlate` ignores falling/shattered plates.

## 8. Drag and drop (`src/engine/drag.ts`)

Constants:

| Name | Value |
|---|---|
| `MAX_RESTED` | `14` per scene |
| `DUR.return` | `0.55` s |
| `DUR.vanish` | `0.35` s |
| `DUR.explode` | `0.5` s |
| Drag start threshold | `> 6` stage px |
| Click suppression after a drop | `80` ms |
| "Near belt" test | belt sampled every 20 world units. Near if any sample is within `(belt.width ?? 64)·s·0.8` px |

State:

- `hidden: Set<key>`: belt plates that are currently held, rested, or animating.
- `rested: Map<sceneId, Plate[]>`
- `held`
- `anims[]`
- `down`: the pending press.

### 8.1 Input wiring (`stage.ts`)

**pointerdown** on `#frame` is ignored if any of these hold:

- the button is not 0
- `pointerType === "touch"`. **Touch never drags**, so native scrolling keeps working. Taps still produce `click`, so plate clicks work on touch.
- no scene is active
- the target is inside `#ui .hit`, `#ui button`, `#ui a`, `#ui input`, `#ui video`, `#ui .arcade`, `#ui figure`, or `#ui .mood`

Otherwise:

1. `beltHit = hitPlate(scenePlates, …)`.
2. `drag.pointerDown(scene, x, y, beltHit)` prefers a rested plate under the pointer, falling back to the belt plate. It records `down`.
3. If a plate was found, the handler calls `preventDefault()` and `setPointerCapture`.

**pointermove.** Once the pointer moves more than 6 px from `down`, the plate is lifted:

- a belt plate's key is added to `hidden`
- a rested plate is spliced out of its list
- `held = {...plate, alpha: 1, scene, from}`
- `sfx("pop")`

While held, `held.x = x` and `held.y = y + 18·s`. `#frame` gets the class `dragging`.

**pointerup / pointercancel:** remove `dragging` and release capture. If a scene is active, call `drag.pointerUp(scene, performance.now()/1000)`. If not, just set `held = null`. In that case a belt plate's key stays in `hidden` forever, so that plate slot is simply gone. This edge case is only reachable by scrolling mid-drag.

### 8.2 Drop outcomes (`pointerUp`)

Set `suppressUntil = now + 80 ms`, then test the drop point `(held.x, held.y)` against `scene.surfaces` with the first matching polygon winning (`inPoly` is even-odd ray casting).

**On a surface:**

1. Push `{...held, s: surface.scale ?? held.s, t0, walker, xl, xr}` into `rested[scene]`. `walker` (≈ 1 in 3, all with `?debugplates=1`; only if the row is wider than the plate): after 1.5 s the plate grows two outlined pixel legs (2-frame cycle, 4 fps) and toddles back and forth at 5 px/s along its drop row, turning at the polygon edges (`rowSpan`, inset by the plate radius). `pose(r, t)` gives the current position; hit tests and pick-ups use it.
2. Sort the list by `y` ascending, which is also the draw order.
3. While the list is longer than 14, `shift()` the plate with the **smallest y** (the farthest back, not necessarily the oldest) into a `vanish` animation.
4. `sfx("blip")` and `api.egg("plate-parked", surface.say ?? "Plate parked. Jiro approves of tidy surfaces.")`. The first park anywhere is the egg. Later parks just toast the surface's line.

**Off a surface**, the outcome is decided like this:

```ts
const onBelt = this.nearBelt(scene, h.x, h.y, now);
const r = hash(h.key + ":" + Math.round(now * 10));   // FNV-1a 32-bit → [0,1)
const volatile = h.item === "bomb" || h.item === "laptop-fire";
const kind = onBelt ? "return" : volatile ? "explode" : r < 0.5 ? "return" : r < 0.75 ? "vanish" : "explode";
```

| Condition | Outcome | Probability | Sound | Egg / toast |
|---|---|---|---|---|
| near the belt | return | always | whoosh | none |
| `bomb` or `laptop-fire` elsewhere | explode | always | boom | egg `plate-exploded`: "No surface there. The plate chose violence." |
| elsewhere, `r < 0.5` | return | 50% | whoosh | toast "Nowhere to put it down. Back on the belt it goes." |
| elsewhere, `0.5 ≤ r < 0.75` | vanish | 25% | whoosh | egg `plate-vanished`: "Poof. That plate went to /dev/null." |
| elsewhere, `r ≥ 0.75` | explode | 25% | boom | egg `plate-exploded` (same text as above) |

`hash` in `drag.ts` is plain FNV-1a, distinct from the items hash:

```ts
function hash(s: string): number { let h = 2166136261; for (…) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; }
```

### 8.3 Animations (`drawScene`, called inside `renderScene`)

Rested plates are drawn first with `drawPlates`. Then each animation for this scene runs, with `f = min(1, (performance.now()/1000 − t0) / DUR[kind])`:

- **return.**
  1. Find the plate's live target `platesOn(scene.belt, now, scene.id)` with the same key. If the slot is no longer on the belt, convert the animation to `vanish` starting now.
  2. Ease out cubic: `e = 1 − (1−f)³`.
  3. Position: `x = x0 + (tx−x0)e`, `y = y0 + (ty−y0)e − sin(fπ)·80` (an arc lift of 80 px), `s = s0 + (ts−s0)e`.
  4. At `f = 1`, remove the key from `hidden` so the belt draws it again.
- **vanish.**
  - The plate itself: `alpha = 1−f`, `s = s0(1 − 0.6f)`, `y = y0 − 30f`.
  - Plus 6 puff squares, 8x8, colour `#e9e2d4`, `globalAlpha 1−f`, at angles `k/6·2π` and radius `20 + 50f`.
  - Each square sits at `(round(x0 + cos·r) − 4, round(y0 − 20 + sin·r·0.6) − 4)`.
- **explode.** The plate is not drawn. Instead there are 14 squares:
  - colours cycle `#ff9d3a, #ffd84a, #f3e6cf, #c8483f`
  - angle `k/14·2π + k`, radius `10 + 140f·(0.6 + (k%3)·0.2)`
  - size `10 − 6f`, with gravity `+90f²` on y
  - positions are relative to `(x0, y0 − 20)`, with `globalAlpha 1−f`

**Held plate** (`drawHeld`):

- Shadow: an ellipse at `(x, y + 26s)` with radii `size·s·0.45` and `size·s·0.14`, filled `rgba(0,0,0,.35)`.
- Plate: drawn at `y − 14s` with scale `s·1.12`, so it looks lifted.

Rested plates keep their belt key, and the key stays in `hidden`. Plate ids never repeat, so this is harmless. A rested plate can be picked up again (`from: "rest"`).

### 8.4 Clicks versus drags

The **click** handler on `#frame` runs in this order:

1. If `drag.suppressClick()` is true (within 80 ms of a drop), return.
2. If the target is inside `#ui .hit`, `#ui button`, `#ui a`, `#ui input`, or `#ui .mood`, return.
3. If no scene is active, return.
4. Resolve `p = api.plateAt(x, y)`. If there is a plate:
   1. If `scene.plateClick?.(p, api)` returns true, stop.
   2. Otherwise, pick a line from `ITEMS[item].say`. There is one global counter per **item name**, shared across all scenes, and lines rotate sequentially: `say[k % len]`.
   3. `sfx(def.sfx ?? "pop")`.
   4. Push a pop at `(p.x, p.y − 30·s)`. The kind is `boom` if `sfx === "boom"`, `coin` if `sfx === "coin"`, else `spark`.
   5. `api.egg(def.egg, line)` if the item has an egg, else `api.toast(line)`.
5. With no plate, call `scene.click?.(x, y, api)`.

A press without movement over 6 px fires a normal click, so a plate reacts to a plain click.

**mousemove:** in scenes, toggle `#frame.over-plate` when a plate is under the cursor. CSS turns that into `cursor: grab`. The later rule in `style.css` wins over the earlier `pointer`. `#frame.dragging` and all its descendants get `cursor: grabbing !important`.

---

## 9. Items catalogue (`src/engine/items.ts`)

`ItemDef` (verbatim):

```ts
export interface ItemDef {
  weight: number;
  /** Click reaction: toast text (first click also counts as an egg when `egg` is set). */
  say: string[];
  egg?: string;
  sfx?: "pop" | "blip" | "quack" | "boom" | "coin" | "meow" | "splash" | "whoosh" | "bonk" | "chime";
  /** Absurd items get picked less often but make the belt funny. */
  absurd?: boolean;
  /** Living passenger: gets a tiny 1-px hop tied to belt travel (loop-safe). */
  animal?: boolean;
}
```

There are 41 items with a total weight of **84.9**. **Absurd items weigh 16.9 in total, or 19.9% ≈ 1 plate in 5.** Every key needs `public/items/<key>.png`.

For the full `say` lines, copy `src/engine/items.ts` verbatim. The declaration order below is the order of `ALL` and affects which item is picked.

| # | Key | Weight | Share | Absurd | Animal | Egg id | sfx (default `pop`) |
|---|---|---|---|---|---|---|---|
| 1 | tuna | 10 | 11.78% | | | | |
| 2 | salmon | 10 | 11.78% | | | | |
| 3 | tamago | 7 | 8.24% | | | | |
| 4 | ikura | 6 | 7.07% | | | | |
| 5 | ebi | 6 | 7.07% | | | | |
| 6 | maki | 8 | 9.42% | | | | |
| 7 | onigiri-happy | 4 | 4.71% | | | happy-onigiri | |
| 8 | onigiri-angry | 3 | 3.53% | | | angry-onigiri | |
| 9 | onigiri-sleepy | 3 | 3.53% | | | sleepy-onigiri | |
| 10 | bowl-miso | 3 | 3.53% | | | | |
| 11 | cup-tea | 3 | 3.53% | | | | |
| 12 | cup-matcha | 2 | 2.36% | | | | |
| 13 | wasabi | 1.2 | 1.41% | ✓ | | wasabi | bonk |
| 14 | duck | 1.5 | 1.77% | ✓ | | duck | quack |
| 15 | bug | 1.2 | 1.41% | ✓ | | bug | |
| 16 | bomb | 0.6 | 0.71% | ✓ | | bomb | boom |
| 17 | puffer | 0.6 | 0.71% | ✓ | ✓ | puffer | pop |
| 18 | rock | 0.6 | 0.71% | ✓ | | rock | bonk |
| 19 | gold | 0.6 | 0.71% | ✓ | | gold | coin |
| 20 | cat | 0.6 | 0.71% | ✓ | ✓ | cat | meow |
| 21 | lucky-cat | 0.6 | 0.71% | ✓ | | lucky-cat | chime |
| 22 | floppy | 0.6 | 0.71% | ✓ | | floppy | |
| 23 | laptop-fire | 0.6 | 0.71% | ✓ | | laptop-fire | boom |
| 24 | fortune | 2 | 2.36% | | | fortune | chime |
| 25 | mini-jiro | 0.6 | 0.71% | ✓ | | mini-jiro | blip |
| 26 | lobster | 0.6 | 0.71% | ✓ | ✓ | lobster | bonk |
| 27 | ramen | 1 | 1.18% | | | ramen | |
| 28 | hamster | 0.5 | 0.59% | ✓ | ✓ | hamster | blip |
| 29 | octopus | 0.5 | 0.59% | ✓ | ✓ | octopus | splash |
| 30 | crab | 0.5 | 0.59% | ✓ | ✓ | crab | bonk |
| 31 | frog | 0.5 | 0.59% | ✓ | ✓ | frog | blip |
| 32 | sloth | 0.5 | 0.59% | ✓ | ✓ | sloth | pop |
| 33 | sumo | 0.5 | 0.59% | ✓ | ✓ | sumo | bonk |
| 34 | googly | 0.5 | 0.59% | ✓ | | googly | pop |
| 35 | ufo | 0.5 | 0.59% | ✓ | | ufo | whoosh |
| 36 | raccoon | 0.5 | 0.59% | ✓ | ✓ | raccoon | bonk |
| 37 | seal | 0.5 | 0.59% | ✓ | ✓ | seal | splash |
| 38 | cat-maki | 0.5 | 0.59% | ✓ | ✓ | cat-maki | meow |
| 39 | snail | 0.5 | 0.59% | ✓ | ✓ | snail | pop |
| 40 | corgi | 0.5 | 0.59% | ✓ | ✓ | corgi | chime |
| 41 | goose | 0.5 | 0.59% | ✓ | ✓ | goose | quack |

Catalogue notes:

- 32 items carry an egg id.
- `public/items/` also contains `bowl-ramen.png`, `bowl-soup.png`, and `cup-soy.png`, which are **not** in `ITEMS`. They are unused by the belt.
- `mini-jiro.png` doubles as the logo, toast avatar, loader, and rotate-card image.
- `bomb` and `laptop-fire` are "volatile" for drag drops (§8.2).

---

## 10. Easter-egg system (`src/engine/eggs.ts`)

### 10.1 Storage

**localStorage keys:**

| Key | Content |
|---|---|
| `jiro-eggs` | JSON array of found ids, in discovery order |
| `jiro-egg-notes` | JSON object `{id: text}`. The first text seen for each id, shown in the ledger |

### 10.2 Declaring eggs

`declared` starts as the set of all `ITEMS[*].egg` values (32). Modules add to it with `declareEggs(ids)` **at import time**, so the total is known before the first frame:

| Module | Declared ids |
|---|---|
| `main.ts` (9) | konami, omakase, logo-5, sudo, tab-away, console, plate-parked, plate-exploded, plate-vanished |
| `scenes/bar.ts` (8) | bar-jiro, bar-sake, bar-lantern, bar-customer, bar-plates, bar-soy, bar-opening, bar-noren |
| `scenes/office.ts` (7) | office-jiro, office-crt, product-tour, office-tea, office-lamp, office-hatch, office-sticky |
| `scenes/dining.ts` (3) | slop, dining-jiro, dining-lantern |
| `scenes/kitchen.ts` (6) | faq-all, kitchen-pot, kitchen-knife, kitchen-jiro, kitchen-cat, kitchen-doors |
| `scenes/storage.ts` (5) | storage-bulb, storage-jars, storage-mouse, storage-jiro, storage-all-jars |
| `scenes/pantry.ts` (1) | mood-all |
| `scenes/street.ts` (6) | street-bell, street-neon, street-jiro, street-pm, street-drain, street-special |
| `scenes/pond.ts` (6) | pond-koi, pond-duck, pond-lantern, pond-moon, flappy-played, flappy-5 |
| `games/flappy.ts` (2) | flappy-sushi, flappy-20 |

`games/flappy.ts` is imported via pond (Hose Snake was removed in v3; Flappy Koi is the only mini game). The total at load was 85 right after the snake removal; scenes keep adding eggs (89 at the time of writing), so read the badge.

**Known quirk:** the moodboard versions (`src/moodboard/v*.ts`) call `api.egg` with 13 ids that are never declared:

- mood-v02-all, mood-v02-rocks, mood-v09-checked
- mv01-omakase, mv05-river
- v03-all, v03-press
- v04-flask, v04-undiscovered
- v06-orphan, v07-bell, v08-eye, v10-hanko

`eggFound` adds an unknown id to `declared` when it is found, so finding one raises **both** n and the total. The total can therefore grow up to 101.

### 10.3 Functions

| Function | Behaviour |
|---|---|
| `eggFound(id)` | Returns false if already found. Otherwise adds the id to `found` and `declared`, persists `jiro-eggs`, notifies listeners, and returns true |
| `eggCount()` | Returns `[found ∩ declared count, declared.size]` |
| `noteEgg(id, text)` | Stores the first text only |
| `foundEggs()` | Found ids in discovery order, as `{id, text: notes[id] ?? id with -/_ → space}` |
| `resetEggs()` | Clears both keys and notifies listeners |
| `onEggs(fn)` | Registers a listener |

### 10.4 `api.egg(id, text)` (stage.ts)

1. `noteEgg(id, text)`.
2. If this is a first find, call `toast(text, 3600)`, add class `egg` to the toast, and set `data-egg = "Easter egg n/t"`. CSS then shows a green tag reading "Easter egg n/t found!".
3. On repeat finds, call `toast(text)` with the default 2600 ms.

Eggs never throttle. Every call toasts.

---

## 11. Sound (`src/engine/sfx.ts`)

- **Default state:** sound is ON unless `localStorage["jiro-sound"] === "off"`.
- **Toggling:** `setSound(on)` stores `"on"` or `"off"`.
- **AudioContext:** created lazily on the first `sfx()` call while sound is on. All sounds come from user gestures. If the context is suspended, it is resumed on every call. If construction fails, the sound is silent.
- **Header sound button:** toggles the state and the `.off` class, sets `aria-pressed`, and plays `chime` when turning sound on.

Building blocks:

- `tone(f0, f1, dur, type, vol = 0.08, delay = 0)`:
  - oscillator frequency: `setValueAtTime(f0)`, then `exponentialRampToValueAtTime(max(20, f1), t + dur)`
  - gain: `setValueAtTime(vol)`, then exponential ramp to `0.0001` at `t + dur`
  - chain: oscillator → gain → destination
  - stop at `t + dur + 0.02`
- `noise(dur, vol = 0.12, lp = 1200)`:
  - mono buffer of `sampleRate·dur` samples, where sample `i` = `(rand·2−1)·(1 − i/N)²`
  - chain: source → lowpass biquad (`frequency = lp`) → gain `vol` → destination
  - starts immediately

Recipes:

| Name | Recipe |
|---|---|
| pop | tone(500→900, 0.08 s, square, 0.05) |
| blip | tone(880→1320, 0.07, square, 0.04) |
| quack | tone(420→260, 0.14, sawtooth, 0.06), then tone(400→250, 0.12, sawtooth, 0.05, delay 0.16) |
| boom | noise(0.6, 0.25, lp 500) + tone(120→40, 0.5, sine, 0.15) |
| coin | tone(988, 0.08, square, 0.05), then tone(1319, 0.25, square, 0.05, delay 0.08) |
| meow | tone(700→1000, 0.12, triangle, 0.06), then tone(1000→500, 0.25, triangle, 0.06, delay 0.12) |
| splash | noise(0.5, 0.18, lp 2200) |
| whoosh | noise(0.35, 0.08, lp 900) |
| bonk | tone(220→110, 0.12, square, 0.07) |
| chime | tone(1568, 0.3, sine, 0.05) + tone(2093, 0.4, sine, 0.04, delay 0.1) |

---

## 12. Ambient and DOM helpers used by scenes

### 12.1 `src/engine/fx.ts`

All helpers are pure functions of `now`. Their periods divide `LOOP = 24` s, so nothing visibly restarts.

- **`wave(now, period, phase = 0)`:** `sin(((now % 24) / period)·2π + phase)`.
- **`glow(g, x, y, r, color, now, amt = .08, period = 6, seed = 0)`:**
  - radius factor `k = 1 + amt·(0.6·wave(period, seed) + 0.4·wave(period/3, seed·2.1))`
  - a radial gradient from `color` to transparent at `r·k`
  - drawn with `lighter` compositing into the square `x ± 1.3r`
- **`steam(g, x, y, now, seed = 0, h = 120, px = 6, alpha = .22)`:**
  - 7 puffs with period 6 s, each offset by `i·6/7`
  - `yy = y − f·h`, `xx = x + sin(5f + i + seed)·10f`, `r = px(1 + 2f)`
  - alpha `alpha·sin(fπ)`, colour `#f3eee4`
  - each puff is a rect snapped to a `px` grid, `2r` wide and `r` tall
- **`rain(g, now, x0, y0, w, h, count = 140, color = "rgba(170,200,255,.35)")`:**
  - streak `i`: `sx = (i·7919 % 997)/997`, `sy = (i·104729 % 991)/991`
  - `speed = 1.5 + (i·31 % 7)/7`, `period = 2.4/speed`, `f = frac(now/period + sy)`
  - line from `(x0 + sx·w − 30f, y0 + fh)` to `(−5, +22)` relative, lineWidth 2
- **`stars(g, now, pts, color = "#eef3ff")`:**
  - one 3x3 px square per point
  - alpha `0.35 + 0.65·(0.5 + 0.5·wave(now, [4,6,8,12][i%4], 1.7i))`
- **`shade(g, x, y, w, h, alpha = .55, feather = 160, side = "left")`:**
  - a linear gradient of `rgba(8,6,5,alpha)` that is solid until `1 − feather/w` (or `/h`), then fades to 0 toward the named side's opposite edge
- **`motes(g, now, x0, y0, w, h, n = 18, color = "rgba(255,220,160,.7)")`:**
  - `period = 12 + (i%3)·6`, `f = frac(now/(24/round(24/period)) + i/n)`
  - `x = x0 + frac(0.618i)·w + sin(2πf + i)·14`, `y = y0 + h − fh`
  - alpha `0.6·sin(fπ)`, 3x3 squares
- **`hole(g, x, y, w, h)`:** a solid `#050404` rectangle.

### 12.2 `src/engine/dom.ts`

All positions are in stage px.

| Helper | Behaviour |
|---|---|
| `html(el, markup)` | Parses the markup and appends its first element to `el`. Returns that element |
| `place(el, x, y, w?, h?)` | Sets absolute `left`/`top`, plus `width`/`height` when given |
| `hotspot(parent, x, y, w, h, title, onClick)` | Creates a `<button class="hit">` with `title` and `aria-label`, placed at the rect. Its click calls `stopPropagation()` then the handler, so it never reaches the canvas click logic |
| `bubble(parent, x, y, text, ms = 2600, cls = "")` | Creates `<div class="bubble cls">`, adds `on` on the next frame, and returns `kill()`. `kill()` removes `on`, then removes the node after 300 ms. It runs automatically after `ms` if `ms > 0` |

---

## 13. Site chrome

Chrome lives in viewport px, outside the stage transform. The markup comes from `start()` (§4.3). The behaviour lives in `src/chrome.ts`, called as `setupChrome(api)`, which runs `scrollHint()`, `eggPopover(api)`, `railProgress()`, then `narrowHint()`. Secrets live in `src/main.ts`.

The module-level flag `pinned = ?seg || ?p` is set in `chrome.ts`, and the loader script has an equivalent check.

### 13.1 Loader (inline in `index.html`)

- If `?seg` or `?p` is present, remove the loader immediately.
- Otherwise:
  1. Rotate the `<small>` line every 900 ms through: `seasoning with vinegar`, `fanning the rice`, `sharpening the yanagiba`, `warming the copper hands`.
  2. Preload these 8 images, in this order: `art/bar.jpg, items/tuna.png, items/salmon.png, items/tamago.png, items/maki.png, items/ikura.png, items/ebi.png, items/duck.png`.
  3. Each `onload`/`onerror` increments `n` and sets the bar width to `round(n/8·100)%`, animated with `steps(6)` over 0.3 s.
  4. When all 8 are done **and** `#app #stage` exists, call `done` after 120 ms. If the stage is not there yet, re-check every 100 ms.
  5. **Hard cap:** `done` fires at 4000 ms regardless.
- `done` stops the text rotation, adds `.done` (0.5 s opacity fade), and removes the element after 600 ms.

### 13.2 Header `.top`

| Property | Value |
|---|---|
| position | fixed, top, full width |
| layout | flex, gap 16px |
| padding | 14px 22px 22px |
| z-index | 5 |
| pointer-events | none on the header, auto on its children |
| background | `linear-gradient(rgba(11,10,9,.62), rgba(11,10,9,.28) 55%, transparent)` |

Elements:

- **Logo:**
  - `<img>` is 34x32, pixelated, with drop-shadow `0 2px 0 rgba(0,0,0,.6)`. On hover it rotates −8deg and lifts 2px (`.15s steps(2)`).
  - Text "jiro.bot" in Silkscreen 22px with text-shadow `0 2px 0 rgba(0,0,0,.7)`. The dot is copper.
- **`.by`:**
  - text "by Nori" in JetBrains Mono 12px, muted
  - `em` is green, underlined on hover
  - `margin-left: -4px`
- **`.top-right`:** `margin-left: auto`, gap 16px.
  - **Sound button `.snd`:** 36x36, background `rgba(20,16,13,.82)`, pixel frame (§13.9) plus `0 5px 0 0 rgba(0,0,0,.55)`. Hover turns it green, including the frame edge. With `.off`, it is muted and shows the `.x` cross instead of the `.w` waves.
  - **CTA `.cta` "Reserve a seat"** → `https://noriagentic.com/`, opens a new tab. Silkscreen 14px on copper, text `#1a0f07`, padding 11px 16px. It has a 3px copper notched frame plus a `0 6px 0 0 #7a4220` drop. Hover: `brightness(1.1)`. Active: `translateY(3px)` and the drop is removed.
- **Focus-visible outlines** on header controls, the eggs button, ledger buttons, and rail pips: `2px dashed var(--green)`, offset 5px.

### 13.3 Rooms rail `.rail`

**Container and track:**

- Fixed at right 12px, vertically centred. Column layout, gap 6px, z-index 5.
- `.track` is a 2px dashed line (`repeating-linear-gradient(rgba(243,230,207,.28) 0 2px, transparent 2px 4px)`) spanning top 12px to bottom 12px.
- `.track b` is a copper fill whose height is `calc(var(--prog)·100%)`.
- **Progress:** `railProgress()` sets `--prog = min(1, scrollY / (scrollHeight − innerHeight))` on every scroll (passive) and resize.

**Buttons and pips:**

- Buttons are 22x18.
- Pip `i`: 8x8, background `#1a1512`, ring `0 0 0 2px rgba(243,230,207,.55)` plus drop `0 2px 0 2px rgba(0,0,0,.5)`.
- On hover the ring turns cream and the pip scales to 1.25.
- **Active (`.on`):** copper fill, copper ring plus an outer `0 0 0 4px rgba(11,10,9,.8)`, scale 1.25.

**Labels (`span`):**

- Positioned left of the pip (`right: 26px`). Silkscreen 11px, cream text, background `rgba(11,10,9,.88)`, padding 5px 7px 4px.
- Hidden by default. They appear on hover or focus, sliding 4px → 0.
- The active label is copper and plays `railflash 2.6s`: visible until 70%, then faded out. Hovering the rail, or focusing the active button, keeps it visible.

### 13.4 Egg counter and ledger

**Placement:** `.eggbox` is fixed at left 16px, bottom 16px, z-index 7.

**Button contents** (re-rendered on every egg change):

```html
<i class="star"></i><span class="n"><b>n</b>/t</span><span class="l">easter eggs</span>
```

It also sets `aria-label="n of t easter eggs found"`.

**Button styling:**

- Silkscreen 12px, muted; `b` is cream. Background `rgba(14,11,9,.88)`, pixel frame, padding 8px 10px 7px.
- The star is a 12x12 copper 8-point `clip-path` star.
- Hover, or `aria-expanded="true"`, turns the frame edge copper.
- **On any egg change:** the `bump` class is re-triggered (remove, force reflow, add). This plays `eggbump .5s steps(4)` (−5px, then +1px) and turns the star green.

**Ledger `#eggpop`:**

- Toggled by clicking the button. Any window click closes it, and so does Escape, which also returns focus to the button. Clicks inside the ledger stop propagation.
- Styling: 340px wide, max-height `min(60vh, 440px)`, `#15110e`, copper pixel frame plus `0 7px 0 0 rgba(0,0,0,.6)`. It opens 16px above the button.
- Content, rendered on open and on egg changes while open:
  - `<header>`: "Egg ledger" in copper Silkscreen 14px, and `n/t` in muted 12px.
  - Found eggs as an `<ol>` of their texts in discovery order: Instrument Sans 14px `#e7d8bf`, green mono markers. If there are none: "Nothing yet. Try clicking the plates on the belt. Or the chef. Or the cat."
  - `<footer>` in mono 11px:
    - "All found. Jiro bows deeply." when none are left, otherwise "`k` still hiding. Some only come out if you type."
    - a `reset` link-button when `n > 0`. It calls `resetEggs()`, toasts "Easter eggs reset. Happy hunting.", and re-renders.
  - Header and footer use `2px dashed rgba(243,230,207,.14)` separators.
- The text is HTML-escaped for `& < > "`.

### 13.5 Toast `#toast`

**Placement and animation:** fixed at left 19px, bottom 70px, z-index 6, `pointer-events: none`. It is hidden with `opacity 0; translateY(8px)`. `.on` shows it over 0.2s, with the transform using `steps(3)`.

**Styling:**

- Cream background, text `#1b130d`, pixel frame with `--edge: #1b130d` plus `0 6px 0 0 rgba(0,0,0,.55)`.
- Padding 10px 16px 10px 12px, max-width `min(440px, 70vw)`.
- Avatar: mini-jiro at 34x32.
- Text: Instrument Sans 500 15px/1.4.
- `::after` is a stepped pixel speech tail, 12px, at the bottom-left (`left: 18px`, `bottom: -12px`).
- `.egg::before` is `attr(data-egg) " found!"`: Silkscreen 11px on green `#6fdc8c`, text `#07130b`, with a `0 2px 0 #2d7a45` drop, positioned at top −13px.

**Behaviour:** `api.toast(text, ms = 2600)` sets the text, removes `.egg`, adds `.on`, and restarts a single timer.

### 13.6 Scroll hint `.scroll-hint`

- **Removed immediately** if pinned, if `scrollY > 10`, or if there is a hash other than `#bar`.
- **Shown** by adding `.on` after 1400 ms (after the loader). It then fades in over 0.5s and slides from +8px.
- **Dismissed** on the first scroll event with `scrollY ≥ 30`: `.gone` fades it, and it is removed after 600 ms.
- **Styling:** bottom-centre at 18px. Silkscreen 11px, letter-spacing .06em, cream text on a `rgba(11,10,9,.72)` label.
- **Chevron:** a 12x8 copper stepped chevron (`clip-path`) animating `nudge 1.4s steps(3)` (4px down).
- Hidden at ≤700px wide.

### 13.7 Rotate card (`narrowHint`)

The card is always appended to `body`:

```html
<div class="rotate"><div class="rot-card">
  <img src="${BASE}items/mini-jiro.png" alt="" />
  <p class="px">Jiro's is a landscape establishment.</p>
  <p>Turn your phone sideways for the full omakase. The belt is long and the counter is wide.</p>
  <button type="button">Sit at the counter anyway</button>
</div></div>
```

The button removes the card permanently for the page view. It is not persisted.

**Visibility:** `display: none`, except under `@media (max-width: 700px) and (orientation: portrait)`. There it is a fixed full-screen overlay: z-index 40, background `rgba(11,10,9,.92)`, padding 24px.

**Card styling:**

- Max 320px wide, centred grid, gap 14px.
- Image: 72x68, animating `tilt 2.4s steps(4)` (0 → −90deg).
- `.px` headline: 20px/1.25.
- Body text: Instrument Sans 16px/1.5 `#e7d8bf`.
- Button: Silkscreen 13px on green, text `#07130b`, padding 12px 14px, `0 4px 0 #2d7a45` drop.

### 13.8 Narrow screens (`@media (max-width: 700px)`)

| Element | Change |
|---|---|
| `.top` | padding 8px 10px 12px, gap 8px |
| logo image | 24x23 |
| logo text | 15px |
| `.by` | 10px |
| `.top-right` | gap 10px |
| `.snd` | 28x28 |
| `.cta` | 10px, padding 7px 9px |
| rail | right 6px, gap 2px, no labels |
| `.eggbox` | left 8px, bottom 8px |
| `.eggs` | 10px, padding 6px 7px 5px, "easter eggs" label hidden |
| `.eggpop` | width `min(300px, 100vw − 24px)` |
| toast | bottom 50px, left 12px, text 13px, avatar 24x23 |
| scroll hint | hidden |

### 13.9 Shared CSS tokens (`src/style.css`)

```css
:root {
  --ink: #0b0a09; --cream: #f3e6cf; --muted: #bfae95; --copper: #d98a4a;
  --green: #6fdc8c; --pink: #ff5fc8; --cyan: #5ff0ff;
  --px: "Silkscreen", monospace;
  --sans: "Instrument Sans", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;
  --pxframe: 0 -3px 0 0 var(--edge, rgba(243,230,207,.28)), 0 3px 0 0 var(--edge, …), -3px 0 0 0 var(--edge, …), 3px 0 0 0 var(--edge, …);
}
```

`--pxframe` produces a "notched-corner pixel frame" from 4 offset box-shadows coloured by `--edge`.

Global rules:

- `* { box-sizing: border-box }`
- `html, body` use the ink background, cream text, `--sans`, and antialiasing
- `body { overscroll-behavior: none }`
- `#scroll { width: 1px }`
- `#ui { pointer-events: none }`
- `#ui .layer { position: absolute; inset: 0; transition: none }`
- Inside `.live` layers only, these receive pointer events: `button`, `a`, `.hot`, `video`, `.arcade`, `.answer`, `figure`

`style.css` also holds shared **stage-space** component styles used by scene docs:

- `.copy`, `.kicker`, `.px` (`h1.px` 76px, `h2.px` 56px), `.lede`, `.ctas`, `.btn.primary` / `.btn.ghost`, `.hint`
- `.hit`, `.bubble`
- `.product-win*`, `.product-cap`
- `.cmp*` (comparison), `.faq-sushi*`, `.answer*`
- `.laundry` / `.towel`, `.neon-*`
- `.game-*`, `.mole`, `.arcade*`
- `.foot`, `.office-head h2.px` (46px)

Copy them verbatim from the file. Their use is documented with each scene.

**Reduced motion (CSS):** `html { scroll-behavior: auto !important } *, ::before, ::after { animation: none !important; transition: none !important; }`.

### 13.10 z-index stack (viewport)

| Layer | z-index |
|---|---|
| `#frame` (canvas + `#ui`) | auto, fixed |
| header, rail, scroll hint | 5 |
| toast | 6 |
| eggbox | 7 |
| rotate card | 40 |
| loader | 50 |

---

## 14. Keyboard, global secrets and console

### 14.1 Navigation (`stage.ts`, window keydown)

**Ignored when:**

- the event is already `defaultPrevented`
- Ctrl, Meta, or Alt is held
- focus is in `input`, `textarea`, `select`, or `[contenteditable]`
- the key is Space or Enter while focus is on a `button` or `a`

`sceneIdx` is the active scene's index. During a transition, it is the `from` scene's index.

| Key | Action |
|---|---|
| ArrowDown, PageDown, Space | `goto(scenes[min(n−1, idx+1)])` with preventDefault |
| ArrowUp, PageUp, Shift+Space | in a scene: `goto(scenes[max(0, idx−1)])`. In a transition: `goto(scenes[idx])`, back to the `from` room. preventDefault |
| Home / End | first / last scene |
| `1`–`9` | `goto(scenes[digit−1])` if it exists (1–8 today). No preventDefault |

The digit mapping is in §5.1.

### 14.2 Secrets (`main.ts`)

| Trigger | Effect | Egg id / text |
|---|---|---|
| **Konami**: last 10 `e.key` values = ↑↑↓↓←→←→ `b` `a` (case-sensitive `b`/`a`) | `override.item = "duck"` for **30 s**, `sfx("quack")` | `konami`: "Konami code: every plate is a rubber duck for 30 seconds." |
| Typing **"omakase"**: rolling buffer of the last 12 lowercase single-char keys | `override.item = "gold"` for **20 s**, `sfx("coin")` | `omakase`: "Omakase: chef's choice. The chef chose gold." |
| Typing **"sudo"** | `override.item = "maki"` for **15 s**, `sfx("blip")` | `sudo`: "sudo make me a sandwich? This is a sushi bar. Rolling you maki instead." |
| **Logo taps**: 5 clicks on `.logo`, each within 1.5 s of the previous (timer resets the count) | exactly on the 5th tap | `logo-5`: "jiro.bot was almost called sushi.exe." |
| **Tab away**: `visibilitychange` hidden | `document.title = "🍣 come back, the rice is getting cold"` | none |
| **Return to the tab** after more than 3000 ms away | restore the title | `tab-away`: "You came back! Jiro kept your seat warm. The rice, less so." |
| **Console**: `jiro.hire()` | returns `"🍣 Seat reserved. Real reservations: https://noriagentic.com/"` | `console`: "Found in the console: Jiro reviews stack traces the way others read menus." |

How the secrets behave:

- The secrets handler ignores events whose target is inside `input` or `textarea`.
- **Overrides:** `override.item` swaps the item on **every** plate everywhere, including rested-plate draws that re-read items, because `itemFor` returns the override. Each override clears itself to `null` after its timeout. Overlapping triggers share one variable, so the earliest-ending timer can clear a later override early.
- **Konami quirk:** the arrow keys also drive room navigation (§14.1), so entering the code scrolls around.
- **Logo quirk:** each logo click also runs `goto("bar")`.

**Console banner** on load (three `%c` styles):

```js
console.log(
  "%c jiro.bot %c your AI staff engineer, by Nori\n%cPsst, reading the console? Type jiro.hire() for an easter egg.",
  "font:700 14px monospace;background:#d98a4a;color:#1a0f07;padding:2px 6px",
  "font:14px monospace;color:#6fdc8c",
  "font:12px monospace;color:#bfae95",
);
```

---

## 15. URL parameters (screenshot and debug)

| Param | Where | Effect |
|---|---|---|
| `?freeze=<seconds>` | stage.ts | Freezes `now` for all scene, belt, and transition drawing (deterministic frames). Pops and drag animations still use real time. `?t=` is **ignored** since v3 (old shared links carried `?t=<unix time>` and froze the belt). `tools/qa/seg.mjs --t=N` passes `freeze=N` |
| `?debugplates=1` | belt.ts, drag.ts | Boosts chats, falls and walking legs (§7.5) |
| `?p=<vh>` | stage.ts | Fixes the scroll position in viewport heights (e.g. `?p=8.5`). Smoothing is off, and real scrolling is ignored |
| `?seg=<id>&tt=<0..1>` | stage.ts | Renders segment `id` at local progress `tt`: `p = start + min(0.9999, tt ?? 0.5)·len`. Encode `>` as `%3E` for transitions, e.g. `?seg=bar%3Eoffice&tt=0.5`. An unknown `seg` falls back to `?p`. If `?p` is also missing, the page scrolls normally |
| `?seg` or `?p` present | index.html, chrome.ts | The loader is removed instantly, and the scroll hint never shows |
| `?mood=<1..10>` | `src/moodboard/viewer.ts` | Initial moodboard version in the pantry (clamped to 1–10). Defaults to 1 |
| `#<sceneId>` | stage.ts | Deep link: `goto` after 50 ms. The hash is kept in sync while scrolling |

Other debug hooks:

- `window.__segs` holds the segment table; `window.__chain` the belt chain; `window.__belt` / `window.__scenes` the live belt module and scene map (QA scripts `plates.mjs`, `life-scan.mjs`, `legs.mjs`); `window.__beltProbe(path, phase, U, off)`, if set, is called for every `platesOn` (used by `align.mjs`).
- `document.body.dataset.segment` holds the active segment id.

---

## 16. Reduced motion

`reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches` is read **once at start** and is not live. It is exposed as `api.reducedMotion` for scenes to honour.

Engine effects:

- The scroll smoothing factor becomes 1, so the view jumps straight to the scroll position.
- `goto` uses `behavior: "auto"` (instant).
- The CSS kills every animation and transition, including the loader bob and bar, the rail flash, the egg bump, the toast slide, the scroll-hint nudge, and the rotate-card tilt.

The canvas belt, plates, and ambient `fx` **still animate**. The engine never pauses time. Any reduction there is up to individual scenes via `api.reducedMotion`.

---

## 17. Other localStorage keys

For completeness, the engine and chrome own `jiro-eggs`, `jiro-egg-notes`, and `jiro-sound`. Other modules write:

| Key | Module |
|---|---|
| `jiro-bar-poked` | `scenes/bar.ts` |
| `jiro-dragged` | `scenes/bar.ts`, the drag-hint once flag |
| `jiro-best-flappy` | `games/flappy.ts` |

---

## 18. Rebuild checklist

1. Scaffold with Vite 6 + TS 5.6, using the exact `package.json`, `vite.config.ts`, and `tsconfig.json` (§1).
2. Copy `public/` as-is.
3. Write `index.html` exactly as described (§2, §13.1).
4. Write `types.ts` verbatim (§3), then `items.ts` (catalogue verbatim, hashing §7.5), `eggs.ts` (§10), `sfx.ts` (§11), `fx.ts` and `dom.ts` (§12).
5. Write `belt.ts` with the verbatim `bake`, `platesOn`, and `plateSprite` (§7). Constants: 46, 150, 26, 64, 52, 40/40.
6. Write `drag.ts` (§8). Constants: 14, 0.55/0.35/0.5, 6 px, 80 ms, 0.8·width, 20-unit sampling, 50/25/25 split.
7. Write `stage.ts` `start()` (§4–§6, §8.1, §8.4, §14.1), with `fit()` verbatim and smoothing 0.18.
8. Write `chrome.ts` (§13), `style.css` (copy verbatim), and `main.ts` (§4.1, §14.2).
9. Sanity checks:
   - `window.__segs` matches the table in §5.1 (total 17.85)
   - the egg counter reads `0/88` in a fresh profile
   - `?seg=bar&t=0` renders deterministically
   - plates keep identical spacing and speed across every room boundary
