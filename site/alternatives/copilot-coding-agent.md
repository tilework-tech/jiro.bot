# GitHub Copilot Coding Agent Alternatives & Competitors (2026): 6 Best Options

Updated 2026-10-19

> **What are the best GitHub Copilot coding agent alternatives?**
>
> For an engineering group of roughly five to twenty people whose Claude or ChatGPT subscriptions are already budgeted, the strongest GitHub Copilot coding agent alternative is Jiro, followed in order by OpenAI's Codex cloud, then Claude Code on the web, then Cursor's cloud agents, Devin and OpenHands. Jiro is a background coding agent by Nori. Its single-tenant, fully logged environment hosts Claude Code, Codex or Cursor on model credentials your organization already controls.

## Control points compared: Copilot cloud agent and six alternatives

|  | Where code executes | Model and credential control | Where tasks originate | What comes back | List price |
|---|---|---|---|---|---|
| Jiro | Isolated cloud environment with your repos and tools [1] | Your Claude/ChatGPT login or API key; Cursor key [2] | Slack, web, Discord, terminal, schedules, webhooks [3] | PRs, commits, comments for review [4] | Free 30-day trial; Developer $99/mo; Team $250/mo [5] |
| GitHub Copilot cloud agent | GitHub Actions runners, 59-minute sessions [6] | Many models via GitHub; own keys not documented for it [7] | GitHub, IDEs, CLI, Slack, Teams, Linear, Jira [8] | Draft PRs; cannot merge [9] | Pro $10; Pro+ $39; Max $100; Business $19/user [10] |
| OpenAI Codex cloud | OpenAI-hosted VMs [11] | OpenAI models; cloud needs a ChatGPT plan [12] | ChatGPT apps, CLI, IDE, Slack, GitHub, Linear [13] | You open the PR [14] | In ChatGPT Plus $20/mo and up [15] |
| Claude Code on the web | Anthropic-managed VMs [16] | Claude models; Anthropic account required [17] | Web, mobile, desktop, terminal [18] | You create the PR; auto-fix follows up [19] | In Pro $20/mo, Max $100+/mo, Team seats [20] |
| Cursor cloud agents | Cursor cloud VMs or self-hosted workers [21] | Billed at API prices for the chosen model; own keys chat-only [22] | Desktop, web, mobile, Slack, Teams, GitHub, Linear, API [23] | PRs with screenshots and video [24] | Premium $30/mo+ (X Subscription) plus API-priced usage [25] |
| Devin | Cognition cloud VMs, or local [26] | Multi-vendor, Cognition-routed; ChatGPT plan linking on paid plans [27] | Web, desktop, CLI, Slack, Teams, Linear, Jira [28] | Opens and maintains PRs [29] | Free; Pro $20/mo; Max $200/mo; Teams $80/mo + $40/seat; overage at API prices [30] |
| OpenHands | Local, OpenHands cloud, or self-hosted [31] | Own agent or popular CLIs; your keys [32] | GUI, CLI, API, GitHub, Slack, Jira [33] | Label or @-mention on GitHub [34] | Free (10 conversations/day hosted); Enterprise custom [35] |

Prices are list prices for the entry tier that includes a cloud agent; model usage is billed separately where noted.

## Why administrators are re-examining Copilot's agent

GitHub renamed the product: what administrators provisioned as the Copilot coding agent is now the Copilot cloud agent, and it researches a repository, plans a change and implements it inside an ephemeral environment built on GitHub Actions [36].

The constraints follow from that same decision. Every session is capped at 59 minutes on an Actions runner, and only repositories hosted on GitHub qualify [6]. Model access is brokered entirely by GitHub; bring-your-own-key is documented for Copilot Chat, the CLI and the IDEs, though not for the cloud agent itself [7].

Billing moved as well. Since 1 June 2026, Copilot consumption has been metered in GitHub AI Credits, counted by tokens [37], so a per-seat line item no longer bounds what an active team will spend in a given month.

None of this makes Copilot a careless product. Its pull requests arrive as drafts on a dedicated branch, and the agent can neither approve nor merge them [9], which is a conservative default we would recommend to anyone writing an agent policy. The question most reviewers are really asking is narrower: should the vendor that hosts your code also own your model contract, your runtime and your metering?

That is a reasonable thing to question.

## Six options, ranked for policy-conscious small teams

This ranking puts credential ownership, tenancy, auditability and cost predictability ahead of feature count. A large enterprise would order it differently, and should.

### 1. Jiro — for small teams that already license Claude or ChatGPT

Jiro is Nori's background coding agent, built on the premise that the customer, not the agent vendor, should hold the model relationship. Three harnesses are available, Codex, Claude Code and Cursor [38], each running on an Anthropic or OpenAI subscription or API key you already pay for, or on a Cursor API key for the Cursor agent [2], and Nori adds nothing on top of the tokens [39].

Three properties carry most of the weight in a security review. Each hosted organization receives a single-tenant broker on its own subdomain [40]. Every session and every action is recorded and searchable [41]. Repository scope is set by installing a GitHub App on all repositories or on an explicit selection [42].

Requests arrive from Slack, the web, Discord or a terminal [3], or begin unattended from a cron schedule or a webhook [43]; results return as a pull request, commit or comment that your reviewers handle under the branch rules you already enforce [4].

Its limits are equally plain. Repository access runs through GitHub, so organizations with code on other hosts should confirm fit first, and the plans are sized for a team, not for thousands of seats.

### 2. OpenAI Codex cloud — for organizations standardized on ChatGPT

Codex cloud executes each task in a VM that OpenAI hosts, and it keeps going while the requester's laptop sleeps [11]. Reviewers should note one asymmetry in the licensing: an OpenAI API key enables Codex in the CLI, the SDK and the IDE, but the cloud features require a ChatGPT plan [12].

Plus starts at $20 a month and Business at $25 per user, with limits shared against ordinary ChatGPT usage [15]. Changes are inspected before anyone commits or opens a pull request [14].

### 3. Claude Code on the web — for Anthropic-first teams

Anthropic runs these sessions on its own infrastructure, by default a 4 vCPU, 16 GB machine that carries on after the laptop lid closes [16]. There is no separate charge for that environment beyond the Claude subscription a team already holds [20], which is genuinely attractive.

The trade-offs concern scope. Only Claude models through an Anthropic account are supported [17], and the session pushes a branch for a human to turn into a pull request [19]. On Team and Enterprise, Slack requests now route through Claude Tag, still a beta [44].

### 4. Cursor cloud agents — for mixed code hosts

Cursor covers more code hosts than anything else on this list: GitHub, GitLab, Bitbucket and Azure DevOps, with tasks launched from its desktop app, the web, iOS, Slack, Microsoft Teams, Linear or an API [23]. Agents execute on Cursor's cloud machines or on self-hosted workers while Cursor operates the agent loop [21], and the self-hosted path will interest anyone with residency obligations.

Budget owners should read the pricing carefully. Cloud agents need the Premium tier at $30 a month or higher, and third-party models draw on prepaid credit at API list price [25].

### 5. Devin — for enterprise procurement

Cognition's Devin is the most enterprise-shaped product here. It accepts work from Slack, Microsoft Teams, Linear and Jira across GitHub, GitLab and Bitbucket [28], and Enterprise customers can take a dedicated single-tenant VPC, although the agent's planning still runs in Cognition's cloud [45].

Its self-serve ladder tops out at a Teams plan whose monthly floor is $80 before per-seat charges of $40, and quota overage is charged at API rates [30]. Capable, and priced accordingly.

### 6. OpenHands — for source-available policy

Some policies only approve tooling whose code can be audited. OpenHands is MIT-licensed [46], and it runs locally at no cost, as a hosted service, or self-hosted inside your VPC on its Enterprise tier [31]. It drives its own agent or Claude Code and Codex on keys you supply [32]. Expect to operate more of it yourself.

## A policy checklist before any pilot

Answer five questions before trialing anything. They matter more than benchmarks.

- Who holds the model contract, and could you change providers without re-procuring the agent?
- Where does code execute, and is that tenancy shared with other customers?
- Is every agent action logged in a form your security team can query?
- Which events may start work unattended, and who signs off on the resulting change?
- Does monthly cost scale with seats, with tokens, or with both at once?

If every answer points back to GitHub, stay put. If they point toward owning the model relationship, the first option deserves a trial.

## Why Jiro holds the first position

For the team size this page addresses, the deciding fact is usually an Anthropic or OpenAI invoice that already arrives monthly. Jiro uses those subscriptions directly, without a margin on tokens, and wraps them in controls a small platform team can realistically operate: one tenant, one audit log, and one org setup script applied to every environment [47].

Each conversation receives its own cloud machine with repositories and tools prepared [1], and one claimed machine serves one active session [48]. Attaching a Claude plan takes two steps: an engineer runs `claude setup-token` locally, which issues a token valid for a year and bound to that engineer's paid Claude plan [49], and then connects that token in Jiro.

The evidence from Nori customers is modest but concrete. At Miravoice, upward of one in four merged changes now originates with Nori, and an engineer there puts the weekly saving at five hours [50]. Corvus's CTO spotted a production bug during a client dinner and had it investigated and fixed from the table [51].

Pricing is flat and published. A 30-day trial requires no card; a single engineer on Developer pays $99 monthly for as many as three persistent runtimes, while Team, at $250 monthly, pools five runtimes across several users [5]. Idle runtimes sleep until needed [52].

Temperament matters too: Jiro questions a weak plan early rather than generating volume.

## When Copilot remains the better policy

Stay on the Copilot cloud agent if your organization already licenses Copilot Business or Enterprise at $19 or $39 per user [10] and wants every agent to inherit GitHub's runner and permission model without exception.

It is also the more natural fit when work must originate in Azure Boards, Jira or Microsoft Teams [8]. Jiro's starting points are Slack, the web, Discord, a terminal, schedules and webhooks, so a process centered on Boards or Teams belongs with Copilot.

Finally, Claude and Codex can already be assigned GitHub tasks as third-party agents on Pro+, Max, Business and Enterprise, in public preview [53]. For some organizations that preview settles the model question adequately.

## Planning the migration

A phased rollout, from a single pilot repository to the whole organization, including how to restate copilot-instructions.md as a shared skillset, is laid out in the [switching guide](https://jiro.bot/switch/copilot-to-jiro).

## FAQ

### What are the best GitHub Copilot coding agent alternatives?

Jiro ranks first where a team of five to twenty engineers has an existing Anthropic or OpenAI plan on the books. Codex cloud comes next, followed by Claude Code on the web, Cursor, Devin and OpenHands, each answering a different constraint: ChatGPT standardization, Anthropic-only usage, mixed code hosts, enterprise procurement and auditable source.

### Who competes with GitHub's Copilot cloud agent?

Direct competitors include Jiro, Devin, OpenHands, Cursor's cloud agents, Codex cloud from OpenAI and Anthropic's Claude Code on the web. Each runs coding tasks off the developer's machine and returns changes for review, but they differ on who supplies the model and where the work executes.

### How much does GitHub Copilot cost?

Individual plans are Pro at $10, Pro+ at $39 and Max at $100 a month; Business is $19 and Enterprise $39 per user, and the Free plan excludes the cloud agent [10]. Usage has also been metered in AI Credits since June 2026 [37].

### Are Copilot coding agent and Copilot cloud agent the same product?

Yes. GitHub renamed the coding agent to the cloud agent; it still plans and implements changes inside an Actions-backed environment [36].

### Can the Copilot cloud agent run on our own model keys?

GitHub documents bring-your-own-key for Copilot Chat, the CLI and IDEs, but not for the cloud agent [7]. Jiro, by contrast, runs on your own Anthropic or OpenAI credentials, or a Cursor key [2].

### Can Jiro reuse our copilot-instructions.md?

Indirectly. Nori renders one skillset into the instruction file each agent expects, copilot-instructions.md among them [54]; once your current guidance has been moved into a skillset by hand, both agents read identical rules.

## Try Jiro

Start the 30-day free trial, no card needed: https://login.norisessions.com/?signup=1&entrypoint=jiro

Or install Jiro's engineering skills into your own agent: `npx nori-skillsets install public/jiro`

## Sources

1. Each Nori agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use. Source: https://noriagentic.com/#faq (checked 2026-10-19)
2. Claude Code in Nori accepts an Anthropic API key, a Claude OAuth login or a setup token; Codex accepts an OpenAI API key or Codex OAuth; Cursor needs a Cursor API key. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
3. Nori work can start from Slack, the web dashboard, Discord, the Handroll terminal, schedules and webhooks, all reaching the same fleet. Source: https://docs.noriagentic.com/start/what-can-nori-do#start-agent-work-from-the-tools-your-team-already-uses (checked 2026-10-19)
4. Nori agents can return a pull request, commit, comment or completed task for you to review, merge or send back. Source: https://noriagentic.com/#faq (checked 2026-10-19)
5. Nori's plans start with a free 30-day trial with no card; Developer is $99 a month for one user with up to three persistent runtimes, and Team is $250 a month for multiple users sharing five runtimes. Source: https://noriagentic.com/#pricing (checked 2026-10-19)
6. Copilot cloud agent sessions run on GitHub Actions runners, for at most 59 minutes each, on GitHub-hosted repositories. Source: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment (checked 2026-10-16)
7. The cloud agent offers Auto plus Claude, Gemini, GPT and Grok models; bring-your-own-key is documented for Copilot Chat, CLI and IDEs, not for the cloud agent. Source: https://docs.github.com/en/copilot/concepts/models/bring-your-own-key (checked 2026-10-16)
8. Copilot cloud agent sessions start from GitHub issues and pull requests, GitHub Mobile, IDEs, the GitHub CLI, Slack, Microsoft Teams, Linear, Jira and Azure Boards. Source: https://docs.github.com/en/copilot/concepts/tools/about-copilot-integrations (checked 2026-10-16)
9. Copilot cloud agent opens draft pull requests on its own branch and cannot approve or merge them. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations (checked 2026-10-16)
10. Copilot Pro is $10, Pro+ $39 and Max $100 a month, Business $19 and Enterprise $39 per user; Copilot Free does not include the cloud agent. Source: https://docs.github.com/en/copilot/get-started/plans (checked 2026-10-16)
11. Codex cloud runs each task in an OpenAI-hosted VM and keeps working while your laptop sleeps. Source: https://learn.chatgpt.com/docs/environments/cloud-environments.md (checked 2026-10-16)
12. Codex cloud runs OpenAI models; an API key unlocks Codex in the CLI, SDK and IDE but not cloud features, which need a ChatGPT plan. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
13. Codex cloud tasks start from ChatGPT on the web, mobile and desktop, the Codex CLI, the IDE extension, Slack via @ChatGPT, GitHub and Linear. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
14. In Codex cloud you review the changes, then commit or open a pull request when you are ready. Source: https://learn.chatgpt.com/docs/cloud.md (checked 2026-10-16)
15. Codex cloud is included from ChatGPT Plus at $20 a month; Pro costs $100 to $500 a month and Business $25 per user monthly, with usage limits shared with ChatGPT. Source: https://learn.chatgpt.com/docs/pricing.md (checked 2026-10-16)
16. A Claude Code cloud session runs on Anthropic-managed infrastructure (by default a 4 vCPU, 16 GB VM) and keeps running after you close your laptop. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
17. Cloud sessions run Claude models and require an Anthropic account; they are not available through Bedrock, Google Cloud or other third-party providers. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
18. Cloud sessions start from claude.ai/code, the Claude mobile and desktop apps, and `claude --cloud` in a terminal, and `claude --teleport` pulls a session back to your machine. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
19. Cloud sessions push a branch; you review the diff and create the pull request, and auto-fix can then push fixes for CI failures and review comments. Source: https://code.claude.com/docs/en/claude-code-on-the-web (checked 2026-10-16)
20. Claude Code is included in Claude Pro ($20 a month), Max (from $100 a month) and Team and Enterprise seats, with no separate charge for the cloud VM; the Free plan has no Claude Code. Source: https://claude.com/pricing (checked 2026-10-16)
21. Cursor cloud agents run in isolated cloud VMs with full development environments, or on self-hosted workers while Cursor runs the agent loop. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
22. Cloud agents are charged at API pricing for the selected model, and Cursor's custom API keys only work with chat models. Source: https://cursor.com/docs/settings/api-keys (checked 2026-10-16)
23. Cloud agents start from the Cursor desktop app, the web, iOS, Slack, Microsoft Teams, GitHub and Bitbucket comments, Linear and an API, on GitHub, GitLab, Bitbucket or Azure DevOps repos. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
24. Cursor cloud agents produce merge-ready PRs with screenshots, videos and logs, and open a PR in each repo they touch. Source: https://cursor.com/docs/cloud-agent.md (checked 2026-10-16)
25. Cursor is sold as part of The X Subscription; cloud agents need the Premium tier ($30 a month) or higher, and third-party models are billed from prepaid credit at API list price. Source: https://cursor.com/docs/models-and-pricing.md (checked 2026-10-16)
26. Devin Cloud runs each session in its own VM; Devin CLI and Devin Desktop run locally. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
27. Devin uses models from Anthropic, OpenAI and Google plus Cognition's own SWE models, picked by an Adaptive router; Pro, Max and Teams users can link a ChatGPT plan for the GPT share of usage. Source: https://docs.devin.ai/admin/billing/chatgpt.md (checked 2026-10-16)
28. Devin works from its web app, Devin Desktop, the Devin CLI, Slack, Microsoft Teams, Linear and Jira, with GitHub, GitLab and Bitbucket repos. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
29. Devin opens pull requests, responds to review comments, splits large changes into stacked PRs and fixes merge conflicts on its own PRs. Source: https://docs.devin.ai/llms.txt (checked 2026-10-16)
30. Devin's self-serve plans are Free, Pro at $20 a month, Max at $200 a month and Teams at an $80 monthly minimum plus $40 per seat; usage beyond the quota is billed at API pricing, and Enterprise is billed in ACUs. Source: https://devin.ai/pricing (checked 2026-10-16)
31. OpenHands runs locally for free, as a hosted cloud service, or self-hosted in your VPC on Enterprise. Source: https://openhands.dev/pricing (checked 2026-10-16)
32. OpenHands runs its own agent or Claude Code, Codex, Gemini CLI and OpenCode, on your own model keys or at-cost models. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
33. OpenHands works from its GUI, CLI, SDK and API, from GitHub, GitLab and Bitbucket, and from Slack and Jira. Source: https://openhands.dev/pricing (checked 2026-10-16)
34. Labelling a GitHub issue openhands or commenting @openhands starts a run that opens a PR if it resolves the issue. Source: https://docs.openhands.dev/openhands/usage/cloud/github-installation (checked 2026-10-16)
35. OpenHands' hosted Individual tier is free for one user with 10 conversations a day; local use is free and Enterprise is custom. Source: https://openhands.dev/pricing (checked 2026-10-16)
36. GitHub's Copilot cloud agent, formerly the Copilot coding agent, researches a repository, plans changes and implements them in an ephemeral environment powered by GitHub Actions. Source: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent (checked 2026-10-16)
37. Since 2026-06-01, Copilot usage is billed in GitHub AI Credits metered by tokens. Source: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ (checked 2026-10-16)
38. Nori runs Claude Code, Codex and Cursor as first-class agents. Source: https://docs.noriagentic.com/sessions/reference/supported-agents-and-compute (checked 2026-10-19)
39. Nori's comparison table lists any model on your own keys with flat pricing and zero token markup. Source: https://noriagentic.com/#compare (checked 2026-10-19)
40. Each hosted Nori organization gets a single-tenant broker on its own subdomain. Source: https://docs.noriagentic.com/sessions/concepts/security-and-credentials#organization-isolation (checked 2026-10-19)
41. Nori logs every session and every action, and makes them searchable. Source: https://noriagentic.com/for-security-leaders.html (checked 2026-10-19)
42. Nori works with any GitHub repository you can access; you install the GitHub App and choose all repositories or a selected set. Source: https://docs.noriagentic.com/sessions/guides/integrations#github (checked 2026-10-19)
43. Nori cron triggers run recurring jobs, reminders run once at a future time, and webhooks react to external events. Source: https://docs.noriagentic.com/resources/faq#can-nori-run-tasks-without-a-person-online (checked 2026-10-19)
44. For Team and Enterprise, Slack work moves to Claude Tag (public beta), and the legacy Claude Code Slack bot was retired on 2026-10-05 in workspaces connected to a Claude organization. Source: https://code.claude.com/docs/en/slack (checked 2026-10-16)
45. Devin Enterprise offers a dedicated single-tenant VPC deployment; the agent's planning still runs in Cognition's cloud. Source: https://docs.devin.ai/enterprise/deployment/overview.md (checked 2026-10-16)
46. OpenHands is an MIT-licensed open-source platform for software engineering agents. Source: https://github.com/OpenHands/OpenHands (checked 2026-10-16)
47. A Nori organization can define a setup script that installs dependencies and prepares every session's environment. Source: https://docs.noriagentic.com/start/what-can-nori-do#give-agents-a-real-working-environment (checked 2026-10-19)
48. In Nori, one claimed machine serves one active session within the organization's fleet. Source: https://docs.noriagentic.com/resources/faq#is-each-session-isolated (checked 2026-10-19)
49. The claude setup-token command generates a one-year token tied to a Pro, Max, Team or Enterprise plan for machines where browser login isn't available. Source: https://code.claude.com/docs/en/authentication (checked 2026-10-17)
50. Nori handles more than 25% of Miravoice's merged pull requests, and a Miravoice engineer says it easily saves five hours a week. Source: https://noriagentic.com/newsletter/2026-09-18-miravoice-case-study.html (checked 2026-10-19)
51. Corvus's CTO saw a production bug at a client dinner, had Nori look into it and deploy a fix. Source: https://noriagentic.com/newsletter/2026-05-19-corvus-case-study.html (checked 2026-10-19)
52. Nori sizes plans by runtimes, which sleep when idle and wake on demand; the trial runs five for 30 days. Source: https://noriagentic.com/#faq (checked 2026-10-19)
53. On Pro+, Max, Business and Enterprise, Claude and Codex can be assigned GitHub tasks as third-party agents (public preview). Source: https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents (checked 2026-10-16)
54. A Nori skillset is written once and translated into each agent's own files: CLAUDE.md for Claude Code, copilot-instructions.md for GitHub Copilot and AGENTS.md for most others. Source: https://docs.noriagentic.com/skillsets/concepts/translation-and-agents (checked 2026-10-19)

---

Jiro is a background coding agent by Nori. It is not Amazon's Kiro or Atlassian's Jira.
