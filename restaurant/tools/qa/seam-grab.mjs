import { chromium } from "playwright";
import fs from "fs";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const grab = async (seg, tt, f) => {
  await pg.goto(`http://localhost:3000/?seg=${encodeURIComponent(seg)}&tt=${tt}&t=5`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(1200);
  const d = await pg.evaluate(() => document.querySelector("#stage").toDataURL("image/png"));
  fs.writeFileSync(f, Buffer.from(d.split(",")[1], "base64"));
};
const pairs = [["storage", 0.5, "storage>street", 0.0005], ["street", 0.5, "storage>street", 0.9995], ["street", 0.5, "street>pond", 0.0005], ["pond", 0.5, "street>pond", 0.9995]];
let i = 0;
for (const [a, ta, t, tt] of pairs) { await grab(a, ta, `/tmp/street2/c${i}a.png`); await grab(t, tt, `/tmp/street2/c${i}b.png`); i++; }
await b.close();
