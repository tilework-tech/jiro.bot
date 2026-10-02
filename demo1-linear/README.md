# Demo1, linear scroll review

This is a review variant of Demo1's seven-scene site. The original `demo1/`
snapshot stays intact. This variant uses the exact archived Demo1 videos,
posters, and sushi sprites through `demo1/site/public`. Its page and belt are
adapted from the 2D Demo5 assembly, which already maps those media to the same
seven stops. It does not require WebGL.

The scroll behavior follows the direction of Demo4's sketch belt: the browser
moves straight down the document through each scene and passage. There is no
camera rotation, orbit, or automatic jump to the next stop. The single belt
keeps moving when the page rests. Any scroll direction briefly adds forward
travel to the plates, without reversing the stream.

Run from `site/` with `npm ci && npm run build`, then
`PORT=3202 node serve.mjs`. The server supports byte ranges for the MP4s.
The review link is the root path, and `?s=pond` opens the final scene.

This is a motion review, not a new production release. Demo1's original
WebGL-specific interactions are not reproduced one for one; the 2D assembly
retains clickable plates, flat-surface drops, scene hotspots, product demo,
comparison, FAQ, pricing, and koi ending. The preserved `demo1/` folder is the
source of truth for the original 3D version.
