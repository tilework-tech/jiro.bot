'use strict';
/*
 * Sushi Rush boss stage art: the "Sushi Counter" maze as a pixel-art sushi bar,
 * the Giant Puffer boss, the player maki, and boss intro / win / rice effects.
 * Owns ART.mazeFloor, ART.mazeTiles, ART.ghost, ART.maki, plus one ART.layers and one ART.preDraw entry.
 * Everything is baked at 1 logical px per canvas unit and blitted with smoothing off, so it stays crisp.
 */
(function () {
  const PAL = {
    ink: '#120d0a', ink2: '#1b1410', ink3: '#261c16', paper: '#f4ead7', paperDim: '#cbbca3', muted: '#9c8a74',
    hinoki: '#e8cd9c', red: '#c8321e', red2: '#e2482f', salmon: '#ff7b4f', wasabi: '#a6c94a', indigo: '#2b4486', cyan: '#5ff3ff',
  };
  const hash = (x, y, s = 0) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const newCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rgbCache = {};
  const rgb = (hex) => rgbCache[hex] || (rgbCache[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);

  // Rasterise fn(x, y) -> '#rrggbb' | null into a canvas, with an optional 1px outline around filled pixels.
  function bake(w, h, fn, outline) {
    const c = newCanvas(w, h), x = c.getContext('2d'), id = x.createImageData(w, h), d = id.data;
    const filled = new Uint8Array(w * h);
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const col = fn(px, py); if (!col) continue;
      const [r, g, b] = rgb(col), i = (py * w + px) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; filled[py * w + px] = 1;
    }
    if (outline) {
      const [r, g, b] = rgb(outline);
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        if (filled[py * w + px]) continue;
        const f = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && filled[yy * w + xx] === 1;
        if (f(px - 1, py) || f(px + 1, py) || f(px, py - 1) || f(px, py + 1)) {
          const i = (py * w + px) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        }
      }
    }
    x.putImageData(id, 0, 0);
    return c;
  }
  const blit = (ctx, img, x, y) => { const s = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(img, x, y); ctx.imageSmoothingEnabled = s; };

  /* ---------------------------------------------------------------- */
  /* Static maze: wood floor + hinoki counters + lacquer frame          */
  /* ---------------------------------------------------------------- */
  const WALL = {
    counter: { top: '#c99d62', grain: '#b88a52', hl: '#ecd3a2', face: '#8a5f36', crease: '#5e3d21', shade: '#a67c48', line: '#1b1008' },
    frame: { top: '#2c1913', grain: '#26150f', hl: '#e2482f', face: '#1a0e0a', crease: '#0d0705', shade: '#22130e', line: '#0a0605', rim: '#c8321e' },
  };
  let staticKey = '', staticCv = null;

  function buildStatic(m) {
    const W = m.W, H = m.H, ts = m.ts, ox = m.ox, oy = m.oy, cols = m.cols, rows = m.rows;
    const cv = newCanvas(W, H), c = cv.getContext('2d');
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    R(0, 0, W, H, PAL.ink);
    const mw = cols * ts, mh = rows * ts;
    // Drop shadow + outer lacquer lip around the playfield.
    R(ox - 2, oy - 2, mw + 4, mh + 5, '#0a0605');
    R(ox - 1, oy + mh + 1, mw + 2, 1, '#3a1a10');
    // Floor planks.
    const plankH = 7, plankCols = ['#2b1d14', '#271a11', '#2e2017', '#291c13'];
    for (let py = 0, row = 0; py < mh; py += plankH, row++) {
      const h = Math.min(plankH, mh - py);
      R(ox, oy + py, mw, h, plankCols[row % plankCols.length]);
      R(ox, oy + py, mw, 1, '#150e09');
      let jx = Math.floor(hash(row, 3) * 60);
      while (jx < mw) { R(ox + jx, oy + py, 1, h, '#150e09'); R(ox + jx + 1, oy + py + 1, 1, h - 1, '#342419'); jx += 48 + Math.floor(hash(row, jx) * 60); }
      for (let i = 0; i < 10; i++) {
        const gx = Math.floor(hash(row, i, 1) * mw), gy = 2 + Math.floor(hash(row, i, 2) * (h - 3)), gl = 6 + Math.floor(hash(row, i, 3) * 18);
        R(ox + gx, oy + py + gy, Math.min(gl, mw - gx), 1, hash(row, i, 4) > 0.5 ? '#221710' : '#33241a');
      }
      if (hash(row, 9) > 0.6) { const kx = Math.floor(hash(row, 8) * (mw - 4)); R(ox + kx, oy + py + 2, 3, 2, '#1a110b'); R(ox + kx + 1, oy + py + 2, 1, 1, '#3b291c'); }
    }
    // Boss pen: a lacquer tray under the puffer's spawn.
    const src = m.map.rows, gs = [];
    src.forEach((r, y) => r.split('').forEach((ch, x) => { if (ch === 'G') gs.push([x, y]); }));
    if (gs.length) {
      const x0 = Math.min(...gs.map((g) => g[0])), x1 = Math.max(...gs.map((g) => g[0])), y0 = Math.min(...gs.map((g) => g[1])), y1 = Math.max(...gs.map((g) => g[1]));
      const X = ox + x0 * ts + 1, Y = oy + y0 * ts + 1, w = (x1 - x0 + 1) * ts - 2, h = (y1 - y0 + 1) * ts - 2;
      R(X, Y, w, h, '#0a0605'); R(X + 1, Y + 1, w - 2, h - 2, PAL.red); R(X + 2, Y + 2, w - 4, h - 4, '#2a120c');
      R(X + 2, Y + 2, w - 4, 1, '#3d1b12');
      for (let i = 0; i < 4; i++) { const cx = i % 2 ? X + w - 3 : X + 2, cy = i < 2 ? Y + 2 : Y + h - 3; R(cx, cy, 1, 1, PAL.hinoki); }
      // Seigaiha-ish wave dots.
      for (let yy = Y + 5; yy < Y + h - 4; yy += 4) for (let xx = X + 5 + ((yy >> 2) % 2) * 3; xx < X + w - 4; xx += 6) R(xx, yy, 2, 1, '#3d1b12');
    }
    // Walls. Components touching the border become the lacquer frame; the rest are hinoki counters.
    const isWall = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && m.grid[y][x] === '#';
    const wallOut = (x, y) => y < 0 || y >= rows || x < 0 || x >= cols || m.grid[y][x] === '#';
    const comp = new Int8Array(cols * rows);
    const stack = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if ((x === 0 || y === 0 || x === cols - 1 || y === rows - 1) && isWall(x, y) && !comp[y * cols + x]) {
        comp[y * cols + x] = 1; stack.push([x, y]);
        while (stack.length) {
          const [cx, cy] = stack.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (isWall(nx, ny) && !comp[ny * cols + nx]) { comp[ny * cols + nx] = 1; stack.push([nx, ny]); }
          }
        }
      }
    }
    const FACE = 4;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (!isWall(x, y)) continue;
      const P = comp[y * cols + x] ? WALL.frame : WALL.counter;
      const X = ox + x * ts, Y = oy + y * ts;
      const up = !wallOut(x, y - 1), dn = !wallOut(x, y + 1), lf = !wallOut(x - 1, y), rt = !wallOut(x + 1, y);
      R(X, Y, ts, ts, P.top);
      // Wood grain: long horizontal streaks shared by neighbouring tiles.
      for (let i = 0; i < ts; i++) {
        const seg = Math.floor(X / (ts * 2)), v = hash(seg, Y + i, 5);
        if (v > 0.78) { const a = Math.floor(hash(x, Y + i, 6) * 6); R(X + a, Y + i, ts - a - Math.floor(hash(x, Y + i, 7) * 5), 1, P.grain); }
      }
      if (P.rim) {
        // Lacquer: a red rim line inset along every edge that faces the floor.
        if (up) R(X, Y + 2, ts, 1, P.rim);
        if (dn) R(X, Y + ts - FACE - 2, ts, 1, P.rim);
        if (lf) R(X + 2, Y + (up ? 2 : 0), 1, ts - (up ? 2 : 0) - (dn ? FACE + 1 : 0), P.rim);
        if (rt) R(X + ts - 3, Y + (up ? 2 : 0), 1, ts - (up ? 2 : 0) - (dn ? FACE + 1 : 0), P.rim);
      }
      if (rt) R(X + ts - 2, Y, 1, ts, P.shade);
      if (up) R(X, Y + 1, ts, 1, P.hl);
      if (lf) R(X + 1, Y + 1, 1, ts - (dn ? FACE + 1 : 1), P.hl);
      if (dn) { R(X, Y + ts - FACE, ts, FACE, P.face); R(X, Y + ts - FACE, ts, 1, P.crease); R(X, Y + ts - 2, ts, 1, P.crease); }
      if (up) R(X, Y, ts, 1, P.line);
      if (dn) R(X, Y + ts - 1, ts, 1, P.line);
      if (lf) R(X, Y, 1, ts, P.line);
      if (rt) R(X + ts - 1, Y, 1, ts, P.line);
      // Round convex corners by one pixel; close concave corners with an outline pixel.
      const floorPx = '#1c130d';
      if (up && lf) { R(X, Y, 1, 1, floorPx); R(X + 1, Y + 1, 1, 1, P.line); }
      if (up && rt) { R(X + ts - 1, Y, 1, 1, floorPx); R(X + ts - 2, Y + 1, 1, 1, P.line); }
      if (dn && lf) { R(X, Y + ts - 1, 1, 1, floorPx); R(X + 1, Y + ts - 2, 1, 1, P.line); }
      if (dn && rt) { R(X + ts - 1, Y + ts - 1, 1, 1, floorPx); R(X + ts - 2, Y + ts - 2, 1, 1, P.line); }
      if (!up && !lf && !wallOut(x - 1, y - 1)) R(X, Y, 1, 1, P.line);
      if (!up && !rt && !wallOut(x + 1, y - 1)) R(X + ts - 1, Y, 1, 1, P.line);
      if (!dn && !lf && !wallOut(x - 1, y + 1)) R(X, Y + ts - 1, 1, 1, P.line);
      if (!dn && !rt && !wallOut(x + 1, y + 1)) R(X + ts - 1, Y + ts - 1, 1, 1, P.line);
    }
    // Wall shadows cast down onto the floor.
    for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols; x++) {
      if (isWall(x, y) && !isWall(x, y + 1)) { c.fillStyle = 'rgba(8,4,2,.45)'; c.fillRect(ox + x * ts, oy + (y + 1) * ts, ts, 2); }
    }
    // Tunnel mouths fade into darkness.
    for (let y = 0; y < rows; y++) {
      if (m.grid[y][0] !== '#' && m.grid[y][cols - 1] !== '#') {
        for (let i = 0; i < 6; i++) {
          c.fillStyle = `rgba(10,6,4,${0.85 - i * 0.14})`;
          c.fillRect(ox + i * 2, oy + y * ts, 2, ts); c.fillRect(ox + mw - 2 - i * 2, oy + y * ts, 2, ts);
        }
      }
    }
    return cv;
  }

  ART.mazeFloor = function (m, ctx) {
    const key = [m.map.name, m.W, m.H, m.ts, m.ox, m.oy, m.cols, m.rows].join('|');
    if (key !== staticKey || !staticCv) { staticCv = buildStatic(m); staticKey = key; }
    const s = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(staticCv, 0, 0, m.W, m.H);
    ctx.imageSmoothingEnabled = s;
  };

  /* ---------------------------------------------------------------- */
  /* Dynamic tiles: rice, salmon roe, soy puddles, items                */
  /* ---------------------------------------------------------------- */
  const RICE = [
    // horizontal grain, vertical grain, diagonal pair
    bake(5, 4, (x, y) => (y === 3 ? (x > 0 && x < 4 ? '#0a0605' : null) : (y >= 1 && y <= 2 && x >= 0 && x <= 3 ? (y === 1 && x <= 1 ? '#fffaf0' : y === 2 && x === 3 ? PAL.paperDim : PAL.paper) : null))),
    bake(4, 5, (x, y) => (x >= 1 && x <= 2 && y <= 3 ? (x === 1 && y === 0 ? '#fffaf0' : y === 3 ? PAL.paperDim : PAL.paper) : (y === 4 && x >= 1 && x <= 2 ? '#0a0605' : null))),
    bake(5, 5, (x, y) => { if ((x === 0 || x === 1) && (y === 0 || y === 1)) return x === 0 && y === 0 ? '#fffaf0' : PAL.paper; if ((x === 3 || x === 2) && (y === 2 || y === 3)) return x === 3 && y === 3 ? PAL.paperDim : PAL.paper; if (y === 4 && (x === 2 || x === 3)) return '#0a0605'; if (y === 2 && x === 1) return '#0a0605'; return null; }),
  ];
  const ROE = bake(13, 13, (x, y) => {
    const balls = [[4.2, 4.6], [8.8, 4.6], [6.5, 8.6]];
    for (const [bx, by] of balls) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, d = Math.hypot(dx, dy);
      if (d < 2.9) {
        if (dx > -1.6 && dx < -0.4 && dy > -1.6 && dy < -0.4) return '#ffe2cf';
        if (dx + dy > 1.6) return PAL.red;
        if (d < 1.2) return '#ff9a70';
        return PAL.salmon;
      }
    }
    return null;
  }, '#2a0f08');
  const ROE_GLOW = bake(21, 21, (x, y) => { const d = Math.hypot(x + 0.5 - 10.5, y + 0.5 - 10.5); return d < 10 && d > 7.5 && (x + y) % 2 === 0 ? PAL.salmon : null; });

  ART.mazeTiles = function (m, ctx) {
    const ts = m.ts, ox = m.ox, oy = m.oy;
    const s = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    // Soy puddles: pixel blobs with a glossy rim.
    for (const pd of m.puddles) {
      const a = clamp(pd.t / 1.5, 0, 1);
      const cx = Math.round(ox + (pd.x + 0.5) * ts), cy = Math.round(oy + (pd.y + 0.55) * ts), rw = Math.round(ts * 0.44), rh = Math.round(ts * 0.26);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#0d0604'; ctx.fillRect(cx - rw + 2, cy - rh - 1, rw * 2 - 4, rh * 2 + 2); ctx.fillRect(cx - rw - 1, cy - rh + 2, rw * 2 + 2, rh * 2 - 4);
      ctx.fillStyle = '#3a1c0e'; ctx.fillRect(cx - rw + 2, cy - rh, rw * 2 - 4, rh * 2); ctx.fillRect(cx - rw, cy - rh + 2, rw * 2, rh * 2 - 4);
      ctx.fillStyle = '#5a2e16'; ctx.fillRect(cx - rw + 3, cy - rh + 1, rw, 1); ctx.fillRect(cx - rw + 2, cy - rh + 2, 1, 2);
      ctx.fillStyle = '#c98a5a'; ctx.fillRect(cx - rw + 4 + Math.round(Math.sin(m.t * 2 + pd.x) * 1), cy - rh + 2, 2, 1);
      ctx.globalAlpha = 1;
    }
    for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
      const c = m.grid[y][x];
      if (c === ' ' || c === '#') continue;
      const cx = ox + x * ts + (ts >> 1), cy = oy + y * ts + (ts >> 1);
      if (c === '.') {
        const img = RICE[(x * 7 + y * 3) % 3];
        ctx.drawImage(img, cx - (img.width >> 1), cy - (img.height >> 1));
      } else if (c === 'o') {
        const ph = m.t * 4 + x;
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(ph);
        ctx.drawImage(ROE_GLOW, cx - 10, cy - 10);
        ctx.globalAlpha = 1;
        const bob = Math.round(Math.sin(m.t * 5 + x) * 0.8);
        ctx.drawImage(ROE, cx - 6, cy - 6 + bob);
        // Shimmer: a glint hops between the three eggs, with a cross sparkle now and then.
        const k = Math.floor(m.t * 5 + x) % 3, gp = [[3, 3], [8, 3], [5, 7]][k];
        ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 6 + gp[0], cy - 6 + gp[1] + bob, 1, 1);
        const sp = (m.t * 0.9 + x * 0.37 + y * 0.21) % 1;
        if (sp < 0.18) {
          const sx = cx + 5, sy = cy - 6 + bob, l = sp < 0.09 ? 2 : 1;
          ctx.fillStyle = '#fff4d6'; ctx.fillRect(sx - l, sy, l * 2 + 1, 1); ctx.fillRect(sx, sy - l, 1, l * 2 + 1);
        }
      } else if (c === 'T' || c === 'F') {
        // Not on the boss map; keep a small readable fallback.
        ctx.fillStyle = c === 'T' ? PAL.hinoki : PAL.salmon; ctx.fillRect(cx - 6, cy - 3, 12, 6);
        ctx.fillStyle = PAL.ink; ctx.fillRect(cx - 1, cy - 3, 2, 6);
      }
    }
    ctx.imageSmoothingEnabled = s;
  };

  /* ---------------------------------------------------------------- */
  /* Giant Puffer                                                      */
  /* ---------------------------------------------------------------- */
  const PUFF_SKIN = {
    angry: { base: '#f0c552', shade: '#c98f32', dark: '#9c6a22', hl: '#fff0b8', belly: '#f4ead7', bellyShade: '#cbbca3', spot: '#8a5a1c', spike: '#b07a2c', tip: '#6e4516', fin: '#e2482f', fin2: '#a8261a', sclera: '#f4ead7', brow: '#120d0a', mouth: '#4a1a12', tooth: '#fffaf0' },
    scared: { base: '#6f8fe0', shade: '#4a66b8', dark: '#2b4486', hl: '#c9d8ff', belly: '#c9d6f5', bellyShade: '#9fb0dc', spot: '#3a55a0', spike: '#4a66b8', tip: '#c9d6f5', fin: '#9fb4e8', fin2: '#6f8fe0', sclera: '#f4ead7', brow: null, mouth: '#1b1410', tooth: null },
    flash: { base: '#f4ead7', shade: '#cbbca3', dark: '#9c8a74', hl: '#ffffff', belly: '#ffffff', bellyShade: '#e2d6bf', spot: '#cbbca3', spike: '#cbbca3', tip: '#ffffff', fin: '#e8cd9c', fin2: '#cbbca3', sclera: '#ffffff', brow: null, mouth: '#c8321e', tooth: null },
    shadow: null,
  };
  const puffCache = {};
  function pufferGeom(R) {
    const k = R / 14;
    return { k, R, L: 5 * k, S: 2 * Math.ceil(R + 6.5 * k) + 2, eyes: [[-5.2 * k, -2.6 * k], [5.2 * k, -2.6 * k]], er: 4.1 * k, mouthY: 6.4 * k };
  }
  function bakePuffer(R, skinName, frame) {
    const key = R + skinName + frame;
    if (puffCache[key]) return puffCache[key];
    const G = pufferGeom(R), k = G.k, S = G.S, c = S / 2, sil = skinName === 'shadow';
    const P = sil ? PUFF_SKIN.angry : PUFF_SKIN[skinName], angry = skinName === 'angry' || sil;
    const spikes = []; for (let i = 0; i < 12; i++) spikes.push((i + 0.5) / 12 * TAU);
    const spots = [[-8, -9], [-2, -11.5], [5, -10], [10.5, -4], [-11, 1], [10, 3.5], [1, -7.5], [-6, -12]];
    const fn = (px, py) => {
      const dx = px + 0.5 - c, dy = py + 0.5 - c, d = Math.hypot(dx, dy);
      // Pectoral fins: radial fans rooted on the body edge, flapping between two frames.
      const fx = Math.abs(dx) - (R - 1.5 * k), fy = dy - 2.5 * k;
      if (fx > 0) {
        const fa = Math.atan2(fy, fx), fl = Math.hypot(fx, fy), spread = frame ? 0.75 : 1.05, len = (frame ? 9 : 7.6) * k;
        const reach = len * (0.82 + 0.18 * Math.cos(fa * 9)); // scalloped edge
        if (Math.abs(fa + (frame ? 0.25 : 0.05)) < spread && fl < reach) {
          if (sil) return '#5a130b';
          return Math.floor((fa + 2) * 5) % 2 ? P.fin2 : P.fin;
        }
      }
      if (d > R) {
        if (d > R + G.L) return null;
        const ang = Math.atan2(dy, dx);
        let best = 9; for (const a of spikes) { let da = (((ang - a) % TAU) + TAU) % TAU; da = Math.min(da, TAU - da); if (da < best) best = da; }
        const w = 2.0 * k * (1 - (d - R) / G.L) + 0.2;
        if (best * d < w) return sil ? '#5a130b' : (d > R + G.L - 1.3 ? P.tip : P.spike);
        return null;
      }
      // Eyes.
      for (let i = 0; i < 2; i++) {
        const [ex, ey] = G.eyes[i], s = i === 0 ? 1 : -1; // s: +1 means "toward centre" is +x
        const lx = (dx - ex) * s, ly = dy - ey, ed = Math.hypot(lx, ly);
        if (angry) {
          // Thick V brows: the inner end (toward the centre) sits lower.
          const browY = -G.er * 0.4 + lx * 0.5;
          if (ly < browY + 0.2 && ly >= browY - 2.2 * k && lx > -G.er - 1.0 * k && lx < G.er + 1.6 * k && ed <= G.er + 2.2 * k) return sil ? '#2a0805' : P.brow;
          if (ed <= G.er && ly >= browY) return sil ? '#ffd23a' : (ly > G.er * 0.55 ? '#e8cd9c' : P.sclera);
        } else if (ed <= G.er) return ly > G.er * 0.55 ? P.bellyShade : P.sclera;
      }
      // Mouth.
      const my = dy - G.mouthY;
      if (angry) {
        // Wide frown with a row of jagged teeth along the top.
        const top = -1.4 * k + (dx * dx) * 0.09 / k;
        if (Math.abs(dx) < 4.6 * k && my >= top && my < top + 2.4 * k) {
          if (sil) return '#2a0805';
          if (my < top + 1 && Math.abs(dx) < 3.4 * k && (px % 2 === 0)) return P.tooth;
          return P.mouth;
        }
      } else if (Math.abs(dx) < 4.2 * k && Math.abs(my - Math.sin(dx * 1.5) * 0.9) < 0.6) return P.mouth;
      if (sil) return d > R - 1.2 ? '#7a1a0e' : '#4a0f08';
      // Belly.
      if ((dx / (R * 0.74)) ** 2 + ((dy - R * 0.64) / (R * 0.52)) ** 2 < 1) return dy > R * 0.78 || dx > R * 0.45 ? P.bellyShade : P.belly;
      if (Math.hypot(dx + R * 0.42, dy + R * 0.5) < R * 0.2) return P.hl;
      for (const [sx, sy] of spots) if (Math.hypot(dx - sx * k, dy - sy * k) < 1.15 * k) return P.spot;
      const sh = (dx * 0.5 + dy * 0.85) / R;
      if (sh > 0.62 && d > R - 2) return P.dark;
      if (sh > 0.45) return P.shade;
      return P.base;
    };
    const img = bake(S, S, fn, sil ? '#e2482f' : PAL.ink);
    puffCache[key] = img;
    return img;
  }

  ART.ghost = function (ctx, m, g) {
    const [gx, gy] = m.pos(g), ts = m.ts;
    const size = g.size || 1;
    // Body radius ~0.68 tiles for the boss, so spike tips land near its 0.85-tile hit radius.
    let R = Math.round(ts * 0.68 * size / 1.35);
    if (g.inflated) R = Math.round(R * 1.25);
    const fr = g.fright > 0;
    const skin = fr ? (g.fright < 1.8 && Math.floor(g.fright * 6) % 2 ? 'flash' : 'scared') : 'angry';
    const frame = Math.floor(m.t * (fr ? 12 : 7)) % 2;
    const img = bakePuffer(R, skin, frame), G = pufferGeom(R), half = G.S / 2;
    const bob = Math.round(Math.sin(m.t * 3.2) * 1.5);
    const shake = fr ? Math.round(Math.sin(m.t * 40)) : 0;
    const cx = Math.round(m.ox + (gx + 0.5) * ts) + shake, cy = Math.round(m.oy + (gy + 0.5) * ts);
    // Floor shadow.
    ctx.fillStyle = 'rgba(8,4,2,.45)';
    const sw = Math.round(R * 1.2);
    ctx.fillRect(cx - sw + 2, cy + R - 1, sw * 2 - 4, 3); ctx.fillRect(cx - sw + 4, cy + R + 2, sw * 2 - 8, 1);
    blit(ctx, img, cx - half, cy - half + bob);
    // Pupils track the direction of travel (or the player while waiting).
    let d = g.dir;
    if (!d[0] && !d[1]) { const p = m.players[0]; const [px, py] = m.pos(p); d = [Math.sign(Math.round(px - gx)), Math.sign(Math.round(py - gy))]; }
    for (const [ex, ey] of G.eyes) {
      const bx = Math.round(cx + ex), by = Math.round(cy + ey + bob);
      if (fr) {
        ctx.fillStyle = PAL.ink; ctx.fillRect(bx - 1 + Math.round(Math.sin(m.t * 30 + ex)), by - 1, 2, 2);
      } else {
        const px = bx - 1 + Math.round(d[0] * 1.6 * G.k), py = by + Math.round(0.6 + Math.max(0, d[1]) * 1.2 * G.k);
        ctx.fillStyle = PAL.ink; ctx.fillRect(px, py, 2, 3);
        ctx.fillStyle = PAL.red; ctx.fillRect(px, py + 2, 2, 1);
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /* Player maki                                                       */
  /* ---------------------------------------------------------------- */
  const makiCache = {};
  function bakeMaki(r, open) {
    const key = r + ':' + open;
    if (makiCache[key]) return makiCache[key];
    const S = 2 * Math.ceil(r) + 2, c = S / 2, mouth = open * Math.PI;
    const inner = r * 0.44, riceR = r - 2.3;
    const img = bake(S, S, (px, py) => {
      const dx = px + 0.5 - c, dy = py + 0.5 - c, d = Math.hypot(dx, dy);
      if (d > r) return null;
      if (Math.abs(Math.atan2(dy, dx)) < mouth && d > 0.8) return null;
      if (d > riceR) {
        if (dx < -1 && dy < -1 && d > r - 1.2) return '#3d5a44';
        return hash(px, py, 11) > 0.8 ? '#0f1a13' : '#1d2e22';
      }
      if (d > riceR - 0.9 && dy > 0) return PAL.paperDim;
      // Eye on the rice, just above the mouth.
      const ex = -1.2, ey = -riceR + 2.2;
      if (dx >= ex - 1 && dx < ex + 1 && dy >= ey - 1 && dy < ey + 1) return dx < ex && dy < ey ? '#fffaf0' : PAL.ink;
      if (d > inner) {
        const h = hash(px, py, 12);
        if (h > 0.84) return PAL.paperDim;
        if (h < 0.1 || (dx < 0 && dy < 0 && d > riceR - 1.5)) return '#fffaf0';
        return PAL.paper;
      }
      if (dx < -0.3 && dy < -0.3 && d < inner * 0.6 && d > inner * 0.25) return '#ffc2a0';
      if (dx + dy > inner * 0.6) return PAL.red2;
      if (Math.abs(dx - dy) < 0.6 && d < inner - 0.8) return '#ffb08c';
      return PAL.salmon;
    }, PAL.ink);
    makiCache[key] = img;
    return img;
  }
  const lastFace = new WeakMap();
  ART.maki = function (ctx, m, p) {
    const [px, py] = m.pos(p), ts = m.ts;
    const cx = Math.round(m.ox + (px + 0.5) * ts), cy = Math.round(m.oy + (py + 0.5) * ts);
    const r = Math.round(ts * 0.46 * (p.scale || 1) * 2) / 2;
    const moving = p.dir[0] || p.dir[1];
    let d = moving ? p.dir : (lastFace.get(p) || [1, 0]);
    if (moving) lastFace.set(p, p.dir);
    const open = moving ? [0.05, 0.12, 0.2, 0.28, 0.34][Math.min(4, Math.floor(Math.abs(Math.sin(m.t * 12)) * 5))] : 0.16;
    const img = bakeMaki(r, open), S = img.width, half = S / 2;
    // Floor shadow.
    ctx.fillStyle = 'rgba(8,4,2,.4)'; ctx.fillRect(cx - Math.round(r * 0.8), cy + Math.round(r) - 1, Math.round(r * 1.6), 2);
    ctx.save(); ctx.translate(cx, cy);
    if (d[0] < 0) ctx.scale(-1, 1);
    else if (d[1] < 0) { ctx.rotate(-Math.PI / 2); }
    else if (d[1] > 0) { ctx.rotate(Math.PI / 2); ctx.scale(1, -1); }
    const s = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -half, -half);
    ctx.imageSmoothingEnabled = s;
    ctx.restore();
    if (p.slow) {
      // Soy-soaked: a little drip over the head.
      const t = (m.t * 2) % 1, yy = cy - Math.round(r) - 5 + Math.round(t * 3);
      ctx.fillStyle = PAL.ink; ctx.fillRect(cx - 2, yy - 1, 4, 5);
      ctx.fillStyle = '#5a2e16'; ctx.fillRect(cx - 1, yy, 2, 3); ctx.fillStyle = '#c98a5a'; ctx.fillRect(cx - 1, yy, 1, 1);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Effects: particles, boss intro, win burst, camera shake            */
  /* ---------------------------------------------------------------- */
  const POOL = [];
  for (let i = 0; i < 220; i++) POOL.push({ a: false, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, c: '#fff', s: 1, g: 0, star: false });
  function spawn(x, y, vx, vy, life, c, s, g, star) {
    for (const p of POOL) if (!p.a) { p.a = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.life = life; p.c = c; p.s = s; p.g = g || 0; p.star = !!star; return p; }
    return null;
  }
  const tileXY = (m, x, y) => [m.ox + (x + 0.5) * m.ts, m.oy + (y + 0.5) * m.ts];
  const isBoss = () => typeof Shell !== 'undefined' && Shell.engine && Shell.engine.phase === 'boss';

  EVT.on('rice', (e) => {
    const m = e.m; if (!m || !m.o || !m.o.boss) return;
    const [x, y] = tileXY(m, e.x, e.y);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + Math.random() * 0.8, v = 25 + Math.random() * 30;
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v - 10, 0.28 + Math.random() * 0.15, i % 2 ? PAL.paper : PAL.hinoki, 1, 60);
    }
    spawn(x, y - 3, 0, -12, 0.3, '#fffaf0', 1, 0, true);
  });
  EVT.on('roe', (e) => {
    const m = e.m; if (!m || !m.o || !m.o.boss) return;
    const [x, y] = tileXY(m, e.x, e.y);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, v = 50 + Math.random() * 50;
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.45 + Math.random() * 0.2, i % 3 ? PAL.salmon : '#ffe2cf', 2, 40);
    }
    spawn(x, y, 0, 0, 0.4, '#fff4d6', 1, 0, true);
  });
  EVT.on('ghostEaten', (e) => {
    const m = e.m; if (!m || !m.o || !m.o.boss) return;
    const [x, y] = [m.ox + (e.x + 0.5) * m.ts, m.oy + (e.y + 0.5) * m.ts];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU, v = 60 + Math.random() * 70;
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.5 + Math.random() * 0.3, pick(['#9fb4e8', '#f4ead7', '#6f8fe0']), 2, 80);
    }
    shakeT = 0.25;
  });

  let introT = -1, winT = -1, shakeT = 0, winX = 320, winY = 150;
  const INTRO = 1.2;
  EVT.on('bossStart', () => { introT = 0; shakeT = 0; for (const p of POOL) p.a = false; });
  EVT.on('bossWin', (e) => {
    winT = 0; introT = -1;
    const rush = e.rush, m = rush && rush.cur;
    if (m && m.players) { const [px, py] = m.pos(m.players[0]); winX = m.ox + (px + 0.5) * m.ts; winY = m.oy + (py + 0.5) * m.ts; }
    const cols = [PAL.paper, PAL.salmon, PAL.hinoki, PAL.wasabi, PAL.red2, PAL.cyan];
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * TAU, v = 80 + Math.random() * 170;
      spawn(winX, winY, Math.cos(a) * v, Math.sin(a) * v - 60, 0.8 + Math.random() * 0.7, cols[i % cols.length], i % 3 ? 3 : 2, 220);
    }
    for (let i = 0; i < 50; i++) spawn(Math.random() * 640, -10 - Math.random() * 80, (Math.random() - 0.5) * 40, 40 + Math.random() * 60, 1.6 + Math.random() * 0.8, cols[i % cols.length], 3, 60);
    for (let i = 0; i < 8; i++) spawn(winX + (Math.random() - 0.5) * 80, winY + (Math.random() - 0.5) * 60, 0, -20, 0.6 + Math.random() * 0.4, '#fff4d6', 1, 0, true);
    shakeT = 0.3;
  });
  EVT.on('start', () => { introT = -1; winT = -1; shakeT = 0; for (const p of POOL) p.a = false; });

  ART.preDraw.push((shell, ctx) => {
    if (shell.state !== 'play') return;
    let amp = 0;
    if (introT >= 0 && introT > 0.12 && introT < 0.5) amp = 3 * (1 - (introT - 0.12) / 0.38);
    if (shakeT > 0) amp = Math.max(amp, shakeT * 8);
    if (amp > 0.3) ctx.translate(Math.round((Math.random() - 0.5) * 2 * amp), Math.round((Math.random() - 0.5) * 2 * amp));
  });

  function stripes(ctx, y, h, W, off) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, h); ctx.clip();
    ctx.fillStyle = PAL.ink; ctx.fillRect(0, y, W, h);
    ctx.fillStyle = PAL.red;
    const step = 16;
    for (let x = -h - step + (Math.round(off) % step); x < W + h; x += step) {
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + h, y); ctx.lineTo(x + h + 8, y); ctx.lineTo(x + 8, y + h); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#0a0605'; ctx.fillRect(0, y - 1, W, 1); ctx.fillRect(0, y + h, W, 1);
  }

  function drawIntro(shell, ctx) {
    const W = shell.W, H = shell.H, t = introT;
    const out = t > INTRO - 0.25 ? clamp((INTRO - t) / 0.25, 0, 1) : 1;
    // Red alarm flash.
    if (t < 0.22) { ctx.fillStyle = `rgba(200,50,30,${(0.22 - t) / 0.22 * 0.55})`; ctx.fillRect(0, 0, W, H); }
    else if (Math.floor(t * 6) % 2 === 0) { ctx.fillStyle = `rgba(200,50,30,${0.1 * out})`; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = out;
    // Hazard stripes slide in from above and below.
    const slide = Math.round((1 - clamp(t / 0.15, 0, 1)) * 18);
    stripes(ctx, -slide, 14, W, t * 60);
    stripes(ctx, H - 14 + slide, 14, W, -t * 60);
    ctx.font = '8px Silkscreen'; ctx.textAlign = 'center'; ctx.fillStyle = PAL.paper;
    // Centre band opens like a shutter.
    const bandH = Math.round(104 * clamp(t / 0.14, 0, 1)), by = Math.round(H / 2 - bandH / 2);
    if (bandH > 2) {
      ctx.fillStyle = 'rgba(18,13,10,.96)'; ctx.fillRect(0, by, W, bandH);
      ctx.fillStyle = PAL.red; ctx.fillRect(0, by, W, 2); ctx.fillRect(0, by + bandH - 2, W, 2);
      ctx.fillStyle = '#5a130b'; ctx.fillRect(0, by + 3, W, 1); ctx.fillRect(0, by + bandH - 4, W, 1);
    }
    if (t > 0.1) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, by + 4, W, Math.max(0, bandH - 8)); ctx.clip();
      // Puffer silhouette with glowing eyes, sliding in from the left.
      const sil = bakePuffer(14, 'shadow', Math.floor(t * 8) % 2), sc = 2, sw = sil.width * sc;
      const sx = Math.round(W / 2 - 150 - (1 - clamp((t - 0.1) / 0.18, 0, 1)) * 120), sy = Math.round(H / 2 - sw / 2 + Math.sin(t * 9) * 2);
      const s = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sil, sx, sy, sw, sw);
      ctx.imageSmoothingEnabled = s;
      // "BOSS" slams in, flickering first.
      const slam = clamp((t - 0.12) / 0.12, 0, 1), scale = 1 + (1 - slam) * 1.5;
      if (t > 0.12 && (t > 0.45 || Math.floor(t * 20) % 2 === 0)) {
        ctx.save(); ctx.translate(Math.round(W / 2 + 40), Math.round(H / 2 + 6)); ctx.scale(scale, scale);
        ctx.font = '44px Silkscreen'; ctx.textAlign = 'center';
        ctx.fillStyle = '#5a130b'; ctx.fillText('BOSS', 3, 3);
        ctx.fillStyle = PAL.red2; ctx.fillText('BOSS', 1, 1);
        ctx.fillStyle = PAL.paper; ctx.fillText('BOSS', 0, 0);
        ctx.restore();
      }
      if (t > 0.3) {
        ctx.textAlign = 'center';
        ctx.font = '11px Silkscreen'; ctx.fillStyle = PAL.salmon;
        ctx.fillText('THE GIANT PUFFER', Math.round(W / 2 + 40), Math.round(H / 2 + 26));
        ctx.font = '8px Silkscreen'; ctx.fillStyle = PAL.muted;
        ctx.fillText('!! WARNING !!', Math.round(W / 2 + 40), Math.round(H / 2 - 36));
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  function drawWin(shell, ctx) {
    const t = winT, W = shell.W, H = shell.H;
    if (t < 0.15) { ctx.fillStyle = `rgba(255,244,214,${(0.15 - t) / 0.15 * 0.5})`; ctx.fillRect(0, 0, W, H); }
    // Two expanding pixel rings.
    for (let k = 0; k < 2; k++) {
      const tt = t - k * 0.12; if (tt <= 0 || tt > 0.6) continue;
      const rad = 10 + tt * 260, a = 1 - tt / 0.6, n = Math.max(16, Math.round(rad * 0.8));
      ctx.globalAlpha = a; ctx.fillStyle = k ? PAL.salmon : PAL.hinoki;
      for (let i = 0; i < n; i++) { const ang = (i / n) * TAU; ctx.fillRect(Math.round(winX + Math.cos(ang) * rad) - 1, Math.round(winY + Math.sin(ang) * rad) - 1, 2, 2); }
    }
    ctx.globalAlpha = 1;
  }

  ART.layers.push((shell, ctx, dt) => {
    const live = shell.state === 'play';
    const step = live ? dt : 0;
    if (shakeT > 0) shakeT = Math.max(0, shakeT - step);
    // Particles.
    for (const p of POOL) {
      if (!p.a) continue;
      p.t += step; if (p.t >= p.life) { p.a = false; continue; }
      p.vy += p.g * step; p.x += p.vx * step; p.y += p.vy * step;
      const a = 1 - p.t / p.life, x = Math.round(p.x), y = Math.round(p.y);
      ctx.globalAlpha = clamp(a * 1.6, 0, 1); ctx.fillStyle = p.c;
      if (p.star) { const l = a > 0.5 ? 2 : 1; ctx.fillRect(x - l, y, l * 2 + 1, 1); ctx.fillRect(x, y - l, 1, l * 2 + 1); }
      else ctx.fillRect(x, y, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    if (introT >= 0) {
      if (isBoss()) { drawIntro(shell, ctx); introT += step; if (introT > INTRO) introT = -1; }
      else introT = -1;
    }
    if (winT >= 0) { drawWin(shell, ctx); winT += step; if (winT > 0.8) winT = -1; }
  });
})();
