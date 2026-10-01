# Final site implementation notes

The page has seven stops in this order: hero, product demo, scripted good-taste comparison, published product comparison, FAQ, pricing, and pond. Native vertical scrolling preserves one observer angle through six connecting passages. `src/main.ts` authors one document-space route; `src/belt.ts` renders that route on a Canvas 2D layer and keeps a persistent indexed stream of plates on it. There is no WebGL dependency.

## Conveyor and interaction

- Every plate uses a white disc with a near-white or pale-blue rim. Slot occupancy is a seeded 50% probability, independent of scroll and resize. Among occupied slots the category thresholds are 70% food, 20% surprises, and 10% animated food. `window.__jiro.metrics()` reports the running values for review.
- Base travel is 0.32 belt widths per second. Scroll briefly increases travel and eases back to base speed. At rest the belt does not stop. One path connects the hero kitchen window to the pond; the return happens behind the endpoint and window masking.
- Pointer clicks trigger item-specific feedback. A rare unattended plate slips into a short gravity arc and returns to its moving slot. Legged maki sprites visit an occupied neighboring plate and return on an eight-second cycle. A koi jump selects and consumes a visible sushi item from the pond crossing.
- A plate can be dragged onto authored surfaces in all seven scenes, where a served-plate overlay keeps it visible above the scene UI. It stays there until clicked to return to the conveyor. A drop into pond water produces ripples.
- The discovery counter has distinct keys for 38 small scene props, 31 belt items, the original hero props and creatures, both games, and the koi or placement actions. Scene props are real focusable buttons with unique labels and responses.

## Games and fallback

`public/games/arcade/` is copied from the documented games branch. Sushi Rush opens from the comparison table and Daily Roll opens from the pond. Each launcher uses the original playable game inside a focused dialog. The arcade can also be opened directly at `/games/arcade/?game=rush` or `/games/arcade/?game=daily`.

`/fallback/` is a separate seven-poster still review route with links to the interactive journey and both games. It needs no video, Canvas, or WebGL. The main route uses Canvas 2D and poster images behind all background videos.

## Source boundaries

The product demo and two terminal stories are labeled scripted examples. Their output is not a measured Nori result. Pricing, the comparison table, and FAQ source are documented in `CONTENT-SOURCES.md` and `../../research/PRODUCT-FACTS.md`. Product claims should be checked against https://noriagentic.com/ before publication.

## Review checks still required

The static build passes `npm run build`. A browser reviewer should verify desktop and mobile scene layout, Safari or a Safari-compatible route, asset responses, both games, drag placement, the pond koi, and full-scroll capture before distribution. The game code is mouse and touch oriented; keyboard does not play the games. Background scenes retain the supplied authored source media rather than a newly redrawn unified sprite atlas.
