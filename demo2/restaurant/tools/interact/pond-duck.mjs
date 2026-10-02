import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5`, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
await pg.mouse.click(1000, 820);
for (let i = 0; i < 20; i++) { await pg.waitForTimeout(500); const t = await pg.textContent("#toast"); if (i % 2 || /inside/.test(t)) console.log(i * 0.5, t); if (/inside/.test(t)) { await pg.screenshot({ path: "/tmp/polish-pond/after/duck-gulp.png", clip: { x: 800, y: 650, width: 400, height: 300 } }); break; } }
await b.close();
