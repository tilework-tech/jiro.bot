# office → dining

**Route:** the belt leaves the office through its right wall into a dark arched mouth in the office-side post, crosses the wall's built-in staff aquarium in a glass tube, then dives into the honey-wood dining-side post and comes out on the dining ledge. Plaque: "STAFF AQUARIUM, not on the menu".

**How it works:** a side-scrolling dollhouse-cutaway pan. Office (world x 0–1920), wall art (926×805 world px starting at x=1920) and the dining room (drawn at 1/ZD = 1/1.55 so its belt lines up with the office belt) sit side by side. The camera zooms 1→1.55 (by t≈0.6) while panning (smoothstep over the whole t), so plate size and speed on screen stay continuous. The first and last 6% of t cross-blend into the real `drawScene` frames.

**Belt continuity (v3):** path A = office belt extended to XS (centre of the dining-side post), drawn with `beltPhase("office")`; path B = dining belt extended backwards to XS, drawn with `beltPhase("dining", −E)`. `gap` = belt length between the office belt's end and the dining belt's start = `(XS − 1940) + E` ≈ 886.6. So A's end and B's start are the same global plate at the same moment (align.mjs delta 0), hidden inside the post. No item swap any more.

**Aquarium life:** `wall-empty.jpg` is `wall.jpg` with the fish, bubbles and weeds painted out (harmonic inpainting, numpy/scipy); the fish (`koi1/2`, `gold1/2`, `minnow1/2`), `puffer` and `weed0–3` are RGBA sprites cut from the same art, so the look is unchanged. `wall.jpg` is kept only as the source for re-cutting.
- Koi drift in slow loops with a lazy head turn; goldfish and minnows cruise back and forth, narrowing through an edge-on view when they turn.
- Weeds sway (row-sliced shear, tip moves most).
- Pufferfish bobs, flutters a fin, and puffs up to 1.45× once per loop (at 15 s).
- Treasure chest (in front of the tube, on the gravel) opens its lid every 8 s and burps three bubbles.
- A tiny Jiro diver figurine (copper dome, hachimaki, blue eyes, indigo happi) blinks and blows a dome bubble every 4 s.
- A snail crawls along the front glass under the water line (12 s each way) with a faint slime trail.
- Background bubble columns, water-line glints, breathing light.

**Wall-cavity life:** five soot sprites: a runner carrying a rice grain along the top of the tank frame (stops, looks around, runs on, vanishes into the posts), one peeking from behind a rafter upright, one asleep on the cabinet ledge (z's; opens its eyes every 12 s), one on the office-side post above the tunnel mouth that scrambles up to a copper peg when a plate approaches, and a pair of eyes in a knot hole of the honey post. Plus dust motes in the rafters and a swaying cobweb.

**Egg:** `od-fugu`: click the pufferfish (DOM hotspot tracks it) and it puffs right away.

**Scene art requirements (stage coords):**
- Office: the belt must end on the right edge, horizontal, at y≈955 (the last point of `office.belt.pts`). The bottom rows (y≈1076–1080) get stretched ~150 px downward during the zoom, so keep them plain floor or wood.
- Dining: the belt must enter from the left edge, horizontal, at y≈824, scale 1.55 (the first point of `dining.belt.pts`).
- Both are read from the scene defs at load time; if y or scale changes the layout adapts (gap included). If the office belt's y moves far, the tank landmarks (F_BELT) need a retune.

**Length:** 2.0 viewport heights.
