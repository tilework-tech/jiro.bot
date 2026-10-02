import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
for (let k = 0; k < 8; k++) {
  await pg.goto("http://localhost:3000/?seg=pantry&tt=0.5&t=5&mood=5", { waitUntil: "networkidle" });
  if (await pg.locator(".mv05").count()) break;
  await pg.waitForTimeout(5000);
}
await pg.waitForTimeout(2500);
await pg.screenshot({ timeout: 90000, path: "/tmp/v05-a.png" });
await pg.waitForTimeout(6000);
await pg.screenshot({ timeout: 90000, path: "/tmp/v05-b.png" });
await pg.evaluate(() => document.querySelectorAll(".mv05 .picker button")[3].click());
await pg.waitForTimeout(5000);
await pg.screenshot({ timeout: 90000, path: "/tmp/v05-c.png" });
await pg.waitForTimeout(6000);
await pg.screenshot({ timeout: 90000, path: "/tmp/v05-d.png" });
console.log(errs.join("\n") || "no errors");
await b.close();
