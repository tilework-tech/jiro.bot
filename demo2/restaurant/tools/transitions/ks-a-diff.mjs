import { chromium } from "playwright";
import fs from "fs";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const grab = async (seg, tt, out) => {
  await pg.goto(`http://localhost:3000/preview/ks-a.html?seg=${encodeURIComponent(seg)}&tt=${tt}&t=5`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(700);
  const d = await pg.evaluate(() => document.querySelector("#stage").toDataURL("image/png"));
  fs.writeFileSync(out, Buffer.from(d.split(",")[1], "base64"));
};
await grab("kitchen>storage", 0.0005, "/tmp/ks-a/c0.png");
await grab("kitchen", 0.5, "/tmp/ks-a/ck.png");
await grab("kitchen>storage", 0.9999, "/tmp/ks-a/c1.png");
await grab("storage", 0.5, "/tmp/ks-a/cs.png");
await b.close();
