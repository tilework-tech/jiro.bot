# storage → yard

**Route:** the camera follows the storage belt down-right out of frame into the dark
corner by the back door, where the belt curves along the floor and climbs into a
copper cat flap (a large, deeply unimpressed ginger cat sits beside it and blinks
slowly). The flap opening turns into a window onto the moonlit yard and grows until
it fills the frame, then the camera pulls back out of the yard hatch.

**Length:** 1.6 viewport heights.

**Timeline (t):** 0–0.5 pan along the belt (one continuous world: door panel
`public/art/tr/storage-yard/door.jpg` sits beyond the storage frame's bottom-right,
offset so its entry point (120,860) meets the storage belt exit) · 0.38–0.64 push in
on the flap, cat fills the right half · 0.5–0.58 the yard fades in inside the flap
opening · 0.56–0.76 the opening grows to full frame · 0.62–1 yard pull-out (zoom
2.4 → 1). A light cool moonlight bloom peaks around t≈0.64.

**Continuity:** door-panel plates use key `storage` and phase `storagePhase − U_storage`,
so the same items continue from the storage exit at BELT_SPEED. The flap's swing
follows the plates as they reach it.

## What the scene art must keep

- **storage:** the belt exits at the **bottom-right corner** (last belt pt ≈ (1935,1070),
  heading down-right). The panel offset, pan direction and seam are all computed from
  the last two `storage.belt.pts`, so other angles work too. The bottom band
  (y > 860, below the belt) and the right edge (x > 1700, above the belt) get faded
  to dark during the pan. Keeping them dark/low-detail makes the seam invisible.
- **yard:** the belt must **start at a small hatch low on the restaurant's back wall on
  the left**, `yard.belt.pts[0]` ≈ (100,800), read at runtime. The first frames of the
  pull-out frame the area (0–800, 635–1080) at 2.4× zoom, so keep that corner clean
  and readable (the hatch, the belt emerging, the sink base). A small cat-flap-style
  frame or rubber strip on that hatch would complete the rhyme with the inside flap.
