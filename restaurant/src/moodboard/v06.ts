import { CONNECTORS, RECIPES, byId, type Connector, type MoodVersion, type Recipe } from "./data";
import "./v06.css";

// v06 "Orbit": connectors orbit a copper turntable like a pixel solar system.
// Picking a recipe spirals its ingredients inward and fuses them into the sushi;
// clicking the plate explodes the dish back into a labelled radial diagram.

const W = 1640, H = 700;
const CX = 572, CY = 372; // centre of the plate surface
const PLATE_W = 460;
const TILT = 0.5; // ry / rx for every orbit
const RINGS = [
  { rx: 318, tag: "RICE RING", period: 84, dir: 1 },
  { rx: 438, tag: "FISH + SAUCE", period: 120, dir: -1 },
  { rx: 548, tag: "NORI + GARNISH", period: 168, dir: 1 },
];
const RING_OF: Record<Connector["role"], number> = { rice: 0, fish: 1, sauce: 1, nori: 2, garnish: 2 };
const ROLE_LABEL: Record<Connector["role"], string> = { rice: "RICE", fish: "FISH", sauce: "SAUCE", nori: "NORI", garnish: "GARNISH" };

// 7x7 pixel glyphs for the badges (not logos, just marks).
const GLYPH: Record<string, string> = {
  github: ".#...#..#####.########.###.########.#####..#.#.#.",
  slack: "..#.#....#.#..#######..#.#..#######..#.#....#.#..",
  linear: "..####..#...###...#.##..#..##.#...###...#..####..",
  sentry: "...#.....#.#....#.#...#.#.#..#.#.#.#.#...####.###",
  notion: "##...#####..######.####.######..#####...####...##",
  gdrive: "...#.....###....#.#...##.##..#...#.##...#########",
  hubspot: ".....#......#...###...#...#..#...#...###...#.....",
  gmail: "#########...###.#.#.##..#..##.....##.....########",
  stripe: "..####..#......#.......###.......#......#..####..",
  jira: "...#.....#.#...#.#.#.#.#.#.#.#.#.#...#.#.....#...",
  postgres: ".#####.#########.###########.###.##..#..#...#....",
};

const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const snap = (v: number) => Math.round(v / 3) * 3;

type Mode = "orbit" | "plate" | "out";
interface Pt { x: number; y: number; s: number }
interface Body {
  c: Connector;
  ring: number;
  a0: number;
  mode: Mode;
  prev: Mode;
  t0: number;
  dur: number;
  spin: number;
  from: Pt | null;
  slot: number;
  n: number;
  last: Pt;
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(clamp(f > 0 ? v + (255 - v) * f : v * (1 + f), 0, 255));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/** Pre-render an 11x11 pixel badge (3 px per pixel) per connector. */
function makeBadge(c: Connector): HTMLCanvasElement {
  const P = 3, G = 11;
  const cv = document.createElement("canvas");
  cv.width = cv.height = G * P;
  const g = cv.getContext("2d")!;
  const px = (x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(x * P, y * P, P, P); };
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const corner = (x === 0 || x === G - 1) && (y === 0 || y === G - 1);
    if (corner) continue;
    const edge = x === 0 || y === 0 || x === G - 1 || y === G - 1 || ((x === 1 || x === G - 2) && (y === 1 || y === G - 2));
    if (edge) { px(x, y, "#0b0a09"); continue; }
    let col = c.color;
    if (y === 1 || x === 1) col = shade(c.color, 0.35);
    else if (y === G - 2 || x === G - 2) col = shade(c.color, -0.35);
    px(x, y, col);
  }
  const ink = luminance(c.color) > 0.7 ? "#1a1612" : "#fbf5ea";
  const gl = GLYPH[c.id] ?? "";
  for (let i = 0; i < 49; i++) if (gl[i] === "#") px(2 + (i % 7), 2 + Math.floor(i / 7), ink);
  return cv;
}

function img(src: string) {
  const i = new Image();
  i.src = src;
  return i;
}

export const v06: MoodVersion = {
  n: 6,
  title: "Orbit",
  pitch: "Every connector orbits Jiro's turntable like a pixel solar system; order a dish and its ingredients spiral in and fuse. Click the plate to blow it back apart.",
  mount(el, ctx) {
    const base = ctx.base + "mood/v06/";
    const rm = ctx.reducedMotion;
    const plateImg = img(base + "plate.png");
    const ingImg: Record<string, HTMLImageElement> = {};
    for (const r of ["rice", "fish", "nori", "sauce", "garnish"]) ingImg[r] = img(base + r + ".png");
    const sushiImg: Record<string, HTMLImageElement> = {};
    for (const r of RECIPES) sushiImg[r.item] = img(ctx.base + "items/" + r.item + ".png");
    const badges: Record<string, HTMLCanvasElement> = {};
    for (const c of CONNECTORS) badges[c.id] = makeBadge(c);

    const root = document.createElement("div");
    root.className = "mv06";
    root.innerHTML = `
      <canvas width="${W}" height="${H}"></canvas>
      <div class="mv06-legend">
        <p class="mv06-k">MCP SOLAR SYSTEM</p>
        <p>${CONNECTORS.length} connectors in orbit · 3 rings by kitchen role</p>
      </div>
      <aside class="mv06-panel">
        <p class="mv06-k">Tonight's orders · pick a dish</p>
        <div class="mv06-menu" role="tablist"></div>
        <div class="mv06-ticket">
          <p class="mv06-k">The ask</p>
          <p class="mv06-order"></p>
          <p class="mv06-k">Pulled into orbit</p>
          <div class="mv06-chips"></div>
          <p class="mv06-k">Served</p>
          <p class="mv06-serves"></p>
        </div>
        <p class="mv06-help">Hover an orbiting ingredient to see what it brings. Click it to cook a dish that uses it.</p>
      </aside>
      <div class="mv06-tip"></div>`;
    el.appendChild(root);
    const cv = root.querySelector("canvas")!;
    const g = cv.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    const menu = root.querySelector<HTMLElement>(".mv06-menu")!;
    const tip = root.querySelector<HTMLElement>(".mv06-tip")!;

    // ---- bodies on their rings
    const byRing: Connector[][] = [[], [], []];
    for (const c of CONNECTORS) byRing[RING_OF[c.role]].push(c);
    const bodies: Body[] = [];
    byRing.forEach((list, ri) => list.forEach((c, k) => {
      const a0 = (k / list.length) * Math.PI * 2 + ri * 0.7;
      bodies.push({ c, ring: ri, a0, mode: "orbit", prev: "orbit", t0: 0, dur: 0, spin: 0, from: null, slot: 0, n: 1, last: { x: CX, y: CY, s: 1 } });
    }));
    const bodyOf = (id: string) => bodies.find((b) => b.c.id === id)!;

    // ---- stars (seeded)
    let seed = 6006;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const stars = Array.from({ length: 190 }, () => ({
      x: snap(rnd() * W), y: snap(rnd() * H), big: rnd() < 0.08,
      col: rnd() < 0.2 ? "#d98a4a" : rnd() < 0.3 ? "#9fb8ff" : "#f3e6cf",
      p: [3, 4, 6, 8, 12][Math.floor(rnd() * 5)], ph: rnd() * 6.28, a: 0.25 + rnd() * 0.5,
    }));

    // ---- state
    let recipe: Recipe | null = null;
    let phase: "idle" | "assembling" | "assembled" | "exploded" = "idle";
    let landAt = 0;
    let flashAt = -99;
    let sushiA = 0;
    let shownItem = RECIPES[0].item;
    let hover: Body | null = null;
    let hoverPlate = false;
    const T0 = performance.now();
    const now = () => (performance.now() - T0) / 1000;
    const D = (s: number) => (rm ? 0.01 : s);

    const inRecipe = (b: Body) => !!recipe && recipe.ingredients.includes(b.c.id);

    function orbitPos(b: Body, t: number): Pt {
      const R = RINGS[b.ring];
      const a = b.a0 + (rm ? 0 : (t / R.period) * Math.PI * 2 * R.dir);
      const sn = Math.sin(a);
      return { x: CX + Math.cos(a) * R.rx, y: CY + sn * R.rx * TILT, s: 0.82 + 0.2 * sn };
    }
    function slotPos(b: Body): Pt {
      const off = b.slot - (b.n - 1) / 2;
      return { x: CX + (b.slot % 2 ? 18 : -18) + off * 6, y: CY + 30 - b.slot * 18, s: 0.9 };
    }
    const OUT_ANGLES: Record<number, number[]> = {
      3: [-145, -35, 90],
      4: [-148, -32, 32, 148],
      5: [-146, -90, -34, 32, 148],
    };
    function outPos(b: Body): Pt {
      const angs = OUT_ANGLES[b.n] ?? OUT_ANGLES[5];
      const a = (angs[b.slot] * Math.PI) / 180;
      const rx = 332, ry = 218;
      return { x: CX + Math.cos(a) * rx, y: CY - 10 + Math.sin(a) * ry, s: 1.08 };
    }
    function target(b: Body, m: Mode, t: number): Pt {
      return m === "orbit" ? orbitPos(b, t) : m === "plate" ? slotPos(b) : outPos(b);
    }
    function pos(b: Body, t: number): Pt {
      if (t < b.t0) return target(b, b.prev, t);
      const tg = target(b, b.mode, t);
      if (!b.from) return tg;
      const u = clamp((t - b.t0) / b.dur);
      if (u >= 1) { b.from = null; return tg; }
      const e = ease(u);
      const dx = b.from.x - tg.x, dy = (b.from.y - tg.y) / TILT;
      const r = b.spin * e, k = 1 - e;
      const x = tg.x + (dx * Math.cos(r) - dy * Math.sin(r)) * k;
      const y = tg.y + (dx * Math.sin(r) + dy * Math.cos(r)) * k * TILT;
      return { x, y, s: b.from.s + (tg.s - b.from.s) * e };
    }
    function go(b: Body, m: Mode, t0: number, dur: number, spin: number) {
      const t = now();
      if (t0 <= t) { b.from = { ...b.last }; pendingCapture.delete(b); }
      else { b.from = null; pendingCapture.add(b); }
      b.prev = b.mode; b.mode = m; b.t0 = t0; b.dur = D(dur); b.spin = spin;
    }
    const pendingCapture = new Set<Body>();

    function assemble() {
      if (!recipe) return;
      const t = now();
      recipe.ingredients.forEach((id, i) => {
        const b = bodyOf(id);
        b.slot = i; b.n = recipe!.ingredients.length;
        go(b, "plate", t + D(i * 0.34), 1.8, (b.mode === "orbit" ? 1.5 : 0.9) * Math.PI * (i % 2 ? -1 : 1));
      });
      landAt = t + D((recipe.ingredients.length - 1) * 0.34 + 1.8);
      phase = "assembling";
      ctx.sfx("whoosh");
    }
    function explode() {
      if (!recipe) return;
      const t = now();
      recipe.ingredients.forEach((id, i) => go(bodyOf(id), "out", t + D(i * 0.07), 0.9, 0));
      phase = "exploded";
      ctx.sfx("pop");
    }
    function choose(r: Recipe) {
      if (recipe?.id === r.id) { if (phase === "exploded") assemble(); return; }
      const t = now();
      const old = recipe;
      recipe = r;
      if (old) old.ingredients.filter((id) => !r.ingredients.includes(id)).forEach((id, i) => go(bodyOf(id), "orbit", t + D(i * 0.08), 1.5, -0.7 * Math.PI));
      assemble();
      renderPanel();
    }

    // ---- panel
    RECIPES.forEach((r) => {
      const b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.dataset.id = r.id;
      b.innerHTML = `<img src="${ctx.base}items/${r.item}.png" alt=""><span class="nm">${r.sushi}</span><span class="dots">${r.ingredients.map((id) => `<i style="background:${byId(id).color}"></i>`).join("")}</span>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); choose(r); });
      menu.appendChild(b);
    });
    function renderPanel() {
      if (!recipe) return;
      menu.querySelectorAll<HTMLElement>("button").forEach((b) => {
        const on = b.dataset.id === recipe!.id;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", String(on));
      });
      root.querySelector(".mv06-order")!.textContent = recipe.order;
      root.querySelector(".mv06-serves")!.textContent = recipe.serves;
      root.querySelector(".mv06-chips")!.innerHTML = recipe.ingredients.map((id, i) => {
        const c = byId(id);
        return `<span><b>${i + 1}</b><i style="background:${c.color}"></i>${c.name}</span>`;
      }).join("");
    }

    // ---- input
    const toStage = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };
    const onPlate = (p: { x: number; y: number }) => ((p.x - CX) / 215) ** 2 + ((p.y - CY - 20) / 135) ** 2 < 1;
    function pick(p: { x: number; y: number }): Body | null {
      let best: Body | null = null, bd = 44 * 44;
      for (const b of bodies) {
        if (inRecipe(b) && phase === "assembled") continue;
        const d = (b.last.x - p.x) ** 2 + (b.last.y - 6 - p.y) ** 2;
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }
    const onMove = (e: MouseEvent) => {
      const p = toStage(e);
      hover = pick(p);
      hoverPlate = !hover && onPlate(p) && !!recipe;
      cv.style.cursor = hover || hoverPlate ? "pointer" : "default";
      if (hover) {
        const c = hover.c;
        const uses = RECIPES.filter((r) => r.ingredients.includes(c.id)).map((r) => r.sushi);
        tip.innerHTML = `<b style="color:${luminance(c.color) < 0.35 ? shade(c.color, 0.45) : c.color}">${c.name}</b><span class="role">${ROLE_LABEL[c.role]}</span><p>${c.does}</p><p class="uses">${uses.length ? "in " + uses.join(" · ") : "not on tonight's menu yet"}</p>`;
        tip.style.left = `${Math.min(hover.last.x + 40, 1180 - 330)}px`;
        tip.style.top = `${clamp(hover.last.y - 40, 10, H - 150)}px`;
        tip.classList.add("on");
      } else tip.classList.remove("on");
    };
    const onLeave = () => { hover = null; tip.classList.remove("on"); };
    const onClick = (e: MouseEvent) => {
      e.stopPropagation();
      const p = toStage(e);
      const b = pick(p);
      if (b) {
        if (inRecipe(b)) { if (phase === "exploded") assemble(); return; }
        const uses = RECIPES.filter((r) => r.ingredients.includes(b.c.id));
        if (uses.length) {
          const cur = recipe ? uses.findIndex((r) => r.id === recipe!.id) : -1;
          choose(uses[(cur + 1) % uses.length]);
        } else {
          ctx.sfx("bonk");
          ctx.egg("v06-orphan", `${b.c.name} is still orbiting. Nobody ordered it tonight, but Jiro keeps it warm.`);
        }
        return;
      }
      if (onPlate(p) && recipe) {
        if (phase === "exploded") assemble();
        else if (phase === "assembled") explode();
      }
    };
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("mouseleave", onLeave);
    cv.addEventListener("click", onClick);

    // ---- drawing
    const plateH = () => (plateImg.naturalWidth ? (plateImg.naturalHeight * PLATE_W) / plateImg.naturalWidth : 246);
    const PLATE_TOP_FRAC = 0.4; // plate surface centre within the sprite

    function drawBg(t: number) {
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#07060b");
      bg.addColorStop(1, "#0c0908");
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      const glow = g.createRadialGradient(CX, CY + 30, 20, CX, CY + 30, 520);
      glow.addColorStop(0, "rgba(217,138,74,0.26)");
      glow.addColorStop(0.45, "rgba(150,80,40,0.10)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, W, H);
      for (const s of stars) {
        const a = rm ? s.a : s.a * (0.6 + 0.4 * Math.sin((t / s.p) * 6.283 + s.ph));
        g.globalAlpha = clamp(a);
        g.fillStyle = s.col;
        if (s.big) { g.fillRect(s.x - 3, s.y, 9, 3); g.fillRect(s.x, s.y - 3, 3, 9); }
        else g.fillRect(s.x, s.y, 3, 3);
      }
      g.globalAlpha = 1;
    }
    function drawRings(t: number, back: boolean) {
      RINGS.forEach((R, ri) => {
        const ry = R.rx * TILT;
        const n = Math.round((R.rx * 2 * Math.PI) / 15);
        const shift = rm ? 0 : ((t / R.period) * R.dir) % 1;
        for (let i = 0; i < n; i++) {
          const a = ((i + shift * 4) / n) * Math.PI * 2;
          const sn = Math.sin(a);
          if (back !== sn < 0) continue;
          g.fillStyle = i % 4 === 0 ? "rgba(217,138,74,0.55)" : "rgba(217,138,74,0.22)";
          g.fillRect(snap(CX + Math.cos(a) * R.rx), snap(CY + sn * ry), 3, 3);
        }
        if (back && phase !== "exploded") {
          // ring tag on the upper-left arc
          const a = (196 * Math.PI) / 180;
          g.font = "13px 'JetBrains Mono', monospace";
          g.fillStyle = "rgba(217,138,74,0.72)";
          g.textAlign = "left";
          g.fillText(R.tag, CX + Math.cos(a) * R.rx + 12, CY + Math.sin(a) * ry - 6);
        }
      });
    }
    function drawPlate(t: number) {
      if (!plateImg.complete || !plateImg.naturalWidth) return;
      const ph = plateH();
      const x = Math.round(CX - PLATE_W / 2), y = Math.round(CY - ph * PLATE_TOP_FRAC);
      // shadow
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.beginPath();
      g.ellipse(CX, y + ph - 18, PLATE_W * 0.5, 34, 0, 0, Math.PI * 2);
      g.fill();
      g.drawImage(plateImg, x, y, PLATE_W, ph);
      // turntable glints: two bright pixel sparks slide along the copper band (turning)
      if (!rm) for (let k = 0; k < 2; k++) {
        const a = ((t / 9 + k / 2) % 1) * Math.PI; // front half only, left to right
        const gx = CX - Math.cos(a) * PLATE_W * 0.47;
        const gy = y + ph * 0.8 + Math.sin(a) * ph * 0.14;
        const al = Math.sin(a) * 0.8;
        g.fillStyle = `rgba(255,214,160,${al})`;
        g.fillRect(snap(gx) - 6, snap(gy), 15, 3);
        g.fillRect(snap(gx), snap(gy) - 3, 3, 9);
      }
      if (hoverPlate) {
        g.strokeStyle = "rgba(111,220,140,0.55)";
        g.lineWidth = 3;
        g.setLineDash([6, 6]);
        g.beginPath();
        g.ellipse(CX, CY - 2, PLATE_W * 0.5 + 8, ph * 0.43, 0, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
      }
    }
    function drawBody(b: Body, p: Pt, alpha: number, labels: boolean) {
      if (alpha <= 0.01) return;
      const im = ingImg[b.c.role];
      const s = p.s * (hover === b ? 1.12 : 1);
      g.globalAlpha = alpha;
      if (im.complete && im.naturalWidth) {
        const w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
        g.drawImage(im, Math.round(p.x - w / 2), Math.round(p.y - h / 2), w, h);
      }
      const bd = badges[b.c.id];
      const bs = Math.round(33 * (0.85 + 0.15 * s));
      g.drawImage(bd, Math.round(p.x + 18 * s), Math.round(p.y - 30 * s), bs, bs);
      if (labels) {
        g.font = "15px Silkscreen, monospace";
        g.textAlign = "center";
        g.fillStyle = "rgba(0,0,0,0.85)";
        g.fillText(b.c.name, Math.round(p.x) + 2, Math.round(p.y + 44 * s) + 2);
        g.fillStyle = "#f3e6cf";
        g.fillText(b.c.name, Math.round(p.x), Math.round(p.y + 44 * s));
      }
      g.globalAlpha = 1;
    }
    function drawCallout(b: Body, p: Pt, a: number) {
      if (a <= 0.01) return;
      const angs = OUT_ANGLES[b.n] ?? OUT_ANGLES[5];
      const ang = (angs[b.slot] * Math.PI) / 180;
      const cs = Math.cos(ang), sn = Math.sin(ang);
      g.globalAlpha = a;
      // dotted leader from the plate rim to the part
      const x0 = CX + cs * 196, y0 = CY + 4 + sn * 92;
      const steps = Math.floor(Math.hypot(p.x - x0, p.y - y0) / 12);
      g.fillStyle = "#e9a36a";
      for (let i = 0; i < steps - 3; i++) {
        const u = i / steps;
        g.fillRect(snap(x0 + (p.x - x0) * u), snap(y0 + (p.y - y0) * u), 3, 3);
      }
      g.fillRect(snap(x0) - 3, snap(y0) - 3, 9, 9);
      // number tag
      g.fillStyle = "#6fdc8c";
      g.fillRect(Math.round(p.x - 52), Math.round(p.y - 40), 24, 24);
      g.fillStyle = "#0b0a09";
      g.font = "16px Silkscreen, monospace";
      g.textAlign = "center";
      g.fillText(String(b.slot + 1), Math.round(p.x - 40), Math.round(p.y - 22));
      // text block
      let tx = p.x, ty = p.y, align: CanvasTextAlign = "center";
      if (cs > 0.3) { tx = p.x + 58; align = "left"; ty = p.y - 22; }
      else if (cs < -0.3) { tx = p.x - 58; align = "right"; ty = p.y - 22; }
      else if (sn < 0) { ty = p.y - 104; }
      else { ty = p.y + 60; }
      g.textAlign = align;
      g.font = "20px Silkscreen, monospace";
      g.fillStyle = "#f3e6cf";
      g.fillText(b.c.name, tx, ty);
      g.font = "13px 'JetBrains Mono', monospace";
      g.fillStyle = "#d98a4a";
      g.fillText(`${ROLE_LABEL[b.c.role]} · layer ${b.slot + 1}`, tx, ty + 22);
      g.font = "18px 'Instrument Sans', system-ui, sans-serif";
      g.fillStyle = "#e7d8bf";
      g.fillText(b.c.does, tx, ty + 46);
      g.globalAlpha = 1;
    }
    function drawSushi(t: number) {
      const im = sushiImg[shownItem];
      if (sushiA <= 0.01 || !im.complete || !im.naturalWidth) return;
      const since = t - landAt;
      const pop = phase === "assembled" ? 1 + 0.25 * Math.max(0, 1 - since / 0.35) * Math.sin(clamp(since / 0.35) * Math.PI) : 1;
      const bob = rm ? 0 : Math.round(Math.sin((t / 4) * 6.283) * 1.5) * 3;
      const s = 1.2 * pop;
      const w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
      g.globalAlpha = sushiA;
      g.drawImage(im, Math.round(CX - w / 2), Math.round(CY + 22 - h * 0.78 + bob - (phase === "exploded" ? 6 : 0)), w, h);
      g.globalAlpha = 1;
    }
    function drawFlash(t: number) {
      const u = (t - flashAt) / 0.8;
      if (u < 0 || u > 1) return;
      const r = 120 + u * 260;
      g.strokeStyle = `rgba(243,230,207,${(1 - u) * 0.8})`;
      g.lineWidth = 6;
      g.setLineDash([9, 9]);
      g.beginPath();
      g.ellipse(CX, CY, r, r * TILT, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * 6.283 + 0.3;
        const d = 90 + u * 190;
        g.fillStyle = k % 2 ? `rgba(111,220,140,${1 - u})` : `rgba(217,138,74,${1 - u})`;
        const x = snap(CX + Math.cos(a) * d), y = snap(CY - 20 + Math.sin(a) * d * TILT);
        g.fillRect(x - 3, y, 9, 3);
        g.fillRect(x, y - 3, 3, 9);
      }
    }
    function drawHint(t: number) {
      if (!recipe) return;
      const ph = plateH();
      const y = Math.round(CY - ph * PLATE_TOP_FRAC + ph + 30);
      let text = "";
      if (phase === "assembled") text = "▸ click the plate to explode it";
      else if (phase === "exploded") text = "▸ click the plate to reassemble";
      else if (phase === "assembling") text = "assembling…";
      if (!text) return;
      g.font = "15px 'JetBrains Mono', monospace";
      g.textAlign = "center";
      const w = g.measureText(text).width + 28;
      g.fillStyle = "rgba(11,10,9,0.8)";
      g.fillRect(Math.round(CX - w / 2), y - 20, Math.round(w), 30);
      g.fillStyle = phase === "assembling" ? "#bfae95" : `rgba(111,220,140,${rm ? 1 : 0.75 + 0.25 * Math.sin(t * 2.6)})`;
      g.fillText(text, CX, y);
      if (phase === "assembled") {
        g.font = "22px Silkscreen, monospace";
        g.fillStyle = "#f3e6cf";
        const yy = Math.round(CY - ph * PLATE_TOP_FRAC - 14);
        const tw = g.measureText(recipe.sushi).width + 24;
        g.fillStyle = "rgba(11,10,9,0.78)";
        g.fillRect(Math.round(CX - tw / 2), yy - 24, Math.round(tw), 32);
        g.fillStyle = "rgba(0,0,0,0.8)";
        g.fillText(recipe.sushi, CX + 2, yy + 2);
        g.fillStyle = "#f3e6cf";
        g.fillText(recipe.sushi, CX, yy);
      }
    }

    let raf = 0;
    let lastT = 0;
    function frame() {
      const t = now();
      const dt = Math.min(0.1, t - lastT);
      lastT = t;
      // lazily capture start points for delayed moves
      for (const b of pendingCapture) if (t >= b.t0) {
        b.from = target(b, b.prev, t);
        pendingCapture.delete(b);
      }
      if (phase === "assembling" && t >= landAt) {
        phase = "assembled";
        flashAt = t;
        ctx.sfx("chime");
      }
      const sTarget = phase === "assembled" ? 1 : phase === "exploded" ? 0.28 : 0;
      if (recipe && sushiA < 0.05 && shownItem !== recipe.item) shownItem = recipe.item;
      const want = recipe && shownItem === recipe.item ? sTarget : 0;
      sushiA += (want - sushiA) * Math.min(1, dt * (want > sushiA ? 7 : 9));

      drawBg(t);
      drawRings(t, true);
      const P = bodies.map((b) => ({ b, p: (b.last = pos(b, t)) }));
      const moving = (b: Body) => b.mode !== "orbit" || t < b.t0 + b.dur;
      const faint = (b: Body) => {
        if (inRecipe(b)) {
          if (phase === "assembled") return 1 - clamp((t - landAt) / 0.35);
          return 1;
        }
        return recipe ? (hover === b ? 0.95 : phase === "exploded" ? 0.22 : 0.5) : 1;
      };
      const orbiting = P.filter(({ b }) => !moving(b)).sort((a, c) => a.p.y - c.p.y);
      for (const { b, p } of orbiting) if (p.y < CY) drawBody(b, p, faint(b), phase !== "exploded");
      drawPlate(t);
      drawSushi(t);
      const active = P.filter(({ b }) => moving(b)).sort((a, c) => (a.b.mode === "plate" && c.b.mode === "plate" ? a.b.slot - c.b.slot : a.p.y - c.p.y));
      for (const { b, p } of active) drawBody(b, p, faint(b), b.mode === "orbit");
      drawRings(t, false);
      for (const { b, p } of orbiting) if (p.y >= CY) drawBody(b, p, faint(b), phase !== "exploded");
      if (phase === "exploded") for (const { b, p } of active) if (b.mode === "out") drawCallout(b, p, clamp((t - b.t0 - b.dur * 0.7) / 0.3));
      drawFlash(t);
      drawHint(t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const kick = setTimeout(() => choose(RECIPES[0]), rm ? 0 : 450);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(kick);
      cv.removeEventListener("mousemove", onMove);
      cv.removeEventListener("mouseleave", onLeave);
      cv.removeEventListener("click", onClick);
      el.innerHTML = "";
    };
  },
};
