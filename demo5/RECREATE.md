# Demo5 reconstruction specification

This preserves the v4 experience from source commit `aed728a3d43618c7bcd274c149d0722a7c644f2b`, not a reinterpretation of its prompt. Use the saved source, raster art, videos, fonts and content. Do not regenerate artwork. The original app source lives in `site/`; its only archival configuration change is the local Vite public directory. Source code overrides any prose discrepancy.

For playback independent of package registries and font providers, use the repository's `preservation/README.md`. The original `site/README.md` and `site/docs/` remain historical records; references to the old `v4/` or shared Demo1 media layout describe the original build.

## Scene-by-scene record

All coordinates below are image fractions unless labelled viewport or CSS pixels. `site/src/main.ts` maps these coordinates through object-fit cover to the displayed image, so responsive cropping and geometry stay together.

| Order / section ID | Exact visual inputs | Composition, content and behavior |
|---|---|---|
| 1 / `hero` | `public/v/s0-hero.mp4`, `public/p/s0-hero.jpg` | Full sushi bar; left scrim and headline; one CTA. Belt starts at image (0.975, 0.411) and follows the painted lane to (0.478, 1). Across-vector is (0.02625 × displayed image width, 0.00944 × displayed image height). The window post masks/fades the emerging belt. Five hotspots: Jiro (0.612,0.36), lantern (0.505,0.29), bottles (0.672,0.405), plant (0.098,0.72), crate (0.82,0.465). |
| 2 / `demo` | `src/art/demo-jiro.png`, `demo-jiro-blink.png` | Waist-up Jiro, pupil-free eyes, code blink, steam, large clickable Slack → PR → environment walkthrough. Belt follows right edge. Two dust sprites sit near the floor. |
| 3 / `restaurant` | `public/v/s2-serve.mp4`, matching poster | Restaurant without Jiro. Two large terminal panels show scripted generic-agent/Jiro replays. Belt remains on right before crossing left through the next passage. |
| 4 / `compare` | `public/v/s7-closing-small.mp4`, matching poster | Shadowy after-hours bar and cream comparison menu. Belt descends at left from 36% to 66% of scene height. A dust sprite sits in the lower-right shadow. |
| 5 / `faq` | `public/v/s4-omakase.mp4`, matching poster | Five sushi on front counter. Questions attach to image positions (0.518,0.808), (0.564,0.784), (0.604,0.756), (0.634,0.73), (0.68,0.723). Click selects the question and opens Jiro's answer bubble. Belt at right; counter accepts dragged plates. |
| 6 / `pricing` | `public/v/s6-delivery.mp4`, matching poster | Night bicycle scene with four hanging price tags; no belt loop around the bike. Copy and links are frozen in `content.ts`. |
| 7 / `pond` | `public/v/e1-pond.mp4`, matching poster; `public/end/koi.png` | Empty bridge, belt on trestle at image y=0.502. Belt turns left at 80% viewport width and exits beyond left edge. Water ripples, automatic/click-triggered koi, CTA and footer. |

Copy, comparison values, FAQ answers, walkthrough choices, replay lines, pricing and outbound URLs are executable data in `site/src/content.ts` and `site/index.html`. Product source notes are in `site/docs/CONTENT-SOURCES.md`. The walkthrough and terminal panels are illustrative/scripted. Do not replace their data with current website text when restoring this snapshot.

## All six passages

Scenes are one viewport high (`100svh` where supported, otherwise `100vh`). Each passage occupies half that height. Source: `main.ts` (`PASS_STYLES`, `layout`), `passes.ts`, and `style.css`.

| From → to | Wall style | Exact route and decoration |
|---|---|---|
| Hero → demo | `noren` | Belt curves via 60% viewport width at passage midpoint toward the right-hand lane. Indigo curtain strips sway above the opening; warm lamp; foreground bamboo/lanterns. |
| Demo → restaurant | `shoji` | Right-hand belt passes through illuminated paper lattice. No camera spin. |
| Restaurant → comparison | `moon` | Long S curve passes the centered moon opening toward the left lane. Midpoint direction is normalized (-1, 0.72). |
| Comparison → FAQ | `sliding` | Belt crosses back through a fusuma opening. Midpoint direction is normalized (1, 0.72). Partially slid paper doors and lamp frame the opening. |
| FAQ → pricing | `backdoor` | Right-hand belt exits via alley back door. Brick lower wall, swung wooden door, lamp and `裏口` sign. Street palette replaces interior palette. |
| Pricing → pond | `fence` | Right-hand belt crosses bamboo fence, then turns onto the pond trestle. Garden palette, bamboo culms, nodes and binding rails. |

Passage art is drawn at one art pixel per 3 CSS pixels, nearest-neighbor scaled. Wall band spans 20–80% of passage height. Opening width is derived from the belt's x and width at 20%, 50%, 80% of passage height, with 0.95 × belt-width margins. The wall layer occludes the belt except at its opening. Noise uses a deterministic seed derived from canvas width/height and style name. Noren animation is 7 seconds; lamp flicker is 5 seconds. Foreground offsets use -0.35 × distance from viewport center; far elements use +0.12. Preserve these coefficients and z-order.

## Conveyor and interaction mechanics

`site/src/belt.ts` is the precise executable record. Standard belt width is clamp(4.5% viewport width, 38, 66) rounded to CSS pixels. Lane margins are max(0.9 × belt width, 4.5% viewport width). Waypoints are joined by cubic Hermite curves; tangent magnitude is 1.2 × endpoint distance, sampling is approximately every 3 CSS pixels, with at least eight steps. Width eases between waypoints; the hero's skew blends into the normal perpendicular.

Slat pitch is 0.3 belt widths, plate spacing 1.75, speed 0.42 widths per second. Arc-length normalization compensates for perspective width. Scrolling does not alter speed or direction. Frame delta is capped at 0.05 seconds; reduced motion scales belt speed to 0.6 and suppresses background-video autoplay.

All 30 sprite identities, weights, rim colors, hit tests, reactions and particle formulas are saved in `belt.ts`. Mouse drag can park plates on the hero counter, five restaurant table rectangles, or FAQ counter. Water drops sink; invalid drops return. Touch retains scrolling and plate taps rather than drag. The exact surface rectangles are in `main.ts`'s `belt.surfaces` array.

The secrets catalog has 28 entries in `main.ts`. It covers sushi/item reactions, served and sunk plates, koi, the five hero hotspots, dust sprites, and completing the demo. Its found set is per page load. Retain exact handlers, text, timing and hit areas; a prompt-only rebuild cannot recover these details.

## Clocks, settling and randomness

- After 160 ms without scrolling, settle toward the next scene in the direction of travel. A nudge under 8% of viewport height returns to the last settled scene. Ignore settling while dragging; use smooth native scrolling except under reduced motion. Arrival tolerance is 2 pixels, with at most 90 animation-frame checks.
- Videos load/play within the IntersectionObserver margin of 60% above/below the viewport and pause outside it. Posters cover unloaded media.
- Jiro's first blink starts after 2 seconds; blink lasts 150 ms and repeats after 3.2–7.4 seconds. Dust-sprite blink starts at 1–4 seconds and repeats after 2.5–6.5 seconds, closed for 140 ms; flee removes the sprite after 900 ms.
- Completing the walkthrough's work stage takes 1900 ms. Compare replay timing is stored alongside each line in `content.ts`.
- Pond automation checks every 250 ms, active once more than 55% of the pond is visible. First koi is scheduled after 3.5 seconds, then every 18–34 seconds; ambient ripples every 2.2–5.2 seconds. Three water clicks within four belt-clock seconds also trigger a koi.
- Koi jump duration is 2.1 seconds, horizontal span ±3.2 belt widths; direction and center vary. The catch and eaten-plate behavior are in `belt.ts`.
- Resize relayout is debounced 150 ms; unchanged width with height change under 120 pixels is ignored to reduce mobile URL-bar jumps. Fonts finishing loading triggers relayout.

Random item reactions, blink timing, particles and koi mean two sessions need not display the same frame at the same wall-clock instant. Videos have their own decode/playback clocks. Restoring source and assets preserves these rules. The preserved recordings preserve one exact observed sequence. Pixel-for-pixel matching across different OS/browser/GPU/font rasterizers is not promised.

## Verification and continuation

1. Verify `preservation/SHA256SUMS` from repository root; restore the ready-built archives.
2. Compare original `site/reference/full-scroll.mp4` and `site/reference/stills/` with the running site. Additional five-position-per-passage captures are under `preservation/evidence/demo5/`, with viewport and scroll geometry in `preservation/evidence/audit.json`.
3. Use `window.__jiro.go('hero'|'demo'|'restaurant'|'compare'|'faq'|'pricing'|'pond')` for scene navigation and `window.__jiro.koi()` for the finale. `?s=faq` also selects a scene.
4. QA scripts in `site/qa/` are historical and launch their own browser. In a Nori session, use the current headed-browser skill and `preservation/tools/capture.mjs` instead.
5. Test plate poke/drag, each hotspot, full walkthrough, five FAQ answers, dust sprite, pond clicks and koi when modifying interaction code. Safari and real phone testing remain separate requirements.
6. Continue in a new branch/copy. Never overwrite the frozen assets or evidence to make a changed version appear identical.
