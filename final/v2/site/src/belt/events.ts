import { mulberry32 } from "./rng";

export type RareEvent = "walk-and-cuddle" | "fall-off";

/** At most two dramatic belt events per visit, spaced out, each only when a suitable plate is in view. */
export function createRareEvents(seed: number) {
  const rand = mulberry32(seed);
  const queue: { at: number; ev: RareEvent }[] = [
    { at: 25 + rand() * 50, ev: rand() < 0.5 ? "walk-and-cuddle" : "fall-off" },
  ];
  if (rand() < 0.6) queue.push({ at: queue[0].at + 90 + rand() * 120, ev: queue[0].ev === "fall-off" ? "walk-and-cuddle" : "fall-off" });
  let t = 0;
  return {
    tick(dt: number, view: { candidates: number }): RareEvent[] {
      t += dt;
      if (!queue.length || t < queue[0].at || view.candidates === 0) return [];
      return [queue.shift()!.ev];
    },
  };
}
