import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
await pg.route("**/cross.jpg", (r) => r.fulfill({ path: "/tmp/polish-yard/cross_candidate.jpg", contentType: "image/jpeg" }));
for (const tt of [0.08, 0.15, 0.3, 0.45]) {
  await pg.goto(`http://localhost:3000/?seg=${encodeURIComponent("yard>street")}&tt=${tt}&t=5`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: `/tmp/polish-yard/cand_ys_${tt}.png` });
}
await b.close();
