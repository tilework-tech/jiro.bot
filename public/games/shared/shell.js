'use strict';
/*
 * Single-game page controller: canvas, input, loop, and screen states.
 * States: 'title' -> 'play' <-> 'paused' -> 'over' -> 'play' ...
 * Art/UI files can replace ART.screen(shell, ctx) to draw the title, pause and game-over screens,
 * and push functions onto ART.preDraw (before the frame, e.g. camera shake) and ART.layers (after the frame, e.g. particles).
 * Both receive (shell, ctx, dt). EVT emits 'state' whenever the state changes.
 */
const Shell = {
  init({ canvas, make, id, W, H, pixelScale = 1 }) {
    this.id = id; this.make = make; this.canvas = canvas; this.state = 'title'; this.t = 0; this.stateT = 0;
    this.engine = make();
    this.W = W || this.engine.W; this.H = H || this.engine.H;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * pixelScale;
    canvas.width = this.W * dpr; canvas.height = this.H * dpr;
    this.ctx = canvas.getContext('2d'); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr;
    let down = null;
    canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const dx = e.clientX - down[0], dy = e.clientY - down[1]; down = null;
      if (Math.hypot(dx, dy) > 24 && this.state === 'play' && this.engine.swipe) {
        this.engine.swipe(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]); return;
      }
      this.primary();
    });
    const skip = (e) => e.target.closest && e.target.closest('input, textarea, button, a, select');
    window.addEventListener('keydown', (e) => {
      if (skip(e)) return;
      if (this.key(e.code, true)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { if (!skip(e) && this.state === 'play') this.engine.input(e.code, false); });
    window.addEventListener('blur', () => this.pause());
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    EVT.emit('state', { shell: this, state: this.state });
    return this;
  },
  setState(s) { if (this.state === s) return; this.state = s; this.stateT = 0; EVT.emit('state', { shell: this, state: s }); },
  start() { this.engine.reset(true); this.setState('play'); EVT.emit('start', { shell: this }); },
  pause() { if (this.state === 'play') { this.setState('paused'); if (this.engine.keys) this.engine.keys = {}; } },
  resume() { if (this.state === 'paused') this.setState('play'); },
  primary() {
    if (this.state === 'title' || this.state === 'over') { if (this.stateT > 0.35) this.start(); }
    else if (this.state === 'paused') this.resume();
    else if (this.engine.tap) this.engine.tap();
  },
  key(code, down) {
    if (this.state !== 'play') {
      if (down && (code === 'Space' || code === 'Enter')) { this.primary(); return true; }
      return false;
    }
    if (down && (code === 'Escape' || code === 'KeyP')) { this.pause(); return true; }
    this.engine.input(code, down);
    return ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code);
  },
  frame(dt) {
    this.t += dt; this.stateT += dt;
    if (this.state === 'play') {
      this.engine.update(dt);
      if (this.engine.over) { Best.set(this.id, this.engine.score); this.setState('over'); EVT.emit('gameover', { shell: this, engine: this.engine }); }
    }
    const ctx = this.ctx;
    ctx.save();
    for (const f of ART.preDraw) f(this, ctx, dt);
    this.engine.draw(ctx);
    ctx.restore();
    for (const f of ART.layers) f(this, ctx, dt);
    this.canvas.style.filter = this.engine.cssFilter || '';
    ART.screen(this, ctx, dt);
  },
};

ART.screen = function (shell, ctx) {
  if (shell.state === 'play') return;
  const W = shell.W, H = shell.H, e = shell.engine;
  const lines = shell.state === 'title' ? ['Click or press Space to start', ''] :
    shell.state === 'paused' ? ['Paused', 'Click or press Space to resume'] :
    [e.overMsg || 'Game over', `Score ${Math.floor(e.score)} · click or Space to retry`];
  ctx.fillStyle = 'rgba(18,13,10,.6)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.fillStyle = '#f4ead7';
  ctx.font = '700 22px system-ui'; ctx.fillText(lines[0], W / 2, H / 2);
  ctx.font = '500 13px system-ui'; ctx.fillText(lines[1], W / 2, H / 2 + 22);
  ctx.textAlign = 'left';
};
