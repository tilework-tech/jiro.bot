# Noridoc: tools

Path: @/tools

### Overview

- Standalone stdlib-only Python scripts around the page generator: a pre-publish gate, two Gemini-backed AEO measurements, a copy-overlap check and a local preview server.
- Only [lint.py](lint.py) is a hard gate; the others measure or support review.

### How it fits into the larger codebase

- [lint.py](lint.py) imports `load`, `FACT_REF`, `fact_refs` and `render_site` from [build.py](../build.py) and checks the already-built `site/` output against [content/](../content/docs.md). Build first.
- [grade_page.py](grade_page.py) and [aeo_probe.py](aeo_probe.py) call the Gemini API through the shared [gemini.py](gemini.py) helper, need `GEMINI_API_KEY`, print to stdout, and by convention are redirected into dated files in `aeo/` (`grades-YYYY-MM-DD.jsonl`, `baseline-YYYY-MM-DD.json`).
- The probe's first questions match the 2026-10-14 baseline in nori-monorepo `docs/specs/jiro-aeo/demo/baseline.json`, so new runs stay comparable to it.

### Core Implementation

| Script | What it does |
|---|---|
| [lint.py](lint.py) | For each page record prints PASS/FAIL; exits 1 if any page fails or no pages exist. Fails on: page not built, `TK` in built HTML or markdown, `site.toml` `entity` missing before the first `## ` heading of the markdown, a `deny` phrase in page copy, or any referenced fact without an `https://` source or with a `checked` date outside `max_fact_age_days` before `updated`. After the per-page checks it fails with "site/ is stale" if any file from a fresh in-memory `render_site` of `content/` is missing from or differs in `site/` |
| [gemini.py](gemini.py) | Shared `generate` call used by the grader and probe: model `gemini-2.5-flash`, API key sent in the `x-goog-api-key` header (not the URL), retries HTTP 429/500/503 with exponential backoff and re-raises other errors or the final failure |
| [grade_page.py](grade_page.py) | LLM judge scoring each built `.md` 0-2 on direct_answer, extractable, specific, entity_clarity, claims_risk and freshness against the record's `question`; also returns the answer an engine would give and a suggested fix. Optional slug arguments limit which pages are graded |
| [aeo_probe.py](aeo_probe.py) | Asks Gemini with Google Search grounding a fixed question panel (baseline how-to/guide/compare/brand questions, "best {Rival} alternatives" per rival, Jiro vs Kiro, best-of list) N times each (default 3); counts Jiro mentions, jiro.bot citations, Kiro confusion and rival brands |
| [overlap.py](overlap.py) | Reports shared 8-word shingles between a generated page and a reference HTML page; used to show no text was copied from the noriagentic.com seed pages |
| [serve.py](serve.py) | Serves `site/` on port 4310 (or `PORT`), mapping extensionless paths to `.html` and serving `.md` as markdown |

### Things to Know

- The stale check means editing `content/` without running [build.py](../build.py), or hand-editing generated files in `site/`, fails the gate.
- The grader is lenient (it once scored a page with a TK placeholder 12/12), which is why lint is the gate and grading is advisory.
- The probe measures the live web, not local output, so it only reflects pages after they are deployed and indexed.
- `kiro_confusion` counts answers that mention Kiro for a Jiro question that did not mention Kiro; a Jiro mention is not counted when the answer is about "Jiro Dreams of Sushi".
- `serve.py` resolves extensionless URLs that production does not (see Things to Know in [../docs.md](../docs.md)), so a working preview does not prove those URLs work on jiro.bot.

Created and maintained by Nori.
