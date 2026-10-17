# Cursor background agents alternatives (2026): now called Cloud Agents

Updated 2026-10-17

> **What are the best alternatives to Cursor background agents?**
>
> The best alternatives to Cursor background agents are Jiro, OpenAI Codex cloud, GitHub Copilot cloud agent, Claude Code on the web, Devin and Amp, and Jiro is the top pick if you want Claude Code or Codex in the cloud on the Claude or ChatGPT subscription you already pay for, with Cursor's own agent available on your Cursor API key. Jiro is a background coding agent by Nori.

## Cursor cloud agents and the alternatives at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [1] | Billed at API prices for the chosen model; own keys chat-only [2] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [3] | Premium $30/mo+ (X Subscription) plus API-priced usage [4] |
| Codex cloud | OpenAI-hosted VMs [5] | OpenAI models; cloud needs a ChatGPT plan [6] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [7] | In ChatGPT Plus $20/mo and up [8] |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [9] | Many models via GitHub; own keys not documented for it [10] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [11] | Pro $10; Pro+ $39; Max $100; Business $19/user [12] |
| Claude Code on the web | Anthropic-managed VMs [13] | Claude models; Anthropic account required [14] | Web, mobile, desktop, terminal [15] | In Pro $20/mo, Max $100+/mo, Team seats [16] |
| Devin | Cognition cloud VMs, or local [17] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [18] | Web, desktop, CLI, Slack, Teams, Linear, Jira [19] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [20] |
| Amp | Amp cloud orbs or your own runners [21] | Own subscriptions and keys, no BYOK fee [22] | Web, macOS/iOS, CLI, GitHub, Slack [23] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [24] |

## What changed with Cursor's background agents

Cursor now calls its background agents Cloud Agents. [25] Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. [1] The product is strong: Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. [26]

Pricing has changed: Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. [4] Customers on Cursor's legacy Pro, Pro+ and Teams plans can keep them; switching to the new plans is optional but permanent. [27] On usage, Cursor's docs say: Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. [2]

## The alternatives, ranked

Ranked for teams that liked Cursor's background agents but want a different billing model or a different home for the work.

### 1. Jiro: best if you want your own subscription in the cloud

Jiro runs the agent harness you pick in an isolated cloud VM with your GitHub repos and setup script: Claude Code or Codex on your own Claude or ChatGPT subscription, an API key or OpenRouter, or Cursor's agent on your Cursor API key. Jiro bills for the runtime rather than the tokens.

Your team works with it in Slack or the web chat, and it opens pull requests for review. It asks before merging anything to your main branch.

**Pick Jiro if** you want cloud agents on the Claude or ChatGPT plan you already have.

### 2. OpenAI Codex cloud: best for ChatGPT teams

Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. [5] Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. [8]

**Pick Codex cloud if** OpenAI models are all you need.

### 3. GitHub Copilot cloud agent: best for GitHub-centred teams

GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [28] Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. [29]

**Pick Copilot if** your work starts as GitHub issues. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. [30]

### 4. Claude Code on the web: best for individual Claude subscribers

A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. [13] Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. [16]

**Pick Claude Code on the web if** you work alone or mostly from your own laptop and phone. For team Slack use, Anthropic is moving to Claude Tag. For Team and Enterprise, Slack work moves to Claude Tag (public beta), and the legacy Claude Code Slack bot was retired on 2026-10-05 in workspaces connected to a Claude organization. [31]

### 5. Devin: best managed, broad-integration option

Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. [32] Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. [20]

**Pick Devin if** you want Teams, Jira and GitLab support from one vendor.

### 6. Amp: best for tinkerers who bring their own compute

Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. [21] Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. [22]

**Pick Amp if** you want per-minute cloud machines and a fully free path on your own hardware. Note that by default it pushes straight to your base branch. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. [33]

## When to stay with Cursor

Stay with Cursor if your developers live in the editor, want the agent in the same tool, or your repos live on GitLab, Bitbucket or Azure DevOps. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. [3]

## FAQ

### Are Cursor background agents and Cursor cloud agents the same thing?

Yes. Cursor now calls its background agents Cloud Agents. [25]

### Can Jiro run Cursor's agent?

Yes. Cursor is one of the agents Jiro can run in its cloud VMs, alongside Claude Code and Codex. Cursor needs your Cursor API key; Claude Code and Codex use your Claude or ChatGPT credentials.

### What is the best Cursor background agents alternative for Slack?

Jiro is built around Slack: mention it in a channel and it replies in the thread and opens pull requests. Cursor, Codex and Copilot also take requests from Slack.

### Is Jiro a code editor?

No. Jiro is a background coding agent by Nori. It works in cloud VMs and returns pull requests; you keep your editor.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
2. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
3. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
4. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
5. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
6. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
7. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
8. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
9. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
10. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
11. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
12. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
13. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
14. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
15. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
16. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
17. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
18. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
19. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
20. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
21. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
22. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
23. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
24. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
25. Cursor now calls its background agents Cloud Agents. Source: https://cursor.com/help/ai-features/background-agents (checked 2026-10-16)
26. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
27. Customers on Cursor's legacy Pro, Pro+ and Teams plans can keep them; switching to the new plans is optional but permanent. Source: https://cursor.com/docs/account/pricing/legacy-cursor-plans.md (checked 2026-10-16)
28. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
29. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
30. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. Source: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ (checked 2026-10-16)
31. For Team and Enterprise, Slack work moves to Claude Tag (public beta), and the legacy Claude Code Slack bot was retired on 2026-10-05 in workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-16)
32. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
33. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
