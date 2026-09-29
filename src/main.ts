import './style.css';
import { isSoundOn, setSound, sfx, unlockAudio } from './audio';
import { Diner, Jiro, You } from './chars';
import { BELT_KINDS } from './sushi';
import { TRICKS, display, forceNext, initTricks, janitor, onPickup, onRelease, rainSushi, setDiscovered } from './tricks';
import { Body, World } from './world';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(a: T[]) => a[(Math.random() * a.length) | 0];

const canvas = $<HTMLCanvasElement>('#world');
const heroBox = $('#hero-box');
const stage = $('#jiro-stage');
const jiroCanvas = $<HTMLCanvasElement>('#jiro');
const speech = $('#jiro-speech');
const hint = $('#hint');
const dinerCanvas = $<HTMLCanvasElement>('#diner');
const youCanvas = $<HTMLCanvasElement>('#you');

const jiro = new Jiro(jiroCanvas);
const diner = new Diner(dinerCanvas);
const you = new You(youCanvas);
const w = new World(canvas);

// ───────────────────────── discovery ─────────────────────────

const STORE = 'jiro-tricks-v1';
const found = new Set<string>(JSON.parse(localStorage.getItem(STORE) || '[]'));
setDiscovered(found);
const countEl = $('#tricks-count');
const pill = $('#tricks-pill');
$('#tricks-total').textContent = String(TRICKS.length);
countEl.textContent = String(found.size);

const toasts = $('#toasts');
function toast(icon: string, kicker: string, title: string, body: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-icon"></span><div><p class="toast-count"></p><b></b><small></small></div>`;
  el.querySelector('.toast-icon')!.textContent = icon;
  el.querySelector('.toast-count')!.textContent = kicker;
  el.querySelector('b')!.textContent = title;
  el.querySelector('small')!.textContent = body;
  toasts.appendChild(el);
  while (toasts.children.length > 3) toasts.firstElementChild!.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 500);
  }, 3800);
}

function discover(id: string) {
  if (found.has(id)) return;
  const meta = TRICKS.find((t) => t.id === id);
  if (!meta) return;
  found.add(id);
  localStorage.setItem(STORE, JSON.stringify([...found]));
  countEl.textContent = String(found.size);
  pill.classList.remove('bump');
  void pill.offsetWidth;
  pill.classList.add('bump');
  sfx.discover();
  toast(meta.icon, `New surprise · ${found.size}/${TRICKS.length}`, meta.name, meta.desc);
  if (found.size === TRICKS.length) {
    setTimeout(() => {
      toast('🏆', 'All surprises found', 'Itamae certified', 'You found every trick. Jiro is proud of you.');
      rainSushi(24);
    }, 1200);
  }
}

const HINTS: Record<string, string> = {
  rocks: 'Feed Jiro a rock. There’s one on a table.',
  feed: 'Drop a piece of sushi on Jiro.',
  diner: 'The diner by the belt looks hungry.',
  you: 'Seat 04 is you. Feed yourself.',
  turbo: 'Hover “He makes you faster.”',
  hello: 'Click Jiro. Say hi.',
  cat: 'Jiro’s paper lamp looks lucky. Tap it.',
  bubbles: 'Pop the bubbles rising in the kitchen.',
  fusion: 'Smash two identical pieces together.',
  mega: 'Keep fusing the same piece.',
  comet: 'Throw one. Hard.',
  boomerang: 'Throw one. Hard. Again.',
  dizzy: 'Shake one around before you let go.',
  reunite: 'Put the fish back on its rice.',
  hatch: 'What’s tamago made of, again?',
  backflip: 'Drop a shrimp.',
  wheel: 'Maki are round.',
};

pill.addEventListener('click', () => {
  const missing = TRICKS.filter((t) => !found.has(t.id));
  if (!missing.length) {
    toast('🏆', `${found.size}/${TRICKS.length}`, 'All found', 'Nothing left to discover. Or is there?');
    return;
  }
  const m = pick(missing);
  toast('💡', `${found.size}/${TRICKS.length} found`, 'Hint', HINTS[m.id] ?? 'Keep picking up and dropping sushi. Throw some.');
});

// ───────────────────────── sound ─────────────────────────

const soundBtn = $('#sound-btn');
soundBtn.setAttribute('aria-pressed', String(isSoundOn()));
soundBtn.addEventListener('click', () => {
  setSound(!isSoundOn());
  soundBtn.setAttribute('aria-pressed', String(isSoundOn()));
  if (isSoundOn()) sfx.pop();
});
window.addEventListener('pointerdown', () => unlockAudio(), { once: true });

// ───────────────────────── belt layout ─────────────────────────

function rectOf(el: Element) {
  const r = el.getBoundingClientRect();
  const sx = window.scrollX;
  const sy = window.scrollY;
  return { l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy, w: r.width, h: r.height };
}

w.beltAnchors = () => {
  const vw = window.innerWidth;
  const mobile = vw <= 980;
  const css = getComputedStyle(document.documentElement);
  const lane = parseFloat(css.getPropertyValue('--belt-lane')) || 118;
  const hero = rectOf(heroBox);
  const st = rectOf(jiroCanvas);
  const counter = rectOf($('#menu'));
  const anti = rectOf($('#antislop'));
  const foot = rectOf($('#reserve'));
  const width = mobile ? (vw <= 640 ? 40 : 48) : 64;
  const p0: [number, number] = [st.l + st.w * 0.84, st.b + width / 2 + 10];
  if (mobile) {
    const x = hero.l + lane / 2 - 6;
    return {
      width,
      pts: [p0, [p0[0], p0[1] + 60], [x, counter.t + 40], [x, foot.b - 60]],
    };
  }
  const left = hero.l + 40;
  const right = hero.r - 50;
  const y = anti.t + 36;
  return {
    width,
    pts: [p0, [p0[0], p0[1] + 30], [left, counter.t + 150], [left, y], [right, y], [right, foot.b - 70]],
  };
};

// ───────────────────────── hooks ─────────────────────────

function mouthDoc() {
  const r = rectOf(jiroCanvas);
  const m = jiro.mouthNorm();
  return { x: r.l + m.x * r.w, y: r.t + m.y * r.h };
}

function inside(el: Element, cx: number, cy: number, pad = 0) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && cx >= r.left - pad && cx <= r.right + pad && cy >= r.top - pad && cy <= r.bottom + pad;
}

let speechTimer = 0;
function say(text: string, ms = 2600) {
  speech.textContent = text;
  speech.classList.add('on');
  clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => speech.classList.remove('on'), ms);
}

const FOOD_LINES = [
  'LGTM.',
  'Needs more wasabi. Approved anyway.',
  'Tested. Tasted. Shipped.',
  'Oishii. Merging.',
  'Nit: rice slightly over-seasoned.',
  'Fresh. Like a green CI run.',
];
const ROCK_LINES = ['Crunchy. Good fiber.', 'Rocks are just very old sushi.', 'Mm. Legacy code.', 'That was a flaky test. Crunchy.'];
const HELLO_LINES = [
  'Irasshaimase!',
  'Ticket? Hand it over.',
  'I read the whole codebase. Twice.',
  'You bring the subscription. I bring the knife.',
  'Hi. I eat rocks.',
  'The belt is a queue. I am the worker.',
  'Try throwing one. Hard.',
];

function feedTo(b: Body, to: () => { x: number; y: number }, done: () => void) {
  if (b.plate) {
    b.plate.body = null;
    b.plate = null;
  }
  b.state = 'script';
  w.setTrick(b, null);
  b.tween = { t: 0, dur: 0.38, delay: 0, fx: b.x, fy: b.y, fa: b.a, fs: b.scale, ts: b.scale * 0.35, arc: 40, to, done: () => { w.remove(b); done(); } };
}

let rockRespawn = 0;
function jiroEat(b: Body) {
  const rocky = b.kind === 'rock' || b.variant === 'stone';
  const gold = b.variant === 'gold';
  jiro.set('hungry', 0.4);
  feedTo(b, mouthDoc, () => {
    const m = mouthDoc();
    if (rocky) {
      jiro.set('crunch', 1.3);
      sfx.crunch();
      setTimeout(() => sfx.crunch(), 180);
      setTimeout(() => sfx.crunch(), 380);
      w.fx.burst('shard', m.x, m.y, 16, { speed: 320 });
      w.fx.burst('spark', m.x, m.y, 10, { speed: 400 });
      w.fx.shake(10);
      stage.classList.remove('shake');
      void stage.offsetWidth;
      stage.classList.add('shake');
      say(pick(ROCK_LINES));
      discover('rocks');
      if (b.kind === 'rock') rockRespawn = 2.5;
    } else {
      jiro.set('chomp', 1.1);
      setTimeout(() => jiro.set('happy', 1.4), 1100);
      sfx.chomp();
      w.fx.burst('heart', m.x, m.y - 20, 6, { speed: 160 });
      w.fx.burst('rice', m.x, m.y, 6, { speed: 160 });
      say(gold ? 'Gold leaf. Expensive taste.' : pick(FOOD_LINES));
      discover('feed');
    }
  });
}

function dinerMouth() {
  const r = rectOf(dinerCanvas);
  return { x: r.l + (24 / 48) * r.w, y: r.t + (16 / 56) * r.h };
}

function youMouth() {
  const r = rectOf(youCanvas);
  const k = r.w / 72;
  return { x: r.l + 44 * k, y: r.t + 18 * k };
}

w.hooks = {
  onPickup(b) {
    hint.classList.add('gone');
    if (onPickup(b)) return;
  },
  onRelease(b, speed, shaken) {
    onRelease(b, speed, shaken, { x: w.pointer.x - (w.pointer.vx * 0.12), y: w.pointer.y - (w.pointer.vy * 0.12) });
  },
  onImpact(b, impact) {
    if (b.variant === 'stone' || b.kind === 'rock') sfx.thud(impact / 1200);
    else sfx.squish(impact / 1600);
    if (impact > 900) b.say('dizzy', 0.9);
    else if (impact > 500) b.say('surprised', 0.5);
    if (impact > 700) w.fx.burst('rice', b.x, b.y + 16, 3, { speed: 200 });
  },
  onMerge(a, b) {
    const s = Math.min(2, Math.sqrt(a.scale * a.scale + b.scale * b.scale));
    const keep = a.scale >= b.scale ? a : b;
    const gone = keep === a ? b : a;
    const regroup = a.group && a.group === b.group;
    keep.x = (a.x + b.x) / 2;
    keep.y = (a.y + b.y) / 2;
    keep.vx = (a.vx + b.vx) / 2;
    keep.vy = Math.min(a.vy, b.vy) - 250;
    keep.scale = s;
    keep.pop = 0.5;
    keep.mergeCool = 0.8;
    keep.say('happy', 1.5);
    keep.trick = null;
    w.remove(gone);
    w.fx.burst('star', keep.x, keep.y, 12, { speed: 320 });
    w.fx.ring(keep.x, keep.y, 1);
    sfx.pop();
    if (regroup) {
      if (!w.bodies.some((o) => o !== keep && o.group === keep.group)) {
        w.fx.text(keep.x, keep.y - 60, 'whole again', { color: '#a6c94a' });
        keep.group = 0;
      }
      return;
    }
    w.fx.text(keep.x, keep.y - 60 * s, s >= 1.9 ? 'MEGA!' : 'fusion!', { color: '#ffd166', size: s >= 1.9 ? 30 : 22 });
    discover('fusion');
    if (s >= 1.9) {
      sfx.chime();
      w.fx.shake(6);
      discover('mega');
    }
  },
  onBeltSpawn() {
    jiro.serve();
  },
  tryFeed(b, cx, cy) {
    if (inside(jiroCanvas, cx, cy, 10)) {
      jiroEat(b);
      return true;
    }
    if (inside(dinerCanvas, cx, cy, 6)) {
      feedTo(b, dinerMouth, () => {
        diner.feed();
        const m = dinerMouth();
        w.fx.burst('heart', m.x, m.y - 10, 8, { speed: 200 });
        sfx.chomp();
        discover('diner');
      });
      return true;
    }
    if (inside(youCanvas, cx, cy, 0)) {
      feedTo(b, youMouth, () => {
        you.feed();
        const m = youMouth();
        w.fx.burst('heart', m.x, m.y - 10, 8, { speed: 200 });
        w.fx.text(m.x, m.y - 40, 'mmm', { color: '#ffd9b8' });
        sfx.chomp();
        discover('you');
      });
      return true;
    }
    return false;
  },
  hover() {},
};

initTricks({ w, discover });
jiro.onServe = () => w.serveOne('salmon');

// ───────────────────────── hero sushi + rock ─────────────────────────

function heroAnchor() {
  const sx = window.scrollX;
  const sy = window.scrollY;
  if (window.innerWidth <= 980) {
    const st = jiroCanvas.getBoundingClientRect();
    return { x: st.left + sx + st.width * 0.22, y: st.bottom + sy + 44 };
  }
  const r = heroBox.getBoundingClientRect();
  return { x: r.left + sx + r.width * 0.555, y: r.top + sy + r.height * 0.74 };
}

function spawnHeroSushi() {
  const a = heroAnchor();
  const b = w.spawn('salmon', a.x, a.y, 'free');
  b.scale = window.innerWidth <= 980 ? 1.15 : 1.7;
  b.pop = 0;
  b.mergeCool = 99;
  b.trick = display(b, heroAnchor);
}

let rock: Body | null = null;
function spawnRock() {
  const t = rectOf($('#rock-table'));
  rock = w.spawn('rock', t.l + 64, t.t - 260, 'free');
  rock.va = rnd(-3, 3);
  rock.flip = Math.random() < 0.5 ? -1 : 1;
  rock.mergeCool = 99;
}

// ───────────────────────── DOM delights ─────────────────────────

// Reveal on scroll.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if (e.target.querySelector('#rock-table') && !rock) setTimeout(spawnRock, 900);
    }
  },
  { threshold: 0.18 },
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Card tilt with glare.
document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
  const target = (card.querySelector('.board') as HTMLElement) ?? card;
  card.addEventListener('pointermove', (e) => {
    if (w.held) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    target.style.transform = `rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateZ(0)`;
    target.style.setProperty('--gx', `${x * 100}%`);
    target.style.setProperty('--gy', `${y * 100}%`);
    target.style.setProperty('--glare', '1');
  });
  card.addEventListener('pointerleave', () => {
    target.style.transform = '';
    target.style.setProperty('--glare', '0');
  });
});

// Turbo belt.
const fast = $('#fast-table');
fast.addEventListener('pointerenter', () => {
  w.beltBoostTarget = 6;
  sfx.whoosh();
  discover('turbo');
});
fast.addEventListener('pointerleave', () => {
  w.beltBoostTarget = 1;
});

// Jiro: click to chat; the lucky cat rains sushi.
jiroCanvas.addEventListener('click', (e) => {
  const r = jiroCanvas.getBoundingClientRect();
  if (jiro.catHit((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)) {
    say('The lamp is lucky. Look up.');
    rainSushi(10);
    sfx.chime();
    discover('cat');
    return;
  }
  jiroCanvas.classList.remove('hop');
  void jiroCanvas.offsetWidth;
  jiroCanvas.classList.add('hop');
  jiro.set('happy', 1.2);
  say(pick(HELLO_LINES));
  sfx.blip(7);
  discover('hello');
});

// Diner: click for a wave.
dinerCanvas.addEventListener('click', () => {
  const m = dinerMouth();
  w.fx.text(m.x, m.y - 30, pick(['oishii!', 'one more plate', 'this belt slaps']), { color: '#ffd9b8', size: 18 });
});
youCanvas.addEventListener('click', () => {
  const m = youMouth();
  w.fx.text(m.x, m.y - 40, pick(['PR #482 merged', 'CI is green', 'ship it']), { color: '#a6c94a', size: 18 });
  sfx.blip(12);
});

// Noren curtain that reacts to the cursor.
const norenPanels = [...document.querySelectorAll<HTMLElement>('#noren span')];
const noren = norenPanels.map(() => ({ a: 0, v: 0 }));
let lastPX = 0;
let lastPY = 0;
window.addEventListener('pointermove', (e) => {
  const vx = e.clientX - lastPX;
  lastPX = e.clientX;
  lastPY = e.clientY;
  norenPanels.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (e.clientX > r.left - 10 && e.clientX < r.right + 10 && e.clientY > r.top && e.clientY < r.bottom + 20) {
      noren[i].v += vx * 0.9;
    }
  });
});

// Bubbles rising in the kitchen.
const bubbleBox = $('#bubbles');
interface Bub {
  el: HTMLElement;
  x: number;
  y: number;
  s: number;
  sp: number;
  ph: number;
}
const bubbles: Bub[] = [];
let bubbleT = 0;
let popped = 0;
function spawnBubble() {
  const el = document.createElement('span');
  el.className = 'bubble';
  const s = rnd(12, 36);
  el.style.width = el.style.height = `${s}px`;
  const bub: Bub = { el, x: rnd(10, 85), y: 0, s, sp: rnd(28, 60), ph: rnd(0, 6) };
  el.addEventListener('pointerenter', () => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2 + window.scrollX;
    const y = r.top + r.height / 2 + window.scrollY;
    w.fx.burst('drop', x, y, 8, { speed: 160, colors: ['rgba(255,236,220,0.8)'] });
    w.fx.ring(x, y, s / 60, 'rgba(255,236,220,0.7)');
    sfx.pop();
    el.remove();
    bubbles.splice(bubbles.indexOf(bub), 1);
    if (++popped === 10) discover('bubbles');
  });
  bubbleBox.appendChild(el);
  bubbles.push(bub);
}

// ───────────────────────── loop ─────────────────────────

// Frame-rate governor: if the page can't hold ~30fps a few seconds in, switch
// to lite mode and a 1x canvas.
let fpsFrames = 0;
let fpsTime = 0;
let governed = false;
function govern(dt: number) {
  if (governed || document.hidden) return;
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime < 4) return;
  if (fpsFrames / fpsTime < 32) {
    document.documentElement.classList.add('lite');
    w.maxDpr = 1;
    w.resize();
  }
  governed = true;
}
if (new URLSearchParams(location.search).has('lite')) {
  document.documentElement.classList.add('lite');
  governed = true;
}

let last = performance.now();
let solidT = 0;
let janitorT = 0;

function loop(now: number) {
  const raw = (now - last) / 1000;
  const dt = Math.min(1 / 30, raw);
  last = now;

  w.step(dt);
  if (now > 3000) govern(Math.min(raw, 0.5));

  // Hover target for the chopstick cursor.
  w.hover = w.held ? null : w.pointer.inside ? w.hit(w.pointer.x, w.pointer.y) : null;
  if (w.hover && w.hover.mood === 'neutral') w.hover.say('happy', 0.2);

  // Auto-scroll while carrying a piece near the viewport edge.
  if (w.held) {
    const cy = w.pointer.cy;
    const edge = 70;
    if (cy < edge) window.scrollBy(0, -Math.ceil((edge - cy) / 4));
    else if (cy > w.vh - edge) window.scrollBy(0, Math.ceil((cy - (w.vh - edge)) / 4));
  }

  // Jiro watches the cursor and gets hungry when you bring food close.
  const jr = jiroCanvas.getBoundingClientRect();
  jiro.look(w.pointer.cx - (jr.left + jr.width / 2), w.pointer.cy - (jr.top + jr.height * 0.3));
  jiro.hungry = !!w.held && Math.hypot(w.pointer.cx - (jr.left + jr.width / 2), w.pointer.cy - (jr.top + jr.height * 0.36)) < jr.width * 0.6;
  jiro.update(dt);

  // The diner grabs passing plates.
  diner.update(dt);
  const dr = dinerCanvas.getBoundingClientRect();
  if (dr.width > 0 && diner.state === 'idle' && diner.cool <= 0 && dr.bottom > 0 && dr.top < w.vh) {
    const handY = dr.top + window.scrollY + (27 / 56) * dr.height;
    const plate = w.plates.find((p) => {
      if (!p.body || p.body.state !== 'belt') return false;
      const q = w.belt.at(p.s);
      return Math.abs(q.y - handY) < 8 && q.x < dr.left + window.scrollX + 40;
    });
    if (plate && Math.random() < 0.5) {
      const b = plate.body!;
      diner.grab();
      feedTo(b, dinerMouth, () => {
        const m = dinerMouth();
        w.fx.burst('heart', m.x, m.y - 10, 4, { speed: 140 });
        sfx.chomp();
      });
      b.tween!.delay = 0.3;
      b.tween!.dur = 0.34;
    } else if (plate) diner.cool = 1;
  }
  you.update(dt);

  // Noren springs.
  noren.forEach((n, i) => {
    if (Math.abs(n.a) < 0.01 && Math.abs(n.v) < 0.01) {
      if (n.a !== 0) {
        n.a = n.v = 0;
        norenPanels[i].style.transform = '';
      }
      return;
    }
    n.v += (-n.a * 90 - n.v * 7) * dt;
    n.a += n.v * dt;
    n.a = Math.max(-28, Math.min(28, n.a));
    norenPanels[i].style.transform = `skewX(${n.a * 0.6}deg) rotate(${n.a * 0.15}deg)`;
  });

  // Bubbles.
  bubbleT -= dt;
  if (bubbleT <= 0 && bubbles.length < 12 && bubbleBox.offsetParent) {
    spawnBubble();
    bubbleT = rnd(0.5, 1.3);
  }
  const bh = bubbleBox.clientHeight;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y += b.sp * dt;
    b.ph += dt;
    b.el.style.transform = `translate(${Math.sin(b.ph * 1.7) * 10}px, ${-b.y}px)`;
    b.el.style.left = `${b.x}%`;
    b.el.style.opacity = String(Math.min(1, (bh - b.y) / 80));
    if (b.y > bh + 40) {
      b.el.remove();
      bubbles.splice(i, 1);
    }
  }

  // Keep DOM collision boxes fresh (cards tilt and reveal).
  solidT -= dt;
  if (solidT <= 0) {
    w.measureSolids();
    solidT = 0.2;
  }

  if (rockRespawn > 0) {
    rockRespawn -= dt;
    if (rockRespawn <= 0) spawnRock();
  }

  // Pieces that come to rest on the belt hop back onto a plate.
  for (const b of w.bodies) {
    if (b.state !== 'free' || b.trick || !b.grounded || b.groundT < 0.9 || b.kind === 'rock') continue;
    const n = w.belt.nearest(b.x, b.y);
    if (n.d < w.belt.width / 2 + 6 && w.attach(b, n)) break;
  }

  // Tidy up stray pieces so the page never drowns in sushi.
  janitorT -= dt;
  if (janitorT <= 0) {
    janitorT = 1.2;
    const strays = w.bodies.filter((b) => b.state === 'free' && !b.trick && b.kind !== 'rock' && b !== w.held);
    const old = strays.filter((b) => b.freeT > 30);
    const victim = strays.length > 22 ? strays.sort((a, b) => b.freeT - a.freeT)[0] : old[0];
    if (victim) {
      if (w.visible(victim)) janitor(victim);
      else w.remove(victim);
    }
  }

  w.render();
  requestAnimationFrame(loop);
}

// ───────────────────────── boot ─────────────────────────

// Rasterise the SVG noise textures once. Live feTurbulence gets re-rendered on
// every repaint, which is brutal on machines without GPU raster.
function bakeTexture(varName: string, w: number, h: number) {
  const css = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const m = css.match(/url\("?(data:image\/svg\+xml[^")]*)"?\)/);
  if (!m) return;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    cv.getContext('2d')!.drawImage(img, 0, 0, w, h);
    cv.toBlob((blob) => {
      if (blob) document.documentElement.style.setProperty(varName, `url(${URL.createObjectURL(blob)})`);
    });
  };
  img.src = m[1];
}
bakeTexture('--wood', 600, 400);
bakeTexture('--grain', 220, 220);

let resizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = window.setTimeout(() => w.resize(), 120);
});
new ResizeObserver(() => w.layout()).observe(document.body);

function boot() {
  w.layout();
  w.seedPlates();
  setTimeout(spawnHeroSushi, 1300);
  requestAnimationFrame((t) => {
    last = t;
    loop(t);
  });
}

if (document.fonts?.ready) document.fonts.ready.then(() => w.layout());
boot();

// Handle for poking at the world from devtools.
(window as any).jiro = { world: w, force: forceNext, rain: rainSushi, sprite: jiro };

// Console easter egg for the curious.
console.log(
  '%c jiro.bot %c your AI Staff Engineer. He eats rocks. ',
  'background:#ff7b4f;color:#120d0a;font-weight:700;padding:4px 6px;border-radius:4px 0 0 4px',
  'background:#120d0a;color:#f4ead7;padding:4px 6px;border-radius:0 4px 4px 0',
);
