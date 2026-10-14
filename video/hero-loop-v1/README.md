# Jiro hero loop v1 (30s)

First pass at the jiro.bot hero video: Jiro's first week, shown in the Nori web app (dark), with Slack and the CLI weighing in on one decision.

| Time | Beat |
|---|---|
| 0–4s | Day 1: Jiro introduces itself and reads the codebase |
| 4–9s | Suggests three structural changes that make the repo easier for agents |
| 9–12s | The team approves from Slack, the CLI, and the web |
| 12–18s | Day 3: Jiro asks why the code behaves a certain way, then documents the answer |
| 18–23s | Week 2, 3 AM: an alert automation starts a session; Jiro traces, tests, and fixes |
| 23–27s | Morning: draft PR waiting for review |
| 27–30s | "Jiro. The tasteful, proactive software engineer." then loops |

- `jiro-hero-loop-30s.mp4`: seamless 30s loop with sound effects only (for the site hero).
- `jiro-hero-30s-branded.mp4`: the same body with the Nori snap ident, Bookend card, and backing track (38.6s, for social).
- All data is fake (acme/shop, Sam Lee, priya@acme.dev, PR #418). The web app is an HTML mock of the broker chat page matched to the real UI's tokens and components.

Rebuild (needs the making-feature-showcases `brand/` kit and `npm i playwright ffmpeg-static @fontsource/inter @fontsource/ibm-plex-mono @fontsource/lato lucide-static`):

```bash
node build.mjs                      # template.html -> index.html (inlines icons)
python3 -m http.server 3001 &       # serve the folder
node render.mjs --times=5,10,20     # review stills
node render.mjs --fps=60            # video.mp4
node render.mjs --cues=1 && node sfx.mjs
```
