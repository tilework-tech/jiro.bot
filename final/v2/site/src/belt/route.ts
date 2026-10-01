import { regionAtY, stopTop, type Region } from "../layout";

export type Pt = { x: number; y: number };
export type Pose = Pt & { heading: number };
export type Rect = { x: number; y: number; w: number; h: number };

type Piece =
  | { kind: "line"; from: Pt; dir: Pt; len: number }
  | { kind: "arc"; c: Pt; r: number; a0: number; sweep: number; len: number };

export type Route = {
  length: number;
  width: number;
  sample(s: number): Pose;
  isHidden(p: Pt): boolean;
  /** True when a square of half-size r around p is entirely covered, so nothing drawn there can show. */
  isBuried(p: Pt, r: number): boolean;
  /** The covering rects themselves: the renderer erases the belt along their edges so it ends in straight lines. */
  hidden: Rect[];
  regionAt(p: Pt): Region;
};

const sub = (a: Pt, b: Pt) => ({ x: a.x - b.x, y: a.y - b.y });
const norm = (a: Pt) => { const l = Math.hypot(a.x, a.y); return { x: a.x / l, y: a.y / l }; };

/** A polyline with every corner rounded by `radius`; corners must be far enough apart for their fillets. */
export function buildRoute(points: Pt[], radius: number, width: number, hidden: Rect[]): Route {
  const pieces: Piece[] = [];
  let cursor = points[0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const d = norm(sub(b, a));
    const next = points[i + 1];
    if (!next) {
      pieces.push({ kind: "line", from: cursor, dir: d, len: Math.hypot(b.x - cursor.x, b.y - cursor.y) });
      break;
    }
    const e = norm(sub(next, b));
    const turn = Math.atan2(d.x * e.y - d.y * e.x, d.x * e.x + d.y * e.y);
    const t = radius * Math.tan(Math.abs(turn) / 2);
    const start = { x: b.x - d.x * t, y: b.y - d.y * t };
    pieces.push({ kind: "line", from: cursor, dir: d, len: Math.hypot(start.x - cursor.x, start.y - cursor.y) });
    const side = Math.sign(turn);
    const c = { x: start.x - d.y * radius * side, y: start.y + d.x * radius * side };
    const a0 = Math.atan2(start.y - c.y, start.x - c.x);
    pieces.push({ kind: "arc", c, r: radius, a0, sweep: turn, len: radius * Math.abs(turn) });
    cursor = { x: b.x + e.x * t, y: b.y + e.y * t };
  }
  const length = pieces.reduce((n, p) => n + p.len, 0);

  function sample(s: number): Pose {
    let rest = Math.min(Math.max(s, 0), length);
    for (const p of pieces) {
      if (rest <= p.len || p === pieces[pieces.length - 1]) {
        if (p.kind === "line") {
          return { x: p.from.x + p.dir.x * rest, y: p.from.y + p.dir.y * rest, heading: Math.atan2(p.dir.y, p.dir.x) };
        }
        const k = Math.min(rest / p.len, 1);
        const ang = p.a0 + p.sweep * k;
        const heading = ang + (Math.sign(p.sweep) * Math.PI) / 2;
        return { x: p.c.x + Math.cos(ang) * p.r, y: p.c.y + Math.sin(ang) * p.r, heading: Math.atan2(Math.sin(heading), Math.cos(heading)) };
      }
      rest -= p.len;
    }
    throw new Error("unreachable");
  }

  const inside = (p: Pt, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  return {
    length,
    width,
    sample,
    isHidden: (p) => hidden.some((r) => inside(p, r)),
    isBuried: (p, r) => [[-r, -r], [r, -r], [-r, r], [r, r]].every(([dx, dy]) => hidden.some((h) => inside({ x: p.x + dx, y: p.y + dy }, h))),
    hidden,
    regionAt: (p) => regionAtY(p.y),
  };
}

/** Belt width (bed plus rails) in world art px. */
export const BELT_W = 21;
export const BEND_R = 32;

/** The belt channel in the dining-room counter, as a fraction of the stop height (measured from the compare art). */
const COMPARE_CHANNEL = { top: 149 / 202, mid: 162.5 / 202, bottom: 176 / 202 };

/**
 * Where the belt is hidden behind scene architecture: the kitchen hatch sill, the timber beam under the hero, and the
 * dining-room walls the belt runs inside before it drops into the counter channel and after it leaves it.
 */
export const HIDDEN: Rect[] = [
  { x: 318, y: -20, w: 80, h: 70 },
  { x: 121, y: 201, w: 55, h: 153 },
  { x: 0, y: stopTop("compare") - 1, w: 44, h: 202 * COMPARE_CHANNEL.top + 1 },
  { x: 300, y: stopTop("compare") + 202 * COMPARE_CHANNEL.bottom, w: 76, h: 202 * (1 - COMPARE_CHANNEL.bottom) + 1 },
];

/** The one belt: hatch → hero diagonal → down behind the crawlspace beam → along the crawlspace floor → down the left edge →
 *  along the comparison room →
 *  down the right edge → across the FAQ floor → down the left edge past the street → across the pond trestle. */
export function routePoints(): Pt[] {
  const L = 22, R = 320;
  const y = (id: Parameters<typeof stopTop>[0], f: number) => stopTop(id) + 202 * f;
  // hero belt measured from the hero art: x = -1.296 y + 407
  const heroX = (yy: number) => -1.296 * yy + 407.02;
  const crawl = stopTop("hero") + 202 + 128;
  return [
    { x: heroX(28), y: 28 },
    { x: heroX(212), y: 212 },
    { x: heroX(212), y: crawl },
    { x: L, y: crawl },
    { x: L, y: y("compare", COMPARE_CHANNEL.mid) },
    { x: R, y: y("compare", COMPARE_CHANNEL.mid) },
    { x: R, y: y("faq", 0.9) },
    { x: L, y: y("faq", 0.9) },
    { x: L, y: y("pond", 0.47) },
    { x: 400, y: y("pond", 0.47) },
  ];
}

export function siteRoute(): Route {
  return buildRoute(routePoints(), BEND_R, BELT_W, HIDDEN);
}
