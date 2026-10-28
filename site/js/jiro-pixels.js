/*
 * Jiro pixel art.
 * jiroGrid(face, k) returns Jiro's 64-wide character grid (K nori, W rice, G grain, F face),
 * with the given face drawn in. k > 1 downsamples it.
 * jiroPx(palette) returns a renderer that turns a grid into absolutely positioned runs of pixels.
 * jiroArt(face, u, palette, opts) renders him at any (fractional) pixel size, snapping runs to whole pixels.
 * Faces: block (default, also "open"), half, shut, star, zero, ring, at, caret, hash, dot, bento, squeeze, side.
 * Append ":dx" to shift the face sideways, e.g. "block:-3" to glance left.
 */
(function (root) {
function jiroArt(eyes, u, pal, opts) {
  opts = opts || {};
  const COL = { K: pal.K || '#1D3B2A', W: pal.W || '#FAF8F2', G: pal.G || '#E2DDCF', F: pal.F || '#FB5E45' };
  let g = jiroGrid(eyes, 1);
  if (opts.faceOnly) g = g.map((r) => r.map((v) => (v === 'F' ? v : null)));
  let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
  g.forEach((r, y) => r.forEach((v, x) => { if (v) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); } }));
  const R = (n) => Math.round(n * u);
  const px = [];
  g.forEach((r, y) => { let x = 0; while (x < r.length) { const v = r[x]; if (!v) { x++; continue; } let e = x + 1; while (e < r.length && r[e] === v) e++; const l = R(x - minx), t = R(y - miny); px.push({ l, t, w: R(e - minx) - l, h: R(y + 1 - miny) - t, c: COL[v] }); x = e; } });
  return { w: R(maxx - minx + 1), h: R(maxy - miny + 1), px };
}
function jiroGrid(eyes, k) {
  const JB=["...........................KKKKKK...............................",".......................KKKKKKKKKK...............................",".....................KKKKKKKKKKKK...............................","...................KKKKKKKKWWWWWWW..............................",".................KKKKKKKWWWWWWWWWWW.............................","................KKKKKWWWWWWWWWWWWWWW............................","..............KKKKKKWWWWWWWWWWWWWWWWW.....WW....................",".............KKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWW...................","............KKKKKWWWWWWWWWWWWWWWWWGGWWWWWWWWW...................","...........KKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...................","...........KKKKWWWWWWWWWGGWWWWWWWWWWWWWWWWWWWW..................","..........KKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.................",".........KKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW................",".........KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...............","........KKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW............","........KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...........",".......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...........",".......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW............","......KKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW............","......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW............","......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW............","......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW............",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWGGWWWW...........",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..........",".....KKKWWWWWWWWGWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.........",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW........",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.....",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.....",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.....",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.....",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.....",".....KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.....","......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK......","......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK......","......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK......","......KKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKK......",".......KKKWWWWWWWWGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.......",".......KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.......","........KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWGGWWWWWWWKKK........","........KKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKK........",".........KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKK.........",".........KKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKK.........","..........KKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKK..........","..........KKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKK...........",".........KKWWWWKWWWWWWWWWWWWGGWWWWWWWWWWWWWWWWWWKKKKK...........","........KKWWWKKKKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKKKKK............",".......KKWWKKKKKKKWWWWWWWWWWWWWWWWWWWGGWWWWWWWKKKKK.............","......KKWKKKK.KKKKKKWWWWWWWWWWWWWWWWWWWWWWWWKKKKKK..............",".....KKKKKK.....KKKKKWWWWWWWWWWWWWWWWWWWWWWKKKKK................","....KKKKK........KKKKKKKWWWWWWWWWWWWWWWWKKKKKKK.................","...KKKK............KKKKKKKKWWWWWWWWWWKKKKKKKK...................","..KKK................KKKKKKKKKKKKKKKKKKKKKK.....................",".......................KKKKKKKKKKKKKKKKKK.......................","...........................KKKKKKKKKK...........................","................................................................"];const JF={"squeeze":[[16,22,2],[46,22,2],[16,23,3],[45,23,3],[17,24,3],[44,24,3],[18,25,3],[43,25,3],[19,26,3],[42,26,3],[20,27,3],[41,27,3],[20,28,3],[41,28,3],[19,29,3],[42,29,3],[18,30,3],[43,30,3],[17,31,3],[27,31,10],[44,31,3],[16,32,3],[27,32,10],[45,32,3],[16,33,2],[27,33,10],[46,33,2]],"side":[[16,22,2],[41,22,2],[16,23,3],[41,23,3],[17,24,3],[42,24,3],[18,25,3],[43,25,3],[19,26,3],[44,26,3],[20,27,3],[45,27,3],[20,28,3],[45,28,3],[19,29,3],[44,29,3],[18,30,3],[43,30,3],[17,31,3],[27,31,10],[42,31,3],[16,32,3],[27,32,10],[41,32,3],[16,33,2],[27,33,10],[41,33,2]],"ring":[[16,22,2],[43,22,4],[16,23,3],[42,23,6],[17,24,3],[41,24,2],[47,24,2],[18,25,3],[40,25,2],[48,25,2],[19,26,3],[40,26,2],[48,26,2],[20,27,3],[40,27,2],[48,27,2],[20,28,3],[40,28,2],[48,28,2],[19,29,3],[40,29,2],[48,29,2],[18,30,3],[40,30,2],[48,30,2],[17,31,3],[27,31,10],[41,31,2],[47,31,2],[16,32,3],[27,32,10],[42,32,6],[16,33,2],[27,33,10],[43,33,4]],"zero":[[16,22,2],[43,22,4],[16,23,3],[42,23,6],[17,24,3],[41,24,2],[47,24,2],[18,25,3],[40,25,2],[48,25,2],[19,26,3],[40,26,2],[48,26,2],[20,27,3],[40,27,2],[44,27,2],[48,27,2],[20,28,3],[40,28,2],[44,28,2],[48,28,2],[19,29,3],[40,29,2],[48,29,2],[18,30,3],[40,30,2],[48,30,2],[17,31,3],[27,31,10],[41,31,2],[47,31,2],[16,32,3],[27,32,10],[42,32,6],[16,33,2],[27,33,10],[43,33,4]],"at":[[16,22,2],[43,22,5],[16,23,3],[41,23,2],[48,23,2],[17,24,3],[40,24,2],[49,24,2],[18,25,3],[40,25,2],[44,25,4],[49,25,2],[19,26,3],[40,26,2],[43,26,2],[47,26,1],[49,26,2],[20,27,3],[40,27,2],[43,27,2],[47,27,1],[49,27,2],[20,28,3],[40,28,2],[43,28,2],[47,28,1],[49,28,2],[19,29,3],[40,29,2],[44,29,6],[18,30,3],[40,30,2],[17,31,3],[27,31,10],[41,31,2],[16,32,3],[27,32,10],[42,32,7],[16,33,2],[27,33,10]],"star":[[16,22,2],[16,23,3],[44,23,2],[17,24,3],[44,24,2],[18,25,3],[40,25,2],[44,25,2],[48,25,2],[19,26,3],[41,26,2],[44,26,2],[47,26,2],[20,27,3],[42,27,6],[20,28,3],[42,28,6],[19,29,3],[41,29,2],[44,29,2],[47,29,2],[18,30,3],[40,30,2],[44,30,2],[48,30,2],[17,31,3],[27,31,10],[44,31,2],[16,32,3],[27,32,10],[44,32,2],[16,33,2],[27,33,10]],"caret":[[16,22,2],[16,23,3],[44,23,2],[17,24,3],[43,24,4],[18,25,3],[42,25,2],[46,25,2],[19,26,3],[41,26,2],[47,26,2],[20,27,3],[40,27,2],[48,27,2],[20,28,3],[40,28,1],[49,28,1],[19,29,3],[18,30,3],[17,31,3],[27,31,10],[16,32,3],[27,32,10],[16,33,2],[27,33,10]],"hash":[[16,22,2],[16,23,3],[42,23,2],[46,23,2],[17,24,3],[42,24,2],[46,24,2],[18,25,3],[40,25,10],[19,26,3],[40,26,10],[20,27,3],[42,27,2],[46,27,2],[20,28,3],[42,28,2],[46,28,2],[19,29,3],[40,29,10],[18,30,3],[40,30,10],[17,31,3],[27,31,10],[42,31,2],[46,31,2],[16,32,3],[27,32,10],[42,32,2],[46,32,2],[16,33,2],[27,33,10]],"dot":[[16,22,2],[16,23,3],[17,24,3],[18,25,3],[42,25,4],[19,26,3],[42,26,4],[20,27,3],[42,27,4],[20,28,3],[42,28,4],[19,29,3],[18,30,3],[17,31,3],[27,31,10],[16,32,3],[27,32,10],[16,33,2],[27,33,10]],"bento":[[16,22,2],[42,22,5],[16,23,3],[41,23,7],[17,24,3],[40,24,3],[46,24,3],[18,25,3],[39,25,3],[47,25,3],[19,26,3],[39,26,2],[48,26,2],[20,27,3],[39,27,2],[44,27,3],[48,27,2],[20,28,3],[39,28,2],[44,28,3],[48,28,2],[19,29,3],[39,29,3],[44,29,6],[18,30,3],[40,30,3],[46,30,3],[17,31,3],[27,31,10],[41,31,7],[16,32,3],[27,32,10],[42,32,5],[16,33,2],[27,33,10]],"block":[[16,22,2],[16,23,3],[41,23,6],[17,24,3],[41,24,6],[18,25,3],[41,25,6],[19,26,3],[41,26,6],[20,27,3],[41,27,6],[20,28,3],[41,28,6],[19,29,3],[41,29,6],[18,30,3],[41,30,6],[17,31,3],[27,31,10],[41,31,6],[16,32,3],[27,32,10],[16,33,2],[27,33,10]],"half":[[16,22,2],[16,23,3],[17,24,3],[18,25,3],[19,26,3],[20,27,3],[40,27,9],[20,28,3],[39,28,11],[19,29,3],[39,29,11],[18,30,3],[40,30,9],[17,31,3],[27,31,10],[16,32,3],[27,32,10],[16,33,2],[27,33,10]],"shut":[[16,22,2],[16,23,3],[17,24,3],[18,25,3],[19,26,3],[20,27,3],[20,28,3],[39,28,11],[19,29,3],[39,29,11],[18,30,3],[17,31,3],[27,31,10],[16,32,3],[27,32,10],[16,33,2],[27,33,10]]};
  const C = jiroGrid._c || (jiroGrid._c = {});
  const key = eyes + '|' + k;
  if (C[key]) return C[key];
  let name = eyes || 'block', dx = 0;
  if (name === 'open') name = 'block';
  else if (name === 'glanceL') { name = 'block'; dx = -3; }
  else if (name === 'glanceR') { name = 'block'; dx = 3; }
  else if (name.indexOf(':') > 0) { const p = name.split(':'); name = p[0]; dx = +p[1] || 0; }
  const g = JB.map((r) => r.split('').map((c) => (c === '.' ? null : c)));
  (JF[name] || JF.block).forEach(([x, y, w]) => { for (let i = x; i < x + w; i++) { const xx = i + dx; if (g[y] && (g[y][xx] === 'W' || g[y][xx] === 'G')) g[y][xx] = 'F'; } });
  let out = g;
  if (k > 1) {
    const H = Math.ceil(g.length / k), W = Math.ceil(64 / k), PRI = { F: 4, K: 3, W: 2, G: 1 };
    out = Array.from({ length: H }, () => new Array(W).fill(null));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let best = null, n = 0, tot = 0;
      for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const v = g[y * k + j] && g[y * k + j][x * k + i]; if (v === undefined) continue; tot++; if (v) { n++; if (!best || PRI[v] > PRI[best]) best = v; } }
      if (best && n * 2 >= tot) out[y][x] = best === 'G' ? 'W' : best;
    }
  }
  C[key] = out;
  return out;
}
function jiroPx(pal) {
  const COL = { K: pal.K || '#1D3B2A', W: pal.W || '#FAF8F2', G: pal.G || '#E2DDCF', F: pal.F || '#FB5E45' };
  return (pos, eyes, s, opts) => {
    opts = opts || {};
    let u = s * 0.4, k = 1;
    if (u >= 1) u = Math.round(u); else { k = Math.max(2, Math.round(1 / u)); u = 1; }
    let g = jiroGrid(eyes, k).map((r) => r.slice());
    if (opts.faceOnly) g = g.map((r) => r.map((v) => (v === 'F' ? v : null)));
    if (opts.outline) {
      const H = g.length + 2, W = g[0].length + 2;
      const p = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (g[y - 1] && g[y - 1][x - 1]) || null));
      const ring = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!p[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => p[y + b] && p[y + b][x + a])) ring.push([x, y]);
      ring.forEach(([x, y]) => { p[y][x] = 'O'; });
      g = p;
    }
    let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
    g.forEach((r, y) => r.forEach((v, x) => { if (v) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); } }));
    const bw = (maxx - minx + 1) * u, bh = (maxy - miny + 1) * u;
    let ox, oy, base;
    if (opts.box) { ox = Math.round((opts.box[0] - bw) / 2) - minx * u; oy = Math.round((opts.box[1] - bh) / 2) - miny * u; base = null; }
    else if (opts.tight) { ox = -minx * u; oy = -miny * u; base = null; }
    else { ox = Math.round(16 * s - bw / 2) - minx * u; base = Math.round(29 * s); oy = base - bh - miny * u; }
    const lift = Math.round(pos * 2 * u);
    const out = [];
    const col = (v) => (v === 'O' ? opts.outline : COL[v]);
    g.forEach((r, y) => { let x = 0; while (x < r.length) { const v = r[x]; if (!v) { x++; continue; } let e = x + 1; while (e < r.length && r[e] === v) e++; out.push({ l: ox + x * u, t: oy + y * u - lift, w: (e - x) * u, h: u, c: col(v) }); x = e; } });
    if (base !== null && !opts.noShadow && pal.SH) {
      const cx = ox + 31 * u * (k > 1 ? 1 / k : 1) + (opts.outline ? u : 0);
      [[18 - 3 * pos, 1], [13 - 3 * pos, 2]].forEach(([hw, i]) => { const w = hw * 2 * u / (k > 1 ? k : 1); out.push({ l: Math.round(cx - w / 2), t: base + i * u, w: Math.round(w), h: u, c: pal.SH[pos] }); });
    }
    return out;
  };
}
  const api = { jiroGrid, jiroPx, jiroArt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.JiroPixels = api;
})(typeof window !== 'undefined' ? window : globalThis);
