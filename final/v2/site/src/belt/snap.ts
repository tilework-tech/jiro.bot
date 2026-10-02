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
  const before = [...spans].reverse().find((r) => r.hi < y)?.hi;
  // A nudge less than 15% of the way into the gap settles back; anything further carries on in its direction.
  if (before !== undefined && after !== undefined) {
    const gap = after - before;
    if (dir > 0) return y - before < gap * 0.15 ? before : after;
    if (dir < 0) return after - y < gap * 0.15 ? after : before;
    return y - before < after - y ? before : after;
  }
  return after ?? before ?? null;
}
