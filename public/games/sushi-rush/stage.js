'use strict';
/*
 * Sushi Rush runner world: a layered, parallax pixel-art sushi bar.
 * Overrides ART.runnerBg, ART.runnerGround, ART.gap and ART.sprite (runner obstacles).
 * Layers (back to front, parallax rate vs g.dist): wall + fuda menu + noren doorway (0.08),
 * sake shelves (0.2), paper lanterns with glow (0.34), Jiro's counter + seated diners (0.55),
 * then the conveyor belt and hinoki counter edge (1.0). Static layers are cached offscreen.
 * Lighting mood follows o.rush.stage: evening -> dusk -> late night -> neon (shifts after each boss).
 */
(function () {
  const SC = Math.min(2, window.devicePixelRatio || 1);
  const OL = '#120d0a';
  const JP = '"Shippori Mincho B1", "Hiragino Mincho ProN", serif';

  // ---------- helpers ----------
  const R = (c, x, y, w, h, col) => { if (col) c.fillStyle = col; c.fillRect(x, y, w, h); };
  function mk(w, h, fn) {
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * SC); cv.height = Math.ceil(h * SC);
    const c = cv.getContext('2d'); c.scale(SC, SC); c.imageSmoothingEnabled = false;
    fn(c, w, h);
    return { c: cv, w, h };
  }
  // Pixel disc / ellipse built from horizontal runs.
  function pdisc(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    for (let dy = -ry; dy < ry; dy++) {
      const t = (dy + 0.5) / ry, hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
      if (hw > 0) c.fillRect(cx - hw, cy + dy, hw * 2, 1);
    }
  }
  function tile(ctx, img, rate, dist, W) {
    const w = img.w; let x = -Math.round((dist * rate) % w); if (x > 0) x -= w;
    for (; x < W; x += w) ctx.drawImage(img.c, x, 0, w, img.h);
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixA = (A, B, t) => A.map((v, i) => lerp(v, B[i], t));
  const rgba = (a) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${a[3].toFixed(3)})`;
  const rgb = (a) => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;

  // ---------- lighting moods ----------
  const MOODS = [
    { shade: [10, 6, 4, 0.0], tint: [255, 150, 70, 0.07], glow: [255, 176, 96], glowA: 0.55, sky: [[246, 178, 98], [226, 110, 52], [150, 60, 40], [70, 32, 30]], neon: 0 },
    { shade: [14, 8, 14, 0.12], tint: [210, 90, 70, 0.08], glow: [255, 150, 80], glowA: 0.62, sky: [[178, 84, 88], [112, 48, 72], [60, 30, 58], [30, 20, 40]], neon: 0 },
    { shade: [6, 8, 24, 0.3], tint: [50, 60, 140, 0.1], glow: [255, 162, 80], glowA: 0.78, sky: [[34, 42, 84], [22, 28, 60], [14, 18, 40], [10, 12, 28]], neon: 0.15 },
    { shade: [16, 4, 26, 0.32], tint: [150, 40, 160, 0.1], glow: [255, 96, 170], glowA: 0.8, sky: [[70, 22, 86], [44, 16, 66], [26, 12, 44], [14, 8, 28]], neon: 1 },
  ];
  const moodFor = (stage) => (stage <= 1 ? 0 : stage <= 2 ? 1 : stage <= 5 ? 2 : 3);
  let moodF = 0, lastNow = 0, flare = 0, flick = 0, lastRush = null;
  EVT.on('bossWin', () => { flare = 1.6; });
  EVT.on('stage', () => { flick = 0.7; });
  EVT.on('start', () => { moodF = 0; });

  function curMood() {
    const i = Math.min(MOODS.length - 2, Math.floor(moodF)), f = moodF - i, A = MOODS[i], B = MOODS[i + 1];
    return {
      shade: mixA(A.shade, B.shade, f), tint: mixA(A.tint, B.tint, f), glowA: lerp(A.glowA, B.glowA, f),
      sky: A.sky.map((s, k) => mixA(s, B.sky[k], f)), neon: lerp(A.neon, B.neon, f), i, f,
    };
  }

  // ---------- cached layers ----------
  const FUDA = ['鮪', 'とろ', '鮭', '鯛', '海老', '雲丹', '烏賊', '玉子', '鯵', '鰤', '穴子', '蛸', 'いくら', '帆立', '鰻', '鯖', '赤貝', '河豚'];
  let C = null;
  function fontsChanged() { C = null; }
  if (document.fonts && document.fonts.load) {
    const txt = FUDA.join('') + '寿司鮨すしOPEN';
    Promise.all([document.fonts.load(`800 12px ${JP}`, txt), document.fonts.load('10px Silkscreen', 'OPEN')]).then(fontsChanged, () => {});
  }

  const DOOR_X = 704, DOOR_Y = 60, DOOR_W = 96, DOOR_H = 96;

  function buildWall() {
    return mk(960, 256, (c, W) => {
      const r = mulberry32(7);
      R(c, 0, 0, W, 256, '#231a14');
      for (let x = 0; x < W; x += 20) {
        R(c, x, 10, 20, 246, ['#281d16', '#2b2019', '#251b15'][Math.floor(r() * 3)]);
        R(c, x, 10, 1, 246, '#170f0b');
        R(c, x + 1, 10, 1, 246, '#30241c');
        for (let k = 0; k < 7; k++) R(c, x + 3 + Math.floor(r() * 15), 12 + Math.floor(r() * 230), 1, 5 + Math.floor(r() * 16), '#1f1611');
        if (r() < 0.3) { const ky = 20 + Math.floor(r() * 200); R(c, x + 7, ky, 5, 3, '#1c140f'); R(c, x + 8, ky + 1, 3, 1, '#140e0b'); }
      }
      // ceiling beam
      R(c, 0, 0, W, 9, '#1b1410'); R(c, 0, 8, W, 1, '#3a2a1f'); R(c, 0, 9, W, 2, OL);
      for (let x = 30; x < W; x += 120) R(c, x, 3, 2, 2, '#4a3526');
      // wainscot rail + lower panels
      R(c, 0, 158, W, 98, '#1d1510');
      for (let x = 0; x < W; x += 48) R(c, x, 161, 1, 95, '#150f0c');
      R(c, 0, 156, W, 3, '#4a3526'); R(c, 0, 156, W, 1, '#6b4a30'); R(c, 0, 159, W, 2, OL);
      // fuda menu tags on a batten
      R(c, 0, 44, W, 2, '#4a3526'); R(c, 0, 46, W, 1, '#150f0c');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      let n = 0;
      for (const gx of [18, 410]) {
        for (let i = 0; i < 9; i++, n++) {
          const x = gx + i * 17, y = 47, word = FUDA[n % FUDA.length];
          R(c, x - 1, y - 1, 15, 40, OL);
          R(c, x, y, 13, 38, '#c9ab7c'); R(c, x, y, 13, 1, '#e0c597'); R(c, x + 12, y, 1, 38, '#a88b60');
          c.fillStyle = '#231a14';
          const chars = [...word], fs = chars.length > 2 ? 7 : 9;
          c.font = `800 ${fs}px ${JP}`;
          chars.forEach((ch, k) => c.fillText(ch, x + 6.5, y + 6 + k * (fs + 1)));
          R(c, x + 5, y + 33, 3, 3, '#c8321e');
        }
      }
      // mounting plate for the neon sign (x 212..372, y 58..100)
      for (const [sx, sy] of [[214, 60], [368, 60], [214, 96], [368, 96]]) R(c, sx, sy, 2, 2, '#4a3526');
      // doorway frame + noren (hole is transparent; the outside is drawn per frame)
      const dx = DOOR_X, dy = DOOR_Y;
      R(c, dx - 8, dy - 8, DOOR_W + 16, DOOR_H + 12, OL);
      R(c, dx - 7, dy - 7, DOOR_W + 14, 5, '#5a4030'); R(c, dx - 7, dy - 7, DOOR_W + 14, 1, '#7a5a40');
      R(c, dx - 7, dy - 2, 5, DOOR_H + 6, '#5a4030'); R(c, dx + DOOR_W + 2, dy - 2, 5, DOOR_H + 6, '#4a3526');
      c.clearRect(dx, dy, DOOR_W, DOOR_H - 4);
      R(c, dx - 2, dy, DOOR_W + 4, 3, '#8a6a45'); R(c, dx - 2, dy, DOOR_W + 4, 1, '#b8955f');
      for (let p = 0; p < 3; p++) {
        const px = dx + 1 + p * 32, pw = 30;
        R(c, px, dy + 3, pw, 34, '#2b4486'); R(c, px, dy + 3, pw, 2, '#223a78');
        R(c, px, dy + 33, pw, 4, '#1e3166');
        R(c, px + pw - 1, dy + 3, 1, 34, '#223a78');
        for (let k = 0; k < 4; k++) R(c, px + 3 + k * 7, dy + 30, 3, 1, '#4a64a8');
      }
      // crest: white ring with 寿 spanning the middle panel
      pdisc(c, dx + DOOR_W / 2, dy + 18, 9, 9, '#f4ead7');
      pdisc(c, dx + DOOR_W / 2, dy + 18, 7, 7, '#2b4486');
      c.fillStyle = '#f4ead7'; c.font = `800 11px ${JP}`; c.fillText('寿', dx + DOOR_W / 2, dy + 19);
      c.font = `800 9px ${JP}`; c.fillText('す', dx + 16, dy + 18); c.fillText('し', dx + DOOR_W - 15, dy + 18);
    });
  }

  function bottle(c, r, x, base) {
    const kind = r();
    if (kind < 0.45) { // isshobin
      const col = ['#23402a', '#4a2a18', '#1f2f4a', '#3b2414', '#2a3a2a'][Math.floor(r() * 5)];
      const h = 30 + Math.floor(r() * 6), top = base - h;
      R(c, x - 1, top + 5, 12, h - 5, OL); R(c, x + 2, top - 8, 6, 14, OL);
      R(c, x, top + 6, 10, h - 6, col); R(c, x + 1, top + 4, 8, 2, col); R(c, x + 3, top - 5, 4, 9, col);
      R(c, x + 3, top - 7, 4, 3, r() < 0.5 ? '#c8321e' : '#d9a441');
      R(c, x + 1, top + 7, 1, h - 10, 'rgba(255,240,210,.28)');
      const lc = r() < 0.6 ? '#f4ead7' : '#e8cd9c';
      R(c, x + 1, top + 12, 8, 12, lc); R(c, x + 4, top + 14, 2, 8, '#231a14');
      if (r() < 0.5) R(c, x + 1, top + 12, 8, 2, '#c8321e');
      return 12;
    }
    if (kind < 0.62) { // tokkuri
      R(c, x - 1, base - 15, 10, 15, OL); R(c, x + 2, base - 19, 4, 5, OL);
      R(c, x, base - 14, 8, 14, '#e9dfcc'); R(c, x + 3, base - 18, 2, 5, '#e9dfcc');
      R(c, x, base - 8, 8, 2, '#2b4486'); R(c, x + 6, base - 14, 2, 14, '#cbbca3');
      return 10;
    }
    if (kind < 0.74) { // stacked cups
      for (let k = 0; k < 3; k++) { R(c, x - 1, base - 5 - k * 5, 9, 5, OL); R(c, x, base - 4 - k * 5, 7, 3, k % 2 ? '#2b4486' : '#e9dfcc'); }
      return 9;
    }
    if (kind < 0.86) { // round jar
      pdisc(c, x + 7, base - 7, 8, 7, OL); pdisc(c, x + 7, base - 7, 7, 6, '#6b3d22');
      R(c, x + 3, base - 12, 3, 4, '#8a5a36'); R(c, x + 3, base - 16, 8, 3, OL); R(c, x + 4, base - 15, 6, 2, '#3a2a1f');
      return 16;
    }
    // maneki-neko
    R(c, x - 1, base - 15, 13, 15, OL);
    R(c, x, base - 14, 11, 14, '#f4ead7'); R(c, x, base - 16, 2, 2, OL); R(c, x + 9, base - 16, 2, 2, OL);
    R(c, x + 10, base - 20, 3, 6, OL); R(c, x + 11, base - 19, 1, 5, '#f4ead7');
    R(c, x, base - 8, 11, 1, '#c8321e'); R(c, x + 5, base - 7, 1, 2, '#d9a441');
    R(c, x + 2, base - 12, 1, 1, OL); R(c, x + 8, base - 12, 1, 1, OL);
    R(c, x + 9, base - 14, 2, 14, '#cbbca3');
    return 14;
  }

  function buildShelves() {
    return mk(720, 256, (c) => {
      const r = mulberry32(21);
      for (const [sx, sw] of [[16, 250], [330, 170], [560, 140]]) {
        for (const sy of [104, 148]) {
          let x = sx + 5;
          while (x < sx + sw - 16) x += bottle(c, r, x, sy) + 2 + Math.floor(r() * 5);
          R(c, sx, sy, sw, 5, '#6b4a30'); R(c, sx, sy, sw, 1, '#9a7048'); R(c, sx, sy + 5, sw, 2, OL);
          R(c, sx + 8, sy + 5, 3, 6, '#4a3526'); R(c, sx + sw - 11, sy + 5, 3, 6, '#4a3526');
        }
      }
    });
  }

  function jiroMini(c, x, y) {
    // copper dome with rivet seam
    const rows = [8, 12, 14, 16, 16, 16, 16, 16];
    rows.forEach((w, i) => { R(c, x + 8 - w / 2 - 1, y + i, w + 2, 1, OL); });
    R(c, x - 1, y + 8, 18, 12, OL);
    rows.forEach((w, i) => { R(c, x + 8 - w / 2, y + i + 1, w, 1, '#c77a3a'); R(c, x + 8 + w / 2 - 3, y + i + 1, 3, 1, '#9a5526'); });
    R(c, x + 3, y + 3, 2, 2, '#f0a868');
    for (let i = 2; i < 8; i += 2) R(c, x + 8, y + i, 1, 1, '#f0b070');
    // hachimaki
    R(c, x - 1, y + 8, 18, 3, '#f4ead7'); R(c, x + 17, y + 9, 3, 1, '#f4ead7'); R(c, x + 17, y + 11, 2, 1, '#f4ead7');
    // faceplate, cyan eyes, speaker grille dots
    R(c, x + 1, y + 11, 14, 8, '#f4ead7'); R(c, x + 1, y + 18, 14, 1, '#cbbca3');
    R(c, x + 4, y + 13, 2, 2, '#5ff3ff'); R(c, x + 10, y + 13, 2, 2, '#5ff3ff');
    R(c, x + 6, y + 16, 1, 1, '#3a2a1f'); R(c, x + 8, y + 16, 1, 1, '#3a2a1f'); R(c, x + 10, y + 16, 1, 1, '#3a2a1f');
    // indigo striped happi + copper arms
    R(c, x - 4, y + 19, 24, 16, OL);
    R(c, x - 3, y + 20, 22, 15, '#2b4486');
    for (let i = -1; i < 20; i += 3) R(c, x + i, y + 20, 1, 15, '#3d5aa8');
    R(c, x + 5, y + 20, 6, 3, '#f4ead7'); R(c, x + 6, y + 23, 4, 2, '#f4ead7');
    R(c, x - 6, y + 23, 3, 10, OL); R(c, x - 5, y + 24, 2, 9, '#c77a3a');
    R(c, x + 19, y + 23, 3, 10, OL); R(c, x + 19, y + 24, 2, 9, '#9a5526');
  }

  function netaCase(c, x, w) {
    const y = 186;
    R(c, x - 1, y - 1, w + 2, 20, OL);
    R(c, x, y, w, 18, '#23302f');
    const fish = [['#c8321e', '#8e1325'], ['#ff7b4f', '#f4ead7'], ['#f4ead7', '#cbbca3'], ['#ff9a5c', '#f4ead7'], ['#e0485a', '#a82a18'], ['#d9a441', '#8a5a00']];
    for (let k = 0, fx = x + 4; fx < x + w - 14; k++, fx += 14) {
      const [a, b] = fish[k % fish.length];
      R(c, fx, y + 9, 11, 7, OL); R(c, fx + 1, y + 10, 9, 5, a); R(c, fx + 1, y + 10, 9, 1, b);
      if (k % 2) for (let s = 2; s < 9; s += 3) R(c, fx + s, y + 11, 1, 3, b);
    }
    R(c, x + 1, y + 1, w - 2, 1, 'rgba(255,245,220,.35)');
    for (let i = 0; i < 6; i++) R(c, x + 6 + i, y + 2 + i, 1, 1, 'rgba(255,245,220,.25)');
    R(c, x, y + 17, w, 2, '#8a6a45');
  }

  function diner(c, r, x) {
    const hair = '#0c0806', rim = '#7a5236';
    const cloth = ['#1e2236', '#2c1a15', '#22261b', '#2a2320'][Math.floor(r() * 4)];
    // stool
    R(c, x - 9, 236, 18, 3, '#2a1f18'); R(c, x - 9, 236, 18, 1, '#4a3526'); R(c, x - 1, 239, 3, 17, '#1b1410');
    // body (back view) with warm rim light from the lanterns
    R(c, x - 12, 209, 24, 28, OL); R(c, x - 13, 214, 26, 20, OL);
    R(c, x - 11, 210, 22, 26, cloth); R(c, x - 12, 215, 24, 18, cloth);
    R(c, x - 10, 210, 20, 1, rim); R(c, x - 12, 214, 1, 6, rim);
    R(c, x - 1, 213, 2, 22, 'rgba(0,0,0,.25)');
    // neck + head
    R(c, x - 3, 206, 6, 4, '#3a2a1f');
    pdisc(c, x, 200, 8, 9, OL); pdisc(c, x, 200, 7, 8, hair);
    R(c, x - 3, 192, 6, 1, rim); R(c, x - 5, 193, 2, 1, rim); R(c, x + 3, 193, 2, 1, rim); R(c, x - 7, 196, 1, 3, rim);
    const v = r();
    if (v < 0.3) { pdisc(c, x, 190, 4, 3, OL); pdisc(c, x, 190, 3, 3, hair); R(c, x - 1, 187, 2, 1, rim); }  // hair bun
    else if (v < 0.55) { R(c, x - 9, 195, 18, 3, OL); R(c, x - 7, 190, 14, 6, OL); R(c, x - 6, 191, 12, 5, '#3a2a1f'); R(c, x - 6, 191, 12, 1, rim); } // cap
    else if (v < 0.75) { R(c, x - 11, 210, 22, 3, '#2b4486'); R(c, x - 11, 210, 22, 1, '#4a64a8'); }               // scarf
  }

  function buildCounter() {
    return mk(1280, 256, (c, W) => {
      const r = mulberry32(99);
      // behind the counter: Jiro and a helper robot shelf of plates
      jiroMini(c, 548, 170);
      jiroMini(c, 1160, 170);
      // back counter
      netaCase(c, 60, 104); netaCase(c, 420, 84); netaCase(c, 700, 120); netaCase(c, 1030, 96);
      for (const tx of [250, 612, 900, 1212]) { // yunomi + tokkuri on the counter
        R(c, tx - 1, 193, 10, 11, OL); R(c, tx, 194, 8, 10, '#5e7d3e'); R(c, tx, 197, 8, 1, '#a6c94a');
        R(c, tx + 14, 191, 8, 13, OL); R(c, tx + 15, 192, 6, 12, '#e9dfcc'); R(c, tx + 16, 188, 4, 4, OL); R(c, tx + 17, 189, 2, 3, '#e9dfcc');
      }
      for (const px of [330, 980]) for (let k = 0; k < 4; k++) { R(c, px - 1, 200 - k * 3, 20, 3, OL); R(c, px, 200 - k * 3, 18, 2, ['#c8321e', '#2b4486', '#e0a526', '#f4ead7'][k]); }
      R(c, 0, 204, W, 4, '#a88b60'); R(c, 0, 204, W, 1, '#d4b47f'); R(c, 0, 208, W, 1, OL);
      R(c, 0, 209, W, 47, '#1f1712');
      for (let x = 0; x < W; x += 32) { R(c, x, 209, 1, 47, '#17110d'); R(c, x + 1, 209, 1, 47, '#261c16'); }
      R(c, 0, 250, W, 6, '#17110d');
      // seated diners (backs to us), in small groups
      let x = 40;
      while (x < W - 30) {
        const n = 1 + Math.floor(r() * 3);
        for (let k = 0; k < n && x < W - 30; k++, x += 30) diner(c, r, x);
        x += 60 + Math.floor(r() * 90);
      }
    });
  }

  function buildLantern() {
    return mk(26, 42, (c) => {
      R(c, 7, 0, 12, 4, OL); R(c, 8, 1, 10, 2, '#3a2a1f');
      const cy = 17, ry = 13;
      for (let dy = -ry; dy < ry; dy++) {
        const t = (dy + 0.5) / ry, hw = Math.max(6, Math.round(12 * Math.sqrt(Math.max(0, 1 - t * t))));
        R(c, 13 - hw - 1, cy + dy + 4 - 13 + 13, hw * 2 + 2, 1, OL);
      }
      for (let dy = -ry + 1; dy < ry - 1; dy++) {
        const t = (dy + 0.5) / ry, hw = Math.max(5, Math.round(12 * Math.sqrt(Math.max(0, 1 - t * t))) - 1);
        const y = cy + dy + 4;
        R(c, 13 - hw, y, hw * 2, 1, (dy + 13) % 4 === 0 ? '#9a2414' : '#c8321e');
        R(c, 13 - hw + 1, y, 2, 1, (dy + 13) % 4 === 0 ? '#c8321e' : '#e2482f');
        R(c, 13 + hw - 3, y, 3, 1, '#8a1e10');
      }
      c.fillStyle = '#1b1410'; c.font = `800 12px ${JP}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('鮨', 13, 21);
      R(c, 7, 34, 12, 4, OL); R(c, 8, 35, 10, 2, '#3a2a1f');
      R(c, 12, 38, 2, 4, '#c8321e');
    });
  }

  function buildGlow(col) {
    return mk(160, 160, (c) => {
      const g = c.createRadialGradient(80, 80, 0, 80, 80, 80);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.9)`);
      g.addColorStop(0.25, `rgba(${col[0]},${col[1]},${col[2]},0.35)`);
      g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      c.fillStyle = g; c.fillRect(0, 0, 160, 160);
    });
  }

  function buildNeon(lit) {
    return mk(170, 50, (c) => {
      const pink = lit ? '#ff5fa8' : '#4a3a3a', cyan = lit ? '#5ff3ff' : '#3e4446';
      if (lit) { c.shadowBlur = 8; }
      c.lineWidth = 2; c.strokeStyle = pink; c.shadowColor = pink;
      c.beginPath(); c.roundRect(4, 4, 162, 42, 8); c.stroke();
      c.fillStyle = cyan; c.shadowColor = cyan; c.font = `800 28px ${JP}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('寿司', 60, 26);
      c.fillStyle = pink; c.shadowColor = pink; c.font = '12px Silkscreen'; c.fillText('OPEN', 128, 26);
      if (lit) { c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.55)'; c.font = `800 28px ${JP}`; c.fillText('寿司', 60, 26); }
    });
  }

  function buildHinoki() {
    return mk(320, 23, (c, W) => {
      const r = mulberry32(3);
      R(c, 0, 0, W, 23, '#e8cd9c'); R(c, 0, 0, W, 1, '#f8e8c4'); R(c, 0, 1, W, 1, '#f0dab0');
      for (let k = 0; k < 16; k++) {
        const y = 3 + Math.floor(r() * 15), x = Math.floor(r() * W), l = 20 + Math.floor(r() * 70);
        R(c, x, y, l, 1, '#d6b682'); if (x + l > W) R(c, 0, y, x + l - W, 1, '#d6b682');
        R(c, x + 6, y + 1, Math.floor(l / 2), 1, '#dfc28f');
      }
      R(c, 140, 10, 5, 3, '#c9a56f'); R(c, 141, 11, 3, 1, '#b28a55');
      R(c, 0, 18, W, 1, '#cfae78'); R(c, 0, 19, W, 4, '#b8955f');
    });
  }

  function caches() {
    if (C) return C;
    C = {
      wall: buildWall(), shelves: buildShelves(), counter: buildCounter(), lantern: buildLantern(),
      glows: MOODS.map((m) => buildGlow(m.glow)), neonOff: buildNeon(false), neonOn: buildNeon(true), hinoki: buildHinoki(),
    };
    return C;
  }

  // ---------- background ----------
  function applyTheme(g) {
    if (g._stageThemed) return;
    g._stageThemed = true;
    Object.assign(g.theme, { sky: '#120d0a', ground: '#1b1410', line: '#d9d3ca', text: '#f4ead7', deco: true });
  }

  function runnerBg(g, ctx) {
    applyTheme(g);
    const K = caches(), W = g.W, d = g.dist;
    const now = performance.now() / 1000, dt = lastNow ? Math.min(0.1, now - lastNow) : 0; lastNow = now;
    const rush = g.o && g.o.rush;
    if (rush !== lastRush) { lastRush = rush; if (rush) moodF = moodFor(rush.stage); }
    const target = rush ? moodFor(rush.stage) : 0;
    moodF += clamp(target - moodF, -dt * 0.8, dt * 0.8);
    flare = Math.max(0, flare - dt); flick = Math.max(0, flick - dt);
    const M = curMood();
    g._mood = M;

    // outside through the doorway (behind the wall layer)
    const wr = 0.08, ww = K.wall.w;
    let wx = -Math.round((d * wr) % ww); if (wx > 0) wx -= ww;
    for (let x = wx; x < W; x += ww) {
      const dx = x + DOOR_X; if (dx > W || dx + DOOR_W < 0) continue;
      const bands = [DOOR_Y, DOOR_Y + 30, DOOR_Y + 50, DOOR_Y + 66, DOOR_Y + DOOR_H];
      for (let b = 0; b < 4; b++) R(ctx, dx, bands[b], DOOR_W, bands[b + 1] - bands[b], rgb(M.sky[b]));
      if (M.i >= 1) { // stars / distant signs
        ctx.fillStyle = `rgba(244,234,215,${clamp(moodF - 1, 0, 1) * 0.8})`;
        ctx.fillRect(dx + 60, DOOR_Y + 40, 1, 1); ctx.fillRect(dx + 80, DOOR_Y + 46, 1, 1); ctx.fillRect(dx + 20, DOOR_Y + 44, 1, 1);
      }
      // street silhouette
      R(ctx, dx, DOOR_Y + 70, 30, 26, '#140e0b'); R(ctx, dx + 34, DOOR_Y + 62, 26, 34, '#140e0b'); R(ctx, dx + 64, DOOR_Y + 74, 32, 22, '#140e0b');
      const lit = clamp(moodF - 1, 0, 1.5) / 1.5;
      if (lit > 0) {
        ctx.fillStyle = M.neon > 0.5 ? `rgba(255,95,168,${lit})` : `rgba(255,190,110,${lit})`;
        ctx.fillRect(dx + 38, DOOR_Y + 68, 3, 3); ctx.fillRect(dx + 48, DOOR_Y + 68, 3, 3); ctx.fillRect(dx + 70, DOOR_Y + 80, 3, 3);
        ctx.fillStyle = M.neon > 0.5 ? `rgba(95,243,255,${lit})` : `rgba(255,190,110,${lit * 0.7})`;
        ctx.fillRect(dx + 44, DOOR_Y + 78, 3, 3); ctx.fillRect(dx + 8, DOOR_Y + 76, 3, 3); ctx.fillRect(dx + 82, DOOR_Y + 86, 3, 3);
      }
    }
    tile(ctx, K.wall, wr, d, W);
    // neon sign on the wall (unlit until the neon mood)
    for (let x = wx; x < W; x += ww) {
      const nx = x + 206; if (nx > W || nx + 170 < 0) continue;
      ctx.drawImage(K.neonOff.c, nx, 54, 170, 50);
      let on = clamp((moodF - 2), 0, 1);
      if (flick > 0 && on > 0) on *= (Math.floor(flick * 20) % 3) ? 1 : 0.2;
      if (on > 0) { ctx.globalAlpha = on; ctx.drawImage(K.neonOn.c, nx, 54, 170, 50); ctx.globalAlpha = 1; }
    }
    tile(ctx, K.shelves, 0.2, d, W);

    // lanterns and their glow
    const lr = 0.34, span = 220;
    const off = (d * lr) % span;
    const flareK = flare > 0 ? Math.min(1, flare) * 0.6 : 0;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = -1; i * span - off < W + span; i++) {
      const lx = Math.round(i * span - off + 60);
      const idx = Math.floor((d * lr) / span) + i;
      const fl = 0.92 + 0.08 * Math.sin(now * 7 + idx * 1.7) * Math.sin(now * 3.1 + idx);
      const a = (M.glowA + flareK) * fl;
      ctx.globalAlpha = a * (1 - M.f); ctx.drawImage(K.glows[M.i].c, lx - 80 + 13, 38 - 80, 160, 160);
      if (M.f > 0) { ctx.globalAlpha = a * M.f; ctx.drawImage(K.glows[M.i + 1].c, lx - 80 + 13, 38 - 80, 160, 160); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    tile(ctx, K.counter, 0.55, d, W);

    // mood shade + tint over the whole backdrop
    if (M.shade[3] > 0.005) { ctx.fillStyle = rgba(M.shade); ctx.fillRect(0, 0, W, g.ground); }
    ctx.fillStyle = rgba(M.tint); ctx.fillRect(0, 0, W, g.ground);

    // lanterns on top of the shade so they stay lit
    for (let i = -1; i * span - off < W + span; i++) {
      const lx = Math.round(i * span - off + 60);
      const idx = Math.floor((d * lr) / span) + i;
      const sway = Math.round(Math.sin(now * 1.3 + idx * 2.1) * 1);
      R(ctx, lx + 13, 11, 1, 14, '#3a2a1f');
      ctx.drawImage(K.lantern.c, lx + sway, 24, 26, 42);
      if (flareK > 0) { ctx.globalAlpha = flareK * 0.5; R(ctx, lx + sway + 4, 30, 18, 26, '#ffd9a0'); ctx.globalAlpha = 1; }
    }
    // soft warm spill along the counter top
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${M.neon > 0.5 ? '120,40,90' : '90,50,20'},${0.10 + flareK * 0.2})`;
    ctx.fillRect(0, 204, W, 2);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- belt + counter edge ----------
  function runnerGround(g, ctx) {
    applyTheme(g);
    const K = caches(), W = g.W, H = g.H, gy = g.ground, d = g.dist;
    R(ctx, 0, gy, W, H - gy, OL);
    // top rail
    R(ctx, 0, gy, W, 3, '#a39c93'); R(ctx, 0, gy + 2, W, 1, '#7d766e'); R(ctx, 0, gy + 3, W, 1, '#3a342f');
    // slats (move with the world)
    R(ctx, 0, gy + 4, W, 12, '#231b17');
    const P = 16; let sx = -Math.round(d % P);
    for (let x = sx; x < W; x += P) {
      R(ctx, x, gy + 4, 1, 12, '#0b0806');
      R(ctx, x + 1, gy + 4, P - 2, 1, '#3a2e28');
      R(ctx, x + 1, gy + 5, 1, 10, '#2e241e');
      R(ctx, x + P - 3, gy + 8, 2, 4, '#1a1410');
    }
    // lower rail + shadow
    R(ctx, 0, gy + 16, W, 1, '#d9d3ca'); R(ctx, 0, gy + 17, W, 2, '#a39c93'); R(ctx, 0, gy + 19, W, 1, '#5b544e');
    for (let x = -Math.round(d % 64) + 8; x < W; x += 64) R(ctx, x, gy + 17, 2, 2, '#5b544e');
    R(ctx, 0, gy + 20, W, 1, '#0b0806');
    // hinoki counter edge
    ctx.save(); ctx.translate(0, gy + 21); tile(ctx, K.hinoki, 1, d, W); ctx.restore();
    // shading follows the mood, at half strength so the play field stays readable
    const M = g._mood;
    if (M && M.shade[3] > 0.005) { ctx.fillStyle = rgba([M.shade[0], M.shade[1], M.shade[2], M.shade[3] * 0.5]); ctx.fillRect(0, gy, W, H - gy); }
  }

  // ---------- gap in the belt ----------
  function gap(g, ctx, gp) {
    const gy = g.ground, H = g.H, x = Math.round(gp.x), w = Math.round(gp.w);
    R(ctx, x, gy - 1, w, H - gy + 1, '#070504');
    R(ctx, x, gy + 21, w, H - gy - 21, '#0e0a08');
    for (let k = 4; k < w - 4; k += 8) R(ctx, x + k, gy + 26, 4, 1, '#1b1410');
    // rail end caps
    for (const ex of [x - 3, x + w]) { R(ctx, ex, gy, 3, 20, '#5b544e'); R(ctx, ex, gy, 3, 1, '#d9d3ca'); R(ctx, ex + 1, gy + 1, 1, 18, '#a39c93'); }
    // hazard lip
    for (let k = 0; k < w; k += 6) R(ctx, x + k, gy + 21, 3, 2, '#c8321e');
  }

  // ---------- obstacles ----------
  const FISH_TOPS = { '#fddc69': 'tamago', '#f2f4f8': 'ika', '#e0485a': 'maguro', '#f47067': 'tai', '#ff8c5a': 'sake' };
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => clamp(Math.round(v * k), 0, 255);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  const shadeCache = {};
  const tone = (hex, k) => (shadeCache[hex + k] ||= shade(hex, k));

  function drawPlate(ctx, e, x, y) {
    const col = e.color || '#ff8c5a', kind = FISH_TOPS[col];
    const rim = { tamago: '#2b4486', ika: '#c8321e', maguro: '#e0a526', tai: '#2b4486', sake: '#c8321e' }[kind] || '#c8321e';
    // plate
    R(ctx, x + 7, y + 14, 20, 2, OL); R(ctx, x + 9, y + 14, 16, 1, '#8a7f72');
    R(ctx, x, y + 10, 34, 5, OL); R(ctx, x + 1, y + 11, 32, 3, '#f4ead7'); R(ctx, x + 1, y + 13, 32, 1, rim);
    R(ctx, x + 1, y + 11, 32, 1, '#fffaf0');
    // rice
    R(ctx, x + 5, y + 5, 24, 6, OL); R(ctx, x + 6, y + 6, 22, 4, '#f7f2e8'); R(ctx, x + 6, y + 9, 22, 1, '#dcd0b8');
    R(ctx, x + 9, y + 7, 1, 1, '#dcd0b8'); R(ctx, x + 16, y + 8, 1, 1, '#dcd0b8'); R(ctx, x + 23, y + 7, 1, 1, '#dcd0b8');
    // topping
    R(ctx, x + 3, y, 28, 7, OL); R(ctx, x + 2, y + 1, 30, 5, OL);
    R(ctx, x + 4, y + 1, 26, 5, col); R(ctx, x + 3, y + 2, 28, 3, col);
    R(ctx, x + 4, y + 5, 26, 1, tone(col, 0.78)); R(ctx, x + 5, y + 1, 22, 1, tone(col, 1.18));
    if (kind === 'sake' || kind === 'tai') for (let s = 7; s < 29; s += 5) { R(ctx, x + s, y + 2, 1, 1, '#fff1e4'); R(ctx, x + s - 1, y + 3, 1, 2, '#fff1e4'); }
    else if (kind === 'ika') for (let s = 7; s < 29; s += 4) R(ctx, x + s, y + 2, 1, 3, '#cfd6dc');
    else if (kind === 'tamago') { R(ctx, x + 14, y, 6, 11, OL); R(ctx, x + 15, y, 4, 10, '#1d2920'); R(ctx, x + 15, y + 1, 1, 8, '#3b4d3f'); }
    else if (kind === 'maguro') { R(ctx, x + 6, y + 2, 20, 1, '#f06a78'); }
  }

  function drawChop(ctx, x, y, h) {
    // hashioki rest (indigo ceramic) at the base
    R(ctx, x, y + h - 5, 14, 5, OL); R(ctx, x + 1, y + h - 4, 12, 3, '#2b4486'); R(ctx, x + 1, y + h - 4, 12, 1, '#4a64a8');
    // two chopsticks, slightly crossed
    const stick = (sx, top, lean) => {
      for (let yy = top; yy < y + h - 4; yy += 1) {
        const px = sx + Math.round(((yy - top) / (y + h - top)) * lean);
        R(ctx, px - 1, yy, 5, 1, OL);
      }
      for (let yy = top + 1; yy < y + h - 4; yy += 1) {
        const px = sx + Math.round(((yy - top) / (y + h - top)) * lean);
        const lac = yy < top + 13;
        R(ctx, px, yy, 3, 1, lac ? '#c8321e' : '#e8cd9c'); R(ctx, px + 2, yy, 1, 1, lac ? '#8e1325' : '#c9a871');
        if (yy === top + 13) R(ctx, px, yy, 3, 1, '#d9a441');
      }
    };
    stick(x + 2, y, 3);
    stick(x + 9, y + 2, -3);
  }

  function drawSoy(ctx, x, y) {
    // red cap with spout
    R(ctx, x + 4, y, 10, 8, OL); R(ctx, x + 5, y + 1, 8, 6, '#c8321e'); R(ctx, x + 5, y + 1, 2, 6, '#e2482f');
    R(ctx, x + 2, y + 2, 3, 2, OL); R(ctx, x + 3, y + 2, 2, 1, '#c8321e');
    R(ctx, x + 5, y + 6, 8, 1, '#8e1325');
    // glass neck + body
    R(ctx, x + 5, y + 7, 8, 5, OL); R(ctx, x + 6, y + 7, 6, 5, '#3a1d12');
    R(ctx, x + 1, y + 12, 16, 22, OL); R(ctx, x, y + 15, 18, 18, OL);
    R(ctx, x + 2, y + 13, 14, 20, '#2a130b'); R(ctx, x + 1, y + 16, 16, 16, '#2a130b');
    R(ctx, x + 2, y + 14, 1, 17, '#7a4a2a'); R(ctx, x + 3, y + 13, 1, 3, '#e9dfcc'); R(ctx, x + 3, y + 17, 1, 8, 'rgba(244,234,215,.55)');
    R(ctx, x + 14, y + 16, 2, 15, '#1a0b06');
    // label
    R(ctx, x + 4, y + 19, 10, 7, '#f4ead7'); R(ctx, x + 4, y + 25, 10, 1, '#cbbca3');
    R(ctx, x + 7, y + 20, 4, 4, '#c8321e'); R(ctx, x + 8, y + 21, 2, 2, '#f4ead7');
    R(ctx, x + 2, y + 33, 14, 1, '#140906');
  }

  function drawFish(ctx, e, g, x, y) {
    const w = 34, h = 16;
    // shadow on the belt + speed streaks: tells the player "this is in the air, duck"
    const gy = g.ground;
    ctx.globalAlpha = 0.45; R(ctx, x + 4, gy + 5, 26, 3, '#000'); R(ctx, x + 8, gy + 4, 18, 1, '#000'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.5;
    for (const [sy, l] of [[y + 4, 10], [y + 8, 16], [y + 12, 8]]) R(ctx, x + w + 3, sy, l, 1, '#f4ead7');
    ctx.globalAlpha = 1;
    const flap = Math.floor(e.t * 16) % 2;
    // tail (forked)
    R(ctx, x + 26, y + 3, 3, 10, OL); R(ctx, x + 28, y + 1, 5, 5, OL); R(ctx, x + 28, y + 10, 5, 5, OL);
    R(ctx, x + 29, y + 2, 3, 3, '#4a64a8'); R(ctx, x + 29, y + 11, 3, 3, '#4a64a8'); R(ctx, x + 27, y + 5, 2, 6, '#2b4486');
    // body
    R(ctx, x + 3, y + 5, 24, 7, OL); R(ctx, x + 1, y + 6, 27, 5, OL);
    R(ctx, x + 4, y + 6, 22, 2, '#2b4486'); R(ctx, x + 2, y + 7, 25, 1, '#2b4486');
    R(ctx, x + 2, y + 8, 25, 2, '#cfd8e0'); R(ctx, x + 4, y + 10, 21, 1, '#9fb0c0');
    R(ctx, x + 7, y + 8, 18, 1, '#f4ead7');
    // eye
    R(ctx, x + 4, y + 6, 3, 3, '#f4ead7'); R(ctx, x + 5, y + 7, 1, 1, OL);
    // big wing-fins (flap)
    if (flap) {
      R(ctx, x + 9, y, 16, 6, OL); R(ctx, x + 10, y + 1, 14, 4, '#8fd3e8'); for (let k = 0; k < 4; k++) R(ctx, x + 12 + k * 3, y + 1, 1, 4, '#5ab3cc');
    } else {
      R(ctx, x + 9, y + 10, 16, 6, OL); R(ctx, x + 10, y + 11, 14, 4, '#8fd3e8'); for (let k = 0; k < 4; k++) R(ctx, x + 12 + k * 3, y + 11, 1, 4, '#5ab3cc');
      R(ctx, x + 11, y + 2, 12, 3, OL); R(ctx, x + 12, y + 3, 10, 2, '#8fd3e8');
    }
  }

  function drawKnife(ctx, x, y, w, h) {
    const bl = w - 22;
    for (let k = 0; k < h; k++) { // tapered point on the left
      const inset = Math.max(0, Math.round((h - k) * 1.2) - 2);
      R(ctx, x + inset, y + k, bl - inset, 1, OL);
      if (k > 0 && k < h - 1) R(ctx, x + inset + 1, y + k, bl - inset - 1, 1, k < 3 ? '#8a9096' : k > h - 4 ? '#eef2f4' : '#c9ccd0');
    }
    R(ctx, x + 14, y + 4, bl - 20, 1, '#f4f6f8');
    R(ctx, x + bl - 4, y + 1, 4, h - 2, '#1b1410');
    R(ctx, x + bl, y + 1, 22, h - 2, OL); R(ctx, x + bl + 1, y + 2, 20, h - 4, '#d9c29a'); R(ctx, x + bl + 1, y + 2, 20, 1, '#f0dcb4');
    R(ctx, x + bl + 1, y + h - 3, 20, 1, '#b8955f');
  }

  function drawBoard(ctx, x, y, w, h) {
    R(ctx, x + 3, y + h - 2, 5, 2, OL); R(ctx, x + w - 8, y + h - 2, 5, 2, OL);
    R(ctx, x, y + 6, w, h - 8, OL); R(ctx, x + 1, y + 7, w - 2, h - 10, '#e8cd9c'); R(ctx, x + 1, y + 7, w - 2, 1, '#f8e8c4');
    R(ctx, x + 1, y + h - 4, w - 2, 1, '#b8955f'); R(ctx, x + 6, y + 10, 14, 1, '#d6b682');
    // wasabi mound + gari
    R(ctx, x + 6, y + 1, 10, 6, OL); R(ctx, x + 7, y + 2, 8, 4, '#a6c94a'); R(ctx, x + 8, y + 2, 3, 1, '#d4ec9a');
    R(ctx, x + 21, y, 13, 7, OL); R(ctx, x + 22, y + 1, 11, 5, '#f2b0a8'); R(ctx, x + 24, y + 2, 6, 1, '#fbd6cf');
  }

  function drawUrchin(ctx, e, x, y, w, h) {
    const cx = x + (w >> 1), cy = y + (h >> 1) + 2;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + (e.t || 0) * 0.5;
      const ex = Math.round(cx + Math.cos(a) * 13), ey = Math.round(cy + Math.sin(a) * 11);
      R(ctx, ex - 1, ey - 1, 2, 2, OL);
      R(ctx, Math.round((cx + ex) / 2), Math.round((cy + ey) / 2), 2, 2, '#3b2a4a');
    }
    pdisc(ctx, cx, cy, 10, 9, OL); pdisc(ctx, cx, cy, 9, 8, '#2e1f3a');
    R(ctx, cx - 6, cy - 5, 3, 2, '#5a4470');
    pdisc(ctx, cx, cy - 1, 5, 3, '#e0a526'); R(ctx, cx - 3, cy - 3, 4, 1, '#ffd166');
  }

  function drawWasabi(ctx, e, x, y, w, h) {
    const b = Math.round(Math.sin((e.t || 0) * 6) * 2);
    pdisc(ctx, x + (w >> 1), y + (h >> 1) + b + 1, (w >> 1), (h >> 1), OL);
    pdisc(ctx, x + (w >> 1), y + (h >> 1) + b + 1, (w >> 1) - 1, (h >> 1) - 1, '#6f9a2e');
    pdisc(ctx, x + (w >> 1) - 1, y + (h >> 1) + b, (w >> 1) - 3, (h >> 1) - 3, '#a6c94a');
    R(ctx, x + (w >> 1) - 4, y + (h >> 1) + b - 3, 3, 2, '#e9f5c8');
  }

  function drawShrimp(ctx, x, y, w, h) {
    const bw = w - 12;
    R(ctx, x, y, bw, h, OL); R(ctx, x + 1, y + 1, bw - 2, h - 2, '#ff9a5c');
    R(ctx, x + 1, y + h - 3, bw - 2, 2, '#fff1e4');
    for (let i = 5; i < bw - 3; i += 6) R(ctx, x + i, y + 1, 2, h - 4, '#f4ead7');
    R(ctx, x + bw - 1, y + (h >> 1) - 4, 13, 9, OL);
    R(ctx, x + bw, y + (h >> 1) - 3, 11, 7, '#e2482f'); R(ctx, x + bw + 3, y + (h >> 1), 8, 1, '#8e1325');
  }

  const prevSprite = ART.sprite;
  function sprite(ctx, e, g) {
    const x = Math.round(e.x), y = Math.round(e.y), w = Math.round(e.w), h = Math.round(e.h);
    switch (e.type) {
      case 'plate': return drawPlate(ctx, e, x, y);
      case 'chop': return drawChop(ctx, x, y, h);
      case 'soy': return drawSoy(ctx, x, y);
      case 'fish': return drawFish(ctx, e, g, x, y);
      case 'knife': return drawKnife(ctx, x, y, w, h);
      case 'board': return drawBoard(ctx, x, y, w, h);
      case 'urchin': return drawUrchin(ctx, e, x, y, w, h);
      case 'wasabi': return drawWasabi(ctx, e, x, y, w, h);
      case 'shrimp': return drawShrimp(ctx, x, y, w, h);
      default: return prevSprite(ctx, e, g);
    }
  }

  Object.assign(ART, { runnerBg, runnerGround, gap, sprite });
})();
