import { chromium } from "playwright";
const [, , base = "http://localhost:3000/", out = "/tmp/shots", ...ps] = process.argv;
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
for (const p of ps) {
  await pg.goto(`${base}?p=${p}&t=5`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: `${out}/p${p}.png` });
}
console.log(errs.join("\n") || "no errors");
await b.close();
