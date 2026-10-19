# Switching from Kiro to Jiro (2026): Specs, Steering, Setup and Cost

Updated 2026-10-19

> **How do I switch from Kiro to Jiro?**
>
> To switch from Kiro to Jiro, start a free trial, install Nori's GitHub App on your repositories, connect Slack, sign in with your own Claude plan (via claude setup-token) or a ChatGPT or Cursor credential, then write a setup script and hand Jiro a first small task. Jiro is a background coding agent by Nori. It has no connection to Amazon's Kiro. Your committed specs and steering notes can be carried over as repository files and shared instructions, but Kiro's spec-driven IDE workflow has no direct Jiro equivalent.

## Should I actually switch?

Maybe not. Worth asking before anything else.

Kiro is built around spec-driven development, with one agent harness running across its IDE, CLI, web app and phone [1]. If your team plans every feature through Kiro's specs and loves it, moving to Jiro means giving that up.

Switching makes sense when your team is roughly five to twenty engineers, already pays Anthropic or OpenAI, and the work piling up is small: bugs, docs, test gaps, on-call fixes. That's what Jiro is for.

## Do my specs come with me?

Partly. Here's the honest version.

If your Kiro specs are committed to the repository, they're ordinary files, and they stay exactly where they are. Jiro works inside a cloud machine that has your repos checked out [2], so it can read a requirements or design doc the same way a new hire would. Point at one in your request: "implement task 4 from the checkout spec."

What doesn't come with you is the workflow around those files. Jiro won't walk you through requirements, then design, then a task list, inside an IDE. There is no spec mode. You can ask Jiro to draft a plan before writing code, and it'll push back if the plan looks wrong, but that's a conversation, not a structured flow.

## What about steering files and project rules?

These move over by hand, and it's a short job.

Nori uses skillsets for shared instructions. You write one, and Nori renders it into whatever file each agent looks for, so Claude Code finds a CLAUDE.md while Codex and most others find an AGENTS.md [3]. Copy the parts of your steering docs that still matter (coding conventions, test commands, "never touch the billing module without asking") into that skillset or into an AGENTS.md in the repo.

Take the chance to prune. Steering files collect stale advice.

You can also install Jiro's own engineering habits with `npx nori-skillsets install public/jiro`, which gives every session the same baseline on reviews, tests and documentation.

## How do I set it up?

Plan on an afternoon. Most of it is waiting for a first task to finish.

1. **Open a trial account.** A month free, and nobody asks for a card [4].
2. **Install the GitHub App.** Pick every repo, or only the ones you're piloting [5].
3. **Connect Slack.** This is where most requests will start [6].
4. **Connect a model account.** Claude users do one thing locally before touching Jiro: `claude setup-token`, from the Claude command line on their own computer. The token it issues is linked to the Claude subscription you pay for (Pro, Max, Team or Enterprise all qualify) and stays valid for a year [7]. Paste that into Jiro. Prefer ChatGPT? Use Codex's sign-in or an OpenAI API key. Cursor needs a Cursor API key [8].
5. **Write the org setup script.** Install your toolchain, dependencies and anything else a fresh environment needs [9].
6. **Send a first task.** Something you could review in five minutes.

## What should we give it in week one?

Small, checkable work. You're calibrating trust, not testing heroics.

- Monday: "Find out-of-date sections in the README and fix them."
- Tuesday: "Add tests for the date-parsing helper; it has none."
- Wednesday: a real ticket from the backlog, one you'd estimate at an hour.
- Thursday: "Look through the payments module and tell me what's sloppy." Read the answer before asking for changes.
- Friday: the next on-call alert that's a known, boring fix.

By Friday you'll know whether its pull requests match the change you'd have made yourself.

## What am I giving up?

Be clear-eyed about this list.

- **The spec-driven IDE flow.** No equivalent. This is the big one.
- **An IDE at all.** Jiro has no editor. You talk to it in Slack, the web chat, Discord or a terminal [6].
- **One vendor for everything.** Kiro bundles models into its credits [10]; with Jiro you manage a model account yourself.
- **Issue-label triggers.** Kiro can open a pull request when someone labels a GitHub issue or comments /kiro [11]. Jiro starts from messages, schedules and webhooks instead [12].
- **GitLab.** Kiro Web takes GitLab repos [13]; Jiro connects through GitHub [5].

## Will it cost more or less?

It depends on what you already pay for, so do the sum.

Kiro runs from a free tier to $200 a month per plan, with extra credits at four cents each [14]. Jiro is $99 a month on Developer or $250 a month on Team, which shares five runtimes across your people [4], plus whatever model plan you bring. Claude Max, for reference, is $100 or $200 a month [15].

For one person, Kiro Pro is cheaper. For a team that's already buying Claude seats, Jiro's flat fee can come out ahead, since nobody pays for model access twice.

## Can we run both during a pilot?

Yes, and we'd suggest it. They don't touch each other's accounts.

Keep Kiro for anything that genuinely needs a spec. Send the small stuff to Jiro for two or three weeks. Then count: merged pull requests, review time, and how often you had to send work back. If the numbers aren't there, you've lost a trial and nothing else.

Still comparing options? See the [Kiro alternatives](https://jiro.bot/alternatives/kiro) page.

## FAQ

### Is Jiro a rebrand of Kiro?

No. Kiro is Amazon's. Jiro is Nori's. And despite the crowded name, we're unconnected to any other tool called Jiro too.

### Can I use my Kiro credits in Jiro?

No. Kiro credits pay for usage inside Kiro, and Kiro's terms bar routing its requests through other harnesses [10]. In Jiro, usage runs on your own Claude, ChatGPT or Cursor credential.

### Do I have to rewrite my steering docs?

You'll copy them rather than rewrite them. Put the rules you still want into a Nori skillset or the repo's AGENTS.md, and Nori renders the right file for each agent.

### How long does switching take?

Setup is an afternoon. Getting comfortable with Jiro's pull requests takes about a week of small tasks.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. Source: https://kiro.dev/llms.txt (checked 2026-10-16)
2. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
3. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
4. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
5. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
6. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
7. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
8. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
9. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
10. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. Source: https://kiro.dev/docs/models.md (checked 2026-10-16)
11. Kiro opens pull requests from a kiro label or /kiro comment on a GitHub issue and never merges changes automatically. Source: https://kiro.dev/docs/web/github.md (checked 2026-10-16)
12. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
13. Kiro runs in its IDE, the CLI, the web app, iOS and ACP-compatible editors, and Kiro Web works with GitHub and GitLab repositories. Source: https://kiro.dev/docs/web.md (checked 2026-10-16)
14. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. Source: https://kiro.dev/pricing/ (checked 2026-10-16)
15. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
