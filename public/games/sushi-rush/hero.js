'use strict';
/*
 * Sushi Rush hero: pixel-art salmon nigiri runner + runner-stage game feel.
 * - ART.nigiri: 1px-grid sprite inside the 40x30 (18 ducking) hitbox footprint, facing right.
 *   Run cycle, jump stretch, apex tuck, fall, duck squash, landing squash, blink, hachimaki tails.
 * - Juice (Rush 'run' phase only): dust (run/land/jump), jump whoosh, speed lines, rice burst,
 *   screen shake (ART.preDraw) and a short hit flash (ART.layers). Purely visual; no gameplay changes.
 */
(() => {
  const C = {
    ink: '#120d0a', line: '#3a1a10', riceLine: '#5b4636',
    rice: '#f6efe1', riceHi: '#fffdf6', riceSh: '#d9ccb2', grain: '#e6dcc6',
    fish: '#ff7b4f', fishHi: '#ffa071', fishSh: '#e2482f', fat: '#ffe3d2',
    band: '#f4ead7', bandSh: '#cbbca3', leg: '#e8cd9c', shoe: '#c8321e',
    blush: '#ff9b86', dust: '#cbbca3', paper: '#f4ead7',
  };
  const R = Math.round;
  const S = { landT: 0, landAmt: 0, jumpT: 0, hitT: 0, lastT: -1 };
  const inRush = () => { const e = Shell.engine; return !!(e && e.phase === 'run'); };

  /* Pixel scanline rounded shape. rowFn(i, x0, x1, y) draws row i spanning [x0, x1). */
  function inset(i, h, rT, rB) {
    let d = 0;
    if (i < rT) { const dy = rT - i - 0.5; d = rT - Math.sqrt(Math.max(0, rT * rT - dy * dy)); }
    const j = h - 1 - i;
    if (j < rB) { const dy = rB - j - 0.5; d = Math.max(d, rB - Math.sqrt(Math.max(0, rB * rB - dy * dy))); }
    return R(d);
  }
  function shape(ctx, x, y, w, h, r, rowFn) {
    // r = [topLeft, topRight, bottomRight, bottomLeft]
    for (let i = 0; i < h; i++) {
      const l = inset(i, h, r[0], r[3]), rt = inset(i, h, r[1], r[2]);
      if (w - l - rt > 0) rowFn(i, x + l, x + w - rt, y + i);
    }
  }
  function outlined(ctx, x, y, w, h, r, lineCol, rowFn) {
    ctx.fillStyle = lineCol;
    shape(ctx, x, y, w, h, r, (i, x0, x1, yy) => ctx.fillRect(x0, yy, x1 - x0, 1));
    const ri = r.map((v) => Math.max(0, v - 1));
    shape(ctx, x + 1, y + 1, w - 2, h - 2, ri, rowFn);
  }

  function drawLeg(ctx, hx, hy, fx, fy) {
    const n = Math.max(1, fy - hy);
    ctx.fillStyle = C.ink;
    for (let r = 0; r < n; r++) ctx.fillRect(R(hx + ((fx - hx) * r) / n) - 1, hy + r, 4, 1);
    ctx.fillStyle = C.leg;
    for (let r = 0; r < n; r++) ctx.fillRect(R(hx + ((fx - hx) * r) / n), hy + r, 2, 1);
    // shoe, toe pointing right
    ctx.fillStyle = C.ink; ctx.fillRect(fx - 2, fy - 3, 7, 3);
    ctx.fillStyle = C.shoe; ctx.fillRect(fx - 1, fy - 2, 5, 1);
  }

  function drawNigiri(ctx, g) {
    const p = g.p, t = g.t, ducking = p.duck && p.onGround;
    if (S.lastT !== t) { const dt = S.lastT < 0 ? 0 : clamp(t - S.lastT, 0, 0.05); S.lastT = t; S.landT = Math.max(0, S.landT - dt); S.jumpT = Math.max(0, S.jumpT - dt); S.hitT = Math.max(0, S.hitT - dt); }
    const bottom = R(p.y), cx = R(p.x + 20);
    const frame = Math.floor(p.run * 1.6) % 4;
    let sx = 1, sy = 1, legH = 8, bob = 0, legs;
    const air = !p.onGround, rising = air && p.vy < -260, falling = air && p.vy > 260;
    if (ducking) {
      sx = 1.08; sy = 0.8; legH = 2;
      legs = [[-8, 0], [7, 0]];
      bob = frame % 2;
    } else if (air) {
      if (rising) { sx = 0.9; sy = 1.06; legH = 8; legs = [[-2, 0], [2, 0]]; }
      else if (falling) { sx = 0.96; sy = 1.0; legH = 8; legs = [[-5, 0], [5, 0]]; }
      else { sx = 1.06; sy = 0.93; legH = 2; legs = [[-3, 0], [3, 0]]; }
    } else {
      const L = [[-4, 0], [0, -2], [4, 0], [0, -2]][frame], M = [[4, 0], [0, -2], [-4, 0], [0, -2]][frame];
      legs = [L, M];
      bob = frame % 2 ? -1 : 0;
      if (S.landT > 0) {
        const k = Math.sin((S.landT / 0.16) * Math.PI) * S.landAmt;
        sx = 1 + 0.1 * k; sy = 1 - 0.28 * k; legH = R(8 - 4 * k); bob = 0;
      }
    }
    const riceW = R(30 * sx), fishW = Math.min(44, R(38 * sx));
    const riceH = R(11 * sy), fishH = R(12 * sy);
    const legTop = bottom - legH + bob;
    const riceY = legTop - riceH + 1, fishY = riceY - fishH + 4;
    const riceX = cx - (riceW >> 1), fishX = cx - (fishW >> 1) + 1;

    // legs (behind body)
    if (legH > 0) {
      const hipY = legTop - 1;
      drawLeg(ctx, cx - 7, hipY, cx - 7 + legs[0][0], bottom + legs[0][1] - (air && !falling ? 1 : 0));
      drawLeg(ctx, cx + 5, hipY, cx + 5 + legs[1][0], bottom + legs[1][1] - (air && !falling ? 1 : 0));
    }

    // rice block
    outlined(ctx, riceX, riceY, riceW, riceH, [4, 4, 4, 4], C.riceLine, (i, x0, x1, y) => {
      const n = riceH - 2;
      ctx.fillStyle = i >= n - 2 ? C.riceSh : i === 0 ? C.riceHi : C.rice;
      ctx.fillRect(x0, y, x1 - x0, 1);
      if (i > 0 && i < n - 2) { ctx.fillStyle = C.grain; for (let gx = x0 + ((i * 5) % 7) + 1; gx < x1 - 1; gx += 7) ctx.fillRect(gx, y, 2, 1); }
    });

    // face on the rice (right side, facing forward)
    const faceY = fishY + fishH, ex = cx + 3;
    const blink = (t % 3.3) < 0.12 || (t % 3.3 > 0.3 && t % 3.3 < 0.42 && Math.floor(t / 3.3) % 3 === 0);
    ctx.fillStyle = C.ink;
    if (S.hitT > 0 || g.over) {
      for (const e of [ex, ex + 7]) { ctx.fillRect(e, faceY, 1, 1); ctx.fillRect(e + 2, faceY, 1, 1); ctx.fillRect(e + 1, faceY + 1, 1, 1); ctx.fillRect(e, faceY + 2, 1, 1); ctx.fillRect(e + 2, faceY + 2, 1, 1); }
    } else if (blink || ducking) {
      ctx.fillRect(ex, faceY + 1, 3, 1); ctx.fillRect(ex + 7, faceY + 1, 3, 1);
      if (ducking) { ctx.fillRect(ex + 2, faceY, 1, 1); ctx.fillRect(ex + 7, faceY, 1, 1); }
    } else {
      const eh = falling || rising ? 4 : 3;
      ctx.fillRect(ex, faceY, 2, eh); ctx.fillRect(ex + 7, faceY, 2, eh);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex, faceY, 1, 1); ctx.fillRect(ex + 7, faceY, 1, 1);
    }
    if (air && !ducking) { ctx.fillStyle = C.line; ctx.fillRect(ex + 4, faceY + 3, 2, rising ? 2 : 1); }
    ctx.fillStyle = C.blush;
    if (riceH > 7 && !ducking) { ctx.fillRect(ex - 3, faceY + 3, 2, 1); ctx.fillRect(ex + 10, faceY + 3, 2, 1); }

    // hachimaki tails (behind the fish, trailing left)
    const bandH = ducking ? 2 : 3, bandY = fishY + (ducking ? 3 : 4), knotX = fishX + 3;
    const flow = clamp((g.spd() - 250) / 350, 0, 1);
    for (let k = 1; k >= 0; k--) {
      const len = 8 + k * 3;
      let py = bandY + 1;
      for (let i = 1; i <= len; i++) {
        const lift = ducking ? i * 0.05 : falling ? -i * (0.35 + k * 0.15) : rising ? i * (0.25 + k * 0.15) : i * (0.12 + k * 0.18 - flow * 0.1);
        const wave = Math.sin(t * (12 + flow * 10) - i * 0.55 + k * 1.9) * (i / len) * 1.6;
        const yy = R(bandY + 1 + lift + wave);
        const top = Math.min(yy, py), bot = Math.max(yy, py) + 2;
        ctx.fillStyle = C.ink; ctx.fillRect(knotX - i, top - 1, 1, bot - top + 2);
        ctx.fillStyle = k ? C.bandSh : C.band; ctx.fillRect(knotX - i, top, 1, bot - top);
        py = yy;
      }
    }

    // salmon slice draped over the rice: bigger drape at the front and back ends
    const drape = R(5 * sy);
    outlined(ctx, fishX, fishY, fishW, fishH, [5, 6, drape + 2, drape + 1], C.line, (i, x0, x1, y) => {
      const n = fishH - 2;
      ctx.fillStyle = i === 0 ? C.fishHi : i >= n - 2 ? C.fishSh : C.fish;
      ctx.fillRect(x0, y, x1 - x0, 1);
      // fat stripes, slanted back-to-front
      ctx.fillStyle = i >= n - 2 ? '#ffb89a' : C.fat;
      for (let s = 0; s < 5; s++) {
        const sxp = fishX + 6 + s * 8 * sx - i * 0.6;
        const a = Math.max(x0 + 1, R(sxp)), b = Math.min(x1 - 1, R(sxp) + 2);
        if (b > a) ctx.fillRect(a, y, b - a, 1);
      }
    });
    // hachimaki band across the slice + knot
    const bx0 = fishX + 1, bx1 = fishX + fishW - 1;
    shape(ctx, fishX, fishY, fishW, fishH, [5, 6, drape + 2, drape + 1], (i, x0, x1, y) => {
      if (y >= bandY && y < bandY + bandH) {
        ctx.fillStyle = y === bandY + bandH - 1 ? C.bandSh : C.band;
        ctx.fillRect(Math.max(x0, bx0), y, Math.min(x1, bx1) - Math.max(x0, bx0), 1);
      }
    });
    ctx.fillStyle = C.ink; ctx.fillRect(knotX - 1, bandY - 1, 4, bandH + 2);
    ctx.fillStyle = C.band; ctx.fillRect(knotX, bandY, 2, bandH);
    ctx.fillStyle = C.bandSh; ctx.fillRect(knotX, bandY + bandH - 1, 2, 1);
  }
  ART.nigiri = drawNigiri;

  /* ---------------- juice ---------------- */
  const parts = []; // {x,y,vx,vy,g,life,max,s,c,k}  k: 0 square, 1 streak, 2 grain
  const MAXP = 260;
  function add(o) { if (parts.length < MAXP) parts.push(o); }
  let shake = 0, shakeT = 0, flash = 0, runDust = 0, sx = 0, sy = 0, lastRunT = -1;
  const lines = []; // speed lines, pooled
  for (let i = 0; i < 14; i++) lines.push({ on: false, x: 0, y: 0, w: 0, a: 0 });

  function puff(x, y, n, spread, up, vxBase) {
    for (let i = 0; i < n; i++) {
      const life = rand(0.25, 0.5);
      add({ x: x + rand(-3, 3), y: y - rand(0, 2), vx: vxBase + rand(-spread, spread), vy: -rand(up * 0.3, up), g: 60, life, max: life, s: pick([2, 2, 3, 4]), c: C.dust, k: 0 });
    }
  }
  function burst(g, n) {
    const p = g.p, x = p.x + 20, y = p.y - 14;
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05), v = rand(90, 260), life = rand(0.5, 0.9);
      add({ x: x + rand(-8, 8), y: y + rand(-5, 5), vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 620, life, max: life, s: 1, c: i % 5 === 0 ? C.fish : C.rice, k: 2, r: Math.random() < 0.5 });
    }
  }

  EVT.on('start', () => { parts.length = 0; shake = 0; flash = 0; S.hitT = 0; S.landT = 0; S.lastT = -1; for (const l of lines) l.on = false; });
  EVT.on('jump', (e) => {
    if (!inRush()) return;
    const p = e.g.p; S.jumpT = 0.2;
    puff(p.x + 20, p.y, 5, 50, 30, -40);
    // whoosh: short vertical streaks falling away under the hero
    for (let i = 0; i < 3; i++) add({ x: p.x + 11 + i * 9, y: p.y - 2, vx: -e.g.spd() * 0.15, vy: 70, g: 0, life: 0.18, max: 0.18, s: 6, c: C.paper, k: 3 });
  });
  EVT.on('land', (e) => {
    if (!inRush()) return;
    const p = e.g.p, amt = clamp(e.vy / 1000, 0.25, 1);
    S.landT = 0.16; S.landAmt = amt;
    const n = R(4 + amt * 6);
    puff(p.x + 8, p.y, n >> 1, 20, 35, -70 - amt * 40);
    puff(p.x + 32, p.y, n >> 1, 20, 35, 30 + amt * 30);
    if (amt > 0.8) shake = Math.max(shake, 1.2);
  });
  EVT.on('hit', (e) => {
    if (!inRush()) return;
    S.hitT = 0.5; flash = 1; shake = Math.max(shake, 5);
    burst(e.g, 18);
  });
  EVT.on('die', (e) => {
    if (!inRush()) return;
    S.hitT = 1; flash = Math.max(flash, 0.8); shake = Math.max(shake, 7);
    burst(e.g, 12);
  });
  EVT.on('item', (e) => {
    if (!inRush()) return;
    const it = e.it, x = it.x + (it.w || 20) / 2, y = it.y + (it.h || 20) / 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU, life = 0.35;
      add({ x, y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, g: 0, life, max: life, s: 2, c: i % 2 ? '#f2cc60' : C.paper, k: 0 });
    }
  });

  // camera shake (only inside the engine frame)
  ART.preDraw.push((shell, ctx, dt) => {
    const live = shell.state === 'play' || shell.state === 'over';
    if (live) { shake = Math.max(0, shake - dt * 18 * Math.max(1, shake * 0.35)); shakeT += dt; }
    if (shake > 0.2 && inRush()) {
      sx = R(Math.sin(shakeT * 91) * shake); sy = R(Math.cos(shakeT * 73) * shake * 0.6);
      ctx.translate(sx, sy);
    } else { sx = 0; sy = 0; }
  });

  // particles, speed lines, flash
  ART.layers.push((shell, ctx, dt) => {
    const eng = shell.engine;
    if (!inRush()) { parts.length = 0; return; }
    const g = eng.cur, p = g.p, W = shell.W;
    const playing = shell.state === 'play', live = playing || shell.state === 'over';
    const step = live ? dt : 0;
    const v = g.spd();

    if (playing && !g.over && g.t !== lastRunT) {
      lastRunT = g.t;
      // running dust from the back foot
      if (p.onGround) {
        const ducking = p.duck;
        runDust -= dt * (ducking ? 26 : 9 + v / 70);
        if (runDust <= 0) {
          runDust = 1;
          const life = rand(0.22, 0.4);
          add({ x: p.x + (ducking ? 4 : 12), y: p.y - 1, vx: -v * rand(0.15, 0.35), vy: -rand(8, 30), g: 20, life, max: life, s: pick([1, 2, 2, 3]), c: C.dust, k: 0 });
        }
      }
      // speed lines, intensity grows with speed
      const inten = clamp((v - 360) / 260, 0, 1);
      if (inten > 0 && Math.random() < inten * dt * 14) {
        const l = lines.find((q) => !q.on);
        if (l) { l.on = true; l.x = W + rand(0, 40); l.y = R(rand(26, g.ground - 8)); l.w = R(rand(18, 46) * (0.6 + inten)); l.a = rand(0.08, 0.18) + inten * 0.12; }
      }
    }

    // update + draw speed lines (behind-ish, subtle)
    for (const l of lines) {
      if (!l.on) continue;
      l.x -= v * 2.4 * step;
      if (l.x + l.w < -10) { l.on = false; continue; }
      if (Math.abs(l.y - (p.y - 15)) < 18 && l.x < p.x + 44 && l.x + l.w > p.x - 4) continue; // never streak across the hero
      ctx.globalAlpha = l.a; ctx.fillStyle = C.paper; ctx.fillRect(R(l.x), l.y, l.w, 1);
    }
    ctx.globalAlpha = 1;

    // particles (share the camera shake)
    ctx.save(); ctx.translate(sx, sy);
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i];
      q.life -= step;
      if (q.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      q.vy += q.g * step; q.x += q.vx * step; q.y += q.vy * step;
      if (q.k === 2 && q.y > g.ground - 1 && q.vy > 0) { q.y = g.ground - 1; q.vy *= -0.3; q.vx *= 0.6; }
      const f = q.life / q.max;
      if (q.k === 0) {
        ctx.globalAlpha = 0.75 * f; ctx.fillStyle = q.c;
        const s = Math.max(1, R(q.s * (0.6 + 0.6 * (1 - f))));
        ctx.fillRect(R(q.x - s / 2), R(q.y - s / 2), s, s);
      } else if (q.k === 2) {
        ctx.globalAlpha = Math.min(1, f * 2); ctx.fillStyle = C.riceLine;
        const w = q.r ? 3 : 2, h = q.r ? 2 : 3;
        ctx.fillRect(R(q.x) - 1, R(q.y) - 1, w + 1, h + 1);
        ctx.fillStyle = q.c; ctx.fillRect(R(q.x), R(q.y), w - 1, h - 1);
      } else if (q.k === 3) {
        ctx.globalAlpha = 0.55 * f; ctx.fillStyle = q.c;
        ctx.fillRect(R(q.x), R(q.y), 1, R(q.s * f) + 1);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // hit flash: brief warm-white frame, then a lacquer-red edge vignette
    if (flash > 0) {
      const H = shell.H;
      if (flash > 0.8) { ctx.globalAlpha = (flash - 0.8) * 2; ctx.fillStyle = '#fff4e0'; ctx.fillRect(0, 0, W, H); }
      ctx.globalAlpha = Math.min(1, flash) * 0.5; ctx.fillStyle = '#c8321e';
      ctx.fillRect(0, 0, W, 4); ctx.fillRect(0, H - 4, W, 4); ctx.fillRect(0, 4, 4, H - 8); ctx.fillRect(W - 4, 4, 4, H - 8);
      ctx.globalAlpha = 1;
      if (live) flash = Math.max(0, flash - dt * 3.2);
    }
  });
})();
