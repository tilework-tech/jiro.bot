# OpenAI Codex cloud alternatives (2026)

Updated 2026-10-17

> **What are the best alternatives to OpenAI Codex cloud?**
>
> Jiro is the best Codex cloud alternative for teams that want more than OpenAI models: it runs Codex or Claude Code in its own cloud VMs on your ChatGPT or Claude subscription, and Cursor on a Cursor API key. Jiro is a background coding agent by Nori. Claude Code on the web, Cursor cloud agents, Copilot cloud agent, Jules and Devin are the other options.

## Codex cloud and the alternatives at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Codex cloud | OpenAI-hosted VMs [1] | OpenAI models; cloud needs a ChatGPT plan [2] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [3] | In ChatGPT Plus $20/mo and up [4] |
| Claude Code on the web | Anthropic-managed VMs [5] | Claude models; Anthropic account required [6] | Web, mobile, desktop, terminal [7] | In Pro $20/mo, Max $100+/mo, Team seats [8] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [9] | Billed at API prices for the chosen model; own keys chat-only [10] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [11] | Premium $30/mo+ (X Subscription) plus API-priced usage [12] |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [13] | Many models via GitHub; own keys not documented for it [14] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [15] | Pro $10; Pro+ $39; Max $100; Business $19/user [16] |
| Jules | Google-hosted short-lived VMs [17] | Gemini only [18] | Web, GitHub label, CLI, API [19] | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [20] |
| Devin | Cognition cloud VMs, or local [21] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [22] | Web, desktop, CLI, Slack, Teams, Linear, Jira [23] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [24] |

## Codex cloud today

Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. [1] Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. [4] For anyone already paying for ChatGPT, that bundle is hard to beat on price.

Two things push teams to look around. First, it is OpenAI-only: Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. [2] Second, the integrations are mid-migration: Codex requests in Slack now start with @ChatGPT instead of @Codex. [25] Codex Cloud (Legacy) still powers Code Review and the GitHub and Linear integrations, and OpenAI plans to deprecate it. [26]

## The alternatives, ranked

Ranked for teams that want a cloud coding agent beyond a single model vendor.

### 1. Jiro: keep Codex, add Claude Code and Cursor

You do not have to give up Codex to switch. Jiro runs Codex as one of its agents, on your ChatGPT subscription or API key, in a cloud VM with your GitHub repos and setup script. When Claude Code or Cursor suits a task better, connect that provider and start a new conversation with it.

Jiro opens pull requests for review and asks before merging to your main branch.

**Pick Jiro if** you want Codex in the cloud without being limited to OpenAI's models and integrations.

### 2. Claude Code on the web: the Anthropic equivalent

A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. [5] Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. [8]

**Pick it if** you prefer Claude models and work mostly alone. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. [6]

### 3. Cursor cloud agents: best in the editor

Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. [9] Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. [12]

**Pick Cursor if** your team works in Cursor already.

### 4. GitHub Copilot cloud agent: best inside GitHub

GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [27] On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). [28]

**Pick Copilot if** you want GitHub to orchestrate several agents, including Codex.

### 5. Jules: best free tier

Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. [29]

**Pick Jules if** you want to try a cloud agent at no cost on a personal account.

### 6. Devin: best fully managed option

Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. [30] Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. [22]

**Pick Devin if** you want one vendor for agent, models and integrations.

## When Codex cloud is enough

Stay with Codex cloud if everyone on the team has a ChatGPT plan, OpenAI models cover your work, and you start tasks from ChatGPT or the CLI.

## FAQ

### What is the best alternative to OpenAI Codex cloud?

Jiro, if you want Codex plus Claude Code and Cursor in one place on your own subscriptions. Claude Code on the web if you want Anthropic's equivalent.

### Can I use my ChatGPT subscription with Jiro?

Yes. Jiro's setup accepts a ChatGPT subscription through device-code sign-in, or an OpenAI API key, and runs Codex with it.

### Does Codex cloud work with an API key?

Only partly. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. [2]

### Is Jiro built on Codex?

No. Jiro is a background coding agent by Nori that can run Codex, Claude Code or Cursor as the underlying agent.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
2. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
3. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
4. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
5. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
6. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
7. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
8. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
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
21. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
22. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
23. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
24. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
25. Codex requests in Slack now start with @ChatGPT instead of @Codex. Source: https://learn.chatgpt.com/docs/third-party/slack.md (checked 2026-10-16)
26. Codex Cloud (Legacy) still powers Code Review and the GitHub and Linear integrations, and OpenAI plans to deprecate it. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
27. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
28. On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). Source: https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents (checked 2026-10-16)
29. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
30. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
