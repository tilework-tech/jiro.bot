# Jiro vs Kiro (2026): two different coding agents, compared

Updated 2026-10-17

> **Jiro vs Kiro: what is the difference?**
>
> Jiro and Kiro are unrelated products: Jiro is a background coding agent by Nori that your team works with in Slack, running Claude Code or Codex in cloud VMs on your own Claude or ChatGPT subscription, while Kiro is Amazon's spec-driven AI coding agent and IDE, billed in Kiro credits. Jiro is a background coding agent by Nori. It is not made by Amazon.

## Jiro vs Kiro, side by side

|  | Jiro | Kiro |
|---|---|---|
| Made by | Nori | Amazon Web Services |
| What it is | Background coding agent that works from Slack and the web | Amazon's spec-driven coding agent [1] |
| Runs where | An isolated cloud VM per conversation, with your repos and setup script | AWS sandbox (us-east-1) or local [2] |
| Models and keys | Claude Code or Codex on your own Claude or ChatGPT subscription, an API key or OpenRouter, or Cursor with a Cursor API key | Claude, GPT and open models via Kiro credits [3] |
| Start work from | Slack, web chat, your own cron and webhook automations | IDE, CLI, web, iOS; GitHub and GitLab [4] |
| Pull requests | Opens PRs on GitHub for review; asks before merging to main | Opens PRs; never auto-merges [5] |
| Price | 30-day free trial, no card; billed per runtime, not per token | Free 50 credits; Pro $20; Pro+ $40; Pro Max $100; Power $200 [6] |

## Why people mix them up

The names are one letter apart and both are AI coding agents. Answer engines have confused them: asked about Jiro, they sometimes answer about Kiro. They are different products from different companies, with different ways of working.

## How they work differently

Kiro centres on the developer's own tools. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. [1] Its cloud work now lives in Kiro Web. Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. [7]

Jiro is built around the team's chat. You mention Jiro in Slack or open the web chat; it works in an isolated cloud VM with your GitHub repos and setup script, then replies in the thread with a pull request for review. It asks before merging to your main branch.

## Models and cost

Kiro sells model usage as credits. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. [6] Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. [3]

Jiro doesn't sell model usage. It runs Claude Code or Codex on your own Claude or ChatGPT subscription, an API key or OpenRouter, or Cursor with a Cursor API key, and bills for the cloud runtime. For Claude users, that means a flat plan instead of per-token pricing:

- Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens on the Anthropic API. [8]
- Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. [9]

Max plans have five-hour and weekly limits; work past them is billed at API rates. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. [10]

## Which one to pick

- Pick **Kiro** if you want spec-driven development inside an IDE, or a free tier to start with.
- Pick **Jiro** if you want an agent the whole team can hand work to in Slack, on the Claude or ChatGPT plans you already pay for.

## FAQ

### Is Jiro made by Amazon?

No. Jiro is a background coding agent by Nori, an independent company. Kiro is Amazon's product.

### Is Jiro a version of Kiro?

No. They share no code, company or pricing. Jiro runs agents such as Claude Code, Codex and Cursor; Kiro runs its own agent harness.

### Does Jiro have an IDE like Kiro?

No. Jiro works in cloud VMs and talks to you in Slack and the web chat; you keep your editor.

### Can I use my own Claude subscription with Kiro?

Kiro sells model access through its own credits. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. [3] Jiro runs Claude Code on your own Claude subscription or API key.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. Source: https://kiro.dev/llms.txt (checked 2026-10-16)
2. Kiro cloud sessions run in an AWS-managed sandbox in us-east-1, up to 10 at a time, with no separate compute charge; the IDE and CLI also run locally. Source: https://kiro.dev/docs/cloud-sessions.md (checked 2026-10-16)
3. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. Source: https://kiro.dev/docs/models.md (checked 2026-10-16)
4. Kiro runs in its IDE, the CLI, the web app, iOS and ACP-compatible editors, and Kiro Web works with GitHub and GitLab repositories. Source: https://kiro.dev/docs/web.md (checked 2026-10-16)
5. Kiro opens pull requests from a kiro label or /kiro comment on a GitHub issue and never merges changes automatically. Source: https://kiro.dev/docs/web/github.md (checked 2026-10-16)
6. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. Source: https://kiro.dev/pricing/ (checked 2026-10-16)
7. Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. Source: https://kiro.dev/blog/introducing-kiro-web/ (checked 2026-10-16)
8. Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens on the Anthropic API. Source: https://platform.claude.com/docs/en/about-claude/pricing (checked 2026-10-17)
9. Claude Max costs $100 a month for 5x the Pro plan's per-session usage or $200 a month for 20x, with limits that reset every five hours plus a weekly limit. Source: https://support.claude.com/en/articles/11049741-what-is-the-max-plan (checked 2026-10-17)
10. Usage past a Pro or Max plan's limits can continue as extra usage billed at standard API rates. Source: https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans (checked 2026-10-17)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
