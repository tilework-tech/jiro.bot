import { chromium } from "playwright";
const out = new URL("../../docs/img", import.meta.url).pathname;
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
for (let i = 1; i <= 10; i++) {
  await pg.goto(`http://localhost:3000/?seg=pantry&tt=0.5&t=5&mood=${i}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(7000);
  await pg.screenshot({ path: `${out}/mood-v${String(i).padStart(2, "0")}.jpg`, type: "jpeg", quality: 80 });
}
console.log(errs.join("\n") || "no errors");
await b.close();
