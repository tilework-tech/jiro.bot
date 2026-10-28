# jiro.bot

Static site for jiro.bot: a hand-written landing page (the marketing design with an early-access sign-up pop-up) plus generated comparison pages (alternatives, head-to-head comparisons, switching guides, best-of lists) for answer-engine optimization (AEO).
The landing page, copy editor and sign-up Lambda were consolidated here from the private `tilework-tech/jirobot-site` repo; archiving that source repo is pending approval. The previous interactive site work is preserved on the `backup/jiro-site-2026-10-09` branch (and `jiro-site`, which open PRs target).

| Path | What it is |
|---|---|
| `site/` | Everything published to jiro.bot, synced as-is. Hand-written: `index.html` with `css/`, `js/` (`main.js` animation, `jiro-pixels.js` pixel art, `early-access.js` pop-up), `fonts/`, `img/`, `video/`, and `confirmed.html`, `link-expired.html`, `privacy.html`. Generated and committed: `alternatives/`, `compare/`, `switch/`, `best/`, `assets/pages.css`, `llms*.txt`, `sitemap.xml`, `robots.txt`. Never put docs or other non-public files here |
| `content/` | TOML records the generated pages are built from, plus the content rules editors must follow. See [content/docs.md](content/docs.md) |
| `build.py` | Stdlib-only generator, `content/` -> `site/`. Owns one directory per page family under `site/` and rebuilds them from scratch; leaves hand-written files alone |
| `tools/` | Pre-publish lint, LLM grader, AEO probe, overlap check, AEO preview server. See [tools/docs.md](tools/docs.md) |
| `tools/copy-editor/` | Landing-page preview server with an optional inline copy editor. See [tools/copy-editor/docs.md](tools/copy-editor/docs.md) |
| `lambda/early-access/` | Sign-up and confirm Lambda. See [lambda/early-access/docs.md](lambda/early-access/docs.md) |
| `aeo/` | Dated grader and probe results |
| `tests/` | Black-box tests of `build.py` and `tools/lint.py`; `tests/browser/` holds Playwright tests of the pop-up |
| `infra/site.cfn.yaml` | CloudFormation stack `jiro-bot-site` (S3, CloudFront, ACM, Route 53, deploy role) |
| `infra/early-access.cfn.yaml` | CloudFormation stack `jiro-bot-early-access` (SES identity, Lambda, HTTP API) |
| `.github/workflows/deploy.yml` | Manual-dispatch site deploy from `main` |
| `.github/workflows/deploy-early-access.yml` | Manual-dispatch Lambda code deploy from `main` |

Python 3.11+ (for `tomllib`) for the generator and tools; Node 22 for the Lambda and browser tests.

```bash
python3 build.py                     # regenerate site/ from content/
python3 tools/lint.py                # must pass before publishing; also fails if site/ is stale
cd tests && python3 -m unittest      # generator and lint tests
python3 tools/serve.py               # preview all of site/ on :4310 with extensionless URLs
python3 tools/copy-editor/server.py --port 4100          # preview the landing page
python3 tools/copy-editor/server.py --port 4100 --edit   # ...with the inline copy editor

cd tests/browser && npm install && npm test              # pop-up browser tests (Playwright)
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

`site/js/main.js` renders a frame every 100 ms and only writes to the DOM when a region's output changes. Regions are marked in the HTML with `data-px` (pixel faces such as the header logo, the sign-up block's sushi counter and the footer wordmark), `data-list` (the on-call log and chat threads in the three feature panels), `data-typing` (the typing bar under "Jiro vs. AI slop") and `data-bind`. The HTML ships with still values, and visitors with reduced motion get a still frame of every region.

The typing bar's messages are the `TYPING_MESSAGES` array in `main.js`; edit that list to change them (it also fills the screen-reader text, so the HTML copies are only the no-JavaScript fallback). "Jiro vs. AI slop" is driven by scroll, not time: `initSlop` marks the step in the middle of the viewport with `aria-current="step"` and mirrors it on `data-at`, and CSS fades the two pull requests in. Below 900px the steps read as a plain list and both pull requests show at once.

The two quotes in the black sign-up block come from two customers: Alex (CTO, Corvus) and Danny (CTO, Miravoice), from their published case studies on noriagentic.com (https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html and https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html), with Nori renamed to Jiro, reused with Martin's approval. Keep one quote per company.

The design is drawn at 1440px; the "Responsive" block at the end of `site/css/styles.css` steps down at 1180px, 900px (dropdown menu from `initMenu`, stacked sections, sideways-scrolling compare table) and 420px.

The hero video is Jiro hero v25 (46s loop, muted H.264 web encode); its source and render scripts live on the `video/hero-loop-v1` branch.

## Early access

Every "Get early access" link opens a pop-up asking for name and work email, which posts to the URL in `<meta name="early-access-endpoint">` (the live HTTP API). Visitors join the list only after clicking the emailed link and pressing "Confirm my spot" (opening the link alone does nothing, so mail scanners can't confirm); they land on `confirmed.html` or `link-expired.html`.

Deploy only by dispatching the GitHub Actions workflows from `main`, after approval: [site](.github/workflows/deploy.yml) and [early-access Lambda](.github/workflows/deploy-early-access.yml). The Lambda workflow updates code only; environment configuration belongs to the CloudFormation stack. Architecture and deployment state: [docs.md](docs.md) and [Lambda docs](lambda/early-access/docs.md).
