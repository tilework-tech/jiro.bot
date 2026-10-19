# Noridoc: content

Path: @/content

### Overview

- The source records for every generated page on jiro.bot. Nothing in the generated family directories under `site/` should be edited by hand; edit records here and rerun [build.py](../build.py).
- Three kinds of record: site-wide settings ([site.toml](site.toml)), sourced fact files under `facts/` (one per rival or vendor, plus `jiro.toml` for Jiro's own claims), and one page record per page under `pages/`.
- Also the home of the editorial rules future editors must follow; the writer brief used for the 2026-10-19 rewrite lives outside the repo.

### How it fits into the larger codebase

- Read by `load` in [build.py](../build.py), which is also imported by [tools/lint.py](../tools/lint.py), so both see the same parsed records.
- [tools/grade_page.py](../tools/grade_page.py) reads each page record's `question` and grades the built markdown against it.
- The "only shipped behavior" rule from nori-monorepo `docs/specs/jiro-launch/PRD.md` section D is encoded here as `site.toml` `deny`; Jiro's positive claims come from `facts/jiro.toml`, sourced to noriagentic.com and docs.noriagentic.com. GTM's rule is that anything true of Nori is true of Jiro, and pages may cite Nori's sites until jiro.bot has its own docs.

### Core Implementation

| Record | Key fields | Used for |
|---|---|---|
| `site.toml` | `name`, `base_url`, `updated`, `max_fact_age_days`, `trial_url`, `install`, `entity`, `summary`, `footer`, `deny` | Page dates and sitemap lastmod, canonical URLs, CTA, `llms.txt` header, footer, lint rules |
| `facts/{id}.toml` | `name`, then `[[fact]]` with `id`, `text`, `short`, `source`, `checked` | Cited claims; referenced by `[[cite:]]` or `[[fact:]]` |
| `pages/*.toml` | `slug`, `family` (`alternatives` / `compare` / `switch` / `best`), `title`, `description`, `question`, `answer`, optional `table` (`heading`, `columns`, `rows`, `note`), `[[section]]` (`heading`, `body`, optional `level`), `[[faq]]` (`q`, `a`), optional `published` | One generated page and its markdown twin |

| Family | Slug pattern | Shape |
|---|---|---|
| `alternatives` | `alternatives/{rival}` | Title format "{Rival} Alternatives & Competitors (2026): N Best Options" |
| `compare` | `compare/{rival}` | Jiro vs one rival |
| `switch` | `switch/{rival}-to-jiro` | Setup steps and a first-week plan for moving from a rival |
| `best` | `best/{topic}` | Ranked list across the category |

- The id in `[[cite:id.fact]]` / `[[fact:id.fact]]` is the fact file's stem, not its `name` field. A file can hold facts about something other than a single product (for example Anthropic pricing facts cited across pages).
- Page `slug` is the output path under `site/` and must start with the family directory.
- Page `answer` must contain the `site.toml` `entity` sentence verbatim; it is the opening passage answer engines quote.
- Claude Tag pages exist because Nori's keyword report rated "Claude Tag" the top capture opportunity; they use comparison framing, not hostile framing.

### Content rules for editors

- Write your own sentence and attach `[[cite:id.fact]]`. Reserve `[[fact:]]` for table cells, where the fact's `short` form is the cell. Pasting the same fact wording across pages is what made the first draft read like one template, and lint now fails it.
- One voice per page. Each page was written by a separate writer; keep its tone rather than harmonizing pages with each other.
- Vary sentence length on purpose; long pages are checked for it.
- Frame Jiro "for small teams already paying for Claude or ChatGPT". Plan names are Developer and Team; prices come from `facts/jiro.toml`.
- Make no claims that Jiro triggers from Microsoft Teams, Linear or CI. Its sourced surfaces are Slack, the web dashboard, Discord, the terminal, schedules and webhooks.
- Every switching guide includes signing in with the Claude command line (`claude setup-token`) as an explicit step; legal approved subscription use on that condition.
- Harness claims: only the Claude Code and Codex harnesses run on a Claude/ChatGPT subscription or API key; the Cursor harness needs a Cursor API key. Jiro runs Claude Code through the Agent SDK bundle, so never say "unmodified Claude Code". Pages make no legal or terms-of-service claims.
- Say "isolated cloud environment", not VM: the docs say environment and the backend varies.

### Things to Know

- Every fact, Jiro's included, needs an `https://` `source` and a `checked` date within `max_fact_age_days` before `updated`. Re-verify at the source and bump `checked`; lint fails every page that cites a stale fact.
- `deny` phrases are matched case-insensitively as substrings against the whole page record with fact markers removed, so they apply to titles, descriptions and FAQ as well as body copy. Fact text is exempt (a competitor may ship something Jiro does not), which also exempts `jiro.toml`. The list covers unshipped features, unsourced claims (for example "OpenRouter"), terms another vendor owns ("AI software engineer"), unshipped product names ("Itamae", "Omakase") and VM wording. Pricing is no longer denied.
- Because `deny` is a plain substring match, a denied phrase can catch legitimate page copy. Reword the copy rather than removing the deny entry.
- A `TK` placeholder anywhere in a page or in a fact it shows fails lint, because lint checks the built HTML and markdown.
- Text inserted by `[[fact:]]` counts as the page's prose for the cross-page overlap check, so the same `[[fact:]]` in two pages' prose fails both; inside tables it does not count.
- Fact `text` and `short` support the same inline markup as page copy (`` `code` ``, `**bold**`, links) in HTML.

Created and maintained by Nori.
