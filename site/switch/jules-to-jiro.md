# Switching from Jules to Jiro (2026): Quickstart, Gotchas and First Week

Updated 2026-10-19

> **How do I switch from Jules to Jiro?**
>
> Switching from Jules to Jiro takes six steps: start the free trial, install Nori's GitHub App, connect Slack, connect a Claude plan through claude setup-token (or Codex sign-in, an API key, or a Cursor key), write an org setup script, and send a first task. Jiro is a background coding agent by Nori. Repository instruction files stay where they are, Jules Scheduled Tasks become Jiro cron triggers, and the main things you leave behind are Gemini models and the jules issue label.

## Before you start

Have three things ready.

- Admin rights on the GitHub org.
- Permission to add an app to Slack.
- A Claude or ChatGPT plan, or an API key. Jiro doesn't run Gemini, so your Google AI subscription won't carry over [1].

Budget about an hour for setup. Then a week of small tasks.

## Quickstart

1. **Start the trial.** Thirty days free, no card required [2].
2. **Install the GitHub App.** Choose all repos or just the pilot ones [3].
3. **Connect Slack.** Requests will mostly come from there [4].
4. **Mint a Claude token.** Laptop, terminal, `claude setup-token`. Copy what it prints. That string is valid twelve months and draws on your paid Claude seat, be it Pro, Max, Team or Enterprise [5].
5. **Connect it in Jiro.** Paste the token. ChatGPT shop? Use the Codex login flow, or an OpenAI key. Cursor shop? Bring a Cursor key [6].
6. **Script the environment.** Put install commands, language versions and service setup here so every environment boots ready [7].
7. **Send a first task.** Mention @jirobot in a channel with something tiny. Review the PR [8].
8. **Optional: install Jiro's skills.** Run `npx nori-skillsets install public/jiro` for its engineering conventions.

## Port what you had

Mostly copy-paste.

- **Instruction files.** Leave AGENTS.md or CLAUDE.md in the repo. For rules that should apply across repos, write a Nori skillset once and let Nori emit each harness's native file, whether that's CLAUDE.md or AGENTS.md [9].
- **Environment setup.** Jules gave you a stock VM with common toolchains and Docker [10]. If you added commands on top, move them into the setup script from step 6.
- **Scheduled Tasks.** Recreate each one as a Jiro cron trigger [11] [12].
- **API or CLI automations.** Rewire anything that called Jules to send a webhook to Jiro instead [12].
- **Google tools.** Connect Drive, Sheets or Gmail if tasks need them [13].

## Gotchas

- **No Gemini.** Jiro runs Claude Code, Codex or Cursor [14]. Prompts tuned for Gemini may need a nudge.
- **No issue label.** Jules picks up GitHub issues labelled jules [15]. Jiro doesn't watch labels. Paste the issue link into Slack instead, or wire a webhook.
- **PRs arrive, not drafts you publish.** In Jules you chose between Publish branch and Publish PR [16]. Jiro returns its work as a pull request, commit or comment for review [8], so set up branch protection if you haven't.
- **Model limits move.** Daily task caps go away [17], but your Claude or ChatGPT plan's own usage limits now apply.
- **Token expiry.** That setup token lasts a year. Put a reminder in the calendar.
- **Check the script first.** If an early task fails strangely, a missing install step in the setup script is the usual suspect.
- **Concurrency is different.** Jules counted concurrent tasks per tier: 3, 15 or 60 [17]. Jiro counts runtimes instead, and they sleep when idle [18].
- **One conversation, one machine.** Each active session gets its own [19]. Parallel threads mean parallel runtimes, and Developer includes three.

## First week

1. Day one: fix stale docs in the main README.
2. Day two: add missing tests for one module.
3. Day three: ask Jiro where the codebase has accumulated slop, and read the list before approving any cleanup.
4. Day four: hand over a small ticket from the backlog.
5. Day five: route one boring on-call fix to it.

Write each request the way you'd write a ticket for a new teammate: the goal, the file or module, how you'll judge it done. Expect questions back. Jiro is supposed to push on vague asks.

Keep tasks reviewable in a few minutes. Grow scope only after the PRs look like ones your team would have written.

## What you lose

- Gemini.
- The free tier, which gave fifteen tasks a day at no cost [17].
- Starting work straight from a GitHub label.
- Cheap single-person pricing bundled into a Google AI plan [20].

What you get in return is a team agent rather than a personal one: shared Slack threads [21], shared org context, and several harnesses behind one name.

## Cost check

- Jules: $0 on the free tier, $19.99/month via AI Pro, $99.99+/month via AI Ultra [20].
- Jiro Developer: $99 a month, one user, three persistent runtimes.
- Jiro Team: $250 a month, several users, five shared runtimes [2].
- Plus a model plan for every engineer: with Jiro, each person still needs their own Claude or ChatGPT plan, or an API key [6]. Claude Max sits at $100 or $200 monthly, depending on the multiplier [22].

Per person, Jules is cheaper. Per team, compare against what you'd spend putting every engineer on a paid Google AI plan instead of sharing one Jiro workspace, and remember Nori charges no markup on the model side [23].

## Run both for two weeks

Nothing stops you. Keep Jules for personal experiments. Route team chores to Jiro. Compare merged PRs and review time at the end.

Still deciding? Read the [Jules alternatives roundup](https://jiro.bot/alternatives/jules).

## FAQ

### Can Jiro use my Google AI Pro subscription?

No. Jiro runs on Claude or ChatGPT plans, API keys, or a Cursor key, not Gemini.

### Do my Jules Scheduled Tasks transfer automatically?

No. Recreate each one as a cron trigger in Jiro. It's a few minutes per task.

### Does Jiro work if our company uses Google Workspace?

Yes. Jiro's plans aren't tied to a Google account at all, and Drive, Sheets and Gmail are available as integrations.

### How fast can we be up and running?

About an hour to a first pull request, if your setup script is simple.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Jules runs on Google's Gemini models. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
2. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
3. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
4. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
5. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
6. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
7. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
8. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
9. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
10. Google's Jules runs each task inside a short-lived VM with common toolchains and Docker installed. Source: https://jules.google/docs/environment (checked 2026-10-16)
11. Jules can run Scheduled Tasks on a recurring basis. Source: https://jules.google/docs/scheduled-tasks/ (checked 2026-10-16)
12. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
13. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
14. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
15. Jules takes work from its web app, GitHub issues labelled jules, the Jules Tools CLI and the Jules API. Source: https://jules.google/docs/changelog/ (checked 2026-10-16)
16. When a Jules task finishes you choose Publish branch or Publish PR. Source: https://jules.google/docs/code (checked 2026-10-16)
17. Jules allows 15 tasks a day and 3 at once on the free tier, 100 a day and 15 at once with Google AI Pro, and 300 a day and 60 at once with AI Ultra. Source: https://jules.google/docs/usage-limits (checked 2026-10-16)
18. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
19. In Nori, one claimed machine serves one active session within the organization's fleet. Source: https://docs.noriagentic.com/resources/faq#is-each-session-isolated (checked 2026-10-19)
20. Paid Jules tiers come with Google AI Pro at $19.99 a month or AI Ultra from $99.99 a month. Source: https://gemini.google/subscriptions/ (checked 2026-10-16)
21. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
22. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
23. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
