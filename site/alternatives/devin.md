# Devin Alternatives & Competitors (2026): 8 Best Options

Updated 2026-10-19

> **What are the best Devin alternatives?**
>
> If your team has five to twenty engineers and a Claude or ChatGPT bill already on the company card, the Devin alternative we would pick is Jiro, because it drives Claude Code, Codex or Cursor using credentials you already own and adds no token markup. Jiro is a background coding agent by Nori. The other serious contenders are Cursor's cloud agents, Codex cloud from OpenAI, Anthropic's Claude Code web sessions, Factory, GitHub Copilot cloud agent, Tembo and OpenHands.

## Devin and eight alternatives, sorted by who sells you the tokens

|  | Who supplies the model | How the bill works | Where the work runs |
|---|---|---|---|
| Jiro | Your Claude/ChatGPT login or API key; Cursor key [1] | Free 30-day trial; Developer $99/mo; Team $250/mo [2] | Isolated cloud environment with your repos and tools [3] |
| Devin | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [4] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [5] | Cognition cloud VMs, or local [6] |
| Cursor cloud agents | Billed at API prices for the chosen model; own keys chat-only [7] | Premium $30/mo+ (X Subscription) plus API-priced usage [8] | Cursor cloud VMs or self-hosted workers [9] |
| OpenAI Codex cloud | OpenAI models; cloud needs a ChatGPT plan [10] | In ChatGPT Plus $20/mo and up [11] | OpenAI-hosted VMs [12] |
| Claude Code on the web | Claude models; Anthropic account required [13] | In Pro $20/mo, Max $100+/mo, Team seats [14] | Anthropic-managed VMs [15] |
| Factory | Multi-model; own keys in CLI/desktop only [16] | Pro $20/mo; Plus $100; Max $200; Teams $60 + $40/seat [17] | Local, Factory cloud, or your machines [18] |
| GitHub Copilot cloud agent | Many models via GitHub; own keys not documented for it [19] | Pro $10; Pro+ $39; Max $100; Business $19/user [20] | GitHub Actions runners, 59-minute sessions [21] |
| Tembo | Multiple harnesses; own keys or subscriptions [22] | Pro $60/mo; Max $200/mo; compute per second [23] | Tembo cloud sessions [24] |
| OpenHands | Own agent or popular CLIs; your keys [25] | Free (10 conversations/day hosted); Enterprise custom [26] | Local, OpenHands cloud, or self-hosted [27] |

Rival prices and limits are from each vendor's own pages; see the dated sources below.

## Why people go shopping after a Devin invoice

Devin is not expensive per seat. A Teams plan starts at an $80 monthly floor plus $40 a seat, and Pro is $20. [5] The number that surprises people is the other one: anything past the quota is billed at API pricing. [5] Your Anthropic and OpenAI usage gets resold to you through Cognition's router, at list.

That is a reasonable business. It is also a second model bill for any team that already pays Anthropic or OpenAI directly.

Some history, because the plans keep moving. Cognition dropped the ACU-based Core and Team plans for quota plans on 2026-04-14. [28] Windsurf turned into Devin Desktop that June. [29] Devin can now link a ChatGPT plan, but only for the GPT share of usage; the Claude and Gemini traffic still goes through Cognition. [4] The planning side of the agent stays in Cognition's cloud even on the single-tenant Enterprise deployment. [30]

Devin is still good at a lot. It is a capable agent that maintains its own pull requests, stacks large changes and resolves its own merge conflicts. [31] The question is narrower. Do you want to pay twice for the same model?

## The eight options, ranked for small teams

Ranked for a team of 5 to 20 engineers on GitHub that already has at least one frontier model subscription. Bigger organisations will order this differently, and should.

### 1. Jiro, when the model bill already exists

Jiro runs Claude Code, Codex or Cursor as the agent, on your Claude or ChatGPT login, an API key, or a Cursor key. [32] [1] There is no markup on tokens. [33] You pay Nori for runtimes, which sleep when nobody is using them. [34]

Each conversation gets its own cloud machine with your repos and whatever your org setup script installs. [3] [35] Work comes back as a pull request your team reviews. [36]

### 2. Cursor cloud agents, for teams who live in Cursor

Polished, and the PRs arrive with screenshots and video. [37] The catch is billing. Every cloud-agent run meters at list API rates, and custom keys never get past the chat models. [7] Cloud agents need the $30 Premium tier or higher. [8]

### 3. OpenAI Codex cloud, the cheapest door for ChatGPT shops

Codex cloud is bundled from ChatGPT Plus at $20 a month. [11] It runs OpenAI models only, and an API key does not unlock the cloud features. [10] You open the PR yourself. [38]

### 4. Claude Code on the web, for individuals on a Claude plan

No separate charge for the cloud machine; it comes with Pro, Max and Team seats. [14] Sessions push a branch and leave the pull request to you. [39] Team Slack work has moved to Claude Tag. [40]

### 5. Factory, if you want the whole platform

Factory's Droids run locally, on Factory cloud machines, or on hardware you register. [18] Its Teams plan is $60 plus $40 per seat, capped at ten seats. [17] Bring-your-own-key is limited to its CLI and desktop app; the hosted web app won't take one. [16] More moving parts than most five-person teams need.

### 6. GitHub Copilot cloud agent, the default nobody had to approve

If procurement already bought Copilot, this is the path of least paperwork. Each session lives on a GitHub Actions runner and gets cut off at the 59-minute mark. [21] Usage has been metered in AI Credits since June. [41]

### 7. Tembo, a multi-harness cousin

Tembo also runs several harnesses and takes your own subscriptions. [22] Pro is $60 a month, and compute is billed by the second on top. [23]

### 8. OpenHands, for people who want the source

MIT-licensed. [42] Free to run locally, and you can self-host it in your VPC on Enterprise. [27] You will be the one keeping it running, which is the point and also the cost.

## Choosing without a spreadsheet war

Four questions settle most of this. Ask them in order and stop when one answer rules a product out.

- Do you already pay for Claude or ChatGPT seats, and would you rather use those than buy model access again?
- Where does the team actually ask for work: Slack, the IDE, GitHub issues, or a cron job at 3 a.m.?
- Does the agent need a real machine with your toolchain, or will a short-lived sandbox do?
- Who reviews the output, and does the agent return a ready PR or merely a branch somebody must still wrap up?

If the answers are "yes, Slack, real machine, finished PR", you have more or less described Jiro. If they are "no, the IDE, sandbox is fine, branch is fine", Codex cloud, or Anthropic's hosted Claude Code sessions, will cost you less.

## Why Jiro takes the top slot

Arithmetic, mostly. Team costs $250 monthly, with five runtimes shared across however many people you add. Developer is $99 for one person and up to three runtimes. [2] The trial is 30 days with no card. Models are whatever your team already pays Anthropic or OpenAI for. Nobody is reselling you tokens.

Then there is the work itself. Jiro aims for the diff you'd have written yourself on a sharp day rather than for volume, and it will push back when a ticket is a bad idea. Teams on Nori use it for the queue nobody volunteers for: small tickets, docs, test gaps, on-call fixes. At Miravoice it now accounts for over a quarter of merged pull requests and saves an engineer about five hours a week. [43] Corvus's CTO saw a production bug at a client dinner, had Nori look into it, and Nori deployed the fix. [44]

Anyone can kick it off with a Slack mention, from the browser or Discord, inside Handroll, or by cron and webhook. [45] Every action is logged. [46]

## When staying on Devin is the sensible call

Stay if you rely on Microsoft Teams, GitLab or Bitbucket. [47] Stay if Linear and GitHub events already kick off Devin sessions and that plumbing works. [48] Stay if you want one vendor to own the agent, the routing and the model bill, and you are happy to pay for that convenience.

And stay if you need a dedicated VPC deployment. [30] Jiro is single-tenant per organisation on Nori's hosting, which is not the same thing. [49]

## Moving over

Leaving Devin takes an afternoon, not a migration project; Knowledge entries need copying by hand. Our [notes on moving from Devin](https://jiro.bot/switch/devin-to-jiro) walk through the order of operations, including the Claude sign-in step people skip.

## FAQ

### What are the best Devin alternatives?

For a 5–20 engineer team already paying for Claude or ChatGPT, Jiro. Beyond that: Cursor cloud agents for Cursor users, Codex cloud for ChatGPT-only shops, Claude Code on the web for individuals, Factory for a full platform, Copilot cloud agent for GitHub-first orgs, Tembo, and OpenHands if you want open source.

### Who competes with Devin?

Cursor, OpenAI with Codex cloud, Anthropic with Claude Code on the web and Claude Tag, GitHub with Copilot cloud agent, Factory, Tembo, OpenHands and Jiro. Each sells a different slice: some resell models, some only run on yours.

### How much does Devin cost?

Free; $20 monthly for Pro; $200 for Max; and Teams at $80 a month at minimum, then $40 for each seat, with usage past the quota at API pricing. Enterprise is billed in ACUs. [5]

### Does Devin still use ACUs?

Only on Enterprise. Self-serve plans moved from ACUs to quotas on 2026-04-14. [28] [5]

### Can I use my Claude Max subscription instead of paying Devin for tokens?

Not in Devin; plan linking covers ChatGPT for the GPT share only. [4] In Jiro, yes: generate a token with `claude setup-token` on your own machine, which binds it to whichever Claude plan you hold, Pro up to Enterprise, then connect it. [50] [1]

### Is Windsurf part of Devin now?

Yes. Windsurf became Devin Desktop on 2026-06-02. [29]

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
3. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
4. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
5. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
6. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
7. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
8. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
9. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
10. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
11. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
12. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
13. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
14. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
15. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
16. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. Source: https://docs.factory.com/model-independence/byok.md (checked 2026-10-16)
17. Factory's plans are Pro at $20 a month, Plus at $100, Max at $200, and Teams at $60 a month plus $40 per seat for up to 10 seats; Business and Enterprise are custom. Source: https://factory.com/pricing (checked 2026-10-16)
18. Droids run locally in the Droid CLI and Factory App, on Factory-managed cloud Droid Computers, or on machines you register. Source: https://docs.factory.com/llms.txt (checked 2026-10-16)
19. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
20. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
21. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
22. Tembo runs Claude Code, Codex, Cursor, Amp or OpenCode per task and accepts your own API keys or a Claude, ChatGPT or SuperGrok subscription. Source: https://www.tembo.io/ (checked 2026-10-16)
23. Tembo's Pro plan is $60 a month and Max $200 a month, each including a usage allowance, with compute billed per second from $0.1066 an hour. Source: https://www.tembo.io/pricing (checked 2026-10-16)
24. Tembo runs coding agents in isolated cloud sessions with code, terminal, files and a live desktop. Source: https://www.tembo.io/ (checked 2026-10-16)
25. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
26. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
27. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
28. Cognition replaced its ACU-based Core and Team plans with quota-based self-serve plans on 2026-04-14. Source: https://cognition.com/blog/new-self-serve-plans-for-devin (checked 2026-10-16)
29. Windsurf became Devin Desktop on 2026-06-02. Source: https://cognition.com/blog/introducing-devin-desktop (checked 2026-10-16)
30. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
31. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
32. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
33. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
34. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
35. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
36. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
37. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
38. In Codex cloud you review the changes, then commit or open a pull request when you are ready. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
39. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
40. For Team and Enterprise, Slack work moves to Claude Tag (public beta), and the legacy Claude Code Slack bot was retired on 2026-10-05 in workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-16)
41. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. Source: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ (checked 2026-10-16)
42. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
43. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
44. Corvus's CTO saw a production bug at a client dinner, had Nori look into it and deploy a fix. Source: https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (checked 2026-10-19)
45. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
46. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
47. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
48. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. Source: https://docs.devin.ai/product-guides/automations.md (checked 2026-10-16)
49. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
50. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
