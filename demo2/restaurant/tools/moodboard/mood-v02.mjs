import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await pg.goto("http://localhost:3000/?seg=pantry&tt=0.5&t=5&mood=2", { waitUntil: "networkidle" });
for (let k=0;k<10;k++){ await pg.waitForTimeout(2500); if (await pg.locator(".mv02 .tile").count()) break; await pg.goto("http://localhost:3000/?seg=pantry&tt=0.5&t=5&mood=2").catch(()=>{}); }
await pg.screenshot({ path: "/tmp/v02-a.png" });
// click recipe 3
await pg.click('.mv02 .recipes button[data-r="billing"]');
await pg.waitForTimeout(900);
await pg.screenshot({ path: "/tmp/v02-mid.png" });
await pg.waitForTimeout(2200);
await pg.screenshot({ path: "/tmp/v02-b.png" });
await pg.click('.mv02 .clear');
await pg.waitForTimeout(500);
// drag sentry and stripe in
const drag = async (id, slot) => {
  const t = await pg.locator(`.mv02 .tile[data-c="${id}"]`).boundingBox();
  const s = await pg.locator(`.mv02 .slot[data-i="${slot}"]`).boundingBox();
  await pg.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
  await pg.mouse.down();
  await pg.mouse.move(t.x + 60, t.y - 50, { steps: 5 });
  await pg.mouse.move(s.x + s.width / 2, s.y + s.height / 2, { steps: 8 });
  await pg.mouse.up();
};
await drag("sentry", 0);
await drag("github", 4);
await pg.waitForTimeout(400);
await pg.screenshot({ path: "/tmp/v02-c.png" });
await drag("stripe", 8);
await pg.waitForTimeout(800);
await pg.screenshot({ path: "/tmp/v02-d.png" });
await pg.click(".mv02 .out"); await pg.waitForTimeout(300);
await pg.screenshot({ path: "/tmp/v02-e.png" });
await pg.waitForTimeout(600);
await drag("linear", 2);
await drag("slack", 6);
await pg.waitForTimeout(1300);
await pg.screenshot({ path: "/tmp/v02-f.png" });
console.log(errs.join("\n") || "no errors");
await b.close();
