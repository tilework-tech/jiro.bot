# Factory alternatives (2026): Droids vs other background coding agents

Updated 2026-10-17

> **What are the best Factory AI alternatives?**
>
> Jiro is the simplest Factory alternative: connect GitHub, Slack and your Claude or ChatGPT subscription, then ask for work in Slack and get pull requests back from an agent running in its own cloud VM. Jiro is a background coding agent by Nori. Devin, Cursor cloud agents, OpenHands and GitHub Copilot cloud agent are the other main alternatives to Factory's Droids.

## Factory and its alternatives at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Factory | Local, Factory cloud, or your machines [1] | Multi-model; own keys in CLI/desktop only [2] | App, CLI, IDE, Slack, Linear, Jira [3] | Pro $20/mo; Plus $100; Max $200; Teams $60 + $40/seat [4] |
| Devin | Cognition cloud VMs, or local [5] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [6] | Web, desktop, CLI, Slack, Teams, Linear, Jira [7] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [8] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [9] | Billed at API prices for the chosen model; own keys chat-only [10] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [11] | Premium $30/mo+ (X Subscription) plus API-priced usage [12] |
| OpenHands | Local, OpenHands cloud, or self-hosted [13] | Own agent or popular CLIs; your keys [14] | GUI, CLI, API, GitHub, Slack, Jira [15] | Free (10 conversations/day hosted); Enterprise custom [16] |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [17] | Many models via GitHub; own keys not documented for it [18] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [19] | Pro $10; Pro+ $39; Max $100; Business $19/user [20] |

## Factory in October 2026

Factory sells agent-native software development; its agents are called Droids. [21] Droids run locally in the Droid CLI and Factory App, on Factory-managed cloud Droid Computers, or on machines you register. [1] It is built for large engineering organisations, and its deployment options show it. Factory Private, launched 2026-09-18, deploys Factory into a customer's VPC, on-premises or air-gapped network. [22]

That breadth is also why smaller teams look elsewhere: it is a platform to roll out. Droids work in the Factory App, Droid CLI, headless Droid Exec and IDEs, and take delegations from Slack, Linear and Jira. [3] Its own-key support stops at the local tools. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. [2]

## The alternatives, ranked

Ranked for a team that wants delegation without running a platform rollout.

### 1. Jiro: best for small teams that want it working this week

Setup is three connections: GitHub, Slack and a model provider (a Claude or ChatGPT subscription, an API key or OpenRouter). After that, each conversation gets its own cloud VM with your repos and setup script, running Claude Code or Codex (or Cursor, with a Cursor API key).

Your own subscription works in the cloud agent too, not just locally. Jiro opens pull requests for review and asks before merging to your main branch.

**Pick Jiro if** you want a coworker in Slack rather than a platform to roll out.

### 2. Devin: best for enterprise breadth without self-hosting

Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. [23] Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. [7]

**Pick Devin if** you want Factory-level integrations from a managed service. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. [24]

### 3. Cursor cloud agents: best for Cursor shops

Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. [9] Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. [11]

**Pick Cursor if** your developers already live in the editor. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. [12]

### 4. OpenHands: best open-source and air-gap-friendly option

OpenHands is an MIT-licensed open-source platform for software engineering agents. [25] OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. [13]

**Pick OpenHands if** you chose Factory for on-prem deployment but want to own the code.

### 5. GitHub Copilot cloud agent: best for GitHub-native guardrails

Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. [26] Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. [20]

**Pick Copilot if** your org already pays for Copilot Business or Enterprise.

## When Factory is the better choice

Choose Factory if you need air-gapped or on-premises deployment or Jira and Linear delegation at enterprise scale. Jiro does not offer self-hosting today.

## FAQ

### What is a simpler alternative to Factory AI?

Jiro. You install its Slack and GitHub apps, connect your own Claude or ChatGPT subscription, and ask for work in Slack. There is nothing to install on developers' machines.

### Does Factory let me use my own API keys?

Partly. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. [2] Jiro uses your own subscription or key for all of its cloud work.

### Is there an open-source alternative to Factory Droids?

OpenHands. OpenHands is an MIT-licensed open-source platform for software engineering agents. [25] OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. [13]

### Can Jiro run on-premises like Factory Private?

No. Jiro runs in Nori's cloud today. If on-premises deployment is a hard requirement, look at Factory Private or OpenHands.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Droids run locally in the Droid CLI and Factory App, on Factory-managed cloud Droid Computers, or on machines you register. Source: https://docs.factory.com/llms.txt (checked 2026-10-16)
2. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. Source: https://docs.factory.com/model-independence/byok.md (checked 2026-10-16)
3. Droids work in the Factory App, Droid CLI, headless Droid Exec and IDEs, and take delegations from Slack, Linear and Jira. Source: https://docs.factory.com/delegations/index.md (checked 2026-10-16)
4. Factory's plans are Pro at $20 a month, Plus at $100, Max at $200, and Teams at $60 a month plus $40 per seat for up to 10 seats; Business and Enterprise are custom. Source: https://factory.com/pricing (checked 2026-10-16)
5. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
6. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
7. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
8. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
9. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
10. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
11. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
12. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
13. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
14. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
15. OpenHands works from its GUI, CLI, SDK and API, from GitHub, GitLab and Bitbucket, and from Slack and Jira. Source: https://openhands.dev/pricing (checked 2026-10-16)
16. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
17. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
18. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
19. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
20. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
21. Factory sells agent-native software development; its agents are called Droids. Source: https://factory.com/ (checked 2026-10-16)
22. Factory Private, launched 2026-09-18, deploys Factory into a customer's VPC, on-premises or air-gapped network. Source: https://factory.com/news/factory-private (checked 2026-10-16)
23. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
24. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
25. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
26. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
