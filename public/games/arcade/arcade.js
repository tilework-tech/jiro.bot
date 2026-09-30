'use strict';
/*
 * Mouse-only arcade: Sushi Rush and Daily Roll side by side.
 * The game under the cursor is live; moving the cursor away pauses it.
 * Runner: click to jump. Maze: the maki steers toward the cursor.
 */
const slots = [];
let hovered = null;

class Slot {
  constructor(card, { id, make }) {
    this.card = card; this.id = id; this.make = make; this.state = 'title'; this.stateT = 0; this.mouse = null;
    this.canvas = card.querySelector('canvas');
    this.engine = make();
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 2;
    this.canvas.width = this.engine.W * dpr; this.canvas.height = this.engine.H * dpr;
    this.ctx = this.canvas.getContext('2d'); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    card.addEventListener('pointerenter', () => this.enter());
    card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.leave(); });
    this.canvas.addEventListener('pointermove', (e) => { this.mouse = this.toLogical(e); });
    this.canvas.addEventListener('pointerdown', (e) => { this.mouse = this.toLogical(e); this.enter(); this.press(); });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  toLogical(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * this.engine.W, y: ((e.clientY - r.top) / r.height) * this.engine.H };
  }
  setState(s) { this.state = s; this.stateT = 0; }
  enter() {
    if (hovered && hovered !== this) hovered.leave();
    hovered = this;
    for (const s of slots) s.card.classList.toggle('live', s === this);
    if (this.state === 'paused') this.setState('play');
  }
  leave() {
    if (this.state === 'play') this.setState('paused');
    if (hovered === this) hovered = null;
    this.card.classList.remove('live');
    this.mouse = null;
  }
  press() {
    if (this.state === 'title' || this.state === 'over') { if (this.stateT > 0.3) { this.engine.reset(true); this.setState('play'); } return; }
    if (this.state === 'play' && this.engine.tap) this.engine.tap();
  }
  maze() {
    const e = this.engine;
    if (e instanceof Maze) return e;
    if (typeof Rush !== 'undefined' && e instanceof Rush && e.phase === 'boss') return e.cur;
    return null;
  }
  steer() {
    const m = this.maze();
    if (!m || !this.mouse) return;
    const p = m.players[0], [px, py] = m.pos(p);
    const dx = (this.mouse.x - m.ox) / m.ts - 0.5 - px, dy = (this.mouse.y - m.oy) / m.ts - 0.5 - py;
    if (Math.hypot(dx, dy) < 0.5) return;
    const horiz = Math.abs(dx) > Math.abs(dy);
    const prim = horiz ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    const sec = horiz ? [0, Math.sign(dy)] : [Math.sign(dx), 0];
    // Decide from the tile the maki is about to enter, so the turn is taken at the next junction.
    const bx = p.prog > 0 ? p.x + p.dir[0] : p.x, by = p.prog > 0 ? p.y + p.dir[1] : p.y;
    const reverse = prim[0] === -p.dir[0] && prim[1] === -p.dir[1];
    if (reverse || m.open(bx + prim[0], by + prim[1])) p.want = prim;
    else if ((sec[0] || sec[1]) && m.open(bx + sec[0], by + sec[1])) p.want = sec;
    else p.want = prim;
  }
  frame(dt) {
    this.stateT += dt;
    if (this.state === 'play') {
      this.steer();
      this.engine.update(dt);
      if (this.engine.over) {
        Best.set(this.id, this.engine.score); this.setState('over');
        if (this.id.startsWith('daily')) EVT.emit('gameover', { engine: this.engine });
      }
    }
    this.draw();
  }
  draw() {
    const ctx = this.ctx, e = this.engine, W = e.W, H = e.H;
    e.draw(ctx);
    const m = this.maze();
    if (this.state === 'play' && m && this.mouse) {
      const x = Math.round(this.mouse.x), y = Math.round(this.mouse.y);
      ctx.strokeStyle = 'rgba(255,123,79,.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.moveTo(x - 11, y); ctx.lineTo(x - 4, y); ctx.moveTo(x + 4, y); ctx.lineTo(x + 11, y);
      ctx.moveTo(x, y - 11); ctx.lineTo(x, y - 4); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 11); ctx.stroke();
    }
    let lines = null;
    if (this.state === 'title') lines = ['Click to play', this.card.dataset.hint];
    else if (this.state === 'paused') lines = ['Paused', 'Move the mouse back here to resume'];
    else if (this.state === 'over') lines = [e.overMsg || 'Game over', `Score ${Math.floor(e.score)} · click to play again`];
    if (lines) {
      ctx.fillStyle = 'rgba(18,13,10,.62)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.fillStyle = '#f4ead7';
      ctx.font = '700 24px "Instrument Sans", system-ui'; ctx.fillText(lines[0], W / 2, H / 2 - 4);
      ctx.font = '500 14px "Instrument Sans", system-ui'; ctx.fillStyle = '#cbbca3'; ctx.fillText(lines[1], W / 2, H / 2 + 20);
      ctx.textAlign = 'left';
    }
  }
}

slots.push(new Slot(document.getElementById('rush'), { id: 'rush', make: () => new Rush(RUSH_W, RUSH_H) }));
slots.push(new Slot(document.getElementById('daily'), { id: 'daily-' + DAILY.date, make: () => new Maze(DAILY_W, DAILY_H, dailyMode()) }));
document.addEventListener('visibilitychange', () => { if (document.hidden && hovered) hovered.leave(); });
let last = performance.now();
(function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  for (const s of slots) s.frame(s === hovered ? dt : 0);
  requestAnimationFrame(loop);
})(last);
