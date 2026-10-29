# Hero carousel videos

These are the sources of the three jiro.bot hero carousel videos. Each one shows Jiro working across interfaces on fake data:

| Scene | Story | Interfaces |
|---|---|---|
| `oncall` | At 3:40 PM Dana sets up on-call with one Slack prompt. At 4:12 AM an alert fires, and Jiro's terminal traces it, tests and fixes it. At 4:31 AM PR #418 explains what happened, and at 8:02 AM Dana approves. | Slack, terminal, PR page |
| `multiplayer` | Priya builds with Jiro in desktop Slack and tags @Kira. Kira asks for a change from Slack on her phone. Sam adds a test from the CLI on a laptop. The same session runs throughout, and the camera tours the three devices. | Slack desktop, Slack mobile, CLI |
| `rbac` | In one #incidents thread, Rae (ops admin) gets a root cause from `@jiro-ops`. Jordan (no ops access) gets the product's refusal, and then Rae gets the fix PR. | Slack |

The RBAC story is an anonymised version of a real internal incident thread. The refusal is the broker's real string (`sessions/broker/server/src/core-services/agents/agent-access.ts`). The multiplayer CLI mirror (`Sam · via CLI` + quote) follows `surface-engine/observed-turn-copy.ts`. Everything else is invented: names, the Sable workspace, messages, PR numbers, terminal output and the `nori cloud` screen.

## Outputs (`site/video/carousel/`)

| File | Size | Notes |
|---|---|---|
| `{scene}-desktop.mp4` | 1200×960 (5:4) | Shown at up to 560 CSS px wide. Framed about 1.15–1.2× tight, so text stays readable |
| `{scene}-mobile.mp4` | 720×900 (4:5) | Each interface re-laid narrower (Slack collapses to its icon rail) and framed tighter |
| `{scene}-poster.jpg` | 1080×1080 | Frame 0 in the mobile layout, kept inside the central 864×864, which survives a cover crop to both 5:4 and 4:5 |

The videos are muted H.264 (yuv420p, no audio track, faststart) at 30 fps. Each story ends by folding back to its opening frame, so the loop has no seam. `tests/test_carousel_videos.py` checks this contract.

## How it works

The pipeline is the v25 hero's (jiro.bot PR #20, branch `video/hero-loop-v1`, folder `video/hero-loop-v3/`). Each scene is an HTML page whose every visual is a pure function of time `t`. Playwright seeks it frame by frame and pipes JPEGs to `ffmpeg-static`.

| Path | What it is |
|---|---|
| `scenes/*.html` | One page per story: the timeline constants at the top of the script, the interfaces in the markup, and per-cut layout under `.cut-mobile` |
| `lib/core.js` | Cuts and sizes (`?cut=desktop|mobile|poster`), easing, typing, the message `grow` (a slot opens, then the message fades in), the camera (`fit`, `camera`) and the `scene()` seek API |
| `lib/stage.css` | The mocked interfaces: Slack desktop and mobile, terminal, laptop, monitor, phone, PR page, and the chips |
| `build.mjs` | Inlines lucide icons (`{{i:name}}`) and the Slack mark (`{{slack}}`) into `built/` |
| `render.mjs` | Renders one scene and cut: master (`out/`), web encode and poster (`site/video/carousel/`), or stills with `--times` |
| `render-all.sh` | Every scene and cut, plus the posters |
| `storyboard.sh` | Key-frame sheets in `storyboard/`, for review before a full render |
| `brand/jiro-v4.png` | Maddy's mascot avatar from v25 |

Pacing rules: typing runs at 15 characters per second, and scene changes dip through the stage colour (0.7 s out, 0.8 s in) or are slow camera moves between devices (1.8 s). There are no hard cuts. Multiplayer and RBAC use the hero box colour `#2a2f35` for their stage.

### On-call presentation

[The on-call scene](scenes/oncall.html) keeps its stage, Slack chrome, terminal and PR page light throughout the 33-second loop: a near-white `#f2f4f8` stage and chrome surround white interface surfaces. The overnight beat reads through the times and messages, without a dark-mode transition. These overrides live in the scene itself; the shared styles and the multiplayer and RBAC scenes are unchanged.

Each interface window owns a small time badge pinned to its top-right, inset 7 px from the top and 12 px from the right in scene coordinates. The white pill has a 1 px `#c1c7cd` border, fully rounded corners, a subtle shadow and dark semibold text. It contains only the time, with no icon or subtitle, and fades with its window. Slack shows **3:40 PM**, the terminal **4:12 AM**, and the PR page **4:31 AM**, changing to **8:02 AM** when Dana approves. The return to the opening Slack shot restores its **3:40 PM** badge. The story remains set in Sable (`sable/shop`), with the existing beat timing and seamless return to frame zero.

## Rebuild

Node 22. Fonts: Lato and Inter come from `@fontsource`, JetBrains Mono from `site/fonts/`, and the chip font is Helvetica Neue with Nimbus Sans as the Linux fallback.

```sh
cd video/carousel-src
npm install
npx playwright install chromium
(cd ../.. && nohup python3 -m http.server 3011 --bind 127.0.0.1 > /tmp/carousel-http.log 2>&1 &)
./storyboard.sh                                 # review sheets in storyboard/
./render-all.sh                                 # all finals, about 1 minute per cut
node render.mjs --scene=rbac --cut=mobile       # one cut
node render.mjs --scene=rbac --cut=desktop --times=4,18,32   # stills/ only
cd ../../tests && python3 -m unittest test_carousel_videos
```

To change copy or timing, edit the constants at the top of a scene's script (`LINES`, `TYPE`, `MSGS` and the shot times). Message heights are measured after `setup()` fills in the final text, so changing a line never clips it.
