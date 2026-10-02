'use strict';
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a, r = Math.random) => a[Math.floor(r() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n) => String(Math.floor(n)).padStart(5, '0');
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function ell(ctx, cx, cy, rx, ry) { ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); }
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Hook points. Art, effects and audio files override ART entries and subscribe to EVT.
const ART = { layers: [], preDraw: [] };
const EVT = {
  h: {},
  on(name, fn) { (this.h[name] = this.h[name] || []).push(fn); },
  emit(name, data) { for (const fn of this.h[name] || []) { try { fn(data); } catch (e) { console.error(e); } } },
};
const Best = {
  get(k) { return +localStorage.getItem('sushi-best-' + k) || 0; },
  set(k, v) { if (v > Best.get(k)) localStorage.setItem('sushi-best-' + k, Math.floor(v)); },
};

/* ------------------------------------------------------------------ */
/* Runner engine                                                        */
/* ------------------------------------------------------------------ */
const RUN_THEME = { sky: '#161616', ground: '#262626', line: '#8a8f98', text: '#dde1e6', deco: true };

class Runner {
  constructor(W, H, o = {}) { this.W = W; this.H = H; this.o = o; this.keys = {}; this.reset(); }
  reset() {
    const o = this.o;
    this.ground = this.H - 44; this.speed = o.speed || 330; this.t = 0; this.score = 0; this.dist = 0;
    this.p = { x: o.px || 90, y: this.ground, vy: 0, onGround: true, duck: false, run: 0 };
    this.obs = []; this.items = []; this.gaps = []; this.plats = []; this.fx = [];
    this.spawnT = 1.1; this.speedMul = 1; this.scoreMul = 1; this.flash = 0; this.banner = null;
    this.theme = Object.assign({}, RUN_THEME, o.theme || {});
    this.fish = o.fish || '#ff8c5a'; this.over = false; this.overMsg = ''; this.cssFilter = o.cssFilter || '';
    this.keys = {};
    o.init && o.init(this);
  }
  get pw() { return 40; }
  get ph() { return this.p.duck && this.p.onGround ? 18 : 30; }
  input(code, down) {
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') { if (down && !this.keys.up) this.jump(); this.keys.up = down; }
    if (code === 'ArrowDown' || code === 'KeyS') { if (down && !this.keys.down) this.o.onDuck && this.o.onDuck(this); this.keys.down = down; this.p.duck = down; }
  }
  tap() { this.jump(); }
  jump() {
    const p = this.p;
    if (p.onGround) { p.vy = -(this.o.jumpV || 800); p.onGround = false; this.o.onJump && this.o.onJump(this); EVT.emit('jump', { g: this }); }
  }
  spd() { return this.speed * this.speedMul; }
  say(text, t = 1.4) { this.banner = { text, t, t0: t }; EVT.emit('banner', { g: this, text }); }
  pop(text, x, y, color = '#fddc69') { this.fx.push({ text, x, y, t: 0.9, color }); }
  die(msg) { if (this.over) return; this.over = true; this.overMsg = msg || ''; EVT.emit('die', { g: this, msg }); this.o.onOver && this.o.onOver(this); }
  update(dt) {
    const o = this.o, p = this.p; this.t += dt;
    this.speed += (o.accel ?? 9) * dt;
    const v = this.spd(), dx = v * dt; this.dist += dx; this.score += (dx / 12) * this.scoreMul;
    for (const L of [this.obs, this.items, this.gaps, this.plats]) for (const e of L) {
      e.x -= dx + (e.vx || 0) * dt; e.t = (e.t || 0) + dt; e.update && e.update(this, dt, e);
    }
    const keep = (e) => e.x + e.w > -120 && !e.dead;
    this.obs = this.obs.filter(keep); this.items = this.items.filter(keep);
    this.gaps = this.gaps.filter(keep); this.plats = this.plats.filter(keep);
    this.spawnT -= dt;
    if (this.spawnT <= 0) this.spawnT = (o.spawn || defaultSpawn)(this);
    o.update && o.update(this, dt);
    if (this.over) return;
    const prevY = p.y;
    if (!p.onGround) { p.vy += 2600 * dt * (this.keys.down ? 2.2 : 1); p.y += p.vy * dt; }
    const sup = this.supportAt(p.x + this.pw / 2, prevY);
    if (p.onGround) { if (sup > p.y + 6) { p.onGround = false; p.vy = 0; } else p.y = sup; }
    else if (p.vy >= 0 && p.y >= sup) { const vy = p.vy; p.y = sup; p.vy = 0; p.onGround = true; EVT.emit('land', { g: this, vy }); }
    p.run += (dt * v) / 40;
    if (p.y > this.H + 60) return this.die(o.fallMsg || 'You fell');
    const b = { x: p.x + 7, y: p.y - this.ph + 4, w: this.pw - 14, h: this.ph - 6 };
    for (const ob of this.obs) {
      if (ob.dead || ob.harmless) continue;
      if (ob.hit ? ob.hit(this, b, ob) : overlap(b, ob)) {
        EVT.emit('hit', { g: this, ob });
        if (o.onHit) o.onHit(this, ob); else this.die(o.hitMsg);
        if (this.over) return;
      }
    }
    for (const it of this.items) if (!it.dead && overlap(b, it)) { it.dead = true; EVT.emit('item', { g: this, it }); o.onItem && o.onItem(this, it); }
    for (const f of this.fx) { f.t -= dt; f.y -= 30 * dt; }
    this.fx = this.fx.filter((f) => f.t > 0);
    if (this.flash > 0) this.flash -= dt;
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
  }
  supportAt(cx, prevY) {
    let s = Infinity;
    if (this.ground >= prevY - 8 && !this.gaps.some((g) => cx > g.x + 4 && cx < g.x + g.w - 4)) s = this.ground;
    for (const pl of this.plats) if (cx > pl.x - 4 && cx < pl.x + pl.w + 4 && pl.y >= prevY - 8 && pl.y < s) s = pl.y;
    return s;
  }
  draw(ctx) {
    const T = this.theme, W = this.W, H = this.H, g = this.ground, o = this.o;
    ctx.fillStyle = T.sky; ctx.fillRect(0, 0, W, H);
    (o.drawBg || ART.runnerBg)(this, ctx);
    ART.runnerGround(this, ctx);
    for (const gp of this.gaps) (o.drawGap || ART.gap)(this, ctx, gp);
    ctx.strokeStyle = T.line; ctx.lineWidth = 2; ctx.beginPath();
    let x0 = 0;
    for (const gp of [...this.gaps].sort((a, b) => a.x - b.x)) {
      if (gp.x > x0) { ctx.moveTo(x0, g); ctx.lineTo(gp.x, g); }
      x0 = Math.max(x0, gp.x + gp.w);
    }
    if (x0 < W) { ctx.moveTo(x0, g); ctx.lineTo(W, g); }
    ctx.stroke();
    o.drawGround && o.drawGround(this, ctx);
    for (const pl of this.plats) ART.sprite(ctx, pl, this);
    for (const it of this.items) ART.sprite(ctx, it, this);
    for (const ob of this.obs) ART.sprite(ctx, ob, this);
    if (!(this.flash > 0 && Math.floor(this.flash * 16) % 2)) ART.nigiri(ctx, this);
    o.drawFg && o.drawFg(this, ctx);
    ART.runnerHud(this, ctx);
  }
}

function defaultSpawn(g, opt = {}) {
  const X = g.W + 20, gr = g.ground, r = Math.random();
  const types = opt.types || (g.score > (opt.flyAfter ?? 200) ? ['plate', 'plate', 'chop', 'soy', 'fish'] : ['plate', 'plate', 'chop', 'soy']);
  const type = pick(types);
  spawnObstacle(g, type, X, opt);
  if (type === 'plate' && r < 0.25 && !opt.noPairs) spawnObstacle(g, 'plate', X + 36, opt);
  const v = g.spd();
  return Math.max(rand(0.8, 1.5) * clamp(420 / v, 0.6, 1.15), 0.62 + 170 / v);
}
const SUSHI_TOPS = ['#ff8c5a', '#f47067', '#fddc69', '#e0485a', '#f2f4f8'];
function spawnObstacle(g, type, X, opt = {}) {
  const gr = g.ground;
  const base = {
    plate: { w: 34, h: 16, y: gr - 16, color: pick(SUSHI_TOPS) },
    chop: { w: 14, h: 42, y: gr - 42 },
    soy: { w: 18, h: 34, y: gr - 34 },
    fish: { w: 34, h: 16, y: gr - 40, vx: 50 },
    knife: { w: 74, h: 12, y: gr - 38 },
    board: { w: 40, h: 16, y: gr - 16 },
    urchin: { w: 28, h: 26, y: gr - 26 },
  }[type];
  const o = Object.assign({ type, x: X, t: 0 }, base, opt.extra || {});
  g.obs.push(o);
  return o;
}

function drawRunBg(g, ctx) {
  const T = g.theme; if (!T.deco) return;
  const W = g.W;
  ctx.strokeStyle = T.decoLine || '#393939'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const span = W + 200;
    const x = ((((i * 190 - g.dist * 0.25) % span) + span) % span) - 60;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 34); ctx.stroke();
    ctx.fillStyle = T.lantern || '#7a2a22'; ell(ctx, x, 46, 11, 13); ctx.fill();
    ctx.fillStyle = T.lanternGlow || '#f47067'; ctx.globalAlpha = 0.35; ell(ctx, x, 46, 6, 9); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#161616'; ctx.fillRect(x - 6, 32, 12, 3); ctx.fillRect(x - 6, 58, 12, 3);
  }
}
function drawGap(g, ctx, gp) {
  ctx.fillStyle = g.theme.sky; ctx.fillRect(gp.x, g.ground - 1, gp.w, g.H - g.ground + 2);
}
function drawBanner(ctx, W, text, y, color = '#f2f4f8') {
  ctx.font = '700 18px system-ui, sans-serif'; ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 28;
  ctx.fillStyle = 'rgba(14,14,14,.78)'; rr(ctx, W / 2 - w / 2, y - 20, w, 30, 6); ctx.fill();
  ctx.fillStyle = '#f2f4f8'; ctx.fillText(text, W / 2, y); ctx.textAlign = 'left';
}

function drawNigiri(ctx, g) {
  const p = g.p, w = g.pw, h = g.ph, x = p.x, top = p.y - h;
  const leg = p.onGround ? Math.sin(p.run * Math.PI) * 4 : 2;
  ctx.strokeStyle = '#c1c7cd'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 12, p.y - 6); ctx.lineTo(x + 12 + leg, p.y);
  ctx.moveTo(x + 27, p.y - 6); ctx.lineTo(x + 27 - leg, p.y); ctx.stroke();
  ctx.fillStyle = '#f2f4f8'; ctx.strokeStyle = '#c1c7cd'; ctx.lineWidth = 1;
  rr(ctx, x + 3, top + h * 0.42, w - 6, h * 0.58 - 4, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = g.fish; rr(ctx, x, top, w, h * 0.55, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) { ctx.moveTo(x + 8 + i * 9, top + 3); ctx.lineTo(x + 3 + i * 9, top + h * 0.5); }
  ctx.stroke();
  ctx.fillStyle = '#161616'; ell(ctx, x + w - 9, top + h * 0.26, 2.3, 2.3); ctx.fill();
}

function drawSprite(ctx, e, g) {
  const { x, y, w, h } = e;
  ctx.lineCap = 'round';
  switch (e.type) {
    case 'plate':
      ctx.fillStyle = '#c1c7cd'; ell(ctx, x + w / 2, y + h - 3, w / 2, 4); ctx.fill();
      ctx.fillStyle = '#f2f4f8'; rr(ctx, x + 6, y + h - 12, w - 12, 8, 4); ctx.fill();
      ctx.fillStyle = e.color || '#ff8c5a'; rr(ctx, x + 4, y + h - 16, w - 8, 7, 4); ctx.fill();
      break;
    case 'chop':
      ctx.strokeStyle = '#c89b5a'; ctx.lineWidth = 4; ctx.beginPath();
      ctx.moveTo(x + 3, y + h); ctx.lineTo(x + 5, y); ctx.moveTo(x + w - 3, y + h); ctx.lineTo(x + w - 7, y + 3); ctx.stroke();
      break;
    case 'soy':
      ctx.fillStyle = '#3a1f14'; rr(ctx, x + 2, y + 10, w - 4, h - 10, 4); ctx.fill();
      ctx.fillStyle = '#da1e28'; rr(ctx, x + w / 2 - 4, y, 8, 12, 2); ctx.fill();
      ctx.fillStyle = '#f2f4f8'; ctx.fillRect(x + 4, y + 18, w - 8, 6);
      break;
    case 'fish': {
      const f = Math.sin(e.t * 14) * 5;
      ctx.fillStyle = '#8aa4c8'; ell(ctx, x + w * 0.42, y + h / 2, w * 0.4, h * 0.38); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w * 0.76, y + h / 2); ctx.lineTo(x + w, y + 1); ctx.lineTo(x + w, y + h - 1); ctx.fill();
      ctx.fillStyle = '#a6c8ff'; ctx.beginPath(); ctx.moveTo(x + 10, y + h / 2); ctx.lineTo(x + 24, y + h / 2); ctx.lineTo(x + 20, y - 4 + f); ctx.fill();
      ctx.fillStyle = '#161616'; ell(ctx, x + 6, y + h / 2 - 1, 1.8, 1.8); ctx.fill();
      break;
    }
    case 'knife':
      ctx.fillStyle = '#c1c7cd'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + 14, y); ctx.lineTo(x + w - 22, y); ctx.lineTo(x + w - 22, y + h); ctx.fill();
      ctx.fillStyle = '#f2f4f8'; ctx.fillRect(x + 14, y + 1, w - 38, 2);
      ctx.fillStyle = '#5a3a24'; rr(ctx, x + w - 22, y + 2, 22, h - 4, 3); ctx.fill();
      break;
    case 'board':
      ctx.fillStyle = '#c89b5a'; rr(ctx, x, y + 4, w, h - 4, 3); ctx.fill();
      ctx.fillStyle = '#42be65'; ell(ctx, x + 12, y + 4, 5, 4); ctx.fill();
      ctx.fillStyle = '#f47067'; ell(ctx, x + 26, y + 4, 5, 4); ctx.fill();
      break;
    case 'urchin': {
      const cx = x + w / 2, cy = y + h / 2 + 2;
      ctx.strokeStyle = '#6b4f7a'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 13); }
      ctx.stroke(); ctx.fillStyle = '#3b2a4a'; ell(ctx, cx, cy, 10, 9); ctx.fill();
      ctx.fillStyle = '#f2b33d'; ell(ctx, cx, cy - 2, 5, 3); ctx.fill();
      break;
    }
    case 'wasabi': {
      const b = Math.sin(e.t * 6) * 2;
      ctx.fillStyle = '#389150'; ell(ctx, x + w / 2, y + h / 2 + b + 2, w / 2, h / 2 - 1); ctx.fill();
      ctx.fillStyle = '#6fdc8c'; ell(ctx, x + w / 2 - 1, y + h / 2 + b, w / 2 - 3, h / 2 - 3); ctx.fill();
      ctx.fillStyle = '#d4f7dc'; ell(ctx, x + w / 2 - 4, y + h / 2 + b - 3, 3, 2); ctx.fill();
      break;
    }
    case 'shrimp':
      ctx.fillStyle = '#e8a93a'; rr(ctx, x, y, w - 12, h, 8); ctx.fill();
      ctx.fillStyle = '#f2cc60';
      for (let i = 6; i < w - 16; i += 9) { ell(ctx, x + i, y + 3, 4, 3); ctx.fill(); }
      ctx.fillStyle = '#f47067'; ctx.beginPath(); ctx.moveTo(x + w - 13, y + h / 2); ctx.lineTo(x + w, y - 2); ctx.lineTo(x + w - 2, y + h + 2); ctx.fill();
      break;
    default:
      e.draw && e.draw(ctx, g, e);
  }
}

function drawRobot(ctx, x, ground, t) {
  const bob = Math.sin(t * 12) * 2, leg = Math.sin(t * 12) * 6;
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 14, ground - 18); ctx.lineTo(x + 14 + leg, ground);
  ctx.moveTo(x + 30, ground - 18); ctx.lineTo(x + 30 - leg, ground); ctx.stroke();
  ctx.fillStyle = '#525252'; rr(ctx, x + 4, ground - 52 + bob, 36, 36, 6); ctx.fill();
  ctx.fillStyle = '#393939'; rr(ctx, x + 10, ground - 44 + bob, 24, 12, 3); ctx.fill();
  ctx.fillStyle = '#42be65'; ctx.fillRect(x + 13, ground - 40 + bob, 4, 4); ctx.fillRect(x + 20, ground - 40 + bob, 4, 4);
  ctx.fillStyle = '#8a8f98'; rr(ctx, x + 8, ground - 80 + bob, 30, 26, 6); ctx.fill();
  ctx.fillStyle = '#f2f4f8'; ctx.fillRect(x + 8, ground - 80 + bob, 30, 6);
  ctx.fillStyle = '#da1e28'; ell(ctx, x + 23, ground - 77 + bob, 3, 3); ctx.fill();
  ctx.fillStyle = '#161616'; rr(ctx, x + 12, ground - 70 + bob, 24, 8, 3); ctx.fill();
  ctx.fillStyle = '#f47067'; const sx = x + 14 + ((Math.sin(t * 5) + 1) / 2) * 16; ctx.fillRect(sx, ground - 68 + bob, 5, 4);
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 40, ground - 44 + bob); ctx.lineTo(x + 56, ground - 52 + bob); ctx.stroke();
  ctx.fillStyle = '#c1c7cd'; ctx.beginPath(); ctx.moveTo(x + 54, ground - 56 + bob); ctx.lineTo(x + 76, ground - 64 + bob); ctx.lineTo(x + 58, ground - 50 + bob); ctx.fill();
  ctx.fillStyle = '#dde1e6'; ctx.font = '700 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('JIRO', x + 22, ground - 86 + bob); ctx.textAlign = 'left';
}

/* ------------------------------------------------------------------ */
/* Maze engine                                                          */
/* ------------------------------------------------------------------ */
const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const KEYDIR = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };

class Maze {
  constructor(W, H, o = {}) { this.W = W; this.H = H; this.o = o; this.cssFilter = ''; this.reset(true); }
  reset(full = true) {
    if (full) { this.score = 0; this.lives = this.o.lives ?? 3; this.level = 1; this.mapIdx = this.o.mapIdx || 0; }
    this.rng = this.o.seed != null ? mulberry32(this.o.seed) : Math.random;
    this.over = false; this.overMsg = ''; this.won = false;
    this.loadLevel();
  }
  get maps() { return this.o.maps || [MAPS.counter]; }
  setMap(i) { this.o.mapIdx = i; this.reset(true); }
  loadLevel() {
    const o = this.o, src = this.maps[this.mapIdx % this.maps.length];
    this.map = src; this.theme = src.theme;
    this.grid = src.rows.map((r) => r.split(''));
    this.rows = this.grid.length; this.cols = this.grid[0].length;
    this.ts = Math.floor(Math.min((this.W - 180) / this.cols, (this.H - 16) / this.rows));
    this.ox = 12; this.oy = Math.floor((this.H - this.ts * this.rows) / 2);
    let p1, p2; const gs = [];
    this.grid.forEach((row, y) => row.forEach((c, x) => {
      if (c === 'P') { p1 = [x, y]; row[x] = ' '; }
      else if (c === '2') { p2 = [x, y]; row[x] = o.players === 2 ? ' ' : '.'; }
      else if (c === 'G') { gs.push([x, y]); row[x] = ' '; }
    }));
    this.players = [this.mkEnt(p1, { isPlayer: true, id: 1, spd: 6.4, score: 0 })];
    if (o.players === 2) this.players.push(this.mkEnt(p2, { isPlayer: true, id: 2, spd: 6.4, score: 0, temaki: true }));
    const gcfg = o.ghosts || [{ name: 'Wasabi', color: '#6fdc8c', ai: 'chase' }, { name: 'Ginger', color: '#ff9cac', ai: 'ambush', wait: 3 }];
    this.ghosts = gcfg.map((c, i) => this.mkEnt(gs[i % gs.length], Object.assign({ isGhost: true, fright: 0, wait: 1 + i * 0.5, jitter: 0.12, ai: 'chase' }, c, { wait: (c.wait ?? i * 1.5) + 0.5 })));
    this.riceLeft = 0; this.eaten = 0;
    for (const row of this.grid) for (const c of row) if (c === '.' || c === 'o') this.riceLeft++;
    this.riceTotal = this.riceLeft;
    this.freeze = 1.0; this.clearT = 0; this.fx = []; this.puddles = []; this.dbl = 0; this.t = 0; this.combo = 0;
    this.banner = { text: 'READY!', t: 1.0, t0: 1.0 };
    EVT.emit('ready', { m: this });
    o.onLevel && o.onLevel(this);
  }
  mkEnt(pos, extra) {
    return Object.assign({ x: pos[0], y: pos[1], sx: pos[0], sy: pos[1], dir: [0, 0], want: [0, 0], prog: 0, spdMul: 1 }, extra);
  }
  wx(x) { return ((x % this.cols) + this.cols) % this.cols; }
  open(x, y) { if (y < 0 || y >= this.rows) return false; return this.grid[y][this.wx(x)] !== '#'; }
  input(code, down) {
    const d = KEYDIR[code]; if (!d || !down) return;
    if (this.o.players === 2) {
      const p = code.startsWith('Key') ? this.players[1] : this.players[0];
      p.want = d;
    } else this.players[0].want = d;
  }
  swipe(d) { this.players[0].want = d; }
  say(text, t = 1.4) { this.banner = { text, t, t0: t }; EVT.emit('banner', { g: this, text }); }
  pop(text, x, y, color = '#fddc69') { this.fx.push({ text, x, y, t: 0.9, color }); }
  add(p, pts) {
    const v = Math.round(pts * (this.dbl > 0 ? 2 : 1) * (this.o.mul ? this.o.mul(this, p) : 1));
    this.score += v; if (p) p.score += v; return v;
  }
  step(e, dt) {
    let d = e.spd * e.spdMul * dt * (e.slow ? 0.5 : 1);
    if (e.isPlayer && e.prog > 0 && (e.want[0] || e.want[1]) && e.want[0] === -e.dir[0] && e.want[1] === -e.dir[1]) {
      e.x = this.wx(e.x + e.dir[0]); e.y += e.dir[1]; e.dir = [...e.want]; e.prog = 1 - e.prog;
    }
    let guard = 0;
    while (d > 0 && guard++ < 6) {
      if (e.prog === 0) {
        const nd = this.choose(e);
        if (!nd) { e.dir = [0, 0]; break; }
        e.dir = [...nd];
      }
      const need = 1 - e.prog;
      if (d < need) { e.prog += d; d = 0; }
      else { d -= need; e.prog = 0; e.x = this.wx(e.x + e.dir[0]); e.y += e.dir[1]; this.arrive(e); if (this.over || this.clearT > 0) return; }
    }
  }
  choose(e) {
    if (e.isPlayer) {
      if ((e.want[0] || e.want[1]) && this.open(e.x + e.want[0], e.y + e.want[1])) return e.want;
      if ((e.dir[0] || e.dir[1]) && this.open(e.x + e.dir[0], e.y + e.dir[1])) return e.dir;
      return null;
    }
    const opts = DIR4.filter((d) => this.open(e.x + d[0], e.y + d[1]));
    let cand = opts.filter((d) => !(d[0] === -e.dir[0] && d[1] === -e.dir[1]));
    if (!cand.length) cand = opts;
    if (!cand.length) return null;
    if (e.fright > 0 || e.ai === 'random' || this.rng() < e.jitter) return pick(cand, this.rng);
    const [tx, ty] = this.target(e);
    const dist = (d) => { let dx = Math.abs(e.x + d[0] - tx); dx = Math.min(dx, this.cols - dx); const dy = e.y + d[1] - ty; return dx * dx + dy * dy; };
    return cand.slice().sort((a, b) => dist(a) - dist(b))[0];
  }
  nearestPlayer(e) {
    let best = this.players[0], bd = Infinity;
    for (const p of this.players) { const d = (p.x - e.x) ** 2 + (p.y - e.y) ** 2; if (d < bd) { bd = d; best = p; } }
    return best;
  }
  target(e) {
    const p = this.nearestPlayer(e);
    if (e.ai === 'ambush') return [p.x + p.dir[0] * 4, p.y + p.dir[1] * 4];
    return [p.x, p.y];
  }
  arrive(e) {
    const o = this.o;
    if (e.isPlayer) {
      const c = this.grid[e.y][e.x];
      if (c === '.' || c === 'o') {
        this.grid[e.y][e.x] = ' '; this.riceLeft--; this.eaten++;
        EVT.emit(c === '.' ? 'rice' : 'roe', { m: this, p: e, x: e.x, y: e.y });
        if (c === '.') this.add(e, 10);
        else {
          this.add(e, 50); this.combo = 0;
          if (!o.noRoe) { for (const g of this.ghosts) { g.fright = o.frightTime || 6; g.dir = [-g.dir[0], -g.dir[1]]; } EVT.emit('fright', { m: this }); }
        }
        o.onRice && o.onRice(this, e, e.x, e.y, c);
        if (this.riceLeft <= 0 && !this.over) this.levelClear();
      } else if (c !== ' ' && c !== '#') {
        this.grid[e.y][e.x] = ' ';
        EVT.emit('pickup', { m: this, p: e, c, x: e.x, y: e.y });
        o.onItem && o.onItem(this, e, c, e.x, e.y);
      }
    }
    o.onArrive && o.onArrive(this, e);
  }
  levelClear() {
    if (this.o.onClear && this.o.onClear(this) === false) return;
    EVT.emit('clear', { m: this });
    this.say(this.o.clearText || 'Level clear!', 1.6); this.clearT = 1.6;
  }
  nextLevel() {
    this.level++; if (this.o.cycleMaps) this.mapIdx++;
    this.loadLevel();
    for (const g of this.ghosts) g.spd = undefined;
  }
  loseLife(p) {
    if (this.o.onCaught) return this.o.onCaught(this, p);
    this.lives--;
    EVT.emit('death', { m: this, p });
    this.o.onDeath && this.o.onDeath(this, p);
    if (this.lives <= 0) { this.over = true; this.overMsg = this.o.caughtMsg || 'Caught!'; EVT.emit('over', { m: this }); this.o.onOver && this.o.onOver(this); return; }
    for (const e of [...this.players, ...this.ghosts]) { e.x = e.sx; e.y = e.sy; e.prog = 0; e.dir = [0, 0]; e.want = [0, 0]; if (e.isGhost) { e.fright = 0; e.wait = 1; } }
    this.freeze = 1.1; this.say('Ouch!', 1.1);
  }
  pos(e) { return [e.x + e.dir[0] * e.prog, e.y + e.dir[1] * e.prog]; }
  update(dt) {
    const o = this.o; this.t += dt;
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    for (const f of this.fx) { f.t -= dt; f.y -= 20 * dt; }
    this.fx = this.fx.filter((f) => f.t > 0);
    if (this.freeze > 0) { this.freeze -= dt; return; }
    if (this.clearT > 0) { this.clearT -= dt; if (this.clearT <= 0) this.nextLevel(); return; }
    if (this.dbl > 0) this.dbl -= dt;
    for (const pd of this.puddles) pd.t -= dt;
    this.puddles = this.puddles.filter((p) => p.t > 0);
    for (const p of this.players) {
      p.slow = this.puddles.some((pd) => pd.x === p.x && pd.y === p.y);
      this.step(p, dt); if (this.over || this.clearT > 0) return;
    }
    const gbase = (o.ghostSpeed || 5.0) + 0.35 * (this.level - 1);
    for (const g of this.ghosts) {
      if (g.wait > 0) { g.wait -= dt; continue; }
      if (g.fright > 0) g.fright = Math.max(0, g.fright - dt);
      g.spd = g.fright > 0 ? 3.2 : (g.speed || gbase);
      o.ghostUpdate && o.ghostUpdate(this, g, dt);
      if (!g.frozen) this.step(g, dt);
    }
    o.update && o.update(this, dt);
    for (const p of this.players) for (const g of this.ghosts) {
      const [px, py] = this.pos(p), [gx, gy] = this.pos(g);
      let dx = Math.abs(px - gx); dx = Math.min(dx, this.cols - dx);
      const r = g.hitR || 0.7;
      if (dx * dx + (py - gy) ** 2 < r * r) {
        if (g.fright > 0) {
          this.combo++; const v = this.add(p, 100 * 2 ** this.combo);
          EVT.emit('ghostEaten', { m: this, p, g, v, x: gx, y: gy });
          this.pop('+' + v, this.ox + (gx + 0.5) * this.ts, this.oy + gy * this.ts);
          g.x = g.sx; g.y = g.sy; g.prog = 0; g.dir = [0, 0]; g.fright = 0; g.wait = 2;
        } else { this.loseLife(p); return; }
      }
    }
  }
  draw(ctx) {
    const o = this.o, ts = this.ts, ox = this.ox, oy = this.oy, T = this.theme, W = this.W, H = this.H;
    ART.mazeFloor(this, ctx);
    o.drawFloor && o.drawFloor(this, ctx);
    ART.mazeTiles(this, ctx);
    for (const g of this.ghosts) ART.ghost(ctx, this, g);
    for (const p of this.players) (p.temaki ? ART.temaki : ART.maki)(ctx, this, p);
    o.drawFg && o.drawFg(this, ctx);
    ART.mazeHud(this, ctx);
  }
}

function drawMaki(ctx, m, p) {
  const [px, py] = m.pos(p), ts = m.ts, cx = m.ox + (px + 0.5) * ts, cy = m.oy + (py + 0.5) * ts;
  const r = ts * 0.46 * (p.scale || 1);
  const d = p.dir[0] || p.dir[1] ? p.dir : [1, 0];
  const a = Math.atan2(d[1], d[0]);
  const moving = p.dir[0] || p.dir[1];
  const mouth = moving ? (0.08 + 0.32 * Math.abs(Math.sin(m.t * 12))) * Math.PI : 0.18 * Math.PI;
  const layers = [[r, '#17251b'], [r * 0.8, '#f2f4f8']];
  const rings = p.rings || 0, ringCols = ['#6fdc8c', '#fddc69', '#f47067', '#78a9ff', '#be95ff'];
  const inner = r * 0.8;
  for (let i = 0; i < rings; i++) layers.push([inner * (0.62 - i * 0.07), ringCols[i % ringCols.length]]);
  layers.push([r * 0.34, '#ff8c5a']);
  for (const [rad, col] of layers) {
    if (rad <= 1) continue;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rad, a + mouth, a - mouth + TAU); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#2c6b41'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, a + mouth, a - mouth + TAU); ctx.stroke();
  if (p.slow) { ctx.fillStyle = '#8a5a3a'; ctx.font = '700 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('slow', cx, cy - r - 3); ctx.textAlign = 'left'; }
}
function drawTemaki(ctx, m, p) {
  const [px, py] = m.pos(p), ts = m.ts, cx = m.ox + (px + 0.5) * ts, cy = m.oy + (py + 0.5) * ts, r = ts * 0.5;
  const d = p.dir[0] || p.dir[1] ? p.dir : [-1, 0];
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(d[1], d[0]) + Math.PI);
  ctx.fillStyle = '#17251b'; ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.8); ctx.lineTo(r, 0); ctx.lineTo(-r * 0.2, r * 0.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2f4f8'; ell(ctx, -r * 0.3, 0, r * 0.32, r * 0.72); ctx.fill();
  ctx.fillStyle = '#f47067'; ell(ctx, -r * 0.45, -r * 0.2, r * 0.2, r * 0.3); ctx.fill();
  ctx.fillStyle = '#6fdc8c'; ell(ctx, -r * 0.45, r * 0.3, r * 0.16, r * 0.22); ctx.fill();
  ctx.restore();
}
function drawGhost(ctx, m, g) {
  const [gx, gy] = m.pos(g), ts = m.ts, cx = m.ox + (gx + 0.5) * ts, cy = m.oy + (gy + 0.5) * ts;
  let r = ts * 0.44 * (g.size || 1);
  const fr = g.fright > 0;
  let col = g.color;
  if (fr) col = g.fright < 1.8 && Math.floor(g.fright * 6) % 2 ? '#f2f4f8' : '#78a9ff';
  if (g.inflated) {
    r = ts * 0.95;
    ctx.strokeStyle = '#8e6a00'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + m.t; ctx.moveTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); ctx.lineTo(cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * 1.15); }
    ctx.stroke();
    ctx.fillStyle = col; ell(ctx, cx, cy, r * 0.85, r * 0.85); ctx.fill();
  } else {
    ctx.fillStyle = col; ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r * 0.85);
    const wv = 4, ph = m.t * 10;
    for (let i = 0; i <= wv; i++) { const x = cx + r - (i * 2 * r) / wv; ctx.lineTo(x, cy + r * 0.85 - (i % 2 ? r * 0.25 : 0) + Math.sin(ph + i) * 1); }
    ctx.closePath(); ctx.fill();
  }
  const d = g.dir;
  ctx.fillStyle = '#fff'; ell(ctx, cx - r * 0.35, cy - r * 0.15, r * 0.24, r * 0.3); ctx.fill(); ell(ctx, cx + r * 0.35, cy - r * 0.15, r * 0.24, r * 0.3); ctx.fill();
  ctx.fillStyle = fr ? '#da1e28' : '#161616';
  ell(ctx, cx - r * 0.35 + d[0] * r * 0.1, cy - r * 0.15 + d[1] * r * 0.12, r * 0.11, r * 0.13); ctx.fill();
  ell(ctx, cx + r * 0.35 + d[0] * r * 0.1, cy - r * 0.15 + d[1] * r * 0.12, r * 0.11, r * 0.13); ctx.fill();
  if (g.label && !fr) { ctx.fillStyle = g.color; ctx.font = '600 9px system-ui'; ctx.textAlign = 'center'; ctx.fillText(g.label, cx, cy - r - 3); ctx.textAlign = 'left'; }
}

/* ------------------------------------------------------------------ */
/* Default art (plain shapes). Game art files replace these entries.    */
/* ------------------------------------------------------------------ */
Object.assign(ART, {
  runnerBg: drawRunBg,
  gap: drawGap,
  runnerGround(g, ctx) { ctx.fillStyle = g.theme.ground; ctx.fillRect(0, g.ground, g.W, g.H - g.ground); },
  sprite: drawSprite,
  nigiri: drawNigiri,
  banner: drawBanner,
  runnerHud(g, ctx) {
    const T = g.theme, W = g.W, o = g.o;
    ctx.fillStyle = T.text; ctx.font = '600 14px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.textAlign = 'right';
    ctx.fillText(`HI ${pad(Best.get(o.id))}  ${pad(g.score)}`, W - 14, 24);
    ctx.textAlign = 'left';
    const lines = o.hud ? o.hud(g) : [];
    ctx.font = '500 12px system-ui, sans-serif';
    lines.forEach((l, i) => { ctx.fillStyle = T.text; ctx.fillText(Array.isArray(l) ? l[0] : l, 14, 22 + i * 16); });
    for (const f of g.fx) { ctx.globalAlpha = clamp(f.t / 0.5, 0, 1); ctx.fillStyle = f.color; ctx.font = '700 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1; }
    ctx.textAlign = 'left';
    if (g.banner) ART.banner(ctx, W, g.banner.text, 70, T.text);
  },
  mazeFloor(m, ctx) {
    const T = m.theme;
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, m.W, m.H);
    ctx.fillStyle = T.floor; ctx.fillRect(m.ox, m.oy, m.cols * m.ts, m.rows * m.ts);
  },
  mazeTiles(m, ctx) {
    const ts = m.ts, ox = m.ox, oy = m.oy, T = m.theme;
    (function () {
    for (const pd of m.puddles) { ctx.globalAlpha = clamp(pd.t / 1.5, 0, 1) * 0.9; ctx.fillStyle = '#4a2a18'; ell(ctx, ox + (pd.x + 0.5) * ts, oy + (pd.y + 0.55) * ts, ts * 0.46, ts * 0.3); ctx.fill(); ctx.globalAlpha = 1; }
    for (let y = 0; y < m.rows; y++) for (let x = 0; x < m.cols; x++) {
      const c = m.grid[y][x], X = ox + x * ts, Y = oy + y * ts;
      if (c === '#') {
        ctx.fillStyle = T.wall; ctx.fillRect(X, Y, ts, ts);
        ctx.strokeStyle = T.edge; ctx.lineWidth = 1.5; ctx.beginPath();
        const wall = (xx, yy) => yy < 0 || yy >= m.rows || xx < 0 || xx >= m.cols || m.grid[yy][xx] === '#';
        if (!wall(x, y - 1)) { ctx.moveTo(X, Y + 0.75); ctx.lineTo(X + ts, Y + 0.75); }
        if (!wall(x, y + 1)) { ctx.moveTo(X, Y + ts - 0.75); ctx.lineTo(X + ts, Y + ts - 0.75); }
        if (!wall(x - 1, y)) { ctx.moveTo(X + 0.75, Y); ctx.lineTo(X + 0.75, Y + ts); }
        if (!wall(x + 1, y)) { ctx.moveTo(X + ts - 0.75, Y); ctx.lineTo(X + ts - 0.75, Y + ts); }
        ctx.stroke();
      } else if (c === '.') {
        ctx.fillStyle = '#f2f4f8'; ctx.beginPath(); ctx.ellipse(X + ts / 2, Y + ts / 2, ts * 0.12, ts * 0.07, ((x * 7 + y * 3) % 5) * 0.6, 0, TAU); ctx.fill();
      } else if (c === 'o') {
        const s = 1 + Math.sin(m.t * 6) * 0.12;
        ctx.fillStyle = '#ff8c5a'; ell(ctx, X + ts / 2, Y + ts / 2, ts * 0.28 * s, ts * 0.28 * s); ctx.fill();
        ctx.fillStyle = '#ffd0b0'; ell(ctx, X + ts * 0.42, Y + ts * 0.42, ts * 0.08, ts * 0.08); ctx.fill();
      } else if (c === 'T') {
        ctx.fillStyle = '#fddc69'; rr(ctx, X + ts * 0.12, Y + ts * 0.25, ts * 0.76, ts * 0.5, 3); ctx.fill();
        ctx.fillStyle = '#17251b'; ctx.fillRect(X + ts * 0.42, Y + ts * 0.25, ts * 0.16, ts * 0.5);
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(m.t * 5); ctx.strokeStyle = '#fddc69'; ctx.lineWidth = 2; ell(ctx, X + ts / 2, Y + ts / 2, ts * 0.6, ts * 0.6); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (c === 'F') {
        ctx.fillStyle = '#ff8c5a'; rr(ctx, X + ts * 0.1, Y + ts * 0.28, ts * 0.8, ts * 0.44, 5); ctx.fill();
        ctx.strokeStyle = '#ffd0b0'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let i = 0; i < 3; i++) { ctx.moveTo(X + ts * (0.25 + i * 0.2), Y + ts * 0.3); ctx.lineTo(X + ts * (0.18 + i * 0.2), Y + ts * 0.7); }
        ctx.stroke();
      }
    }
    }).call(m);
  },
  ghost: drawGhost,
  maki: drawMaki,
  temaki: drawTemaki,
  mazeHud(m, ctx) {
    const o = m.o, ts = m.ts, ox = m.ox, oy = m.oy;
    // HUD
    const hx = ox + m.cols * ts + 18;
    ctx.textAlign = 'left'; ctx.fillStyle = '#8a8f98'; ctx.font = '500 11px system-ui';
    ctx.fillText((m.map.name || '').toUpperCase(), hx, oy + 12);
    ctx.fillStyle = '#f2f4f8'; ctx.font = '600 15px ui-monospace, Menlo, monospace';
    ctx.fillText(pad(m.score), hx, oy + 32);
    ctx.fillStyle = '#8a8f98'; ctx.font = '500 11px ui-monospace, Menlo, monospace';
    ctx.fillText('HI ' + pad(Best.get(o.id)), hx, oy + 48);
    let yy = oy + 68;
    if (!o.noLives) {
      for (let i = 0; i < m.lives; i++) { const cx = hx + 8 + i * 20, cy = yy; ctx.fillStyle = '#17251b'; ell(ctx, cx, cy, 7, 7); ctx.fill(); ctx.fillStyle = '#f2f4f8'; ell(ctx, cx, cy, 5, 5); ctx.fill(); ctx.fillStyle = '#ff8c5a'; ell(ctx, cx, cy, 2.5, 2.5); ctx.fill(); }
      yy += 22;
    }
    ctx.font = '500 12px system-ui';
    const lines = o.hud ? o.hud(m) : [];
    for (const l of lines) {
      const [txt, col] = Array.isArray(l) ? l : [l, '#dde1e6'];
      ctx.fillStyle = col; ctx.fillText(txt, hx, yy); yy += 17;
    }
    for (const f of m.fx) { ctx.globalAlpha = clamp(f.t / 0.5, 0, 1); ctx.fillStyle = f.color; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1; ctx.textAlign = 'left'; }
    if (m.banner) {
      const cx = ox + (m.cols * ts) / 2;
      ctx.font = '700 16px system-ui'; ctx.textAlign = 'center';
      const w = ctx.measureText(m.banner.text).width + 24;
      ctx.fillStyle = 'rgba(14,14,14,.85)'; rr(ctx, cx - w / 2, oy + m.rows * ts * 0.5 - 18, w, 28, 6); ctx.fill();
      ctx.fillStyle = '#fddc69'; ctx.fillText(m.banner.text, cx, oy + m.rows * ts * 0.5 + 1); ctx.textAlign = 'left';
    }
  },
});

/* Shared maze cast (used by Daily Roll and the Sushi Rush boss). */
const CAST = {
  wasabi: { label: 'Wasabi', color: '#a6c94a', ai: 'chase' },
  ginger: { label: 'Ginger', color: '#ff9cac', ai: 'ambush' },
  soy: { label: 'Soy', color: '#a0704a', ai: 'random', soy: true, speed: 4.4 },
  puffer: { label: 'Puffer', color: '#f2cc60', ai: 'chase', jitter: 0.45, puffer: true },
};
const cast = (k, extra = {}) => Object.assign({ kind: k }, CAST[k], extra);
const castHooks = {
  onArrive(m, e) {
    if (e.soy && e.fright === 0) {
      e.n = (e.n || 0) + 1;
      if (e.n % 2 === 0 && !m.puddles.some((p) => p.x === e.x && p.y === e.y)) { m.puddles.push({ x: e.x, y: e.y, t: 7 }); EVT.emit('puddle', { m, g: e }); }
    }
  },
  ghostUpdate(m, g, dt) {
    if (!g.puffer) return;
    g.pt = (g.pt || 0) + dt;
    const inf = g.pt % 7 > 4.5 && g.fright === 0;
    if (inf && !g.inflated) EVT.emit('inflate', { m, g });
    g.inflated = inf; g.frozen = inf; g.hitR = inf ? 1.1 : (g.baseHitR || 0.7);
  },
};
