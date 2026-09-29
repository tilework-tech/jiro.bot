# kitchen → storage: the descent

**Route:** the camera follows the plates straight down the right lane (x = 1770). They go down the kitchen's steel sushi lift, through a riveted steel sleeve in the kitchen floor (it has a pressure gauge and a rubber flap), and into the dollhouse cross-section between the floors. On the way down they pass the Nezumi mouse family's flat (matchbox beds, thimble table, candle), a heap of sleepy dust bunnies, lost chopsticks, a forgotten rice sack and a dripping faucet. The belt rides open on wall brackets, then goes through a collar in the storage ceiling beam and out of the storage ceiling hatch.

**Camera:** this is one vertical dolly. From t 0 to 0.46 it leans into the floor hatch: zoom up to 1.24, it hugs the lane, rolls 0.01 rad, and pitches down using a keystone around the lane, so the near top rows get wider and the belt stays a straight line. From 0.46 to 0.54 it holds almost still on the full cross-section (kitchen, crawl space, storage), which is when the eggs can be clicked. Then it keeps going down into the storage room with a small lean-in and a level-out pitch. A near layer at 1.8× parallax sweeps past the lens: a sagging cloth cable with a dust bunny hanging off it on a cobweb thread, and a copper pipe with a red valve.

**Length:** 1.4 viewport heights.

## How it works
- World space is kitchen stage space extended downward. The kitchen frame sits at y 0. `between.png` (1920×632) sits at y 1080. The storage frame sits at y OY = 1686. OY − 30 ≡ 1080 (mod 72), so plate spacing runs straight through.
- The band belt runs from (1770, 1100) to (1770, OY + 40). It uses key `"storage"` and phase `OY + S0 − 1100`, so its plates and seams are the storage belt's own. The item change (kitchen key → storage key) happens hidden inside the floor sleeve.
- At t = 0 and t = 1 the render is exactly `drawScene(from/to)`. Near the ends, the seam shading and the sleeve lip fade in/out with smooth(). A canvas diff shows only the per-load plate items changing.
- Eggs: `ks-mice` and `ks-bunnies` are DOM hotspots that track the camera, live for t 0.2–0.8.
- Art: `kitchen-storage/build_art.py` builds `between.png` from a Gemini still (AR 21:9, refs kitchen.jpg + storage.jpg + canon). It crops the band, patches the lane column, snaps to a 4 px grid and uses a 160-colour palette. The sleeve, brackets, collar, drip and near layer are canvas pixel art in `kitchen-storage/props.ts`.
