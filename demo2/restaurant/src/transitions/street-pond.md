# street → pond

**Route:** the street's vertical wall conveyor (x = `BELT_X`) keeps going straight down past the bottom edge, disappears behind the garden wall's tiled cap, shows through the round moon gate, runs down the gravel lane and turns left onto the pond pier. The camera tilts straight down (a small leftward drift starts only once the view is below the street frame). Rain stays on the street side; the garden below the wall has fireflies.

**Length:** 0.8 viewport heights.

## How it works
- World space: street frame at (0,0); pond frame at (PX, 1665) with PX = BELT_X − 46 − pond.belt.pts[0].x, so the pier corner is straight under the street belt. The backdrop `public/art/tr/street-pond/garden.jpg` (painted for PX = −351, cat removed) moves with the pond; the moon gate lines up with the belt.
- Two belt runs: UPPER (street items, phase continued from `street.belt`) from y 880 to 1130, visible only above the wall top; LOWER (pond items, phase = pond.phase + distance to the pier start) from 1130 through the gate and lane onto the pier, overlapping 170 px into the pond frame's feathered right edge. The item switch happens behind the wall.
- t≤0 / t≥1 draw the scenes directly; feathers are 0 at the ends (measured diff < 0.01/255).

## What the scene art must keep
- **street:** the vertical belt at `BELT_X` running out of the bottom edge; bottom rows stay wet pavement.
- **pond:** the pier belt entering from the right at y ≈ 530 (pond.belt.pts[0] = (1950, 530)).
