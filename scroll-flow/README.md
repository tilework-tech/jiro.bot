# Jiro.bot scroll flow (3D take)

One continuous conveyor belt runs from the hero to the footer and never stops.
Scrolling moves the camera along it; each scene is a looping pixel-art video
panel placed somewhere different in 3D, so following the belt orbits, pitches
(the top-down serving scene) and barrel-rolls (into the CTA) between scenes.
Only one scene is lit at a time, and the page snaps to scenes.

```bash
cd site && npm install
npm run dev        # http://localhost:3000
npm run build      # static build in site/dist
```

- `site/src/layout.ts`: card poses and the belt route per card (follows the sketch)
- `site/src/belt.ts`: belt path (Bezier connectors, Chaikin corners) and mesh
- `site/src/plates.ts`: plates, drag/throw, and every easter egg
- `site/src/main.ts`: camera rig, snapping scroll, overlays, secrets
- `site/src/content.ts`: demo, side-by-side replays, table, FAQ, pricing
- `pipeline/`: Gemini still → Veo 3.1 with first and last frame pinned to the
  still → `loop.py` seamless cut (drops the duplicate end frame, crossfades the
  tail into the head, prints seam vs typical frame diff). `lock_region.py`
  freezes a region (keeps the omakase sushi still for the FAQ bubbles).
- `art/`: scene stills and the belt item sheet.

Secrets: arrow keys/space step scenes, Konami code, type "omakase" or "slop",
tap the logo 5x, stay on the footer 8s, click hero Jiro. 24 eggs total.

Draft copy to verify before launch: competitor cells in the comparison table,
and all pricing.
