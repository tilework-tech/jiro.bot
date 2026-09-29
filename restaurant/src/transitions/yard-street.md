# yard → street: "Over the fence"

**Route:** the yard belt keeps climbing past the yard's right edge, up the fence face into a little copper hatch on the fence cap beside a sleeping cat; the camera rises over the fence into the neon glow, dissolves into the street, and the belt comes down a steep copper run that drops each plate onto its twin on the trike's loop (the run lifts away as we settle).

**Length:** 2.0 viewport heights.

**Timeline (t):** 0–0.44 camera pans right/up following the plates (yard feathered into `public/art/tr/yard-street/cross.jpg`, a wide extension painted around the yard). 0.44–0.63 push-in over the fence cap toward the neon sky. 0.56–0.69 dissolve into the street, zoomed ×2.3 on the signs + run. 0.69–1 tilt down/zoom out to the street frame; the run lifts and fades over 0.84–1.

**Hand-off:** yard plates (key `yard`) vanish into the hatch; the street run uses key `street` with a phase computed from `street.belt.pts` so every plate arrives at loop sample 24 (≈ 1567, 573) exactly when the loop plate with the same item passes there.

## What the scene art must keep

Yard (`public/art/yard.jpg`, stage coords):
- Belt must still exit the right edge rising at ~45° (last pts ≈ (1760,800) → (1945,610)); the ramp is read from `yard.belt.pts` and continued to the hatch at world ≈ (2392, 252).
- Fence top ≈ y 220–265 at the right edge, dark plank fence at x 1700–1920, night sky above. `cross.jpg` was painted to match the current yard; if the yard art changes a lot, regenerate `cross.jpg` (placement: world x 475, y −517, 2899×1618; the right half from world x 1920 is the new fence + cat + neon rooftops).

Street (`public/art/street.jpg`):
- Loop stays centred ≈ (1493, 607) (read from `street.belt.pts`; landing is sample 24).
- Keep the area x 1310–1560, y 0–560 (between the SUSHI sign and Jiro's head, down to the back of the loop) free of anything that should sit in front of the run; Jiro's head must stay left of x ≈ 1370.
- Optional polish: a small copper funnel/lip at the back-right of the cargo box around (1540, 560) to receive the run.
