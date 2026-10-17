# Kiro alternatives (2026): other AI coding agents to Amazon's Kiro

Updated 2026-10-17

> **What are the best alternatives to Amazon Kiro?**
>
> Jiro is the best Kiro alternative if you want an agent your team works with in Slack, running Claude Code or Codex in cloud VMs on your own Claude or ChatGPT subscription instead of Kiro credits. Jiro is a background coding agent by Nori. It is not a version of Amazon's Kiro. Cursor cloud agents, GitHub Copilot cloud agent, Claude Code on the web, Codex cloud and Devin are the other main options.

## Kiro and the alternatives at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Kiro | AWS sandbox (us-east-1) or local [1] | Claude, GPT and open models via Kiro credits [2] | IDE, CLI, web, iOS; GitHub and GitLab [3] | Free 50 credits; Pro $20; Pro+ $40; Pro Max $100; Power $200 [4] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [5] | Billed at API prices for the chosen model; own keys chat-only [6] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [7] | Premium $30/mo+ (X Subscription) plus API-priced usage [8] |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [9] | Many models via GitHub; own keys not documented for it [10] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [11] | Pro $10; Pro+ $39; Max $100; Business $19/user [12] |
| Claude Code on the web | Anthropic-managed VMs [13] | Claude models; Anthropic account required [14] | Web, mobile, desktop, terminal [15] | In Pro $20/mo, Max $100+/mo, Team seats [16] |
| Codex cloud | OpenAI-hosted VMs [17] | OpenAI models; cloud needs a ChatGPT plan [18] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [19] | In ChatGPT Plus $20/mo and up [20] |
| Devin | Cognition cloud VMs, or local [21] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [22] | Web, desktop, CLI, Slack, Teams, Linear, Jira [23] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [24] |

## Kiro in October 2026

Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. [25] Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. [26] Kiro cloud sessions run in an AWS-managed sandbox in us-east-1, up to 10 at a time, with no separate compute charge; the IDE and CLI also run locally. [1]

Its pricing is transparent and its free tier is real. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. [4] What pushes people to alternatives is mostly model access: Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. [2]

## The alternatives, ranked

Ranked for teams that want background work on their repos rather than a new IDE.

### 1. Jiro: best for Slack and your own subscription

Jiro gives each conversation an isolated cloud VM with your GitHub repos and setup script, and runs Claude Code or Codex on your own Claude or ChatGPT subscription, an API key or OpenRouter, or Cursor with a Cursor API key. There are no credits to buy for model usage; Jiro bills for the runtime.

Your team mentions Jiro in Slack or uses the web chat, and gets pull requests back for review. Jiro asks before merging to your main branch.

**Pick Jiro if** you want a teammate in Slack rather than an IDE, and want to keep paying for models through your existing plan.

### 2. Cursor cloud agents: best IDE-plus-cloud alternative

Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. [5] Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. [27]

**Pick Cursor if** you chose Kiro for the IDE and want a similar local-plus-cloud setup. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. [8]

### 3. GitHub Copilot cloud agent: best for issue-driven work

GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [28] Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. [29]

**Pick Copilot if** you liked Kiro's label-an-issue flow and want it native to GitHub.

### 4. Claude Code on the web: best for Claude subscribers

A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. [13] Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. [16]

**Pick it if** you want Claude models on your own Claude plan.

### 5. OpenAI Codex cloud: best for ChatGPT subscribers

Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. [17] Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. [20]

**Pick Codex cloud if** your team is on ChatGPT.

### 6. Devin: best managed enterprise option

Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. [30] Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. [31]

**Pick Devin if** you want broad enterprise integrations from one vendor.

## When Kiro is the right choice

Choose Kiro if you want spec-driven development in a polished IDE, or a free tier to start with. Kiro also leaves merging to you, which is the right default. Kiro opens pull requests from a kiro label or /kiro comment on a GitHub issue and never merges changes automatically. [32]

## FAQ

### Is Jiro the same as Kiro?

No. Jiro is a background coding agent by Nori, an independent company. Kiro is Amazon's AI coding agent and IDE. The names are one letter apart; the products and companies are unrelated.

### What is the best free Kiro alternative?

Google Jules and OpenHands have free tiers. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. [33] OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. [34] Jiro has a 30-day free trial with no card.

### Can I use my own Claude subscription instead of Kiro credits?

Kiro sells model access through its own credits. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. [2] With Jiro, Claude Code runs on your own Claude subscription or API key.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Kiro cloud sessions run in an AWS-managed sandbox in us-east-1, up to 10 at a time, with no separate compute charge; the IDE and CLI also run locally. Source: https://kiro.dev/docs/cloud-sessions.md (checked 2026-10-16)
2. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. Source: https://kiro.dev/docs/models.md (checked 2026-10-16)
3. Kiro runs in its IDE, the CLI, the web app, iOS and ACP-compatible editors, and Kiro Web works with GitHub and GitLab repositories. Source: https://kiro.dev/docs/web.md (checked 2026-10-16)
4. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. Source: https://kiro.dev/pricing/ (checked 2026-10-16)
5. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
6. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
7. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
8. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
9. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
10. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
11. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
12. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
13. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
14. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
15. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
16. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
17. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
18. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
19. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
20. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
21. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
22. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
23. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
24. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
25. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. Source: https://kiro.dev/llms.txt (checked 2026-10-16)
26. Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. Source: https://kiro.dev/blog/introducing-kiro-web/ (checked 2026-10-16)
27. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
28. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
29. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
30. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
31. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
32. Kiro opens pull requests from a kiro label or /kiro comment on a GitHub issue and never merges changes automatically. Source: https://kiro.dev/docs/web/github.md (checked 2026-10-16)
33. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
34. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
