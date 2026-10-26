import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const W = Number(args.w ?? 1080), H = Number(args.h ?? 1080);
const FPS = Number(args.fps ?? 60);
const stills = args.times ? args.times.split(',').map(Number) : null;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`http://127.0.0.1:3001/index24.html?w=${W}&h=${H}`);
const duration = await page.evaluate(() => window.__init());
writeFileSync('cues.json', JSON.stringify({ duration, cues: await page.evaluate(() => window.__cues()) }));
if (args.cues) { await b.close(); process.exit(0); }
if (stills) {
  mkdirSync('stills', { recursive: true });
  for (const t of stills) { await page.evaluate((t) => window.__seek(t), t); await page.screenshot({ path: `stills/v24_${t}.png` }); }
  await b.close(); process.exit(0);
}
const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', process.env.OUT ?? 'video.mp4'], { stdio: ['pipe', 'ignore', 'inherit'] });
const N = Math.round(duration * FPS);
for (let f = 0; f < N; f++) {
  await page.evaluate((t) => window.__seek(t), f / FPS);
  const img = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 300 === 0) console.log(`frame ${f}/${N}`);
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r));
await b.close();
