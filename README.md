# jiro.bot

Static site for jiro.bot: a hand-written landing page (the 16x14 Jiro sprite on a pixel heatmap and a sign-up link) plus generated comparison pages for answer-engine optimization (AEO).
The previous interactive site work is preserved on the
`backup/jiro-site-2026-10-09` branch (and `jiro-site`, which open PRs target).

- `site/` — static files published as-is. `index.html` and images are hand-written; `alternatives/`, `compare/`, `best/`, `assets/pages.css`, `llms*.txt`, `sitemap.xml` and `robots.txt` are generated and committed.
- `content/` — TOML records the pages are built from: site settings, sourced and dated rival facts, one record per page. See [content/docs.md](content/docs.md).
- `build.py` — stdlib-only generator, `content/` -> `site/`. It owns `site/alternatives`, `site/compare` and `site/best` and rebuilds them from scratch, so never put hand-written files there.
- `tools/` — pre-publish lint, LLM grader, AEO prompt probe, overlap check, preview server. See [tools/docs.md](tools/docs.md).
- `aeo/` — dated grader and probe results.
- `tests/` — black-box tests of `build.py` and `tools/lint.py` against `tests/fixtures/content`.
- `infra/site.cfn.yaml` — CloudFormation stack `jiro-bot-site` (S3, CloudFront, ACM, Route 53, deploy role)
- `.github/workflows/deploy.yml` — manual-dispatch deploy from `main`

Python 3.11+ (for `tomllib`), no dependencies.

```bash
python3 build.py                     # regenerate site/ from content/
python3 tools/lint.py                # must pass before publishing; also fails if site/ is stale
cd tests && python3 -m unittest      # tests
python3 tools/serve.py               # preview on :4310 with extensionless URLs

# Need GEMINI_API_KEY; write results into aeo/
python3 tools/grade_page.py [slug ...] > aeo/grades-$(date +%F).jsonl
python3 tools/aeo_probe.py [runs]      > aeo/baseline-$(date +%F).json
python3 tools/overlap.py site/compare/devin.html reference.html
```

Deploy only by dispatching the GitHub Actions workflow, after approval. Architecture and known gaps: [docs.md](docs.md).
