# dining → kitchen: the sushi cam

**Route:** the belt leaves the dining room at the bottom-right corner, runs on across the lower counter, and goes into the dining's south wall through a small serving hatch at counter height. The hatch has saloon doors and a noren above it. The plates ahead push the doors open, then they flap shut between plates. Our plate goes through too, and on the other side Jiro looms over his kitchen counter like a friendly kaiju: giant knives, a steaming pot, and a cat's eye watching from behind the plate stack. Then the camera lifts off the plate into the normal kitchen view.

**Length:** 1.6 viewport heights.

| t | beat |
|---|------|
| 0 – 0.22 | Bird's-eye swoop. Zoom 1 → 2.4 onto the corner at (1770, 965), and the view turns 180° (0.06 – 0.22) so south, toward the kitchen, points up the screen |
| 0.22 – 0.39 | True 3D crane: the camera pitches from straight down to level and drops from h 208 to sushi eye height 22. The hatch wall rises from the top edge |
| 0.31 – 0.38 | Lock-on, as a near-first dither. The belt under us stops streaming, and our plate's rim and our salmon's nose appear in the foreground. The plates ahead now ride with us. A clickable "REC · SUSHI CAM" HUD fades in (easter egg `tr-sushi-cam`) |
| 0.38 – 0.80 | The ride. We approach the doors, which are pushed open by every plate ahead. We pass under the noren, and the camera tilts up 0.1 rad toward Jiro |
| 0.78 – 1.00 | The camera un-bolts: it rises 190 and levels. A top-first dither (0.84 – 0.95) brings in kitchen.jpg at a zoom that lines up Jiro's eyes, then pulls back to identity (0.88 – 1) |

**How it works** (`dining-kitchen/world.ts`):
- The world uses dining stage units: X is east, Y is south, Z is up. The belt is 64 wide.
- The camera looks south. It pitches about the x axis and has a vertical lens shift.
- The floor is a texture made from the live dining frame, drawn each frame as horizontal strips, mirrored. Its east edge is extended by stretching the edge, and the lower counter continues procedurally up to the wall at Y = 1200. The dining belt continues into the hatch with the same ids and phase.
- The wall is drawn as strips by height, with the hatch cut out using an evenodd clip.
- Through the hatch: the painted kitchen backdrop, anchored on the horizon; a procedural steel-rail belt; plates drawn as billboards (POV spacing 150, so the duck doesn't block the view); and the door leaves drawn as projected strips of `leaves.png`.
- On the near side, the procedural tread moves with us and the rails' rivets stream past at BELT_SPEED.

**Art** (`public/art/tr/dining-kitchen/`, all generated with gen_still.py and snapped to a 3 px grid):
- `wall.jpg`: the dining south wall. Counter line y 865, hatch x 740–1180 × y 350–865, leaf split x 960.
- `leaves.png`: the door leaves cut from `wall.jpg`, origin (738, 395).
- `kitchen-pov.jpg`: the sushi-eye view of the new `kitchen.jpg`, with the empty plate painted out. Its vanishing point is (960, 745) and Jiro's eyes are at (891, 282) and (990, 275).

**Scene dependencies:**
- Dining: the belt path and phase are read from `dining.belt`.
- Kitchen: the final match uses kitchen.jpg's eye centre (1229, 444.5) and eye gap 34.5, hard-coded in `kitchenMatch`. If Jiro moves in kitchen.jpg, update those numbers.
