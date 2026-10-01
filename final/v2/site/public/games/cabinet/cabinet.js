'use strict';
/*
 * Sushi Rush inside Jiro's arcade cabinet (stop 4). The engine runs untouched at its native 640 × 300;
 * every frame is snapped to the site's 56-colour palette so the game sits in the same art as the room.
 * The page around it sends {cabinet: "pause" | "resume"} when the cabinet leaves or re-enters the view.
 * Keys only reach the game while this frame has focus, so Space and the arrows keep scrolling the page.
 */
const canvas = document.querySelector('canvas');
const view = canvas.getContext('2d', { willReadFrequently: true });
const work = document.createElement('canvas');
const ctx = work.getContext('2d', { willReadFrequently: true });
const game = new Rush(RUSH_W, RUSH_H);
canvas.width = work.width = RUSH_W; canvas.height = work.height = RUSH_H;

// 15-bit colour → nearest palette colour (redmean), built once.
let lut = null;
const ready = fetch('./jiro56.gpl').then((r) => r.text()).then((txt) => {
  const pal = [];
  for (const line of txt.split('\n')) { const m = /^\s*(\d+)\s+(\d+)\s+(\d+)/.exec(line); if (m) pal.push([+m[1], +m[2], +m[3]]); }
  lut = new Uint32Array(32768);
  for (let i = 0; i < 32768; i++) {
    const r = ((i >> 10) & 31) * 8 + 4, g = ((i >> 5) & 31) * 8 + 4, b = (i & 31) * 8 + 4;
    let best = 0, bd = Infinity;
    for (const [pr, pg, pb] of pal) {
      const rm = (r + pr) / 2, dr = r - pr, dg = g - pg, db = b - pb;
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) { bd = d; best = (255 << 24) | (pb << 16) | (pg << 8) | pr; }
    }
    lut[i] = best;
  }
});
ready.catch((e) => console.error('cabinet palette', e));

const cab = { state: 'title', t: 0, mouse: null };
window.__cabinet = cab;
const set = (s) => { cab.state = s; cab.t = 0; };
const start = () => { game.reset(); set('play'); };
if (new URLSearchParams(location.search).has('autostart')) ready.then(start);

addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data) return;
  if (e.data.cabinet === 'pause' && cab.state === 'play') set('paused');
  if (e.data.cabinet === 'resume' && cab.state === 'paused') set('play');
});
document.addEventListener('visibilitychange', () => { if (document.hidden && cab.state === 'play') set('paused'); });

const logical = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * RUSH_W, y: ((e.clientY - r.top) / r.height) * RUSH_H };
};
canvas.addEventListener('pointermove', (e) => { cab.mouse = logical(e); });
canvas.addEventListener('pointerdown', (e) => {
  cab.mouse = logical(e);
  if (cab.state === 'paused') return set('play');
  if (cab.state !== 'play') { if (cab.t > 0.3) start(); return; }
  game.tap();
});
const KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
for (const type of ['keydown', 'keyup']) addEventListener(type, (e) => {
  if (!KEYS.has(e.code)) return;
  e.preventDefault();
  if (type === 'keydown' && cab.state !== 'play') { if (!e.repeat && cab.t > 0.3) cab.state === 'paused' ? set('play') : start(); return; }
  game.input(e.code, type === 'keydown');
});

/** In the boss maze the maki turns toward the pointer at the next junction (same rule as the arcade page). */
function steer() {
  if (game.phase !== 'boss' || !cab.mouse) return;
  const m = game.cur, p = m.players[0], [px, py] = m.pos(p);
  const dx = (cab.mouse.x - m.ox) / m.ts - 0.5 - px, dy = (cab.mouse.y - m.oy) / m.ts - 0.5 - py;
  if (Math.hypot(dx, dy) < 0.5) return;
  const horiz = Math.abs(dx) > Math.abs(dy);
  const prim = horiz ? [Math.sign(dx), 0] : [0, Math.sign(dy)], sec = horiz ? [0, Math.sign(dy)] : [Math.sign(dx), 0];
  const bx = p.prog > 0 ? p.x + p.dir[0] : p.x, by = p.prog > 0 ? p.y + p.dir[1] : p.y;
  const reverse = prim[0] === -p.dir[0] && prim[1] === -p.dir[1];
  if (reverse || m.open(bx + prim[0], by + prim[1])) p.want = prim;
  else if ((sec[0] || sec[1]) && m.open(bx + sec[0], by + sec[1])) p.want = sec;
  else p.want = prim;
}

function overlay(a, b) {
  ctx.fillStyle = 'rgba(11,3,2,.66)'; ctx.fillRect(0, 0, RUSH_W, RUSH_H);
  ctx.textAlign = 'center'; ctx.fillStyle = '#efdabd'; ctx.font = '700 26px system-ui, sans-serif'; ctx.fillText(a, RUSH_W / 2, RUSH_H / 2 - 4);
  ctx.fillStyle = '#d9c9b0'; ctx.font = '500 15px system-ui, sans-serif'; ctx.fillText(b, RUSH_W / 2, RUSH_H / 2 + 22); ctx.textAlign = 'left';
}

let last = performance.now();
(function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  cab.t += dt;
  if (cab.state === 'play') {
    steer(); game.update(dt);
    if (game.over) { Best.set('rush', game.score); set('over'); }
  }
  if (cab.state !== 'paused' || cab.t < 0.1) {
    game.draw(ctx);
    if (cab.state === 'title') overlay('Sushi Rush', 'Click or press Space to play');
    else if (cab.state === 'paused') overlay('Paused', 'Click to carry on');
    else if (cab.state === 'over') overlay(game.overMsg || 'Game over', `Score ${Math.floor(game.score)} · click to play again`);
    if (lut) {
      const img = ctx.getImageData(0, 0, RUSH_W, RUSH_H), px = new Uint32Array(img.data.buffer);
      for (let i = 0; i < px.length; i++) { const c = px[i]; px[i] = lut[((c & 0xf8) << 7) | ((c >> 6) & 0x3e0) | ((c >> 19) & 0x1f)]; }
      view.putImageData(img, 0, 0);
    }
  }
  requestAnimationFrame(loop);
})(last);
