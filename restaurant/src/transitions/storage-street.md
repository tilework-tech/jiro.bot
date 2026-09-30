# storage/pantry → street

**Route:** the storage belt leaves the bottom edge, bends straight down (R 80) under the floor past the stone foundation, runs through a steel reducer box on the utility pole (75 px storage tread in, 58 px street tread out, green status LED) and becomes the street's vertical wall conveyor. The camera tilts down with a small sideways drift, no zoom.

**Length:** 0.7 viewport heights. **Gap:** `GAP = U0 + pathLength(upper) − pathLength(storage) + (joinY − SWAP_Y)` ≈ 278.6, computed at module load from the static belt points.

## How it works
- World space: storage at (0,0); street at (SX, 1480), SX = VX − `BELT_X` (VX ≈ 1886). `shaft.jpg` (2112×760, drawn 1:1 at (0, 900)) is the cutaway band: floor joists, stone foundation with the pink/cyan neon lip, wet wall, cables, the pole. Its left 145 px (black in the original outpaint) are mirrored in, and it is padded 64 px on the right.
- Upper run: `phase = beltPhase("pantry", U0)` (U0 = storage u at world y 950). Lower run: `phase = beltPhase("street", −(joinY − SWAP_Y))`. Both are set every frame; with `gap` the engine chains the street phase so the two runs meet at the box with delta 0 (align.mjs).
- Scene buffers feather into the band only mid-transition, so t≤0 / t≥1 are the scene frames. The street buffer's left SX px are mirrored into the bottom-left corner.
- Crawlspace life (clipped to the band between the frames, so invisible at t=0/1; all pure functions of time, periods divide 24 s): three soot sprites (a rice-grain thief walking the drain pipe, a hopper jumping between joists, a peeker on the neon lip that scurries away when a plate comes round the bend and creeps back), a fourth pair of eyes blinking between the joists, drain pipe with a drip, drips off the neon lip, a loose dangling cable that sparks every 12 s, dust motes, street neon glow breathing up under the foundation.
- Egg `pantry-soot`: DOM hotspot following the rice thief.

## What the scene art must keep
- **storage:** belt still leaving the bottom edge near the right (read from `storage.belt.pts`; large moves would miss the pole at x ≈ 1846–1926).
- **street:** the vertical conveyor at `BELT_X` from the top edge, starting at y −70.
