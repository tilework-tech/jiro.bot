'use strict';
/*
 * Daily Roll sound: fully synthesized WebAudio SFX + a looping pentatonic chiptune.
 * - Koto / shamisen plucks are Karplus-Strong buffers rendered once, then re-pitched via playbackRate.
 * - Music uses a lookahead scheduler (setTimeout tick, ~120ms horizon) that only runs during play.
 * - AudioContext is created on the first user gesture; everything no-ops if WebAudio is missing.
 * - Mute button in #toolbar (aria-pressed), key M, persisted in localStorage 'jiro-games-muted'.
 */
(() => {
  const LS_KEY = 'jiro-games-muted';
  // Shell is a top-level const in shell.js (not a window property).
  const SH = () => typeof Shell !== 'undefined' && Shell;
  const MASTER = 0.34, MUSIC = 0.26, FRIGHT_DUCK = 0.45;
  let muted = false;
  try { muted = localStorage.getItem(LS_KEY) === '1'; } catch (e) { /* storage blocked */ }

  let ctx = null, master = null, sfxBus = null, musicBus = null, duck = null;
  let koto = null, sham = null, noiseBuf = null, failed = false;

  // ---------- context ----------
  function ac() {
    if (failed) return null;
    if (!ctx) {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) { failed = true; return null; }
        ctx = new Ctor();
        master = ctx.createGain(); master.gain.value = muted ? 0 : MASTER;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 6;
        master.connect(comp); comp.connect(ctx.destination);
        sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
        duck = ctx.createGain(); duck.gain.value = 1; duck.connect(master);
        musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(duck);
        koto = ksBuffer(293.66, 1.6, 0.9965, 0.35);  // soft, ringing (D4)
        sham = ksBuffer(146.83, 0.9, 0.992, 0.9);    // bright, drier (D3)
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { failed = true; ctx = null; return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
    return ctx;
  }
  // Sounds only play when unmuted and the context already exists (created by a gesture).
  const live = () => (!muted && ctx && !failed ? ctx : null);

  // Karplus-Strong plucked string rendered into a buffer; f0 is the true pitch after loop-filter delay.
  function ksBuffer(freq, dur, damp, bright) {
    const sr = ctx.sampleRate, n = Math.floor(sr * dur), N = Math.max(2, Math.round(sr / freq - 0.5));
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    let lp = 0, mean = 0;
    for (let i = 0; i < N; i++) { lp += bright * ((Math.random() * 2 - 1) - lp); d[i] = lp; mean += lp; }
    mean /= N;
    for (let i = 0; i < N; i++) d[i] -= mean;
    for (let i = N; i < n; i++) d[i] = damp * 0.5 * (d[i - N] + (i - N - 1 >= 0 ? d[i - N - 1] : 0));
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
    const k = peak > 0 ? 0.9 / peak : 1, fade = Math.floor(sr * 0.05);
    for (let i = 0; i < n; i++) d[i] *= k * (i > n - fade ? (n - i) / fade : 1);
    buf.f0 = sr / (N + 0.5);
    return buf;
  }

  // ---------- voices ----------
  // In scale on D (Miyako-bushi): D Eb G A Bb. Degree 0 = D4; negative degrees go down.
  const IN = [0, 1, 5, 7, 8];
  const note = (deg) => {
    const o = Math.floor(deg / 5), s = IN[((deg % 5) + 5) % 5];
    return 293.66 * 2 ** ((s + 12 * o) / 12);
  };

  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function pluck(buf, freq, t, vol, dur, dest) {
    const c = live(); if (!c || !buf) return;
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf; s.playbackRate.value = freq / buf.f0;
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(g); g.connect(dest || sfxBus);
    s.start(t); s.stop(t + dur + 0.02);
  }
  function tone(type, f0, f1, t, dur, vol, dest) {
    const c = live(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(t, dur, freq, q, vol, type, sweepTo, dest) {
    const c = live(); if (!c) return;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf;
    f.type = type || 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    env(g, t, 0.003, vol, dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  }
  function taiko(t, vol, dest) {
    tone('sine', 120, 48, t, 0.32, vol, dest);
    noise(t, 0.06, 500, 0.8, vol * 0.35, 'lowpass', 150, dest);
  }
  function ka(t, vol, dest) { noise(t, 0.035, 3200, 2.5, vol, 'bandpass', null, dest); }
  function bell(freq, t, vol, dur) {
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(([r, v]) => tone('sine', freq * r, freq * r, t, dur / r ** 0.5, vol * v));
  }

  // Rate-limit identical sounds so bursts do not clip.
  const last = {};
  function gate(name, ms) {
    const now = performance.now();
    if ((last[name] || 0) + ms > now) return false;
    last[name] = now; return true;
  }
  // Time until which a stinger is playing (so the daily chime lands after it).
  let busyUntil = 0;

  // ---------- SFX ----------
  let waka = 0;
  const sfx = {
    rice() {
      const c = live(); if (!c || !gate('rice', 70)) return;
      const t = c.currentTime;
      waka ^= 1;
      pluck(koto, note(waka ? 5 : 3), t, 0.2, 0.11);
      tone('sine', waka ? 1500 : 1250, 700, t, 0.03, 0.05); // wooden knock
    },
    roe() {
      const c = live(); if (!c) return;
      pluck(sham, note(0), c.currentTime, 0.2, 0.2);
    },
    fright() {
      const c = live(); if (!c || !gate('fright', 150)) return;
      const t = c.currentTime;
      for (let i = 0; i < 8; i++) pluck(koto, note(3 + i), t + i * 0.035, 0.1, 0.35);
      tone('triangle', 330, 1320, t, 0.4, 0.07);
      noise(t, 0.45, 2500, 3, 0.05, 'bandpass', 7000);
    },
    wobble(t, up) {
      tone('triangle', up ? 150 : 230, up ? 230 : 150, t, 0.15, 0.07);
    },
    ghostEaten(combo) {
      const c = live(); if (!c) return;
      const t = c.currentTime, k = Math.min(Math.max(1, combo | 0), 4), d = 3 + (k - 1) * 2;
      tone('sine', note(d) / 2, note(d + 2) * 2, t, 0.18, 0.16);
      pluck(koto, note(d), t + 0.02, 0.2, 0.3);
      pluck(koto, note(d + 2), t + 0.09, 0.2, 0.45);
      if (k >= 3) pluck(koto, note(d + 4), t + 0.16, 0.16, 0.5);
    },
    pickup() {
      const c = live(); if (!c || !gate('pickup', 80)) return;
      const t = c.currentTime;
      pluck(koto, note(7), t, 0.2, 0.4);
      pluck(koto, note(10), t + 0.07, 0.18, 0.6);
      tone('sine', 2400, 3600, t + 0.1, 0.08, 0.05);
    },
    puddle() {
      const c = live(); if (!c || !gate('puddle', 120)) return;
      const t = c.currentTime;
      tone('sine', 650, 1900, t, 0.05, 0.14);
      tone('sine', 900, 2300, t + 0.1, 0.04, 0.05);
    },
    inflate() {
      const c = live(); if (!c || !gate('inflate', 150)) return;
      const t = c.currentTime;
      const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(260, t);
      o.frequency.exponentialRampToValueAtTime(820, t + 0.32);
      lfo.frequency.value = 19; lg.gain.value = 45;
      lfo.connect(lg); lg.connect(o.frequency);
      env(g, t, 0.01, 0.15, 0.36);
      o.connect(g); g.connect(sfxBus);
      o.start(t); lfo.start(t); o.stop(t + 0.42); lfo.stop(t + 0.42);
      tone('sine', 1800, 2600, t + 0.28, 0.06, 0.04); // squeak tip
    },
    death() {
      const c = live(); if (!c) return;
      const t = c.currentTime;
      for (let i = 0; i < 11; i++) pluck(koto, note(10 - i), t + i * 0.065, 0.15, 0.3);
      const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(660, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.85);
      lfo.frequency.value = 9; lg.gain.value = 25;
      lfo.connect(lg); lg.connect(o.frequency);
      env(g, t, 0.01, 0.09, 0.85);
      o.connect(g); g.connect(sfxBus);
      o.start(t); lfo.start(t); o.stop(t + 0.9); lfo.stop(t + 0.9);
      taiko(t + 0.8, 0.22);
      busyUntil = Math.max(busyUntil, t + 1.0);
    },
    ready() {
      const c = live(); if (!c) return;
      const t = c.currentTime + 0.03;
      [0, 2, 3, 5].forEach((d, i) => pluck(koto, note(d), t + i * 0.11, 0.17, 0.35));
      pluck(koto, note(7), t + 0.48, 0.2, 0.5);
      pluck(koto, note(5), t + 0.48, 0.12, 0.5);
      pluck(sham, note(-5), t, 0.16, 0.3);
      pluck(sham, note(-5), t + 0.48, 0.18, 0.4);
      taiko(t, 0.2); taiko(t + 0.48, 0.26);
      busyUntil = Math.max(busyUntil, t + 0.95);
    },
    clear() {
      const c = live(); if (!c || !gate('clear', 500)) return;
      const t = c.currentTime;
      [0, 2, 3, 5, 7, 8, 10].forEach((d, i) => pluck(koto, note(d), t + i * 0.07, 0.16, 0.4));
      const e = t + 0.55;
      [5, 7, 10].forEach((d) => pluck(koto, note(d), e, 0.14, 0.9));
      pluck(sham, note(-5), e, 0.2, 0.6);
      taiko(t, 0.22); taiko(t + 0.28, 0.18); taiko(e, 0.3);
      noise(e, 0.6, 3000, 2, 0.05, 'bandpass', 8000);
      busyUntil = Math.max(busyUntil, e + 0.9);
    },
    over() {
      const c = live(); if (!c) return;
      const t = Math.max(c.currentTime + 0.05, busyUntil);
      [5, 3, 1].forEach((d, i) => pluck(koto, note(d), t + i * 0.24, 0.16, 0.5));
      pluck(koto, note(0), t + 0.72, 0.16, 1.0);
      pluck(sham, note(-5), t + 0.72, 0.16, 0.6);
      taiko(t + 0.72, 0.16);
      busyUntil = t + 1.4;
    },
    chime() {
      const c = live(); if (!c) return;
      const t = Math.max(c.currentTime + 0.25, busyUntil + 0.1);
      bell(note(7), t, 0.1, 1.2);
      bell(note(10), t + 0.16, 0.08, 1.4);
    },
    tick(up = true) {
      const c = live(); if (!c || !gate('tick', 40)) return;
      tone('square', up ? 2200 : 1500, up ? 1800 : 1100, c.currentTime, 0.02, 0.04);
    },
  };

  // ---------- music ----------
  const STEP = 60 / 112 / 4; // 16th note
  const R = null;
  // 8th-note koto melody, 4 phrases x 16 eighths = 8 bars.
  const MEL = [
    5, R, 4, 3, 2, R, 3, R, 4, 3, 2, 1, 0, R, R, R,
    2, R, 3, 4, 5, R, 7, 6, 5, R, 4, 3, 2, R, 3, R,
    5, R, 4, 3, 2, R, 3, R, 4, 5, 4, 3, 2, R, R, R,
    0, R, 1, 2, 3, R, 2, 1, 3, R, 2, 1, 0, R, R, R,
  ];
  // Bass root per bar, semitones from D3; pattern per 8th: offsets from root.
  const ROOTS = [0, -4, -7, -5, 0, -4, -5, 0];
  const BASS = [0, R, 12, 0, R, 7, 12, R];
  const LOOP = 128;

  function musicStep(i, t) {
    const b = musicBus, bar = (i >> 4) % 8, s = i & 15;
    // taiko: don . . . . . don . (don) . . . ka . ka .
    if (s === 0) taiko(t, 0.3, b);
    else if (s === 6) taiko(t, 0.2, b);
    else if (s === 8) taiko(t, 0.12, b);
    if (s === 12 || s === 14) ka(t, 0.08, b);
    // soft shaker on off-beat 8ths for drive
    if ((s & 3) === 2) noise(t, 0.03, 7000, 1, 0.025, 'highpass', null, b);
    if (s & 1) return;
    const e = i >> 1; // 8th index in loop
    const bn = BASS[e & 7];
    if (bn !== R) pluck(sham, 146.83 * 2 ** ((ROOTS[bar] + bn) / 12), t, 0.3, 0.26, b);
    const m = MEL[e % MEL.length];
    if (m !== R) {
      pluck(koto, note(m), t, 0.22, 0.6, b);
      // echo an octave up very softly on phrase-ends for shimmer
      if (MEL[(e + 1) % MEL.length] === R && (e & 1) === 0) pluck(koto, note(m + 5), t + STEP * 3, 0.05, 0.4, b);
    }
  }

  const mus = { on: false, step: 0, next: 0 };
  const wob = { on: false, next: 0, up: false };
  let timer = null, ducked = false;

  function rampBus(target, at, len) {
    const g = musicBus.gain, now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    if (at > now + 0.07) { g.linearRampToValueAtTime(0, now + 0.06); g.setValueAtTime(0, at); }
    g.linearRampToValueAtTime(target, Math.max(at, now) + len);
  }
  function startMusic(delay = 0.05, restart = false) {
    const c = live(); if (!c) return;
    if (restart) mus.step = 0;
    mus.on = true; mus.next = c.currentTime + delay;
    rampBus(MUSIC, mus.next, 0.04);
    kick();
  }
  function stopMusic() {
    mus.on = false;
    if (ctx) rampBus(0, 0, 0.08);
  }
  function frightened() {
    const m = SH() && Shell.engine;
    if (!m || Shell.state !== 'play' || !m.ghosts) return false;
    for (const g of m.ghosts) if (g.fright > 0) return true;
    return false;
  }
  function tick() {
    timer = null;
    const c = live();
    if (!c) { mus.on = false; return; }
    const now = c.currentTime, horizon = now + 0.12;
    if (mus.on) {
      if (mus.next < now - 0.25) mus.next = now + 0.03; // tab was throttled: resync rather than burst
      while (mus.next < horizon) { musicStep(mus.step, mus.next); mus.step = (mus.step + 1) % LOOP; mus.next += STEP; }
    }
    const fr = frightened();
    if (fr !== ducked) { ducked = fr; duck.gain.setTargetAtTime(fr ? FRIGHT_DUCK : 1, now, 0.08); }
    if (fr) {
      if (!wob.on) { wob.on = true; wob.next = now + 0.02; }
      if (wob.next < now - 0.25) wob.next = now + 0.02;
      while (wob.next < horizon) { wob.up = !wob.up; sfx.wobble(wob.next, wob.up); wob.next += 0.16; }
    } else wob.on = false;
    if (mus.on || (SH() && Shell.state === 'play')) timer = setTimeout(tick, 25);
  }
  function kick() { if (!timer) timer = setTimeout(tick, 0); }

  // ---------- game events ----------
  const S = () => (SH() ? Shell.state : 'title');
  EVT.on('rice', () => sfx.rice());
  EVT.on('roe', ({ m } = {}) => { if (m && m.o && m.o.noRoe) sfx.roe(); });
  EVT.on('fright', () => { sfx.fright(); kick(); });
  EVT.on('ghostEaten', ({ m } = {}) => sfx.ghostEaten(m ? m.combo : 1));
  EVT.on('pickup', () => sfx.pickup());
  EVT.on('puddle', () => sfx.puddle());
  EVT.on('inflate', () => sfx.inflate());
  EVT.on('death', () => {
    sfx.death();
    if (mus.on) { stopMusic(); startMusic(1.3); }
  });
  EVT.on('over', () => { stopMusic(); sfx.over(); });
  EVT.on('clear', () => { sfx.clear(); if (mus.on) { stopMusic(); startMusic(1.7); } });
  // 'ready' also fires while building the title screen and inside Shell.start() before the state flips;
  // only play it for a mid-game level load. The run start is handled by 'start'.
  EVT.on('ready', () => { if (S() === 'play') sfx.ready(); });
  EVT.on('start', () => {
    ac();
    busyUntil = 0;
    sfx.tick(true); sfx.ready();
    startMusic(1.0, true); // after the ~1s READY banner
  });
  let prevState = 'title';
  EVT.on('state', ({ state } = {}) => {
    if (state === 'paused') { sfx.tick(false); stopMusic(); }
    else if (state === 'play') {
      if (!mus.on && S() === 'play' && prevState === 'paused') { sfx.tick(true); startMusic(0.08); }
      kick();
    } else if (state === 'over') {
      stopMusic();
      const m = SH() && Shell.engine;
      if (m && m.won) sfx.clear();
    } else stopMusic();
    prevState = state;
  });
  EVT.on('dailyResult', () => sfx.chime());

  // ---------- unlock on first gesture ----------
  const unlock = () => {
    if (muted) return;
    if (ac()) ['pointerdown', 'keydown', 'touchend'].forEach((n) => window.removeEventListener(n, unlock, true));
  };
  ['pointerdown', 'keydown', 'touchend'].forEach((n) => window.addEventListener(n, unlock, true));

  // ---------- mute ----------
  let btn = null;
  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(LS_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
    if (!muted) ac();
    if (ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(muted ? 0 : MASTER, now, 0.03);
    }
    if (muted) { mus.on = false; wob.on = false; }
    else {
      if (S() === 'play') startMusic(0.1);
      sfx.tick(true);
    }
    render();
  }
  function render() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.title = muted ? 'Sound is off. Press M to unmute' : 'Sound is on. Press M to mute';
    btn.querySelector('.dr-mute-ico').textContent = muted ? '♪̸' : '♪';
  }
  function mountButton() {
    const bar = document.getElementById('toolbar');
    if (!bar) return;
    if (!document.getElementById('dr-audio-style')) {
      const st = document.createElement('style');
      st.id = 'dr-audio-style';
      st.textContent = `
.dr-mute{font:12px/1 Silkscreen,monospace;color:#f4ead7;background:#261c16;border:1px solid #9c8a74;border-radius:2px;
  padding:6px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 0 #120d0a}
.dr-mute:hover{border-color:#e8cd9c;color:#e8cd9c}
.dr-mute:focus-visible{outline:2px solid #5ff3ff;outline-offset:2px}
.dr-mute[aria-pressed="true"]{background:#c8321e;border-color:#e2482f;color:#f4ead7}
.dr-mute .dr-mute-ico{font-family:'JetBrains Mono',monospace;font-size:13px;width:1em;text-align:center}
.dr-mute kbd{font:inherit;color:#9c8a74;border:1px solid #3a2c22;padding:1px 3px;border-radius:2px}
.dr-mute[aria-pressed="true"] kbd{color:#f4ead7;border-color:#e2482f}`;
      document.head.appendChild(st);
    }
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'dr-mute'; btn.id = 'dr-mute';
    btn.innerHTML = '<span class="dr-mute-ico" aria-hidden="true"></span><span>Mute</span><kbd aria-hidden="true">M</kbd>';
    btn.addEventListener('click', (e) => {
      setMuted(!muted);
      if (e.detail > 0) btn.blur(); // mouse click: give Space back to the game
    });
    bar.appendChild(btn);
    render();
    // Other UI code may re-render the toolbar; keep the button attached.
    try {
      new MutationObserver(() => { if (!bar.contains(btn)) bar.appendChild(btn); }).observe(bar, { childList: true });
    } catch (e) { /* ignore */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountButton);
  else mountButton();

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyM' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    setMuted(!muted);
  });

  window.DailyRollAudio = { sfx, setMuted, isMuted: () => muted, startMusic, stopMusic, state: () => ({ ctx: ctx ? ctx.state : (failed ? 'unavailable' : 'none'), music: mus.on, step: mus.step, fright: wob.on }) };
})();
