// Screenshot every stop and the full scroll for reference/.
// Usage: node pipeline/capture.mjs OUT_DIR  (site running on :3000; CHROME=path to Chrome; npm i playwright-core)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.argv[2]; mkdirSync(OUT + '/frames', { recursive: true }); mkdirSync(OUT + '/stops', { recursive: true });
const b = await chromium.launch({ executablePath:'/usr/bin/google-chrome', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport:{ width:1600, height:900 } });
await p.goto('http://127.0.0.1:3000/?s=0', { waitUntil:'load' });
await p.waitForTimeout(8000);
const shot = async (v, path, wait) => { await p.evaluate(v => window.__jiro.set(v), v); await p.waitForTimeout(wait); await p.evaluate(v => window.__jiro.set(v), v); await p.waitForTimeout(60); await p.screenshot({ path }); };
// warm every stop so videos/posters load
for (let i = 0; i <= 6; i++) { await p.evaluate(v => window.__jiro.set(v), i); await p.waitForTimeout(2500); }
for (let i = 0; i <= 6; i++) await shot(i, `${OUT}/stops/stop-${i}.png`, 3500);
let n = 0; const STEP = 0.025;
for (let i = 0; i < 6; i++) {
  for (let k = 0; k < 24; k++) await shot(i, `${OUT}/frames/f${String(n++).padStart(4,'0')}.png`, 40);
  for (let v = i + STEP; v < i + 1 - 1e-6; v += STEP) await shot(+v.toFixed(3), `${OUT}/frames/f${String(n++).padStart(4,'0')}.png`, 40);
}
for (let k = 0; k < 36; k++) await shot(6, `${OUT}/frames/f${String(n++).padStart(4,'0')}.png`, 40);
console.log('frames', n);
await b.close();
