// Synthesizes the SFX-only track (no music) from the scene's cue sheet.
import { writeFileSync, readFileSync } from 'node:fs';
const cues = JSON.parse(readFileSync(process.env.CUES ?? 'cues.json', 'utf8'));
const SR = 48000, DUR = cues.duration + 0.5;
const L = new Float32Array(Math.ceil(SR * DUR)), R = new Float32Array(L.length);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const add = (t0, buf, gain, pan = 0) => {
  const o = Math.floor(t0 * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < buf.length && o + i < L.length; i++) { if (o + i < 0) continue; L[o + i] += buf[i] * gl; R[o + i] += buf[i] * gr; }
};
const gen = (dur, f) => { const n = Math.floor(dur * SR), b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = f(i / SR, i / n); return b; };
const lp = (b, a) => { let y = 0; for (let i = 0; i < b.length; i++) { y += a * (b[i] - y); b[i] = y; } return b; };
const hp = (b, a) => { let y = 0, x0 = 0; for (let i = 0; i < b.length; i++) { const x = b[i]; y = a * (y + x - x0); x0 = x; b[i] = y; } return b; };
const sweep = (dur, f0, f1, env, shape = Math.sin) => { let ph = 0; return gen(dur, (t, u) => { const f = f0 * Math.pow(f1 / f0, u); ph += 2 * Math.PI * f / SR; return shape(ph) * env(u, t); }); };
const noise = (dur, env) => gen(dur, (t, u) => (rnd() * 2 - 1) * env(u, t));
const bell = (u) => Math.sin(Math.PI * u) ** 2;
const dec = (k) => (u, t) => Math.exp(-t * k);

const S = {
  key: () => { const b = hp(noise(0.03, dec(260)), 0.6); const c = sweep(0.02, 1800 + rnd() * 900, 900, dec(300)); for (let i = 0; i < c.length; i++) b[i] += c[i] * 0.3; return [b, 0.10 + rnd() * 0.05]; },
  tap: () => [sweep(0.06, 260, 140, dec(70)), 0.22],
  enter: () => { const b = hp(noise(0.05, dec(140)), 0.5); const c = sweep(0.05, 700, 300, dec(90)); for (let i = 0; i < c.length; i++) b[i] += c[i] * .5; return [b, 0.2]; },
  send: () => { const n = lp(noise(0.22, (u) => Math.pow(u, 1.5) * (1 - u) * 4), 0.15); const s = sweep(0.16, 500, 1300, (u) => bell(u)); for (let i = 0; i < s.length; i++) n[i] += s[i] * 0.35; return [n, 0.22]; },
  msg: () => { const a = sweep(0.12, 988, 740, dec(28)); const b = sweep(0.12, 1976, 1480, dec(40)); for (let i = 0; i < a.length; i++) a[i] += b[i] * 0.25; return [a, 0.18]; },
  pop: () => [sweep(0.05, 700, 1500, dec(80)), 0.16],
  pulse: () => [sweep(0.45, 1300, 2600, (u) => bell(u) * 0.8), 0.045],
  join: () => { const n1 = sweep(0.5, 660, 660, dec(9)), n2 = sweep(0.6, 990, 990, dec(8)); const out = new Float32Array(Math.floor(0.75 * SR)); for (let i = 0; i < n1.length; i++) out[i] += n1[i]; const o = Math.floor(0.11 * SR); for (let i = 0; i < n2.length && o + i < out.length; i++) out[o + i] += n2[i]; return [out, 0.15]; },
  tick: () => [sweep(0.025, 2000, 1800, dec(180)), 0.09],
  chip: () => [sweep(0.03, 2400, 2000, dec(150)), 0.08],
  swoosh: () => [lp(noise(0.6, (u) => bell(u)), 0.07), 0.16],
  whoosh: () => [lp(noise(0.9, (u) => bell(u)), 0.05), 0.2],
  rise: () => { const n = lp(noise(1.2, (u) => Math.pow(u, 2) * (u < .92 ? 1 : (1 - u) / .08)), 0.06); const s = sweep(1.2, 60, 120, (u) => u * (u < .92 ? 1 : (1 - u) / .08)); for (let i = 0; i < s.length; i++) n[i] += s[i] * 0.6; return [n, 0.2]; },
  hit: () => { const s = sweep(0.9, 95, 38, dec(4.5)); const c = lp(noise(0.04, dec(120)), 0.3); for (let i = 0; i < c.length; i++) s[i] += c[i]; return [s, 0.5]; },
  open: () => [sweep(0.3, 110, 60, dec(9)), 0.2],
  swipe: () => [lp(noise(0.25, (u) => bell(u)), 0.18), 0.1],
  busy: () => { const out = new Float32Array(Math.floor(0.35 * SR)); const sq = (p) => Math.tanh(Math.sin(p) * 3); for (const off of [0, 0.14]) { const b = sweep(0.1, 230, 200, dec(40), sq); const o = Math.floor(off * SR); for (let i = 0; i < b.length; i++) out[o + i] += b[i]; } return [lp(out, 0.3), 0.2]; },
  skip: () => { const out = new Float32Array(Math.floor(0.6 * SR)); for (let k = 0; k < 6; k++) { const b = sweep(0.02, 3200, 3000, dec(300)); const o = Math.floor(k * 0.08 * SR); for (let i = 0; i < b.length; i++) out[o + i] += b[i]; } return [out, 0.07]; },
  end: () => { const s = sweep(0.9, 640, 110, (u) => (1 - u) ** 1.5); const th = sweep(0.5, 80, 45, dec(7)); const out = new Float32Array(Math.floor(1.2 * SR)); for (let i = 0; i < s.length; i++) out[i] += s[i] * 0.6; const o = Math.floor(0.55 * SR); for (let i = 0; i < th.length; i++) out[o + i] += th[i]; return [out, 0.3]; },
  chime: () => { const a = sweep(1.8, 784, 784, dec(2.2)), b = sweep(1.8, 1568, 1568, dec(3.5)), c = sweep(1.8, 2352, 2352, dec(5)); for (let i = 0; i < a.length; i++) a[i] += b[i] * .35 + c[i] * .15; return [a, 0.13]; },
};
const PAN = { key: 0, tap: 0 };
// Air sweeps (whoosh, swoosh, swipe, rise) are always extraneous: never synthesize them.
const AIR = new Set(['whoosh', 'swoosh', 'swipe', 'rise', 'riser']);
for (const c of cues.cues) {
  if (AIR.has(c.k)) continue;
  const f = S[c.k]; if (!f) { console.warn('no sfx', c.k); continue; }
  const [buf, g] = f();
  add(c.t, buf, g, (PAN[c.k] ?? 0) + (rnd() - .5) * 0.2);
}
// soft limiter + WAV
let peak = 0; for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
console.log('peak', peak.toFixed(3));
const n = L.length, buf = Buffer.alloc(44 + n * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
const lim = (x) => Math.tanh(x * 1.1) * 0.89;
for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(lim(L[i]) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(lim(R[i]) * 32767), 46 + i * 4); }
writeFileSync(process.env.OUT ?? 'sfx.wav', buf);
