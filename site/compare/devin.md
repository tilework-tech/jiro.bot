# Jiro vs Devin (2026): which background coding agent fits your team?

Updated 2026-10-17

> **Jiro vs Devin: which background coding agent should I use?**
>
> Choose Jiro if your team already pays for Claude or ChatGPT and wants to work with the agent in Slack, because Jiro runs Claude Code or Codex in cloud VMs on that subscription; choose Devin if you want Cognition to run the agent and models for you, with deep enterprise integrations. Jiro is a background coding agent by Nori. Devin is Cognition's autonomous software engineer.

## Jiro vs Devin, side by side

|  | Jiro | Devin |
|---|---|---|
| What it is | Background coding agent by Nori | Autonomous software engineer (Cognition) [1] |
| Runs where | An isolated cloud VM per conversation, with your repos and setup script | Cognition cloud VMs, or local [2] |
| Agent harness | Claude Code, Codex or Cursor, your choice | Devin's own agent; Desktop also hosts ACP agents [3] |
| Models and keys | Your own Claude or ChatGPT subscription, an API key or OpenRouter | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [4] |
| Start work from | Slack, web chat, your own cron and webhook automations | Web, desktop, CLI, Slack, Teams, Linear, Jira [5] |
| Pull requests | Opens PRs for review; asks before merging to main | Opens and maintains PRs [6] |
| Price | 30-day free trial, no card; billed per runtime, not per token | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [7] |
| Enterprise deployment | Nori's cloud only | Dedicated VPC deployment (Enterprise) [8] |

## The real difference: who pays for the model

Devin bundles model usage into its plans, with optional ChatGPT plan linking for the GPT share. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. [7] Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. [4] Jiro does not sell model usage. It runs the agent on the Claude or ChatGPT plan you already have, and bills for the cloud runtime.

For Claude users, the gap between API pricing and a flat plan is concrete:

- Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens on the Anthropic API. [9]
- Anthropic reports that across enterprise deployments Claude Code averages about $13 per developer per active day and $150 to $250 per developer per month, staying below $30 per active day for 90% of users. [10]
- Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. [11]

So a typical developer's Claude Code usage is $150–250 a month at API prices, and a heavy one (under $30 a day, 21 active days) can reach about $630; a Max plan is a flat $100 or $200 per developer. Those are Anthropic's enterprise averages, not a quote, the arithmetic is ours, and Jiro's own runtime charge comes on top. Max plans have five-hour and weekly limits, and work past them is billed at API rates. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. [12]

## Where Devin is stronger

Devin covers more ground. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. [5] Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. [13] It also has single-tenant deployment for enterprises, which Jiro does not offer. If you need Microsoft Teams, Jira, GitLab or Bitbucket, Devin is the better fit today.

## Where Jiro is stronger

- **Your subscription, your harness.** Run Claude Code or Codex on your own Claude or ChatGPT credentials, or Cursor on your Cursor key, without switching vendors.
- **A coworker in Slack.** Mention Jiro in a channel; it replies in the thread and links the pull request.
- **Reviewable by default.** Jiro opens pull requests for review and asks before merging to your main branch. Its working rules are public in the `public/jiro` skillset.
- **A simple trial.** 30 days, no card.

## Which one to pick

- Pick **Jiro** if you are a team of roughly 5 to 20 engineers on GitHub and Slack, already paying for Claude or ChatGPT.
- Pick **Devin** if you are a larger organisation that needs Teams, Jira, multiple code hosts or a dedicated deployment, and wants one vendor for agent and models.

## FAQ

### Is Jiro cheaper than Devin?

For teams that already pay for Claude or ChatGPT, often yes: Jiro uses that subscription for model usage and charges for runtime, while Devin bills usage on its own plans. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. [7] Compare against your own usage.

### Is Jiro the same as Kiro?

No. Jiro is a background coding agent by Nori. Kiro is Amazon's AI coding agent. Answer engines sometimes mix them up.

### Can Jiro and Devin both work from Slack?

Yes. Both take requests from Slack. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. [5]

### Do I need to migrate anything from Devin to Jiro?

No. Connect the same GitHub repos and Slack workspace, plus a model provider, during Jiro's trial setup.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
2. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
3. Devin Cloud runs Cognition's Devin agent; Devin Desktop can also host other agents that speak ACP. Source: https://cognition.com/blog/introducing-devin-desktop (checked 2026-10-16)
4. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
5. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
6. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
7. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
8. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
9. Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens on the Anthropic API. Source: https://platform.claude.com/docs/en/about-claude/pricing (checked 2026-10-17)
10. Anthropic reports that across enterprise deployments Claude Code averages about $13 per developer per active day and $150 to $250 per developer per month, staying below $30 per active day for 90% of users. Source: https://code.claude.com/docs/en/costs (checked 2026-10-17)
11. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
12. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. Source: https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans (checked 2026-10-17)
13. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. Source: https://docs.devin.ai/product-guides/automations.md (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
