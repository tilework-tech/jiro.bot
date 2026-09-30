'use strict';
/*
 * Daily Roll UI: pixel HUD (ART.mazeHud), banners (ART.banner), title/pause/over screens (ART.screen),
 * and the DOM daily loop: header, share card, stats, countdown, share image.
 * Loaded before game.js, so DAILY is only read lazily (draw time / DOMContentLoaded / events).
 * localStorage keys owned here: 'jiro-daily-stats' ({days:{date:{s,p,w,l}}}) and 'jiro-daily-last' (last official result).
 * game.js owns 'jiro-daily-'+date (official score).
 */
(() => {
  const C = {
    ink: '#120d0a', ink2: '#1b1410', ink3: '#261c16', line: '#3a2a1e', outline: '#0b0806',
    paper: '#f4ead7', dim: '#cbbca3', muted: '#9c8a74', hinoki: '#e8cd9c', lacquer: '#c8321e', lacquer2: '#e2482f',
    salmon: '#ff7b4f', wasabi: '#a6c94a', indigo: '#2b4486', indigo2: '#243a73', cyan: '#5ff3ff', nori: '#1d2a22', rice: '#f6efe2',
  };
  const PX = 'Silkscreen, monospace';
  const R = Math.round;
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const fmtDate = (iso) => { const d = new Date(iso + 'T00:00:00Z'); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const niceDate = (iso) => { const d = new Date(iso + 'T00:00:00Z'); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };
  const hasDaily = () => typeof DAILY !== 'undefined';
  if (document.fonts && document.fonts.load) document.fonts.load('16px Silkscreen').catch(() => {});

  /* ─────────────── storage ─────────────── */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const officialScore = () => { const v = hasDaily() ? localStorage.getItem('jiro-daily-' + DAILY.date) : null; return v == null ? null : +v; };
  const dayNum = (iso) => Math.round(Date.parse(iso + 'T00:00:00Z') / 86400000);
  function recordOfficial(r) {
    const st = store.get('jiro-daily-stats', { days: {} });
    if (!st.days[r.date]) st.days[r.date] = { s: r.score, p: r.pct, w: r.won ? 1 : 0, l: r.lives };
    store.set('jiro-daily-stats', st);
    store.set('jiro-daily-last', r);
  }
  function stats() {
    const days = store.get('jiro-daily-stats', { days: {} }).days || {};
    const ds = Object.keys(days).sort(), nums = ds.map(dayNum);
    const played = ds.length, won = ds.filter((d) => days[d].w).length;
    let max = 0, run = 0;
    nums.forEach((n, i) => { run = i && n === nums[i - 1] + 1 ? run + 1 : 1; max = Math.max(max, run); });
    let cur = 0;
    if (played) {
      const today = dayNum(hasDaily() ? DAILY.date : new Date().toISOString().slice(0, 10)), last = nums[nums.length - 1];
      if (last >= today - 1) { cur = 1; for (let i = nums.length - 1; i > 0 && nums[i - 1] === nums[i] - 1; i--) cur++; }
    }
    const best = ds.reduce((b, d) => Math.max(b, days[d].s || 0), 0);
    return { played, pct: played ? Math.round((100 * won) / played) : 0, cur, max, best };
  }

  /* ─────────────── pixel helpers ─────────────── */
  function ptext(ctx, s, x, y, size, color, align = 'left', out = C.outline) {
    ctx.font = `${size}px ${PX}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    x = R(x); y = R(y);
    if (out) {
      const o = size >= 24 ? 2 : 1;
      ctx.fillStyle = out;
      ctx.fillText(s, x - o, y); ctx.fillText(s, x + o, y); ctx.fillText(s, x, y - o); ctx.fillText(s, x, y + o); ctx.fillText(s, x + o, y + o * 2);
    }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    ctx.textAlign = 'left';
  }
  // Chunky pixel logo: dark outline, short extrusion, two-tone face (rice over salmon, like a nigiri slice).
  function logo(ctx, s, x, y, size, face, low, depthCol = C.outline) {
    ctx.font = `${size}px ${PX}`; ctx.textAlign = 'center';
    x = R(x); y = R(y);
    const u = Math.max(1, R(size / 16));
    ctx.fillStyle = C.outline;
    for (let d = -u; d <= 3 * u; d += u) { ctx.fillText(s, x - u, y + d); ctx.fillText(s, x + u, y + d); }
    ctx.fillStyle = depthCol; ctx.fillText(s, x, y + 2 * u);
    ctx.fillStyle = face; ctx.fillText(s, x, y);
    const top = y - R(size * 0.62);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - R(size * 0.25), 640, size); ctx.clip();
    ctx.fillStyle = low; ctx.fillText(s, x, y); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, 640, u); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillText(s, x, y); ctx.restore();
    ctx.textAlign = 'left';
  }
  function card(ctx, cx, cy, w, h) {
    const x = R(cx - w / 2), y = R(cy - h / 2);
    box(ctx, x, y, w, h, C.ink2, '#5a4130', 'rgba(255,255,255,.05)');
    ctx.fillStyle = C.lacquer;
    for (const [a, b] of [[x + 5, y + 5], [x + w - 8, y + 5], [x + 5, y + h - 8], [x + w - 8, y + h - 8]]) ctx.fillRect(a, b, 3, 3);
  }
  function box(ctx, x, y, w, h, fill, edge, hi) {
    x = R(x); y = R(y); w = R(w); h = R(h);
    ctx.fillStyle = C.outline; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
    ctx.fillStyle = edge; ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
    ctx.fillStyle = fill; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    if (hi) { ctx.fillStyle = hi; ctx.fillRect(x + 3, y + 3, w - 6, 1); }
  }
  // Tiny pixel maki (9x8), cached.
  const MAKI = ['..#####..', '.#wwwww#.', '#wwsssww#', '#wssassw#', '#wsssssw#', '#wwsssww#', '.#wwwww#.', '..#####..'];
  const makiCache = {};
  function makiIcon(dim) {
    const k = dim ? 'd' : 'n';
    if (makiCache[k]) return makiCache[k];
    const c = document.createElement('canvas'); c.width = 9; c.height = 8;
    const g = c.getContext('2d');
    const col = dim ? { '#': '#2a221c', w: '#3a2f27', s: '#4a3a2e', a: '#4a3a2e' } : { '#': C.nori, w: C.rice, s: C.salmon, a: '#ffb08a' };
    MAKI.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) { g.fillStyle = col[ch]; g.fillRect(x, y, 1, 1); } }));
    return (makiCache[k] = c);
  }
  function drawMakiIcon(ctx, x, y, scale = 1, dim = false) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(makiIcon(dim), R(x), R(y), 9 * scale, 8 * scale);
    ctx.restore();
  }
  function portrait(ctx, kind, cx, cy, size, t) {
    if (typeof window.drawCastPortrait === 'function') { try { window.drawCastPortrait(ctx, kind, cx, cy, size, t); return; } catch (e) { /* fall through */ } }
    const col = (CAST[kind] && CAST[kind].color) || C.paper, r = R(size / 2);
    cx = R(cx); cy = R(cy + Math.sin(t * 3) * 1);
    ctx.fillStyle = C.outline; ell(ctx, cx, cy, r + 1, r + 1); ctx.fill();
    ctx.fillStyle = col; ell(ctx, cx, cy, r, r); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(cx - r + 2, cy + R(r * 0.4), 2 * r - 4, R(r * 0.4));
    const e = Math.max(2, R(size / 8));
    ctx.fillStyle = C.rice; ctx.fillRect(cx - 2 * e, cy - e, e * 1.5, e * 1.5); ctx.fillRect(cx + e / 2, cy - e, e * 1.5, e * 1.5);
    ctx.fillStyle = C.outline; ctx.fillRect(cx - 1.5 * e, cy - e / 2, e, e); ctx.fillRect(cx + e, cy - e / 2, e, e);
  }
  const blink = (t, hz = 1.6) => Math.floor(t * hz * 2) % 2 === 0;

  /* ─────────────── banner ─────────────── */
  function plaque(ctx, cx, cy, text, color = C.hinoki, size = 16) {
    ctx.font = `${size}px ${PX}`;
    const w = R(ctx.measureText(text).width) + 28, h = size + 16;
    const x = R(cx - w / 2), y = R(cy - h / 2);
    box(ctx, x, y, w, h, C.ink2, C.hinoki, 'rgba(255,255,255,.06)');
    ctx.fillStyle = C.lacquer; ctx.fillRect(x + 3, y + 3, 3, 3); ctx.fillRect(x + w - 6, y + 3, 3, 3); ctx.fillRect(x + 3, y + h - 6, 3, 3); ctx.fillRect(x + w - 6, y + h - 6, 3, 3);
    ptext(ctx, text, cx, y + h / 2 + size * 0.36, size, color, 'center');
  }
  ART.banner = (ctx, W, text, y, color) => plaque(ctx, W / 2, y - 5, String(text).toUpperCase(), color || C.hinoki);
  const bannerColor = (s) => (/ouch|caught/i.test(s) ? C.salmon : /clear/i.test(s) ? C.wasabi : C.hinoki);

  /* ─────────────── HUD ─────────────── */
  ART.mazeHud = function (m, ctx) {
    const ts = m.ts, ox = m.ox, oy = m.oy, bw = m.cols * ts, bh = m.rows * ts;
    const px = ox + bw + 9, pw = m.W - px - 8, py = oy, ph = bh, cx = px + pw / 2;
    const L = px + 10, Rr = px + pw - 10, inner = Rr - L;
    // panel
    box(ctx, px, py, pw, ph, C.ink2, '#4a3526', 'rgba(255,255,255,.05)');
    ctx.fillStyle = C.indigo2; ctx.fillRect(R(px + 3), R(py + 3), R(pw - 6), 22);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(R(px + 3), R(py + 24), R(pw - 6), 1);
    const num = hasDaily() ? DAILY.number : 1;
    ptext(ctx, 'DAILY ROLL #' + num, cx, py + 18, 8, C.paper, 'center');
    ctx.fillStyle = C.lacquer; ell(ctx, R(px + 12), R(py + 14), 3, 3); ctx.fill(); ell(ctx, R(px + pw - 12), R(py + 14), 3, 3); ctx.fill();

    let y = py + 42;
    ptext(ctx, 'SCORE', L, y, 8, C.muted);
    ptext(ctx, pad(m.score), L, y + 22, 16, C.hinoki);
    const off = officialScore();
    const live = Shell.state === 'play' || Shell.state === 'paused';
    ptext(ctx, off != null ? 'OFFICIAL' : 'HI', Rr, y, 8, C.muted, 'right');
    ptext(ctx, String(off != null ? off : Best.get(m.o.id)), Rr, y + 12, 8, off != null ? C.wasabi : C.dim, 'right');

    y += 40;
    ptext(ctx, 'LIVES', L, y, 8, C.muted);
    const maxL = m.o.lives ?? 3;
    for (let i = 0; i < maxL; i++) drawMakiIcon(ctx, L + i * 22, y + 5, 2, i >= m.lives);

    y += 38;
    const pct = m.riceTotal ? m.eaten / m.riceTotal : 0;
    ptext(ctx, 'RICE', L, y, 8, C.muted);
    ptext(ctx, Math.round(pct * 100) + '%', L + 40, y, 8, pct >= 1 ? C.wasabi : C.dim);
    ptext(ctx, `${m.eaten}/${m.riceTotal}`, Rr, y, 8, C.paper, 'right');
    const by = y + 6, bh2 = 10;
    ctx.fillStyle = C.outline; ctx.fillRect(R(L), by, R(inner), bh2);
    ctx.fillStyle = C.ink3; ctx.fillRect(R(L) + 1, by + 1, R(inner) - 2, bh2 - 2);
    const fw = R((inner - 2) * pct);
    if (fw > 0) {
      ctx.fillStyle = C.rice; ctx.fillRect(R(L) + 1, by + 1, fw, bh2 - 2);
      ctx.fillStyle = '#d9ccb2'; ctx.fillRect(R(L) + 1, by + bh2 - 3, fw, 2);
    }
    ctx.fillStyle = C.outline;
    for (let i = 1; i < 10; i++) ctx.fillRect(R(L + (inner * i) / 10), by + 1, 1, bh2 - 2);

    // fright meter
    y = by + 22;
    let fr = 0;
    for (const g of m.ghosts) fr = Math.max(fr, g.fright || 0);
    const ft = m.o.frightTime || 6;
    if (fr > 0) {
      const warn = fr < 1.8;
      ptext(ctx, 'ROE!', L, y, 8, warn && blink(m.t, 4) ? C.paper : C.salmon);
      const fy = y + 5;
      ctx.fillStyle = C.outline; ctx.fillRect(R(L), fy, R(inner), 6);
      ctx.fillStyle = warn && blink(m.t, 4) ? C.paper : '#78a9ff'; ctx.fillRect(R(L) + 1, fy + 1, R((inner - 2) * clamp(fr / ft, 0, 1)), 4);
    } else {
      ptext(ctx, 'ROE', L, y, 8, '#5a4a3c');
    }

    // cast
    y += 26;
    ptext(ctx, "TODAY'S CAST", L, y, 8, C.muted);
    const n = m.ghosts.length, slot = inner / Math.max(1, n);
    m.ghosts.forEach((g, i) => {
      const gx = L + slot * (i + 0.5), gy = y + 22;
      if (g.fright > 0) {
        ctx.fillStyle = '#78a9ff'; ell(ctx, R(gx), R(gy), 9, 9); ctx.fill();
        ctx.fillStyle = C.rice; ctx.fillRect(R(gx) - 4, R(gy) - 2, 2, 2); ctx.fillRect(R(gx) + 2, R(gy) - 2, 2, 2);
      } else portrait(ctx, g.kind || 'wasabi', gx, gy, 20, m.t + i);
      ptext(ctx, (g.label || g.name || g.kind || '').toUpperCase().slice(0, 6), gx, gy + 22, 8, g.fright > 0 ? '#78a9ff' : (g.color || C.dim), 'center');
    });

    // footer: map name
    ptext(ctx, (m.map.name || '').toUpperCase(), cx, py + ph - 9, 8, '#6f604f', 'center', null);

    // popups
    for (const f of m.fx) {
      const a = clamp(f.t / 0.5, 0, 1), age = 0.9 - f.t;
      ctx.globalAlpha = a;
      ptext(ctx, f.text, f.x, f.y - (age < 0.12 ? 3 : 0), 16, f.color || C.hinoki, 'center');
      ctx.globalAlpha = 1;
    }
    // banner (only while playing; title/over overlays carry their own copy)
    if (m.banner && live) plaque(ctx, ox + bw / 2, oy + bh / 2, String(m.banner.text).toUpperCase(), bannerColor(m.banner.text));
  };

  /* ─────────────── screens ─────────────── */
  let fade = 0;
  const countdown = () => {
    const now = new Date();
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    const s = Math.max(0, Math.floor((next - now.getTime()) / 1000));
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':');
  };

  function titleScreen(shell, ctx) {
    const W = shell.W, H = shell.H, t = shell.t;
    ctx.fillStyle = 'rgba(18,13,10,.9)'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2;
    ptext(ctx, 'JIRO.BOT ARCADE', cx, 24, 8, C.salmon, 'center');
    logo(ctx, 'DAILY ROLL', cx, 66, 32, C.rice, C.salmon, '#5a1a0e');
    const d = hasDaily() ? DAILY : { number: 1, date: '2026-09-30', map: { name: '' }, castKeys: [] };
    ptext(ctx, `#${d.number}  ·  ${fmtDate(d.date)}`, cx, 94, 8, C.paper, 'center');
    // map chip
    const mapName = 'TODAY: ' + (d.map.name || '').toUpperCase();
    ctx.font = `8px ${PX}`;
    const mw = R(ctx.measureText(mapName).width) + 20;
    const edge = (d.map.theme && d.map.theme.edge) || C.hinoki;
    box(ctx, cx - mw / 2, 103, mw, 18, C.ink3, edge);
    ptext(ctx, mapName, cx, 115, 8, C.paper, 'center');
    // cast
    const keys = d.castKeys || [];
    const gap = 78;
    keys.forEach((k, i) => {
      const gx = cx + (i - (keys.length - 1) / 2) * gap, gy = 152;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(ctx, R(gx), gy + 20, 16, 3); ctx.fill();
      portrait(ctx, k, gx, gy, 32, t + i * 0.7);
      ptext(ctx, ((CAST[k] && CAST[k].label) || k).toUpperCase(), gx, gy + 34, 8, (CAST[k] && CAST[k].color) || C.dim, 'center');
    });
    // status
    const off = officialScore();
    if (off != null) {
      ptext(ctx, `OFFICIAL ROLL DONE  ·  ${off} PTS`, cx, 214, 8, C.wasabi, 'center');
      ptext(ctx, `PRACTICE ONLY  ·  NEXT ROLL IN ${countdown()}`, cx, 228, 8, C.muted, 'center');
    } else {
      ptext(ctx, 'YOUR FIRST RUN IS THE OFFICIAL SCORE', cx, 214, 8, C.salmon, 'center');
      ptext(ctx, 'CLEAR ALL RICE  ·  ROE MAKES GHOSTS EDIBLE', cx, 228, 8, C.muted, 'center');
    }
    if (blink(t, 1.1)) ptext(ctx, off != null ? 'PRESS SPACE OR TAP TO PRACTICE' : 'PRESS SPACE OR TAP TO ROLL', cx, 258, 16, C.paper, 'center');
    // a little maki rolling along the counter, eating rice
    const lane = 282, x0 = 40, x1 = W - 40, span = x1 - x0;
    const mx = x0 + ((t * 60) % span);
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x0 - 8, lane + 10, span + 16, 1);
    for (let x = x0; x < x1; x += 14) if (x > mx + 10) { ctx.fillStyle = C.rice; ctx.fillRect(x, lane + 3, 2, 2); }
    drawMakiIcon(ctx, mx - 9, lane - 2 + (Math.floor(t * 8) % 2), 2);
  }

  function pausedScreen(shell, ctx) {
    const W = shell.W, H = shell.H;
    ctx.fillStyle = 'rgba(18,13,10,.7)'; ctx.fillRect(0, 0, W, H);
    card(ctx, W / 2, H / 2, 250, 108);
    logo(ctx, 'PAUSED', W / 2, 138, 32, C.hinoki, '#8fa3d9', '#141f40');
    if (blink(shell.t, 1.1)) ptext(ctx, 'SPACE OR TAP TO RESUME', W / 2, 172, 8, C.paper, 'center');
    ptext(ctx, 'ESC PAUSES ANY TIME', W / 2, 188, 8, C.muted, 'center');
  }

  function overScreen(shell, ctx, dt) {
    const W = shell.W, H = shell.H, t = shell.stateT, e = shell.engine;
    fade = Math.min(1, t / 0.35);
    ctx.fillStyle = `rgba(18,13,10,${(0.78 * fade).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    if (t < 0.15) return;
    card(ctx, W / 2, H / 2 + R(Math.max(0, 1 - t / 0.35) * 10), 320, 272);
    const r = (hasDaily() && DAILY.result) || { won: !!e.won, score: Math.floor(e.score), pct: Math.round((100 * e.eaten) / e.riceTotal), lives: Math.max(0, e.lives), official: true, number: 1 };
    const cx = W / 2;
    const rise = R(Math.max(0, 1 - t / 0.35) * 10);
    ptext(ctx, `DAILY ROLL #${r.number}`, cx, 30 + rise, 8, C.muted, 'center');
    logo(ctx, r.won ? 'CLEARED!' : 'CAUGHT!', cx, 72 + rise, 32, r.won ? '#d4ea8e' : '#ffc0a3', r.won ? C.wasabi : C.salmon, r.won ? '#26340e' : '#5a1a0e');
    // tag
    const tag = r.official ? 'OFFICIAL RUN' : 'PRACTICE RUN';
    ctx.font = `8px ${PX}`;
    const tw = R(ctx.measureText(tag).width) + 18;
    box(ctx, cx - tw / 2, 88, tw, 17, r.official ? '#2f7d3b' : '#5a4a3c', r.official ? '#1f5a28' : '#3a2f27');
    ptext(ctx, tag, cx, 100, 8, C.paper, 'center');
    // score
    ptext(ctx, 'SCORE', cx - 80, 128, 8, C.muted, 'center');
    ptext(ctx, pad(r.score), cx - 80, 150, 16, C.hinoki, 'center');
    ptext(ctx, 'EATEN', cx + 80, 128, 8, C.muted, 'center');
    ptext(ctx, r.pct + '%', cx + 80, 150, 16, C.paper, 'center');
    // 10-cell bar matching the share grid
    const cells = Math.round(r.pct / 10), cw = 18, gx = R(cx - (10 * cw) / 2);
    for (let i = 0; i < 10; i++) {
      const x = gx + i * cw, on = i < cells && t > 0.3 + i * 0.05;
      ctx.fillStyle = C.outline; ctx.fillRect(x, 164, cw - 2, 14);
      ctx.fillStyle = on ? C.wasabi : C.ink3; ctx.fillRect(x + 1, 165, cw - 4, 12);
      if (on) { ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 1, 165, cw - 4, 2); }
    }
    for (let i = 0; i < 3; i++) drawMakiIcon(ctx, cx - 31 + i * 22, 188, 2, i >= r.lives);
    if (!r.official && r.officialScore != null) ptext(ctx, `TODAY'S OFFICIAL: ${r.officialScore} PTS`, cx, 222, 8, C.wasabi, 'center');
    else ptext(ctx, 'LOCKED IN FOR TODAY', cx, 222, 8, C.wasabi, 'center');
    ptext(ctx, 'SHARE CARD BELOW THE COUNTER', cx, 238, 8, C.muted, 'center');
    if (t > 0.35 && blink(shell.t, 1.1)) ptext(ctx, 'SPACE OR TAP FOR A PRACTICE RUN', cx, 268, 8, C.paper, 'center');
  }

  ART.screen = function (shell, ctx, dt) {
    if (shell.state === 'play') return;
    ctx.save();
    if (shell.state === 'title') titleScreen(shell, ctx);
    else if (shell.state === 'paused') pausedScreen(shell, ctx);
    else overScreen(shell, ctx, dt);
    ctx.restore();
  };

  /* ─────────────── DOM: header, share, stats, countdown ─────────────── */
  const $ = (id) => document.getElementById(id);
  let shown = null;

  function renderStats() {
    const s = stats();
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('st-played', s.played); set('st-clear', s.pct + '%'); set('st-streak', s.cur); set('st-max', s.max); set('st-best', s.best);
  }

  function showShare(run, fresh) {
    const card = $('dr-share'); if (!card) return;
    const last = store.get('jiro-daily-last', null);
    const off = run.official ? run : last && last.date === run.date ? last : null;
    const main = off || run;
    shown = main;
    card.hidden = false;
    card.classList.toggle('practice', !off);
    $('dr-tag').textContent = off ? `Official run · #${main.number}` : `Practice run · #${main.number}`;
    $('dr-verdict').textContent = main.won ? 'Cleared the roll!' : `Caught at ${main.pct}% rice.`;
    $('dr-text').textContent = main.text;
    let note = '';
    if (!run.official) note = `Practice run: ${run.score} pts, ${run.pct}% rice${run.won ? ', cleared' : ''}. Only your first run of the day counts${off ? '; the card above is your official one.' : '.'}`;
    else note = 'Locked in. Come back tomorrow for a new maze; practice runs are unlimited.';
    $('dr-note').textContent = note;
    const pv = $('dr-preview');
    if (pv) {
      const paint = () => { const g = pv.getContext('2d'); g.clearRect(0, 0, pv.width, pv.height); g.drawImage(shareCanvas(main), 0, 0); };
      paint();
      if (!jiroImg.complete) jiroImg.addEventListener('load', paint, { once: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
    }
    if (fresh) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
  }

  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (e) { /* fallback below */ }
    const ta = document.createElement('textarea');
    ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove(); return ok;
  }

  /* share image: 400x210 pixel card scaled x3 (1200x630) */
  const jiroImg = new Image(); jiroImg.src = '/sprites/jiro-frame0.png';
  function shareCanvas(r) {
    const S = 3, W = 400, H = 210;
    const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
    const g = c.getContext('2d'); g.scale(S, S); g.imageSmoothingEnabled = false;
    // warm dark wood room
    g.fillStyle = C.ink; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 6) { g.fillStyle = y % 12 ? '#1a120d' : '#1d140f'; g.fillRect(0, y, W, 3); }
    g.fillStyle = 'rgba(255,150,80,.07)'; g.fillRect(40, 0, 320, H); g.fillRect(100, 0, 200, H);
    // noren
    const nx = 20, nw = 26;
    ['毎', '日', '', '巻', 'き'].forEach((ch, i) => {
      const x = nx + i * (nw + 2);
      g.fillStyle = C.indigo2; g.fillRect(x, 0, nw, 34); g.fillStyle = '#1c2b5c'; g.fillRect(x, 30, nw, 4);
      if (ch) { g.fillStyle = '#efe8da'; g.font = '800 14px "Shippori Mincho B1", serif'; g.textAlign = 'center'; g.fillText(ch, x + nw / 2, 24); }
      else { g.fillStyle = '#efe8da'; ell(g, x + nw / 2, 18, 7, 7); g.fill(); g.fillStyle = C.lacquer; ell(g, x + nw / 2, 18, 5, 5); g.fill(); }
    });
    // title
    ptext(g, 'DAILY ROLL', 20, 66, 24, C.hinoki);
    ptext(g, `#${r.number}  ·  ${fmtDate(r.date)}`, 20, 82, 8, C.dim);
    // result
    ptext(g, r.won ? 'CLEARED!' : 'CAUGHT!', 20, 106, 16, r.won ? C.wasabi : C.salmon);
    const cells = Math.round(r.pct / 10);
    for (let i = 0; i < 10; i++) {
      const x = 20 + i * 15;
      g.fillStyle = C.outline; g.fillRect(x, 116, 13, 14);
      g.fillStyle = i < cells ? C.wasabi : C.ink3; g.fillRect(x + 1, 117, 11, 12);
      if (i < cells) { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 1, 117, 11, 2); }
    }
    ptext(g, r.pct + '%', 176, 128, 16, C.paper);
    for (let i = 0; i < 3; i++) { g.save(); g.imageSmoothingEnabled = false; g.drawImage(makiIcon(i >= r.lives), 20 + i * 22, 142, 18, 16); g.restore(); }
    ptext(g, `${r.score} PTS`, 94, 156, 16, C.hinoki);
    const map = hasDaily() && DAILY.date === r.date ? DAILY.map.name : '';
    if (map) ptext(g, map.toUpperCase(), 20, 176, 8, C.muted);
    // counter + footer
    g.fillStyle = '#9a7040'; g.fillRect(0, 186, W, 3); g.fillStyle = C.hinoki; g.fillRect(0, 183, W, 3); g.fillStyle = '#4b2d15'; g.fillRect(0, 189, W, H - 189);
    ptext(g, 'JIRO.BOT/GAMES/DAILY-ROLL', 20, 203, 8, C.paper);
    ptext(g, r.official ? 'OFFICIAL' : 'PRACTICE', W - 14, 203, 8, r.official ? C.wasabi : C.muted, 'right');
    // Jiro behind the counter
    if (jiroImg.complete && jiroImg.naturalWidth) {
      const h = 140, w = Math.round((jiroImg.naturalWidth / jiroImg.naturalHeight) * h), jx = W - w - 12, jy = 176 - h;
      g.fillStyle = C.outline; g.fillRect(jx - 2, jy - 2, w + 4, h + 4);
      g.fillStyle = '#6e4521'; g.fillRect(jx - 1, jy - 1, w + 2, h + 2);
      g.drawImage(jiroImg, jx, jy, w, h);
    } else {
      g.fillStyle = C.salmon; ell(g, 320, 120, 40, 40); g.fill();
    }
    return c;
  }

  async function saveImage() {
    const r = shown; if (!r) return;
    const c = shareCanvas(r);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    if (!blob) return;
    const name = `daily-roll-${r.number}.png`;
    try {
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ files: [file], text: r.text });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function tickCountdown() {
    const el = $('dr-countdown'); if (!el) return;
    const today = new Date().toISOString().slice(0, 10);
    const wrap = el.closest('.next');
    if (hasDaily() && today !== DAILY.date) {
      el.innerHTML = '<a href="./">Ready · reload</a>';
      if (wrap) wrap.classList.add('ready');
      return;
    }
    el.textContent = countdown();
  }

  function initDom() {
    if (!hasDaily()) return;
    $('dr-num').textContent = '#' + DAILY.number;
    $('dr-date').textContent = niceDate(DAILY.date);
    $('dr-map').textContent = DAILY.map.name;
    document.title = `Daily Roll #${DAILY.number} · jiro.bot`;
    renderStats();
    const last = store.get('jiro-daily-last', null);
    if (last && last.date === DAILY.date) showShare(last, false);
    tickCountdown(); setInterval(tickCountdown, 1000);
    $('dr-copy').addEventListener('click', async (ev) => {
      const b = ev.currentTarget; b.blur();
      if (!shown) return;
      const ok = await copyText(shown.text);
      b.textContent = ok ? 'Copied!' : 'Copy failed'; b.classList.toggle('done', ok);
      clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = 'Copy result'; b.classList.remove('done'); }, 1600);
    });
    $('dr-img').addEventListener('click', (ev) => { ev.currentTarget.blur(); saveImage(); });
    $('dr-again').addEventListener('click', (ev) => {
      ev.currentTarget.blur();
      Shell.start();
      const f = document.querySelector('.cabinet');
      if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  EVT.on('dailyResult', ({ result }) => {
    if (result.official) recordOfficial(result);
    renderStats();
    showShare(result, true);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDom);
  else setTimeout(initDom, 0);
})();
