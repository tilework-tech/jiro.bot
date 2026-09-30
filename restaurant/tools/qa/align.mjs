// usage: node qa/align.mjs [seg ...]   (default: every transition)
// Lists every belt path a transition draws (via the engine's __beltProbe hook) with its
// global offset off = J at the path's u=0, length U and end points, then checks joins:
//  - path end == another path's start (same coords)  -> delta = (offA + UA) - offB
//  - path start/end on a scene belt (same coords)     -> delta = offP + uP - (offS + uS)
// delta is in world units; 0 = the same plate continues. delta / 130 = slot (identity) shift.
import { chromium } from "playwright";
const segs = process.argv.slice(2);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
await pg.addInitScript(() => {
  window.__paths = new Map();
  window.__beltProbe = (p, phase, U, off) => {
    const k = JSON.stringify(p.pts[0]) + JSON.stringify(p.pts[p.pts.length - 1]) + U.toFixed(1);
    if (!window.__paths.has(k)) window.__paths.set(k, { pts: p.pts, U, off, phase });
  };
});
const list = segs.length ? segs : ["bar>office", "office>dining", "dining>kitchen", "kitchen>storage", "storage>pantry", "pantry>street", "street>pond"];
await pg.goto(`http://localhost:3000/?seg=bar&tt=0.5&freeze=3`, { waitUntil: "networkidle" });
const chain = await pg.evaluate(() => window.__chain);
for (const seg of list) {
  const paths = new Map();
  for (const tt of [0.02, 0.25, 0.5, 0.75, 0.98]) {
    await pg.goto(`http://localhost:3000/?seg=${encodeURIComponent(seg)}&tt=${tt}&freeze=3`, { waitUntil: "networkidle" });
    await pg.waitForTimeout(250);
    for (const [k, v] of await pg.evaluate(() => [...window.__paths.entries()])) paths.set(k, v);
  }
  console.log(`\n== ${seg}`);
  const P = [...paths.values()];
  const d2 = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1]);
  // Scene belts (as drawn) are among the paths: identify them by matching chain offsets.
  for (const p of P) {
    const sc = chain.find((c) => Math.abs(c.off - p.off) < 0.01 && Math.abs(c.U - p.U) < 0.01);
    p.name = sc ? `scene:${sc.id}` : `path[${P.indexOf(p)}]`;
    const s = p.pts[0], e = p.pts[p.pts.length - 1];
    console.log(`${p.name.padEnd(14)} off ${p.off.toFixed(1).padStart(8)} U ${p.U.toFixed(1).padStart(7)}  (${s[0].toFixed(0)},${s[1].toFixed(0)}) -> (${e[0].toFixed(0)},${e[1].toFixed(0)})`);
  }
  for (const a of P) for (const c of P) {
    if (a === c) continue;
    const ae = a.pts[a.pts.length - 1], cs = c.pts[0];
    if (d2(ae, cs) < 3) {
      const delta = a.off + a.U - c.off;
      console.log(`  join ${a.name} end -> ${c.name} start: delta ${delta.toFixed(1)} (${(delta / 130).toFixed(2)} slots)`);
    }
  }
}
await b.close();
