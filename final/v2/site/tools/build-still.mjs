// Writes public/still/index.html: the whole journey as plain images and text, for visitors without JavaScript
// (and for low-GPU browsers that cannot animate). Copy comes from src/content.ts so it never drifts from the live page.
// Usage: node tools/build-still.mjs   (run after the art is exported; npm run build runs it first)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const src = readFileSync(join(root, "src/content.ts"), "utf8");
const grab = (re) => { const m = re.exec(src); if (!m) throw new Error(`content.ts: ${re}`); return m[1]; };
const FAQ = [...grab(/export const FAQ[^=]*=\s*\[([\s\S]*?)\n\];/).matchAll(/q: "([^"]*)", a: "([^"]*)"/g)].map((m) => ({ q: m[1], a: m[2] }));
const plans = [...grab(/const plans = \[([\s\S]*?)\n  \];/).matchAll(/n: "([^"]*)",[^}]*?p: "([^"]*)", per: "([^"]*)", f: "([^"]*)"/g)].map((m) => ({ n: m[1], p: m[2], per: m[3], f: m[4] }));
const COLS = JSON.parse(grab(/const COLS = (\[[^\]]*\]);/));
const ROWS = [...grab(/const ROWS[^=]*= \[([\s\S]*?)\n\];/).matchAll(/\["([^"]*)", (\[[^\]]*\])\]/g)].map((m) => [m[1], JSON.parse(m[2])]);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
if (FAQ.length < 6 || plans.length !== 4 || ROWS.length < 5) throw new Error("still page: content not found");

const fig = (id, alt, body) => `<section data-still="${id}"><img src="../art/${id}/base.png" alt="${esc(alt)}" width="1440" height="808" loading="lazy" /><div class="copy">${body}</div></section>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Jiro, your AI staff engineer · jiro.bot (still)</title>
<style>
body{margin:0;background:#0b0302;color:#efdabd;font:16px/1.5 system-ui,sans-serif}
main{max-width:1100px;margin:auto;padding:24px}
section{margin:0 0 48px}
img{display:block;width:100%;height:auto;image-rendering:pixelated;border:2px solid #351e1a}
h1,h2{font-weight:700;margin:18px 0 6px}
a{color:#fdd081}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid #48231b}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.plans div{border:1px solid #80452e;padding:10px 12px}
dt{font-weight:700;margin-top:10px}dd{margin:2px 0 0}
</style></head><body><main>
<p><a href="../">← Back to the animated site</a></p>
${fig("hero", "Jiro, a copper robot sushi chef, behind the counter of a night-time sushi bar.", `<h1>Jiro, your AI staff engineer</h1><p><b>Bring your own subscription.</b> Cloud coding agents from Nori. Ask in Slack, the CLI or a trigger, and get a pull request back.</p>`)}
${fig("product", "Jiro typing at a desk in a quiet back office.", `<h2>From a Slack message to a pull request</h2><p>Ask Jiro in Slack; Jiro opens a pull request and an environment you can try. (On the animated site this is a scripted, clickable example, not a measured Nori result.)</p>`)}
${fig("compare", "A dim dining room full of happy diners.", `<h2>Same prompt. Different chef.</h2><p>“Add rate limiting to the login endpoint.” An illustrative replay: a generic agent adds four dependencies and fails CI; Jiro asks one question, changes one file, adds a test, and opens a PR.</p>`)}
${fig("table", "A kitchen corner with an arcade cabinet and a menu board.", `<h2>How Jiro compares</h2><table><thead><tr><th></th>${COLS.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${ROWS.map(([k, v]) => `<tr><th>${esc(k)}</th>${v.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table><p>From <a href="https://noriagentic.com/#compare">noriagentic.com</a>.</p>`)}
${fig("faq", "Jiro behind the sushi counter with six small plates.", `<h2>Frequently Asked Questions</h2><dl>${FAQ.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join("")}</dl>`)}
${fig("price", "Jiro on a bicycle at a red light on a rainy night street.", `<h2>Pay per agent, no hidden fees.</h2><div class="plans">${plans.map((x) => `<div><b>${esc(x.n)}</b><br />${esc(x.p)} ${esc(x.per)}<br />${esc(x.f)}</div>`).join("")}</div><p>No card required for the trial. Runtimes sleep when idle and wake on demand.</p>`)}
${fig("pond", "A moonlit koi pond with a trestle and a small food stall.", `<h2>Every plate finds a home.</h2><p><a href="https://noriagentic.com/book-a-demo.html">Book a demo</a> · <a href="https://noriagentic.com/">Get started for free</a></p>`)}
</main></body></html>
`;
writeFileSync(join(root, "public/still/index.html"), html);
console.log("public/still/index.html", FAQ.length, "questions", plans.length, "plans");
