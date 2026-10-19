# Switching from Factory to Jiro (2026): Cutover and Rollback Runbook

Updated 2026-10-19

> **How do I switch from Factory to Jiro?**
>
> Run Jiro alongside Factory for one or two weeks: start the free trial, install the GitHub App on a few pilot repos, connect Slack, sign in with your Claude or ChatGPT plan, write an org setup script, then route small tickets to Jiro and compare. Jiro is a background coding agent by Nori. Keep Factory live until the pilot passes, so rollback is just turning Jiro off.

## Scope

This runbook covers a team of roughly 5 to 20 engineers moving delegated coding work from Factory's Droids to Jiro. It assumes GitHub, Slack, and an existing Claude or ChatGPT subscription.

Out of scope: Factory Private installs. If you run Droids inside your VPC or an air-gapped network [1], stop here. Jiro is hosted and has no on-premises edition.

Estimated effort: one afternoon to set up. Two weeks of parallel running.

## Before you start

Complete every item. Do not begin cutover with open questions.

- **Inventory automations.** List each Factory automation you rely on, such as Ticket to PR or Error Triage [2]. Note what fires it and where its output goes.
- **Inventory intake.** Write down where Droid work starts today. Factory accepts delegations from Slack, Linear and Jira [3]; Jiro's entry points are chat (Slack, Discord, the web), the terminal, cron and webhooks [4]. Anything that depends on assigning a Linear or Jira ticket to the agent needs a new path.
- **Collect instructions.** Find every file of agent guidance: repo-level `AGENTS.md` or `CLAUDE.md`, plus any conventions you keep inside Factory. Repo files stay where they are. The rest gets copied by hand.
- **Pick pilot repos.** Two or three. One should be boring.
- **Confirm model access.** Every pilot user needs one of: a paid Claude seat, ChatGPT, an Anthropic or OpenAI key, or (Cursor harness only) a Cursor-issued key [5].
- **Name an owner.** One person writes the setup script and reads every pilot PR.

## What carries over

Instruction files committed to your repos come along untouched, because the harnesses Jiro runs read them natively: Claude Code reads `CLAUDE.md`, Codex reads `AGENTS.md`.

Org-wide conventions should move into a Jiro skillset. Write it once; Nori renders the per-agent file for whichever harness runs, so Claude Code sees a `CLAUDE.md` while Codex sees an `AGENTS.md` [6]. Nothing imports from Factory automatically. Copy, then trim.

Automations get rebuilt. A nightly Error Triage becomes a cron trigger; a Ticket to PR flow becomes a webhook from your tracker or alerting, or a person pasting the link into Slack [7].

## Cutover

Execute in order. Each step lists its check.

1. **Open a trial account.** No payment details required; the clock runs 30 days [8]. Check: you can open web chat.
2. **Install the GitHub App.** Select only the pilot repos, not all repositories [9]. Check: in web chat, ask Jiro to list the files in one pilot repo.
3. **Connect Slack.** Create a channel such as `#jiro-pilot` and invite the bot. Check: a hello message gets a reply.
4. **Connect the model.** On your own laptop, run `claude setup-token`. Output: a token valid for twelve months, bound to the paid Claude plan you hold, whether that is Pro or Max or a Team or Enterprise seat [10]. Paste it into Jiro's Claude connection. Codex alternative: Codex OAuth, else an OpenAI key. Cursor alternative: a Cursor-issued API key [5]. Check: a one-line coding question in Slack gets a real answer.
5. **Write the org setup script.** Install runtimes, package managers and anything your tests need [11]. Check: ask Jiro to run the test suite on a pilot repo and report results. It should pass the same way it passes in CI.
6. **Write the skillset.** Move the conventions you collected into your org skillset [12]. Optional, for developers running agents locally as well: the command is `npx nori-skillsets install public/jiro`, run on their own laptops.
7. **Connect trackers.** Add Linear or Jira, and any MCP servers you need from the catalog [13] [14]. Check: Jiro can read a ticket you link.
8. **Send the first task.** Something small with an obvious right answer. Check: a pull request arrives for review [15].

Do not disable any Factory automation yet.

## First week

Feed the pilot real work, in rising order of risk.

- **Day 1.** Docs. Ask Jiro to diff the README against reality and correct whatever drifted.
- **Day 2.** Tests. Point it at a module with thin coverage and ask for the missing cases, not new features.
- **Day 3.** Cleanup. Hand it a directory full of agent slop and ask for the diff a careful teammate would leave behind.
- **Day 4.** Small tickets. Three of them, straight from the backlog, posted in the pilot channel.
- **Day 5.** On-call. Wire a webhook from CI or alerting, or schedule a cron job that checks a known flaky area each morning [7].

Log for each task: time to first PR, review rounds, and whether a reviewer had to rewrite anything. Do the same for Factory on comparable tickets. You want numbers, not vibes.

Expect pushback. Jiro will question tickets that look wrong. Record those too; they count.

## What you give up

Be honest about this before you commit.

- On-premises and air-gapped deployment through Factory Private [1].
- Delegating by assigning a Linear or Jira ticket directly to the agent [3].
- Packaged automation templates that open PRs with no prompt [2]. You rebuild these yourself.
- Factory's own model routing across vendors [16]. With Jiro you pick the harness and the plan.

What you gain, briefly: your own Claude or ChatGPT plan working in the cloud, where Factory only accepts your own keys in its CLI and desktop app [16], plus no token markup [17].

## Cost check

Compare list prices for a five-person team.

- Factory Teams: $60 a month plus $40 per seat, so $260 for five [18].
- Jiro Team: $250 monthly, five runtimes shared across the whole team [8].
- Solo: Factory Pro is $20 a month and Plus $100 [18]; Jiro Developer is $99 with up to three persistent runtimes, before your own model plan.

Jiro's price excludes model usage. You pay Anthropic or OpenAI directly, on plans many teams already hold. Heavy users may want Claude Max, at $100 or $200 a month [19]. Runtimes sleep when idle [20], so quiet weeks cost nothing extra.

## Running both

Keep Factory fully active during the pilot. Route by channel: Droid requests keep their current entry points, Jiro takes everything posted in the pilot channel. Never send the same ticket to both. Duplicate PRs waste reviewer time and spoil the comparison.

At the end of week two, review the log with the team. Pass criteria are yours to set, but write them down on day one.

## Rollback

If the pilot fails, reverse the cutover. Nothing on the Factory side changed, so there is nothing to restore.

1. Close or merge any open Jiro PRs.
2. Remove the Slack app from the pilot channel.
3. Uninstall the GitHub App or deselect the pilot repos.
4. Delete the Claude, OpenAI or Cursor credential from Jiro.
5. Let the trial lapse. No card was taken, so there is no charge.

Every session and action stays logged [21], which is useful for the post-pilot writeup either way.

Still comparing options? See the [Factory alternatives](https://jiro.bot/alternatives/factory) page.

## FAQ

### How long does a Factory to Jiro switch take?

Setup fits in an afternoon. Plan for two weeks of parallel running before you turn off any Factory automation.

### Do my Factory automations move over automatically?

No. Rebuild each one as a cron schedule or a webhook in Jiro [7]. Ticket-assignment flows from Linear or Jira need a new entry point, usually Slack.

### Can I use my Claude subscription instead of an API key?

Yes. Generate one with `claude setup-token` on your own computer; it lasts a year and is linked to your paid Claude plan [10]. Then paste it into Jiro.

### Does Jiro have an equivalent of Factory Private?

No. Jiro is hosted, with a single-tenant broker per organization [22]. If you need air-gapped or on-premises deployment, stay on Factory Private [1].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Factory Private, launched 2026-09-18, deploys Factory into a customer's VPC, on-premises or air-gapped network. Source: https://factory.com/news/factory-private (checked 2026-10-16)
2. Factory automation templates such as Ticket to PR and Error Triage open pull requests without a prompt. Source: https://docs.factory.com/software-factory/automations.md (checked 2026-10-16)
3. Droids work in the Factory App, Droid CLI, headless Droid Exec and IDEs, and take delegations from Slack, Linear and Jira. Source: https://docs.factory.com/delegations/index.md (checked 2026-10-16)
4. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
5. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
6. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
7. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
8. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
9. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
10. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
11. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
12. Nori provides the runtime around coding agents: machines, lifecycle, credentials, integrations, transcripts, checkpoints, team policy and portable skillsets. Source: https://docs.noriagentic.com/start/what-is-nori (checked 2026-10-19)
13. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
14. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
15. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
16. Factory routes across Anthropic, OpenAI and other models and accepts your own keys or local models in the CLI and desktop app, but not in the hosted web or mobile apps. Source: https://docs.factory.com/model-independence/byok.md (checked 2026-10-16)
17. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
18. Factory's plans are Pro at $20 a month, Plus at $100, Max at $200, and Teams at $60 a month plus $40 per seat for up to 10 seats; Business and Enterprise are custom. Source: https://factory.com/pricing (checked 2026-10-16)
19. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
20. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
21. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
22. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
