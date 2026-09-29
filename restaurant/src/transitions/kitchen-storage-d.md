# kitchen → storage, candidate D: through a PVC strip curtain

**Route:** the belt runs off the end of the kitchen counter into a steel-framed pass-through in a tiled pillar. The pass-through is hung with a clear PVC strip curtain, like a walk-in cooler. The camera stays at eye level, pans along the belt and dollies into the curtain. The strips part around each plate. We push through them (a brief frosty, dim beat with strips against the lens), come out through the same kind of curtain in the storage doorway, and pull back to the storage frame.

**Length:** 0.7 viewport heights (the old cutaway was 1.8).

## Timeline
- 0.00–0.25·0.55: zoom 1→2 about the kitchen's bottom-right corner. The view never leaves the kitchen frame.
- to 0.55: PCHIP keys on log-zoom and centre. At t≈0.3 there is an establishing shot: counter, belt, pillar and curtain all in frame. The zoom then climbs to 9 on the curtain.
- 0.44–0.68: lens strips (screen space) and a cool tint. The cut to storage happens at 0.55, under the strips.
- 0.55–1.00: the camera eases out of the storage doorway (zoom 4.5→1). The doorway curtain melts away over 0.78–0.98, so t=1 is exactly the storage frame.

## Files
- `public/art/tr/kitchen-storage-d/ext.jpg`: 1920×1080 extension of the kitchen, drawn at world (960,540). World space = kitchen stage space. Its top-left quarter matches the kitchen's bottom-right quarter. The painted counter is an extrusion of the kitchen counter along the belt heading (made with Gemini paint-over), so the seam at x=1920 is nearly invisible.
- `kitchen-storage-d/curtain.ts` draws the curtains in code:
  - `drawCurtain`: world-space strips with idle sway on 6 s and 8 s periods, which divide LOOP. Plates push the lower ends of the strips aside.
  - `drawLensStrips`: screen-space strips that part from the middle outward.
- Belt: the kitchen path is continued straight along its own heading to x=2690. It starts 30 u before the kitchen end with phase `-U0` and key `"kitchen"`, so seams, spacing and items continue exactly at BELT_SPEED. It is clipped to x<2415 (the pillar edge) plus the void polygon, so plates briefly pass behind the left jamb. Belt data is read from `kitchen.belt` and `storage.belt` at runtime. The storage curtain and dolly target follow `storage.belt.pts[0]` if the doorway moves.

## What the scene art should keep
- **Kitchen:** the belt must still exit the right edge near (1945,993) on its current heading, and the bottom-right quarter (x 960–1920, y 540–1080) must not change much. If that quarter is repainted, regenerate `ext.jpg` from the new quarter, using `/tmp/ks-d/guide.png`-style extrusion plus a paint-over.
- **Storage:** the doorway (black, about x 267–435, y 50–400) must stay where the belt starts. Nice to have: paint a clear strip curtain into the doorway, or call `drawCurtain` with `S_CURTAIN` from the scene's `over()`. The curtain would then stay in the scene instead of fading out over the last 20% of the transition.
