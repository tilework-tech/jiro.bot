import { BELT_SPEED, PLATE_GAP, SLAT, type BeltPath, type Plate } from "./types";
import { itemFor, rimFor, itemImg, ITEMS, hash, hash01 } from "./items";

// ONE belt. Every plate slot has a global integer id. On any path, slot `id` sits at
//   u = now * BELT_SPEED + path.phase - id * PLATE_GAP
// and scene phases are chained in scroll order (setChain), so a plate that leaves one
// room re-enters the next with the same id, item, glaze and behaviour.
//
// A belt path is resampled into points carrying cumulative "world" distance u.
// Screen distance = u * scale, so plates slow down and shrink with perspective
// while moving at the same world speed everywhere. Polyline corners are filleted
// at bake time (radius >= 1.2 x belt width x scale) so the belt never kinks.

interface Sample { x: number; y: number; s: number; u: number; nx: number; ny: number; a: number }
interface Baked { samples: Sample[]; U: number; L: [number, number][]; R: [number, number][] }

const cache = new WeakMap<BeltPath, Baked>();

type P3 = [number, number, number];

/** Replace every interior corner with a circular arc (radius >= 1.2 x width x scale, clamped
 * to half the shorter adjacent segment so neighbouring fillets never overlap). */
function fillet(pts: P3[], width: number, closed: boolean): P3[] {
  const n = pts.length;
  if (n < 3) return pts;
  const out: P3[] = [];
  for (let i = 0; i < n; i++) {
    const interior = closed || (i > 0 && i < n - 1);
    if (!interior) { out.push(pts[i]); continue; }
    const a = pts[(i - 1 + n) % n], c = pts[i], b = pts[(i + 1) % n];
    const v1x = c[0] - a[0], v1y = c[1] - a[1], v2x = b[0] - c[0], v2y = b[1] - c[1];
    const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
    if (l1 < 1e-6 || l2 < 1e-6) { out.push(c); continue; }
    const d1x = v1x / l1, d1y = v1y / l1, d2x = v2x / l2, d2y = v2y / l2;
    const cross = d1x * d2y - d1y * d2x, dot = d1x * d2x + d1y * d2y;
    const th = Math.atan2(cross, dot); // signed turn angle
    const ath = Math.abs(th);
    if (ath < 0.02 || ath > Math.PI - 0.05) { out.push(c); continue; }
    const tanH = Math.tan(ath / 2);
    let t = 1.2 * width * c[2] * tanH;
    t = Math.min(t, l1 / 2, l2 / 2);
    const r = t / tanH;
    const A: P3 = [c[0] - d1x * t, c[1] - d1y * t, c[2] + (a[2] - c[2]) * (t / l1)];
    const B: P3 = [c[0] + d2x * t, c[1] + d2y * t, c[2] + (b[2] - c[2]) * (t / l2)];
    // Arc centre: left normal of d1 for a left turn (cross > 0 in screen coords turns clockwise).
    const sg = Math.sign(cross);
    const cx = A[0] - d1y * r * sg, cy = A[1] + d1x * r * sg;
    const a0 = Math.atan2(A[1] - cy, A[0] - cx);
    const m = Math.max(2, Math.ceil((ath * r) / 4));
    out.push(A);
    for (let k = 1; k < m; k++) {
      const f = k / m, an = a0 + th * f;
      out.push([cx + Math.cos(an) * r, cy + Math.sin(an) * r, A[2] + (B[2] - A[2]) * f]);
    }
    out.push(B);
  }
  if (closed) out.push(out[0]);
  return out;
}

function bake(path: BeltPath): Baked {
  const hit = cache.get(path);
  if (hit) return hit;
  const w = path.width ?? 64;
  const raw = path.pts.map(([x, y, s]) => [x, y, s ?? 1] as P3);
  const pts = fillet(raw, w, !!path.closed);
  if (path.closed && pts[pts.length - 1] !== pts[0]) pts.push(pts[0]);
  const out: Sample[] = [];
  let u = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0, s0] = pts[i];
    const [x1, y1, s1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(len / 6));
    for (let j = 0; j < n; j++) {
      const f = j / n;
      const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, s = s0 + (s1 - s0) * f;
      if (out.length) {
        const p = out[out.length - 1];
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < 0.01) continue;
        u += d / ((s + p.s) / 2);
      }
      out.push({ x, y, s, u, nx: 0, ny: 0, a: 0 });
    }
  }
  const [xl, yl, sl] = pts[pts.length - 1];
  const p = out[out.length - 1];
  u += Math.hypot(xl - p.x, yl - p.y) / ((sl + p.s) / 2);
  out.push({ x: xl, y: yl, s: sl, u, nx: 0, ny: 0, a: 0 });
  const last = out.length - 1;
  for (let i = 0; i < out.length; i++) {
    // Closed loops wrap neighbours across the join so the tread has no notch there.
    const a = path.closed && i === 0 ? out[last - 1] : out[Math.max(0, i - 1)];
    const b = path.closed && i === last ? out[1] : out[Math.min(last, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    out[i].nx = -dy / l; out[i].ny = dx / l; out[i].a = Math.atan2(dy, dx);
  }
  const edge = (side: number) => out.map((q) => [q.x + q.nx * side * (w * q.s) / 2, q.y + q.ny * side * (w * q.s) / 2] as [number, number]);
  const baked = { samples: out, U: u, L: edge(-1), R: edge(1) };
  cache.set(path, baked);
  return baked;
}

/** Point on the path at world distance u (clamped, or wrapped when closed). */
export function pointAt(path: BeltPath, u: number): Sample {
  const { samples, U } = bake(path);
  if (path.closed) u = ((u % U) + U) % U;
  else u = Math.max(0, Math.min(U, u));
  let lo = 0, hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].u <= u) lo = mid; else hi = mid;
  }
  const a = samples[lo], b = samples[hi];
  const f = b.u === a.u ? 0 : (u - a.u) / (b.u - a.u);
  // Interpolate the heading too, so plates and slats turn smoothly through fillets.
  let da = b.a - a.a;
  if (da > Math.PI) da -= Math.PI * 2; else if (da < -Math.PI) da += Math.PI * 2;
  const an = a.a + da * f;
  return {
    x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, s: a.s + (b.s - a.s) * f,
    u, nx: -Math.sin(an), ny: Math.cos(an), a: an,
  };
}

export function pathLength(path: BeltPath): number {
  return bake(path).U;
}

// ---------------------------------------------------------------------------------------
// Global plate identity: the chain of scene belts, occupancy, and plate life.

const V = BELT_SPEED;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x); };

/** `?debugplates=1` boosts chats, falls and walking legs so they can be checked quickly. */
export const debugPlates = typeof location !== "undefined" && new URLSearchParams(location.search).has("debugplates");

export interface ChainLink {
  id: string;
  belt: BeltPath;
  /** Chained phase (also written into belt.phase). */
  phase: number;
  /** Path length. */
  U: number;
  /** Global belt distance J at this scene's local u = 0. */
  off: number;
  /** Gap to the next scene (world units), 0 for the last scene. */
  gap: number;
}

const chain: { ready: boolean; phase0: number; links: ChainLink[]; byId: Map<string, ChainLink>; fallTotal: number } = {
  ready: false, phase0: 0, links: [], byId: new Map(), fallTotal: 0,
};

/**
 * Chain scene belt phases in scroll order (called once by the engine at start):
 * phase[0] = first scene's declared phase; phase[i+1] = phase[i] - pathLength(i) - gap(i).
 * Consecutive scenes sharing one belt object (storage/pantry) share the phase.
 * gaps[i] undefined: smallest gap >= 0 keeping scene i+1's declared phase residue mod PLATE_GAP.
 */
export function setChain(scenes: { id: string; belt: BeltPath }[], gaps: (number | undefined)[]) {
  chain.links = [];
  chain.byId.clear();
  let phase = scenes[0].belt.phase ?? 0;
  chain.phase0 = phase;
  const declared = scenes.map((s) => s.belt.phase ?? 0);
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const U = pathLength(s.belt);
    const next = scenes[i + 1];
    let gap = 0, nextPhase = phase;
    if (next && next.belt !== s.belt) {
      gap = gaps[i] ?? mod(phase - U - declared[i + 1], PLATE_GAP);
      nextPhase = phase - U - gap;
    } else if (next) gap = -U;
    const link: ChainLink = { id: s.id, belt: s.belt, phase, U, off: chain.phase0 - phase, gap };
    chain.links.push(link);
    chain.byId.set(s.id, link);
    s.belt.phase = phase;
    phase = nextPhase;
  }
  // Scenes a plate may fall off in: every distinct belt except the last (the koi eats those).
  chain.fallTotal = 0;
  for (const l of fallLinks()) chain.fallTotal += fallSpan(l)[1] - fallSpan(l)[0];
  chain.ready = true;
}

/** Chain info (read-only): scene id -> phase, U, off (global J at local u=0), gap. */
export function chainInfo(): readonly ChainLink[] {
  return chain.links;
}

/**
 * Phase for a path whose u = 0 sits at local distance `u` along scene `sceneId`'s belt.
 * u = 0: path starts where the scene belt starts. u = pathLength(scene): starts where it ends.
 * Negative u: the path starts before the scene belt (e.g. a wall cutaway that feeds it).
 */
export function beltPhase(sceneId: string, u = 0): number {
  const l = chain.byId.get(sceneId);
  return (l ? l.phase : 0) - u;
}

/** Global belt distance J travelled by plate `id` (bar belt start = J 0 when the bar phase is 0). */
export function globalU(id: number, now: number): number {
  return now * V + chain.phase0 - id * PLATE_GAP;
}

/** Global id of the slot nearest to local distance u on a path (uses path.phase, or `phase`). */
export function plateIdAt(path: BeltPath, u: number, now: number, phase = path.phase ?? 0): number {
  return Math.round((now * V + phase - u) / PLATE_GAP);
}

// Occupancy: clustered runs, deterministic per 32-slot block. ~53% of slots are empty;
// plates come in clusters of 2-4 with lone plates, empties in runs of 1-6.
const OCC_B = 32;
const RUN_FULL = [1, 2, 2, 3, 3, 3, 4, 4];
const RUN_EMPTY = [1, 1, 2, 3, 3, 4, 5, 6];
const occCache = new Map<number, Uint8Array>();
function occBlock(b: number): Uint8Array {
  let a = occCache.get(b);
  if (a) return a;
  a = new Uint8Array(OCC_B);
  let s = hash(b, "occ") | 0;
  const r = () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) | 0;
    s ^= s >>> 13; s = Math.imul(s, 3266489909);
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
  let full = r() < 0.5, i = 0;
  while (i < OCC_B) {
    const runs = full ? RUN_FULL : RUN_EMPTY;
    const len = runs[Math.floor(r() * runs.length)];
    for (let k = 0; k < len && i < OCC_B; k++) a[i++] = full ? 1 : 0;
    full = !full;
  }
  if (occCache.size > 4000) occCache.clear();
  occCache.set(b, a);
  return a;
}

/** Does global slot `id` carry a plate at all? (It may still fall off later: see plateBehaviour.) */
export function slotOccupied(id: number): boolean {
  const b = Math.floor(id / OCC_B);
  return occBlock(b)[id - b * OCC_B] === 1;
}

/** The item riding on global plate `id` (same everywhere). */
export function itemOf(id: number): string {
  return itemFor(id);
}

// --- Chat: an occupied plate slides up next to its occupied neighbour, both "talk", it drifts back.
const CHAT_DIST = PLATE_GAP - 60;       // world units the mover closes
const CHAT_SPEED = 8;                   // world units per second, relative to the belt
const CHAT_A = CHAT_DIST / CHAT_SPEED;  // approach time
const CHAT_TALK = 4.5;
const CHAT_T = CHAT_A * 2 + CHAT_TALK;
const CHAT_PERIOD = debugPlates ? 1100 : 2800; // world units of travel between a pair's chats
const CHAT_P = debugPlates ? 1 : 0.45;
const GLYPHS = ["dots", "bang", "heart", "fish", "q", "note"];

const FALL_P = debugPlates ? 1 / 3 : 1 / 30;
const WOB = 1.8, SLIDE = 1.1, DROP = 110, GRAV = 900, SHARDS = 1.0;
const T_LAND = Math.sqrt((2 * DROP) / GRAV);

function fallLinks(): ChainLink[] {
  const out: ChainLink[] = [];
  for (let i = 0; i < chain.links.length - 1; i++) {
    const l = chain.links[i];
    if (i > 0 && chain.links[i - 1].belt === l.belt) continue;
    if ((l.belt.style ?? "full") === "none") continue;
    out.push(l);
  }
  return out;
}
/** Local u range where a fall may start: well clear of the wall openings at either end. */
function fallSpan(l: ChainLink): [number, number] {
  const m0 = Math.max(160, (l.belt.fadeIn ?? 40) + 120);
  const m1 = Math.max(220, (l.belt.fadeOut ?? 40) + 180) + SLIDE * V;
  return m0 < l.U - m1 ? [m0, l.U - m1] : [0, 0];
}

/** Global J at which plate `id` starts to wobble off, or null if it rides to the koi. */
export function fallAt(id: number): number | null {
  if (!chain.ready || !chain.fallTotal || hash01(id, "fall") >= FALL_P || !slotOccupied(id)) return null;
  let r = hash01(id, "fallu") * chain.fallTotal;
  for (const l of fallLinks()) {
    const [a, b] = fallSpan(l);
    if (r <= b - a) return l.off + a + r;
    r -= b - a;
  }
  return null;
}

function falls(id: number): boolean {
  return chain.ready && hash01(id, "fall") < FALL_P;
}

/** Pair (a, a+1) chats (a is the leader, further along the belt). Pairs never share a plate. */
function chatRaw(a: number): boolean {
  return slotOccupied(a) && slotOccupied(a + 1) && !falls(a) && !falls(a + 1) && hash01(a, "chat") < CHAT_P;
}
function chatPair(a: number): boolean {
  return chatRaw(a) && !chatRaw(a - 1);
}

export interface PlateLife {
  /** Along-belt offset in world units (chat approach, or stopping once off the belt). */
  du: number;
  /** Sideways slide 0..1 (1 = just over the rail). */
  off: number;
  /** Screen px (at scale 1) the plate has dropped below the belt. */
  drop: number;
  rot: number;
  bubble: string | null;
  /** 0..1 while lying in shards. */
  shatter: number;
  falling: boolean;
  /** Fell off earlier in its journey: not drawn any more. */
  gone: boolean;
}

/** Everything a plate is doing right now. Pure function of the global id and time. */
export function plateBehaviour(id: number, now: number): PlateLife {
  const life: PlateLife = { du: 0, off: 0, drop: 0, rot: 0, bubble: null, shatter: 0, falling: false, gone: false };
  const J = globalU(id, now);
  const jf = falls(id) ? fallAt(id) : null;
  if (jf !== null && J >= jf) {
    const t = (J - jf) / V;
    life.falling = true;
    if (t < WOB) {
      life.rot = 0.13 * Math.sin(t * 15) * Math.min(1, t / 0.5);
    } else if (t < WOB + SLIDE) {
      const e = ss((t - WOB) / SLIDE);
      life.off = e;
      life.rot = 0.08 * e + 0.05 * Math.sin(t * 11) * (1 - e);
    } else {
      const td = t - WOB - SLIDE;
      life.off = 1;
      life.du = -td * V; // off the belt: it stops travelling
      if (td < T_LAND) {
        life.drop = 0.5 * GRAV * td * td;
        life.rot = 0.08 + td * 3.2;
      } else {
        life.drop = DROP;
        life.shatter = (td - T_LAND) / SHARDS;
        if (life.shatter >= 1) { life.gone = true; life.shatter = 1; }
      }
    }
    return life;
  }
  // Chats: as leader of pair (id, id+1) or follower of (id-1, id).
  for (const [a, lead] of [[id, true], [id - 1, false]] as const) {
    if (!chatPair(a)) continue;
    const ja = globalU(a, now);
    const tc = mod(ja - hash01(a, "chatoff") * CHAT_PERIOD, CHAT_PERIOD) / V;
    if (tc >= CHAT_T) continue;
    const moverIsLeader = (hash(a, "mover") & 1) === 1;
    const e = tc < CHAT_A ? ss(tc / CHAT_A) : tc < CHAT_A + CHAT_TALK ? 1 : 1 - ss((tc - CHAT_A - CHAT_TALK) / CHAT_A);
    if (lead === moverIsLeader) life.du = (lead ? -1 : 1) * CHAT_DIST * e;
    const tt = tc - CHAT_A;
    const on = lead ? tt > 0.2 && tt < CHAT_TALK - 1 : tt > 1.2 && tt < CHAT_TALK;
    if (on) life.bubble = GLYPHS[hash(a, lead ? "g1" : "g2") % GLYPHS.length];
  }
  return life;
}

// ---------------------------------------------------------------------------------------
// Tread.

const TREAD = "#2b2723";
const TREAD_HI = "#4a433b";
const RAIL = "#c9814a";
const RAIL_DARK = "#6d3f22";
const SEAM = "rgba(0,0,0,.5)";
const GAPC = "#0e0c0b";

function poly(g: CanvasRenderingContext2D, pts: [number, number][]) {
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
}

/**
 * Tread as a kaiten/baggage-carousel slat chain: every SLAT world units a crescent slat
 * overlaps the next. Seams are perpendicular to the path and bow forward; on curves the
 * outside fans open (a dark gap wedge grows with curvature), the inside stays tight.
 */
function drawSlats(g: CanvasRenderingContext2D, path: BeltPath, now: number, w: number, full: boolean) {
  const { U } = bake(path);
  const off = mod(now * V + (path.phase ?? 0), SLAT);
  const K = [-1, -0.5, 0, 0.5, 1];
  for (let u = off; u < U; u += SLAT) {
    const p = pointAt(path, u);
    const hw = (w * p.s) / 2 - 3;
    if (hw < 2) continue;
    // Signed curvature per screen px (positive: turning toward +normal side... measured by heading).
    const pa = pointAt(path, u - 5), pb = pointAt(path, u + 5);
    let da = pb.a - pa.a;
    if (da > Math.PI) da -= Math.PI * 2; else if (da < -Math.PI) da += Math.PI * 2;
    const kap = da / (10 * p.s);
    const bowW = (hw * 0.32) / p.s; // crescent bow in world units
    const front: [number, number][] = [], back: [number, number][] = [], lip: [number, number][] = [];
    for (const k of K) {
      const q = pointAt(path, u - bowW * k * k);
      const lx = q.x + q.nx * k * hw, ly = q.y + q.ny * k * hw;
      // Spacing at this lateral offset relative to the centre line: 1 + kap * offset (outside > 1).
      const spread = Math.max(0, -kap * k * hw) * SLAT * q.s;
      const th = full ? 2 + spread * 0.9 : 1.5 + spread * 0.6;
      const tx = Math.cos(q.a), ty = Math.sin(q.a);
      front.push([lx, ly]);
      back.push([lx - tx * th, ly - ty * th]);
      lip.push([lx - tx * (th + 1.5), ly - ty * (th + 1.5)]);
    }
    g.fillStyle = full ? GAPC : SEAM;
    g.beginPath();
    poly(g, front);
    for (let i = back.length - 1; i >= 0; i--) g.lineTo(back[i][0], back[i][1]);
    g.closePath();
    g.fill();
    if (full) {
      // Lit lip of the slat that overlaps from behind.
      g.strokeStyle = TREAD_HI;
      g.lineWidth = 1.5;
      g.beginPath();
      poly(g, lip);
      g.stroke();
    }
  }
}

export function drawTread(g: CanvasRenderingContext2D, path: BeltPath, now: number) {
  const style = path.style ?? "full";
  if (style === "none") return;
  const { samples, L, R } = bake(path);
  const w = path.width ?? 64;
  if (style === "full") {
    // Shadow, body.
    g.fillStyle = "rgba(0,0,0,.35)";
    g.beginPath();
    L.forEach(([x, y], i) => (i ? g.lineTo(x, y + 8 * samples[i].s) : g.moveTo(x, y + 8 * samples[i].s)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1] + 8 * samples[i].s);
    g.closePath(); g.fill();
    g.fillStyle = TREAD;
    g.beginPath();
    poly(g, L);
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath(); g.fill();
  }
  drawSlats(g, path, now, w, style === "full");
  if (style === "full") {
    for (const [pts, col, lw] of [[L, RAIL_DARK, 7], [R, RAIL_DARK, 7], [L, RAIL, 4], [R, RAIL, 4]] as const) {
      g.strokeStyle = col; g.lineWidth = lw;
      g.lineJoin = "round";
      g.beginPath();
      poly(g, pts);
      g.stroke();
    }
  }
}

// ---------------------------------------------------------------------------------------
// Plates on a path.

/**
 * Every plate currently on the path, with global ids and their life applied (chat slides,
 * falls). `phase` overrides path.phase. The third argument used to be a per-scene key; a
 * string is still accepted there and ignored.
 */
export function platesOn(path: BeltPath, now: number, phase?: number | string): Plate[] {
  const { U } = bake(path);
  const ph = typeof phase === "number" ? phase : path.phase ?? 0;
  probe?.(path, ph);
  const head = now * V + ph;
  const out: Plate[] = [];
  const fi = path.fadeIn ?? 40, fo = path.fadeOut ?? 40;
  const w = path.width ?? 64, size = path.plate ?? 52;
  const M = PLATE_GAP;
  const nLo = Math.ceil((head - U - M) / PLATE_GAP), nHi = Math.floor((head + M) / PLATE_GAP);
  for (let id = nLo; id <= nHi; id++) {
    if (!slotOccupied(id)) continue;
    const life = plateBehaviour(id, now);
    if (life.gone) continue;
    let u = head - id * PLATE_GAP + life.du;
    if (path.closed) u = mod(u, U);
    else if (u < 0 || u > U) continue;
    const p = pointAt(path, u);
    let alpha = 1;
    if (!path.closed) {
      if (u < fi) alpha = u / fi;
      if (U - u < fo) alpha = Math.min(alpha, (U - u) / fo);
    }
    let x = p.x, y = p.y;
    if (life.off) {
      // Slide over the rail on the side facing the viewer (screen-down), else a hashed side.
      const side = Math.abs(p.ny) > 0.3 ? Math.sign(p.ny) : (hash(id, "side") & 1 ? 1 : -1);
      const d = life.off * ((w / 2) * p.s + size * p.s * 0.45);
      x += p.nx * side * d; y += p.ny * side * d;
    }
    y += life.drop * p.s;
    out.push({
      x, y, s: p.s, angle: p.a, alpha, id,
      item: itemFor(id), rim: rimFor(id), key: `p:${id}`,
      rot: life.rot || undefined, bubble: life.bubble ?? undefined,
      shatter: life.shatter || undefined, falling: life.falling || undefined,
    });
  }
  // Painter's order: farther (smaller y) first; falling plates last so they drop in front of the belt.
  out.sort((a, b) => (a.falling ? 1 : 0) - (b.falling ? 1 : 0) || a.y - b.y);
  return out;
}

// ---- Plates: one ceramic style. Pre-rendered pixel-art sprites (hard edges, cream glaze,
// thin darker rim band, highlight), cached per (glaze, integer diameter).

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(c: [number, number, number], t: [number, number, number], f: number): [number, number, number] {
  return [c[0] + (t[0] - c[0]) * f, c[1] + (t[1] - c[1]) * f, c[2] + (t[2] - c[2]) * f].map(Math.round) as [number, number, number];
}

const plateCache = new Map<string, HTMLCanvasElement>();
/** Plate sprite: width d, anchored so the plate's centre is at (W/2, cy). Returns [canvas, cy]. */
function plateSprite(glaze: string, d: number): [HTMLCanvasElement, number] {
  const key = glaze + d;
  const rx = d / 2, ry = Math.max(2, Math.round(d * 0.2));
  const lip = Math.max(1, Math.round(d * 0.06));
  const cy = ry + 1;
  let c = plateCache.get(key);
  if (c) return [c, cy];
  const W = d + 2, H = ry * 2 + lip + 4;
  c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);
  const base = hexRgb(glaze);
  const line: [number, number, number] = [52, 40, 32];          // outline
  const band: [number, number, number] = [150, 112, 78];        // thin darker rim band
  const bandLo: [number, number, number] = [122, 88, 60];
  const side = mix(base, [120, 100, 80], 0.38);                 // foot/side of the plate
  const well = mix(base, [150, 130, 105], 0.16);                // shaded well under the back rim
  const hi: [number, number, number] = [255, 252, 244];
  const cx = W / 2;
  const inE = (x: number, y: number, ex: number, ey: number, ox = 0, oy = 0) => {
    const dx = (x - cx - ox) / ex, dy = (y - cy - oy) / ey;
    return dx * dx + dy * dy <= 1;
  };
  const bw = d >= 34 ? 1.6 : 1.1; // rim band thickness in px
  const irx = rx * 0.66, iry = ry * 0.6;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5;
      let col: [number, number, number] | null = null;
      let alpha = 255;
      const top = inE(px, py, rx, ry);
      const sideP = !top && inE(px, py - lip, rx, ry) && py > cy;
      if (inE(px, py, rx + 1, ry + 1) && !top && !sideP) col = line;
      else if (sideP) col = inE(px, py - lip, rx - 1, ry - 1) ? side : line;
      else if (top) {
        if (!inE(px, py, rx - bw, ry - bw * 0.7)) col = py < cy ? band : bandLo; // thin rim band
        else if (inE(px, py, irx, iry, 0, -0.5)) {
          col = !inE(px, py, irx, iry, 0, 1.5) ? well : base;
          if (inE(px, py, irx * 0.26, iry * 0.26, irx * 0.4, -iry * 0.32)) col = hi;
        } else if (inE(px, py, irx + 1, iry + 1, 0, -0.5)) col = mix(base, [120, 100, 80], 0.22); // foot ring
        else {
          col = base;
          if (py < cy - ry * 0.5 && px > cx - rx * 0.6 && px < cx - rx * 0.34) col = hi; // glint
        }
      } else if (inE(px, py - lip - 1, rx, ry)) { col = [0, 0, 0]; alpha = 90; } // contact shadow
      if (!col) continue;
      const i = (y * W + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = alpha;
    }
  }
  g.putImageData(img, 0, 0);
  plateCache.set(key, c);
  return [c, cy];
}

// Speech-bubble glyphs, 5x5.
const GLYPH: Record<string, string[]> = {
  dots: ["00000", "00000", "10101", "00000", "00000"],
  bang: ["00100", "00100", "00100", "00000", "00100"],
  heart: ["01010", "11111", "11111", "01110", "00100"],
  fish: ["00000", "10110", "11111", "10110", "00000"],
  q: ["01110", "00010", "00110", "00000", "00100"],
  note: ["00110", "00101", "00100", "01100", "01100"],
};
const GLYPH_COL: Record<string, string> = { heart: "#d8434a", fish: "#3a6fc4", bang: "#c8483f", note: "#2b2723", dots: "#2b2723", q: "#2b2723" };

function drawBubble(g: CanvasRenderingContext2D, x: number, y: number, d: number, glyph: string) {
  const u = Math.max(2, Math.round(d / 16)); // pixel unit
  const bw = 9 * u, bh = 7 * u;
  const bx = Math.round(x - bw / 2 + d * 0.28), by = Math.round(y - bh - 3 * u);
  g.fillStyle = "#1c1511";
  g.fillRect(bx - u, by, bw + 2 * u, bh);
  g.fillRect(bx, by - u, bw, bh + 2 * u);
  g.fillStyle = "#fbf6ea";
  g.fillRect(bx, by, bw, bh);
  // tail
  g.fillStyle = "#1c1511";
  g.fillRect(bx + u, by + bh + u, 2 * u, u);
  g.fillRect(bx + u, by + bh + 2 * u, u, u);
  g.fillStyle = "#fbf6ea";
  g.fillRect(bx + u, by + bh, 2 * u, u);
  const rows = GLYPH[glyph] ?? GLYPH.dots;
  g.fillStyle = GLYPH_COL[glyph] ?? "#2b2723";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (rows[r][c] === "1") g.fillRect(bx + (2 + c) * u, by + (1 + r) * u, u, u);
}

function drawShards(g: CanvasRenderingContext2D, pl: Plate, d: number) {
  const f = pl.shatter ?? 0;
  const id = pl.id ?? 0;
  g.globalAlpha = pl.alpha * (1 - f * f * f);
  const u = Math.max(3, Math.round(d / 9));
  for (let k = 0; k < 6; k++) {
    const an = (k / 6) * Math.PI * 2 + hash01(id, "sh" + k) * 0.9;
    const r = (0.25 + 0.75 * Math.min(1, f * 3.2)) * d * (0.45 + 0.35 * hash01(id, "sr" + k));
    const x = Math.round(pl.x + Math.cos(an) * r), y = Math.round(pl.y + Math.sin(an) * r * 0.35);
    g.fillStyle = "#342820";
    g.fillRect(x - u, y - u, u * 3, u * 2 + 1);
    g.fillStyle = k % 3 === 0 ? "#96704e" : pl.rim;
    g.fillRect(x - u + 1, y - u + 1, u * 3 - 2, u * 2 - 1);
  }
  g.globalAlpha = 1;
}

export function drawPlates(g: CanvasRenderingContext2D, plates: Plate[], size: number, hidden?: Set<string>) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  for (const pl of plates) {
    if (hidden?.has(pl.key) || pl.alpha <= 0) continue;
    const d = Math.max(6, Math.round(size * pl.s));
    if (pl.shatter) { drawShards(g, pl, d); continue; }
    const x = Math.round(pl.x), y = Math.round(pl.y);
    g.globalAlpha = pl.alpha;
    const legH = pl.legs !== undefined ? Math.max(3, Math.round(d * 0.14)) : 0;
    if (!pl.falling) {
      // Drop shadow on the belt / surface (hard-edged, one ellipse).
      g.fillStyle = "rgba(0,0,0,.28)";
      g.beginPath(); g.ellipse(x + 1, y + Math.round(d * 0.12), Math.round(d * 0.5), Math.round(d * 0.2), 0, 0, Math.PI * 2); g.fill();
    }
    g.save();
    g.translate(x, y - legH);
    if (pl.rot) g.rotate(pl.rot);
    if (legH) {
      // Two tiny pixel legs under the plate's foot, 2-frame toddle (outlined so they read on any surface).
      const lu = Math.max(2, Math.round(d / 18));
      const foot = Math.round(d * 0.2) + Math.round(d * 0.06) - 1;
      const f = pl.legs === 1 ? 1 : -1;
      const dir = pl.dir ?? 1;
      for (const [lx, sh] of [[-d * 0.16, f], [d * 0.16, -f]] as const) {
        const X = Math.round(lx) + sh * lu;
        g.fillStyle = "#1c1511";
        g.fillRect(X - 1, foot, lu + 2, legH + lu + 1);
        g.fillRect(X - 1 + (dir > 0 ? 0 : -lu), foot + legH - 1, lu * 2 + 2, lu + 2);
        g.fillStyle = "#f3dcb2";
        g.fillRect(X, foot, lu, legH + lu - 1);
        g.fillRect(X + (dir > 0 ? 0 : -lu), foot + legH, lu * 2, lu);
      }
    }
    const [spr, cy] = plateSprite(pl.rim, d);
    g.drawImage(spr, -(spr.width >> 1), -cy);
    const im = itemImg(pl.item);
    if (im.complete && im.naturalWidth) {
      const f = Math.min((d * 0.86) / im.naturalWidth, (d * 0.92) / im.naturalHeight);
      const iw = Math.round(im.naturalWidth * f), ih = Math.round(im.naturalHeight * f);
      // Living passengers hop 1 px as they travel (tied to position, so it loops with the belt).
      const hop = ITEMS[pl.item]?.animal && ((Math.floor((pl.x + pl.y * 0.5) / 18) & 3) === 0) ? 1 : 0;
      if (pl.dir === -1) {
        g.save(); g.scale(-1, 1);
        g.drawImage(im, -(iw >> 1), -ih + Math.round(d * 0.1) - hop, iw, ih);
        g.restore();
      } else g.drawImage(im, -(iw >> 1), -ih + Math.round(d * 0.1) - hop, iw, ih);
    }
    g.restore();
    if (pl.bubble) drawBubble(g, x, y - legH - Math.round(d * 0.75), d, pl.bubble);
  }
  g.globalAlpha = 1;
  g.imageSmoothingEnabled = prev;
}

/** Tread + plates. `phase` overrides path.phase (legacy string keys are ignored). */
export function drawBeltFull(g: CanvasRenderingContext2D, path: BeltPath, now: number, phase?: number | string, hidden?: Set<string>): Plate[] {
  drawTread(g, typeof phase === "number" && phase !== path.phase ? withPhase(path, phase) : path, now);
  const plates = platesOn(path, now, phase);
  drawPlates(g, plates, path.plate ?? 52, hidden);
  return plates;
}

// Phase-overridden views of a path share the bake of the original (keyed by object).
const phased = new WeakMap<BeltPath, Map<number, BeltPath>>();
function withPhase(path: BeltPath, phase: number): BeltPath {
  let m = phased.get(path);
  if (!m) phased.set(path, (m = new Map()));
  let q = m.get(phase);
  if (!q) {
    q = { ...path, phase };
    const b = bake(path);
    cache.set(q, b);
    if (m.size > 16) m.clear();
    m.set(phase, q);
  }
  return q;
}

/** QA hook: tools/qa/align.mjs installs window.__beltProbe to list the paths drawn in a frame. */
const probe = (path: BeltPath, phase: number) => {
  const f = (globalThis as { __beltProbe?: (p: BeltPath, ph: number, U: number, off: number) => void }).__beltProbe;
  if (f) f(path, phase, pathLength(path), chain.phase0 - phase);
};

export function hitPlate(plates: Plate[], size: number, x: number, y: number): Plate | null {
  let best: Plate | null = null, bd = Infinity;
  for (const p of plates) {
    if (p.falling || p.shatter) continue;
    const d = size * p.s;
    const cy = p.y - d * 0.35;
    const dist = Math.hypot((x - p.x) / (d * 0.6), (y - cy) / (d * 0.7));
    if (dist < 1 && dist < bd) { bd = dist; best = p; }
  }
  return best;
}
