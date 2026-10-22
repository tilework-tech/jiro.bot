# Jiro hero video: saved version (2026-10-14)

`jiro-hero-saved-2026-10-14.mp4`: 40.4s seamless loop, 1200x960 (5:4, fits the black hero box in the jiro.bot design), 60fps, SFX only. Saved by Martin's request; this is v11 of the iteration in `../hero-loop-v3/`.

Beats: Day 1 codebase scan, how-you-ship check, findings, Jiro pushes back on one big PR (Slack and CLI weigh in), PR before/after; Day 3 docs prompt; Day 5 catches another agent's PR; automated alert at 4:21 AM fixed by morning. Jiro in #3cf06e, you in #f2694f. All data is fake.

Rebuild: `node build.mjs template.html index11.html && python3 -m http.server 3001 & node render11.mjs --w=1200 --h=960 --fps=60`, then `node render11.mjs --w=1200 --h=960 --cues=1 && node sfx.mjs` and mux.

## Saved 2026-10-16: v17 phone and no-phone

Martin approved both v17 cuts on 2026-10-16. They replace the v11 save above as the current versions:

- Phone: `../hero-loop-v3/jiro-hero-v17-phone-36s-loop-1200x960.mp4` (36.4s loop, Week 2 cold open, then the Day 1 story).
- No-phone: `../hero-loop-v3/jiro-hero-v17-nophone-30s-loop-1200x960.mp4` (30s loop, close-up cold open).

Source and rebuild steps: `../hero-loop-v3/README.md` (v17 section).
