# Pixel pipeline (true pixel art, 960×540 at 2×)

Every scene is authored at 960×540 native pixels in one shared 52-colour palette and shown at exactly 2×. (The first pass was 480×270 at 4×; the client asked for pixels half that size. `PX_W`, `PX_H` and `PX_S` switch it back.) Coordinates in `ops/*.json` and `--static` stay in 480×270 space and are scaled automatically. A 1-pixel move there becomes 2 native pixels, keeping the same on-screen amplitude. The rules are in `STYLE.md`.

1. **`restyle.sh [scene…]`: redraw.** Gemini redraws each current scene in the pond's pixel style, keeping its content and layout (the output overlays the original within a few pixels, so the belt lanes and anchors still line up). Inputs are the scene still, the pond as style reference, and `ref/jiro-char.png` where Jiro appears. The picked takes are `raw/<scene>.png`.
2. **`pixelize.py palette palette.json raw/*.png`: palette.** k-means in Lab space, weighted toward vivid colours, plus fixed anchors (eye cyan, lantern amber, cream, copper, indigo, tuna red). The darkest tone is floored to a very dark indigo-brown. Result: 52 colours.
3. **`pixelize.py still palette.json raw/<s>.png out/<s>`: grid and palette.** Each native pixel is the mode of its 4×4 block, and a cleanup pass removes lone pixels. Sparse 4×4 Bayer dithering is applied only in smooth areas and only between neighbouring shades. Writes `out/<s>-native.png` (the true art) and `out/<s>.png` (4× nearest).
4. **`veo.sh`: motion.** Veo 3.1 with the first and last frame pinned to `out/<s>.png`, using calm motion prompts.
5. **`animate.py SCENE RAW OUT [--static rects] [--no-open]`: pixel loop.**
   - Each frame is colour-corrected to the still, then snapped to the grid and palette at 12 fps.
   - Only pixels that really move (ΔE > 10 in ≥ 15% of frames vs Veo frame 0, speckle removed) leave the still, and only in frames where they changed.
   - A 3-frame temporal majority filter removes flicker. The loop ends on the frame closest to the start, and an 8-frame scattered-pixel dissolve returns to the still.
   - Seams measure 0.13–0.45 of a normal frame step. `--static` holds regions to the still (Jiro wherever Veo morphs him).
6. **`idle.py SCENE OUT --ops ops/<s>.json`: hand animation.** 1-pixel moves where Veo can't be trusted:
   - hero: copper jaw drop and a blink (Jiro frozen, no mouth)
   - delivery: a breath and a blink (Jiro and trike frozen, rain from Veo)
   - FAQ: the five sushi stretch, lean and wiggle in place, board colours excluded; plus Jiro's blink and lantern flicker

| Scene | Site file | Motion |
|---|---|---|
| hero | `v/s0-hero.mp4` | Veo customers, `--static 262,84,336,150`, then idle (jaw, blink) |
| demo | `v/s1-code-small.mp4` | Veo typing, lantern and screen, `--static 40,75,75,115` (head) |
| serve | `v/s2-serve.mp4` | Veo sips and steam |
| closing | `v/s7-closing-small.mp4` | Veo dozing chef and cat |
| faq | `v/s4-omakase.mp4` | idle only (`ops/faq.json`) |
| delivery | `v/s6-delivery.mp4` | Veo rain, `--static 250,45,400,270 --no-open`, then idle (breath, blink) |
| pond | `v/e1-pond.mp4` | Veo water and reeds |

Posters are `out/<s>.png` saved as JPEG at quality 95 with 4:4:4 chroma. The videos are H.264 at 1920×1080: each native pixel is an aligned 4×4 block, so 4:2:0 chroma stays exact. All 7 videos total 3.1 MB.

**In the site** (`site/src/pixelpass.ts`):
- The scene videos carry the pixel grid themselves: native pixels are aligned 2×2 blocks, and the textures use nearest filtering. The landed camera covers the card exactly, and there is no landed drift, so the art maps 1:1.
- The 3D scene renders at full resolution (device pixels, capped at 2×) with 4× MSAA. The belt and everything on it therefore move smoothly with fine, readable pixels, about 4× smaller than the scene pixels.
- A final pass snaps every pixel to the shared palette (`src/palette.ts`), with no dithering, because dither shimmers on moving things.
- An earlier version rendered everything on the coarse 4× grid, and the belt pulsed and flashed. The client asked for this change.
