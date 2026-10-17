# Noridoc: content

Path: @/content

### Overview

- The source records for every generated page on jiro.bot. Nothing in `site/{alternatives,compare,best}` should be edited by hand; edit records here and rerun [build.py](../build.py).
- Three kinds of record: site-wide settings ([site.toml](site.toml)), one fact file per rival under `facts/`, and one page record per page under `pages/`.

### How it fits into the larger codebase

- Read by `load` in [build.py](../build.py), which is also imported by [tools/lint.py](../tools/lint.py), so both see the same parsed records.
- [tools/grade_page.py](../tools/grade_page.py) reads each page record's `question` and grades the built markdown against it.
- The "only shipped behavior" rule from nori-monorepo `docs/specs/jiro-launch/PRD.md` section D is encoded here as `site.toml` `deny`.

### Core Implementation

| Record | Key fields | Used for |
|---|---|---|
| `site.toml` | `name`, `base_url`, `updated`, `max_fact_age_days`, `trial_url`, `install`, `entity`, `summary`, `footer`, `deny` | Page dates and sitemap lastmod, canonical URLs, CTA, `llms.txt` header, footer, lint rules |
| `facts/{rival}.toml` | `name`, then `[[fact]]` with `id`, `text`, `short`, `source`, `checked` | Cited competitor claims; `text` in prose, `short` in table cells |
| `pages/*.toml` | `slug`, `family` (`alternatives` / `compare` / `best`), `title`, `description`, `question`, `answer`, optional `table` (`heading`, `columns`, `rows`, `note`), `[[section]]` (`heading`, `body`, optional `level`), `[[faq]]` (`q`, `a`), optional `published` | One generated page and its markdown twin |

- The rival id in `[[fact:rival.id]]` is the fact file's stem, not its `name` field. A file can hold facts about something other than a single product (for example Anthropic pricing facts cited across pages).
- Page `slug` is the output path under `site/` and should start with the family directory (for example `compare/devin`).
- Page `answer` must contain the `site.toml` `entity` sentence verbatim; it is the opening passage answer engines quote.

### Things to Know

- Every rival fact needs an `https://` `source` and a `checked` date within `max_fact_age_days` before `updated`. Facts age out after the configured window, so re-verify at the source and bump `checked`; lint fails every page that shows a stale fact.
- `deny` phrases are matched case-insensitively as substrings against the whole page record with fact references removed, so they apply to titles, descriptions and FAQ as well as body copy. Rival facts are exempt, because a competitor may legitimately ship something Jiro does not.
- A `TK` placeholder anywhere in a page or in a fact it shows fails lint, because lint checks the built HTML and markdown.
- Jiro's own claims in page copy (table "Jiro" column, sections) are not sourced facts; they are constrained only by `deny` and review against the PRD.
- Fact `text` and `short` support the same inline markup as page copy (`` `code` ``, `**bold**`, links) in HTML.
- Harness claims learned in review: only the Claude Code and Codex harnesses run on a Claude/ChatGPT subscription or API key; the Cursor harness needs a Cursor API key (`crsr_`). Jiro runs Claude Code through the Agent SDK bundle, so never say "unmodified Claude Code binary". Gemini CLI and OpenCode are not offered in the Jiro onboarding preset, so both are on `deny`. Pages make no legal or terms-of-service claims.
- Because `deny` is a plain substring match, a denied phrase can catch legitimate rival copy (for example `$250` also matches a rival price range written "$150 to $250" in page copy). Reword the page copy (for example "$150–250") rather than removing the deny entry; fact text is exempt.

Created and maintained by Nori.
