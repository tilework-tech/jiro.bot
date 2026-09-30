# Demo4: Jiro.bot sketch belt

This branch freezes review item 4 from Martin's Jiro.bot review, including his subsequent request for a crisp, animated pixel-art hero. It uses the exact source from `scroll-sketch-belt` commit `6dfaa7a8e9af6c45f0311ae9e218ba25b861e00e`, PR #4. The working site is in `restaurant/`, with all final art, source code, two comparison recordings, the original visual sketch, and a complete reference set.

Demo1 already contains review item 2, the 3D build. All 64 website files in that item match Demo1 byte for byte, so Demo3 is intentionally unused. Review item 1 is preserved as Demo2.

## Run this snapshot

```bash
cd restaurant
npm ci
npm run build
npm run dev
```

Node 22 is recommended. The development server listens on port 3000. This is a Vite and TypeScript 2D canvas site and does not need WebGL. Do not substitute assets or code from Demo1 or Demo2: all three demos have different scene structure and animation systems.

## Recreation map

- `restaurant/docs/RECREATE.md`: exact architecture, scene order, timing, belt mechanics, content, interactions, visual pipeline, and verification.
- `restaurant/docs/FEEDBACK-LOG.md`: Martin's written direction in the original Slack thread, verbatim and linked.
- `restaurant/docs/ASSETS.md`: byte size and SHA-256 for every binary asset and captured reference frame.
- `restaurant/reference/`: each scene and every transition midpoint at 1600 by 900, with capture settings in `capture.json`.
- `restaurant/src/`: executable scene and transition definitions. The source is authoritative if a document and the running site differ.
- `restaurant/public/`: every served image, sprite, product screenshot, and comparison video needed to run the saved version.

The main remaining design gap is the delivery bike motion. Martin's requested motorcycle reference video was not available in the thread or repo, so this snapshot retains the existing bicycle scene. This is a documented limitation, not an omitted asset.
