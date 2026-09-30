# storage → street

**Route:** the storage belt leaves the bottom edge, bends straight down under the floor, passes the stone foundation's corner, runs through a steel junction box (green status LED) and becomes the street's vertical wall conveyor. The camera tilts straight down with no zoom.

**Length:** 0.7 viewport heights.

## How it works
- World space: storage at (0,0); street at (SX, 1480), SX = VX − `BELT_X`, where VX is computed from `storage.belt.pts` (tangent at y 1100 + an 80 px bend). The painted cutaway band `public/art/tr/storage-street/shaft.jpg` (Gemini outpaint: floor joists, stone foundation, wet wall, wires, the steel chute on the pole) sits at world (0, 900), 2048×760.
- Upper run: storage items, phase continued from the storage belt from y 950 down to the junction box. Lower run: street items, phase continued into `street.belt`. The item switch happens inside the junction box (y 1178–1332).
- Scene buffers feather into the band only mid-transition, so t≤0 / t≥1 match the scenes.

## What the scene art must keep
- **storage:** belt still leaving the bottom edge near the right (it's read from `storage.belt.pts`, so small moves are fine; large ones would miss the painted chute at x ≈ 1846–1926).
- **street:** the vertical conveyor at `BELT_X` from the top edge.
