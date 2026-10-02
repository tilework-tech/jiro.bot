# Jiro brand assets

Everything produced in the Jiro character-design thread (Slack, 2026-09-28, Martin Stübler with Jiro).
The round-by-round history, including rejected candidates and the reasons, is in [DESIGN-LOG.md](DESIGN-LOG.md).
The raw thread export is in [thread/slack-thread-export.md](thread/slack-thread-export.md).

Large files live in Drive, mirrored one-to-one with this tree:
https://drive.google.com/drive/folders/1_cCjx9WQ5FjyzkoC9_WIVecRcBJK0dtK

Only the final animation loop is committed here. Loops v1 to v5 and the pixel-snapped variants are on Drive.

## Current picks

| Artifact | File | Status |
|---|---|---|
| Character canon | `character/05-design-iterations/19-CANON-rolled-sleeves-grille-mouth-facing-left.png` | Approved by Martin (design #19) |
| Bar scene still | `scenes/04-belt-edits/v5-FINAL-belt-into-wall-opening/01.jpg` | Approved, source frame of the loop |
| Bar loop | `animation/v6-FINAL-reversed-flow.mp4` | Approved ("great") |
| Hero banners | `scenes/03-hero-banners/*A-interior-mock.png` | Liked, header copy not yet set |
| Slack icon | `character/03-icons-handdrawn/`, `character/04-icons-aseprite/` | Candidates only, none chosen |
| Sushi characters | `character/06-sushi-mini-sprites/` | Martin likes the traced-onigiri style (`onigiri-copy-*.png`); eight-character set in that style delivered 2026-10-01 |

## Layout

```
reference/                     original artwork and the onigiri-face reference Martin supplied
character/
  01-16bit/                    hand-placed 64x64 SNES-style sprite and scene
  02-caves-of-qud/             Qud palette scene, 16x24 creature tile, 24-tile sushi bestiary, two map mockups
  03-icons-handdrawn/          four 96x96 hand-drawn icon angles at 768px
  04-icons-aseprite/           icons derived from the original via Pillow + LibreSprite, plus the .ase bundle
  05-design-iterations/        numbered contact sheets (REF, 1 to 17) and round 2 (#18, #19 canon)
  07-jiro-head-front/          Gemini-generated straight-on head portraits from the original artwork, with prompts
  06-sushi-mini-sprites/       three 32x32 sushi characters (salmon nigiri, tamago nigiri, maki roll) and a reference-shaped onigiri at 64 and 32, six moods each, in the onigiri-gallery style, plus the generator scripts
scenes/
  01-moodboard/                10 Gemini scene iterations, contact sheet
  02-bar-moodboard/            10 bar-scene iterations, contact sheet
  03-hero-banners/             2560x768 banners for scenes 1, 5, 6, 10, treatment A (interior extension) with header mocks
  04-belt-edits/               conveyor-belt re-routing, v1 (rejected) through v5 (final)
animation/                     final seamless loop, 1080p, 24 fps, ~8 s
thread/                        full Slack thread export
```

## Jiro canon

Fixed. This is the description to paste into any generation prompt, and the reference image is design #19.

- Round copper dome helmet with a rivet seam, cream faceplate, copper cheek guards.
- Two glowing blue eyes. No mouth line; a small speaker grille where the mouth would be.
- White hachimaki headband, knot and tails on one side.
- Indigo striped happi coat with a dark V collar. Sleeves rolled to the elbow, slim copper arms, no shoulder armor.
- Copper hands. Stands behind a sushi counter with a bottle shelf behind him.
- Faces left in the canon image.
- Pixel-art render, warm lantern light, dark wood, sake bottles and ingredients on the back shelves.

Flexible: scene, camera angle, lighting, customers, props, what he is holding or doing.

Rejected, do not reintroduce: bulky shoulder pads (original), rice-tin or visor heads, mouth as a drawn line, mitten hands, aprons, red hinomaru disc on the headband.

## Scene rules Martin set

- Exactly one conveyor belt per scene. Never two belts, never a belt that branches or turns a corner.
- The belt starts inside a visible opening in the back wall under the bottle shelf, runs in one straight line past Jiro, and exits the bottom-left edge of the frame.
- Counter sections without the belt are plain wood.
- Customers sit with their backs to the camera.

## Animation rules Martin set

- Belt moves slowly: about one plate-width across the whole clip.
- Plates only enter and leave through the wall opening and the frame edge. Nothing drops onto the belt.
- Jiro stays in pose: small finger motion and an occasional blink at most.
- Curtains barely move.
- Customers make small idle motions.
- The clip must loop with no visible seam: first and last frame pinned to the same still.
- Belt flow direction in the approved loop: toward the wall (plates enter bottom-left and disappear into the opening).

## Pipeline (as used, scripts not preserved)

The generation scripts and prompt files were on the session machine and were lost when the session was restored from a checkpoint. What they did, so it can be rebuilt:

1. Character and scene stills: Gemini image model with the original artwork (later #19) attached as the character reference, a fixed style prefix, and one change per prompt. Contact sheets and number badges added with Pillow.
2. Hero banners: Gemini outpaint leftward, then a deterministic dim and extend to 2560x768 with Pillow; treatments B (plank wall) and C (pixelated fade) were pure Pillow.
3. Belt edits: Gemini image edit on the chosen bar scene with explicit belt-routing instructions, two to three takes each, one picked by eye.
4. Loop: Veo 3.1 image-to-video with the still as both first and last frame, then ffmpeg to drop the duplicate end frame and crossfade the last 0.25 s into the head. Pixel-snapped variant: every frame quantized to a coarse grid at 12 fps. Reversal for v6: ffmpeg reverse filter on the chosen take.
5. Aseprite icons: Pillow crop, box-downscale to 128 and 96 px, 28-color palette from the character only with eye blue and headband white forced in; LibreSprite headless batch script for despeckle, .ase export, and upscales.

The `art/` folder in this repo has a live example of the Gemini frame pipeline for the site animation.
