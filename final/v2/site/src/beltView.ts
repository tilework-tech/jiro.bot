import { crispContext, loadImage } from "./art";
import { MENU } from "./belt/menu";
import { resolveDrop, type Surface } from "./belt/drop";
import { createRareEvents, type RareEvent } from "./belt/events";
import type { createJourney } from "./belt/motion";
import type { Pt, Route } from "./belt/route";
import { slatRows } from "./belt/slats";
import { createStream, type Slot } from "./belt/stream";
import { mulberry32 } from "./belt/rng";

/** World art px between plate slots along the belt. */
export const SLOT = 22;
/** The belt is already loaded when the page opens: slot indices start this far (world px) down the line. */
const PREFILL = 6000;
const TILE_BED = { x0: 12, x1: 72 };
/** Belt art px per world unit: plates, items and the slat tile are drawn 1:1 in CSS px at 1440 wide. */
export const BELT_GRAIN = 4;
/** Item offsets in the stream are in 2x-grain units (1–3); belt art px per offset unit. */
const OFFSET_PX = BELT_GRAIN / 2;
const ALIVE_FRAME_MS = 420;

export type Mapping = {
  /** CSS px per world art px. */
  s: number;
  worldToPage(p: Pt): Pt;
  pageToWorld(p: Pt): Pt;
};

export type BeltDeps = {
  canvas: HTMLCanvasElement;
  route: Route; // in page CSS px
  map: Mapping;
  journey: ReturnType<typeof createJourney>;
  seed: number;
  reduced: boolean;
  /** Page-space band where the belt bed is painted into the scene art and only the slats are overdrawn. */
  bedOnly: (p: Pt) => boolean;
  /** Page-space band where items keep their upright pose (the straight hero run). */
  upright: (p: Pt) => boolean;
  surfaces: () => Surface[]; // world coords
  water: () => Surface[];
  onEgg: (id: string) => void;
  onSay: (text: string, page: Pt) => void;
};

type Item = NonNullable<Slot["item"]>;
type Effect = { slot: number; type: number; start: number; dur: number };
type Particle = { x: number; y: number; vx: number; vy: number; c: string; life: number; age: number; g: number };
type Override =
  | { kind: "gone" }
  | { kind: "walking"; to: number; start: number }
  | { kind: "guest"; host: number };

const QUIPS: Record<string, string[]> = {
  "rubber-duck": ["quack.", "Have you tried explaining it to me?"],
  "haunted-laptop": ["boo. your tests are flaky.", "it works on my machine"],
  "floppy-disk": ["1.44 MB of legacy config"],
  "fortune-slip": ["Your next PR will be small.", "A refactor approaches.", "Ship it on a Tuesday.", "Read the error message."],
  "wasabi-suspicious": ["…what are you looking at"],
  "onigiri-sleepy": ["zzz"],
  "onigiri-grumpy": ["no."],
  "beetle": ["not a bug, a feature"],
  "lost-sock": ["have you seen my other half?"],
  "lucky-cat-mini": ["fortune favours green builds"],
};

export async function mountBelt(d: BeltDeps) {
  const ctx = crispContext(d.canvas);
  const stream = createStream(d.seed);
  const rare = createRareEvents(d.seed);
  const rand = mulberry32(d.seed ^ 0x5bd1e995);
  const [tile, plateGrey, plateBlue] = await Promise.all([
    loadImage("art/belt/tile.png"), loadImage("art/belt/plate-grey.png"), loadImage("art/belt/plate-blue.png"),
  ]);
  const items = new Map<string, HTMLImageElement>();
  const meta: Record<string, number> = await (await fetch("art/belt/items/frames.json")).json();
  await Promise.all(MENU.map(async (m) => items.set(m.kind, await loadImage(`art/belt/items/${m.kind}.png`))));
  const framesOf = (img: HTMLImageElement) => frames.get(img) ?? 1;
  const frames = new Map<HTMLImageElement, number>(MENU.map((m) => [items.get(m.kind)!, meta[m.kind] ?? 1]));

  const overrides = new Map<number, Override>();
  const effects: Effect[] = [];
  const particles: Particle[] = [];
  let held: null | { slot: number; item: Item; rim: Slot["rim"]; page: Pt; from: "belt" | "placed"; el?: HTMLElement } = null;
  let walk: null | { from: number; to: number; start: number; dur: number } = null;
  let fall: null | { slot: number; item: Item; rim: Slot["rim"]; p: Pt; v: Pt; floor: number; start: number } = null;

  let hp = 1; // CSS px per belt art px
  let k = 1; // device px per belt art px
  function resize() {
    hp = d.map.s / BELT_GRAIN;
    const dpr = devicePixelRatio || 1;
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (d.canvas.width !== w) d.canvas.width = w;
    if (d.canvas.height !== h) d.canvas.height = h;
    k = hp * dpr;
  }
  resize();

  const slotSpacing = () => SLOT * d.map.s;
  const travelPx = () => (d.journey.state().travel + PREFILL) * d.map.s;
  const slotPos = (i: number) => travelPx() - i * slotSpacing();
  const isOccupied = (i: number) => {
    const o = overrides.get(i);
    return stream.slot(i).item && (!o || o.kind === "walking");
  };
  const isPickable = (i: number) => stream.slot(i).item && !overrides.has(i) && ![...overrides.values()].some((o) => o.kind === "guest" && o.host === i);

  /** Item rotation follows the belt: upright on the hero run, otherwise turned with the belt heading. */
  const itemAngle = (pos: { x: number; y: number; heading: number }) => (d.upright(pos) ? 0 : pos.heading - Math.PI / 2);

  function visibleSlots() {
    const top = scrollY - 80, bottom = scrollY + innerHeight + 80;
    const out: { i: number; pos: ReturnType<Route["sample"]> }[] = [];
    const first = Math.ceil((travelPx() - d.route.length) / slotSpacing());
    const last = Math.floor(travelPx() / slotSpacing());
    for (let i = first; i <= last; i++) {
      const s = slotPos(i);
      if (s < 0 || s > d.route.length) continue;
      const pos = d.route.sample(s);
      if (pos.y < top || pos.y > bottom) continue;
      out.push({ i, pos });
    }
    return out;
  }

  // ------------------------------------------------------------------ drawing
  const toCanvas = (p: Pt) => ({ x: p.x / hp, y: (p.y - scrollY) / hp });

  // One sample per hero px of belt, rebuilt when the route changes. The belt only travels down the page,
  // so y is non-decreasing along the table and the visible window is found by binary search.
  let table: { route: Route; step: number; poses: ReturnType<Route["sample"]>[]; hidden: boolean[] } | null = null;
  const samples = () => {
    if (!table || table.route !== d.route || table.step !== hp) {
      const poses: ReturnType<Route["sample"]>[] = [];
      for (let s = 0; s <= d.route.length; s += hp) poses.push(d.route.sample(s));
      table = { route: d.route, step: hp, poses, hidden: poses.map((p) => d.route.isHidden(p)) };
    }
    return table;
  };
  const firstAtOrBelow = (poses: { y: number }[], y: number) => {
    let lo = 0, hi = poses.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (poses[m].y < y) lo = m + 1; else hi = m; }
    return lo;
  };

  /** The pose at arc length s, interpolated between table samples so slats and plates can sit between pixels. */
  const poseAt = (t: NonNullable<typeof table>, s: number) => {
    const f = s / t.step, n = Math.min(Math.floor(f), t.poses.length - 2), u = f - n;
    const a = t.poses[n], b = t.poses[n + 1];
    let dh = b.heading - a.heading;
    if (dh > Math.PI) dh -= 2 * Math.PI;
    if (dh < -Math.PI) dh += 2 * Math.PI;
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, heading: a.heading + dh * u, hidden: t.hidden[n] };
  };

  function drawBelt() {
    const top = scrollY - 40, bottom = scrollY + innerHeight + 40;
    const t = samples();
    const from = Math.max(0, firstAtOrBelow(t.poses, top) - 1) * t.step;
    const end = Math.min(firstAtOrBelow(t.poses, bottom) + 1, t.poses.length - 1) * t.step;
    for (const r of slatRows(travelPx(), t.step, end, tile.height, from)) {
      const p = poseAt(t, r.s);
      if (p.hidden) continue;
      const c = toCanvas(p);
      const bedOnly = d.bedOnly(p);
      const x0 = bedOnly ? TILE_BED.x0 : 0, x1 = bedOnly ? TILE_BED.x1 : tile.width;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(p.heading - Math.PI / 2);
      ctx.drawImage(tile, x0, r.tileRow, x1 - x0, 1, -(tile.width / 2) + x0, -1, x1 - x0, 2);
      ctx.restore();
    }
  }

  function itemFrame(kind: string, now: number, slot: number) {
    const img = items.get(kind)!;
    const n = framesOf(img);
    if (n === 1 || d.reduced) return { img, sx: 0, w: img.width / n, n };
    const k = Math.floor((now + slot * 137) / ALIVE_FRAME_MS) % n;
    return { img, sx: k * (img.width / n), w: img.width / n, n };
  }

  function drawPlate(c: Pt, rim: Slot["rim"], item: Item | null, angle: number, now: number, slot: number, fx?: Effect, extra?: Item) {
    const plate = rim === "blue" ? plateBlue : plateGrey;
    let ox = 0, oy = 0, rot = 0, sx = 1, sy = 1, alpha = 1, plateDy = 0;
    if (fx) {
      const t = Math.min(1, (now - fx.start) / fx.dur);
      const e = Math.sin(t * Math.PI);
      switch (fx.type % 16) {
        case 0: oy = -20 * e; break; // hop
        case 1: rot = t * Math.PI * 2; break; // spin
        case 2: rot = Math.sin(t * Math.PI * 6) * 0.3 * (1 - t); break; // wobble
        case 3: sy = 1 - 0.4 * e; sx = 1 + 0.25 * e; break; // squash
        case 4: break; // puff (particles only)
        case 5: alpha = t < 0.15 || t > 0.85 ? 1 : 0; break; // explode and re-form
        case 6: break; // sparkle
        case 7: oy = -8 * Math.abs(Math.sin(t * Math.PI * 3)); break; // bounce x3
        case 8: sx = sy = 1 - 0.45 * e; break; // shrink
        case 9: sx = Math.cos(t * Math.PI * 2); break; // flip
        case 10: plateDy = -4 * Math.abs(Math.sin(t * Math.PI * 4)); oy = plateDy; break; // plate rattles
        case 11: oy = -28 * e; rot = 0.2 * e; break; // float
        case 12: ox = (Math.random() - 0.5) * 4 * (1 - t); break; // shiver
        case 13: ox = 12 * e; break; // slide to the rim and back
        case 14: sx = sy = 1 + 0.35 * e; break; // grow
        case 15: rot = -0.35 * e; ox = -6 * e; break; // peek
      }
    }
    ctx.drawImage(plate, c.x - plate.width / 2, c.y - plate.height / 2 + plateDy);
    const draw = (it: Item, dx: number) => {
      const f = itemFrame(it.kind, now, slot);
      const h = f.img.height;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(c.x, c.y - 6);
      ctx.rotate(angle);
      ctx.translate(it.offset.x * OFFSET_PX + ox + dx, it.offset.y * OFFSET_PX + oy);
      ctx.rotate(rot);
      ctx.scale(sx, sy);
      ctx.drawImage(f.img, f.sx, 0, f.w, h, -Math.round(f.w / 2), -Math.round(h * 0.7), f.w, h);
      ctx.restore();
    };
    if (item) draw(item, extra ? -10 : 0);
    if (extra) draw(extra, 10);
  }

  function burst(page: Pt, kind: string, n: number, style: "puff" | "sparkle" | "steam" | "confetti" | "explode") {
    const img = items.get(kind);
    const colors: string[] = [];
    if (img && style !== "sparkle" && style !== "steam") {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const cx = c.getContext("2d")!;
      cx.drawImage(img, 0, 0);
      const data = cx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < data.length; i += 4 * 7) if (data[i + 3]) colors.push(`rgb(${data[i]},${data[i + 1]},${data[i + 2]})`);
    }
    const pal = style === "sparkle" ? ["#fdd081", "#f4f4f2", "#efdabd"] : style === "steam" ? ["#dfe3e6", "#f4f4f2"] : colors.length ? colors : ["#efdabd"];
    for (let k = 0; k < n; k++) {
      const a = rand() * Math.PI * 2, sp = style === "steam" ? 12 + rand() * 12 : 28 + rand() * 60;
      particles.push({
        x: page.x, y: page.y - 6, vx: style === "steam" ? (rand() - 0.5) * 8 : Math.cos(a) * sp,
        vy: style === "steam" ? -sp : Math.sin(a) * sp - (style === "explode" ? 20 : 0),
        c: pal[Math.floor(rand() * pal.length)], life: style === "explode" ? 0.9 : 0.7 + rand() * 0.6, age: 0,
        g: style === "steam" || style === "sparkle" ? 0 : 120,
      });
    }
  }

  function drawParticles(dt: number) {
    for (let k = particles.length - 1; k >= 0; k--) {
      const p = particles[k];
      p.age += dt;
      if (p.age > p.life) { particles.splice(k, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt * hp; p.y += p.vy * dt * hp;
      const c = toCanvas(p);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 1 - p.age / p.life;
      ctx.fillRect(Math.round(c.x), Math.round(c.y), 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------------ interaction
  function plateAt(page: Pt) {
    let best: null | { i: number; pos: ReturnType<Route["sample"]>; d: number } = null;
    for (const v of visibleSlots()) {
      if (!isPickable(v.i) || d.route.isHidden(v.pos)) continue;
      const dist = Math.hypot(page.x - v.pos.x, (page.y - v.pos.y) * 1.3);
      if (dist < 34 * hp && (!best || dist < best.d)) best = { ...v, d: dist };
    }
    return best;
  }

  function trigger(i: number, page: Pt, now: number) {
    const it = stream.slot(i).item!;
    const type = it.effect;
    effects.push({ slot: i, type, start: now, dur: 900 });
    const kind = it.kind;
    if (type % 16 === 4) burst(page, kind, 18, "puff");
    if (type % 16 === 5) burst(page, kind, 40, "explode");
    if (type % 16 === 6 || type % 16 === 14) burst(page, kind, 14, "sparkle");
    if (["miso-soup", "matcha", "ramen-bowl", "teapot-mini"].includes(kind)) burst(page, kind, 10, "steam");
    const quips = QUIPS[kind];
    if (quips && type % 3 === 0) d.onSay(quips[Math.floor(rand() * quips.length)], { x: page.x, y: page.y - 18 });
    d.onEgg("plate-poke");
    if (it.category === "alive") d.onEgg(`alive-${kind}`);
    if (kind === "fortune-slip") d.onEgg("fortune");
  }

  function placedElement(item: Item, rim: Slot["rim"], page: Pt) {
    const el = document.createElement("button");
    el.className = "placed-plate";
    el.setAttribute("data-testid", "placed-plate");
    el.setAttribute("aria-label", `${MENU.find((m) => m.kind === item.kind)?.name ?? "A plate"}, set down`);
    const c = document.createElement("canvas");
    const plate = rim === "blue" ? plateBlue : plateGrey;
    const f = items.get(item.kind)!;
    const fw = f.width / framesOf(f);
    c.width = plate.width; c.height = plate.height + 24;
    const cx = crispContext(c);
    cx.drawImage(plate, 0, 24);
    cx.drawImage(f, 0, 0, fw, f.height, Math.round(plate.width / 2 - fw / 2 + item.offset.x * OFFSET_PX), Math.round(24 + plate.height / 2 - 6 - f.height * 0.7 + item.offset.y * OFFSET_PX), fw, f.height);
    c.style.width = `${c.width * hp}px`;
    c.style.height = `${c.height * hp}px`;
    el.appendChild(c);
    el.style.left = `${page.x}px`;
    el.style.top = `${page.y - 12 * hp}px`;
    (el as any).__plate = { item, rim };
    document.getElementById("placed")!.appendChild(el);
    return el;
  }

  function drop(page: Pt) {
    if (!held) return;
    const w = d.map.pageToWorld(page);
    const res = resolveDrop(w, d.surfaces(), d.water());
    if (res.kind === "placed") {
      if (held.el) { held.el.style.left = `${page.x}px`; held.el.style.top = `${page.y - 12 * hp}px`; held.el.style.visibility = ""; }
      else placedElement(held.item, held.rim, page);
      overrides.set(held.slot, { kind: "gone" });
      d.onEgg("table-for-one");
    } else if (res.kind === "koi") {
      held.el?.remove();
      overrides.set(held.slot, { kind: "gone" });
      burst(page, "miso-soup", 16, "steam");
    } else if (held.from === "belt") {
      overrides.delete(held.slot);
    } else if (held.el) {
      held.el.style.visibility = "";
    }
    held = null;
    document.body.classList.remove("dragging");
  }

  let press: null | { page: Pt; client: Pt; slot?: number; el?: HTMLElement; touch: boolean; timer: number; armed: boolean; t: number } = null;
  const pageOf = (e: PointerEvent): Pt => ({ x: e.clientX + scrollX, y: e.clientY + scrollY });

  function moveHeld(p: Pt) { if (held) held.page = p; }

  function startDrag() {
    if (!press) return;
    if (press.el) {
      const p = (press.el as any).__plate;
      held = { slot: -1, item: p.item, rim: p.rim, page: press.page, from: "placed", el: press.el };
      press.el.style.visibility = "hidden";
    } else if (press.slot !== undefined) {
      const sl = stream.slot(press.slot);
      held = { slot: press.slot, item: sl.item!, rim: sl.rim, page: press.page, from: "belt" };
      overrides.set(press.slot, { kind: "gone" });
    }
    document.body.classList.add("dragging");
  }

  addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const page = pageOf(e);
    const placedEl = (e.target as HTMLElement).closest?.(".placed-plate") as HTMLElement | null;
    const hit = placedEl ? null : plateAt(page);
    if (!placedEl && !hit) return;
    const touch = e.pointerType === "touch";
    press = { page, client: { x: e.clientX, y: e.clientY }, slot: hit?.i, el: placedEl ?? undefined, touch, timer: 0, armed: !touch, t: performance.now() };
    if (touch) press.timer = window.setTimeout(() => { if (press) { press.armed = true; startDrag(); } }, 260);
    else e.preventDefault();
  });
  addEventListener("pointermove", (e) => {
    if (held) { held.page = pageOf(e); return; }
    if (!press) return;
    const moved = Math.hypot(e.clientX - press.client.x, e.clientY - press.client.y);
    if (press.touch && !press.armed && moved > 8) { clearTimeout(press.timer); press = null; return; }
    if (!press.touch && moved > 5) { startDrag(); moveHeld(pageOf(e)); }
  });
  addEventListener("pointerup", (e) => {
    if (held) { drop(pageOf(e)); press = null; return; }
    if (!press) return;
    clearTimeout(press.timer);
    const now = performance.now();
    if (press.slot !== undefined) trigger(press.slot, press.page, now);
    else if (press.el) { const p = (press.el as any).__plate; burst(press.page, p.item.kind, 12, "sparkle"); }
    press = null;
  });
  addEventListener("touchmove", (e) => { if (held) e.preventDefault(); }, { passive: false });
  addEventListener("pointercancel", () => {
    if (press) clearTimeout(press.timer);
    press = null;
    if (!held) return;
    if (held.from === "belt") overrides.delete(held.slot);
    else if (held.el) held.el.style.visibility = "";
    held = null;
    document.body.classList.remove("dragging");
  });

  // ------------------------------------------------------------------ rare events
  function runRare(ev: RareEvent, now: number, vis: ReturnType<typeof visibleSlots>) {
    const shown = vis.filter((v) => isOccupied(v.i) && !overrides.has(v.i) && !d.route.isHidden(v.pos) && v.pos.y > scrollY + 60 && v.pos.y < scrollY + innerHeight - 60);
    if (ev === "walk-and-cuddle") {
      for (const v of shown) {
        const host = [v.i - 1, v.i + 1, v.i - 2, v.i + 2].find((j) => isOccupied(j) && !overrides.has(j) && shown.some((w) => w.i === j));
        if (host === undefined) continue;
        walk = { from: v.i, to: host, start: now, dur: 3200 };
        overrides.set(v.i, { kind: "walking", to: host, start: now });
        return true;
      }
      return false;
    }
    const v = shown[Math.floor(shown.length / 2)];
    if (!v) return false;
    const sl = stream.slot(v.i);
    const out = { x: Math.cos(v.pos.heading + Math.PI / 2), y: Math.sin(v.pos.heading + Math.PI / 2) };
    fall = { slot: v.i, item: sl.item!, rim: sl.rim, p: { x: v.pos.x, y: v.pos.y }, v: { x: out.x * 80 * hp, y: -60 * hp }, floor: v.pos.y + 52 * hp, start: now };
    overrides.set(v.i, { kind: "gone" });
    return true;
  }

  // ------------------------------------------------------------------ frame
  let lastNow = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, d.canvas.width / k, d.canvas.height / k);
    drawBelt();
    const vis = visibleSlots();
    if (!d.reduced) {
      const cand = vis.filter((v) => isOccupied(v.i) && !overrides.has(v.i)).length;
      for (const ev of rare.tick(dt, { candidates: cand >= 4 ? cand : 0 })) {
        if (runRare(ev, now, vis)) d.onEgg(ev === "fall-off" ? "overboard" : "belt-romance");
      }
    }
    for (let k = effects.length - 1; k >= 0; k--) if (now - effects[k].start > effects[k].dur) effects.splice(k, 1);
    for (const v of vis) {
      if (d.route.isHidden(v.pos)) continue;
      const sl = stream.slot(v.i);
      if (!sl.plate) continue;
      const o = overrides.get(v.i);
      const c = toCanvas(v.pos);
      const ang = itemAngle(v.pos);
      const fx = effects.find((f) => f.slot === v.i);
      const guest = [...overrides.entries()].find(([, ov]) => ov.kind === "guest" && ov.host === v.i);
      const guestItem = guest ? stream.slot(guest[0]).item! : undefined;
      if (o?.kind === "gone") continue;
      if (o?.kind === "guest") { drawPlate(c, sl.rim, null, ang, now, v.i); continue; }
      if (o?.kind === "walking") { drawPlate(c, sl.rim, null, ang, now, v.i); continue; }
      drawPlate(c, sl.rim, sl.item, ang, now, v.i, fx, guestItem);
    }
    if (walk) {
      const t = Math.min(1, (now - walk.start) / walk.dur);
      const a = d.route.sample(slotPos(walk.from)), b = d.route.sample(slotPos(walk.to));
      const it = stream.slot(walk.from).item!;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - Math.abs(Math.sin(t * Math.PI * 6)) * 6 * hp };
      const f = items.get("legged-maki")!;
      const img = it.kind === "legged-maki" ? f : items.get(it.kind)!;
      const n = framesOf(img), fw = img.width / n, k = Math.floor(now / 160) % n;
      const c = toCanvas(p);
      ctx.drawImage(img, k * fw, 0, fw, img.height, c.x - fw / 2, c.y - img.height * 0.9, fw, img.height);
      if (t >= 1) { overrides.set(walk.from, { kind: "guest", host: walk.to }); burst(b, "salmon-nigiri", 8, "sparkle"); walk = null; }
    }
    if (fall) {
      fall.v.y += 520 * hp * dt;
      fall.p.x += fall.v.x * dt; fall.p.y += fall.v.y * dt;
      const c = toCanvas(fall.p);
      drawPlate(c, fall.rim, fall.item, Math.sin((now - fall.start) / 90) * 0.4, now, fall.slot);
      if (fall.p.y >= fall.floor) { placedElement(fall.item, fall.rim, fall.p); burst(fall.p, fall.item.kind, 12, "puff"); fall = null; }
    }
    if (held) {
      const c = toCanvas(held.page);
      const plate = held.rim === "blue" ? plateBlue : plateGrey;
      ctx.globalAlpha = 0.35; ctx.fillStyle = "#0b0302";
      ctx.beginPath(); ctx.ellipse(Math.round(c.x), Math.round(c.y + 20), plate.width / 2, plate.height / 2.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      drawPlate({ x: c.x, y: c.y - 8 }, held.rim, held.item, 0, now, held.slot);
    }
    drawParticles(dt);
  }

  return {
    frame,
    resize,
    effectsActive: () => effects.length,
    platesInView: () =>
      visibleSlots()
        .filter((v) => overrides.get(v.i)?.kind !== "gone" && stream.slot(v.i).plate)
        .filter((v) => !d.route.isHidden(v.pos) && v.pos.y >= scrollY && v.pos.y <= scrollY + innerHeight && v.pos.x >= 0 && v.pos.x <= innerWidth)
        .map((v) => {
          const o = overrides.get(v.i);
          const it = stream.slot(v.i).item;
          return { id: v.i, x: v.pos.x - scrollX, y: v.pos.y - scrollY, r: 26 * hp, kind: it && (!o || o.kind === "walking") ? it.kind : "empty" };
        }),
    slotsInView: () => {
      const v = visibleSlots().filter((x) => overrides.get(x.i)?.kind !== "gone" && x.pos.y >= scrollY && x.pos.y <= scrollY + innerHeight && !d.route.isHidden(x.pos));
      return {
        total: v.length,
        plates: v.filter((x) => stream.slot(x.i).plate).length,
        filled: v.filter((x) => isOccupied(x.i) && !overrides.has(x.i)).length,
      };
    },
  };
}

