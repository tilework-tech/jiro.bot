# Switching from Devin to Jiro (2026): Setup Steps and a First-Week Plan

Updated 2026-10-19

> **How do I switch from Devin to Jiro?**
>
> Start Jiro's free 30-day trial, install the GitHub App on the repositories Devin was using, connect Slack, sign in with your Claude plan through `claude setup-token` (or connect Codex or Cursor), add an org setup script, and give it a first small task. Jiro is a background coding agent by Nori. Devin Knowledge and playbooks do not import automatically, so plan an hour to copy the useful ones into a skillset or AGENTS.md.

## Before we start: what this page is

This is an illustrative plan, written the way a small team would actually run the move. It is not a customer story. Think of it as the notes we would want in front of us if we were the ones leaving Devin on a Monday.

The short version? Most of what matters lives in your repos, and that comes with you. The rest is a bit of copying.

## What carries over, and what we copied by hand

Repositories carry over trivially, since Jiro installs as a GitHub App and you pick all repos or a chosen set. [1] Slack carries over too; it is the same workspace with a different bot to mention.

Devin's Knowledge entries and playbooks are another matter. There is no importer. We would export the ones the team still trusts and paste them into a Nori skillset, which Jiro then writes out as CLAUDE.md for Claude Code or AGENTS.md for Codex and most others. [2] [3] If your repos already have a CLAUDE.md or AGENTS.md, the agent reads it as usual, so that part needs nothing.

The usual advice for this kind of cleanup: do not copy everything. Half of any Knowledge base is notes about a bug fixed in March.

Automations need rebuilding. Scheduled Devin sessions map onto Jiro cron triggers, and webhook ones onto Jiro webhooks. [4] [5] Sessions that Devin started from Linear or GitHub events have no direct equivalent in Jiro, so either point a webhook at Jiro or have someone mention it in Slack.

## Setup, in six steps

- **1. Open a trial account.** It lasts 30 days, asks for no card, and gives you five runtimes to play with. [6] [7]
- **2. Install the GitHub App** and select the repositories Devin had. [1]
- **3. Connect Slack** so the team can mention Jiro in channels and threads. [8] [9]
- **4. Sign in to a model.** Claude subscribers do this on their own laptop: we installed the Claude command line, ran `claude setup-token`, and copied the year-long token it printed, which is bound to whichever Claude plan the account holds. [10] Paste it into Jiro. On ChatGPT? Connect Codex OAuth or an OpenAI key. Cursor users bring their own Cursor key. [11]
- **5. Add an org setup script.** Install the toolchain, the package manager, the database client, whatever a new hire would install on day one. [12]
- **6. Hand it a first task** in Slack. Something small and checkable.

Optional but useful: `npx nori-skillsets install public/jiro` puts Jiro's own engineering skills in place.

## The first week, day by day

**Monday:** setup, then one job. We would ask Jiro to read the main repo and report the three places where docs and code disagree most. It is a cheap way to see how it reads your codebase, and the output is a pull request against the README, which nobody minds reviewing.

**Tuesday:** test gaps. Pick a module everyone is slightly afraid of and ask for tests around its public behaviour, no refactors. Review hard. This is where you learn whether its taste matches yours.

**Wednesday:** slop cleanup. Every codebase that has had agents in it has some: duplicate helpers, dead flags, comments narrating the obvious. Ask Jiro to find and remove one category of it, and to say what it chose not to touch.

**Thursday:** small tickets. Three of them, from the bottom of the backlog, the kind that sit there for a quarter. Have three people each mention Jiro on one, so the team gets used to the thread workflow.

**Friday:** an on-call fix. Wire a webhook from your CI or alerting to Jiro, or just paste the alert into Slack, and let it propose the fix as a pull request. [5] [13] Then sit down and compare the week's PRs with what Devin produced on similar work.

By Friday you know. Either the reviews felt lighter or they did not.

## What we would give up by leaving Devin

Being honest about this is the whole point of a pilot. Devin covers Microsoft Teams, GitLab and Bitbucket, and Jiro does not today. [14] Jira is not a gap; Jiro connects to it as an integration. [15] Devin opens sessions directly from Linear and GitHub events. [4] Its PR maintenance is strong: stacked PRs, conflict fixes, replies to review comments. [16] And an Enterprise buyer can get a dedicated VPC, which Nori's hosting is not. [17]

If any of those is load-bearing for you, the move costs more than a week.

## What it costs, side by side

Jiro's Developer plan is $99 a month for one person and up to three persistent runtimes; Team is $250 a month for several people sharing five. [6] Tokens come out of the Anthropic or OpenAI plans already on your card, and Nori adds nothing to them. [18]

Devin's Teams plan has an $80 monthly minimum plus $40 a seat, and usage past the quota bills at API pricing. [19]

For a team of eight that already pays for Claude, the comparison is one runtime fee against a seat bill plus overage. Without those subscriptions, add them to Jiro's side before you compare.

## Running both during the pilot

We would keep Devin on for the 30 days. Give each agent its own Slack channel so nobody tags the wrong bot, point both at the same repos, and split the week's tasks between them. Label the PRs. At the end, count merged versus closed, and ask reviewers which ones they would rather have read.

Then cancel one. Both if neither was worth it, frankly.

## FAQ

### Can Jiro import Devin Knowledge or playbooks?

Not automatically. Copy the entries worth keeping into a Nori skillset or an AGENTS.md file, and Jiro translates the skillset into each agent's own instruction file. [2]

### Do I have to use a Claude subscription?

No. Claude Code also takes an Anthropic API key, Codex takes an OpenAI key or Codex OAuth, and Cursor runs on a Cursor API key. [11]

### Why do I need to run claude setup-token myself?

Subscription sign-in happens on your own machine, where the command creates a long-lived token for your plan; Jiro's cloud machine then uses that token. [10]

### Can I set this up from my phone?

The setup lives in the cloud, and the Miravoice team did theirs from phones. [20] The `claude setup-token` step needs a computer with the Claude command line, though.

### Where can I compare other options first?

We ranked eight of them in our [Devin roundup](https://jiro.bot/alternatives/devin).

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
2. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
3. Nori provides the runtime around coding agents: machines, lifecycle, credentials, integrations, transcripts, checkpoints, team policy and portable skillsets. Source: https://docs.noriagentic.com/start/what-is-nori (checked 2026-10-19)
4. Devin Automations start sessions on schedules, webhooks, and Slack, GitHub and Linear events. Source: https://docs.devin.ai/product-guides/automations.md (checked 2026-10-16)
5. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
6. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
7. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
8. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
9. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
10. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
11. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
12. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
13. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
14. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
15. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
16. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
17. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
18. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
19. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
20. The Miravoice team set up an agent entirely in the cloud from their phones. Source: https://noriagentic.com/#miravoice-story (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
