# GitHub Copilot coding agent alternatives (2026)

Updated 2026-10-17

> **What are the best alternatives to GitHub Copilot coding agent?**
>
> The best GitHub Copilot coding agent alternatives are Jiro, OpenAI Codex cloud, Cursor cloud agents, Claude Code on the web, Devin and OpenHands, and Jiro is the top pick when work starts in Slack rather than GitHub issues, because it gives each conversation its own cloud VM and runs Claude Code, Codex or Cursor on your own subscription. Jiro is a background coding agent by Nori.

## Copilot cloud agent and the alternatives at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [1] | Many models via GitHub; own keys not documented for it [2] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [3] | Pro $10; Pro+ $39; Max $100; Business $19/user [4] |
| Codex cloud | OpenAI-hosted VMs [5] | OpenAI models; cloud needs a ChatGPT plan [6] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [7] | In ChatGPT Plus $20/mo and up [8] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [9] | Billed at API prices for the chosen model; own keys chat-only [10] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [11] | Premium $30/mo+ (X Subscription) plus API-priced usage [12] |
| Claude Code on the web | Anthropic-managed VMs [13] | Claude models; Anthropic account required [14] | Web, mobile, desktop, terminal [15] | In Pro $20/mo, Max $100+/mo, Team seats [16] |
| Devin | Cognition cloud VMs, or local [17] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [18] | Web, desktop, CLI, Slack, Teams, Linear, Jira [19] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [20] |
| OpenHands | Local, OpenHands cloud, or self-hosted [21] | Own agent or popular CLIs; your keys [22] | GUI, CLI, API, GitHub, Slack, Jira [23] | Free (10 conversations/day hosted); Enterprise custom [24] |

## Copilot's agent after the rename

GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [25] Its guardrails are the best defaults in the category: Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. [26]

The constraints come from running on Actions. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. [1] Billing also changed this year. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. [27] On models: The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. [2]

## The alternatives, ranked

Ranked for teams whose work does not always start as a GitHub issue.

### 1. Jiro: best when the work starts in Slack

Mention Jiro in Slack or open the web chat, and it picks the work up in a cloud VM with your GitHub repos and setup script.

It runs Claude Code or Codex on your own Claude or ChatGPT subscription or API key, or Cursor on your Cursor key, opens pull requests for review, and asks before merging to your main branch. Your branch protection rules still apply to its PRs.

**Pick Jiro if** you want a teammate you can talk to, not only an issue assignee.

### 2. OpenAI Codex cloud: best for ChatGPT teams

Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. [5] Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. [8]

**Pick Codex cloud if** you want long-running cloud tasks on a ChatGPT plan.

### 3. Cursor cloud agents: best for editor-first teams

Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. [9] Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. [28]

**Pick Cursor if** you need GitLab, Bitbucket or Azure DevOps support. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. [11]

### 4. Claude Code on the web: best for Claude subscribers

A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. [13] Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. [29]

**Pick it if** you already pay for Claude Pro or Max and work mostly alone.

### 5. Devin: best for broad enterprise integrations

Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. [19] Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. [20]

**Pick Devin if** you need Jira, Teams and multiple code hosts from a managed service.

### 6. OpenHands: best open-source option

OpenHands is an MIT-licensed open-source platform for software engineering agents. [30] Labelling a GitHub issue openhands or commenting @openhands starts a run that opens a PR if it resolves the issue. [31]

**Pick OpenHands if** you like Copilot's label-an-issue flow but want to self-host.

## When to stay with Copilot

Stay with Copilot if your organisation already pays for Copilot Business or Enterprise, tasks fit in one session, and you want the agent to live entirely inside GitHub. It can also hand tasks to Claude and Codex. On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). [32]

## FAQ

### Is GitHub Copilot coding agent the same as Copilot cloud agent?

Yes. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [25]

### When should I pick Copilot over Jiro?

When your organisation already pays for Copilot, work starts as GitHub issues, and tasks fit in one Actions session. Pick Jiro when work starts in Slack or you want to use your own Claude or ChatGPT subscription.

### Can I use my own model subscription instead of Copilot credits?

Yes with Jiro, which runs Claude Code or Codex on your own Claude or ChatGPT subscription, an API key or OpenRouter, or Cursor with a Cursor API key.

### Does Jiro work with GitHub branch protection?

Yes. Jiro works through pull requests on your GitHub repos, so your branch protection and required checks apply to its changes.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
2. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
3. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
4. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
5. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
6. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
7. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
8. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
9. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
10. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
11. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
12. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
13. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
14. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
15. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
16. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
17. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
18. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
19. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
20. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
21. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
22. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
23. OpenHands works from its GUI, CLI, SDK and API, from GitHub, GitLab and Bitbucket, and from Slack and Jira. Source: https://openhands.dev/pricing (checked 2026-10-16)
24. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
25. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
26. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
27. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. Source: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ (checked 2026-10-16)
28. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
29. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
30. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
31. Labelling a GitHub issue openhands or commenting @openhands starts a run that opens a PR if it resolves the issue. Source: https://docs.openhands.dev/openhands/usage/cloud/github-installation (checked 2026-10-16)
32. On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). Source: https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
