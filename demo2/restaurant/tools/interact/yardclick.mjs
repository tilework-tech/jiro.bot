import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=yard&tt=0.5", { waitUntil: "networkidle" });
await pg.evaluate(() => localStorage.removeItem("jiro-eggs"));
await pg.reload({ waitUntil: "networkidle" }); await pg.waitForTimeout(800);
const layer = pg.locator('.scene-ui[data-id="yard"]');
const eggs = async () => (await pg.locator(".eggs").innerText()).trim();
console.log("start", await eggs());
for (const name of ["Sleeping cat", "Stacks of clean plates", "Wash tub"]) {
  await layer.getByRole("button", { name }).click(); await pg.waitForTimeout(400);
  console.log(name, "->", await eggs());
}
await pg.screenshot({ path: "/tmp/polish-yard/click_tub.png", clip: { x: 560, y: 380, width: 480, height: 460 } });
const towels = layer.locator('button[title$="integration"]');
console.log("towels", await towels.count());
for (let i = 0; i < await towels.count(); i++) { await towels.nth(i).click(); await pg.waitForTimeout(120); }
await pg.waitForTimeout(400);
console.log("towels ->", await eggs());
await pg.screenshot({ path: "/tmp/polish-yard/click_full.png" });
await layer.getByRole("button", { name: "Garden hose" }).click(); await pg.waitForTimeout(600);
await pg.screenshot({ path: "/tmp/polish-yard/click_hose.png" });
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
