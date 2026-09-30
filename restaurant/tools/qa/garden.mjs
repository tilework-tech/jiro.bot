// node qa/garden.mjs [base URL]; uses the session's existing headed browser over CDP.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:3000";
const b = await chromium.connectOverCDP(
  process.env.CDP_URL || "http://127.0.0.1:9222",
);
const page = b.contexts()[0].pages()[0] || (await b.contexts()[0].newPage());
await page.setViewportSize({ width: 1440, height: 900 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const proof = new URL("../../../.local/pr-proof/", import.meta.url);
await fs.mkdir(proof, { recursive: true });
const report = {};
await page.goto(base + "/?seg=bar&freeze=6");
await page.waitForTimeout(500);
report.population = await page.evaluate(async () => {
  const I = await import("/src/engine/items.ts"),
    B = window.__belt,
    count = { occupied: 0, normal: 0, absurd: 0, clever: 0 };
  let gap = 0,
    longestGap = 0,
    agencyFrames = 0;
  for (let id = -50000; id < 50000; id++) {
    if (B.slotOccupied(id)) {
      count.occupied++;
      count[I.kindOf(I.itemFor(id))]++;
      longestGap = Math.max(longestGap, gap);
      gap = 0;
    } else gap++;
  }
  for (let id = -250; id < 250; id++)
    if (B.slotOccupied(id) && I.passengerKind(id) === "clever")
      for (let t = 0; t < 24; t += 0.25) {
        const l = B.plateBehaviour(id, t);
        if (l.hop > 2 || l.bubble) agencyFrames++;
      }
  const chain = window.__chain;
  let joinError = 0;
  for (let i = 0; i < chain.length - 1; i++)
    joinError = Math.max(
      joinError,
      Math.abs(chain[i].phase - chain[i].U - chain[i].gap - chain[i + 1].phase),
    );
  return { ...count, longestGap, agencyFrames, joinError };
});
const pop = report.population;
assert.ok(pop.occupied > 49000 && pop.occupied < 51000);
assert.ok(Math.abs(pop.normal / pop.occupied - 0.6) < 0.01);
assert.ok(Math.abs(pop.absurd / pop.occupied - 0.35) < 0.01);
assert.ok(Math.abs(pop.clever / pop.occupied - 0.05) < 0.005);
assert.ok(pop.longestGap >= 5 && pop.agencyFrames > 0 && pop.joinError < 1e-8);
report.art = await page.evaluate(async () => {
  const { roomCanvas } = await import("/src/art/rooms.ts");
  return [...window.__scenes.keys()].map((id) => {
    const c = roomCanvas(id, 1),
      ctx = c.getContext("2d"),
      first = ctx.getImageData(0, 0, c.width, c.height).data.slice();
    roomCanvas(id, 3.7);
    const second = ctx.getImageData(0, 0, c.width, c.height).data;
    let changed = 0;
    for (let k = 0; k < first.length; k += 4)
      if (
        first[k] !== second[k] ||
        first[k + 1] !== second[k + 1] ||
        first[k + 2] !== second[k + 2]
      )
        changed++;
    return { id, width: c.width, height: c.height, animatedPixels: changed };
  });
});
for (const r of report.art) {
  assert.equal(r.width, 240);
  assert.equal(r.height, 135);
  assert.ok(r.animatedPixels > 0, r.id + " must move");
}
report.frames = [];
for (const id of [
  "bar",
  "office",
  "dining",
  "kitchen",
  "storage",
  "pantry",
  "street",
  "pond",
  "bar>office",
  "office>dining",
  "dining>kitchen",
  "kitchen>storage",
  "storage>pantry",
  "pantry>street",
  "street>pond",
])
  for (const tt of id.includes(">") ? [0.01, 0.5, 0.99] : [0.5]) {
    await page.goto(base + `/?seg=${encodeURIComponent(id)}&tt=${tt}&freeze=6`);
    await page.waitForTimeout(180);
    const name = id.replace(">", "-") + "-" + tt + ".png";
    await page.screenshot({ path: new URL(name, proof).pathname });
    report.frames.push(name);
  }
await page.goto(base + "/?seg=bar&freeze=6");
await page.waitForTimeout(400);
const drag = await page.evaluate(() => {
  const B = window.__belt,
    s = window.__scenes.get("bar"),
    r = document.querySelector("#stage").getBoundingClientRect(),
    p = B.platesOn(s.belt, 6).find((p) => p.y > 800 && p.y < 1000),
    pt = (x, y) => ({
      x: r.left + (x * r.width) / 1920,
      y: r.top + (y * r.height) / 1080,
    });
  return { id: p.id, from: pt(p.x, p.y - 15), to: pt(965, 580) };
});
await page.mouse.move(drag.from.x, drag.from.y);
await page.mouse.down();
await page.mouse.move(drag.to.x, drag.to.y, { steps: 20 });
await page.mouse.up();
await page.waitForTimeout(600);
report.drag = {
  removed: await page.evaluate((id) => window.__belt.taken.has(id), drag.id),
  toast: await page.locator("#toast p").textContent(),
};
assert.ok(report.drag.removed);
assert.match(report.drag.toast, /Jiro inspects/);
await page.screenshot({ path: new URL("parked-plate.png", proof).pathname });
await page.goto(base + "/?seg=pond&freeze=6");
await page.waitForTimeout(300);
report.pond = await page.evaluate(() => {
  const P = window.__pond,
    B = window.__belt,
    seen = new Set(),
    bad = [],
    count = { leap: 0, wait: 0, miss: 0 };
  for (const base of [0, 1000, 5000, 20000])
    for (let t = base; t < base + 100; t += 0.15)
      for (const e of P.events(t)) {
        if (e.tau < 0 || e.tau > 0.25 || seen.has(e.id)) continue;
        seen.add(e.id);
        count[e.kind]++;
        const at = t - e.tau,
          before = B.platesOn(P.belt, at - 0.05).find((p) => p.id === e.id),
          after = B.platesOn(P.belt, at + 0.05).find((p) => p.id === e.id);
        if (!before || after || Math.abs(before.x - 600) > 5) bad.push(e.id);
      }
  return { count, bad };
});
assert.deepEqual(report.pond.bad, []);
assert.ok(Object.values(report.pond.count).every((n) => n > 0));
await page.locator(".game-start").click();
await page.keyboard.press("Space");
await page.waitForTimeout(150);
report.game = await page.locator(".arcade canvas").getAttribute("data-s");
assert.match(report.game, /^play/);
await page.locator(".arcade .x").click();
assert.equal(await page.locator(".arcade").count(), 0);
await page.goto(base + "/?t=1790795973");
await page.waitForTimeout(300);
const a = await page.locator("#stage").evaluate((c) => c.toDataURL());
await page.waitForTimeout(400);
const d = await page.locator("#stage").evaluate((c) => c.toDataURL());
assert.notEqual(a, d);
report.liveClock = true;
await page.setViewportSize({ width: 844, height: 390 });
await page.goto(base + "/?seg=street");
await page.waitForTimeout(300);
await page.screenshot({
  path: new URL("mobile-landscape.png", proof).pathname,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base);
await page.waitForTimeout(200);
report.portraitHint = await page.locator(".rotate").isVisible();
assert.ok(report.portraitHint);
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(base);
assert.deepEqual(errors, []);
report.errors = errors;
await fs.writeFile(
  new URL("garden-qa.json", proof),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
await b.close();
