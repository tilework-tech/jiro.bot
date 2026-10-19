# Switching from Amp to Jiro (2026): Checklist, Gotchas and a Review-First Setup

Updated 2026-10-19

> **How do I switch from Amp to Jiro?**
>
> Keep your AGENTS.md in the repo, start a Jiro trial, install the GitHub App on the repos you want, connect Slack, then link your Claude plan with `claude setup-token` or your ChatGPT plan with Codex OAuth. Jiro is a background coding agent by Nori. Before the first task, turn on branch protection, because Jiro hands work back as pull requests for review rather than pushing to your base branch.

## Before you touch anything

Read this list once. Then start.

- **Gotcha:** Out of the box, a green test run in Amp is followed by Ship landing the change on your base branch [1]. Your team may have grown used to changes simply appearing on main. In Jiro they arrive as pull requests, so somebody has to own review from day one.
- **Gotcha:** Claude plan access does not transfer between tools. Amp reaches your Claude Pro or Max plan through the Agent SDK [2]; Jiro needs its own token, generated on your laptop.
- **Gotcha:** if any Amp threads are still running in orbs, let them finish or ship them first. They will not migrate.
- Pick one or two repositories for the pilot. Not all of them.

## What comes with you

Your AGENTS.md comes along for free. It lives in the repository, not in Amp, so Jiro sees it on the first clone; Codex reads it as-is.

Team-wide rules you want everywhere, across repos, belong in a Jiro skillset instead. You write a skillset one time; Jiro renders it into whatever file each harness expects: CLAUDE.md for Claude Code, AGENTS.md for most others [3]. Move anything that used to live only in someone's Amp thread history by hand. Nothing imports it automatically, and we would rather say so now.

Want Jiro's engineering habits in your own repos too? `npx nori-skillsets install public/jiro` adds them.

## Setup, step by step

- **Step 1: Open a trial account.** It runs a month and asks for no payment details [4].
- **Step 2: Install the GitHub App.** Choose every repository or just the pilot set [5]. Choose the pilot set.
- **Step 3: Protect the branch.** In GitHub, require a pull request and at least one approving review on main for each pilot repo. Do this before step 6. Seriously.
- **Step 4: Connect Slack.** Requests and replies then sit in threads your whole team can read [6] [7].
- **Step 5: Connect a model.** For Claude, open a terminal on your own machine and run `claude setup-token`. Out comes a token good for twelve months and bound to the Claude subscription you already pay for, be it Pro, Max, Team or Enterprise [8]. Copy it into Jiro. For ChatGPT, sign in through Codex OAuth or add an OpenAI API key; Cursor takes a Cursor API key [9].
- **Step 6: Write the org setup script.** Install runtimes, dependencies and CLIs once, and every session's environment starts ready [10].
- **Step 7: Hand over a first task.** Something small and verifiable, posted in a Slack thread.

**Gotcha:** run step 5 on your own computer, not inside Jiro. The token exists for machines that cannot open a browser login, and Jiro's cloud environments are exactly that kind of machine.

## Set up the review flow properly

This is the part teams skip. Do not skip it.

Decide who reviews agent pull requests, and say so in the repo's CODEOWNERS file if you use one. Agree on what earns an approve versus a request for changes. Then tell Jiro, in the skillset, what your reviewers care about: test coverage on touched code, naming, no drive-by refactors. It flags missteps early and will push back on a vague ticket, which works best when reviewers and agent share the same bar.

One more thing. Reply to its pull requests the way you would reply to a colleague's. Specific comments get specific fixes.

## A first week that tells you something

- **Monday:** ask Jiro to read one pilot repo and propose three improvements it would make first. Judge its taste before its speed.
- **Tuesday:** a documentation pass on the module nobody wants to explain.
- **Wednesday:** fill test gaps around a recently changed file.
- **Thursday:** clean up slop, such as dead flags, duplicated helpers or copy-pasted error handling.
- **Friday:** one small ticket from the backlog, plus a scheduled job for next week [11].

If something breaks in production that week, try the on-call fix from Slack. That is where background agents earn their keep.

## What you give up

Be honest with yourself about these.

- Native macOS and iOS apps and an SDK [12]. In Jiro you work from Slack, Discord, the browser or a terminal, and timers or webhooks can kick things off too [6].
- Choosing a machine size per thread and paying for it by the minute [13].
- A free tier for keeps. Amp's Hobby plan stays free with your own runners [14]; Jiro's trial ends after thirty days.
- Ship-to-main convenience. You traded it for review on purpose.

## Cost check

Amp: Hobby free, Megawatt $20 and Gigawatt $200 a month, plus orb minutes where the plan does not cover them [14] [13].

Jiro: $99 a month on Developer for a single engineer and up to three persistent runtimes; $250 a month on Team for several people sharing five [4]. Runtimes sleep when idle [15], and your Claude or ChatGPT bill is unchanged, because Jiro takes no cut of tokens [16].

**Gotcha:** for a single developer on Megawatt, Jiro costs more. The case for paying it is shared runtimes, Slack threads the whole team sees and work that comes back as a pull request for review, not a lower invoice.

## Running both during the pilot

Nothing stops you keeping Amp for a few weeks. Split work by repository, never by task, so two agents are not editing the same branch. Turn on Push to Branch in Amp for the overlap period [1], which puts both tools behind the same review gate and makes the comparison fair.

Compare merged pull requests, review rounds per change and how often a reviewer had to rewrite something. Ignore raw volume.

Still deciding? The [Amp alternatives comparison](https://jiro.bot/alternatives/amp) lays out the other options.

## FAQ

### Will my AGENTS.md work in Jiro?

Yes. It stays in the repository, so Jiro picks it up on clone. Rules shared across repos can go into a skillset, which Jiro translates into CLAUDE.md or AGENTS.md per harness [3].

### Can I use the same Claude Max plan I used with Amp?

Yes, with a new token. Run `claude setup-token` locally [8] and connect the result in Jiro.

### Does Jiro land changes on main like Amp's Ship?

Jiro's normal output is a pull request (sometimes a commit or comment) that your team reviews [17]. Enforce that with GitHub branch protection on main, so changes only land through review.

### Is our code kept apart from other Jiro customers?

Each organization runs on its own single-tenant broker [18], one machine serves one active session [19], and every action is logged [20].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Amp's default Ship pushes straight to the base branch after tests; the Push to Branch setting opens a pull request instead. Source: https://ampcode.com/docs/markdown/orbs/shipping (checked 2026-10-16)
2. Amp added Claude Pro and Max subscription support through the Claude Agent SDK on 2026-10-10. Source: https://ampcode.com/news/use-your-claude-plan (checked 2026-10-16)
3. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
4. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
5. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
6. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
7. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
8. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
9. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
10. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
11. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
12. Amp runs from its web app, macOS and iOS apps, the CLI, a GitHub App, SDKs and Slack via @Amp. Source: https://ampcode.com/llms.txt (checked 2026-10-16)
13. Orbs are billed per minute, from $0.08 an hour for the smallest size. Source: https://ampcode.com/docs/markdown/orbs/sizes-and-costs (checked 2026-10-16)
14. Amp's Hobby tier is free with pay-as-you-go orbs or your own runners; Megawatt is $20 a month and Gigawatt $200 a month with included orb time and agent usage. Source: https://ampcode.com/pricing (checked 2026-10-16)
15. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
16. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
17. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
18. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
19. In Nori, one claimed machine serves one active session within the organization's fleet. Source: https://docs.noriagentic.com/resources/faq#is-each-session-isolated (checked 2026-10-19)
20. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
