# Devin alternatives (2026): background coding agents compared

Updated 2026-10-17

> **What are the best Devin alternatives?**
>
> The best Devin alternative for most teams is Jiro, because it runs Claude Code or Codex in its own cloud VMs on the Claude or ChatGPT subscription you already pay for, instead of a separate usage quota. Jiro is a background coding agent by Nori. Other strong options are OpenAI Codex cloud, Cursor cloud agents, GitHub Copilot cloud agent, Google Jules and the open-source OpenHands.

## Devin and its alternatives at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Devin | Cognition cloud VMs, or local [1] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [2] | Web, desktop, CLI, Slack, Teams, Linear, Jira [3] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [4] |
| Codex cloud | OpenAI-hosted VMs [5] | OpenAI models; cloud needs a ChatGPT plan [6] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [7] | In ChatGPT Plus $20/mo and up [8] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [9] | Billed at API prices for the chosen model; own keys chat-only [10] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [11] | Premium $30/mo+ (X Subscription) plus API-priced usage [12] |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [13] | Many models via GitHub; own keys not documented for it [14] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [15] | Pro $10; Pro+ $39; Max $100; Business $19/user [16] |
| Jules | Google-hosted short-lived VMs [17] | Gemini only [18] | Web, GitHub label, CLI, API [19] | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [20] |
| OpenHands | Local, OpenHands cloud, or self-hosted [21] | Own agent or popular CLIs; your keys [22] | GUI, CLI, API, GitHub, Slack, Jira [23] | Free (10 conversations/day hosted); Enterprise custom [24] |

## Where Devin stands in October 2026

Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. [25] It is one of the most complete products in the category, with cloud and local agents and browser testing. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. [3]

The pricing model changed this year. Cognition replaced its ACU-based Core and Team plans with quota-based self-serve plans on 2026-04-14. [26] Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. [4] The desktop editor changed too: Windsurf became Devin Desktop on 2026-06-02. [27]

People who search for Devin alternatives usually want one of three things: to stop paying a second bill for model usage they already have through Claude or ChatGPT, to pick the agent harness themselves, or to get an open-source agent they can run anywhere.

## The alternatives, ranked

Ranked for a team of 5 to 20 engineers that wants an agent working in the background on real repos, not a prototype tool.

### 1. Jiro: best if you already pay for Claude or ChatGPT

Jiro runs the coding agent you choose (Claude Code, Codex or Cursor) in an isolated cloud VM with your GitHub repos checked out and your setup script run. You talk to it in Slack or the web chat, and it opens pull requests for your team to review. It asks before it merges anything to your main branch.

Claude Code and Codex run on your own Claude subscription, ChatGPT subscription or API key, and Cursor on your Cursor API key, so you are not buying model usage twice. Jiro charges for the cloud runtime, not the tokens.

Jiro's engineering rules are public in the `public/jiro` skillset: pin down what to build before building it, write the test first, attach proof to the PR, and push back on bad ideas.

**Pick Jiro if** you want a background coding agent that works in Slack, uses the subscription you already have, and lets you switch agent harnesses without switching vendors.

### 2. OpenAI Codex cloud: best if your team lives in ChatGPT

Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. [5] Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. [8]

**Pick Codex cloud if** everyone already has a ChatGPT plan and OpenAI models are all you need. It runs OpenAI models only, and the GitHub and Linear integrations still sit on the legacy cloud. Codex Cloud (Legacy) still powers Code Review and the GitHub and Linear integrations, and OpenAI plans to deprecate it. [28]

### 3. Cursor cloud agents: best if your team already works in Cursor

Cursor now calls its background agents Cloud Agents. [29] Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. [30] Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. [11]

**Pick Cursor cloud agents if** the editor is already your team's home. Check the pricing change first: Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. [12]

### 4. GitHub Copilot cloud agent: best for issue-in, PR-out on GitHub

GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [31] Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. [32] Those are the strictest default guardrails in this list.

**Pick Copilot if** you want the agent inside GitHub itself and your tasks fit in a single session. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. [13]

### 5. Google Jules: best free tier

Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. [33] Jules runs on Google's Gemini models. [18]

**Pick Jules if** you want to try a cloud agent for free on personal projects. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. [34]

### 6. OpenHands: best open-source option

OpenHands is an MIT-licensed open-source platform for software engineering agents. [35] OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. [21]

**Pick OpenHands if** you need to run everything on your own infrastructure or want to read and change the agent's code.

## When Devin is still the right call

Stay with Devin if you need Microsoft Teams, Jira or GitLab today, a dedicated VPC deployment, or a vendor that handles model choice for you. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. [36] Devin's automations are also mature. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. [37]

## What bringing your own Claude subscription saves

Devin bills usage past its quota at API prices. Jiro runs Claude Code on your own Claude credentials, so for Claude users the comparison that matters is API pricing against a flat subscription.

- Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens on the Anthropic API. [38]
- Anthropic reports that across enterprise deployments Claude Code averages about $13 per developer per active day and $150 to $250 per developer per month, staying below $30 per active day for 90% of users. [39]
- Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. [40]

So a typical developer's Claude Code usage is $150–250 a month at API prices, and a heavy one (under $30 a day, 21 active days) can reach about $630; a Max plan is a flat $100 or $200 per developer. Those are Anthropic's enterprise averages, not a quote, the arithmetic is ours, and Jiro's own runtime charge comes on top either way. Max has limits: heavy agent work can hit the five-hour or weekly cap, and anything beyond it is billed at API rates. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. [41]

## FAQ

### What is the best alternative to Devin?

For teams that already pay for Claude or ChatGPT, Jiro: it runs Claude Code or Codex in cloud VMs on that subscription and works from Slack. For ChatGPT-only teams, Codex cloud; for GitHub-only workflows, Copilot cloud agent; for self-hosting, OpenHands.

### Is there a cheaper alternative to Devin?

Yes, if you already have a Claude or ChatGPT plan. Jiro uses that plan for model usage and charges for cloud runtime, so you avoid paying for model usage twice. Jules and OpenHands also have free tiers.

### Is Jiro the same as Devin?

No. Jiro is a background coding agent by Nori. Both run coding work in cloud VMs and work from Slack, but Jiro runs the agent harness you pick on your own model subscription, while Devin runs Cognition's agent on Cognition's plans.

### What carries over if I move from Devin to Jiro?

Your GitHub repos and Slack workspace: Jiro connects to the same ones during trial setup. Devin-specific setup, such as playbooks, knowledge and automations, does not carry over; you recreate your setup script and any automations in Jiro.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
2. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
3. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
4. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
5. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
6. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
7. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
8. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
9. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
10. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
11. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
12. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
13. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
14. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
15. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
16. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
17. Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. Source: https://jules.google/docs/environment (checked 2026-10-16)
18. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
19. Jules takes work from its web app, GitHub issues labelled jules, the Jules Tools CLI and the Jules API. Source: https://jules.google/docs/changelog/ (checked 2026-10-16)
20. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
21. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
22. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
23. OpenHands works from its GUI, CLI, SDK and API, from GitHub, GitLab and Bitbucket, and from Slack and Jira. Source: https://openhands.dev/pricing (checked 2026-10-16)
24. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
25. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
26. Cognition replaced its ACU-based Core and Team plans with quota-based self-serve plans on 2026-04-14. Source: https://cognition.com/blog/new-self-serve-plans-for-devin (checked 2026-10-16)
27. Windsurf became Devin Desktop on 2026-06-02. Source: https://cognition.com/blog/introducing-devin-desktop (checked 2026-10-16)
28. Codex Cloud (Legacy) still powers Code Review and the GitHub and Linear integrations, and OpenAI plans to deprecate it. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
29. Cursor now calls its background agents Cloud Agents. Source: https://cursor.com/help/ai-features/background-agents (checked 2026-10-16)
30. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
31. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
32. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
33. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
34. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
35. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
36. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
37. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. Source: https://docs.devin.ai/product-guides/automations.md (checked 2026-10-16)
38. Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens on the Anthropic API. Source: https://platform.claude.com/docs/en/about-claude/pricing (checked 2026-10-17)
39. Anthropic reports that across enterprise deployments Claude Code averages about $13 per developer per active day and $150 to $250 per developer per month, staying below $30 per active day for 90% of users. Source: https://code.claude.com/docs/en/costs (checked 2026-10-17)
40. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
41. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. Source: https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
