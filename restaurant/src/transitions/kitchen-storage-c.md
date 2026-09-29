# kitchen → storage, candidate C: inclined conveyor down the cellar stairs

**Route:** the belt runs off the end of the kitchen counter and onto an inclined conveyor beside a narrow wooden cellar staircase with a handrail, under a single bulb, past a mop and bucket. It goes through the storage wall and comes out of the storage doorway.

**Length:** 0.8 viewport heights. There is one eased camera pan with no zoom.

## How it works
- World space is kitchen stage space. The kitchen frame is at (0,0) and the storage frame is at (OX, OY) = (2640, 1485).
- `public/art/tr/kitchen-storage-c/stairwell.jpg` (2752x1536) was painted by Gemini around a guide that had both rooms in place. It is drawn at world (6.6, 13.2) with a scale of 1.65. That registration was measured by template matching, and both rooms matched to within about 1%.
- The camera pans from (0,0) to (OX, OY) with smoothstep. The kitchen's right and bottom edges and the storage room's left and top edges feather into the painting, up to 160 px. The feather is 0 at t=0 and at t=1.
- The connector belt is in `kitchen-storage-c/world.ts`. It is built from `kitchen.belt` and `storage.belt` at load time. It starts 200 u before the kitchen belt's end, so it covers the feathered edge. It has phase `-U0` and key `"kitchen"`, so the seams and plates continue the kitchen belt exactly. It follows the painted incline and ends at the storage belt's first point. Plates fade out in step with the storage frame's opacity, which makes them slip behind the storage wall.

## What the scene art must keep
- **Kitchen:** the belt should still leave near (1945, 993). The right and bottom edges should stay counter and dark wood.
- **Storage:** the left and top strips should stay as plain plank wall and ceiling. The belt should still start in the dark doorway.
