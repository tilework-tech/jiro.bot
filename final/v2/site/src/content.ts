/**
 * Scene copy built in script: the FAQ (noriagentic.com, verbatim, as in Martin's 2026-10-02 copy) and the price tags
 * (Martin's 2026-10-02 copy). The rest of the copy is static in index.html. See docs.md, "Copy".
 */

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

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
    answer.hidden = false;
    answer.classList.remove("pop"); void answer.offsetWidth; answer.classList.add("pop");
    onAsk(i);
  }));
}

// ---------------------------------------------------------------- 6 · pricing ("Not market price")
export const PLANS = [
  { n: "Apprentice", p: "$0", per: "", d: "Free trial" },
  { n: "Itamae", p: "$99", per: "/mo", d: "Single developer" },
  { n: "Omakase", p: "$250", per: "/mo", d: "Teams", hot: true },
];
export function initPricing() {
  $("#price-tags").innerHTML = PLANS.map((x, i) => `
    <a class="tag ${x.hot ? "hot" : ""}" data-testid="plan" href="https://noriagentic.com/#pricing" rel="noopener" style="--i:${i}">
      <span class="string" aria-hidden="true"></span><span class="pin" aria-hidden="true"></span>
      <h3>${esc(x.n)}</h3>
      <div class="price">${esc(x.p)}<small>${esc(x.per)}</small></div>
      <p class="for">${esc(x.d)}</p>
    </a>`).join("");
}
