import { mulberry32 } from "./belt/rng";

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Fireflies drifting over a patch of dark, each on its own slow wander. Every `swarmEvery` seconds (give or take) they
 * gather into a loose cluster that circles for a few seconds, then drift apart again. World units and seconds.
 */
export function createFireflies(o: { area: Rect; n: number; seed: number; swarmEvery: number }) {
  const r = mulberry32(o.seed);
  const { area } = o;
  const flies = Array.from({ length: o.n }, () => ({
    x: area.x + r() * area.w, y: area.y + r() * area.h, vx: 0, vy: 0, ph: r() * Math.PI * 2, sp: 0.6 + r() * 0.8, wx: r() * 10, wy: r() * 10,
  }));
  let t = 0, nextSwarm = o.swarmEvery * (0.6 + r() * 0.5), swarm: null | { cx: number; cy: number; start: number } = null;
  const GATHER = 2.5, CIRCLE = 4, SCATTER = 3;
  return {
    tick(dt: number) {
      t += dt;
      if (!swarm && t >= nextSwarm) swarm = { cx: area.x + area.w * (0.3 + 0.4 * r()), cy: area.y + area.h * (0.3 + 0.4 * r()), start: t };
      const phase = swarm ? t - swarm.start : -1;
      if (swarm && phase > GATHER + CIRCLE + SCATTER) { swarm = null; nextSwarm = t + o.swarmEvery * (0.8 + 0.4 * r()); }
      flies.forEach((f, i) => {
        // a slow wander: a steering target that drifts on two incommensurate sines
        let tx = area.x + area.w * (0.5 + 0.45 * Math.sin(t * 0.11 * f.sp + f.wx)), ty = area.y + area.h * (0.5 + 0.45 * Math.sin(t * 0.13 * f.sp + f.wy));
        let pull = 0.25;
        if (swarm && phase < GATHER + CIRCLE) {
          const a = t * 1.6 + (i / flies.length) * Math.PI * 2;
          tx = swarm.cx + Math.cos(a) * 5; ty = swarm.cy + Math.sin(a) * 3;
          pull = phase < GATHER ? 1.2 : 2.5;
        }
        f.vx += (tx - f.x) * pull * dt - f.vx * 1.2 * dt;
        f.vy += (ty - f.y) * pull * dt - f.vy * 1.2 * dt;
        f.x = Math.min(area.x + area.w, Math.max(area.x, f.x + f.vx * dt));
        f.y = Math.min(area.y + area.h, Math.max(area.y, f.y + f.vy * dt));
      });
    },
    points: () => flies.map((f) => ({ x: f.x, y: f.y, glow: 0.55 + 0.45 * Math.sin(t * 2.2 * f.sp + f.ph) })),
    swarming: () => swarm !== null && t - swarm.start < GATHER + CIRCLE,
  };
}

/** A ripple `age` seconds into a life of `life` seconds, growing to radius `maxR` (world units) and fading out. */
export function rippleAt(age: number, life: number, maxR: number) {
  const k = Math.min(1, Math.max(0, age / life));
  return { r: maxR * (1 - Math.pow(1 - k, 2)), alpha: (1 - k) * (1 - k) };
}
