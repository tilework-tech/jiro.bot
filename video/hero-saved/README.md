# Jiro hero video: saved version (2026-10-14)

`jiro-hero-saved-2026-10-14.mp4`: 40.4s seamless loop, 1200x960 (5:4, fits the black hero box in the jiro.bot design), 60fps, SFX only. Saved by Martin's request; this is v11 of the iteration in `../hero-loop-v3/`.

Beats: Day 1 codebase scan, how-you-ship check, findings, Jiro pushes back on one big PR (Slack and CLI weigh in), PR before/after; Day 3 docs prompt; Day 5 catches another agent's PR; automated alert at 4:21 AM fixed by morning. Jiro in #3cf06e, you in #f2694f. All data is fake.

Rebuild: `node build.mjs template.html index11.html && python3 -m http.server 3001 & node render11.mjs --w=1200 --h=960 --fps=60`, then `node render11.mjs --w=1200 --h=960 --cues=1 && node sfx.mjs` and mux.

## Saved 2026-10-16: v17 phone and no-phone

Martin approved both v17 cuts on 2026-10-16. They replace the v11 save above as the current versions:

- Phone: `../hero-loop-v3/jiro-hero-v17-phone-36s-loop-1200x960.mp4` (36.4s loop, Week 2 cold open, then the Day 1 story).
- No-phone: `../hero-loop-v3/jiro-hero-v17-nophone-30s-loop-1200x960.mp4` (30s loop, close-up cold open).

Source and rebuild steps: `../hero-loop-v3/README.md` (v17 section).

## Saved 2026-10-27: v25 (current, approved for launch)

Martin approved v25 on 2026-10-27 as the jiro.bot launch hero. It replaces every earlier save above.

| File | What it is |
|---|---|
| `../hero-loop-v3/jiro-hero-v25-46s-loop-1200x960.mp4` | Master: 46.0s loop, 1200x960, 60fps, with SFX (24.6 MB) |
| `jiro-hero-v25-web-2026-10-27.mp4` | Web encode used on the site: muted, no audio track, H.264 CRF 26, faststart (3.7 MB) |
| `jiro-hero-v25-poster.jpg` | Poster frame (3.9s) shown before playback |

Where it's used and shared:

- Site: private repo `tilework-tech/jirobot-site` (Maddy's design, not the old rice-triangle page in this repo), PR #1 (`hero-video-v25`) puts the web encode and poster in its hero.
- Drive: "2026-10-22 Jiro.bot hero - self-modifying" folder, file "2026-10-27 Jiro hero v25 (46s loop, 1200x960).mp4" (https://drive.google.com/file/d/1WfSGutPUkC3hs9lNT3FEqzo9ra4bOgcx/view).
- Slack: #growth-agent-work thread https://tilework-tech.slack.com/archives/C0BGDN7PK3K/p1792789138740999, shared from there for team feedback.

What v25 is (each step is a section in `../hero-loop-v3/README.md`):

- v22: Martin's copy edits, agent control panel instead of swim lanes, +38 −1,412 stat bounce, 3D phone exit.
- v23: calmer pacing. Story time maps onto a 46s real timeline (`KNOTS` in the template), so typing is 2-3x slower and every shot holds longer.
- v24: the blurred placeholder lines are now real text.
- v25: Maddy's `jiro-working_V4` mascot art, `beauty-corp/shop` as the demo repo, and moves from the scroll-buddy moodboards (PR #22: idle hover, blinking cursor, glances, thinking dots, eager double-hop).

Rebuild from `../hero-loop-v3/`:

```sh
npm i playwright ffmpeg-static lucide-static @fontsource/ibm-plex-mono @fontsource/inter @fontsource/lato
npx playwright install chromium
bash brand/fonts.sh
node build.mjs template25.html index25.html
python3 -m http.server 3001 --bind 127.0.0.1 &
OUT=v25-video.mp4 node render25.mjs --w=1200 --h=960 --fps=60
node render25.mjs --w=1200 --h=960 --cues=1 && node sfx.mjs
ffmpeg -i v25-video.mp4 -i sfx.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart jiro-hero-v25-46s-loop-1200x960.mp4
# web encode: ffmpeg -i v25-video.mp4 -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart jiro-hero-v25-web.mp4
```

Stills for a quick check: `node render25.mjs --w=1200 --h=960 --times=2,9,25.5,40` writes `stills/v25_*.png`. Times are real (video) seconds.
