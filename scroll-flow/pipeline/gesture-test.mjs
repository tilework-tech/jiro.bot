// Deterministic scroll-gesture tests. Usage: site running on :3000, then: node pipeline/gesture-test.mjs
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/usr/bin/google-chrome', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{ width:320, height:180 } });
await p.goto('http://127.0.0.1:3000/', { waitUntil:'load' }); await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const J = window.__jiro; let t = 1e7; const res = [];
  const reset = () => { J.set(2); t += 5000; };
  const swipe = (sign = 1, stallAt = -1) => { for (const d of [4,10,18,26,32,36,38,38]) { J.wheel(sign*d, t); t += 16; } let d = 38; for (let i = 0; i < 90; i++) { d *= 0.955; if (i === stallAt) t += 400; J.wheel(sign*d, t); t += 16; } };
  const check = (name, want) => { const l = J.state().landed; res.push(`${l === want ? 'PASS' : 'FAIL'} ${name}: landed ${l}, want ${want}`); };
  reset(); swipe(); check('one trackpad swipe with 1.5 s momentum = one scene', 3);
  reset(); swipe(1, 30); check('momentum with a 400 ms stall still = one scene', 3);
  reset(); swipe(); t += 250; swipe(); check('swipe, short pause, swipe = two scenes', 4);
  reset(); { for (const d of [4,10,18,26,32,36,38,38]) { J.wheel(d, t); t += 16; } let d = 38; for (let i = 0; i < 30; i++) { d *= 0.955; J.wheel(d, t); t += 16; } J.set(J.state().landed - 0.12); swipe(); } check('new swipe during previous momentum = two scenes', 4);
  reset(); swipe(-1); check('swipe up = previous scene', 1);
  reset(); for (let i = 0; i < 5; i++) { J.wheel(8, t); t += 16; } t += 400; check('tiny nudge = stays', 2);
  reset(); J.wheel(100, t); check('one mouse-wheel click = next scene', 3);
  reset(); J.wheel(100, t); t += 300; J.wheel(100, t); check('two separate mouse clicks = two scenes', 4);
  reset(); for (let i = 0; i < 6; i++) { J.wheel(100, t); t += 40; } check('fast continuous wheel spin = one scene (locks)', 3);
  reset(); swipe(); swipe(-1); check('swipe down then immediately up = back', 2);
  return res;
});
console.log(out.join('\n'));
await b.close();
