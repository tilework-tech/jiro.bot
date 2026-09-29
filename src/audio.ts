// Tiny synthesized sound kit. Everything is generated with Web Audio so the
// site ships zero audio files.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = localStorage.getItem('jiro-sound') !== 'off';
const lastPlayed = new Map<string, number>();

function ac(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.42;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function isSoundOn() {
  return enabled;
}

export function setSound(on: boolean) {
  enabled = on;
  localStorage.setItem('jiro-sound', on ? 'on' : 'off');
  if (on) ac();
}

// Rate-limit identical sounds so a pile of colliding sushi doesn't turn into
// a buzzsaw.
function gate(name: string, ms: number) {
  const now = performance.now();
  if ((lastPlayed.get(name) ?? 0) + ms > now) return false;
  lastPlayed.set(name, now);
  return true;
}

function env(g: GainNode, t: number, a: number, peak: number, d: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.3, delay = 0) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, 0.005, vol, dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noise(dur: number, freq: number, q: number, vol = 0.3, type: BiquadFilterType = 'bandpass', sweepTo?: number, delay = 0) {
  const c = ac();
  if (!c || !master) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = c.createGain();
  env(g, t, 0.004, vol, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const sfx = {
  pick() {
    if (!gate('pick', 40)) return;
    tone('sine', rnd(520, 640), rnd(900, 1100), 0.09, 0.22);
  },
  drop() {
    if (!gate('drop', 40)) return;
    tone('sine', rnd(700, 800), rnd(300, 380), 0.1, 0.18);
  },
  thud(power = 1) {
    if (!gate('thud', 60)) return;
    const v = Math.min(0.45, 0.08 + power * 0.25);
    tone('sine', 150, 55, 0.18, v);
    noise(0.08, 900, 1.2, v * 0.5, 'lowpass');
  },
  squish(power = 1) {
    if (!gate('squish', 70)) return;
    const v = Math.min(0.3, 0.05 + power * 0.2);
    noise(0.12, rnd(500, 800), 4, v, 'bandpass', 200);
    tone('sine', rnd(260, 320), 120, 0.1, v * 0.6);
  },
  boing() {
    if (!gate('boing', 60)) return;
    const c = ac();
    if (!c || !master) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.35);
    lfo.frequency.value = 22;
    lg.gain.value = 40;
    lfo.connect(lg).connect(o.frequency);
    env(g, t, 0.005, 0.28, 0.4);
    o.connect(g).connect(master);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.45);
    lfo.stop(t + 0.45);
  },
  pop() {
    if (!gate('pop', 30)) return;
    tone('sine', rnd(900, 1300), 180, 0.07, 0.25);
    noise(0.03, 3000, 1, 0.12, 'highpass');
  },
  whoosh(up = true) {
    if (!gate('whoosh', 80)) return;
    noise(0.35, up ? 400 : 2500, 1.5, 0.22, 'bandpass', up ? 2800 : 300);
  },
  crunch() {
    if (!gate('crunch', 90)) return;
    for (let i = 0; i < 5; i++) noise(0.05, rnd(1200, 3500), 2, 0.3, 'bandpass', undefined, i * 0.05 + Math.random() * 0.02);
    tone('square', 90, 50, 0.12, 0.08);
  },
  chomp() {
    if (!gate('chomp', 120)) return;
    noise(0.07, 700, 2, 0.28, 'bandpass', 250);
    tone('sine', 220, 110, 0.08, 0.2);
    noise(0.07, 700, 2, 0.22, 'bandpass', 250, 0.16);
  },
  chime() {
    if (!gate('chime', 200)) return;
    [0, 4, 7, 12, 16].forEach((st, i) => tone('triangle', 660 * 2 ** (st / 12), 660 * 2 ** (st / 12), 0.5, 0.14, i * 0.07));
  },
  discover() {
    [0, 7, 12].forEach((st, i) => tone('sine', 880 * 2 ** (st / 12), 880 * 2 ** (st / 12) * 1.01, 0.35, 0.12, i * 0.06));
  },
  poof() {
    if (!gate('poof', 80)) return;
    noise(0.3, 1200, 0.7, 0.3, 'lowpass', 200);
  },
  rocket() {
    noise(0.9, 300, 0.8, 0.35, 'lowpass', 3000);
    tone('sawtooth', 80, 400, 0.8, 0.05);
  },
  boom() {
    tone('sine', 120, 30, 0.6, 0.5);
    noise(0.6, 1600, 0.6, 0.45, 'lowpass', 120);
  },
  blip(i = 0) {
    tone('square', 440 * 2 ** (i / 12), 440 * 2 ** (i / 12), 0.06, 0.06);
  },
  chirp() {
    if (!gate('chirp', 90)) return;
    tone('sine', 2400, 3600, 0.05, 0.12);
    tone('sine', 2600, 3900, 0.06, 0.1, 0.08);
  },
  splash() {
    noise(0.4, 1800, 0.9, 0.3, 'bandpass', 500);
  },
  kyaa() {
    if (!gate('kyaa', 150)) return;
    tone('sine', 900, 1500, 0.12, 0.12);
    tone('sine', 1500, 1100, 0.12, 0.1, 0.1);
  },
  whistle() {
    tone('sine', 1200, 2400, 0.25, 0.1);
  },
  snore() {
    if (!gate('snore', 600)) return;
    noise(0.6, 180, 3, 0.1, 'bandpass', 120);
  },
  note(i: number) {
    const scale = [0, 2, 4, 7, 9, 12, 14];
    const st = scale[((i % scale.length) + scale.length) % scale.length];
    tone('triangle', 523 * 2 ** (st / 12), 523 * 2 ** (st / 12), 0.22, 0.12);
  },
  zap() {
    tone('square', 1800, 90, 0.18, 0.08);
  },
  click() {
    if (!gate('click', 30)) return;
    tone('square', 2200, 1800, 0.02, 0.05);
  },
};
