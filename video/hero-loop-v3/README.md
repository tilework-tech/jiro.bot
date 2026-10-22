# Jiro hero v3 (48s, phone)

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
