import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 640, height: 360 } });
await pg.goto(`http://localhost:3000/?seg=bar&tt=0.5&freeze=0`, { waitUntil: "networkidle" });
const r = await pg.evaluate(() => {
  const B = window.__belt; let s = "";
  for (let id = -150; id < 250; id++) s += B.slotOccupied(id) ? "o" : ".";
  return [s, Object.keys(B).join(",")];
});
console.log(r[0].match(/.{1,100}/g).join("\n")); console.log(r[1]);
await b.close();
