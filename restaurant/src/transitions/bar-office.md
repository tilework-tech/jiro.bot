# bar → office

**Route:** the plates slide into the dark opening under the bar's bottle shelf, come out of a slot inside the wall (seen as a side-view cutaway), ride down a diagonal brace past a mouse family at a thimble table, a dripping copper valve and a cat's eye in a knothole, then pass through a floor-level hatch in the office's left wall.

**Length:** 1.8 viewport heights.

## Timeline (t)
- 0 → 0.31: camera pushes into the bar opening (zoom 1 → 3.2, clamped so the view never leaves the art).
- 0.15 → 0.31: chunky Bayer-dither dissolve into the wall cutaway, spreading out from the opening's screen position. The slot in the wall sits on the same screen spot, so plates vanish into the bar opening and come out of the slot there.
- 0.31 → 0.88: camera follows the belt through the wall (Catmull-Rom keyframes). The office is the world to the right of the wall (x ≥ 0), so the pan ends on the exact office frame.
- 0.88 → 1: exact office frame (the office DOM fades in over this window).

## Belt continuity
- The cutaway belt ends at `office.belt.pts[0]`. Its `phase = office.phase + length`, so plate ids and seams carry straight into the office belt.
- Plates keep their **bar** identity (`itemFor(n, "bar")`) until they pass behind a foreground stud at x = −1180, then switch to their **office** identity. The floppy that goes into the bar opening is the floppy that comes out of the slot.
- The only scale-1 speed is `BELT_SPEED`: nothing is hardcoded.

## What the scene art must keep or add
- **bar:** keep a dark opening at the belt's last point (currently `bar.belt.pts[1]` = 1745,335; the camera aims at last point + (15, −25)). The belt must keep running up and to the right into it, and `fadeOut` should stay around 70. If the opening moves, move the belt end with it and the transition follows.
- **office:** the left wall needs a **dark square hatch at x ≈ 0..60, y ≈ 905..1000**, framed in wood or copper, with the belt coming out of it. The transition's hatch frame (y ≈ 897..1007) sits just left of x = 0. Keep the belt horizontal at y ≈ 955, starting at x ≈ −20 with `fadeIn` ≈ 60. Some dark wood at the far-left edge (x 0..20) helps the seam.

## Files
- `src/transitions/bar-office.ts`: cameras, dissolve, timeline.
- `src/transitions/bar-office/wall.ts`: cutaway world (belt path, plate identity, mice, cat eye, drip, stud, hatch).
- `public/art/tr/bar-office/wall.jpg`: 2560×1080 inside-the-wall art (world x −2560..0). The leftmost 440 px are mirrored and shaded as padding.
- `public/art/tr/bar-office/mice.png`: mouse family sprite.
