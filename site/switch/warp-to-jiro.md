# Switching from Warp to Jiro (2026): A Pairing-Session Walkthrough

Updated 2026-10-19

> **How do I switch from Warp to Jiro?**
>
> You keep the Warp terminal if you like it and move only the cloud agent work: start a Jiro trial, connect GitHub and Slack, generate a Claude token with claude setup-token (or use Codex or a Cursor key), add a setup script, and send a first small task while Warp keeps running. Jiro is a background coding agent by Nori.

## Before we touch anything

Pull up a chair. Here's the plan for the next hour.

You're not giving up your terminal. Warp's client is open source [1], and nothing about Jiro cares which emulator you type into. What moves is the cloud side: the runs Warp bills you for in agent time, inference and hosted compute [2]. Those become Jiro sessions running on the Claude or ChatGPT subscription sitting on your card statement anyway, and nobody marks up the tokens [3].

Got a coffee? Good. Let's go.

## Open a terminal

First, `cd` into one of your repos and look around. Is there an `AGENTS.md`? A `CLAUDE.md`? If so, great news: those come with you for free. They live in git, and Claude Code and Codex both read their own file when Jiro runs them.

Now think about everything else you've told Warp's agent over the months. Rules, saved prompts, the "please don't touch the migrations folder" note. None of that exports by itself. Open a scratch file and paste in the bits you still believe. Be ruthless; half of it is probably stale.

That scratch file becomes your Jiro skillset later. You write it once, and Nori turns it into the right instruction file for whichever agent is running [4].

## Get the token while you're here

Still in the terminal, run this:

`claude setup-token`

Follow its prompts and you end up with a token that lasts a year, linked to whatever paid Claude plan you're on, from Pro upward, Team and Enterprise seats included [5]. Copy it somewhere safe for the next two minutes. Treat it like a password, because it is one.

On ChatGPT instead? Skip this; you'll use Codex OAuth or an OpenAI key in a moment. Running Cursor? Grab a Cursor API key [6].

## Now the browser

Open the trial page and sign up. No card [7]. Then, in order:

1. **GitHub.** Install the GitHub App. When it asks, choose selected repositories and tick two or three, not your whole org [8]. You can widen it later.
2. **Slack.** Connect the workspace, make a channel like `#jiro`, and invite the bot. Say hi. It answers.
3. **Model.** Paste the token you just made into the Claude connection. Or sign in with Codex OAuth, or drop in your OpenAI or Cursor key [6].
4. **Setup script.** This is the part people rush, so don't. Write out what a fresh machine needs to run your tests: language runtimes, package installs, a seed database, whatever. Jiro runs it to prepare every environment [9], and each conversation gets its own machine [10].
5. **Skillset.** Take that scratch file from earlier and drop it into the org skillset [11].
6. **Integrations, if you want them.** Linear, Jira, Notion and friends [12], plus MCP servers from the catalog [13].

Want Jiro's engineering habits in your local agent too? Back in the terminal: `npx nori-skillsets install public/jiro`. Optional, but nice.

## Send the first one

Go to `#jiro` and ask for something tiny. "The README says to run `make dev` but the Makefile has no dev target. Fix whichever one is wrong."

Watch what happens. It spins up, reads the repo, maybe asks you a question back. A few minutes later there's a pull request waiting for review [14]. Read it like you'd read a colleague's. If it pushed back on your premise, that's a feature.

Nice. You're switched, mostly.

## The rest of your week

Keep Warp's cloud runs going for anything already in flight, and send new stuff to Jiro. Something like:

- **Monday.** The doc drift you've been ignoring.
- **Tuesday.** Tests for the module everyone's scared of.
- **Wednesday.** Slop cleanup. Point it at the files the last agent left messy and ask it to make them legible for the next one.
- **Thursday.** Three small tickets from the backlog, posted straight into Slack.
- **Friday.** Set a cron job for a morning check, or wire a webhook from CI or alerting so on-call breakage lands in a Jiro session before you do [15].

Jot down how many review rounds each one took. Do the same for Warp. At the end of the week you'll know.

## What you're leaving behind

Be clear-eyed about it.

Warp's own agent harness, for one; in Jiro you pick Claude Code, Codex or Cursor [16]. Warp also starts runs from GitHub, Azure DevOps, Linear and Jira events [17]. Jiro doesn't take tickets by assignment; you'll use Slack, a schedule or a webhook. And if you ran Warp's cloud agents on your own infrastructure [18], know that Jiro is hosted, single-tenant per org [19].

Your terminal, though? Untouched.

## What it costs, side by side

Say you're five people. Warp Business is $50 a user [20], so $250 a month before cloud runs, which are billed for agent time, inference and compute [2].

Jiro Team is also $250 a month, flat, and it covers the group with five shared runtimes [7]. Inference goes on the Claude or ChatGPT plans you already hold. Solo? Developer is $99. Runtimes nap when idle [21].

If someone on the team burns through Pro limits, the usual fix is a Max plan, either the $100 tier or the $200 one [22].

Comparing more than these two? The [Warp alternatives](https://jiro.bot/alternatives/warp) page ranks the field.

## FAQ

### Do I have to stop using the Warp terminal?

No. Jiro replaces the cloud agent side only. Keep whatever terminal you like; Warp's client is open source [1].

### Will my Warp rules and prompts import into Jiro?

Not automatically. Copy what you still want into your org skillset by hand. Repo files like AGENTS.md and CLAUDE.md need no copying, since they stay in git.

### Can I run Warp and Jiro at the same time?

Yes, and you should for a week or two. Leave in-flight Warp runs alone, send new work to Jiro, and never give the same ticket to both.

### What if I don't have a Claude subscription?

Use Codex with ChatGPT sign-in or an OpenAI key, an Anthropic API key, or Cursor with a Cursor API key [6].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Warp's terminal client is open source on GitHub. Source: https://github.com/warpdotdev/warp (checked 2026-10-16)
2. Warp bills a cloud run for agent time, inference and Warp-hosted compute. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
3. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
4. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
5. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
6. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
7. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
8. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
9. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
10. In Nori, one claimed machine serves one active session within the organization's fleet. Source: https://docs.noriagentic.com/resources/faq#is-each-session-isolated (checked 2026-10-19)
11. Nori provides the runtime around coding agents: machines, lifecycle, credentials, integrations, transcripts, checkpoints, team policy and portable skillsets. Source: https://docs.noriagentic.com/start/what-is-nori (checked 2026-10-19)
12. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
13. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
14. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
15. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
16. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
17. Warp cloud runs start from Slack, Linear, Jira, GitHub, Azure DevOps, schedules, the Oz CLI, the API or the web app. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
18. Warp cloud agents run on Warp-hosted compute or on your own infrastructure. Source: https://docs.warp.dev/agent-platform/cloud-agents/overview (checked 2026-10-16)
19. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
20. Warp's Terminal and Agents plans are Free, Build at $20 a month, Max at $200 and Business at $50 per user; Warp Factories also offers pay-as-you-go usage at 20% above API rates. Source: https://www.warp.dev/pricing (checked 2026-10-16)
21. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
22. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
