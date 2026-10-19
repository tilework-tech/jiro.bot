# Switching from Cursor to Jiro (2026): Every Workflow, Before and After

Updated 2026-10-19

> **How do I switch from Cursor to Jiro?**
>
> Keep Cursor as your editor, move cloud-agent work to Jiro one workflow at a time, and copy your Cursor rules into AGENTS.md and skills by hand. Jiro is a background coding agent by Nori. Setup takes an afternoon: start the trial, install the GitHub App, connect Slack, connect a Claude token from `claude setup-token` (or Codex, or a Cursor API key if you want Cursor's agent inside Jiro), write an org setup script, then hand over one real ticket.

## You don't have to leave Cursor

Most people who switch keep the editor open all day. What moves is the background work, the tasks you used to fire off to Cursor's Cloud Agents [1]. And if you like Cursor's agent itself, Jiro can run it: Cursor is one of the three harnesses alongside Claude Code and Codex [2], on a Cursor API key you supply [3].

So this guide is less a migration than a rearrangement. Here's each workflow, before and after.

## Workflow by workflow

**Starting a task.** Before: you opened the Cursor app, the web or iOS, or tagged Cursor in Slack, and the agent went off on its own [4]. After: you mention Jiro in a Slack thread, the web chat, Discord or a terminal [5] [6], your teammates see the thread, and Jiro may push back on the ticket first if something looks off.

**Paying for models.** Before: Premium ($30 monthly) was the entry ticket for cloud agents, with third-party model usage draining prepaid credit at list API rates [7], since custom keys only cover chat [8]. After: Claude Code and Codex bill against an Anthropic or OpenAI plan that's already on the company card, and Nori adds zero markup on tokens [9].

**Project rules.** Before: conventions lived in Cursor rules files. After: they live in AGENTS.md and skills, packaged as a skillset that Nori translates into CLAUDE.md, AGENTS.md or copilot-instructions.md depending on the agent [10]. Cursor's format is not in that list, so this part is a copy-and-edit job (details below).

**The environment.** Before: Cursor provisioned a full dev environment in its cloud or on a self-hosted worker [11]. After: every Jiro conversation gets its own cloud machine [12], prepared by one org setup script that installs your dependencies [13].

**Recurring chores.** Before: you remembered to ask. After: a cron schedule or a webhook starts the job [14], whether that's a Monday docs pass or the alert that fires at 2 a.m.

**What comes back.** Before: a polished PR, often with a screen recording attached [15]. After: a reviewable PR, a commit or a comment, back in the thread [16]. Fewer movies. More discussion in the thread.

## Porting Cursor rules, without pretending

There's no importer. Here is the manual route, which takes most teams under an hour.

- Open each rules file and sort its content into two piles: rules that apply everywhere, and procedures that apply to one kind of task.
- Put the everywhere rules in an AGENTS.md at the repository root.
- Turn each procedure (how to add a migration, how to cut a release, which test runner to use) into its own skill.
- Bundle the skills into a skillset so every Jiro session gets them. Add Jiro's own engineering skills too, via `npx nori-skillsets install public/jiro` in a terminal.
- Leave your original rules files where they are. Your editor still reads them.

Expect drift between the two copies for a while. Pick one as the source of truth and say so in the file.

## Setup in six steps

- **1. Trial.** Sign up; 30 days free, no card [17].
- **2. GitHub.** Install the GitHub App and choose which repositories Jiro can touch [18].
- **3. Slack.** Connect your workspace and invite Jiro into a channel.
- **4. Models.** For Claude, run `claude setup-token` on your laptop, sign in when the browser opens, and copy the resulting token, which is tied to your paid Claude plan and lasts a year [19]; paste it into Jiro. Codex users sign in through OAuth or paste an OpenAI key instead. For Cursor's agent, paste a Cursor API key.
- **5. Setup script.** Write the org script that installs your toolchain, so each machine boots ready.
- **6. First task.** Give it something small and real, then read the whole transcript.

## Your first week

Start with work Cursor's agent never got asked to do, because nobody had the time.

- Day one: a docs refresh, starting with whatever the README gets wrong.
- Day two: find untested branches in one important module and cover them.
- Day three: a slop sweep, removing dead code and stale feature flags in one directory.
- Day four: two small tickets you'd normally leave for a quiet Friday.
- Day five: wire a webhook from your alerting and hand Jiro the next on-call fix.

By Friday you'll know whether the push-back is useful or annoying. Usually it's both, at first.

## What you give up

Some real things. Cursor works with GitLab, Bitbucket and Azure DevOps repositories and takes requests from Microsoft Teams, Linear and an API [4]; Jiro connects to code through GitHub. The screenshot-and-video PRs are excellent, and Jiro doesn't produce them. Self-hosted workers are also a Cursor feature [11].

Where one of those matters to your team, leave that workflow with Cursor.

## What it costs

Before: at least $30 a month for Premium, plus model usage at API list price [7]. After: $99 monthly on Developer buys a single user three persistent runtimes, or $250 monthly on Team buys five shared ones for everybody [17]. Model costs go to Anthropic or OpenAI directly, often on a Claude Max plan at $100 or $200 a month you may already own [20].

For a team of six with Claude plans already paid, the after column is one flat bill.

## Running both during the pilot

This is the easy part. Keep Cursor for editing, keep its cloud agents for anything on GitLab or with a video-heavy review, and send everything Slack-shaped to Jiro. If you want an apples-to-apples test, run the same ticket through Cursor's agent inside Jiro and through Claude Code inside Jiro, then compare the diffs.

Still weighing options? The [Cursor background agents alternatives](https://jiro.bot/alternatives/cursor-background-agents) page ranks the rest of the field.

## FAQ

### Can I keep using Cursor's agent after switching?

Yes. Jiro runs the Cursor harness on your Cursor API key [3].

### Do my Cursor rules carry over automatically?

No. Copy them into AGENTS.md and skills by hand; Nori's translation covers CLAUDE.md, AGENTS.md and copilot-instructions.md, not Cursor's rule files [10].

### Do I need to cancel my Cursor plan?

Not necessarily. Many teams keep it for the editor. If you're on a legacy Pro, Pro+ or Teams plan, note that moving to Cursor's new plans is optional but permanent [21].

### How do I use my Claude subscription with Jiro?

On your laptop, `claude setup-token` creates a token for your Pro, Max, Team or Enterprise plan [19], then connect it in Jiro.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Cursor now calls its background agents Cloud Agents. Source: https://cursor.com/help/ai-features/background-agents (checked 2026-10-16)
2. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
4. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
5. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
6. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
7. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
8. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
9. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
10. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
11. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
12. In Nori, one claimed machine serves one active session within the organization's fleet. Source: https://docs.noriagentic.com/resources/faq#is-each-session-isolated (checked 2026-10-19)
13. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
14. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
15. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
16. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
17. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
18. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
19. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
20. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
21. Customers on Cursor's legacy Pro, Pro+ and Teams plans can keep them; switching to the new plans is optional but permanent. Source: https://cursor.com/docs/account/pricing/legacy-cursor-plans.md (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
