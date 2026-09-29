import { STAGE_W, STAGE_H, type Api, type Camera, type Plate, type SceneDef, type TransitionDef, type BeltPath } from "./types";
import { drawBeltFull, hitPlate } from "./belt";
import { ITEMS, preloadItems } from "./items";
import { eggCount, eggFound, noteEgg, onEggs } from "./eggs";
import { sfx, setSound, soundOn } from "./sfx";

type Seg =
  | { kind: "scene"; id: string; def: SceneDef; start: number; len: number }
  | { kind: "tr"; id: string; def: TransitionDef; start: number; len: number };

const imgCache = new Map<string, HTMLImageElement>();
export function img(url: string): HTMLImageElement {
  let im = imgCache.get(url);
  if (!im) {
    im = new Image();
    im.src = url.startsWith("http") || url.startsWith("data:") ? url : `${import.meta.env.BASE_URL}${url.replace(/^\//, "")}`;
    imgCache.set(url, im);
  }
  return im;
}

interface Pop { x: number; y: number; t0: number; kind: "spark" | "boom" | "coin" }

export function start(scenes: SceneDef[], transitions: TransitionDef[]) {
  preloadItems();
  const byId = new Map(scenes.map((s) => [s.id, s]));
  const trs = new Map(transitions.map((t) => [`${t.from}>${t.to}`, t]));

  // Segments: scene hold, transition, scene hold, ...
  const segs: Seg[] = [];
  let acc = 0;
  scenes.forEach((s, i) => {
    segs.push({ kind: "scene", id: s.id, def: s, start: acc, len: s.hold });
    acc += s.hold;
    const next = scenes[i + 1];
    if (next) {
      const tr = trs.get(`${s.id}>${next.id}`);
      if (!tr) throw new Error(`missing transition ${s.id}>${next.id}`);
      segs.push({ kind: "tr", id: `${s.id}>${next.id}`, def: tr, start: acc, len: tr.length });
      acc += tr.length;
    }
  });
  const total = acc;

  const root = document.getElementById("app")!;
  const BASE = import.meta.env.BASE_URL;
  root.innerHTML = `
    <div id="scroll" style="height:${(total + 1) * 100}vh"></div>
    <div id="frame">
      <canvas id="stage" width="${STAGE_W}" height="${STAGE_H}"></canvas>
      <div id="ui"></div>
    </div>
    <header class="top">
      <a class="logo" href="#bar" data-goto="bar" aria-label="jiro.bot, back to the bar"><img src="${BASE}items/mini-jiro.png" alt="" width="34" height="32" /><b>jiro<span>.</span>bot</b></a>
      <a class="by" href="https://noriagentic.com" target="_blank" rel="noopener">by <em>Nori</em></a>
      <div class="top-right">
        <button class="snd${soundOn ? "" : " off"}" id="sound" aria-pressed="${soundOn}" aria-label="Sound" title="Sound on/off">
          <svg viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" d="M1 6h3v4H1zM4 5h2v6H4zM6 3h2v10H6z"/>
            <path class="w" fill="currentColor" d="M10 6h1v4h-1zM12 4h1v8h-1zM11 5h1v1h-1zM11 10h1v1h-1zM14 3h1v10h-1zM13 2h1v1h-1zM13 13h1v1h-1z"/>
            <path class="x" fill="currentColor" d="M10 5h2v2h-2zM12 7h2v2h-2zM14 5h1v2h-1zM10 9h2v2h-2zM14 9h1v2h-1z"/>
          </svg>
        </button>
        <a class="cta" href="https://noriagentic.com/" target="_blank" rel="noopener">Reserve a seat</a>
      </div>
    </header>
    <nav class="rail" aria-label="Rooms"><div class="track" aria-hidden="true"><b></b></div></nav>
    <div class="eggbox">
      <button class="eggs" id="eggs" aria-expanded="false" aria-controls="eggpop" title="Easter eggs found"></button>
      <div class="eggpop" id="eggpop" role="dialog" aria-label="Easter eggs found" hidden></div>
    </div>
    <div class="scroll-hint" aria-hidden="true"><span>scroll to follow the belt</span><i></i></div>
    <div class="toast" id="toast" role="status" aria-live="polite"><img src="${BASE}items/mini-jiro.png" alt="" /><p></p></div>
  `;
  const canvas = root.querySelector<HTMLCanvasElement>("#stage")!;
  const g = canvas.getContext("2d")!;
  const ui = root.querySelector<HTMLDivElement>("#ui")!;
  const frame = root.querySelector<HTMLDivElement>("#frame")!;
  const toastEl = root.querySelector<HTMLDivElement>("#toast")!;
  const eggsEl = root.querySelector<HTMLButtonElement>("#eggs")!;
  const toastMsg = toastEl.querySelector("p")!;
  const rail = root.querySelector<HTMLElement>(".rail")!;

  let scale = 1, ox = 0, oy = 0;
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    // Contain, but allow up to 12% crop on each axis so typical screens fill edge to edge.
    const sc = Math.max(vw / STAGE_W, vh / STAGE_H);
    const sn = Math.min(vw / STAGE_W, vh / STAGE_H);
    scale = Math.min(sc, sn * 1.12);
    ox = (vw - STAGE_W * scale) / 2;
    oy = (vh - STAGE_H * scale) / 2;
    const tf = `translate(${ox}px, ${oy}px) scale(${scale})`;
    canvas.style.transform = tf;
    ui.style.transform = tf;
  }
  addEventListener("resize", fit);
  fit();

  let toastTimer = 0;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pops: Pop[] = [];
  let scenePlates: Plate[] = [];
  let sceneBeltSize = 52;

  const api: Api = {
    egg(id, text) {
      noteEgg(id, text);
      if (eggFound(id)) {
        const [n, t] = eggCount();
        api.toast(text, 3600);
        toastEl.classList.add("egg");
        toastEl.dataset.egg = `Easter egg ${n}/${t}`;
      } else api.toast(text);
    },
    toast(text, ms = 2600) {
      toastMsg.textContent = text;
      toastEl.classList.remove("egg");
      toastEl.classList.add("on");
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toastEl.classList.remove("on"), ms);
    },
    sfx: (n) => sfx(n),
    img,
    drawScene(id, gg, now, cam) {
      const s = byId.get(id)!;
      renderScene(s, gg, now, cam, false);
    },
    drawBelt(gg, path: BeltPath, now, key = "tr") {
      return drawBeltFull(gg, path, now, key);
    },
    plateAt(x, y) {
      return hitPlate(scenePlates, sceneBeltSize, x, y);
    },
    goto(id) {
      const s = segs.find((x) => x.id === id);
      if (s) scrollTo({ top: (s.start + (s.kind === "scene" ? 0.02 : 0)) * innerHeight, behavior: reducedMotion ? "auto" : "smooth" });
    },
    toStage(cx, cy) {
      return [(cx - ox) / scale, (cy - oy) / scale];
    },
    reducedMotion,
  };

  function renderScene(s: SceneDef, gg: CanvasRenderingContext2D, now: number, cam: Camera | undefined, live: boolean) {
    gg.save();
    if (cam) {
      const z = cam.zoom ?? 1, cx = cam.cx ?? STAGE_W / 2, cy = cam.cy ?? STAGE_H / 2;
      gg.globalAlpha = cam.alpha ?? 1;
      gg.translate(STAGE_W / 2 + (cam.dx ?? 0), STAGE_H / 2 + (cam.dy ?? 0));
      if (cam.rot) gg.rotate(cam.rot);
      gg.scale(z, z);
      gg.translate(-cx, -cy);
    }
    const art = img(s.art);
    if (art.complete && art.naturalWidth) gg.drawImage(art, 0, 0, STAGE_W, STAGE_H);
    else { gg.fillStyle = "#0b0a09"; gg.fillRect(0, 0, STAGE_W, STAGE_H); }
    s.under?.(gg, now, api);
    const plates = drawBeltFull(gg, s.belt, now, s.id);
    if (live) { scenePlates = plates; sceneBeltSize = s.belt.plate ?? 52; }
    s.over?.(gg, now, api);
    gg.restore();
  }

  // Scene DOM layers.
  const layers = new Map<string, HTMLDivElement>();
  for (const seg of segs) {
    const el = document.createElement("div");
    el.className = seg.kind === "scene" ? "layer scene-ui" : "layer tr-ui";
    el.dataset.id = seg.id;
    ui.appendChild(el);
    layers.set(seg.id, el);
    if (seg.kind === "scene") seg.def.mount?.(el, api);
    else seg.def.mount?.(el, api);
  }

  // Side rail.
  scenes.forEach((s) => {
    const b = document.createElement("button");
    b.dataset.goto = s.id;
    b.setAttribute("aria-label", `Go to the ${s.room}`);
    b.innerHTML = `<i></i><span>${s.room}</span>`;
    rail.appendChild(b);
  });
  root.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
    if (t) { e.preventDefault(); api.goto(t.dataset.goto!); }
  });

  function renderEggs() {
    const [n, t] = eggCount();
    eggsEl.innerHTML = `<i class="star" aria-hidden="true"></i><span class="n"><b>${n}</b>/${t}</span><span class="l">easter eggs</span>`;
    eggsEl.setAttribute("aria-label", `${n} of ${t} easter eggs found`);
  }
  onEggs(renderEggs);
  renderEggs();
  const soundBtn = root.querySelector<HTMLButtonElement>("#sound")!;
  soundBtn.addEventListener("click", () => {
    setSound(!soundOn);
    soundBtn.classList.toggle("off", !soundOn);
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    if (soundOn) sfx("chime");
  });

  // Canvas clicks: plates first, then the scene.
  let active: Seg = segs[0];
  const said = new Map<string, number>();
  frame.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("#ui .hit, #ui button, #ui a, #ui input")) return;
    if (active.kind !== "scene") return;
    const [x, y] = api.toStage(e.clientX, e.clientY);
    const s = active.def;
    const p = api.plateAt(x, y);
    if (p) {
      if (s.plateClick?.(p, api)) return;
      const def = ITEMS[p.item];
      const k = (said.get(p.item) ?? 0);
      said.set(p.item, k + 1);
      const line = def.say[k % def.say.length];
      api.sfx(def.sfx ?? "pop");
      pops.push({ x: p.x, y: p.y - 30 * p.s, t0: performance.now() / 1000, kind: def.sfx === "boom" ? "boom" : def.sfx === "coin" ? "coin" : "spark" });
      if (def.egg) api.egg(def.egg, line); else api.toast(line);
      return;
    }
    s.click?.(x, y, api);
  });
  frame.addEventListener("mousemove", (e) => {
    if (active.kind !== "scene") return;
    const [x, y] = api.toStage(e.clientX, e.clientY);
    frame.classList.toggle("over-plate", !!api.plateAt(x, y));
  });

  addEventListener("keydown", (e) => {
    const tgt = e.target as HTMLElement;
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (tgt.closest("input, textarea, select, [contenteditable]")) return;
    // Let focused buttons/links handle their own Space/Enter.
    if ((e.key === " " || e.key === "Enter") && tgt.closest("button, a")) return;
    const sceneIdx = scenes.findIndex((s) => s.id === (active.kind === "scene" ? active.id : (active.def as TransitionDef).from));
    if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
      const nxt = scenes[Math.min(scenes.length - 1, sceneIdx + 1)];
      if (nxt) { e.preventDefault(); api.goto(nxt.id); }
    } else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
      const cur = active.kind === "scene" ? sceneIdx - 1 : sceneIdx;
      const prv = scenes[Math.max(0, cur)];
      if (prv) { e.preventDefault(); api.goto(prv.id); }
    } else if (e.key === "Home") {
      e.preventDefault(); api.goto(scenes[0].id);
    } else if (e.key === "End") {
      e.preventDefault(); api.goto(scenes[scenes.length - 1].id);
    } else if (/^[1-9]$/.test(e.key) && scenes[+e.key - 1]) {
      api.goto(scenes[+e.key - 1].id);
    }
  });

  // Hash deep links (#kitchen).
  if (location.hash.length > 1) setTimeout(() => api.goto(location.hash.slice(1)), 50);

  let shown = scrollY / innerHeight;
  let lastScene = "";
  const q = new URLSearchParams(location.search);
  const fixedT = q.get("t"); // ?t=seconds freezes time (for screenshots)
  const segQ = q.get("seg"); // ?seg=bar>office&tt=0.5 renders a segment at local progress tt (for screenshots)
  const segHit = segQ ? segs.find((s) => s.id === segQ) : undefined;
  const fixedP = segHit ? String(segHit.start + Math.min(0.9999, parseFloat(q.get("tt") ?? "0.5")) * segHit.len) : q.get("p"); // ?p=scroll position in viewport heights
  (window as any).__segs = segs.map((s) => ({ id: s.id, start: s.start, len: s.len }));

  function tick() {
    const now = fixedT ? parseFloat(fixedT) : performance.now() / 1000;
    const target = fixedP ? parseFloat(fixedP) : scrollY / innerHeight;
    shown += (target - shown) * (reducedMotion || fixedP ? 1 : 0.18);
    if (Math.abs(target - shown) < 0.0005) shown = target;
    const p = Math.max(0, Math.min(total - 0.0001, shown));
    const seg = segs.find((s) => p >= s.start && p < s.start + s.len) ?? segs[segs.length - 1];
    active = seg;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = true;
    if (seg.kind === "scene") {
      renderScene(seg.def, g, now, undefined, true);
    } else {
      const t = Math.max(0, Math.min(1, (p - seg.start) / seg.len));
      g.save();
      seg.def.render(g, t, now, api);
      g.restore();
      seg.def.update?.(layers.get(seg.id)!, t, now, api);
    }

    // Plate click pops.
    const tn = performance.now() / 1000;
    for (let i = pops.length - 1; i >= 0; i--) {
      const pp = pops[i], a = tn - pp.t0;
      if (a > 0.7 || seg.kind !== "scene") { pops.splice(i, 1); continue; }
      g.save();
      g.globalAlpha = 1 - a / 0.7;
      g.fillStyle = pp.kind === "boom" ? "#ff9d3a" : pp.kind === "coin" ? "#ffd84a" : "#f3e6cf";
      const r = 10 + a * 70;
      for (let k = 0; k < 8; k++) {
        const an = (k / 8) * Math.PI * 2;
        g.fillRect(Math.round(pp.x + Math.cos(an) * r) - 3, Math.round(pp.y + Math.sin(an) * r * 0.7) - 3, 6, 6);
      }
      g.restore();
    }

    // DOM layer visibility.
    const curScene = seg.kind === "scene" ? seg.id : "";
    for (const s of segs) {
      const el = layers.get(s.id)!;
      let o = 0;
      if (s === seg) o = 1;
      if (seg.kind === "tr") {
        const t = (p - seg.start) / seg.len;
        const d = seg.def as TransitionDef;
        if (s.id === d.from) o = 1 - smooth(0, 0.12, t);
        if (s.id === d.to) o = smooth(0.88, 1, t);
      }
      el.style.opacity = String(o);
      el.style.visibility = o > 0.01 ? "visible" : "hidden";
      el.classList.toggle("live", o > 0.5);
    }
    if (curScene !== lastScene) {
      if (lastScene) byId.get(lastScene)?.leave?.(api);
      if (curScene) byId.get(curScene)?.enter?.(api);
      lastScene = curScene;
      rail.querySelectorAll<HTMLElement>("button").forEach((b) => {
        const on = b.dataset.goto === curScene;
        b.classList.toggle("on", on);
        if (on) b.setAttribute("aria-current", "location"); else b.removeAttribute("aria-current");
      });
      if (curScene && history.replaceState) history.replaceState(null, "", `#${curScene}`);
    }
    document.body.dataset.segment = seg.id;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return api;
}

export function smooth(a: number, b: number, t: number) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

export function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
