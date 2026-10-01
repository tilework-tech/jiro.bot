/**
 * The belt/scroll journey. Belt speed is in world art px per second; scroll is in CSS px.
 * A fresh wheel gesture first surges the belt, then releases the page scroll after HOLD seconds,
 * so the visitor sees the belt react before the scene moves. Follow-up input in the same gesture scrolls at once.
 */
export function createJourney(opts: { restSpeed?: number } = {}) {
  const restSpeed = opts.restSpeed ?? 4;
  const MAX = restSpeed * 4;
  const HOLD = 0.16;
  const IDLE = 0.6;
  let speed = restSpeed;
  let boost = 0;
  let travel = 0;
  let pending = 0;
  let hold = 0;
  let idle = Infinity;
  let sceneDelta = 0;

  return {
    restSpeed,
    wheel(dy: number) {
      if (idle > IDLE && pending === 0) hold = HOLD;
      pending += dy;
      idle = 0;
      boost = Math.min(1, boost + Math.min(Math.abs(dy) / 300, 1));
    },
    tick(dt: number) {
      idle += dt;
      sceneDelta = 0;
      if (hold > 0) hold -= dt;
      else if (pending !== 0) {
        const step = Math.abs(pending) < 0.5 ? pending : pending * Math.min(1, dt * 12);
        sceneDelta = step;
        pending -= step;
      }
      const target = restSpeed + (MAX - restSpeed) * boost;
      speed += (target - speed) * Math.min(1, dt * 18);
      boost = Math.max(0, boost - dt * 1.4);
      speed = Math.min(Math.max(speed, restSpeed * 0.25), MAX);
      travel += speed * dt;
    },
    /** Touch and keyboard scroll natively; only the belt reacts. */
    nudge(dy: number) {
      idle = 0;
      boost = Math.min(1, boost + Math.min(Math.abs(dy) / 300, 1));
    },
    state: () => ({ speed, travel, sceneDelta, pending }),
  };
}
