/**
 * Scene copy. Product facts (comparison, FAQ, pricing) are taken verbatim or lightly shortened from
 * noriagentic.com (comparison, FAQ and pricing re-fetched 2026-10-01/02); see final/site/docs/CONTENT-SOURCES.md and final/v2/site/docs.md. Nothing here should be invented.
 */

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// ---------------------------------------------------------------- 2 · product demo (illustrative, clickable)
type Tab = "slack" | "pr" | "env";
export function initDemo(onStep: (n: number) => void) {
  const root = $("#demo-panel");
  root.innerHTML = `
    <div class="tabs" role="tablist">
      <button class="tab on" data-t="slack" role="tab"><span class="n">1</span>#eng-dashboard</button>
      <button class="tab" data-t="pr" role="tab"><span class="n">2</span>Pull request</button>
      <button class="tab" data-t="env" role="tab"><span class="n">3</span>Environment</button>
    </div>
    <div class="body" id="demo-body"></div>`;
  const body = $("#demo-body");
  let stage = 0;
  const tabs = root.querySelectorAll<HTMLButtonElement>(".tab");
  const msg = (who: "you" | "jiro", html: string, time: string, fresh: boolean) => `
    <div class="msg ${who === "jiro" ? "j" : ""} ${fresh ? "fresh" : ""}"><div class="av">${who === "jiro" ? "J" : "Y"}</div>
    <div><div class="who">${who === "jiro" ? "Jiro" : "you"}<span>${time}</span></div><div>${html}</div></div></div>`;
  const slack = () => {
    let h = msg("you", `<b>@jiro</b> the dashboard is slow, make it faster`, "9:41", stage === 0);
    if (stage === 0) h += `<div class="choices"><button class="choice primary" data-next="1">Send to Jiro →</button></div>`;
    if (stage >= 1) h += msg("jiro", `Which screen feels slow? I found repeated widget lookups in <code>loadWidgets()</code>. Fix that first, or take a broader pass?`, "9:41", stage === 1)
      + (stage === 1 ? `<div class="choices"><button class="choice primary" data-next="2">Fix the N+1 first</button><button class="choice" data-next="2">Broader pass</button></div>` : "");
    if (stage >= 2) h += msg("jiro", `On it, in a fresh cloud environment with the repo and its services.<ul class="steps">
        <li class="${stage >= 3 ? "done" : "run"}">Reproduced repeated queries per widget</li>
        <li class="${stage >= 3 ? "done" : "run"}">Wrote a regression test for batched lookup</li>
        <li class="${stage >= 3 ? "done" : "run"}">Batched widget loads with one query</li>
        <li class="${stage >= 3 ? "done" : "run"}">Suite green, before and after timings captured</li></ul>`, "9:42", stage === 2);
    if (stage >= 3) h += msg("jiro", `Example PR is ready, with before and after timings attached for review. <div class="choices"><button class="choice primary" data-tab="pr">Open the PR</button><button class="choice" data-tab="env">Where did this run?</button></div>`, "9:58", stage === 3);
    return h;
  };
  const pr = () => `
    <div class="prcard"><h4>perf(dashboard): batch widget loads, kill the N+1 <span class="dim">#1847</span></h4>
      <div class="meta"><span class="badge">checks passed</span><span class="badge">+38 −21</span> opened by jiro · 2 files · awaiting your review</div></div>
    <div class="diff">
      <div class="h">@@ src/dashboard/loadWidgets.ts @@</div>
      <div class="d">-  for (const w of widgets) {</div>
      <div class="d">-    w.data = await db.query(sql\`select * from metrics where widget_id = \${w.id}\`);</div>
      <div class="d">-  }</div>
      <div class="a">+  const rows = await db.query(sql\`select * from metrics where widget_id = any(\${ids})\`);</div>
      <div class="a">+  const byId = groupBy(rows, (r) => r.widget_id);</div>
      <div class="a">+  for (const w of widgets) w.data = byId[w.id] ?? [];</div>
      <div class="h">@@ test/dashboard.perf.test.ts @@</div>
      <div class="a">+  it("loads the dashboard in at most 5 queries", async () => {</div>
      <div class="a">+    expect(await countQueries(() => loadDashboard(team))).toBeLessThanOrEqual(5);</div>
      <div class="a">+  });</div>
    </div>
    <div class="choices"><button class="choice" data-tab="env">Where did this run? →</button></div>`;
  const env = () => `
    <p class="lead">Each agent works in an isolated cloud environment with your repository, tools, dependencies, and services ready to use.</p>
    <div class="envgrid">
      <div class="cell"><b>Where you ask</b><span>Slack · CLI · Triggers</span></div>
      <div class="cell"><b>Which agent</b><span>Claude Code, Codex, Cursor, or any ACP agent</span></div>
      <div class="cell"><b>Which model</b><span>Any model, your keys</span></div>
      <div class="cell"><b>What comes back</b><span>A PR, commit, comment, completed task, or file</span></div>
    </div>
    <div class="choices"><button class="choice" data-reset="1">Replay the demo ↺</button></div>`;
  const show = (t: Tab) => {
    tabs.forEach((b) => b.classList.toggle("on", b.dataset.t === t));
    body.innerHTML = t === "slack" ? slack() : t === "pr" ? pr() : env();
    body.scrollTop = body.scrollHeight;
    wire();
  };
  const wire = () => {
    body.querySelectorAll<HTMLButtonElement>("[data-next]").forEach((b) => (b.onclick = () => {
      stage = +b.dataset.next!; show("slack"); onStep(stage);
      if (stage === 2) setTimeout(() => { stage = 3; show("slack"); onStep(3); }, 1900);
    }));
    body.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => (b.onclick = () => show(b.dataset.tab as Tab)));
    body.querySelectorAll<HTMLButtonElement>("[data-reset]").forEach((b) => (b.onclick = () => { stage = 0; show("slack"); }));
  };
  tabs.forEach((b) => (b.onclick = () => show(b.dataset.t as Tab)));
  show("slack");
}

// ---------------------------------------------------------------- 3 · side by side (scripted replays)
type Line = [number, string];
const GENERIC: Line[] = [
  [400, `<span class="dim">$ agent "Add rate limiting to the login endpoint"</span>`],
  [800, `Sure! I'll add comprehensive rate limiting.`],
  [600, `<span class="c">+ npm install express-rate-limit redis ioredis bottleneck</span>`],
  [700, `Editing 14 files…`],
  [500, `<span class="c">+ src/middleware/rateLimit.ts</span> <span class="dim">(212 lines)</span>`],
  [400, `<span class="c">+ src/utils/rateLimitHelpers.ts</span> <span class="dim">(140 lines)</span>`],
  [400, `<span class="c">~ src/server.ts</span>, <span class="c">~ src/auth/*.ts</span> <span class="dim">(+9 more)</span>`],
  [800, `<span class="ok">Done!</span> Rate limiting is fully implemented.`],
  [1000, `<span class="dim">CI:</span> <span class="bad">FAIL</span> 23 tests`],
  [600, `<span class="bad">FAIL</span> /healthz now returns 429`],
  [600, `<span class="dim">reviewer › why is redis a dependency now?</span>`],
];
const JIRO: Line[] = [
  [400, `<span class="dim">$ @jiro Add rate limiting to the login endpoint</span>`],
  [800, `<span class="j">jiro ›</span> Per IP or per account? Brute-force protection usually wants per account, plus a looser per-IP cap.`],
  [1000, `<span class="dim">you ›</span> both`],
  [700, `<span class="j">jiro ›</span> Using the existing in-memory limiter. No new dependencies.`],
  [500, `<span class="c">~ src/auth/login.ts</span> <span class="ok">+18</span> <span class="bad">−2</span>`],
  [400, `<span class="c">+ test/auth/login.ratelimit.test.ts</span> <span class="ok">+34</span>`],
  [700, `<span class="ok">PASS</span> 6th attempt per account in 15 min → 429`],
  [400, `<span class="ok">PASS</span> other routes unaffected`],
  [700, `<span class="ok">PASS</span> CI green`],
  [600, `<span class="j">jiro ›</span> PR ready for your review.`],
];
/**
 * Both replays type out once when the stop first comes into view, then hold their final state so the room stays calm.
 * The replay button runs them again. With reduced motion the final state shows at once.
 */
export function initCompare(reduced: boolean) {
  const wins: [HTMLElement, Line[]][] = [[$("#win-generic .term"), GENERIC], [$("#win-jiro .term"), JIRO]];
  const timers: number[] = [];
  const line = (el: HTMLElement, html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.className = "ln";
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  };
  const play = () => {
    timers.splice(0).forEach(clearTimeout);
    for (const [el, lines] of wins) {
      el.innerHTML = "";
      if (reduced) { lines.forEach(([, html]) => line(el, html)); continue; }
      let t = 0;
      for (const [d, html] of lines) { t += d; timers.push(window.setTimeout(() => line(el, html), t)); }
    }
  };
  const stop = $("#compare");
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
  }, { threshold: 0.25 });
  io.observe(stop);
  stop.querySelector<HTMLButtonElement>("[data-replay]")!.onclick = () => { io.disconnect(); play(); };
}

// ---------------------------------------------------------------- 4 · comparison table (noriagentic.com, "Cloud coding agents, compared.")
const COLS = ["Nori", "Claude Tag", "Devin", "Cursor Cloud"];
const ROWS: [string, string[]][] = [
  ["Agent", ["Claude Code, Codex CLI, Gemini CLI, pi, Cursor Agent, Goose, GitHub Copilot, Antigravity, Snowflake Cortex, or your own agent", "Claude only", "Devin only", "Cursor only"]],
  ["Model", ["any model, your keys", "Anthropic only", "routed for you", "Cursor's catalogue"]],
  ["Context", ["org-wide, portable", "Claude memories", "API export", "proprietary rules"]],
  ["Cloud", ["AWS · Azure · GCP, your VPC", "Anthropic only", "hosted (VPC on contract)", "hosted only"]],
  ["Pricing", ["flat (zero token markup)", "API tokens, high volume", "credits (token markup)", "metered, per model"]],
];
export function initTable() {
  $("#cmp-table").innerHTML =
    `<thead><tr><th></th>${COLS.map((c, i) => `<th class="${i === 0 ? "us" : ""}">${esc(c)}</th>`).join("")}</tr></thead>` +
    `<tbody>${ROWS.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th>${v.map((c, i) => `<td class="${i === 0 ? "us" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

// ---------------------------------------------------------------- 5 · FAQ (noriagentic.com "Frequently Asked Questions", verbatim, fetched 2026-10-02)
export const FAQ: { q: string; a: string }[] = [
  { q: "Which coding agents can I run?", a: "Claude Code, Codex, and Cursor. Any agent that speaks the Agent Client Protocol can be registered alongside them. Every agent runs on the same environment primitives, so you can mix agents across tasks or run several inside one workspace." },
  { q: "Can it work with our non-engineering tools?", a: "Yes. Salesforce, HubSpot, Google Sheets, Google Drive, Notion, Linear, Jira, Stripe, and Gmail, plus hundreds more. One agent across the stack, scoped per person, rather than a pile of logins. Ops, finance, and data teams describe the work in Slack or Teams the way they would ask a teammate. No CLI and no new dashboard." },
  { q: "What does an agent's environment look like?", a: "Each agent works in an isolated cloud environment with your repository, tools, dependencies, and services ready to use." },
  { q: "How does billing work?", a: "Plans are sized by runtimes. The free trial runs five for 30 days, Developer gives one user up to three persistent runtimes, and Team gives multiple users five shared ones. Enterprise sets capacity to fit. Runtimes sleep when idle and wake on demand." },
  { q: "Is the output always a pull request?", a: "No. Agents can return a pull request, commit, comment, or completed task for you to review, merge, or send back. An output can also be a file when that is what the work produces: a document, a spreadsheet, a presentation, or another office artifact." },
  { q: "What repositories can I use?", a: "Any GitHub repository you have access to. Connect your GitHub account and select which repos to enable." },
];
/** Where each question bubble sits over the counter (world units: centre x, top y), one per plate in the FAQ art. */
const FAQ_SPOTS: [number, number][] = [[130, 72], [155, 56], [180, 88], [206, 72], [232, 102], [257, 86]];

/** Question bubbles over the plates; clicking one makes Jiro answer in his bubble. */
export function initFaq(onAsk: (i: number) => void) {
  const list = $("#faq .faq-qs");
  const answer = $("#faq [data-testid=faq-answer]");
  list.innerHTML = FAQ.map((f, i) => `<button type="button" class="faq-q" data-testid="faq-question" data-i="${i}" style="--x:${FAQ_SPOTS[i][0]};--y:${FAQ_SPOTS[i][1]}"><span>${esc(f.q)}</span></button>`).join("");
  list.querySelectorAll<HTMLButtonElement>(".faq-q").forEach((b) => (b.onclick = () => {
    const i = Number(b.dataset.i);
    list.querySelectorAll(".faq-q").forEach((x) => x.classList.toggle("on", x === b));
    answer.innerHTML = `<b>${esc(FAQ[i].q)}</b><p>${esc(FAQ[i].a)}</p>`;
    answer.classList.remove("pop"); void answer.offsetWidth; answer.classList.add("pop");
    onAsk(i);
  }));
}

// ---------------------------------------------------------------- 6 · pricing (noriagentic.com, "Pay per agent, no hidden fees.")
export function initPricing() {
  const plans = [
    { n: "Free trial", jp: "お試し", p: "$0", per: "for 30 days", f: "Five runtimes and the complete team experience", cta: "Start free", href: "https://noriagentic.com/#pricing" },
    { n: "Developer", jp: "板前", p: "$99", per: "/month", f: "One user, up to three persistent runtimes, integrations, triggers, and BYOK", cta: "Get started", href: "https://noriagentic.com/#pricing" },
    { n: "Team", jp: "厨房", p: "$250", per: "/month", f: "Multiple users, five shared runtimes, organization controls, integrations, and collaboration", cta: "Get started", href: "https://noriagentic.com/#pricing", hot: true },
    { n: "Enterprise", jp: "おまかせ", p: "Contact us", per: "", f: "Custom capacity, role-based access control, audit trails, deployment, onboarding, and support", cta: "Talk to us", href: "mailto:amol@noriagentic.com?subject=Nori%20Sessions%20Enterprise" },
  ];
  $("#price-tags").innerHTML = plans.map((x, i) => `
    <div class="tag ${x.hot ? "hot" : ""}" data-testid="plan" style="--i:${i}">
      <span class="string" aria-hidden="true"></span>
      <span class="jp" lang="ja" aria-hidden="true">${x.jp}</span>
      <h3>${esc(x.n)}</h3>
      <div class="price">${esc(x.p)}<small>${esc(x.per)}</small></div>
      <p>${esc(x.f)}</p>
      <a class="go" href="${x.href}" rel="noopener">${esc(x.cta)} →</a>
    </div>`).join("");
}
