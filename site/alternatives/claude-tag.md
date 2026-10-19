# Claude Tag Alternatives & Competitors (2026): 7 Best Options

Updated 2026-10-19

> **What are the best Claude Tag alternatives?**
>
> Got a crew of five to twenty engineers, with the company card already covering Claude or ChatGPT? Then start with Jiro: Claude Code, Codex and Cursor all answer from Slack on the subscription you were paying for anyway. Jiro is a background coding agent by Nori. Codex through @ChatGPT, Cursor cloud agents, Devin, Amp, Tembo and GitHub Copilot cloud agent round out the list.

## Claude Tag next to six alternatives

|  | Where your team asks for work | Which models or agents | How it is billed | Where the work runs |
|---|---|---|---|---|
| Jiro | Slack, web, Discord, terminal, schedules, webhooks [1] | Claude Code, Codex, Cursor [2] | Free 30-day trial; Developer $99/mo; Team $250/mo [3] | Isolated cloud environment with your repos and tools [4] |
| Claude Tag | Slack; Teams announced [5] | Claude models only [6] | Usage-billed, no per-seat charge [7] | Anthropic cloud sandbox per thread [8] |
| OpenAI Codex cloud | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [9] | OpenAI models; cloud needs a ChatGPT plan [10] | In ChatGPT Plus $20/mo and up [11] | OpenAI-hosted VMs [12] |
| Cursor cloud agents | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [13] | Billed at API prices for the chosen model; own keys chat-only [14] | Premium $30/mo+ (X Subscription) plus API-priced usage [15] | Cursor cloud VMs or self-hosted workers [16] |
| Devin | Web, desktop, CLI, Slack, Teams, Linear, Jira [17] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [18] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [19] | Cognition cloud VMs, or local [20] |
| Amp | Web, macOS/iOS, CLI, GitHub, Slack [21] | Own subscriptions and keys, no BYOK fee [22] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [23] | Amp cloud orbs or your own runners [24] |
| Tembo | GitHub, Slack, Linear, Jira, Sentry, schedules [25] | Multiple harnesses; own keys or subscriptions [26] | Pro $60/mo; Max $200/mo; compute per second [27] | Tembo cloud sessions [28] |
| GitHub Copilot cloud agent | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [29] | Many models via GitHub; own keys not documented for it [30] | Pro $10; Pro+ $39; Max $100; Business $19/user [31] | GitHub Actions runners, 59-minute sessions [32] |

Prices and features change often. Every rival cell links to its source below.

## Why a team that likes Claude Tag still looks around

Let me say the nice part first, because it is true. Claude Tag is a lovely idea, executed well. Somebody types @Claude in a channel, hands over a bug, and the whole channel gets to watch the answer arrive in the thread [33]. That visibility is the feature. Junior folks see how a senior prompt is phrased, and the person who filed the ticket sees progress without asking.

Anthropic shipped it on June 23 as a beta for Team and Enterprise organizations [34], and it still carries the public beta label, so expect things to move [35]. Owners get real budget controls too: an org-wide cap, caps per channel, and warnings when spend crosses 75% and again at 95% [36]. That is more thoughtful than most tools manage in year one.

So why shop? Usually one of four reasons.

- **Your plan.** Tag is limited to Team and Enterprise; Pro and Max people are left out [37].
- **The meter.** Channel work draws on an org balance rather than seats [7], and Team orgs must buy credits before Claude will answer at all [38].
- **One vendor.** You pick between Opus and Sonnet, and that is the whole menu [6].
- **A fixed harness.** Repo hooks and .mcp.json are skipped, effort isn't adjustable, and everything runs in auto mode [39].

Each of those is a reasonable product call. If your team would have called them differently, read on.

And if you were happily using the old Claude bot in Slack, that door closed on October 5 [40], which is probably how half of you landed on this page.

## Seven picks for a Slack-first team, in order

I ranked these for a team of five to twenty that lives in Slack, ships through GitHub, and already pays somebody for model access. Change those assumptions and the order shuffles.

### 1. Jiro: the same Slack habit, your own subscription

Jiro keeps the part of Tag your team loves, which is asking for work in a channel, and loosens the parts that pinch. You mention it in Slack, and it can also pick up work from web chat, Discord, a terminal, cron schedules or webhooks [1]. Underneath, the agent doing the typing is Claude Code, Codex or Cursor, your call [2].

The money works differently. You connect your own Claude or ChatGPT login or an API key, with Cursor on a Cursor key [41], and Nori adds no markup on tokens [42]. Every conversation is handed a separate cloud machine, repos cloned and tools preinstalled [4]. It is built for small teams on Claude or ChatGPT. Bigger orgs with a procurement department may want something else.

### 2. OpenAI Codex cloud: for the ChatGPT side of the office

If your company standardized on ChatGPT rather than Claude, Codex is the natural neighbor. Slack requests start with @ChatGPT these days [43], and cloud tasks come bundled from the $20 Plus plan upward [11]. It is OpenAI models only, mirroring Tag's Claude-only stance [10]. Same shape, other lab.

### 3. Cursor cloud agents: when the editor is home base

Teams already in Cursor all day get a lot here. Agents start from Slack, Microsoft Teams, Linear, GitHub comments and more [13], and the pull requests come with screenshots, videos and logs attached [44]. Budget for it as Premium at $30 a month or higher, with usage priced at API rates on top [15].

### 4. Devin: the most autonomous of the bunch

Devin takes requests in Slack, Teams, Linear and Jira [17], and it is unusually diligent about its own pull requests, handling review comments and merge conflicts and splitting big changes into stacks [45]. Its Teams plan charges $40 a seat over an $80 floor each month [19]. You are trusting Cognition's router to pick models, which some people love and some people find opaque [18].

### 5. Amp: subscriptions welcome, Slack included

Amp happily takes a Claude Pro or Max plan, a ChatGPT plan or plain keys, and it charges no token fees on your own keys below Enterprise [22]. Its Slack app arrived in July and requires a paid Slack workspace [46]. One habit to check before you adopt it: out of the box, Ship lands commits directly on the base branch after the tests go green [47]. Flip the setting if your team wants a pull request.

### 6. Tembo: for teams whose work starts with an alert

Tembo starts from a long list of event sources, including Sentry, PagerDuty, Jira and Linear alongside Slack [25]. It also runs several harnesses on your keys or subscriptions [26]. Pro is $60 a month, Max $200, and compute bills by the second [27].

### 7. GitHub Copilot cloud agent: if GitHub is the center of gravity

Copilot's agent works out of GitHub Actions runners, with each session capped at 59 minutes [32]. It reaches Slack too [29]. Higher tiers let you assign a GitHub task to Claude or Codex instead of Copilot itself, a feature still in public preview [48]. Its $10 Pro plan is the cheapest paid seat here [31]. It is also the most GitHub-shaped, for better and worse.

## Picking without a three-week bake-off

Ask your team four questions in a thread. Seriously, a thread; you are already there.

- Which model subscriptions does the company already pay for, and would we rather reuse them than fund a second meter?
- Do we want one lab's models forever, or the option to switch when the leaderboard flips next quarter?
- Does our repo depend on its own hooks, MCP config or a particular effort setting?
- Who needs to start work: only engineers, or also the PM and the on-call rotation at 2 a.m.?

If the answers are "Claude Team plan, Claude forever, no special config, engineers only," keep Tag. If they wobble, the list above sorts itself fast.

## Why Jiro takes first place

Three reasons, roughly in the order teams tell us they matter.

First, you stop paying twice. Plans are flat: a free 30-day trial without a card, Developer at $99 a month, and Team at $250 monthly with five runtimes pooled across the group [3]. Idle runtimes go to sleep [49]. Tokens keep flowing through the Claude or ChatGPT plan finance already approved.

Second, the setup is yours to shape. Tag decides the harness for you. With Jiro, an org setup script prepares every environment [50], admins pick MCP servers from a catalog [51], and one skillset is rendered into whatever file each agent reads, so Claude Code still finds its CLAUDE.md [52]. That is what "more customizable" means in practice. Not more knobs for their own sake, just your knobs.

Third, it holds up on real teams. Corvus's CTO was out with a client when a production bug surfaced; he asked Nori to dig in, and Nori got a fix deployed [53]. Miravoice reports Nori behind more than one in four of its merged PRs, and one of their engineers counts the weekly savings at five hours, calling that the easy estimate [54]. Those are Nori customers, and they started with exactly the dull work: docs, test gaps, small tickets.

Jiro also tends to argue a little. It is meant to push back on a shaky plan and flag a misstep early, which some teams find mildly annoying for about a day.

## When I would tell you to keep Claude Tag

Stay put if your org is on Claude Enterprise, everyone is happy with Opus and Sonnet, and the spend controls already satisfy finance. Tag's channel-visible threads are genuinely good for teaching. Its self-hosted runner option keeps sessions inside your network, though admin connectors don't follow them there [55]. If that is your setup, you are not missing much.

One caveat: organizations with Zero Data Retention switched on cannot use Tag at all [56]. If that is you, the decision has been made for you.

## Trying Jiro next to Tag

You do not have to pick a winner on day one. Our [switching guide](https://jiro.bot/switch/claude-tag-to-jiro) lays out a two-week pilot that runs both tools in neighboring channels, and the [head-to-head comparison](https://jiro.bot/compare/claude-tag) has the budget math.

## FAQ

### What are the best Claude Tag alternatives?

Jiro leads when your team is small and already holds Claude or ChatGPT subscriptions. After it come OpenAI Codex cloud, Cursor cloud agents, Devin, Amp, Tembo and GitHub Copilot cloud agent, each a better fit for a particular stack.

### Who competes with Claude Tag?

Anything that takes coding requests in Slack and comes back with code: Jiro, Codex via @ChatGPT, Cursor, Devin, Amp, Tembo and Copilot's cloud agent all qualify.

### How much does Claude Tag cost?

There is no per-seat fee for channel work; it is drawn from an organization balance by usage, while DMs bill to the sender's seat [7]. Team orgs prepay credits first [38].

### Can I use Claude Tag on a Claude Pro or Max plan?

No. It is offered on Team and Enterprise only [37]. Jiro accepts a Pro or Max login, which you mint on your own machine with `claude setup-token` [57].

### Can Claude Tag run GPT or Codex models?

No, it is Opus and Sonnet only [6]. If half your team prefers Codex, Jiro lets each conversation use either.

### Is Jiro made by Anthropic?

No. Nori makes Jiro. It runs Anthropic's Claude Code among other agents, but the company is independent.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
2. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
4. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
5. Claude Tag works in Slack channels, threads, group DMs, direct messages and the assistant panel; Microsoft Teams support is announced as coming soon. Source: https://claude.com/product/tag (checked 2026-10-19)
6. Claude Tag runs Anthropic's Opus and Sonnet models, chosen per thread, per channel or by admin default. Source: https://claude.com/docs/claude-tag/users/models (checked 2026-10-19)
7. Claude Tag channel work is billed by usage from an organization balance rather than per seat; one-to-one DMs bill to the sender's own seat. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
8. Each Claude Tag thread runs in its own ephemeral sandbox in Anthropic's cloud, on the same engine as Claude Code on the web. Source: https://claude.com/docs/claude-tag/concepts/how-it-works (checked 2026-10-19)
9. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
10. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
11. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
12. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
13. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
14. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
15. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
16. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
17. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
18. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
19. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
20. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
21. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
22. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
23. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
24. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
25. Tembo starts work from GitHub, GitLab, Bitbucket, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules. Source: https://www.tembo.io/ (checked 2026-10-16)
26. Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. Source: https://www.tembo.io/ (checked 2026-10-16)
27. Tembo's Pro plan is $60 a month and Max $200 a month, each including a usage allowance, with compute billed per second from $0.1066 an hour. Source: https://www.tembo.io/pricing (checked 2026-10-16)
28. Tembo runs coding agents in isolated cloud sessions with code, terminal, files and a live desktop. Source: https://www.tembo.io/ (checked 2026-10-16)
29. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
30. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
31. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
32. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
33. Claude Tag lets anyone in a Slack channel tag @Claude to hand it work; Claude replies in the thread, where the channel can see it. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
34. Anthropic announced Claude Tag on 2026-06-23 as a beta for Claude Enterprise and Team customers. Source: https://www.anthropic.com/news/introducing-claude-tag (checked 2026-10-19)
35. Anthropic labels Claude Tag a public beta whose features may change before general availability. Source: https://claude.com/docs/claude-tag/admins/migrate-from-earlier (checked 2026-10-19)
36. Claude Tag owners can set an organization spend limit and per-channel limits, with alerts at 75% and 95%. Source: https://support.claude.com/en/articles/15594475-what-is-claude-tag (checked 2026-10-19)
37. Claude Tag is available only on Team and Enterprise plans, not on Free, Pro or Max, and not through third-party deployments. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
38. On the Team plan, Claude won't respond in channels until the organization buys usage credits. Source: https://claude.com/docs/claude-tag/admins/set-spend-limit (checked 2026-10-19)
39. In Claude Tag, repository hooks and .mcp.json are not loaded, effort level is not configurable, and sessions run in auto mode. Source: https://claude.com/docs/claude-tag/concepts/for-claude-code-users (checked 2026-10-19)
40. The legacy Claude in Slack bot was retired on 2026-10-05 and no longer responds in channels of workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-19)
41. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
42. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
43. Codex requests in Slack now start with @ChatGPT instead of @Codex. Source: https://learn.chatgpt.com/docs/third-party/slack.md (checked 2026-10-16)
44. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
45. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
46. Amp's Slack integration launched on 2026-07-20 and needs a paid Slack plan. Source: https://ampcode.com/docs/markdown/puck/slack-integration (checked 2026-10-16)
47. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
48. On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). Source: https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents (checked 2026-10-16)
49. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
50. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
51. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
52. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
53. Corvus's CTO saw a production bug at a client dinner, had Nori look into it and deploy a fix. Source: https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (checked 2026-10-19)
54. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
55. Claude Tag sessions can run on self-hosted runners inside your network, but admin-added connectors are unavailable there. Source: https://claude.com/docs/claude-tag/concepts/security-and-data (checked 2026-10-19)
56. Claude Tag isn't available to organizations with Zero Data Retention enabled. Source: https://claude.com/docs/claude-tag/concepts/security-and-data (checked 2026-10-19)
57. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
