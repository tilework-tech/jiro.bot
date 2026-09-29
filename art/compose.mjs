// Assemble the chosen Gemini frames into the runtime sprite sheet.
// Static areas are locked to frame 0 so nothing shimmers between frames.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/home/sprite/.nori/browser-scripts/');
const { chromium } = require('playwright-core');
const here = new URL('.', import.meta.url).pathname;
const seq = JSON.parse(fs.readFileSync(here + 'sequence.json', 'utf8'));
const imgs = seq.frames.map((f) => fs.readFileSync(here + f.file).toString('base64'));
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = await browser.contexts()[0].newPage();
await page.setContent('<body></body>');
const url = await page.evaluate(async ({ imgs, lockAbove, thresh }) => {
  const S = 179;
  const load = async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, S, S).data; };
  const frames = [];
  for (const b of imgs) frames.push(await load(b));
  const base = frames[0];
  const sheet = document.createElement('canvas'); sheet.width = S * frames.length; sheet.height = S;
  const sx = sheet.getContext('2d');
  frames.forEach((d, n) => {
    const out = new Uint8ClampedArray(d);
    if (n > 0) {
      // Lock pixels that barely changed; keep real changes as solid regions.
      const changed = new Uint8Array(S * S);
      for (let p = 0; p < S * S; p++) {
        const y = (p / S) | 0;
        const k = p * 4;
        const dd = Math.hypot(d[k] - base[k], d[k + 1] - base[k + 1], d[k + 2] - base[k + 2]);
        changed[p] = y >= lockAbove && dd > thresh ? 1 : 0;
      }
      // Grow + close the change mask so arms stay whole.
      const grow = (m) => { const o = m.slice(); for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) { const p = y * S + x; if (m[p - 1] || m[p + 1] || m[p - S] || m[p + S]) o[p] = 1; } return o; };
      const shrink = (m) => { const o = m.slice(); for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) { const p = y * S + x; if (!(m[p - 1] && m[p + 1] && m[p - S] && m[p + S])) o[p] = 0; } return o; };
      let m = grow(grow(grow(changed)));
      m = shrink(m);
      // Keep only changes connected to where the forearms come out of the
      // sleeves: arms and whatever they hold. Anything else the model added
      // or moved on the counter is reverted to frame 0.
      const anchors = [[10, 110, 75, 160], [108, 92, 140, 117]];
      const label = new Int32Array(S * S);
      let id = 0;
      const keep = new Set();
      for (let p0 = 0; p0 < S * S; p0++) {
        if (!m[p0] || label[p0]) continue;
        id++;
        const stack = [p0];
        label[p0] = id;
        let hit = false;
        while (stack.length) {
          const p = stack.pop();
          const x = p % S, y = (p / S) | 0;
          if (anchors.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1)) hit = true;
          for (const q of [p - 1, p + 1, p - S, p + S]) {
            if (q < 0 || q >= S * S || label[q] || !m[q]) continue;
            if (Math.abs((q % S) - x) > 1) continue;
            label[q] = id;
            stack.push(q);
          }
        }
        if (hit) keep.add(id);
      }
      for (let p = 0; p < S * S; p++) if (m[p] && !keep.has(label[p])) m[p] = 0;
      for (let p = 0; p < S * S; p++) if (!m[p] || ((p / S) | 0) < lockAbove) for (let c = 0; c < 4; c++) out[p * 4 + c] = base[p * 4 + c];
    }
    const id = new ImageData(out, S, S);
    sx.putImageData(id, n * S, 0);
  });
  return sheet.toDataURL('image/png');
}, { imgs, lockAbove: seq.lockAbove, thresh: seq.thresh });
fs.writeFileSync(here + '../src/assets/jiro-make.png', Buffer.from(url.split(',')[1], 'base64'));
fs.writeFileSync(here + '../src/assets/jiro-make.json', JSON.stringify({ size: 179, frames: seq.frames.map((f) => ({ ms: f.ms, serve: !!f.serve, headDy: 0 })) }, null, 1));
console.log('frames', seq.frames.length);
await page.close();
await browser.close();
