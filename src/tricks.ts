// The surprise engine. Every pickup, drop, and throw can trigger a trick;
// tricks are drawn from a shuffled bag that favours ones you haven't seen.

import { sfx } from './audio';
import { BELT_KINDS, Kind, NIGIRI, SPECS, nigiriOf, toppingOf } from './sushi';
import type { Body, Trick, World } from './world';

export interface TrickMeta {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const TRICKS: TrickMeta[] = [
  { id: 'takecopter', name: 'Take-copter', desc: 'It grew a propeller and took a lap.', icon: '🚁' },
  { id: 'legs', name: 'Little legs', desc: 'Walked itself back to the belt.', icon: '🦵' },
  { id: 'mitosis', name: 'Mitosis', desc: 'One became three. Then one again.', icon: '🧫' },
  { id: 'rocket', name: 'Wasabi rocket', desc: 'Too much wasabi. Parachute deployed.', icon: '🚀' },
  { id: 'stone', name: 'Stone cold', desc: 'Turned to stone. Sushi all along.', icon: '🪨' },
  { id: 'bouncy', name: 'Super bouncy', desc: 'Boing. Boing. Boing.', icon: '🏀' },
  { id: 'fish', name: 'Fresh catch', desc: 'Still flopping. Very fresh.', icon: '🐟' },
  { id: 'ninja', name: 'Ninja vanish', desc: 'Nin nin.', icon: '🥷' },
  { id: 'dance', name: 'Conga line', desc: 'Everybody on the floor.', icon: '🪩' },
  { id: 'sleepy', name: 'Food coma', desc: 'Fell asleep. Poke it.', icon: '💤' },
  { id: 'magnet', name: 'Group hug', desc: 'Pulled all its friends in.', icon: '🫂' },
  { id: 'pixel', name: '8-bit mode', desc: 'Rendered in Jiro-vision.', icon: '👾' },
  { id: 'gold', name: 'Omakase gold', desc: 'One in twenty-five. Shiny.', icon: '✨' },
  { id: 'chopsticks', name: 'Hashi from above', desc: 'The chef keeps a tidy counter.', icon: '🥢' },
  { id: 'hatch', name: 'It was an egg', desc: 'Tamago means egg. Surprise.', icon: '🐣' },
  { id: 'backflip', name: 'Shrimp flip', desc: 'Judges: 9.9, 10, 9.8.', icon: '🦐' },
  { id: 'wheel', name: 'Wheel mode', desc: 'Maki are round. Obviously.', icon: '🛞' },
  { id: 'balloon', name: 'Inflatable', desc: 'Pfffffffft.', icon: '🎈' },
  { id: 'slippery', name: 'Slippery!', desc: 'Fresh fish is slippery.', icon: '💦' },
  { id: 'peel', name: 'Topping thief', desc: 'You took the fish. The rice noticed.', icon: '🍚' },
  { id: 'reunite', name: 'Reunited', desc: 'Fish, meet rice.', icon: '💞' },
  { id: 'shy', name: 'Shy one', desc: 'Kyaa! Put it down!', icon: '😳' },
  { id: 'boomerang', name: 'Boomerang', desc: 'Throw hard. It comes back.', icon: '🪃' },
  { id: 'comet', name: 'Comet', desc: 'Thrown hard enough to burn.', icon: '☄️' },
  { id: 'dizzy', name: 'Shaken, not stirred', desc: 'Rice everywhere. Very dizzy.', icon: '😵‍💫' },
  { id: 'fusion', name: 'Sushi fusion', desc: 'Two of a kind became one big one.', icon: '🧬' },
  { id: 'mega', name: 'Mega sushi', desc: 'Maximum size. Crowned.', icon: '👑' },
  { id: 'feed', name: 'Feed the chef', desc: 'Jiro tastes everything.', icon: '🤖' },
  { id: 'rocks', name: 'Jiro eats rocks', desc: 'Crunchy. Good fiber.', icon: '💎' },
  { id: 'diner', name: 'Table service', desc: 'The customer is always hungry.', icon: '🍽️' },
  { id: 'you', name: 'Snack break', desc: 'Eating on the job. Relatable.', icon: '🧑‍💻' },
  { id: 'turbo', name: 'Turbo belt', desc: 'He makes you faster.', icon: '⚡' },
  { id: 'hello', name: 'Irasshaimase', desc: 'Jiro says hi.', icon: '👋' },
  { id: 'cat', name: 'Lucky lantern', desc: 'Tapped the lamp. It rained sushi.', icon: '🏮' },
  { id: 'bubbles', name: 'Bubble wrap', desc: 'Popped ten bubbles. Satisfying.', icon: '🫧' },
];

export interface Ctx {
  w: World;
  discover(id: string): void;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T>(a: T[]) => a[(Math.random() * a.length) | 0];

let ctx: Ctx;
export function initTricks(c: Ctx) {
  ctx = c;
}

const isFishy = (k: Kind) => ['salmon', 'maguro', 'hamachi', 'unagi', 'sakemaki'].includes(k);
const halfH = (b: Body) => (SPECS[b.kind].h / 2) * b.scale;

// Wait until a body lands (or a timeout), then swap in the real trick.
function afterLanding(b: Body, id: string, make: () => Trick | null, timeout = 2.5): Trick {
  let t = 0;
  return {
    id,
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      if ((b.grounded && b.groundT > 0.08) || t > timeout) {
        const next = make();
        b.trick = next;
        return !!next;
      }
      return true;
    },
  };
}

// ───────────────────────── individual tricks ─────────────────────────

function legs(b: Body): Trick {
  let t = 0;
  let walk = 0;
  let jumpCool = 0;
  let dir = 1;
  b.upright = 1.4;
  ctx.w.fx.text(b.x, b.y - 46, 'brb!', { color: '#ffd9b8' });
  ctx.discover('legs');
  return {
    id: 'legs',
    mood: 'happy',
    update(dt) {
      t += dt;
      jumpCool -= dt;
      if (b.state !== 'free') return false;
      const n = ctx.w.belt.nearest(b.x, b.y);
      if (t > 0.35) {
        dir = Math.sign(n.x - b.x) || dir;
        if (b.grounded) {
          b.vx += (dir * 190 - b.vx) * Math.min(1, dt * 8);
          walk += dt * 14;
          if (Math.abs(b.vx) < 40 && jumpCool <= 0 && t > 0.8) {
            b.vy = -760;
            jumpCool = 0.9;
            sfx.boing();
          }
        }
        const close = n.d < ctx.w.belt.width / 2 + 44 || (Math.abs(n.x - b.x) < 36 && Math.abs(n.y - b.y) < 280);
        if (close && ctx.w.attach(b, n)) {
          ctx.w.fx.text(b.x, b.y - 40, 'hup!', { color: '#ffd9b8', size: 18 });
          return false;
        }
      }
      if (t > 8) {
        ctx.w.fx.text(b.x, b.y - 40, '…nah', { size: 18 });
        b.say('sleep', 3);
        return false;
      }
      return true;
    },
    drawBack(c) {
      const grow = Math.min(1, t / 0.3);
      const len = 15 * grow;
      const base = SPECS[b.kind].h / 2 - 6;
      c.save();
      c.strokeStyle = '#2a1208';
      c.lineWidth = 3.4;
      c.lineCap = 'round';
      for (const side of [-1, 1]) {
        const sw = Math.sin(walk + (side > 0 ? Math.PI : 0)) * 0.7 * (b.grounded ? 1 : 0.3);
        const x0 = side * 11;
        const x1 = x0 + Math.sin(sw) * len;
        const y1 = base + Math.cos(sw) * len;
        c.beginPath();
        c.moveTo(x0, base);
        c.lineTo(x1, y1);
        c.stroke();
        c.fillStyle = '#c8321e';
        c.beginPath();
        c.ellipse(x1 + 3 * b.flip, y1 + 1, 5 * grow, 3 * grow, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    },
    end() {
      b.upright = 0;
    },
  };
}

function takecopter(b: Body): Trick {
  let t = 0;
  const v = ctx.w.viewport();
  const cx0 = clamp(b.x, 140, ctx.w.docW - 140);
  const cy0 = clamp(b.y - 180, v.top + 140, v.bottom - 200);
  b.gravity = 0;
  b.upright = 0.8;
  sfx.whistle();
  ctx.discover('takecopter');
  const dur = 4.4;
  return {
    id: 'takecopter',
    mood: 'happy',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      const tx = cx0 + Math.sin(t * 1.4) * Math.min(260, ctx.w.docW * 0.28);
      const ty = cy0 + Math.sin(t * 2.8) * 70 - Math.min(t, 1) * 30;
      b.vx += ((tx - b.x) * 7 - b.vx * 2.2) * dt;
      b.vy += ((ty - b.y) * 7 - b.vy * 2.2) * dt;
      b.a += (clamp(b.vx * 0.0009, -0.5, 0.5) - b.a) * Math.min(1, dt * 5);
      if (Math.random() < dt * 8) ctx.w.fx.burst('smoke', b.x, b.y - halfH(b) - 16, 1, { speed: 40, size: 0.35, life: 0.5 });
      if (t > dur) {
        ctx.w.fx.burst('smoke', b.x, b.y - halfH(b) - 10, 8, { speed: 120, size: 0.6 });
        sfx.poof();
        b.gravity = 1;
        b.upright = 0;
        ctx.w.fx.text(b.x, b.y - 50, 'battery low', { size: 16 });
        return false;
      }
      return true;
    },
    drawFront(c) {
      const top = -SPECS[b.kind].h / 2 - 2;
      const grow = Math.min(1, t / 0.25) * (t > dur - 0.2 ? Math.max(0, (dur - t) / 0.2) : 1);
      c.save();
      c.scale(b.flip, 1);
      c.translate(0, top);
      c.scale(grow, grow);
      c.fillStyle = '#8a5a2c';
      c.fillRect(-1.5, -14, 3, 14);
      const spin = t * 38;
      const w = 26 * Math.cos(spin);
      c.fillStyle = '#ffd166';
      c.beginPath();
      c.ellipse(w / 2, -15, Math.abs(w / 2) + 0.5, 3.2, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ff9f43';
      c.beginPath();
      c.ellipse(-w / 2, -15, Math.abs(w / 2) + 0.5, 3.2, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#c8321e';
      c.beginPath();
      c.arc(0, -15, 3, 0, Math.PI * 2);
      c.fill();
      c.restore();
    },
    end() {
      b.gravity = 1;
      b.upright = 0;
    },
  };
}

let groupSeq = 1;
function mitosis(b: Body): Trick {
  let t = 0;
  let split = false;
  return {
    id: 'mitosis',
    mood: 'surprised',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      if (!split && t > 0.18) {
        split = true;
        const g = groupSeq++;
        const s = b.scale * 0.6;
        b.scale = s;
        b.group = g;
        const kids = [b];
        for (let i = 0; i < 2; i++) {
          const k = ctx.w.spawn(b.kind, b.x + (i ? 20 : -20), b.y - 10, 'free');
          k.scale = s;
          k.flip = b.flip;
          k.variant = b.variant;
          k.group = g;
          k.vx = (i ? 1 : -1) * rnd(250, 420);
          k.vy = rnd(-700, -450);
          k.va = rnd(-10, 10);
          k.pop = 0.3;
          kids.push(k);
        }
        b.vy = -600;
        for (const k of kids) {
          k.mergeCool = 2.2;
          k.say('happy', 2);
          k.trick = regroup(k, g);
        }
        ctx.w.fx.burst('star', b.x, b.y, 14, { speed: 380 });
        ctx.w.fx.ring(b.x, b.y, 0.8);
        ctx.w.fx.text(b.x, b.y - 50, 'mitosis!', { color: '#a6c94a' });
        sfx.pop();
        setTimeout(() => sfx.pop(), 70);
        ctx.discover('mitosis');
        return true;
      }
      return !split;
    },
  };
}

function regroup(b: Body, g: number): Trick {
  let t = 0;
  return {
    id: 'regroup',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      if (t > 2.2) {
        const mates = ctx.w.bodies.filter((o) => o !== b && o.group === g && o.state === 'free');
        if (!mates.length) return false;
        let mx = 0;
        let my = 0;
        for (const m of mates) {
          mx += m.x;
          my += m.y;
        }
        mx /= mates.length;
        my /= mates.length;
        const dx = mx - b.x;
        const dy = my - b.y;
        const d = Math.hypot(dx, dy) || 1;
        b.vx += (dx / d) * 1400 * dt;
        if (b.grounded && Math.random() < dt * 3) b.vy = -380;
        if (dy < -30) b.vy += (dy / d) * 900 * dt;
      }
      return t < 9;
    },
  };
}

function rocket(b: Body): Trick {
  let t = 0;
  let phase: 'fuse' | 'launch' | 'boom' | 'chute' = 'fuse';
  let pt = 0;
  b.upright = 3;
  ctx.discover('rocket');
  ctx.w.fx.text(b.x, b.y - 46, 'too much wasabi', { color: '#a6c94a', size: 17 });
  return {
    id: 'rocket',
    mood: 'scared',
    physics: true,
    update(dt) {
      t += dt;
      pt += dt;
      if (phase !== 'boom' && b.state !== 'free') return false;
      if (phase === 'fuse') {
        b.x += rnd(-1.5, 1.5);
        if (Math.random() < 0.6) ctx.w.fx.burst('smoke', b.x, b.y + halfH(b), 1, { speed: 60, size: 0.5, life: 0.6 });
        if (pt > 0.75) {
          phase = 'launch';
          pt = 0;
          b.gravity = 0;
          b.ghost = true;
          b.vy = -250;
          sfx.rocket();
        }
      } else if (phase === 'launch') {
        b.vy -= 2800 * dt;
        b.vx = Math.sin(t * 18) * 60;
        ctx.w.fx.burst('flame', b.x, b.y + halfH(b) + 6, 4, { angle: Math.PI / 2, spread: 0.35, speed: 380, g: 0, life: 0.35, size: 1.1 });
        ctx.w.fx.burst('smoke', b.x, b.y + halfH(b) + 18, 1, { angle: Math.PI / 2, spread: 0.5, speed: 120, size: 0.8, life: 0.8 });
        ctx.w.fx.shake(0.6);
        const v = ctx.w.viewport();
        if (pt > 1.1 || b.y < v.top + 90) {
          phase = 'boom';
          pt = 0;
          ctx.w.fx.burst('confetti', b.x, b.y, 40, { speed: 700, g: 500, life: 1.6 });
          ctx.w.fx.burst('rice', b.x, b.y, 24, { speed: 500, g: 900 });
          ctx.w.fx.burst('star', b.x, b.y, 16, { speed: 500, g: 0, life: 0.7 });
          ctx.w.fx.ring(b.x, b.y, 2, 'rgba(166,201,74,0.9)');
          ctx.w.fx.shake(14);
          ctx.w.fx.doFlash(0.25, '200,255,150');
          sfx.boom();
          b.hidden = true;
          b.vx = 0;
          b.vy = 0;
        }
      } else if (phase === 'boom') {
        b.vx = 0;
        b.vy = 0;
        if (pt > 0.8) {
          phase = 'chute';
          pt = 0;
          b.hidden = false;
          b.pop = 0;
          b.ghost = false;
          b.gravity = 0.05;
          b.vy = 40;
          b.upright = 2;
          b.say('happy', 5);
        }
      } else {
        b.vx = Math.sin(pt * 1.7) * 70;
        b.vy = Math.min(b.vy, 110);
        b.a = Math.sin(pt * 1.7) * 0.18;
        if (b.grounded && pt > 0.3) {
          ctx.w.fx.burst('smoke', b.x, b.y + halfH(b), 6, { speed: 80, size: 0.5 });
          ctx.w.fx.text(b.x, b.y - 50, 'safe', { size: 17 });
          return false;
        }
        if (pt > 12) return false;
      }
      return true;
    },
    drawBack(c) {
      if (phase === 'fuse' || phase === 'launch') {
        c.save();
        c.scale(b.flip, 1);
        const y = SPECS[b.kind].h / 2 - 2;
        c.fillStyle = '#8fbf3a';
        c.beginPath();
        c.ellipse(0, y, 12, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#b8e06a';
        c.beginPath();
        c.ellipse(-3, y - 2, 5, 2.5, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    },
    drawFront(c) {
      if (phase !== 'chute') return;
      const open = Math.min(1, pt / 0.35);
      c.save();
      c.scale(b.flip, 1);
      const top = -SPECS[b.kind].h / 2;
      const cy = top - 58;
      c.strokeStyle = 'rgba(244,234,215,0.8)';
      c.lineWidth = 1;
      for (const x of [-26, -8, 8, 26]) {
        c.beginPath();
        c.moveTo(x * 1.5 * open, cy + 4);
        c.lineTo(x * 0.5, top + 6);
        c.stroke();
      }
      const segs = 6;
      const rx = 44 * open;
      for (let i = 0; i < segs; i++) {
        const a0 = Math.PI + (i / segs) * Math.PI;
        const a1 = Math.PI + ((i + 1) / segs) * Math.PI;
        c.fillStyle = i % 2 ? '#f4ead7' : '#c8321e';
        c.beginPath();
        c.moveTo(0, cy + 4);
        c.ellipse(0, cy + 4, rx, 30 * open, 0, a0, a1);
        c.closePath();
        c.fill();
      }
      c.restore();
    },
    end() {
      b.gravity = 1;
      b.ghost = false;
      b.hidden = false;
      b.upright = 0;
    },
  };
}

function stone(b: Body): Trick {
  let t = 0;
  let landed = -1;
  let crack: { x: number; y: number; life: number } | null = null;
  b.variant = 'stone';
  b.gravity = 1.6;
  b.bounce = 0.04;
  sfx.crunch();
  ctx.w.fx.burst('shard', b.x, b.y, 8, { speed: 160 });
  ctx.w.fx.text(b.x, b.y - 46, 'stone cold', { color: '#cfc8be' });
  ctx.discover('stone');
  const restore = () => {
    b.variant = 'normal';
    b.gravity = 1;
    b.bounce = 0.28;
  };
  return {
    id: 'stone',
    update(dt) {
      t += dt;
      if (crack) crack.life -= dt;
      if (b.state === 'gone') return false;
      if (landed >= 0 && b.state === 'free') {
        const since = t - landed;
        if (since > 3.2 && since < 4) {
          b.x += rnd(-1.6, 1.6);
          if (Math.random() < 0.3) ctx.w.fx.burst('shard', b.x + rnd(-20, 20), b.y - 10, 1, { speed: 90 });
        }
        if (since >= 4) {
          restore();
          b.vy = -520;
          b.va = rnd(-6, 6);
          b.say('happy', 2);
          ctx.w.fx.burst('shard', b.x, b.y, 22, { speed: 420 });
          ctx.w.fx.burst('star', b.x, b.y, 10, { speed: 300 });
          ctx.w.fx.text(b.x, b.y - 50, 'ta-da!', { color: '#ffd9b8' });
          sfx.chime();
          return false;
        }
      }
      return t < 14;
    },
    onGround(impact) {
      if (landed >= 0 || impact < 200) return;
      landed = t;
      ctx.w.fx.shake(Math.min(22, impact / 70));
      ctx.w.fx.burst('smoke', b.x, b.y + halfH(b), 14, { speed: 260, size: 0.8, angle: -Math.PI / 2, spread: 1.4 });
      ctx.w.fx.burst('shard', b.x, b.y + halfH(b), 10, { speed: 320 });
      crack = { x: b.x, y: b.y + halfH(b) + 1, life: 3 };
      sfx.thud(1.4);
    },
    onPickup() {
      return true;
    },
    onRelease() {
      return false;
    },
    drawWorld(c) {
      if (!crack || crack.life <= 0) return;
      c.save();
      c.globalAlpha = Math.min(1, crack.life);
      c.strokeStyle = 'rgba(20,14,10,0.85)';
      c.lineWidth = 2;
      c.translate(crack.x, crack.y);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI - Math.PI + 0.3;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * 18 + 4, Math.sin(a) * 4 + 2);
        c.lineTo(Math.cos(a) * 34, Math.sin(a) * 6 + 3);
        c.stroke();
      }
      c.restore();
    },
    end() {
      if (b.variant === 'stone' && b.state !== 'gone') restore();
    },
  };
}

function bouncy(b: Body): Trick {
  let t = 0;
  let n = 0;
  b.bounce = 1.02;
  b.friction = 0.9;
  if (Math.hypot(b.vx, b.vy) < 300) b.vy = -300;
  ctx.discover('bouncy');
  return {
    id: 'bouncy',
    mood: 'happy',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      return n < 7 && t < 7;
    },
    onGround(impact) {
      if (impact < 250) return;
      n++;
      b.sqv += 9;
      sfx.boing();
      ctx.w.fx.burst('star', b.x, b.y + halfH(b), 6, { speed: 260 });
      if (n === 1) ctx.w.fx.text(b.x, b.y - 50, 'boing', { color: '#ffd166' });
    },
    end() {
      b.bounce = 0.28;
      b.friction = 0.55;
    },
  };
}

function fish(b: Body): Trick {
  let t = 0;
  let flops = 0;
  let next = 0.1;
  ctx.discover('fish');
  ctx.w.fx.text(b.x, b.y - 46, 'still fresh!', { color: '#9ad7ff' });
  return {
    id: 'fish',
    mood: 'surprised',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      next -= dt;
      if (b.grounded && next <= 0) {
        flops++;
        next = rnd(0.35, 0.6);
        if (flops >= 5) {
          const n = ctx.w.belt.nearest(b.x, b.y);
          ctx.w.fx.burst('drop', b.x, b.y + 10, 16, { speed: 380 });
          sfx.splash();
          if (ctx.w.attach(b, n)) {
            b.tween!.arc = 180;
            b.tween!.dur = 0.7;
            ctx.w.fx.text(b.x, b.y - 50, 'sploosh', { color: '#9ad7ff' });
            return false;
          }
          b.vy = -900;
          return false;
        }
        b.vy = rnd(-620, -420);
        b.vx = rnd(-160, 160);
        b.va = rnd(-14, 14);
        b.sqv += 6;
        ctx.w.fx.burst('drop', b.x, b.y + 12, 7, { speed: 240 });
        sfx.squish(0.8);
      }
      return t < 8;
    },
    drawFront(c) {
      if (!['salmon', 'maguro', 'hamachi', 'unagi'].includes(b.kind)) return;
      const w = SPECS[b.kind].w / 2;
      const flap = Math.sin(t * 22) * 0.5;
      c.save();
      c.translate(w - 2, -4);
      c.rotate(flap);
      c.fillStyle = b.kind === 'maguro' ? '#a3172b' : b.kind === 'unagi' ? '#5a2a12' : '#f2582c';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(14, -9);
      c.quadraticCurveTo(10, 0, 14, 9);
      c.closePath();
      c.fill();
      c.restore();
    },
  };
}

function ninja(b: Body): Trick {
  let t = 0;
  let gone = false;
  let star = { x: b.x, y: b.y, vx: rnd(-1, 1) > 0 ? 900 : -900, vy: -300, a: 0 };
  return {
    id: 'ninja',
    physics: true,
    update(dt) {
      t += dt;
      if (b.state === 'gone') return false;
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      star.vy += 900 * dt;
      star.a += dt * 30;
      if (!gone && t > 0.22) {
        gone = true;
        ctx.w.fx.burst('smoke', b.x, b.y, 22, { speed: 260, size: 1.2 });
        sfx.poof();
        b.hidden = true;
        b.ghost = true;
        b.gravity = 0;
        b.vx = b.vy = 0;
        star = { x: b.x, y: b.y, vx: Math.random() < 0.5 ? 900 : -900, vy: -350, a: 0 };
        ctx.discover('ninja');
      }
      if (gone) {
        b.vx = b.vy = 0;
        if (t > 1.05) {
          const v = ctx.w.viewport();
          const plates = ctx.w.plates.filter((p) => {
            if (p.body) return false;
            const q = ctx.w.belt.at(p.s);
            return q.y > v.top + 80 && q.y < v.bottom - 80 && p.s > 60;
          });
          b.hidden = false;
          b.ghost = false;
          b.gravity = 1;
          if (plates.length) {
            const p = pick(plates);
            const q = ctx.w.riderPos(p);
            b.state = 'belt';
            b.plate = p;
            p.body = b;
            b.x = q.x;
            b.y = q.y;
            b.a = 0;
          } else {
            b.x = rnd(v.left + 200, v.right - 200);
            b.y = v.top + 60;
          }
          b.pop = 0;
          ctx.w.fx.burst('smoke', b.x, b.y, 18, { speed: 220, size: 1 });
          ctx.w.fx.text(b.x, b.y - 46, 'nin nin', { color: '#cfe8ff' });
          sfx.poof();
          return false;
        }
      }
      return true;
    },
    drawWorld(c) {
      if (!gone || t > 1.2) return;
      c.save();
      c.translate(star.x, star.y);
      c.rotate(star.a);
      c.fillStyle = '#c9d0d8';
      c.strokeStyle = '#3b4148';
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 ? 3 : 11;
        const a = (i / 8) * Math.PI * 2;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    },
    onPickup() {
      return false;
    },
    end() {
      b.hidden = false;
      b.ghost = false;
      b.gravity = 1;
    },
  };
}

function dance(b: Body): Trick {
  let t = 0;
  let hop = 0;
  let note = 0;
  let dir = Math.random() < 0.5 ? -1 : 1;
  b.upright = 1.6;
  const trail: { x: number; y: number }[] = [];
  const followers = ctx.w.bodies
    .filter((o) => o !== b && o.state === 'free' && !o.trick && Math.hypot(o.x - b.x, o.y - b.y) < 700)
    .slice(0, 6);
  followers.forEach((f, i) => {
    f.trick = follower(f, trail, (i + 1) * 16);
  });
  ctx.discover('dance');
  ctx.w.fx.text(b.x, b.y - 50, followers.length ? 'conga!' : 'solo set', { color: '#ffd166' });
  return {
    id: 'dance',
    mood: 'happy',
    update(dt) {
      t += dt;
      hop -= dt;
      if (b.state !== 'free') return false;
      trail.unshift({ x: b.x, y: b.y });
      if (trail.length > 200) trail.pop();
      if (b.x < 140) dir = 1;
      if (b.x > ctx.w.docW - 140) dir = -1;
      if (b.grounded && hop <= 0) {
        hop = 0.42;
        b.vy = -360;
        b.vx = dir * 170;
        b.a = dir * 0.25;
        b.sqv += 5;
        sfx.note(note++);
        ctx.w.fx.burst('note', b.x, b.y - halfH(b) - 6, 1, { speed: 60, life: 1.3 });
        if (note % 6 === 0) dir *= -1;
      }
      return t < 7.5;
    },
    end() {
      b.upright = 0;
      for (const f of followers) if (f.trick?.id === 'follow') f.trick = null;
    },
  };
}

function follower(b: Body, trail: { x: number; y: number }[], lag: number): Trick {
  let hop = Math.random() * 0.4;
  b.upright = 1.6;
  return {
    id: 'follow',
    mood: 'happy',
    update(dt) {
      hop -= dt;
      if (b.state !== 'free') return false;
      const p = trail[Math.min(trail.length - 1, lag)];
      if (p) {
        b.vx += ((p.x - b.x) * 4 - b.vx) * Math.min(1, dt * 4);
        if (b.grounded && hop <= 0) {
          hop = 0.42;
          b.vy = -340 + Math.min(0, (p.y - b.y) * 2);
          b.sqv += 4;
        }
      }
      return true;
    },
    end() {
      b.upright = 0;
    },
  };
}

function sleepy(b: Body): Trick {
  let t = 0;
  let z = 0;
  b.upright = 1.2;
  ctx.discover('sleepy');
  return {
    id: 'sleepy',
    mood: 'sleep',
    update(dt) {
      t += dt;
      z -= dt;
      if (b.state !== 'free') return false;
      if (b.mood !== 'sleep') b.say('sleep', 30);
      if (z <= 0) {
        z = 0.8;
        ctx.w.fx.burst('z', b.x + 14, b.y - halfH(b), 1, { speed: 40, angle: -1.2, spread: 0.3, life: 1.6, size: 0.8 + Math.random() * 0.5 });
        if (ctx.w.visible(b)) sfx.snore();
      }
      b.sq = Math.sin(t * 2) * 0.04;
      const p = ctx.w.pointer;
      if (t > 0.6 && Math.hypot(p.x - b.x, p.y - b.y) < 80) {
        b.vy = -760;
        b.va = rnd(-10, 10);
        b.say('surprised', 1.4);
        ctx.w.fx.text(b.x, b.y - 50, '!!', { color: '#ff7b4f', size: 30 });
        sfx.kyaa();
        return false;
      }
      return t < 18;
    },
    end() {
      b.upright = 0;
      if (b.mood === 'sleep') b.mood = 'neutral';
    },
  };
}

function magnet(b: Body): Trick {
  let t = 0;
  const pulled: Body[] = [];
  for (const o of ctx.w.bodies) {
    if (o === b || o.state === 'held' || o.trick) continue;
    const d = Math.hypot(o.x - b.x, o.y - b.y);
    if (o.state === 'free' && d < 520) pulled.push(o);
    else if (o.state === 'belt' && d < 340 && pulled.length < 6) {
      ctx.w.free(o);
      pulled.push(o);
    }
  }
  b.gravity = 0.15;
  b.vy = Math.min(b.vy, -200);
  for (const o of pulled) {
    o.gravity = 0.15;
    o.say('love', 3);
    o.trick = { id: 'hugged', update: () => t < 2.6 && o.state === 'free', end: () => void (o.gravity = 1) };
  }
  ctx.discover('magnet');
  ctx.w.fx.text(b.x, b.y - 50, 'group hug!', { color: '#ff7a9c' });
  sfx.kyaa();
  return {
    id: 'magnet',
    mood: 'love',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      b.vx *= Math.exp(-3 * dt);
      b.vy *= Math.exp(-3 * dt);
      for (const o of pulled) {
        if (o.state !== 'free') continue;
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        o.vx += (dx / d) * 2400 * dt - o.vx * 2 * dt;
        o.vy += (dy / d) * 2400 * dt - o.vy * 2 * dt;
      }
      if (Math.random() < dt * 10) ctx.w.fx.burst('heart', b.x + rnd(-40, 40), b.y - 20, 1, { speed: 80, life: 1.2 });
      if (t > 2.6) {
        for (const o of pulled) {
          if (o.state !== 'free') continue;
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          o.vx += (dx / d) * 600;
          o.vy += (dy / d) * 600 - 200;
          o.gravity = 1;
        }
        ctx.w.fx.burst('heart', b.x, b.y, 12, { speed: 300 });
        return false;
      }
      return true;
    },
    end() {
      b.gravity = 1;
    },
  };
}

function pixel(b: Body): Trick {
  let t = 0;
  b.variant = 'pixel';
  sfx.zap();
  ctx.discover('pixel');
  ctx.w.fx.text(b.x, b.y - 50, '8-BIT', { color: '#5ff3ff', font: 'Silkscreen' });
  return {
    id: 'pixel',
    update(dt) {
      t += dt;
      if (b.state === 'gone') return false;
      return t < 6;
    },
    onGround(impact) {
      if (impact > 300) sfx.blip(Math.floor(Math.random() * 12));
    },
    onPickup() {
      return true;
    },
    onRelease() {
      return false;
    },
    end() {
      if (b.variant === 'pixel') {
        b.variant = 'normal';
        sfx.zap();
        ctx.w.fx.burst('star', b.x, b.y, 8, { speed: 200 });
      }
    },
  };
}

function chopsticks(b: Body, quiet = false): Trick {
  let t = 0;
  let phase: 'down' | 'carry' | 'up' = 'down';
  let pt = 0;
  let tipX = b.x;
  let tipY = ctx.w.viewport().top - 200;
  let fromX = 0;
  let fromY = 0;
  let target = { x: 0, y: 0 };
  b.gravity = 0;
  b.vx = b.vy = 0;
  if (!quiet) ctx.discover('chopsticks');
  return {
    id: 'chopsticks',
    physics: false,
    update(dt) {
      t += dt;
      pt += dt;
      if (b.state === 'gone') return false;
      if (phase === 'down') {
        const k = Math.min(1, pt / 0.45);
        const e = 1 - Math.pow(1 - k, 3);
        const startY = ctx.w.viewport().top - 200;
        tipX = b.x;
        tipY = startY + (b.y - startY) * e;
        if (k >= 1) {
          phase = 'carry';
          pt = 0;
          fromX = b.x;
          fromY = b.y;
          sfx.click();
          b.say('surprised', 1);
          const n = ctx.w.belt.nearest(b.x, b.y);
          target = { x: n.x, y: n.y - 40 };
        }
      } else if (phase === 'carry') {
        const k = Math.min(1, pt / 0.8);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        b.x = fromX + (target.x - fromX) * e;
        b.y = fromY + (target.y - fromY) * e - Math.sin(k * Math.PI) * 90;
        b.a *= 0.9;
        tipX = b.x;
        tipY = b.y;
        if (k >= 1) {
          phase = 'up';
          pt = 0;
          b.state = 'free';
          b.gravity = 1;
          if (!ctx.w.attach(b)) {
            b.vy = 0;
          }
        }
      } else {
        tipY -= 1400 * dt;
        if (pt > 0.5) return false;
      }
      return true;
    },
    onPickup() {
      return false;
    },
    drawWorld(c) {
      c.save();
      c.translate(tipX, tipY - 6);
      const open = phase === 'down' ? 0.08 : 0;
      for (const side of [-1, 1]) {
        c.save();
        c.rotate(-Math.PI / 2 + 0.12 + side * open);
        c.translate(0, side * 3);
        const L = 520;
        const g = c.createLinearGradient(0, 0, L, 0);
        g.addColorStop(0, '#e9c088');
        g.addColorStop(0.55, '#c98d4f');
        g.addColorStop(0.55, '#1c1c1c');
        g.addColorStop(1, '#0c0c0c');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(0, -2.5);
        c.lineTo(L, -8);
        c.lineTo(L, 8);
        c.lineTo(0, 2.5);
        c.closePath();
        c.fill();
        c.restore();
      }
      c.restore();
    },
    end() {
      b.gravity = 1;
    },
  };
}

interface Chick {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hops: number;
  flying: boolean;
  t: number;
  dir: number;
}

function hatch(b: Body): Trick {
  let t = 0;
  let chick: Chick | null = null;
  b.upright = 2;
  return {
    id: 'hatch',
    mood: 'surprised',
    update(dt) {
      t += dt;
      if (b.state === 'gone') return false;
      if (t < 0.7) {
        b.x += rnd(-1.2, 1.2);
        if (Math.random() < 0.2) ctx.w.fx.burst('shard', b.x, b.y - 10, 1, { speed: 80, colors: ['#ffe07a', '#f4b83a'] });
      } else if (!chick) {
        chick = { x: b.x, y: b.y - halfH(b), vx: 0, vy: -500, hops: 0, flying: false, t: 0, dir: Math.random() < 0.5 ? -1 : 1 };
        ctx.w.fx.burst('shard', b.x, b.y - 10, 12, { speed: 260, colors: ['#ffe07a', '#f4b83a', '#fff6d0'] });
        ctx.w.fx.text(b.x, b.y - 60, 'peep!', { color: '#ffe07a' });
        sfx.chirp();
        b.say('happy', 3);
        ctx.discover('hatch');
      }
      if (chick) {
        const ch = chick;
        ch.t += dt;
        if (!ch.flying) {
          ch.vy += 1800 * dt;
          ch.x += ch.vx * dt;
          ch.y += ch.vy * dt;
          const floor = b.y + halfH(b) - 8;
          if (ch.y > floor) {
            ch.y = floor;
            ch.hops++;
            sfx.chirp();
            if (ch.hops > 3) {
              ch.flying = true;
              ch.vy = -260;
              ch.vx = ch.dir * 200;
            } else {
              ch.vy = -420;
              ch.vx = ch.dir * rnd(80, 160);
            }
          }
        } else {
          ch.vy -= 80 * dt;
          ch.x += ch.vx * dt;
          ch.y += ch.vy * dt;
          if (Math.random() < dt * 4) sfx.chirp();
        }
        if (ch.t > 5) return false;
      }
      return true;
    },
    drawWorld(c) {
      if (!chick) return;
      const ch = chick;
      c.save();
      c.translate(ch.x, ch.y);
      c.scale(ch.dir, 1);
      const flap = ch.flying ? Math.sin(ch.t * 40) : Math.sin(ch.t * 10) * 0.3;
      c.fillStyle = '#ffd84d';
      c.beginPath();
      c.arc(0, 0, 11, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(6, -9, 7.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f2b72a';
      c.save();
      c.translate(-3, -1);
      c.rotate(-0.4 - flap * 0.8);
      c.beginPath();
      c.ellipse(-4, 0, 8, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.fillStyle = '#2a1208';
      c.beginPath();
      c.arc(8, -10, 1.6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ff8a2a';
      c.beginPath();
      c.moveTo(13, -9);
      c.lineTo(18, -7.5);
      c.lineTo(13, -6);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,110,110,0.6)';
      c.beginPath();
      c.arc(6, -6, 1.8, 0, Math.PI * 2);
      c.fill();
      if (!ch.flying) {
        c.strokeStyle = '#ff8a2a';
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(-2, 10);
        c.lineTo(-2, 14);
        c.moveTo(3, 10);
        c.lineTo(3, 14);
        c.stroke();
      }
      c.restore();
    },
    end() {
      b.upright = 0;
    },
  };
}

function backflip(b: Body): Trick {
  let t = 0;
  let launched = false;
  let landed = false;
  return {
    id: 'backflip',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      if (!launched && t > 0.25) {
        launched = true;
        b.vy = -980;
        b.vx = 0;
        b.va = -b.flip * 19;
        b.say('happy', 2);
        sfx.whoosh();
      }
      if (launched && !landed && t > 0.5 && b.grounded) {
        landed = true;
        ['9.9', '10', '9.8'].forEach((s, i) =>
          setTimeout(() => {
            ctx.w.fx.text(b.x + (i - 1) * 46, b.y - 70, s, { color: i === 1 ? '#ffd166' : '#f4ead7', size: 24, life: 1.8 });
            sfx.blip(i * 4);
          }, i * 160),
        );
        ctx.discover('backflip');
        return false;
      }
      return t < 4;
    },
  };
}

function wheel(b: Body): Trick {
  let t = 0;
  const dir = b.vx !== 0 ? Math.sign(b.vx) : Math.random() < 0.5 ? -1 : 1;
  b.friction = 1.2;
  b.bounce = 0.5;
  ctx.discover('wheel');
  ctx.w.fx.text(b.x, b.y - 46, 'wheee', { color: '#ffd9b8' });
  let d = dir;
  return {
    id: 'wheel',
    mood: 'happy',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      if (b.grounded) {
        if (Math.abs(b.vx) < 60 && t > 0.6) d = -d;
        b.va += (d * 30 - b.va) * Math.min(1, dt * 5);
        if (Math.random() < 0.6) ctx.w.fx.burst('spark', b.x - d * 16, b.y + 22 * b.scale, 1, { angle: d > 0 ? Math.PI + 0.3 : -0.3, spread: 0.4, speed: 400, life: 0.3 });
      }
      return t < 3.6;
    },
    end() {
      b.friction = 0.55;
      b.bounce = 0.28;
    },
  };
}

function balloon(b: Body): Trick {
  let t = 0;
  const s0 = b.scale;
  ctx.discover('balloon');
  return {
    id: 'balloon',
    mood: 'surprised',
    update(dt) {
      t += dt;
      if (b.state !== 'free') {
        b.scale = s0;
        return false;
      }
      if (t < 0.6) {
        b.scale = s0 * (1 + (t / 0.6) * 0.75) + Math.sin(t * 40) * 0.03;
        b.gravity = 0.2;
      } else if (t < 2.8) {
        b.scale = s0 * 1.75 + Math.sin(t * 6) * 0.03;
        b.gravity = -0.06;
        b.vx += Math.sin(t * 2) * 30 * dt;
        b.vy = Math.max(b.vy, -120);
        b.say('happy', 0.3);
      } else if (t < 4.2) {
        if (t - dt < 2.8) {
          sfx.whoosh(false);
          ctx.w.fx.text(b.x, b.y - 60, 'pfffft', { color: '#f4ead7' });
        }
        const k = (t - 2.8) / 1.4;
        b.scale = s0 * (1.75 - 0.75 * k);
        b.gravity = 0;
        b.vx += rnd(-1, 1) * 9000 * dt;
        b.vy += rnd(-1, 0.6) * 9000 * dt;
        b.va += rnd(-1, 1) * 200 * dt;
        b.say('dizzy', 0.3);
        if (Math.random() < 0.5) ctx.w.fx.burst('smoke', b.x, b.y, 1, { speed: 50, size: 0.4, life: 0.4 });
      } else {
        b.scale = s0;
        b.gravity = 1;
        b.say('dizzy', 1.5);
        return false;
      }
      return true;
    },
    end() {
      b.scale = s0;
      b.gravity = 1;
    },
  };
}

function boomerang(b: Body, ox: number, oy: number): Trick {
  let t = 0;
  ctx.discover('boomerang');
  return {
    id: 'boomerang',
    mood: 'happy',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      if (t > 0.22) {
        b.gravity = 0.15;
        b.vx += (ox - b.x) * 9 * dt;
        b.vy += (oy - b.y) * 9 * dt;
        b.vx *= Math.exp(-0.9 * dt);
        b.vy *= Math.exp(-0.9 * dt);
      }
      b.va = 28 * Math.sign(b.vx || 1);
      if (Math.random() < 0.6) ctx.w.fx.burst('spark', b.x, b.y, 1, { speed: 60, life: 0.35, colors: ['#ffd9b8'] });
      if ((t > 0.6 && Math.hypot(ox - b.x, oy - b.y) < 70) || t > 2.6) {
        b.gravity = 1;
        b.vx *= 0.2;
        b.vy = -200;
        ctx.w.fx.text(b.x, b.y - 46, 'catch!', { color: '#ffd9b8' });
        return false;
      }
      return true;
    },
    end() {
      b.gravity = 1;
    },
  };
}

function comet(b: Body): Trick {
  let t = 0;
  let hit = false;
  ctx.discover('comet');
  return {
    id: 'comet',
    mood: 'scared',
    update(dt) {
      t += dt;
      if (b.state !== 'free') return false;
      ctx.w.fx.burst('flame', b.x, b.y, 3, { speed: 60, g: 0, life: 0.45, size: 1.4, colors: ['#ffd166', '#ff9f43', '#ff5a1f', '#fff3b0'] });
      ctx.w.fx.burst('star', b.x, b.y, 1, { speed: 40, g: 0, life: 0.6 });
      return !hit && t < 3;
    },
    onGround(impact) {
      if (hit) return;
      hit = true;
      ctx.w.fx.burst('star', b.x, b.y, 24, { speed: 520, g: 300 });
      ctx.w.fx.burst('smoke', b.x, b.y, 10, { speed: 200, size: 0.8 });
      ctx.w.fx.ring(b.x, b.y, 1.4, 'rgba(255,209,102,0.9)');
      ctx.w.fx.shake(10);
      sfx.boom();
      b.say('dizzy', 1.5);
    },
  };
}

function dizzy(b: Body): Trick {
  let t = 0;
  let hop = 0;
  ctx.discover('dizzy');
  ctx.w.fx.burst('rice', b.x, b.y, 22, { speed: 380 });
  ctx.w.fx.text(b.x, b.y - 46, 'bleh', { color: '#a6c94a' });
  return {
    id: 'dizzy',
    mood: 'dizzy',
    update(dt) {
      t += dt;
      hop -= dt;
      if (b.state !== 'free') return false;
      if (b.grounded && hop <= 0) {
        hop = rnd(0.3, 0.6);
        b.vx = rnd(-200, 200);
        b.vy = -220;
        b.va = rnd(-5, 5);
      }
      if (Math.random() < dt * 5) ctx.w.fx.burst('star', b.x + rnd(-12, 12), b.y - halfH(b) - 6, 1, { speed: 20, g: 0, life: 0.5, size: 0.6 });
      return t < 3.2;
    },
  };
}

// Hero centrepiece: floats in place until someone grabs it.
export function display(b: Body, anchor: () => { x: number; y: number }): Trick {
  let t = 0;
  return {
    id: 'display',
    physics: false,
    mood: 'happy',
    update(dt) {
      t += dt;
      const a = anchor();
      b.x = a.x;
      b.y = a.y + Math.sin(t * 1.6) * 8;
      b.a = -0.42 + Math.sin(t * 1.1) * 0.05;
      b.vx = b.vy = 0;
      if (Math.random() < dt * 1.5) ctx.w.fx.burst('star', b.x + rnd(-60, 60), b.y + rnd(-30, 30), 1, { speed: 20, g: -30, life: 0.9, size: 0.7 });
      return true;
    },
    onPickup() {
      return false;
    },
  };
}

// ───────────────────────── selection ─────────────────────────

type Maker = (b: Body) => Trick;

const RELEASE: Record<string, { make: Maker; ok: (b: Body) => boolean; land?: boolean }> = {
  takecopter: { make: takecopter, ok: () => true },
  legs: { make: legs, ok: (b) => b.scale < 1.6, land: true },
  mitosis: { make: mitosis, ok: (b) => b.scale > 0.8 && !['rock', 'rice'].includes(b.kind) && !b.kind.startsWith('topping-') && ctx.w.bodies.length < ctx.w.maxBodies - 3 },
  rocket: { make: rocket, ok: (b) => b.kind !== 'rock', land: true },
  stone: { make: stone, ok: (b) => b.kind !== 'rock' && b.variant === 'normal' },
  bouncy: { make: bouncy, ok: () => true },
  fish: { make: fish, ok: (b) => isFishy(b.kind) || b.kind === 'ebi', land: true },
  ninja: { make: ninja, ok: () => true },
  dance: { make: dance, ok: (b) => b.scale < 1.6, land: true },
  sleepy: { make: sleepy, ok: () => true, land: true },
  magnet: { make: magnet, ok: (b) => ctx.w.bodies.some((o) => o !== b && (o.state === 'free' || o.state === 'belt') && !o.trick && Math.hypot(o.x - b.x, o.y - b.y) < 400) },
  pixel: { make: pixel, ok: (b) => b.variant === 'normal' },
  chopsticks: { make: (b) => chopsticks(b), ok: () => true, land: true },
  hatch: { make: hatch, ok: (b) => b.kind === 'tamago' || b.kind === 'topping-tamago', land: true },
  backflip: { make: backflip, ok: (b) => b.kind === 'ebi' || b.kind === 'topping-ebi', land: true },
  wheel: { make: wheel, ok: (b) => b.kind === 'kappa' || b.kind === 'sakemaki' || b.kind === 'rock' },
  balloon: { make: balloon, ok: (b) => b.scale < 1.5 },
};

let bag: string[] = [];
let discovered = new Set<string>();
export function setDiscovered(s: Set<string>) {
  discovered = s;
}

function refill() {
  const ids = Object.keys(RELEASE);
  const fresh = ids.filter((i) => !discovered.has(i)).sort(() => Math.random() - 0.5);
  const seen = ids.filter((i) => discovered.has(i)).sort(() => Math.random() - 0.5);
  bag = [...fresh, ...seen];
}

function draw(b: Body): string | null {
  if (!bag.length) refill();
  // Specialty tricks jump the queue when the right piece comes along.
  for (const special of ['hatch', 'backflip', 'wheel', 'fish']) {
    if (!discovered.has(special) && RELEASE[special].ok(b) && Math.random() < 0.7) {
      bag = bag.filter((x) => x !== special);
      return special;
    }
  }
  for (let i = 0; i < bag.length; i++) {
    if (RELEASE[bag[i]].ok(b)) return bag.splice(i, 1)[0];
  }
  refill();
  const i = bag.findIndex((id) => RELEASE[id].ok(b));
  return i >= 0 ? bag.splice(i, 1)[0] : null;
}

function start(b: Body, id: string) {
  const r = RELEASE[id];
  b.trick = r.land ? afterLanding(b, id, () => r.make(b)) : r.make(b);
}

let releases = 0;
let forced: string | null = null;
let quietPickups = false;
export function forceNext(id: string | null) {
  forced = id;
  quietPickups = true;
}
let pickups = 0;
let lastPickupTrick = '';

export function onRelease(b: Body, speed: number, shaken: boolean, origin: { x: number; y: number }) {
  releases++;
  // Topping dropped near its rice: snap back together.
  const base = nigiriOf(b.kind);
  if (base) {
    const rice = ctx.w.bodies.find((o) => o.kind === 'rice' && o.state === 'free' && Math.hypot(o.x - b.x, o.y - b.y) < 90);
    if (rice) {
      ctx.w.remove(rice);
      b.setKind(base);
      b.x = rice.x;
      b.y = rice.y - 4;
      b.vx = rice.vx;
      b.vy = -300;
      b.a = 0;
      b.say('love', 2);
      ctx.w.fx.burst('heart', b.x, b.y, 10, { speed: 260 });
      ctx.w.fx.text(b.x, b.y - 50, 'reunited', { color: '#ff7a9c' });
      sfx.chime();
      ctx.discover('reunite');
      return;
    }
  }
  if (b.trick) return;
  if (forced && RELEASE[forced]) {
    start(b, forced);
    forced = null;
    return;
  }
  if (shaken) {
    b.trick = dizzy(b);
    return;
  }
  if (b.variant === 'normal' && b.kind !== 'rock' && (Math.random() < 0.04 || (releases === 9 && !discovered.has('gold')))) {
    b.variant = 'gold';
    ctx.w.fx.burst('star', b.x, b.y, 30, { speed: 420 });
    ctx.w.fx.ring(b.x, b.y, 1.5, 'rgba(255,209,102,0.95)');
    ctx.w.fx.doFlash(0.3, '255,220,120');
    ctx.w.fx.text(b.x, b.y - 56, 'OMAKASE GOLD', { color: '#ffd166', size: 24 });
    sfx.chime();
    ctx.discover('gold');
    return;
  }
  if (speed > 1500) {
    b.trick = Math.random() < 0.5 ? boomerang(b, origin.x, origin.y) : comet(b);
    return;
  }
  if (releases === 1) {
    start(b, 'takecopter');
    return;
  }
  if (Math.random() < 0.1) return;
  const id = draw(b);
  if (id) start(b, id);
}

// Returns true if the piece squirmed out of your grip.
export function onPickup(b: Body): boolean {
  pickups++;
  if (pickups < 3 || quietPickups) return false;
  const r = Math.random();
  if (r < 0.14 && lastPickupTrick !== 'slippery' && b.kind !== 'rock') {
    lastPickupTrick = 'slippery';
    ctx.w.held = null;
    b.state = 'free';
    b.vx = rnd(-500, 500);
    b.vy = -950;
    b.va = rnd(-22, 22);
    b.say('surprised', 1.2);
    ctx.w.fx.burst('drop', b.x, b.y, 12, { speed: 300 });
    ctx.w.fx.text(b.x, b.y - 50, pick(['nope!', 'slippery!', 'nuh-uh']), { color: '#9ad7ff' });
    sfx.whoosh();
    ctx.discover('slippery');
    return true;
  }
  const top = toppingOf(b.kind);
  if (r < 0.3 && top && lastPickupTrick !== 'peel') {
    lastPickupTrick = 'peel';
    b.setKind(top);
    const rice = ctx.w.spawn('rice', b.x, b.y + 10, 'free');
    rice.flip = b.flip;
    rice.vy = -200;
    rice.say('angry', 6);
    rice.mergeCool = 99;
    ctx.w.fx.text(rice.x, rice.y - 40, 'HEY!', { color: '#ff7b4f', size: 26 });
    ctx.w.fx.burst('rice', rice.x, rice.y, 8, { speed: 200 });
    sfx.pop();
    ctx.discover('peel');
    return false;
  }
  if (r < 0.46 && lastPickupTrick !== 'shy') {
    lastPickupTrick = 'shy';
    b.say('love', 3);
    b.blush = 1;
    ctx.w.fx.burst('heart', b.x, b.y - 20, 6, { speed: 180 });
    ctx.w.fx.text(b.x, b.y - 50, pick(['kyaa!', 'put me down!', 'hehe', 'uwu']), { color: '#ff7a9c' });
    sfx.kyaa();
    ctx.discover('shy');
    return false;
  }
  lastPickupTrick = '';
  return false;
}

export function janitor(b: Body) {
  b.trick = chopsticks(b, true);
}

export function rainSushi(n: number) {
  const v = ctx.w.viewport();
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const b = ctx.w.spawn(pick(BELT_KINDS), rnd(v.left + 120, v.right - 120), v.top - 60, 'free');
      b.vy = rnd(0, 200);
      b.va = rnd(-6, 6);
      b.flip = Math.random() < 0.5 ? -1 : 1;
      if (Math.random() < 0.2) b.variant = 'gold';
    }, i * 140);
  }
}

export { NIGIRI };
