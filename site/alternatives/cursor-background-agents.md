# Cursor Background Agents Alternatives & Competitors (2026): 6 Best Options

Updated 2026-10-19

> **What are the best Cursor background agents alternatives?**
>
> If you're on a small team, somewhere around five to twenty engineers, and somebody already expenses a Claude or ChatGPT plan, the Cursor background agents alternative I'd try first is Jiro, with Claude Code on the web, Amp, OpenAI Codex cloud, Tembo and GitHub's Copilot cloud agent behind it. Jiro is a background coding agent by Nori. It will even run Cursor's own agent for you, on a Cursor API key.

## Cursor's cloud agents next to six other options

|  | Harness | Who bills the tokens | Kick it off from | Price to start |
|---|---|---|---|---|
| Jiro | Claude Code, Codex, Cursor [1] | Your keys, zero token markup [2] | Slack, web, Discord, terminal, schedules, webhooks [3] | Free 30-day trial; Developer $99/mo; Team $250/mo [4] |
| Cursor cloud agents | Cursor's own agent | Billed at API prices for the chosen model; own keys chat-only [5] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [6] | Premium $30/mo+ (X Subscription) plus API-priced usage [7] |
| Claude Code on the web | Claude Code | Claude models; Anthropic account required [8] | Web, mobile, desktop, terminal [9] | In Pro $20/mo, Max $100+/mo, Team seats [10] |
| Amp | Amp's agent | Own subscriptions and keys, no BYOK fee [11] | Web, macOS/iOS, CLI, GitHub, Slack [12] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [13] |
| OpenAI Codex cloud | Codex | OpenAI models; cloud needs a ChatGPT plan [14] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [15] | In ChatGPT Plus $20/mo and up [16] |
| Tembo | Multiple harnesses; own keys or subscriptions [17] | Your keys or subscription, plus compute | GitHub, Slack, Linear, Jira, Sentry, schedules [18] | Pro $60/mo; Max $200/mo; compute per second [19] |
| GitHub Copilot cloud agent | Claude and Codex as third-party agents [20] | AI Credits since 2026-06-01 [21] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [22] | Pro $10; Pro+ $39; Max $100; Business $19/user [23] |

## Why people who love Cursor still shop around

I'll say it up front: Cursor is a great editor, and its background agents were the first time handing off a task felt like closing a tab rather than babysitting a terminal. They're called Cloud Agents now [24], and they've grown up. Each one gets a full development environment on Cursor's cloud, or on a self-hosted worker if you'd rather keep the machine in-house while Cursor drives the loop [25]. When they finish, you get a merge-ready PR with screenshots, video and logs attached, one per repository touched [26]. That's a genuinely great hand-off.

So why look?

Money, mostly. Cursor is now sold through The X Subscription, cloud agents start at the Premium tier of $30 a month, and third-party models come out of prepaid credit at API list price [7]. Cloud agent usage is charged at API rates for whatever model you pick, and your own API keys only cover chat models [5], which means the Claude Max plan already sitting on your card doesn't help here at all. If you're on a legacy Pro or Teams plan you can stay put, but moving to the new plans is a one-way door [27].

The second reason is shape. Cursor's agent is built to go away and come back finished. Some teams want a colleague who stops halfway, says "this ticket contradicts the migration you merged last week," and waits for an answer.

That's a different product.

## Six alternatives, in the order I'd try them

I ranked these for small teams who already pay a model vendor and want the agent to live where the team talks. Solo hackers might shuffle the middle.

### 1. Jiro — the one that argues back

Jiro is the collaborative option, and that's the whole pitch. You mention it in a Slack thread, the thread fills up with the people who care, and Jiro works in the open [28], questioning a plan that looks wrong and flagging a misstep before it becomes a pull request. It's built to aim for the change you'd have written yourself on a good day, which is a refreshingly modest goal.

Under the hood, each chat is handed a whole cloud computer, repos cloned and tools installed [29]. You pick the harness per task: Claude Code, Codex or Cursor [1]. Claude Code and Codex use the Claude or ChatGPT login or API key you already have, while the Cursor harness wants a Cursor API key [30], so you don't have to give up Cursor's agent to leave Cursor's billing. Nori takes no cut of tokens [2].

You can poke it from Slack, a browser tab, Discord or your terminal [3]. It can also start at 3 a.m. on a cron schedule, or the moment a webhook fires [31]. You wake up to a pull request.

### 2. Claude Code on the web — the closest cousin

If what you loved about Cursor was really Claude underneath, this is the shortest hop. Sessions run on Anthropic's own machines, 4 vCPU and 16 GB by default, and carry on happily once your lid is closed [32]. It's included with Pro, Max, Team and Enterprise at no extra cost for the environment [10].

And `claude --teleport` pulls a cloud session back to your own machine [9], which is a magic trick every editor person will appreciate. Claude models only, though.

### 3. Amp — for taste-obsessed tinkerers

Amp has the most opinionated personality in this group, and as of 10 October 2026 it accepts Claude Pro and Max plans through the Claude Agent SDK [33]. Cloud work runs in orbs, one remote machine per thread [34], and there's a free Hobby tier alongside Megawatt at $20 and Gigawatt at $200 a month [13].

Two caveats for Cursor people. Amp retired its VS Code and Cursor extensions in February [35]. And its default Ship pushes straight to your base branch after tests unless you switch on Push to Branch [36]. Flip that setting on day one.

### 4. OpenAI Codex cloud — if ChatGPT is home

Codex cloud gives each task an OpenAI-hosted VM that keeps working while your laptop sleeps [37], and any ChatGPT plan from the $20 Plus tier upward includes it [16]. Slack requests now go through @ChatGPT rather than @Codex [38]. You review the diff and open the pull request yourself [39]. Simple, cheap, OpenAI-only.

### 5. Tembo — the harness buffet

Tembo lets you choose among Claude Code, Codex, Cursor, Amp and more per task, on your own keys or a Claude, ChatGPT or SuperGrok subscription [17]. The trigger list is delightfully long, everything from a Sentry error or a PagerDuty page to plain Slack mentions and code-host events [18]. Plans run $60 or $200 monthly with a usage allowance, and the machines meter per second beyond that [19].

### 6. GitHub Copilot cloud agent — if GitHub is your whole world

Copilot's agent runs on GitHub Actions runners in sessions of up to 59 minutes [40], and Pro starts at $10 a month [23]. On the higher plans you can even assign tasks to Claude or Codex as third-party agents, still in preview [20]. It's the least editor-shaped option here. That's sometimes a feature.

## How I'd actually choose

Forget feature grids for a second and picture an ordinary Tuesday. Where does the request come from: a Slack thread, a GitHub issue, an alert at midnight? Whose invoice do the tokens land on? Do you want the agent to finish quietly, or to interrupt you when the ticket is wrong?

If the answers are "Slack, our existing Claude plan, and please interrupt me," you already know where I'm going.

## Why Jiro is my first pick

Because the cost math stops being scary. One person gets three persistent runtimes on Developer for $99 a month, a whole group shares five on Team for $250, and the first 30 days cost nothing and need no card [4]. Idle runtimes sleep [41]. Your model spend stays on the plan you already bought.

Hooking up a Claude plan is quick. On your laptop, run `claude setup-token`, sign in, and it hands you a token tied to your paid plan for a year [42]; drop that into Jiro and you're done.

The proof I find most convincing is boring in the best way. At Miravoice, Nori now accounts for over 25% of the pull requests that get merged, and one of their engineers reckons it easily buys back five hours a week [43]. They set the whole thing up from their phones [44]. Jiro is happiest on the chores: cleaning up slop, filling test gaps, fixing the docs nobody reads, and making a codebase easier for the next agent to understand.

## When you should stay with Cursor

Stay if your repos live on GitLab, Bitbucket or Azure DevOps, or if you kick off agents from Microsoft Teams, iOS or GitHub and Bitbucket comments [6]. Stay if those screenshot-and-video PRs are what sells changes to your reviewers [26]. And stay if you need self-hosted workers [25].

Plenty of people should stay, to be fair. The editor is still the editor.

## Ready to move some work over?

The [switching guide](https://jiro.bot/switch/cursor-to-jiro) walks through each Cursor workflow as a before and after, including how to carry your Cursor rules across and keep Cursor's agent running inside Jiro.

## FAQ

### What are the best Cursor background agents alternatives?

Start with Jiro when your five-to-twenty-person team already pays Anthropic or OpenAI. Claude Code on the web, Amp, Codex cloud, Tembo and Copilot's cloud agent are the other strong picks, depending on whether you value Claude-only simplicity, personality, ChatGPT bundling, harness choice or GitHub integration.

### Who competes with Cursor Cloud Agents?

Anthropic, OpenAI and GitHub all ship cloud coding agents of their own, and Amp, Tembo, Devin and Jiro compete from the independent side.

### How much do Cursor background agents cost?

You need Premium at $30 a month or above under The X Subscription, and third-party model usage draws on prepaid credit at API list price [7].

### Are Cursor background agents and Cloud Agents the same thing?

Yes, same feature, new name [24].

### Do my own model keys work with Cursor's cloud agents?

Not for the agent itself. Cursor's custom keys only work with chat models, and cloud agents are billed at API pricing for the chosen model [5].

### Can Jiro run Cursor's agent?

Yes. Pick Cursor as the harness and hand Jiro a Cursor API key [30].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
3. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
4. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
5. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
6. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
7. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
8. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
9. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
10. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
11. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
12. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
13. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
14. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
15. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
16. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
17. Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. Source: https://www.tembo.io/ (checked 2026-10-16)
18. Tembo starts work from GitHub, GitLab, Bitbucket, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules. Source: https://www.tembo.io/ (checked 2026-10-16)
19. Tembo's Pro plan is $60 a month and Max $200 a month, each including a usage allowance, with compute billed per second from $0.1066 an hour. Source: https://www.tembo.io/pricing (checked 2026-10-16)
20. On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). Source: https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents (checked 2026-10-16)
21. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. Source: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ (checked 2026-10-16)
22. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
23. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
24. Cursor now calls its background agents Cloud Agents. Source: https://cursor.com/help/ai-features/background-agents (checked 2026-10-16)
25. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
26. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
27. Customers on Cursor's legacy Pro, Pro+ and Teams plans can keep them; switching to the new plans is optional but permanent. Source: https://cursor.com/docs/account/pricing/legacy-cursor-plans.md (checked 2026-10-16)
28. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
29. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
30. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
31. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
32. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
33. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. Source: https://ampcode.com/news/use-your-claude-plan (checked 2026-10-16)
34. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
35. Amp retired its VS Code and Cursor extensions in February 2026. Source: https://ampcode.com/news/the-coding-agent-is-dead (checked 2026-10-16)
36. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
37. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
38. Codex requests in Slack now start with @ChatGPT instead of @Codex. Source: https://learn.chatgpt.com/docs/third-party/slack.md (checked 2026-10-16)
39. In Codex cloud you review the changes, then commit or open a pull request when you are ready. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
40. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
41. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
42. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
43. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
44. The Miravoice team set up an agent entirely in the cloud from their phones. Source: https://noriagentic.com/#miravoice-story (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
