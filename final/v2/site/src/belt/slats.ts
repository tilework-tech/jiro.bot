export type SlatRow = { s: number; tileRow: number };

/**
 * One row of the slat tile per `step` of belt arc length. Rows sit at travel-shifted positions, so a slat moves
 * forward by exactly the belt travel (sub-pixel included) instead of hopping a whole row at a time.
 */
export function slatRows(travel: number, step: number, length: number, period: number, from = 0): SlatRow[] {
  const shift = Math.floor(travel / step);
  const phase = travel - shift * step;
  const rows: SlatRow[] = [];
  for (let n = Math.max(0, Math.ceil((from - phase) / step)), s = phase + n * step; s <= length; n++, s = phase + n * step) {
    rows.push({ s, tileRow: (((n - shift) % period) + period) % period });
  }
  return rows;
}
