// usage: node qa/life-scan.mjs SCENE T0 T1 [--debugplates]
// Scans time in 0.25 s steps (in one page, no reloads) and prints when plates on the
// scene belt chat (bubble), fall or shatter. Use it to pick --t values for seg.mjs shots.
import { chromium } from "playwright";
const [scene, t0, t1] = process.argv.slice(2);
const dbg = process.argv.includes("--debugplates") ? "&debugplates=1" : "";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 640, height: 360 } });
await pg.goto(`http://localhost:3000/?seg=${scene}&tt=0.5&freeze=0${dbg}`, { waitUntil: "networkidle" });
const out = await pg.evaluate(async ([scene, t0, t1]) => {
  const belt = window.__belt, def = window.__scenes.get(scene);
  const rows = [];
  let last = "";
  for (let t = t0; t <= t1; t += 0.25) {
    const ev = belt.platesOn(def.belt, t).filter((p) => p.bubble || p.falling)
      .map((p) => `${p.id}${p.bubble ? ":" + p.bubble : ""}${p.shatter ? ":shatter" : p.falling ? ":fall" : ""}@${p.x.toFixed(0)},${p.y.toFixed(0)}`);
    const key = ev.map((e) => e.split("@")[0]).join(" ");
    if (key !== last) rows.push(`t=${t.toFixed(2)}  ${ev.join("  ") || "-"}`);
    last = key;
  }
  return rows;
}, [scene, +t0, +t1]);
console.log(out.join("\n"));
await b.close();
