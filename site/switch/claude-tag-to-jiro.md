# Switching from Claude Tag to Jiro (2026): A Two-Week Side-by-Side Pilot

Updated 2026-10-19

> **How do I switch from Claude Tag to Jiro?**
>
> Do not cut over in one step. Keep Claude Tag in its current channels, stand Jiro up in a neighboring channel on the Claude or ChatGPT login the team already pays for, route comparable tasks to each for two weeks, and decide from recorded results. Jiro is a background coding agent by Nori. Its target is small teams of roughly 5 to 20 engineers on Claude or ChatGPT.

## Pilot scope

Duration: 14 calendar days. Participants: three to six engineers, one of whom acts as pilot lead. Channels: the existing Claude Tag channel stays untouched; one new channel is created for Jiro.

Objective: establish, with numbers, whether Jiro produces mergeable work at a predictable cost for this team's repositories. Not whether it is impressive in a demo. Demos are cheap.

Exit criteria are fixed before day one and written into the channel topic. A reasonable default: Jiro is adopted if its merge rate is at least equal to Claude Tag's on comparable tasks and the total monthly cost is lower or flat.

## What carries over, and what has to be rebuilt

Most of a Claude Tag setup lives in three places: the repository, Anthropic's admin console and Slack. Each moves differently.

- **Repository CLAUDE.md files.** These travel with the code. Jiro runs Claude Code [1] against a clone of the repo, so committed instructions are present on the first task.
- **Skills added in the Tag admin console.** Copy them by hand into an org skillset. Nori converts the skillset into the instruction-file format each harness expects [2].
- **Connectors, plugins and remote MCP servers.** Reconnect each from Jiro's integrations page or MCP catalog [3]. Linear, Jira, Notion and Google are among the listed integrations [4].
- **Scheduled routines.** Recreate them as cron triggers [5].
- **Channel watches and single-PR subscriptions.** No direct equivalent is documented. Where the intent was "react when something happens," a webhook usually fits. Where it was "keep an eye on this channel," expect a gap.
- **GitHub access.** Install Jiro's GitHub App and select repositories [6]. The Claude GitHub App stays installed for Tag during the pilot.
- **Repo hooks and `.mcp.json`.** Tag skips these [7]. Teams that worked around that by moving setup elsewhere can now put it in the org setup script [8]. Verify behavior on a real task rather than assuming it.
- **Spend limits.** Not carried over, and mostly unnecessary on a flat plan. The subscription's own usage limits still apply.

Slack thread history is unaffected. Old Tag threads remain readable where they are.

## Day 1: setup

Plan for one sitting. Steps in order:

- **1. Open a trial account.** It lasts a month and asks for no card [9].
- **2. Connect GitHub.** Install the GitHub App; choose all repositories or a selected set. For the pilot, select only the repos in scope.
- **3. Connect Slack.** Add Jiro to the workspace and invite it to the new pilot channel only.
- **4. Connect a model login.** For Claude, run `claude setup-token` on a local machine first; it issues a one-year token linked to the Pro, Max, Team or Enterprise plan [10]. Connect that token in Jiro. Other routes: Codex sign-in via OAuth, raw keys from OpenAI or Anthropic, or, for the Cursor harness only, a Cursor key [11].
- **5. Draft the org setup script.** Have it install the dependencies, CLIs and services every task needs [8]. Keep it short at first.
- **6. Add shared context.** Move the copied Tag skills into a skillset. Optionally add Jiro's own engineering skills with `npx nori-skillsets install public/jiro`.
- **7. Run a first task.** A small documentation fix in a familiar repo. Confirm a pull request arrives [12] and that CI runs on it.

If step 7 fails, fix the setup script before routing real work. Most early failures are missing dependencies.

## Routing rule for the pilot

Comparable tasks go to both tools, alternately. Odd-numbered tickets to Tag, even-numbered to Jiro, or any equally boring rule. Hand-picking which tool gets the "easy" ticket ruins the data.

Once a week, give the same task to both. One paired comparison per week is enough. More than that wastes reviewer time.

## Week one: low-risk work

The first week tests setup and review flow, not raw capability.

- Fill a documentation gap someone has complained about twice.
- Add missing tests around a module with low coverage.
- Clean up dead code or duplicated helpers flagged in a recent review.
- Close two or three small tickets that have sat in the backlog for a month.
- Take one on-call fix, ideally started from a webhook from your CI or alerting [5].

Expect friction in the first two days. Setup scripts rarely survive first contact with a real monorepo.

## Week two: real work and measurement

Move to tickets the team would have done anyway. Include at least one task that needs an integration such as Linear or Jira, and one scheduled job.

Record the following per task, in a shared sheet, for both tools:

- Time from request to first pull request.
- Review rounds before merge, or "abandoned."
- Whether the change matched what a teammate would have written, rated by the reviewer.
- Model usage consumed, from the Claude Tag spend dashboard and from the subscription's usage page.

Jiro is designed to question a weak plan and raise concerns early. Log those interruptions too. Some are useful; some are noise, and the ratio matters.

## What the team gives up

Leaving Tag has real costs. They should be written down before the decision, not after.

- **Shared visibility.** Tag lets anyone in a channel tag @Claude and the whole channel sees the reply [13]. Jiro also works in Slack threads [14], but teams used to Tag's channel culture will need to rebuild the habit.
- **Proactive watches.** Tag's channel watches and PR subscriptions [15] have no documented counterpart.
- **GitLab.** Tag supports GitLab through a service-account token [16]. Jiro's documented path is GitHub.
- **Self-hosted runners.** Tag can run inside the company network [17]. Jiro runs in Nori's cloud, one tenant per org [18].
- **One fewer vendor.** Tag is part of the Anthropic contract. Jiro adds a second supplier.

## Cost comparison

Claude Tag charges channel work by usage against an organization balance [19], and Team plans must prepay before Claude responds [20]. Record the two-week Tag spend directly from the admin dashboard.

Jiro is flat: Developer $99 a month, Team $250 a month with five shared runtimes [9]. Model tokens come from the team's own subscription with no added markup [21]. If a Max login hits its cap, overflow is billed as extra usage at standard API pricing [22], so record that line too.

Compare like for like: Tag spend plus Claude seats, against Jiro plan plus the same seats plus any extra usage.

## Day 14: the decision

Three outcomes are acceptable. Adopt Jiro and retire the Tag channel. Keep Tag and let the Jiro trial lapse; there is no card on file, so nothing converts. Or keep both, with a written rule about which work goes where.

The fourth outcome, "keep both indefinitely with no rule," is not acceptable. It doubles the review surface.

For a wider view of the field before deciding, the [Claude Tag alternatives](https://jiro.bot/alternatives/claude-tag) list covers six other options.

## FAQ

### Can Claude Tag and Jiro run in the same Slack workspace?

Yes. Keep them in separate channels during the pilot so results stay attributable.

### Do I need a Claude Team plan to use Jiro?

No. Any Pro, Max, Team or Enterprise plan works through `claude setup-token` [10], and ChatGPT logins or API keys work too [11].

### Will our Claude Tag skills work in Jiro?

Not automatically. Copy them into an org skillset; it is then translated into each agent's instruction file [2].

### What happens to the trial if we decide against Jiro?

It ends after 30 days. No card was collected, so nothing is charged [9].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
3. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
4. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
5. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
6. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
7. In Claude Tag, repository hooks and .mcp.json are not loaded, effort level is not configurable, and sessions run in auto mode. Source: https://claude.com/docs/claude-tag/concepts/for-claude-code-users (checked 2026-10-19)
8. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
9. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
10. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
11. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
12. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
13. Claude Tag lets anyone in a Slack channel tag @Claude to hand it work; Claude replies in the thread, where the channel can see it. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
14. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
15. Claude Tag supports scheduled routines, channel watches and single-PR subscriptions, but not routines fired by other repository events such as every new pull request. Source: https://claude.com/docs/claude-tag/users/proactivity (checked 2026-10-19)
16. Claude Tag code work goes through the Claude GitHub App, which pushes branches and opens draft pull requests authored by Claude; GitLab works through a service-account token. Source: https://claude.com/docs/claude-tag/admins/configure-github (checked 2026-10-19)
17. Claude Tag sessions can run on self-hosted runners inside your network, but admin-added connectors are unavailable there. Source: https://claude.com/docs/claude-tag/concepts/security-and-data (checked 2026-10-19)
18. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
19. Claude Tag channel work is billed by usage from an organization balance rather than per seat; one-to-one DMs bill to the sender's own seat. Source: https://claude.com/docs/claude-tag/overview (checked 2026-10-19)
20. On the Team plan, Claude won't respond in channels until the organization buys usage credits. Source: https://claude.com/docs/claude-tag/admins/set-spend-limit (checked 2026-10-19)
21. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
22. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. Source: https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
