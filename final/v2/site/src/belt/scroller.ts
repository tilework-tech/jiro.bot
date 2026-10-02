/** A scene's extent on the page (CSS px). The page may rest anywhere from its top to its bottom minus one screen. */
export type StopSpan = { top: number; bottom: number };
type Range = { lo: number; hi: number };
export type ScrollKey = "next" | "prev" | "home" | "end";

/** Input (CSS px) that carries a whole ride from one scene to the next, before resistance. */
const WHEEL_RIDE = 650;
const DRAG_RIDE = 420;
/** A push this far into the band commits to the next scene; anything less springs back. */
const COMMIT = 0.07;
/** Input quiet for this long ends a gesture. */
const QUIET = 160;
/** After a commit, wheel momentum is ignored for this long, each further event extending it, up to the cap. */
const LOCK = 450, LOCK_STEP = 140, LOCK_MAX = 1400;
/** Exponential approach rates (per second) while input is arriving and while settling. */
const RATE_INPUT = 6, RATE_SETTLE = 2.6;

/**
 * Demo1's scrolling over a page of scenes and the bands between them. Input moves a target: freely inside a scene
 * taller than the screen, and with resistance through a band. Once a gesture ends, a push past COMMIT carries on to the
 * next scene and anything less springs back, so the page only ever rests on a scene and moves at most one scene per
 * gesture. The shown position eases toward the target every frame.
 */
export function createScroller(o: { spans: () => StopSpan[]; vh: () => number; reduced: boolean }) {
  const ranges = (): Range[] => o.spans().map((s) => ({ lo: s.top, hi: Math.max(s.top, s.bottom - o.vh()) }));
  let cur = 0, target = 0, landed = 0, last = NaN;
  let lastInput: number | null = null;
  let held = false;
  let lockUntil = 0, lockMax = 0;
  let offset = 0; // where in the landed scene the page rests, from its top

  /** The band on one side of the landed scene: its near edge, far edge, and the scene beyond (if any). */
  const band = (R: Range[], side: 1 | -1) => {
    const r = R[landed], n = R[landed + side];
    return { edge: side > 0 ? r.hi : r.lo, far: n ? (side > 0 ? n.lo : n.hi) : NaN, next: n };
  };

  function push(dy: number, now: number, ride: number) {
    const R = ranges();
    const r = R[landed];
    if (!r) return;
    let t = target, left = dy;
    if (t >= r.lo && t <= r.hi) {
      const take = left > 0 ? Math.min(left, r.hi - t) : Math.max(left, r.lo - t);
      t += take;
      left -= take;
    }
    if (left !== 0) {
      const side: 1 | -1 = t > r.hi || (t === r.hi && left > 0) ? 1 : -1;
      const b = band(R, side);
      if (b.next) {
        let f = (t - b.edge) / (b.far - b.edge);
        f += (left * side / ride) * (0.55 + Math.min(f, 1 - f));
        t = b.edge + Math.min(1, Math.max(0, f)) * (b.far - b.edge);
      }
    }
    target = t;
    lastInput = now;
  }

  /** The gesture is over: commit to the neighbouring scene or spring back to this one. */
  function commit(now: number) {
    lastInput = null;
    const R = ranges();
    const r = R[landed];
    if (!r || (target >= r.lo && target <= r.hi)) return;
    const side: 1 | -1 = target > r.hi ? 1 : -1;
    const b = band(R, side);
    if (b.next && (target - b.edge) / (b.far - b.edge) > COMMIT) {
      landed += side;
      target = b.far;
      lockUntil = now + LOCK;
      lockMax = now + LOCK_MAX;
    } else target = b.edge;
  }

  const inside = (y: number) => ranges().findIndex((r) => y >= r.lo - 0.5 && y <= r.hi + 0.5);

  return {
    wheel(dy: number, now: number) {
      if (now < lockUntil) { lockUntil = Math.min(lockMax, now + LOCK_STEP); return; }
      push(dy, now, WHEEL_RIDE);
    },
    drag(dy: number, now: number) { held = true; push(dy, now, DRAG_RIDE); },
    /** The finger lifted: the gesture ends now. */
    release(now: number) { held = false; if (lastInput !== null) lastInput = now - QUIET; },
    key(k: ScrollKey, now: number) {
      const R = ranges();
      const to = k === "home" ? 0 : k === "end" ? R.length - 1 : landed + (k === "next" ? 1 : -1);
      if (!R[to]) return;
      target = k === "end" || (k === "prev" && to < landed) ? R[to].hi : R[to].lo;
      landed = to;
      lastInput = null;
      lockUntil = Math.min(lockUntil, now);
    },
    /** Something else scrolled the page (a link, focus, find-in-page, a script): carry on from there. */
    moved(y: number, now: number) {
      const dir = Math.sign(y - cur);
      cur = target = y;
      lockUntil = 0;
      const at = inside(y);
      if (at >= 0) { landed = at; lastInput = null; return; }
      const R = ranges();
      const after = R.findIndex((r) => r.lo > y);
      if (after < 0) landed = R.length - 1;
      else if (after === 0) landed = 0;
      else if (dir > 0) landed = after - 1;
      else if (dir < 0) landed = after;
      else landed = y - R[after - 1].hi < R[after].lo - y ? after - 1 : after;
      lastInput = now; // settle once this scroll has been quiet for a moment
    },
    /** The layout changed: stay on the same scene, as far from its top as it can still rest. */
    resize() {
      const r = ranges()[landed];
      if (!r) return;
      cur = target = Math.min(r.hi, Math.max(r.lo, r.lo + offset));
      if (!held) lastInput = null;
    },
    tick(now: number) {
      const dt = Number.isNaN(last) ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (lastInput !== null && !held && now - lastInput >= QUIET) commit(now);
      if (o.reduced) cur = target;
      else cur += (target - cur) * (1 - Math.exp(-dt * (lastInput !== null ? RATE_INPUT : RATE_SETTLE)));
      if (Math.abs(target - cur) < 0.5) cur = target;
      const r = ranges()[landed];
      if (r && target >= r.lo && target <= r.hi) offset = target - r.lo;
      return Math.round(cur);
    },
    /** Between scenes: on a ride, or pushed into a band. */
    riding: () => inside(cur) < 0,
    state: () => ({ y: Math.round(cur), target: Math.round(target), riding: inside(cur) < 0, resting: lastInput === null && cur === target && inside(cur) >= 0 }),
  };
}
