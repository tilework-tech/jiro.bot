# Jiro vs Claude Tag (2026): Billing, Model Choice and Control for Slack Coding Agents

Updated 2026-10-19

> **Should my team use Jiro or Claude Tag?**
>
> Choose Claude Tag if your organization is on Claude Team or Enterprise and is content with Claude models billed by usage. Choose Jiro if you run a small team, roughly 5 to 20 engineers, whose Claude or ChatGPT bill is already paid, and you want a flat price, a choice between Claude Code, Codex and Cursor, and control over the environment. Jiro is a background coding agent by Nori.

## Jiro and Claude Tag, line by line

|  | Jiro | Claude Tag |
|---|---|---|
| Models and agents | Claude Code, Codex, Cursor [1] | Claude models only [2] |
| Who can buy it | Any team; sign in with a Claude Pro, Max, Team or Enterprise plan, a ChatGPT plan or an API key | Team and Enterprise only [3] |
| What you pay | Free 30-day trial; Developer $99/mo; Team $250/mo [4] | Usage-billed, no per-seat charge [5] |
| Token markup | Your keys, zero token markup [6] | Usage-billed, no per-seat charge [5] |
| Where a session runs | Isolated cloud environment with your repos and tools [7] | Anthropic cloud sandbox per thread [8] |
| Environment control | Org setup script prepares each environment [9] | No repo hooks, .mcp.json or effort setting [10] |
| Tools and MCP | MCP server catalog [11] | Connectors and remote MCP only [12] |
| Start work from | Slack, web, Discord, terminal, schedules, webhooks [13] | Slack; Teams announced [14] |
| Scheduled and event work | Cron, one-off reminders, webhooks [15] | Schedules; no repo-event triggers [16] |
| What comes back | PRs, commits, comments for review [17] | Draft PRs via Claude GitHub App; GitLab token [18] |
| Product status | Paid plans after a free trial | Public beta [19] |

Claude Tag details come from Anthropic's documentation as of the checked date on each source.

## Verdict first

Both are good. They are built on different assumptions about who pays and who decides.

Claude Tag assumes Anthropic picks the model, the harness and the meter, and in exchange you get a polished teammate living in Slack with almost nothing to configure. Jiro assumes your team picks those three things, and in exchange you own a bit more of the setup.

For a Claude Enterprise shop that wants zero decisions: Tag. For a team of a dozen that already funds Claude or ChatGPT seats and dreads a second usage bill: Jiro.

## Billing: a meter or a flat line

This is where most managers end up, so start here.

Claude Tag has no seat charge for channel work. It draws from an organization balance as threads consume usage, while a one-to-one DM bills to the person who sent it [5]. On the Team plan, Claude stays silent in channels until someone buys credits [20]. Owners can cap the whole org and individual channels, with alerts at 75% and 95% of the limit [21]. Those controls are good. They are also a sign that spend is variable by design, and someone on your team will own watching it.

We could not find a published per-thread price for Tag, so we will not invent one. If you want an anchor, Anthropic's own figure for Claude Code across enterprise deployments is about $13 per developer per active day [22]. Tag is a different product, so treat that as a sanity check, not a quote.

Jiro is a fixed line item. The trial runs 30 days with no card; after that, a single seat on Developer is $99 a month and Team is $250 a month for a shared pool of five runtimes [4]. Tokens are drawn from whatever Claude or ChatGPT subscription you hold today, and Nori takes no cut of them [6].

That is not free usage. Your subscription's own ceilings still apply: Max, for instance, resets every five hours with a weekly limit on top [23], and anything past the limit can continue as extra usage at API rates [24]. The difference is that the variable part lives on a bill you already manage.

**Budget verdict.** Predictability favors Jiro. Zero added vendors favors Tag.

## Models and the harness

Tag runs Opus or Sonnet, chosen per thread, per channel or by an admin default [2]. If Claude is your answer for the next two years, that restriction costs nothing.

If you are less sure, it matters. Jiro runs Claude Code, Codex or Cursor [1], so a team can keep Claude for most work and try Codex on a stubborn refactor without a procurement cycle.

The harness is the quieter difference. In Tag, repository hooks and `.mcp.json` are not loaded, effort level can't be set, and every session runs in auto mode [10]. Admins can add connectors, plugins, skills and remote MCP servers, but not local stdio servers [12]. In Jiro, an org setup script installs dependencies for every session [9], admins connect servers from an MCP catalog [11], and a shared skillset is authored once and rendered into each agent's native instruction file [25].

**Control verdict.** Jiro, clearly. Whether you need that control is the real question.

## Where Claude Tag is the stronger product

- **Visibility.** Anyone in the channel can tag @Claude and everyone watches the thread [26]. It is an excellent teaching surface.
- **Engine.** Each thread gets its own ephemeral sandbox on the same engine as Claude Code on the web [8], maintained by the lab that trains the model.
- **Proactivity.** Scheduled routines, channel watches and subscriptions to a single PR ship out of the box [16].
- **Network placement.** Sessions can run on self-hosted runners inside your network, minus admin connectors [27].
- **Git hosts.** GitLab works through a service-account token [18]. Jiro connects GitHub repositories through its GitHub App [28].

## Where Jiro is the stronger product

- **Eligibility.** Pro and Max users are shut out of Tag [3]; Jiro accepts their login, generated with `claude setup-token` [29].
- **Choice.** Three agents and two model labs instead of one.
- **Cost shape.** Flat plan, idle runtimes asleep [30].
- **Event triggers.** Webhooks react to outside events [15], so a webhook from your CI or alerting can start work. Tag's routines don't fire on repository events like every new PR [16].
- **Surfaces.** Slack plus web chat, Discord and a terminal [13].
- **Isolation and audit.** A single-tenant broker per org [31], with every session and action logged and searchable [32].
- **Data retention.** Tag is unavailable to orgs with Zero Data Retention enabled [33].

## A checklist for the budget meeting

Answer these in order. Stop at the first hard no.

- Are we on Claude Team or Enterprise? If not, Tag is off the table today.
- Is Zero Data Retention switched on for our Claude org? If yes, Tag is unavailable.
- Will finance accept a variable usage line, or do they want a fixed number?
- Does anyone on the team want Codex or Cursor in the mix within the next year?
- Do our repos rely on hooks, `.mcp.json` or local MCP servers to behave?
- Do we want CI or alerting webhooks to start agent work without a person typing?
- Who will own spend alerts and channel caps?

Mostly "Claude-only, variable is fine, no special config"? Tag. Mostly the opposite? Jiro. Split down the middle? Run both for two weeks; our switching guide for Claude Tag lays out that pilot step by step.

## Who should pick which

Claude Enterprise organization, Claude everywhere, platform team happy to manage caps. Tag.

Eight engineers, half on Max, a couple who swear by Codex, a CI pipeline that already posts webhooks. Jiro.

A team in between, on Claude Team but feeling the meter, gets the most from the side-by-side pilot, because the answer depends on usage numbers only your own repos can produce. Our Claude Tag alternatives list covers the wider field beyond these two.

## FAQ

### Is Jiro cheaper than Claude Tag?

It depends on volume. Tag bills channel work by usage from an org balance [5]; Jiro is $99 or $250 a month on top of a subscription you already pay [4]. Heavy Tag usage tends to make the flat plan look better; light usage may not.

### Can Jiro use my company's Claude Team plan?

Yes. On a laptop already logged in to Claude, `claude setup-token` prints a year-long token bound to the plan, Team included [29]. Paste that into Jiro's Claude connection.

### Does Claude Tag support Codex or GPT models?

No. It runs Anthropic's Opus and Sonnet only [2].

### Do both open pull requests?

Yes. Tag opens draft pull requests authored by Claude through the Claude GitHub App [18]. Jiro's work lands as a PR, a commit or a comment, and a human on your team decides what happens next [17].

### Is Claude Tag generally available?

Not yet. Anthropic still labels it a public beta [19].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. Claude Tag runs Anthropic's Opus and Sonnet models, chosen per thread, per channel or by admin default. Source: https://claude.com/docs/claude-tag/users/models (checked 2026-10-19)
3. Claude Tag is available only on Team and Enterprise plans, not on Free, Pro or Max, and not through third-party deployments. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
4. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
5. Claude Tag channel work is billed by usage from an organization balance rather than per seat; one-to-one DMs bill to the sender's own seat. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
6. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
7. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
8. Each Claude Tag thread runs in its own ephemeral sandbox in Anthropic's cloud, on the same engine as Claude Code on the web. Source: https://claude.com/docs/claude-tag/concepts/how-it-works (checked 2026-10-19)
9. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
10. In Claude Tag, repository hooks and .mcp.json are not loaded, effort level is not configurable, and sessions run in auto mode. Source: https://claude.com/docs/claude-tag/concepts/for-claude-code-users (checked 2026-10-19)
11. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
12. Claude Tag admins can add connectors, plugins, skills and remote MCP servers, but local stdio MCP servers can't be connected. Source: https://claude.com/docs/claude-tag/admins/connections/custom (checked 2026-10-19)
13. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
14. Claude Tag works in Slack channels, threads, group DMs, direct messages and the assistant panel; Microsoft Teams support is announced as coming soon. Source: https://claude.com/product/tag (checked 2026-10-19)
15. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
16. Claude Tag supports scheduled routines, channel watches and single-PR subscriptions, but not routines fired by other repository events such as every new pull request. Source: https://claude.com/docs/claude-tag/users/proactivity (checked 2026-10-19)
17. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
18. Claude Tag code work goes through the Claude GitHub App, which pushes branches and opens draft pull requests authored by Claude; GitLab works through a service-account token. Source: https://claude.com/docs/claude-tag/admins/configure-github (checked 2026-10-19)
19. Anthropic labels Claude Tag a public beta whose features may change before general availability. Source: https://claude.com/docs/claude-tag/admins/migrate-from-earlier (checked 2026-10-19)
20. On the Team plan, Claude won't respond in channels until the organization buys usage credits. Source: https://claude.com/docs/claude-tag/admins/set-spend-limit (checked 2026-10-19)
21. Claude Tag owners can set an organization spend limit and per-channel limits, with alerts at 75% and 95%. Source: https://support.claude.com/en/articles/15594475-what-is-claude-tag (checked 2026-10-19)
22. Anthropic reports that across enterprise deployments Claude Code averages about $13 per developer per active day and $150 to $250 per developer per month, staying below $30 per active day for 90% of users. Source: https://code.claude.com/docs/en/costs (checked 2026-10-17)
23. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
24. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. Source: https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans (checked 2026-10-17)
25. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
26. Claude Tag lets anyone in a Slack channel tag @Claude to hand it work; Claude replies in the thread, where the channel can see it. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
27. Claude Tag sessions can run on self-hosted runners inside your network, but admin-added connectors are unavailable there. Source: https://claude.com/docs/claude-tag/concepts/security-and-data (checked 2026-10-19)
28. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
29. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
30. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
31. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
32. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
33. Claude Tag isn't available to organizations with Zero Data Retention enabled. Source: https://claude.com/docs/claude-tag/concepts/security-and-data (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
