/** A stop's extent on the page (CSS px). The page may rest anywhere from its top to its bottom minus one screen. */
export type StopSpan = { top: number; bottom: number };

const EPS = 2;
const rest = (s: StopSpan, vh: number) => ({ lo: s.top, hi: Math.max(s.top, s.bottom - vh) });

/**
 * Where a wheel gesture at scroll position y, going in `dir`, should glide to: the next (or previous) scene's resting
 * place, or null when the page can scroll freely inside the current scene (a scene taller than the screen) or when
 * there is no scene further that way.
 */
export function wheelTarget(y: number, dir: 1 | -1, stops: StopSpan[], vh: number): number | null {
  const spans = stops.map((s) => rest(s, vh));
  const inside = spans.find((r) => y > r.lo + EPS && y < r.hi - EPS);
  if (inside) return null;
  if (dir > 0) {
    const cur = spans.find((r) => y >= r.lo - EPS && y <= r.hi + EPS);
    if (cur && y < cur.hi - EPS) return null;
    const next = spans.find((r) => r.lo > y + EPS);
    return next ? next.lo : null;
  }
  const cur = spans.find((r) => y >= r.lo - EPS && y <= r.hi + EPS);
  if (cur && y > cur.lo + EPS) return null;
  const prev = [...spans].reverse().find((r) => r.hi < y - EPS);
  return prev ? prev.hi : null;
}

/**
 * Where a free scroll (touch, keys, scrollbar) that came to rest at y should glide to: nothing if y is a resting
 * place, otherwise the nearest resting place in the direction it was moving (or the nearest one when it was still).
 */
export function glideTarget(y: number, dir: 1 | -1 | 0, stops: StopSpan[], vh: number): number | null {
  const spans = stops.map((s) => rest(s, vh));
  if (spans.some((r) => y >= r.lo - EPS && y <= r.hi + EPS)) return null;
  const after = spans.find((r) => r.lo > y)?.lo;
  const prevSpan = [...spans].reverse().find((r) => r.hi < y);
  const before = prevSpan?.hi;
  // A small overshoot past the end of a scene the visitor was scrolling through settles back onto it.
  if (prevSpan && prevSpan.hi > prevSpan.lo && y - prevSpan.hi < vh * 0.2) return prevSpan.hi;
  if (dir > 0 && after !== undefined) return after;
  if (dir < 0 && before !== undefined) return before;
  if (after === undefined) return before ?? null;
  if (before === undefined) return after;
  return y - before < after - y ? before : after;
}
