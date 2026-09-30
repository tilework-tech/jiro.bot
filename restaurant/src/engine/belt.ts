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

const chain: { ready: boolean; phase0: number; links: ChainLink[]; byId: Map<string, ChainLink> } = {
  ready: false, phase0: 0, links: [], byId: new Map(),
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

// Occupancy: irregular runs, deterministic per 64-slot block. About 62% of slots are empty:
// mostly lone plates and pairs, now and then a train of 4-5, and gaps from one slot to long
// stretches of bare belt (up to 13 slots, a whole room). Heavy-tailed on purpose so the belt
// never settles into a rhythm.
const OCC_B = 64;
const RUN_FULL = [1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 5];
const RUN_EMPTY = [1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 7, 9, 12];
const occCache = new Map<number, Uint8Array>();
function occBlock(b: number): Uint8Array {
  let a = occCache.get(b);
  if (a) return a;
  a = new Uint8Array(OCC_B);
  let s = hash(b, "occ2") | 0;
  const r = () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) | 0;
    s ^= s >>> 13; s = Math.imul(s, 3266489909);
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
  let full = r() < 0.4, i = 0;
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

/**
 * Plates a visitor pulled off the belt (held, parked on a surface, vanished or exploded).
 * They are gone from the belt in EVERY room and transition until they are put back
 * (engine/drag.ts owns this set). plateBehaviour(id).gone is true for them.
 */
export const taken = new Set<number>();

/** Is plate `id` riding the belt right now (occupied, not fallen, not taken)? */
export function plateOnBelt(id: number, now: number): boolean {
  return slotOccupied(id) && !plateBehaviour(id, now).gone;
}

// --- Chat: a plate glides up to the next plate behind or ahead (up to one empty slot between
// them), both trade little pixel speech bubbles, and it drifts back into its own slot.
// Relative speed peaks at ~0.55 x belt speed, so it reads as the plate moving on its own.
const CHAT_NEAR = 66;                     // world units between the two plates while talking
const CHAT_MAX = 170;                     // |du| cap (plates never drift more than ~3.7 s off their slot)
const CHAT_TALK = 5.2;                    // seconds of conversation
const CHAT_PERIOD = debugPlates ? 1300 : 2000; // world units of travel between a pair's chats
const CHAT_P = debugPlates ? 1 : 0.6;
/** Hash salts for chats and falls (tuned so the bar's first minute shows both; see QA notes). */
export const lifeSalt = { chat: "c83", fall: "f258" };
/** Approach time for a closing distance (ease in-out; longer glides take a bit longer). */
const chatA = (d: number) => 2.2 + d / 26;
/** Conversations: [leader, follower, leader again]. */
const SCRIPTS: [string, string, string][] = [
  ["q", "dots", "bang"],
  ["heart", "heart", "note"],
  ["fish", "q", "fish"],
  ["note", "note", "heart"],
  ["dots", "q", "dots"],
  ["bang", "sweat", "heart"],
  ["rice", "heart", "note"],
  ["q", "fish", "bang"],
  ["zzz", "bang", "sweat"],
  ["star", "star", "heart"],
];

// --- Falls: a plate rattles, creeps to the rail, tips over it and drops to the floor, where it
// shatters with a little clatter of bouncing shards (the sushi lies there a moment, then it
// is all swept away). Only in hand-checked zones of each room: never in a wall opening, never
// behind page text, never where the belt has no floor under it (street wall, pond pier).
/** Per scene: usable span as fractions of the scene path, fall share, drop to the floor (stage px). */
const FALL_ZONES: Record<string, { from: number; to: number; p: number; drop: number }> = {
  bar: { from: 0.26, to: 0.46, p: 0.08, drop: 190 },
  office: { from: 0.06, to: 0.94, p: 0.05, drop: 88 },
  dining: { from: 0.08, to: 0.92, p: 0.05, drop: 150 },
  kitchen: { from: 0.56, to: 0.9, p: 0.05, drop: 140 },
  storage: { from: 0.12, to: 0.62, p: 0.05, drop: 70 },
};
const FALL_SCALE = debugPlates ? 3 : 1;
const WOB = 1.3, SLIDE = 0.9, TIP = 0.32, GRAV = 1500, SHARDS = 3.2;

interface FallInfo { J: number; drop: number; side: number }

/** Where (global J) plate `id` starts to rattle loose, or null if it rides to the koi.
 * Never two plates in a row (their shards would land in one heap). */
function fallInfo(id: number): FallInfo | null {
  const f = fallRaw(id);
  return f && !fallRaw(id - 1) && !fallRaw(id - 2) ? f : null;
}
function fallRaw(id: number): FallInfo | null {
  if (!chain.ready || !slotOccupied(id)) return null;
  let r = hash01(id, lifeSalt.fall);
  for (const l of chain.links) {
    const z = FALL_ZONES[l.id];
    if (!z) continue;
    const p = Math.min(0.3, z.p * FALL_SCALE);
    if (r < p) {
      const f = z.from + (z.to - z.from) * (r / p);
      return { J: l.off + f * l.U, drop: z.drop, side: hash(id, "side") & 1 ? 1 : -1 };
    }
    r -= p;
  }
  return null;
}

/** Global J at which plate `id` starts to wobble off, or null if it rides to the koi. */
export function fallAt(id: number): number | null {
  return fallInfo(id)?.J ?? null;
}

function falls(id: number): boolean {
  return fallInfo(id) !== null;
}

/** Previous / next occupied slot within 2 (ids grow toward the back of the belt). */
function behind(a: number): number | null {
  if (slotOccupied(a + 1)) return a + 1;
  if (slotOccupied(a + 2)) return a + 2;
  return null;
}
function ahead(a: number): number | null {
  if (slotOccupied(a - 1)) return a - 1;
  if (slotOccupied(a - 2)) return a - 2;
  return null;
}
/** Would leader `a` chat with the plate behind it (ignoring overlaps)? */
function chatRaw(a: number): boolean {
  if (!slotOccupied(a)) return false;
  const b = behind(a);
  return b !== null && hash01(a, lifeSalt.chat) < CHAT_P && !falls(a) && !falls(b);
}
/** Leader `a` chats with behind(a); a plate is never in two pairs. */
function chatPair(a: number): boolean {
  if (!chatRaw(a)) return false;
  const p = ahead(a);
  return !(p !== null && behind(p) === a && chatRaw(p));
}

export interface PlateLife {
  /** Along-belt offset in world units (chat approach, or stopping once off the belt). */
  du: number;
  /** Sideways offset in belt half-widths (1 = centre over the rail); sign = side. */
  off: number;
  /** Screen px (unscaled) the plate has dropped below the belt. */
  drop: number;
  rot: number;
  bubble: string | null;
  /** 0..1 while lying in shards. */
  shatter: number;
  falling: boolean;
  /** Fell off earlier in its journey, or a visitor took it: not drawn any more. */
  gone: boolean;
  /** Pixel hop (talking plates bob). */
  hop?: number;
}

const ease = (t: number) => ss(t);
const easeIn = (t: number) => { const x = clamp01(t); return x * x; };

/** Everything a plate is doing right now. Pure function of the global id and time. */
export function plateBehaviour(id: number, now: number): PlateLife {
  const life: PlateLife = { du: 0, off: 0, drop: 0, rot: 0, bubble: null, shatter: 0, falling: false, gone: false };
  if (taken.has(id)) { life.gone = true; return life; }
  const J = globalU(id, now);
  const fi = falls(id) ? fallInfo(id) : null;
  if (fi && J >= fi.J) {
    const t = (J - fi.J) / V;
    const side = fi.side;
    life.falling = true;
    if (t < WOB) {
      // Rattle: quick shivers in bursts, a one-pixel hop now and then.
      const env = Math.min(1, t / 0.3) * (0.6 + 0.4 * Math.abs(Math.sin(t * 4.1)));
      life.rot = 0.1 * Math.sin(t * 19) * env;
      life.hop = Math.sin(t * 23) > 0.7 ? 1 : 0;
      life.off = side * 0.08 * easeIn(t / WOB);
    } else if (t < WOB + SLIDE) {
      // Creeps to the rail, accelerating.
      const e = easeIn((t - WOB) / SLIDE);
      life.off = side * (0.08 + 0.92 * e);
      life.rot = side * 0.06 * e + 0.04 * Math.sin(t * 13) * (1 - e);
    } else if (t < WOB + SLIDE + TIP) {
      // Tips over the rail: centre passes the rail, the plate leans out.
      const e = ease((t - WOB - SLIDE) / TIP);
      life.off = side * (1 + 0.55 * e);
      life.rot = side * (0.06 + 0.5 * e);
      life.drop = -2 * Math.sin(e * Math.PI);
    } else {
      // Off the belt: keeps its momentum along and outward while gravity takes it.
      const td = t - WOB - SLIDE - TIP;
      const tLand = Math.sqrt((2 * fi.drop) / GRAV);
      const tf = Math.min(td, tLand);
      life.du = -(td - tf) * V; // stops travelling once it lands
      life.off = side * (1.55 + 1.6 * tf);
      life.drop = 0.5 * GRAV * tf * tf;
      life.rot = side * (0.56 + tf * 7.5);
      if (td >= tLand) {
        life.shatter = Math.min(1, (td - tLand) / SHARDS);
        if (td - tLand >= SHARDS) { life.gone = true; life.shatter = 1; }
      }
    }
    return life;
  }
  // Chats: as leader of pair (id, behind(id)) or follower of (ahead(id), id).
  const roles: [number, boolean][] = [[id, true]];
  const p = ahead(id);
  if (p !== null && behind(p) === id) roles.push([p, false]);
  for (const [a, lead] of roles) {
    if (!chatPair(a)) continue;
    const b = behind(a)!;
    const dist = Math.min(CHAT_MAX, (b - a) * PLATE_GAP - CHAT_NEAR);
    const A = chatA(dist);
    const T = A * 2 + CHAT_TALK;
    const ja = globalU(a, now);
    const tc = mod(ja - hash01(a, lifeSalt.chat + "off") * CHAT_PERIOD, CHAT_PERIOD) / V;
    if (tc >= T) continue;
    const moverIsLeader = (hash(a, "mover") & 1) === 1;
    const e = tc < A ? ease(tc / A) : tc < A + CHAT_TALK ? 1 : 1 - ease((tc - A - CHAT_TALK) / A);
    if (lead === moverIsLeader) life.du = (lead ? -1 : 1) * dist * e;
    const tt = tc - A;
    const sc = SCRIPTS[hash(a, "script") % SCRIPTS.length];
    // Leader speaks, follower answers, leader reacts.
    let g: string | null = null;
    if (lead) {
      if (tt > 0.15 && tt < 1.9) g = sc[0];
      else if (tt > 3.5 && tt < CHAT_TALK - 0.1) g = sc[2];
    } else if (tt > 1.8 && tt < 3.6) g = sc[1];
    if (g) {
      life.bubble = g;
      // Bob while speaking: one pixel, twice a second.
      life.hop = (Math.floor(tt * 4) & 1) === 0 ? 1 : 0;
    }
  }
  return life;
}

// ---------------------------------------------------------------------------------------
// Tread.
//
// The tread is rasterised as PIXEL ART: the vector shapes (shadow, body, slat seams, rails) are
// drawn into a small offscreen buffer at 1 cell = TPX stage px, every cell is snapped to the
// nearest colour of a tiny palette (no anti-aliasing, no in-between tones), and the buffer is
// blitted back with nearest-neighbour scaling. Cells sit on a grid anchored at stage (0, 0),
// so paths that meet at a join share one grid and never shimmer against each other. Under a
// transition camera the cells scale with the art like any other pixel.

/** Tread pixel size in stage px. */
const TPX = 3;

const TREAD = "#2b2723";
const TREAD_HI = "#4a433b";
const TREAD_LO = "#1f1c19";
const RAIL = "#c9814a";
const RAIL_HI = "#e8a766";
const RAIL_DARK = "#6d3f22";
const GAPC = "#0e0c0b";
// Marker colours for the translucent parts (drawn opaque offscreen, output translucent).
const M_SHADOW = "#ff00ff";
const M_SEAM = "#00ffff";

type Pal = [number, number, number, number, number, number, number][]; // marker rgb -> out rgba (a 0..255)
function palEntry(marker: string, out: string, a = 255): Pal[number] {
  const m = parseInt(marker.slice(1), 16), o = parseInt(out.slice(1), 16);
  return [(m >> 16) & 255, (m >> 8) & 255, m & 255, (o >> 16) & 255, (o >> 8) & 255, o & 255, a];
}
const PAL: Pal = [
  palEntry(M_SHADOW, "#000000", 92),
  palEntry(M_SEAM, "#000000", 128),
  ...[TREAD, TREAD_HI, TREAD_LO, RAIL, RAIL_HI, RAIL_DARK, GAPC].map((c) => palEntry(c, c)),
];

function poly(g: CanvasRenderingContext2D, pts: [number, number][]) {
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
}

let buf: HTMLCanvasElement | null = null;
let bufG: CanvasRenderingContext2D | null = null;
function buffer(w: number, h: number): CanvasRenderingContext2D {
  if (!buf) {
    buf = document.createElement("canvas");
    bufG = buf.getContext("2d", { willReadFrequently: true })!;
  }
  if (buf.width < w || buf.height < h) {
    buf.width = Math.max(buf.width, w); buf.height = Math.max(buf.height, h);
  }
  return bufG!;
}

/** Snap every cell of the buffer region to the nearest palette colour (alpha < 50%: empty). */
const qMemo = new Map<number, number>();
const PAL32 = new Uint32Array(PAL.map((e) => ((e[6] << 24) | (e[5] << 16) | (e[4] << 8) | e[3]) >>> 0));
function quantize(bg: CanvasRenderingContext2D, w: number, h: number) {
  const img = bg.getImageData(0, 0, w, h);
  const d32 = new Uint32Array(img.data.buffer); // little-endian: 0xAABBGGRR
  let last = -1, lastOut = 0;
  for (let i = 0; i < d32.length; i++) {
    const v = d32[i];
    if (v >>> 24 < 128) { d32[i] = 0; continue; }
    const rgb = v & 0xffffff;
    if (rgb === last) { d32[i] = lastOut; continue; }
    let k = qMemo.get(rgb);
    if (k === undefined) {
      const r = rgb & 255, gg = (rgb >> 8) & 255, b = (rgb >> 16) & 255;
      let best = 1e9;
      k = 0;
      for (let j = 0; j < PAL.length; j++) {
        const e = PAL[j];
        const dr = r - e[0], dg = gg - e[1], db = b - e[2];
        const dist = dr * dr * 3 + dg * dg * 4 + db * db * 2;
        if (dist < best) { best = dist; k = j; }
      }
      if (qMemo.size > 20000) qMemo.clear();
      qMemo.set(rgb, k);
    }
    last = rgb; lastOut = PAL32[k];
    d32[i] = lastOut;
  }
  bg.putImageData(img, 0, 0);
}

/**
 * Tread as a kaiten/baggage-carousel slat chain: every SLAT world units a crescent slat
 * overlaps the next. Seams are perpendicular to the path and bow forward; on curves the
 * outside fans open (a dark gap wedge grows with curvature), the inside stays tight.
 * Line weights are in cells (1 cell = TPX stage px) so seams are always whole pixels.
 */
function drawSlats(g: CanvasRenderingContext2D, path: BeltPath, now: number, w: number, full: boolean, x0: number, y0: number, x1: number, y1: number) {
  const { U } = bake(path);
  const off = mod(now * V + (path.phase ?? 0), SLAT);
  const K = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  const pad = w * 1.2;
  for (let u = off; u < U; u += SLAT) {
    const p = pointAt(path, u);
    if (p.x < x0 - pad || p.x > x1 + pad || p.y < y0 - pad || p.y > y1 + pad) continue;
    const hw = (w * p.s) / 2 - 2;
    if (hw < 2) continue;
    // Curvature (radians per screen px) from the heading change across +-5 world units.
    const pa = pointAt(path, u - 5), pb = pointAt(path, u + 5);
    let da = pb.a - pa.a;
    if (da > Math.PI) da -= Math.PI * 2; else if (da < -Math.PI) da += Math.PI * 2;
    const kap = da / (10 * p.s);
    const bowW = (hw * 0.3) / p.s; // crescent bow in world units
    const front: [number, number][] = [], back: [number, number][] = [], lip: [number, number][] = [], lip2: [number, number][] = [];
    for (const k of K) {
      const q = pointAt(path, u - bowW * k * k);
      const lx = q.x + q.nx * k * hw, ly = q.y + q.ny * k * hw;
      // Spacing at this lateral offset vs the centre line is (1 + kap * offset): > 1 outside a turn.
      const spread = Math.max(0, -kap * k * hw) * SLAT * q.s;
      const th = (full ? TPX * 1.05 : TPX * 1.0) + spread * 0.85;
      const tx = Math.cos(q.a), ty = Math.sin(q.a);
      front.push([lx, ly]);
      back.push([lx - tx * th, ly - ty * th]);
      lip.push([lx - tx * th, ly - ty * th]);
      lip2.push([lx - tx * (th + TPX * 1.05), ly - ty * (th + TPX * 1.05)]);
    }
    g.fillStyle = full ? GAPC : M_SEAM;
    g.beginPath();
    poly(g, front);
    for (let i = back.length - 1; i >= 0; i--) g.lineTo(back[i][0], back[i][1]);
    g.closePath();
    g.fill();
    if (full) {
      // Lit lip of the slat that overlaps from behind (one cell).
      g.fillStyle = TREAD_HI;
      g.beginPath();
      poly(g, lip);
      for (let i = lip2.length - 1; i >= 0; i--) g.lineTo(lip2[i][0], lip2[i][1]);
      g.closePath();
      g.fill();
    }
  }
}

/** Visible rectangle of the target canvas in the current user space, snapped to the tread grid. */
function visibleRect(g: CanvasRenderingContext2D, bb: [number, number, number, number]): [number, number, number, number] | null {
  const T = g.getTransform();
  const inv = T.inverse();
  const W = g.canvas.width, H = g.canvas.height;
  let vx0 = Infinity, vy0 = Infinity, vx1 = -Infinity, vy1 = -Infinity;
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) {
    const x = inv.a * cx + inv.c * cy + inv.e, y = inv.b * cx + inv.d * cy + inv.f;
    vx0 = Math.min(vx0, x); vy0 = Math.min(vy0, y); vx1 = Math.max(vx1, x); vy1 = Math.max(vy1, y);
  }
  const x0 = Math.floor(Math.max(bb[0], vx0 - TPX) / TPX) * TPX;
  const y0 = Math.floor(Math.max(bb[1], vy0 - TPX) / TPX) * TPX;
  const x1 = Math.ceil(Math.min(bb[2], vx1 + TPX) / TPX) * TPX;
  const y1 = Math.ceil(Math.min(bb[3], vy1 + TPX) / TPX) * TPX;
  if (x1 <= x0 || y1 <= y0) return null;
  // Guard against absurd zoom-outs: never allocate more than ~2 M cells.
  if (((x1 - x0) / TPX) * ((y1 - y0) / TPX) > 2e6) return null;
  return [x0, y0, x1, y1];
}

function bbox(path: BeltPath): [number, number, number, number] {
  const b = bake(path) as Baked & { bb?: [number, number, number, number] };
  if (b.bb) return b.bb;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  b.samples.forEach((q, i) => {
    for (const [x, y] of [b.L[i], b.R[i]]) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y + 9 * q.s);
    }
  });
  const pad = 8;
  return (b.bb = [x0 - pad, y0 - pad, x1 + pad, y1 + pad]);
}

export function drawTread(g: CanvasRenderingContext2D, path: BeltPath, now: number) {
  const style = path.style ?? "full";
  if (style === "none") return;
  const r = visibleRect(g, bbox(path));
  if (!r) return;
  const [x0, y0, x1, y1] = r;
  const cw = (x1 - x0) / TPX, ch = (y1 - y0) / TPX;
  const bg = buffer(cw, ch);
  bg.setTransform(1, 0, 0, 1, 0, 0);
  bg.clearRect(0, 0, cw, ch);
  bg.setTransform(1 / TPX, 0, 0, 1 / TPX, -x0 / TPX, -y0 / TPX);
  const { samples, L, R } = bake(path);
  const w = path.width ?? 64;
  const full = style === "full";
  if (full) {
    // Shadow, body.
    bg.fillStyle = M_SHADOW;
    bg.beginPath();
    L.forEach(([x, y], i) => (i ? bg.lineTo(x, y + 9 * samples[i].s) : bg.moveTo(x, y + 9 * samples[i].s)));
    for (let i = R.length - 1; i >= 0; i--) bg.lineTo(R[i][0], R[i][1] + 9 * samples[i].s);
    bg.closePath(); bg.fill();
    bg.fillStyle = TREAD;
    bg.beginPath();
    poly(bg, L);
    for (let i = R.length - 1; i >= 0; i--) bg.lineTo(R[i][0], R[i][1]);
    bg.closePath(); bg.fill();
  }
  drawSlats(bg, path, now, w, full, x0, y0, x1, y1);
  if (full) {
    // Rails: dark outline 3 cells, copper core, a one-cell highlight on the top edge; an
    // inner shade line where the tread dips under the rail.
    bg.lineJoin = "round";
    bg.lineCap = "butt";
    const inner = (side: 1 | -1, k: number) => samples.map((q) => [q.x + q.nx * side * ((w * q.s) / 2 - k), q.y + q.ny * side * ((w * q.s) / 2 - k)] as [number, number]);
    for (const side of [-1, 1] as const) {
      bg.strokeStyle = TREAD_LO; bg.lineWidth = TPX * 1.05;
      bg.beginPath(); poly(bg, inner(side, TPX * 1.5)); bg.stroke();
    }
    for (const [pts, col, lw] of [[L, RAIL_DARK, TPX * 3.05], [R, RAIL_DARK, TPX * 3.05], [L, RAIL, TPX * 1.3], [R, RAIL, TPX * 1.3]] as const) {
      bg.strokeStyle = col; bg.lineWidth = lw;
      bg.beginPath(); poly(bg, pts); bg.stroke();
    }
  }
  quantize(bg, cw, ch);
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.drawImage(buf!, 0, 0, cw, ch, x0, y0, x1 - x0, y1 - y0);
  g.imageSmoothingEnabled = prev;
}

// ---------------------------------------------------------------------------------------
// Plates on a path.

/**
 * Plate as drawn by this module: `hop` lifts it by whole pixels, `floor` is the ground line under
 * a falling plate, `legGrow` (0..1) pops walking legs out, `stand` draws the legs at rest.
 */
export type BPlate = Plate & { hop?: number; floor?: number; legGrow?: number; stand?: boolean };

/** Where slot `id` sits on a path right now (ignores chat slides), or null when it is off the path. */
export function slotPoint(path: BeltPath, id: number, now: number, phase = path.phase ?? 0) {
  const U = pathLength(path);
  let u = now * V + phase - id * PLATE_GAP;
  if (path.closed) u = mod(u, U);
  else if (u < 0 || u > U) return null;
  return pointAt(path, u);
}

/**
 * Every plate currently on the path, with global ids and their life applied (chat slides,
 * falls). `phase` overrides path.phase. The third argument used to be a per-scene key; a
 * string is still accepted there and ignored. Taken plates (see `taken`) are skipped.
 */
export function platesOn(path: BeltPath, now: number, phase?: number | string): Plate[] {
  const { U } = bake(path);
  const ph = typeof phase === "number" ? phase : path.phase ?? 0;
  probe?.(path, ph);
  const head = now * V + ph;
  const out: BPlate[] = [];
  const fi = path.fadeIn ?? 40, fo = path.fadeOut ?? 40;
  const w = path.width ?? 64;
  const M = PLATE_GAP * 2;
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
    let x = p.x, y = p.y, rot = life.rot, floor: number | undefined;
    if (life.falling) {
      // Outward = the screen-down side of the belt (toward the viewer); on a vertical belt, right.
      const sd = Math.abs(p.ny) > 0.3 ? Math.sign(p.ny) : Math.sign(p.nx) || 1;
      const ox = p.nx * sd, oy = p.ny * sd;
      const d = Math.abs(life.off) * (w / 2) * p.s;
      x += ox * d; y += oy * d;
      // Lean/spin toward the outward side, or with the travel direction when falling straight down.
      const rs = Math.abs(ox) > 0.25 ? Math.sign(ox) : Math.sign(Math.cos(p.a)) || 1;
      rot *= rs;
      floor = Math.round(y + (fallInfo(id)?.drop ?? 0));
      y += life.drop;
    }
    out.push({
      x, y, s: p.s, angle: p.a, alpha, id,
      item: itemFor(id), rim: rimFor(id), key: `p:${id}`,
      rot: rot || undefined, bubble: life.bubble ?? undefined,
      shatter: life.shatter || undefined, falling: life.falling || undefined,
      hop: life.hop || undefined, floor,
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

// Speech-bubble glyphs, 5x5 (1 = glyph colour, 2 = second colour).
const GLYPH: Record<string, string[]> = {
  dots: ["00000", "00000", "10101", "00000", "00000"],
  bang: ["00100", "00100", "00100", "00000", "00100"],
  heart: ["01010", "11111", "11111", "01110", "00100"],
  fish: ["00000", "10110", "11111", "10110", "00000"],
  q: ["01110", "10001", "00110", "00000", "00100"],
  note: ["00110", "00101", "00100", "01100", "01100"],
  sweat: ["00100", "00100", "01110", "01110", "00100"],
  rice: ["00100", "01010", "10001", "12221", "11111"],
  zzz: ["11100", "00100", "01000", "11111", "00000"],
  star: ["00100", "01110", "11111", "01110", "01010"],
};
const GLYPH_COL: Record<string, string> = {
  heart: "#d8434a", fish: "#3a6fc4", bang: "#c8483f", note: "#2b2723", dots: "#2b2723", q: "#2b2723",
  sweat: "#4a8fd8", rice: "#2b2723", zzz: "#5a6f9c", star: "#e0a82e",
};
const OUTLINE = "#1c1511";
const PAPER = "#fbf6ea";

/** Pixel speech bubble above a plate: 9x7 units, 1-unit outline with cut corners, tail toward the plate. */
function drawBubble(g: CanvasRenderingContext2D, x: number, y: number, d: number, glyph: string) {
  const u = Math.max(2, Math.round(d / 17)); // pixel unit
  const bw = 9 * u, bh = 7 * u;
  const bx = Math.round(x - bw / 2 + d * 0.26), by = Math.round(y - bh - 3 * u);
  g.fillStyle = OUTLINE;
  g.fillRect(bx - u, by, bw + 2 * u, bh);
  g.fillRect(bx, by - u, bw, bh + 2 * u);
  g.fillStyle = PAPER;
  g.fillRect(bx, by, bw, bh);
  // tail (steps down-left toward the speaker)
  g.fillStyle = OUTLINE;
  g.fillRect(bx + u, by + bh + u, 3 * u, u);
  g.fillRect(bx, by + bh + 2 * u, 2 * u, u);
  g.fillStyle = PAPER;
  g.fillRect(bx + 2 * u, by + bh, 2 * u, u);
  g.fillRect(bx + u, by + bh + u, u, u);
  // one-unit shade along the bottom inside edge
  g.fillStyle = "#e6dcc6";
  g.fillRect(bx, by + bh - u, bw, u);
  const rows = GLYPH[glyph] ?? GLYPH.dots;
  const c1 = GLYPH_COL[glyph] ?? "#2b2723";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const v = rows[r][c];
    if (v === "0") continue;
    g.fillStyle = v === "2" ? "#2f4a33" : c1;
    g.fillRect(bx + (2 + c) * u, by + (1 + r) * u, u, u);
  }
}

/**
 * A plate that hit the floor: 7 pixel shards scatter and clatter (two or three shrinking
 * bounces each), a puff of dust on impact, the sushi lies on its side; after ~2.6 s
 * everything fades out. `shatter` runs 0..1 over SHARDS seconds.
 */
function drawShards(g: CanvasRenderingContext2D, pl: BPlate, d: number) {
  const f = pl.shatter ?? 0;
  const t = f * SHARDS;
  const id = pl.id ?? 0;
  const fade = t < SHARDS - 0.6 ? 1 : Math.max(0, (SHARDS - t) / 0.6);
  const u = Math.max(2, Math.round(d / 15));
  const x0 = Math.round(pl.x), y0 = Math.round(pl.y);
  // Dust puff.
  if (t < 0.35) {
    g.globalAlpha = pl.alpha * (1 - t / 0.35) * 0.8;
    g.fillStyle = "#cdbfa6";
    for (let k = 0; k < 6; k++) {
      const an = (k / 6) * Math.PI * 2 + 0.4, r = d * (0.35 + t * 1.6);
      g.fillRect(Math.round(x0 + Math.cos(an) * r - u), Math.round(y0 + Math.sin(an) * r * 0.35 - u - t * 20), u * 2, u * 2);
    }
  }
  g.globalAlpha = pl.alpha * fade;
  // The sushi, knocked onto its side, one small bounce.
  const im = itemImg(pl.item);
  if (im.complete && im.naturalWidth) {
    const sc = Math.min((d * 0.7) / im.naturalWidth, (d * 0.75) / im.naturalHeight);
    const iw = Math.round(im.naturalWidth * sc), ih = Math.round(im.naturalHeight * sc);
    const side = hash(id, "lie") & 1 ? 1 : -1;
    const hop = t < 0.3 ? Math.round(Math.sin((t / 0.3) * Math.PI) * d * 0.25) : 0;
    const ix = x0 + side * Math.round(d * 0.18);
    g.save();
    g.translate(ix, y0 - hop);
    g.rotate(side * (t < 0.3 ? (t / 0.3) * 1.45 : 1.45));
    g.drawImage(im, -(iw >> 1), -(ih >> 1), iw, ih);
    g.restore();
  }
  for (let k = 0; k < 7; k++) {
    const an = (k / 7) * Math.PI * 2 + hash01(id, "sh" + k) * 0.8;
    const sp = d * (0.9 + 1.1 * hash01(id, "sv" + k)); // px/s
    const reach = (sp / 3.5) * (1 - Math.exp(-t * 3.5));
    // Bounces: v0 up, each bounce keeps 40%.
    let v = d * (1.6 + hash01(id, "sz" + k)) * 3, tt = t, h = 0;
    const G = 1400;
    for (let bnc = 0; bnc < 3; bnc++) {
      const T = (2 * v) / G;
      if (tt < T) { h = v * tt - 0.5 * G * tt * tt; break; }
      tt -= T; v *= 0.4;
    }
    const x = Math.round(x0 + Math.cos(an) * reach), y = Math.round(y0 + Math.sin(an) * reach * 0.38 - h);
    const big = k % 3 === 0;
    const sw = (big ? 3 : 2) * u, sh = (big ? 2 : 1) * u;
    g.fillStyle = OUTLINE;
    g.fillRect(x - 1, y - 1, sw + 2, sh + 2);
    g.fillStyle = k % 4 === 1 ? "#96704e" : pl.rim;
    g.fillRect(x, y, sw, sh);
    if (big) { g.fillStyle = "#fffdf6"; g.fillRect(x, y, u, u); g.fillStyle = "#96704e"; g.fillRect(x, y + sh - u, sw, u); }
  }
  g.globalAlpha = 1;
}

/** Two tiny outlined pixel legs under a plate's foot: frame 0/1 of a 2-frame toddle, -1 standing. */
function drawLegs(g: CanvasRenderingContext2D, d: number, legH: number, frame: 0 | 1 | -1, dir: number) {
  const lu = Math.max(2, Math.round(d / 18));
  const foot = Math.round(d * 0.2) + Math.round(d * 0.06) - 1;
  const f = frame === 1 ? 1 : frame === 0 ? -1 : 0;
  for (const [lx, sh] of [[-d * 0.17, f], [d * 0.17, -f]] as const) {
    const X = Math.round(lx) + (legH > lu ? sh * lu : 0);
    const lift = legH > lu && sh > 0 ? lu : 0; // the stepping leg is lifted one unit
    const hgt = legH - lift;
    g.fillStyle = OUTLINE;
    g.fillRect(X - 1, foot, lu + 2, hgt + lu + 1);
    g.fillRect(X - 1 + (dir > 0 ? 0 : -lu), foot + hgt - 1, lu * 2 + 2, lu + 2);
    g.fillStyle = "#f3dcb2";
    g.fillRect(X, foot, lu, hgt + lu - 1);
    g.fillStyle = "#d9a86f"; // little shoe
    g.fillRect(X + (dir > 0 ? 0 : -lu), foot + hgt, lu * 2, lu);
  }
}

export function drawPlates(g: CanvasRenderingContext2D, plates: Plate[], size: number, hidden?: Set<string>) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  const bubbles: [number, number, number, string][] = [];
  for (const pl0 of plates) {
    const pl = pl0 as BPlate;
    if (hidden?.has(pl.key) || pl.alpha <= 0) continue;
    const d = Math.max(6, Math.round(size * pl.s));
    if (pl.shatter) { drawShards(g, pl, d); continue; }
    const x = Math.round(pl.x), y = Math.round(pl.y) - (pl.hop ?? 0);
    g.globalAlpha = pl.alpha;
    // Legs: `legs` 0/1 = walking frame; a fractional lift in `legs`-less rested plates is not used.
    const legFull = Math.max(3, Math.round(d * 0.14));
    const legH = pl.legs !== undefined ? Math.max(1, Math.round(legFull * Math.min(1, pl.legGrow ?? 1))) : 0;
    if (!pl.falling) {
      // Drop shadow on the belt / surface (hard-edged, one ellipse).
      g.fillStyle = "rgba(0,0,0,.28)";
      g.beginPath(); g.ellipse(x + 1, Math.round(pl.y) + Math.round(d * 0.12), Math.round(d * 0.5), Math.round(d * 0.2), 0, 0, Math.PI * 2); g.fill();
    } else if (pl.floor !== undefined && pl.floor > y + 4) {
      // Shadow on the floor, growing as the plate comes down.
      const k = Math.max(0.25, 1 - (pl.floor - y) / 260);
      g.fillStyle = `rgba(0,0,0,${(0.3 * k).toFixed(2)})`;
      g.beginPath(); g.ellipse(x, pl.floor + Math.round(d * 0.12), Math.round(d * 0.45 * k), Math.round(d * 0.16 * k), 0, 0, Math.PI * 2); g.fill();
    }
    g.save();
    g.translate(x, y - legH);
    if (pl.rot) g.rotate(pl.rot);
    if (legH) drawLegs(g, d, legH, pl.stand ? -1 : (pl.legs as 0 | 1), pl.dir ?? 1);
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
    if (pl.bubble) bubbles.push([x, y - legH - Math.round(d * 0.75), d, pl.bubble]);
  }
  // Bubbles last, so no neighbouring plate or item covers them.
  g.globalAlpha = 1;
  for (const [x, y, d, gl] of bubbles) drawBubble(g, x, y, d, gl);
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
