# jiro.bot

Static site for jiro.bot: a hand-written landing page (the marketing design with an early-access sign-up pop-up) plus generated comparison pages (alternatives, head-to-head comparisons, switching guides, best-of lists) for answer-engine optimization (AEO).
The landing page, copy editor and sign-up Lambda were consolidated here from the private `tilework-tech/jirobot-site` repo, which is archived. The previous interactive site work is preserved on the `backup/jiro-site-2026-10-09` branch (and `jiro-site`, which open PRs target).

| Path | What it is |
|---|---|
| `site/` | Everything published to jiro.bot, synced as-is. Hand-written: `index.html` with `css/`, `js/` (`main.js` animation, `jiro-pixels.js` pixel art, `early-access.js` pop-up, `hero.js` hero line and carousel), `fonts/`, `img/`, `video/`, and `confirmed.html`, `link-expired.html`, `privacy.html`. Generated and committed: `alternatives/`, `compare/`, `switch/`, `best/`, `assets/pages.css`, `llms*.txt`, `sitemap.xml`, `robots.txt`. Never put docs or other non-public files here |
| `content/` | TOML records the generated pages are built from, plus the content rules editors must follow. See [content/docs.md](content/docs.md) |
| `build.py` | Stdlib-only generator, `content/` -> `site/`. Owns one directory per page family under `site/` and rebuilds them from scratch; leaves hand-written files alone |
| `tools/` | Pre-publish lint, LLM grader, AEO probe, overlap check, AEO preview server. See [tools/docs.md](tools/docs.md) |
| `tools/copy-editor/` | Landing-page preview server with an optional inline copy editor. See [tools/copy-editor/docs.md](tools/copy-editor/docs.md) |
| `lambda/early-access/` | Sign-up and confirm Lambda. See [lambda/early-access/docs.md](lambda/early-access/docs.md) |
| `aeo/` | Dated grader and probe results |
| `tests/` | Black-box tests of `build.py` and `tools/lint.py`; `tests/browser/` holds Playwright tests of the pop-up and hero |
| `infra/site.cfn.yaml` | CloudFormation stack `jiro-bot-site` (S3, CloudFront, ACM, Route 53, deploy role) |
| `infra/early-access.cfn.yaml` | CloudFormation stack `jiro-bot-early-access` (SES identity, Lambda, HTTP API) |
| `.github/workflows/deploy.yml` | Manual-dispatch site deploy from `main` |

Python 3.11+ (for `tomllib`) for the generator and tools; Node 22 for the Lambda and browser tests.

```bash
python3 build.py                     # regenerate site/ from content/
python3 tools/lint.py                # must pass before publishing; also fails if site/ is stale
cd tests && python3 -m unittest      # generator and lint tests
python3 tools/serve.py               # preview all of site/ on :4310 with extensionless URLs
python3 tools/copy-editor/server.py --port 4100          # preview the landing page
python3 tools/copy-editor/server.py --port 4100 --edit   # ...with the inline copy editor

cd tests/browser && npm install && npm test              # pop-up and hero browser tests (Playwright)
cd lambda/early-access && npm install && npm test        # Lambda tests (no network)
python3 -m unittest discover -s tools/copy-editor/editor -p 'test_*.py'   # copy-editor HTTP tests
node tools/copy-editor/editor/browser-test.mjs           # copy-editor browser checks (needs nori-browser)

# Need GEMINI_API_KEY; write results into aeo/
python3 tools/grade_page.py [slug ...] > aeo/grades-$(date +%F).jsonl
python3 tools/aeo_probe.py [runs]      > aeo/baseline-$(date +%F).json
python3 tools/overlap.py site/compare/devin.html reference.html
```

In a Nori Session, background the preview server (`setsid nohup python3 tools/copy-editor/server.py --port 4100 > /tmp/jiro-copy-server.log 2>&1 < /dev/null &`) and open the session's `/port/4100/` URL.

## Landing page

`site/js/main.js` renders a frame every 100 ms and only writes to the DOM when a region's output changes. Regions are marked in the HTML with `data-px` (pixel faces such as the header logo, the reserve-panel sushi counter and the footer wordmark), `data-text` / `data-list` (counting stats and growing lists in the comparison and feature panels) and `data-bind`. The HTML ships with still values, and visitors with reduced motion get a still frame of every region.

The design is drawn at 1440px; the "Responsive" block at the end of `site/css/styles.css` steps down at 1180px, 900px (dropdown menu from `initMenu`, stacked sections, sideways-scrolling compare table) and 420px.

The hero is kept calm. Its right panel (`.hero-media`, carbon `#161616` with structural grays, so nothing competes with the static orange cursor) holds two things driven by `site/js/hero.js`:

- "You just hired …" shows "an engineer.", "a reviewer.", "a doc writer.", "an on-call." once, about 2.6s each with a 200ms fade, then rests on "Jiro." The HTML already says "Jiro.", so no-JS and reduced-motion visitors see the end state. It waits while the tab is hidden. The animated line is aria-hidden; screen readers get the full sentence from a `.sr-only` paragraph.
- A three-example carousel (On-call, Multiplayer, RBAC) following the WAI-ARIA APG tabbed carousel: dots are labelled tabs, Left/Right/Home/End move between them, there is one tab stop and selection follows focus. It never auto-advances. The crossfade is 200ms (off under reduced motion), and a pause/play button satisfies WCAG 2.2.2.

Carousel videos are dropped in without code changes: `site/video/carousel/{oncall,multiplayer,rbac}-{desktop,mobile}.mp4` plus `{name}-poster.jpg`. The script picks the mobile cut at 900px and below (re-picking when the breakpoint is crossed), loads only the active example, and under reduced motion loads nothing until play is pressed. The frame is 5:4 and at most 560px wide on desktop, full-width 4:5 on mobile, with `object-fit: cover`; posters are shared by both cuts, so keep their content center-safe. The posters in the repo are marked PLACEHOLDER stills, and until the mp4s land the browser gets a 404 and keeps the poster up.

The retired looping hero video (Jiro hero v25) and its render scripts live on the `video/hero-loop-v1` branch.

Still placeholder: "Lorem ipsum section title.", the 01/02/03 feature text, the compare table's "Feature Row title" / "Lorem ipsum" rows, and the FAQ answers in [BRACKETS].

## Early access

Every "Get early access" link opens a pop-up asking for name, work email and organization, which posts to the URL in `<meta name="early-access-endpoint">` (the live HTTP API). Visitors join the list only after clicking the emailed link and pressing "Confirm my spot" (opening the link alone does nothing, so mail scanners can't confirm); they land on `confirmed.html` or `link-expired.html`.

Deploy only by dispatching the GitHub Actions workflows, after approval. Architecture and known gaps: [docs.md](docs.md).
