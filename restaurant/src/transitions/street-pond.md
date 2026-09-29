# street → pond

**Route:** A delivery chute folds out of the rear of the trike's cargo loop and runs down the wet street, through the round moon gate in a garden wall and down a gravel lane, then turns left onto the pond pier. The camera cranes down along it, and the rain gives way to fireflies.

**Length:** 2.0 viewport heights.

## How it works
- World space: street frame at (0,0), pond frame at (PX,PY) = (-351, 1665). The backdrop `public/art/tr/street-pond/garden.jpg` sits at (-360, 1052), 2395×1673. It holds the wall, the moon gate, the lane and the garden bank, and was outpainted from both scene frames.
- Scenes are rendered through `api.drawScene` into offscreen buffers. Their edges feather into the backdrop only while 0 < t < 1, so t=0 and t=1 are pixel-identical to the scenes (checked: mean diff < 0.2/255).
- The chute is one open `BeltPath`. It starts at the loop's rightmost point (read from `street.belt.pts`) and ends at `pond.belt.pts[0]`, and it uses the pond width, plate size and scale 1 at the join. Its phase is `pathLength(CHUTE) + pond.phase` and its item key is `"pond"`, so every plate becomes the same pond plate at the same speed. Plates hop over the first 70 px after they leave the loop. The wall hides the chute except where it shows through the gate hole.
- Camera: Hermite keyframes (t, cx, cy, zoom) with zero velocity at both ends. It zooms to 1.2 on the trike, cranes down over the wall and eases out to the pond frame.

## What the scene art must keep
- **street:** the loop's rear (right) point at about (1611, 607). The column x ≈ 1640–1720, y 650–1080, right of the rear wheel, must stay clear for the chute. The bottom rows (y 990–1080) must stay wet pavement, because they are mirrored into the strip above the wall.
- **pond:** the pier belt enters from the right at y ≈ 530 (pond.belt.pts[0] = (1950, 530)). The pier deck must reach the right edge at y ≈ 495–600. The top edge must keep water on the left, garden in the middle and the bridge on the right, because that is what the backdrop was painted to meet. Jiro on the bridge at about (1650, 120) matches the backdrop.
- If either scene is repainted with a different layout, regenerate `garden.jpg` with the same outpaint (street at the top, pond at (-351, 1665)), then re-measure GATE and LANE_X.
