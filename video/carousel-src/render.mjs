// Renders one carousel scene and cut to a master MP4, the web encode and the
// poster in site/video/carousel/. Serve the jiro.bot repo root on PORT first.
//
//   node render.mjs --scene=rbac --cut=desktop            full render (desktop 5:4 or mobile 4:5)
//   node render.mjs --scene=rbac --cut=poster             the shared square poster, frame 0
//   node render.mjs --scene=rbac --cut=mobile --times=2,9 stills only
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const SCENE = args.scene, CUT = args.cut ?? 'desktop';
const FPS = Number(args.fps ?? 30);
const PORT = process.env.PORT ?? '3011';
const SITE_OUT = '../../site/video/carousel';
// Web encode: flat UI and slow motion compress well; mobile is smaller in pixels so it gets a lower CRF.
const CRF = { desktop: 30, mobile: 29 }[CUT];

const browser = await chromium.launch();
const SIZE = { desktop: [1200, 960], mobile: [720, 900], poster: [1080, 1080] }[CUT];
const page = await browser.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
await page.goto(`http://127.0.0.1:${PORT}/video/carousel-src/built/${SCENE}.html?cut=${CUT}`);
const duration = await page.evaluate(() => window.__init());

if (args.times) {
  mkdirSync('stills', { recursive: true });
  for (const t of args.times.split(',').map(Number)) {
    await page.evaluate((t) => window.__seek(t), t);
    await page.screenshot({ path: `stills/${SCENE}-${CUT}-${t.toFixed(1).padStart(4, '0')}.png` });
  }
  await browser.close();
  process.exit(0);
}

mkdirSync('out', { recursive: true }); mkdirSync(SITE_OUT, { recursive: true });
if (CUT === 'poster') {
  await page.screenshot({ path: `${SITE_OUT}/${SCENE}-poster.jpg`, type: 'jpeg', quality: 80 });
  await browser.close();
  console.log('wrote', `${SITE_OUT}/${SCENE}-poster.jpg`);
  process.exit(0);
}
const master = `out/${SCENE}-${CUT}-master.mp4`;
const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', master],
{ stdio: ['pipe', 'ignore', 'inherit'] });
// The scene wraps at `duration`, so frame N would equal frame 0: stop one frame short for a seamless loop.
const N = Math.round(duration * FPS);
for (let f = 0; f < N; f++) {
  await page.evaluate((t) => window.__seek(t), f / FPS);
  const img = await page.screenshot({ type: 'jpeg', quality: 94 });
  if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`${SCENE}-${CUT} frame ${f}/${N}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();

const web = `${SITE_OUT}/${SCENE}-${CUT}.mp4`;
const run = (a) => { const r = spawnSync(ffmpeg, ['-y', '-v', 'error', ...a], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
run(['-i', master, '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'stillimage', '-crf', String(CRF),
  '-profile:v', 'high', '-level:v', '4.0', '-g', String(FPS * 10), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', web]);
console.log('wrote', web);
