# kitchen → storage

**Route:** the camera pulls back into a dollhouse cutaway of the building: the belt runs off the end of the kitchen counter, drops through a hatch in the floor, runs down a wooden chute past the joists (lost chopstick, ancient fortune cookie, a mouse, a copper pipe), down the cellar stairwell past an "Employee of the month: JIRO" plaque, goes behind the storage wall and comes out of the storage doorway.

**Length:** 1.8 viewport heights.

## How it works
- World space = kitchen stage space. Kitchen frame at (0,0); storage frame at (OX, OY) = (2560, 1240). The cutaway painting `public/art/tr/kitchen-storage/cutaway.jpg` (2936x1546) is drawn at world (-70, 0) at 1.55 world px per image px, so it sits under and around both frames.
- The camera eases from the kitchen frame to the storage frame and zooms out to 0.6 in the middle, clamped to the world bounds. Both scene frames are drawn to offscreen canvases with `api.drawScene`. Their edges that face the cutaway fade in and out as feathers (0 px at the scene end, up to 150 px mid-transition). Frames are identical to the scenes at t=0 and t=1; only DOM overlays differ.
- The chute (`kitchen-storage/world.ts`) starts 30 u before the kitchen belt end, so the lead-in comes from `kitchen.belt.pts`. It follows the painted chute and ends at `storage.belt.pts[0]` + (OX,OY). It uses phase `-U0` and key `"kitchen"`, so seams, plate spacing and items continue the kitchen belt exactly. Plates fade as they pass behind the storage wall, and the storage scene's own `fadeIn` brings new ones out of the doorway.

## What the scene art must keep for this to line up
- **Kitchen:** the belt must still leave the frame on the right edge at about (1945, 992), heading down-right at about 0.27 slope. The cutaway continues it from there, so the lower-right corner should stay counter-and-belt, around x 1750–1920 and y 900–1080. The bottom edge (y 1000–1080) and right edge (x 1800–1920) fade into the painting: keep them darkish wood/counter, with no bright objects cut by the edge. If the kitchen belt endpoint moves more than about 20 px, the painted chute bend at world (1995,1008)→(2103,1206) will not meet it.
- **Storage:** the belt must still start in the dark doorway on the left wall at about (262, 362), flowing down-right. The left strip (x 0–105) and top strip (y 0–105) fade into the cutaway, so keep them as plain wall planks and dark ceiling. The doorway interior must stay black, because plates appear out of it.
- If either scene's framing changes a lot, adjust OX/OY or the chute points in `kitchen-storage/world.ts`. The chute points are in painting pixels.
