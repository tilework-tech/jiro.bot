'use strict';
/*
 * Daily Roll ghost cast: four condiment characters drawn as true pixel art.
 * Each frame of each character is rasterized into a 64x64 art-pixel buffer (cached by state key),
 * then blitted with smoothing off at ~1 art pixel per logical pixel (0.9 tiles tall body).
 *   wasabi: squat lumpy dollop of grated wasabi with a flicked peak, angry brows, fang grin
 *   ginger: a gari rose of pink pickled-ginger slices with rippling frilly edges
 *   soy:    glossy dark soy drop with sleepy lids, drips and a drip trail
 *   puffer: yellow pufferfish; springs up to ~1.1 tile radius with spikes when g.inflated
 * Frightened: pale-blue recolor with wobbly zigzag mouth, flashing paper-white near the end.
 * Hooks: ART.ghost, ART.layers (poof on ghostEaten, burst on inflate), EVT ghostEaten/inflate/ready.
 * Exposes window.drawCastPortrait(ctx, kind, cx, cy, size, t, opt?) for title-screen previews.
 * Only visual state is stored on ghosts, under underscore-prefixed fields (_inf, _iv, _lt, _fx, _dr, _dt).
 */
(() => {
  const S = 64, C = 32, BODY = 19;
  const u32 = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0; };
  const mkPal = (o) => { const r = {}; for (const k in o) r[k] = u32(o[k]); return r; };
  const PAL = {
    wasabi: mkPal({ base: '#a6c94a', shade: '#6c8c26', hi: '#dcf08e', out: '#1a2508', ext: '#55711b' }),
    ginger: mkPal({ base: '#ffbac6', shade: '#e0708a', hi: '#ffe8ed', out: '#4a1222', ext: '#ff7896' }),
    soy: mkPal({ base: '#4d2818', shade: '#2e160b', hi: '#f4ead7', out: '#080403', ext: '#b0602c' }),
    puffer: mkPal({ base: '#f2cc60', shade: '#c8922a', hi: '#fff2bf', out: '#382306', ext: '#f4ead7' }),
  };
  const FRIGHT = mkPal({ base: '#7196e8', shade: '#4a66b8', hi: '#aac8ff', out: '#121833', ext: '#aac8ff' });
  const FLASH = mkPal({ base: '#f4ead7', shade: '#cbbca3', hi: '#ffffff', out: '#4a3a2c', ext: '#ffffff' });
  const EYE = u32('#fbf6ec'), PUPIL = u32('#120d0a'), LIP = u32('#ff7b4f'), FFACE = u32('#f4ead7'), XFACE = u32('#c8321e');
  const COLOR = { wasabi: '#a6c94a', ginger: '#ff9cac', soy: '#8a4a26', puffer: '#f2cc60' };
  const HI = { wasabi: '#dcf08e', ginger: '#ffe4ea', soy: '#f4ead7', puffer: '#fff2bf' };
  const SPEC = { // bob speed, bob amp (px), phase
    wasabi: [6, 1, 0], ginger: [3.6, 1.4, 1.3], soy: [8, 1, 2.1], puffer: [2.6, 1.2, 3.4],
  };

  /* ---------------- tiny rasterizer ---------------- */
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const cctx = cv.getContext('2d');
  const img = cctx.createImageData(S, S);
  const buf = new Uint32Array(img.data.buffer);
  const tmp = new Uint8Array(S * S);
  let P = PAL.wasabi;
  const px = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < S && y < S) buf[y * S + x] = c; };
  const E = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const fill = (fn, c) => { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (fn(x + 0.5, y + 0.5)) buf[y * S + x] = c; };
  // pixels inside fn whose (dx,dy) neighbour is outside fn
  const edge = (fn, c, dx, dy, lim) => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const X = x + 0.5, Y = y + 0.5;
      if (fn(X, Y) && !fn(X + dx, Y + dy) && (!lim || lim(X, Y))) buf[y * S + x] = c;
    }
  };
  const outline = (c) => {
    tmp.fill(0);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (buf[y * S + x]) continue;
      if ((x > 0 && buf[y * S + x - 1]) || (x < S - 1 && buf[y * S + x + 1]) || (y > 0 && buf[(y - 1) * S + x]) || (y < S - 1 && buf[(y + 1) * S + x])) tmp[y * S + x] = 1;
    }
    for (let i = 0; i < S * S; i++) if (tmp[i]) buf[i] = c;
  };
  const row = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) px(x, y, c); };

  // round eye of size s (4 or 6) with top-left at (x,y); side -1 = left eye, 1 = right eye
  function eye(x, y, s, st, side, style) {
    x = Math.round(x); y = Math.round(y);
    if (st.fr) { // frightened: small pale dots
      const c = st.flash ? XFACE : FFACE, o = s === 6 ? 2 : 1;
      row(x + o, x + o + 1, y + o, c); row(x + o, x + o + 1, y + o + 1, c); return;
    }
    if (st.blink) { row(x, x + s - 1, y + s - 2, P.out); return; }
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
      const cx = i - (s - 1) / 2, cy = j - (s - 1) / 2;
      if (cx * cx + cy * cy <= (s / 2) * (s / 2) + 0.3) px(x + i, y + j, EYE);
    }
    const ps = s / 2, rng = s - ps;
    const pxo = Math.round(rng / 2 + st.dx * rng / 2), pyo = Math.round(rng / 2 + st.dy * rng / 2);
    for (let j = 0; j < ps; j++) row(x + pxo, x + pxo + ps - 1, y + pyo + j, PUPIL);
    if (style === 'angry') { // brow slanting down toward the middle
      const inner = side < 0 ? s - 1 : 0, o = side < 0 ? 0 : s - 1;
      row(Math.min(x + o, x + (side < 0 ? 1 : s - 2)), Math.max(x + o, x + (side < 0 ? 1 : s - 2)), y - 1, P.out);
      px(x + inner, y, P.out); px(x + inner - side, y, P.out);
    } else if (style === 'sleepy') { // heavy lids
      row(x, x + s - 1, y, P.out); row(x, x + s - 1, y - 1, P.out);
    } else if (style === 'shock') {
      row(x + 1, x + s - 2, y - 2, P.out);
    }
  }
  // wobbly zigzag scared mouth
  function scaredMouth(cx, y, w, f, flash) {
    const c = flash ? XFACE : FFACE;
    for (let i = -w; i <= w; i++) px(cx + i, y + (((i + w + f) & 2) ? 1 : 0), c);
  }

  /* ---------------- characters ---------------- */
  const DRAW = {
    wasabi(st) {
      // squat lumpy dollop of grated paste with a flicked peak
      const sw = [0, 1, 0, -1][st.f], top = C - 9, base = C + 5;
      const mound = (x, y) => {
        if (y > base) return ((x - C) / 9.8) ** 2 + ((y - base) / 4.2) ** 2 <= 1;
        const t = (y - top) / (base - top);
        if (t < 0) return false;
        const hw = 9.8 * Math.pow(t, 0.62) + 0.8 * Math.sin(y * 1.25 + st.f * 0.6) * t;
        return Math.abs(x - (C + (1 - t) * (1 - t) * sw * 2.2)) <= hw;
      };
      fill(mound, P.base);
      edge(mound, P.shade, 1.6, 1.2);
      // flicked peak
      const tx = Math.round(C + sw * 2.2);
      px(tx, C - 10, P.base); px(tx + 1, C - 10, P.base); px(tx + 1, C - 11, P.base); px(tx + 2, C - 11, P.shade); px(tx, C - 9, P.hi);
      // grated texture: scattered light and dark flecks
      for (const [x, y, h] of [[5, 6, 0], [-4, 7, 0], [6, 1, 0], [-7, 3, 0], [2, 8, 0], [-1, -6, 0], [3, -3, 0], [-5, -1, 1], [7, 5, 1], [-2, 5, 1], [1, -8, 1]]) {
        const X = C + x + Math.round((y < 0 ? 1 : 0) * sw), Y = C + y;
        if (mound(X + 0.5, Y + 0.5) && mound(X + 1.5, Y + 1.5)) px(X, Y, h ? P.hi : P.ext);
      }
      px(C - 6, C + 1, P.hi); px(C - 5, C, P.hi); px(C - 4, C - 3, P.hi); px(C - 3, C - 5, P.hi);
      outline(P.out);
      eye(C - 5, C - 1, 4, st, -1, 'angry'); eye(C + 1, C - 1, 4, st, 1, 'angry');
      if (st.fr) scaredMouth(C, C + 5, 3, st.f, st.flash);
      else { row(C - 2, C + 2, C + 5, P.out); px(C - 3, C + 4, P.out); px(C + 3, C + 4, P.out); px(C + 1, C + 6, EYE); }
    },
    ginger(st) {
      // a gari "rose": thin pickled-ginger slices with rippling frilly edges and layered petal lines
      const ph = st.f * Math.PI / 2;
      const petal = (cx, cy, sx, r0, amp, lobes, p) => (x, y) => {
        const dx = (x - cx) / sx, dy = y - cy, a = Math.atan2(dy, dx), r = r0 + amp * Math.sin(lobes * a + p);
        return dx * dx + dy * dy <= r * r;
      };
      const back = petal(C - 2.5, C - 2, 1.15, 7.4, 1.2, 5, ph + 1);
      const front = petal(C + 0.5, C + 1, 1.12, 7.6, 1.0, 6, -ph);
      fill(back, P.shade);
      edge(back, P.ext, -1.2, -1.2);
      fill(front, P.base);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const X = x + 0.5, Y = y + 0.5;
        if (!front(X, Y)) continue;
        if (!front(X + 1, Y) || !front(X - 1, Y) || !front(X, Y + 1) || !front(X, Y - 1)) { buf[y * S + x] = (X + Y > 2 * C + 2) ? P.shade : P.ext; continue; }
        const dx = (X - C - 0.5) / 1.12, dy = Y - C - 1, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        if (Math.abs(d - 5.4) < 0.5 && a > -2.9 && a < -1.0) buf[y * S + x] = P.ext; // inner petal edge
        else if (Math.abs(d - 4.4) < 0.5 && a > -2.6 && a < -1.3) buf[y * S + x] = P.hi;
        else if (Math.abs(d - 3.4) < 0.5 && a > 0.9 && a < 2.3) buf[y * S + x] = P.hi;
      }
      outline(P.out);
      eye(C - 4, C - 1, 4, st, -1, 'angry'); eye(C + 2, C - 1, 4, st, 1, 'angry');
      if (st.fr) scaredMouth(C + 1, C + 5, 3, st.f, st.flash);
      else { row(C - 1, C + 1, C + 5, P.out); px(C + 2, C + 4, P.out); px(C + 3, C + 3, P.out); }
    },
    soy(st) {
      const lean = [0, 1, 0, -1][st.f], top = C - 11, eq = C + 2, rr = 7.8;
      const drop = (x, y) => {
        const dy = y - eq;
        if (dy >= 0) return (x - C) ** 2 + dy * dy <= rr * rr;
        const t = (y - top) / (eq - top);
        if (t < 0) return false;
        return Math.abs(x - (C + lean * (1 - t) * 1.6)) <= rr * Math.pow(t, 0.72) + 0.2;
      };
      fill(drop, P.base);
      edge(drop, P.shade, -1.5, 1.5, (x, y) => y > C);
      edge(drop, P.ext, 1.6, 0.4, (x, y) => y > C - 3); // warm rim light so the drop reads on a dark floor
      // drip forming under the drop
      const d = st.fr ? 0 : st.f;
      if (d >= 1) px(C + 2, eq + 8, P.base);
      if (d >= 2) { px(C + 2, eq + 9, P.base); }
      if (d === 3) { px(C + 2, eq + 11, P.ext); px(C + 2, eq + 12, P.base); }
      outline(P.out);
      // glossy highlight streak
      px(C - 5, C + 1, P.hi); px(C - 5, C + 2, P.hi); px(C - 5, C + 3, P.hi); px(C - 4, C - 1, P.hi); px(C - 4, C, P.hi);
      px(C - 3, C - 4, P.hi); px(C - 2, C - 6, P.hi);
      eye(C - 5, C + 1, 4, st, -1, 'sleepy'); eye(C + 1, C + 1, 4, st, 1, 'sleepy');
      if (st.fr) scaredMouth(C, C + 7, 3, st.f, st.flash);
      else { row(C - 1, C + 1, C + 7, P.out); px(C + 2, C + 6, P.out); }
    },
    puffer(st) {
      const inf = st.inf, fx = st.fx, R = 7.4 + 11.6 * inf + (st.trem ? 0.6 : 0), rx = R * 1.06;
      const body = E(C, C, rx, R);
      // tail fin at the back, flapping
      const flap = [0, 1, 0, -1][st.f], tb = Math.round(C - fx * (rx - 0.5));
      for (let j = 0; j < 4; j++) for (let k = -j - 1; k <= j + 1; k++) px(tb - fx * (j + 1), C + k + (j > 1 ? flap : 0), j === 3 ? P.shade : P.base);
      fill(body, P.base);
      edge(body, P.shade, 1.6, 1.6);
      // belly
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const X = x + 0.5, Y = y + 0.5;
        if (body(X, Y) && Y > C + R * 0.28 && body(X, Y + 1.6) && body(X + 1.6, Y)) buf[y * S + x] = P.hi;
      }
      // back spots
      const sr = Math.max(0.8, R * 0.1);
      for (const a of [-2.5, -1.9, -1.2, -0.6]) fill(E(C + Math.cos(a) * rx * 0.58, C + Math.sin(a) * R * 0.58, sr, sr), P.shade);
      // spikes: nubs when relaxed, long quills when inflated
      const n = inf > 0.3 ? 16 : 7, L = 1 + 3.8 * Math.min(inf, 1.2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.2 + st.f * 0.02;
        if (inf <= 0.3 && Math.cos(a) * fx > 0.55) continue; // no nubs on the face
        for (let s = 0; s <= L; s += 0.5) px(C + Math.cos(a) * (rx + s - 0.5), C + Math.sin(a) * (R + s - 0.5), P.base);
      }
      // side fin
      const fl = st.f & 1;
      px(C - fx * 1, C + 2 + fl, P.shade); px(C - fx * 2, C + 2 + fl, P.shade); px(C - fx * 2, C + 1 + fl, P.shade);
      outline(P.out);
      // re-tint spike tips pale so quills read as sharp
      if (inf > 0.3) for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.2 + st.f * 0.02;
        px(C + Math.cos(a) * (rx + L - 0.5), C + Math.sin(a) * (R + L - 0.5), P.ext);
      }
      const big = inf > 0.5, es = big ? 6 : 4, gap = big ? 3 : 2, ecx = C + fx * R * 0.3, ey = C - (big ? 5 : 3);
      eye(ecx - gap / 2 - es, ey, es, st, -1, big ? 'angry' : 'shock'); eye(ecx + gap / 2, ey, es, st, 1, big ? 'angry' : 'shock');
      const mx = Math.round(C + fx * rx * (big ? 0.35 : 0.55)), my = Math.round(C + (big ? R * 0.3 : 2));
      if (st.fr) scaredMouth(mx - fx, my + 1, big ? 4 : 2, st.f, st.flash);
      else if (big) { row(mx - 1, mx + 1, my, P.out); px(mx - 2, my + 1, P.out); px(mx + 2, my + 1, P.out); row(mx - 1, mx + 1, my + 2, P.out); row(mx - 1, mx + 1, my + 1, LIP); }
      else { px(mx, my, LIP); px(mx + fx, my, LIP); px(mx, my + 1, LIP); px(mx + fx, my + 1, P.out); }
    },
  };

  /* ---------------- cache + blit ---------------- */
  const cache = new Map();
  function sprite(kind, st) {
    const k = `${kind}|${st.fr ? (st.flash ? 'w' : 'f') : 'n'}|${st.f}|${st.dx}|${st.dy}|${st.blink ? 1 : 0}|${st.infQ}|${st.fx}|${st.trem ? 1 : 0}`;
    let c = cache.get(k);
    if (c) return c;
    if (cache.size > 400) cache.clear();
    buf.fill(0);
    P = st.fr ? (st.flash ? FLASH : FRIGHT) : PAL[kind];
    (DRAW[kind] || DRAW.wasabi)(st);
    cctx.putImageData(img, 0, 0);
    c = document.createElement('canvas'); c.width = c.height = S;
    c.getContext('2d').drawImage(cv, 0, 0);
    cache.set(k, c);
    return c;
  }
  const snap = (k) => (k >= 2 ? Math.round(k) : k >= 0.9 ? Math.max(1, Math.round(k * 2) / 2) : k);
  const LOOK = [[-1, 0], [0, 0], [1, 0], [0, -1], [0, 0], [0, 1]];

  // draws one character centred at (cx,cy); o: {t, dir, fr, flash, inf, trem, fx, wait, frame?}
  function drawChar(ctx, kind, cx, cy, k, o) {
    const sp = SPEC[kind] || SPEC.wasabi, t = o.t + sp[2];
    const idle = !!o.wait;
    let dx = 0, dy = 0;
    if (idle) [dx, dy] = LOOK[Math.floor(t * 1.1) % LOOK.length];
    else if (o.dir) { dx = Math.sign(o.dir[0]); dy = Math.sign(o.dir[1]); }
    const inf = Math.max(0, o.inf || 0);
    const st = {
      f: Math.floor(t * (idle ? 3 : o.fr ? 9 : 6)) & 3, dx, dy,
      blink: !o.fr && (t % 3.7) < 0.13, fr: !!o.fr, flash: !!o.flash,
      inf: Math.round(inf * 16) / 16, infQ: Math.round(inf * 16), fx: o.fx || 1, trem: !!o.trem,
    };
    const spr = sprite(kind, st);
    const bob = Math.round(Math.sin(t * (idle ? sp[0] * 0.6 : sp[0])) * sp[1] * (o.fr ? 1.5 : 1));
    const shake = o.fr ? Math.round(Math.sin(t * 40) * 0.6) : o.trem ? (Math.floor(t * 30) & 1 ? 1 : -1) : 0;
    const X = Math.round(cx - C * k + shake * k), Y = Math.round(cy - C * k + bob * k);
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, X, Y, S * k, S * k);
    ctx.imageSmoothingEnabled = prev;
  }

  window.drawCastPortrait = function (ctx, kind, cx, cy, size, t = 0, opt = {}) {
    const k = snap((size || BODY) / BODY);
    // ground shadow
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    const sw = Math.round(8 * k * (1 + (opt.inf || 0) * 1.6)), sy = Math.round(cy + (10 + (opt.inf || 0) * 12) * k);
    ctx.fillRect(Math.round(cx - sw), sy, sw * 2, Math.max(1, Math.round(k)));
    drawChar(ctx, kind, cx, cy, k, Object.assign({ t, wait: opt.dir ? 0 : 1, fx: 1 }, opt));
  };

  /* ---------------- in-maze ghost ---------------- */
  ART.ghost = function (ctx, m, g) {
    const [gx, gy] = m.pos(g), ts = m.ts, cx = m.ox + (gx + 0.5) * ts, cy = m.oy + (gy + 0.5) * ts;
    const kind = PAL[g.kind] ? g.kind : g.puffer ? 'puffer' : g.soy ? 'soy' : 'wasabi';
    const k = snap((0.9 * ts * (g.size || 1)) / BODY);
    // frame-time bookkeeping on the ghost (visual only)
    const dt = clamp(m.t - (g._lt ?? m.t), 0, 0.05); g._lt = m.t;
    if (g.dir[0]) g._fx = Math.sign(g.dir[0]);
    // puffer inflate spring (overshoots so the pop reads)
    let inf = 0, trem = false;
    if (kind === 'puffer') {
      const tgt = g.inflated ? 1 : 0;
      g._inf = g._inf ?? tgt; g._iv = g._iv ?? 0;
      g._iv += (tgt - g._inf) * 170 * dt; g._iv *= Math.exp(-(g.inflated ? 9 : 14) * dt);
      g._inf = clamp(g._inf + g._iv * dt, 0, 1.25);
      if (dt === 0 && Math.abs(g._inf - tgt) > 0.5 && m.t === 0) g._inf = tgt;
      inf = g._inf;
      const cyc = (g.pt || 0) % 7;
      trem = !g.inflated && g.fright === 0 && !g.wait && cyc > 3.8 && cyc < 4.5; // wind-up warning
    }
    const fr = g.fright > 0, flash = fr && g.fright < 1.8 && Math.floor(g.fright * 6) % 2 === 1;
    // soy drip trail
    if (kind === 'soy') {
      const dr = g._dr || (g._dr = []);
      g._dt = (g._dt || 0) + dt;
      if (!fr && !g.wait && (g.dir[0] || g.dir[1]) && g._dt > 0.16 && dt > 0) {
        g._dt = 0;
        const d = dr.length >= 7 ? dr.shift() : {};
        d.x = cx - g.dir[0] * ts * 0.35 + ((m.t * 97) % 3) - 1; d.y = cy + ts * 0.3 - g.dir[1] * ts * 0.35; d.t = 0.9;
        dr.push(d);
      }
      for (const d of dr) {
        d.t -= dt; if (d.t <= 0) continue;
        const s = d.t > 0.45 ? 2 : 1;
        ctx.fillStyle = d.t > 0.45 ? '#4d2818' : '#2e160b';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), s, s);
        if (d.t > 0.6) { ctx.fillStyle = '#b0602c'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); }
      }
    }
    // soft ground shadow keeps the sprite anchored on light floors
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    const shw = Math.round(ts * (0.34 + inf * 0.6));
    ctx.fillRect(Math.round(cx - shw), Math.round(cy + ts * (0.44 + inf * 0.5)), shw * 2, 2);
    drawChar(ctx, kind, cx, cy, k, { t: m.t, dir: g.dir, fr, flash, inf, trem, fx: g._fx || 1, wait: g.wait > 0 });
  };

  /* ---------------- effects: poof + inflate burst ---------------- */
  const fx = [];
  const addFx = (o) => { if (fx.length < 40) fx.push(o); };
  EVT.on('ghostEaten', ({ m, g, x, y }) => {
    const kind = PAL[g.kind] ? g.kind : 'wasabi';
    addFx({ type: 'poof', m, x, y, t: 0, dur: 0.6, col: COLOR[kind], hi: HI[kind], seed: (x * 13 + y * 7) | 0 });
  });
  EVT.on('inflate', ({ m, g }) => {
    const [x, y] = m.pos(g);
    addFx({ type: 'puff', m, x, y, t: 0, dur: 0.35 });
  });
  EVT.on('ready', () => { fx.length = 0; });

  ART.layers.push((shell, ctx, dt) => {
    if (!fx.length) return;
    const m = shell.engine;
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      if (f.m !== m) { fx.splice(i, 1); continue; }
      if (shell.state === 'play') f.t += dt;
      if (f.t >= f.dur) { fx.splice(i, 1); continue; }
      const ts = m.ts, cx = m.ox + (f.x + 0.5) * ts, cy = m.oy + (f.y + 0.5) * ts, p = f.t / f.dur;
      if (f.type === 'poof') {
        // cloud puffs expanding and thinning
        const R = ts * (0.3 + p * 0.55);
        for (let j = 0; j < 6; j++) {
          const a = j * 1.047 + f.seed, r = Math.round(ts * (0.26 - p * 0.2));
          if (r < 1) continue;
          const px_ = Math.round(cx + Math.cos(a) * R), py_ = Math.round(cy + Math.sin(a) * R * 0.8);
          ctx.fillStyle = p < 0.35 ? f.hi : f.col;
          ctx.fillRect(px_ - r, py_ - r + 1, r * 2, r * 2 - 2); ctx.fillRect(px_ - r + 1, py_ - r, r * 2 - 2, r * 2);
        }
        // core flash
        if (p < 0.25) { const r = Math.round(ts * 0.35 * (1 - p * 2)); ctx.fillStyle = '#f4ead7'; ctx.fillRect(Math.round(cx) - r, Math.round(cy) - r, r * 2, r * 2); }
        // flying specks
        for (let j = 0; j < 8; j++) {
          const a = j * 0.785 + 0.4, d = ts * (0.4 + p * 0.9);
          ctx.fillStyle = j & 1 ? f.col : f.hi;
          ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d - p * 6), 2, 2);
        }
      } else {
        // inflate: quick ring of pale ticks
        const d = ts * (0.9 + p * 0.7);
        ctx.fillStyle = '#fff2bf'; ctx.globalAlpha = 1 - p;
        for (let j = 0; j < 12; j++) {
          const a = j * 0.5236;
          ctx.fillRect(Math.round(cx + Math.cos(a) * d) - 1, Math.round(cy + Math.sin(a) * d) - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
    }
  });
})();
