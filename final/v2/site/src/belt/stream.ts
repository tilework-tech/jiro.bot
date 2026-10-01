import { hash01 } from "./rng";
import { byCategory, type Category } from "./menu";

export type Slot = {
  rim: "grey" | "blue";
  item: null | { kind: string; category: Category; offset: { x: number; y: number }; effect: number };
};

const FOOD = byCategory("food"), ODD = byCategory("odd"), ALIVE = byCategory("alive");
export const EFFECTS = 25;

/**
 * The ordered plate stream. Slot i's content is a pure function of (seed, i), so a plate never changes once seen.
 * Occupancy uses a two-state chain (stay-filled / stay-empty bias) for a 50% average with natural runs and gaps.
 */
export function createStream(seed: number) {
  const filled: boolean[] = [];
  const occupied = (i: number): boolean => {
    while (filled.length <= i) {
      const k = filled.length;
      const prev = k === 0 ? hash01(seed, 7) < 0.5 : filled[k - 1];
      const r = hash01(seed, k, 1);
      filled.push(prev ? r < 0.6 : r < 0.4);
    }
    return filled[i];
  };
  return {
    slot(i: number): Slot {
      const rim = hash01(seed, i, 2) < 0.5 ? "grey" : "blue";
      if (!occupied(i)) return { rim, item: null };
      const c = hash01(seed, i, 3);
      const list = c < 0.7 ? FOOD : c < 0.9 ? ODD : ALIVE;
      const pick = list[Math.floor(hash01(seed, i, 4) * list.length)];
      const ang = hash01(seed, i, 5) * Math.PI * 2;
      const dist = 1 + hash01(seed, i, 6) * 2;
      return {
        rim,
        item: {
          kind: pick.kind,
          category: pick.category,
          offset: { x: Math.round(Math.cos(ang) * dist * 100) / 100, y: Math.round(Math.sin(ang) * dist * 100) / 100 },
          effect: Math.floor(hash01(seed, i, 8) * EFFECTS),
        },
      };
    },
  };
}
