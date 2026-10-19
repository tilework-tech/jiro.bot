# Amp Alternatives & Competitors (2026): 6 Best Options

Updated 2026-10-19

> **What are the best Amp alternatives?**
>
> If your team is small, somewhere between five and twenty engineers, already holds Claude or ChatGPT seats, and insists that every change arrive as a reviewable pull request, Jiro is the strongest Amp alternative. Jiro is a background coding agent by Nori. The other five worth your time are Tembo, Claude Code on the web, OpenAI Codex cloud, Cursor's cloud agents and OpenHands; each answers differently on who pays for tokens and how code reaches main.

## How each option pays for tokens and lands code

|  | Your own plan or key | Where the agent runs | How changes land | Price |
|---|---|---|---|---|
| Jiro | Your Claude/ChatGPT login or API key; Cursor key [1] | Isolated cloud environment with your repos and tools [2] | PRs, commits, comments for review [3] | Free 30-day trial; Developer $99/mo; Team $250/mo [4] |
| Amp | Own subscriptions and keys, no BYOK fee [5] | Amp cloud orbs or your own runners [6] | Pushes to trunk by default [7] | Hobby free; Megawatt $20/mo; Gigawatt $200/mo [8] |
| Tembo | Multiple harnesses; own keys or subscriptions [9] | Tembo cloud sessions [10] | Not stated in the sources we checked | Pro $60/mo; Max $200/mo; compute per second [11] |
| Claude Code on the web | Claude models; Anthropic account required [12] | Anthropic-managed VMs [13] | You create the PR; auto-fix follows up [14] | In Pro $20/mo, Max $100+/mo, Team seats [15] |
| OpenAI Codex cloud | OpenAI models; cloud needs a ChatGPT plan [16] | OpenAI-hosted VMs [17] | You open the PR [18] | In ChatGPT Plus $20/mo and up [19] |
| Cursor cloud agents | Billed at API prices for the chosen model; own keys chat-only [20] | Cursor cloud VMs or self-hosted workers [21] | PRs with screenshots and video [22] | Premium $30/mo+ (X Subscription) plus API-priced usage [23] |
| OpenHands | Own agent or popular CLIs; your keys [24] | Local, OpenHands cloud, or self-hosted [25] | Label or @-mention on GitHub [26] | Free (10 conversations/day hosted); Enterprise custom [27] |

Rival prices and behavior as published by each vendor on the checked dates in the sources below.

## Why careful teams start looking past Amp

Amp deserves its reputation. It talks openly about taste, it rebuilt itself around cloud work this year, and it treats your own subscription as a first-class way to pay. You can bring a ChatGPT or Claude Pro or Max plan, or plain API keys, and Amp adds no token fee on your own keys below its Enterprise tier [5]. Claude plan support arrived on October 10, through the Claude Agent SDK [28]. That is a stance we respect, because it is ours too.

So the question is rarely about models. It is about the moment a change leaves the agent.

Out of the box, Amp's Ship step runs the tests and then pushes to the base branch; you have to switch on Push to Branch if you want a pull request instead [7]. For a two-person trunk-based shop with excellent tests, that default is efficient and probably fine. For a team that protects main, requires a second pair of eyes and treats review as the place where taste is actually enforced, a default that skips review is a setting someone will eventually forget to change.

Other shifts matter too. The VS Code and Cursor extensions were retired in February [29]. Cloud threads now run in orbs, one remote machine per thread, billed by the minute from eight cents an hour at the smallest size [6] [30]. And the @Amp Slack integration, which launched in July, requires a paid Slack workspace [31].

None of that is a flaw. Each is a choice. Choices have consequences for review.

## Six alternatives, ordered for teams that review every change

The order below assumes a small team that already holds Claude or ChatGPT seats and wants an agent whose work passes through the same branch protection as a human's. Change that assumption and the order changes with it.

### 1. Jiro, for small teams that want every change reviewed

Jiro is built for teams of roughly five to twenty engineers who already pay Anthropic or OpenAI and would rather not pay twice. Its harness can be Claude Code, Codex or Cursor [32], paid for by your own Claude or ChatGPT subscription or API key, with Cursor on a Cursor API key [1], and adds zero token markup [33].

Output returns for review: usually a pull request, occasionally a commit or a comment [3]. That is the default path, with no setting to flip first; add branch protection on GitHub and it becomes the only path.

Each conversation is given a cloud machine of its own, already holding your repositories and tools, with the org setup script applied [2] [34]. Requests arrive through Slack threads, the web chat, Discord or a terminal, and schedules or webhooks can start it with nobody online [35] [36] [37].

The design goal is narrow and deliberate. Write the diff a thoughtful colleague would have written on their best afternoon.

### 2. Tembo, the closest match on harness choice

Tembo shares Amp's appetite for flexibility, and then some. It will run several harnesses per task, including Amp itself, on your keys or on a Claude, ChatGPT or SuperGrok subscription [9]. Work can begin from GitHub, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules [38]. Pro is $60 a month and Max $200, with compute metered per second on top [11].

Look closely at the event triggers. They are its strongest argument.

### 3. Claude Code on the web, for a single Claude subscriber

If you are one engineer on a Claude plan, this is the obvious first stop. Cloud sessions are bundled into Pro, Max and Team seats without a separate compute charge [15]. Each session ends at a pushed branch, opening the pull request is your job, and auto-fix can then chase CI failures and review comments [14].

It runs Claude models only, and needs an Anthropic account [12].

### 4. OpenAI Codex cloud, for teams already living in ChatGPT

Codex cloud comes with ChatGPT from the $20 Plus plan upward, sharing usage limits with ChatGPT itself [19]. You review the diff and decide when to commit or open a pull request [18]. That keeps a human at the gate, which we like. The catch is a single model vendor. An API key alone will not unlock the cloud features; those want a ChatGPT subscription [16].

### 5. Cursor cloud agents, for editor-first teams

Former Amp users who miss the editor will find it here. Cursor's agents open a pull request in each repository they touch, complete with screenshots, video and logs [22]. Budget carefully, though. The floor is Premium at $30 monthly, and usage is charged at API prices for whichever model you select [23] [20].

### 6. OpenHands, for teams that want to own the stack

OpenHands is MIT-licensed [39], free to run locally, and hosted for one user at ten conversations a day [27]. Label an issue or mention @openhands on GitHub and it opens a pull request when it resolves the problem [26]. You trade polish for control. Some teams want exactly that trade.

## Questions to settle before you choose

Start with the merge path, since it is the hardest thing to retrofit later.

- Does the agent's work reach main only through a reviewed pull request, by default, without anyone remembering a toggle?
- Whose subscription pays for tokens, and is there a markup on top?
- Can one teammate pick up a thread another started, or is the agent tied to a single laptop and login?
- Is compute billed per minute, per second or as a flat plan, and which of those can you forecast?
- Will it run the harness your team already trusts, or ask you to adopt a new one?

Get the first answer right. The rest tends to follow.

## Why Jiro sits at the top of this list

Because what it produces lands as a pull request for your reviewers [3], and taste needs a checkpoint to mean anything. Pair it with GitHub branch protection so that checkpoint is enforced, not assumed. An agent that cares more about quality than volume should also be comfortable having its work read line by line before it ships.

Jiro also pushes back. It flags missteps early, may question the ticket before it starts, and is happiest on the work small teams never reach: slop cleanup, thin tests, stale docs, the on-call fix at 2 a.m.

Teams on Nori have the receipts. Miravoice now lets Nori author better than one in four of the pull requests it merges, and one of its engineers estimates the time saved at five hours weekly [40]. At Corvus, the CTO noticed a fault in production while dining with a client; Nori traced it and deployed the repair [41].

Pricing is flat. Thirty days of trial cost nothing and ask for no card. After that, one engineer with up to three persistent runtimes pays $99 monthly on Developer, while a group sharing five runtimes pays $250 monthly on Team [4]. Runtimes sleep when idle [42]. Each organization gets its own single-tenant broker, and every action is logged [43] [44].

## When Amp remains the right call

Stay with Amp if your team ships trunk-based with tests you genuinely trust, and a push to main after a green run is how you already work. Stay if you want to choose machine sizes per thread and pay by the minute, or run Amp's free Hobby tier on your own runners [8]. Its native macOS and iOS apps are another honest reason [45].

Those are good reasons. We would not argue you out of them.

## Moving over

If review-first is where you are headed, the [switching guide](https://jiro.bot/switch/amp-to-jiro) covers credentials, the Claude sign-in step, branch protection and a sensible first week, in that order.

## FAQ

### What are the best Amp alternatives?

Jiro comes first when a small team with existing Claude or ChatGPT seats wants every change reviewed. Tembo is closest on harness choice, Claude Code on the web suits a solo Claude subscriber, Codex cloud suits ChatGPT-heavy teams, Cursor suits editor-first teams and OpenHands suits teams that want open source.

### Who competes with Amp?

Among cloud coding agents: Jiro, Tembo, Claude Code on the web, OpenAI Codex cloud, Cursor cloud agents, OpenHands, Devin, Factory and Warp. They differ mostly on model choice, billing and how code reaches the main branch.

### How much does Amp cost?

Hobby costs nothing beyond pay-as-you-go orbs, or your own runners. The paid tiers, Megawatt at $20 and Gigawatt at $200 monthly, bundle orb time and agent usage [8]. Orbs bill per minute from $0.08 an hour [30].

### Does Amp push straight to main?

By default, yes: Ship pushes to the base branch once tests pass. Turning on Push to Branch makes it open a pull request instead [7].

### Can I keep using my Claude subscription if I leave Amp?

In Jiro, yes. On your laptop, run `claude setup-token`; it mints a token, valid for a year, bound to whichever Claude plan you hold, Pro, Max, Team or Enterprise [46]. Paste it into Jiro's credential settings.

### Is Amp still ad-supported?

No. Ads came off the free tier on March 30, 2026 [47].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
3. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
4. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
5. Amp accepts ChatGPT, Claude Pro or Max and other subscriptions as well as API keys, and charges no token fees on your own keys outside its Enterprise tier. Source: https://ampcode.com/news/free-agent (checked 2026-10-16)
6. Amp runs cloud work in orbs, one remote machine per thread that keeps working while your laptop is closed, or on your own machines as runners. Source: https://ampcode.com/manual/orbs (checked 2026-10-16)
7. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
8. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
9. Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. Source: https://www.tembo.io/ (checked 2026-10-16)
10. Tembo runs coding agents in isolated cloud sessions with code, terminal, files and a live desktop. Source: https://www.tembo.io/ (checked 2026-10-16)
11. Tembo's Pro plan is $60 a month and Max $200 a month, each including a usage allowance, with compute billed per second from $0.1066 an hour. Source: https://www.tembo.io/pricing (checked 2026-10-16)
12. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
13. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
14. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
15. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
16. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
17. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
18. In Codex cloud you review the changes, then commit or open a pull request when you are ready. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
19. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
20. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
21. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
22. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
23. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
24. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
25. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
26. Labelling a GitHub issue openhands or commenting @openhands starts a run that opens a PR if it resolves the issue. Source: https://docs.openhands.dev/openhands/usage/cloud/github-installation (checked 2026-10-16)
27. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
28. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. Source: https://ampcode.com/news/use-your-claude-plan (checked 2026-10-16)
29. Amp retired its VS Code and Cursor extensions in February 2026. Source: https://ampcode.com/news/the-coding-agent-is-dead (checked 2026-10-16)
30. Orbs are billed per minute, from $0.08 an hour for the smallest size. Source: https://ampcode.com/docs/markdown/orbs/sizes-and-costs (checked 2026-10-16)
31. Amp's Slack integration launched on 2026-07-20 and needs a paid Slack plan. Source: https://ampcode.com/docs/markdown/puck/slack-integration (checked 2026-10-16)
32. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
33. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
34. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
35. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
36. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
37. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
38. Tembo starts work from GitHub, GitLab, Bitbucket, Slack, Linear, Jira, Sentry, PagerDuty, webhooks and schedules. Source: https://www.tembo.io/ (checked 2026-10-16)
39. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
40. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
41. Corvus's CTO saw a production bug at a client dinner, had Nori look into it and deploy a fix. Source: https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (checked 2026-10-19)
42. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
43. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
44. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
45. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
46. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
47. Amp removed ads from its free tier on 2026-03-30. Source: https://ampcode.com/news/amp-free-is-ad-free (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
