# dining → kitchen: the sushi cam

**Route:** the camera dips onto a plate on the dining belt and, bolted to it, rides at sushi eye height behind a rubber-duck plate that noses the swinging kitchen doors open. The doors flap shut, our plate pushes through, and a towering Jiro, a giant knife, the rice "hot tub" and a peeking cat look down at us. Then the camera rises back to the eye-level kitchen view.

**Length:** 2.0 viewport heights.

| t | beat |
|---|------|
| 0 – 0.12 | dining camera eases from identity onto a camera locked to the POV door rect (zoom ≈ 1.6 × POV door scale, doors centred unless that would show past the art's right edge) |
| 0.02 – 0.23 | sushi cam cranes down: eye height starts 130 higher, horizon compensated so the door plane holds still while the counter and belt swing up from below |
| 0.10 – 0.21 | bottom-first ordered-dither pixel dissolve dining → POV (6 px cells, Bayer 8×8 + position bias; no seam) |
| 0 – 0.80 | POV ride. Door-plane distance falls linearly 283 → −80 world units (constant speed; the camera tilt is eased, the travel is not) |
| ≈0.24 / 0.57 | duck plate pushes the doors open / our plate pushes them open again |
| 0.76 – 0.93 | un-bolt: eye height rises +240, so the near belt and plates drop out of frame and the belt narrows toward the vanishing point |
| 0.83 – 0.95 | top-first pixel dissolve POV → kitchen at the matching camera `K_MATCH` (zoom 2.0 around 1397, 536: tub centre-left, Jiro right); kitchen pulls back to identity over 0.88 – 1.0 |

**How it works:** `dining-kitchen/dissolve.ts` renders the incoming layer offscreen and masks it with chunky Bayer-dither cells (the same pixel look as the art) so the hand-offs read as one camera, not a split screen. `dining-kitchen/pov.ts` is a pinhole camera (F=500) on a plate. The belt tread, copper rails and wooden counter are mode-7 scanlines rendered at 1/4 resolution. The tread and the plates ahead ride with us, so they hold still. The rails' rivets and the counter joints stream past at `BELT_SPEED` plus the scroll travel. The door leaves are projected vertical strips of `doors.jpg`, hinged on the frame.

**Art** (`public/art/tr/dining-kitchen/`, sources in `/tmp/dining-kitchen/src/`):
- `doors.jpg`: the dining wall from belt height. The door opening is hard-coded as `DOOR` in `pov.ts`: x 738–1182, y 205–728, the leaf split at x 960, and the counter line at y 740. If you regenerate this image, update those numbers.
- `kitchen-pov.jpg`: a worm's-eye view of the kitchen. Its vanishing point is hard-coded as `KVP` = (960, 566).

**Scene dependencies (kept small):**
- Dining: `DD` in `dining-kitchen.ts` is the dining door (centre x 1475, top y 205, width 280; doors ≈ 1335–1620 × 205–550). The entry camera is solved each frame so these doors land on the POV door rect. If the dining doors move, update `DD`.
- Kitchen: the dissolve lands on `K_MATCH` (zoom 2.0 around 1397, 536), which lines kitchen.jpg's tub (≈1154, 580) and Jiro's eyes (≈1567, 358) up with the same props in `kitchen-pov.jpg`. Keep Jiro on the right, the hangiri tub centre-left, and the belt entering from the left (about 700, 650). If Jiro or the tub move a lot, update `kitchen-pov.jpg` so they stay on the same sides.
- Neither scene's `belt` data is read. The POV belt is its own world (belt 64 wide, plates 52, PLATE_GAP 150).
