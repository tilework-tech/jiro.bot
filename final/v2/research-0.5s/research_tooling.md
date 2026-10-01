# Tooling research for jiro.bot (16-bit pixel-art site, Vite + TS + canvas)

Date: 2026-10-01. Sandbox: Linux (gVisor), no sudo, no Docker, Node 22, bun, uv. Everything in section 1 was executed in this sandbox, not just read about.

## 1. LibreSprite headless on Linux without root

### Verdict
**Yes, it works headless, no root, no X display.** The v1.2 AppImage extracts with `--appimage-extract` (no FUSE needed) and `-b` batch mode runs with `DISPLAY` unset. Tested here on 2026-10-01.

### Download + run (verified)
```bash
mkdir -p ~/tools/libresprite && cd ~/tools/libresprite
curl -L -o LibreSprite.AppImage \
  https://github.com/LibreSprite/LibreSprite/releases/download/v1.2/LibreSprite-anylinux-x86_64.AppImage   # 109 MB, 2025-03-02, tagged "pre-release"
chmod +x LibreSprite.AppImage
./LibreSprite.AppImage --appimage-extract          # -> ./squashfs-root, no FUSE/root
export XDG_RUNTIME_DIR=/tmp/xdg; mkdir -p -m 700 $XDG_RUNTIME_DIR   # silences an "XDG_RUNTIME_DIR is invalid" warning; harmless either way
LS=~/tools/libresprite/squashfs-root/AppRun
$LS -b --version          # "LibreSprite 1.2-dev"
```
Other assets: v1.1 ships `libresprite-development-linux-x86_64.zip` (not AppImage); v1.0 has older AppImages; the `continuous` tag is a stale 2021 build. Releases: https://github.com/LibreSprite/LibreSprite/releases . No pip/npm package exists; the AppImage is the portable build.

### CLI flags that exist (from `src/app/app_options.cpp`, identical in `--help` of the v1.2 binary)
`--palette <file>`, `--shell`, `-b/--batch`, `--save-as <file>`, `--scale <factor>`, `--shrink-to w,h`, `--data <json>`, `--format json-hash|json-array`, `--sheet <png>`, `--sheet-width/--sheet-height`, `--sheet-type horizontal|vertical|rows|columns|packed`, `--sheet-pack`, `--split-layers`, `--layer/--import-layer`, `--all-layers`, `--frame-tag`, `--frame-range from,to`, `--ignore-empty`, `--border-padding/--shape-padding/--inner-padding`, `--trim`, `--crop x,y,w,h`, `--filename-format`, `--script <file>`, `--list-layers`, `--list-tags`, `-v`, `--debug`, `--help`, `--version`.
Source: https://github.com/LibreSprite/LibreSprite/blob/master/src/app/app_options.cpp

**Missing vs. modern Aseprite** (Aseprite CLI ref https://www.aseprite.org/docs/cli/): no `--color-mode`, no `--dithering-algorithm/--dithering-matrix`, no `--split-tags`, no `--script-param`, no `--extrude`, no `--list-slices`, no `--preview`. LibreSprite's `--palette` means "use this palette as the *default* palette", **not** "remap/quantize to this palette" (Aseprite's post-1.2 semantics). Verified: `--palette pal.png in.png --save-as out.png` left the output at 256 colours.

### Verified headless CLI results
| Command | Result |
|---|---|
| `$LS -b in.png --scale 4 --save-as out_x4.png` | 16x16 -> 64x64 nearest-neighbour RGB. Works. |
| `$LS -b anim.gif --sheet sheet.png --data sheet.json --sheet-type horizontal` | 3-frame GIF -> 48x16 sheet + Aseprite-format JSON. Works. |
| `$LS -b file.ase --sheet s.png --data s.json` | Works. |
| `$LS -b in.png --save-as out.gif` | Writes GIF, auto-quantized to 256 colours (not a fixed palette). |
| `$LS -b --palette pal.png in.png --save-as out.png` | **No quantization**, output unchanged. |

### Scripting (`-b --script file.js`, JavaScript via Duktape/QuickJS) — what actually works headless
In batch mode there is **no active document**: `app.activeSprite` / `app.activeImage` are `undefined` even when a file is passed on the CLI, so the bundled `white_to_alpha.js`-style scripts fail. The working idiom (same one https://github.com/vchopDev/libresprite-mcp uses) is:
```js
var doc = app.open("/abs/path/in.png");      // returns a Document, or null
var spr = doc.sprite;                         // width/height/colorMode/layerCount/palette
var img = spr.layer(0).cel(0).image;          // getPixel/putPixel/getImageData/putImageData/getPNGData/clear
var pc  = app.pixelColor;                     // rgba(r,g,b,a), rgbaR/G/B/A(c)
for (var y=0;y<img.height;y++) for (var x=0;x<img.width;x++) {
  var c = img.getPixel(x,y);
  img.putPixel(x,y, pc.rgba(pc.rgbaR(c)>127?255:0, pc.rgbaG(c)>127?255:0, pc.rgbaB(c)>127?255:0, 255));
}
spr.palette.get(0); spr.palette.set(0, pc.rgba(255,0,255,255));   // palette read/write works
spr.loadPalette("/abs/pal.png");               // runs, but does not remap pixels
spr.resize(32,32);                              // Transaction API, works
spr.saveAs("/abs/out.png", true);               // works; also .ase/.gif
```
Verified outputs: edited PNG saved with 6 colours; `.ase` saved and then consumed by the CLI `--sheet` exporter.
**Anything through `app.command.*` segfaults headless** (exit 139 on `app.command.ChangePixelFormat(...)`), so: no new layers/frames, no colour-mode conversion, no despeckle/filters from scripts. API doc: https://github.com/LibreSprite/LibreSprite/blob/master/SCRIPTING.md ; bindings in `src/app/script/api/*.cpp`. The deepwiki summary agrees: https://deepwiki.com/LibreSprite/LibreSprite/7.2-command-line-interface

### Palette quantization / despeckle / sheet export from CLI
- **Sprite sheet export: yes** (`--sheet`, `--data`, `--sheet-type`, padding, `--trim`, `--frame-tag`).
- **Palette quantization: no** (no `--color-mode`, `--palette` is default-only, command system dead headless). You *can* write your own nearest-colour remap in JS via `getPixel/putPixel`, but Pillow is simpler.
- **Despeckle / median filter: no** (Aseprite's Despeckle is a GUI command; not reachable headless).

### Recommended pipeline (no root)
1. **Pillow (via `uv run --with pillow`)** for the pixel work — verified on Pillow 12.3.0:
   ```python
   from PIL import Image
   pal_img = Image.new("P",(1,1)); pal_img.putpalette(flat_rgb_list + [0]*(768-len(flat_rgb_list)))
   small = Image.open(src).convert("RGB").resize((W,H), Image.Resampling.NEAREST)   # snap AI output to its pixel grid
   q = small.quantize(palette=pal_img, dither=Image.Dither.NONE)                     # fixed palette, no dither
   q.convert("RGBA").resize((W*k,H*k), Image.Resampling.NEAREST).save(out)          # crisp upscale
   ```
   Despeckle: `ImageFilter.MedianFilter(3)` or `ModeFilter(3)` on the small image before quantizing. Docs: https://pillow.readthedocs.io/en/stable/reference/Image.html
2. **LibreSprite CLI** only for `--sheet/--data` packing from `.ase`/GIF, or `--scale`. Equivalent packing can be done in Pillow in ~20 lines if you want zero binary deps.
3. For AI-output grid detection (off-grid "mixels"): `spritefusion-pixel-snapper` (Rust, https://github.com/Hugo-Dz/spritefusion-pixel-snapper , HN thread https://news.ycombinator.com/item?id=46058566 ) or `unfake.js`; `pyxelate` (https://github.com/sedthh/pyxelate , install from git, slow, light maintenance) is for photo -> pixel-art and overkill here.
4. **Aseprite source build**: CMake options are `ENABLE_SCRIPTING`, `ENABLE_UI` no longer exists; laf has `LAF_BACKEND=none|skia`. A `LAF_BACKEND=none` build is in principle CLI-only without Skia, but it is undocumented/unsupported and needs cmake+ninja+clang in-sandbox. Not worth it given the above. Refs: https://github.com/aseprite/aseprite/blob/main/INSTALL.md , https://github.com/aseprite/aseprite/issues/5109

## 2. Gemini image generation API (REST, `GEMINI_API_KEY`)

### Current models (ai.google.dev, Oct 2026)
| Model code | Marketing name | Notes |
|---|---|---|
| `gemini-3-pro-image` | Nano Banana Pro | 1K/2K/4K out, best text/layout; the repo's current model. `-preview` suffix is gone from the model list. |
| `gemini-3.1-flash-image` | Nano Banana 2 | 512px/1K/2K/4K, cheaper, most reference-image slots. |
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | 1K only, cheapest. |
| `gemini-2.5-flash-image` | Nano Banana (legacy) | **Shuts down 2026-10-02** (tomorrow). Imagen 4 already shut down. |
Sources: https://ai.google.dev/gemini-api/docs/models , https://ai.google.dev/gemini-api/docs/image-generation

### Endpoints — two shapes exist
`generateContent` is now labelled **"Legacy"** but "remains fully supported"; the Interactions API is the default since June 2026 (schema breaking change 2026-05-26, old schema removed 2026-06-08). Keep `generateContent` for now; plan a migration. Refs: https://ai.google.dev/gemini-api/docs/generate-content/image-generation , https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026 , https://ai.google.dev/gemini-api/docs/changelog

**A. generateContent (what the repo uses)**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent
x-goog-api-key: $GEMINI_API_KEY
Content-Type: application/json
```
```json
{
  "contents": [{ "parts": [
    { "text": "Edit: ... keep the character identical to the reference ..." },
    { "inline_data": { "mime_type": "image/png", "data": "<BASE64>" } },
    { "inline_data": { "mime_type": "image/png", "data": "<BASE64 second ref>" } }
  ]}],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": { "aspectRatio": "16:9", "imageSize": "2K" }
  }
}
```
Response image: `candidates[0].content.parts[i].inlineData.data` (base64; check `mimeType`). `imageSize` must be uppercase `"1K"|"2K"|"4K"` (`"512"` on 3.1 Flash). Aspect ratios: `1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9` (docs also list `1:4, 1:8, 4:1, 8:1` on the legacy page). Note: the legacy doc page currently shows `responseFormat.image{aspectRatio,imageSize}` in one snippet and `imageConfig` elsewhere; `generationConfig.imageConfig` is the form in the REST reference and third-party SDKs (litellm issue https://github.com/BerriAI/litellm/issues/17075 ). Multi-turn editing = keep the previous parts in `contents`.

**B. Interactions API (new default)**
```
POST https://generativelanguage.googleapis.com/v1beta/interactions
{ "model": "gemini-3.1-flash-image",
  "input": [ {"type":"text","text":"..."}, {"type":"image","mime_type":"image/png","data":"<BASE64>"} ],
  "response_format": { "type":"image", "mime_type":"image/png", "aspect_ratio":"16:9", "image_size":"1K" },
  "previous_interaction_id": "<optional, for multi-turn edits>" }
```
Image returned at `interaction.output_image.data` / in `steps[]` image blocks.

### Reference-image limits (per request)
- `gemini-3-pro-image`: up to 6 object images + 5 character images (14 images max in prompt).
- `gemini-3.1-flash-image`: 10 object + 4 character + 3 style refs.
- `gemini-3.1-flash-lite-image`: 14 object images.
Inline images up to 7 MB; PNG/JPEG/WebP/HEIC/HEIF. All outputs carry a SynthID watermark. There is **no explicit outpainting/mask endpoint**: outpainting is done by prompting ("extend the scene to the left, keep style") with the source as a reference, optionally pre-padded with a flat colour.

### Pricing (ai.google.dev/gemini-api/docs/pricing, paid tier; no free tier for image models)
| Model | Output per image | Input | Batch |
|---|---|---|---|
| gemini-3-pro-image | $0.134 (1K/2K), $0.24 (4K) | $2/1M tok (~$0.0011/image in) | 50% off |
| gemini-3.1-flash-image | $0.045 (512), $0.067 (1K), $0.101 (2K), $0.151 (4K) | $0.50/1M | 50% off |
| gemini-3.1-flash-lite-image | $0.0336 (1K) | $0.25/1M | 50% off |
| gemini-2.5-flash-image | $0.039 | $0.30/1M | $0.0195 |

### Rate limits
Official per-model table is only in AI Studio (https://aistudio.google.com/rate-limit ); the public rate-limits page just defines IPM ("images per minute, Nano Banana only"). Third-party mirrors report Tier 1 for gemini-3-pro-image at ~20 RPM / 10 IPM / 250 RPD, quota per *project* not per key — treat as unofficial. Source: https://ai.google.dev/gemini-api/docs/rate-limits , https://help.apiyi.com/en/google-ai-studio-rate-limits-2026-guide-en.html

### Does it do "16-bit, fixed palette" pixel art well?
Partially. It produces convincing pixel-art *style*, but consistently: off-grid / variable-size "pixels", anti-aliased edges, too many colours, **no alpha channel** (flat RGB only), inconsistent sprite spacing in sheets. Evidence: https://roboticape.com/2026/03/07/generating-game-sprites-with-gemini-image-generation-nano-banana-pro-lessons-learned/ , https://news.ycombinator.com/item?id=46058566 , https://www.pixelmade.ai/blogs/pixelmade/gemini-pixel-art-guide .
Prompt tactics that help: "16 colors max", "no anti-aliasing, no gradients, no shadows, no texture", "crisp 1-pixel outlines", "SNES-era", exact hex codes for the palette, an explicit `W x H` grid and cell size, a 2-3 px white outline around sprites as an AA buffer, and a pure chroma-key background (#00FF00, detect in HSV hue ±22°, S≥0.3, V≥0.3) instead of magenta/black. Then always post-process: downsample to the intended grid (NEAREST), quantize to the fixed palette with `Dither.NONE`, upscale NEAREST (section 1 pipeline). Budget 1-2 regenerations per sheet.

## 3. Scroll-driven conveyor belt in 2D canvas

### Architecture (plain canvas is enough; no engine needed)
- **Path model**: polyline of corner points (90° corners). Precompute cumulative segment lengths; `sample(s)` = binary-search segment, lerp point, tangent = segment direction. Each item is a scalar `s` along the path; wrap `s` modulo total length for an infinite belt. Rotate the sprite by `atan2(t.y, t.x)` — with axis-aligned segments the angle is one of 0/90/180/270, so pre-render 4 rotated copies (or use `ctx.rotate` with `imageSmoothingEnabled=false`). To avoid a hard pop at corners either accept the snap (authentic 16-bit) or ease the angle over the last ~8 px of a segment.
  Library if you want curves/arcs later: `svg-path-properties` (`getPointAtLength`, `getTangentAtLength`, no DOM dependency; https://www.npmjs.com/package/svg-path-properties ).
- **Speed**: `v = base + k * clamp(|scrollVelocity|, 0, vmax)`; integrate `s += v * dt` in a `requestAnimationFrame` loop with `dt` clamped (≤ 50 ms) so tab-switches don't teleport items. Scroll velocity: either compute `(scrollY - prevY) / dt` from `scroll` events with exponential decay toward 0, or use Lenis (`lenis.velocity`, `lenis.on('scroll', e => ...)`, drive it from the same rAF via `lenis.raf(time)`; https://github.com/darkroomengineering/lenis ). Motion One's `scroll()` also exposes velocity ( https://motion.dev/docs/scroll ). Keep base speed > 0 so the belt never looks frozen.
- **Drag-and-drop**: Pointer Events on the canvas (`pointerdown` hit-test items by AABB in canvas px; `setPointerCapture`; on `pointerup` test against flat-zone rects, snap to grid or spring back). Item state machine: `onBelt(s)` -> `dragging(x,y)` -> `placed(zone, gx, gy)`. CSS `touch-action: none` on the canvas (iOS needs this; `preventDefault` in a passive listener is ignored).
- **Layers**: three canvases stacked (static background, belt+items, ambient overlay) or one canvas with dirty-rect redraw; the belt needs full redraw anyway.

### Libraries
- **PixiJS v8**: WebGL/WebGPU scene graph; `autoDetectRenderer({ preference: 'webgl' })`; pixel art via `TextureSource.scaleMode = 'nearest'`, `roundPixels: true`, `resolution: devicePixelRatio`, `autoDensity: true`. Canvas2D renderer is **experimental since v8.16.0 (Feb 2026)** and must be explicitly selected (`preference: 'canvas'`); there is **no automatic fallback** yet. For a marketing site with a few dozen sprites it is heavier than needed. https://pixijs.com/8.x/guides/components/renderers , https://github.com/pixijs/pixijs/discussions/10682
- **Phaser 3/4**: has `Phaser.AUTO` WebGL->Canvas fallback, `pixelArt: true`, paths (`Phaser.Curves.Path`, `getPoint/getTangent`) and drag. Heavier, opinionated scene lifecycle.
- **CSS Motion Path (DOM instead of canvas)**: `offset-path: path(...)`, `offset-distance`, `offset-rotate: auto` rotates to the tangent for free; Safari/iOS ≥ 16.0 ( https://caniuse.com/css-motion-paths ). Works if items are `<img>`/`<div>`s, but then drag/drop and `image-rendering: pixelated` are per-element and scroll-coupled speed needs JS writing `offset-distance` each frame. Reasonable alternative for a small number of items.
- Recommendation: plain 2D canvas + the polyline sampler above + Pointer Events; add Lenis only if you already want smooth scroll.

### Safari / iOS gotchas
- `image-rendering: pixelated` works on `<canvas>` and `<img>` in Safari/iOS ≥ 10 ( https://caniuse.com/css-crisp-edges ). Still set `ctx.imageSmoothingEnabled = false` for `drawImage` upscales (Safari 9.1+).
- **DPR**: size the backing store at an integer multiple of the art scale, e.g. `canvas.width = cssW * dpr` and draw at `scale = Math.floor(dpr * k)` so sprite pixels map to whole device pixels; non-integer scales produce uneven pixel widths. iOS DPR is 2 or 3. Use `ResizeObserver` with `devicePixelContentBoxSize` where available (not Safari) and round. https://web.dev/device-pixel-content-box/
- **OffscreenCanvas**: Safari 16.4 shipped 2D-only, 17.0+ adds WebGL/WebGL2 in workers; iOS same ( https://caniuse.com/offscreencanvas ). Fine to use for pre-rendering rotated/scaled sprite atlases on the main thread; worker rendering optional.
- **rAF throttling**: iOS Low Power Mode caps rAF and CSS animations at 30 fps (WebKit bug 173434 / 215745), so use `dt`-based integration, never per-frame constants. Background tabs: rAF pauses entirely; CSS animations may keep running. Cross-origin iframes: rAF throttled until first tap.
- **Touch**: Safari iOS ≥ 11.3 makes `touchstart/touchmove` passive by default; use `{passive:false}` or, better, `touch-action: none` on the canvas. WebKit ignores `preventDefault` from listeners added inside another listener. Pointer Events are supported on iOS ≥ 13.
- **WebGL context loss**: on iOS 17/18 the WebGL context is routinely lost when Safari backgrounds (model-viewer #5100, PixiJS #9676, WebKit 261331); any WebGL path must handle `webglcontextlost`/`restored` and re-upload textures. 2D canvas does not have this problem — another reason to prefer it here.

### WebGL2 in Safari 26 / iOS 26 and fallback pattern
WebGL2 has shipped for all users since Safari 15 (2021) and is reliable in Safari 26; Safari 26.0 adds **WebGPU** and Apple says it "supersedes WebGL ... and is preferred for new sites", but WebGL/WebGL2 are not removed ( https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ ). Standard fallback:
```ts
function makeRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
          ?? canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return new Canvas2DRenderer(canvas.getContext('2d', { alpha: false })!);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); r.pause(); });
  canvas.addEventListener('webglcontextrestored', () => r.reupload());
  const r = new WebGLRenderer(gl); return r;
}
```
Also check `gl.isContextLost()` before first frame; some iOS devices return a context that is already lost under memory pressure. For this site, start with 2D canvas and skip WebGL entirely unless you need >1k sprites or shader effects.

## 5. Seamless ambient loops

### Sprite-sheet idle loops that return exactly to pose
- Author the loop so frame N+1 == frame 1 is **not** in the sheet: a 4-frame breathe is frames `A B C B`, played `A B C B | A B C B ...`; never duplicate the first frame at the end or you get a one-frame hitch.
- Canvas: `frame = Math.floor(t / frameDuration) % frameCount`; keep `t` as accumulated `dt` (clamped) so Low Power Mode and tab switches don't desync; use per-frame durations from the Aseprite/LibreSprite `--data` JSON (`frames[].duration` ms) rather than a constant.
- CSS: `background-position` keyframes with `steps(N, jump-none)` and the last keyframe at `-(N-1) * frameWidth`, so the N steps land exactly on N frames and `infinite` wraps cleanly. `jump-none` needs Safari/iOS ≥ 14 ( https://caniuse.com/mdn-css_properties_animation-timing-function_jump ); the pre-2019 equivalent is `steps(N, end)` with the `to` keyframe at `-N * frameWidth` (one past the last frame). Add `image-rendering: pixelated; background-size: <sheetW>px <sheetH>px`. Reference: https://leanrada.com/notes/css-sprite-sheets/
- Watch sub-pixel `background-position` on DPR 3 devices: keep sheet dimensions and element size in integer CSS px multiples of the art scale, otherwise Safari samples between frames.

### Scroll-independent ambient layer: CSS steps() vs canvas
| | CSS `steps()` on DOM elements | Canvas (rAF) |
|---|---|---|
| Thread | Compositor (keeps running during main-thread jank) | Main thread, shares the belt's rAF |
| Scroll coupling | Naturally independent of scroll; can also be *scroll-driven* via `animation-timeline: scroll()/view()` (new in Safari 26.0) | Independent only if you keep a separate clock from the belt's speed |
| Pixel crispness | Needs `image-rendering: pixelated` + integer sizes; `transform` animations can blur | Full control; draw with `imageSmoothingEnabled=false` at integer scale |
| Many sprites | One element per sprite; fine for < ~50 | Scales to hundreds |
| Background tab | May keep running (wasted CPU) | Pauses with rAF |
| Low Power Mode | Both drop to 30 fps; CSS stays time-correct automatically; canvas must use `dt` |
Practical split: ambient steam/blink/flicker on a few DOM elements as CSS `steps()` loops (cheap, off-main-thread, stays alive while the belt pauses in background), and belt + draggable items on canvas. If everything is on canvas, give the ambient layer its own accumulated clock (`ambientT += dt`) so scroll velocity never touches it, and consider a second `<canvas>` so the ambient layer can redraw at a lower rate (e.g. 12 fps) than the belt.

## Gaps / uncertainty
- Gemini per-model **rate limits** are only shown after login in AI Studio; the numbers above are third-party.
- The legacy docs page shows two spellings for image settings (`generationConfig.imageConfig` vs `responseFormat.image`); `imageConfig` is what the REST reference and SDKs use — confirm against a live call.
- LibreSprite v1.2 is a 2025 "pre-release"; master has moved (e.g. `app.open` now returns Document on master too, matches v1.2 behaviour tested). The headless scripting API is small and the command system segfaults; do not rely on it for anything beyond pixel I/O, resize, palette slots and saveAs.
- Aseprite `LAF_BACKEND=none` CLI-only build is plausible but untested here.
