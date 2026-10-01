# noriagentic.com — current product facts (verbatim extraction)

Fetched: 2026-10-01 (UTC). Method: raw `curl` of the live HTML plus text extraction; cross-checked against the site source in `/home/sprite/org/workspace/site-noriagentic` (HEAD `d8bb4ea`, 2026-09-28).

Conventions in this file:

- Blocks marked **VERBATIM** are copied from the live page text as rendered (HTML entities decoded, whitespace collapsed). Nothing inside them is paraphrased.
- Blocks marked **NOTE** are my observations and are not site copy. Do not quote them as product claims.

Pages that exist (HTTP 200): `/`, `/llms.txt`, `/guides.html`, `/open-source.html`, `/book-a-demo.html`, `/welcome.html`, `/privacy.html`, `/terms.html`, `/open-roles.html`, `/for-ops.html`, `/for-security-leaders.html`, `/for-finance.html`, `/for-data.html`, `/newsletter.html`, `/sitemap.xml`, `/robots.txt`.

Pages that do NOT exist (HTTP 404): `/pricing.html`, `/faq.html`, `/docs.html`, `/security.html`, `/about.html`, `/slack.html`. Pricing and FAQ are sections of the homepage (`/#pricing`, `/#compare`). There is no docs page, no dedicated security page, and no about page. `/for-developers.html` is a meta-refresh redirect to `/`.

---

## 1. Headline, subheadline, value-proposition copy

Source: https://noriagentic.com/

### Page metadata (VERBATIM)

- `<title>`: `Nori — Cloud agents. No lock in.`
- `meta description` / `og:description`: `An army of AI agents that can do real work, at your fingertips. Cloud agents, no lock in. Any model. Any agent harness. Any compute provider. Any integration. Any customization. Batteries included. Batteries swappable. Take your context with you. Over 10,000 PRs merged.`
- JSON-LD Organization description: `Nori builds agent-first developer tooling: an army of cloud coding agents that do real work with no lock-in, running on any model, any agent harness, and any compute provider.`
- JSON-LD `alternateName`: `Tilework Tech`; `sameAs`: https://github.com/tilework-tech , https://www.linkedin.com/company/nori-agentic/ , https://x.com/nori_agentic ; sales contact: `amol@noriagentic.com`

### Nav (VERBATIM, with hrefs)

`nori` (/) · `Blog` (/newsletter.html) · `Open source` (/open-source.html) · `Compare` (/#compare) · `Pricing` (/#pricing) · `Sign in` (https://login.norisessions.com)

NOTE: `/welcome.html` additionally shows a `Solutions` dropdown (`For developers`, `For security leaders`, `For your ops team`, `For finance`, `For data`) that the live homepage nav does not.

### Hero (VERBATIM)

- H1: `Cloud Coding Agents`
- Lede: `Nori is the infrastructure for your agent army`
- CTAs: `BOOK A DEMO` (href `/book-a-demo.html`) · `GET STARTED FOR FREE` (opens the trial modal; `data-plan="sessions"`, `data-cta="hero-trial"`)
- Terminal tabs: `Free Trial` · `Local Harness` (repo link https://github.com/tilework-tech/nori-cli)
- Terminal contents:

```
$ curl -fsSL https://noriagentic.com/onboard-checkout.md | npx nori-ai-cli@latest
$ npm i -g nori-ai-cli@latest
$ nori
```

- Trial modal: H2 `Start your free trial`; fields `Organization Name` (placeholder `Acme Corp`), `Email` (placeholder `you@acme.com`), hint `We’ll verify this email after you set your password.`, `Organization Slug` with hint `Used in your workspace URL. Lowercase letters, numbers, and hyphens only.`; submit button `Continue`. Form posts GET to `https://login.norisessions.com/` with hidden `signup=1`, `plan`, and `quantity=5`.

### Logo belt (VERBATIM alt text)

`Layer`, `Impilo`, `Corvus`, `Breezeway`, `Pangram`, `Amrok`, `Gather Health`, `CollegeWalk`, `Sentience`, `ToplinePro` — control labelled `Pause`.

### Section: Start agents wherever work shows up (VERBATIM)

- H2: `Start agents wherever work shows up.`
- Tabs and screenshot alt text:
  - `Slack` — `A Slack thread where Nori replies with a finished pull request`
  - `CLI` — `A terminal where Nori investigates a bug, runs the tests, and opens a pull request`
  - `Triggers` — `A scheduled Nori trigger with its prompt, cron schedule, and last run`

### Section: Visibility (VERBATIM)

- H2: `Visibility into how your team works`
- Chart groups: `Development`, `Operations`, `GTM`, each with `Prior` / `This week` bars split by `Slack` `CLI` `Triggers`.
- Stat tiles: `Sessions started` `680` · `PRs opened` `1,570` · `Saved per PR` `$168` · `Total saved` `$264k`

NOTE: These stat tiles are a product-dashboard illustration, not a published company metric. Do not reuse as a claim.

### Section: Customer quotes (VERBATIM)

- H2: `Our customers' own words.`
- Corvus:
  - `“I was at a client dinner Friday night, saw a bug in prod, had Nori look into it, deploy a fix, and re-run customer accounts all while still at the table. The turnaround on small stuff is way faster, and it requires way less mind-space.”` — `Alex` `CTO, Corvus`
  - `“We get to spend so much more time with these manufacturers. It is so powerful to hear live feedback while onsite, then show them the feature a few hours later.”` — `Nikhil` `CEO, Corvus`
  - Stats: `10,000+` `pull requests merged` `Across all teams` · `3×` `the output of a four-person team` `Corvus`
  - Link: `Read the Corvus story` → /newsletter/2026-05-19-corvus-case-study.html
- Miravoice:
  - `At the start of the free trial, Nori connected straight to the GitHub repository, Google Workspace, and BigQuery; ten minutes later, the Miravoice team was able to use their phones to set up an agent entirely in the cloud. It automatically provisioned a phone number to test the changes, and this was all set up faster than it would take to set up the dev environment locally.`
  - H3 `Miravoice` — `AI voice agents for telephone surveys and interviews`
  - Stats: `10 min` `to set up a cloud agent from a phone` · `>25%` `of merged PRs handled by Nori`
  - Link: `Read the Miravoice story` → /newsletter/2026-09-18-miravoice-case-study.html

### Closing / footer taglines (VERBATIM)

Three closing lines above the footer:

- `Runtimes sleep when idle and wake on demand`
- `Any model, any harness, any integration, any compute`
- `Infrastructure for your agent army`

### Role pages — H1 + lede (VERBATIM)

- https://noriagentic.com/for-ops.html — eyebrow `For ops`; H1 `End to end business automations without learning new tools.`; lede `Connect the systems you already use—CRM, finance, support, docs, and more—and run them from Slack. No terminal. No new app to learn.`; section H2s: `Stay in Slack, Teams, or wherever you do work. Skip the terminal.` / `Integrates with the tools you already run.` / `Automate the work end to end.`; closing `Just @nori. It ships.`; CTAs `Start free trial` · `Book a demo`.
  - Body: `Describe the work the way you’d ask a teammate. No CLI, no new dashboard, no training deck—just @nori in the channel you already live in.`
  - Body: `Salesforce, HubSpot, Google Sheets, Notion, Linear, Jira, Stripe, Gmail—and hundreds more. One agent across the stack, scoped per person, not a pile of logins.`
  - Body: `Reports, lead follow-ups, invoice pulls, status updates, client decks—multi-step jobs that used to bounce between tools and tickets, finished in one mention.`
- https://noriagentic.com/for-security-leaders.html — eyebrow `For security`; H1 `Secure agent sandboxes that minimize blast radius.`; lede `Isolated, ephemeral sandboxes with no tokens on the box. Per-user scoping. Ingress/egress rules. Real-time compliance checks. Real-time malicious behavior prevention.`
  - H2 `Why are Nori cloud agents more secure than local agents?` — table (Risk / Nori agents / Local agents):
    - `Access` — `Isolated sandbox only` `The agent never sees the host machine. Work stays inside an ephemeral session` vs `Anything on the laptop` `Files, keys, browser sessions, email—the agent can reach whatever the user can`
    - `Setup` — `Secure by default` `Scopes, ingress/egress rules, and compliance checks ship with the environment` vs `Hard to lock down correctly` `Per-machine policies, drift, and exceptions make a secure local setup extremely hard`
    - `Credentials` — `No tokens on the box` `Short-lived, scoped credentials never enter the session machine` vs `Secrets live on the box` `API keys and tokens sit on disk, waiting to walk out with the laptop`
  - H2 `Per user/team scopes.` — `Define what each person and team can reach. Every session only gets the access its role is granted—nothing more.`
  - H2 `Tokens never enter the box, the agent never leaves.` — `Credentials stay short-lived and scoped. Work stays inside the session. Nothing sits on a laptop waiting to walk out the door.`
  - H2 `Fully auditable traces.` — `Every session and every action is logged and searchable. Answer what ran, where, and on whose behalf—before the incident review.`
  - H2 `Prevent non-compliant use.` — `Legal and regulatory asks are stopped immediately—before the agent answers. Credit decisions, medical advice, and other regulated acts stay with licensed humans.`
  - Closing `Just @nori. It ships.`
- https://noriagentic.com/for-finance.html — eyebrow `For finance`; H1 `A centralized layer for tracking agent spend.`; lede `Attribute every dollar—per user, per agent, per pull request. Route each task to the cheapest capable model, and put hard caps on spend before it overruns.`
  - H2s: `Track spend per user, agent, and team.` / `See agent enablement per user.` (`Know exactly who is turned on for Claude Code, Codex, and Gemini—and change it in one place. Onboard, offboard, or restrict an agent without chasing seats across a dozen dashboards.`) / `Token cost per pull request.` (`Tie token spend to the work it produced. Every pull request carries the tokens and dollars it took to ship—so you can see which changes, and which agents, actually earn their cost.`) / `Guardrails: cheapest model per task, hard caps on spend.` (`Route each task to the cheapest model that can do it, and cap what any user, team, or agent can spend. When a budget is hit, Nori stops before the overage—not after the invoice.`)
  - Closing `Just @nori. It ships—on budget.`
- https://noriagentic.com/for-data.html — eyebrow `For data`; title `Nori — Agents that keep your master data clean.`; H1 (animated word) `Agents that keep your security master clean.`; lede `Duplicates pile up, records go stale, references break. Nori runs agents that reconcile, repair, and dedupe your golden records—continuously.`
  - H2s: `Dedupe and merge into one golden record.` / `Repair stale and broken records.` / `Every change reviewed and audited.` (`Every merge and fix lands as a reviewable diff you approve, with a full audit trail of what changed and why.`)
  - Closing `Just @nori. Your master data stays clean.`

NOTE: The repeated closing line across role pages is `Just @nori. It ships.` — this is the closest thing on the site to a slogan for the Slack flow.

### Open source page lede (VERBATIM)

https://noriagentic.com/open-source.html — H1 `Open source.`; lede `Nori is built on tools we give away. The CLI that runs any agent, the skillset system that moves your context anywhere, and a family of agent-oriented CLIs. Bring your keys, take your context, keep your tools — on our platform or off it. Browse the skills we publish at noriskillsets.dev.`

- `nori-cli` (Rust): `A simple, fast CLI for working with any agent — the harness at the core of Nori. A friendly fork of Codex, model- and provider-agnostic.` — `$ npm i -g nori-ai-cli && nori`
- `nori-skillsets` (TypeScript): `Manage collections of agent skills and switch between skillsets seamlessly. Your skills and org knowledge are yours — move them off our platform whenever you want.` — `$ npm i -g nori-skillsets && sks`
- Meta description: `... Bring your keys, take your context, keep your tools.`

### Careers page (VERBATIM)

https://noriagentic.com/open-roles.html — H1 `Open roles.`; `We are reinventing what it means to be a software engineer in the agentic era — living on the frontier of AI tooling and embedding that expertise into products for general use. We are looking for high-agency, mission-driven builders to join the team. Everything open right now is below.`; role `Member of Technical Staff` `Engineering` `Full-time` `Employee #2`; `We hire for taste and agency over titles.`

### llms.txt (VERBATIM, header only)

https://noriagentic.com/llms.txt

```
# Nori

> Agent-first cloud sessions for coding agents. Nori Sessions gives coding agents a durable remote runtime you drive from Slack or Discord, with cron and webhook triggers and long-lived org context.
```

Followed by `## Guides` (16 guide links), `## Comparisons` (Factory, Warp, Jules, Devin alternatives pages), `## Optional` (Newsletter, Open source, Home). Recurring phrase in the comparison blurbs: `why Nori Sessions runs any agent you choose, unattended and chat-native, at a flat price.`

---

## 2. Product demo flow as described on the site

### Homepage (VERBATIM — the only flow description on `/` is the three screenshot captions)

- `A Slack thread where Nori replies with a finished pull request`
- `A terminal where Nori investigates a bug, runs the tests, and opens a pull request`
- `A scheduled Nori trigger with its prompt, cron schedule, and last run`

### Welcome page (VERBATIM) — https://noriagentic.com/welcome.html

- H1 `Welcome to Nori`; `Your signup is confirmed. A member of the Nori team will reach out shortly to get in touch and finish setting up your agents.`
- H2 `While you wait, here's what you can prepare`
  - `GitHub access` — `Make sure your repositories are in a GitHub organization. Nori will need access to clone, branch, and open PRs on your behalf.`
  - `Slack workspace` — `Nori integrates with Slack so your team can delegate tasks by mentioning @nori in any channel. Know which workspace you'd like to connect.`
  - `Credentials and auth` — `Gather any API keys, tokens, or service credentials your agent will need. Nori uses a secure credential proxy, so keys never touch the VM.`

### For-ops page mock Slack exchange (VERBATIM)

`Maya`: `@nori pull last quarter’s churn by segment` → `nori` replies with `CSV` `churn-by-segment.csv` `Ready in Slack`. Three-step strip: `Connect your stack` → `Ask in Slack` → `Deliver the work`.

### Book-a-demo questionnaire (VERBATIM) — https://noriagentic.com/book-a-demo.html

- `Prefer to skip the questions? Book a time with Martin directly →`
- Q `What would you use Nori for?` options: `Access company tools and data from Slack` / `Let teammates work without waiting on engineering` / `Run engineering work from Slack or my phone` / `Automate recurring work with triggers`
- Q `How are you using agents today?` options: `Local coding agents` / `Another Slack or cloud agent` / `Internal scripts or automations` / `Not using agents yet`
- Q `What should Nori do first?` field `First task for Nori`; final button `Open Martin’s calendar ↵`

### Case studies (VERBATIM excerpts describing the flow)

Corvus — https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (Amol Kapoor, May 19, 2026):

- `Background agents let you run coding agents in the cloud, and interact with them from anywhere. ... They work where you work — in Slack, Linear, GitHub. They have a single environment that can be shared across a team, so no more having your sales person fiddling with dependencies. And they are always on, so they can solve problems even when you’re busy.`
- `Hear it, spin up an agent from your phone, get a PR ready by the time you’re back at the hotel.`
- `Nori lives in Slack directly. The agent reads the thread it’s tagged in, picks up the alert that just fired, sees the customer report someone pasted in an hour ago. No restaging, no rehashing.`
- Alex, CTO: `We discuss everything in Slack, and it’s very convenient to tag Nori directly there so it has all of our decision making and thinking. We’ve added Skills so it effectively takes this context, along with our broader docs (codebase, Notion, etc.), to build the feature and create a PR.`
- `Corvus averages 20 Nori sessions per day, over 100 per week.`
- Subtitle: `Background agents helped a four-person team in chemical manufacturing feel like twelve`

Miravoice — https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (Nori team, September 18, 2026):

- H1 `How Miravoice builds and tests voice agents from Slack`; subtitle `From a phone to a cloud development environment in ten minutes. Nori now handles more than 25% of Miravoice’s merged PRs.`
- `The Nori agent guided the team through connecting GitHub, Google Workspace, and BigQuery. It read through the repo to figure out what was required to get the phone calls. Ten minutes later, Shreyas, the COO, was able to land a PR and test it in a dev environment.`
- `Anyone in the Slack workspace can now ask Nori to change the bot, get a phone number, test the conversation, and hand the pull request to engineering for review before production.`
- Danny (CTO): `“Nori easily saves me 5 hours a week. I can’t begin to describe how much of a multiplier it is. There’s no going back.”`
- Shreyas (COO): `“I was completely blown away. We love Nori because it just works.”`
- `The Miravoice team had tried a half dozen different AI assistants, including Claude Tag, Codex, and Devin, before finally trying Nori.` Danny called them `“completely unusable for development.”`

NOTE on "proof": the words `proof`, `screenshot`, `recording`, `evidence` do not appear in homepage/role-page/case-study copy. The site does not describe a "proof attached to the PR" step. The FAQ says output can be a `pull request, commit, comment, or completed task` or a file. If the Jiro site claims PR proof artefacts, that is a new claim not currently on noriagentic.com (it exists as an internal org skill `add-pr-proof`, not as public copy).

---

## 3. Comparison content

### Homepage comparison table (VERBATIM) — https://noriagentic.com/#compare

H2: `Cloud coding agents, compared.`

Columns: (blank) | `Nori` | `Claude Tag` | `Devin` | `Cursor Cloud`

| Row | Nori | Claude Tag | Devin | Cursor Cloud |
|---|---|---|---|---|
| `Agent` | `Claude Code` `Codex CLI` `Gemini CLI` `pi` `Cursor Agent` `Goose` `GitHub Copilot` `Antigravity` `Snowflake Cortex` `› your own agent` (scrolling belt; aria-label: `Nori runs Claude Code, Codex CLI, Gemini CLI, pi, Cursor Agent, Goose, GitHub Copilot, Antigravity, Snowflake Cortex, or your own agent`) | `Claude only` | `Devin only` | `Cursor only` |
| `Model` | `any model, your keys` | `Anthropic only` | `routed for you` | `Cursor's catalogue` |
| `Context` | `org-wide, portable` | `Claude memories` | `API export` | `proprietary rules` |
| `Cloud` | `AWS·Azure·GCP` `your VPC` | `Anthropic only` | `hosted (VPC on contract)` | `hosted only` |
| `Pricing` | `flat (zero token markup)` | `API tokens, high volume` | `credits (token markup)` | `metered, per model` |

NOTE: "Claude Tag" is the site's name for Anthropic's Slack-tagged Claude agent (also referenced in the Miravoice story and the chat-native guide). There is no "good taste vs bad taste" or "clean code" comparison anywhere on the site; the only comparison content is the table above, the security table on `/for-security-leaders.html` (section 1), and the guide/alternatives articles.

### Integrations (VERBATIM aria-label on the homepage)

`Nori connects to 42 integrations, grouped by what they do: Engineering, Project, Finance, General, Visual.`

### Guides hub (VERBATIM lede) — https://noriagentic.com/guides.html

H1 `Guides`; `Field guides to the infrastructure agent-first teams run on — multi-agent orchestration, environment provisioning, chat-native and autonomous coding agents, runtimes, sandboxes, and cloud IDEs. Each guide compares the leading options with sourced pricing and capabilities. Essays and dev logs live on the newsletter.`

H2 `Comparisons` — `Head-to-head alternatives pages for the tools buyers weigh against Nori Sessions, each with the best options in 2026.` Pages: `/newsletter/factory-alternatives.html`, `/newsletter/warp-alternatives.html`, `/newsletter/jules-alternatives.html`, `/newsletter/devin-alternatives.html`.

Devin alternatives blurb (VERBATIM from llms.txt): `Devin is the autonomous software engineer everyone benchmarks against. The best alternatives in 2026 — Codex, Cursor Cloud, GitHub Copilot, Jules, and OpenHands — and why Nori Sessions runs the agent you already use, unattended and chat-native.`

---

## 4. FAQ (VERBATIM, complete) — https://noriagentic.com/ (section after pricing)

H2: `Frequently Asked Questions`

**Which coding agents can I run?**
`Claude Code, Codex, and Cursor. Any agent that speaks the Agent Client Protocol can be registered alongside them. Every agent runs on the same environment primitives, so you can mix agents across tasks or run several inside one workspace.`

**Can it work with our non-engineering tools?**
`Yes. Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe, and Gmail, plus hundreds more. One agent across the stack, scoped per person, rather than a pile of logins. Ops, finance, and data teams describe the work in Slack or Teams the way they would ask a teammate. No CLI and no new dashboard.`

**What does an agent's environment look like?**
`Each agent works in an isolated cloud environment with your repository, tools, dependencies, and services ready to use.`

**How does billing work?**
`Plans are sized by runtimes. The free trial runs five for 30 days, Developer gives one user up to three persistent runtimes, and Team gives multiple users five shared ones. Enterprise sets capacity to fit. Runtimes sleep when idle and wake on demand.`

**Is the output always a pull request?**
`No. Agents can return a pull request, commit, comment, or completed task for you to review, merge, or send back. An output can also be a file when that is what the work produces: a document, a spreadsheet, a presentation, or another office artifact.`

**What repositories can I use?**
`Any GitHub repository you have access to. Connect your GitHub account and select which repos to enable.`

NOTE: Six questions total. No FAQ entries about security, data retention, SOC 2, models/BYOK specifics, or cancellation.

---

## 5. Pricing (VERBATIM, complete) — https://noriagentic.com/#pricing

H2: `Pay per agent, no hidden fees.`

| Plan | Price | Description | Button |
|---|---|---|---|
| `Free trial` | `$0` `for 30 days` | `Five runtimes and the complete team experience` | `Start free` (`data-cta="pricing-free-trial"`, `data-plan="sessions"`) |
| `Developer` | `$99` `/month` | `One user, up to three persistent runtimes, integrations, triggers, and BYOK` | `Get started` (`data-cta="pricing-developer"`) |
| `Team` | `$250` `/month` | `Multiple users, five shared runtimes, organization controls, integrations, and collaboration` | `Get started` (`data-cta="pricing-team"`) |
| `Enterprise` | `Contact us` | `Custom capacity, role-based access control, audit trails, deployment, onboarding, and support` | `Talk to us` (mailto:amol@noriagentic.com?subject=Nori%20Sessions%20Enterprise) |

Footnote under the table: `No card required for the trial. Runtimes sleep when idle and wake on demand.`

NOTE on wording the parent asked about:
- The exact phrase `Free for 30 days. No card required.` does NOT appear. The site says `$0 for 30 days` and `No card required for the trial.`
- `bring your own subscription` does NOT appear anywhere on the site. The closest wording is `BYOK` (Developer plan), `any model, your keys` (comparison table), and `Bring your keys, take your context, keep your tools` (open-source page). "BYOK" is never expanded on the site.
- `BYOC` appears only in a guide blurb (`Northflank and Qodo Command meet you halfway with BYOC and CI`), not as a Nori plan feature. The Nori-side equivalent in the comparison table is `AWS·Azure·GCP your VPC` and Enterprise `deployment`.
- Billing unit is the "runtime" (not seats, not tokens). `flat (zero token markup)` is the comparison-table claim.
- The trial modal hard-codes `quantity=5` (five runtimes), matching the trial description.
- Terms of Service say the Service `is currently offered in early access and may change`.

---

## 6. Footer, legal links, URLs

### Footer (VERBATIM, homepage)

Links row: `Blog` (/newsletter.html) · `Guides` (/guides.html) · `Comparisons` (/guides.html#comparisons) · `Open source` (/open-source.html) · `Careers` (/open-roles.html) · `Skills` (https://noriskillsets.dev) · `Agentics NYC` (https://agenticsnyc.com) · `Privacy` (/privacy.html) · `Terms` (/terms.html) · `GitHub` (https://github.com/tilework-tech) · `Contact` (mailto:amol@noriagentic.com)

Brand row: `nori` `© 2026 Tilework Inc` and the EOF mark `$ exit · [process completed]` (a button, `data-moment="fish-roll"`).

There is no `Docs` or `Security` link in the footer or nav. Dashboard/sign-in is https://login.norisessions.com .

### Legal pages (VERBATIM headers)

- https://noriagentic.com/privacy.html — title `Nori Sessions Privacy Policy`; H1 `Privacy Policy`; `Last updated: June 16, 2026`; operator `Tilework Inc.`; covers `the Nori Sessions product and the noriagentic.com and norisessions.com websites`. Notable: `Nori Sessions provides managed cloud development sessions for AI coding agents.` Auth via `Google OAuth and Firebase Authentication`. Integration tokens `are held by our credential proxy and are not exposed to the session virtual machine.`
- https://noriagentic.com/terms.html — title `Nori Sessions Terms of Service`; H1 `Terms of Service`; `Last updated: June 16, 2026`. Section 1: `Nori Sessions provides managed cloud development sessions for AI coding agents, including session hosting, integrations with third-party tools (such as GitHub and Slack), and organization-level controls. The Service is currently offered in early access and may change, and features may be added or removed, over time.`

---

## 7. Brand / tone notes visible on the site

NOTE (observed from live CSS at `/_next/static/chunks/*.css` and the site source `design-tokens.css` v3.1):

- Theme: dark only (`color-scheme: dark`; design-tokens comment: `There is no light theme.`).
- Structural ramp (IBM Carbon / oxocarbon descent): `--deep #0e0e0e` (marketing canvas; live CSS also uses `#121212`), `--base #161616`, `--surface #1c1c1c`, `--overlay #262626`, `--subtle #393939`, `--muted #525252`, `--comment #8a8f98`, `--text #dde1e6`, `--fg #f2f4f8`.
- Brand accent: green `--green #42be65` / `--green-bright #6fdc8c` (`THE brand accent`). Functional: red `#f47067`/`#ff9cac`, yellow `#f2cc60`/`#fddc69`, blue `#78a9ff`/`#a6c8ff`, magenta `#be95ff`, cyan `#08bdba`. Verdant data ramp `--g0..--g7` (`#161616 → #6fdc8c`).
- Fonts actually loaded live: `IBM Plex Mono` (400/500/600, self-hosted) for terminal/mono voice and `General Sans` (400–700, from Fontshare) as `--font-sans` / `--font-display`. The design-token file also defines `Newsreader` italic as a serif "voice B" (used in legacy pages; the live Next homepage CSS references only Plex Mono and General Sans).
- Logo: two overlapping green rounded squares (`fill="#42be65"`), wordmark lowercase `nori`. Terminal aesthetics everywhere: `$` prompts, `--flag` eyebrows on sections (`--automate`, `--isolation`, `--spend`, `--ship`), `[process completed]` EOF line.
- Motion: hero is a looped silent video (`/backgrounds/hero-desktop.mp4`) of a generated "field"; a scrolling "belt" of agent/harness logos (`--t-belt: 46s`); a "braille field" closing artefact.
- Sushi motif already present (one place only): the footer `$ exit` button is described in `app/nori-chrome.css` as `the page's one opt-in personality moment: click it and a fish swims out, turns, and is cut into a sushi roll on the monospace grid.` Classes `.mo-fish` (blue), `.mo-rice`, `.mo-nori` (`--g3`), `.mo-roll` (green-bright). Design tokens mention library-only atoms `receipt, rice-grain progress, fish → roll easter egg`. Product name "nori" is itself the seaweed reference; "Handroll" is the terminal proxy name.
- No pixel-art, no "Jiro", no character/mascot appears anywhere on noriagentic.com (confirmed by grep across live HTML/CSS). The pixel-art Jiro character canon lives only in the local repo `/home/sprite/org/workspace/jiro.bot/brand/README.md` (copper dome helmet, cream faceplate, blue eyes, white hachimaki, indigo striped happi, speaker-grille mouth, faces left; approved design #19; one straight conveyor belt per scene).
- Tone of copy: terse, declarative, lowercase brand, "agent army" / "no lock in" / "any model, any harness, any integration, any compute" / "Just @nori. It ships." Customer proof is quoted by name and title.

---

## 8. jiro.bot status (checked 2026-10-01)

NOTE:

- `jiro.bot` is registered and delegated to AWS Route 53 (NS `ns-1175.awsdns-18.org`, `ns-1816.awsdns-35.co.uk`, `ns-361.awsdns-45.com`, `ns-833.awsdns-40.net`; SOA `awsdns-hostmaster.amazon.com`).
- There is no A, AAAA, or CNAME record for `jiro.bot` (NOERROR with empty answer). `www.jiro.bot` returns NXDOMAIN.
- Result: the domain does not resolve to any site; `curl https://jiro.bot` fails with `Could not resolve host`. Nothing is currently served.
- The local repo `/home/sprite/org/workspace/jiro.bot` (Vite/TypeScript) is the in-progress landing page: README describes `Landing page for Jiro, your AI Staff Engineer. A sushi bar you can play with: a conveyor belt runs down the page, every piece of sushi can be picked up with chopsticks, and there are 35 hidden surprises to find.`

---

## Sources

- https://noriagentic.com/ (homepage: hero, compare, visibility, quotes, pricing, FAQ, footer)
- https://noriagentic.com/llms.txt
- https://noriagentic.com/guides.html
- https://noriagentic.com/open-source.html
- https://noriagentic.com/book-a-demo.html
- https://noriagentic.com/welcome.html
- https://noriagentic.com/open-roles.html
- https://noriagentic.com/for-ops.html , /for-security-leaders.html , /for-finance.html , /for-data.html
- https://noriagentic.com/privacy.html , https://noriagentic.com/terms.html
- https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html
- https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html
- https://noriagentic.com/sitemap.xml (page inventory)
- Live CSS: https://noriagentic.com/_next/static/chunks/1wf5k9e5_rhdx.css (and two sibling chunks)
- Local source: /home/sprite/org/workspace/site-noriagentic/design-tokens.css , app/nori-chrome.css , fonts.css
- DNS: https://dns.google/resolve?name=jiro.bot&type=A (and NS/AAAA/CNAME)
