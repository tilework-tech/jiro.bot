# Demo4 recreation guide

## 1. Identity and exact scope

This is the sketch-led Jiro.bot sushi conveyor, selected as review item 4. Its source is `scroll-sketch-belt` commit `6dfaa7a8e9af6c45f0311ae9e218ba25b861e00e`, PR #4. It includes the September 30 crisp hero redraw. The Slack thread and original reference sketch are:

https://tilework-tech.slack.com/archives/C0BGDN7PK3K/p1790717424131459?thread_ts=1790717424.131459&cid=C0BGDN7PK3K
https://tilework-tech.slack.com/files/U0ASASJJFAL/F0C69GRJ4BA/untitled-2026-09-28-1940-2.png

The committed sketch is `art/src/sketch.jpg`. The initial brief in `BIBLE.md` is historical and describes features later removed. `FEEDBACK-LOG.md`, this guide, and then the code represent the saved version. Keep the source files and final raster assets together. Generating similar images will not recreate identical pixels.

## 2. Run it exactly

Use Node 22 from the repository root:

```bash
cd demo4/restaurant
npm ci
npm run build
npm run dev
```

Open `http://localhost:3000/`. `npm run build` runs `tsc --noEmit` and Vite, using pinned dependencies from `package-lock.json`. The Vite config uses `base: "./"` and allows the preview host. No API key or external generation call is needed to run the saved site. `public/` contains all served media. The comparison videos in `public/ui/compare/` are the only MP4 files needed for this demo; the hero is now code-animated pixel art, not a video.

## 3. Program map

| Path | Responsibility |
|---|---|
| `src/main.ts` | Registers seven scenes, six transitions, keyboard secrets, and other global interactions. |
| `src/engine/stage.ts` | Creates the fixed stage and DOM layers, maps scrolling to segments, draws every frame, handles plate clicks, navigation, sound, and deep links. |
| `src/engine/types.ts` | Scene contracts and canonical stage, belt, plate, and ambient loop constants. |
| `src/engine/belt.ts` | Resamples the belt path, draws moving slats and rails, places plates, and preserves forward motion. |
| `src/engine/items.ts` | Weighted plate items, fixed identity, image loading, and spoken reactions. |
| `src/engine/eggs.ts`, `sfx.ts`, `fx.ts`, `dom.ts` | Discovery state, synthesised sound, ambient drawing helpers, and scene DOM helpers. |
| `src/scenes/*.ts` and `*.css` | Pixel-art rooms, ambient animation, hotspots, and each section's layout. |
| `src/transitions/*.ts` | Six camera and belt journeys through the building and out to the pond. |
| `src/content/*.ts` | Hero, FAQ, pricing, product tour, side-by-side video comparison, and comparison table. |
| `src/games/flappy.ts` | Optional Flappy Koi game in the pond. The older whack and snake games were removed from the flow. |
| `src/chrome.ts`, `src/style.css` | Global header, navigation rail, toasts, copy, and responsive rules. |
| `src/scenes/bar/build_art.py` | Rebuilds the final hero art and sprite atlas from the saved raw still. |

The code is the precise specification for geometry, curves, drawing order, hit areas, easing, captions, and animation phases. The documents explain how those parts fit together; they do not replace the code.

## 4. Geometry, scrolling, and the conveyor

The canvas is 1920 by 1080 stage pixels. `stage.ts` fits it into the viewport, with at most 12 percent crop to avoid letterboxing on typical screens. Each scene has a hold length measured in viewport heights. Each transition adds its own scroll length. The page's scroll height is `(sum of all segment lengths + 1) * 100vh`.

`stage.ts` eases the visible scroll position toward the target by 18 percent of the remaining distance each animation frame. It finds the active segment and draws its scene or transition into the canvas, then shows the corresponding DOM overlay. Outgoing copy fades within the first 4 percent of a transition; incoming copy appears over the last 20 percent. Scene IDs become URL hashes and right-rail locations.

The belt runs in the same forward direction whether the visitor scrolls down, scrolls up, or pauses. In `types.ts`, `BELT_SPEED = 12` stage pixels per second, `PLATE_GAP = 72`, and `LOOP = 24` seconds. In `stage.ts`, every viewport height of scroll travel adds `SCROLL_PUSH = 18` seconds of belt travel. In `belt.ts`, `beltTime(now) = now + boost`. Scroll movement adds `abs(shown - before) * SCROLL_PUSH` to the boost, so it can never reverse the belt. The path is sampled at no more than 6 stage pixels between samples; cumulative path distance is divided by local scale to keep the world speed consistent when a lane narrows in perspective. Slats are spaced 26 world units apart. Each plate gets a stable item and rim from its index, path key, and the item selection data.

A belt path is an ordered list of `[x, y, scale]` control points. Each scene owns its visible section; a transition joins exit and entry ports, maintains the phase, and hides item swaps under a wall, hatch, or floor. The hero belt is fitted to the painted trough and passes through the bar-to-office transition. It is not a separate looping picture. `src/scenes/bar/art.json` stores the measured hero centerline, perspective width, trough bands, wall sill, occluding post, and sprite atlas coordinates. The path begins in the kitchen opening, comes down toward the viewer, and continues into the floor. `bar-office/world.ts` carries the same plates onto the office lift.

## 5. Scene and transition order

The precise segment starts and lengths captured from the running build are in `reference/capture.json`. Each reference JPEG shows a scene hold or transition at its midpoint. The order is:

| Segment | Hold or travel | Saved experience and source |
|---|---:|---|
| `bar` | 1.2 vh | Full-width sushi bar hero. Crisp 3 pixel grid, darker left copy area, Jiro cutting sushi, moving plates, subtle customer and lantern motion. `scenes/bar.ts` and `scenes/bar.css`. |
| `bar>office` | 1.5 vh | Diagonal hero trough enters the floor, passes the soot sprite crawlspace, and becomes the office sushi lift. `transitions/bar-office.ts`, `bar-office/world.ts`. |
| `office` | 1.6 vh | Quiet back office with larger waist-up Jiro at a computer and dominant clickable Nori product tour. Straight left-side belt. `scenes/office.ts`, `content/product.ts`. |
| `office>dining` | 1.6 vh | Straight downward travel through floor collar, crawlspace, ceiling cat, and dining corner post. `transitions/office-dining.ts`. |
| `dining` | 1.6 vh | Happy customers at tables, no Jiro; two large recorded windows compare a generic agent and Jiro. `scenes/dining.ts`, `content/compare.ts`. |
| `dining>kitchen` | 1.4 vh | Right-lane belt through a floor hatch and wooden shaft, past a tiny sushi bar, into the kitchen ceiling hatch. `transitions/dining-kitchen.ts`. |
| `kitchen` | 1.6 vh | Factual "How Jiro compares" order board over kitchen art, with Jiro off to the side. `scenes/kitchen.ts`, `content/table.ts`. |
| `kitchen>storage` | 1.4 vh | Steel lift through a riveted floor sleeve and the soot sprites' flat to the storage ceiling hatch. `transitions/kitchen-storage.ts`. |
| `storage` | 1.6 vh | Five small sushi on an angled wooden counter in subdued light. Click a question for Jiro's answer bubble. `scenes/storage.ts`. |
| `storage>street` | 1.4 vh | Down through a storage trapdoor, past a tanuki, and out a cat flap to the rainy street. `transitions/storage-street.ts`. |
| `street` | 1.6 vh | Night delivery bicycle scene and pricing. Slow rain, neon, puddles, and a straight belt beside the street. `scenes/street.ts`. |
| `street>pond` | 1.4 vh | Storm drain and brick shaft lead into the garden culvert. `transitions/street-pond.ts`. |
| `pond` | 1.8 vh | Moonlit koi pond. No Jiro on the bridge. Moving belt, restrained ripples, small fish, lily pads, fireflies, and intermittent koi catching plates. Optional Flappy Koi game. `scenes/pond.ts`. |

The six transition source files have more exact camera paths and occlusion values than this summary. Their adjacent Markdown notes explain the intended route and art preparation. Each transition begins by drawing its source scene at `t=0` and ends at its destination scene at `t=1`.

## 6. Hero art and animation

The latest hero is saved as `src/scenes/bar/source.png`, `public/art/bar/room.png`, `public/art/bar/sprites.png`, and `src/scenes/bar/art.json`. The original raw still is 2752 by 1536. `src/scenes/bar/build_art.py` reduces it to a native 640 by 360 pixel grid, paints a calmer dark left area, quantizes the palette, repaints a straight belt trough, and extracts a sprite atlas. It scales that grid three times with nearest-neighbor pixels to 1920 by 1080. The script needs Python, Pillow, and NumPy only when regenerating the derived art. The committed derived files are the exact version and need no rebuild to serve.

`src/scenes/bar.ts` animates eyes, a knife stroke, lanterns, rising steam, two customers, curtains, the wall cat, slat seams, and belt plates. Most changes are one or two native art pixels. Ambient periods divide the 24-second loop. The plate and slat clock uses the shared belt clock, so it keeps moving when scrolling stops. `art.json` is authoritative for the belt's fitted line and atlas coordinates. The previous blurry hero MP4 was intentionally removed in this version.

## 7. Content and interaction data

The Nori product tour is `public/ui/product/states.json` plus its captured PNG screens. `content/product.ts` presents its hotspots as an interactive ten-screen sequence, with guided hints, back navigation, and a visit counter. It uses fake data in captures. The dining comparison is `public/ui/compare/compare.json` with `generic.mp4`, `jiro.mp4`, and poster stills. Each side can expand; Escape or a backdrop click closes it. The recordings pause when the room is hidden.

`content/copy.ts` is the exact hero text, comparison table data, FAQ answers, pricing tiers, and outbound links. The kitchen table labels Devin, Factory, and Cursor Cloud are draft copy and require fact checking before publication. The street has four pricing cards. The storage counter's five answers are clickable. Those facts and prices are a saved draft, not a claim that they are currently accurate.

Plate clicks, room hotspots, rail buttons, keyboard arrows, PageUp, PageDown, Home, End, and digits 1 to 7 all have defined behavior. The hidden Konami sequence, typing `omakase` or `sudo`, five rapid logo clicks, tab-away return, and `jiro.hire()` in the console are registered in `main.ts`. The egg counter and found state are in `engine/eggs.ts`. Audio is synthesized by `engine/sfx.ts`, controlled by the header button. The optional pond game is in `games/flappy.ts`.

## 8. Reference and asset verification

`reference/` has thirteen JPEGs: one for every scene and one at every transition midpoint. Each was captured in Chromium at 1600 by 900 with `?seg=<id>&tt=0.5&t=5`, and `reference/capture.json` stores the exact IDs, starts, lengths, and settings. Captures showed no page errors. Use these URLs to inspect deterministic frames:

```text
http://localhost:3000/?seg=bar&t=5
http://localhost:3000/?seg=bar%3Eoffice&tt=0.5&t=5
http://localhost:3000/?seg=pond&t=5
```

`?t=` deliberately freezes the canvas clock. Use `?v=<timestamp>` to bust browser cache when sharing a live animation link. `?p=<viewport-height position>` and `#<scene id>` are other supported navigation helpers.

`docs/ASSETS.md` lists every saved image, video, font, and reference frame with byte size and SHA-256. Recreate or verify it with `python3 tools/asset_manifest.py` or `python3 tools/asset_manifest.py --check`. If all hashes match, the binary inputs are the same even if the upstream image model cannot reproduce them.

## 9. What was verified and what remains

The snapshot passed `npm ci` and `npm run build`. Every scene and transition midpoint rendered in Chromium with no page errors, and reference frames were saved. This verifies the local build and static compositions. It does not establish smoothness for all transition frames, interaction quality on touch devices, or Safari performance on Martin's Mac.

The delivery bike scene was not reanimated from Martin's requested motorcycle reference because that recording was not found in the thread or repository. The two comparison windows were enlarged by about 45 percent in area, short of 50 percent in width because both would not fit between the belt lanes. The crisp hero is a newer replacement for the earlier video hero. Keep these as explicit constraints when continuing the work.

For future changes, start from this branch. Preserve the checked-in binaries, record any deliberate visual change as a new reference frame, rerun the build and manifest check, then verify the full scroll in the intended browser. Do not overwrite Demo1 or Demo2.

## Preservation audit addendum (2026-09-30)

A new continuous walkthrough and five-position samples of every transition are now saved in `preservation/evidence/demo4/` at repository root. The [preservation runbook](../../../../preservation/README.md) describes ready-built archives with local fonts, integrity checks and the network-blocked capture method. The original references and app source are unchanged. This addendum supersedes any earlier statement that no full-scroll recording is available.
