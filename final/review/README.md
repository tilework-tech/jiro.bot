# Browser review evidence

Checked 2026-09-30 in the Nori session's visible Chromium browser over CDP. The production Vite build passed `npm run build` with TypeScript checking. `browser-report.json` records seven desktop stops at 1440 by 900, mobile stills at 390 by 844, six loaded background MP4s with no media error, a Canvas 2D context, and no page or HTTP errors. `interaction-report.json` records the belt slot mix, hero discovery, placed plate, clickable product demo, FAQ answer, both game dialogs and static fallback. A follow-up pointer test clicked both games' canvases and observed both cards enter their live states.

`desktop-*.png` and `mobile-*.png` are one still per stop. `desktop-koi.png` captures the leap. `full-scroll.mp4` is a 12-second, 1024 by 720, 12 fps screenshot sequence of the full journey; `scroll-contact.jpg` is a quick index. The recorded path passes all six connecting transitions without camera rotation. The physical plate stream persists while scrolling and moves at rest.

At the tested desktop width, `window.__jiro.metrics()` reported 110 slots, 58 occupied (52.7%), with 38 food, 14 surprises and 6 animated food items. This is one seeded snapshot; category probabilities in source are 70%, 20% and 10%. An actual plate drag to a counter increased the persistent placed count to one. The discovery counter exposed 99 possible keys and incremented from a hero prop.

The measured belt speed rose from 0.32 to 0.53 belt widths per second just after a 400-pixel scroll, then eases back. A forced rare-slip timer produced one plate in a physical flight state; ordinary scheduling is much slower.
At the pond, triggering the koi made the jump active, consumed one plate, and raised the discovery count from zero to one.

The MP4 server answered a byte-range request with HTTP 206. The session-host routing test returned HTTP 200 for `/`, `/fallback/` and `/games/arcade/`. All seven still images in `/fallback/` loaded. H.264 video, `playsinline`, poster stills, Canvas 2D and the static route provide a Safari-compatible path; an actual Safari engine was not available in this Linux session. No WebGL is used. First and last video frames had 45 to 54 dB PSNR at 160 by 90, indicating small loop changes, though this metric does not replace a human loop review.

This is a review build. A production publication or protected-branch merge still needs Martin's specific approval.
