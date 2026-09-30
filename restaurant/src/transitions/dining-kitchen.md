# dining → kitchen: straight down the belt

**Route:** the camera glides straight down the right lane (x = 1770), following the plates. They leave the dining room at its bottom edge, drop through a hatch in the dining floor, run down a wooden shaft past a dim plaster-and-brick wall (copper pipes, one hanging bulb, the smallest sushi bar in town), and go into the kitchen's ceiling hatch. The camera settles on "How Jiro compares". The camera stays at eye level the whole time: no rotation, no zoom, no POV. (Martin's request: cut the sushi cam, the turning and the rubber-duck business.)

**Length:** 1.4 viewport heights.

## How it works
- World space is dining stage space extended downward. The dining frame sits at y 0. `between.png` (1920×801) sits at y 1080. The kitchen frame sits at y OY ≈ 1882.
- The camera is a pure vertical pan. `cy = 540 + OY · (0.82·smoothstep(t) + 0.18·t)`, rounded to whole pixels so the art stays crisp.
- **Plate spacing:** OY ≡ 1120 − pathLength(dining.belt) (mod 72), and it's rounded to whole pixels. That's the value nearest the art height, so the dining plates, the band plates and the kitchen plates sit on one 72 px grid. It's computed from `dining.belt` at load, so it follows the (frozen) dining belt.
- **Band belt:** (1770, 1130) → (1770, OY + 40). It uses key `"kitchen"` and phase `OY + K0 − Y0`, so its plates, ids and slat seams are the kitchen belt's own. The item handover (dining key → kitchen key) happens hidden in the dining floor slab (y 1080–1130).
- **Draw order:**
  1. The band art and its glows, the steel brackets, and the band tread (clipped to the band).
  2. The kitchen scene, drawn at OY.
  3. The band plates whose centre is above OY. Their lower halves overlap the kitchen's own belt, so nothing is drawn twice.
  4. The dining scene, clipped to y < 1080.
  5. The hatch lip shadow, and seam shading at both room edges. The seam shading fades to 0 at t = 0 and t = 1.
- **Exact ends:** at t ≤ 0 and t ≥ 1 the render is exactly `drawScene(from/to)`. Canvas diffs of tt 0.0001 vs `dining` and tt 0.9999 vs `kitchen` are 0 px.
- **Egg:** `dk-mouse-bar`. A DOM hotspot sits on the mouse-sized sushi bar doorway (band x 1246, y 486, 170×160). It tracks the camera and is live for t 0.15–0.85.
- **Ambient:** the bulb (6 s / 4 s), the mouse bar lantern (3 s) and the door glow (8 s) breathe with `glow()`. All of these periods divide LOOP.

## Art
`dining-kitchen/build_art.py` builds `public/art/tr/dining-kitchen/between.png` from a Gemini still (gen_still.py, AR 21:9, refs kitchen.jpg + kitchen-storage/between.png). The prompt asked for a side cross-section of the floor between the dining room and the kitchen: floorboards and joists on top, a dark plaster/brick wall with copper pipes, a hanging bulb, a tiny noren doorway, an empty wooden shaft on the right, and the kitchen ceiling beam at the bottom. The script:
- resizes the still to 1920 wide
- shifts the picture 156 px right so the shaft is centred on x 1770, filling the dark left edge with its own mirror
- crops it to 801 px tall
- snaps it to a 3 px grid and a 160-colour palette

The belt, brackets and shadows are drawn on the canvas.
