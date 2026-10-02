import type { Pt } from "./route";

export type Leap = { from: Pt; to: Pt; height: number };

/** The koi along its leap at t ∈ [0, 1]: a straight run from `from` to `to` lifted by a parabola `height` tall. */
export function koiPose(l: Leap, t: number) {
  const x = l.from.x + (l.to.x - l.from.x) * t;
  const y = l.from.y + (l.to.y - l.from.y) * t - 4 * l.height * t * (1 - t);
  const dx = l.to.x - l.from.x, dy = l.to.y - l.from.y - 4 * l.height * (1 - 2 * t);
  // heading: the nose's angle above (negative) or below (positive) the horizontal, whichever way it travels
  const heading = Math.atan2(dy, Math.abs(dx));
  return { x, y, heading };
}

/** When the koi leaps on its own: `first` s after the pond comes into view, then every `every` s while it stays. */
export function createKoiSchedule(o: { reduced: boolean; first: number; every: number }) {
  let wait = o.first;
  return {
    tick(dt: number, inView: boolean) {
      if (o.reduced) return false;
      if (!inView) { wait = Math.max(wait, o.first); return false; }
      wait -= dt;
      if (wait > 0) return false;
      wait = o.every;
      return true;
    },
  };
}
