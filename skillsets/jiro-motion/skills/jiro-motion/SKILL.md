---
name: jiro-motion
description: Use when someone wants Jiro (the animated >_ speech-bubble mascot) dropped into a video as a transparent overlay, or a composited MP4 of Jiro over footage, or wants to check that a rendered Jiro moves the way the v6 motion spec says. Renders deterministically from a seed, never covers detected on-screen text, and reports pass/fail per spec rule.
---

<required>
*CRITICAL* Add each step to your task tracker (TaskCreate (claude), update_plan (codex), etc.) as its own task.

1. Ask me (unless I already said) for:
   - the input video;
   - the video type: `product_demo`, `release_showcase`, `social_short` or `explainer` (see the frequency table in `{{skills_dir}}/jiro-motion/spec/MOTION-SPEC.md`; the type columns are proposals awaiting Martin Stübler's confirmation, so say so if I ask about them);
   - the lines Jiro should say, if any, and which scene each belongs to;
   - known cut times, if I have them (otherwise they are auto-detected).
   Do not invent lines. Silence is a valid choice.
2. Read `{{skills_dir}}/jiro-motion/spec/MOTION-SPEC.md` so you know the limits you are rendering against. Never edit motion values anywhere except `spec/motion-spec.json`; after editing it, run `{{skills_dir}}/jiro-motion/scripts/jm tables --write {{skills_dir}}/jiro-motion/spec/MOTION-SPEC.md` and `{{skills_dir}}/jiro-motion/scripts/jm test`.
3. Write the lines file (JSON, see below) and render:
   ```bash
   {{skills_dir}}/jiro-motion/scripts/jm render INPUT.mp4 --out OUT_DIR --type TYPE --seed 0 --lines lines.json
   ```
   The first run builds a virtualenv in `~/.cache/jiro-motion/venv` with `uv` (about a minute). Keep the seed: the same seed and input give the same overlay, byte for byte.
4. Read `OUT_DIR/check.md`. Every rule must pass. If one fails, find out why before re-rendering. Do not loosen tolerances or the spec to make a render pass.
5. Read the `line not placed` messages (also in `timeline.json` under `unplaced_lines`). Tell me which lines were dropped and the reason given (usually a shot too short for 0.9 s + typing + the 4.5 s hold, or no clear space for the bubble). Offer to pin them to longer scenes; do not shorten the hold on your own.
6. Build and serve the review page, then give me the link with a fresh `?t=<unix time>`:
   ```bash
   {{skills_dir}}/jiro-motion/scripts/jm review OUT_DIR --title "..."
   setsid -f nohup python3 -m http.server PORT --bind 0.0.0.0 --directory OUT_DIR > /tmp/jiro-review.log 2>&1 < /dev/null
   ```
   Pick a free port that is not reserved (not 8080-8089, 2019, 6901 or 9222) and resolve the real session URL before sharing it.
7. Hand over: `overlay.webm` (VP9 with alpha, for browsers and editors that read it), `overlay.mov` (ProRes 4444 with alpha, for Premiere, Resolve and Final Cut), `composite.mp4`, the seed and the checker result.
</required>

# jiro-motion

Jiro's motion vocabulary is the v6 website scroll buddy (`tilework-tech/jiro.bot`, branch `feat/jiro-scroll-buddy`, approved by Martin on 2026-10-27), translated from scroll passes to video scenes. `spec/motion-spec.json` is the single source of truth: the renderer and the checker both read it, and `spec/MOTION-SPEC.md` is generated from it.

## Inputs

| Flag | Meaning |
|---|---|
| `INPUT` | Any ffmpeg-readable video. Its size, fps and audio are kept. |
| `--type` | Column of the frequency table (default `product_demo`). |
| `--seed` | Integer. Fixes every random choice (spots, hovers, gestures, faces). |
| `--lines` | `.txt` (one line per row, spoken in order, one per scene at most) or `.json`: `["Hi.", {"text": "...", "scene": 2}, {"text": "...", "at": 14.5}]`. Scenes are 0-based. |
| `--cuts` | `7.2,14.5` to set cuts, `none` for a single scene. Default: hard cuts are auto-detected. |
| `--mascot-height` | Mascot box height in px. Default: 10% of the frame height (v6 at 1440×900). |
| `--sample-interval` | Seconds between text-detection samples (default 0.5). Lower is safer for fast-scrolling footage and slower to render. |
| `--reuse-textmap` | Reuse `OUT_DIR/textmap.json` from a previous run with the same input and cuts. |
| `--no-debug` | Skip `debug.mp4`. |

## Outputs (in `OUT_DIR`)

| File | What |
|---|---|
| `overlay.webm` | Jiro alone, VP9 with alpha (`yuva420p`). |
| `overlay.mov` | Jiro alone, ProRes 4444 with alpha (`yuva444p10le`). |
| `composite.mp4` | H.264 of the input with Jiro composited (input audio copied). |
| `debug.mp4` | Composite plus detected text (red) and chrome (orange) boxes, where his body may rest (green), the centre band, and his tracked boxes. |
| `timeline.json` | Every scheduled event. |
| `track.json` | Per-frame pose: layer channels, matrices, ink and bubble boxes. |
| `textmap.json` (+ `.busy.npz`) | Detected boxes per sample, and edge density. |
| `check.json`, `check.md` | Checker report, one row per rule. |
| `manifest.json` | Inputs, seed, cuts, SHA-256 of the raw overlay frames, timings. |
| `index.html` | Review page (after `jm review`). |

## How it decides where Jiro goes

1. Hard cuts split the video into scenes.
2. Text detection runs on frames sampled every 0.5 s and right after every cut: RapidOCR's DBNet detector for text (labels, buttons, code, captions, paragraphs), and dense edges for non-text UI chrome.
3. A spot is allowed only if Jiro's footprint (his body plus the reach of every move and hover, plus 8px of padding) is clear of text and chrome in every sample during his stay and the nearest sample on either side of it. Bubbles, the edge peek and the flight path are checked the same way. He also avoids the centre band (35–65% of the width) on landscape frames and stays 8px from the edges.
4. Among the allowed spots he prefers flat, low-edge areas near where he was. If text is about to reach him he relocates (if the scene still has its big move) or fades out, and comes back in the next scene.

## Using it with making-feature-showcases

Render the showcase body first (its `render.mjs`), then run `jm render` on that body with `--type release_showcase`, passing the scene start times from the showcase timeline as `--cuts`. Compose the result with `brand/compose.sh` as usual, so Jiro never appears on the Nori ident or the end card. For editors, hand over `overlay.mov` instead and let them place it.

## Checker

`jm check OUT_DIR` re-measures a render. It measures:
- amplitudes, durations and curve shape (easing, overshoot) of every move, from the per-frame layer channels;
- counts per scene and per minute, small-move spacing, rest before relocating, one pop-in, peek limits, a squash and puff on every landing, line timing and quiet mode;
- zero overlap with detected text and the padding around it, edge margins and the centre band, from the decoded ProRes alpha;
- that the drawn pixels sit where the track says (so the measurements describe what was drawn), and that the WebM's alpha matches the ProRes alpha.

## Known limits of text detection

- It samples every 0.5 s. Text that appears and disappears between two samples in the same scene is not seen. Lower `--sample-interval` for fast UI.
- Very small (under about 8px tall), low-contrast, heavily stylised or rotated text can be missed. Big display type, such as hero headlines, is found reliably.
- "Chrome" is a heuristic: dense edges. Busy photos and textures count as chrome (he avoids them, which is the intended taste), and flat, borderless buttons without a label are invisible to it.
- Detection only, no recognition: it never reads the text, so it cannot tell a heading from a caption.
- Cut detection finds hard cuts. Dissolves and very slow fades are treated as one scene; pass `--cuts` for those.
