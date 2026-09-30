import { chromium } from "playwright";
const out = process.argv[2] || "/tmp/mv01";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await pg.goto("http://localhost:3000/?seg=pantry&tt=0.5&t=5&mood=1", { waitUntil: "networkidle" });
await pg.waitForTimeout(2500);
await pg.screenshot({ path: `${out}/a.png` });
const ids = ["leads", "billing", "incident", "standup"];
for (const id of ids) {
  await pg.click(`.mv01 .picks button[data-id=${id}]`, { force: true });
  await pg.waitForTimeout(1600);
  await pg.screenshot({ path: `${out}/${id}.png` });
}
await pg.waitForTimeout(5500);
await pg.screenshot({ path: `${out}/assembled.png` });
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors");
await b.close();
