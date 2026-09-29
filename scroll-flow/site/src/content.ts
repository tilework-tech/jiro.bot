/** DOM content for the scene overlays: clickable demo, side-by-side replays, table, FAQ, pricing. */

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// ---------------------------------------------------------------- demo
type Tab = "slack" | "pr" | "proof";
export function initDemo() {
  const root = $("#demo");
  root.innerHTML = `
    <div class="tabs">
      <button class="tab on" data-t="slack"><span class="n">1</span>#eng-dashboard</button>
      <button class="tab" data-t="pr"><span class="n">2</span>Pull request</button>
      <button class="tab" data-t="proof"><span class="n">3</span>Proof</button>
    </div>
    <div class="body" id="demo-body"></div>`;
  const body = $("#demo-body");
  let stage = 0;
  const tabs = root.querySelectorAll<HTMLButtonElement>(".tab");
  const show = (t: Tab) => {
    tabs.forEach((b) => b.classList.toggle("on", b.dataset.t === t));
    body.innerHTML = t === "slack" ? slack() : t === "pr" ? pr() : proof();
    // only the newest message animates in
    const msgs = body.querySelectorAll(".msg"); msgs.forEach((m, i) => { if (i < msgs.length - 1 || t !== "slack") (m as HTMLElement).style.animation = "none"; });
    wire();
  };
  const msg = (who: "you" | "jiro", html: string, time: string) => `
    <div class="msg ${who === "jiro" ? "j" : ""}"><div class="av">${who === "jiro" ? "J" : "M"}</div>
    <div><div class="who">${who === "jiro" ? "Jiro" : "you"}<span>${time}</span></div><div>${html}</div></div></div>`;
  const slack = () => {
    let h = msg("you", `<b>@jiro</b> make the dashboard faster`, "9:41");
    if (stage === 0) h += `<div class="choices"><button class="choice primary" data-next="1">Send to Jiro →</button></div>`;
    if (stage >= 1) h += msg("jiro", `Faster for whom? p95 page load is <b>4.1s</b>, and most of it is one N+1 query in <code>loadWidgets()</code>. Fix that first, or do you want a broader pass?`, "9:41")
      + (stage === 1 ? `<div class="choices"><button class="choice primary" data-next="2">Fix the N+1 first</button><button class="choice" data-next="2">Broader pass</button></div>` : "");
    if (stage >= 2) h += msg("jiro", `On it. Working in a fresh sandbox.<ul class="steps">
        <li class="${stage >= 3 ? "done" : "run"}">Reproduced: 214 queries per page load</li>
        <li class="${stage >= 3 ? "done" : "run"}">Wrote a failing test that caps queries at 5</li>
        <li class="${stage >= 3 ? "done" : "run"}">Batched widget loads with one join</li>
        <li class="${stage >= 3 ? "done" : "run"}">Full suite green, before/after trace captured</li></ul>`, "9:42");
    if (stage >= 3) h += msg("jiro", `PR is up with receipts: p95 <b>4.1s → 0.6s</b>. <div class="choices"><button class="choice primary" data-tab="pr">Open the PR</button><button class="choice" data-tab="proof">See proof</button></div>`, "9:58");
    return h;
  };
  const pr = () => `
    <div class="prcard"><h4>perf(dashboard): batch widget loads, kill the N+1 #1847</h4>
      <div class="meta"><span class="badge">checks passed</span><span class="badge">+38 −21</span> opened by jiro · 2 files</div></div>
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
    <div class="choices"><button class="choice" data-tab="proof">See proof →</button></div>`;
  const proof = () => `
    <div>Every PR ships with proof, captured in the sandbox.</div>
    <div class="proof">
      <div class="shot"><b>Before</b> · p95 4.1s<div class="bar" style="width:100%"></div><div class="dim">214 queries</div></div>
      <div class="shot"><b>After</b> · p95 0.6s<div class="bar" style="width:15%"></div><div class="dim">3 queries</div></div>
      <div class="shot"><b>Tests</b><br/><span class="y">✓</span> 412 passed · 0 failed</div>
      <div class="shot"><b>Screenshot</b><br/>dashboard.png attached to the PR</div>
    </div>
    <div class="choices"><button class="choice" data-reset="1">Replay the demo ↺</button></div>`;
  const wire = () => {
    body.querySelectorAll<HTMLButtonElement>("[data-next]").forEach((b) => b.onclick = () => {
      stage = +b.dataset.next!; show("slack");
      if (stage === 2) setTimeout(() => { stage = 3; show("slack"); }, 1800);
    });
    body.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => b.onclick = () => show(b.dataset.tab as Tab));
    body.querySelectorAll<HTMLButtonElement>("[data-reset]").forEach((b) => b.onclick = () => { stage = 0; show("slack"); });
  };
  tabs.forEach((b) => b.onclick = () => show(b.dataset.t as Tab));
  show("slack");
}

// ---------------------------------------------------------------- side-by-side replays
type Line = [number, string]; // [delay ms, html]
const GENERIC: Line[] = [
  [300, `<span class="dim">$ agent run "Add rate limiting to the login endpoint"</span>`],
  [700, `Sure! I'll add rate limiting.`],
  [500, `<span class="c">+ npm install express-rate-limit redis ioredis bottleneck</span>`],
  [600, `Editing 14 files…`],
  [500, `<span class="c">+ src/middleware/rateLimit.ts</span> (212 lines)`],
  [400, `<span class="c">+ src/utils/rateLimitHelpers.ts</span> (140 lines)`],
  [400, `<span class="c">~ src/server.ts</span>, <span class="c">~ src/auth/*.ts</span> (+9 more)`],
  [700, `<span class="ok">✓ Done!</span> Rate limiting is fully implemented.`],
  [900, `<span class="dim">CI:</span> <span class="bad">✗ 23 tests failed</span>`],
  [500, `<span class="bad">✗ /healthz now returns 429</span>`],
  [500, `<span class="dim">reviewer: "why is redis a dependency now?"</span>`],
];
const JIRO: Line[] = [
  [300, `<span class="dim">$ @jiro Add rate limiting to the login endpoint</span>`],
  [700, `<span class="j">jiro ›</span> Per IP or per account? Brute-force protection usually wants per account plus a looser per-IP cap.`],
  [900, `<span class="dim">you ›</span> both`],
  [600, `<span class="j">jiro ›</span> Using the existing in-memory limiter, no new deps.`],
  [500, `<span class="c">~ src/auth/login.ts</span> +18 −2`],
  [400, `<span class="c">+ test/auth/login.ratelimit.test.ts</span> +34`],
  [600, `<span class="ok">✓ 6th attempt per account in 15 min → 429</span>`],
  [400, `<span class="ok">✓ other routes unaffected</span>`],
  [600, `<span class="ok">✓ CI green · 418 passed</span>`],
  [500, `<span class="j">jiro ›</span> PR #1852 ready, trace + test output attached.`],
];
export function initCompare() {
  const run = (el: HTMLElement, lines: Line[]) => {
    let i = 0; el.innerHTML = "";
    const step = () => {
      if (i >= lines.length) { setTimeout(() => run(el, lines), 3500); return; }
      const [d, html] = lines[i++];
      setTimeout(() => { const div = document.createElement("div"); div.innerHTML = html; el.appendChild(div); step(); }, d);
    };
    step();
  };
  run($("#vid-generic .term"), GENERIC);
  run($("#vid-jiro .term"), JIRO);
}

// ---------------------------------------------------------------- comparison table
const ROWS: [string, string, string, string, string][] = [
  ["Bring your own Claude / Codex / Gemini plan", "y", "n", "m", "n"],
  ["Asks clarifying questions before coding", "y", "m", "m", "n"],
  ["Proof on every PR (tests, screenshots, traces)", "y", "m", "m", "n"],
  ["Lives in Slack, web and CLI", "y", "y", "y", "m"],
  ["Waits for approval on anything outward-facing", "y", "m", "m", "m"],
  ["Opinionated about quality (anti-slop)", "y", "n", "n", "n"],
];
export function initTable() {
  const sym = { y: `<span class="y">●</span>`, n: `<span class="n">—</span>`, m: `<span class="m">◐</span>` } as Record<string, string>;
  $("#cmp-body").innerHTML = ROWS.map(([label, ...c]) =>
    `<tr><td>${esc(label)}</td>${c.map((v, i) => `<td class="${i === 0 ? "us" : ""}">${sym[v]}</td>`).join("")}</tr>`).join("");
}

// ---------------------------------------------------------------- FAQ (anchored to sushi in the omakase scene)
export const FAQ: { q: string; a: string; at: [number, number] }[] = [
  { q: "Which models does Jiro use?", a: "Yours. Bring your own Claude, Codex, or Gemini subscription. Jiro brings the knife skills.", at: [-6.08, -1.9] },
  { q: "Where does he work?", a: "In the cloud, in your Slack. Ping him at 2am with a stack trace and he's still slicing.", at: [-3.08, -1.0] },
  { q: "Will he just do whatever I say?", a: "No. He asks before he cuts: he pins down what you actually want before writing a line. Not a yes-man.", at: [-0.08, -2.1] },
  { q: "How do I know the work is right?", a: "Every change ships with tests and proof: screenshots, traces, receipts. If it isn't right, it doesn't leave the kitchen.", at: [3.0, -1.75] },
  { q: "Can he touch production?", a: "Not without you. Merges, deploys and anything outward-facing wait for your explicit go-ahead.", at: [6.0, -1.0] },
];
export function initFaq(): HTMLElement[] {
  const wrap = $("#faq-bubbles"), ans = $("#faq-answer");
  return FAQ.map((f, i) => {
    const b = document.createElement("div");
    b.className = "faq-bubble"; b.textContent = f.q;
    b.onclick = () => {
      wrap.querySelectorAll(".faq-bubble").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      ans.innerHTML = `<b>${esc(f.q)}</b>${esc(f.a)}`;
      ans.classList.remove("show"); void ans.offsetWidth; ans.classList.add("show");
    };
    b.dataset.i = String(i);
    wrap.appendChild(b);
    return b;
  });
}

// ---------------------------------------------------------------- pricing
export function initPricing() {
  const plans = [
    { n: "Apprentice", jp: "見習い", p: "$0", per: "/mo", f: ["1 repo", "Slack + web", "Your own model plan"] },
    { n: "Itamae", jp: "板前", p: "$49", per: "/seat/mo", f: ["Unlimited repos", "Proof on every PR", "Priority sandbox"], hot: true },
    { n: "Omakase", jp: "おまかせ", p: "Ask", per: "", f: ["Your cloud (BYOC)", "SSO + audit log", "Dedicated support"] },
  ];
  $("#tags").innerHTML = plans.map((x) => `
    <div class="tag ${x.hot ? "hot" : ""}"><h3>${x.n}</h3><div class="jp">${x.jp}</div>
    <div class="price">${x.p}<small>${x.per}</small></div><ul>${x.f.map((l) => `<li>${l}</li>`).join("")}</ul></div>`).join("");
}
