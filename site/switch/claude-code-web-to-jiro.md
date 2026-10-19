# Switching from Claude Code on the Web to Jiro (2026): A Note to the Team

Updated 2026-10-19

> **How do I switch from Claude Code on the web to Jiro?**
>
> Keep your Claude plan and your repo's CLAUDE.md; both come with you. Run `claude setup-token` on your own machine, connect that token in Jiro, install the GitHub App, add Jiro to Slack and write a short setup script, then hand it a small task. Jiro is a background coding agent by Nori. It's meant for small teams whose Claude or ChatGPT plans are already paid for.

## Hey, quick note before we move anything

Hey all. Here's how we move our Claude Code work into Jiro, and why it shouldn't hurt.

Short version: nothing we like about Claude Code goes away. Jiro runs Claude Code itself [1], on the same Claude subscriptions we already pay for. What changes is where the work lives. Instead of each of us kicking off cloud sessions from our own claude.ai account, the whole team asks Jiro in Slack, and the work happens on a cloud machine with our repos and tools already set up [2].

Basically: our Claude Code, minus the open laptop. Anyone's laptop.

## What comes with us

More than you'd think.

- **Our CLAUDE.md.** It's committed in the repo, so it's there on every task. No copying.
- **Your personal CLAUDE.md** (the one in your home folder). That one stays on your laptop. If there's something in it the whole team should follow, paste it into our shared skillset. Nori turns one skillset into each agent's file, CLAUDE.md for Claude Code included [3].
- **Your Claude plan.** Pro, Max, Team or Enterprise all work through a setup token [4]. More on that below.
- **The repos.** Same GitHub org. We just install a different GitHub App and pick which repos it sees [5].
- **The environment setup** we each fiddled with for cloud sessions. That becomes one org setup script that every session runs [6]. Write it once, done.
- **Tools we already wired up.** Linear, Jira, Notion and friends connect through the integrations page [7]; MCP servers come from the catalog [8].

## Setting it up

I'll do steps 1 to 3 and 5. Everyone does step 4 for themselves, with their own token. No shared logins.

- **1. Start the trial.** It's free for a month, and nobody asks for a card [9].
- **2. Hook up GitHub.** Install Jiro's GitHub App and tick the repos. I'll start with the API and the web app, nothing else.
- **3. Add Jiro to Slack.** It'll join the eng channel first.
- **4. Sign in with Claude.** Open a terminal on your laptop and type `claude setup-token`. You get back a token that's good for a year on your plan [4]. Paste it into Jiro's Claude connection. Prefer Codex? OAuth or an OpenAI key works too; Cursor wants its own Cursor key [10].
- **5. Write the setup script.** Node, our Postgres fixtures, the CLI we keep forgetting to install.
- **6. Try one small thing.** Ask Jiro to fix a typo in the README. If a pull request shows up and CI goes green [11], we're live.

Bonus round: want Jiro's engineering habits inside the Claude Code on your laptop? Paste `npx nori-skillsets install public/jiro` into a terminal.

## What I'd like us to try in week one

Boring stuff first. On purpose.

- The docs nobody has updated since the auth rewrite.
- Tests for the billing module, which has none. Yes, none.
- That pile of AI-generated helpers from last quarter that sort of duplicate each other. Let's clean them up.
- Three or four small tickets from the backlog that keep getting bumped.
- One on-call fix. If something pages us this week, let's ask Jiro first and see what it does.
- A weekly cron job that checks for stale TODOs and opens a PR [12].

Jiro is pretty opinionated. It'll push back if a plan looks off, and it'll flag stuff early. Don't take it personally. It does it to me too.

## What we give up

I want to be honest about this part.

- **Teleport.** Pulling a cloud session back to your terminal with `--teleport` is a Claude Code on the web thing [13]. Jiro work comes back as a PR instead.
- **The Claude apps.** Starting a cloud session from the Claude mobile or desktop app goes away for team work. Jiro's web chat and Slack work fine on a phone; Miravoice set their whole agent up that way [14].
- **Free cloud machines.** Anthropic includes the cloud VM in our plans [15]. Jiro's plan is a separate line.
- **Auto-fix after the PR.** Cloud sessions can push fixes for CI failures and review comments on their own [16]. With Jiro, we ask in the thread [17].
- **One vendor.** Now there are two.

If any of those is a dealbreaker for you personally, keep using claude.ai/code for your solo stuff. Nobody's taking it away.

## What it costs us

Our Claude plans stay as they are: Pro is $20 a month and Max starts at $100 [15]. Jiro sits on top. For the team, that's the Team plan at $250 a month, five runtimes we all share; Developer is $99 if it's just one person [9]. The runtimes sleep when nobody's using them [18].

Nori doesn't mark up tokens [19], so the model bill is still just our Claude bill. If someone burns through their Max limit, extra usage bills at API rates, same as today [20].

So yes, it's an extra $250. What we're buying is that the PM, the on-call person and the new hire can all start real work without a laptop session of their own.

## Running both for a bit

For the first two weeks, nothing gets switched off. Use Jiro for team work in Slack, keep claude.ai/code for whatever you do alone. At the end we'll look at what got merged and decide.

If you want to see how Jiro stacks up against the other options first, the [list of Claude Code on the web alternatives](https://jiro.bot/alternatives/claude-code-web) is a decent read. Questions? Reply in the thread.

## FAQ

### Does my CLAUDE.md work in Jiro?

Yes. A CLAUDE.md committed to the repo is part of the code Jiro checks out, and Jiro runs Claude Code, which reads it.

### Do I need an Anthropic API key, or can I use my Claude subscription?

Your subscription is fine. From a terminal on your laptop, `claude setup-token` creates the token you connect [4]. An API key also works [10].

### Can I keep using Claude Code on the web after switching?

Yes. Your Claude plan is unchanged, so claude.ai/code keeps working for solo sessions.

### What happened to the Claude Code app for Slack?

Anthropic shut the old bot down on October 5, 2026. For Team and Enterprise orgs, Slack requests are Claude Tag's job now [21].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
2. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
3. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
4. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
5. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
6. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
7. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
8. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
9. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
10. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
11. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
12. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
13. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
14. The Miravoice team set up an agent entirely in the cloud from their phones. Source: https://noriagentic.com/#miravoice-story (checked 2026-10-19)
15. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
16. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
17. Mention Nori's bot in a Slack channel to start a session; it replies in a thread, and every reply in that thread continues the same session. Source: https://docs.noriagentic.com/sessions/guides/slack (checked 2026-10-19)
18. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
19. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
20. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. Source: https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans (checked 2026-10-17)
21. For Team and Enterprise, Slack work moves to Claude Tag (public beta), and the legacy Claude Code Slack bot was retired on 2026-10-05 in workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-16)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
