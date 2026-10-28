# Noridoc: jiro.bot

Path: @/

### Overview

- Static site for jiro.bot: a hand-written landing page plus generated comparison pages (alternatives, head-to-head, switching guides, best-of lists) whose purpose is answer-engine optimization (AEO) — getting LLM answer engines to mention and cite Jiro for "best X alternatives", "Jiro vs X" and "how do I switch from X" questions.
- [build.py](build.py) is a stdlib-only Python generator that turns TOML records in [content/](content/docs.md) into HTML pages, markdown twins and machine-readable indexes in `site/`.
- [tools/](tools/docs.md) holds the pre-publish gate ([tools/lint.py](tools/lint.py)) and AEO measurement scripts; [tests/](tests/) black-box `build.py` and `lint.py`.
- [skillsets/](skillsets/jiro-motion/docs.md) holds Nori agent skillsets that live beside the site but are not part of it, currently `jiro-motion` (renders the Jiro mascot into video as a transparent overlay and checks it against a motion spec).

### How it fits into the larger codebase

- Implements the "comparison pages first" decision in the nori-monorepo spec `docs/specs/jiro-aeo/README.md`. The generator lives in the same repo as its records and prompts, so content, generator and grading change together.
- Pages may only claim behavior Jiro ships today, per nori-monorepo `docs/specs/jiro-launch/PRD.md` section D. That constraint is enforced mechanically by the `deny` list in [content/site.toml](content/site.toml) and checked by [tools/lint.py](tools/lint.py). Jiro's positive claims are themselves sourced facts citing noriagentic.com and docs.noriagentic.com: by GTM rule, anything true of Nori is true of Jiro, and jiro.bot cites Nori's sites until it has its own docs.
- Every page funnels to the Nori Sessions signup (`trial_url`, `login.norisessions.com`) and to the `public/jiro` skillset install command (`nori-skillsets`), both configured in `site.toml`.
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
```

### Core Implementation

- `load` parses `site.toml`, every fact file (keyed by file stem as the rival id) and every page record, rejects unknown `family` values, and sorts pages by slug so builds are deterministic.
- Pages reference facts two ways. `[[cite:rival.id]]` adds only a numbered citation after the page's own sentence; it is the normal marker in prose. `[[fact:rival.id]]` inserts the fact's wording, `text` in prose and `short` in table cells, and is meant for tables. A `Renderer` per page and format numbers references in first-use order (both markers share one numbering), and a Sources list at the end shows each cited fact's text, source URL and `checked` date. An unknown rival or fact id in either marker aborts the build.
- `expand_facts` returns page copy as a reader sees it (`[[fact:]]` replaced by the claim, `[[cite:]]` removed). JSON-LD stripping and the lint prose checks both build on it.
- Page copy supports a small markdown subset: blank-line-separated paragraphs, blocks where every line starts with `- ` become bulleted lists, blocks where every line starts with `N. ` become ordered lists (the `.md` twin renumbers from 1), plus inline `` `code` ``, `**bold**` and `[text](https://...)` links. Fact `text` and `short` forms (including in the Sources list) get the same inline markup. In HTML these are escaped then converted; the `.md` twin keeps them raw.
- Every page has the same skeleton: question-and-answer callout first (the passage answer engines are meant to quote), optional comparison table, sections, FAQ, a "Try Jiro" CTA, Sources, and the disambiguation footer ("not Amazon's Kiro or Atlassian's Jira").
- HTML pages carry a canonical extensionless URL (`{base_url}/{slug}`), a `rel=alternate` link to the `.md` twin, Open Graph tags, and JSON-LD for Article, BreadcrumbList and (when there is a FAQ) FAQPage. FAQ answers in JSON-LD have fact references expanded and markup stripped.
- Families and their headings come from `FAMILIES` in [build.py](build.py) (alternatives, head-to-head comparisons, switching guides, lists); an unknown `family` in a record fails the build.
- `llms.txt` lists pages grouped by family, linking the `.md` twins; `llms-full.txt` concatenates every page's markdown; `sitemap.xml` lists the home page and every page with `site.toml` `updated` as lastmod.
- `render_site` renders every generated file in memory (returning the pages plus a map of path-relative-to-`site/` to text) before `build` touches disk. Only then are the family directories (one per `FAMILIES` key under `site/`) deleted and everything written, so a failed build (for example an unknown fact id) leaves the previous `site/` untouched and removed records disappear on the next good build. Hand-written files such as `site/index.html` and `site/jiro-16px.png` are never touched.
- [tools/lint.py](tools/lint.py) reuses `render_site` to compare a fresh in-memory build against `site/`, which is how the committed output is kept in sync with `content/`.

### Things to Know

- Canonical URLs, sitemap entries and breadcrumbs are extensionless (for example `https://jiro.bot/alternatives/devin`), but files are uploaded as `.html` and the S3 REST origin plus CloudFront in [infra/site.cfn.yaml](infra/site.cfn.yaml) has no rewrite. Extensionless URLs therefore 404 in production until a deploy or infra change lands. noriagentic.com handles this by also uploading extensionless copies with `--content-type text/html` in its deploy script. The decision for this work was copy only, with no workflow or infra change; [tools/serve.py](tools/serve.py) maps extensionless URLs locally, so previews hide the gap.
- Deploy only by dispatching the GitHub Actions workflow from `main`, after approval. Never sync to S3 by hand.
- Facts go stale by design: lint fails any page that shows a fact whose `checked` date is more than `max_fact_age_days` before `site.toml` `updated`, or after it. Refreshing means re-verifying the claim at its source and bumping `checked`, not just editing the date. Bumping `updated` alone can fail lint for every page.
- The family directories belong to the generator: anything hand-written there is deleted on the next build. Only they are cleaned, so a page slug must live under one of them; a slug outside them would leave orphaned output when its record is removed.
- Editing `content/` without rebuilding, or hand-editing generated files in `site/`, fails lint with "site/ is stale". Rerun `python3 build.py` and commit both.
- `site.toml` `updated` drives every page's "Updated" date, Article `dateModified` and sitemap lastmod at once; there is no per-page modified date.
- The site was rewritten after GTM review (2026-10-19) because pages pasted the same fact wording wherever it was cited and read like one template. The `[[cite:]]` marker and the lint overlap and sentence-variation gates exist to keep pages individual; see [content/docs.md](content/docs.md) for the editor rules.
- Tests in [tests/](tests/) run the real `build.py` and `tools/lint.py` CLIs against a temp copy of `tests/fixtures/content`, so they never depend on the live `content/` records. Run them with `cd tests && python3 -m unittest`.
- `skillsets/` is outside the site build and deploy: `build.py` reads only `content/`, `tools/lint.py` compares `content/` against `site/`, and the deploy workflow syncs only `site/`, so nothing under `skillsets/` ships to jiro.bot (the same holds for the scroll-buddy `prototypes/` folder on its branch). Skillset tests have their own runner and are not part of `tests/`: run `skillsets/jiro-motion/skills/jiro-motion/scripts/jm test` (needs `uv`; the first run builds a venv in `~/.cache/jiro-motion/venv`).

Created and maintained by Nori.
