# office → dining

**Route:** the belt leaves the office through its right wall, tunnels through the dark office-side post, crosses the wall's built-in aquarium in a glass tube (koi, goldfish, and a wide-eyed pufferfish watch the sushi go by; plaque: "STAFF AQUARIUM, not on the menu"), then dives into the honey-wood dining-side post and comes out on the dining ledge.

**How it works:** a side-scrolling dollhouse-cutaway pan. Office (world x 0–1920), wall art (`public/art/tr/office-dining/wall.jpg`, about 926×805 world px starting at x=1920), and the dining room (drawn at 1/1.55 so its belt lines up with the office belt) sit side by side. The camera zooms 1→1.55 (by t≈0.6) while panning (smoothstep over the whole t), so plate size and speed on screen stay continuous. Path A = office belt extended (key `office`), path B = dining belt extended backwards (key `dining`, phase offset). The wall width is nudged by ±75 px so that both paths hand plates over at the same moment, hidden inside the dining-side post. The first and last 6% of t cross-blend into the real `drawScene` frames, so the endpoints match exactly (verified: only DOM overlays and the rail differ).

**Scene art requirements (stage coords):**
- Office: the belt must end on the right edge, horizontal, at y≈955 (the last point of `office.belt.pts`). The right edge (x≈1780–1920, y≈880–1080) should read as the belt going into the wall: dark wood, no bright object cut off at the edge. The bottom rows (y≈1076–1080) get stretched ~150 px downward during the zoom, so keep them plain floor or wood.
- Dining: the belt must enter from the left edge, horizontal, at y≈824, scale 1.55 (the first point of `dining.belt.pts`). The left edge (x 0–60) sits against the honey-wood post, so warm wood or plaster reads best. The painted second belt in the current dining art should go (only one belt).
- Both are read from the scene defs at load time. If y or scale changes, the layout adapts. If the office belt's y moves far, the tank landmarks (F_BELT) need a retune.

**Length:** 2.0 viewport heights.
