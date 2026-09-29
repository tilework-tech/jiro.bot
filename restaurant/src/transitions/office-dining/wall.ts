// Static pixel art for the office → dining cutaway wall (canvas-drawn, 3 px grid).
// Texture space: x = stage x + M (side margins), y = world Y (office stage y, going down).
//   0 .. 1080        office (drawn live by the transition)
//   1080 .. SLAB_B   the office floor cut open: floorboards, a crawl space with joists
//                    (and the ceiling cat), then the dining room's big ceiling beam
//   SLAB_B .. YF     the dining room's back wall; the lift comes out of the beam and drops
//                    straight through a giant paper lantern before bending onto the floor

export const PX = 3;
export const BOARD_B = 1101; // bottom of the office floorboards
export const BEAM_T = 1196; // dining ceiling beam (the plates' item swap hides behind it)
export const BEAM_B = 1272;
export const LANTERN = { x: 150, top: 1288, bot: 1544, w: 222 };
/** The ceiling cat, asleep on the dining ceiling boards inside the crawl space. */
export const CAT = { x: 318, y: 1136, w: 114, h: 63 }; // sits on the ceiling boards (BEAM_T)

const q = (v: number) => Math.round(v / PX) * PX;
function rect(g: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) {
  g.fillStyle = c;
  g.fillRect(q(x), q(y), q(w), q(h));
}
/** Deterministic hash noise in [0,1). */
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Paint everything that never moves. `M` = side margin, `yf` = dining floor Y, `w` = texture width. */
export function paintWall(g: CanvasRenderingContext2D, M: number, yf: number, w: number) {
  g.imageSmoothingEnabled = false;
  // ---- Office floorboards, cut open (end grain facing us).
  rect(g, "#120a08", 0, 1080, w, 3);
  let x = 0, i = 0;
  while (x < w) {
    const bw = 96 + Math.floor(hash(i) * 5) * 24;
    const tone = ["#6b3d26", "#764430", "#5f3522"][i % 3];
    rect(g, tone, x, 1083, bw, 15);
    rect(g, "#8a5334", x, 1083, bw, 3);
    rect(g, "#3a1f14", x + bw - 3, 1083, 3, 15);
    x += bw; i++;
  }
  rect(g, "#1a0f0a", 0, 1098, w, 3);

  // ---- Crawl space.
  rect(g, "#0f0b0a", 0, BOARD_B, w, BEAM_T - BOARD_B);
  // Faint dusty light bands.
  g.fillStyle = "rgba(255,200,140,.035)";
  for (let k = 0; k < 9; k++) g.fillRect(q(M + k * 230 + 40), BOARD_B, 36, BEAM_T - BOARD_B);
  // A sagging cable.
  g.fillStyle = "#231816";
  for (let xx = 0; xx < w; xx += PX) {
    const f = ((xx - M + 4000) % 700) / 700;
    const yy = BOARD_B + 9 + Math.sin(f * Math.PI) * 18;
    g.fillRect(xx, q(yy), PX, PX);
  }
  // Joists: end grain with rings (skip the lift shaft).
  for (let k = -3; k < 12; k++) {
    const jx = M + 20 + k * 220;
    if (jx > M + 60 && jx < M + 250) continue;
    rect(g, "#1a0f0a", jx - 3, BOARD_B, 48, 57);
    rect(g, "#4a2c1c", jx, BOARD_B, 42, 54);
    rect(g, "#5e3924", jx + 6, BOARD_B + 9, 30, 36);
    rect(g, "#4a2c1c", jx + 12, BOARD_B + 18, 18, 18);
    rect(g, "#6d4429", jx + 18, BOARD_B + 24, 6, 6);
  }
  // Cobweb in a corner of the joist near the cat.
  g.strokeStyle = "rgba(220,215,200,.18)";
  g.lineWidth = 1;
  const cwx = M + 461, cwy = BOARD_B;
  g.beginPath();
  for (let a = 0; a < 5; a++) { g.moveTo(cwx, cwy); g.lineTo(cwx + Math.cos(a * 0.38) * 34, cwy + Math.sin(a * 0.38) * 34); }
  for (const r of [12, 22, 32]) g.arc(cwx, cwy, r, 0, Math.PI / 2 * 0.95);
  g.stroke();
  // A lost chopstick and a mystery tamago on the ceiling boards.
  rect(g, "#c98f55", M + 612, BEAM_T - 6, 72, 3);
  rect(g, "#7a4a2a", M + 612, BEAM_T - 3, 72, 3);
  rect(g, "#f4d35e", M + 1180, BEAM_T - 12, 21, 12);
  rect(g, "#2d4a2a", M + 1189, BEAM_T - 12, 6, 12);

  // Lift shaft through the crawl space: copper guides.
  for (const gx of [M + 150 - 44, M + 150 + 38]) {
    rect(g, "#3a2014", gx - 3, BOARD_B - 18, 12, BEAM_T - BOARD_B + 30);
    rect(g, "#b8703f", gx, BOARD_B - 18, 6, BEAM_T - BOARD_B + 30);
    rect(g, "#e3a26a", gx, BOARD_B - 18, 3, BEAM_T - BOARD_B + 30);
  }

  // ---- Dining back wall: dark vertical planks (matching the service corridor), a post, plaster.
  const wy = BEAM_B, wh = yf - BEAM_B;
  rect(g, "#1d1512", 0, wy, w, wh);
  for (let xx = 0, k = 0; xx < w; xx += 48, k++) {
    rect(g, k % 3 === 1 ? "#211814" : "#1a1310", xx, wy, 45, wh);
    rect(g, "#130e0b", xx + 45, wy, 3, wh);
  }
  // Plaster on the tatami side of the post.
  rect(g, "#2c261c", M + 305, wy + 42, w - M - 305, wh - 84);
  for (let k = 0; k < 40; k++) rect(g, "#322b20", M + 320 + hash(k + 9) * 1500, wy + 60 + hash(k + 99) * (wh - 150), 6, 3);
  // Upper rail (nageshi) and the post (continues the dining pillar at x 245..305).
  rect(g, "#3b2517", 0, wy, w, 42);
  rect(g, "#50321f", 0, wy + 3, w, 6);
  rect(g, "#140c08", 0, wy + 39, w, 3);
  rect(g, "#2e1c12", M + 242, wy, 66, wh);
  rect(g, "#4a2c1b", M + 245, wy, 60, wh);
  rect(g, "#5e3a22", M + 251, wy, 12, wh);
  // Baseboard where the wall meets the floor.
  rect(g, "#140c08", 0, yf - 45, w, 3);
  rect(g, "#2a1a10", 0, yf - 42, w, 42);
  rect(g, "#3a2517", 0, yf - 42, w, 6);

  // Kakejiku scroll: "OMAKASE" in a vertical line (hangs above the counter, far right).
  const sx = M + 1020, sy = wy + 72;
  rect(g, "#140c08", sx - 6, sy - 6, 120, 330);
  rect(g, "#6b4a2e", sx - 3, sy - 3, 114, 324);
  rect(g, "#e7dcc3", sx + 9, sy + 12, 90, 294);
  rect(g, "#3b2517", sx - 12, sy - 9, 132, 9);
  rect(g, "#3b2517", sx - 12, sy + 318, 132, 9);
  g.fillStyle = "#1f1712";
  g.font = "bold 27px Silkscreen, monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  [..."OMAKASE"].forEach((c, k) => g.fillText(c, sx + 54, sy + 36 + k * 39));
  rect(g, "#b3322a", sx + 42, sy + 282, 24, 18); // hanko stamp

  // "STAFF ONLY" plate by the chute.
  const px0 = M + 12, py0 = yf - 150;
  rect(g, "#140c08", px0 - 3, py0 - 3, 54, 84);
  rect(g, "#b8703f", px0, py0, 48, 78);
  g.fillStyle = "#2a160d";
  g.font = "bold 12px Silkscreen, monospace";
  ["STAFF", "ONLY", "↓"].forEach((s, k) => g.fillText(s, px0 + 24, py0 + 15 + k * 24));
}

/** Giant paper lantern the lift drops through: drawn over the belt so plates show as shadows. */
export function lantern(g: CanvasRenderingContext2D, M: number, glowK: number) {
  const { top, bot, w } = LANTERN;
  const cx = M + LANTERN.x;
  const cap = 21;
  g.save();
  g.imageSmoothingEnabled = false;
  // Hanging cord to the beam.
  rect(g, "#140c08", cx - 60, BEAM_B, 3, top - BEAM_B + 3);
  rect(g, "#140c08", cx + 57, BEAM_B, 3, top - BEAM_B + 3);
  // Paper body: barrel shape, one row band per 12 px (ribs).
  const y0 = top + cap, y1 = bot - cap, n = Math.round((y1 - y0) / 12);
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n;
    const bw = w * (0.72 + 0.28 * Math.sin(f * Math.PI));
    const yy = y0 + k * 12;
    const lit = 0.5 + 0.5 * Math.sin(f * Math.PI);
    const r = Math.round(150 + 80 * lit * glowK), gg = Math.round(40 + 60 * lit * glowK), b = Math.round(30 + 26 * lit);
    g.fillStyle = `rgba(${r},${gg},${b},.84)`;
    g.fillRect(q(cx - bw / 2), yy, q(bw), 12);
    g.fillStyle = "rgba(60,14,10,.55)";
    g.fillRect(q(cx - bw / 2), yy + 9, q(bw), 3);
    // Side shading.
    g.fillStyle = "rgba(40,8,6,.35)";
    g.fillRect(q(cx - bw / 2), yy, 9, 12);
    g.fillRect(q(cx + bw / 2) - 9, yy, 9, 12);
  }
  // Caps.
  for (const [yy, cw] of [[top, w * 0.72], [bot - cap, w * 0.72]] as const) {
    rect(g, "#140c08", cx - cw / 2 - 3, yy, cw + 6, cap);
    rect(g, "#2c1d15", cx - cw / 2, yy + 3, cw, cap - 9);
    rect(g, "#c9814a", cx - cw / 2, yy + cap - 6, cw, 3);
  }
  // Brush lettering: J I R O down the front.
  g.fillStyle = "rgba(24,10,8,.92)";
  g.font = "bold 36px Silkscreen, monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  const ly0 = y0 + 26, step = (y1 - y0 - 52) / 3;
  [..."JIRO"].forEach((c, k) => g.fillText(c, cx - 58, ly0 + k * step));
  // Crest on the right: a pixel plate with a salmon nigiri.
  const mx = cx + 58, my = (y0 + y1) / 2;
  g.fillStyle = "rgba(24,10,8,.92)";
  g.beginPath(); g.arc(mx, my, 27, 0, Math.PI * 2); g.fill();
  rect(g, "#f3e6cf", mx - 15, my - 3, 30, 12);
  rect(g, "#f08a5d", mx - 15, my - 9, 30, 9);
  rect(g, "#ffd1b8", mx - 12, my - 9, 9, 3);
  g.restore();
}

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

/** Ceiling cat: breathing (4 s), one ear flick per 24 s, Zzz (6 s); eyes open when poked. */
export function cat(g: CanvasRenderingContext2D, M: number, now: number, awake: boolean) {
  const breath = ((now % 4) + 4) % 4 < 2 ? 0 : 1;
  const flick = ((now % 24) + 24) % 24 < 0.4;
  const spr = catSprite(breath, awake, flick);
  const x = M + CAT.x, y = BEAM_T - spr.height + PX;
  g.save();
  g.imageSmoothingEnabled = false;
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(x + 6, BEAM_T - 3, spr.width - 12, 6);
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
