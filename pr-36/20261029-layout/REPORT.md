# Responsive layout sweep

Baseline: c6127cb (main). Tested PR head: 1df28f7a720ff963c6e74dba617739f3fe91a44a. Chromium, CSS pixels, 1000px viewport height, bundled JetBrains Mono and the documented Helvetica/Söhne fallback. Full-page and hero screenshots use reduced motion for repeatable poster frames; ordinary-motion playback and interactions are checked separately. No production form submitted. All three actual MP4 examples were also played at 1440 and 390: desktop 1200×960 and mobile 720×900; zero script errors.

## Fixed

- Hero: `space-between` separated the eyebrow from the headline by 1093.5px at 3440 and 598.75px at 2560. Centering the copy stack retains its 48px internal gap and responsive padding. No motion added.
- Removed the animated strip from the end of AI slop, including markup, screen-reader companion, CSS, message array, timing/renderer code, unused escaping helper, two obsolete browser tests, and docs references. The navigation IntersectionObserver and pixel-art timer are unrelated and remain.
- Removed the separate static subscription note after pricing. Pricing now meets FAQ across the normal green frame (12px desktop / 8px mobile). These were two separate strips in the source.
- Bake-off fixed 65px rows let Agent content overlap the following row by 10.56px at 901 and 29.45px at 900/768/390; the Cloud row also overflowed at 390. Rows now grow from a 65px minimum.
- Mobile bake-off wordmark crossed its column by 2.8px. Narrower header padding keeps the same logo inside its column.

## Flagged for Martin — unchanged

- 2560/3440: full-width carousel and square How-it-works panels become very large, with substantial whitespace around small copy. Fits without clipping; choosing a maximum content width would change the design.
- 1920–3440: the slop title's capped, auto-margined heading sits toward the right while the demo stays centered. Text remains readable; alignment is a taste decision.
- 768/900: existing 4:5 mobile video produces a tall portrait hero, especially at 900. Fits without distortion; changing the video breakpoint or size needs a design decision.
- 901: pricing wraps to two cards plus a full-width Enterprise card just before all three stack at 900. Working wrapping behavior, but a distinct visual transition.

## Per-width review

| Width | Result |
| --- | --- |
| 3440 | Hero centered; no page overflow. Ultra-wide scale/whitespace and slop-heading alignment flagged. |
| 2560 | Hero centered; no page overflow. Same wide-scale choices flagged. |
| 1920 | Hero centered; no page overflow. Slop-heading alignment flagged. |
| 1440 | Original desktop composition retained; pricing connects directly to FAQ. |
| 1180 | Laptop typography and columns fit. |
| 1024 | Copy wraps within columns; pricing stays three columns; nav and FAQ fit. |
| 901 | Desktop breakpoint fits; table internally scrolls; row overlap fixed. Pricing 2+1 layout flagged. |
| 900 | Mobile stacking/menu begins; row/logo overflow fixed. Tall portrait carousel flagged. |
| 768 | Stacked sections fit; row/logo overflow fixed. Tall portrait carousel flagged. |
| 390 | Mobile page fits; table alone intentionally scrolls. Row/logo overflow fixed. |

Reviewed hero/carousel, nav, bake-off, How-it-works panels, slop row, pricing, FAQ/black split, footer. Zero document horizontal overflow at every requested width. Known Söhne font 404s are documented: licensed font files are intentionally absent; fallback typography was used. No additional asset or page-script errors observed during the stable sweep.

## Validation

- New layout regression: 10/10 passed (observed red before implementation, green after).
- Python unittest: 63/63 passed, zero skips, including video contracts.
- Browser npm test: 65/65 passed, zero skips. Tests run sequentially. Local NODE_OPTIONS bridge redirects existing chromium.launch calls to the session's headed CDP browser; no source test behavior is bypassed.
- tools/lint.py: passed all 26 generated pages; no staleness, so build.py unnecessary.
- git diff --check: passed.
- Repository has only manual-dispatch deployment workflows; no pull-request CI is configured. No deployment dispatched.
