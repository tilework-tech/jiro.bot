// usage: node qa/plates.mjs SCENE T0 T1 STEP [--debugplates]
// Prints, per frozen time, the plates on the scene belt (id, item, x, y, bubble, falling).
import { chromium } from "playwright";
const [scene, t0, t1, step] = process.argv.slice(2);
const dbg = process.argv.includes("--debugplates") ? "&debugplates=1" : "";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
for (let t = +t0; t <= +t1; t += +step) {
  await pg.goto(`http://localhost:3000/?seg=${scene}&tt=0.5&freeze=${t}${dbg}`, { waitUntil: "networkidle" });
  const r = await pg.evaluate(async () => {
    const belt = window.__belt, def = window.__scenes.get(location.search.match(/seg=(\w+)/)[1]);
    const now = parseFloat(new URLSearchParams(location.search).get("freeze"));
    return belt.platesOn(def.belt, now).map((p) => `${p.id}:${p.item}@${p.x.toFixed(0)},${p.y.toFixed(0)}${p.bubble ? "[" + p.bubble + "]" : ""}${p.falling ? (p.shatter ? "{shatter}" : "{fall}") : ""}`);
  });
  console.log(`t=${t.toFixed(1)} n=${r.length}  ${r.join("  ")}`);
}
await b.close();
