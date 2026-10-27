# Jiro hero v3 (48s, phone)

> **Current approved hero: v25** (`template25.html`, `jiro-hero-v25-46s-loop-1200x960.mp4`), approved by Martin on 2026-10-27. See [../hero-saved/README.md](../hero-saved/README.md) for files, where it is used, and rebuild steps. `brand/fonts.sh` fetches the fonts the templates need.

Adds: Jiro checks how the team ships and gets corrected, asks before the first PR, pushes back on one big PR, the agent payoff (refund-logic lookup via the map), docs prompt plus a later catch on another agent PR, and a quiet 3 AM fix ending in "...oh nice."

Render: `node build.mjs template3.html index3.html && node render3.mjs --fps=60 --w=1080 --h=1080`. All data is fake.

## v17: senior-engineer cold opens

Both cuts open on Jiro already doing senior work, so the first 3-5 seconds show the job instead of claiming it.

- Phone (`template17p.html`, 36.4s loop): Week 2 cold open. Jiro is mid-review of PR #455, runs the migration on a prod-size copy, finds it locks `orders` for 4 min, refuses to merge, and ships #456. Then "You just hired Jiro." and the Day 1 story (v15, shifted by 4s). The loop swipes back into the cold-open thread.
- No-phone (`template17n.html`, 30s loop): replaces the text-only hook with three close-ups (Jiro typing an idempotency-key fix, the review comment "This double-charges on retry", tests green and ready to merge) under the "You just hired an engineer / a reviewer / Jiro." caption roll. The rest matches v16.

Render one (`p` or `n`): `node build.mjs template17p.html index17p.html && node render17p.mjs --w=1200 --h=960 --fps=60`, then `node render17p.mjs --w=1200 --h=960 --cues=1 && node sfx.mjs` and mux `video.mp4` with `sfx.wav`.

## v18: v16 plus a phone

v16 (30s shot-based cut) with the 8:02 AM beat moved onto a phone: the mobile web app rotates in from the right showing the overnight alert thread and PR #418, you type "…oh nice.", and it rotates out before the loop cuts back to the hook. Lower third: "Same Jiro, on your phone". 31.4s loop.

Render: `node build.mjs template18.html index18.html && node render18.mjs --w=1200 --h=960 --fps=60`, then `node render18.mjs --w=1200 --h=960 --cues=1 && node sfx.mjs` and mux `video.mp4` with `sfx.wav`. Needs `bash brand/fonts.sh` (copied from the making-feature-showcases brand kit) for General Sans.

## v19: from 24s on, everything on a zoomed-in phone

Same as v18 up to 24.3s. From the 4:21 AM alert onward, a single continuous phone shot replaces the alert card, Jiro's-screen fix, and morning shots: the phone rotates in, the camera pans down one "Checkout 500s" thread (alert, traced/test/214-passing rows, Jiro's fix message and draft PR #418, then "…oh nice." at 8:02), and it rotates out. The phone is laid out at native size (720px wide, roughly half visible) instead of being scaled, so text stays sharp; encoded at CRF 12. Render as v18 with `template19.html` / `render19.mjs`.

## v20: "Get it done, Jiro."

v19 with your Day 1 line changed from the cut-off "Do it all in one PR, tests to…" to "Get it done, Jiro." (typed in full, 9.0-9.75s; also the blurred bubble above Jiro's pushback). Render with `template20.html` / `render20.mjs`.

## v21: structure, agent lanes, less code

Rebuilds 4-24s around three claims; the phone ending (24.3s on) is unchanged from v20.

- 5.6s Jiro: "No map, no docs, and your agents keep colliding in payments/. Fix that first?" → "Get it done, Jiro." → Slack and CLI chip in.
- 11.6s Structure and docs: the old folders strike out, the new tree lands, and AGENTS.md writes itself line by line.
- 15.6s Agent lanes: AGENTS.md › Lanes gives Claude Code, Codex, and Gemini one directory each; their tasks run in parallel without crossing.
- 19.8s Less code: PR #412 diff is almost all red with two green lines, +38 −1,412.

Render with `template21.html` / `render21.mjs`.

## v22: Martin's launch edits

v21 with: Jiro's opener now reads "No maps, no docs, and your agents keep double dipping work in payments/." then "Let me fix that first." on its own line; "You" label on the left like Jiro's; your line is "Go for it, Jiro."; Priya's CLI line is "Jiro, but make sure you keep tests in the root folder."; the lanes beat (15.6s) is now an agent control panel where Jiro, as lead, wires four workers on different models (Claude Code · Opus, Codex · GPT, Gemini CLI · Gemini, OpenCode · GLM) into their own folders and they finish in parallel; the PR #412 beat drops the green check and instead bounces and highlights +38 −1,412; the phone leaves with a 3D lift, tilt and arc (with a moving highlight and light motion blur) instead of a flat turn. Still 31.4s at 1200×960.

Render: `node build.mjs template22.html index22.html && OUT=v22-video.mp4 node render22.mjs --w=1200 --h=960 --fps=60`, then `node render22.mjs --w=1200 --h=960 --cues=1 && node sfx.mjs` and mux `v22-video.mp4` with `sfx.wav`. Needs `npm i playwright ffmpeg-static lucide-static @fontsource/ibm-plex-mono @fontsource/inter @fontsource/lato` and `bash brand/fonts.sh`.

## v23: calmer pacing

v22 with the same story, slowed down: `template23.html` maps the v22 story timeline onto a 46.0s real timeline through `KNOTS` (piecewise-linear story↔real pairs). Typing gets the biggest stretch (Jiro's opener ~30 chars/s, "Go for it, Jiro." ~13 chars/s, Priya's CLI line ~27 chars/s, the 4:31 AM fix message ~36 chars/s), and every shot holds roughly 1.3-2x longer so lines can be read before the cut. SFX cues are mapped through the same knots. 46.0s at 1200×960.

Render: `node build.mjs template23.html index23.html && OUT=v23-video.mp4 node render23.mjs --w=1200 --h=960 --fps=60`, then `node render23.mjs --w=1200 --h=960 --cues=1 && node sfx.mjs` and mux `v23-video.mp4` with `sfx.wav`.

## v24: real text instead of blur

v23 with the blurred placeholder lines replaced by sharp, readable ones. In the scan shot (about 4.6-6.8s), two rows land with checks as the file counter runs: "Mapped 9 modules and 41 cross-imports" and "Read 6 months of PRs: 37 touched `payments/`". In the finding shot, Jiro's earlier message is now a dimmed but sharp line: "Read 1,284 files and 6 months of PRs. 3 agent branches edited the same refund code." Still 46.0s. Render as v23 with `template24.html` / `render24.mjs`.

## v25: new Jiro art, Beauty-corp, moodboard moves

v24 with:
- Mascot: Maddy's `jiro-working_V4.png` (kept as `jiro-working_V4-source.png`) replaces the pixel bubble everywhere. `jiro-v4.png` is the keyed-out avatar (256px); `jiro-v4-body.png` is the same art with the face painted out (720px), and the face is redrawn as an inline SVG on the source art's 25px pixel grid so it can animate.
- Repo name `acme/shop` is now `beauty-corp/shop`.
- Moves from the scroll-buddy moodboards (jiro.bot PR #22, `prototypes/scroll-buddy/moodboard/`, Martin's picks A2, A4, C1, C3, C5): in the hook Jiro pops in, thinks with dots, glances down at the rolling words, then does an eager double-hop on "Jiro." with a blinking cursor; throughout he idles with the game-style hover (bob, tilt, squash, shrinking shadow). In the agent panel the lead Jiro shows thinking dots while "Splitting work…", then glances toward the workers.
- Mascots on dark panels get a thin light rim (`.on-dark`) so the dark green outline stays visible.

Render as v23 with `template25.html` / `render25.mjs`.
