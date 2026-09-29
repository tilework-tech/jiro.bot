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
  lede: "Cloud coding agents from Nori, the infrastructure for your agent army. Bring your own subscription.",
  primary: "Get started for free",
  secondary: "Book a demo",
};

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
    q: "What does an agent's environment look like?",
    a: "Each agent works in an isolated cloud environment with your repository, tools, dependencies, and services ready to use.",
    item: "tamago",
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
    q: "What repositories can I use?",
    a: "Any GitHub repository you have access to. Connect your GitHub account and select which repos to enable.",
    item: "ebi",
  },
  {
    q: "Is Jiro a real sushi chef?",
    a: "Jiro is a real staff engineer. The sushi is load-bearing metaphor. Please do not eat the rock.",
    item: "onigiri-sleepy",
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
