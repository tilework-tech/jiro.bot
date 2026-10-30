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
python3 tools/fetch_fonts.py         # fetch verified General Sans assets before previews/browser tests
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

Browser tests can attach to an existing session Chrome through `PLAYWRIGHT_CDP_URL`; for example, run `PLAYWRIGHT_CDP_URL=http://127.0.0.1:9222 npm test` from `tests/browser/`. Without the variable, Playwright launches its own browser.

In a Nori Session, background the preview server (`setsid nohup python3 tools/copy-editor/server.py --port 4100 > /tmp/jiro-copy-server.log 2>&1 < /dev/null &`) and open the session's `/port/4100/` URL.

## Landing page

The site uses self-hosted General Sans from Fontshare for sans-serif UI text, with normal weights 400, 500, 600 and 700 and `font-display: swap`. [The main stylesheet](site/css/styles.css) loads `site/fonts/GeneralSans-{weight}.woff2`; [build.py](build.py) emits the matching declarations into [the generated page stylesheet](site/assets/pages.css). JetBrains Mono remains on code, terminal mockups and the existing monospace UI.

The Fontshare license is [GeneralSans-FFL.txt](site/fonts/GeneralSans-FFL.txt); it permits self-hosting but restricts redistribution, including through public repositories. The binaries are gitignored: run `python3 tools/fetch_fonts.py` before previews or browser tests. The script downloads the official Fontshare archive and checks pinned SHA-256 hashes for the font files and license before writing them. Visitors load fonts from this site, with no browser request to a Fontshare CDN. The manual site-deploy workflow runs the same preparation before syncing. When updating the fonts, review the official source and license before updating the hashes in [the fetch script](tools/fetch_fonts.py).

[Typography browser tests](tests/browser/typography.test.mjs) verify actual custom-font rendering on desktop and mobile, font-file loading, standalone and generated pages, and the code-font boundary.

`site/js/main.js` renders the pixel art (`data-px`) every 100 ms and only writes to the DOM when a region's output changes. The HTML ships with still values, and visitors with reduced motion get a still frame of these regions. The feature walkthroughs have a separate scroll controller. Pricing faces are independent of the pixel-art clock: each gives a brief, staggered blink when first entering view, then remains still. Without IntersectionObserver or with reduced motion, pricing faces remain static.

The “Ditch D*vin” block gives the headline, subline and right-hand artwork generous spacing on desktop and mobile. Its decorative [flat Idle sprite](site/img/jiro-idle-flat.svg) comes from Clifford’s approved `nori-monorepo/docs/design/jiro` brand suite: it shares the no-bite favicon’s geometry, with the canonical coral face color and no grain or shadow. `initDitchJiro` in [site/js/main.js](site/js/main.js) adds `is-awake` on the sprite’s first intersection and disconnects the observer. [site/css/styles.css](site/css/styles.css) supplies a single slow, small bounce, independent of the pixel-art clock. The sprite stays still without JavaScript or IntersectionObserver, and the reduced-motion media query prevents or immediately cancels animation. [Ditch browser tests](tests/browser/ditch-polish.test.mjs) cover responsive spacing, bounded motion, stationary adjacent text and live motion-preference changes.

The “Why Jiro” section (`#why`) presents customer testimonials between the comparison table and feature walkthroughs. Quotes sit side by side on a white surface on desktop and stack in reading order on mobile, using the site typography and muted credits. The section is static, and the existing “Why Jiro” navigation link continues to target it. The wording and attributions for Alex (CTO, Corvus) and Danny (CTO, Miravoice) are preserved from the approved quotes, sourced from their published case studies (https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html and https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html), with the previously approved Nori-to-Jiro naming. Keep one quote per company.

"How it works" (`#features`) contains complete, fictional interface stories in [site/index.html](site/index.html): Priya reporting a CSV filter bug in desktop Slack, Kira replying from her phone and resuming the shared session in a laptop terminal; an overnight Linear issue about paid orders stuck pending leading to a Stripe raw-body fix and Dana’s morning PR approval; and the same incident in a shared thread where Jordan receives the broker’s access-denial message while Rae gets the affected-order count, root cause and fix PR. [site/js/features.js](site/js/features.js) changes only emphasis, highlighting the demo region nearest the viewport center. There are no feature timers or videos. Each step is a keyboard-accessible link; activating it scrolls to its corresponding demo region and retains focus on the link.

Sections keep accessible names without visible eyebrow labels. “How it works” and the FAQ use visually hidden headings; the dialog keeps its “Get early access to Jiro” title. The feature heading remains inside the first example’s white narrative panel, with no separate header block. The section uses the original alternating box form: white `.ftext` panels beside green, orange and dark-green `.fimg` demo panels, separated by the black grid. The stories follow the carousel order: multiplayer, on-call, then permissions, with demo panels alternating right, left, right. Each example groups its heading with a short secondary subline, followed directly by the step links without repeating the summary as body copy. The illustrated interfaces use light surfaces within the colored panels, including the terminal and phone views. The colored panels are square where content fits and grow to keep the complete stories readable. Step links have text without numeric prefixes; the story numbers remain. Compact links use a left rule and muted surface for the active step, without underlines, and retain visible keyboard focus; panels scroll normally rather than sticking beside a long step runway. At 900px and below, every story stacks text first, then demo. Without JavaScript or with reduced motion, the full examples remain readable as static stories; changing the motion preference updates emphasis immediately. Keep each story's steps, links and demo regions in matching order. The `.fpanel` class on each demo keeps fictional interface text out of the inline copy editor.

Pricing includes a short free-trial line and modest price typography. Cards turn black on hover; their green button fill completes quickly, and the buttons align at the bottom of each card with consistent spacing. The same buttons continue opening the early-access dialog.

Pricing leads directly into the FAQ and sign-up block across the normal green section gap. The FAQ and sign-up block share a 60/40 desktop grid: white FAQ on the left and a narrower black panel on the right. At 900px and below they stack with the FAQ first. The named `#reserve` sign-up region contains only the orange “Get early access” button, vertically centered on desktop with extra upper space on mobile. The button opens the existing dialog, where visitors enter their name and work email.

The design is drawn at 1440px; the "Responsive" block at the end of `site/css/styles.css` steps down at 1180px, 900px (dropdown menu from `initMenu`, stacked sections, sideways-scrolling compare table) and 420px. The comparison and pricing headings are “How Jiro compares.” and “Pricing”. The comparison columns run jiro.bot, Claude Tag, Devin, Factory, then Cursor Cloud; Jiro retains its bold treatment and hover emphasizes the focused row. Comparison rows have generous padding and a minimum height, growing with wrapped content. Headers, row labels and product cells center their text horizontally and vertically, including the pinned labels on mobile. The entire label column inherits the site’s UI font family. Small decorative crosses mark explicit competitor limitations and usage charges, without changing fact-checked wording or marking neutral capabilities as defects. At the stacking breakpoint, the table expands horizontally to preserve product-column widths, larger type, increased line height and cell padding; narrower pinned row labels leave room to read a complete competitor column even on narrow phones. Mobile header padding keeps the Jiro wordmark inside its column. [Comparison browser tests](tests/browser/compare-polish.test.mjs) check spacing, centered text, the label font and decorative crosses. [Layout browser tests](tests/browser/layout.test.mjs) cover narrow phones through ultrawide desktops, including both sides of the stacking breakpoint, and check page overflow, hero balance, pricing-to-FAQ spacing and table containment.

The hero’s left copy column centers its headline/body/CTA stack vertically alongside the carousel as wide media makes the row taller. The video fills the hero’s right panel (`.hero-media`) edge-to-edge, with no control row or reserved space underneath. The slide title overlays its top-left corner, the dots sit at top-center, and pause/play sits at top-right, clear of the videos’ baked-in bottom captions. Dark translucent backing preserves white text, controls and visible keyboard focus over light video content. [site/js/hero.js](site/js/hero.js) controls the example carousel (Multiplayer, On-call, RBAC), following the WAI-ARIA APG tabbed carousel: centered dots are labelled tabs, Left/Right/Home/End move between them, there is one tab stop and selection follows focus. It never auto-advances or runs text timers. The crossfade is 200ms (off under reduced motion), and the pause/play button controls video playback.

Carousel videos are dropped in without code changes: `site/video/carousel/{oncall,multiplayer,rbac}-{desktop,mobile}.mp4` plus `{name}-poster.jpg`. The script picks the mobile cut at 900px and below (re-picking when the breakpoint is crossed), loads only the active example, and under reduced motion loads nothing until play is pressed. The panel prefers 5:4 on desktop and 4:5 on mobile. On desktop it stretches to match taller hero copy; `object-fit: cover` then crops the video, especially just above the 900px stacking breakpoint. Keep essential video content and shared posters center-safe within this framing constraint. The committed clips are muted H.264 loops with shared posters, rendered from [video/carousel-src/](video/carousel-src/README.md). Their pure-white `#ffffff` stage matches `.hc-stage`, blending the videos and posters into the hero panel without a contrasting rectangle. That source folder documents the scene stories, rendering pipeline and rebuild commands; it is outside `site/` so only the final assets are published.

The retired looping hero video (Jiro hero v25) and its render scripts live on the `video/hero-loop-v1` branch.

The navigation names the feature walkthroughs “How it works”. The positioning copy spells out “No token markup. No model lock-in.” The footer links to Nori Agentic, includes its copyright line, and retains the “Get early access” dialog opener without repeating the Pricing and FAQ links.

## Early access

Every "Get early access" link or button opens a pop-up asking for name and work email, which posts to the URL in `<meta name="early-access-endpoint">` (the live HTTP API). Successful submission shows “Check your inbox” in the dialog. Visitors join the list only after clicking the emailed link and pressing "Confirm my spot" (opening the link alone does nothing, so mail scanners can't confirm); they land on `confirmed.html` or `link-expired.html`.

Deploy only by dispatching the GitHub Actions workflows from `main`, after approval: [site](.github/workflows/deploy.yml) and [early-access Lambda](.github/workflows/deploy-early-access.yml). The Lambda workflow updates code only; environment configuration belongs to the CloudFormation stack. Architecture and deployment workflow: [docs.md](docs.md) and [Lambda docs](lambda/early-access/docs.md).
