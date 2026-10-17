# Jules alternatives (2026): cloud coding agents beyond Google's

Updated 2026-10-17

> **What are the best alternatives to Google Jules?**
>
> If you have outgrown Jules's Gemini-only models or its personal-account paid tiers, Jiro is the best alternative for teams: it runs Claude Code or Codex in cloud VMs on your own Claude or ChatGPT subscription and takes requests in Slack. Jiro is a background coding agent by Nori. Codex cloud, Cursor cloud agents, Copilot cloud agent, Devin and OpenHands are the other serious options.

## Jules and its alternatives at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Jules | Google-hosted short-lived VMs [1] | Gemini only [2] | Web, GitHub label, CLI, API [3] | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [4] |
| Codex cloud | OpenAI-hosted VMs [5] | OpenAI models; cloud needs a ChatGPT plan [6] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [7] | In ChatGPT Plus $20/mo and up [8] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [9] | Billed at API prices for the chosen model; own keys chat-only [10] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [11] | Premium $30/mo+ (X Subscription) plus API-priced usage [12] |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [13] | Many models via GitHub; own keys not documented for it [14] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [15] | Pro $10; Pro+ $39; Max $100; Business $19/user [16] |
| Devin | Cognition cloud VMs, or local [17] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [18] | Web, desktop, CLI, Slack, Teams, Linear, Jira [19] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [20] |
| OpenHands | Local, OpenHands cloud, or self-hosted [21] | Own agent or popular CLIs; your keys [22] | GUI, CLI, API, GitHub, Slack, Jira [23] | Free (10 conversations/day hosted); Enterprise custom [24] |

## What Jules does well, and where teams hit its limits

Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. [1] Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. [25] That free tier is generous, and it is a good way to see whether a cloud agent fits your work at all.

Teams run into three limits. Jules runs on Google's Gemini models. [2] Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. [26] And work starts from the web app, GitHub, the CLI or the API rather than the chat tool your team already uses. Jules takes work from its web app, GitHub issues labelled jules, the Jules Tools CLI and the Jules API. [3]

## The alternatives, ranked

Ranked for a small engineering team that wants a cloud coding agent it can hand real tickets to.

### 1. Jiro: best for teams that want model choice and Slack

Jiro gives each conversation its own cloud VM with your GitHub repos and setup script, then runs the agent you pick: Claude Code or Codex on your own Claude or ChatGPT subscription, an API key or OpenRouter, or Cursor on a Cursor key.

Your team asks for work by mentioning Jiro in Slack or in the web chat. It opens pull requests for review and asks before merging to your main branch. Recurring work runs on cron or webhook automations you set up.

**Pick Jiro if** Jules's single model family or personal-account paid tiers are what is holding you back.

### 2. OpenAI Codex cloud: the closest one-vendor equivalent

Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. [5] Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. [8] It covers more surfaces than Jules, including Slack. Codex requests in Slack now start with @ChatGPT instead of @Codex. [27]

**Pick Codex cloud if** your team is standardised on ChatGPT.

### 3. Cursor cloud agents: best inside the Cursor editor

Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. [9] Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. [28]

**Pick Cursor if** your developers already use it daily and the new plan structure works for you. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. [12]

### 4. GitHub Copilot cloud agent: best if the work starts as GitHub issues

GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [29] Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. [30]

**Pick Copilot if** you want the agent built into GitHub and short sessions are enough. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. [13]

### 5. Devin: best fully managed option

Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. [31] Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. [19]

**Pick Devin if** you want one vendor to handle the agent, models and integrations and are fine with quota-based plans. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. [20]

### 6. OpenHands: best for self-hosting

OpenHands is an MIT-licensed open-source platform for software engineering agents. [32] OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. [24]

**Pick OpenHands if** you need the agent on your own machines.

## When to stay on Jules

Stay on Jules if you are an individual developer on a personal Google account, you are happy with Gemini models, and the free or AI Pro limits cover your volume. It also has recurring work built in. Jules can run Scheduled Tasks on a recurring basis. [33]

## FAQ

### What is the best alternative to Google Jules?

For teams, Jiro: it runs Claude Code or Codex in cloud VMs on your own Claude or ChatGPT subscription and works from Slack. For ChatGPT users, Codex cloud is the closest equivalent.

### Can I use Jules with a Google Workspace account?

Not on the paid tiers yet. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. [26]

### Which models can I use with Jiro?

Jiro's setup recommends a Claude or ChatGPT subscription, or an API key for either, and also accepts OpenRouter and custom endpoints. Jiro runs Claude Code or Codex with them, and Cursor with a Cursor API key.

### Is Jiro made by Google?

No. Jiro is a background coding agent by Nori, an independent company.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. Source: https://jules.google/docs/environment (checked 2026-10-16)
2. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
3. Jules takes work from its web app, GitHub issues labelled jules, the Jules Tools CLI and the Jules API. Source: https://jules.google/docs/changelog/ (checked 2026-10-16)
4. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
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
17. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
18. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
19. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
20. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
21. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
22. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
23. OpenHands works from its GUI, CLI, SDK and API, from GitHub, GitLab and Bitbucket, and from Slack and Jira. Source: https://openhands.dev/pricing (checked 2026-10-16)
24. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
25. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
26. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
27. Codex requests in Slack now start with @ChatGPT instead of @Codex. Source: https://learn.chatgpt.com/docs/third-party/slack.md (checked 2026-10-16)
28. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
29. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
30. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
31. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
32. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
33. Jules can run Scheduled Tasks on a recurring basis. Source: https://jules.google/docs/scheduled-tasks/ (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
