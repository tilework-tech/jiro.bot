import { hash01 } from "./rng";
import { byCategory, type Category } from "./menu";

export type Slot = {
  /** False for bare belt: no plate, and so nothing on it. */
  plate: boolean;
  rim: "grey" | "blue";
  item: null | { kind: string; category: Category; offset: { x: number; y: number }; effect: number };
};

const FOOD = byCategory("food"), ODD = byCategory("odd"), ALIVE = byCategory("alive");
export const EFFECTS = 25;

/**
 * The ordered plate stream. Slot i's content is a pure function of (seed, i), so a plate never changes once seen.
 * Plates sit on about half of the slots and items on about half of those plates (a quarter of the belt). Both use a
 * two-state chain: plates are biased against long runs so bare belt shows between them, food comes in natural runs.
 */
export function createStream(seed: number) {
  const chain = (salt: number, stay: number, start: number) => {
    const states: boolean[] = [];
    return (i: number): boolean => {
      while (states.length <= i) {
        const k = states.length;
        const prev = k === 0 ? hash01(seed, 7, salt) < 0.5 : states[k - 1];
        const r = hash01(seed, k, salt);
        states.push(prev ? r < stay : r < start);
      }
      return states[i];
    };
  };
  // Plates rarely follow each other for long, so the belt reads spaced out; food on plates may come in runs.
  const hasPlate = chain(1, 0.45, 0.5), filled = chain(9, 0.6, 0.4);
  return {
    slot(i: number): Slot {
      const rim = hash01(seed, i, 2) < 0.5 ? "grey" : "blue";
      if (!hasPlate(i)) return { plate: false, rim, item: null };
      if (!filled(i)) return { plate: true, rim, item: null };
      const c = hash01(seed, i, 3);
      const list = c < 0.7 ? FOOD : c < 0.9 ? ODD : ALIVE;
      const pick = list[Math.floor(hash01(seed, i, 4) * list.length)];
      const ang = hash01(seed, i, 5) * Math.PI * 2;
      const dist = 1 + hash01(seed, i, 6) * 2;
      return {
        plate: true,
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
