import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await pg.goto("http://localhost:3000/?seg=pantry&tt=0.5&t=5&mood=3&v03r=" + (process.env.R ?? 0) + "&v03t=" + (process.env.T ?? 0), { waitUntil: "networkidle" });
const times = (process.argv[2] ?? "2500").split(",").map(Number);
let prev = 0;
for (const t of times) { await pg.waitForTimeout(t - prev); prev = t; await pg.screenshot({ path: `/tmp/v03/a${t}.png` }); }
if (process.argv[3]) {
  await pg.locator(".mv03-bar button").nth(+process.argv[3]).click();
  const t2 = (process.argv[4] ?? "3000").split(",").map(Number); prev = 0;
  for (const t of t2) { await pg.waitForTimeout(t - prev); prev = t; await pg.screenshot({ path: `/tmp/v03/b${t}.png` }); }
}
console.log(errs.join("\n") || "no errors");
await b.close();
