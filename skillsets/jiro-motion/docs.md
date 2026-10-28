# Noridoc: jiro-motion

Path: @/skillsets/jiro-motion

### Overview

- A standalone Nori skillset that lets any agent put Jiro (the `>_` speech-bubble mascot from the jiro.bot scroll buddy v6) into arbitrary footage: a transparent overlay as WebM VP9 + alpha and ProRes 4444 `.mov`, a composited H.264 MP4, a debug video, and a pass/fail report measured against the motion spec.
- Output is deterministic for a given input, cuts, lines, spec and `--seed` (the manifest records a SHA-256 of the raw RGBA overlay frames), and Jiro never rests, talks or flies over text or UI chrome detected in the footage.
- [skills/jiro-motion/spec/motion-spec.json](skills/jiro-motion/spec/motion-spec.json) is the single source of truth for how Jiro moves. The renderer and the checker both read it, and [skills/jiro-motion/spec/MOTION-SPEC.md](skills/jiro-motion/spec/MOTION-SPEC.md) is generated from it.

### How it fits into the larger codebase

- Lives in the jiro.bot repo but is not part of the site: [build.py](../../build.py), [tools/lint.py](../../tools/lint.py) and the deploy workflow never read `skillsets/`. It is packaged as a skillset ([nori.json](nori.json), [skills.json](skills.json), [AGENTS.md](AGENTS.md)) with one skill, [skills/jiro-motion/SKILL.md](skills/jiro-motion/SKILL.md), for installation through `nori-skillsets`. Martin Stübler approved publishing it to the demo org registry as `demo/jiro-motion@1.0.0` on 2026-10-28; later versions need his approval again.
- The motion vocabulary is ported from the website scroll buddy on branch `feat/jiro-scroll-buddy` (`prototypes/scroll-buddy/`, approved 2026-10-27). The spec JSON records that source, and `dropped_from_v6` lists the web-only features that were removed with the reason for each (drag, keyboard nudge, logo docking, click-to-speak, reduced motion, and similar).
- Website scroll "passes" are translated to video scenes: per-pass limits become per-scene limits plus per-minute caps, "follow to the next section" becomes "relocate after a cut", and the edge-peek trigger becomes "first arrival in a new scene". The rationale is in the [scheduler](skills/jiro-motion/scripts/jiro_motion/scheduler.py) module docstring and the first table of `MOTION-SPEC.md`.
- Video-type columns in `types` (`product_demo`, `release_showcase`, `social_short`, `explainer`) choose hover odds, relocate policy, per-minute caps, edge-peek odds and quiet-after-N-lines. Martin Stübler approved them on 2026-10-28; each type's `status` records that, and the frequency table heading in `MOTION-SPEC.md` shows the status when all types share one.
- Separate from, but meant to compose with, the org's `making-feature-showcases` skill: render the showcase body first, run `jm render --type release_showcase` with the showcase scene starts as `--cuts`, then compose with the showcase's brand script so Jiro never lands on the ident or end card.
- [AGENTS.md](AGENTS.md) records the creative direction ("small, gentle, hovering movements", never centred, never over text) and requires that motion changes go only through the JSON, followed by regenerating the tables, running the tests, and showing the `MOTION-SPEC.md` diff.

### Core Implementation

- Entry point is [skills/jiro-motion/scripts/jm](skills/jiro-motion/scripts/jm), a bash wrapper that builds a `uv` Python 3.11 venv in `~/.cache/jiro-motion/venv` (override with `JIRO_MOTION_VENV`), rebuilds it when the SHA-256 of `requirements.txt` changes, and runs `python -m jiro_motion` with `scripts/` on `PYTHONPATH`. `jm test` runs `unittest` from `tests/`. The CLI in `__main__.py` has `render`, `check`, `tables` and `review` subcommands.
- All third-party pieces are pinned pip wheels, so nothing is installed system-wide: ffmpeg comes from `imageio-ffmpeg` (libvpx-vp9, prores_ks, libx264), text detection from `rapidocr-onnxruntime` (models in the wheel, CPU only), rasterising from `resvg-py`, font metrics from `fontTools` with a bundled Inter subset (OFL) in `scripts/jiro_motion/fonts`.

```
input video
   │  video.probe / video.detect_cuts (or --cuts)
   ▼
scenes ──────────────┐
   │                 │
   │ textdetect.build_textmap (RapidOCR DBNet text + Canny "chrome", sampled)
   ▼                 │
TextMap (textmap.json + .busy.npz)
   │                 │
   ▼                 ▼
scheduler.schedule(seed, type, lines) ──> timeline.json (events, unplaced_lines)
   │
   ▼
track.build_track (per-frame layer channels, matrices, ink/bubble boxes) ──> track.json
   │
   ▼
draw.Painter (SVG per frame -> resvg RGBA) ──> SHA-256 of raw frames
   │
   ▼
video.OverlayWriter ──> overlay.webm (VP9 yuva420p) + overlay.mov (ProRes 4444)
   │
   ▼
video.composite ──> composite.mp4 (input audio copied)
   │
   ▼
render.run_check ──> check.json / check.md   (then debug.mp4, manifest.json)
   │
   ▼
jm review ──> index.html beside the outputs
```

- `spec.py` loads and validates the JSON (ascending keyframe offsets, positive durations, budgets naming real moves, `idle_odds` summing to 1, required per-type keys) and samples it with Web Animations semantics: the move's effect easing maps overall progress first, then each channel interpolates between the keyframes that define it, eased by the starting keyframe's segment easing. Segment `cubic-bezier` easings may overshoot, which is where pop-in and the talk stretch bounce. Opacity is clamped to 0..1; length channels scale with the mascot.
- `geometry.py` reproduces the v6 box model (mascot box, art layer, shadow, puff, z's), CSS `translate rotate scale` about an origin as 3x3 matrices, and bubble layout (wrapping with Inter advance widths). The scale factor is mascot height over the reference height; the default mascot height is 10% of the frame height or `--mascot-height`.
- `textmap.py` holds boxes per sample time on a 4px cell grid with one integral image per sample, so free/cost queries over many candidate boxes are vectorised. `textdetect.py` samples every `--sample-interval` seconds within each scene (starting one frame after each cut, plus one sample near each scene's end), runs DBNet detection only (no recognition), and turns dense Canny edge regions not covered by text into "chrome" boxes. The edge-density grid is also the "busyness" cost that makes Jiro prefer flat areas.
- `scheduler.py` walks scenes with one seeded `random.Random`. Arrivals are `pop_in` (always first, once), `relocate`, or `edge_peek` followed by `fly_in` and `peek_landing_hop`, each landing with a `dust_puff` and `landing_squash`. Spot choice runs over a 4px grid of candidates outside the centre band (landscape only) and edge margin, keeps only those whose footprint stays free for the arrival plus minimum stay (and, with a pending line, whose bubble also fits and is free), then scores them by busyness, a small random term and distance from the previous spot. Rest time plans lines, small moves (`side_scoot`/`small_hop`) and alternating glance/expression beats, respecting per-scene and per-minute caps and spacing. When text is about to reach his spot he relocates within the scene if possible, otherwise hides and returns in a later scene.
- `track.py` evaluates the timeline per frame into the v6 layer nesting (aside > bob > drift > tilt > squash > hop > art, plus shadow, puff, z's and bubble), recording channels per layer, composed matrices, and ink and bubble boxes. `draw.py` builds a small SVG cropped to those boxes per frame and pastes the resvg raster into a transparent frame.
- `check.py` gathers three kinds of evidence: the timeline (counts per scene and per minute, spacing, rest before relocate, single pop-in, peek sequence, squash and puff per landing, line timing, quiet mode, allowed faces), the track (amplitude, duration and curve per move against `spec.sample`, within `tolerances`), and decoded ProRes alpha pixels (text overlap, text clearance padding, edge margin, and `track_matches_pixels`). `track_matches_pixels` fails when ink is drawn outside the tracked boxes, or when nothing is drawn although his whole tracked box is on screen. Tracked boxes bound the art from outside (the tilted art rectangle plus shadow), so a box cut by the frame edge during a peek may hold only empty corners and is not required to show ink. `render.py` appends `overlay_webm_alpha`, which compares WebM alpha against ProRes alpha with a tolerance for VP9's lossy alpha.

### Things to Know

- Never edit `MOTION-SPEC.md` by hand. `jm tables --write spec/MOTION-SPEC.md` regenerates it from the JSON, and a test in `tests/test_spec.py` fails when the committed file and the JSON drift.
- The "free interval" rule in `TextMap.sample_indices` is the core safety invariant: an interval is free only if every sample inside it plus the nearest sample on each side that is in the same scene is clear. Samples never leak across a cut, so what is on screen before a cut never blocks or permits placement after it. Text that appears and disappears between two samples within one scene is invisible to the system; lowering `--sample-interval` is the only mitigation.
- The footprint used for placement is deliberately larger than the body: the body plus the envelope of every rest-time move and hover (including the talk stretch with overshoot), plus the z's and `text_padding`. Bubble reach likewise includes the bubble-pop overshoot and its drop shadow. That is why moves at rest can never be what pushes Jiro onto text.
- The hop layer uses Web Animations replace semantics: when several hop-layer events overlap, only the latest-started one drives the layer (`hop_source` in each frame). The checker measures a hop move only on frames where it is the `hop_source`.
- Cut detection uses its own frame-difference spike detector (64x36 downscale, a change several times larger than its neighbours) instead of ffmpeg `scdet`, which missed two of three cuts between dark UI pages in testing. It finds hard cuts only; dissolves and slow fades need `--cuts`. Auto-detected cuts within 0.3 s of either end are discarded.
- Lines are never invented or shortened. A line that cannot fit (scene too short for the 0.9 s wait, typing, the 2.5 s hold and the talk-stretch release; the type's per-minute line cap pushing it past the scene's end; no clear room for the bubble; or quiet mode reached) lands in `unplaced_lines` with a reason that names which of these applied, is logged as "line not placed", and the skill tells the agent to report it rather than loosen the hold.
- `jm render` and `jm check` exit with status 2 when any rule fails; render still writes every output first. The skill forbids loosening tolerances or the spec to make a render pass.
- `--reuse-textmap` loads `textmap.json` and its `.busy.npz` sidecar from the output directory without checking that the input or cuts match; it is only valid for a rerun of the same footage and cuts. `jm check` on its own also reloads both files from the output directory.
- Relocation in video is an instant vanish from the old spot and a 300 ms fade-in at the new one, with no travel (the old spot is still clear at that moment); only the edge peek's `fly_in` actually travels across the frame, and its whole arc is checked against the text map.
- Tests in `skills/jiro-motion/tests/` use synthetic text maps and small generated videos, so they need no real footage; `test_video.py` exercises the bundled ffmpeg (cut detection and that both overlays keep alpha). Run them with `skills/jiro-motion/scripts/jm test`.

Created and maintained by Nori.
