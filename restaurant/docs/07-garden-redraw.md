# Garden-grid redraw

The September 30 revision redraws every room and every belt passenger in code, using the final garden as the pixel-scale and palette reference. It retains the eight-room route and all seven camera transitions.

- `src/art/pixels.ts`: shared 240×135 grid (eight stage units per art pixel), integer drawing primitives and garden-derived palette.
- `src/art/rooms.ts`: original bar, office, dining, kitchen, storage/pantry, bicycle street and pond drawings. Jiro, patrons, curtains, steam, plants, fish shadows and water animate on this grid. Pantry is intentionally the same physical storage room, with its existing MCP overlay.
- `installGardenArt` replaces both backgrounds and old image-fragment ambient hooks. The pond retains its belt-driven fate logic, composited on the common grid. Generated replacement transition images retain native dimensions so existing crop coordinates, wall passages and plate phases still work. Aquarium inhabitants and koi frames are also redrawn.
- `src/art/passengers.ts`: 24×24 source sprites with one outline/palette. The belt composites tread, plates, passengers and bubbles at four stage units per pixel. Full-precision path positions remain independent of rasterization.
- Item selection chooses the category before the item: 60% normal, 35% absurd, 5% clever. New items cannot dilute those shares. Selection depends only on the global plate ID, including negative IDs.
- Occupancy uses symmetric irregular full/empty runs, averaging 50% occupied slots. Adjacent blocks can create longer gaps. Occasional falls reduce the population slightly toward the end of the route.
- Clever sushi have extra bounded along-belt movement, hopping, tilting and thought bubbles; they initiate neighbor chats more often. Existing drag, park, walking-plate, easter-egg and Flappy Koi behavior remains.

## Validation

Run `npm run build` in `restaurant`. For the browser regression, run `npm ci` in `restaurant/tools`, then `node qa/garden.mjs` with an existing headed Chromium CDP endpoint on port 9222 (`CDP_URL` overrides it). Start the Vite dev server first; the test imports development modules to verify population and art-grid invariants.

The regression checks 100,000 slots and their category mix, global phase continuity, movement in every room, every scene and all transition endpoints/midpoints, real pointer drag/parking, koi handoffs, Flappy Koi start/close, live cache-busting URLs, and landscape/portrait phone views. It saves screenshots and JSON in the ignored `.local/pr-proof/` directory.

Legacy generated assets and scene-specific drawing code remain in the repository for historical reference. They are bypassed by the installed art renderer; the old chapters and screenshots are not the current visual specification. Product/MCP DOM panels keep their existing content and interaction design. Safari has not been validated.
