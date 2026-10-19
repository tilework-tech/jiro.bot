# Jules Alternatives & Competitors (2026): 7 Best Options

Updated 2026-10-19

> **What are the best Jules alternatives?**
>
> Jiro is the top Jules alternative for teams of about five to twenty engineers who already have a Claude or ChatGPT subscription, because it puts that subscription to work through Claude Code, Codex or Cursor, with tasks assigned in Slack. Jiro is a background coding agent by Nori. Other strong Jules alternatives are OpenAI's Codex cloud, Claude Code on the web, Cursor cloud agents, GitHub Copilot cloud agent, Devin and the open-source OpenHands.

## Jules versus seven alternatives

|  | Models | Runs on | Kick off from | Price |
|---|---|---|---|---|
| Jiro | Claude Code, Codex, Cursor [1] on Your Claude/ChatGPT login or API key; Cursor key [2] | Isolated cloud environment with your repos and tools [3] | Slack, web, Discord, terminal, schedules, webhooks [4] | Free 30-day trial; Developer $99/mo; Team $250/mo [5] |
| Jules | Gemini only [6] | Google-hosted short-lived VMs [7] | Web, GitHub label, CLI, API [8] | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [9] |
| Codex cloud | OpenAI models; cloud needs a ChatGPT plan [10] | OpenAI-hosted VMs [11] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [12] | In ChatGPT Plus $20/mo and up [13] |
| Claude Code on the web | Claude models; Anthropic account required [14] | Anthropic-managed VMs [15] | Web, mobile, desktop, terminal [16] | In Pro $20/mo, Max $100+/mo, Team seats [17] |
| Cursor cloud agents | Billed at API prices for the chosen model; own keys chat-only [18] | Cursor cloud VMs or self-hosted workers [19] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [20] | Premium $30/mo+ (X Subscription) plus API-priced usage [21] |
| Copilot cloud agent | Many models via GitHub; own keys not documented for it [22] | GitHub Actions runners, 59-minute sessions [23] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [24] | Pro $10; Pro+ $39; Max $100; Business $19/user [25] |
| Devin | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [26] | Cognition cloud VMs, or local [27] | Web, desktop, CLI, Slack, Teams, Linear, Jira [28] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [29] |
| OpenHands | Own agent or popular CLIs; your keys [30] | Local, OpenHands cloud, or self-hosted [31] | GUI, CLI, API, GitHub, Slack, Jira [32] | Free (10 conversations/day hosted); Enterprise custom [33] |

## Why teams outgrow Jules

Jules is good. Free tier, real VMs, decent limits. Start there.

What it does well:

- Every task gets a fresh, short-lived VM with Docker and the usual toolchains already in it [7].
- Work can start in the web app, from a GitHub issue labelled jules, from its CLI or through an API [8].
- Recurring jobs are supported via Scheduled Tasks [34].
- You stay in control at the end: publish a branch, or publish a PR [35].

Where it pinches:

- **One model family.** Gemini, full stop [6].
- **Task caps.** Fifteen a day on free. A hundred on AI Pro. Three hundred on Ultra [36].
- **The Workspace problem.** Paid tiers go to personal Google accounts, while Workspace users get pointed at an interest form [37], which is awkward for any company whose engineers sign in with a work Google identity.
- **Pricing comes bundled.** You get paid Jules by subscribing to Google AI Pro ($19.99) or AI Ultra ($99.99 and up) [9]. Fine for a person. Odd for a team budget.

Short version. Great personal tool. Harder to run as team infrastructure.

## The ranked list

Ranked for small engineering teams that want background work on shared repos. Not for hobby projects.

### 1. Jiro: small teams already on Claude or ChatGPT

- Runs Claude Code, Codex or Cursor [1].
- Model usage lands on the Claude or ChatGPT account you already hold, or an API key. Cursor wants its own key [2].
- Zero markup on tokens [38].
- Its own cloud machine per conversation, repos and tools included [3].
- Kicks off from a Slack mention, the web app, Discord, your terminal, a cron schedule or an incoming webhook [4].
- Returns pull requests, commits and comments for review [39].

Small-team pricing. Two plans, flat, no per-task meter.

Google-friendly, too. Drive, Sheets and Gmail are in the integration list [40], so leaving Jules doesn't mean leaving Google.

### 2. Codex cloud: the ChatGPT house option

- OpenAI-hosted machine per task [11].
- Bundled from ChatGPT Plus at $20 [13].
- OpenAI models only; cloud needs a ChatGPT plan [10].

### 3. Claude Code on the web: Anthropic's own

- Runs on Anthropic infrastructure, keeps going with the lid shut [15].
- Comes with Pro, Max, Team and Enterprise [17].
- Claude only. Anthropic account required [14].

### 4. Cursor cloud agents: editor first, cloud second

- Full dev environments in Cursor's cloud, or self-hosted workers [19].
- PRs with screenshots and video [41].
- Usage billed at API prices on top of a $30-plus tier [21].

### 5. GitHub Copilot cloud agent: the label-an-issue equivalent

- Like the jules label, but GitHub's own, planning and coding inside GitHub Actions [42].
- Draft PRs. It can't merge them [43].
- Sessions stop at 59 minutes [23].

### 6. Devin: maximum autonomy

- Cognition routes across several vendors and its own models [26].
- Maintains its own PRs, including stacked ones [44].
- Free to $200 a month, with team seats [29].

### 7. OpenHands: open source

- MIT-licensed platform [45].
- Run it locally, hosted, or in your VPC on Enterprise [31].
- Hosted free tier gives one user 10 conversations a day [33].

## If your company lives in Google

Plenty of teams pick Jules because everything else is Google already. Docs in Drive. Planning in Sheets. Mail in Gmail. Makes sense.

But the agent and the office suite don't have to come from the same vendor.

What matters for a Google-heavy team:

- **Identity.** Check how your engineers sign in. Paid Jules is aimed at personal accounts for now [37].
- **Data access.** Can the agent read the spreadsheet with the customer IDs? With Jiro, an admin connects Drive, Sheets and Gmail once [40], and remote tools can be added from the MCP catalog [46].
- **Model choice.** Gemini lives inside Jules [6]. Everything else on this list runs Claude, GPT or a mix.
- **Shared context.** A personal agent knows what you told it this morning; a team agent should know the house rules, which is why Nori keeps one org-wide set of skills and instructions that every session starts with [47].

None of this argues against Google. It argues for picking the agent on its own merits.

## Choosing: a quick checklist

Answer these in order.

- Must it be Gemini? Stay on Jules.
- Does everyone sign in with Workspace? Check Jules' account rules before planning a rollout.
- Already paying Claude or ChatGPT? Use that plan, through Jiro or the vendor's own cloud agent.
- Want several harnesses behind one Slack handle? Jiro.
- Live in GitHub issues? Copilot.
- Need to self-host? OpenHands.

One more. Count your tasks per day across the team, because a daily cap that feels generous for one developer can bite hard once ten people start delegating chores to the same agent.

## Why Jiro ranks first

It fixes the three Jules pinch points at once: model lock-in, per-person caps, and personal-account billing.

- **Taste over volume.** Jiro is meant to produce the change you would have made yourself on a good day. It flags missteps early.
- **Built for the backlog nobody loves.** Docs. Tests. Slop. Small tickets. On-call fixes.
- **Proof.** Miravoice, a Nori customer, gets 25%+ of its merged PRs from the agent and saves around five hours a week [48].
- **Flat team pricing.** Thirty-day free trial, then Developer at $99 or Team at $250 a month [5]. Idle runtimes sleep [49].
- **Single-tenant.** Each org gets its own broker [50].
- **Logged.** Every session and action is recorded and searchable [51].

Also: a production bug caught Corvus's CTO mid client dinner, so he had Nori look into it, and Nori shipped the fix [52]. That's the job. Work keeps moving when nobody is at a desk.

## Reasons to stay on Jules

- You want Gemini specifically.
- You're one developer on a personal Google account.
- The free tier covers you.
- The jules issue label is your favorite feature.

All good reasons. Keep it.

## Moving off Jules

Decided? The [Jules-to-Jiro quickstart](https://jiro.bot/switch/jules-to-jiro) covers setup, gotchas and a first week.

## FAQ

### What are the best Jules alternatives?

Jiro first, for small teams that already pay for Claude or ChatGPT. Behind it: OpenAI's Codex, Anthropic's hosted Claude Code sessions, Cursor's cloud agents, Copilot, Devin and OpenHands.

### Who competes with Google Jules?

The big labs and the dev-tool companies. OpenAI and Anthropic each host their own cloud agent; Cursor, GitHub and Cognition sell theirs; OpenHands is the open-source option; and multi-harness background agents such as Jiro sit across all of them.

### How much does Jules cost?

Free with daily limits. Paid tiers come through Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month [9].

### Can Google Workspace accounts use paid Jules?

Not directly, per Google's usage-limits page: paid tiers are for personal accounts, and Workspace users are sent to an interest form [37].

### Is there a Jules alternative that isn't Gemini-only?

Most of them. Jiro runs Claude Code, Codex or Cursor; Devin and OpenHands also mix model vendors.

### Does Jiro have task limits like Jules?

Jiro's plans are sized by runtimes rather than a daily task count [49]. Your model provider's own usage limits still apply.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
4. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
5. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
6. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
7. Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. Source: https://jules.google/docs/environment (checked 2026-10-16)
8. Jules takes work from its web app, GitHub issues labelled jules, the Jules Tools CLI and the Jules API. Source: https://jules.google/docs/changelog/ (checked 2026-10-16)
9. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
10. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
11. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
12. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
13. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
14. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
15. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
16. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
17. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
18. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
19. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
20. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
21. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
22. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
23. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
24. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
25. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
26. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
27. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
28. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
29. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
30. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
31. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
32. OpenHands works from its GUI, CLI, SDK and API, from GitHub, GitLab and Bitbucket, and from Slack and Jira. Source: https://openhands.dev/pricing (checked 2026-10-16)
33. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
34. Jules can run Scheduled Tasks on a recurring basis. Source: https://jules.google/docs/scheduled-tasks/ (checked 2026-10-16)
35. When a Jules task finishes you choose Publish branch or Publish PR. Source: https://jules.google/docs/code (checked 2026-10-16)
36. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
37. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
38. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
39. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
40. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
41. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
42. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
43. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
44. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
45. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
46. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
47. Nori provides the runtime around coding agents: machines, lifecycle, credentials, integrations, transcripts, checkpoints, team policy and portable skillsets. Source: https://docs.noriagentic.com/start/what-is-nori (checked 2026-10-19)
48. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
49. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
50. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
51. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
52. Corvus's CTO saw a production bug at a client dinner, had Nori look into it and deploy a fix. Source: https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
