# dining → kitchen: the sushi cam

**Route:** the camera dips onto a plate on the dining belt and, bolted to it, rides at sushi eye height behind a rubber-duck plate that noses the swinging kitchen doors open. The doors flap shut, our plate pushes through, and a towering Jiro, a giant knife, the rice "hot tub" and a peeking cat look down at us. Then the camera rises back to the eye-level kitchen view.

**Length:** 2.0 viewport heights.

| t | beat |
|---|------|
| 0 – 0.16 | dining zooms toward the belt near the doors (×3.4 around 1480,800); POV slides up from below (camera tilting down) |
| 0.08 – 0.80 | POV ride. Door-plane distance falls linearly 300 → −80 world units (constant speed; the camera tilt is eased, the travel is not) |
| ≈0.31 / 0.60 | duck plate pushes the doors open / our plate pushes them open again |
| 0.80 – 1.0 | camera rises (eye height 29 → 119) and the POV slides down out of frame while the kitchen zooms out 2.6 → 1 |

**How it works:** `dining-kitchen/pov.ts` is a pinhole camera (F=500) on a plate. The belt tread, copper rails and wooden counter are mode-7 scanlines rendered at 1/4 resolution. The tread and the plates ahead ride with us, so they hold still. The rails' rivets and the counter joints stream past at `BELT_SPEED` plus the scroll travel. The door leaves are projected vertical strips of `doors.jpg`, hinged on the frame.

**Art** (`public/art/tr/dining-kitchen/`, sources in `/tmp/dining-kitchen/src/`):
- `doors.jpg`: the dining wall from belt height. The door opening is hard-coded as `DOOR` in `pov.ts`: x 738–1182, y 205–728, the leaf split at x 960, and the counter line at y 740. If you regenerate this image, update those numbers.
- `kitchen-pov.jpg`: a worm's-eye view of the kitchen. Its vanishing point is hard-coded as `KVP` = (960, 566).

**Scene dependencies (kept small):**
- Dining: the zoom target is (1480, 800), the belt near the right-hand doors. The dining art should keep a double swinging door with round portholes on the right wall (currently about 1330–1650 × 200–520) and a belt running toward it along the bottom (y ≈ 824), so the POV doors read as the same doors. The dining art must not change the zoom math.
- Kitchen: the pull-back starts at zoom 2.6 around (1060, 560) (the rice tub, pass shelf and Jiro). Keep Jiro on the right, the hangiri tub centre-left, and the belt entering from the left (about 700, 650). If Jiro or the tub move a lot, update `kitchen-pov.jpg` so they stay on the same sides.
- Neither scene's `belt` data is read. The POV belt is its own world (belt 64 wide, plates 52, PLATE_GAP 150).
