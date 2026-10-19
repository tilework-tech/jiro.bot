# Claude Code on the Web Alternatives & Competitors (2026): 7 Best Options

Updated 2026-10-19

> **What are the best Claude Code on the web alternatives?**
>
> When Claude Code on the web stops being a solo tool and a team needs it, Jiro is the best alternative for small teams (about 5 to 20 engineers) with a Claude or ChatGPT plan on the books: Claude Code, Codex or Cursor in Slack and on schedules, on your own subscription. Jiro is a background coding agent by Nori. Claude Tag, Codex cloud, Warp, Amp, Cursor cloud agents and Jules are the other strong picks.

## Seven ways to run a coding agent off your laptop

|  | Agent and models | Where it runs | Start work from | Price |
|---|---|---|---|---|
| Jiro | Claude Code, Codex, Cursor [1] | Isolated cloud environment with your repos and tools [2] | Slack, web, Discord, terminal, schedules, webhooks [3] | Free 30-day trial; Developer $99/mo; Team $250/mo [4] |
| Claude Code on the web | Claude models; Anthropic account required [5] | Anthropic-managed VMs [6] | Web, mobile, desktop, terminal [7] | In Pro $20/mo, Max $100+/mo, Team seats [8] |
| Claude Tag | Claude models only [9] | Anthropic cloud sandbox per thread [10] | Slack; Teams announced [11] | Usage-billed, no per-seat charge [12] |
| OpenAI Codex cloud | OpenAI models; cloud needs a ChatGPT plan [13] | OpenAI-hosted VMs [14] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [15] | In ChatGPT Plus $20/mo and up [16] |
| Warp | Warp Agent, Claude Code or Codex; team keys on Business+ [17] | Warp cloud or your infrastructure [18] | Slack, Linear, Jira, GitHub, schedules, CLI, web [19] | Free; Build $20/mo; Max $200; Business $50/user [20] |
| Amp | Own subscriptions and keys, no BYOK fee [21] | Amp cloud orbs or your own runners [22] | Web, macOS/iOS, CLI, GitHub, Slack [23] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [24] |
| Cursor cloud agents | Billed at API prices for the chosen model; own keys chat-only [25] | Cursor cloud VMs or self-hosted workers [26] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [27] | Premium $30/mo+ (X Subscription) plus API-priced usage [28] |
| Jules | Gemini only [29] | Google-hosted short-lived VMs [30] | Web, GitHub label, CLI, API [31] | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [32] |

Rival cells are sourced and dated; follow the numbered links below the page.

## The day one laptop stopped being enough

Here is how it usually goes. You are a solo developer with a Max plan and a habit. You kick off a task on claude.ai/code before lunch, close the lid, and it keeps going on Anthropic's machines while you eat [6]. Later you check it from your phone, and in the evening you pull the session down to your terminal with `--teleport` [7]. No extra charge for the cloud machine, either; it comes with Pro or Max [8]. Honestly? Great tool.

Then you hire two people. Then four more.

Now the questions change. Who else can start a task? Where do they ask? Whose subscription pays? And what happens when a teammate wants to try Codex on something Claude keeps fumbling?

Claude Code on the web was built around one person and one Anthropic account, and it runs Claude models only [5]. The team story points to Slack, which on Team and Enterprise now means Claude Tag, still in public beta, with the old Claude Code Slack bot switched off on October 5 [33]. Tag bills channel work by usage under a spend cap an admin sets [34].

That shift is what sends people looking. What most of them want, in the words of one Nori customer, is "Claude Code, but you don't need your laptop open" for the whole team.

## Seven alternatives, ranked for a growing team

My ranking assumes a small team, a GitHub org, a Slack workspace, and at least one Claude or ChatGPT subscription already on the expense report.

### 1. Jiro: Claude Code for the team, not just the laptop

Jiro is the closest thing to "my cloud Claude Code, but everyone gets one." It runs Claude Code, and also Codex or Cursor when that suits a task better [1]. You sign in with your Claude login, a ChatGPT login, or an API key [35].

Work arrives from Slack, the web, Discord, a terminal, cron schedules and webhooks [3], and every conversation spins up its own cloud machine with the repos and tools in place [2]. Built for small teams. If you are one person who never leaves the Claude app, stick with what you have.

### 2. Claude Tag: Anthropic's own answer for teams

If your company is on Claude Team or Enterprise, Tag is the official path. Under the hood, each thread is a throwaway sandbox powered by what is essentially your current cloud Claude Code [10], and anyone in the channel can tag it in. Pro and Max users can't get it [36]. It's still a beta, too [37].

### 3. OpenAI Codex cloud: the mirror image

Same idea from the other lab. Each task gets an OpenAI-hosted machine that keeps going while your laptop sleeps [14], included from ChatGPT Plus at $20 [16]. Note that the cloud side wants a ChatGPT plan; an API key alone won't open it [13].

### 4. Warp: Claude Code in someone else's cloud

Warp surprised me. A cloud run can use Claude Code, Codex or Warp's own agent [17], kicked off from Slack, Linear, schedules and more [19]. The catch for subscription holders: personal API keys don't work for cloud runs [17], and runs bill for agent time, inference and compute [38].

### 5. Amp: bring the Max plan along

Amp started accepting Claude Pro and Max plans on October 10 via the Agent SDK [39]. Its orbs give each thread a remote machine that outlives your closed laptop [22], and the smallest orb costs about eight cents for a full hour, metered per minute [40]. Watch the default Ship behavior, which commits to trunk rather than opening a PR [41].

### 6. Cursor cloud agents: for editor loyalists

The pull requests are polished, with screenshots, videos and logs [42]. Pricing is harder to forecast: cloud agents bill at API rates for whatever model you choose [25], on top of a Premium plan or higher [28].

### 7. Jules: if your team leans Google

Jules runs Gemini [29] in short-lived Google machines with Docker preinstalled [30]. The free tier gives 15 tasks a day [43]. Paid tiers are sold to personal Google accounts; Workspace customers are sent to an interest form [44], which is awkward for a company rollout.

## How I would choose, knowing what I know now

Start with the subscription you already pay for. That alone eliminates half the table.

Then ask where your team actually talks. If it is Slack, cross off anything without a Slack front door. If half of your requests should start from a cron job or an alert, look hard at webhook and schedule support.

Last, decide how attached you are to a single lab. Plenty of people are very attached to Claude, and fair enough. But the day Claude keeps circling one stubborn migration, being able to throw Codex at it matters more than you would expect.

## Why Jiro comes first

Because it solves the exact problem that made you search. Your team gets cloud Claude Code from Slack, on subscriptions you control, with Nori charging nothing on tokens [45].

The price is boring in a good way. Thirty free days, card not required. After that, one person pays $99 monthly on Developer, or a whole team pays $250 monthly and shares five runtimes [4]. Runtimes sleep while idle [46].

The team-shaped parts are what you don't get from a solo tool. Shared org context travels with every session through skillsets [47]. An org setup script means nobody re-explains how to build the monorepo [48]. And Jiro is opinionated about craft: it tries to write what a careful senior teammate would, and it will say so when your plan looks wrong.

Real teams use it. Miravoice routes more than a quarter of its merged PRs through Nori [49], and that team configured its agent from phones, start to finish [50].

## When Claude Code on the web is still the right call

If you are still a team of one, stay. Seriously. The handoff between web, phone, desktop and terminal is smooth, the cloud machine is included in your plan, and auto-fix will chase CI failures and review comments after you open the PR [51]. Jiro earns its keep when other people need to start the work.

## Bringing your Claude Code habits over

Your CLAUDE.md and your Claude login both come along. The [switching guide](https://jiro.bot/switch/claude-code-web-to-jiro) walks through it like a note to a teammate.

## FAQ

### What are the best Claude Code on the web alternatives?

For a small team on Claude or ChatGPT, Jiro. Then Claude Tag if you are on Claude Team or Enterprise, Codex cloud for ChatGPT shops, Warp, Amp, Cursor cloud agents and Jules.

### Who competes with Claude Code on the web?

Google's Jules, Warp, Amp, Jiro, and both OpenAI's and Cursor's cloud agents put a coding agent on a remote machine. Claude Tag is Anthropic's own team product on that same engine [10].

### How much does Claude Code on the web cost?

No separate price. Pro ($20 a month), Max (starting at $100) and every Team or Enterprise seat include it, with the cloud machine thrown in, and the Free plan does not include Claude Code [8].

### How do I get Claude Code in Slack without keeping my laptop open?

On Claude Team or Enterprise, Claude Tag does it [36]. On a Pro, Max, Team or Enterprise plan, Jiro runs Claude Code in its own cloud machine and takes requests from Slack [3].

### What happened to the Claude Code Slack app?

The legacy bot was retired on October 5, 2026 and stopped answering in workspaces tied to a Claude organization [52].

### Can I use my Claude Max plan with Jiro?

Yes. In your own terminal, `claude setup-token` mints a long-lived token for the Max plan [53]; paste it into Jiro's Claude connection and you are done.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
3. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
4. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
5. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
6. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
7. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
8. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
9. Claude Tag runs Anthropic's Opus and Sonnet models, chosen per thread, per channel or by admin default. Source: https://claude.com/docs/claude-tag/users/models (checked 2026-10-19)
10. Each Claude Tag thread runs in its own ephemeral sandbox in Anthropic's cloud, on the same engine as Claude Code on the web. Source: https://claude.com/docs/claude-tag/concepts/how-it-works (checked 2026-10-19)
11. Claude Tag works in Slack channels, threads, group DMs, direct messages and the assistant panel; Microsoft Teams support is announced as coming soon. Source: https://claude.com/product/tag (checked 2026-10-19)
12. Claude Tag channel work is billed by usage from an organization balance rather than per seat; one-to-one DMs bill to the sender's own seat. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
13. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
14. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
15. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
16. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
17. Each Warp cloud run can use Warp Agent, Claude Code or Codex; personal API keys are not available for cloud runs, but Business and Enterprise can use team-managed inference. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
18. Warp cloud agents run on Warp-hosted compute or on your own infrastructure. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
19. Warp cloud runs start from Slack, Linear, Jira, GitHub, Azure DevOps, schedules, the Oz CLI, the API or the web app. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
20. Warp's Terminal and Agents plans are Free, Build at $20 a month, Max at $200 and Business at $50 per user; Warp Factories also offers pay-as-you-go usage at 20% above API rates. Source: https://www.warp.dev/pricing (checked 2026-10-16)
21. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
22. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
23. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
24. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
25. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
26. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
27. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
28. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
29. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
30. Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. Source: https://jules.google/docs/environment (checked 2026-10-16)
31. Jules takes work from its web app, GitHub issues labelled jules, the Jules Tools CLI and the Jules API. Source: https://jules.google/docs/changelog/ (checked 2026-10-16)
32. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
33. For Team and Enterprise, Slack work moves to Claude Tag (public beta), and the legacy Claude Code Slack bot was retired on 2026-10-05 in workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-16)
34. Claude Tag bills Slack channel work by usage under an admin-set spend limit. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-16)
35. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
36. Claude Tag is available only on Team and Enterprise plans, not on Free, Pro or Max, and not through third-party deployments. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
37. Anthropic labels Claude Tag a public beta whose features may change before general availability. Source: https://claude.com/docs/claude-tag/admins/migrate-from-earlier (checked 2026-10-19)
38. Warp bills a cloud run for agent time, inference and Warp-hosted compute. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
39. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. Source: https://ampcode.com/news/use-your-claude-plan (checked 2026-10-16)
40. Orbs are billed per minute, from $0.08 an hour for the smallest size. Source: https://ampcode.com/docs/markdown/orbs/sizes-and-costs (checked 2026-10-16)
41. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
42. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
43. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
44. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
45. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
46. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
47. Nori provides the runtime around coding agents: machines, lifecycle, credentials, integrations, transcripts, checkpoints, team policy and portable skillsets. Source: https://docs.noriagentic.com/start/what-is-nori (checked 2026-10-19)
48. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
49. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
50. The Miravoice team set up an agent entirely in the cloud from their phones. Source: https://noriagentic.com/#miravoice-story (checked 2026-10-19)
51. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
52. The legacy Claude in Slack bot was retired on 2026-10-05 and no longer responds in channels of workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-19)
53. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
