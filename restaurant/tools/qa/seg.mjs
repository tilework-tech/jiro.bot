// usage: node seg.mjs OUT_DIR [--t=5 (frozen clock, passed as ?freeze=)] [--debugplates] [--w=1600] seg:tt [seg:tt ...]
//   seg is a scene id ("bar") or transition id ("bar>office"); tt is progress 0..1 inside it.
//   Writes OUT_DIR/<seg>@<tt>.png (">" replaced by "-"). Prints console errors.
import { chromium } from "playwright";
const args = process.argv.slice(2);
const out = args.shift();
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const list = args.filter((a) => !a.startsWith("--"));
const base = opt.url ?? "http://localhost:3000/";
const w = +(opt.w ?? 1600), h = Math.round((w * 9) / 16);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: w, height: h } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
for (const it of list) {
  const i = it.lastIndexOf(":");
  const seg = it.slice(0, i), tt = it.slice(i + 1);
  await pg.goto(`${base}?seg=${encodeURIComponent(seg)}&tt=${tt}&freeze=${opt.t ?? 5}${"debugplates" in opt ? "&debugplates=1" : ""}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(+(opt.wait ?? 600));
  const f = `${out}/${seg.replace(">", "-")}@${tt}.png`;
  await pg.screenshot({ path: f });
  console.log(f);
}
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors");
await b.close();
