import { RECIPES, byId, type MoodVersion, type Recipe, type Connector } from "./data";
import "./v09.css";

// v09 — Engineering blueprint. Each recipe is an exploded assembly drawing on cyanotype
// paper: parts float apart on a dash-dot centre axis, balloons carry item numbers, the
// bill of materials maps part → MCP connector → what it does. Recipe changes re-plot the
// sheet with a slow pen-plotter; hover links a part and its BOM row both ways.

const W = 1640, H = 700;
const AX = 450; // centre axis of the exploded view
const BAL_L = 84, BAL_R = 822;
const HOT = "#ffd75e";

type Pt = [number, number];

const ABBR: Record<string, string> = {
  sentry: "SE", github: "GH", linear: "LN", slack: "SL", notion: "NO", gdrive: "GD",
  hubspot: "HS", gmail: "GM", stripe: "ST", jira: "JI", postgres: "PG",
};
const ROLE: Record<Connector["role"], string> = {
  rice: "RICE BED", fish: "NETA", nori: "NORI BAND", garnish: "GARNISH", sauce: "SAUCE",
};

const snap = (v: number) => Math.round(v / 4) * 4;

/** Staircase path through points: only H/V moves on a 4px grid, so strokes read as pixel line-art. */
function stair(pts: Pt[], close = false): string {
  const s = pts.map(([x, y]) => [snap(x), snap(y)] as Pt).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  if (!s.length) return "";
  let d = `M${s[0][0]} ${s[0][1]}`;
  let [cx, cy] = s[0];
  for (let i = 1; i < s.length; i++) {
    const [x, y] = s[i];
    if (x !== cx) d += `H${x}`;
    if (y !== cy) d += `V${y}`;
    cx = x; cy = y;
  }
  return close ? d + "Z" : d;
}

/** Straight line sampled finely so stair() turns it into an even pixel staircase. */
function seg(a: Pt, b: Pt): Pt[] {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2);
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as Pt);
}

function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 3));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

interface PartGeo { strokes: string[]; hidden: string[]; sil: string; hw: number; top: number; bot: number }

/** Cylinder-ish solid: top rim, sides, front bottom rim; back bottom rim is a hidden (dashed) line. */
function cyl(rx: number, ry: number, yt: number, yb: number) {
  const P = Math.PI;
  return {
    top: stair(arc(0, yt, rx, ry, 0, 2 * P), true),
    topFront: stair(arc(0, yt, rx, ry, 0, P)),
    topBack: stair(arc(0, yt, rx, ry, P, 2 * P)),
    sides: `M${snap(-rx)} ${snap(yt)}V${snap(yb)}M${snap(rx)} ${snap(yt)}V${snap(yb)}`,
    front: stair(arc(0, yb, rx, ry, 0, P)),
    back: stair(arc(0, yb, rx, ry, P, 2 * P)),
    sil: stair([...arc(0, yt, rx, ry, P, 2 * P), ...arc(0, yb, rx, ry, 0, P)], true),
  };
}

function geo(role: Connector["role"]): PartGeo {
  const P = Math.PI;
  if (role === "rice") {
    const c = cyl(116, 26, -16, 20);
    const grains = [[-64, -26], [-20, -34], [24, -24], [64, -14], [-40, -8], [8, -8], [-88, -16], [76, -30], [44, -2], [-72, 28], [-24, 36], [30, 32], [78, 22]]
      .map(([x, y]) => `M${x} ${y}h12`).join("");
    return { strokes: [c.top, c.sides, c.front, grains], hidden: [c.back], sil: c.sil, hw: 116, top: -44, bot: 48 };
  }
  if (role === "fish") {
    const c = cyl(128, 30, -12, 4);
    const stripes = [-80, -44, -8, 28, 64].map((x) => stair(seg([x - 12, -34], [x + 16, 10]))).join("");
    const tail = stair([...seg([128, -12], [152, -32]), ...seg([152, -32], [152, 12]), ...seg([152, 12], [128, -2])]);
    return { strokes: [c.top, c.sides, c.front, stripes, tail], hidden: [c.back], sil: c.sil, hw: 128, top: -44, bot: 36 };
  }
  if (role === "nori") {
    const c = cyl(104, 22, -16, 14);
    const tex = [-72, -44, -16, 12, 40, 68].map((x) => `M${x} ${snap(14 + 22 * Math.sqrt(1 - (x / 104) ** 2)) - 12}v-12`).join("");
    const flap = `M-12 ${snap(-16 + 22) - 4}v${40}h24v-40`;
    return { strokes: [c.topBack, c.topFront, c.sides, c.front, tex, flap], hidden: [c.back], sil: c.sil, hw: 104, top: -40, bot: 40 };
  }
  if (role === "garnish") {
    const up: Pt[] = [], dn: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = -84 + 168 * u, h = 26 * Math.sin(P * u) ** 0.8;
      up.push([x, -h]); dn.push([x, h]);
    }
    const outline = stair([...up, ...dn.reverse()], true);
    const vein = `M-80 0H92L108 -12`.replace("L108 -12", "h8v-4h8v-4h4");
    const side = [-48, -16, 16, 48].map((x) => stair(seg([x, 0], [x + 20, -16])) + stair(seg([x, 0], [x + 20, 16]))).join("");
    return { strokes: [outline, vein, side], hidden: [], sil: outline, hw: 96, top: -28, bot: 28 };
  }
  // sauce: a teardrop with a shine and two splash drops
  const drop: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * 2 * P;
    drop.push([36 * Math.sin(t) * Math.sin(t / 2), -40 * Math.cos(t) + 4]);
  }
  const outline = stair(drop, true);
  const shine = stair(arc(0, 16, 16, 18, P * 1.05, P * 1.45));
  const splash = "M-60 32h8v8h-8zM52 24h8v8h-8zM-44 12h4v4h-4z";
  return { strokes: [outline, shine, splash], hidden: [stair(arc(0, 48, 56, 8, 0, 2 * P), true)], sil: outline, hw: 40, top: -40, bot: 56 };
}

function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function badgeSvg(c: Connector, x: number, y: number) {
  const ink = lum(c.color) > 0.6 ? "#0d2c55" : "#ffffff";
  return `<g class="badge" transform="translate(${x} ${y})"><rect x="0" y="0" width="30" height="30" fill="${c.color}" stroke="#0a2346" stroke-width="2"/><rect x="2" y="2" width="26" height="4" fill="rgba(255,255,255,.35)"/><text x="15" y="21" text-anchor="middle" style="fill:${ink}" class="bdg-t">${ABBR[c.id]}</text></g>`;
}

function badgeHtml(c: Connector) {
  const ink = lum(c.color) > 0.6 ? "#0d2c55" : "#ffffff";
  return `<i class="bdg" style="background:${c.color};color:${ink}">${ABBR[c.id]}</i>`;
}

export const v09: MoodVersion = {
  n: 9,
  title: "Engineering blueprint",
  pitch: "Every sushi is an exploded assembly drawing: parts on the axis, balloons, and a bill of materials that maps each MCP connector to its job.",
  mount(el, ctx) {
    let rid = 0;
    let hot = -1;
    let raf = 0;
    let userHover = false;
    let resumeT = 0;
    const timers: number[] = [];

    el.classList.add("mv09");
    el.innerHTML = `
      <svg class="sheet" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges">
        <defs>
          <pattern id="mv09-fine" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0V20H0" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="2"/></pattern>
          <pattern id="mv09-major" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0V100H0" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="2"/></pattern>
          <radialGradient id="mv09-vig" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#1f5aa6" stop-opacity="0"/><stop offset="1" stop-color="#061a3a" stop-opacity=".75"/></radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#164a8c"/>
        <rect width="${W}" height="${H}" fill="url(#mv09-fine)"/>
        <rect width="${W}" height="${H}" fill="url(#mv09-major)"/>
        <rect width="${W}" height="${H}" fill="url(#mv09-vig)"/>
        <g class="frame"></g>
        <g class="draw"></g>
        <g class="pen" opacity="0"><path d="M-2 -14h4v10h-4zM-2 4h4v10h-4zM-14 -2h10v4h-10zM4 -2h10v4h-10z" fill="${HOT}"/><rect x="-4" y="-4" width="8" height="8" fill="#fff"/></g>
      </svg>
      <div class="sheets"><span class="lbl">SHEET</span></div>
      <table class="bom"><thead><tr><th>ITEM</th><th>PART</th><th>CONNECTOR</th><th>FUNCTION</th></tr></thead><tbody></tbody></table>
      <div class="notes"><b>NOTES</b><p class="n1"></p><p>2. ALL PARTS SOURCED LIVE VIA MCP. NO COPY-PASTE.</p></div>
      <div class="detail"><span>DETAIL A · ASSEMBLED</span><img alt=""></div>
      <div class="tblock">
        <div class="tb-co">JIRO SUSHI WORKS</div>
        <div class="tb-ti"><small>TITLE</small><b></b></div>
        <div><small>DWG NO.</small>042</div><div><small>SCALE</small>1:1</div><div class="tb-sh"><small>SHEET</small><span></span></div>
        <div><small>DRAWN</small>NORI</div><button class="tb-ck" title="Who checked this?"><small>CHECKED</small>JIRO</button><div><small>DATE</small>2026-09-29</div>
      </div>
      <div class="stamp"><b>REV B · APPROVED</b><span class="st-l">SERVES:</span><span class="st-s"></span></div>`;

    const svg = el.querySelector<SVGSVGElement>("svg")!;
    const draw = svg.querySelector<SVGGElement>(".draw")!;
    const pen = svg.querySelector<SVGGElement>(".pen")!;
    const tbody = el.querySelector<HTMLElement>(".bom tbody")!;
    const stamp = el.querySelector<HTMLElement>(".stamp")!;
    const detailImg = el.querySelector<HTMLImageElement>(".detail img")!;

    // Drawing frame with zone references (static, not re-plotted).
    const fr = svg.querySelector<SVGGElement>(".frame")!;
    let fm = `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="#e9f2ff" stroke-width="4"/>
      <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="#e9f2ff" stroke-width="2"/>`;
    for (let i = 0; i < 8; i++) {
      const x = 30 + ((W - 60) / 8) * i, cx = x + (W - 60) / 16;
      if (i) fm += `<path d="M${x} 10V30M${x} ${H - 30}V${H - 10}" stroke="#e9f2ff" stroke-width="2"/>`;
      fm += `<text class="zone" x="${cx}" y="25" text-anchor="middle">${i + 1}</text><text class="zone" x="${cx}" y="${H - 15}" text-anchor="middle">${i + 1}</text>`;
    }
    for (let i = 0; i < 4; i++) {
      const y = 30 + ((H - 60) / 4) * i, cy = y + (H - 60) / 8 + 5;
      if (i) fm += `<path d="M10 ${y}H30M${W - 30} ${y}H${W - 10}" stroke="#e9f2ff" stroke-width="2"/>`;
      fm += `<text class="zone" x="20" y="${cy}" text-anchor="middle">${"ABCD"[i]}</text><text class="zone" x="${W - 20}" y="${cy}" text-anchor="middle">${"ABCD"[i]}</text>`;
    }
    fr.innerHTML = fm;

    // Sheet selector (one sheet per recipe).
    const sheets = el.querySelector<HTMLElement>(".sheets")!;
    RECIPES.forEach((r, i) => {
      const b = document.createElement("button");
      b.innerHTML = `<img src="${ctx.base}items/${r.item}.png" alt=""><span>${r.sushi.split(" ").pop()!.toUpperCase()}</span>`;
      b.title = r.sushi;
      b.addEventListener("click", (e) => { e.stopPropagation(); if (i !== rid) { ctx.sfx("whoosh"); render(i); } });
      sheets.appendChild(b);
    });

    el.querySelector(".tb-ck")!.addEventListener("click", (e) => {
      e.stopPropagation();
      ctx.sfx("chime");
      ctx.egg("mood-v09-checked", "Checked by Jiro. Rice tolerance: plus or minus one grain.");
    });

    function setHot(i: number) {
      hot = i;
      draw.querySelectorAll<SVGGElement>(".part").forEach((g) => g.classList.toggle("hot", Number(g.dataset.i) === i));
      tbody.querySelectorAll<HTMLElement>("tr").forEach((tr) => tr.classList.toggle("hot", Number(tr.dataset.i) === i));
    }
    function hoverIn(i: number) {
      userHover = true;
      clearTimeout(resumeT);
      if (i !== hot) ctx.sfx("blip");
      setHot(i);
    }
    function hoverOut() {
      setHot(-1);
      clearTimeout(resumeT);
      resumeT = window.setTimeout(() => { userHover = false; }, 3000);
    }

    interface Step { el: SVGElement; kind: "stroke" | "grow" | "fade"; len: number; t0: number; t1: number; x1?: number; y1?: number; x2?: number; y2?: number; row?: number }
    let steps: Step[] = [];
    let start = 0;

    function render(i: number) {
      rid = i;
      const r: Recipe = RECIPES[i];
      const parts = r.ingredients.map(byId);
      const n = parts.length;
      sheets.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === i));
      el.querySelector(".tb-ti b")!.textContent = `${r.sushi.toUpperCase()} ASSY`;
      el.querySelector(".tb-sh span")!.textContent = `${i + 1} OF ${RECIPES.length}`;
      el.querySelector(".notes .n1")!.textContent = `1. WORK ORDER: "${r.order}"`;
      el.querySelector(".stamp .st-s")!.textContent = r.serves;
      detailImg.src = `${ctx.base}items/${r.item}.png`;
      stamp.classList.remove("on");
      el.querySelector(".detail")!.classList.remove("on");

      // Bill of materials, base first.
      tbody.innerHTML = parts.map((c, k) => `<tr data-i="${k}"><td><i class="num">${k + 1}</i></td><td class="role">${ROLE[c.role]}</td><td>${badgeHtml(c)}${esc(c.name)}</td><td>${esc(c.does)}</td></tr>`).join("");
      const notes = el.querySelector<HTMLElement>(".notes")!;
      notes.style.top = `${el.querySelector<HTMLElement>(".bom")!.offsetTop + el.querySelector<HTMLElement>(".bom")!.offsetHeight + 16}px`;
      tbody.querySelectorAll<HTMLElement>("tr").forEach((tr) => {
        const k = Number(tr.dataset.i);
        tr.addEventListener("mouseenter", () => hoverIn(k));
        tr.addEventListener("mouseleave", hoverOut);
      });

      // Exploded view: base at the bottom, parts float up the axis.
      const sp = Math.min(150, 460 / (n - 1));
      const mid = 344;
      const ys = parts.map((_, k) => snap(mid + (sp * (n - 1)) / 2 - k * sp));
      const geos = parts.map((c) => geo(c.role));
      let m = `<line class="pl-grow axis" x1="${AX}" y1="44" x2="${AX}" y2="${H - 44}"/>`;
      let between = "";
      // projection lines between neighbouring parts
      for (let k = 0; k < n - 1; k++) {
        const a = ys[k] + geos[k].top + 4, b = ys[k + 1] + geos[k + 1].bot - 4;
        if (a - b > 24) {
          const x = Math.min(geos[k].hw, geos[k + 1].hw) - 8;
          between += `<line class="pl-grow proj" x1="${AX - x}" y1="${a}" x2="${AX - x}" y2="${b}"/><line class="pl-grow proj" x1="${AX + x}" y1="${a}" x2="${AX + x}" y2="${b}"/>`;
          const my = snap((a + b) / 2);
          between += `<path class="pl arrow" d="M${AX - 44} ${my - 20}v16"/><path class="pl-fade fillarrow" d="M${AX - 56} ${my - 4}h24v4h-4v4h-4v4h-8v-4h-4v-4h-4z"/><path class="pl arrow" d="M${AX + 44} ${my - 20}v16"/><path class="pl-fade fillarrow" d="M${AX + 32} ${my - 4}h24v4h-4v4h-4v4h-8v-4h-4v-4h-4z"/>`;
        }
      }
      parts.forEach((c, k) => {
        const g = geos[k], y = ys[k];
        const left = k === 0 || k === n - 1 || k % 2 === 0;
        const bx = left ? BAL_L : BAL_R;
        const attach = left ? AX - g.hw + 20 : AX + g.hw - 20;
        const lx0 = left ? bx + 22 : bx - 22;
        const lab = left
          ? `${badgeSvg(c, bx + 34, y - 46)}<text class="lbl pl-fade" x="${bx + 74}" y="${y - 23}">${esc(c.name.toUpperCase())}</text><text class="sub pl-fade" x="${bx + 34}" y="${y + 30}">PT-0${k + 1} · ${ROLE[c.role]}</text>`
          : `${badgeSvg(c, bx - 64, y - 46)}<text class="lbl pl-fade" x="${bx - 74}" y="${y - 23}" text-anchor="end">${esc(c.name.toUpperCase())}</text><text class="sub pl-fade" x="${bx - 34}" y="${y + 30}" text-anchor="end">PT-0${k + 1} · ${ROLE[c.role]}</text>`;
        m += `<g class="part" data-i="${k}" style="--brand:${c.color}">
          <rect class="hit" x="${Math.min(bx, AX - g.hw) - 30}" y="${y + g.top - 8}" width="${Math.abs(bx - AX) + g.hw + 60}" height="${g.bot - g.top + 16}"/>
          <g transform="translate(${AX} ${y})">
            <path class="sil" d="${g.sil}"/>
            ${g.hidden.map((d) => `<path class="pl hidden" d="${d}"/>`).join("")}
            ${g.strokes.map((d) => `<path class="pl ln" d="${d}"/>`).join("")}
          </g>
          <path class="pl leader" d="M${lx0} ${y}H${attach}"/>
          <rect class="pl-fade dot" x="${attach - 6}" y="${y - 6}" width="12" height="12"/>
          <circle class="pl balloon" cx="${bx}" cy="${y}" r="22"/>
          <text class="bn pl-fade" x="${bx}" y="${y + 8}" text-anchor="middle">${k + 1}</text>
          <g class="pl-fade lab-g">${lab}</g>
        </g>`;
      });
      m += between;
      // overall dimension under the base
      const by = ys[0] + geos[0].bot + 22, hw0 = geos[0].hw;
      if (by < H - 40) {
        m += `<path class="pl dim" d="M${AX - hw0} ${by - 12}v24M${AX + hw0} ${by - 12}v24M${AX - hw0} ${by}H${AX + hw0}"/>
          <path class="pl-fade dimh" d="M${AX - hw0 + 2} ${by}l12 -8v16zM${AX + hw0 - 2} ${by}l-12 -8v16z"/>
          <text class="sub pl-fade dimt" x="${AX}" y="${by - 6}" text-anchor="middle">Ø 1 BITE</text>`;
      }
      // detail A callout circle on the sheet
      m += `<circle class="pl det" cx="1062" cy="${H - 136}" r="92"/>`;
      draw.innerHTML = m;

      draw.querySelectorAll<SVGGElement>(".part").forEach((pg) => {
        const k = Number(pg.dataset.i);
        pg.addEventListener("mouseenter", () => hoverIn(k));
        pg.addEventListener("mouseleave", hoverOut);
      });

      // Plot schedule: axis first, then parts from the base up, then dimension + detail.
      const els = Array.from(draw.querySelectorAll<SVGElement>(".pl, .pl-grow, .pl-fade"));
      steps = [];
            for (const e of els) {
        if (e.classList.contains("pl-fade")) { steps.push({ el: e, kind: "fade", len: 0, t0: 0, t1: 0 }); continue; }
        if (e.classList.contains("pl-grow") && e instanceof SVGLineElement) {
          const x1 = +e.getAttribute("x1")!, y1 = +e.getAttribute("y1")!, x2 = +e.getAttribute("x2")!, y2 = +e.getAttribute("y2")!;
          const len = Math.hypot(x2 - x1, y2 - y1);
          steps.push({ el: e, kind: "grow", len, t0: 0, t1: 0, x1, y1, x2, y2 });
          continue;
        }
        const len = (e as unknown as SVGGeometryElement).getTotalLength?.() ?? 100;
        const s: Step = { el: e, kind: e.classList.contains("pl-grow") ? "fade" : "stroke", len, t0: 0, t1: 0 };
        steps.push(s);
      }
      // Whole sheet plots in ~5.5 s regardless of recipe size; short strokes get a minimum dwell.
      const dur = (s: Step) => 40 + s.len;
      const scale = 5500 / steps.reduce((a, s) => a + (s.kind === "fade" ? 0 : dur(s)), 0);
      let t = 0;
      for (const s of steps) {
        const row = s.el.closest<SVGGElement>(".part");
        if (row) s.row = Number(row.dataset.i);
        if (s.kind === "fade") { s.t0 = t; s.t1 = t + 280; continue; }
        s.t0 = t; s.t1 = t + dur(s) * scale; t = s.t1;
        if (s.kind === "stroke") { s.el.style.strokeDasharray = `${s.len} ${s.len + 4}`; s.el.style.strokeDashoffset = `${s.len}`; }
      }
      for (const s of steps) {
        if (s.kind === "fade") s.el.style.opacity = "0";
        if (s.kind === "grow") { s.el.setAttribute("x2", String(s.x1)); s.el.setAttribute("y2", String(s.y1)); }
        if (s.kind !== "fade") s.el.style.opacity = "0";
      }
      tbody.querySelectorAll<HTMLElement>("tr").forEach((tr) => tr.classList.add("pend"));
      const end = t;
      start = performance.now();
      cancelAnimationFrame(raf);
      if (ctx.reducedMotion) { finish(); return; }
      pen.setAttribute("opacity", "1");
      const tick = (now: number) => {
        const e = now - start;
        let px = -1, py = -1;
        for (const s of steps) {
          const p = Math.max(0, Math.min(1, (e - s.t0) / (s.t1 - s.t0)));
          if (s.kind === "fade") { s.el.style.opacity = p > 0 ? String(Math.round(p * 4) / 4) : "0"; continue; }
          if (s.kind === "grow") {
            const x = s.x1! + (s.x2! - s.x1!) * p, y = s.y1! + (s.y2! - s.y1!) * p;
            s.el.setAttribute("x2", String(snap(x))); s.el.setAttribute("y2", String(snap(y)));
            s.el.style.opacity = p > 0 ? "1" : "0";
            if (p > 0 && p < 1) { px = x; py = y; }
            continue;
          }
          s.el.style.opacity = p > 0 ? "1" : "0";
          s.el.style.strokeDashoffset = String(s.len * (1 - p));
          if (p > 0 && p < 1) {
            const g = s.el as unknown as SVGGeometryElement;
            const pt = g.getPointAtLength(s.len * p);
            const m2 = g.getCTM(), root = svg.getCTM();
            if (m2 && root) {
              const q = new DOMPoint(pt.x, pt.y).matrixTransform(root.inverse().multiply(m2));
              px = q.x; py = q.y;
            }
          }
          if (p > 0 && s.row !== undefined) tbody.querySelector(`tr[data-i="${s.row}"]`)?.classList.remove("pend");
        }
        if (px >= 0) pen.setAttribute("transform", `translate(${snap(px)} ${snap(py)})`);
        if (e >= end + 300) { finish(); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    function finish() {
      cancelAnimationFrame(raf);
      raf = 0;
      pen.setAttribute("opacity", "0");
      for (const s of steps) {
        s.el.style.opacity = "";
        if (s.kind === "stroke") { s.el.style.strokeDasharray = ""; s.el.style.strokeDashoffset = ""; }
        if (s.kind === "grow") { s.el.setAttribute("x2", String(s.x2)); s.el.setAttribute("y2", String(s.y2)); }
      }
      tbody.querySelectorAll<HTMLElement>("tr").forEach((tr) => tr.classList.remove("pend"));
      el.querySelector(".detail")!.classList.add("on");
      stamp.classList.add("on");
      ctx.sfx("pop");
    }

    // Idle: slowly walk the highlight through the BOM so the part ↔ row link is visible.
    let cyc = 0;
    timers.push(window.setInterval(() => {
      if (userHover || raf) return;
      const n = RECIPES[rid].ingredients.length;
      cyc = (cyc + 1) % (n + 1);
      setHot(cyc === n ? -1 : cyc);
    }, 2400));

    render(0);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => clearInterval(t));
      clearTimeout(resumeT);
      el.classList.remove("mv09");
      el.innerHTML = "";
    };
  },
};
