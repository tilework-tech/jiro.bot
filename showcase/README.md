# One-page Jiro demo gallery

The gallery keeps four tabs at the top: Demo 1, Demo 2, Demo 4, and Demo 5. Demo 3 was removed because it duplicated Demo 1. Existing demo numbers are preserved.

From the repository root, build the four distinct sites, one at a time:

```bash
cd demo1/site && npm ci && npm run build && cd ../..
cd demo2/restaurant && npm ci && npm run build && cd ../..
cd demo4/restaurant && npm ci && npm run build && cd ../..
cd demo5/site && npm ci && npm run build && cd ../..
node showcase/serve.mjs
```

Open `http://localhost:3200/`. The server keeps all four sites on one origin, supports MP4 byte-range requests for Safari, and serves the gallery. The tabs load one site at a time. A tab hash such as `/#demo5` opens a selected demo.

Demo 1 requires WebGL2. If a browser does not support it, its saved seven-scene reel loads automatically in the same tab.

Use `PORT=<number> node showcase/serve.mjs` to choose another port. The demo apps and their saved content are unchanged by the gallery.
