import { chromium } from "playwright";
const [out, seg, tt, ...ts] = process.argv.slice(2);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (const t of ts) {
  for (let tries = 0; tries < 4; tries++) {
    await pg.goto(`http://localhost:3000/?seg=${encodeURIComponent(seg)}&tt=${tt}&freeze=${t}`, { waitUntil: "networkidle" });
    await pg.waitForTimeout(1500);
    const ok = await pg.evaluate(() => !document.getElementById("loader") && !!document.querySelector("#stage"));
    if (ok) break;
    await pg.waitForTimeout(3000);
  }
  await pg.screenshot({ path: `${out}/${seg.replace(">", "-")}@${tt}-t${t}.png` });
}
await b.close();
