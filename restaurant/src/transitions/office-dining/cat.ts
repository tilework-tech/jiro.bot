// The ceiling cat: a sleeping orange loaf on the dining ceiling boards inside the crawl space
// between the office floor and the dining room (office → dining transition). 3 px grid.

const PX = 3;

/** Ceiling cat sprite (1 cell = PX): a sleeping orange loaf, procedurally shaded. */
const catCache = new Map<string, HTMLCanvasElement>();
function catSprite(breath: number, awake: boolean, flick: boolean): HTMLCanvasElement {
  const key = `${breath}${awake}${flick}`;
  const hit = catCache.get(key);
  if (hit) return hit;
  const W = 38, H = 21;
  const cell: (string | null)[][] = Array.from({ length: H }, () => Array(W).fill(null));
  const body = (x: number, y: number) => {
    const ry = 6.6 + breath * 0.5;
    const dx = (x - 14) / 13.2, dy = (y - 13.5) / ry;
    return y <= 18 && dx * dx + dy * dy <= 1;
  };
  const head = (x: number, y: number) => {
    const dx = x - 29, dy = (y - 10.5) / 0.9;
    return dx * dx + dy * dy <= 38;
  };
  const ear = (x: number, y: number, cx: number, tip: number) => y >= tip && y <= 6 && Math.abs(x - cx) <= (y - tip) * 0.8;
  const earL = (x: number, y: number) => ear(x, y, 25, flick ? 3 : 2);
  const earR = (x: number, y: number) => ear(x, y, 32, 2);
  const tail = (x: number, y: number) => (y === 17 || y === 18) && x >= 3 && x <= 25;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c: string | null = null;
    if (tail(x, y)) c = x > 22 ? "#f3e6cf" : y === 17 ? "#f0a55a" : "#d8813a";
    else if (head(x, y) || earL(x, y) || earR(x, y)) {
      c = "#e08c42";
      if ((earL(x, y) || earR(x, y)) && !head(x, y) && Math.abs(x - (x < 29 ? 25 : 32)) <= (y - 2) * 0.35) c = "#f2b3a0";
      if (y >= 12 && Math.abs(x - 29.5) <= 3.2) c = "#f3e6cf"; // muzzle
      if (y <= 7 && x >= 27 && x <= 31 && x % 2 === 0) c = "#a95a24"; // forehead stripes
    } else if (body(x, y)) {
      c = y < 10 ? "#f0a55a" : "#d8813a";
      if (y >= 8 && y <= 12 && x % 5 === 1 && x > 3 && x < 24) c = "#a95a24"; // back stripes
    }
    cell[y][x] = c;
  }
  // Face.
  if (awake) { cell[9][26] = cell[9][27] = "#f4e04a"; cell[9][31] = cell[9][32] = "#f4e04a"; cell[10][26] = cell[10][32] = "#140c08"; }
  else { cell[10][26] = cell[10][27] = "#5a2a12"; cell[10][31] = cell[10][32] = "#5a2a12"; }
  cell[12][29] = "#e0706a";
  // Outline: empty cells touching a filled one.
  const out: [number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (cell[y][x]) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => cell[y + b]?.[x + a] && cell[y + b][x + a] !== "#2a130a");
    if (n) out.push([x, y]);
  }
  for (const [x, y] of out) cell[y][x] = "#2a130a";
  const c = document.createElement("canvas");
  c.width = W * PX; c.height = H * PX;
  const g = c.getContext("2d")!;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!cell[y][x]) continue;
    g.fillStyle = cell[y][x]!;
    g.fillRect(x * PX, y * PX, PX, PX);
  }
  catCache.set(key, c);
  return c;
}

/** Ceiling cat standing on `floorY` at x: breathing (4 s), one ear flick per 24 s, Zzz (6 s); eyes open when poked. */
export function cat(g: CanvasRenderingContext2D, x: number, floorY: number, now: number, awake: boolean) {
  const breath = ((now % 4) + 4) % 4 < 2 ? 0 : 1;
  const flick = ((now % 24) + 24) % 24 < 0.4;
  const spr = catSprite(breath, awake, flick);
  const y = floorY - spr.height + PX;
  g.save();
  g.imageSmoothingEnabled = false;
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(x + 6, floorY - 3, spr.width - 12, 6);
  g.drawImage(spr, x, y);
  if (!awake) {
    g.fillStyle = "#e9dcc4";
    g.font = "15px Silkscreen, monospace";
    for (const o of [0, 0.5]) {
      const f = ((((now % 6) + 6) % 6) / 6 + o) % 1;
      g.globalAlpha = Math.sin(f * Math.PI) * 0.7;
      g.fillText("z", x + spr.width - 6 + f * 12, y + 6 - f * 24);
    }
  }
  g.restore();
}
/** Sprite size in stage px. */
export const CAT_W = 38 * PX, CAT_H = 21 * PX;
