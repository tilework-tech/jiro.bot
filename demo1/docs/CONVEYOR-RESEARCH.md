# How the belt's slats turn corners

The belt is built like an airport baggage carousel with overlapping slats.

- **Mechanism:** each slat hangs off a chain pin on the centerline and is tilted slightly nose-down. Its front tucks under the slat ahead. On a curve the slats pivot about their pins, so they pile up on the inside of the turn and fan open on the outside. There are never any gaps. (EP2669218A1, US3718249A)
- **Numbers used:**
  - Pitch is 0.22 × belt width (source range: 0.2–0.25 W).
  - Straight-run overlap is at least W·p / (2R). US20120145519A1 gives a maximum overlap of 96 mm on an inside turn.
  - Centerline radius is at least 1.2 × belt width. Real carousels use 0.9–1.2 m on a ~1 m slat.
- **Plan-view shape:** convex leading edge, concave trailing edge, as in crescent pallets (US6186314).
- **Code:**
  - `site/src/belt.ts` → `Slats`: one slat per pin, each aimed along the chord to the next pin.
  - The corners on the coarse path are rounded so the radius stays above the minimum.

Sources:
- https://patents.google.com/patent/EP2669218A1/en
- https://patents.google.com/patent/US3718249A/en
- https://patents.google.com/patent/US20120145519A1/en
- https://patents.google.com/patent/US6186314
- https://www.airport-technology.com/products/crescent-pallet-carousel/
- https://www.cs-conveyor.com/76-sushi-chains-product/
