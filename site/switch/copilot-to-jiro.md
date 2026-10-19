# Switching from GitHub Copilot Coding Agent to Jiro (2026): A Three-Phase Admin Rollout

Updated 2026-10-19

> **How do I switch from GitHub Copilot coding agent to Jiro?**
>
> Roll out in three phases (one pilot repository, then one team, then the organization) and leave Copilot enabled until each phase meets its exit criteria. Jiro is a background coding agent by Nori. Start the free trial, scope its GitHub App to the pilot repository, connect Slack and your Claude or ChatGPT credentials, then restate copilot-instructions.md as a skillset that Nori can render back into Copilot's format for as long as you run both.

## Scope of this plan

This is written for the person who owns GitHub organization settings. It assumes a team small enough that one administrator can run the rollout, roughly five to twenty engineers, and an existing Anthropic or OpenAI plan that Jiro will run on.

Budget four weeks. Most of that is waiting for real tasks to accumulate, not configuration.

## Inventory: what migrates, what is rebuilt, what stays

**Instructions migrate, by hand.** Nori skillsets are authored once and emitted in each agent's native format, so one source yields copilot-instructions.md for GitHub's agent, a CLAUDE.md file and an AGENTS.md file elsewhere [1]. Nothing imports `.github/copilot-instructions.md` automatically, so plan an hour to split it by topic: repository-wide rules into AGENTS.md, and narrower procedures (test conventions, release steps, migration rules) into individual skills. Because the skillset can emit copilot-instructions.md again, Copilot keeps reading the same guidance during the overlap.

**Environment setup is rebuilt.** Whatever you configured for Copilot's Actions runner [2] does not transfer. Restate it as an org setup script, which prepares every Jiro environment with your dependencies [3].

**Engineering defaults can be added.** Jiro's own engineering skills install with `npx nori-skillsets install public/jiro` and sit beside yours.

**History stays behind.** Copilot sessions, issue assignments and draft PRs remain in GitHub, where they belong.

## Phase 0: administrator setup, day one

Complete these in order. Each step has one owner: you.

- **Step 1. Begin the 30-day trial.** No card is requested [4].
- **Step 2. Install the GitHub App on the pilot repository only.** Choose a selected set rather than all repositories [5]; you will widen it in phase two.
- **Step 3. Connect Slack** and invite Jiro to the pilot team's channel [6].
- **Step 4. Connect model credentials.** On your own laptop, open a terminal, run `claude setup-token` and finish the browser sign-in; the command prints a token that stays valid for a year and is bound to the Claude plan you signed in with [7]. Paste that into Jiro. Alternatives, if your organization prefers them: Codex OAuth, API keys from either vendor, or a Cursor key [8].
- **Step 5. Write the org setup script** from the runner configuration you inventoried above.
- **Step 6. Assign the first task** in the Slack channel, and read the transcript afterwards.

Exit criterion: one pull request opened by Jiro, reviewed and merged by a human.

## Phase 1: a single pilot repository, week one

Choose a repository with good tests and an owner who will review promptly. Then hand Jiro the work your team keeps deferring.

- **Monday:** have Jiro reconcile the README and onboarding docs with current behavior.
- **Tuesday:** find the three least-tested modules and propose tests for each.
- **Wednesday:** clean up one area of slop, for instance stale feature flags or a helper copied into four files.
- **Thursday:** two small tickets from the backlog, assigned in Slack.
- **Friday:** point a webhook from your CI or alerting at Jiro [9] and let it take the next on-call fix.

Watch how it behaves, not only what it ships. A good pilot shows Jiro questioning a vague ticket before writing code.

Exit criteria: at least five merged pull requests, no review escalations, and reviewers willing to continue.

## Phase 2: one team, weeks two and three

Widen the GitHub App selection to the team's repositories. Move to the Team plan so several engineers share five runtimes [4]; runtimes sleep when nobody is using them [10].

This is also when the integrations go in. Admins connect MCP servers from the catalog once for every session [11], and tools such as Linear, Jira, Notion or Stripe become available to Jiro while it works [12]. Add one recurring job on a cron schedule, for example a weekly documentation pass.

Exit criterion: the team prefers Jiro for at least one category of work.

## Phase 3: the organization, week four onward

Extend the GitHub App to all repositories, or to every repository a policy allows. Hand your security reviewer two facts: the broker serving your organization is single-tenant, on its own subdomain [13], and every session and action is logged and searchable [14].

Then decide on Copilot seats. Some teams keep them for IDE completion; others retire them.

## Permissions and review policy

Leave review policy exactly as it is. Copilot's agent opens drafts on its own branch and cannot approve or merge [15]; Jiro returns a pull request, commit or comment for your team to review [16], and your existing branch protection and required reviewers decide what merges. Do not loosen either during the pilot.

Scope is the other lever. Keep the GitHub App on a selected set until phase three.

## What leaving Copilot costs you

Be honest about the trade. Copilot starts tasks from GitHub issues, pull requests, Mobile, IDEs, the CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards [17], and Jiro does not take work from Teams or Boards. You also lose the single GitHub invoice and the runner model your platform team already understands.

What you gain is ownership of the model contract.

## Cost: seats and credits against flat runtimes

Copilot Business is $19 per user and Enterprise $39 [18], so ten engineers on Business pay $190 a month before usage, which since June 2026 is metered in AI Credits by token [19]. Jiro's Team plan is $250 a month flat, and Developer is $99 for one user [4].

The comparison is not complete without models. With Jiro you pay Anthropic or OpenAI directly (Claude Max, for instance, costs each engineer $100 or $200 monthly [20]) and Nori adds no token markup [21]. If those subscriptions already exist, the marginal cost is the plan alone.

## Running both through the pilot

Nothing forces a cutover date. Copilot's agent can keep taking issue assignments while Jiro takes Slack requests, and the shared skillset keeps both reading the same rules. Compare them on the same kind of task for a fortnight, then decide.

For the full field of options, see the [Copilot coding agent alternatives](https://jiro.bot/alternatives/copilot-coding-agent) ranking.

## FAQ

### Does Jiro import copilot-instructions.md automatically?

No. You move its contents into a skillset or AGENTS.md by hand; afterwards Nori can render that skillset back into copilot-instructions.md, alongside CLAUDE.md and AGENTS.md [1].

### Can we limit Jiro to specific repositories?

Yes. The GitHub App installs on all repositories or on a set you select [5], which is how the pilot phase is scoped.

### Can Jiro use our Claude Team or Enterprise plan?

Yes. Someone on that plan mints a token locally with `claude setup-token` [7], then connect it in Jiro; Anthropic API keys and Claude OAuth also work [8].

### Should we cancel Copilot before the pilot ends?

No. Run both until phase two's exit criterion is met; some organizations keep Copilot seats for editor completion permanently.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)
2. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
3. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
4. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
5. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
6. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
7. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
8. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
9. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
10. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
11. Nori's dashboard exposes a catalog of MCP servers that admins can connect for every session. Source: https://docs.noriagentic.com/sessions/guides/integrations#managed-mcp-servers (checked 2026-10-19)
12. Nori connects to Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe and Gmail, plus hundreds more. Source: https://noriagentic.com/#faq (checked 2026-10-19)
13. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
14. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
15. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
16. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
17. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
18. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
19. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. Source: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ (checked 2026-10-16)
20. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
21. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
