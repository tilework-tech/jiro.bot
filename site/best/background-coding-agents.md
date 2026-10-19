# Best Background Coding Agents (2026): 14 Options Compared

Updated 2026-10-19

> **What are the best background coding agents in 2026?**
>
> For engineering teams of five to twenty with an existing Claude or ChatGPT subscription, Jiro ranks first: it puts Claude Code, Codex or Cursor on its own cloud machine, signed in with those credentials, reachable from Slack, with no token markup. Jiro is a background coding agent by Nori. Cursor cloud agents, Codex cloud, Anthropic's web-based Claude Code and Devin round out our top five, followed by Copilot cloud agent, Claude Tag, Factory, Tembo, Amp, Warp, OpenHands, Jules and Kiro.

## Fourteen agents, ranked for teams of 5 to 20

| # | Agent | Compute | Models and credentials | Entry price |
|---|---|---|---|---|
| 1 | Jiro | Isolated cloud environment with your repos and tools [1] | Your Claude/ChatGPT login or API key; Cursor key [2] | Free 30-day trial; Developer $99/mo; Team $250/mo [3] |
| 2 | Cursor cloud agents | Cursor cloud VMs or self-hosted workers [4] | Billed at API prices for the chosen model; own keys chat-only [5] | Premium $30/mo+ (X Subscription) plus API-priced usage [6] |
| 3 | OpenAI Codex cloud | OpenAI-hosted VMs [7] | OpenAI models; cloud needs a ChatGPT plan [8] | In ChatGPT Plus $20/mo and up [9] |
| 4 | Claude Code on the web | Anthropic-managed VMs [10] | Claude models; Anthropic account required [11] | In Pro $20/mo, Max $100+/mo, Team seats [12] |
| 5 | Devin | Cognition cloud VMs, or local [13] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [14] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [15] |
| 6 | GitHub Copilot cloud agent | GitHub Actions runners, 59-minute sessions [16] | Many models via GitHub; own keys not documented for it [17] | Pro $10; Pro+ $39; Max $100; Business $19/user [18] |
| 7 | Claude Tag | Anthropic cloud sandbox per thread [19] | Claude models only [20] | Usage-billed, no per-seat charge [21] |
| 8 | Factory | Local, Factory cloud, or your machines [22] | Multi-model; own keys in CLI/desktop only [23] | Pro $20/mo; Plus $100; Max $200; Teams $60 + $40/seat [24] |
| 9 | Tembo | Tembo cloud sessions [25] | Multiple harnesses; own keys or subscriptions [26] | Pro $60/mo; Max $200/mo; compute per second [27] |
| 10 | Amp | Amp cloud orbs or your own runners [28] | Own subscriptions and keys, no BYOK fee [29] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [30] |
| 11 | Warp cloud agents | Warp cloud or your infrastructure [31] | Warp Agent, Claude Code or Codex; team keys on Business+ [32] | Free; Build $20/mo; Max $200; Business $50/user [33] |
| 12 | OpenHands | Local, OpenHands cloud, or self-hosted [34] | Own agent or popular CLIs; your keys [35] | Free (10 conversations/day hosted); Enterprise custom [36] |
| 13 | Jules | Google-hosted short-lived VMs [37] | Gemini only [38] | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [39] |
| 14 | Kiro | AWS sandbox (us-east-1) or local [40] | Claude, GPT and open models via Kiro credits [41] | Free 50 credits; Pro $20; Pro+ $40; Pro Max $100; Power $200 [42] |

## How we ranked them

Our reader is a team of five to twenty engineers. Large enough to have a backlog nobody gets to; small enough that nobody's job is running an agent platform.

We scored each product on five things. Whose model you pay for, and whether you can bring a subscription you already hold. Whether the agent gets a real machine or a short-lived sandbox. Where the team can hand it work, especially Slack. What comes back: a reviewable PR, or loose commits that need tidying. And how much setup the tool demands before it earns its keep.

Prices and limits come from each vendor's own pages and are dated in the sources below. One name from last year's lists is missing: Charlie Labs shut down, and Charlie stopped working on 2026-10-05. [43] That is a useful reminder to pick vendors whose exit would not strand your workflow.

## The ranking

Fourteen entries, best fit first. A different team size would produce a different order, and we say so where it matters.

A note on conflicts: this list is published by Nori, which makes Jiro. We have tried to be fair to everyone else and cited every rival claim. You should still discount our first place a little.

### 1. Jiro — for small teams with Claude or ChatGPT already on the books

Jiro lets you choose the agent harness, Claude Code, Codex or Cursor, instead of selling you its own. [44] It runs them on your Claude or ChatGPT login or API key, with no markup on tokens. [2] [45] Each conversation gets an isolated cloud environment with your repos and your org's setup script. [1] [46]

Requests come in through Slack threads, the web dashboard, Discord or Handroll, or fire on a schedule or webhook. [47] [48] It returns pull requests for review. [49] Its temperament is the selling point: a careful engineer that pushes back on a bad ticket and would rather ship less, better. At Miravoice it handles more than a quarter of merged PRs. [50]

Developer is $99 a month, Team $250, after a 30-day trial with no card. [3] Verdict: the best value where the model bill is already sunk.

### 2. Cursor cloud agents

The most finished product on the list, and it shows in the pull requests, which come with screenshots, video and logs. [51] It starts work from nearly everywhere, Microsoft Teams included. [52] The drawback is the meter: each run is charged at the chosen model's API rate, and you need the $30 Premium tier first. [5] [6] Superb for Cursor shops. Pricey for everyone else.

### 3. OpenAI Codex cloud

For a team standardised on ChatGPT, it is cheap to try if you already have ChatGPT, since it comes with Plus at $20. [9] You get OpenAI models only. [8] The finished work is yours to commit or turn into a PR. [53] Watch the roadmap: the legacy cloud behind its GitHub and Linear integrations is slated for deprecation. [54]

### 4. Claude Code on the web

Anthropic's own cloud sessions, on a 4 vCPU machine by default, included in Pro, Max and Team seats. [10] [12] `claude --teleport` pulls a session back to your laptop, which is a neat trick. [55] But it is built for one person at a time, and you still create the pull request. [56]

### 5. Devin

Cognition's agent is the most autonomous here once a task is underway. It stacks large changes, answers review comments and fixes its own merge conflicts. [57] Automations fire on Slack, GitHub and Linear events. [58] The plans are modest; the overage at API pricing is not. [15] Best for teams that want one vendor to own agent and model alike.

### 6. GitHub Copilot cloud agent

Assign an issue, get a draft pull request. [59] On higher plans you can even delegate GitHub tasks to Claude or Codex, currently in public preview. [60] Sessions cap at 59 minutes on Actions runners, which rules out longer jobs. [16] The safe procurement pick.

### 7. Claude Tag

A shared @Claude for Slack channels, where the whole channel watches it work. [61] It is still a public beta and limited to Team and Enterprise plans. [62] [63] Billing comes out of an organisation balance, and Team customers must buy credits before it answers in channels. [21] [64] Customisation is thin: no repo hooks, no `.mcp.json`, no effort setting. [65] Charming, but early.

### 8. Factory

Factory sells a complete agent-native development platform built around Droids. [66] There is a lot of it: CLI, app, headless exec, IDE plugins, delegations from Slack, Linear and Jira. [67] Its new private deployment reaches air-gapped networks. [68] Impressive. Also more than most small teams will configure.

### 9. Tembo

The closest thing to Jiro in spirit, running several harnesses on your own keys or subscriptions. [26] Its trigger list is long, with Sentry and PagerDuty included. [69] Compute is metered by the second on top of a $60 plan, so busy months cost more. [27]

### 10. Amp

Amp has the boldest default on this list: out of the box, its Ship button lands changes directly on the base branch when the tests go green. [70] Teams who want review should flip on Push to Branch. It takes ChatGPT and Claude subscriptions, the Claude plans only since 10 October. [71] Slack support needs a paid Slack plan. [72] Opinionated, cheap to start, not for the cautious.

### 11. Warp cloud agents

Warp has grown from a terminal into cloud infrastructure for software factories. [73] Runs can use Warp's agent, Claude Code or Codex, but personal API keys are off the table for cloud runs. [32] Each run bills agent time, inference and compute. [74] Interesting; still finding its shape.

### 12. OpenHands

The open-source pick, under an MIT licence. [75] Label an issue and it opens a PR if it solves it. [76] Free locally, and hosted with ten conversations a day. [36] Ideal if someone on the team enjoys running infrastructure.

### 13. Jules

Google's agent runs on Gemini alone. [38] The free tier is generous at 15 tasks a day. [77] The trouble for companies is that paid tiers target personal Google accounts, and Workspace users land on an interest form. [78] Good for side projects.

### 14. Kiro

Amazon's entry is built around spec-driven development. [79] Its web agent is in preview and needs a paid plan. [80] [42] Cloud sessions run only in us-east-1. [40] Promising for spec lovers; too early to rank higher.

## Claude Code in Slack without keeping your laptop open

This is the request we hear most from small teams, in one form or another: give us Claude Code that keeps going after the lid shuts. The demand makes sense. Claude Code on a laptop is excellent until the lid closes, and then the session, the context and the half-written fix all go to sleep with it.

There are three ways to get there today. Claude Code on the web keeps running in Anthropic's cloud, but it is one person's session, not a channel's. [10] Claude Tag puts @Claude in Slack channels for Team and Enterprise organisations, in beta, billed by usage. [63] [21] The legacy Claude Slack bot is gone. [81]

Jiro is the third route. You run `claude setup-token` once on your own machine, which mints a twelve-month token linked to the Claude plan on your account, Pro through Enterprise. [82] Connect it in Jiro. From then on, anyone in the channel mentions Jiro, Claude Code runs in a cloud machine with your repos and tools, and a pull request comes back in the thread. Your laptop can be in a bag on a train.

## Picking from the list

Start with money, because it decides more than features do. Anthropic's own figure for enterprise Claude Code use is roughly $13 per developer per active day. [83] Multiply that across a team and a month, and the question of who resells you tokens stops being academic. If your team already pays for Claude or ChatGPT seats, prefer an agent that uses them: Jiro, Tembo or Amp. If you are buying model access fresh, a bundled product like Devin, Cursor or Copilot saves a procurement cycle.

Then think about the surface. Slack-first teams should test Jiro and Claude Tag side by side. IDE-first teams will be happier with Cursor. Teams that live in GitHub issues already own Copilot.

Last, consider how much platform you want. Factory and Warp reward investment, while the Codex and Claude web sessions ask for almost none. Most five-to-twenty person teams sit closer to the second camp, which is roughly why our top four look the way they do.

One more filter, and it is the one buyers skip. Run a pilot on boring work. A demo task flatters every agent on this list. A flaky test, a stale README or an alert from last Tuesday does not. Give two finalists the same three chores for a week, then ask the reviewers which pull requests they would happily merge without rewriting. That answer beats any table, including ours.

## FAQ

### What is a background coding agent?

An agent that takes a task, works on it unattended in a remote environment with your repository, and returns a result such as a pull request. Cloud coding agent means the same thing.

### Which background coding agent is best for a small team?

For a 5–20 person team with Claude or ChatGPT subscriptions in place, Jiro. Teams standardised on Cursor should look at Cursor cloud agents, and ChatGPT-only teams at Codex cloud.

### Is there a free background coding agent?

OpenHands is free to run locally, Jules has a free tier, and Jiro offers a 30-day trial with no card. [36] [77] [3]

### What happened to Charlie?

Charlie Labs shut down; Charlie was available only until 2026-10-05. [43]

### Can I run Claude Code in Slack on my own Claude plan?

With Jiro, yes, after generating a subscription token via `claude setup-token`. [82] [2] Claude Tag also works in Slack but needs a Team or Enterprise plan. [63]

### Which agents merge code on their own?

Amp's default Ship pushes to the base branch after tests. [70] Copilot cloud agent cannot merge its own drafts. [59] Jiro returns pull requests for your team to review. [49]

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
2. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
4. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
5. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
6. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
7. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
8. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
9. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
10. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
11. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
12. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
13. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
14. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
15. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
16. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
17. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
18. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
19. Each Claude Tag thread runs in its own ephemeral sandbox in Anthropic's cloud, on the same engine as Claude Code on the web. Source: https://claude.com/docs/claude-tag/concepts/how-it-works (checked 2026-10-19)
20. Claude Tag runs Anthropic's Opus and Sonnet models, chosen per thread, per channel or by admin default. Source: https://claude.com/docs/claude-tag/users/models (checked 2026-10-19)
21. Claude Tag channel work is billed by usage from an organization balance rather than per seat; one-to-one DMs bill to the sender's own seat. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
22. Droids run locally in the Droid CLI and Factory App, on Factory-managed cloud Droid Computers, or on machines you register. Source: https://docs.factory.com/llms.txt (checked 2026-10-16)
23. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. Source: https://docs.factory.com/model-independence/byok.md (checked 2026-10-16)
24. Factory's plans are Pro at $20 a month, Plus at $100, Max at $200, and Teams at $60 a month plus $40 per seat for up to 10 seats; Business and Enterprise are custom. Source: https://factory.com/pricing (checked 2026-10-16)
25. Tembo runs coding agents in isolated cloud sessions with code, terminal, files and a live desktop. Source: https://www.tembo.io/ (checked 2026-10-16)
26. Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. Source: https://www.tembo.io/ (checked 2026-10-16)
27. Tembo's Pro plan is $60 a month and Max $200 a month, each including a usage allowance, with compute billed per second from $0.1066 an hour. Source: https://www.tembo.io/pricing (checked 2026-10-16)
28. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
29. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
30. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
31. Warp cloud agents run on Warp-hosted compute or on your own infrastructure. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
32. Each Warp cloud run can use Warp Agent, Claude Code or Codex; personal API keys are not available for cloud runs, but Business and Enterprise can use team-managed inference. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
33. Warp's Terminal and Agents plans are Free, Build at $20 a month, Max at $200 and Business at $50 per user; Warp Factories also offers pay-as-you-go usage at 20% above API rates. Source: https://www.warp.dev/pricing (checked 2026-10-16)
34. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
35. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
36. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
37. Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. Source: https://jules.google/docs/environment (checked 2026-10-16)
38. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
39. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
40. Kiro cloud sessions run in an AWS-managed sandbox in us-east-1, up to 10 at a time, with no separate compute charge; the IDE and CLI also run locally. Source: https://kiro.dev/docs/cloud-sessions.md (checked 2026-10-16)
41. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. Source: https://kiro.dev/docs/models.md (checked 2026-10-16)
42. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. Source: https://kiro.dev/pricing/ (checked 2026-10-16)
43. Charlie Labs announced it was shutting down, with Charlie available only until 2026-10-05. Source: https://charlielabs.ai/blog/charlie-is-shutting-down (checked 2026-10-17)
44. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
45. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
46. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
47. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
48. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
49. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
50. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
51. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
52. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
53. In Codex cloud you review the changes, then commit or open a pull request when you are ready. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
54. Codex Cloud (Legacy) still powers Code Review and the GitHub and Linear integrations, and OpenAI plans to deprecate it. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
55. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
56. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
57. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
58. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. Source: https://docs.devin.ai/product-guides/automations.md (checked 2026-10-16)
59. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
60. On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). Source: https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents (checked 2026-10-16)
61. Claude Tag lets anyone in a Slack channel tag @Claude to hand it work; Claude replies in the thread, where the channel can see it. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
62. Anthropic labels Claude Tag a public beta whose features may change before general availability. Source: https://claude.com/docs/claude-tag/admins/migrate-from-earlier (checked 2026-10-19)
63. Claude Tag is available only on Team and Enterprise plans, not on Free, Pro or Max, and not through third-party deployments. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
64. On the Team plan, Claude won't respond in channels until the organization buys usage credits. Source: https://claude.com/docs/claude-tag/admins/set-spend-limit (checked 2026-10-19)
65. In Claude Tag, repository hooks and .mcp.json are not loaded, effort level is not configurable, and sessions run in auto mode. Source: https://claude.com/docs/claude-tag/concepts/for-claude-code-users (checked 2026-10-19)
66. Factory sells agent-native software development; its agents are called Droids. Source: https://factory.com/ (checked 2026-10-16)
67. Droids work in the Factory App, Droid CLI, headless Droid Exec and IDEs, and take delegations from Slack, Linear and Jira. Source: https://docs.factory.com/delegations/index.md (checked 2026-10-16)
68. Factory Private, launched 2026-09-18, deploys Factory into a customer's VPC, on-premises or air-gapped network. Source: https://factory.com/news/factory-private (checked 2026-10-16)
69. Tembo starts work from GitHub, GitLab, Bitbucket, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules. Source: https://www.tembo.io/ (checked 2026-10-16)
70. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
71. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. Source: https://ampcode.com/news/use-your-claude-plan (checked 2026-10-16)
72. Amp's Slack integration launched on 2026-07-20 and needs a paid Slack plan. Source: https://ampcode.com/docs/markdown/puck/slack-integration (checked 2026-10-16)
73. Warp now describes itself as open infrastructure for cloud software factories, alongside the Warp Terminal and the Warp Agent CLI. Source: https://www.warp.dev/ (checked 2026-10-16)
74. Warp bills a cloud run for agent time, inference and Warp-hosted compute. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
75. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
76. Labelling a GitHub issue openhands or commenting @openhands starts a run that opens a PR if it resolves the issue. Source: https://docs.openhands.dev/openhands/usage/cloud/github-installation (checked 2026-10-16)
77. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
78. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
79. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. Source: https://kiro.dev/llms.txt (checked 2026-10-16)
80. Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. Source: https://kiro.dev/blog/introducing-kiro-web/ (checked 2026-10-16)
81. The legacy Claude in Slack bot was retired on 2026-10-05 and no longer responds in channels of workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-19)
82. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
83. Anthropic reports that across enterprise deployments Claude Code averages about $13 per developer per active day and $150 to $250 per developer per month, staying below $30 per active day for 90% of users. Source: https://code.claude.com/docs/en/costs (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
