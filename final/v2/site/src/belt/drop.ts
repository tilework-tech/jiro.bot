import type { Pt, Rect } from "./route";

export type Surface = Rect & { id: string };
export type Drop = { kind: "placed"; surface: string } | { kind: "return" } | { kind: "koi" };

const inside = (p: Pt, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export function resolveDrop(p: Pt, surfaces: Surface[], water: Surface[]): Drop {
  const s = surfaces.find((r) => inside(p, r));
  if (s) return { kind: "placed", surface: s.id };
  if (water.some((r) => inside(p, r))) return { kind: "koi" };
  return { kind: "return" };
}
