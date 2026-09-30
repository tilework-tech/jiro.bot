# v4: Jiro.bot scroller (2D, one belt)

Review draft built on 2026-09-30 from Martin's master prompt (`master_prompt.md`) and reference pack, attached to the #growth-and-marketing thread `1790795998.993519`.

One sushi conveyor runs from the hero bar's kitchen window, down every scene, and ends on the koi pond trestle, where a large koi sometimes jumps and eats a stretch of plates. The belt moves at one speed and in one direction the whole time. Scrolling only chooses which stretch of it you see.

**Base:** Demo1 (tag `demo1`, PR #9). v4 reuses Demo1's final loops, posters and belt sprites in place (`publicDir: ../demo1/site/public`). It replaces Demo1's Three.js camera with a flat, stable observer:

- **No WebGL.** Everything is DOM plus one 2D canvas, so Safari and low-GPU browsers can't end up with a black page. If a video fails to load, its poster stays on screen.
- **No 3D spins.** Each scene is a full screen. After scrolling stops, the page glides to the next scene in the direction of travel.
- **Doors and windows.** Each transition is a short passage: a wall band with an opening cut exactly where the belt crosses it. The six walls are a noren hatch, a shoji window, a moon window, a sliding door, a back door, and a bamboo fence. Foreground silhouettes add parallax.

## Run it

```bash
npm ci
npm run build && PORT=4173 node serve.mjs   # serve.mjs supports byte ranges, which Safari needs for video
```

Debug: `?s=faq` opens at a scene; `__jiro.go("pond")` and `__jiro.koi()` work in the console. When cache-busting a review link, use `?v=`.

## Scenes (brief order)

| # | Scene | Art | Content |
|---|---|---|---|
| 1 | Hero bar | `v/s0-hero.mp4`: full bar, dark left third, jaw only, no drawn mouth | H1, sub, one CTA; 5 hidden hotspots (Jiro, lantern, sake, plant, fish crate) |
| 2 | Product demo | `src/art/demo-jiro.png`: waist-up crop of `demo1/art/s1-code.png`, no pupils, code blink | Clickable walkthrough (Slack → PR → environment), no copy above it |
| 3 | Restaurant | `v/s2-serve.mp4`: diners at tables, no Jiro, darkened | "Same prompt. Different chef.": two large terminal panels |
| 4 | How Jiro compares | `v/s7-closing-small.mp4`: after-hours bar in shadow | The noriagentic.com comparison table on a cream menu board |
| 5 | FAQ counter | `v/s4-omakase.mp4`: five sushi on the front board (stretch/wiggle loop) | 5 thought bubbles; Jiro answers in a speech bubble |
| 6 | Night delivery | `v/s6-delivery.mp4`: Jiro stopped on a bicycle, one foot down | The 4 noriagentic.com plans as hanging tags |
| 7 | Koi pond | `v/e1-pond.mp4`: empty bridge; belt on the trestle | Final CTA, footer; koi every 18–34 s, ambient ripples |

Product facts come only from noriagentic.com; see `docs/CONTENT-SOURCES.md`.

## Interactions

- **Plates:**
  - Click to poke; there are about 20 item reactions.
  - With a mouse, drag a plate onto the hero counter, the restaurant tables or the FAQ counter and it stays. Drop it in the pond and it sinks. Drop it anywhere else and it flies back to its slot.
  - On touch screens, plates can be poked but not dragged, so scrolling keeps working.
- **Dust sprites (susuwatari):** they replace the wall mice. They sit in the demo room, the after-hours bar and three passages, and they scatter when clicked.
- **Pond:** clicking the water three times calls the koi.
- **Secrets counter:** appears bottom-left after your first find (28 in total).

## Files

- `src/belt.ts`: path, slats, plates, poke/drag, particles, koi, ripples
- `src/passes.ts`: the pixel-art walls between scenes
- `src/main.ts`: layout (maps positions in each video to the screen), belt waypoints, hotspots, FAQ, scroll settle, video loading
- `src/content.ts`: demo script, replays, comparison, FAQ, pricing
- `qa/`: the Playwright scripts that produced `reference/`
- `reference/`:
  - `stills/`: every scene, every passage, demo, FAQ and koi states
  - `full-scroll.mp4`: the full journey at 1280×720, Chromium
  - `mobile-390.jpg`: the 390 px layout

## What was and wasn't verified

- **Verified (headless Chromium, Linux):**
  - Full scroll at 1440×900 and 1280×720, plus a 390×844 layout
  - All 6 videos reach `readyState 4`
  - Poke, drag onto the counter, hotspot, demo click-through, FAQ answer, and a koi eating plates
  - No page errors
- **Not verified:**
  - Safari / WebKit. The WebKit engine can't start in this sandbox because system libraries are missing and there's no root. There is no WebGL anywhere, and the videos are the same files Demo1 played in Safari 26.5, but this still needs a real Safari check.
  - Real iOS touch behaviour.
- **Known gaps:**
  - The side-by-side panels are **scripted replays**, not Playwright recordings of real agent runs.
  - The demo panel is an illustrative walkthrough.
  - No new sushi mini-games were added. The brief asks for prototypes and approval after the core scroll works.
