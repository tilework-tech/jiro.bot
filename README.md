# jiro.bot

Static site for jiro.bot: a hand-written landing page (the marketing design with an early-access sign-up pop-up) plus generated comparison pages (alternatives, head-to-head comparisons, switching guides, best-of lists) for answer-engine optimization (AEO).
The landing page, copy editor and sign-up Lambda were consolidated here from the private `tilework-tech/jirobot-site` repo; archiving that source repo is pending approval. The previous interactive site work is preserved on the `backup/jiro-site-2026-10-09` branch (and `jiro-site`, which open PRs target).

| Path | What it is |
|---|---|
| `site/` | Everything published to jiro.bot, synced as-is. Hand-written: `index.html` with `css/`, `js/` (`main.js` page behavior, `features.js` scroll walkthroughs, `jiro-pixels.js` pixel art, `early-access.js` pop-up, `hero.js` hero carousel), `fonts/`, `img/`, `video/`, and `confirmed.html`, `link-expired.html`, `privacy.html`. Generated and committed: `alternatives/`, `compare/`, `switch/`, `best/`, `assets/pages.css`, `llms*.txt`, `sitemap.xml`, `robots.txt`. Never put docs or other non-public files here |
| `content/` | TOML records the generated pages are built from, plus the content rules editors must follow. See [content/docs.md](content/docs.md) |
| `build.py` | Stdlib-only generator, `content/` -> `site/`. Owns one directory per page family under `site/` and rebuilds them from scratch; leaves hand-written files alone |
| `tools/` | Pre-publish lint, LLM grader, AEO probe, overlap check, AEO preview server. See [tools/docs.md](tools/docs.md) |
| `tools/copy-editor/` | Landing-page preview server with an optional inline copy editor. See [tools/copy-editor/docs.md](tools/copy-editor/docs.md) |
| `lambda/early-access/` | Sign-up and confirm Lambda. See [lambda/early-access/docs.md](lambda/early-access/docs.md) |
| `video/carousel-src/` | Sources and render scripts for the hero carousel videos in `site/video/carousel/`. See [video/carousel-src/README.md](video/carousel-src/README.md) |
| `aeo/` | Dated grader and probe results |
| `tests/` | Black-box tests of `build.py`, `tools/lint.py` and the carousel video contract (`test_carousel_videos.py`, which needs ffmpeg); `tests/browser/` holds Playwright tests of the pop-up, hero and landing-page sections |
| `infra/site.cfn.yaml` | CloudFormation stack `jiro-bot-site` (S3, CloudFront, ACM, Route 53, deploy role) |
| `infra/early-access.cfn.yaml` | CloudFormation stack `jiro-bot-early-access` (SES identity, Lambda, HTTP API) |
| `.github/workflows/deploy.yml` | Manual-dispatch site deploy from `main` |
| `.github/workflows/deploy-early-access.yml` | Manual-dispatch Lambda code deploy from `main` |

Python 3.11+ (for `tomllib`) for the generator and tools; Node 22 for the Lambda and browser tests.

```bash
python3 build.py                     # regenerate site/ from content/
python3 tools/lint.py                # must pass before publishing; also fails if site/ is stale
cd tests && python3 -m unittest      # generator, lint and carousel video tests (video tests need ffmpeg)
python3 tools/serve.py               # preview all of site/ on :4310 with extensionless URLs
python3 tools/copy-editor/server.py --port 4100          # preview the landing page
python3 tools/copy-editor/server.py --port 4100 --edit   # ...with the inline copy editor

cd tests/browser && npm install && npm test              # pop-up, hero and landing-page browser tests (Playwright)
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

`site/js/main.js` renders the pixel art (`data-px`) and typing bar (`data-typing`) every 100 ms and only writes to the DOM when a region's output changes. The HTML ships with still values, and visitors with reduced motion get a still frame of these regions. The feature walkthroughs have a separate scroll controller.

The typing bar's messages are the `TYPING_MESSAGES` array in `main.js`; edit that list to change them (it also fills the screen-reader text, so the HTML copies are only the no-JavaScript fallback). "Jiro vs. AI slop" keeps its numbered steps in a compact horizontal row above the diff panels. `initSlop` divides the section into equal progress bands: as the viewport center crosses each band, it marks the corresponding step with `aria-current="step"` and mirrors it on `data-at`. CSS changes the pull requests’ emphasis without a timer. At 900px and below the diff panels stack and both remain visible. Reduced motion selects the final step; without JavaScript, all copy and both diffs remain visible.

"How it works" (`#features`) contains complete, fictional interface stories in [site/index.html](site/index.html): an overnight alert progressing from a Slack instruction through terminal work and a PR to morning approval; Priya, Kira and Sam sharing a session across desktop Slack, phone Slack and a laptop terminal; and a shared thread where Jordan receives an access refusal while Rae gets the root cause and fix PR. [site/js/features.js](site/js/features.js) changes only emphasis, highlighting the demo region nearest the viewport center. There are no feature timers or videos. Each step is a keyboard-accessible link; activating it scrolls to its corresponding demo region and retains focus on the link.

The section uses the original alternating box form: white `.ftext` panels beside orange, green and dark-green `.fimg` demo panels, separated by the black grid. The colored panels are square where content fits and grow to keep the complete stories readable. Compact step links sit with the narrative text; panels scroll normally rather than sticking beside a long step runway. At 900px and below, every story stacks text first, then demo. Without JavaScript or with reduced motion, the full examples remain readable as static stories; changing the motion preference updates emphasis immediately. Keep each story's steps, links and demo regions in matching order. The `.fpanel` class on each demo keeps fictional interface text out of the inline copy editor.

The FAQ and sign-up block share a 60/40 desktop grid: white FAQ on the left, a narrower black block with compact quotes on the right. At 900px and below they stack with the FAQ first. The `#reserve` section is a named sign-up region: customer quotes lead directly into the work-email field and orange early-access button, which opens the existing dialog. The pixel-art counter is driven by `main.js`. Its quotes come from two customers: Alex (CTO, Corvus) and Danny (CTO, Miravoice), from their published case studies on noriagentic.com (https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html and https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html), with Nori renamed to Jiro, reused with Martin's approval. Keep one quote per company.

The design is drawn at 1440px; the "Responsive" block at the end of `site/css/styles.css` steps down at 1180px, 900px (dropdown menu from `initMenu`, stacked sections, sideways-scrolling compare table) and 420px.

The hero’s right panel (`.hero-media`) and carousel stage are white. The video fills the panel width without surrounding padding or dark chrome. [site/js/hero.js](site/js/hero.js) controls the example carousel (On-call, Multiplayer, RBAC), following the WAI-ARIA APG tabbed carousel: centered dots are labelled tabs, Left/Right/Home/End move between them, there is one tab stop and selection follows focus. It never auto-advances or runs text timers. The crossfade is 200ms (off under reduced motion), and the pause/play button controls video playback.

Carousel videos are dropped in without code changes: `site/video/carousel/{oncall,multiplayer,rbac}-{desktop,mobile}.mp4` plus `{name}-poster.jpg`. The script picks the mobile cut at 900px and below (re-picking when the breakpoint is crossed), loads only the active example, and under reduced motion loads nothing until play is pressed. The frame fills the panel width at 5:4 on desktop and 4:5 on mobile, with `object-fit: cover`; posters are shared by both cuts, so keep their content center-safe. The committed clips are muted H.264 loops with shared posters, rendered from [video/carousel-src/](video/carousel-src/README.md). That source folder documents the scene stories, rendering pipeline and rebuild commands; it is outside `site/` so only the final assets are published.

The retired looping hero video (Jiro hero v25) and its render scripts live on the `video/hero-loop-v1` branch.

## Early access

Every "Get early access" link opens a pop-up asking for name and work email, which posts to the URL in `<meta name="early-access-endpoint">` (the live HTTP API). Visitors join the list only after clicking the emailed link and pressing "Confirm my spot" (opening the link alone does nothing, so mail scanners can't confirm); they land on `confirmed.html` or `link-expired.html`.

The site and Lambda were deployed independently through GitHub Actions from `main` at `9aa7db2`. On 2026-10-28 Martin tested signup, and the confirmed contact was verified in Clarify. The carousel and landing-page changes in this branch require a separate site deployment.

Deploy only by dispatching the GitHub Actions workflows from `main`, after approval: [site](.github/workflows/deploy.yml) and [early-access Lambda](.github/workflows/deploy-early-access.yml). The Lambda workflow updates code only; environment configuration belongs to the CloudFormation stack. Architecture and deployment state: [docs.md](docs.md) and [Lambda docs](lambda/early-access/docs.md).
