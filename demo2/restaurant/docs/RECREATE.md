# Demo2 recreation guide

## Identity and provenance

Demo2 is the eight-room Jiro restaurant tour that appeared as review item 1 in the September 30 review library. It is frozen from `restaurant-belt` commit `ae63ce88e83b7f1df1475c4010b219f26f0e7746`, PR #6, and its Slack thread:

https://tilework-tech.slack.com/archives/C0BGDN7PK3K/p1790711218641069?thread_ts=1790711218.641069&cid=C0BGDN7PK3K

This demo is distinct from Demo1. It uses a 2D canvas scene engine and a pixel-art restaurant with eight holds and seven transitions. Demo1 is a Three.js camera journey through seven video panels. The original version is preserved in this branch; the documentation and reference captures are additions.

## Exact local build

From the repository root, use Node 22:

```bash
cd demo2/restaurant
npm ci
npm run build
npm run dev
```

Open `http://localhost:3000/`. `npm run build` runs TypeScript checking and creates `dist/`. The committed `package-lock.json` pins the install. The served art, product captures, two comparison recordings, game sprites, hero art, and koi art are in `public/`. The original or intermediate art and scripts are in `art/`, `pipeline/`, and `tools/`. No model generation or API key is needed to run the snapshot.

## Read these source documents in order

1. `00-history.md`: Martin's exact feedback, changes made, retained rules, and scene order.
2. `01-engine.md`: 1920 by 1080 canvas, segment mapping, belt and plate maths, drawing order, input, site chrome, and debug URL parameters.
3. `02-scenes-bar-to-kitchen.md`: bar, office, dining, and kitchen.
4. `03-scenes-storage-to-pond-and-games.md`: storage, pantry, delivery street, pond, games, and item catalogue.
5. `04-transitions.md`: all seven transitions, timing, camera moves, and wall crossings.
6. `05-moodboard.md`: ten optional visual directions and the shared viewer.
7. `06-art-and-tooling.md`: source art, animation, prompts, product and comparison captures, exact tools, and known limits.
8. `ASSETS.md`: checksums for every saved binary asset and reference frame.

The source code is the authority if any description differs. The product comparison and pricing copy are draft marketing content, not validated product facts.

## Ground truth captures

`../reference/` contains one JPEG per scene and one per transition midpoint. All were captured in Chromium at 1600 by 900 with `?seg=<segment>&tt=0.5&t=5`, then inspected for page errors. `capture.json` contains the exact segment IDs, scroll starts and lengths, viewport, and capture settings. The two comparison recordings may show a later frame in a running browser; the screenshot fixes the engine clock, not the media elements' decode clocks.

Recreate a frame at any stop with a URL such as:

```text
http://localhost:3000/?seg=bar&t=5
http://localhost:3000/?seg=bar%3Eoffice&tt=0.5&t=5
```

Use `?v=<timestamp>` when sharing a cache-busted, freely animated preview. `?t=` intentionally freezes engine time for still captures and must not be used for a live review link.

## Verification

```bash
npm ci
npm run build
python3 tools/asset_manifest.py --check
```

Then open the site, move through each of the eight rooms, and compare with `reference/scene-*.jpg` and `reference/transition-*.jpg`. The references prove static composition at one point in time; they do not prove a video loop, a smooth transition at every intermediate frame, touch behavior, or Safari playback. The existing QA scripts and detailed tool recipes in `06-art-and-tooling.md` cover those checks.

## Known limits in this snapshot

- Martin later said this was not the specific remembered scroll animation with the koi eating sushi. He still selected it as a demo worth preserving.
- No separate full-scroll recording was located for this branch. The scene and transition source, hero art, koi art, and still references are saved.
- This branch includes the original product facts and visuals of the draft. Review current facts before any public launch.
- The site's eight-room structure and hover or click interactions should be tested on the target device before release. This preservation task checked a local Chromium build and all saved reference frames, not Safari on Martin's Mac.

## Preservation audit addendum (2026-09-30)

A new continuous walkthrough and five-position samples of every transition are now saved in `preservation/evidence/demo2/` at repository root. The [preservation runbook](../../../../preservation/README.md) describes ready-built archives with local fonts, integrity checks and the network-blocked capture method. The original references and app source are unchanged. This addendum supersedes any earlier statement that no full-scroll recording is available.
