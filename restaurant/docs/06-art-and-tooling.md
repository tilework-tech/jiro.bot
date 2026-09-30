# 06 · Art pipeline, asset inventory and tooling

This document covers how every pixel in `public/` was made and which tools made it, so the site can be rebuilt
from scratch. It also covers the Playwright tooling used to capture, record and QA the site. The build ran on
2026-09-29 on a Nori session machine. Everything that lived outside the git repo on that machine (`/tmp`,
`.local/pw`, `.local/compare`, `~/.venv-sushi`) was copied into `tools/` before the machine was released.
V3 (branch `restaurant-belt-v3`, 2026-09-30) added the scripts and assets marked **V3** below; its agents wrote
their tools straight into `tools/art/*` and `tools/qa/*`, so nothing had to be rescued from `/tmp` this time
(except the V3 item prompts, recorded verbatim in §8.6).

Paths are relative to `restaurant/` unless stated otherwise. Coordinates are stage pixels on the fixed
1920×1080 canvas.

Contents:

1. [Environment setup from scratch](#1-environment-setup-from-scratch)
2. [What is in `tools/`](#2-what-is-in-tools)
3. [Gemini still pipeline](#3-gemini-still-pipeline-pipelinegen_stillpy)
4. [Editing existing art: "Same image … only change" + paste-back](#4-editing-existing-art)
5. [Sprites: magenta keying](#5-sprites-magenta-keying)
6. [Veo video pipeline (present, unused)](#6-veo-video-pipeline-present-unused)
7. [First-pass scene prompts (verbatim)](#7-first-pass-scene-prompts-verbatim)
8. [Asset inventory: every file under `public/`](#8-asset-inventory)
9. [Source art that is not served (`art/`)](#9-source-art-that-is-not-served-art)
10. [Nori product UI capture (office scene)](#10-nori-product-ui-capture-office-scene)
11. [Generic vs Jiro comparison recordings (dining scene)](#11-generic-vs-jiro-comparison-recordings-dining-scene)
12. [QA workflow](#12-qa-workflow)
13. [Known loose ends](#13-known-loose-ends)

---

## 1. Environment setup from scratch

What the original machine had: Node 22.20.0, Python 3.11.2, `uv`, no system `ffmpeg`, no Docker.

```bash
# 0) repo
git clone https://github.com/tilework-tech/jiro.bot.git && cd jiro.bot/restaurant   # the restaurant work is on branch restaurant-belt

# 1) Node 22 + site deps (vite ^6, typescript ^5.6)
node -v            # v22.x
npm i
npm run dev        # vite --host 0.0.0.0 --port 3000   (every tool assumes http://localhost:3000)
                   # vite.config.ts already sets allowedHosts: true (needed behind the session proxy)

# 2) Playwright for the tools (pinned to 1.63.0, the version used)
cd tools && npm i && npx playwright install chromium && cd ..
#   no root? skip install-deps; on Nori session boxes the libs are already present

# 3) Python venv for the pipeline and the art scripts
uv venv ~/.venv-sushi
VIRTUAL_ENV=~/.venv-sushi uv pip install -r tools/requirements.txt
#   pillow 12.3.0, numpy 2.4.6, requests 2.34.2, imageio-ffmpeg 0.6.0
~/.venv-sushi/bin/python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"
#   -> .../imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2   (this is the only ffmpeg; export FF=<that path>)

# 4) Gemini key (image model + Veo). Stored as an org custom env var on Nori; set it locally otherwise.
export GEMINI_API_KEY=...        # never commit it
```

The Python scripts in `tools/art/**` resolve the repo with `RESTAURANT_ROOT`. The default is the path of the
script (`tools/art/<x>/` → `../../..`), so they work from any cwd. Their scratch inputs still point at the
original `/tmp/<job>/` work dirs (for example `/tmp/polish-office/bg1_1920.png`). Those inputs were
intermediate Gemini outputs and are not in the repo. Regenerate them with the prompt from
`tools/prompts/gemini-calls.md` and save them at the same path, or edit the path. Most Playwright scripts write
screenshots to a hard-coded `/tmp/<dir>`, so create it first (`mkdir -p`). `seg.mjs`, `shot.mjs`,
`bar-frames.mjs`, `pond-seq.mjs`, `st2shot.mjs`, `contact-sheet.mjs` and `crop-grid.mjs` take the output path as
an argument.

---

## 2. What is in `tools/`

`tools/package.json` depends on `playwright` 1.63.0 only. `tools/requirements.txt` lists the Python deps.
`node_modules/` is gitignored. Run the `.mjs` scripts from anywhere with `node tools/<path>`, because Node
resolves `playwright` by walking up to `tools/node_modules`.

"Status" means: **live** = still matches the current site; **historic** = targets something that was later
removed (kept because the method is reusable; see the note).

### 2.1 `tools/qa/` — screenshots and visual checks

| File | Status | What it does |
|---|---|---|
| `seg.mjs` | live | **The key tool.** `node tools/qa/seg.mjs OUT_DIR [--t=5] [--debugplates] [--w=1600] [--wait=600] [--url=http://localhost:3000/] seg:tt [seg:tt …]`. Opens `?seg=<seg>&tt=<tt>&freeze=<t>` (plus `&debugplates=1`) at a 16:9 viewport `w` wide, waits `networkidle` + `wait` ms, and writes `OUT_DIR/<seg with > → ->@<tt>.png`. Prints page errors and console errors, or `no errors`. |
| `shot.mjs` | live | `node shot.mjs BASE OUT p1 p2 …`: screenshots at `?p=<scroll position in viewport heights>&freeze=5`, 1600×900. |
| `bar-frames.mjs` | live | `node bar-frames.mjs OUT seg tt t1 t2 …`: 1920×1080 frames at several frozen times, with up to 4 retries while the loader (`#loader`) is still up. Useful when a shared dev server keeps hot-reloading. |
| `pond-seq.mjs` | live | `node pond-seq.mjs OUT t0 t1 step cx cy cw ch`: clipped frame sequence of `pond` over time (used for the koi jump timing). |
| `st2shot.mjs` | live | `node st2shot.mjs OUT.png seg tt [t]`: 1920 screenshot, and prints the street menu board's bounding boxes. |
| `seam-grab.mjs` | live | Grabs the raw `#stage` canvas with `toDataURL` (no DOM overlays) for scene↔transition endpoint pairs (storage/storage>street, street/street>pond …) to diff them exactly. Writes to `/tmp/street2/c<i>{a,b}.png`. |
| `contact-sheet.mjs` | live | `node contact-sheet.mjs DIR OUT.png [PREFIX]`: tiles every `PREFIX@<tt>.png` from `seg.mjs` into a 2-column × 800 px sheet labelled with tt (rendered by Chromium, no PIL needed). |
| `crop-grid.mjs` | live | `node crop-grid.mjs IMG x y w h scale OUT`: nearest-neighbour zoom of an art region with a labelled 50 px grid in stage coordinates. Used to read coordinates for belts, hotspots and surfaces. |
| `zoom-grid.py` | live | Same idea in PIL: `python zoom-grid.py <scene> x0 y0 x1 y1 zoom OUT` (run from `restaurant/`; reads `public/art/<scene>.jpg`; 20 px grid, 100 px labelled). |
| `errs.mjs` | live | Loads one URL and logs page errors plus HTTP ≥ 400 responses (missing assets). |
| `chrome-probe.mjs` | live | `node chrome-probe.mjs WIDTH`: prints scroll/header/frame offsets (used to chase the "page shifted 32 px" screenshot artefact). |
| `chrome-flow.mjs` | live | Loader → scroll hint → typing `sudo` toast → egg ledger → rail hover → 390×844 portrait card. Writes to `/tmp/polish-chrome/flow/`. |
| `yardzoom.mjs` | historic | Clipped zooms of the yard scene (the yard was removed in round 2). |
| `chain.mjs` | live, V3 | Prints the engine's belt chain (`window.__chain`): per scene phase, path length `U`, global offset `off`, `gap` to the next scene. |
| `align.mjs` | live, V3 | `node align.mjs [seg …]` (default: every transition). Hooks `window.__beltProbe`, lists every path a transition draws with its offset, and checks each join: delta 0 = the same plate continues; delta/130 = slot shift. Run after touching any belt path or `gap`. |
| `life-scan.mjs` | live, V3 | `node life-scan.mjs SCENE T0 T1 [--debugplates]`: steps time by 0.25 s and prints when plates chat, fall or shatter; use it to pick `--t` values. |
| `plates.mjs` | live, V3 | `node plates.mjs SCENE T0 T1 STEP [--debugplates]`: per frozen time, the plates on the scene belt (id, item, x, y, bubble, falling). |
| `legs.mjs` | live, V3 | `node legs.mjs OUT_DIR`: parks two bar plates on the counter with `?debugplates=1` and screenshots them walking. |
| `_occ_tmp.mjs` | scratch, V3 | Prints `slotOccupied` for ids −150…250 as an `o`/`.` strip (occupancy tuning). |
| `flappy-test.mjs` | live, V3 | `node flappy-test.mjs OUT W H [seconds]`: opens Flappy Koi (touch context under 900 px), plays with a bot, screenshots, logs errors; blocks HMR. |
| `pond-t.mjs` | live, V3 | `node pond-t.mjs OUT t1 t2 … [--clip=x,y,w,h]`: pond frames at frozen times. |
| `pond-list.mjs`, `pond-fate.mjs`, `pond-dbg.mjs`, `pond-verify.mjs` | live, V3 | Read the pond's `window.__pond` hook: list upcoming koi fates (`leap`/`wait`/`miss` with arrival times), shoot frames around the first plate with a given fate (`pond-fate.mjs OUT kind dt…`), dump events, and sweep 10 time windows checking every plate gets exactly one consistent fate. |
| `pond-click.mjs` | live, V3 | Clicks the pond eggs (koi, lantern, moon, duck in the water) and opens Flappy Koi, printing the egg counter after each. |

### 2.2 `tools/interact/` — click, drag and game tests

All of these find a plate by moving the mouse along the belt and polling `#frame.classList.contains("over-plate")`.
They read toasts from `#toast p` and egg state from `localStorage["jiro-eggs"]`.

| File | Status | What it does |
|---|---|---|
| `surftest.mjs` | live | Generic surface test: `node surftest.mjs <scene> "x0,y0,x1,y1" "tx,ty;tx,ty" OUT.png` (belt sample line, then drop targets in stage coords). Blocks the HMR websocket (`routeWebSocket`) so parked plates survive other agents' reloads. Set `SHOTS=1` for one screenshot per drop. |
| `bar-aff.mjs` | live | Bar hero affordances: freezes the `bar-glint` CSS animations at chosen times, hovers and clicks the lantern, Jiro and the customer, and drags plates to the counter, floor, shelf and far end. Writes to `/tmp/bar2/`. |
| `dining-drag.mjs` | live | Drags plates onto a table, the counter and the wall in the dining room and logs the toasts. Writes to `/tmp/dindrag/`. |
| `dining-click.mjs` | historic | Clicks a comparison window and the "diner" egg (the click-to-enlarge was later replaced by click-to-replay). |
| `kitchen-click.mjs` | live | `node kitchen-click.mjs OUT`: clicks the FAQ sushi, closes with × and Esc, then the kitchen eggs (Plate stack, Swinging doors, Jiro, Knives, Pot). |
| `st-drag.mjs` | partly historic | Storage: drags onto the crate, barrel and tub; clicks the Stripe tape label; the hose click no longer opens Snake (removed in V3; the hose is an egg now). Uses `toClient()` to map stage coords through the canvas rect. |
| `st-play.mjs` | historic | Whack-a-Bug alignment (forces all moles up). Whack-a-Bug was removed. |
| `st2drag.mjs` | partly historic | Street: finds a plate on the vertical belt at x=1740 and drops it where the trike's cargo box was (V3 bicycle scene: re-aim at its surfaces, see 03). |
| `pond-drag.mjs` | live | Pond: drags a pier plate to the water. |
| `pond-egg.mjs`, `pond-duck.mjs` | live | Pond eggs (drop a duck in the water and wait for the gulp; moon, lantern, koi). The `jiro` click in `pond-egg.mjs` is historic, since Jiro left the bridge. |
| `games.mjs` | partly historic | `node games.mjs all|whack|snake|flappy`. Only `flappy` still applies (Snake removed in V3; the Flappy state format may have changed with the V3 rewrite, prefer `qa/flappy-test.mjs`). Snake and Flappy bots read the game state from `canvas.dataset.s` ("hx,hy,fx,fy,dx,dy" / "state,y,gapY,vy") and steer greedily. **Snake now lives in `storage`, not `yard`** (change `open("yard")` to `open("storage")`). The whack part is historic. |
| `flappy-bot.mjs` | live | In-page `requestAnimationFrame` Flappy bot (reached 30 posts in 40 s). |
| `touch.mjs` | partly historic | `hasTouch`/`isMobile` context: taps to flap and swipes Snake (Snake removed in V3). |
| `yardclick.mjs` | historic | Yard eggs and towels. |
| `aqdrag.mjs`, `fishtest.mjs` | historic | Aquarium stop and the "Fish Frenzy" game (reverted in commit 96a7cc3; code and art are in git history). |

### 2.3 `tools/moodboard/` — MCP pantry moodboard previews

`mood-all.mjs` shoots all 10 versions (`?seg=pantry&tt=0.5&t=5&mood=N`, waiting 7 s each) to `/tmp/moodqa/`. Since V3 `&t=5` is ignored (the clock runs); use `&freeze=5` for identical frames.
`mood-docs.mjs` writes the same shots as `docs/img/mood-vNN.jpg` (q80). `mood-v01.mjs` … `mood-v10.mjs` are the
per-version interaction scripts (click recipes, drag tiles, hover rows):
- `mood-v03.mjs` uses the preview hooks `?v03r=<recipe>&v03t=<ms>`.
- `mood-v04.mjs` hides `vite-error-overlay` and stubs other versions' modules when they 404.
- `mood-v09.mjs` targets a no-HMR Vite on port 3909 (config: `export default { root: <restaurant>, base: "./", server: { hmr: false, watch: null, port: 3909, strictPort: true } }`).

### 2.4 `tools/transitions/` — kitchen→storage candidate tooling

Round 2 prototyped six kitchen→storage transitions (A–F) on preview pages `public/preview/ks-{a..f}.html`. F won,
and the other five plus the preview pages were deleted in commit 58c10f2. To use `ks-a.mjs`, `ksb.mjs`,
`ksd-sheet.mjs`, `ks-e.mjs` and `ksf.mjs` again, restore the pages with
`git show ed80e55:restaurant/public/preview/ks-f.html > public/preview/ks-f.html`.
- `ks-a-diff.mjs` grabs exact canvas frames at tt 0.0005 and 0.9999 next to the scenes.
- `ks-*-sheet.py` tile the frames and print `ImageChops.difference` extrema and bbox, which is the endpoint-match check.
- `cam-spline.mjs` and `ks-d-cam.mjs` print camera keyframes (Hermite spline, zoom clamp) for tuning.
- `yardcross.mjs` swaps a candidate `cross.jpg` in via `page.route` before overwriting the real file. Use this
  trick for any art swap.

### 2.5 `tools/compare/`, `tools/product/`

See [§10](#10-nori-product-ui-capture-office-scene) and [§11](#11-generic-vs-jiro-comparison-recordings-dining-scene).

### 2.6 `tools/art/` — the PIL scripts that produced the assets

Each is described with its asset in [§8](#8-asset-inventory). Common helpers:

| File | What it does |
|---|---|
| `common/pasteback.py` | **Written during the rescue (generalised):** paste one feathered rectangle of a Gemini edit onto the original ([§4](#4-editing-existing-art)). |
| `common/key_magenta.py` | **Written during the rescue (wrapper):** runs `cat/key.py`, the cleanest magenta keyer ([§5](#5-sprites-magenta-keying)). |
| `common/gen_text.py` | Copy of `gen_still.py` with "No text, no letters," removed from STYLE. Used when a generated image must contain lettering (kitchen→storage candidate B's signage). Made with `sed 's/ No text, no letters, no watermark, no UI, no borders./ No watermark, no UI, no borders./' pipeline/gen_still.py`. |
| `common/export_first_pass.py` | **Reconstructed:** the lead agent's first export of every scene to 1920×1080 q90 (cover-crop to 16:9). It overwrites the final art, so use it only for a from-scratch rebuild. |
| `common/belt-overlay.py` | `python belt-overlay.py '[[x,y,s],…]' WIDTH`: draws a belt polyline plus its width ticks over `yard_new.png` to trace belt points onto painted belts. Change the input filename for other scenes. |
| `chrome/og_and_favicons.py` | **Reconstructed:** favicons and `og.jpg` (needs `Silkscreen.ttf`). |

V3 art scripts (all committed, all run with `/tmp/venv/bin/python`; several hard-code the session path
`/home/sprite/org/workspace/.local/jiro.bot/restaurant`, adjust `ROOT` elsewhere):

| File | Output | What it does |
|---|---|---|
| `bar/parts.py` | `public/art/bar/parts.png` + the `PARTS` table in `bar.ts` | Polygon-cuts the bar's moving parts (noren cloth, customers' heads and hands, Jiro's hand and jaw, a toe) from `bar.jpg`, plus clean background patches (`*-bg`) for parts that move off their spot; packs an atlas and prints `name → [sx, sy, w, h, x, y]`. |
| `kitchen/face.py` | `art/kitchen/jiro-look.png`, `jiro-blink.png`, `jiro-look-blink.png` (88×100 at 1536,330) | Finds the blue eye pixels on kitchen Jiro's faceplate, fills them with faceplate colour and re-stamps them shifted (look) or as closed lids (blink). |
| `street/eyes.py` | `art/street/blink.png`, `glance.png`, `lookup.png` (74×42 at 1206,404) | Same method on the new `street.jpg`: eyes offset (+4, 0) / (0, −4) or closed; keeps changed pixels only. |
| `pond/masks.py` | `art/pond/water.png`, `grass.png` (1920×1080 alpha masks) | Art-grid-aligned masks (from `cells.py`) of open water and grass/reeds, so the pond's ripples and wind stay inside them. |
| `office-dining/extract.py` | `art/tr/office-dining/wall-empty.jpg` + `gold1/2`, `koi1/2`, `minnow1/2`, `puffer`, `weed0–3.png` | Cuts the fish, bubbles and weeds out of the aquarium wall art as RGBA sprites and harmonic-inpaints the holes, so the aquarium can be animated in code; prints sprite metadata JSON. |
| `items/extract_v3.py` | 20 `public/items/*.png` | Cuts the five V3 2×2 magenta sheets (§8.6): `comps.fg_mask` key, keep components ≥ 0.2 % of the largest (keeps zzz, sweat, smoke, flags), `fix_fringe`, crop, NEAREST to max side 160, hard alpha. |
| `transitions/ks-f-build.py` (rewritten) + `ks-f-base.jpg` | `art/tr/office-dining/wall-empty.jpg` | 1436×1248 | 298,424 | **V3.** `wall.jpg` with the fish, bubbles and weeds inpainted out; the aquarium life is drawn from sprites. | **P** `tools/art/office-dining/extract.py` |
| `art/tr/office-dining/{gold1,gold2,koi1,koi2,minnow1,minnow2,puffer,weed0..3}.png` | 84×41 … 233×256 | 7.7–89 KB | **V3.** Aquarium sprites cut from `wall.jpg`. | **P** same script |
| `art/tr/kitchen-storage-f/world.jpg` | Rebuilds the kitchen→storage world from the committed corridor painting `ks-f-base.jpg` (a copy of the shipped world) when `/tmp/ks-f/gen2.png` is gone, pasting the current kitchen and storage art; `--check` only reports drift. |

`tools/art/items/__pycache__/*.pyc` was committed by accident in V3; it can be deleted.

"Reconstructed" means the code was run inline (`python -c` / heredoc) on the original machine. It is copied
verbatim from the build transcript, with only path handling added.

### 2.7 `tools/prompts/gemini-calls.md` and `tools/misc/`

- `prompts/gemini-calls.md` holds all 52 image-generation commands from the build, verbatim, grouped by the
  agent that ran them. It covers every prompt, reference image, `AR`/`SIZE`, and output name. **Read it before
  regenerating any asset.** It was produced by `misc/extract_gen_calls.py <claude transcript dir>` from the
  Claude Code session transcripts, which are lost with the machine.
- `misc/items-and-timeline.mjs` (run from `restaurant/` as `grep -ho "declareEggs(\[[^]]*\]" -r src | node tools/misc/items-and-timeline.mjs`; it reads declared egg ids from stdin) prints each belt item's weight share (absurd items ≈ 20 %)
  and the scroll timeline table. Its scene/transition lengths are a snapshot; the source of truth is `hold:` in
  `src/scenes/*.ts` and `length:` in `src/transitions/*.ts`.

---

## 3. Gemini still pipeline (`pipeline/gen_still.py`)

```bash
[AR=16:9] [SIZE=2K] [IMG_MODEL=gemini-3-pro-image-preview] \
  ~/.venv-sushi/bin/python pipeline/gen_still.py OUT.png "prompt" [ref1.png ref2.jpg …]
```

- **Model:** `gemini-3-pro-image-preview` (env `IMG_MODEL`). REST `POST
  https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent?key=$GEMINI_API_KEY`.
- **Request:** one user turn. Each reference is an `inlineData` part (base64; mime from the extension, `.png`
  otherwise jpeg) in argument order, then one text part = `prompt + "\n\n" + STYLE`.
  `generationConfig = { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: $AR (default "16:9"), imageSize: $SIZE (default "2K") } }`.
- **Retries:** 4 attempts, 10 s apart, 300 s timeout each. It writes the first `inlineData` part and exits 1 if
  none comes back. It takes about 30–60 s per image.
- **Output sizes seen:** 16:9 2K = **2752×1536**, 1:1 1K = 1024×1024, 1:1 2K = 2048×2048, 21:9 4K = 6336 px
  wide. Other ratios used: `3:4`, `4:5`, `3:2`, `21:9`. Full-frame scene art is always downscaled to 1920×1080
  with LANCZOS and saved as JPEG q88–93 (target ≤ 500 KB).
- **STYLE suffix, appended to every prompt (verbatim):**

  > Style: high-quality 16-bit pixel art like a modern premium indie game (Eastward, Octopath HD-2D sprites), crisp hard-edged pixels, rich warm palette of copper, wood browns, indigo, cream, lantern amber, soft dithering, consistent with the reference bar scene. The character Jiro is exactly the robot in the character reference: copper-and-cream riveted dome head with a white twisted hachimaki headband knotted on the side, two glowing cyan-blue square eyes, a small horizontal speaker-grille mouth, cream faceplate, NO shoulder pads or shoulder armor, blue-and-white vertically striped happi jacket with dark navy V collar and rolled sleeves, slim segmented copper arms and copper robot hands. No text, no letters, no watermark, no UI, no borders.

  Because the suffix always describes Jiro, prompts for Jiro-free images (items, cat, koi, backgrounds) say so
  explicitly, e.g. "IMPORTANT: this sheet contains NO robot and NO Jiro character at all, ignore any character
  description below" or "NO Jiro, NO characters, no people, no robot anywhere in this image".
- **Standard references:**
  - `art/src/jiro-canon.png` (1024², design #19 from `brand/character/05-design-iterations/19-CANON*.png`) for
    anything with Jiro.
  - `art/src/hero-v2-still.png` (the bar, i.e. "the reference bar scene" the STYLE text mentions) for style
    continuity.
  - The **current** `public/art/<scene>.jpg` whenever an image must match or extend a scene.
  - Transitions passed both neighbouring scenes, or a hand-made layout guide composited in PIL from the two
    scenes, as reference 1.
- **Brief given to every art agent (verbatim):** "Pass the current scene art (restaurant/public/art/<id>.jpg)
  and restaurant/art/src/jiro-canon.png as references for continuity. For sprites with transparency, generate
  on flat magenta #FF00FF and key it out with PIL … Final full frames: 1920x1080 JPG q≈88, ≤500 KB; sprites PNG."
  Canon: "Jiro: copper dome, cream faceplate, two glowing blue eyes, speaker-grille mouth, white hachimaki,
  indigo striped happi with rolled sleeves, slim copper arms. No shoulder pads, apron, visor, or red disc.
  Exactly one belt per scene, never branching or two lanes."
- **Prompt patterns that worked** (full texts in `tools/prompts/gemini-calls.md`):
  - *Outpaint / layout guide:* "OUTPAINTING TASK. The first image is a layout canvas: …" or "Image 1 is a layout
    guide. Keep the kitchen (top-left) and the cellar storage room (bottom-right) EXACTLY where they are …". The
    guide is built in PIL by pasting both scene frames onto a grey or black canvas at their world offsets, with
    the belt drawn as a line (`tools/art/transitions/ks-f-comp.py`, `ks-c-guide.py`).
  - *Paint-over:* "PAINT-OVER TASK. The first image is a rough guide: …".
  - *Sprite sheet:* "A 2x2 sprite sheet of …, Top-left: … Top-right: …" or "a 3x3 grid on a perfectly flat solid
    pure magenta #FF00FF background, lots of empty magenta space between sprites …". Frames are cut by quadrant
    or by connected components.
  - *Coordinates in the prompt:* the dining regeneration (`tools/art/dining/prompt1.txt`) lays the room out in
    approximate pixel bands ("Top strip (y 0-110) …, Back wall, left two-thirds (x 0-1300, y 110-600): a CALM,
    DARK, LOW-CONTRAST plain plaster wall …, NO conveyor belt painted …"). This is how quiet negative space for
    copy was obtained.
  - *Never paint the belt:* ask for "one single long, plain, empty … ledge … where a conveyor belt will be added
    later" and draw the belt in code. When Gemini still painted a second belt or static plates, it was removed
    by an edit.

---

## 4. Editing existing art

Almost no scene is a single generation. The workflow for any change:

1. Keep the original: `cp public/art/<scene>.jpg /tmp/<job>/<scene>.orig.jpg`.
2. Run Gemini with the original as reference 1 and a prompt of the form (verbatim pattern):
   **"Same image, same composition, same camera, same framing and every object in the exact same place; only
   change: …"**. Variants: "SAME, exactly the same composition, framing, camera, doors and pixel art. Only
   change: …", or "Edit this exact image: reproduce … pixel-for-pixel identical … The ONLY change: …". Usually
   2 variants were generated in parallel (`for i in 1 2; do … & done; wait`) and the better one picked.
3. For small regions, crop first and edit the crop at a matching `AR` (the kitchen doors: a 480×640 crop edited
   at `AR=3:4`). This gives the model more pixels for the region.
4. **Paste back only the changed region** so every other pixel stays bit-identical to the original:
   `tools/art/common/pasteback.py ORIG EDIT OUT x0 y0 x1 y1 feather quality`. That means: resize the edit to
   1920×1080 (LANCZOS), make a rectangle mask, `GaussianBlur(feather)` it, then
   `Image.composite(edit, orig, mask)`. Regions actually used:
   - pond, Jiro removed from the bridge: `(1560,0,1730,285)`, feather 5, q93
     (`tools/art/pond/remove_bridge_jiro.py`)
   - street, closed cargo box: `(1368,548,1722,868)`, feather 6
     (`tools/art/street/round2_cargo_and_belt.py`)
   - street, polish tray: an ellipse mask `(1343,535)-(1643,677)`, blur 5 (`tools/art/street/compose.py`)
   - kitchen, open swinging doors: the crop edit composited at `(340,90)` with a 2.5 px feathered box
     `(154,97)-(446,538)` in crop space. Then only `(480,180)-(800,640)` was pasted into the **original JPEG
     object** and saved with `quality="keep"`, which reuses the original quantisation tables. The mean
     difference outside the box was 0.28/255.
   - storage, floor regenerated below the belt only: a polygon under the belt line
     `y = 441 + 0.471·(x−440) + offset` for x < 1180, blur 4 (`tools/art/storage/belt-strip-comp.py orig gen out offset`)
   - street→pond garden wall: top band of an edit blended over rows 380–425; the plaster was darkened and
     blue-tinted; the moon-gate interior was restored from the original (`tools/art/garden/comp.py`)
5. Check the diff is confined to the region:
   `np.abs(new-orig).max(2) > 12` → bbox, or the mean outside the box.
6. Re-run the neighbouring transitions with `seg.mjs` (see [§12](#12-qa-workflow)). Transitions depend on belt
   end points and edge strips of the art. Each `src/transitions/*.md` lists what the art must keep.

Hand edits on top of Gemini output were done in numpy/PIL. Examples: darkening a strip with a ramp,
`a[:, x] *= 1 - 0.55*((x-1760)/160)**1.2` (office); painting a dark doorway with a vertical gradient and a
2-px dither (`tools/art/bar/edit.py`, `edit2.py`); drawing copper hatch frames with `ImageDraw.rectangle`
(office, colours COP (201,129,74), COPD (109,63,34), COPH (232,170,110), INK (5,4,4)).

---

## 5. Sprites: magenta keying

Sprites are generated on flat magenta `#FF00FF` (prompt: "on a perfectly flat solid pure magenta #FF00FF
background, no shadows on the background, no ground, no glow"). They are then keyed, cropped, downscaled and
given 1-bit alpha. Three keyers are in the repo:

| Keyer | Background rule | Fringe handling | Downscale |
|---|---|---|---|
| `tools/art/cat/key.py SRC OUT W` (also `common/key_magenta.py`) | `min(r,b) − g > 60` | mask eroded 2 px (`MinFilter(5)`), then drop pinkish `b>g+25 & r>g+25` | premultiplied BOX to width W, un-premultiply, alpha ≥ 128 → 255 else 0 |
| `tools/art/games/key_quads.py` | `r>170 & b>170 & g<110` | drop `r−g>90 & b−g>90` | split 2×2 quadrants, bbox crop, `thumbnail(160, LANCZOS)`, alpha > 120 → 255 |
| `tools/art/pond/key_koi_sheet.py` | same | drop `r−g>90 & b−g>60` | split by empty columns, BOX × 0.27, alpha > 140 → 255 |
| `tools/art/items/extract.py` | `g < min(r,b)−70 & r>110 & b>110` | connected components (`comps.py`, BFS on a step-4 or step-1 grid); keep the largest; `fix_fringe` removes or recolours edge pixels with `(r+b)/2−g > 45 & b > g+35` for up to 4 passes | NEAREST so the max side = 160 |

Other variants: `tools/art/mood/v06_key.py` (`r−g>90 & b−g>90`, split by columns, NEAREST to width 84/460);
`tools/art/storage/sack.py` (key, then BOX-downscale by 38 into "cells" for a chunky pixel look);
`tools/art/transitions/ks-e-mkpost.py` (chroma **green** key `g>150 & g>1.5r & g>1.5b`, used when the object
itself was pink or brown).

Afterwards sprites are colour-graded to sit in the scene. For example `cat/frames.py` applies
`ImageEnhance.Color(0.82)` and `Brightness(0.78)`, and `office/sprite.py` multiplies RGB by 0.92 and adds a
soft contact shadow at 0.45 alpha. Animation frames that Gemini cannot draw consistently are made in numpy from
one keyed frame. The cat's tail flick shears the tail rows by `3·((y−TY)/(H−TY))²` px. The ear twitch shifts a
region by 1 px. Blink frames come either from a second Gemini "Edit this exact image … ONLY change: both eyes
are fully closed" pass (`catb_k.png`) or are painted from faceplate colours (bar, kitchen, street, see §8).

---

## 6. Veo video pipeline (present, unused)

`pipeline/gen_veo.py` and `pipeline/loop.py` come from the earlier `scroll-flow-3d` take (branch
`origin/scroll-flow-3d`, folder `scroll-flow/`). There, every scene was a looping Veo clip. **The restaurant site
uses no video for art:** all motion is code-driven canvas animation. That covers belt, lantern glow, steam,
rain, blinks from sprite swaps, koi and cat frames, and it runs on the engine `LOOP` of 24 s, so every period
divides 24. The only videos are the two comparison recordings in §11.

For reference, if video art is ever wanted:
- `gen_veo.py STILL OUT.mp4 "motion prompt"` calls `veo-3.1-generate-preview` via `predictLongRunning`, polls
  every 15 s, and uses 8 s clips at 16:9 and `RES`=1080p/4k.
- It sets **both `image` and `lastFrame` to the same still**, so the clip starts and ends on the identical pose.
- It appends "16-bit pixel art animation, crisp pixels, the style and palette stay exactly the same as the
  starting image. The final frame is identical to the first frame so the clip loops seamlessly."
- negativePrompt: "camera movement, zoom, pan, dolly, camera shake, cuts, scene change, text, subtitles,
  watermark, morphing, extra limbs, new characters appearing, objects falling from above, fast motion, shoulder
  pads, shoulder armor".

`loop.py IN OUT [K=8]` does the following:
- drops the duplicated last frame if its diff to frame 0 is < 6;
- crossfades the last K frames into the first K;
- prints `seam / typical frame diff` (≤ 1.2 means invisible);
- encodes libx264 `-preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -an` at 24 fps.

Its `FF` points at `../bin/ffmpeg`, which does not exist here; replace it with the imageio-ffmpeg path.

---

## 7. First-pass scene prompts (verbatim)

`pipeline/first_pass.tsv` (`id<TAB>prompt`). It was run once by the lead agent with both references:

```bash
mkdir -p art/first; while IFS=$'\t' read id p; do (SIZE=2K ~/.venv-sushi/bin/python pipeline/gen_still.py art/first/$id.png "$p" art/src/jiro-canon.png art/src/hero-v2-still.png > art/first/$id.log 2>&1 &) ; done < pipeline/first_pass.tsv
```

The outputs (2752×1536) are committed in `art/first/`. `tools/art/common/export_first_pass.py` cover-cropped them
to 1920×1080. `bar` and `pond` were not generated here; they came from `scroll-flow` (§8.1).

| id | prompt |
|---|---|
| office | Wide 16:9 pixel art scene: a tiny cramped back office behind a sushi bar at night, almost completely dark. The whole upper and central 80% of the frame is a very dark, low-contrast wood-panelled wall in deep shadow (large calm negative space). In the BOTTOM-RIGHT CORNER only, small in the frame: Jiro the robot sushi chef sits at a small wooden desk typing on a chunky beige keyboard in front of a small beige CRT monitor glowing green, a desk lamp making a small warm pool of light, a steaming tea cup, sticky notes. Along the very bottom edge of the frame a single straight sushi conveyor belt with copper rails runs horizontally from the left wall to the right wall, carrying a few plates of sushi, entering from a small dark square opening in the left wall and leaving through a small opening in the right wall. Quiet, cozy, mostly dark. |
| dining | Wide 16:9 pixel art scene: a lively warm Japanese sushi restaurant dining room at night seen from eye level, three-quarter view. Low wooden tables with customers (seen mostly from behind and side) eating sushi, paper lanterns, shoji screens, noren curtain, plants. NO robot, no chef in the room. A single sushi conveyor belt with copper rails runs along a low wooden ledge across the lower third of the frame from the left wall to a pair of swinging kitchen doors with round porthole windows on the right wall. The upper-middle area of the frame is a calmer, dimmer, low-contrast plaster wall with soft lantern falloff (negative space for two floating windows). Bustling but cozy. |
| kitchen | Wide 16:9 pixel art scene: the kitchen of a sushi restaurant at night: stainless and wood counters, a steaming wooden rice tub, hanging knives, a stove with a simmering pot, stacked plates, a service pass shelf with a warm heat lamp. Jiro the robot sushi chef stands on the RIGHT third of the frame behind the counter, looking toward the left, relaxed and friendly. A single sushi conveyor belt with copper rails runs straight across the lower part of the frame from left to right. The LEFT and upper-left part of the frame is a calmer dim tiled wall with low contrast (negative space). Medium busy, warm. |
| storage | Wide 16:9 pixel art scene: a quiet dim storage room behind a sushi restaurant kitchen: tall wooden shelves with stacked rice sacks, sake barrels, crates of vegetables, jars, a single bare hanging bulb casting a warm cone of light. A single sushi conveyor belt with copper rails runs diagonally across the floor from the upper-left doorway to the lower right corner. Around the belt, a grid of nine burlap rice sacks sits on the floor in three neat rows (for a whack-a-mole game). The right half and top of the frame fall off into deep shadow. Quiet, dusty, mostly dark. |
| yard | Wide 16:9 pixel art scene: the outdoor back yard behind a sushi restaurant at night: a stone washing sink with a steaming wooden tub, towering stacks of white plates, a coiled green garden hose on the ground, a wooden fence, a laundry line with white dish towels hanging, a single warm lamp over the back door. A single sushi conveyor belt with copper rails comes out of a small hatch in the back wall of the restaurant on the left and runs along the fence to the right edge. The upper half is a calm dark night sky with a few stars and a dark garden. Quiet and peaceful. |
| street | Wide 16:9 pixel art scene: a rainy neon-lit Tokyo side street at night, cozy cyberpunk. Jiro the robot sushi chef rides a vintage delivery tricycle with a small wooden cargo box on the back; on top of the cargo box a tiny copper-railed sushi conveyor belt loops with plates. He is small, in the lower-right third of the frame, riding toward the left. Pink and cyan neon signs, glowing shop windows, puddles reflecting neon, a couple of pedestrians with umbrellas at the edges. The left and upper-left of the frame is a darker, calmer area: a dark wet wall and closed shutters in shadow (negative space for a pricing chart). |

---

## 8. Asset inventory

All files under `public/` as of commit `a6cda8c` (139), with the V3 changes (`f2abe2f`, `a5da57a`, `ca3138c`) folded in and marked **V3**. The "Made" column uses these tags:
**G** = Gemini-generated; **E** = Gemini edit of existing art plus paste-back; **P** = PIL/numpy (cut, key,
compose, paint); **C** = Playwright capture; **S** = copied from the `scroll-flow` take (branch
`origin/scroll-flow-3d`, restore with `git checkout origin/scroll-flow-3d -- scroll-flow`); **code** = hand-written.

Per-file history: `git log --format=%h -- restaurant/public/<path>`. Any earlier version is retrievable with
`git show <commit>:restaurant/public/<path>`. This includes deleted assets: the aquarium, Fish Frenzy sprites,
kitchen→storage candidates, sushi-cam POV art, whack-a-bug sprites, mice and the yard transitions (see §8.10).

### 8.1 Scene backgrounds `public/art/*.jpg` (all 1920×1080 RGB JPEG)

| File | Bytes | Depicts | How it was made |
|---|---|---|---|
| `art/bar.jpg` | 427,462 | Hero sushi bar. Jiro behind the counter centre-right, lanterns, bottle shelf, regulars, green noren, belt on the counter rail rising into a dark wall opening top right (≈1711–1812 × 257–367). | **S+P**: `art/src/hero-v2-still.png` (5504×3072, the scroll-flow "hero redrawn at 5.5K", commit e2dfaa7 on scroll-flow-3d), cover-cropped to 1920×1080 q90. Polish: `tools/art/bar/edit.py` repainted the doorway interior dark (gradient (6,4,6)→(26,15,11), dither on the lower 40 %) and sank the beam into shadow. `edit2.py` added the lit left jamb reveal, lintel underside and outline, and saved q88. Original backed up as `/tmp/polish-bar/bar-orig.jpg` (lost; the fb79069 version is in git). |
| `art/office.jpg` | 135,263 | Near-dark vertical-plank back office. Tiny Jiro at a CRT and desk with lamp and tea in the bottom-right (x 1515–1785, y 700–926). Belt bed along the bottom (y≈955), copper-framed hatch at x 0–66, y 897–1008. | **G→E→P**: first pass `office`. Then an **E** edit `bg1.png` ("SAME … Only change: remove the robot, the desk, the chair, both computers, the lamp, the sticky notes, the boxes and the bookshelf …"). `tools/art/office/compose.py` painted over the doorways with plank rows, darkened the edges and drew the hatch. A **G** sprite `spr1.png` (AR 4:3, magenta, "a tiny cozy late-night workstation …") was keyed to `spr1_key.png`, then `office/sprite.py` scaled it to 270 px wide at (1515,700), clipped it at the belt bed (y 926), added a 0.45 contact shadow, dimmed the lamp spill above the desk by up to 30 %, and saved q88. |
| `art/dining.jpg` | 277,953 | Dining room at night: dark calm plaster wall upper-left, ~26 small diners at low tables, kitchen swinging doors with brass portholes on the right (≈1335–1620 × 205–550), honey-wood post at the left edge, one empty counter slot at y≈770–880 for the code belt. | **G**: the polish pass **regenerated** it from the old art as sole reference with `tools/art/dining/prompt1.txt`, 2 variants, `v2.png` picked, downscaled and saved. The round-2 "darker room" is **code**, not art: `dining.ts` `under()` applies a 0.55 saturation pass and a dim gradient (0.66→0.42 above the ledge at y 768, 0.34 below). `tools/art/dining/din_patch*.py` are the code-patch scripts that installed it (they edit `src/scenes/dining.ts`, not pixels). |
| `art/kitchen.jpg` | 354,674 | Kitchen: Jiro on the right behind the counter, rice tub centre-left, knives, pot, pass shelf. Both swinging half-doors at the counter's left end stand open with dining glow behind (door box x 480–800, y 180–640). Front ledge cleared for the FAQ sushi. Dark tiled left wall for the title. | **G→E→E**: first pass `kitchen`. Polish **E** (`edit1/2.png`, "Same image … only change: …") added the swinging half-doors the belt emerges from and cleared the condiments off the front ledge. Round-2 **E** (commit a6cda8c): doors opened via a crop edit at `AR=3:4` (`gen3`) and a paste-back with `quality="keep"` (§4). |
| `art/storage.jpg` | 380,894 | Cellar storage room: shelves, sake barrels, jars, bulb and light cone, doorway top-left (belt starts at 262,357), belt diagonal to the bottom edge x≈1776. Floor: stack of tied rice sacks, two crates, coiled green hose (the Snake trigger). Jiro stands arms crossed. Right side and top shaded. | **G→E→P→E**: first pass `storage`. Polish: `e1_nosacks` (**E**, remove the 8 sacks), `e2b` (**E**, Jiro arms crossed), then `tools/art/storage/compose.py` shaded the right side and top and composited a 3×3 grid of open sacks from the magenta sprite `e3_sack` (`sack.py`). Round 2 (ed80e55): the floor below the belt's front face (x < 1180) was regenerated (**E** "Same image … only change: …" → `gen1/2`) and blended with `belt-strip-comp.py`, replacing the open sacks with tied sacks, crates and a hose. The belt, doorway, exit and top/left strips keep their pixels. The polish agent overwrote the original without a backup; the fb79069 and 32eac88 versions are in git. |
| `art/street.jpg` | 467,806 | **V3.** Rainy neon night street at a red light: Jiro on an upright city delivery bicycle (front basket, okamochi box on the rear rack, right foot down), RAMEN/SUSHI neon, traffic light on the pole arm, a cat under a wagasa on a doorstep, steel belt backing on the utility pole at x≈1700–1790, dark shuttered wall on the left for the pricing board. Coordinates in 03. | **G** (V3 wave 1). The generation prompt was not recorded; regenerate from Martin's night-street motorcycle reference mood with `bar.jpg`/`street-trike.jpg` as style refs and repaint the pole backing at `BELT_X`=1740. |
| `art/street-trike.jpg` | 492,619 | The PR #6 street (Jiro on the delivery trike). **Unused**, kept for reference. | as the PR #6 `street.jpg`: **G→E→P→E→P**: first pass `street`. Polish: **E** `tray1.png` (the sushi tub became an empty oval tray, ellipse-masked paste). `tools/art/street/compose.py` painted a wooden well and copper hub inside the code loop, saved as `street.v1.png` → q88. Round 2 (ed80e55): **E** `street-e1` (loop removed, closed cargo box) pasted at (1368,548,1722,868), plus the painted steel backing and brackets for the vertical belt at `BELT_X`=1740, q93 (`round2_cargo_and_belt.py`). |
| `art/pond.jpg` | 391,921 | Moonlit koi pond garden, pier from the right edge at y≈530 (deck 495–600), lanterns, lily pads, arched bridge top right (now empty), moon reflection. | **S→E→E**: `art/src/pond.png` from scroll-flow `art/endings/` (commit 282b72a "koi + train endings"), cover-cropped. Polish **E**: "Jiro without apron" (only the bridge-Jiro area pasted back). Round 2 **E**: Jiro removed from the bridge, `(1560,0,1730,285)` pasted, q93 (`remove_bridge_jiro.py`). |
| `art/yard.jpg` | 334,133 | Night back yard: wash tub, plate stacks, laundry line with pegs (towels drawn in code), sleeping ginger cat, Jiro wiping a plate, belt curving up the fence. | **G→E→P**, **orphaned**: first pass `yard`, two polish **E** edits (`edit1..4`, see prompts) plus hand darkening. The yard scene was cut in round 2 (commit 762b735, "drop yard and cat transitions"), so no code references this file. Kept for reuse. |

Scene belt data lives in `src/scenes/<id>.ts` (`belt.pts` = `[x, y, scale]`). The `pantry` scene (MCP moodboard)
reuses `storage` (`...storage`) with the same canvas frame, so it has no art of its own.

### 8.2 Scene sprites and overlays `public/art/<scene>/`

| File | Size | Bytes | Depicts | How it was made |
|---|---|---|---|---|
| `art/bar/jiro-blink.png` | 66×37 | 2,925 | Jiro's closed eyes (lids plus a cyan under-glow line), drawn over the bar art at (936,244). | **P**: `tools/art/bar/blink.py` (per-row faceplate colour from a ring around each eye, lid line (22,30,44)/(80,160,185)). Then `chop.py` flattened the lids to one face colour sampled at (968,264). |
| `art/bar/chop.png` | 74×86 | 14,089 | The far-right regular's chopstick hand, cut out, which bobs 3 px. | **P**: polygon cut from the bar art at (1540,612) (`chop.py`). |
| `art/bar/chop-mid.png` | 74×54 | 9,189 | The middle regular's chopsticks. **Unused since V3** (replaced by `parts.png`). | **P**: polygon cut at (806,622) (`chop2.py`). |
| `art/bar/parts.png` | 1024×466 | 480,975 | **V3.** Atlas of the bar's moving parts plus clean background patches (see `PARTS` in `bar.ts`). | **P** `tools/art/bar/parts.py` |
| `art/office/hand-l.png` | 31×24 | 2,171 | Jiro's left typing hand (RGB, no alpha). | **P**: plain crop `(1625,811,1656,835)` of the composed office (`tools/art/office/hands.py`). |
| `art/office/hand-r.png` | 34×26 | 2,448 | Right typing hand. | **P**: crop `(1656,795,1690,821)`. |
| `art/kitchen/faq-tuna.png` | 320×128 | 28,258 | 2-frame sheet (open / blinking) of the tuna nigiri with a baked face (curious). One of 8 FAQ question sushi. | **P**: `tools/art/kitchen/faces.py` draws pixel faces (eyes, mouth, blush, sweat drop) on `public/items/<name>.png` and writes a `[normal \| closed-eyes]` sheet. |
| `art/kitchen/faq-salmon.png` | 320×125 | 27,820 | Salmon nigiri, happy (^ ^). | **P** `faces.py` |
| `art/kitchen/faq-tamago.png` | 320×126 | 27,826 | Tamago, nervous (wavy mouth, sweat drop). | **P** `faces.py` |
| `art/kitchen/faq-ikura.png` | 320×160 | 38,924 | Ikura gunkan, excited (white ink). | **P** `faces.py` |
| `art/kitchen/faq-ebi.png` | 320×132 | 27,934 | Ebi, smug. | **P** `faces.py` |
| `art/kitchen/faq-maki.png` | 320×133 | 31,570 | Maki, curious (white ink). | **P** `faces.py` |
| `art/kitchen/faq-onigiri-happy.png` | 320×160 | 32,746 | Happy onigiri (already has a face; both frames identical). | **P** `faces.py` |
| `art/kitchen/faq-onigiri-sleepy.png` | 320×160 | 32,089 | Sleepy onigiri (both frames identical). | **P** `faces.py` |
| `art/kitchen/jiro-blink.png` | 88×100 | 14,943 | **V3 rebuilt.** Kitchen Jiro's closed eyes, drawn at (1536,330). | **P** `tools/art/kitchen/face.py` (the PR #6 version came from `jiro_blink_talk.py`). |
| `art/kitchen/jiro-look.png`, `jiro-look-blink.png` | 88×100 | 16,728 / 14,937 | **V3.** Eyes glancing aside, open / closed. | **P** `face.py` |
| `art/kitchen/jiro-talk.png` | 88×100 | 238 | Lit speaker-grille pixels (140,235,255), flickered while Jiro answers. | **P**: same script, dark grille pixels in (1572–1602, 405–421). |
| `art/street/blink.png` | 74×42 | 3,650 | **V3.** Bicycle Jiro's closed eyes, drawn at (1206,404) + head offset. | **P** `tools/art/street/eyes.py` |
| `art/street/glance.png`, `lookup.png` | 74×42 | 6,263 / 6,151 | **V3.** Eyes 4 px right (glance at the box) / 4 px up (look into the rain). | **P** `eyes.py` |
| `art/street/cat.png`, `cat-blink.png` | 64×80 | 7,697 / 7,571 | **V3.** Small cat under a wagasa umbrella on the doorstep, eyes open / shut, at (800,664). | cut from the V3 street art (method not recorded) |
| `art/street/r-off.png` | 54×88 | 434 | The "R" of the RAMEN neon switched off (plum (112,52,96)), sputters twice per loop. | **P**: pink pixels of box (893,78,947,166) in `street.v1.png` (still lines up with the V3 art). |
| `art/pond/water.png`, `grass.png` | 1920×1080 | 13,066 / 12,887 | **V3.** Alpha masks for the pond's ripples and wind. | **P** `tools/art/pond/masks.py` |

### 8.3 Transition art `public/art/tr/**`

| File | Size | Bytes | Depicts | How it was made |
|---|---|---|---|---|
| `art/tr/bar-office/wall.jpg` | 2560×1080 | 272,354 | Side-view cutaway of the inside of the wall between bar and office: studs, diagonal brace the belt rides down, copper valve, amber light cracks. It sits at world x −2560..0; the leftmost 440 px are mirrored and shaded padding. | **G+P**: `AR=21:9`, two variants from refs `bar.jpg` and `office.jpg` ("Wide panorama, straight-on side cross-section (dollhouse cutaway) of the INSIDE of a thick old wooden wall …"), then resized and padded. |
| `art/tr/bar-office/cat.png` | 480×118 | 19,545 | A fat bored ginger tabby, loaf pose on the beam; 4 frames of 120×118 (open, blink, tail flick, ear twitch). Drawn at 1.6× near world (−1752,524). Timing: blink every 8 s, tail at 4 s (×2) and 13 s, ear at 19.5 s. | **G+P**: `AR=1:1 SIZE=1K` ×3 on magenta with `wall.jpg` as reference; blink via a second **E** pass ("Edit this exact image … ONLY change: both eyes are fully closed"). Keyed with `tools/art/cat/key.py`; frames built with `cat/frames.py` (grade 0.82 colour / 0.78 brightness, tail shear, ear shift). Replaced `mice.png` in a6cda8c. |
| `art/tr/office-dining/wall.jpg` | 1436×1248 | 268,827 | The wall between office and dining in cutaway, with a built-in staff aquarium the belt crosses in a glass tube (koi, goldfish, pufferfish, plaque "STAFF AQUARIUM, not on the menu"). | **G**: `AR=3:2` "Side-view dollhouse CUTAWAY cross-section of the thick interior …" (`/tmp/office-dining/gen/strip1.png`), cropped. Unchanged since bdab3d1 (blob `1f1eb17`); removed and restored by the aquarium revert. |
| `art/tr/kitchen-storage-f/world.jpg` | 4460×1966 | 1,180,604 | One continuous back-of-house painting: kitchen at (0,0), corridor with crates, sacks and a mop bucket, then the storage room at (2470,846) scaled 1.035. The camera pans across it (transition F). | **G+P**: guide `tools/art/transitions/ks-f-comp.py` (kitchen plus storage on grey at half scale, belt drawn), then `AR=21:9 SIZE=4K` ×2 (`gen1/2`, 6336 px wide, "$P" in prompts). `ks-f-match2.py` found the exact kitchen and storage offset and scale by normalised cross-correlation (storage: 2470, 846, ×1.035). **E** `void-out.png` repainted the flat dark void below the corridor ("Repaint ONLY the large flat, featureless dark purple-black area …"). `ks-f-build.py` resizes gen2 to 4458 wide, pixelates it (1/4 BOX → 96-colour MEDIANCUT, no dither → NEAREST ×4), pastes the void repaint under a lum<34 mask, mirrors a 50-px band to extend the bottom, then pastes the **real** `kitchen.jpg` (feathered 40 px right and bottom) and `storage.jpg` (feathered left and top), q90. **Re-run `ks-f-build.py` whenever kitchen or storage art changes.** |
| `art/tr/storage-street/shaft.jpg` | 2112×760 | 313,227 | Cutaway band between the storage floor and the street: floor joists, stone foundation, wet wall, wires, the steel chute on the pole. It sits at world (0,900). **V3:** repainted and widened (was 2048×760; see 04). | **G**: outpaint, `AR=4:5`, "Outpaint this image: keep the top picture (a warm lamplit wooden storage room seen from above) and the bottom picture (a rainy neon night street) exactly as they are, …" (`ss-bg1/2`), cropped to the band. |
| `art/tr/street-pond/garden.jpg` | 2395×1673 | 741,507 | **V3:** repainted for the bicycle street (see 04). Backdrop between street and pond: dark tiled roof cap, cracked moonlit plaster wall with ivy and one wall lantern, the round moon gate (rainy street visible through it), gravel lane down past bamboo and the bridge to the pier, pond with lanterns and lily pads (it continues into the pond frame). No cat. Painted for pond offset PX = −351; the pond frame sits at (PX, 1665). | **G→E→P**: outpaint `AR=1:1 SIZE=2K` from both scenes ("OUTPAINTING TASK. The first image is a layout canvas …"). Round-1 fix **E** (`AR=21:9`, variants a/b on a crop, **b** used) textured the blank wall (it also added a black cat on the cap); `tools/art/garden/comp.py` blended it over rows 380–425, darkened the plaster, darkened the top pavement strip and restored the gate interior. Round 2 (ed80e55) re-fit the backdrop for the vertical street belt and removed the cat ("cut both cat scenes"). |

### 8.4 Pond ending koi `public/end/`

| File | Size | Bytes | Depicts | How it was made |
|---|---|---|---|---|
| `end/koi.png` | 330×456 | 200,797 | Giant kohaku koi leaping, mouth open (scroll-flow ending sprite). **Unused since V3** (Flappy Koi draws its koi in code). | **S**: copied from `scroll-flow/site/public/end/koi.png` (cut from `art/endings/koi-sprite.png`). |
| `end/koi-rise.png` | 169×264 | 63,988 | Koi breaching, mouth open. Anchor (mx 155, my 86) in `pond.ts`. | **G+P**: one `AR=16:9 SIZE=2K` sheet "Sprite sheet of ONE big orange-and-white kohaku koi carp, the exact …" on magenta, split by `tools/art/pond/key_koi_sheet.py` (×0.27) into `koi_f0..3`, renamed. |
| `end/koi-rise2.png` | 173×264 | 61,182 | Rising, second frame. | same |
| `end/koi-gulp.png` | 178×264 | 59,808 | Cheeks full, eyes shut. | same |
| `end/koi-dive.png` | 160×264 | 49,038 | Head-first dive (anchor 8,250). | same |

### 8.5 Mini-game sprites `public/games/`

| File | Size | Bytes | Depicts | How it was made |
|---|---|---|---|---|
| `games/pond-bg.png` | 480×267 | 124,749 | Flappy background: indigo night sky, moon upper right, pines, stone lantern, water. | **G+P**: `AR=16:9` "Side-view game background for a Flappy Bird style game at a Japanese koi pond at night …", LANCZOS to 480 wide. |

`games/koi-{a,b,gulp,dizzy}.png` (Flappy koi frames, **G+P** 2×2 sheet "A 2x2 sprite sheet of a small chubby cute koi fish in side view facing RIGHT …", `tools/art/games/key_quads.py`) were deleted in V3 (`ca3138c`): the rewritten Flappy Koi draws its koi, sushi and digits as pixel maps in `flappy.ts`, and only crops `pond-bg.png`. The whack-a-bug sprites (`bug-a/b/gold/dizzy`, `mallet`, `bonk-star`, `dizzy`) and the Snake `lawn.png` were made the same way and deleted in ed80e55. Hose Snake itself (`src/games/snake.ts`) was deleted in V3 (`f2abe2f`).

### 8.6 Belt items `public/items/` (transparent PNG, max side 160)

Item behaviour (weight, click lines, egg id, sfx) is in `src/engine/items.ts`. Plates are drawn in code
(`drawPlates` in `engine/belt.ts`, pre-rendered pixel plate sprites).

**Original set (30), made as S and cleaned with P.** These came from `scroll-flow/site/public/items/`, which was
cut from the scroll-flow `art/items-sheet.png` Gemini sheet. In 32eac88 `tools/art/items/clean_old.py` recoloured
the pink fringe to (27,18,16) and hard-thresholded alpha, and the gold nigiri's pink glow was removed.

| File | Size | Bytes | Depicts |
|---|---|---|---|
| `items/tuna.png` | 160×128 | 26,606 | tuna (maguro) nigiri |
| `items/salmon.png` | 160×125 | 26,395 | salmon nigiri |
| `items/tamago.png` | 160×126 | 26,212 | tamago (egg) nigiri |
| `items/ikura.png` | 160×160 | 36,833 | ikura gunkan |
| `items/ebi.png` | 160×132 | 26,476 | ebi (shrimp) nigiri |
| `items/maki.png` | 160×133 | 29,744 | maki rolls |
| `items/onigiri-happy.png` | 160×160 | 30,744 | onigiri with a happy face |
| `items/onigiri-angry.png` | 160×160 | 31,281 | angry onigiri ("WHO FORCE-PUSHED TO MAIN?") |
| `items/onigiri-sleepy.png` | 160×160 | 30,134 | sleepy onigiri (zzz) |
| `items/bowl-miso.png` | 160×151 | 33,225 | miso soup bowl |
| `items/bowl-ramen.png` | 160×141 | 31,893 | ramen bowl (**not in the catalogue**; unused) |
| `items/bowl-soup.png` | 160×144 | 33,357 | soup bowl (**unused**) |
| `items/cup-tea.png` | 108×160 | 23,654 | tea cup |
| `items/cup-matcha.png` | 157×160 | 29,358 | matcha cup |
| `items/cup-soy.png` | 134×160 | 29,013 | soy sauce dish (**unused**) |
| `items/wasabi.png` | 160×145 | 28,159 | angry wasabi blob |
| `items/duck.png` | 158×160 | 29,872 | rubber duck (Konami override item) |
| `items/bug.png` | 160×150 | 25,583 | green software-bug beetle |
| `items/bomb.png` | 139×160 | 25,104 | cartoon bomb / bomb maki ("merge conflict") |
| `items/puffer.png` | 160×131 | 29,987 | pufferfish (fugu) |
| `items/rock.png` | 160×128 | 22,382 | a rock ("someone shipped a rock") |
| `items/gold.png` | 146×124 | 26,463 | golden tamago (omakase override item) |
| `items/cat.png` | 160×103 | 25,151 | cat riding the belt (also the kitchen plate-stack cat) |
| `items/lucky-cat.png` | 123×160 | 33,495 | maneki-neko |
| `items/floppy.png` | 160×159 | 29,229 | floppy disk |
| `items/laptop-fire.png` | 137×160 | 27,655 | burning laptop |
| `items/fortune.png` | 160×141 | 26,526 | fortune cookie |
| `items/mini-jiro.png` | 160×152 | 35,170 | mini Jiro head (also the logo mark, loader and favicon source) |
| `items/lobster.png` | 159×129 | 23,725 | lobster |
| `items/ramen.png` | 138×160 | 29,191 | ramen (catalogue key `ramen`) |

**Absurd set (14), made as G+P in 32eac88.** Three `AR=1:1 SIZE=2K` 3×3 magenta sheets were generated with the
scroll-flow `items-sheet.png` as style reference (prompts `$BASE$S1`, `$BASE$S2` and `sheetC`, verbatim in
`tools/prompts/gemini-calls.md`). `tools/art/items/extract.py` cut them with fixed boxes → largest connected
component → fringe fix → NEAREST to 160. Some sheet slots (penguin, whale, hedgehog, shiba) were not used; the
corgi, snail and goose came from sheet C. All have `absurd: true, animal: true`; weight 0.5, trimmed to 0.35 in V3.

| File | Size | Bytes | Depicts |
|---|---|---|---|
| `items/hamster.png` | 135×160 | 36,294 | hamster surfing a salmon nigiri |
| `items/octopus.png` | 142×160 | 38,576 | octopus waving from a gunkan |
| `items/crab.png` | 160×123 | 33,660 | crab in sunglasses holding a maki |
| `items/frog.png` | 160×160 | 42,532 | frog on a tamago |
| `items/sloth.png` | 160×156 | 39,979 | sloth hugging a maki |
| `items/sumo.png` | 129×160 | 37,645 | tiny sumo wrestler |
| `items/googly.png` | 160×122 | 31,844 | googly-eyed tuna nigiri |
| `items/ufo.png` | 95×160 | 25,751 | UFO beaming up a tuna nigiri |
| `items/raccoon.png` | 160×151 | 41,077 | raccoon with a stolen chopstick |
| `items/seal.png` | 160×148 | 33,971 | seal balancing a plate |
| `items/cat-maki.png` | 133×160 | 39,572 | three cats in a nori wrap |
| `items/snail.png` | 160×118 | 26,426 | snail with a salmon-nigiri shell |
| `items/corgi.png` | 160×157 | 31,880 | corgi onigiri |
| `items/goose.png` | 160×154 | 28,462 | goose stealing a salmon nigiri |

**V3 set (20), made as G+P in `ca3138c`.** Five `AR=1:1 SIZE=2K` 2×2 magenta sheets, generated in parallel with
`pipeline/gen_still.py sheetN.png "$BASE$SN" styleref.png` (`styleref.png` = a strip of existing item sprites:
tuna, duck, hamster, crab), cut by `tools/art/items/extract_v3.py SHEETDIR`. Prompts, verbatim:

```bash
BASE='A sprite sheet of exactly 4 separate game item sprites in a clean 2x2 grid on a perfectly flat solid pure magenta #FF00FF background, very large empty magenta gaps between sprites, each sprite fully separated, no shadows on the background, no ground, no glow, nothing else on the sheet. Match EXACTLY the pixel-art style of the reference sprites: chunky 16-bit pixel art, thick near-black 2px outline around each whole sprite, warm saturated colours, soft 2-tone shading, same scale and chunkiness as the reference nigiri. The reference shows style only: do NOT draw a tuna, duck, hamster or crab unless listed. Each sprite is a compact single object that would sit on a small sushi plate, readable at tiny size, funny and cute. Do not use any magenta or hot pink inside the sprites. IMPORTANT: this sheet contains NO robot and NO Jiro character at all, ignore any character description below. The 4 sprites: '
S1='top-left) a tiny chubby penguin wearing a sumo mawashi belt in a wide sumo stance, fiercely guarding a tamago egg nigiri behind him; top-right) a salmon nigiri sushi wearing a tiny yellow construction hard hat with big bold black letters WIP on it, holding a tiny shovel; bottom-left) a hermit crab living inside a small round white soy sauce dish as its shell instead of a seashell, peeking out with eye stalks; bottom-right) a salmon nigiri doing a plank exercise on tiny arms and legs, sweat drops, determined face.'
S2='top-left) a ginger cat curled up asleep in a tight spiral wrapped in a dark green nori seaweed band like a maki roll, seen from the side, little zzz; top-right) a yellow rubber duck lifeguard with a red lifeguard ring around its waist, a whistle and white sun cream on its beak; bottom-left) a green cactus in a tiny terracotta pot, the cactus shaped like a stack of three maki sushi rolls with little spines and one pink-free white flower; bottom-right) a round yellow-brown pufferfish mid-inflation, cheeks puffed enormously, spikes popping out, eyes bulging, holding its breath.'
S3='top-left) a brown sea otter floating on its back holding hands with a tamago egg nigiri that has tiny arms and a happy face; top-right) two wooden chopsticks laid as a bridge across a small soy sauce dish, a tiny black ant walking across carrying one grain of rice over its head; bottom-left) a small coiled green wasabi dragon with little horns, tiny wings and a curly tail, puffing a wisp of green smoke; bottom-right) a round white mochi ghost with a cute face and wavy ghost bottom, floating, slightly translucent-looking pale blue shading.'
S4='top-left) an orange octopus DJ wearing big headphones, scratching a round sushi plate like a turntable with two tentacles; top-right) an open black lacquer bento box whose compartments contain a small parchment treasure map with a red X, a gold coin and a salmon piece; bottom-left) a golden fortune cookie cracked open with a white paper slip sticking out printed with bold black letters LGTM; bottom-right) an empty round cream sushi plate with only rice crumbs and a small folded white paper note on it printed with bold black numbers 404.'
S5='top-left) a tiny sailboat whose hull is a salmon nigiri and whose sail is a thin pale pickled-ginger slice on a toothpick mast, a tiny flag; top-right) a round hedgehog whose spines are dark spiky sea urchin uni spines, sitting in a gunkan seaweed wrap, smug face; bottom-left) a fried ebi tempura shrimp asleep zipped inside a tiny blue sleeping bag with only its tail and sleepy face out; bottom-right) a tiny blue narwhal using its long tusk as a skewer with three orange ikura roe pearls on it like a kebab.'
for i in 1 2 3 4 5; do eval "S=\$S$i"; (AR=1:1 SIZE=2K /tmp/venv/bin/python pipeline/gen_still.py sheet$i.png "$BASE$S" styleref.png > gen$i.log 2>&1 &); done
```

Weights, eggs and click lines are in `items.ts` (table in 01-engine §9). The first six are sushi with a twist
(not absurd); the other fourteen are absurd.

| File | Size | Bytes | Sheet (slot) | Depicts |
|---|---|---|---|---|
| `items/sumo-penguin.png` | 160×110 | 29,280 | 1 (TL) | sumo penguin guarding a tamago |
| `items/hardhat.png` | 160×154 | 40,536 | 1 (TR) | salmon nigiri in a "WIP" hard hat with a shovel |
| `items/hermit.png` | 160×127 | 34,398 | 1 (BL) | hermit crab living in a soy dish |
| `items/plank.png` | 160×108 | 28,538 | 1 (BR) | salmon nigiri doing a plank |
| `items/cat-nap.png` | 160×128 | 30,759 | 2 (TL) | ginger cat asleep in a nori band |
| `items/lifeguard.png` | 160×145 | 32,658 | 2 (TR) | rubber-duck lifeguard |
| `items/cactus.png` | 109×160 | 25,583 | 2 (BL) | maki-stack cactus in a pot |
| `items/puffer-inflate.png` | 160×139 | 32,486 | 2 (BR) | pufferfish mid-inflation |
| `items/otter.png` | 160×137 | 31,038 | 3 (TL) | otter holding hands with a tamago |
| `items/ant-bridge.png` | 160×102 | 24,013 | 3 (TR) | ant carrying a rice grain over a chopstick bridge |
| `items/wasabi-dragon.png` | 160×155 | 34,568 | 3 (BL) | little wasabi dragon puffing smoke |
| `items/mochi-ghost.png` | 160×149 | 29,430 | 3 (BR) | mochi ghost |
| `items/octo-dj.png` | 153×160 | 40,096 | 4 (TL) | octopus DJ scratching a plate |
| `items/treasure-bento.png` | 160×148 | 38,443 | 4 (TR) | bento with a treasure map, coin and salmon |
| `items/lgtm.png` | 160×104 | 24,681 | 4 (BL) | fortune cookie reading "LGTM" |
| `items/not-found.png` | 160×108 | 24,685 | 4 (BR) | empty plate with a "404" note |
| `items/ginger-boat.png` | 109×160 | 27,975 | 5 (TL) | salmon-nigiri sailboat with a ginger sail |
| `items/uni-hog.png` | 139×160 | 37,723 | 5 (TR) | hedgehog with uni spines in a gunkan |
| `items/tempura-bag.png` | 145×160 | 34,111 | 5 (BL) | ebi tempura in a sleeping bag |
| `items/narwhal.png` | 160×127 | 32,722 | 5 (BR) | narwhal with an ikura kebab |

### 8.7 MCP pantry moodboard `public/mood/` (10 versions; only v06, v07, v08 and v10 use art)

| File(s) | Size | Bytes | Depicts | How it was made |
|---|---|---|---|---|
| `mood/v06/plate.png` | 460×283 | 176,133 | Empty cream plate with indigo rim on a riveted copper turntable (v06 "Orbit"). | **G+P**: `AR=16:9` "A single large empty round sushi serving plate …" on magenta; `tools/art/mood/v06_key.py` → NEAREST 460 wide. |
| `mood/v06/{rice,fish,nori,sauce,garnish}.png` | 84×62, 84×60, 84×62, 84×63, 84×75 | 11,408 / 10,295 / 9,850 / 10,807 / 13,817 | Rice mound, fish slice, nori sheet, sauce, garnish. | **G+P**: one `AR=16:9` row sheet "exactly five separate sushi ingredients in one horizontal row …", split by empty columns, NEAREST to 84 wide. |
| `mood/v07/bg.jpg` | 1640×696 | 134,031 | Kitchen pass seen straight on: stainless pass counter, ticket rail, heat lamps (v07 "Ticket rail"). | **G**: `AR=21:9` "NO Jiro, NO characters, … A restaurant kitchen pass seen straight-on at eye level, at night …", resized. |
| `mood/v07/{bowl,rice,fish,nori,sauce,garnish}.png` | 140×112, 96×66, 96×77, 96×72, 96×51, 96×90 | 22,606 / 10,353 / 11,358 / 9,560 / 7,732 / 12,924 | Prep bowl and five ingredients. | **G+P**: `AR=16:9` "a sprite sheet … two rows of five separate small objects" on magenta, keyed and cut inline (method as §5). |
| `mood/v08/parchment.png` | 550×350 | 52,401 | Aged fishmonger chart paper (v08 "Butcher's chart"). | **P**: procedural in `tools/art/mood/v08_build.py` (`random.seed(8)`, 9 random stains plus per-pixel speckle; shown at 2×). |
| `mood/v08/cut-*.png` (11: chutoro 97×54, haranaka 77×45, harashimo 84×48, hoho 137×59, jabara 77×70, kama 72×209, noten 135×76, onomi 71×165, otoro 97×87, sekami 97×84, seshimo 161×96) | see left | 1.5–10 KB each | The 11 named cuts of a bluefin tuna, each a separate sprite with ink borders (vintage mute). | **G+P**: "A single bluefin tuna fish in strict side profile, facing LEFT … vintage fishmonger's …" → `/tmp/v08/fishq.png`; `v08_build.py` assigns each pixel to a cut via hand-traced polylines (G, LAT, M) and writes one sprite per cut, with a 0.18 mute toward (214,190,150). |
| `mood/v08/ghost.png` | 520×221 | 7,482 | Pale dotted outline of the whole fish (cavities left after cutting). | **P** `v08_build.py` |
| `mood/v08/board.png` | 260×116 | 4,485 | Cutting board (procedural wood grain, shown at 2×). | **P** `v08_build.py` |
| `mood/v08/knife.png` | 124×16 | 255 | Yanagiba knife. | **P** `v08_build.py` |
| `mood/v10/{rice,fish,nori,garnish,sauce}.png` | 96×78, 96×74, 96×70, 96×69, 96×68 | 15,206 / 14,582 / 12,930 / 14,944 / 12,095 | Bento compartment ingredients (v10 "Exploding bento"). | **G+P**: `AR=16:9` "A sprite sheet of exactly …" → `/tmp/v10/ing.png`, keyed and cut inline. The bento itself is drawn in code. |

Versions v01–v05 and v09 are pure code/CSS (isometric sushi, crafting grid, assembly line, periodic table, metro
map, blueprint). They reuse `public/items/*`.

### 8.8 Product UI and comparison `public/ui/`

| File | Size | Bytes | Depicts | How it was made |
|---|---|---|---|---|
| `ui/product/{chat,work,code,done,pr,new,model,menu,release,settings}.png` | 1600×1000, palette (P) | chat 55,464 · work 55,529 · code 60,372 · done 49,335 · pr 48,313 · new 29,444 · model 31,653 · menu 55,898 · release 54,813 · settings 47,856 | 10 states of the real Nori Sessions web UI with fake data (acme/checkout). | **C**, §10 |
| `ui/product/states.json` | – | 7,232 | State graph: image, caption, hotspots (fractions) and `to` for every state; start `chat`. | **C**, §10 |
| `ui/compare/generic.mp4` | 1280×800, 34.0 s, 25 fps | 2,678,573 | "Generic agent" transcript replay. | **C**, §11 (crf 27) |
| `ui/compare/jiro.mp4` | 1280×800, 34.0 s | 2,559,639 | Jiro transcript replay. | **C**, §11 (crf 26) |
| `ui/compare/generic.jpg` | 1280×800 | 108,066 | Poster = final frame. | ffmpeg `-sseof -0.3` |
| `ui/compare/jiro.jpg` | 1280×800 | 106,435 | Poster = final frame. | same |
| `ui/compare/compare.json` | – | 713 | Title "Same ticket. Two kitchens.", task, labels, stats, verdicts. | **code**, hand-written from the recorder's `stat` output |

### 8.9 Site chrome, OG and favicons

| File | Size | Bytes | Depicts | How it was made |
|---|---|---|---|---|
| `og.jpg` | 1200×630 | 180,934 | Bar crop `(330,0,1770,756)`, bottom gradient to ink, mini-Jiro at (48,494), "jiro.bot" in Silkscreen 64 (the "." copper), tagline "your AI staff engineer · by Nori" in Nori green at size 26. | **P**: `tools/art/chrome/og_and_favicons.py` (q88) |
| `favicon-32.png` | 32×32 | 2,419 | Mini-Jiro head, transparent. | **P** same script (BOX downscale, 94 %) |
| `favicon.png` | 64×64 | 8,300 | Mini-Jiro head. | **P** same (LANCZOS) |
| `apple-touch-icon.png` | 180×180 | 32,485 | Mini-Jiro head at 80 % on ink `#0b0a09`. | **P** same |
| `favicon.svg` | – | 358 | Original vector favicon; **no longer linked** from `index.html`. | **code** (fb79069) |

### 8.10 Deleted assets (recoverable from git)

| Path (under `restaurant/public/`) | Last commit that has it (`git show <c>:restaurant/public/<path>`) | What it was |
|---|---|---|
| `art/aquarium.jpg`, `games/fish/*.png` (angler, fry, gold, grouper, koi, player, puffed, puffer) | 58c10f2 | Aquarium stop and Fish Frenzy (sources in `art/aq/`) |
| `art/tr/kitchen-storage-{b,c,d,e}/…`, `art/tr/kitchen-storage/cutaway.jpg`, `public/preview/ks-*.html` | ed80e55 | Kitchen→storage candidates B–E and the round-1 dollhouse cutaway |
| `art/tr/dining-kitchen/{doors,kitchen-pov}.jpg` | 762b735 | Sushi-cam POV transition art |
| `art/tr/storage-yard/door.jpg`, `art/tr/yard-street/cross.jpg` | ed80e55 | Cat-flap and fence transitions (yard removed) |
| `art/tr/bar-office/mice.png` | 0b16f6e | Mouse family inside the wall (replaced by the cat) |
| `art/storage/rims.png`, `games/{bug-*,mallet,bonk-star,dizzy,lawn}.png` | 762b735 | Whack-a-Bug sack rims and sprites, Snake lawn |
| `games/koi-{a,b,gulp,dizzy}.png` | a5da57a (deleted in ca3138c) | Flappy Koi sprite frames (V3 draws the koi in code) |
| `src/games/snake.ts` (code) | a54bd26 | Hose Snake (removed in V3) |

---

## 9. Source art that is not served (`art/`)

| Path | Size | What |
|---|---|---|
| `art/src/jiro-canon.png` | 1024² | Jiro design #19 (the canon). Reference for every Jiro image. |
| `art/src/hero-v2-still.png` | 5504×3072 | Scroll-flow hero, the source of `bar.jpg` and the style reference in STYLE. |
| `art/src/pond.png` | 2752×1536 | Scroll-flow koi-pond ending, the source of `pond.jpg`. |
| `art/src/koi-sprite.png` | 2752×1536 | Scroll-flow giant koi sheet (the source of `end/koi.png`). |
| `art/src/s6-delivery.png` | 2752×1536 | Scroll-flow delivery scene (unused reference). |
| `art/first/*.png` + `.log` | 2752×1536 | The six first-pass generations (§7). |
| `art/aq/*.png`, `art/aq/key.py` | 2752×1536 bgs, 1024² fish | Aquarium backgrounds bg1–bg4 and Fish Frenzy fish sprites plus their keyer (feature reverted). |

---

## 10. Nori product UI capture (office scene)

Source: the **real** Nori Sessions broker web UI (`sessions/broker/ui`, Vue) at sessions commit `6181bbe0a`
(2026-09-29), rendered from an e2e **fixture with fake data**. There is no live backend: the dev server proxies
`/api` to a dead port. The fixture is derived from `e2e/fixtures/chat-page.ts`.

```bash
# 1) fixture (untracked files in the sessions repo; delete them afterwards)
SESSIONS=~/org/workspace/sessions tools/product/make-fixture.sh
#    = sed chat-page.html → restaurant-tour.html (script src → restaurant-tour.ts, title "Nori Sessions")
#      + tools/product/gen.py (run in e2e/fixtures): rewrites chat-page.ts → restaurant-tour.ts:
#        9 sessions (Fix flaky checkout test [slack #eng, live], jiro: refactor tuna-inventory service [live],
#        Nightly dependency bumps [trigger], #alerts · payment webhook 500s [unread], Add coupon codes to the cart API [cli],
#        Draft the Q4 on-call runbook [slack DM], Omakase menu page: dark mode, Postgres 17 upgrade plan,
#        Wasabi feature flag cleanup), projects Checkout v2 / Inventory service, user Hana <hana@acme.dev>,
#        model "Claude Opus 5.5", the conversation body from tools/product/convo.ts.txt, ?state=done opens
#        tuna-inventory, unread count 1, and /api/integrations/mcp returning GitHub, Linear, Sentry "connected".
# 2) serve against a dead API with credentials scrubbed
tools/product/serve-ui.sh        # bun run dev --host 127.0.0.1 --port 4173, VITE_API_TARGET=http://127.0.0.1:9
#    unset NORI_SESSIONS_URL NORI_SESSIONS_TOKEN NORI_BROKER_*  → it can never talk to a real broker
# 3) capture 10 states + measure hotspots
node tools/product/capture.mjs [chat,work,…]   # → /tmp/product/raw/<id>.png + /tmp/product/states.raw.json
~/.venv-sushi/bin/python tools/product/overlay.py   # QA: draws every hotspot box + target on ov-<id>.png
~/.venv-sushi/bin/python tools/product/export.py    # → public/ui/product/<id>.png (256-colour) + states.json
# 4) prove the tour works in the site (clicks all 16 hotspots in the office scene, records /tmp/product/tour.webm)
node tools/product/tour.mjs
# 5) clean up: pkill -f "vite.*4173"; rm e2e/fixtures/restaurant-tour.{ts,html}; git -C $SESSIONS status  (must be clean)
```

Capture settings (`capture.mjs`):
- Viewport 1600×1000, `deviceScaleFactor: 1`, `colorScheme: "dark"`, `reducedMotion: "reduce"`,
  `timezoneId: "America/New_York"`, URL `…/restaurant-tour.html?theme=dark&state=<conversation|done|landing>`.
- An init script fakes `Notification.permission = "granted"` and sets `localStorage["nori.chat.completionAlerts.v1"]="1"`,
  so the alerts row reads "Enabled".
- Each state has a `setup()` (open, click, hover) followed by a mouse park at (420,600) and a 500 ms wait before
  the screenshot. Then every hotspot's `boundingBox()` is measured, padded 3 px, and stored as fractions of
  1600×1000 (4 decimals).
- Captions and hotspot labels are in the script.
- Two hotspots were dropped because they would misrepresent the product: the PR link in text (it opens GitHub)
  and picking Sonnet.
- `explore.mjs` and `look.mjs` are the exploration helpers (`look.mjs URL OUT`).

The site side is `src/content/product.ts`. The window sits at `PRODUCT_BOX {x:60, y:80, w:1250}` and the caption
at `CAPTION_BOX {x:1370, y:380, w:400}`. Hotspots are absolutely positioned buttons with `title=label`.
`tour.mjs` clicks `.product-win .hot[title=…]` in order and asserts which image loads; the expected sequence is
in `tools/product/tour.log` (the 2026-09-29 run) and in the `steps` array.

---

## 11. Generic vs Jiro comparison recordings (dining scene)

Everything needed is in `tools/compare/`:
- `index.html` is the "agent window" replayer. Dark chrome with three dots, title `<label> · checkout-svc`, and
  status `working` → `idle`. JetBrains Mono plus Noto Sans Symbols 2, 22 px/1.42, 52 px bar. Colours: bg
  `#0e0c0b`, fg `#f3e6cf`, green `#6fdc8c`, red `#ff6b6b`, copper `#d98a4a`.
- `scripts.js` holds both transcripts: the same ticket #482, "Checkout total is wrong when a coupon and a gift
  card are combined."
  - Block types: `ticket`, `say` (typed), `tool`, `diff`, `run` (spinner then output), `final`, `pause`.
  - The `git diff --stat` line (`__STAT__`) is computed from the diffs themselves, so the numbers can't drift.
  - Total step time is scaled to `window.ANIM_MS` (default 32 000 ms).
  - The page sets `window.__startedAt` when the fonts are loaded and `window.__doneAt` at the end.
- `record-compare.mjs generic|jiro OUT_DIR` does the following:
  - opens `http://127.0.0.1:3101/?agent=<who>` in a 1280×800 context with `recordVideo` at 1280×800;
  - waits for `__startedAt` and then `__doneAt`, and holds **4200 ms**;
  - screenshots `<who>-final.png` and renames the video to `<who>.webm`;
  - prints `{startOffset, anim, stat}`. The 2026-09-30 re-run gave anim 31.6 s and stat `{files:2, add:32, del:8, anys:0}` for jiro.
- `encode.sh DIR` makes the site files with the exact flags used:

```bash
cd tools/compare && nohup python3 -m http.server 3101 --bind 127.0.0.1 > /tmp/cmp-http.log 2>&1 &
mkdir -p /tmp/cmpvid && node tools/compare/record-compare.mjs generic /tmp/cmpvid && node tools/compare/record-compare.mjs jiro /tmp/cmpvid
tools/compare/encode.sh /tmp/cmpvid
#  $FF -y -ss 0.1  -i generic.webm -t 34 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -r 25 -movflags +faststart -an generic.mp4
#  $FF -y -ss 0.25 -i jiro.webm    -t 34 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -r 25 -movflags +faststart -an jiro.mp4
#  $FF -y -sseof -0.3 -i <f>.mp4 -update 1 -q:v 3 <f>.jpg          # posters
pkill -f "http.server 3101"
```

Notes:
- Record the two **sequentially** so their timing is not skewed.
- `-ss` trims the white page-load frames. The offsets were found with
  `-vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG"` over the first 2.5 s. Re-measure if fonts or
  timing change.
- Budget ≤ 3 MB per MP4. Generic needed crf 27, because crf 26 gave 3.1 MB.
- `compare.json` stats as shipped: generic "7 files · +149 −29", "16× as any", "1 test skipped", "0 new tests";
  Jiro "2 files · +32 −8", "114 tests passing", "2 regression tests", "PR #483 opened".
- `src/content/compare.ts` places the windows at `COMPARE_BOX left [28,128,902] / right [960,128,902]`. Clicking
  a window replays it.

---

## 12. QA workflow

**Deterministic frames.** The engine reads these URL params (`src/engine/stage.ts`):
- `?freeze=<seconds>` freezes animation time (V3; `?t=` is ignored so old shared links animate).
- `?debugplates=1` makes chats, falls and walking legs frequent; `?idle=<s>` shortens the header-drifter idle time.
- `?seg=<id>&tt=<0..1>` renders one segment at local progress tt (tt is clamped to 0.9999).
- `?p=<viewport heights>` sets a raw scroll position.
- `#<scene>` deep-links to a scene.
- `?mood=<1..10>` picks the moodboard version.
- Loader and scroll nudge are skipped when `seg` or `p` is present. `window.__segs` lists
  `{id,start,len}` for every segment; `window.__chain`, `__belt`, `__scenes` and `__pond` are QA hooks (V3).

Segment ids, in order: `bar`, `bar>office`, `office`, `office>dining`, `dining`, `dining>kitchen`, `kitchen`,
`kitchen>storage`, `storage`, `storage>pantry`, `pantry`, `pantry>street`, `street`, `street>pond`, `pond`.
(`pantry>street` is implemented by `src/transitions/storage-street.ts`.)

**Standard loop after any art or code change:**

```bash
node tools/qa/seg.mjs /tmp/qa "kitchen>storage:0" "kitchen>storage:0.15" "kitchen>storage:0.3" "kitchen>storage:0.5" \
  "kitchen>storage:0.7" "kitchen>storage:0.85" "kitchen>storage:0.9999" kitchen:0.5 storage:0.5 --t=5 --wait=1500
node tools/qa/contact-sheet.mjs /tmp/qa /tmp/qa/sheet.png kitchen-storage     # look at it
```

- **Endpoint match.** A transition must start on the exact frame of the `from` scene and end on the exact frame
  of the `to` scene. Compare `from:0.5` with `from>to:0` and `to:0.5` with `from>to:0.9999` at the same `--t`.
  For pixel-exact checks, grab the raw canvas (`seam-grab.mjs` / `ks-a-diff.mjs`, which use
  `#stage.toDataURL`, so no DOM overlays), then run `ImageChops.difference(...).getbbox()` / `getextrema()` or
  mean abs diff (the `ks-*-sheet.py` scripts). Accepted: mean < 0.3/255, with differences only in DOM overlays
  or the egg counter.
- **One belt (V3).** After touching any belt path or `gap`, run `node tools/qa/chain.mjs` and `node tools/qa/align.mjs`:
  every join must show delta 0 (the same plate continues). Plates must keep one speed and spacing across every boundary.
- **Plate life (V3).** `life-scan.mjs` / `plates.mjs` to find chats and falls, `seg.mjs --debugplates` to see them often, `legs.mjs` for walkers.
- **Loops.** Every ambient period must divide 24 s. Check with `seg.mjs … scene:0.5 --t=0` and `--t=24`, which
  must be identical. Use `pond-seq.mjs` or `bar-frames.mjs` to step through time.
- **Motion stills.** Vary `--t` (for example 3.07 for a blink, 17.8 for the R sputter) to catch sprite swaps.
- **Coordinates.** `crop-grid.mjs` or `zoom-grid.py` on the art to read positions; `belt-overlay.py` to trace
  belt points onto a painted belt.
- **Interactions.** The `interact/*.mjs` scripts (plate drag onto surfaces, eggs, FAQ, games with bots, touch).
  Check `errs` output: page errors and HTTP ≥ 400.
- **Chrome and responsive.** `chrome-flow.mjs`, `seg.mjs --w=1280|1920|600`, and a portrait 390×844 context.
- **Type-check.** `npx tsc --noEmit` (the build runs it too).

**Gotchas learned the hard way:**
- **HMR reloads** from other edits wipe the page mid-test. Block the websocket with
  `await page.routeWebSocket(/.*/, () => {})` (in `games.mjs`, `touch.mjs`, `surftest.mjs`), or run a separate
  no-HMR Vite (the port-3909 config in §2.3).
- **Loader.** With `?seg=` it is skipped, but after a server error the page can stay on the loader. Use
  `--wait=1500` (up to 9000 on slow boxes) or `bar-frames.mjs` (it retries until `#loader` is gone).
- Blank white screenshots mean the dev server was mid-reload; retry.
- At 1920 wide, screenshots showed the page shifted about 32 px. That is a screenshot-tool artefact, not layout
  (checked with `chrome-probe.mjs`).
- `#ui` has `pointer-events: none` page-wide. Interactive DOM must opt back in under `.layer.live` (the
  moodboards needed this).
- Toasts: write to `#toast p`, never to `#toast` itself.

---

## 13. Known loose ends

- Scripts that hard-code `/tmp/<job>/` inputs need those intermediate Gemini outputs, which are gone. The prompts
  that made them are in `tools/prompts/gemini-calls.md` (PR #6) and §8.6 (V3 items). The final results are in `public/`, so they only matter
  for re-deriving an asset. The V3 `street.jpg` prompt was not recorded.
- Several V3 scripts hard-code `ROOT=/home/sprite/org/workspace/.local/jiro.bot/restaurant`.
- Shipped but unreferenced: `public/art/yard.jpg`, `art/street-trike.jpg`, `art/bar/chop-mid.png`, `end/koi.png`,
  `items/bowl-ramen.png`, `items/bowl-soup.png`, `items/cup-soy.png`, `favicon.svg`.
- `tools/art/items/__pycache__/` is committed; `tools/qa/_occ_tmp.mjs` is scratch.
- `interact/games.mjs`, `touch.mjs`, `st-drag.mjs` and `st2drag.mjs` still target Hose Snake or the trike's cargo box.
