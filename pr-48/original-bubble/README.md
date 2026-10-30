# PR #48 — Original bubble favicon proof

Asset commit: `fab0b844ad595d80a45ce93b8abb310870a54921`.
Options source: `favicon/options-20261030` at `2fe78f4276616b33aa5c2c580cc9078d0a87f473`, `favicon-options/01-bubble/`.

The unchanged source-branch `favicon-options/render.mjs` regenerated option 1 through the session's headed Chrome canvas pipeline. Regenerated files and all seven installed assets are byte-identical to the committed option 1 files. `verify-pixels.py` additionally decodes PNG and all ICO frames to check RGBA equality, original colors and transparency. All 13 checks pass. Scratch scripts originally run from `.local/pr-proof/` in the asset checkout.

The two browser-tab PNGs capture the actual X11 desktop with the local site in Chrome, after selecting Chrome's Light or Dark appearance setting. They are not DOM tab mockups or page-only screenshots. Original 2560x1600 desktop captures are preserved without image edits. The theme was restored after capture. `favicon-16px.png` is the exact installed export.

Validation on the final asset tree:

- Browser: 98 passed, 0 failed, 0 skipped, using the existing headed Chrome over CDP.
- Python: 64 passed, 0 skipped, with ffmpeg installed and CI=1.
- Lint: 26 pages passed.
- Copy-editor HTTP: 7 passed.
- Copy-editor browser: real desktop/mobile editing, persistence, discard, diff and stale-save protection passed in its isolated temporary repository.
- Independent asset review: no blockers; exactly seven requested files changed.

The repository has no PR check workflow; GitHub reported no checks and a CLEAN merge state. Deployment is manual-dispatch only and was not run.
