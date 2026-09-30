// Copy lifted from noriagentic.com (site-noriagentic components) so the scroll story
// carries the real product context. Keep in sync with Faq.tsx / Pricing.tsx.

export const LINKS = {
  start: "https://noriagentic.com/",
  demo: "https://noriagentic.com/book-a-demo.html",
  enterprise: "mailto:amol@noriagentic.com?subject=Nori%20Sessions%20Enterprise",
  github: "https://github.com/tilework-tech/nori-cli",
};

export const HERO = {
  kicker: "Counter open · 24/7",
  title: "Jiro, your AI staff engineer",
  lede: "Bring your own subscription.",
  sub: "Cloud coding agents from Nori, the infrastructure for your agent army.",
  /** The page has exactly ONE call-to-action button: the header "Reserve a seat". */
  cta: "Reserve a seat",
};

/** Sketch section 4: comparison table. y = yes, m = partly, n = no. Competitor cells are draft copy. */
export const TABLE = {
  title: "How Jiro compares",
  cols: ["Jiro", "Devin", "Factory", "Cursor Cloud"],
  rows: [
    ["Bring your own Claude / Codex / Gemini plan", "y", "n", "m", "n"],
    ["Asks clarifying questions before coding", "y", "m", "m", "n"],
    ["Proof on every PR (tests, screenshots, traces)", "y", "m", "m", "n"],
    ["Lives in Slack, web and CLI", "y", "y", "y", "m"],
    ["Waits for approval on anything outward-facing", "y", "m", "m", "m"],
    ["Opinionated about quality (anti-slop)", "y", "n", "n", "n"],
  ] as [string, string, string, string, string][],
  fine: "Competitor cells are draft copy, to be fact-checked before launch.",
};

/** Sketch section 7: the call to action before the footer. */
export const CTA = {
  title: "Pull up a stool.",
  body: "Tag @jiro in Slack, hand over the ticket, go get tea. Come back to a pull request with receipts.",
};

/** Sketch section 5: exactly the five standard FAQ questions. */
export const FAQ: { q: string; a: string; item: string }[] = [
  {
    q: "Which coding agents can I run?",
    a: "Claude Code, Codex, and Cursor. Any agent that speaks the Agent Client Protocol can be registered alongside them. Every agent runs on the same environment primitives, so you can mix agents across tasks or run several inside one workspace.",
    item: "tuna",
  },
  {
    q: "Does it work with non-engineering tools?",
    a: "Yes. Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe, and Gmail, plus hundreds more. Ops, finance, and data teams describe the work in Slack the way they would ask a teammate. No CLI and no new dashboard.",
    item: "salmon",
  },
  {
    q: "How does billing work?",
    a: "Plans are sized by runtimes. The free trial runs five for 30 days, Developer gives one user up to three persistent runtimes, and Team gives multiple users five shared ones. Runtimes sleep when idle and wake on demand.",
    item: "ikura",
  },
  {
    q: "Is the output always a pull request?",
    a: "No. A pull request, commit, comment, or completed task for you to review, merge, or send back. It can also be a file: a document, a spreadsheet, a presentation.",
    item: "maki",
  },
  {
    q: "Will Jiro just do whatever I say?",
    a: "No. He asks before he cuts: he pins down what you actually want before writing a line, and anything outward-facing waits for your go-ahead.",
    item: "onigiri-happy",
  },
];

export const PRICING = {
  title: "Pay per agent, no hidden fees.",
  plans: [
    { name: "Free trial", price: "$0", unit: "for 30 days", included: "Five runtimes and the complete team experience", cta: "Start free", href: LINKS.start, hot: true },
    { name: "Developer", price: "$99", unit: "/month", included: "One user, up to three persistent runtimes, integrations, triggers, and BYOK", cta: "Get started", href: LINKS.start },
    { name: "Team", price: "$250", unit: "/month", included: "Multiple users, five shared runtimes, organization controls, integrations, and collaboration", cta: "Get started", href: LINKS.start },
    { name: "Enterprise", price: "Let's talk", unit: "", included: "Custom capacity, role-based access control, audit trails, deployment, onboarding, and support", cta: "Talk to us", href: LINKS.enterprise },
  ],
};

export const INTEGRATIONS = ["Slack", "GitHub", "Linear", "Notion", "Google Drive", "Sentry", "Jira", "HubSpot", "Stripe", "Gmail"];
