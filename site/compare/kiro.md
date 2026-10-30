# Jiro vs Kiro (2026): Two Different Coding Agents, Explained Simply

Updated 2026-10-19

> **What is the difference between Jiro and Kiro?**
>
> Jiro and Kiro are two separate products from two separate companies: Kiro is Amazon's spec-driven coding agent, and Jiro is Nori's agent that takes jobs from Slack and runs them in the cloud on a Claude or ChatGPT plan your team already owns. Jiro is a background coding agent by Nori. Kiro suits developers who want to plan in detail inside an IDE; Jiro suits small engineering teams that want routine work handed off and returned as pull requests.

## Jiro and Kiro, row by row

|  | Jiro | Kiro |
|---|---|---|
| Company | Nori | Amazon |
| What it is | Background coding agent your team messages | Amazon's spec-driven coding agent [1] |
| Where it works | Isolated cloud environment with your repos and tools [2] | AWS sandbox (us-east-1) or local [3] |
| Where you talk to it | Slack, web, Discord, terminal, schedules, webhooks [4] | IDE, CLI, web, iOS; GitHub and GitLab [5] |
| How AI usage is paid for | Your Claude/ChatGPT login or API key; Cursor key [6]; Your keys, zero token markup [7] | Claude, GPT and open models via Kiro credits [8] |
| Monthly price | Free 30-day trial; Developer $99/mo; Team $250/mo [9] | Free 50 credits; Pro $20; Pro+ $40; Pro Max $100; Power $200 [10] |
| What you get back | PRs, commits, comments for review [11] | Opens PRs; never auto-merges [12] |

Prices as of October 2026. Jiro's price does not include your Claude or ChatGPT plan.

## Are Jiro and Kiro the same company?

No. This is the most common mix-up, so it comes first.

Kiro belongs to Amazon. Jiro belongs to Nori, a much smaller company. The names sound alike by accident. There is no partnership, no shared technology, and no shared account between them.

If you were looking for Amazon's product, you want kiro.dev. If you were looking for us, you're in the right place.

## What does Kiro do, in plain terms?

Kiro is a tool that helps developers write software with AI. Its big idea is called spec-driven development. Before any code gets written, you and the AI agree on a written plan for what to build and how [1].

Think of it like an architect drawing blueprints before the builders arrive.

Developers can use it inside a code editor, at the command line, in a web browser or on an iPhone [5]. Since May 2026 there is also a web version that can work on its own in the background, though it is still labelled a preview [13].

## What does Jiro do, in plain terms?

Jiro is closer to a colleague you can send a message to. Someone on your team writes "@Jiro please fix the broken signup email" in Slack, and Jiro goes off and does it.

It works on its own computer in the cloud, which already has your company's code and tools set up [2]. When it's done, it sends back a pull request. That is simply a proposed change that a person on your team reads and approves before it goes live [11].

Nobody has to keep a laptop open. Jiro can also run on a schedule, say every Monday morning, or when another system pings it [14].

## How is paying for each one different?

This is the part buyers usually care about most.

With Kiro, you buy a Kiro plan, and AI usage comes out of Kiro's own credits [8]. Plans go from free, with 50 credits, up to $200 a month, and the background web version needs a paid plan [10].

With Jiro, you pay Nori a flat monthly fee, and the AI itself runs on an account you probably already have with Anthropic (Claude) or OpenAI (ChatGPT) [6]. Nori doesn't add a markup to that usage [7]. The fee is $99 a month for one person or $250 a month for a team, after a 30-day free trial that doesn't ask for a card [9].

So which is cheaper? For one developer who just wants an AI helper in their editor, Kiro's $20 Pro plan will usually cost less than Jiro plus a Claude subscription. For a team of ten that already pays for Claude, adding Jiro can be cheaper than buying everyone a second AI plan, because you aren't paying for the same models twice.

## Which one is better at what?

Kiro is stronger when:

- the work is large and needs careful planning first;
- a developer wants to stay inside a code editor all day;
- you'd rather buy AI usage from one place and not manage separate model accounts.

Jiro is stronger when:

- the work is a steady stream of small jobs, like fixing bugs, writing docs or filling in missing tests;
- your team already talks in Slack and wants to hand work off there;
- you already pay for Claude or ChatGPT and want to use that plan rather than buy credits elsewhere;
- you want to switch between Claude Code, Codex and Cursor without changing tools [15].

## Who should buy which?

Pick Kiro if you are a developer, or a team of developers, who wants a structured planning process built into the tools you code in, and you're comfortable with Amazon as the vendor.

Pick Jiro if you lead a small engineering group, roughly five to twenty people, that already pays for Claude or ChatGPT and keeps running out of hours for the small stuff.

A real example helps here. At Miravoice, a Nori customer, the agent now produces over a quarter of the pull requests that get merged [16]. They got it running from their phones [17].

## FAQ

### Is Jiro made by Amazon?

No. Kiro is made by Amazon. Jiro is made by Nori. This site also has no connection to any other software that happens to be called Jiro.

### Is Jiro a version of Kiro, or the other way around?

Neither. They were built separately, they work differently, and you'd sign up for each one on its own.

### What is a background coding agent?

It's an AI helper that works on code while you do something else. You describe the job, it goes away and does it on a computer in the cloud, and later you get back a finished change to check. Jiro works this way, and Kiro Web added a similar background mode in 2026 [13].

### Which AI models can each one use?

Kiro offers Claude, GPT-5.6 and some open models, all paid through Kiro [8]. Jiro runs three popular coding tools, Claude Code, Codex and Cursor, which use Anthropic, OpenAI and Cursor accounts respectively [15].

### Can I use both at the same time?

Yes. Some developers could plan bigger features in Kiro and let Jiro pick up small tickets from Slack. They don't share accounts or settings, so you'd set each up separately.

### Do I need to be technical to use Jiro?

Someone technical should do the initial setup, which means connecting your GitHub code and your AI account. After that, anyone on the team can ask for work in plain English in Slack, and an engineer reviews the result before it ships.

### Does Kiro let me use my existing Claude subscription?

Kiro sells model access through its own credits, and its terms don't allow sending its requests through other tools [8]. Jiro is built the other way round: your Claude or ChatGPT plan is the engine.

### Which is safer for company code?

Both open proposed changes for a human to review rather than shipping straight to production; Kiro, for example, won't merge its own changes [12]. Jiro gives each company its own separate setup [18] and keeps a log of every action it takes [19].

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Kiro is Amazon's AI coding agent, built around one agent harness across the IDE, CLI, web and mobile, with spec-driven development as its signature workflow. Source: https://kiro.dev/llms.txt (checked 2026-10-16)
2. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
3. Kiro cloud sessions run in an AWS-managed sandbox in us-east-1, up to 10 at a time, with no separate compute charge; the IDE and CLI also run locally. Source: https://kiro.dev/docs/cloud-sessions.md (checked 2026-10-16)
4. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
5. Kiro runs in its IDE, the CLI, the web app, iOS and ACP-compatible editors, and Kiro Web works with GitHub and GitLab repositories. Source: https://kiro.dev/docs/web.md (checked 2026-10-16)
6. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
7. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
8. Kiro offers Claude, GPT-5.6 and open-weight models through its own credits, and its terms prohibit routing requests through third-party harnesses. Source: https://kiro.dev/docs/models.md (checked 2026-10-16)
9. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
10. Kiro's plans are Free (50 credits a month), Pro at $20, Pro+ at $40, Pro Max at $100 and Power at $200 a month, with extra credits at $0.04 each; Kiro Web needs a paid plan. Source: https://kiro.dev/pricing/ (checked 2026-10-16)
11. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
12. Kiro opens pull requests from a kiro label or /kiro comment on a GitHub issue and never merges changes automatically. Source: https://kiro.dev/docs/web/github.md (checked 2026-10-16)
13. Kiro Web launched in preview on 2026-05-18 with an Autonomous toggle, folding in the Kiro autonomous agent announced at re:Invent 2025. Source: https://kiro.dev/blog/introducing-kiro-web/ (checked 2026-10-16)
14. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
15. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
16. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
17. The Miravoice team set up an agent entirely in the cloud from their phones. Source: https://noriagentic.com/#miravoice-story (checked 2026-10-19)
18. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
19. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
