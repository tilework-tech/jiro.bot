import { chromium } from "playwright";
const w=+process.argv[2], h=Math.round(w*9/16);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: w, height: h } });
await pg.goto(`http://localhost:3000/?seg=kitchen&tt=0.5&t=5`, { waitUntil: "networkidle" });
await pg.waitForTimeout(600);
console.log(await pg.evaluate(() => ({ sy: scrollY, ih: innerHeight, sh: document.documentElement.scrollHeight, top: document.querySelector('.top').getBoundingClientRect().top, frame: document.querySelector('#frame').getBoundingClientRect().top, vv: visualViewport.offsetTop })));
await b.close();
