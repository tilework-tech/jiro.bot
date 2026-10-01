# dining → kitchen: through the swinging doors

**Route:** an eye-level observer camera pushes from the dining room into the swinging kitchen doors on the right wall. The two leaves swing away from us and the kitchen shows through the doorway. A centre-first pixel dissolve removes the door frame. The kitchen camera then pulls back from the pass to the normal kitchen frame, where the belt comes in through the open half-doors at the counter's left end. (Round 2: the POV sushi cam was removed per Martin.)

**Length:** 0.7 viewport heights.

| t / dining zoom z | beat |
|---|------|
| t 0 – 0.56 | push: log-zoom 1 → `ZMAX` 7.5. The focus point `P` (1476, 300, the upper door) slides from its own screen position to screen centre, so the view never leaves the art and needs no clamping |
| z 3.6 – 5.2 (t ≈ 0.31 – 0.40) | both leaves swing 0 → 80° away from us. Each leaf is drawn as 36 perspective strips cut from the live dining frame, hinged on its jamb, and darkens as it turns. The kitchen layer is clipped to the door opening behind the leaves |
| z 4.6 – 7.2 (t ≈ 0.36 – 0.50) | centre-first ordered-dither pixel dissolve (`dining-kitchen/dissolve.ts`) from the door frame to the full kitchen layer |
| t 0.40 – 1.0 | kitchen camera eases from `K0` (zoom 2.1 around 880, 470: the pass, the tub, and the belt start) back to identity |

**How it works:** the dining scene is rendered once per frame at identity into an offscreen canvas, then scaled by the push camera with nearest-neighbour sampling (crisp pixels). The leaves are cut from that same canvas, so they match whatever grade the dining art gets. There is no transition art (`public/art/tr/dining-kitchen/` was deleted).

**Scene dependencies (kept small):**
- Dining: `DOOR` = opening x 1335–1617, y 207–551, leaf split x 1474 (same as the scene's "Kitchen doors" hotspot). The swing is keyed to zoom so it starts only when the screen bottom is above y ≈ 487. Diners sit in front of the lower door (heads from y ≈ 480) and must be out of frame before the leaves move. If the doors or the diners move, update `DOOR` / `SWING`.
- Kitchen: only `K0`. Any framing works, as long as zoom 2.1 around (880, 470) stays inside the art.
- Neither scene's `belt` data is read.
