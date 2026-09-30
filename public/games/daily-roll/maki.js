'use strict';
/*
 * Daily Roll: the player maki + game feel.
 * - ART.maki: pixel-art futomaki seen from the top (nori ring, rice ring, salmon/cucumber/tamago core),
 *   pre-rendered per facing / mouth frame / outline variant into tiny offscreen canvases.
 * - Power mode aura while any ghost is frightened.
 * - Juice (particles, popups, shake, death unroll, spawn pop, win confetti) via EVT + ART.layers / ART.preDraw.
 * Purely visual: never touches hitboxes, timing, speeds or scoring.
 */
(() => {
  const S = 19, C = S / 2, R = 9.35; // sprite size in logical px (~0.92 tile at ts=21)
  const COL = {
    line: '#0a0e0b', nori: '#1f2b22', noriHi: '#2f4034', noriFleck: '#3e5444', noriLo: '#131b15',
    rice: '#f6efe1', riceShade: '#dccfb4', grain: '#e4d7bd', grainHi: '#fffdf6',
    salmon: '#ff7a47', salmonFat: '#ffc9a8', salmonLo: '#e2552a',
    cuke: '#b8dc7c', cukeSkin: '#3f7a2a', cukeSeed: '#e9f5c8',
    tama: '#ffcf4f', tamaLo: '#e8a930',
  };
  const PAL = { paper: '#f4ead7', hinoki: '#e8cd9c', salmon: '#ff7b4f', red: '#e2482f', wasabi: '#a6c94a', tama: '#ffcf4f', cyan: '#5ff3ff', ink: '#120d0a' };
  const MOUTH = [0.035, 0.09, 0.15, 0.21, 0.26].map((f) => f * Math.PI); // half-angles
  const hash = (i, j, k = 0) => { let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };

  /* ---------------- sprite generation ---------------- */
  // facing: 0 right, 1 left, 2 up, 3 down. Local frame: u = forward, v = "up" side (where the eye sits).
  const toLocal = (f, dx, dy) => f === 0 ? [dx, dy] : f === 1 ? [-dx, dy] : f === 2 ? [-dy, dx] : [dy, -dx];
  const cache = new Map();
  function sprite(face, mouth, variant, rad = R) {
    const key = face + ':' + mouth + ':' + variant + ':' + rad;
    let cv = cache.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const c = cv.getContext('2d');
    const px = new Array(S * S).fill(null);
    const ma = MOUTH[mouth];
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = i + 0.5 - C, dy = j + 0.5 - C, d = Math.hypot(dx, dy);
      if (d > rad) continue;
      const [u, v] = toLocal(face, dx, dy);
      if (d > 1.1 && Math.abs(Math.atan2(v, u)) < ma) continue; // mouth wedge
      const h = hash(i, j);
      let col;
      if (d > 6.2) { // nori ring
        col = COL.nori;
        if (dx + dy < -d * 0.75) col = COL.noriHi; // top-left light
        else if (dx + dy > d * 0.9) col = COL.noriLo;
        if (h % 9 === 0) col = COL.noriFleck; else if (h % 9 === 1) col = COL.noriLo;
      } else if (d > 3.4) { // rice ring
        col = COL.rice;
        if (dx + dy > d * 0.8 && d > 5.2) col = COL.riceShade;
        if (h % 5 === 0) col = COL.grain; else if (h % 11 === 1) col = COL.grainHi;
      } else { // filling, in local frame: cucumber / salmon / tamago bands
        if (v < -1.1) col = d > 2.6 ? COL.cukeSkin : (h % 3 === 0 ? COL.cukeSeed : COL.cuke);
        else if (v > 1.1) col = d > 2.6 && dx + dy > 0 ? COL.tamaLo : COL.tama;
        else col = (i + j) % 3 === 0 ? COL.salmonFat : (d > 2.6 && dx + dy > 0 ? COL.salmonLo : COL.salmon);
      }
      px[j * S + i] = col;
    }
    const outline = variant === 1 ? '#ff7b4f' : variant === 2 ? '#ffb27a' : COL.line;
    const out = px.slice();
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      if (!px[j * S + i]) continue;
      const empty = (x, y) => x < 0 || y < 0 || x >= S || y >= S || !px[y * S + x];
      if (empty(i - 1, j) || empty(i + 1, j) || empty(i, j - 1) || empty(i, j + 1)) out[j * S + i] = outline;
    }
    for (let k = 0; k < S * S; k++) if (out[k]) { c.fillStyle = out[k]; c.fillRect(k % S, (k / S) | 0, 1, 1); }
    cache.set(key, cv);
    return cv;
  }
  // pre-warm the common frames
  for (let f = 0; f < 4; f++) for (let mo = 0; mo < 5; mo++) sprite(f, mo, 0);

  const glow = (() => {
    const g = document.createElement('canvas'), n = 64; g.width = g.height = n;
    const c = g.getContext('2d'), gr = c.createRadialGradient(n / 2, n / 2, 4, n / 2, n / 2, n / 2);
    gr.addColorStop(0, 'rgba(255,123,79,0.85)'); gr.addColorStop(0.45, 'rgba(255,123,79,0.35)'); gr.addColorStop(1, 'rgba(255,123,79,0)');
    c.fillStyle = gr; c.fillRect(0, 0, n, n); return g;
  })();

  /* ---------------- state ---------------- */
  const faceOf = new Map(); // player id -> last facing
  const faceIdx = (d) => d[0] > 0 ? 0 : d[0] < 0 ? 1 : d[1] < 0 ? 2 : d[1] > 0 ? 3 : -1;
  let death = null;   // {x,y,t,face,over}
  let spawn = null;   // {t}
  let shakeT = 0, shakeDur = 1, shakeMag = 0, clock = 0;
  const pops = [];    // score popups {text,x,y,t,col}
  const rings = [];   // expanding pixel rings {x,y,t,dur,r0,r1,col}
  const N = 420, parts = [];
  for (let i = 0; i < N; i++) parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, col: '', w: 1, h: 1, g: 0, drag: 0, sway: 0, top: false });
  let pHead = 0, popHide = 0;
  function emit(x, y, vx, vy, life, col, w = 1, h = 1, g = 0, drag = 0, sway = 0, top = false) {
    const p = parts[pHead]; pHead = (pHead + 1) % N;
    p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.life = life; p.col = col; p.w = w; p.h = h; p.g = g; p.drag = drag; p.sway = sway; p.top = top;
  }
  const shake = (mag, dur) => { if (mag >= shakeMag * (shakeT / shakeDur)) { shakeMag = mag; shakeDur = shakeT = dur; } };
  const center = (m, x, y) => [m.ox + (x + 0.5) * m.ts, m.oy + (y + 0.5) * m.ts];
  const powered = (m) => m.ghosts.some((g) => g.fright > 0);
  const frightLeft = (m) => m.ghosts.reduce((a, g) => Math.max(a, g.fright), 0);

  /* ---------------- the maki ---------------- */
  ART.maki = function (ctx, m, p) {
    if (death && death.p === p && death.t < 1.0) return; // death animation layer owns the maki
    const [x, y] = m.pos(p), ts = m.ts;
    const cx = m.ox + (x + 0.5) * ts, cy = m.oy + (y + 0.5) * ts;
    const moving = !!(p.dir[0] || p.dir[1]) && m.freeze <= 0;
    let f = faceIdx(p.dir);
    if (f < 0) f = faceOf.get(p.id) ?? 0; else faceOf.set(p.id, f);
    let mouth, rad = R, bob = 0;
    if (moving) mouth = 1 + Math.min(3, Math.floor(Math.abs(Math.sin(m.t * 12)) * 4));
    else { const br = Math.sin(clock * 2.6); mouth = br > 0.55 ? 1 : 0; rad = br > 0.2 ? R : R - 0.55; bob = br > 0.55 ? -1 : 0; }
    const pw = powered(m);
    let variant = 0;
    if (pw) {
      const left = frightLeft(m), warn = left < 1.6 && Math.floor(clock * 10) % 2 === 0;
      variant = warn ? 0 : (Math.floor(clock * 8) % 2 ? 1 : 2);
      // aura
      const pulse = 0.55 + 0.25 * Math.sin(clock * 9);
      ctx.globalAlpha = warn ? 0.25 : pulse;
      const gs = Math.round(ts * 2.4);
      ctx.drawImage(glow, Math.round(cx - gs / 2), Math.round(cy - gs / 2), gs, gs);
      ctx.globalAlpha = 1;
      // orbiting shimmer pixels
      for (let k = 0; k < 4; k++) {
        const a = clock * 3.2 + k * (TAU / 4), rr2 = ts * 0.66 + Math.sin(clock * 5 + k) * 1.5;
        ctx.fillStyle = k % 2 ? '#ffd0b0' : PAL.salmon;
        const s = (Math.floor(clock * 12 + k) % 3 === 0) ? 2 : 1;
        ctx.fillRect(Math.round(cx + Math.cos(a) * rr2), Math.round(cy + Math.sin(a) * rr2 * 0.9), s, s);
      }
    }
    // soft contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(cx - 6), Math.round(cy + 8), 12, 2);
    const img = sprite(f, mouth, variant, rad);
    let sc = 1;
    if (spawn && spawn.p === p && spawn.t < 0.4) {
      const k = spawn.t / 0.4;
      sc = k < 0.6 ? 1.22 * (k / 0.6) : 1.22 - 0.22 * ((k - 0.6) / 0.4);
      sc = Math.max(0.1, Math.round(sc * S) / S);
    }
    const w = Math.round(S * sc);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - w / 2) + bob, w, w);
    if (p.slow) { // soy drips while slowed
      ctx.fillStyle = '#6b3a1c';
      for (let k = 0; k < 3; k++) { const yy = (clock * 14 + k * 5) % 9; ctx.fillRect(Math.round(cx - 5 + k * 5), Math.round(cy + 6 + yy), 1, 2); }
    }
  };

  /* ---------------- events ---------------- */
  EVT.on('rice', ({ m, p, x, y }) => {
    const [cx, cy] = center(m, x, y), d = p.dir;
    for (let k = 0; k < 3; k++) emit(cx + rand(-2, 2), cy + rand(-2, 2), -d[0] * rand(10, 40) + rand(-30, 30), -d[1] * rand(10, 40) + rand(-40, -5), rand(0.2, 0.38), k ? PAL.paper : PAL.hinoki, 1, 1, 160, 2);
    if (Math.random() < 0.35) emit(cx + rand(-4, 4), cy + rand(-5, 0), 0, -18, 0.3, '#fffdf6', 1, 1, 0, 0, 0, true);
  });
  EVT.on('roe', ({ m, x, y }) => {
    const [cx, cy] = center(m, x, y);
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * TAU + rand(-0.15, 0.15), s = rand(50, 120);
      emit(cx, cy, Math.cos(a) * s, Math.sin(a) * s, rand(0.35, 0.6), pick([PAL.salmon, '#ffd0b0', PAL.red, PAL.tama]), k % 3 ? 1 : 2, k % 3 ? 1 : 2, 60, 4);
    }
    rings.push({ x: cx, y: cy, t: 0, dur: 0.4, r0: 3, r1: m.ts * 1.4, col: PAL.salmon });
    shake(1.5, 0.12);
  });
  EVT.on('fright', ({ m }) => {
    const p = m.players[0], [x, y] = m.pos(p), [cx, cy] = center(m, x, y);
    rings.push({ x: cx, y: cy, t: 0, dur: 0.5, r0: m.ts * 0.5, r1: m.ts * 2.2, col: '#ffd0b0' });
  });
  EVT.on('ghostEaten', ({ m, g, v, x, y }) => {
    const [cx, cy] = center(m, x, y);
    pops.push({ text: '+' + v, x: cx, y: cy - m.ts * 0.4, t: 0, col: v >= 800 ? PAL.cyan : v >= 400 ? PAL.tama : '#fddc69' });
    rings.push({ x: cx, y: cy, t: 0, dur: 0.35, r0: 4, r1: m.ts * 1.6, col: '#fffdf6' });
    for (let k = 0; k < 14; k++) {
      const a = rand(0, TAU), s = rand(60, 150);
      emit(cx, cy, Math.cos(a) * s, Math.sin(a) * s, rand(0.3, 0.55), k % 2 ? (g.color || PAL.paper) : '#fffdf6', 2, 2, 120, 3);
    }
    popHide++; // engine also queues '+v' in m.fx right after this event; our popup replaces it
    shake(4, 0.22);
  });
  EVT.on('death', ({ m, p }) => {
    const [x, y] = m.pos(p), [cx, cy] = center(m, x, y);
    death = { p, x: cx, y: cy, t: 0, face: faceOf.get(p.id) ?? 0, ts: m.ts, final: m.lives <= 0, m, sx: p.sx, sy: p.sy, spun: false };
    spawn = null;
    shake(5, 0.35);
    for (let k = 0; k < 16; k++) { // nori flakes
      const a = rand(0, TAU), s = rand(40, 130);
      emit(cx, cy, Math.cos(a) * s, Math.sin(a) * s - 40, rand(0.6, 1.0), k % 3 ? COL.noriHi : COL.nori, Math.random() < 0.5 ? 2 : 3, 2, 220, 1.5, 6);
    }
    for (let k = 0; k < 10; k++) emit(cx, cy, rand(-70, 70), rand(-120, -30), rand(0.5, 0.8), PAL.paper, 2, 1, 260, 1);
  });
  const confetti = (m, x, y) => {
    const cols = [PAL.paper, PAL.paper, PAL.paper, PAL.salmon, PAL.wasabi, PAL.tama, PAL.red, PAL.hinoki];
    for (let k = 0; k < 90; k++) {
      const a = -Math.PI / 2 + rand(-1.1, 1.1), s = rand(90, 230);
      const c = pick(cols);
      emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(1.6, 2.6), c, c === PAL.paper ? 2 : 2, c === PAL.paper ? 1 : 2, 170, 1.4, rand(20, 50), true);
    }
    for (let k = 0; k < 70; k++) {
      const c = pick(cols);
      emit(rand(m.ox, m.ox + m.cols * m.ts), rand(-60, -4), rand(-15, 15), rand(20, 70), rand(2.6, 3.6), c, 2, c === PAL.paper ? 1 : 2, 40, 0.5, rand(20, 40), true);
    }
    rings.push({ x, y, t: 0, dur: 0.6, r0: 6, r1: 60, col: PAL.tama });
    shake(2, 0.2);
  };
  let confettiFor = null;
  const celebrate = (m) => {
    if (!m || confettiFor === m.score + ':' + m.t) return; confettiFor = m.score + ':' + m.t;
    const p = m.players[0], [x, y] = m.pos(p), [cx, cy] = center(m, x, y);
    confetti(m, cx, cy);
  };
  EVT.on('clear', ({ m }) => celebrate(m));
  EVT.on('gameover', ({ engine: m }) => { if (m && m.won) celebrate(m); });
  EVT.on('ready', ({ m }) => {
    death = null;
    const p = m.players[0]; spawn = { p, t: 0 };
    const [cx, cy] = center(m, p.x, p.y);
    rings.push({ x: cx, y: cy, t: 0, dur: 0.35, r0: 2, r1: m.ts * 1.1, col: PAL.paper });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; emit(cx, cy, Math.cos(a) * 70, Math.sin(a) * 70, 0.3, k % 2 ? PAL.salmon : PAL.paper, 1, 1, 0, 5); }
  });
  EVT.on('start', () => { for (const p of parts) p.on = false; pops.length = 0; rings.length = 0; shakeT = 0; });

  /* ---------------- per-frame ---------------- */
  ART.preDraw.push((shell, ctx, dt) => {
    const live = shell.state !== 'paused';
    if (live) { clock += dt; if (shakeT > 0) shakeT = Math.max(0, shakeT - dt); }
    // hide the engine's own '+v' ghost popup; ours replaces it (purely visual array)
    const m = shell.engine;
    if (popHide && m && m.fx) {
      for (let i = m.fx.length - 1; i >= 0 && popHide > 0; i--) if (/^\+\d+$/.test(m.fx[i].text)) { m.fx.splice(i, 1); popHide--; }
      popHide = 0;
    }
    if (shakeT > 0) {
      const k = shakeT / shakeDur, mag = shakeMag * k * k;
      ctx.translate(Math.round(rand(-mag, mag)), Math.round(rand(-mag, mag)));
    }
  });

  function drawRing(ctx, r) {
    const k = r.t / r.dur, rad = r.r0 + (r.r1 - r.r0) * (1 - (1 - k) * (1 - k));
    ctx.globalAlpha = 1 - k; ctx.fillStyle = r.col;
    const n = Math.max(12, Math.round(rad * 1.6));
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ctx.fillRect(Math.round(r.x + Math.cos(a) * rad), Math.round(r.y + Math.sin(a) * rad), 1, 1); }
    ctx.globalAlpha = 1;
  }
  function drawDeath(ctx, d, dt) {
    const t = d.t;
    if (t < 1.0) {
      const k = clamp((t - 0.12) / 0.8, 0, 1);
      // nori sheet unrolling back along the corridor we came from (always open), roll edge following the body
      const horiz = d.face < 2, dir = d.face === 0 || d.face === 3 ? -1 : 1, len = Math.round(k * d.ts * 1.6);
      const bodyX = horiz ? d.x + dir * len : d.x, bodyY = horiz ? d.y : d.y + dir * len;
      if (len > 0) {
        const cx0 = Math.round(d.x), cy0 = Math.round(d.y), a0 = dir < 0 ? -len : 0;
        const rect = (a, b, la, lb) => horiz ? ctx.fillRect(cx0 + a0 + a, cy0 + b, la, lb) : ctx.fillRect(cx0 + b, cy0 + a0 + a, lb, la);
        ctx.globalAlpha = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;
        ctx.fillStyle = COL.line; rect(-1, -5, len + 2, 10);
        ctx.fillStyle = COL.nori; rect(0, -4, len, 8);
        ctx.fillStyle = COL.rice; rect(0, -2, len, 4);
        ctx.fillStyle = COL.grain; for (let i = 1; i < len; i += 3) rect(i, -2 + (i % 2) * 2, 1, 1);
        ctx.fillStyle = COL.salmon; rect((len / 3) | 0, -1, Math.max(1, (len / 4) | 0), 2);
        ctx.fillStyle = COL.cuke; rect((len * 0.66) | 0, -1, Math.max(1, (len / 6) | 0), 2);
        ctx.fillStyle = COL.tama; rect((len * 0.15) | 0, -1, Math.max(1, (len / 8) | 0), 2);
        ctx.globalAlpha = 1;
      }
      // the shrinking, spinning roll
      const sc = t < 0.12 ? 1 + t * 1.5 : Math.max(0, 1.18 - k * 1.05);
      const w = Math.round(S * sc);
      if (w > 1) {
        ctx.save();
        ctx.translate(Math.round(bodyX), Math.round(bodyY));
        ctx.rotate(Math.round((t * t * 26 * (horiz ? dir : -dir)) / (Math.PI / 8)) * (Math.PI / 8));
        ctx.imageSmoothingEnabled = false;
        const flash = t < 0.12 && Math.floor(t * 40) % 2 === 0;
        ctx.drawImage(sprite(d.face, 4, flash ? 2 : 0), -w / 2, -w / 2, w, w);
        ctx.restore();
      }
      if (t > 0.35 && t - dt <= 0.35) for (let i = 0; i < 8; i++) emit(bodyX, bodyY, rand(-60, 60), rand(-90, -20), rand(0.4, 0.7), i % 2 ? COL.nori : COL.noriFleck, 2, 2, 220, 1, 6);
    }
    if (t >= 1.0 && !d.final && !d.popped) {
      d.popped = true; spawn = { p: d.p, t: 0 };
      const m = d.m, [cx, cy] = center(m, d.sx, d.sy);
      rings.push({ x: cx, y: cy, t: 0, dur: 0.35, r0: 2, r1: m.ts * 1.1, col: PAL.paper });
    }
  }

  ART.layers.push((shell, ctx, dt0) => {
    const dt = shell.state === 'paused' ? 0 : dt0;
    if (shell.state === 'title') return;
    if (death) { death.t += dt; drawDeath(ctx, death, dt); if (death.t > 1.4) death = null; }
    if (spawn) { spawn.t += dt; if (spawn.t > 0.5) spawn = null; }
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t >= r.dur) rings.splice(i, 1); else drawRing(ctx, r); }
    drawParts(ctx, dt, false);
    ctx.textAlign = 'center'; ctx.font = '8px Silkscreen';
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt;
      if (p.t > 0.9) { pops.splice(i, 1); continue; }
      const rise = Math.round(Math.min(1, p.t / 0.25) * 10 + p.t * 6);
      const scale = p.t < 0.08 ? 2 : 1; // punch
      const x = Math.round(p.x), y = Math.round(p.y - rise);
      ctx.globalAlpha = clamp((0.9 - p.t) / 0.3, 0, 1);
      ctx.font = (8 * scale) + 'px Silkscreen';
      ctx.fillStyle = PAL.ink;
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(p.text, x + ox, y + oy);
      ctx.fillStyle = p.col; ctx.fillText(p.text, x, y);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  });
  function drawParts(ctx, dt, top) {
    for (const p of parts) {
      if (!p.on || p.top !== top) continue;
      p.t += dt;
      if (p.t >= p.life) { p.on = false; continue; }
      const dr = Math.max(0, 1 - p.drag * dt);
      p.vx *= dr; p.vy = p.vy * dr + p.g * dt;
      p.x += p.vx * dt + (p.sway ? Math.sin(p.t * 7 + p.life * 13) * p.sway * dt : 0); p.y += p.vy * dt;
      const k = p.t / p.life;
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.fillStyle = p.col;
      const flip = p.sway && Math.floor(p.t * 10 + p.life * 7) % 2; // confetti tumble
      ctx.fillRect(Math.round(p.x), Math.round(p.y), flip ? p.h : p.w, flip ? p.w : p.h);
    }
    ctx.globalAlpha = 1;
  }

  // Confetti / sparkles flagged `top` render above the screen overlay (e.g. the win card).
  // ui.js may replace ART.screen after us, so wrap lazily each frame.
  let wrapped = null;
  ART.layers.push(() => {
    if (ART.screen === wrapped) return;
    const inner = ART.screen;
    wrapped = function (shell, ctx, dt0) {
      inner.call(this, shell, ctx, dt0);
      if (shell.state === 'title') return;
      drawParts(ctx, shell.state === 'paused' ? 0 : dt0, true);
    };
    ART.screen = wrapped;
  });
})();
