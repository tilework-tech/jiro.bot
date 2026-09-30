# Demo5: Jiro.bot one-belt scroller

Saved for Martin on 2026-09-30 from the v4 review draft in PR #11:
https://github.com/tilework-tech/jiro.bot/pull/11

Source branch: `jiro-scroller-v4`. Exact source commit:
`aed728a3d43618c7bcd274c149d0722a7c644f2b`.

This is the fifth saved demo, not a fifth redesign. It preserves v4's seven scenes, continuous 2D conveyor, interactive plates, hero secrets, product walkthrough, FAQ, bicycle pricing, and koi finale.

## Run

```bash
cd demo5/site
npm ci
npm run build
PORT=4173 node serve.mjs
```

Open http://localhost:4173/. Node 22 is recommended. The byte-range server supports video playback. For the shared gallery, follow `../showcase/README.md` from this directory and open `/#demo5`.

## Preservation

- `site/src/`: unchanged v4 application source and art.
- `site/public/`: exact media from `demo1/site/public/` at the source commit. The snapshot is self-contained and does not depend on another demo's files.
- `site/docs/`: original master prompt, verbatim feedback, and product copy sources.
- `site/reference/`: full-scroll recording, scene and transition stills, and mobile capture.
- `site/qa/`: original Playwright capture and interaction scripts; retained as historical tooling.
- `site/README.md`: original v4 documentation, preserved verbatim. Its shared-media path describes the original layout; this snapshot uses local `public/` instead.
- `SHA256SUMS`: hashes for every preserved site file. Verify from `demo5/` with `sha256sum -c SHA256SUMS`.

Only `site/vite.config.ts` differs from the original v4 tree: `publicDir` points to the bundled `public/` directory and its comment describes that arrangement. No application code or media was regenerated.

## Review status

The original agent reported Chromium checks at 1440×900, 1280×720, and 390×844, including video readiness and interactions. Those captures are preserved as prior evidence; they are not new Safari or phone tests.

Safari/WebKit and real iOS touch remain unverified. Comparison panels are scripted replays; the product demo is illustrative. New mini-games remain out of scope pending prototypes and approval.

This snapshot is saved on a review branch. It is not a production deployment.

## Snapshot validation (2026-09-30)

- All 88 unchanged files match the source commit byte for byte; all 89 site-file checksums pass.
- TypeScript and Vite production builds pass for Demo5 and the other three distinct gallery sites.
- Headed Chromium: Demo5 hash selection, five-tab keyboard wrapping and End key, and layouts at 1440×900 and 390×844 pass with no page errors. Seven scene sections are present and the hero video reaches readyState 4.
- Session-host HTTP routing passes at `/demo5/`; hero MP4 byte-range requests return HTTP 206 and the requested 100 bytes.
- This archival check does not repeat the original full interaction suite or establish Safari/real-phone compatibility.

Detailed scene, transition, geometry, timing and interaction preservation: [RECREATE.md](RECREATE.md). Registry-independent playback and additional visual evidence: [preservation runbook](../preservation/README.md).
