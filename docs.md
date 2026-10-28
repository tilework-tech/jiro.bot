# Noridoc: jiro.bot

Path: @/

### Overview

- Static site for jiro.bot: a hand-written landing page (the marketing design with an early-access sign-up pop-up and the standalone pages that flow links to) plus generated comparison pages (alternatives, head-to-head, switching guides, best-of lists) whose purpose is answer-engine optimization (AEO) — getting LLM answer engines to mention and cite Jiro for "best X alternatives", "Jiro vs X" and "how do I switch from X" questions.
- [build.py](build.py) is a stdlib-only Python generator that turns TOML records in [content/](content/docs.md) into HTML pages, markdown twins and machine-readable indexes in `site/`.
- [tools/](tools/docs.md) holds the pre-publish gate ([tools/lint.py](tools/lint.py)), AEO measurement scripts and the landing-page [copy editor](tools/copy-editor/docs.md); [lambda/early-access/](lambda/early-access/docs.md) is the sign-up backend, provisioned by [infra/early-access.cfn.yaml](infra/early-access.cfn.yaml).

### How it fits into the larger codebase

- This repository absorbed the private `tilework-tech/jirobot-site` repo (the landing-page design, copy editor, sign-up Lambda and pop-up tests), which is archived. Only this repository deploys jiro.bot.
- Implements the "comparison pages first" decision in the nori-monorepo spec `docs/specs/jiro-aeo/README.md`. The generator lives in the same repo as its records and prompts, so content, generator and grading change together.
- Pages may only claim behavior Jiro ships today, per nori-monorepo `docs/specs/jiro-launch/PRD.md` section D. That constraint is enforced mechanically by the `deny` list in [content/site.toml](content/site.toml) and checked by [tools/lint.py](tools/lint.py). Jiro's positive claims are themselves sourced facts citing noriagentic.com and docs.noriagentic.com: by GTM rule, anything true of Nori is true of Jiro, and jiro.bot cites Nori's sites until it has its own docs.
- Generated pages funnel to the Nori Sessions signup (`trial_url`, `login.norisessions.com`) and to the `public/jiro` skillset install command (`nori-skillsets`), both configured in `site.toml`. The landing page instead funnels to the early-access waitlist (see below).
- Publishing is the manual-dispatch workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml): it runs `aws s3 sync site/ --delete` into the bucket from [infra/site.cfn.yaml](infra/site.cfn.yaml) and invalidates CloudFront. It does not run the build, so generated output in `site/` is committed and what is in git is exactly what ships.

```
content/site.toml ─┐
content/facts/*.toml ─┼─> build.py ──> site/{family}/{name}.html + .md
content/pages/*.toml ─┘                site/llms.txt, llms-full.txt, sitemap.xml,
                                        robots.txt, assets/pages.css
                                              │
            tools/lint.py (gate) <────────────┤
            tools/grade_page.py ──> aeo/grades-*.jsonl
            tools/aeo_probe.py  ──> aeo/baseline-*.json (queries Gemini, not site/)
                                              │
            deploy.yml (manual dispatch) ──> S3 + CloudFront ──> https://jiro.bot

site/index.html + site/js/early-access.js (hand-written)
   │ POST JSON to <meta name="early-access-endpoint">
   v
HTTP API (stack jiro-bot-early-access) ──> Lambda jirobot-early-access ──> SES / Clarify
   │ 303 after confirm
   v
site/confirmed.html, site/link-expired.html
```

### Core Implementation

- Hand-written landing page: [site/index.html](site/index.html) loads [site/css/styles.css](site/css/styles.css), the pixel-art renderers in [site/js/jiro-pixels.js](site/js/jiro-pixels.js), the 100 ms animation clock in [site/js/main.js](site/js/main.js) and the sign-up pop-up in [site/js/early-access.js](site/js/early-access.js) and the hero's rotating line and example carousel in [site/js/hero.js](site/js/hero.js), plus self-hosted fonts, an image and the carousel posters and clips under `site/video/carousel/`. `hero.js` runs its own timers, separate from the `main.js` clock, and its script tag sits inside the hero block rather than with the other scripts. Its animation markers and responsive breakpoints are described in [README.md](README.md).
- Early-access pop-up: one delegated click listener turns every `a[href="#reserve"]` and `[data-early-access]` element into a native `<dialog>` opener; without JavaScript or `<dialog>` the links scroll to `#reserve`. The reserve section's email field prefills the dialog. Submit sends `name`, `email`, `org`, the honeypot `ea_hp`, `page` (origin plus path, keeping only `utm_*` parameters) and `referrer`; a 2xx swaps in a "Check your inbox" panel, anything else keeps the form with a generic try-again message. The backdrop closes the dialog only when both press and release land on it, so dragging a selection out of a field does not discard the form.
- `load` parses `site.toml`, every fact file (keyed by file stem as the rival id) and every page record, rejects unknown `family` values, and sorts pages by slug so builds are deterministic.
- Pages reference facts two ways. `[[cite:rival.id]]` adds only a numbered citation after the page's own sentence; it is the normal marker in prose. `[[fact:rival.id]]` inserts the fact's wording, `text` in prose and `short` in table cells, and is meant for tables. A `Renderer` per page and format numbers references in first-use order (both markers share one numbering), and a Sources list at the end shows each cited fact's text, source URL and `checked` date. An unknown rival or fact id in either marker aborts the build.
- `expand_facts` returns page copy as a reader sees it (`[[fact:]]` replaced by the claim, `[[cite:]]` removed). JSON-LD stripping and the lint prose checks both build on it.
- Page copy supports a small markdown subset: blank-line-separated paragraphs, blocks where every line starts with `- ` become bulleted lists, blocks where every line starts with `N. ` become ordered lists (the `.md` twin renumbers from 1), plus inline `` `code` ``, `**bold**` and `[text](https://...)` links. Fact `text` and `short` forms (including in the Sources list) get the same inline markup. In HTML these are escaped then converted; the `.md` twin keeps them raw.
- Every page has the same skeleton: question-and-answer callout first (the passage answer engines are meant to quote), optional comparison table, sections, FAQ, a "Try Jiro" CTA, Sources, and the disambiguation footer ("not Amazon's Kiro or Atlassian's Jira").
- HTML pages carry a canonical extensionless URL (`{base_url}/{slug}`), a `rel=alternate` link to the `.md` twin, Open Graph tags, and JSON-LD for Article, BreadcrumbList and (when there is a FAQ) FAQPage. FAQ answers in JSON-LD have fact references expanded and markup stripped.
- Families and their headings come from `FAMILIES` in [build.py](build.py) (alternatives, head-to-head comparisons, switching guides, lists); an unknown `family` in a record fails the build.
- `llms.txt` lists pages grouped by family, linking the `.md` twins; `llms-full.txt` concatenates every page's markdown; `sitemap.xml` lists the home page and every page with `site.toml` `updated` as lastmod.
- `render_site` renders every generated file in memory (returning the pages plus a map of path-relative-to-`site/` to text) before `build` touches disk. Only then are the family directories (one per `FAMILIES` key under `site/`) deleted and everything written, so a failed build (for example an unknown fact id) leaves the previous `site/` untouched and removed records disappear on the next good build. Hand-written files (the landing page and its `css/`, `js/`, `fonts/`, `img/`, `video/`, the standalone pages, and `jiro-16px.png`, which generated pages use as their favicon) are never touched.
- [tools/lint.py](tools/lint.py) reuses `render_site` to compare a fresh in-memory build against `site/`, which is how the committed output is kept in sync with `content/`.

### Things to Know

- Canonical URLs, sitemap entries and breadcrumbs are extensionless (for example `https://jiro.bot/alternatives/devin`), but files are uploaded as `.html` and the S3 REST origin plus CloudFront in [infra/site.cfn.yaml](infra/site.cfn.yaml) has no rewrite. Extensionless URLs therefore 404 in production until a deploy or infra change lands. noriagentic.com handles this by also uploading extensionless copies with `--content-type text/html` in its deploy script. The decision for this work was copy only, with no workflow or infra change; [tools/serve.py](tools/serve.py) maps extensionless URLs locally, so previews hide the gap.
- Deploy only by dispatching the GitHub Actions workflow from `main`, after approval. Never sync to S3 by hand.
- Everything in `site/` is published, and `--delete` removes anything not in it from the bucket. Keep docs, tooling and other non-public files out of `site/`; that is why the copy editor lives in `tools/copy-editor/` and points its `--root` at `site/`.
- [site/confirmed.html](site/confirmed.html) and [site/link-expired.html](site/link-expired.html) are redirect targets of the Lambda (`SITE_ORIGIN/...`), so they must ship with the site. [site/privacy.html](site/privacy.html) is noriagentic.com's policy plus one added paragraph covering jiro.bot early-access data. The pop-up and standalone pages use relative links so they also work under a session `/port/<N>/` preview.
- The honeypot is named `ea_hp` with `autocomplete="new-password"` because a common name like `website` was filled by browser autofill, which made the Lambda silently drop real sign-ups.
- The generated AEO pages' CTA still uses `trial_url` (self-serve `login.norisessions.com` signup) from [content/site.toml](content/site.toml), which contradicts the landing page's early-access model. This was flagged to Martin and left unchanged.
- Söhne (Klim) is not in the repo: the only copies are trial fonts licensed for development, and this repo and `site/` are public, so `.gitignore` blocks `site/fonts/Sohne*.woff2`. `css/styles.css` still declares Söhne and falls back to Helvetica Neue. To ship the intended type, add licensed web fonts under the same file names (and restore the two `rel="preload"` font links in `site/index.html`). JetBrains Mono is OFL (license in `site/fonts/`).
- Facts go stale by design: lint fails any page that shows a fact whose `checked` date is more than `max_fact_age_days` before `site.toml` `updated`, or after it. Refreshing means re-verifying the claim at its source and bumping `checked`, not just editing the date. Bumping `updated` alone can fail lint for every page.
- The family directories belong to the generator: anything hand-written there is deleted on the next build. Only they are cleaned, so a page slug must live under one of them; a slug outside them would leave orphaned output when its record is removed.
- Editing `content/` without rebuilding, or hand-editing generated files in `site/`, fails lint with "site/ is stale". Rerun `python3 build.py` and commit both.
- `site.toml` `updated` drives every page's "Updated" date, Article `dateModified` and sitemap lastmod at once; there is no per-page modified date.
- The site was rewritten after GTM review (2026-10-19) because pages pasted the same fact wording wherever it was cited and read like one template. The `[[cite:]]` marker and the lint overlap and sentence-variation gates exist to keep pages individual; see [content/docs.md](content/docs.md) for the editor rules.
- Tests in [tests/](tests/) run the real `build.py` and `tools/lint.py` CLIs against a temp copy of `tests/fixtures/content`, so they never depend on the live `content/` records. Run them with `cd tests && python3 -m unittest`.
- [tests/browser/](tests/browser/early-access.test.mjs) is a separate Playwright suite (`npm test`) for the pop-up, the standalone pages and the hero ([hero.test.mjs](tests/browser/hero.test.mjs), which uses Playwright's fake clock and an in-browser-recorded WebM clip for playback). It starts [the copy-editor server](tools/copy-editor/server.py) on a fixed port, rewrites the endpoint meta tag through request interception and stubs the endpoint, so it never reaches the live API. The Lambda and copy editor have their own tests; see [README.md](README.md).

Created and maintained by Nori.
