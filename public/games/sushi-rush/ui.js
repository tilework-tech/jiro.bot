'use strict';
/*
 * Sushi Rush UI: HUD (runner + boss maze), banners, floating score popups, and the
 * title / paused / game-over screens. Pixel look: Silkscreen text with hard 1px ink
 * outlines, flat jiro.bot palette, wooden signs and noren.
 * Hooks: ART.runnerHud, ART.mazeHud, ART.banner, ART.screen. Events: start, gameover.
 */
(function () {
  const C = {
    ink: '#120d0a', ink2: '#1b1410', ink3: '#261c16', out: '#0b0705',
    paper: '#f4ead7', dim: '#cbbca3', muted: '#9c8a74', hinoki: '#e8cd9c', hinokiD: '#c9a36b', hinokiL: '#f6e3bd',
    wood: '#6e4521', woodD: '#4b2d15', woodL: '#8a5a30', lac: '#c8321e', lac2: '#e2482f', lacD: '#6b1a10',
    salmon: '#ff7b4f', wasabi: '#a6c94a', indigo: '#2b4486', indigoD: '#1c2b5c', cyan: '#5ff3ff', gold: '#f2cc60',
  };
  const PX = "'Silkscreen', 'JetBrains Mono', monospace";
  const JP = "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif";
  const SERIF = "'Fraunces', Georgia, serif";
  const STAGE_S = 12, RICE_GOAL = 40;
  const R = Math.round;
  const S = 2; // offscreen cache scale (matches max devicePixelRatio used by Shell)

  // Make sure canvas fonts are ready; drop glyph caches once they are.
  let cache = {};
  if (document.fonts) {
    for (const f of ['8px Silkscreen', '16px Silkscreen', '40px Silkscreen', '800 16px "Shippori Mincho B1"', 'italic 16px Fraunces']) document.fonts.load(f).catch(() => {});
    document.fonts.ready.then(() => { cache = {}; });
    document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', () => { cache = {}; });
  }

  const jiro = new Image();
  jiro.src = '/sprites/jiro-frame0.png';

  // Best-score bookkeeping for the "new best" flair (Shell writes Best before 'gameover').
  let prevBest = Best.get('rush'), newBest = false;
  EVT.on('start', () => { prevBest = Best.get('rush'); newBest = false; });
  EVT.on('gameover', (d) => { newBest = d.engine.score > prevBest && d.engine.score >= 1; });

  /* ---------------- drawing helpers ---------------- */
  // Pixel text with a hard ink outline and 1px drop shadow.
  function ptext(ctx, s, x, y, size = 8, color = C.paper, align = 'left', o = 1, shadow = C.out) {
    ctx.font = `${size}px ${PX}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    x = R(x); y = R(y);
    if (o) {
      ctx.fillStyle = shadow;
      ctx.fillText(s, x - o, y); ctx.fillText(s, x + o, y); ctx.fillText(s, x, y - o);
      ctx.fillText(s, x, y + o); ctx.fillText(s, x + o, y + o * 2); ctx.fillText(s, x - o, y + o * 2);
    }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    ctx.textAlign = 'left';
  }
  function tw(ctx, s, size) { ctx.font = `${size}px ${PX}`; return ctx.measureText(s).width; }

  // Dark lacquer tray used for HUD plates.
  function plate(ctx, x, y, w, h, fill = 'rgba(22,15,11,.86)') {
    x = R(x); y = R(y); w = R(w); h = R(h);
    ctx.fillStyle = C.out; ctx.fillRect(x - 1, y, w + 2, h); ctx.fillRect(x, y - 1, w, h + 2);
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(232,205,156,.22)'; ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
  }

  // Hinoki / lacquer / indigo board with pixel outline, highlight, grain and shadow.
  const BOARDS = {
    wood: { f: C.hinoki, l: C.hinokiL, d: C.hinokiD, g: 'rgba(160,110,60,.28)', t: '#2a1a10', ts: null },
    red: { f: C.lac, l: C.lac2, d: '#8e2414', g: 'rgba(0,0,0,.12)', t: C.paper, ts: C.lacD },
    green: { f: '#7f9c34', l: C.wasabi, d: '#56701f', g: 'rgba(0,0,0,.12)', t: C.paper, ts: '#34450f' },
    indigo: { f: '#243a73', l: '#2f4a8c', d: C.indigoD, g: 'rgba(0,0,0,.15)', t: '#efe8da', ts: '#0f1733' },
  };
  function board(ctx, x, y, w, h, kind = 'wood') {
    const B = BOARDS[kind]; x = R(x); y = R(y); w = R(w); h = R(h);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x + 2, y + 3, w, h);
    ctx.fillStyle = C.out; ctx.fillRect(x - 1, y, w + 2, h); ctx.fillRect(x, y - 1, w, h + 2);
    ctx.fillStyle = B.f; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = B.l; ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = B.d; ctx.fillRect(x, y + h - 3, w, 3);
    ctx.fillStyle = B.g;
    for (let i = 0; i < 3; i++) { const gy = y + 5 + R(((i + 1) * (h - 9)) / 4); ctx.fillRect(x + 4 + ((i * 17) % 11), gy, w - 12 - ((i * 13) % 19), 1); }
  }

  function signKind(text) {
    const t = text.toLowerCase();
    if (t.includes('beaten') || t.includes('clear')) return 'green';
    if (t.includes('boss') || t.includes('ouch')) return 'red';
    if (t.includes('ready')) return 'indigo';
    return 'wood';
  }
  const easeBack = (k) => { const c = 1.9; k = clamp(k, 0, 1) - 1; return 1 + (c + 1) * k * k * k + c * k * k; };

  // Hanging sign (strings to the top edge), used for banners.
  function sign(ctx, cx, y, text, age = 1, left = 99, top = 0) {
    const kind = signKind(text), B = BOARDS[kind];
    const size = 16, w = R(tw(ctx, text, size) + 44), h = 30;
    const drop = R((1 - easeBack(age / 0.35)) * -60);
    const x = R(cx - w / 2), yy = R(y - 21 + drop);
    ctx.save();
    ctx.globalAlpha = clamp(left / 0.2, 0, 1);
    // strings
    ctx.fillStyle = C.out;
    ctx.fillRect(x + 12, top, 1, Math.max(0, yy - top)); ctx.fillRect(x + w - 13, top, 1, Math.max(0, yy - top));
    board(ctx, x, yy, w, h, kind);
    // nail heads
    ctx.fillStyle = C.out; ctx.fillRect(x + 11, yy + 3, 3, 3); ctx.fillRect(x + w - 14, yy + 3, 3, 3);
    ptext(ctx, text, cx, yy + 21, size, B.t, 'center', B.ts ? 1 : 0, B.ts || C.out);
    ctx.restore();
  }

  /* ---------------- cached pixel icons ---------------- */
  function icon(key, w, h, draw) {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = w * S; c.height = h * S;
    const x = c.getContext('2d'); x.scale(S, S); x.imageSmoothingEnabled = false; draw(x);
    return (cache[key] = c);
  }
  function pixelDisc(x, cx, cy, r, col) {
    x.fillStyle = col;
    for (let yy = -r; yy <= r; yy++) { const hw = Math.floor(Math.sqrt(r * r - yy * yy + r * 0.8)); x.fillRect(cx - hw, cy + yy, hw * 2 + 1, 1); }
  }
  // Tiny Giant Puffer badge (UI icon only).
  function pufferIcon(size) {
    return icon('puff' + size, size, size, (x) => {
      const c = size / 2 - 0.5, r = Math.floor(size / 2) - 3;
      x.fillStyle = C.out;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; x.fillRect(R(c + Math.cos(a) * (r + 2)) - 1, R(c + Math.sin(a) * (r + 2)) - 1, 2, 2); }
      pixelDisc(x, R(c), R(c), r + 1, C.out);
      pixelDisc(x, R(c), R(c), r, C.gold);
      x.fillStyle = '#fff3c4'; x.fillRect(R(c) - R(r * 0.5), R(c) - R(r * 0.6), 2, 1);
      x.fillStyle = '#c99a2e'; x.fillRect(R(c) - r + 1, R(c) + R(r * 0.3), r * 2 - 1, 1);
      x.fillStyle = C.out; x.fillRect(R(c) + 1, R(c) - 2, 2, 2); x.fillRect(R(c) + r - 1, R(c) + 1, 2, 1);
    });
  }
  function grainIcon(full) {
    return icon('grain' + (full ? 1 : 0), 8, 6, (x) => {
      if (full) {
        x.fillStyle = C.out; x.fillRect(1, 0, 6, 6); x.fillRect(0, 1, 8, 4);
        x.fillStyle = '#fbf6ea'; x.fillRect(1, 1, 6, 4);
        x.fillStyle = '#d9cdb4'; x.fillRect(2, 4, 5, 1);
        x.fillStyle = '#ffffff'; x.fillRect(2, 1, 2, 1);
      } else {
        x.fillStyle = '#5a4432'; x.fillRect(1, 0, 6, 6); x.fillRect(0, 1, 8, 4);
        x.fillStyle = '#2e2219'; x.fillRect(1, 1, 6, 4);
      }
    });
  }

  // Logo letters, cached per glyph so each letter can bob independently.
  function logoGlyph(ch, top, mid, bot) {
    const key = 'L' + ch + top;
    if (cache[key]) return cache[key];
    const size = 40, probe = document.createElement('canvas').getContext('2d');
    probe.font = `${size}px ${PX}`;
    const w = Math.ceil(probe.measureText(ch).width) + 12, h = 58;
    return icon(key, w, h, (x) => {
      x.font = `${size}px ${PX}`; x.textBaseline = 'alphabetic';
      const bx = 6, by = 40;
      const ring = (dx, dy, col, o) => { x.fillStyle = col; for (const [a, b] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]]) x.fillText(ch, bx + dx + a, by + dy + b); };
      ring(0, 4, C.out, 2);
      x.fillStyle = C.lacD; x.fillText(ch, bx, by + 4); x.fillText(ch, bx, by + 2);
      ring(0, 0, C.out, 2);
      const g = x.createLinearGradient(0, by - 26, 0, by);
      g.addColorStop(0, top); g.addColorStop(0.5, top); g.addColorStop(0.5, mid); g.addColorStop(1, mid);
      x.fillStyle = g; x.fillText(ch, bx, by);
    });
  }
  function drawLogo(ctx, cx, y, t) {
    const words = [['SUSHI', '#ffa27a', C.salmon, C.salmon], ['RUSH', '#fbf3e4', C.hinoki, C.hinoki]];
    const gl = [];
    let total = 0;
    words.forEach(([w, a, b, c], wi) => {
      for (const ch of w) { const g = logoGlyph(ch, a, b, c); gl.push(g); total += g.width / S - 10; }
      if (wi === 0) { gl.push(null); total += 18; }
    });
    let x = cx - total / 2 - 6, i = 0;
    for (const g of gl) {
      if (!g) { x += 18; i++; continue; }
      const bob = R(Math.sin(t * 4 - i * 0.55) * 3);
      ctx.drawImage(g, R(x), R(y - 40 + bob), g.width / S, g.height / S);
      x += g.width / S - 10; i++;
    }
  }

  /* ---------------- floating score popups ---------------- */
  function drawFx(ctx, fx) {
    for (const f of fx) {
      const a = clamp(f.t / 0.5, 0, 1);
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      const big = /^\+\d{3,}|!/.test(f.text);
      ptext(ctx, f.text, f.x, f.y, big ? 16 : 8, f.color || C.gold, 'center', 1);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------------- runner HUD ---------------- */
  function stageDots(ctx, x, y, stage, t) {
    const pos = (stage - 1) % 3;
    for (let i = 0; i < 3; i++) {
      const cx = x + i * 13;
      if (i === 2) {
        const ic = pufferIcon(14);
        const wob = pos === 1 && Math.floor(t * 4) % 2 ? -1 : 0;
        ctx.globalAlpha = pos >= 1 ? 1 : 0.45;
        ctx.drawImage(ic, cx - 3, y - 6 + wob, 14, 14); ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = C.out; ctx.fillRect(cx, y - 1, 8, 8);
        ctx.fillStyle = i < pos ? C.wasabi : i === pos ? C.salmon : C.ink3; ctx.fillRect(cx + 1, y, 6, 6);
        if (i === pos) { ctx.fillStyle = '#ffd0b0'; ctx.fillRect(cx + 1, y, 3, 1); }
      }
    }
  }

  ART.runnerHud = function (g, ctx) {
    const W = g.W, rush = g.o.rush, stage = rush ? rush.stage : 1;
    const left = Math.max(0, STAGE_S - g.t), bossNext = rush && stage % 3 === 2;
    ctx.save();
    // stage + timer plate (top-left)
    plate(ctx, 10, 10, 162, 42);
    ptext(ctx, 'STAGE ' + stage, 18, 29, 16, C.paper);
    stageDots(ctx, 132, 17, stage, g.t);
    const segs = 12, sw = 10, sx = 18, sy = 37;
    const col = left > 6 ? C.wasabi : left > 3 ? C.gold : C.lac2;
    const blink = left <= 3 && Math.floor(g.t * 8) % 2;
    ctx.fillStyle = C.out; ctx.fillRect(sx - 1, sy - 1, segs * (sw + 1) + 1, 8);
    for (let i = 0; i < segs; i++) {
      const X = sx + i * (sw + 1), fill = clamp(left - i, 0, 1);
      ctx.fillStyle = C.ink3; ctx.fillRect(X, sy, sw, 6);
      if (fill > 0) {
        ctx.fillStyle = blink ? C.paper : col; ctx.fillRect(X, sy, Math.max(1, R(sw * fill)), 6);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(X, sy, Math.max(1, R(sw * fill)), 1);
      }
    }
    ptext(ctx, String(Math.ceil(left)), 164, 44, 8, left <= 3 ? C.lac2 : C.dim, 'right', 1);
    // boss warning tag
    if (bossNext) {
      const hot = left <= 4, on = !hot || Math.floor(g.t * 6) % 2 === 0;
      const wy = 60;
      ctx.fillStyle = C.out; ctx.fillRect(9, wy - 1, 112, 18);
      ctx.fillStyle = on ? C.lac : C.lacD; ctx.fillRect(10, wy, 110, 16);
      ctx.fillStyle = C.lac2; ctx.fillRect(10, wy, 110, 1);
      ctx.drawImage(pufferIcon(14), 13, wy + 1, 14, 14);
      ptext(ctx, 'BOSS NEXT!', 31, wy + 12, 8, C.paper, 'left', 1, C.lacD);
    }
    // score plate (top-right)
    const best = Best.get(g.o.id || 'rush'), score = Math.floor(g.score), beat = score > best && best > 0;
    plate(ctx, W - 160, 10, 150, 42);
    ptext(ctx, 'SCORE', W - 152, 24, 8, C.muted);
    ptext(ctx, pad(score), W - 18, 30, 16, C.paper, 'right');
    ptext(ctx, beat ? 'NEW BEST' : 'BEST', W - 152, 45, 8, beat ? C.salmon : C.muted);
    ptext(ctx, pad(Math.max(best, beat ? score : 0)), W - 18, 45, 8, beat ? C.salmon : C.dim, 'right');
    drawFx(ctx, g.fx);
    if (g.banner) sign(ctx, W / 2, 86, g.banner.text, g.banner.t0 - g.banner.t, g.banner.t, 0);
    ctx.restore();
  };

  ART.banner = function (ctx, W, text, y, color) { sign(ctx, W / 2, y, text, 1, 1, 0); };

  /* ---------------- maze (boss) HUD ---------------- */
  ART.mazeHud = function (m, ctx) {
    const o = m.o, ts = m.ts, bw = m.cols * ts, bh = m.rows * ts;
    const x0 = m.ox + bw + 10, x1 = m.W - 8, pw = x1 - x0, y0 = m.oy, cx = x0 + pw / 2;
    const rush = o.rush, stage = rush ? rush.stage : 1;
    const boss = m.ghosts.find((gh) => gh.boss) || m.ghosts[0];
    ctx.save();
    plate(ctx, x0, y0, pw, bh);
    // header strip
    ctx.fillStyle = C.lac; ctx.fillRect(x0, y0, pw, 16);
    ctx.fillStyle = C.lac2; ctx.fillRect(x0, y0, pw, 1);
    ctx.fillStyle = C.lacD; ctx.fillRect(x0, y0 + 15, pw, 1);
    ptext(ctx, o.rush || o.boss ? 'BOSS - STAGE ' + stage : (m.map.name || '').toUpperCase(), cx, y0 + 12, 8, C.paper, 'center', 1, C.lacD);
    // boss name + portrait
    let y = y0 + 24;
    const name = ((boss && boss.label) || 'GIANT PUFFER').toUpperCase().split(' ');
    const ic = pufferIcon(28), infl = boss && boss.inflated;
    const wob = infl ? R(Math.sin(m.t * 30)) : R(Math.sin(m.t * 3) * 1.5);
    ctx.drawImage(ic, x0 + 8 + (infl ? wob : 0), y + (infl ? 0 : wob), 28, 28);
    name.slice(0, 2).forEach((w, i) => ptext(ctx, w, x0 + 42, y + 12 + i * 14, i === name.length - 1 ? 16 : 8, C.gold));
    y += 40;
    // boss status
    let st = 'HUNTING', sc = C.dim;
    if (boss) {
      if (boss.inflated) { st = Math.floor(m.t * 8) % 2 ? 'PUFFED UP!' : ''; sc = C.lac2; }
      else if (boss.fright > 0) { st = 'SCARED!'; sc = C.cyan; }
      else if (boss.wait > 0) { st = 'WAKING UP'; sc = C.muted; }
    }
    ptext(ctx, st, cx, y, 8, sc, 'center');
    y += 8;
    ctx.fillStyle = 'rgba(232,205,156,.12)'; ctx.fillRect(x0 + 6, y, pw - 12, 1);
    // rice progress toward 40
    y += 14;
    const eaten = Math.min(RICE_GOAL, m.eaten || 0);
    ptext(ctx, 'RICE', x0 + 8, y, 8, C.muted);
    ptext(ctx, eaten + '/' + RICE_GOAL, x1 - 8, y, 8, eaten >= RICE_GOAL ? C.wasabi : C.paper, 'right');
    y += 6;
    const cols = 8, cw = Math.floor((pw - 16) / cols), gx0 = R(cx - (cols * cw) / 2 + (cw - 8) / 2);
    const full = grainIcon(true), empty = grainIcon(false);
    for (let i = 0; i < RICE_GOAL; i++) {
      const gx = gx0 + (i % cols) * cw, gy = y + Math.floor(i / cols) * 9;
      const on = i < eaten, pop = on && i === eaten - 1 ? -1 : 0;
      ctx.drawImage(on ? full : empty, gx, gy + pop, 8, 6);
    }
    y += 5 * 9 + 4;
    // progress bar
    ctx.fillStyle = C.out; ctx.fillRect(x0 + 7, y - 1, pw - 14, 6);
    ctx.fillStyle = C.ink3; ctx.fillRect(x0 + 8, y, pw - 16, 4);
    ctx.fillStyle = eaten >= 30 ? C.wasabi : C.salmon; ctx.fillRect(x0 + 8, y, R(((pw - 16) * eaten) / RICE_GOAL), 4);
    y += 12;
    ctx.fillStyle = 'rgba(232,205,156,.12)'; ctx.fillRect(x0 + 6, y, pw - 12, 1);
    // score
    y += 14;
    const best = Best.get(o.id || 'rush'), score = Math.floor(m.score), beat = score > best && best > 0;
    ptext(ctx, 'SCORE', x0 + 8, y, 8, C.muted);
    ptext(ctx, pad(score), x1 - 8, y + 2, 16, C.paper, 'right');
    y += 14;
    ptext(ctx, beat ? 'NEW BEST' : 'BEST', x0 + 8, y, 8, beat ? C.salmon : C.muted);
    ptext(ctx, pad(Math.max(best, beat ? score : 0)), x1 - 8, y, 8, beat ? C.salmon : C.dim, 'right');
    // footer warning
    const fy = y0 + bh - 8;
    if (fy > y + 14) ptext(ctx, 'ONE HIT = OUT', cx, fy, 8, C.muted, 'center');
    drawFx(ctx, m.fx);
    if (m.banner) sign(ctx, m.ox + bw / 2, m.oy + bh / 2 + 4, m.banner.text, m.banner.t0 - m.banner.t, m.banner.t, m.oy);
    ctx.restore();
  };

  /* ---------------- screens ---------------- */
  function dim(ctx, W, H, a) {
    ctx.fillStyle = `rgba(18,13,10,${a})`; ctx.fillRect(0, 0, W, H);
    // pixel vignette bands
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, 6); ctx.fillRect(0, H - 6, W, 6);
  }
  function prompt(ctx, text, cx, y, t, color = C.paper) {
    if (Math.floor(t * 2.2) % 2 === 1) return;
    const w = R(tw(ctx, text, 16) + 28);
    ctx.fillStyle = C.out; ctx.fillRect(R(cx - w / 2) - 1, y - 15, w + 2, 22);
    ctx.fillStyle = C.lac; ctx.fillRect(R(cx - w / 2), y - 14, w, 20);
    ctx.fillStyle = C.lac2; ctx.fillRect(R(cx - w / 2), y - 14, w, 2);
    ctx.fillStyle = C.lacD; ctx.fillRect(R(cx - w / 2), y + 4, w, 2);
    ptext(ctx, text, cx, y + 1, 16, color, 'center', 1, C.lacD);
  }
  function portrait(ctx, x, y, s, t) {
    const bob = R(Math.sin(t * 2) * 1);
    y += bob;
    board(ctx, x - 6, y - 6, s + 12, s + 12, 'wood');
    ctx.fillStyle = C.out; ctx.fillRect(x - 1, y - 1, s + 2, s + 2);
    if (jiro.complete && jiro.naturalWidth) {
      ctx.imageSmoothingEnabled = false; ctx.drawImage(jiro, x, y, s, s); ctx.imageSmoothingEnabled = true;
    } else { ctx.fillStyle = C.ink3; ctx.fillRect(x, y, s, s); }
    // name tag
    const tag = 'CHEF JIRO', w = R(tw(ctx, tag, 8) + 14);
    ctx.fillStyle = C.out; ctx.fillRect(R(x + s / 2 - w / 2) - 1, y + s + 1, w + 2, 14);
    ctx.fillStyle = C.indigo; ctx.fillRect(R(x + s / 2 - w / 2), y + s + 2, w, 12);
    ptext(ctx, tag, x + s / 2, y + s + 11, 8, '#efe8da', 'center', 0);
  }
  function jpLine(ctx, text, cx, y) {
    ctx.font = `800 14px ${JP}`; ctx.textAlign = 'center';
    const w = ctx.measureText(text).width;
    ctx.fillStyle = C.lac; ctx.fillRect(R(cx - w / 2 - 44), y - 5, 32, 2); ctx.fillRect(R(cx + w / 2 + 12), y - 5, 32, 2);
    ctx.fillStyle = C.out; ctx.fillText(text, cx + 1, y + 1);
    ctx.fillStyle = C.dim; ctx.fillText(text, cx, y);
    ctx.textAlign = 'left';
  }
  function rule(ctx, x, y, bullet, a, b) {
    ctx.fillStyle = C.out; ctx.fillRect(x - 1, y - 8, 8, 8);
    ctx.fillStyle = bullet; ctx.fillRect(x, y - 7, 6, 6);
    ptext(ctx, a, x + 14, y, 8, C.paper);
    ptext(ctx, b, x + 14 + tw(ctx, a + ' ', 8), y, 8, C.dim);
  }
  function stars(ctx, cx, cy, t, n, r) {
    for (let i = 0; i < n; i++) {
      const a = t * 0.9 + (i / n) * TAU, rr2 = r + Math.sin(t * 3 + i) * 6;
      const x = R(cx + Math.cos(a) * rr2 * 1.9), y = R(cy + Math.sin(a) * rr2 * 0.55);
      const on = (Math.floor(t * 6) + i) % 3;
      ctx.fillStyle = i % 2 ? C.gold : C.salmon;
      ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
      if (on === 0) { ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5); }
    }
  }

  function titleScreen(shell, ctx, W, H) {
    const t = shell.t;
    dim(ctx, W, H, 0.74);
    drawLogo(ctx, W / 2, 70, t);
    jpLine(ctx, '寿司ラッシュ', W / 2, 106);
    portrait(ctx, 56, 126, 96, t);
    // rules column
    const rx = 196;
    plate(ctx, rx - 12, 124, 326, 96, 'rgba(18,13,10,.72)');
    rule(ctx, rx, 142, C.wasabi, '12 SEC STAGES', 'THAT SPEED UP');
    rule(ctx, rx, 162, C.gold, 'EVERY 3RD', 'A GIANT PUFFER BOSS');
    rule(ctx, rx, 182, C.salmon, 'EAT 40 RICE', 'TO BEAT IT, +500');
    ptext(ctx, 'SPACE/UP JUMP   DOWN DUCK   ESC PAUSE', rx, 206, 8, C.muted);
    // best plaque
    const best = Best.get('rush'), bx = W - 138, by = 128;
    board(ctx, bx, by, 110, 50, 'wood');
    ptext(ctx, 'BEST', bx + 55, by + 17, 8, '#6e4521', 'center', 0);
    ptext(ctx, pad(best), bx + 55, by + 38, 16, '#2a1a10', 'center', 0);
    ctx.fillStyle = C.out; ctx.fillRect(bx + 88, by - 7, 18, 18);
    ctx.fillStyle = C.lac; ctx.fillRect(bx + 89, by - 6, 16, 16);
    ctx.font = `800 12px ${JP}`; ctx.textAlign = 'center'; ctx.fillStyle = C.paper; ctx.fillText('旬', bx + 97, by + 7); ctx.textAlign = 'left';
    prompt(ctx, 'PRESS SPACE / TAP TO START', W / 2, 262, shell.stateT);
  }

  function pausedScreen(shell, ctx, W, H) {
    dim(ctx, W, H, 0.66);
    const k = easeBack(shell.stateT / 0.3), cx = W / 2;
    const w = 220, h = 96, x = R(cx - w / 2), y = R(60 + (1 - k) * -80);
    // noren curtain split in 4 panels
    ctx.fillStyle = C.woodD; ctx.fillRect(x - 12, y - 6, w + 24, 6);
    ctx.fillStyle = C.woodL; ctx.fillRect(x - 12, y - 6, w + 24, 1);
    const panels = ['一', '休', 'み', '中'];
    const pw = (w - 12) / 4;
    for (let i = 0; i < 4; i++) {
      const px = R(x + i * (pw + 4)), sway = R(Math.sin(shell.t * 1.5 + i) * 1.2);
      ctx.fillStyle = C.out; ctx.fillRect(px - 1, y, R(pw) + 2, h + 1 + sway);
      ctx.fillStyle = '#243a73'; ctx.fillRect(px, y, R(pw), h + sway);
      ctx.fillStyle = C.indigoD; ctx.fillRect(px, y, 2, h + sway); ctx.fillRect(px + R(pw) - 2, y, 2, h + sway);
      ctx.font = `800 22px ${JP}`; ctx.textAlign = 'center'; ctx.fillStyle = '#efe8da';
      ctx.fillText(panels[i], px + pw / 2, y + 36);
    }
    ctx.textAlign = 'left';
    ptext(ctx, 'PAUSED', cx, y + 76, 16, C.paper, 'center', 1, '#0f1733');
    ptext(ctx, 'SCORE ' + pad(shell.engine.score), cx, 196, 8, C.dim, 'center');
    prompt(ctx, 'SPACE / TAP TO RESUME', cx, 236, shell.stateT);
  }

  function overScreen(shell, ctx, W, H) {
    const e = shell.engine, t = shell.stateT, cx = W / 2;
    dim(ctx, W, H, clamp(t / 0.25, 0, 1) * 0.78);
    const k = easeBack(t / 0.4);
    // hanging "GAME OVER" sign
    const sy = R(24 + (1 - k) * -90);
    ctx.fillStyle = C.out; ctx.fillRect(cx - 110, 0, 1, sy); ctx.fillRect(cx + 109, 0, 1, sy);
    board(ctx, cx - 130, sy, 260, 50, 'red');
    ctx.fillStyle = C.out; ctx.fillRect(cx - 112, sy + 4, 4, 4); ctx.fillRect(cx + 108, sy + 4, 4, 4);
    ptext(ctx, 'GAME OVER', cx, sy + 34, 24, C.paper, 'center', 2, C.lacD);
    // cause
    if (t > 0.2) {
      ctx.font = `italic 500 16px ${SERIF}`; ctx.textAlign = 'center';
      const msg = e.overMsg || 'Wiped out';
      ctx.fillStyle = C.out; ctx.fillText(msg, cx + 1, 104); ctx.fillStyle = C.dim; ctx.fillText(msg, cx, 103);
      ctx.textAlign = 'left';
    }
    // score card
    const best = Best.get('rush'), score = Math.floor(e.score);
    const cy = 120, cw = 250, chh = 76, x = R(cx - cw / 2);
    if (newBest) {
      // rotating pixel sunburst
      ctx.save(); ctx.translate(cx, cy + 32); ctx.rotate(shell.t * 0.4);
      ctx.fillStyle = 'rgba(242,204,96,.07)';
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, -14); ctx.lineTo(150, 14); ctx.fill(); }
      ctx.restore();
    }
    plate(ctx, x, cy, cw, chh, 'rgba(27,20,16,.95)');
    ptext(ctx, 'SCORE', x + 12, cy + 16, 8, C.muted);
    ptext(ctx, 'STAGE ' + (e.stage || 1), x + cw - 12, cy + 16, 8, C.muted, 'right');
    const shown = Math.floor(score * clamp((t - 0.2) / 0.6, 0, 1));
    ptext(ctx, pad(shown), cx, cy + 50, 32, newBest ? C.gold : C.paper, 'center', 2);
    ptext(ctx, 'BEST ' + pad(best), cx, cy + 68, 8, newBest ? C.salmon : C.dim, 'center');
    if (newBest && t > 0.8) {
      stars(ctx, cx, cy + 34, shell.t, 10, 70);
      const wob = Math.sin(shell.t * 6) * 0.08;
      ctx.save(); ctx.translate(x + cw - 14, cy + 8); ctx.rotate(0.12 + wob);
      const tag = 'NEW BEST!', w = R(tw(ctx, tag, 16) + 16);
      ctx.fillStyle = C.out; ctx.fillRect(-w / 2 - 1, -12, w + 2, 22);
      ctx.fillStyle = C.salmon; ctx.fillRect(-w / 2, -11, w, 20);
      ctx.fillStyle = '#ffb08f'; ctx.fillRect(-w / 2, -11, w, 2);
      ptext(ctx, tag, 0, 5, 16, C.paper, 'center', 1, C.lacD);
      ctx.restore();
    }
    if (t > 0.35) prompt(ctx, 'SPACE / TAP TO RETRY', cx, 238, t - 0.35);
    ptext(ctx, 'EVERY 3RD STAGE: GIANT PUFFER - EAT 40 RICE', cx, 280, 8, C.muted, 'center');
  }

  ART.screen = function (shell, ctx) {
    if (shell.state === 'play') return;
    const W = shell.W, H = shell.H;
    ctx.save();
    if (shell.state === 'title') titleScreen(shell, ctx, W, H);
    else if (shell.state === 'paused') pausedScreen(shell, ctx, W, H);
    else if (shell.state === 'over') overScreen(shell, ctx, W, H);
    ctx.restore();
  };
})();
