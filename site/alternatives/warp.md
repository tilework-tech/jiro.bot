# Warp Alternatives & Competitors (2026): 6 Best Options

Updated 2026-10-19

> **What are the best Warp alternatives?**
>
> If you want a terminal, Ghostty, WezTerm, iTerm2 and Alacritty are excellent free picks. If you want Warp's cloud agents without Warp's metering, Jiro leads for small teams already paying for Claude or ChatGPT, followed by Amp, Claude Code on the web, Codex cloud, Tembo and Cursor cloud agents. Jiro is a background coding agent by Nori.

## Warp's cloud agents and six alternatives

|  | Where runs happen | Harness and model access | Kick off a run from | How you pay |
|---|---|---|---|---|
| Jiro | Isolated cloud environment with your repos and tools [1] | Claude Code, Codex, Cursor [2] on Your Claude/ChatGPT login or API key; Cursor key [3] | Slack, web, Discord, terminal, schedules, webhooks [4] | Free 30-day trial; Developer $99/mo; Team $250/mo [5] |
| Warp | Warp cloud or your infrastructure [6] | Warp Agent, Claude Code or Codex; team keys on Business+ [7] | Slack, Linear, Jira, GitHub, schedules, CLI, web [8] | Free; Build $20/mo; Max $200; Business $50/user [9] |
| Amp | Amp cloud orbs or your own runners [10] | Own subscriptions and keys, no BYOK fee [11] | Web, macOS/iOS, CLI, GitHub, Slack [12] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [13] |
| Claude Code on the web | Anthropic-managed VMs [14] | Claude models; Anthropic account required [15] | Web, mobile, desktop, terminal [16] | In Pro $20/mo, Max $100+/mo, Team seats [17] |
| Codex cloud | OpenAI-hosted VMs [18] | OpenAI models; cloud needs a ChatGPT plan [19] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [20] | In ChatGPT Plus $20/mo and up [21] |
| Tembo | Tembo cloud sessions [22] | Multiple harnesses; own keys or subscriptions [23] | GitHub, Slack, Linear, Jira, Sentry, schedules [24] | Pro $60/mo; Max $200/mo; compute per second [25] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [26] | Billed at API prices for the chosen model; own keys chat-only [27] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [28] | Premium $30/mo+ (X Subscription) plus API-priced usage [29] |

Terminals are covered in their own section below, since they are free and solve a different problem.

## First question: which Warp are you leaving?

Because there are two now. Maybe three.

There is the terminal, the one with blocks and the nice prompt editor that made a lot of us rethink what a shell window could be. There is the Warp Agent CLI. And there is the newer, bigger pitch: Warp calls itself open infrastructure for cloud software factories [30]. That last one is a different animal from a terminal emulator, and people searching "Warp alternatives" are usually after one of the two halves, not both.

Credit where due. Warp's cloud side is genuinely capable. Runs start from Slack, Linear, Jira, GitHub, Azure DevOps, schedules, its CLI, an API or the web [8], and each run can use Warp's own agent, Claude Code or Codex [7]. You can even put the compute on your own infrastructure [6].

So why look around? Mostly the bill. A cloud run is charged for agent time, plus inference, plus Warp-hosted compute [31]. Personal API keys don't apply to cloud runs; team-managed inference is a Business and Enterprise thing [7]. And pay-as-you-go usage sits 20% over API rates [9]. If you already pay Anthropic or OpenAI every month, paying for those same tokens again, with a margin on top, stings.

## Only want a terminal? Here are four

Short version, because this part is easy and they're all free.

- **Ghostty.** MIT-licensed and under active development [32]. My default recommendation right now.
- **WezTerm.** Open source and cross-platform [33]. The pick when your week bounces between three operating systems.
- **iTerm2.** The macOS veteran. Free, GPL [34]. Years of muscle memory live here.
- **Alacritty.** Apache-2.0 [35]. Minimal on purpose. Pair it with tmux and get out of its way.

Also worth saying: Warp's own terminal client is open source on GitHub [36]. Nothing stops you keeping it and pointing your agent work somewhere else. Plenty of people do exactly that.

Now the more interesting half.

## Cloud coding agents that compete with Warp, ranked

Ranked for a small team that wants agents running while laptops are shut, and would rather spend the Claude or ChatGPT plan it already has than buy inference twice.

### 1. Jiro: when your team already pays for the model

Jiro is the one I'd point a 5-to-20-person team at. Every conversation gets its own cloud machine, loaded with your repos and tools [1] and set up by one org-wide script [37]. Inside, the harness is your pick of Claude Code, Codex or Cursor [2]. Now the money part: it signs in with your existing Claude or ChatGPT subscription or an API key [3] and adds zero markup on tokens [38].

Poke it from Slack, Discord or web chat, or let a webhook, a cron line or your terminal do the poking [4]. Out comes a pull request for someone to review [39].

And it has taste, which sounds fluffy until you've reviewed a week of agent PRs. Jiro would rather ship one clean diff than five noisy ones, and it'll tell you when your ticket is asking for the wrong thing.

### 2. Amp: opinionated, fast, ships to trunk

Amp's cloud work happens in orbs, one remote machine per thread, or on runners you own [10]. It accepts your Claude, ChatGPT and other subscriptions [11], with Claude plan support landing on October 10 [40]. Orbs start at eight cents an hour [41]. One thing to know going in: by default, Ship pushes straight to the base branch once tests pass [42]. Bold. Flip it to Push to Branch if your team likes reviews.

### 3. Claude Code on the web: the terminal person's cloud

Type `claude --cloud` and your session moves to Anthropic's machines; `claude --teleport` pulls one back down [16]. For anyone who lives in a shell, that round trip is a treat. No extra charge for the cloud machine on Pro, Max or Team [17]. Claude models only, though [15], and you open the pull request yourself [43].

### 4. Codex cloud: already in your ChatGPT plan

Included from ChatGPT Plus [21], so a lot of people have it without realising. Tasks start from the Codex CLI, the IDE, ChatGPT, Slack and more [20]. Quirk: an API key gets you the CLI but not the cloud features, which want a ChatGPT plan [19].

### 5. Tembo: the trigger buffet

Sentry, PagerDuty, Linear, Jira, schedules, webhooks; Tembo listens to all of it [24]. Several harnesses, your own keys or subscriptions [23]. Compute is metered per second [25], which is fair but needs watching.

### 6. Cursor cloud agents: for the editor crowd

Polished PRs with screenshots and video [44]. But every run is metered at list API price for whatever model you picked, and bring-your-own keys stop at chat [27]. Fine if you're all-in on Cursor. Odd fit for a terminal-first team.

## Picking one without overthinking it

Ask yourself three things.

Who already gets your model money? If it's Anthropic or OpenAI, choose a tool that spends that subscription in the cloud instead of selling you inference again.

Where do requests actually come from? For most small teams it's a Slack thread at 4pm, not a dashboard. Go where the asking happens.

How much babysitting can you afford? Some tools want an admin. Some want a reviewer. Pick the one whose PRs you'd happily read on a Friday.

## Why Jiro is first

Because it matches how small teams actually work. Somebody asks in a thread [45]; the work happens on a full machine with your tooling and the team's shared context; the laptop stays shut.

There's evidence it holds up. Upward of a quarter of Miravoice's merged PRs come from Nori, and an engineer there figures it saves five hours a week, easily [46]. Their team set the agent up from their phones, no laptop involved [47].

The math is short. Free for 30 days without a card. Then Developer at $99 a month or Team at $250 [5], with runtimes that sleep when nothing's happening [48]. Your model bill stays exactly where it already is.

## When Warp is still the right call

If your work starts in Azure DevOps or GitHub events and you want those wired straight in, Warp covers that and Jiro does not [8]. If you need cloud runs on your own infrastructure, Warp supports it [6]. If you love Warp's own agent, keep it. And if what you mostly love is the terminal, keep that too. It's open source and it isn't going anywhere [36].

## Moving your agent work

There's a hands-on [switching guide](https://jiro.bot/switch/warp-to-jiro), written as a pairing session: open a terminal, connect things one at a time, send a first task, and keep Warp running next to it while you decide.

## FAQ

### What are the best Warp alternatives?

For the terminal: Ghostty, WezTerm, iTerm2 or Alacritty. For cloud coding agents: Jiro, if your shop is small and Claude or ChatGPT seats are already bought, then Amp, Claude Code on the web, Codex cloud, Tembo and Cursor cloud agents.

### Who are Warp's competitors?

On the terminal side, Ghostty, WezTerm, iTerm2 and Alacritty. On the agent platform side, Jiro, Amp, Tembo, Codex cloud, Cursor's cloud agents and Claude Code on the web.

### How much does Warp cost?

Warp has a Free tier; Build costs $20 monthly, Max $200, and Business $50 a seat. Pay-as-you-go usage in Warp Factories is charged at 20% above API rates [9].

### Can I use my own API key for Warp cloud agents?

Not a personal one. Personal API keys aren't available for cloud runs, though Business and Enterprise teams can use team-managed inference [7].

### What's the best free, open-source alternative to the Warp terminal?

Ghostty is the one most people land on [32]. WezTerm if you hop between operating systems [33], Alacritty if you want minimal [35].

### Can I keep the Warp terminal and still use Jiro?

Yes. Jiro doesn't replace your terminal. You talk to it from Slack, the web, Discord or its own terminal client [4], in whatever emulator you like.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
2. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
4. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
5. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
6. Warp cloud agents run on Warp-hosted compute or on your own infrastructure. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
7. Each Warp cloud run can use Warp Agent, Claude Code or Codex; personal API keys are not available for cloud runs, but Business and Enterprise can use team-managed inference. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
8. Warp cloud runs start from Slack, Linear, Jira, GitHub, Azure DevOps, schedules, the Oz CLI, the API or the web app. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
9. Warp's Terminal and Agents plans are Free, Build at $20 a month, Max at $200 and Business at $50 per user; Warp Factories also offers pay-as-you-go usage at 20% above API rates. Source: https://www.warp.dev/pricing (checked 2026-10-16)
10. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
11. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
12. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
13. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
14. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
15. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
16. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
17. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
18. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
19. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
20. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
21. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
22. Tembo runs coding agents in isolated cloud sessions with code, terminal, files and a live desktop. Source: https://www.tembo.io/ (checked 2026-10-16)
23. Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. Source: https://www.tembo.io/ (checked 2026-10-16)
24. Tembo starts work from GitHub, GitLab, Bitbucket, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules. Source: https://www.tembo.io/ (checked 2026-10-16)
25. Tembo's Pro plan is $60 a month and Max $200 a month, each including a usage allowance, with compute billed per second from $0.1066 an hour. Source: https://www.tembo.io/pricing (checked 2026-10-16)
26. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
27. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
28. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
29. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
30. Warp now describes itself as open infrastructure for cloud software factories, alongside the Warp Terminal and the Warp Agent CLI. Source: https://www.warp.dev/ (checked 2026-10-16)
31. Warp bills a cloud run for agent time, inference and Warp-hosted compute. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
32. Ghostty is an actively maintained, MIT-licensed open-source terminal. Source: https://github.com/ghostty-org/ghostty (checked 2026-10-17)
33. WezTerm is an actively maintained open-source, cross-platform terminal. Source: https://github.com/wezterm/wezterm (checked 2026-10-17)
34. iTerm2 is free GPL-licensed software for macOS. Source: https://iterm2.com/ (checked 2026-10-17)
35. Alacritty is an actively maintained Apache-2.0 open-source terminal. Source: https://github.com/alacritty/alacritty (checked 2026-10-17)
36. Warp's terminal client is open source on GitHub. Source: https://github.com/warpdotdev/warp (checked 2026-10-16)
37. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
38. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
39. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
40. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. Source: https://ampcode.com/news/use-your-claude-plan (checked 2026-10-16)
41. Orbs are billed per minute, from $0.08 an hour for the smallest size. Source: https://ampcode.com/docs/markdown/orbs/sizes-and-costs (checked 2026-10-16)
42. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
43. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
44. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
45. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
46. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
47. The Miravoice team set up an agent entirely in the cloud from their phones. Source: https://noriagentic.com/#miravoice-story (checked 2026-10-19)
48. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
