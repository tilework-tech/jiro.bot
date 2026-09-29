// node art/fit.mjs ref.png in.jpg out.png  → 179px frame on the ref's grid.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/home/sprite/.nori/browser-scripts/');
const { chromium } = require('playwright-core');
const here = new URL('.', import.meta.url).pathname;
const [refF, ...rest] = process.argv.slice(2);
const pairs = [];
for (let i = 0; i < rest.length; i += 2) pairs.push([rest[i], rest[i + 1]]);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = await browser.contexts()[0].newPage();
await page.setContent('<body></body>');
await page.addScriptTag({ content: fs.readFileSync(here + 'fit.js', 'utf8') });
for (const [inF, outF] of pairs) {
  const r = await page.evaluate(async ({ ref, gen, mime }) => {
    const load = async (src) => { const i = new Image(); i.src = src; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return { d: x.getImageData(0, 0, i.width, i.height).data, w: i.width, h: i.height }; };
    const R = await load('data:image/png;base64,' + ref);
    const G = await load(`data:${mime};base64,` + gen);
    const F = window.JiroFit;
    // Static parts: the wall, noren, bottles, lamp and his head/shoulders.
    const region = (x, y) => y < 100 && !(x > 118 && y > 45);
    const fit = F.align(R.d, G.d, G.w, G.h, region);
    const snapped = F.snap(F.resample(G.d, G.w, G.h, fit), R.d);
    const c = document.createElement('canvas'); c.width = c.height = F.S;
    const x = c.getContext('2d'); const id = x.createImageData(F.S, F.S); id.data.set(snapped); x.putImageData(id, 0, 0);
    return { fit, gw: G.w, url: c.toDataURL('image/png') };
  }, { ref: fs.readFileSync(refF).toString('base64'), gen: fs.readFileSync(inF).toString('base64'), mime: inF.endsWith('.png') ? 'image/png' : 'image/jpeg' });
  fs.writeFileSync(outF, Buffer.from(r.url.split(',')[1], 'base64'));
  console.log(inF, '→', outF, JSON.stringify({ ...r.fit, gw: r.gw }));
}
await page.close();
await browser.close();
