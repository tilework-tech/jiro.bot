/** Page layout in world art pixels. The world is 360 art px wide; every stop is a 360x202 scene. */
export const WORLD_W = 360;
export const STOP_H = 202;

export type StopId = "hero" | "product" | "compare" | "table" | "faq" | "price" | "pond";
export type Region = StopId | `band-${number}`;

export const STOPS: StopId[] = ["hero", "product", "compare", "table", "faq", "price", "pond"];
/** Height of the joining band below each stop (none after the pond). */
export const BANDS = [153, 86, 100, 110, 108, 125];

export function stopTop(id: StopId): number {
  let y = 0;
  for (let i = 0; i < STOPS.length; i++) {
    if (STOPS[i] === id) return y;
    y += STOP_H + BANDS[i];
  }
  throw new Error(`unknown stop ${id}`);
}

export const WORLD_H = STOPS.length * STOP_H + BANDS.reduce((a, b) => a + b, 0);

export function regionAtY(y: number): Region {
  let top = 0;
  for (let i = 0; i < STOPS.length; i++) {
    if (y < top + STOP_H) return STOPS[i];
    top += STOP_H;
    if (i < BANDS.length && y < top + BANDS[i]) return `band-${i}`;
    top += BANDS[i] ?? 0;
  }
  return "pond";
}
