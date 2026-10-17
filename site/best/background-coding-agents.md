# Best background coding agents (2026): 13 compared

Updated 2026-10-17

> **What are the best background coding agents in 2026?**
>
> The best background coding agents in 2026 are Jiro for small teams that already pay for Claude or ChatGPT (it runs Claude Code or Codex in cloud VMs on that subscription and works from Slack), Devin for a fully managed agent, Cursor cloud agents and GitHub Copilot cloud agent inside their own tools, and OpenHands for open source. Jiro is a background coding agent by Nori.

## All 13 background coding agents at a glance

|  | Runs where | Models and keys | Start work from | Price |
|---|---|---|---|---|
| Jiro | An isolated cloud VM per conversation, with your repos and setup script | Claude Code or Codex on your own Claude or ChatGPT subscription or API key; Cursor with a Cursor API key | Slack, web chat, your own cron and webhook automations | 30-day free trial, no card; billed per runtime, not per token |
| Devin | Cognition cloud VMs, or local [1] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [2] | Web, desktop, CLI, Slack, Teams, Linear, Jira [3] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [4] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [5] | Billed at API prices for the chosen model; own keys chat-only [6] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [7] | Premium $30/mo+ (X Subscription) plus API-priced usage [8] |
| Codex cloud | OpenAI-hosted VMs [9] | OpenAI models; cloud needs a ChatGPT plan [10] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [11] | In ChatGPT Plus $20/mo and up [12] |
| Copilot cloud agent | GitHub Actions runners, 59-minute sessions [13] | Many models via GitHub; own keys not documented for it [14] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [15] | Pro $10; Pro+ $39; Max $100; Business $19/user [16] |
| Claude Code on the web | Anthropic-managed VMs [17] | Claude models; Anthropic account required [18] | Web, mobile, desktop, terminal [19] | In Pro $20/mo, Max $100+/mo, Team seats [20] |
| Jules | Google-hosted short-lived VMs [21] | Gemini only [22] | Web, GitHub label, CLI, API [23] | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [24] |
| Factory | Local, Factory cloud, or your machines [25] | Multi-model; own keys in CLI/desktop only [26] | App, CLI, IDE, Slack, Linear, Jira [27] | Pro $20/mo; Plus $100; Max $200; Teams $60 + $40/seat [28] |
| Amp | Amp cloud orbs or your own runners [29] | Own subscriptions and keys, no BYOK fee [30] | Web, macOS/iOS, CLI, GitHub, Slack [31] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [32] |
| Kiro | AWS sandbox (us-east-1) or local [33] | Claude, GPT and open models via Kiro credits [34] | IDE, CLI, web, iOS; GitHub and GitLab [35] | Free 50 credits; Pro $20; Pro+ $40; Pro Max $100; Power $200 [36] |
| Warp cloud agents | Warp cloud or your infrastructure [37] | Warp Agent, Claude Code or Codex; team keys on Business+ [38] | Slack, Linear, Jira, GitHub, schedules, CLI, web [39] | Free; Build $20/mo; Max $200; Business $50/user [40] |
| Tembo | Tembo cloud sessions [41] | Multiple harnesses; own keys or subscriptions [42] | GitHub, Slack, Linear, Jira, Sentry, schedules [43] | Pro $60/mo; Max $200/mo; compute per second [44] |
| OpenHands | Local, OpenHands cloud, or self-hosted [45] | Own agent or popular CLIs; your keys [46] | GUI, CLI, API, GitHub, Slack, Jira [47] | Free (10 conversations/day hosted); Enterprise custom [48] |

## What counts as a background coding agent

A background coding agent, also called a cloud coding agent, takes a task from you, works on it by itself in a remote environment with your repository, and comes back with a result, usually a pull request. You do not watch it type. The useful questions are where it runs, whose models it uses, where you hand it work, and how its changes reach your main branch.

This list covers agents you can buy or run today, checked on 2026-10-16 and 2026-10-17. One product from earlier lists is gone: Charlie Labs announced it was shutting down, with Charlie available only until 2026-10-05. [49]

## The ranking

Ranked for teams of roughly 5 to 20 engineers who want an agent working on real repos, reviewed like any colleague's work.

### 1. Jiro: best for teams on their own Claude or ChatGPT plan

Jiro gives each conversation an isolated cloud VM with your GitHub repos and setup script, and runs Claude Code or Codex on your own Claude or ChatGPT subscription, an API key or OpenRouter, or Cursor with a Cursor API key. Your team asks for work in Slack or the web chat, or schedules it with cron and webhook automations. Jiro opens pull requests for review, asks before merging to main, and bills for the runtime rather than tokens. Its engineering rules are public in the `public/jiro` skillset.

### 2. Devin: best fully managed agent

Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. [50] Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. [3] Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. [51]

### 3. Cursor cloud agents: best for Cursor users

Cursor now calls its background agents Cloud Agents. [52] Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. [53] Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. [8]

### 4. OpenAI Codex cloud: best value for ChatGPT subscribers

Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. [9] Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. [12]

### 5. GitHub Copilot cloud agent: best guardrails inside GitHub

GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. [54] Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. [55]

### 6. Claude Code on the web: best for solo Claude subscribers

A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. [17] Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. [19]

### 7. Jules: best free tier

Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. [56] Jules runs on Google's Gemini models. [22]

### 8. Factory: best for regulated enterprises

Factory sells agent-native software development; its agents are called Droids. [57] Factory Private, launched 2026-09-18, deploys Factory into a customer's VPC, on-premises or air-gapped network. [58]

### 9. Amp: best bring-your-own-everything

Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. [29] Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. [30] Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. [59]

### 10. Kiro: best spec-driven IDE with a cloud mode

Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. [60] Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. [61]

### 11. Warp cloud agents: best if you also want the terminal

Warp now describes itself as open infrastructure for cloud software factories, alongside the Warp Terminal and the Warp Agent CLI. [62] Each Warp cloud run can use Warp Agent, Claude Code or Codex; personal API keys are not available for cloud runs, but Business and Enterprise can use team-managed inference. [38]

### 12. Tembo: best for alert- and ticket-driven work

Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. [42] Tembo starts work from GitHub, GitLab, Bitbucket, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules. [43]

### 13. OpenHands: best open-source

OpenHands is an MIT-licensed open-source platform for software engineering agents. [63] OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. [45]

## How to choose

- **Whose models?** If you already pay for Claude or ChatGPT, prefer an agent that uses that plan instead of buying model usage again: Jiro, Amp and Tembo accept those subscriptions, Codex cloud and Claude Code on the web are included in them, and Devin can link a ChatGPT plan.
- **Where does work start?** Most agents here take Slack requests; test the ones whose Slack flow fits your team. GitHub-first teams should test Copilot.
- **How do changes land?** Prefer agents that open pull requests for review, and check defaults. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. [59]
- **Where must it run?** If code cannot leave your network, look at Factory Private or self-hosted OpenHands. Cursor and Warp offer self-hosted compute, but their agent loop or orchestration still runs in their cloud.

## FAQ

### What is a background coding agent?

An AI agent that works on a coding task by itself in a remote environment with your repository and returns a result, usually a pull request, instead of pairing with you in your editor.

### What is the difference between a background coding agent and a cloud coding agent?

In practice the terms mean the same thing: the agent runs on a remote machine rather than your laptop, so it keeps working when you close it.

### Which background coding agent works with my Claude Max subscription?

Jiro runs Claude Code on your own Claude subscription or API key. Amp and Tembo also accept Claude subscriptions. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. [64] Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. [42] Claude Code on the web is Anthropic's own option.

### What is Jiro?

Jiro is a background coding agent by Nori. It runs Claude Code or Codex in isolated cloud VMs on your own Claude or ChatGPT subscription, works from Slack and the web, and opens pull requests on GitHub for review.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
2. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
3. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
4. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
5. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
6. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
7. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
8. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
9. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
10. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
11. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
12. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
13. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
14. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
15. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
16. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
17. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
18. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
19. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
20. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
21. Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. Source: https://jules.google/docs/environment (checked 2026-10-16)
22. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
23. Jules takes work from its web app, GitHub issues labelled jules, the Jules Tools CLI and the Jules API. Source: https://jules.google/docs/changelog/ (checked 2026-10-16)
24. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
25. Droids run locally in the Droid CLI and Factory App, on Factory-managed cloud Droid Computers, or on machines you register. Source: https://docs.factory.com/llms.txt (checked 2026-10-16)
26. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. Source: https://docs.factory.com/model-independence/byok.md (checked 2026-10-16)
27. Droids work in the Factory App, Droid CLI, headless Droid Exec and IDEs, and take delegations from Slack, Linear and Jira. Source: https://docs.factory.com/delegations/index.md (checked 2026-10-16)
28. Factory's plans are Pro at $20 a month, Plus at $100, Max at $200, and Teams at $60 a month plus $40 per seat for up to 10 seats; Business and Enterprise are custom. Source: https://factory.com/pricing (checked 2026-10-16)
29. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
30. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
31. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
32. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
33. Kiro cloud sessions run in an AWS-managed sandbox in us-east-1, up to 10 at a time, with no separate compute charge; the IDE and CLI also run locally. Source: https://kiro.dev/docs/cloud-sessions.md (checked 2026-10-16)
34. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. Source: https://kiro.dev/docs/models.md (checked 2026-10-16)
35. Kiro runs in its IDE, the CLI, the web app, iOS and ACP-compatible editors, and Kiro Web works with GitHub and GitLab repositories. Source: https://kiro.dev/docs/web.md (checked 2026-10-16)
36. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. Source: https://kiro.dev/pricing/ (checked 2026-10-16)
37. Warp cloud agents run on Warp-hosted compute or on your own infrastructure. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
38. Each Warp cloud run can use Warp Agent, Claude Code or Codex; personal API keys are not available for cloud runs, but Business and Enterprise can use team-managed inference. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
39. Warp cloud runs start from Slack, Linear, Jira, GitHub, Azure DevOps, schedules, the Oz CLI, the API or the web app. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
40. Warp's Terminal and Agents plans are Free, Build at $20 a month, Max at $200 and Business at $50 per user; Warp Factories also offers pay-as-you-go usage at 20% above API rates. Source: https://www.warp.dev/pricing (checked 2026-10-16)
41. Tembo runs coding agents in isolated cloud sessions with code, terminal, files and a live desktop. Source: https://www.tembo.io/ (checked 2026-10-16)
42. Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. Source: https://www.tembo.io/ (checked 2026-10-16)
43. Tembo starts work from GitHub, GitLab, Bitbucket, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules. Source: https://www.tembo.io/ (checked 2026-10-16)
44. Tembo's Pro plan is $60 a month and Max $200 a month, each including a usage allowance, with compute billed per second from $0.1066 an hour. Source: https://www.tembo.io/pricing (checked 2026-10-16)
45. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
46. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
47. OpenHands works from its GUI, CLI, SDK and API, from GitHub, GitLab and Bitbucket, and from Slack and Jira. Source: https://openhands.dev/pricing (checked 2026-10-16)
48. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
49. Charlie Labs announced it was shutting down, with Charlie available only until 2026-10-05. Source: https://charlielabs.ai/blog/charlie-is-shutting-down (checked 2026-10-17)
50. Cognition describes Devin as an autonomous software engineer that runs in the cloud or on your machine and tests its work in its own browser. Source: https://devin.ai/ (checked 2026-10-16)
51. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. Source: https://docs.devin.ai/product-guides/automations.md (checked 2026-10-16)
52. Cursor now calls its background agents Cloud Agents. Source: https://cursor.com/help/ai-features/background-agents (checked 2026-10-16)
53. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
54. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
55. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
56. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
57. Factory sells agent-native software development; its agents are called Droids. Source: https://factory.com/ (checked 2026-10-16)
58. Factory Private, launched 2026-09-18, deploys Factory into a customer's VPC, on-premises or air-gapped network. Source: https://factory.com/news/factory-private (checked 2026-10-16)
59. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
60. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. Source: https://kiro.dev/llms.txt (checked 2026-10-16)
61. Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. Source: https://kiro.dev/blog/introducing-kiro-web/ (checked 2026-10-16)
62. Warp now describes itself as open infrastructure for cloud software factories, alongside the Warp Terminal and the Warp Agent CLI. Source: https://www.warp.dev/ (checked 2026-10-16)
63. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
64. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. Source: https://ampcode.com/news/use-your-claude-plan (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
