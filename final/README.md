# Jiro.bot final review package

> **Superseded:** the active build is now `v2/`. It is a 16-bit pixel-art rebuild from Martin's 2026-10-01 brief, and it is at review gate A. Start with `v2/README.md`. Everything below describes PR #13's `site/`, which stays in the tree because v2 reuses its copy, games and research.

This folder assembles the seven-stop restaurant experience from the archived demos, the ten Slack video references and Martin's later design direction. `site/` is the implementation. `DESIGN-BRIEF.md` is the visual specification; `MASTER-PROMPT.md` is the detailed end-to-end production prompt. `research/` contains the ten half-second observation logs, source manifest, current product facts and the two game rules. `reference/` contains playable review copies of the videos and 0.5-second contact sheets. The untouched demos remain one level above this folder.

## Reconstruction

1. Read `DESIGN-BRIEF.md`, `MASTER-PROMPT.md` and `research/SOURCES.md`.
2. Read the matching `research/video-NN.md` beside any reference `reference/videos/video-NN.mp4` or contact sheet `reference/contact/video-NN.jpg`. The first contact tile is 0.0 seconds, and subsequent tiles step by 0.5 seconds in row-major order.
3. Read `research/GAMES-SOURCE.md` for the canonical Sushi Rush and Daily Roll rules. The game source is bundled under `site/public/games/`, copied from `games/sushi-rush-daily-roll` at `26dcd572470eed8e235926a2efeef7ff370a290a`.
4. Read `research/PRODUCT-FACTS.md` and `site/docs/CONTENT-SOURCES.md` before editing product copy.
5. In `site/`, run `npm ci`, `npm run build`, then `PORT=3201 node serve.mjs`. The static server provides byte ranges for Safari video playback. Use `/games/arcade/` to inspect the standalone game source.

## Reference map

| Stop | Primary video evidence | Main implementation source |
| --- | --- | --- |
| Hero and first passage | 01, 08, 09 | `site/src/main.ts`, `site/src/belt.ts` |
| Product demo | 02, 09 | `site/src/content.ts`, `site/src/main.ts` |
| Good/bad comparison | 05 | `site/src/content.ts` |
| Comparison table and passage | 07 | `site/src/content.ts`, `site/src/main.ts` |
| FAQ | 07 | `site/src/content.ts`, `site/src/main.ts` |
| Pricing and rain | 03, 10 | `site/src/content.ts`, `site/public/v/s6-delivery.mp4` |
| Pond and koi | 04, 06 | `site/src/belt.ts`, `site/public/v/e1-pond.mp4` |

Video 06 demonstrates the straight street-to-pond scroll. Video 09 demonstrates the straight hero-to-product scroll. Video 10 informs rain and motion only; it does not show a belt or restaurant scene. The art and text in the videos sometimes reflect earlier choices; the latest written brief governs the final implementation.

## Review status

The build, desktop and mobile browser evidence, interaction checks, full-scroll clip and limitations are documented in `review/README.md`. This review package is a development branch, not a production release.
