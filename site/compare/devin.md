# Jiro vs Devin (2026): Model Billing, Harness Choice and Team Fit

Updated 2026-10-19

> **Jiro vs Devin: which background coding agent should I use?**
>
> Jiro suits engineering teams of roughly five to twenty that already hold Claude or ChatGPT subscriptions, since it hosts Claude Code, Codex or Cursor against those credentials and charges only for runtimes. Devin suits buyers who prefer one vendor to supply the agent, the model routing and the usage bill, or who need Microsoft Teams, GitLab or a dedicated VPC. Jiro is a background coding agent by Nori.

## Jiro and Devin compared line by line

|  | Jiro | Devin |
|---|---|---|
| Product | Background coding agent by Nori | Autonomous software engineer (Cognition) [1] |
| Agent harness | Claude Code, Codex, Cursor [2] | Devin's own agent; Desktop also hosts ACP agents [3] |
| Model access | Your Claude/ChatGPT login or API key; Cursor key [4] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [5] |
| Token pricing | Your keys, zero token markup [6] | Overage at API pricing (see plan pricing) |
| Execution environment | Isolated cloud environment with your repos and tools [7] | Cognition cloud VMs, or local [8] |
| Where work starts | Slack, web, Discord, terminal, schedules, webhooks [9] | Web, desktop, CLI, Slack, Teams, Linear, Jira [10] |
| Scheduled and event work | Cron, one-off reminders, webhooks [11] | Schedules, webhooks, Slack/GitHub/Linear events [12] |
| Output | PRs, commits, comments for review [13] | Opens and maintains PRs [14] |
| Tenancy | Single-tenant per organization [15] | Dedicated VPC deployment (Enterprise) [16] |
| Plans | Free 30-day trial; Developer $99/mo; Team $250/mo [17] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [18] |

## How the two products are built

The two products answer a different question about the same job. Devin is Cognition's own agent, running in Cognition's cloud or locally through Devin Desktop and the CLI. [3] [8] Cognition chooses which model handles each step through an Adaptive router that mixes Anthropic, OpenAI, Google and in-house SWE models. [5]

Jiro does not ship its own model or its own agent loop. It hosts Claude Code, Codex or Cursor, and the buyer chooses which. [2] Each conversation gets an isolated cloud environment holding the organisation's repositories and whatever its setup script installs. [7] [19]

One is a vertically integrated agent. The other is a managed place to run the agents a team already uses.

## Where Devin is stronger

Breadth of surfaces comes first. Devin takes work from its web app, desktop app, CLI, Slack, Microsoft Teams, Linear and Jira, and it handles GitHub, GitLab and Bitbucket repositories. [10] Jiro covers Slack, web, Discord, a terminal, schedules and webhooks, and connects to GitHub. [9] [20] Organisations on Teams or GitLab have a clear answer.

Event-driven automation is the second gap. Devin Automations can open a session when something happens in Slack, GitHub or Linear, as well as on a schedule or webhook. [12] Jiro offers cron, one-off reminders and webhooks. [11] Teams that want a session per new Linear ticket get that natively from Devin.

Pull request upkeep is a third. Devin answers review comments, splits large changes into stacked PRs and repairs merge conflicts on its own branches. [14] That is mature tooling.

Finally, deployment. Enterprise buyers can get a dedicated single-tenant VPC, although agent planning still runs in Cognition's cloud. [16] Jiro runs a single-tenant broker per organisation on Nori's hosting, not in the customer's network. [15]

Devin wins on reach.

## Where Jiro is stronger

Model economics are the main difference. Devin's self-serve plans include a quota and bill anything beyond it at API pricing. [18] Jiro adds no markup and runs on the Claude login, ChatGPT login or API key the team already holds. [6] [4] For a Claude subscriber, that means signing in once with `claude setup-token`, which issues a year-long token bound to the buyer's Claude subscription tier, and connecting it. [21] Devin's plan linking, by contrast, covers ChatGPT and only the GPT share of usage. [5]

Harness choice is the second. A team that already tuned CLAUDE.md files and Claude Code habits keeps them. From a single skillset, Jiro emits a CLAUDE.md, an AGENTS.md or a copilot-instructions.md, whichever each agent expects. [22] Switching from Claude Code to Codex mid-project is a setting, not a vendor change.

The environment is a full machine. Teams install arbitrary CLIs, connect MCP servers from a catalog, and wire in Linear, Jira, Notion or HubSpot. [23] [24]

Temperament matters too, though it is harder to put in a table. Jiro is built to care about quality over volume and to flag a misguided ticket before writing it. Nori customers report concrete results: more than one in four pull requests merged at Miravoice, about five hours a week back for one of its engineers. [25]

Jiro wins on control of cost and tooling.

## Cost for a team of eight

Take eight engineers. On Devin Teams, the published structure is a minimum of $80 a month, $40 for every seat, and overage priced like the API. [18] Read as additive, that comes to around $400 a month before overage; buyers should confirm how the minimum and seats combine.

Nori charges $250 monthly for Team: several users, five shared runtimes. [17] Model usage is then whatever the team already spends with Anthropic or OpenAI. If those subscriptions exist anyway, the marginal cost is the runtime fee. If they do not, add them: Claude Max runs $100 or $200 per person monthly. [26]

Neither is cheap in absolute terms. Jiro is cheaper only where the model spend was already sunk.

Concurrency deserves a line as well. Devin's Free and Pro tiers stop at ten simultaneous sessions, while Max and Teams are uncapped. [27] Jiro's limit is the runtime count on the plan, three for Developer and five for Team, and runtimes sleep when idle. [28] A team that routinely fans out a dozen parallel tasks will feel that ceiling. Most teams of eight will not.

## Which buyer fits which product

A 5–20 person engineering team, on GitHub and Slack, already paying for Claude or ChatGPT, that wants small tickets, docs, test gaps and on-call fixes handled in the background: Jiro fits.

A larger organisation that runs Microsoft Teams or GitLab, wants Linear events to start sessions, and prefers a single invoice covering agent and models: Devin fits.

Organisations that cannot decide can run both on the same repositories during a trial. Other contenders are ranked in a [separate list](https://jiro.bot/alternatives/devin), and a [Devin-to-Jiro migration plan](https://jiro.bot/switch/devin-to-jiro) covers setup.

## FAQ

### Is Jiro cheaper than Devin?

Usually, when the team already pays for Claude or ChatGPT, because Jiro charges for runtimes and passes model usage through without markup. [6] Without existing subscriptions, the comparison depends on usage. [18]

### Does Jiro use its own model like Devin does?

No. Jiro runs Claude Code, Codex or Cursor with the customer's credentials. [2] Devin routes across several vendors' models and Cognition's own. [5]

### Can both work from Slack?

Yes. Devin also supports Microsoft Teams; Jiro adds Discord and a terminal. [10] [9]

### Which one handles GitLab?

Devin does. [10] Jiro works with GitHub repositories through its GitHub App. [20]

### Is Jiro related to Kiro or Jira?

No. Kiro is Amazon's coding agent and Jira is Atlassian's tracker; Jiro is made by Nori.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
2. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Devin Cloud runs Cognition's Devin agent; Devin Desktop can also host other agents that speak ACP. Source: https://cognition.com/blog/introducing-devin-desktop (checked 2026-10-16)
4. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
5. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
6. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
7. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
8. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
9. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
10. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
11. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
12. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. Source: https://docs.devin.ai/product-guides/automations.md (checked 2026-10-16)
13. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
14. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
15. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
16. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
17. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
18. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
19. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
20. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
21. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
22. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
23. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
24. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
25. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
26. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
27. Free and Pro allow up to 10 concurrent Devin sessions; Max and Teams have no concurrency cap. Source: https://docs.devin.ai/admin/billing/self-serve.md (checked 2026-10-16)
28. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
