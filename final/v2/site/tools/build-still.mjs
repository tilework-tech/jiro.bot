// Writes public/still/index.html: the whole journey as plain images and text, for visitors without JavaScript
// (and for low-GPU browsers that cannot animate). Scene copy comes from index.html and the FAQ and price tags from
// src/content.ts, so the still page never drifts from the live one.
// Usage: node tools/build-still.mjs   (run after the art is exported; npm run build runs it first)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const src = readFileSync(join(root, "src/content.ts"), "utf8");
const page = readFileSync(join(root, "index.html"), "utf8");
const grab = (text, re, what) => { const m = re.exec(text); if (!m) throw new Error(`${what}: ${re}`); return m[1]; };
const FAQ = [...grab(src, /export const FAQ[^=]*=\s*\[([\s\S]*?)\n\];/, "content.ts").matchAll(/q: "([^"]*)", a: "([^"]*)"/g)].map((m) => ({ q: m[1], a: m[2] }));
const plans = [...grab(src, /export const PLANS = \[([\s\S]*?)\n\];/, "content.ts").matchAll(/n: "([^"]*)", p: "([^"]*)", per: "([^"]*)", d: "([^"]*)"/g)].map((m) => ({ n: m[1], p: m[2], per: m[3], d: m[4] }));
/** The headings and paragraphs of a stop's copy block in index.html, in order. */
const copyOf = (id) => {
  const section = grab(page, new RegExp(`<section class="stop" data-stop="${id}"[^>]*>([\\s\\S]*?)</section>`), "index.html");
  return [...section.matchAll(/<(h1|h2|h3|p)\b[^>]*>([^<]*)<\/\1>/g)].map((m) => ({ tag: m[1], text: m[2] }));
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
if (FAQ.length < 6 || plans.length !== 3 || copyOf("hero").length < 1) throw new Error("still page: content not found");
const copy = (id) => copyOf(id).map(({ tag, text }) => `<${tag}>${esc(text)}</${tag}>`).join("");

const fig = (id, alt, body) => `<section data-still="${id}"><img src="../art/${id}/base.png" alt="${esc(alt)}" width="1440" height="808" loading="lazy" /><div class="copy">${body}</div></section>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Jiro, the tasteful software engineer · jiro.bot (still)</title>
<style>
body{margin:0;background:#0b0302;color:#efdabd;font:16px/1.5 system-ui,sans-serif}
main{max-width:1100px;margin:auto;padding:24px}
section{margin:0 0 48px}
img{display:block;width:100%;height:auto;image-rendering:pixelated;border:2px solid #351e1a}
h1,h2,h3{font-weight:700;margin:18px 0 6px}
a{color:#fdd081}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.plans div{border:1px solid #80452e;padding:10px 12px}
dt{font-weight:700;margin-top:10px}dd{margin:2px 0 0}
</style></head><body><main>
<p><a href="../">← Back to the animated site</a></p>
${fig("hero", "Jiro, a copper robot sushi chef, behind the counter of a night-time sushi bar.", copy("hero"))}
${fig("product", "Jiro typing at a desk in a quiet back office.", copy("product"))}
${fig("compare", "A dim dining room full of happy diners.", copy("compare"))}
${fig("table", "A kitchen corner with an arcade cabinet.", copy("table"))}
${fig("faq", "Jiro behind the sushi counter with six small plates.", `<dl>${FAQ.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join("")}</dl>`)}
${fig("price", "Jiro on a bicycle at a red light on a rainy night street.", `${copy("price")}<div class="plans">${plans.map((x) => `<div><b>${esc(x.n)}</b><br />${esc(x.p)}${esc(x.per)}<br />${esc(x.d)}</div>`).join("")}</div>`)}
${fig("pond", "A moonlit koi pond with a trestle and a small food stall.", `${copy("pond")}<p><a href="https://noriagentic.com/">Reserve a seat</a></p>`)}
</main></body></html>
`;
writeFileSync(join(root, "public/still/index.html"), html);
console.log("public/still/index.html", FAQ.length, "questions", plans.length, "plans");
