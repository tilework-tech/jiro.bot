# street → pond: "Drains to pond"

**Route:** the street belt curves down into the kerb at x 1770 and drops through a storm drain inlet (a blue fish drain marker sits on the kerb next to it). The ground opens into a cutaway: the belt rides down a lamp-lit brick shaft, bolted to its wall, past a kappa on a ledge typing on a laptop (easter egg `tr-drain-kappa`). At the shaft floor the belt drops through a stone-lipped slot into the dark. It comes back out of a round stone culvert in a mossy garden wall, beside the little spout that feeds the creek, and runs down the wooden walkway into the pond scene's own walkway.

**Camera:** Hermite keyframes (t, cx, cy, zoom, bank) with zero velocity at both ends. It dollies in (×1.32) toward the kerb as the belt dives, cranes down into the shaft (×1.5, with a slight bank each way), pulls out past the culvert (×1.34) and settles on the pond frame. The neon dims as we go underground. Rain gives way to drips in the shaft, then to moonlight and fireflies. A screen-space near layer (big soft drops, then out-of-focus fireflies) moves at 1.6× for parallax.

**Length:** 1.4 viewport heights.

## How it works
- World space: street frame at (0,0), `public/art/tr/street-pond/drain.jpg` (1920×1000) at (0,960), pond frame at (0, PY=1812). The band is a Gemini outpaint between the two frames: registered at scale 1.144 and x −12, crisped to a 3 px grid, with the shaft interior mirrored so the lamp hangs left of the belt.
- The belt on the street side is `street.belt.pts` plus a straight run to the shaft floor. It uses the same phase and the key `street`, so it overlays the street's belt exactly. On the pond side it runs from the culvert mouth plus `pond.belt.pts` shifted by PY, keyed `pond`, and its phase continues the pond's. The item swap is hidden between the shaft floor and the culvert (world y 1478–1688).
- The scenes are drawn through `api.drawScene` into buffers, with their edges feathered only while 0 < t < 1. The t=0 and t=1 frames match the scenes (mean diff < 0.03/255).

## What the scene art must keep
- **street:** the belt leaves the bottom edge at x 1770, heading straight down. The bottom rows should stay wet pavement, because they meet the band's kerb at world y ≈ 1090.
- **pond:** the belt enters the top edge at x 1770 on a walkway about x 1705–1835 wide. The top edge has dark foliage on the left, the creek at x ≈ 1200–1530 and the bridge with Jiro. If the pond is repainted, regenerate drain.jpg the same way (composite 1920×2880, street at 0, pond at 1812, AR 2:3), then re-measure SHAFT, MOUTH_Y and the lamp.
