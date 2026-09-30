# Jiro.bot preserved website demos

These directories freeze distinct website experiences for review and exact reconstruction. They are source snapshots, not production deployments. Keep each demo's code, final media, documentation, and reference captures together.

Open the [four-tab review gallery](showcase/README.md) to click through the saved experiences on one page. Demo3 was removed because it duplicated Demo1; the remaining demos retain their numbers.

| Demo | September 30 review item | Experience | Run from this repository root | Status |
|---|---:|---|---|---|
| [Demo1](demo1/README.md) | 2 | Seven-stop 3D scroll with a procedural koi ending | `cd demo1/site && npm ci && npm run build && node serve.mjs` | Existing approved snapshot, unchanged here. |
| [Demo2](demo2/README.md) | 1 | Eight-room 2D restaurant tour with a conveyor and koi finale | `cd demo2/restaurant && npm ci && npm run build && npm run dev` | Preserved from `restaurant-belt` commit `ae63ce88e83b7f1df1475c4010b219f26f0e7746`. |
| [Demo4](demo4/README.md) | 4 | Sketch-led 2D conveyor with a crisp animated pixel-art hero | `cd demo4/restaurant && npm ci && npm run build && npm run dev` | Preserved from `scroll-sketch-belt` commit `6dfaa7a8e9af6c45f0311ae9e218ba25b861e00e`. |
| [Demo5](demo5/README.md) | September 30 master prompt | Seven-scene 2D one-belt scroller (v4) | `cd demo5/site && npm ci && npm run build && PORT=4173 node serve.mjs` | Preserved from `jiro-scroller-v4` commit `aed728a3d43618c7bcd274c149d0722a7c644f2b`, PR #11. |

The Demo1 comparison used every blob under `demo1/site/` in the `demo1-folder` snapshot and `scroll-flow/site/` in the latest `scroll-flow-3d` branch. Each tree had 64 files, and every corresponding Git blob ID matched. Documentation or other branch files may differ, but the website source and assets are identical.

## Reconstruction material

Demo2 and Demo4 each contain a `restaurant/docs/RECREATE.md` guide, an `ASSETS.md` manifest with SHA-256 hashes, `restaurant/reference/` frames for every scene and transition, and the complete source and final assets. Demo2 retains its detailed original history, engine, scene, transition, moodboard, art, and tooling guides. Demo4 adds Martin's source-linked verbatim feedback and an art provenance note. The saved binaries are the exact visual inputs; generating new art is unnecessary for reproduction.

The source branch and exact commit are recorded in each demo's README. Continue work on a copy of a selected demo, and preserve the original snapshot for comparison.

Demo5 includes the original brief, feedback, content sources, QA scripts, full-scroll recording, scene stills, and exact runtime media in `demo5/site/`. Its provenance and checksum verification are documented in `demo5/README.md`.
