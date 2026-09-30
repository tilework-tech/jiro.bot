import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&freeze=0`, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
const r = await pg.evaluate(async () => {
  const P = window.__pond, B = P, belt = P.belt;
  const seen = new Map(), bad = [];
  const count = { leap: 0, wait: 0, miss: 0 };
  for (const T0 of [0, 1000, 5000, 9000, 20000, 77777, 123456.7, 400000, 1.7e6, 3e6]) {
    for (let t = T0; t < T0 + 60; t += 0.1) {
      for (const e of P.events(t)) {
        if (e.tau < 0 || e.tau > 0.3) continue;
        const key = T0 + ":" + e.id;
        if (seen.has(key)) continue;
        seen.set(key, e.kind); count[e.kind]++;
        const tA = t - e.tau;
        const on = (tt) => B.platesOn(belt, tt).find((p) => p.id === e.id);
        const before = on(tA - 0.05), after = on(tA + 0.05);
        if (!B.slotOccupied(e.id) || B.plateBehaviour(e.id, tA).gone || !before || after || Math.abs(before.x - 600) > 4)
          bad.push({ id: e.id, occ: B.slotOccupied(e.id), before: before && before.x, after: !!after });
      }
      // Every plate that leaves the belt end must be taken over by an event.
      for (const p of B.platesOn(belt, t)) if (p.x < 603 && !B.platesOn(belt, t + 0.1).find((q) => q.id === p.id)) {
        if (!P.events(t + 0.1).some((e) => e.id === p.id)) bad.push({ orphan: p.id, t });
      }
    }
  }
  return { n: seen.size, count, bad: bad.slice(0, 10), nbad: bad.length };
});
console.log(JSON.stringify(r), errs.join("\n"));
await b.close();
