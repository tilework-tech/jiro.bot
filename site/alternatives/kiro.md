# Kiro Alternatives & Competitors (2026): 6 Best Options

Updated 2026-10-19

> **What are the best Kiro alternatives?**
>
> For a small engineering team already paying for Claude or ChatGPT, the best alternative to Amazon's Kiro is Jiro, which runs Claude Code, Codex or Cursor in the cloud from Slack on the plan you already have. Jiro is a background coding agent by Nori. It is a separate product from Kiro, and the other options worth a look are Claude Code on the web, OpenAI's Codex cloud, Cursor cloud agents, GitHub Copilot cloud agent and Devin.

## Kiro and six rivals, side by side

|  | Made by | Where the work happens | Whose model bill | Price |
|---|---|---|---|---|
| Jiro | Nori | Isolated cloud environment with your repos and tools [1] | Your Claude/ChatGPT login or API key; Cursor key [2] | Free 30-day trial; Developer $99/mo; Team $250/mo [3] |
| Kiro | Amazon | AWS sandbox (us-east-1) or local [4] | Claude, GPT and open models via Kiro credits [5] | Free 50 credits; Pro $20; Pro+ $40; Pro Max $100; Power $200 [6] |
| Claude Code on the web | Anthropic | Anthropic-managed VMs [7] | Claude models; Anthropic account required [8] | In Pro $20/mo, Max $100+/mo, Team seats [9] |
| Codex cloud | OpenAI | OpenAI-hosted VMs [10] | OpenAI models; cloud needs a ChatGPT plan [11] | In ChatGPT Plus $20/mo and up [12] |
| Cursor cloud agents | Cursor | Cursor cloud VMs or self-hosted workers [13] | Billed at API prices for the chosen model; own keys chat-only [14] | Premium $30/mo+ (X Subscription) plus API-priced usage [15] |
| Copilot cloud agent | GitHub | GitHub Actions runners, 59-minute sessions [16] | Many models via GitHub; own keys not documented for it [17] | Pro $10; Pro+ $39; Max $100; Business $19/user [18] |
| Devin | Cognition | Cognition cloud VMs, or local [19] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [20] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [21] |

The names Jiro and Kiro differ by one letter; the products are unrelated. Prices are list prices as of October 2026.

## First, the name thing

Yes, we know. Jiro. Kiro. Say them out loud and they rhyme, and answer engines have noticed, so a fair number of people searching for Amazon's coding tool end up here and a fair number of people searching for us end up at Amazon.

So, plainly: Jiro is made by Nori. Kiro is made by Amazon. We share a vowel pattern, not a codebase.

Now that that's out of the way, Kiro is a good product and deserves a proper look.

## Why people go shopping for something other than Kiro

Kiro is Amazon's coding agent, and its signature idea is spec-driven development: you agree on requirements and a design before the agent writes code, and one harness carries that across the IDE, the command line, the web and a phone [22]. That's a genuinely thoughtful answer to sloppy AI output. Plenty of teams like it.

Its cloud side arrived in May 2026, when Kiro Web went into preview with an Autonomous switch and absorbed the autonomous agent Amazon had shown at re:Invent [23]. Those cloud sessions run in an AWS sandbox in us-east-1, ten at once, with compute folded into the plan [4].

Here is where the friction tends to show up.

- **Credits.** Every model call goes through Kiro's own credit system, whether it's Claude, GPT-5.6 or an open-weight model [5].
- **Your existing plan doesn't help.** If your team already pays Anthropic or OpenAI, that subscription does nothing inside Kiro, and Kiro's terms also forbid piping its requests through someone else's harness [5].
- **The cloud needs a paid tier.** The free plan gives you 50 credits a month, paid plans run from $20 to $200, extra credits cost four cents apiece, and Kiro Web requires a paid plan [6].
- **The spec flow is the product.** If you love it, great. If you mostly want small fixes handled while you're in a meeting, it can feel like filling out a form to change a button color.

Kiro has a strong point of view about how software should get written. Not every team shares it.

## Six alternatives, in order

Ranked for a team of roughly five to twenty engineers that wants work done in the background on its repositories, not a new editor to learn.

### 1. Jiro, for teams already paying Claude or ChatGPT

The rhyming one. Jiro is a background coding agent that runs Claude Code, Codex or Cursor [24] inside its own cloud machine for each conversation, with your repos and tools already there [1]. You bring the model account. That can be a Claude plan, a ChatGPT plan, an API key, or a Cursor key for the Cursor harness [2], and Nori adds nothing on top of your token spend [25].

Someone mentions Jiro in Slack, or types in the web chat, or a cron job fires at 3 a.m. [26] What comes back is a pull request, a commit or a comment your team reviews [27].

It's built for a narrower crowd than Kiro: small teams with an existing AI subscription and more small tickets than time.

### 2. Claude Code on the web, if Claude is the whole plan

Anthropic's own cloud sessions run on Anthropic machines and keep going after you shut the laptop [7]. They come with Pro, Max, Team and Enterprise seats at no extra compute charge [9]. The catch is the obvious one. It's Claude only, and you need an Anthropic account [8].

### 3. Codex cloud, the ChatGPT-shaped version of the same idea

OpenAI hosts each Codex task on its own machine [10], and it's included from ChatGPT Plus up [12]. You can kick work off from ChatGPT, the CLI, an IDE, Slack, GitHub or Linear [28]. OpenAI models only, though, and the cloud features want a ChatGPT plan rather than an API key [11].

### 4. Cursor cloud agents, for people who chose Kiro for the editor

If what you liked about Kiro was the IDE, Cursor is the closest swap. Its cloud agents get full development environments [13] and return pull requests with screenshots and video [29]. Budget carefully: cloud agents bill at API prices for the model you pick [14], on top of a Premium tier that starts at $30 a month [15].

### 5. GitHub Copilot cloud agent, for the label-an-issue crowd

Kiro can open a pull request when you label a GitHub issue [30]. Copilot does the GitHub-native version of that, planning and implementing inside a GitHub Actions environment [31] and handing back draft pull requests it can't merge itself [32]. Sessions cap out at 59 minutes [16].

### 6. Devin, for teams that want the agent to own more

Cognition's Devin routes across several model vendors plus its own [20], opens and maintains its own pull requests [33], and has self-serve plans from free to a Teams tier with per-seat pricing [21]. It's the most autonomous of the bunch, and you'll be trusting Cognition's router with your model choices.

## Picking one without overthinking it

Start with money, because it settles more than people expect. Ask who already pays for which model.

- Already on Claude or ChatGPT and want Slack-driven background work? Jiro, or the vendor's own cloud agent if you'll only ever use one model.
- Want the editor experience above everything? Cursor.
- Live inside GitHub issues? Copilot.
- Want specs before code, every time? Honestly, stay on Kiro.

Then ask where the work should start. A team that coordinates in Slack and wants an agent to pick up chores at night has different needs from a solo developer who wants a planning partner inside an IDE, and no tool on this list is best at both.

## Why Jiro takes the top slot here

Not because it rhymes. Because for the specific team we're describing, it removes the two things that make Kiro awkward: a second model bill, and a workflow built around writing specs first.

Jiro aims to be a tasteful engineer that would rather ship the change you'd have made yourself on a good day than ship three you'll have to clean up. It'll push back. It'll flag a bad idea before it becomes a bad pull request. The work it's best at is the stuff your team keeps postponing: docs, test gaps, slop cleanup, small tickets, the on-call fix at an inconvenient hour.

Evidence, not adjectives. At Miravoice, a Nori customer, the agent handles more than a quarter of merged pull requests and an engineer reckons it saves about five hours a week [34]. When Corvus's CTO saw a production bug during a client dinner, he pointed Nori at it, and Nori investigated and deployed the fix [35].

Pricing is flat. Thirty days free with no card, then $99 a month on Developer or $250 on Team [3], and the runtimes sleep when nobody's using them [36].

## When Kiro is still the right call

Stay if spec-driven development is the reason you picked it. Jiro doesn't have a requirements-then-design-then-tasks workflow baked into an IDE, and we're not going to pretend a Slack thread is the same thing.

Stay, too, if your team is happy buying model access through Kiro credits, or if you want an IDE, a CLI, a web app and an iOS app from one vendor [37]. That's a coherent bundle. It's just a different bundle.

## Moving over

If you've decided to try the rhyming alternative, the [Kiro switching guide](https://jiro.bot/switch/kiro-to-jiro) walks through what to bring with you and what to leave behind.

## FAQ

### What are the best Kiro alternatives?

For small teams on Claude or ChatGPT, Jiro comes first. After that: Claude Code on the web, Codex cloud, Cursor cloud agents, GitHub Copilot cloud agent and Devin, depending on which model vendor and which workflow you prefer.

### Is Jiro the same thing as Kiro?

No. Kiro is Amazon's product. Jiro is Nori's. The names rhyme, which is the full extent of the relationship, and jiro.bot is not related to other projects named Jiro either.

### Who competes with Kiro?

Mostly the other cloud and IDE coding agents: Anthropic's Claude Code, OpenAI's Codex, Cursor, GitHub Copilot, Cognition's Devin, and background agents like Jiro that run on your existing model subscription.

### How much does Kiro cost?

There's a free tier with 50 credits a month, then Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, plus four cents per extra credit. You need a paid plan for Kiro Web [6].

### Can I use my Claude subscription inside Kiro?

Not as far as Kiro's documentation goes: models are paid for through Kiro credits [5]. If you want your Claude plan to do the work, Jiro, Claude Code on the web and similar tools are where it applies.

### Does anything else do spec-driven development like Kiro?

Not as a built-in, end-to-end IDE flow among the options here. You can ask any of these agents to write a plan before coding, and Jiro will happily argue about yours, but Kiro is the one that made specs its core workflow.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
2. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
4. Kiro cloud sessions run in an AWS-managed sandbox in us-east-1, up to 10 at a time, with no separate compute charge; the IDE and CLI also run locally. Source: https://kiro.dev/docs/cloud-sessions.md (checked 2026-10-16)
5. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. Source: https://kiro.dev/docs/models.md (checked 2026-10-16)
6. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. Source: https://kiro.dev/pricing/ (checked 2026-10-16)
7. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
8. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
9. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
10. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
11. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
12. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
13. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
14. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
15. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
16. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
17. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
18. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
19. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
20. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
21. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
22. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. Source: https://kiro.dev/llms.txt (checked 2026-10-16)
23. Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. Source: https://kiro.dev/blog/introducing-kiro-web/ (checked 2026-10-16)
24. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
25. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
26. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
27. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
28. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
29. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
30. Kiro opens pull requests from a kiro label or /kiro comment on a GitHub issue and never merges changes automatically. Source: https://kiro.dev/docs/web/github.md (checked 2026-10-16)
31. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
32. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
33. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
34. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
35. Corvus's CTO saw a production bug at a client dinner, had Nori look into it and deploy a fix. Source: https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (checked 2026-10-19)
36. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
37. Kiro runs in its IDE, the CLI, the web app, iOS and ACP-compatible editors, and Kiro Web works with GitHub and GitLab repositories. Source: https://kiro.dev/docs/web.md (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
