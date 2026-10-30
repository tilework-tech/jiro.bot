# PR #54 proof

Reviewed removal commit: 53caeecb614950342fb056b933441189c5fbe4f1; base: 5eb9fe7e0e4ba166595b455fd85b0f445ff3e115.

All 100 remaining browser tests pass (122 baseline registrations minus 22 buddy tests), Python 64/64 with no skips, copy-editor HTTP 7/7, copy-editor browser PASS, lint 26 pages PASS. Logs included. The initial browser foreground process was terminated after 87 passing tests; a complete detached rerun passed all 100. The copy-editor browser check hit a save/reload timing race when run concurrently and passed unchanged when rerun alone.

22 PNGs: ten section views and one full-page capture at each of 1440 and 390 pixels. Normal motion enabled. Sections include hero, compare, why, features, all three individual feature stories, pricing, faq, reserve. The browser report records no buddy elements/requests, no overflow and no JavaScript exceptions. Three shared pixel-art regions remain.

Known baseline issue: unchanged styles.css requests ignored, missing Sohne-Buch.woff2 and Sohne-Halbfett.woff2. Their 404s remain explicitly in browser-proof.json. No missing script or missing element errors occurred. General Sans work is separate PR #53.

To reproduce captures: place capture.mjs at .local/pr-proof/capture.mjs in a checkout with tests/browser dependencies installed, start the preview server on port 4100 and session Chrome on CDP 9222, then run node .local/pr-proof/capture.mjs. The preview uses the real site. No live sign-up API is submitted. Open index.html to select captures and adjust zoom.
