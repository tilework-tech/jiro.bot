import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (const t of [5, 5.4, 11]) {
  await pg.goto(`http://localhost:3000/?seg=yard&tt=0.5&freeze=${t}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: `/tmp/polish-yard/z_towels_${t}.png`, clip: { x: 1020, y: 190, width: 820, height: 260 } });
  await pg.screenshot({ path: `/tmp/polish-yard/z_jiro_${t}.png`, clip: { x: 1380, y: 480, width: 300, height: 320 } });
  await pg.screenshot({ path: `/tmp/polish-yard/z_mid_${t}.png`, clip: { x: 560, y: 150, width: 440, height: 680 } });
}
await b.close();
