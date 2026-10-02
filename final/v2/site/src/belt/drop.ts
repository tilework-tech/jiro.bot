import type { Pt, Rect } from "./route";

export type Surface = Rect & { id: string };
export type Drop = { kind: "placed"; surface: string } | { kind: "return" } | { kind: "koi" } | { kind: "belt" };

const inside = (p: Pt, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** Where a dropped plate goes: back onto the belt where it was put, onto a flat surface, to the koi, or home. */
export function resolveDrop(p: Pt, surfaces: Surface[], water: Surface[], onBelt = false): Drop {
  if (onBelt) return { kind: "belt" };
  const s = surfaces.find((r) => inside(p, r));
  if (s) return { kind: "placed", surface: s.id };
  if (water.some((r) => inside(p, r))) return { kind: "koi" };
  return { kind: "return" };
}
