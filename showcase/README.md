# One-page Jiro demo gallery

The gallery keeps five tabs at the top while displaying each selected site below. Demo 3 shows the Demo 1 build with an explicit duplicate notice because their selected 3D sites are byte-identical; no separate Demo 3 build is invented.

From the repository root, build the four distinct sites, one at a time:

```bash
cd demo1/site && npm ci && npm run build && cd ../..
cd demo2/restaurant && npm ci && npm run build && cd ../..
cd demo4/restaurant && npm ci && npm run build && cd ../..
cd demo5/site && npm ci && npm run build && cd ../..
node showcase/serve.mjs
```

Open `http://localhost:3200/`. The server keeps all four sites on one origin, supports MP4 byte-range requests for Safari, and serves the gallery. The tabs load one site at a time. A tab hash such as `/#demo5` opens a selected demo. The third tab shows Demo 1 again, with the duplication clearly labeled.

Demo 1 requires WebGL2. If a browser does not support it, its saved seven-scene reel loads automatically in the same tab.

Use `PORT=<number> node showcase/serve.mjs` to choose another port. The demo apps and their saved content are unchanged by the gallery.
