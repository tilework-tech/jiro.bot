# Switching from Codex Cloud to Jiro (2026): What Changes on the Bill

Updated 2026-10-19

> **How do I switch from Codex cloud to Jiro?**
>
> You do not have to stop using Codex. Open a trial, add Jiro's GitHub App to your repos, connect Slack, then sign Jiro's Codex harness in with your existing ChatGPT login through Codex OAuth or with an OpenAI API key. Jiro is a background coding agent by Nori. Your AGENTS.md stays in the repo and Codex reads it as before; the bill gains one flat line, $99 or $250 a month, and nothing else.

## Here's what changes on the bill

Short version first.

- **ChatGPT subscription:** unchanged. Codex cloud lives inside ChatGPT from Plus at $20, with Business at $25 per user [1]. Keep it. Jiro signs in to it.
- **New line:** either $99 monthly (Developer: a single seat, three persistent runtimes at most) or $250 monthly (Team: several seats, five runtimes in common) [2].
- **Token markup:** zero [3]. If you use an OpenAI API key instead, OpenAI bills you directly at its rates.
- **Idle cost:** runtimes go to sleep when nobody is using them and wake on demand [4].
- **Trial:** thirty days, five runtimes, no card [4].

That is the whole delta. The rest of this memo explains what you get for it, and what you lose.

## Why the bill is worth changing

Three reasons, in order of how often teams cite them to us.

First, model independence. Codex cloud is an OpenAI-models product, and cloud tasks are reserved for ChatGPT plan holders, not bare API keys [5]. Inside Jiro, Codex accepts either Codex OAuth or an OpenAI API key, and the same environment can run Claude Code or Cursor tomorrow [6] [7]. Switching models becomes a setting rather than a purchase order.

Second, unattended work. Jiro takes cron schedules, one-off reminders and webhooks [8], so a nightly test-gap sweep or a webhook from your alerting can start a task while everyone sleeps.

Third, the review step. In Codex cloud a person reviews the diff and then commits or opens the pull request [9]. Jiro hands back the pull request itself [10]. Fewer clicks; same scrutiny.

## Three sample bills

Illustrative, using list prices from the cited pages.

- **Solo engineer on ChatGPT Plus.** Before: $20 [1]. After: $20 plus $99 on Developer. Total $119.
- **Five engineers on ChatGPT Business.** Before: $125. After: $125 plus $250 on Team. Total $375, for five shared runtimes the whole group can use from Slack.
- **Twelve engineers, half on Claude, half on ChatGPT.** Before: two separate agent tools, likely. After: both subscriptions unchanged, one Jiro Team plan at $250 running Codex for some people and Claude Code for others.

The third case is where the numbers usually work out best. Two tools become one, and the team stops arguing about which vendor to standardize on.

One caveat. Five runtimes is a ceiling on concurrent sessions for Team, so a large group running many tasks at once will feel it.

## What carries over

AGENTS.md, entirely. It is a file in your repository, so Jiro's Codex harness reads it exactly as Codex cloud did. No export, no conversion.

Rules you want across every repo, or for Claude Code too, go into a Jiro skillset; Jiro writes each skillset out in the format a given harness reads, so Claude Code receives a CLAUDE.md while Codex keeps getting AGENTS.md [11]. Codex cloud environment settings do not carry over automatically. Rewrite the install steps as Jiro's org setup script, which prepares every session's environment the same way [12].

## Migration steps

- **Step 1.** Open the Jiro trial. Free for 30 days.
- **Step 2.** Add the GitHub App; grant it only the repositories in scope for now [13].
- **Step 3.** Connect your Slack workspace, so requests and replies live in team threads [14] [15].
- **Step 4.** Connect Codex. Sign in through Codex OAuth with the ChatGPT account you already pay for, or paste an OpenAI API key.
- **Step 5.** Optional, for Claude Code as well: on your own computer, run `claude setup-token` to generate a twelve-month token linked to your Claude Pro, Max, Team or Enterprise plan [16], then add it to Jiro. Cursor needs a Cursor API key instead [6].
- **Step 6.** Port your Codex environment setup into the org setup script.
- **Step 7.** Post the first task in Slack. Keep it small.

Optional but cheap: run `npx nori-skillsets install public/jiro` to add Jiro's engineering skills.

## First-week budget of work

Spend the trial on tasks whose value you can price.

- Docs for one under-documented service. Cost of not doing it: every onboarding.
- Test coverage on the three files with the most recent bug fixes.
- A slop sweep: unused exports, duplicated utilities, stale TODOs.
- Two small tickets from the backlog that nobody has picked up in a month.
- One on-call fix, if production offers you one.

Count merged pull requests and reviewer minutes per merge. Those two numbers justify the line item or they do not.

## What you give up

Leaving Codex cloud entirely costs you some things. Weigh them.

- Starting tasks from ChatGPT's web, mobile and desktop apps, the IDE extension, and Linear [17].
- Codex Code Review, plus the Linear and GitHub hooks. All three sit on legacy infrastructure OpenAI means to retire, so this loss may arrive regardless [18].
- An agent that costs nothing extra on top of ChatGPT. Jiro is a separate fee.

Note the word "entirely". Most teams keep ChatGPT anyway.

## Pilot: run both for a month

Keep Codex cloud for anything started from ChatGPT; route Slack requests and scheduled work to Jiro. Assign each repository to one tool during the pilot to avoid conflicting branches. At month end, compare merged pull requests per dollar and how often reviewers sent work back.

If the numbers do not justify $99 or $250, cancel. The trial asks for no card, so there is nothing to claw back.

For the wider field, see the [Codex cloud alternatives ranking](https://jiro.bot/alternatives/codex-cloud).

## FAQ

### Can I keep using Codex after switching to Jiro?

Yes. Codex is one of Jiro's three harnesses, and it signs in with Codex OAuth or an OpenAI API key [6].

### Will my AGENTS.md still work?

Yes. It lives in the repository, and Codex in Jiro reads it unchanged.

### Do I still need a ChatGPT plan?

Only if you want Jiro's Codex to bill against it via Codex OAuth. With an OpenAI API key you pay OpenAI per token instead, at its standard rates, with no Jiro markup [3].

### Is Jiro cheaper than Codex cloud?

No. Codex cloud comes bundled with ChatGPT [1], and Jiro adds $99 or $250 a month [2]. The fee buys model choice, Slack and scheduled work, and pull requests returned for review.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
2. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
3. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
4. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
5. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
6. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
7. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
8. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
9. In Codex cloud you review the changes, then commit or open a pull request when you are ready. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
10. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
11. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
12. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
13. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
14. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
15. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
16. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
17. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
18. Codex Cloud (Legacy) still powers Code Review and the GitHub and Linear integrations, and OpenAI plans to deprecate it. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
