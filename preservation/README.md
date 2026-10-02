# Preserve and replay the Jiro scroll demos

This directory makes Demos **1, 2, 4 and 5** recoverable after the session ends. Demo3 was a duplicate and is excluded. The repository, not a session preview URL or a model prompt, is the durable record. All application source, final media, copy, geometry, transitions and interaction logic are committed with the four demos. Do not regenerate the images or ask an agent to approximate the site from screenshots.

## Fastest exact restoration: no npm, no font provider

Clone the `demo5` review branch of `tilework-tech/jiro.bot`, or check out its recorded commit, then run from repository root:

```bash
python3 preservation/tools/verify.py
python3 preservation/tools/restore.py
JIRO_PRESERVED_ROOT=preservation/.playback PORT=3200 node showcase/serve.mjs
```

Open `http://localhost:3200/#demo5` (or `#demo1`, `#demo2`, `#demo4`). Python 3 and Node 22 are sufficient for this playback path. The session's URL is temporary; the GitHub files and these commands survive it. Run the server with your environment's normal background-process mechanism when appropriate.

`builds/demo{1,2,4,5}.tar.gz` contains ready-built HTML/JS/CSS plus all served assets and locally captured fonts. `restore.py` checks both archive hashes and every extracted file before reporting success. It does not run npm, call an image model, or access a network service. Outbound CTA/privacy links still point to their original destinations, and are not required to render the demos.

These archives were built from the saved source with Node 22.20.0, Vite 6.4.3 and each demo's committed package lock. The only presentation dependency substitution is replacing Google Fonts stylesheet requests with local copies of the CSS and font bytes resolved during this audit. This preserves the requested families/weights/subsets without future network dependence. Original demo source files are unchanged. `fonts/sources.json` records exact URLs and hashes; licenses accompany the fonts.

## What is preserved, scene by scene

| Demo | Implemented experience | Exact reconstruction guide | Original visual evidence | Additional audit evidence |
|---|---|---|---|---|
| [1](../demo1/README.md) | Seven 3D video-card stops; six camera journeys, conveyor, doors, parallax, plate reactions and koi | [Full geometry, motion and interaction spec](../demo1/docs/RECREATE.md), `demo1/site/src/` | [Walkthrough](../demo1/reference/walkthrough.mp4), `demo1/reference/stops/`, overview sheets | `evidence/demo1/`: contact sheet of the original walkthrough. New browser used the fallback reel because WebGL was unavailable; no new 3D render claim. |
| [2](../demo2/README.md) | Eight rooms, seven transitions, original restaurant tour and games | [Reconstruction entry point](../demo2/restaurant/docs/RECREATE.md), detailed `00`–`06` guides, `restaurant/src/` | Every scene and transition midpoint in `demo2/restaurant/reference/` | [New walkthrough](evidence/demo2/walkthrough.mp4), eight scene stills and five progress samples for each of seven transitions |
| [4](../demo4/README.md) | Seven rooms, six transitions, crisp code-animated hero, sketch-led belt and koi | [Detailed spec](../demo4/restaurant/docs/RECREATE.md), adjacent transition notes, `restaurant/src/` | Every scene and transition midpoint in `demo4/restaurant/reference/` | [New walkthrough](evidence/demo4/walkthrough.mp4), seven scene stills and five progress samples for each of six transitions |
| [5](../demo5/README.md) | Seven full-screen scenes, six half-screen passages, one 2D belt, product demo, FAQ, pricing and koi | [Detailed new spec](../demo5/RECREATE.md), `demo5/site/src/` | [Original walkthrough](../demo5/site/reference/full-scroll.mp4), scene/passage and interaction stills | Seven scene stills and five camera positions around each passage; geometry/positions in `evidence/audit.json` |

The exact room order, segment lengths and source file maps are in each guide. Demo2/4's original `reference/capture.json` files record segment IDs, starts and lengths. Demo5's new guide specifies its scene anchors, six wall styles, path shape, belt speed, snapping thresholds, clocks, hotspots, drop zones and koi behavior. All demos retain their prompts, feedback and asset provenance where those were saved by their original builders.

Final runtime media are authoritative. Intermediate generative recipes sometimes mention earlier workstation paths or unavailable original runs; those are historical notes, not dependencies of playback. The complete committed final images/videos remove any need to recover a model's past output.

## Integrity and inventory

- `SHA256SUMS` covers all tracked files under the four demos, gallery and preservation kit except itself. Run `python3 preservation/tools/verify.py` from any working directory.
- `builds/manifest.json` additionally records archive hashes and the hashes of every ready-built file.
- Each original demo's asset manifest remains untouched. Demo5 also has its original `SHA256SUMS` covering its 89 preserved site files.
- `evidence/verification.json` summarizes the preservation checks; `evidence/media.json` inventories video dimensions, frame rates, durations and hashes.
- `evidence/audit.json` records the actual browser version, viewport/DPR, scene/transition screenshot positions, loaded fonts, external requests, failing responses and page errors from this audit.
- `evidence/demo2/recording.json` and `evidence/demo4/recording.json` record scroll sequences, screencast frame counts, timestamps and encoding details. These are continuous scripted traversals of the real saved apps, not a slideshow of the older screenshots. They contain no audio.

## What “to the T” means here

The exact implemented code, content, visual assets and animation formulas can be recovered byte for byte. A ready-built copy removes future build-tool or dependency changes. Every scene and transition has source plus visual reference material, including a full journey for each demo.

A live page is not a deterministic movie: randomized events, persistent egg/game state, viewport shape, scroll input, video playheads and browser/OS/GPU text rendering can change a particular screenshot. Some paths use fixed procedural seeds; others intentionally call `Math.random`. Preserve that behavior rather than silently replacing it with seeded behavior. The saved videos are the exact observed visual sequences, with compression and frame sampling as recorded; they do not capture every possible interaction or every random outcome. Source code preserves those branches.

New stills for Demo2/4 freeze the engine at `t=5` and sample each transition at 10%, 25%, 50%, 75%, 90%; media playheads can still vary. New Demo5 passage stills temporarily suppress scroll-event propagation in the capture tab to prevent snapping out of intermediate positions. That capture-only intervention does not modify the app. Original freely scrolling Demo5 video remains the movement reference.

The present Chrome environment cannot render Demo1's WebGL path. Its fallback was reachable with external network blocked, and original 3D code and original walkthrough are preserved; use a WebGL2-capable browser to assess the 3D runtime. Historical Safari claims in original docs are prior-agent reports, not newly reproduced results. Safari/real-phone testing remains outstanding for the other demos. Unimplemented requests (for example, the missing motorcycle reference and unapproved new minigames) remain documented gaps, not completed features.

## Rebuild or continue deliberately

To rebuild from source, run `npm ci && npm run build` in each of `demo1/site`, `demo2/restaurant`, `demo4/restaurant`, `demo5/site`, sequentially. Original source builds still use their original Google Fonts URLs; the archived playback path is the network-independent reference. Do not upgrade dependencies or regenerate assets as part of reproduction.

To prepare a deliberately updated archival build, use `python3 preservation/tools/package.py` after building. It reuses the committed font snapshot. `vendor-fonts.py` is an explicit maintenance command that downloads today's fonts and replaces the snapshot; **do not run it during restoration**.

To reproduce the additional captures, `npm ci --prefix preservation` installs only the pinned Playwright library. Connect `tools/capture.mjs` / `tools/record.mjs` to the existing headed browser's CDP endpoint (`CDP`, default `http://127.0.0.1:9222`) with the preserved server on `BASE` (default `http://127.0.0.1:3201`). `record.mjs` also needs an `FFMPEG` binary; the original run used imageio-ffmpeg 0.6.0's FFmpeg 7.0.2, libx264, one encoding thread. No browser executable is bundled. New recordings describe that new run; retain the originals as the reference.

Continue work on a new branch. When appearance changes intentionally, name it as a new version, regenerate the relevant evidence, and record new hashes rather than overwriting the historical reference without explanation.
