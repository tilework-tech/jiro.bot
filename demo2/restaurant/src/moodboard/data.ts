// Shared data for the MCP moodboard: connectors are ingredients, recipes are sushi.
// Every version renders these same recipes so the 10 concepts are comparable.

export interface Connector {
  id: string;
  name: string;
  /** Brand-ish accent colour for pixel badges (no official logo files). */
  color: string;
  /** What this connector contributes, in kitchen terms. */
  role: "fish" | "rice" | "nori" | "garnish" | "sauce";
  /** One-line, real capability through the MCP server. */
  does: string;
}

export const CONNECTORS: Connector[] = [
  { id: "sentry", name: "Sentry", color: "#7a5fd1", role: "fish", does: "the failing stack trace" },
  { id: "github", name: "GitHub", color: "#e8e3da", role: "rice", does: "the repo, branches and PRs" },
  { id: "linear", name: "Linear", color: "#5e6ad2", role: "nori", does: "the ticket that wraps the work" },
  { id: "slack", name: "Slack", color: "#e01e5a", role: "sauce", does: "the ask and the updates" },
  { id: "notion", name: "Notion", color: "#f3f1ec", role: "garnish", does: "specs, runbooks, postmortems" },
  { id: "gdrive", name: "Google Drive", color: "#1fa463", role: "rice", does: "docs and spreadsheets" },
  { id: "hubspot", name: "HubSpot", color: "#ff7a59", role: "fish", does: "contacts and deal stages" },
  { id: "gmail", name: "Gmail", color: "#ea4335", role: "nori", does: "threads and drafts" },
  { id: "stripe", name: "Stripe", color: "#635bff", role: "fish", does: "invoices and payments" },
  { id: "jira", name: "Jira", color: "#2684ff", role: "nori", does: "issues and sprints" },
  { id: "postgres", name: "Postgres", color: "#336791", role: "rice", does: "read-only queries" },
];

export interface Recipe {
  id: string;
  /** Sushi name (dish). */
  sushi: string;
  /** Sprite in public/items/ for the finished dish. */
  item: string;
  /** Connector ids, in assembly order (base first). */
  ingredients: string[];
  /** Who ordered it (the Slack ask). */
  order: string;
  /** What comes out of the kitchen. */
  serves: string;
}

export const RECIPES: Recipe[] = [
  { id: "bugfix", sushi: "Bug-fix nigiri", item: "tuna", ingredients: ["github", "sentry", "linear", "slack"], order: "@jiro checkout is 500ing again", serves: "a PR with a failing test first and the fix" },
  { id: "leads", sushi: "Lead follow-up maki", item: "maki", ingredients: ["gdrive", "hubspot", "gmail", "slack"], order: "@jiro follow up with everyone from the demo day list", serves: "40 personalized drafts, logged in HubSpot" },
  { id: "billing", sushi: "Invoice ikura", item: "ikura", ingredients: ["postgres", "stripe", "gmail", "notion"], order: "@jiro why did 3 invoices fail last night?", serves: "a reconciliation note and retry plan" },
  { id: "incident", sushi: "Incident omakase", item: "salmon", ingredients: ["github", "sentry", "jira", "notion", "slack"], order: "@jiro write up yesterday's outage", serves: "a postmortem with timeline and follow-up tickets" },
  { id: "standup", sushi: "Standup tamago", item: "tamago", ingredients: ["github", "linear", "slack"], order: "@jiro what shipped this week?", serves: "a 6-line changelog posted to #eng" },
];

export const byId = (id: string) => CONNECTORS.find((c) => c.id === id)!;

/** Contract for one moodboard version (src/moodboard/vNN.ts). */
export interface MoodVersion {
  n: number;
  title: string;
  /** One-line concept pitch shown under the tabs. */
  pitch: string;
  /**
   * Render into `el`, a 1640x700 stage-px box (position: relative, overflow hidden).
   * Return a cleanup function. Animations must be slow, loop-safe, and stop on cleanup.
   */
  mount(el: HTMLElement, ctx: MoodCtx): () => void;
}

export interface MoodCtx {
  base: string; // import.meta.env.BASE_URL
  sfx(name: "pop" | "blip" | "chime" | "whoosh" | "coin" | "bonk"): void;
  egg(id: string, text: string): void;
  reducedMotion: boolean;
}
