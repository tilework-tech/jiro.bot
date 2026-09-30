# bar → office

**Route:** the plates slide into the dark opening under the bar's bottle shelf, come out of a slot inside the wall (seen as a side-view cutaway), ride down a diagonal brace past a fat, bored ginger tabby loafing on a beam under the belt (chin on paws, watching the plates go by) and a dripping copper valve, then pass through a floor-level hatch in the office's left wall.

**Length:** 0.9 viewport heights. **gap:** `U_C − 35` ≈ 2159.1 world units.

## Timeline (t)
- 0 → 0.31: camera pushes into the bar opening (zoom 1 → 3.2, clamped so the view never leaves the art).
- 0.15 → 0.31: chunky Bayer-dither dissolve into the wall cutaway, spreading out from the opening's screen position. The slot in the wall sits on the same screen spot, so plates vanish into the bar opening and come out of the slot there.
- 0.31 → 0.88: camera follows the belt through the wall (Catmull-Rom keyframes). The office is the world to the right of the wall (x ≥ 0), so the pan ends on the exact office frame.
- 0.88 → 1: exact office frame (the office DOM fades in over this window).

## Belt continuity (v3 global plate ids)
- One plate object end to end: cutaway u = 0 continues the bar belt 35 u before its end (inside the bar's opening), so `wallBelt.phase` is a getter returning `beltPhase("bar", U_bar − 35)` (read lazily; the engine writes scene phases at start()).
- `gap = U_C − 35`, so the engine chains the office phase to start exactly where the cutaway ends (align.mjs: wall end -> office start delta 0.0).
- No item/identity override: items and glaze depend only on the global id. The foreground stud is decor only.

## Life in the wall
- Fat cat: breathes (loaf swells up to 3 px on a 4 s cycle, belly row fixed), blinks, tail flicks, ear twitch.
- Soot sprites (`bar-office/soot.ts`, 8×7 sprite px at 4 world px, flickering fuzz fringe, two white eyes):
  - rice carrier shuttling along the noggin under the slot (12 s, pauses, looks around);
  - one dozing between the cat's ears, waking for 2 s every 8 s;
  - one in a knothole of the foreground stud: eyes glint, rises to peek left/right, sinks (6 s);
  - one on the floor edge under the low run that scurries ahead of each passing plate, eyes wide;
  - one lookout on top of the office hatch frame, gazes at approaching plates and hops as each goes under.
- Warm light flicker over the amber shaft, cool dust motes in the office-side light, valve drip.
- Egg `bo-cat`: click the cat (hit box follows the cutaway camera, t 0.31..0.88), meows, three rotating lines.

## What the scene art must keep or add
- **bar:** keep a dark opening at the belt's last point (currently the last point (1768,386); the camera aims at last point + (15, −25)). The belt must keep running up and to the right into it, and `fadeOut` should stay around 70. If the opening moves, move the belt end with it and the transition follows.
- **office:** the left wall needs a **dark square hatch at x ≈ 0..60, y ≈ 905..1000**, framed in wood or copper, with the belt coming out of it. The transition's hatch frame (y ≈ 897..1007) sits just left of x = 0. Keep the belt horizontal at y ≈ 955, starting at x ≈ −20 with `fadeIn` ≈ 60. Some dark wood at the far-left edge (x 0..20) helps the seam.

## Files
- `src/transitions/bar-office.ts`: cameras, dissolve, timeline.
- `src/transitions/bar-office/wall.ts`: cutaway world (belt path, phase/gap, cat, drip, stud, hatch).
- `src/transitions/bar-office/soot.ts`: soot sprites and the light flicker.
- `public/art/tr/bar-office/wall.jpg`: 2560×1080 inside-the-wall art (world x −2560..0). The leftmost 440 px are mirrored and shaded as padding.
- `public/art/tr/bar-office/cat.png`: fat bored cat, 4 frames of 120×118 side by side (open, blink, tail flick, ear twitch), drawn at 1.6× on the beam at x ≈ −1752, y = 524. Frame timing on the 24 s loop: blink every 8 s, tail flicks at 4 s (twice) and 13 s, ear twitch at 19.5 s.
