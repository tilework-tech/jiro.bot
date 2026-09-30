import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=kitchen&tt=0.5&t=5", { waitUntil: "networkidle" });
await pg.waitForTimeout(600);
const s = await pg.$$('.scene-ui[data-id="kitchen"] .faq-sushi');
console.log("sushi", s.length);
await s[1].click(); await pg.waitForTimeout(150);
await pg.screenshot({ path: `${out}/click-talk.png` });
await pg.waitForTimeout(500);
await pg.screenshot({ path: `${out}/click1.png` });
await s[3].click(); await pg.waitForTimeout(700);
await pg.screenshot({ path: `${out}/click3.png` });
await pg.click('.scene-ui[data-id="kitchen"] .k-answer .x'); await pg.waitForTimeout(500);
console.log("open after close:", await pg.$$eval('.k-ask.on', (e) => e.length));
await s[7].click(); await pg.waitForTimeout(600);
await pg.keyboard.press("Escape"); await pg.waitForTimeout(400);
console.log("open after esc:", await pg.$$eval('.k-ask.on', (e) => e.length));
// eggs
for (const t of ["Plate stack", "Swinging doors", "Jiro", "Knives", "Pot"]) {
  await pg.click(`.scene-ui[data-id="kitchen"] .hit[title="${t}"]`); await pg.waitForTimeout(t === "Swinging doors" ? 250 : 350);
  if (t === "Plate stack" || t === "Swinging doors" || t === "Jiro") await pg.screenshot({ path: `${out}/egg-${t.replace(" ", "")}.png` });
  console.log(t, await pg.$eval("#toast", (e) => e.textContent));
}
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
