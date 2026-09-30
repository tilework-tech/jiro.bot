'use strict';
/*
 * Daily Roll maze board art: floor, walls, rice, salmon roe, soy puddles, tunnel mouths.
 * Hooks: ART.mazeFloor (full-canvas ink background + cached static board) and ART.mazeTiles (dynamic items).
 * Static art (floor texture, neighbor-aware walls, shadows, vignette) is rendered per pixel once per map
 * into an offscreen canvas at logical resolution and blitted with smoothing off, so it stays crisp pixel art.
 */
(() => {
  const INK = '#120d0a';
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hash = (x, y, s = 0) => {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

  /* ---------------- per-theme pixel shaders ---------------- */
  // Each theme: floor(x, y, i) -> rgb, wall(x, y, info) -> rgb, plus post(ctx, geo) for small decals.
  const P = (o) => { const r = {}; for (const k in o) r[k] = hex(o[k]); return r; };

  const COUNTER = P({
    fl0: '#2c1f16', fl1: '#31231a', fl2: '#271b13', seam: '#150e0a', grain: '#221710', knot: '#1a110c',
    out: '#1c120c', face0: '#5a3e26', face1: '#7a5634', faceLip: '#9c7248',
    hiT: '#fbe8c2', hiL: '#efd6a6', shR: '#b08858', top: '#dcbe8c', grain2: '#caa876', grain3: '#e6cc9e',
  });
  const FRIDGE = P({
    fl0: '#1a242c', fl1: '#1d2830', fl2: '#172027', seam: '#0c1217', bumpH: '#2b3a46', bumpS: '#10171d', rivet: '#4a5d6b',
    out: '#08121b', face0: '#1a3246', face1: '#244560', faceLip: '#3b6788',
    hiT: '#e8f8ff', hiL: '#b2e0f6', shR: '#3a6a90', top: '#4c80a8', frost: '#93c8e8', frost2: '#d6f0ff', groove: '#42739a',
  });
  const MARKET = P({
    fl0: '#1d2422', fl1: '#212926', fl2: '#1a201e', seam: '#0c100f', hiF: '#2b3632', wet: '#36453f', wet2: '#2c3a44',
    out: '#08110b', face0: '#4a3420', face1: '#7c5a38', slat: '#5c4128', faceLip: '#96704a',
    hiT: '#7fe39a', hiL: '#52b06c', shR: '#1c4028', top: '#2d6a40', top2: '#255836', tarpEdge: '#1f4a2d',
  });

  const THEMES = {
    'Sushi Counter': {
      pal: COUNTER, face: 4, light: [0.5, 0.0, [255, 190, 120], 0.10], vig: 0.30,
      floor(x, y, p) {
        const PH = 6, r = Math.floor(y / PH), v = y % PH;
        if (v === 0) return p.seam;
        const PL = 74, off = (r * 29) % PL, seg = Math.floor((x + off) / PL);
        if ((x + off) % PL === 0) return p.seam;
        const t = hash(seg, r, 3);
        let c = t < 0.33 ? p.fl0 : t < 0.66 ? p.fl1 : p.fl2;
        if (v === 1) return c === p.fl2 ? p.fl0 : p.fl1; // plank top lip
        const g = hash(Math.floor((x + r * 7) / 4), y, 9);
        if (g < 0.16) c = p.grain;
        if (hash(seg, r, 5) < 0.18 && Math.abs(((x + off) % PL) - 37) <= 1 && v >= 2 && v <= 4) c = p.knot;
        return c;
      },
      wall(x, y, w, p) {
        const g = Math.floor(y + Math.sin(x * 0.11 + w.ty * 1.7) * 1.6 + Math.sin(x * 0.037) * 1.2);
        if (w.dD <= this.face + 1) {
          if (w.dD === 1 || w.min === 1) return p.out;
          if (w.dD === 2) return p.face0;
          if (w.dD === this.face + 1) return p.faceLip;
          return (x + Math.floor(w.tx * 3)) % 7 === 0 ? p.face0 : p.face1;
        }
        if (w.min === 1) return p.out;
        if (w.dU === 2) return p.hiT;
        if (w.dL === 2) return p.hiL;
        if (w.dR === 2) return p.shR;
        const m = ((g % 5) + 5) % 5;
        if (m === 0) return p.grain2;
        if (m === 2 && hash(x >> 2, y, 1) < 0.5) return p.grain3;
        return p.top;
      },
      post() {},
    },
    'Walk-in Fridge': {
      pal: FRIDGE, face: 4, light: [0.5, 0.0, [170, 220, 255], 0.09], vig: 0.32,
      floor(x, y, p) {
        const PS = 42, px = x % PS, py = y % PS;
        if (px === 0 || py === 0) return p.seam;
        if ((px === 3 || px === PS - 3) && (py === 3 || py === PS - 3)) return p.rivet;
        const t = hash(Math.floor(x / PS), Math.floor(y / PS), 4);
        const base = t < 0.33 ? p.fl0 : t < 0.66 ? p.fl1 : p.fl2;
        const row = Math.floor(y / 5), sx = (x + (row % 2) * 3) % 6, sy = y % 5;
        if (sx === 1 && sy === 1) return p.bumpH;
        if (sx === 2 && sy === 2) return p.bumpS;
        return base;
      },
      wall(x, y, w, p) {
        if (w.dD <= this.face + 1) {
          if (w.dD === 1 || w.min === 1) return p.out;
          if (w.dD === 2) return p.face0;
          if (w.dD === this.face + 1) return p.faceLip;
          return p.face1;
        }
        if (w.min === 1) return p.out;
        if (w.dU === 2) return p.hiT;
        if (w.dL === 2) return p.hiL;
        if (w.dR === 2) return p.shR;
        const d = Math.min(w.dU, w.dL, w.dR, w.dD - this.face);
        const h = hash(x, y, 7);
        if (h < 0.5 - d * 0.1) return d <= 3 && h < 0.2 ? p.frost2 : p.frost;
        if (h > 0.985) return p.frost2;
        if (w.v === 0 && w.dU > 4) return p.groove;
        return p.top;
      },
      post(ctx, geo) {
        // icicles hanging off the front faces
        const { ts, cols, rows, isWall, ox, oy } = geo;
        for (let ty = 0; ty < rows - 1; ty++) for (let tx = 0; tx < cols; tx++) {
          if (!isWall(tx, ty) || isWall(tx, ty + 1)) continue;
          const n = hash(tx, ty, 11) < 0.55 ? 1 + Math.floor(hash(tx, ty, 12) * 2) : 0;
          for (let k = 0; k < n; k++) {
            const x = ox + tx * ts + 4 + Math.floor(hash(tx, ty, 20 + k) * (ts - 8)), y = oy + (ty + 1) * ts;
            const L = 2 + Math.floor(hash(tx, ty, 30 + k) * 3);
            ctx.fillStyle = '#bfe6ff'; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x, y, 1, L);
            ctx.fillStyle = '#7fb6db'; ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x, y + L - 1, 1, 1);
          }
        }
      },
    },
    'Fish Market': {
      pal: MARKET, face: 5, light: [0.5, 0.0, [255, 214, 150], 0.08], vig: 0.34,
      floor(x, y, p) {
        const S = 10, r = Math.floor(y / S), off = (r % 2) * 5, u = (x + off) % S, v = y % S;
        if (u === 0 || v === 0) return p.seam;
        const t = hash(Math.floor((x + off) / S), r, 6);
        let c = t < 0.33 ? p.fl0 : t < 0.66 ? p.fl1 : p.fl2;
        if (u === 1 || v === 1) c = p.hiF;
        const s = (x + y * 2 + Math.floor(hash(r, 0, 8) * 40)) % 53;
        if (s === 0 && hash(x, y, 2) < 0.8) c = p.wet;
        if (hash(Math.floor(x / 3), Math.floor(y / 2), 13) < 0.02) c = p.wet2;
        return c;
      },
      wall(x, y, w, p) {
        const F = this.face;
        if (w.dD <= F + 1) {
          if (w.dD === 1 || w.min === 1) return p.out;
          // scalloped tarp overhang
          const sc = (x % 6);
          if (w.dD === F + 1 || (w.dD === F && sc >= 1 && sc <= 3)) return p.tarpEdge;
          if (w.dD === 2) return p.face0;
          return x % 4 === 0 ? p.slat : p.face1;
        }
        if (w.min === 1) return p.out;
        if (w.dU === 2) return p.hiT;
        if (w.dL === 2) return p.hiL;
        if (w.dR === 2) return p.shR;
        return Math.floor(x / 3) % 2 ? p.top : p.top2;
      },
      post(ctx, geo) {
        // ice-filled fish crates set into some stalls
        const { ts, cols, rows, dist, ox, oy } = geo;
        for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
          const bw = 13, bh = 7, bx = ox + tx * ts + ((ts - bw) >> 1), by = oy + ty * ts + ((ts - bh) >> 1) - 3;
          if (hash(tx, ty, 17) > 0.22) continue;
          if (Math.min(dist(bx - 1, by - 1), dist(bx + bw, by - 1), dist(bx - 1, by + bh), dist(bx + bw, by + bh)) < 2) continue;
          ctx.fillStyle = '#08110b'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
          ctx.fillStyle = '#7c5a38'; ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#96704a'; ctx.fillRect(bx, by, bw, 1);
          ctx.fillStyle = '#cfe9f2'; ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
          for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#9fc6d6' : '#ffffff'; ctx.fillRect(bx + 1 + Math.floor(hash(tx, ty, 40 + i) * (bw - 2)), by + 1 + Math.floor(hash(tx, ty, 60 + i) * (bh - 2)), 1, 1); }
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(bx, by + bh + 1, bw + 1, 1);
          drawFish(ctx, bx + 1, by + 1, hash(tx, ty, 18) < 0.5, hash(tx, ty, 19) < 0.5 ? 0 : 1);
        }
      },
    },
  };

  // 11x5 fish, facing left. k outline, s back, b belly, e eye, f fin, r gill
  const FISH = [
    '..kkkkk..k.',
    '.kssssskksk',
    'kesrsssssfk',
    '.kbbbbbkkfk',
    '..kkkkk..k.',
  ];
  const FISH_COL = [
    { k: '#1d2a33', s: '#6d8796', b: '#dce8ee', e: '#120d0a', f: '#4d6472', r: '#e2482f' },
    { k: '#3a160c', s: '#ff7b4f', b: '#ffd0b0', e: '#120d0a', f: '#c8321e', r: '#c8321e' },
  ];
  function drawFish(ctx, x, y, flip, kind) {
    const C = FISH_COL[kind];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 11; i++) {
      const ch = FISH[j][i]; if (ch === '.') continue;
      ctx.fillStyle = C[ch]; ctx.fillRect(x + (flip ? 10 - i : i), y + j, 1, 1);
    }
  }

  // Unknown maps fall back to a shader built from the map's own theme colors.
  function fallbackTheme(T) {
    const pal = P({ fl0: T.floor, out: '#0a0a0a', face0: T.wall, face1: T.wall, faceLip: T.edge, hiT: T.edge, hiL: T.edge, shR: T.wall, top: T.wall });
    return { pal, face: 3, light: [0.5, 0, [255, 200, 140], 0.06], vig: 0.3, floor: (x, y, p) => p.fl0, wall: THEMES['Sushi Counter'].wall, post() {} };
  }

  /* ---------------- static board cache ---------------- */
  const cache = new Map();
  function buildBoard(m) {
    const ts = m.ts, cols = m.cols, rows = m.rows, BW = cols * ts, BH = rows * ts;
    const th = THEMES[m.map.name] || fallbackTheme(m.theme), p = th.pal;
    const walls = m.map.rows.map((r) => r.split('').map((c) => c === '#'));
    const isWall = (tx, ty) => tx >= 0 && ty >= 0 && tx < cols && ty < rows && walls[ty][tx];
    // pixel wall mask with rounded convex corners and small concave fillets
    const M = new Uint8Array(BW * BH);
    const R = Math.max(3, Math.round(ts * 0.26)), r2 = 3;
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const X = tx * ts, Y = ty * ts, W = isWall(tx, ty);
      for (let v = 0; v < ts; v++) for (let u = 0; u < ts; u++) {
        let on = W;
        const sx = u < ts / 2 ? -1 : 1, sy = v < ts / 2 ? -1 : 1;
        const cu = sx < 0 ? u : ts - 1 - u, cv = sy < 0 ? v : ts - 1 - v; // distance into the corner
        if (W) {
          if (cu < R && cv < R && !isWall(tx + sx, ty) && !isWall(tx, ty + sy)) {
            const a = R - cu - 0.5, b = R - cv - 0.5; if (a * a + b * b > R * R) on = false;
          }
        } else if (cu < r2 && cv < r2 && isWall(tx + sx, ty) && isWall(tx, ty + sy) && isWall(tx + sx, ty + sy)) {
          const a = r2 - cu - 0.5, b = r2 - cv - 0.5; if (a * a + b * b > r2 * r2) on = true;
        }
        if (on) M[(Y + v) * BW + X + u] = 1;
      }
    }
    // directional distances to the nearest open pixel (1 = touching)
    const dU = new Uint8Array(BW * BH), dD = new Uint8Array(BW * BH), dL = new Uint8Array(BW * BH), dR = new Uint8Array(BW * BH);
    for (let x = 0; x < BW; x++) {
      let c = 0; for (let y = 0; y < BH; y++) { const i = y * BW + x; c = M[i] ? Math.min(255, c + 1) : 0; dU[i] = c; }
      c = 0; for (let y = BH - 1; y >= 0; y--) { const i = y * BW + x; c = M[i] ? Math.min(255, c + 1) : 0; dD[i] = c; }
    }
    for (let y = 0; y < BH; y++) {
      let c = 0; for (let x = 0; x < BW; x++) { const i = y * BW + x; c = M[i] ? Math.min(255, c + 1) : 0; dL[i] = c; }
      c = 0; for (let x = BW - 1; x >= 0; x--) { const i = y * BW + x; c = M[i] ? Math.min(255, c + 1) : 0; dR[i] = c; }
    }
    const mw = (x, y) => x >= 0 && y >= 0 && x < BW && y < BH && M[y * BW + x] === 1;
    const tunnels = [];
    for (let ty = 0; ty < rows; ty++) if (!walls[ty][0] && !walls[ty][cols - 1]) tunnels.push(ty);

    const cv = document.createElement('canvas'); cv.width = m.W; cv.height = m.H;
    const c = cv.getContext('2d');
    const img = c.createImageData(BW, BH), D = img.data;
    const [lx, ly, lc, la] = th.light;
    const w = { dU: 0, dD: 0, dL: 0, dR: 0, min: 0, tx: 0, ty: 0, u: 0, v: 0 };
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const i = y * BW + x, gx = m.ox + x, gy = m.oy + y; // shade in canvas coords so patterns align
      let col, k = 1;
      if (M[i]) {
        w.dU = dU[i]; w.dD = dD[i]; w.dL = dL[i]; w.dR = dR[i];
        w.min = Math.min(w.dU, w.dD, w.dL, w.dR);
        w.tx = Math.floor(x / ts); w.ty = Math.floor(y / ts); w.u = x % ts; w.v = y % ts;
        col = th.wall(gx, gy, w, p);
      } else {
        col = th.floor(gx, gy, p);
        // walls cast a short shadow down and to the right
        if (mw(x, y - 1) || mw(x, y - 2) || mw(x - 1, y - 1) || mw(x - 1, y)) k = 0.55;
        else if (mw(x, y - 3) || mw(x - 2, y - 2) || mw(x - 2, y) || mw(x - 1, y - 3)) k = 0.75;
        // tunnel mouths fade into the dark
        const ty = Math.floor(y / ts);
        if (tunnels.includes(ty)) {
          const e = Math.min(x, BW - 1 - x) / ts;
          if (e < 1) { const f = e + BAYER[(y & 3) * 4 + (x & 3)] * 0.35 - 0.15; k *= f < 0.15 ? 0.2 : f < 0.45 ? 0.45 : f < 0.75 ? 0.7 : 1; }
        }
      }
      // stepped, dithered vignette + a soft lantern glow from above
      const nx = (x + 0.5) / BW - 0.5, ny = (y + 0.5) / BH - 0.5;
      const dv = Math.sqrt(nx * nx * 1.1 + ny * ny * 1.5);
      const dth = BAYER[(y & 3) * 4 + (x & 3)];
      const vq = Math.floor(Math.max(0, dv - 0.28) * 7 + dth) / 7;
      k *= 1 - th.vig * Math.min(1, vq * 1.6);
      const ldx = (x / BW - lx) * 1.2, ldy = (y / BH - ly);
      const gl = Math.max(0, 1 - Math.sqrt(ldx * ldx + ldy * ldy) / 0.75);
      const gq = Math.floor(gl * 4 + dth) / 4 * la;
      D[i * 4] = Math.min(255, col[0] * k + (lc[0] - col[0] * k) * gq);
      D[i * 4 + 1] = Math.min(255, col[1] * k + (lc[1] - col[1] * k) * gq);
      D[i * 4 + 2] = Math.min(255, col[2] * k + (lc[2] - col[2] * k) * gq);
      D[i * 4 + 3] = 255;
    }
    c.putImageData(img, m.ox, m.oy);
    const dist = (gx, gy) => { const x = gx - m.ox, y = gy - m.oy; if (!mw(x, y)) return 0; const i = y * BW + x; return Math.min(dU[i], dD[i] - th.face, dL[i], dR[i]); };
    th.post(c, { ts, cols, rows, isWall, dist, ox: m.ox, oy: m.oy });
    // thin frame around the board, open at tunnel mouths
    c.fillStyle = '#2a1e16';
    c.fillRect(m.ox - 3, m.oy - 3, BW + 6, 1); c.fillRect(m.ox - 3, m.oy + BH + 2, BW + 6, 1);
    for (let ty = 0; ty < rows; ty++) {
      if (tunnels.includes(ty)) continue;
      const Y = m.oy + ty * ts - (ty === 0 ? 3 : 0), H = ts + (ty === 0 ? 3 : 0) + (ty === rows - 1 ? 3 : 0);
      c.fillRect(m.ox - 3, Y, 1, H); c.fillRect(m.ox + BW + 2, Y, 1, H);
    }
    return { cv, tunnels };
  }
  function board(m) {
    const key = m.map.name + '|' + m.ts + '|' + m.ox + '|' + m.oy + '|' + m.W + 'x' + m.H;
    let b = cache.get(key);
    if (!b) { b = buildBoard(m); cache.set(key, b); }
    return b;
  }

  /* ---------------- small sprites ---------------- */
  function sprite(w, h, rows, pal) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x, y, 1, 1); } }));
    return cv;
  }
  const RICE_PAL = { w: '#f4ead7', h: '#ffffff', s: '#b9a88d', d: 'rgba(10,6,4,0.55)' };
  const RICE = [
    sprite(6, 5, ['.hww..', 'wwwws.', '.wsss.', '..dddd', '......'], RICE_PAL),
    sprite(5, 6, ['.hw..', 'hwws.', 'wwws.', 'wwss.', '.ss..', '..dd.'], RICE_PAL),
    sprite(6, 6, ['...hw.', '..hws.', '.wws..', 'wws.d.', 'ss.d..', '.dd...'], RICE_PAL),
    sprite(6, 6, ['.hw...', '.wwh..', '..wws.', '..swws', '...ss.', '....dd'], RICE_PAL),
  ];
  function roeSprite(R) {
    const S = R * 2 + 3, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const c = cv.getContext('2d'), o = S / 2;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - o, dy = y + 0.5 - o, d = Math.sqrt(dx * dx + dy * dy);
      let col = null;
      if (d <= R - 0.6) {
        const lx = dx + R * 0.35, ly = dy + R * 0.35, l = Math.sqrt(lx * lx + ly * ly) / R;
        col = l < 0.28 ? '#ffd9bf' : l < 0.7 ? '#ff7b4f' : l < 1.05 ? '#e85a32' : '#b8341c';
        if (dy > R * 0.35 && d > R * 0.55) col = '#a82a16';
      } else if (d <= R + 0.4) col = '#4a1206';
      else if (d <= R + 1.2 && dy > 0) col = 'rgba(10,6,4,0.45)';
      if (col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
    }
    c.fillStyle = '#ffffff'; c.fillRect(Math.round(o - R * 0.45), Math.round(o - R * 0.5), 1, 1);
    return cv;
  }
  const ROE = [roeSprite(5), roeSprite(6)];
  const GLOW = (() => {
    const cv = document.createElement('canvas'); cv.width = 25; cv.height = 25;
    const c = cv.getContext('2d');
    for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
      const d = Math.hypot(x - 12, y - 12); if (d > 12) continue;
      const a = Math.floor((1 - d / 12) * 4 + BAYER[(y & 3) * 4 + (x & 3)]) / 4;
      if (a > 0) { c.fillStyle = `rgba(255,123,79,${(a * 0.35).toFixed(3)})`; c.fillRect(x, y, 1, 1); }
    }
    return cv;
  })();
  // soy puddles: irregular glossy blobs at a few spread sizes
  function puddleSprite(rx, seed) {
    const W = rx * 2 + 4, ry = Math.max(2, Math.round(rx * 0.62)), H = ry * 2 + 4;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'), cx = W / 2, cy = H / 2;
    const blobs = [[0, 0, 1]];
    for (let i = 0; i < 4; i++) blobs.push([(hash(i, seed, 1) - 0.5) * rx * 0.9, (hash(i, seed, 2) - 0.5) * ry * 0.8, 0.45 + hash(i, seed, 3) * 0.3]);
    const inside = (x, y) => blobs.some(([bx, by, s]) => { const a = (x - cx - bx) / (rx * s), b = (y - cy - by) / (ry * s); return a * a + b * b <= 1; });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const edge = !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5) || !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5);
      const top = !inside(x + 0.5, y - 0.5);
      const e2 = !inside(x + 0.5, y - 1.5) || !inside(x + 0.5, y + 2.5) || !inside(x - 1.5, y + 0.5) || !inside(x + 2.5, y + 0.5);
      c.fillStyle = edge ? (top ? '#0c0503' : '#7a3a1c') : e2 ? '#4a200e' : (y < cy ? '#1c0b05' : '#260f07');
      c.fillRect(x, y, 1, 1);
    }
    const hx = Math.round(cx - rx * 0.45), hy = Math.round(cy - ry * 0.35);
    c.fillStyle = '#b87850'; c.fillRect(hx, hy, Math.max(2, Math.round(rx * 0.5)), 1);
    c.fillStyle = '#fff1dc'; c.fillRect(hx, hy, 1, 1);
    if (rx > 5) { c.fillStyle = '#7a4428'; c.fillRect(Math.round(cx + rx * 0.15), Math.round(cy + ry * 0.3), 3, 1); }
    return cv;
  }
  const PUDDLE = [3, 5, 7, 9].map((r, i) => puddleSprite(r, i + 1));

  /* ---------------- hooks ---------------- */
  ART.mazeFloor = (m, ctx) => {
    ctx.fillStyle = INK; ctx.fillRect(0, 0, m.W, m.H);
    const b = board(m), sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(b.cv, 0, 0);
    ctx.imageSmoothingEnabled = sm;
  };

  ART.mazeTiles = (m, ctx) => {
    const ts = m.ts, ox = m.ox, oy = m.oy, t = m.t, b = board(m), sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    // soy puddles (under everything else)
    for (const pd of m.puddles) {
      if (pd._t0 == null) pd._t0 = Math.max(pd.t, 1);
      const age = pd._t0 - pd.t, grow = clamp(age / 0.35, 0, 1), dry = clamp(pd.t / 1.6, 0, 1);
      const lvl = Math.max(0, Math.min(3, Math.round(grow * 3) - (dry < 0.5 ? 1 : 0)));
      const s = PUDDLE[lvl];
      ctx.globalAlpha = 0.25 + 0.7 * dry;
      ctx.drawImage(s, Math.round(ox + (pd.x + 0.5) * ts - s.width / 2), Math.round(oy + (pd.y + 0.6) * ts - s.height / 2));
    }
    ctx.globalAlpha = 1;
    // tunnel mouth chevrons
    const pulse = Math.floor(t * 3) % 3;
    for (const ty of b.tunnels) {
      const Y = oy + ty * ts + (ts >> 1) - 2;
      for (let k = 0; k < 2; k++) {
        ctx.fillStyle = k === (pulse % 2) ? '#cbbca3' : '#5a4a3a';
        const lx = ox + 3 + k * 4, rx = ox + m.cols * ts - 4 - k * 4;
        ctx.fillRect(lx + 1, Y, 1, 1); ctx.fillRect(lx, Y + 1, 1, 2); ctx.fillRect(lx + 1, Y + 3, 1, 1);
        ctx.fillRect(rx - 1, Y, 1, 1); ctx.fillRect(rx, Y + 1, 1, 2); ctx.fillRect(rx - 1, Y + 3, 1, 1);
      }
    }
    for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
      const c = m.grid[y][x];
      if (c === ' ' || c === '#') continue;
      const X = ox + x * ts, Y = oy + y * ts, cx = X + (ts >> 1), cy = Y + (ts >> 1);
      if (c === '.') {
        const hv = hash(x, y, 77), s = RICE[Math.floor(hv * 4)];
        const jx = Math.floor(hash(x, y, 78) * 3) - 1, jy = Math.floor(hash(x, y, 79) * 3) - 1;
        ctx.drawImage(s, cx - (s.width >> 1) + jx, cy - (s.height >> 1) + jy);
      } else if (c === 'o') {
        const ph = Math.sin(t * 5 + x);
        ctx.globalAlpha = 0.55 + 0.45 * (ph * 0.5 + 0.5);
        ctx.drawImage(GLOW, cx - 12, cy - 12);
        ctx.globalAlpha = 1;
        const s = ROE[ph > 0 ? 1 : 0];
        ctx.drawImage(s, cx - (s.width >> 1), cy - (s.height >> 1));
      } else if (c === 'T') {
        ctx.fillStyle = '#fddc69'; rr(ctx, X + ts * 0.12, Y + ts * 0.25, ts * 0.76, ts * 0.5, 3); ctx.fill();
        ctx.fillStyle = '#17251b'; ctx.fillRect(X + ts * 0.42, Y + ts * 0.25, ts * 0.16, ts * 0.5);
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 5); ctx.strokeStyle = '#fddc69'; ctx.lineWidth = 2; ell(ctx, X + ts / 2, Y + ts / 2, ts * 0.6, ts * 0.6); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (c === 'F') {
        ctx.fillStyle = '#ff8c5a'; rr(ctx, X + ts * 0.1, Y + ts * 0.28, ts * 0.8, ts * 0.44, 5); ctx.fill();
        ctx.strokeStyle = '#ffd0b0'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let i = 0; i < 3; i++) { ctx.moveTo(X + ts * (0.25 + i * 0.2), Y + ts * 0.3); ctx.lineTo(X + ts * (0.18 + i * 0.2), Y + ts * 0.7); }
        ctx.stroke();
      }
    }
    ctx.imageSmoothingEnabled = sm;
  };
})();
