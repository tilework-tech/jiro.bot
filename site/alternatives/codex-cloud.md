# Codex Cloud Alternatives & Competitors (2026): 7 Best Options

Updated 2026-10-19

> **What are the best Codex cloud alternatives?**
>
> Jiro is the pick for small teams, roughly 5 to 20 engineers, that already pay for ChatGPT or Claude and want one cloud coding agent that is not tied to either vendor: it can even keep running Codex on your existing ChatGPT login. Jiro is a background coding agent by Nori. The serious shortlist after that: Anthropic's web-hosted Claude Code, Cursor's agents, Copilot's cloud agent on GitHub, Devin, Factory, and Google's Jules.

## Budget and lock-in, side by side

|  | Entry price | Model choice | How usage is metered |
|---|---|---|---|
| Jiro | Free 30-day trial; Developer $99/mo; Team $250/mo [1] | Claude Code, Codex, Cursor [2] | Your keys, zero token markup [3] |
| OpenAI Codex cloud | In ChatGPT Plus $20/mo and up [4] | OpenAI models; cloud needs a ChatGPT plan [5] | Usage limits shared with ChatGPT [4] |
| Claude Code on the web | In Pro $20/mo, Max $100+/mo, Team seats [6] | Claude models; Anthropic account required [7] | Included in the plan; no separate cloud VM charge [6] |
| Cursor cloud agents | Premium $30/mo+ (X Subscription) plus API-priced usage [8] | Billed at API prices for the chosen model; own keys chat-only [9] | API list price from prepaid credit [8] |
| GitHub Copilot cloud agent | Pro $10; Pro+ $39; Max $100; Business $19/user [10] | Many models via GitHub; own keys not documented for it [11] | AI Credits since 2026-06-01 [12] |
| Devin | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [13] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [14] | Quota, then API pricing [13] |
| Factory | Pro $20/mo; Plus $100; Max $200; Teams $60 + $40/seat [15] | Multi-model; own keys in CLI/desktop only [16] | Flat tiers; Business and Enterprise custom [15] |
| Jules | Free; AI Pro $19.99/mo; Ultra from $99.99/mo [17] | Gemini only [18] | Free 15 tasks/day; Pro 100; Ultra 300 [19] |

Rows for rivals summarize the cited vendor pages; check the sources below for current terms.

## The case for shopping around

Codex cloud is good value. That is the first thing to say.

It ships inside ChatGPT from Plus at $20 a month; Pro runs $100–500, and Business is $25 a seat [4]. If your company already standardized on ChatGPT, the marginal cost of cloud tasks is close to nothing. Hard to beat on paper.

Read the fine print. Three line items still deserve a CFO's squint:

- **Shared limits.** Codex usage draws from the same pool as everyday ChatGPT work [4]. Heavy agent weeks and heavy chat weeks compete.
- **One vendor.** Cloud tasks run OpenAI models, and an API key does not unlock cloud features without a ChatGPT plan [5]. If a Claude model wins your benchmark next quarter, you are buying a second tool.
- **Migration risk.** Code Review and the GitHub and Linear integrations still run on Codex Cloud (Legacy), which OpenAI intends to deprecate [20]. Budget engineering time for whatever replaces them.

Small teams also notice workflow. You review changes, then commit or open the pull request yourself [21]. That is a reasonable control. It is also a step a busy team will batch up and forget.

## Seven options, ranked for a 5-20 engineer team

Ranking criteria, in order: total monthly spend you can forecast, freedom to change models without changing tools, and how much the agent does without a human driving it.

### 1. Jiro: flat fee, your own tokens, any of three harnesses

- **Spend:** Developer is $99 a month for one user; Team is $250 for several people on five shared runtimes; the first 30 days are free with no card [1].
- **Tokens:** billed by Anthropic or OpenAI on the plan you already hold, with zero markup [3].
- **Lock-in:** Claude Code, Codex or Cursor [2]. Codex connects via Codex OAuth or an OpenAI API key [22].
- **Operations:** isolated cloud environment per conversation [23], work from Slack, web, schedules and webhooks [24], pull requests back for review [25].

Net: the flat fee buys provider independence, and you keep paying OpenAI exactly what you pay today, no more and no less, because the tokens never pass through Nori's invoice. Simple.

### 2. Claude Code on the web: the like-for-like swap to Anthropic

Bundled into Claude Pro at $20, Max from $100, and Team and Enterprise seats, with no separate compute line [6]. Mirror image of Codex cloud. Same single-vendor trade, different vendor [7].

### 3. Cursor cloud agents: strongest artifacts, least predictable bill

Pull requests come with screenshots, video and logs [26]. Premium starts at $30 a month, and third-party model usage draws prepaid credit at API list price [8]. Forecasting that is harder than forecasting a seat.

### 4. GitHub Copilot cloud agent: cheapest per seat for GitHub shops

Business is $19 a user [10], and since June usage is metered in GitHub AI Credits by tokens [12]. Each session gets a GitHub Actions runner and a hard 59-minute ceiling [27]. Fine for scoped tickets; tight for long ones.

### 5. Devin: most autonomy, priced to match at scale

Pro is $20 and Max $200 a month; Teams starts at $80 monthly and adds $40 a head, with anything past quota charged like API usage [13]. Devin opens and maintains its own pull requests, including stacked ones [28]. Model routing is Cognition's call, not yours [14].

### 6. Factory: built for larger rollouts

Teams costs $60 monthly plus $40 per head, capped at ten heads, and larger tiers are quoted individually [15]. Bring-your-own keys are limited to the CLI and desktop app [16]. Its VPC and air-gapped option matters to regulated buyers [29].

### 7. Jules: lowest cost of entry, Gemini only

A free tier with 15 tasks a day, rising to 100 with Google AI Pro at $19.99 [19] [17]. Gemini models only [18]. Workspace accounts are pointed to an interest form for paid tiers [30], which rules it out for many companies.

## Worked example: an eight-engineer team

Assume eight engineers, all on ChatGPT Business today. Rival prices below are list prices from the cited pages.

- **Codex cloud only:** 8 × $25 = $200 a month, agent work included, limits shared with chat [4].
- **Codex cloud plus Jiro Team:** the same $200 to OpenAI, plus $250 flat for five shared runtimes [1]. $450 total. Jiro can drive Codex on those ChatGPT logins via Codex OAuth [22].
- **Copilot Business instead:** 8 × $19 = $152 in seats [10], before AI Credits [12].
- **Claude Code on the API, for comparison:** Anthropic's own figures put Claude Code at about $150–250 per developer per month in enterprise deployments [31]. Multiply by eight. It adds up.

So Jiro is not the cheapest line on this list. It is a $250 premium for running whichever harness wins, from Slack, on a schedule, with review built in. Whether that premium pays back depends almost entirely on how many reviewer and engineer hours it gives your team each week, which is why we suggest measuring it during the trial rather than guessing.

## A decision framework in four questions

Run these with your finance partner in the room.

- What do we already pay OpenAI and Anthropic per month, and would a new tool double that?
- If the best model changes vendor next quarter, what does switching cost us: a setting, or a procurement cycle?
- Is the line item a flat fee, per seat, per token, or per minute of compute? Which can we actually predict?
- Who on the team reviews agent output, and how many hours a week does that take?

Most small teams find question two decides it. Not price.

## Why Jiro ranks first here

Because it does not ask you to give up Codex. It asks you to stop being dependent on it.

Jiro is a tasteful, proactive engineer that cares more about quality than volume. Practically, that means it takes the work your roadmap squeezes out: slop cleanup, documentation, test and security debt, small tickets, the on-call fix. It also works while you sleep, on a cron schedule or a webhook from your CI or alerting [32].

The evidence from Nori customers is concrete. At Miravoice, Nori's share of merged pull requests passed 25%, and one engineer values it at five hours a week, easily [33]. Corvus's CTO got a production bug fixed and deployed without leaving a client dinner [34].

Governance is simple to explain upward: single-tenant per organization, every action logged and searchable [35] [36].

## When Codex cloud is still the better buy

- Your company is all-in on ChatGPT, and agent tasks are occasional rather than daily.
- You rely on Codex Code Review or the Linear integration and can live with the legacy roadmap [20].
- Your team starts tasks from ChatGPT's mobile and desktop apps and wants nothing else [37].

In those cases the extra fee buys you little. Keep the money.

## Planning the move

The [Codex cloud to Jiro switching memo](https://jiro.bot/switch/codex-cloud-to-jiro) walks through what changes on the bill, line by line, and how to keep Codex running inside Jiro.

## FAQ

### What are the best Codex cloud alternatives?

Jiro, for small teams already paying for ChatGPT or Claude that want vendor independence. Behind it, ordered by how most budgets shake out: Anthropic's hosted Claude Code, then Cursor, Copilot, Devin, Factory and Jules.

### Who competes with Codex cloud?

Directly: Anthropic, Cursor, GitHub, Cognition with Devin, Factory and Google with Jules. Indirectly, multi-harness agents such as Jiro and Tembo, which can run Codex itself.

### How much does Codex cloud cost?

Nothing extra beyond ChatGPT. It is included from Plus at $20 a month; Pro is $100–500 and Business $25 per user, with limits shared with ChatGPT [4].

### Can I use Codex cloud with an OpenAI API key?

Not for cloud features. An API key covers Codex in the CLI, SDK and IDE; cloud tasks need a ChatGPT plan [5]. Jiro, by contrast, will run Codex on either an API key or Codex OAuth [22].

### Is Codex Cloud (Legacy) going away?

OpenAI says it plans to deprecate it. Today it still powers Code Review and the GitHub and Linear integrations [20].

### Does Codex cloud work in Slack?

Yes, though requests now start with @ChatGPT rather than @Codex [38].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
2. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
4. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
5. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
6. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
7. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
8. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
9. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
10. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
11. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
12. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. Source: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ (checked 2026-10-16)
13. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
14. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
15. Factory's plans are Pro at $20 a month, Plus at $100, Max at $200, and Teams at $60 a month plus $40 per seat for up to 10 seats; Business and Enterprise are custom. Source: https://factory.com/pricing (checked 2026-10-16)
16. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. Source: https://docs.factory.com/model-independence/byok.md (checked 2026-10-16)
17. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
18. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
19. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
20. Codex Cloud (Legacy) still powers Code Review and the GitHub and Linear integrations, and OpenAI plans to deprecate it. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
21. In Codex cloud you review the changes, then commit or open a pull request when you are ready. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
22. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
23. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
24. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
25. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
26. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
27. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
28. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
29. Factory Private, launched 2026-09-18, deploys Factory into a customer's VPC, on-premises or air-gapped network. Source: https://factory.com/news/factory-private (checked 2026-10-16)
30. Paid Jules tiers are offered to personal Google accounts; Workspace users are directed to an interest form. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
31. Anthropic reports that across enterprise deployments Claude Code averages about $13 per developer per active day and $150 to $250 per developer per month, staying below $30 per active day for 90% of users. Source: https://code.claude.com/docs/en/costs (checked 2026-10-17)
32. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
33. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
34. Corvus's CTO saw a production bug at a client dinner, had Nori look into it and deploy a fix. Source: https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (checked 2026-10-19)
35. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
36. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
37. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
38. Codex requests in Slack now start with @ChatGPT instead of @Codex. Source: https://learn.chatgpt.com/docs/third-party/slack.md (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
