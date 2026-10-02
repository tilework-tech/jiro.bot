import { chromium } from "playwright";
// usage: node ks-a.mjs [tts] [now]; also renders the kitchen and storage holds for diffing.
const ts = (process.argv[2] ?? "0.001,0.14,0.28,0.42,0.56,0.7,0.85,0.9999").split(",");
const now = process.argv[3] ?? "5";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
const shot = async (seg, tt, out) => {
  await pg.goto(`http://localhost:3000/preview/ks-a.html?seg=${encodeURIComponent(seg)}&tt=${tt}&t=${now}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(700);
  await pg.locator("#stage").screenshot({ path: out });
};
for (const t of ts) await shot("kitchen>storage", t, `/tmp/ks-a/f-${t}.png`);
await shot("kitchen", 0.5, "/tmp/ks-a/kitchen.png");
await shot("storage", 0.5, "/tmp/ks-a/storage.png");
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
