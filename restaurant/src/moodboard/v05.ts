import { CONNECTORS, RECIPES, byId, type MoodVersion, type Recipe } from "./data";
import "./v05.css";

// v05 — Tokyo metro map. Every MCP connector is a subway line in its brand colour,
// every recipe is an interchange station. Pick a station: the lines that serve it
// light up, little trains roll in, and the dish assembles on the platform.

const NS = "http://www.w3.org/2000/svg";
const MAP_W = 1160;
const MAP_H = 620;
const TERM_X = 196; // where lines leave the terminus badges
const SLOT = 16; // spacing of parallel lines through a station
const LINE_W = 8;

/** Terminus order top → bottom, picked so the lines barely cross. */
const ORDER = ["github", "linear", "slack", "sentry", "jira", "notion", "gdrive", "hubspot", "gmail", "stripe", "postgres"];
const CODE: Record<string, string> = {
  github: "GH", linear: "LN", slack: "SL", sentry: "SE", jira: "JR", notion: "NO",
  gdrive: "GD", hubspot: "HS", gmail: "GM", stripe: "ST", postgres: "PG",
};
/** Station positions along the map (left → right staircase). */
const STATIONS: Record<string, { x: number; cy: number; no: string; label: "above" | "right" }> = {
  standup: { x: 340, cy: 118, no: "N01", label: "above" },
  bugfix: { x: 505, cy: 200, no: "N02", label: "above" },
  incident: { x: 670, cy: 296, no: "N03", label: "above" },
  leads: { x: 830, cy: 390, no: "N04", label: "above" },
  billing: { x: 975, cy: 512, no: "N05", label: "right" },
};
/** Legs that take their 45° dog-leg right after leaving the previous station. */
const EARLY = new Set(["notion:billing"]);
const STATION_ORDER = ["standup", "bugfix", "incident", "leads", "billing"];

const termY = (i: number) => 44 + i * 54;
const TRAVEL = 6; // seconds a train takes from terminus to platform (slow)
const DEPART_GAP = 0.9;
const CYCLE = 18;

type Pt = [number, number];

function slotY(stationId: string, lineId: string) {
  const r = RECIPES.find((q) => q.id === stationId)!;
  const members = ORDER.filter((l) => r.ingredients.includes(l));
  const k = members.length;
  return STATIONS[stationId].cy + (members.indexOf(lineId) - (k - 1) / 2) * SLOT;
}

/** Octilinear route: horizontal, one 45° dog-leg, arrive horizontally. */
function leg(from: Pt, to: Pt, early = false): Pt[] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dy = y2 - y1;
  if (dy === 0) return [to];
  if (early) {
    const a = x1 + 20;
    const b = a + Math.abs(dy);
    return [[a, y1], [b, y2], [x2, y2]];
  }
  const end = x2 - 34;
  const start = Math.max(x1 + 16, end - Math.abs(dy));
  const run = end - start;
  const reach = Math.min(Math.abs(dy), run);
  const ym = y1 + Math.sign(dy) * reach;
  return [[start, y1], [end, ym], ...(ym !== y2 ? [[end + 4, y2] as Pt] : []), [x2, y2]];
}

interface Line { id: string; pts: Pt[]; stopIdx: Record<string, number>; }

function buildLines(): Line[] {
  return ORDER.map((id, i) => {
    const pts: Pt[] = [[TERM_X, termY(i)]];
    const stopIdx: Record<string, number> = {};
    for (const s of STATION_ORDER) {
      const r = RECIPES.find((q) => q.id === s)!;
      if (!r.ingredients.includes(id)) continue;
      pts.push(...leg(pts[pts.length - 1], [STATIONS[s].x, slotY(s, id)], EARLY.has(`${id}:${s}`)));
      stopIdx[s] = pts.length - 1;
    }
    const last = pts[pts.length - 1];
    pts.push([last[0] + 18, last[1]]);
    return { id, pts, stopIdx };
  });
}

function lenOf(pts: Pt[]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
function pointAt(pts: Pt[], d: number): { x: number; y: number; a: number } {
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const s = Math.hypot(bx - ax, by - ay);
    if (d <= s || i === pts.length - 1) {
      const f = s === 0 ? 0 : Math.min(1, d / s);
      return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, a: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI };
    }
    d -= s;
  }
  const p = pts[pts.length - 1];
  return { x: p[0], y: p[1], a: 0 };
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

/** Chamfered pixel capsule (station marker). */
function pill(x: number, y: number, w: number, h: number) {
  const c = 4;
  return `${x + c},${y} ${x + w - c},${y} ${x + w},${y + c} ${x + w},${y + h - c} ${x + w - c},${y + h} ${x + c},${y + h} ${x},${y + h - c} ${x},${y + c}`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const v05: MoodVersion = {
  n: 5,
  title: "Nori Metro",
  pitch: "A Tokyo subway map: every MCP connector is a line, every dish an interchange. Pick a station and watch the trains deliver its ingredients.",
  mount(el, ctx) {
    const root = document.createElement("div");
    root.className = "mv05";
    el.appendChild(root);
    const lines = buildLines();

    // ---------- map ----------
    const map = svg("svg", { class: "map", viewBox: `0 0 ${MAP_W} ${MAP_H}`, width: MAP_W, height: MAP_H, "shape-rendering": "crispEdges" }, root);
    const defs = svg("defs", {}, map);
    defs.innerHTML = `
      <pattern id="mv05-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="2" height="2" fill="rgba(243,230,207,.07)"/>
      </pattern>
      <pattern id="mv05-water" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#101a24"/><rect x="0" y="0" width="4" height="2" fill="#15222f"/><rect x="4" y="4" width="4" height="2" fill="#15222f"/>
      </pattern>`;
    svg("rect", { x: 0, y: 0, width: MAP_W, height: MAP_H, fill: "url(#mv05-grid)" }, map);
    // Sumida river: a quiet stepped band crossing the map.
    const river = svg("polygon", {
      class: "river",
      points: "330,620 370,580 560,580 600,556 860,556 900,572 1160,572 1160,604 900,604 860,588 600,588 560,612 370,612 362,620",
      fill: "url(#mv05-water)",
    }, map);
    svg("text", { x: 640, y: 579, class: "river-t" }, map).textContent = "SUMIDA";

    const gLines = svg("g", {}, map);
    const gHl = svg("g", { class: "hl" }, map);
    const gTrains = svg("g", {}, map);
    const gStations = svg("g", {}, map);

    const lineEls: Record<string, SVGGElement> = {};
    for (const L of lines) {
      const c = byId(L.id);
      const g = svg("g", { class: "line", "data-line": L.id }, gLines);
      const d = "M" + L.pts.map((p) => p.join(",")).join(" L");
      svg("path", { d, fill: "none", stroke: "#0b0a09", "stroke-width": LINE_W + 6, "stroke-linejoin": "miter", "stroke-linecap": "square" }, g);
      svg("path", { d, fill: "none", stroke: c.color, "stroke-width": LINE_W, "stroke-linejoin": "miter", "stroke-linecap": "square" }, g);
      lineEls[L.id] = g;
    }

    // Terminus badges (HTML, sharp text).
    const termWrap = document.createElement("div");
    termWrap.className = "termini";
    root.appendChild(termWrap);
    const termEls: Record<string, HTMLElement> = {};
    ORDER.forEach((id, i) => {
      const c = byId(id);
      const b = document.createElement("div");
      b.className = "term";
      b.style.top = `${termY(i) - 20}px`;
      b.style.setProperty("--c", c.color);
      b.title = `${c.name} MCP: ${c.does}`;
      b.innerHTML = `<i>${CODE[id]}</i><span>${esc(c.name)}</span>`;
      termWrap.appendChild(b);
      termEls[id] = b;
    });

    // Stations.
    const stationEls: Record<string, SVGGElement> = {};
    const labelEls: Record<string, HTMLElement> = {};
    const labels = document.createElement("div");
    labels.className = "labels";
    root.appendChild(labels);
    for (const s of STATION_ORDER) {
      const r = RECIPES.find((q) => q.id === s)!;
      const S = STATIONS[s];
      const k = r.ingredients.length;
      const h = (k - 1) * SLOT + 28;
      const g = svg("g", { class: "station", "data-st": s }, gStations);
      svg("polygon", { points: pill(S.x - 15, S.cy - h / 2, 30, h), fill: "#f3e6cf", stroke: "#0b0a09", "stroke-width": 5 }, g);
      svg("rect", { x: S.x - 15, y: S.cy - h / 2 - 1, width: 30, height: 4, fill: "#fff8ea" }, g);
      const hit = svg("rect", { x: S.x - 40, y: S.cy - h / 2 - 50, width: 80, height: h + 100, fill: "transparent", class: "hit" }, g);
      hit.addEventListener("click", (e) => { e.stopPropagation(); select(s, true); });
      stationEls[s] = g;
      const lab = document.createElement("button");
      lab.className = `st-label ${S.label}`;
      const cut = r.sushi.lastIndexOf(" ");
      lab.innerHTML = `<i>${S.no}</i><b>${esc(r.sushi.slice(0, cut))}<br>${esc(r.sushi.slice(cut + 1))}</b>`;
      lab.style.left = `${S.x + 22}px`;
      lab.style.top = S.label === "above" ? `${S.cy - h / 2 - 4}px` : `${S.cy}px`;
      lab.addEventListener("click", (e) => { e.stopPropagation(); select(s, true); });
      labels.appendChild(lab);
      labelEls[s] = lab;
    }

    // Map title plate.
    const title = document.createElement("div");
    title.className = "map-title";
    title.innerHTML = `<b>NORI METRO</b><span>MCP lines · all trains stop at Jiro</span>`;
    root.appendChild(title);

    river.addEventListener("click", (e) => { e.stopPropagation(); ctx.sfx("bonk"); ctx.egg("mv05-river", "A plate fell off the Linear line into the Sumida. Jiro filed a ticket for it."); });

    // Station picker along the bottom.
    const picker = document.createElement("nav");
    picker.className = "picker";
    root.appendChild(picker);
    const pickEls: Record<string, HTMLButtonElement> = {};
    for (const s of STATION_ORDER) {
      const r = RECIPES.find((q) => q.id === s)!;
      const b = document.createElement("button");
      b.innerHTML = `<i>${STATIONS[s].no}</i><span>${esc(r.sushi)}</span><em>${r.ingredients.map((id) => `<u style="background:${byId(id).color}"></u>`).join("")}</em>`;
      b.title = `${r.sushi}: ${r.serves}`;
      b.addEventListener("click", (e) => { e.stopPropagation(); select(s, true); });
      picker.appendChild(b);
      pickEls[s] = b;
    }

    // ---------- right panel ----------
    const panel = document.createElement("aside");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="sign">
        <div class="sign-top"><i class="sign-no"></i><b class="sign-name"></b></div>
        <div class="sign-stripe"></div>
        <p class="sign-serves"><span>serves</span><em></em></p>
      </div>
      <div class="platform">
        <p class="announce"><span>ORDER</span><em></em></p>
        <div class="stack"></div>
        <img class="dish" alt="">
        <p class="ready"><span>READY</span><em></em></p>
        <div class="plate"></div>
        <div class="tenji"></div>
      </div>
      <div class="board">
        <div class="board-h"><span>Arriving lines</span><span>status</span></div>
        <ol class="rows"></ol>
      </div>`;
    root.appendChild(panel);
    const q = <T extends Element>(s: string) => panel.querySelector<T>(s)!;
    const signNo = q<HTMLElement>(".sign-no");
    const signName = q<HTMLElement>(".sign-name");
    const signStripe = q<HTMLElement>(".sign-stripe");
    const signServes = q<HTMLElement>(".sign-serves em");
    const announce = q<HTMLElement>(".announce em");
    const stack = q<HTMLElement>(".stack");
    const dish = q<HTMLImageElement>(".dish");
    const rows = q<HTMLElement>(".rows");
    const ready = q<HTMLElement>(".ready");
    const readyTxt = q<HTMLElement>(".ready em");

    // ---------- selection + animation state ----------
    let cur: Recipe = RECIPES[0];
    let trains: { g: SVGGElement; pts: Pt[]; len: number; dep: number }[] = [];
    let slabs: HTMLElement[] = [];
    let statusEls: HTMLElement[] = [];
    let t0 = performance.now();
    let raf = 0;

    function select(id: string, user: boolean) {
      cur = RECIPES.find((r) => r.id === id)!;
      if (user) ctx.sfx("blip");
      const S = STATIONS[id];
      root.classList.add("focus");
      for (const L of lines) {
        const on = cur.ingredients.includes(L.id);
        lineEls[L.id].classList.toggle("on", on);
        termEls[L.id].classList.toggle("on", on);
      }
      for (const s of STATION_ORDER) {
        stationEls[s].classList.toggle("on", s === id);
        labelEls[s].classList.toggle("on", s === id);
        pickEls[s].classList.toggle("on", s === id);
      }
      signNo.textContent = S.no;
      signName.textContent = cur.sushi;
      signStripe.innerHTML = cur.ingredients.map((c) => `<u style="background:${byId(c).color}"></u>`).join("");
      signServes.textContent = cur.serves;
      announce.textContent = cur.order;
      readyTxt.textContent = `${cur.sushi}, platform ${S.no}`;
      dish.src = `${ctx.base}items/${cur.item}.png`;
      dish.alt = cur.sushi;
      // Layers bottom-up in assembly order (base first).
      stack.innerHTML = "";
      slabs = cur.ingredients.map((cid, i) => {
        const c = byId(cid);
        const s = document.createElement("div");
        s.className = "slab";
        s.style.setProperty("--c", c.color);
        s.style.bottom = `${i * 30}px`;
        s.innerHTML = `<u></u><span>${esc(c.name)}</span><em>${c.role}</em>`;
        stack.appendChild(s);
        return s;
      });
      rows.innerHTML = "";
      statusEls = cur.ingredients.map((cid) => {
        const c = byId(cid);
        const li = document.createElement("li");
        li.style.setProperty("--c", c.color);
        li.innerHTML = `<i>${CODE[cid]}</i><div><b>${esc(c.name)}</b><span>${esc(c.does)}</span></div><em></em>`;
        rows.appendChild(li);
        return li.querySelector("em")!;
      });
      // Highlight only the stretch of each line that runs into this station.
      gHl.innerHTML = "";
      for (const cid of cur.ingredients) {
        const L = lines.find((l) => l.id === cid)!;
        const d = "M" + L.pts.slice(0, L.stopIdx[id] + 1).map((p) => p.join(",")).join(" L");
        svg("path", { d, fill: "none", stroke: "#0b0a09", "stroke-width": LINE_W + 6, "stroke-linejoin": "miter", "stroke-linecap": "square" }, gHl);
      }
      for (const cid of cur.ingredients) {
        const L = lines.find((l) => l.id === cid)!;
        const d = "M" + L.pts.slice(0, L.stopIdx[id] + 1).map((p) => p.join(",")).join(" L");
        svg("path", { d, fill: "none", stroke: byId(cid).color, "stroke-width": LINE_W, "stroke-linejoin": "miter", "stroke-linecap": "square" }, gHl);
      }
      // Trains.
      gTrains.innerHTML = "";
      trains = cur.ingredients.map((cid, i) => {
        const L = lines.find((l) => l.id === cid)!;
        const pts = L.pts.slice(0, L.stopIdx[id] + 1);
        const g = svg("g", { class: "train" }, gTrains);
        const col = byId(cid).color;
        svg("rect", { x: -17, y: -8, width: 34, height: 16, fill: "#0b0a09" }, g);
        svg("rect", { x: -15, y: -6, width: 30, height: 12, fill: col }, g);
        svg("rect", { x: -11, y: -3, width: 6, height: 4, fill: "#f3e6cf" }, g);
        svg("rect", { x: -3, y: -3, width: 6, height: 4, fill: "#f3e6cf" }, g);
        svg("rect", { x: 7, y: -3, width: 8, height: 6, fill: "#fff8ea" }, g);
        svg("rect", { x: -15, y: 3, width: 30, height: 3, fill: "rgba(0,0,0,.35)" }, g);
        g.setAttribute("opacity", "0");
        return { g, pts, len: lenOf(pts), dep: 0.4 + i * DEPART_GAP };
      });
      t0 = performance.now();
      cancelAnimationFrame(raf);
      frame(t0);
    }

    function frame(now: number) {
      let t = ((now - t0) / 1000) % CYCLE;
      if (ctx.reducedMotion) t = CYCLE - 3;
      const k = trains.length;
      const done = trains[k - 1].dep + TRAVEL + 0.8;
      trains.forEach((tr, i) => {
        const u = (t - tr.dep) / TRAVEL;
        const arrived = u >= 1;
        if (u < 0 || t > CYCLE - 1.2) tr.g.setAttribute("opacity", "0");
        else {
          const p = pointAt(tr.pts, ease(Math.min(1, u)) * tr.len);
          tr.g.setAttribute("opacity", arrived ? String(Math.max(0, 1 - (t - tr.dep - TRAVEL) / 1.2)) : "1");
          tr.g.setAttribute("transform", `translate(${Math.round(p.x)},${Math.round(p.y)}) rotate(${p.a})`);
        }
        slabs[i].classList.toggle("in", arrived);
        slabs[i].classList.toggle("packed", t > done);
        const eta = Math.ceil(tr.dep + TRAVEL - t);
        statusEls[i].textContent = arrived ? "arrived" : t < tr.dep ? "waiting" : `${eta} s`;
        statusEls[i].className = arrived ? "arr" : "";
      });
      dish.classList.toggle("in", t > done && t < CYCLE - 0.8);
      ready.classList.toggle("in", t > done + 0.5 && t < CYCLE - 0.8);
      stack.classList.toggle("out", t > CYCLE - 0.8);
      if (!ctx.reducedMotion) raf = requestAnimationFrame(frame);
    }

    select(RECIPES[0].id, false);
    return () => {
      cancelAnimationFrame(raf);
      el.innerHTML = "";
    };
  },
};

// Keep CONNECTORS referenced so every connector in the shared list gets a line.
void CONNECTORS;
