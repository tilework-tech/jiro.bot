import "./v03.css";
import { CONNECTORS, RECIPES, byId, type Connector, type MoodVersion, type Recipe } from "./data";

// v03 · Assembly line: a side-view pixel sushi factory. Everything mechanical is drawn
// on one canvas in 4-px "units"; text (labels, ticket, manifest, receipt) is DOM on top.

const U = 4;
const W = 1640, H = 700;
const ROLE_RANK: Record<Connector["role"], number> = { rice: 0, fish: 1, nori: 2, garnish: 3, sauce: 4 };
/** Hoppers are grouped by station so every recipe travels strictly left → right. */
const ORDER = [...CONNECTORS].sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role] || CONNECTORS.indexOf(a) - CONNECTORS.indexOf(b));
const INITIALS: Record<string, string> = { github: "GH", gdrive: "GD", postgres: "PG", sentry: "SE", hubspot: "HS", stripe: "ST", linear: "LN", gmail: "GM", jira: "JI", notion: "NO", slack: "SL" };
const initials = (c: Connector) => INITIALS[c.id] ?? c.name.slice(0, 2).toUpperCase();
const short = (c: Connector) => c.name.replace(/^Google /, "");

const HX0 = 9, PITCH = 28;
const hopperCx = (h: number) => HX0 + h * PITCH + 14;
const GATE_Y = 48;
const TRAY_TOP = 78;
const PRESS_X = 337;
const END_X = 350;
const BELT_END = 357;
const TRAY_START = -17; // (TRAY_END - TRAY_START) % 5 === 0 keeps the tread pattern seamless
const TRAY_END = 373;
const HEAD_REST = 40;
const PLATE = { x: 386, y: 110 };

const CU = "#d98a4a", CU_L = "#f0b27a", CU_D = "#8a4f24", CU_DD = "#4a2a14";
const INK = "#0b0a09";

type Kind = "move" | "open" | "fall" | "land" | "close" | "pause" | "press" | "roll" | "print" | "hold" | "clear";
interface Ph { k: Kind; t0: number; t1: number; i?: number; from?: number; to?: number }
interface Plan { ph: Ph[]; dur: number; hoppers: number[] }

function build(r: Recipe): Plan {
  const ph: Ph[] = [];
  let t = 500, x = TRAY_START;
  const add = (k: Kind, d: number, extra: Partial<Ph> = {}) => { ph.push({ k, t0: t, t1: t + d, ...extra }); t += d; };
  const move = (to: number) => { add("move", 380 + (Math.abs(to - x) / 85) * 1000, { from: x, to }); x = to; };
  const hoppers = r.ingredients.map((id) => ORDER.findIndex((c) => c.id === id));
  hoppers.forEach((h, i) => {
    move(hopperCx(h));
    add("open", 380, { i }); add("fall", 620, { i }); add("land", 420, { i }); add("close", 320, { i }); add("pause", 160);
  });
  move(PRESS_X); add("press", 1600); move(END_X); add("roll", 1100); add("print", 1900); add("hold", 3000); add("clear", 900);
  return { ph, dur: t, hoppers };
}

// ---------- tiny colour + pixel helpers ----------
function hex(c: string) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a: string, b: string, t: number) {
  const A = hex(a), B = hex(b);
  return "#" + A.map((v, k) => Math.round(v + (B[k] - v) * t).toString(16).padStart(2, "0")).join("");
}
const lum = (c: string) => { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

let g: CanvasRenderingContext2D;
function R(x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(Math.round(x) * U, Math.round(y) * U, Math.round(w) * U, Math.round(h) * U);
}

// ---------- ingredient art (units; cx integer) ----------
function rice(cx: number, yb: number) {
  const rows = [14, 20, 24, 26, 26, 26, 26, 24, 20];
  const n = rows.length;
  rows.forEach((w, r) => {
    const y = yb - n + r, x = cx - w / 2;
    R(x, y, w, 1, r === n - 1 ? "#c7b89e" : r < 2 ? "#fffaf0" : "#efe6d4");
    for (let k = 1; k < w - 1; k++) if ((k * 7 + r * 5) % 11 === 0 && r < n - 1) R(x + k, y, 1, 1, "#d8cab0");
    R(x, y, 1, 1, r === n - 1 ? "#b3a386" : "#e2d6c0");
    if (r > 1 && r < n - 1) R(x + w - 2, y, 2, 1, "#d8cab0");
  });
}
function fish(cx: number, yTop: number, c: Connector) {
  const base = mix("#f07f55", c.color, 0.38), light = mix(base, "#ffffff", 0.42), dark = mix(base, "#000000", 0.32);
  const rows: [number, number][] = [[22, -1], [28, 0], [30, 0], [30, 0], [28, 1]];
  rows.forEach(([w, o], r) => {
    const x = cx - w / 2 + o, y = yTop + r;
    R(x, y, w, 1, r === 4 ? dark : base);
    if (r < 4) for (let k = 0; k < w; k++) if ((k - r * 2 + 40) % 6 === 0) R(x + k, y, 2, 1, light);
  });
  R(cx - 11, yTop, 4, 1, light);
}
function fishFlat(cx: number, yb: number, c: Connector) {
  const base = mix("#f07f55", c.color, 0.38);
  R(cx - 13, yb - 3, 26, 2, base); R(cx - 12, yb - 1, 24, 1, mix(base, "#000000", 0.32));
  for (let k = 0; k < 26; k += 6) R(cx - 13 + k, yb - 3, 2, 1, mix(base, "#ffffff", 0.42));
}
function noriBand(cx: number, top: number, bottom: number, c: Connector) {
  R(cx - 4, top, 8, bottom - top, "#16211a");
  for (let y = top; y < bottom; y++) if ((y * 3) % 4 === 1) R(cx - 2 + (y % 4), y, 1, 1, "#26382b");
  const edge = mix(c.color, "#16211a", 0.2);
  R(cx - 4, top, 1, bottom - top, edge); R(cx + 3, top, 1, bottom - top, edge);
}
function garnish(cx: number, yb: number, c: Connector) {
  R(cx - 7, yb - 2, 4, 2, "#3d9a5a"); R(cx - 3, yb - 4, 3, 4, "#6fdc8c"); R(cx - 2, yb - 5, 1, 1, "#b8ffcb");
  R(cx + 1, yb - 3, 4, 3, "#4fbf73"); R(cx + 5, yb - 2, 2, 2, "#3d9a5a");
  R(cx - 9, yb - 1, 1, 1, c.color); R(cx + 8, yb - 1, 1, 1, c.color); R(cx + 3, yb - 4, 1, 1, "#f3e6cf"); R(cx - 5, yb - 3, 1, 1, "#f3e6cf");
}
function sauceCol(c: Connector) { return mix("#4a2414", c.color, 0.5); }
function sauce(cx: number, top: number, c: Connector) {
  const col = sauceCol(c), hi = mix(col, "#ffffff", 0.5);
  R(cx - 6, top - 1, 12, 1, col); R(cx - 9, top, 18, 1, col);
  R(cx - 9, top + 1, 2, 3, col); R(cx + 7, top + 1, 1, 2, col); R(cx + 1, top + 1, 2, 5, col); R(cx + 1, top + 6, 1, 1, col);
  R(cx - 4, top + 1, 1, 2, col);
  R(cx - 4, top - 1, 3, 1, hi); R(cx + 1, top + 2, 1, 1, hi);
}
function piece(c: Connector, cx: number, yb: number) {
  switch (c.role) {
    case "rice": rice(cx, yb); break;
    case "fish": fishFlat(cx, yb, c); break;
    case "nori": R(cx - 9, yb - 2, 18, 2, "#16211a"); R(cx - 9, yb - 2, 18, 1, mix(c.color, "#16211a", 0.3)); break;
    case "garnish": garnish(cx, yb, c); break;
    case "sauce": { const col = sauceCol(c); R(cx, yb - 3, 2, 3, col); R(cx - 1, yb - 9, 2, 3, col); R(cx, yb - 15, 2, 3, col); break; }
  }
}
/** Draws (or just measures) the stacked layers on the tray; returns the top y. */
function stack(cx: number, layers: Connector[], bounce: number, draw = true) {
  let top = TRAY_TOP;
  layers.forEach((c, k) => {
    const dy = k === layers.length - 1 ? bounce : 0;
    if (c.role === "rice") { if (draw) rice(cx, top + dy); top -= 9; }
    else if (c.role === "fish") { if (draw) fish(cx, top - 3 + dy, c); top -= 3; }
    else if (c.role === "garnish") { if (draw) garnish(cx, top + dy, c); top -= 3; }
    else if (c.role === "nori") { if (draw) noriBand(cx, top + dy, TRAY_TOP, c); }
    else if (draw) sauce(cx, top + dy, c);
  });
  return top;
}
function heap(c: Connector, cx: number) {
  switch (c.role) {
    case "rice": R(cx - 8, 11, 16, 2, "#efe6d4"); R(cx - 5, 10, 10, 1, "#fffaf0"); R(cx - 2, 9, 4, 1, "#fffaf0"); R(cx - 4, 11, 1, 1, "#d8cab0"); R(cx + 3, 12, 1, 1, "#d8cab0"); break;
    case "fish": { const b = mix("#f07f55", c.color, 0.38); R(cx - 8, 11, 16, 2, b); R(cx - 6, 10, 12, 1, mix(b, "#ffffff", 0.3)); R(cx - 3, 9, 7, 1, b); R(cx - 6, 12, 12, 1, mix(b, "#000000", 0.3)); break; }
    case "nori": R(cx - 9, 10, 18, 3, "#16211a"); R(cx - 9, 11, 18, 1, "#26382b"); R(cx - 7, 9, 14, 1, mix(c.color, "#16211a", 0.3)); break;
    case "garnish": R(cx - 7, 11, 14, 2, "#3d9a5a"); R(cx - 4, 10, 3, 1, "#6fdc8c"); R(cx + 1, 9, 2, 2, "#4fbf73"); R(cx - 6, 10, 1, 1, "#f3e6cf"); R(cx + 5, 10, 1, 1, "#f3e6cf"); break;
    case "sauce": { const s = sauceCol(c); R(cx - 9, 11, 18, 2, s); R(cx - 6, 11, 4, 1, mix(s, "#ffffff", 0.45)); break; }
  }
}

// ---------- static background ----------
function paintBackground(bg: CanvasRenderingContext2D) {
  const keep = g; g = bg;
  R(0, 0, 410, 175, "#0e0b09");
  for (let x = 0; x < 410; x += 34) R(x, 0, 1, 104, "#15100c");
  for (let y = 0; y < 104; y += 2) for (let x = (y / 2) % 2; x < 410; x += 2) if ((x * 13 + y * 7) % 23 === 0) R(x, y, 1, 1, "#18120e");
  // floor
  R(0, 94, 410, 1, "#241a12"); R(0, 95, 410, 80, "#0a0807");
  for (let x = 0; x < 410; x += 6) R(x, 96, 1, 1, "#140f0b");
  // gantry beam + station brackets
  R(4, 7, 314, 2, CU_D); R(4, 7, 314, 1, "#a3622f");
  for (let x = 8; x < 318; x += 14) R(x, 7, 1, 1, CU_L);
  let s = 0;
  while (s < ORDER.length) {
    let e = s; while (e + 1 < ORDER.length && ORDER[e + 1].role === ORDER[s].role) e++;
    const x0 = HX0 + s * PITCH + 3, x1 = HX0 + e * PITCH + 25;
    R(x0, 5, x1 - x0, 1, "#5a3a22"); R(x0, 5, 1, 2, "#5a3a22"); R(x1 - 1, 5, 1, 2, "#5a3a22");
    s = e + 1;
  }
  // press frame
  R(318, 8, 38, 5, CU); R(318, 8, 38, 1, CU_L); R(318, 12, 38, 1, CU_D);
  for (const x of [320, 353]) R(x, 10, 1, 1, "#f5c89a");
  R(321, 13, 3, 69, "#3b2616"); R(322, 13, 1, 69, "#5a3a22");
  R(350, 13, 3, 69, "#3b2616"); R(351, 13, 1, 69, "#5a3a22");
  R(328, 13, 18, 8, CU_D); R(328, 13, 18, 1, CU); R(330, 15, 14, 4, CU_DD);
  // belt frame, rollers, legs
  R(2, 85, 356, 4, CU_D); R(2, 85, 356, 1, CU); R(2, 88, 356, 1, CU_DD);
  for (let x = 6; x < 356; x += 10) R(x, 86, 1, 1, "#f5c89a");
  for (const x of [2, 351]) { R(x, 80, 6, 8, "#3b3530"); R(x + 1, 79, 4, 10, "#3b3530"); R(x + 2, 82, 2, 2, "#8c8378"); }
  for (const x of [24, 110, 196, 282]) { R(x, 89, 3, 5, CU_DD); R(x - 1, 93, 5, 1, CU_D); }
  R(53, 89, 1, 11, "#8c8378"); // ticket hook
  // printer (top right)
  R(362, 3, 46, 11, "#2a2622"); R(362, 3, 46, 1, "#4a433c"); R(362, 13, 46, 1, "#1a1714");
  R(362, 3, 2, 11, CU_D); R(406, 3, 2, 11, CU_D);
  R(366, 12, 38, 1, INK);
  R(384, 0, 2, 3, "#3b3530");
  // plate shelf
  R(362, 114, 46, 2, CU_D); R(362, 114, 46, 1, CU); R(366, 116, 2, 4, CU_DD); R(402, 116, 2, 4, CU_DD);
  g = keep;
}

function drawHopper(h: number, c: Connector, inRecipe: boolean, active: boolean, gateA: number, now: number) {
  const x0 = HX0 + h * PITCH, cx = x0 + 14;
  R(x0 + 5, 9, 1, 3, "#5a3a22"); R(x0 + 22, 9, 1, 3, "#5a3a22");
  heap(c, cx);
  R(x0 + 2, 12, 24, 2, CU_L); R(x0 + 2, 13, 24, 1, CU);
  R(x0 + 3, 14, 22, 21, CU); R(x0 + 3, 14, 2, 21, CU_L); R(x0 + 22, 14, 3, 21, CU_D); R(x0 + 3, 34, 22, 1, CU_D);
  for (const [a, b] of [[5, 16], [21, 16], [5, 32], [21, 32]]) R(x0 + a, b, 1, 1, "#f5c89a");
  // badge
  R(x0 + 8, 15, 12, 11, CU_DD);
  R(x0 + 9, 16, 10, 9, c.color); R(x0 + 9, 16, 10, 1, mix(c.color, "#ffffff", 0.35)); R(x0 + 9, 24, 10, 1, mix(c.color, "#000000", 0.35));
  // name plate
  R(x0 + 4, 27, 20, 6, CU_DD); R(x0 + 4, 32, 20, 1, "#2a180b");
  // funnel
  for (let r = 0; r <= 10; r++) {
    const w = 22 - Math.round((r * 14) / 10) - (Math.round((r * 14) / 10) % 2);
    const x = cx - w / 2, y = 35 + r;
    R(x, y, w, 1, CU); R(x, y, 1, 1, CU_L); R(x + w - 2, y, 2, 1, CU_D);
  }
  R(cx - 4, 46, 8, 2, CU_D); R(cx - 3, 46, 6, 2, CU_DD);
  // lamp
  const blink = active ? 0.75 + 0.25 * Math.sin(now / 90) : 1;
  R(cx - 1, 38, 2, 2, active ? mix("#2c5a3a", "#b8ffcb", blink) : inRecipe ? "#4c9c66" : "#3a2a1e");
  if (active) { g.fillStyle = "rgba(111,220,140,.22)"; g.fillRect((cx - 3) * U, 36 * U, 6 * U, 6 * U); }
  // gate flaps (hinged at the chute walls)
  const ang = gateA * Math.PI * 0.5;
  for (let k = 0; k < 4; k++) {
    R(cx - 4 + Math.round(k * Math.cos(ang)), GATE_Y + Math.round(k * Math.sin(ang)), 1, 1, CU_L);
    R(cx + 3 - Math.round(k * Math.cos(ang)), GATE_Y + Math.round(k * Math.sin(ang)), 1, 1, CU_L);
  }
}

function drawTray(tx: number) {
  R(tx - 18, TRAY_TOP, 36, 2, "#b07a47"); R(tx - 18, TRAY_TOP, 36, 1, "#cf9a62"); R(tx - 18, TRAY_TOP + 2, 36, 1, "#7a4f2a");
  R(tx - 15, TRAY_TOP + 3, 4, 1, "#4a2f18"); R(tx + 11, TRAY_TOP + 3, 4, 1, "#4a2f18");
}

function drawPress(headBottom: number, glow: boolean) {
  const top = headBottom - 8;
  R(335, 21, 4, top - 21, "#9a9187"); R(335, 21, 1, top - 21, "#c9c0b4");
  R(324, top, 26, 7, CU); R(324, top, 26, 1, CU_L); R(348, top, 2, 7, CU_D);
  R(325, top + 7, 24, 1, CU_L);
  R(335, top + 2, 4, 3, glow ? "#b8ffcb" : "#2c5a3a");
}

function drawPlate() {
  const y = PLATE.y;
  R(370, y, 32, 1, "#fbf5ea"); R(368, y + 1, 36, 1, "#e9e1d2"); R(369, y + 2, 34, 1, "#b9ae9c"); R(373, y + 3, 26, 1, "#8f8474");
  R(376, y, 20, 1, "#6fdc8c");
}

// ---------- the version ----------
export const v03: MoodVersion = {
  n: 3,
  title: "Assembly line",
  pitch: "A copper sushi factory: the Slack ticket clips on, the right MCP hoppers drop their ingredient, the press stamps, and a finished dish rolls off with its receipt.",
  mount(el, ctx) {
    const root = document.createElement("div");
    root.className = "mv03";
    el.appendChild(root);

    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H; cv.className = "mv03-cv";
    root.appendChild(cv);
    g = cv.getContext("2d")!;
    const bgc = document.createElement("canvas");
    bgc.width = W; bgc.height = H;
    paintBackground(bgc.getContext("2d")!);

    // station labels + hopper labels
    const layer = document.createElement("div");
    layer.className = "mv03-layer";
    root.appendChild(layer);
    let s = 0;
    while (s < ORDER.length) {
      let e = s; while (e + 1 < ORDER.length && ORDER[e + 1].role === ORDER[s].role) e++;
      const l = document.createElement("div");
      l.className = "mv03-station";
      l.textContent = ORDER[s].role;
      l.style.left = `${(HX0 + s * PITCH + 3) * U}px`;
      l.style.width = `${(e - s) * PITCH * U + 22 * U}px`;
      layer.appendChild(l);
      s = e + 1;
    }
    const sign = document.createElement("div");
    sign.className = "mv03-sign";
    sign.innerHTML = "Line 03 <span>connectors in · sushi out</span>";
    layer.appendChild(sign);
    const tip = document.createElement("div");
    tip.className = "mv03-tip";
    const hopperEls = ORDER.map((c, h) => {
      const x0 = (HX0 + h * PITCH) * U;
      const b = document.createElement("button");
      b.className = "mv03-hop";
      b.style.left = `${x0}px`;
      b.title = `${c.name}: ${c.does}`;
      b.setAttribute("aria-label", `${c.name} hopper, ${c.role}: ${c.does}`);
      b.innerHTML = `<i style="color:${lum(c.color) > 0.6 ? INK : "#fff7ea"}">${initials(c)}</i><span>${short(c)}</span>`;
      b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const uses = RECIPES.filter((r) => r.ingredients.includes(c.id)).map((r) => r.sushi);
        tip.innerHTML = `<b>${c.name}</b> <em>${c.role}</em><br>${c.does}<small>in: ${uses.join(" · ") || "nothing yet"}</small>`;
        tip.style.left = `${Math.min(x0 - 40, W - 330)}px`;
        tip.classList.remove("on"); void tip.offsetWidth; tip.classList.add("on");
        clearTimeout(tipTimer); tipTimer = window.setTimeout(() => tip.classList.remove("on"), 3200);
        ctx.sfx("blip");
      });
      layer.appendChild(b);
      return b;
    });
    let tipTimer = 0;
    const pressLbl = document.createElement("button");
    pressLbl.className = "mv03-press";
    pressLbl.textContent = "press";
    pressLbl.title = "The press";
    let pressClicks = 0;
    pressLbl.addEventListener("click", (ev) => {
      ev.stopPropagation(); ctx.sfx("bonk");
      if (++pressClicks === 3) ctx.egg("v03-press", "Jiro calibrates the press to exactly one kilonewton of care per nigiri.");
    });
    layer.appendChild(pressLbl);
    layer.appendChild(tip);

    // ticket, manifest, receipt, counter, buttons
    const ticket = document.createElement("div");
    ticket.className = "mv03-ticket";
    root.appendChild(ticket);
    const man = document.createElement("div");
    man.className = "mv03-man";
    root.appendChild(man);
    const receipt = document.createElement("div");
    receipt.className = "mv03-receipt";
    root.appendChild(receipt);
    const counter = document.createElement("div");
    counter.className = "mv03-count";
    root.appendChild(counter);
    const bar = document.createElement("div");
    bar.className = "mv03-bar";
    root.appendChild(bar);
    const btns = RECIPES.map((r, k) => {
      const b = document.createElement("button");
      b.innerHTML = `<img src="${ctx.base}items/${r.item}.png" alt=""><span>${r.sushi}</span><small>${r.ingredients.length} connectors</small>`;
      b.addEventListener("click", (ev) => { ev.stopPropagation(); if (k !== ri) { select(k, true); ctx.sfx("coin"); } });
      bar.appendChild(b);
      return b;
    });

    const imgs = new Map<string, HTMLImageElement>();
    for (const r of RECIPES) { const im = new Image(); im.src = `${ctx.base}items/${r.item}.png`; imgs.set(r.item, im); }

    let ri = 0, plan = build(RECIPES[0]), start = performance.now(), orderNo = 42, sound = false;
    const seen = new Set<number>();
    let manRows: HTMLElement[] = [];
    const fired = new Set<string>();

    function select(k: number, user: boolean) {
      ri = k; plan = build(RECIPES[k]); start = performance.now(); orderNo++; sound = user;
      btns.forEach((b, j) => { b.classList.toggle("on", j === k); b.setAttribute("aria-pressed", String(j === k)); });
      const r = RECIPES[k];
      ticket.innerHTML = `<div class="clip"></div><header><i>S</i>#eng · Slack order</header><p>${r.order}</p><footer>ticket #${String(orderNo).padStart(4, "0")} · ${r.sushi}</footer>`;
      man.innerHTML = `<h4>On the line <em>${r.ingredients.length} MCP connectors → ${r.sushi}</em></h4>` + r.ingredients.map((id) => {
        const c = byId(id);
        return `<div class="row"><i style="background:${c.color};color:${lum(c.color) > 0.6 ? INK : "#fff7ea"}">${initials(c)}</i><b>${c.name}</b><em>${c.role}</em><span>${c.does}</span></div>`;
      }).join("");
      manRows = [...man.querySelectorAll<HTMLElement>(".row")];
      receipt.innerHTML = `<div class="paper"><h5>Jiro's kitchen</h5><p class="meta">order #${String(orderNo).padStart(4, "0")} · served</p><hr><p class="dish">1× ${r.sushi}</p><p class="ings">${r.ingredients.map((id) => byId(id).name).join(" + ")}</p><hr><h6>Serves</h6><p class="serves">${r.serves}</p><div class="bars"></div></div>`;
      counter.innerHTML = `<small>orders out</small><b>${String(orderNo - 1).padStart(4, "0")}</b>`;
      hopperEls.forEach((b, h) => b.classList.toggle("in", plan.hoppers.includes(h)));
      fired.clear();
      seen.add(k);
      if (seen.size === RECIPES.length) ctx.egg("v03-all", "Every order off the line. The press never sleeps.");
    }

    function frame(now: number) {
      let t = now - start;
      if (t >= plan.dur) { select(ri, false); t = 0; }
      if (ctx.reducedMotion) t = plan.ph.find((p) => p.k === "hold")!.t0 + 200;
      const r = RECIPES[ri];
      const ph = plan.ph;
      let cur: Ph | null = null;
      for (const p of ph) if (p.t0 <= t) cur = p;
      const pp = cur ? clamp((t - cur.t0) / (cur.t1 - cur.t0)) : 0;
      const layers = r.ingredients.map(byId);

      // tray x
      let tx = TRAY_START;
      for (const p of ph) {
        if (p.k === "move" && t >= p.t0) tx = t >= p.t1 ? p.to! : lerp(p.from!, p.to!, ease((t - p.t0) / (p.t1 - p.t0)));
        if (p.k === "roll" && t >= p.t0) tx = lerp(END_X, TRAY_END, ease(clamp((t - p.t0) / (p.t1 - p.t0) * 1.2)));
      }
      tx = Math.round(tx);
      const landed = ph.filter((p) => p.k === "fall" && t >= p.t1).length;
      const press = ph.find((p) => p.k === "press")!;
      const roll = ph.find((p) => p.k === "roll")!;
      const stampT = press.t0 + (press.t1 - press.t0) * 0.35;
      const stamped = t >= stampT;

      g.drawImage(bgc, 0, 0);

      // belt treads (move with the tray: indexing stepper)
      const off = ((tx % 5) + 5) % 5;
      R(4, 82, 350, 3, "#24201c"); R(4, 82, 350, 1, "#35302b");
      for (let x = 4 + off; x < 354; x += 5) R(x, 83, 1, 2, "#3f3934");

      // drop guides under the hoppers this order uses
      plan.hoppers.forEach((h, i) => {
        const cx = hopperCx(h), done = i < landed;
        for (let y = GATE_Y + 4; y < 76; y += 4) R(cx, y, 1, 2, done ? "#2a221b" : i === landed ? "#3f6b4c" : "#3a2c20");
      });
      // hoppers
      const actI = cur && cur.i !== undefined ? cur.i : -1;
      ORDER.forEach((c, h) => {
        let gate = 0;
        const i = plan.hoppers.indexOf(h);
        if (i >= 0) for (const p of ph) {
          if (p.i !== i || t < p.t0) continue;
          const q = clamp((t - p.t0) / (p.t1 - p.t0));
          if (p.k === "open") gate = ease(q);
          else if (p.k === "fall" || p.k === "land") gate = 1;
          else if (p.k === "close") gate = 1 - ease(q);
        }
        g.globalAlpha = i >= 0 ? 1 : 0.38;
        drawHopper(h, c, i >= 0, i >= 0 && i === actI && cur!.k !== "close", gate, now);
        g.globalAlpha = 1;
      });

      // tray + stack / sushi (clipped where the belt wraps around the end roller)
      g.save(); g.beginPath(); g.rect(0, 0, BELT_END * U, H); g.clip();
      if (t < roll.t1) drawTray(tx);
      let stackTop = TRAY_TOP;
      if (!stamped) {
        const bounce = cur && cur.k === "land" && pp < 0.35 ? 1 : 0;
        stackTop = stack(tx, layers.slice(0, landed), bounce);
      }
      g.restore();

      // falling ingredient
      if (cur && cur.k === "fall") {
        const c = layers[cur.i!];
        const target = stackTop + (c.role === "fish" ? 1 : c.role === "sauce" ? 1 : 0);
        piece(c, tx, Math.round(lerp(GATE_Y + 3, target, pp * pp)));
      }
      // landing dust
      if (cur && cur.k === "land" && pp < 0.7) {
        const d = Math.round(pp * 10);
        g.fillStyle = `rgba(243,230,207,${0.6 - pp * 0.8})`;
        for (const sx of [-1, 1]) { g.fillRect((tx + sx * (15 + d)) * U, (stackTop + 1 - Math.round(pp * 3)) * U, U, U); g.fillRect((tx + sx * (13 + d)) * U, (stackTop - 1 - Math.round(pp * 4)) * U, U, U); }
      }

      // press head
      let headBottom = HEAD_REST;
      const stackTopForPress = stack(0, layers, 0, false) - 2;
      if (cur === press) {
        if (pp < 0.35) headBottom = lerp(HEAD_REST, stackTopForPress, ease(pp / 0.35) ** 1.5);
        else if (pp < 0.55) headBottom = stackTopForPress;
        else headBottom = lerp(stackTopForPress, HEAD_REST, ease((pp - 0.55) / 0.45));
      }
      headBottom = Math.round(headBottom);

      // finished sushi
      const im = imgs.get(r.item)!;
      if (stamped && im.complete && im.naturalWidth) {
        const sw = 112, sh = (sw * im.naturalHeight) / im.naturalWidth;
        let x = tx * U, yb = TRAY_TOP * U, rot = 0, alpha = 1, scale = 1;
        if (cur === press) scale = clamp((TRAY_TOP - headBottom) / (sh / U), 0.25, 1);
        if (t >= roll.t0) {
          const q = clamp((t - roll.t0) / (roll.t1 - roll.t0));
          x = lerp(END_X * U, PLATE.x * U, q);
          yb = lerp(TRAY_TOP * U, PLATE.y * U + 6, q * q) - Math.sin(q * Math.PI) * 26;
          rot = Math.sin(q * Math.PI) * 0.35;
        }
        const clear = ph.find((p) => p.k === "clear")!;
        if (t >= clear.t0) alpha = 1 - clamp((t - clear.t0) / (clear.t1 - clear.t0));
        g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
        g.translate(x, yb); g.rotate(rot);
        g.drawImage(im, -sw * scale / 2, -sh * scale, sw * scale, sh * scale);
        g.restore();
      }
      drawPress(headBottom, cur === press && pp > 0.3 && pp < 0.6);
      if (cur === press && pp > 0.35 && pp < 0.75) {
        const q = (pp - 0.35) / 0.4;
        g.fillStyle = `rgba(243,230,207,${0.5 * (1 - q)})`;
        for (let k = 0; k < 4; k++) {
          const px = PRESS_X + (k < 2 ? -19 - k * 3 : 17 + (k - 2) * 3), py = stackTopForPress - 4 - Math.round(q * 14) - k;
          g.fillRect(px * U, py * U, 3 * U, 3 * U);
        }
        if (pp < 0.45) { g.fillStyle = "rgba(255,248,230,.85)"; for (const [a, b] of [[-21, 2], [20, 2], [-23, -3], [22, -3]]) g.fillRect((PRESS_X + a) * U, (TRAY_TOP - 6 + b) * U, U, U); }
      }
      if (sound) {
        const fire = (key: string, n: Parameters<typeof ctx.sfx>[0]) => { if (!fired.has(key)) { fired.add(key); ctx.sfx(n); } };
        if (cur && cur.k === "land") fire(`land${cur.i}`, "pop");
        if (stamped && cur === press) fire("stamp", "bonk");
        if (t >= roll.t1) fire("plate", "chime");
      }
      drawPlate();

      // DOM state
      manRows.forEach((row, i) => {
        row.classList.toggle("lit", i < landed);
        row.classList.toggle("next", i === landed && t < press.t0);
      });
      pressLbl.classList.toggle("on", cur === press);
      // ticket clip-on + tear-off
      const clear = ph.find((p) => p.k === "clear")!;
      if (t < 1300) {
        const q = clamp(t / 1300);
        const drop = (1 - ease(clamp(q * 1.8))) * -70;
        const rot = Math.exp(-4 * q) * Math.cos(q * 14) * 7 * clamp(q * 3);
        ticket.style.transform = `translateY(${drop}px) rotate(${rot}deg)`;
        ticket.style.opacity = String(clamp(q * 3));
      } else if (t >= clear.t0) {
        const q = ease(clamp((t - clear.t0) / (clear.t1 - clear.t0)));
        ticket.style.transform = `translateX(${-60 * q}px) rotate(${-4 * q}deg)`;
        ticket.style.opacity = String(1 - q);
      } else { ticket.style.transform = "none"; ticket.style.opacity = "1"; }
      // receipt
      const print = ph.find((p) => p.k === "print")!;
      const rp = t < print.t0 ? 0 : t >= clear.t0 ? 1 : clamp((t - print.t0) / (print.t1 - print.t0));
      const full = (receipt.firstElementChild as HTMLElement | null)?.offsetHeight ?? 260;
      receipt.style.height = `${Math.min(full, Math.round((rp * full) / 10) * 10)}px`; // feeds in 10-px steps, like a thermal head
      receipt.style.opacity = String(t >= clear.t0 ? 1 - clamp((t - clear.t0) / (clear.t1 - clear.t0)) : 1);
      if (t >= roll.t1 && !counter.classList.contains("bump")) {
        counter.querySelector("b")!.textContent = String(orderNo).padStart(4, "0");
        counter.classList.add("bump");
      } else if (t < roll.t1) counter.classList.remove("bump");
      // printer LED
      R(401, 5, 2, 2, t >= print.t0 && t < print.t1 && Math.floor(now / 160) % 2 === 0 ? "#6fdc8c" : "#2c5a3a");
    }

    let raf = 0;
    const loop = (now: number) => { frame(now); if (!ctx.reducedMotion) raf = requestAnimationFrame(loop); };
    const q = new URLSearchParams(location.search);
    select(clamp(Number(q.get("v03r")) || 0, 0, RECIPES.length - 1), false); // preview hooks: ?v03r=recipe&v03t=ms
    start -= Number(q.get("v03t")) || 0;
    raf = requestAnimationFrame(loop);
    if (ctx.reducedMotion) {
      btns.forEach((b) => b.addEventListener("click", () => requestAnimationFrame(frame)));
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tipTimer);
      root.remove();
    };
  },
};
