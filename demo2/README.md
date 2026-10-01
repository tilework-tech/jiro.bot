# Demo2: Jiro's Restaurant

This branch freezes review item 1 from Martin's September 30 Jiro.bot review. It is the eight-room pixel-art restaurant tour from `restaurant-belt`, original source commit `ae63ce88e83b7f1df1475c4010b219f26f0e7746` and PR #6. The site, source art, final served assets, recreation tools, exact feedback, visual reference frames, and an asset checksum manifest live under `restaurant/`.

Demo1 is a different 3D scroll-flow site. Review item 2 was checked against Demo1 and skipped because all 64 website files match byte for byte. Review item 4 is preserved separately as Demo4. Demo3 is intentionally unused.

## Run this snapshot

```bash
cd demo2/restaurant
npm ci
npm run build
npm run dev
```

Node 22 is recommended. The development server listens on port 3000. The app is a Vite and TypeScript canvas site, with no WebGL requirement.

## Reconstruction map

- `restaurant/docs/RECREATE.md`: snapshot identity, run and verification steps, known limits.
- `restaurant/docs/00-history.md` through `06-art-and-tooling.md`: detailed scene, belt, transition, moodboard, art, feedback, and tool documentation already developed for PR #6.
- `restaurant/docs/ASSETS.md`: size and SHA-256 of every binary asset and saved reference frame.
- `restaurant/reference/`: browser captures of every scene and each transition midpoint at 1600 by 900, with capture settings in `capture.json`.
- `restaurant/tools/`: original art and QA scripts, plus `asset_manifest.py` to verify the saved binaries.

The saved files, rather than regenerated images or videos, are the exact version Martin selected. Do not substitute assets from another Jiro demo.
