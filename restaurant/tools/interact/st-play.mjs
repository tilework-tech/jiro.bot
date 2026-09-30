import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs=[]; pg.on("pageerror", e=>errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=storage&tt=0.5&t=2", { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
await pg.click('.scene-ui[data-id="storage"] .game-start');
// force all moles up for an alignment check
await pg.waitForTimeout(300);
await pg.evaluate(() => document.querySelectorAll('.scene-ui[data-id="storage"] .mole').forEach((m,i)=>{m.classList.add('up'); m.querySelector('img').src='/'+'items/'+(i%4?'bug':'duck')+'.png';}));
await pg.waitForTimeout(400);
await pg.screenshot({ path: "/tmp/polish-storage/after/play-allup.png" });
// eggs
for (const t of ["Light bulb","Jars","Mouse hole","Jiro"]) { await pg.click(`.scene-ui[data-id="storage"] .hit[title="${t}"]`); await pg.waitForTimeout(250); console.log(t, await pg.textContent('#toast')); }
await pg.screenshot({ path: "/tmp/polish-storage/after/eggs.png" });
console.log(errs);
await b.close();
