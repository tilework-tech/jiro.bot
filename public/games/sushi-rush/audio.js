'use strict';
/*
 * Sushi Rush audio: everything synthesized with WebAudio (no files), in the same
 * character as the site's src/audio.ts (short sine/noise blips through a gentle compressor).
 *
 * - SFX hooked to EVT (runner, maze boss, shell state).
 * - Music: lookahead scheduler (setInterval 25ms, ~120ms horizon) playing a yo-scale
 *   shamisen/koto-pluck loop in runner stages (tempo rises with stage) and a tenser in-scale
 *   loop during the boss (Shell.engine.phase === 'boss'). Ducked on pause, stopped on title/over.
 * - Mute button injected into #toolbar (aria-pressed), key M, persisted in localStorage 'jiro-games-muted'.
 * - AudioContext is only created on the first user gesture and never throws if unavailable.
 */
(() => {
  const KEY = 'jiro-games-muted';
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* storage blocked */ }

  let ctx = null, master = null, sfxBus = null, musicBus = null, musicGain = null, noiseBuf = null, pulseWave = null;
  let broken = false;
  // run a promise-returning ctx call without ever surfacing an error/unhandled rejection
  const safe = (fn) => { try { const p = fn(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } };

  function build() {
    if (ctx || broken) return ctx;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) { broken = true; return null; }
      ctx = new Ctor();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 6;
      master = ctx.createGain(); master.gain.value = 0.32;
      master.connect(comp); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      // music: gain (for ducking) -> bus -> master, plus a short slap-back echo for space
      musicGain = ctx.createGain(); musicGain.gain.value = 0;
      musicBus = ctx.createGain(); musicBus.gain.value = 0.55;
      musicGain.connect(musicBus); musicBus.connect(master);
      const dly = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), dlp = ctx.createBiquadFilter();
      dly.delayTime.value = 0.19; fb.gain.value = 0.28; wet.gain.value = 0.2; dlp.type = 'lowpass'; dlp.frequency.value = 1800;
      musicGain.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(wet); wet.connect(musicBus);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // 25% pulse: nasal, shamisen-ish twang
      const N = 24, re = new Float32Array(N), im = new Float32Array(N), duty = 0.25;
      for (let n = 1; n < N; n++) {
        re[n] = (2 / (n * Math.PI)) * Math.sin(2 * Math.PI * n * duty);
        im[n] = (2 / (n * Math.PI)) * (1 - Math.cos(2 * Math.PI * n * duty));
      }
      pulseWave = ctx.createPeriodicWave(re, im);
    } catch (e) { broken = true; ctx = null; }
    return ctx;
  }

  // Returns a running context or null (muted / unavailable / not yet unlocked).
  function ac() {
    if (muted || !ctx) return null;
    if (ctx.state === 'suspended') safe(() => ctx.resume());
    return ctx;
  }

  function unlock() {
    if (muted) return;
    if (!build()) return;
    if (ctx.state === 'suspended') safe(() => ctx.resume());
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, { capture: true, passive: true });

  // ---------- primitives (absolute time t) ----------
  const last = {};
  function gate(name, ms) {
    const now = performance.now();
    if ((last[name] || 0) + ms > now) return false;
    last[name] = now; return true;
  }
  const semi = (base, s) => base * Math.pow(2, s / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, f) {
    const o = ctx.createOscillator();
    if (type === 'pulse') o.setPeriodicWave(pulseWave); else o.type = type;
    o.frequency.value = f;
    return o;
  }
  // simple pitched blip: f0 -> f1 over dur
  function tone(out, type, f0, f1, dur, vol, t) {
    const o = osc(type, f0), g = ctx.createGain();
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, 0.004, vol, dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(out, dur, freq, q, vol, type, t, sweepTo) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = type || 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    env(g, t, 0.003, vol, dur);
    s.connect(f); f.connect(g); g.connect(out);
    s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.05);
  }
  // shamisen/koto pluck: pulse (or triangle) with a tiny downward bend and closing lowpass
  function pluck(out, f, t, vol, dur, type) {
    const o = osc(type || 'pulse', f), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.frequency.setValueAtTime(f * 1.02, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(Math.min(9000, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + dur);
    env(g, t, 0.003, vol, dur);
    o.connect(lp); lp.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function taiko(out, t, vol) {
    tone(out, 'sine', 125, 46, 0.28, vol, t);
    noise(out, 0.07, 320, 0.8, vol * 0.45, 'lowpass', t);
  }
  function shime(out, t, vol) { noise(out, 0.035, 6000, 0.7, vol, 'highpass', t); }
  function clack(out, t, vol) {
    tone(out, 'sine', 2100, 1900, 0.03, vol, t);
    noise(out, 0.03, 2600, 6, vol * 0.8, 'bandpass', t);
  }
  function kane(out, t, vol, f) { // small temple bell, inharmonic partials
    f = f || 520;
    tone(out, 'sine', f, f, 0.9, vol, t);
    tone(out, 'sine', f * 2.76, f * 2.76, 0.45, vol * 0.4, t);
    tone(out, 'sine', f * 5.4, f * 5.4, 0.2, vol * 0.15, t);
  }

  // ---------- SFX ----------
  const D4 = 293.66;
  const now = () => ctx.currentTime + 0.005;
  function fx(name, ms, fn) {
    return (d) => {
      if (!ac() || !sfxBus) return;
      if (ms && !gate(name, ms)) return;
      try { fn(now(), sfxBus, d || {}); } catch (e) { /* never break the game */ }
    };
  }

  let riceFlip = false, lastHitAt = 0;
  const S = {
    jump: fx('jump', 50, (t, o) => { tone(o, 'pulse', 300, 640, 0.11, 0.09, t); tone(o, 'sine', 420, 880, 0.08, 0.06, t); }),
    land: fx('land', 90, (t, o, d) => {
      const v = Math.min(1, Math.max(0, ((d.vy || 0) - 150) / 900));
      if (v <= 0.05) return;
      tone(o, 'sine', 140, 60, 0.09, 0.04 + v * 0.1, t);
      noise(o, 0.04, 700, 1, 0.02 + v * 0.05, 'lowpass', t);
    }),
    hit: fx('hit', 120, (t, o) => {
      lastHitAt = performance.now();
      tone(o, 'sine', 170, 45, 0.22, 0.4, t);
      tone(o, 'square', 420, 90, 0.16, 0.08, t);
      for (let i = 0; i < 5; i++) noise(o, 0.05, rnd(1200, 3600), 2, 0.28, 'bandpass', t + i * 0.035 + Math.random() * 0.015);
    }),
    fall: fx('fall', 300, (t, o) => { tone(o, 'triangle', 900, 140, 0.55, 0.14, t); noise(o, 0.5, 2400, 1.4, 0.07, 'bandpass', t, 300); }),
    item: fx('item', 40, (t, o) => {
      pluck(o, semi(D4, 24), t, 0.12, 0.12, 'triangle');
      pluck(o, semi(D4, 31), t + 0.06, 0.12, 0.22, 'triangle');
      tone(o, 'sine', 1400, 2200, 0.06, 0.05, t);
    }),
    stage: fx('stage', 400, (t, o) => {
      [7, 12, 14, 19].forEach((s, i) => pluck(o, semi(D4, s), t + i * 0.075, 0.13, i === 3 ? 0.45 : 0.15));
      clack(o, t, 0.12); clack(o, t + 0.075, 0.08); shime(o, t + 0.225, 0.08);
    }),
    chime: fx('chime', 300, (t, o) => { pluck(o, semi(D4, 19), t, 0.1, 0.2, 'triangle'); pluck(o, semi(D4, 24), t + 0.08, 0.1, 0.3, 'triangle'); }),
    bossStart: fx('bossStart', 800, (t, o) => {
      // low dissonant swell (D + Eb) under a temple bell, then a taiko roll: don . . don-don DON
      for (const f of [73.4, 77.8, 110]) {
        const x = osc('sawtooth', f), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(900, t + 0.9);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
        x.connect(lp); lp.connect(g); g.connect(o); x.start(t); x.stop(t + 1.3);
      }
      kane(o, t, 0.12, 415);
      taiko(o, t, 0.5); taiko(o, t + 0.45, 0.35); taiko(o, t + 0.6, 0.4); taiko(o, t + 0.8, 0.6);
      noise(o, 0.6, 3000, 0.8, 0.05, 'highpass', t + 0.8);
    }),
    bossWin: fx('bossWin', 800, (t, o) => {
      [0, 5, 7, 12, 14].forEach((s, i) => pluck(o, semi(D4, s), t + i * 0.07, 0.13, 0.14));
      // held top note with vibrato
      const x = osc('pulse', semi(D4, 19)), lfo = ctx.createOscillator(), lg = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      const t2 = t + 0.35;
      lfo.frequency.value = 6; lg.gain.value = 9; lfo.connect(lg); lg.connect(x.frequency);
      lp.type = 'lowpass'; lp.frequency.value = 2600;
      env(g, t2, 0.01, 0.12, 0.7);
      x.connect(lp); lp.connect(g); g.connect(o);
      x.start(t2); lfo.start(t2); x.stop(t2 + 0.8); lfo.stop(t2 + 0.8);
      pluck(o, semi(D4, 7), t2, 0.08, 0.6, 'triangle');
      taiko(o, t, 0.4); taiko(o, t2, 0.55);
      kane(o, t2, 0.08, 880);
      noise(o, 0.5, 5000, 0.7, 0.06, 'highpass', t2);
    }),
    rice: fx('rice', 35, (t, o) => {
      riceFlip = !riceFlip;
      tone(o, 'square', riceFlip ? 880 : 660, riceFlip ? 990 : 590, 0.045, 0.045, t);
    }),
    roe: fx('roe', 100, (t, o) => { tone(o, 'sine', 500, 1300, 0.09, 0.16, t); noise(o, 0.03, 3000, 1, 0.08, 'highpass', t); }),
    fright: fx('fright', 300, (t, o) => {
      const x = osc('triangle', 520), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
      lfo.frequency.value = 11; lg.gain.value = 60; lfo.connect(lg); lg.connect(x.frequency);
      x.frequency.setValueAtTime(700, t); x.frequency.exponentialRampToValueAtTime(260, t + 0.5);
      env(g, t, 0.01, 0.12, 0.5);
      x.connect(g); g.connect(o); x.start(t); lfo.start(t); x.stop(t + 0.56); lfo.stop(t + 0.56);
    }),
    ghostEaten: fx('ghostEaten', 150, (t, o) => {
      [0, 4, 7, 12, 16].forEach((s, i) => tone(o, 'square', semi(D4 * 2, s), semi(D4 * 2, s), 0.05, 0.05, t + i * 0.035));
      tone(o, 'sine', 300, 90, 0.2, 0.2, t);
    }),
    pickup: fx('pickup', 60, (t, o) => { pluck(o, semi(D4, 19), t, 0.12, 0.1, 'triangle'); pluck(o, semi(D4, 26), t + 0.06, 0.12, 0.25, 'triangle'); }),
    death: fx('death', 400, (t, o) => {
      tone(o, 'sine', 170, 45, 0.25, 0.38, t);
      for (let i = 0; i < 4; i++) noise(o, 0.05, rnd(1200, 3400), 2, 0.25, 'bandpass', t + i * 0.04);
      tone(o, 'square', 600, 70, 0.7, 0.06, t + 0.1);
    }),
    over: fx('over', 900, (t, o) => {
      const t0 = t + 0.3;
      [12, 8, 7, 1, 0].forEach((s, i) => pluck(o, semi(D4, s), t0 + i * 0.16, 0.12, i === 4 ? 0.8 : 0.22));
      taiko(o, t0 + 0.64, 0.4);
      kane(o, t0 + 0.64, 0.05, 311);
    }),
    puddle: fx('puddle', 120, (t, o) => { noise(o, 0.16, 1400, 3, 0.12, 'bandpass', t, 250); tone(o, 'sine', 240, 110, 0.1, 0.06, t); }),
    inflate: fx('inflate', 300, (t, o) => { tone(o, 'sine', 110, 330, 0.35, 0.16, t); noise(o, 0.35, 400, 1.5, 0.08, 'bandpass', t, 2200); }),
    start: fx('start', 200, (t, o) => {
      clack(o, t, 0.16); clack(o, t + 0.09, 0.16);
      [0, 5, 7, 12].forEach((s, i) => pluck(o, semi(D4, s), t + 0.18 + i * 0.05, 0.11, i === 3 ? 0.3 : 0.1));
    }),
    pause: fx('pause', 120, (t, o) => { tone(o, 'triangle', 880, 880, 0.06, 0.08, t); tone(o, 'triangle', 660, 660, 0.09, 0.08, t + 0.07); }),
    resume: fx('resume', 120, (t, o) => { tone(o, 'triangle', 660, 660, 0.06, 0.08, t); tone(o, 'triangle', 880, 880, 0.09, 0.08, t + 0.07); }),
    toggle: fx('toggle', 60, (t, o) => { pluck(o, semi(D4, 12), t, 0.1, 0.1, 'triangle'); pluck(o, semi(D4, 19), t + 0.05, 0.1, 0.18, 'triangle'); }),
  };

  // ---------- Music ----------
  // Runner loop: yo scale (D E G A B), 8 bars of eighth notes; null = rest. Semitones above D4.
  const _ = null;
  const RUN_LEAD = [
    12, _, 9, 7, 9, _, 12, 14,   12, 9, 7, _, 5, 7, 9, _,
    7, 9, 12, _, 14, 12, 9, 7,   5, _, 7, 5, 2, _, 0, _,
    14, _, 17, 14, 12, _, 9, _,  12, 14, 12, 9, 7, _, 9, _,
    9, 12, 9, 7, 5, 7, 9, 12,    7, _, 5, 2, 0, _, _, _,
  ];
  const RUN_ROOT = [0, 5, 7, 0, 5, 0, 7, 0]; // per bar, above D3
  // Boss loop: in scale (D Eb G A Bb), 4 bars.
  const BOSS_LEAD = [
    12, _, 13, _, 12, _, 8, 7,   8, _, 7, 5, 7, _, _, _,
    13, _, 17, _, 13, 12, 8, _,  7, 8, 7, 5, 1, _, 0, _,
  ];
  const BOSS_BASS = [0, 0, 12, 0, 1, 0, 12, 0, 0, 0, 12, 0, 8, 7, 5, 1]; // 16ths, above D2
  const D3 = 146.83, D2 = 73.42;

  function stageNum() { const e = typeof Shell !== 'undefined' && Shell.engine; return (e && e.stage) || 1; }
  function bpm(track) {
    const s = stageNum();
    return track === 'boss' ? Math.min(168, 140 + s * 2) : Math.min(152, 112 + (s - 1) * 5);
  }
  function frightened() {
    const e = typeof Shell !== 'undefined' && Shell.engine, m = e && e.cur;
    return !!(m && m.ghosts && m.ghosts.some((g) => g.fright > 0));
  }

  function playRunStep(i, t, sd, o) {
    const s = i % 128, bar = (s >> 4), b = s & 15;
    if (!(b & 1)) {
      const n = RUN_LEAD[s >> 1];
      if (n !== null) pluck(o, semi(D4, n), t, 0.09, sd * 2.6);
      // koto echo an octave down on bar downbeats
      if (b === 0 && n !== null) pluck(o, semi(D4, n - 12), t, 0.05, sd * 6, 'triangle');
    }
    const r = RUN_ROOT[bar];
    const bassPat = { 0: r, 4: r + 7, 8: r + 12, 12: r + 7, 14: r };
    if (bassPat[b] !== undefined) tone(o, 'triangle', semi(D3, bassPat[b] - 12), semi(D3, bassPat[b] - 12), sd * 1.8, b === 14 ? 0.1 : 0.16, t);
    const fill = (bar & 3) === 3;
    if (b === 0) taiko(o, t, 0.34);
    else if (b === 8) taiko(o, t, 0.2);
    else if (fill && (b === 12 || b === 14)) taiko(o, t, 0.24);
    if (b === 4 || b === 12) clack(o, t, 0.05);
    else if (b % 4 === 2) shime(o, t, 0.025); // offbeat eighths
  }

  function playBossStep(i, t, sd, o) {
    const s = i % 64, bar = s >> 4, b = s & 15, fr = frightened();
    if (!(b & 1)) {
      const n = BOSS_LEAD[s >> 1];
      if (n !== null) pluck(o, semi(D4, fr ? n + 12 : n), t, fr ? 0.06 : 0.085, sd * (fr ? 1.4 : 2.4));
    }
    if (!fr || !(b & 1)) {
      const bn = BOSS_BASS[b], x = osc('pulse', semi(D2, bn)), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 520;
      env(g, t, 0.003, 0.1, sd * 0.9);
      x.connect(lp); lp.connect(g); g.connect(o); x.start(t); x.stop(t + sd + 0.05);
    }
    if (b % 4 === 0) taiko(o, t, b === 0 ? 0.42 : 0.26);
    if ((bar & 1) && b === 14) taiko(o, t, 0.3);
    if (b % 4 === 2) shime(o, t, 0.035);
    if (b === 0 && !(bar & 1)) kane(o, t, 0.035, 311);
  }

  let track = null, lastTrack = null, step = 0, nextT = 0, holdUntil = 0;
  function wantTrack() {
    if (typeof Shell === 'undefined' || Shell.state !== 'play' || !Shell.engine) return null;
    return Shell.engine.phase === 'boss' ? 'boss' : 'run';
  }
  function duck(on) {
    if (!musicGain) return;
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.setTargetAtTime(on ? 0 : 1, Math.max(t, on ? t : nextT), on ? 0.04 : 0.06);
  }
  function tick() {
    if (!ctx || muted || ctx.state !== 'running') return;
    try {
      const want = wantTrack(), cur = ctx.currentTime;
      if (want !== track) {
        if (!want) { duck(true); track = null; return; }
        if (want !== lastTrack) step = 0;
        lastTrack = track = want;
        nextT = Math.max(cur + 0.06, holdUntil);
        duck(false);
      }
      if (!track) return;
      if (nextT < cur - 0.2) nextT = cur + 0.05; // recover from stalls instead of bursting
      const sd = 60 / bpm(track) / 4;
      while (nextT < cur + 0.12) {
        if (nextT >= cur) (track === 'boss' ? playBossStep : playRunStep)(step, nextT, sd, musicGain);
        nextT += sd; step++;
      }
    } catch (e) { /* keep the scheduler quiet on failure */ }
  }
  setInterval(tick, 25);

  // ---------- Events ----------
  if (typeof EVT !== 'undefined') {
    EVT.on('jump', S.jump);
    EVT.on('land', S.land);
    EVT.on('hit', S.hit);
    EVT.on('die', (d) => { if (performance.now() - lastHitAt > 300) S.fall(d); });
    EVT.on('item', S.item);
    EVT.on('stage', S.stage);
    EVT.on('banner', (d) => { if (!/^(stage|boss|ouch)/i.test((d && d.text) || '')) S.chime(d); });
    EVT.on('bossStart', (d) => { if (ctx) holdUntil = ctx.currentTime + 1.2; S.bossStart(d); });
    EVT.on('bossWin', (d) => { if (ctx) holdUntil = ctx.currentTime + 1.1; S.bossWin(d); });
    EVT.on('rice', S.rice);
    EVT.on('roe', S.roe);
    EVT.on('fright', S.fright);
    EVT.on('ghostEaten', S.ghostEaten);
    EVT.on('pickup', S.pickup);
    EVT.on('death', S.death);
    EVT.on('puddle', S.puddle);
    EVT.on('inflate', S.inflate);
    EVT.on('gameover', S.over);
    EVT.on('start', (d) => { lastTrack = null; track = null; if (ctx) holdUntil = ctx.currentTime + 0.35; S.start(d); });
    let prevState = null;
    EVT.on('state', (d) => {
      const s = d && d.state;
      if (s === 'paused') S.pause();
      else if (s === 'play' && prevState === 'paused') S.resume();
      prevState = s;
      if (s !== 'play') tick(); // duck immediately; 'play' is picked up by the scheduler
    });
  }

  // ---------- Mute toggle ----------
  let btn = null;
  function render() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.textContent = muted ? '♪ OFF' : '♪ ON';
    btn.title = muted ? 'Sound off (M to toggle)' : 'Sound on (M to toggle)';
  }
  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (m) {
      if (ctx) { try { master.gain.setTargetAtTime(0, ctx.currentTime, 0.02); } catch (e) { /* ignore */ } track = null; }
    } else {
      unlock();
      if (ctx) {
        try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.32, ctx.currentTime, 0.02); } catch (e) { /* ignore */ }
        if (musicGain) { musicGain.gain.cancelScheduledValues(ctx.currentTime); musicGain.gain.setValueAtTime(0, ctx.currentTime); }
        track = null;
        S.toggle();
      }
    }
    render();
  }
  window.JiroAudio = { setMuted, isMuted: () => muted, sfx: S, debug: () => ({ ctx: ctx ? ctx.state : 'none', track, step, bpm: track ? bpm(track) : 0 }) };

  function inject() {
    const bar = document.getElementById('toolbar');
    if (!bar) return;
    if (!document.getElementById('jg-mute-style')) {
      const st = document.createElement('style');
      st.id = 'jg-mute-style';
      st.textContent = '.jg-mute{font:12px/1 Silkscreen,monospace;letter-spacing:.04em;color:#f4ead7;background:#261c16;' +
        'border:1px solid #9c8a74;border-radius:3px;padding:7px 10px;cursor:pointer;min-width:74px}' +
        '.jg-mute:hover{border-color:#e8cd9c;color:#e8cd9c}.jg-mute:focus-visible{outline:2px solid #5ff3ff;outline-offset:2px}' +
        '.jg-mute[aria-pressed="true"]{color:#9c8a74;background:#1b1410;text-decoration:line-through}';
      document.head.appendChild(st);
    }
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'jg-mute'; btn.id = 'jg-mute';
      btn.setAttribute('aria-label', 'Mute sound');
      btn.setAttribute('aria-keyshortcuts', 'M');
      btn.addEventListener('click', () => { setMuted(!muted); btn.blur(); });
      render();
    }
    if (!bar.contains(btn)) bar.appendChild(btn);
  }
  inject();
  // Other scripts may rebuild #toolbar; keep the button present.
  const bar0 = document.getElementById('toolbar');
  if (bar0 && window.MutationObserver) new MutationObserver(() => { if (btn && !bar0.contains(btn)) bar0.appendChild(btn); }).observe(bar0, { childList: true });
  document.addEventListener('DOMContentLoaded', inject);

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyM' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    setMuted(!muted);
  });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) safe(() => ctx.suspend()); else if (!muted) safe(() => ctx.resume());
  });
})();
