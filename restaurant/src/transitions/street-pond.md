# street → pond

**Route:** the street's vertical wall conveyor (x = `BELT_X`) keeps going straight down past the bottom edge, disappears behind the garden wall's tiled cap, shows through the round moon gate (which frames a rainy glimpse of the new street: Jiro on his bike under the red light), runs down the gravel lane and sweeps left onto the pond pier in one wide turn. The camera tilts straight down (a small leftward drift starts only once the view is below the street frame). Rain stays on the street side; the garden has fireflies, moths, wind in the grass and soot sprites.

**Length:** 0.8 viewport heights. **gap:** `GAP` ≈ 1056.5 u (computed from the geometry).

## How it works
- World space: street frame at (0,0); pond frame at (PX, 1665) with PX = BELT_X − 46 − pond.belt.pts[0].x = −256 (fixed: the backdrop `public/art/tr/street-pond/garden.jpg`, painted for PX = −351, moves with the pond and puts the moon gate on the belt).
- One belt, global plate ids. UPPER (street width 58, y 880 → 1130) has phase `beltPhase("street", 950)`; LOWER (pond width 62, y 1130 → gate → lane → turn → pier) has `beltPhase("street", 1200)`. The width change is hidden behind the wall.
- The lane → pier turn has a centre-line radius of 80 (1.29 × 62). It ends on the pier line at world x 1660 = pond-local x 1916, i.e. `JOIN` = 34 u into the pond belt (its first 34 u are outside the pond's 1920 px frame and never drawn). `gap = U_TURN − (1220 − 1200) − JOIN`, so the pond belt continues the lane run exactly (delta 0).
- LOWER is drawn over the pond frame only across the pond's feathered right edge (width 40·outP → 0 at t = 1).
- Life (pure functions of `now`): soot sprites (runner and rice carrier on the wall cap, a peeker behind the crumbled bricks, one by the lane that hops aside when a plate passes), moths round the wall lantern + breathing glow, rain inside the gate glimpse, grass tufts leaning in travelling gusts, fireflies. All only outside the pond frame, so nothing pops at t = 1.
- Egg `soot-rice`: click the rice carrier on the wall cap; it drops its grain for 6 s.
- t≤0 / t≥1 draw the scenes directly.

## What the scene art must keep
- **street:** the vertical belt at `BELT_X` running out of the bottom edge (pts end at y 1150); bottom rows stay wet pavement.
- **pond:** the pier belt entering from the right at y 530 (pond.belt.pts[0] = (1950, 530)), width 62.
