import { mountBelt, type Mapping } from "./beltView";
import { buildRoute, routePoints, BELT_W, BEND_R, HIDDEN, type Pt } from "./belt/route";
import { createJourney } from "./belt/motion";
import { createEggs, say, type Egg } from "./eggs";
import { BANDS, STOP_H, STOPS, WORLD_W, stopTop, type StopId } from "./layout";
import { mountScene, type SceneDef } from "./scene";
import { initCompare, initDemo } from "./content";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => innerWidth <= 760;
const BUILT: StopId[] = ["hero", "product", "compare"];
const REST = 4;

const BELT_EGGS: Egg[] = [
  { id: "plate-poke", name: "Poked a plate", scene: "belt" },
  { id: "table-for-one", name: "Table for one", scene: "belt" },
  { id: "fortune", name: "Read a fortune", scene: "belt" },
  { id: "belt-romance", name: "Belt romance", scene: "belt" },
  { id: "overboard", name: "Plate overboard", scene: "belt" },
  { id: "alive-breathing-onigiri", name: "The onigiri is breathing", scene: "belt" },
  { id: "alive-waving-ebi", name: "Waved back at the ebi", scene: "belt" },
  { id: "alive-shivering-jelly", name: "Nervous pudding", scene: "belt" },
  { id: "alive-blinking-maki", name: "Staring contest", scene: "belt" },
  { id: "alive-legged-maki", name: "Maki with legs", scene: "belt" },
  { id: "demo-pr", name: "Got a PR back from Jiro", scene: "product" },
];

async function boot() {
  const stage = document.getElementById("stage")!;
  const loadDef = async (id: string): Promise<SceneDef | undefined> => {
    const r = await fetch(`art/${id}/scene.json`);
    return r.ok ? r.json() : undefined;
  };
  const sceneDefs: Partial<Record<StopId, SceneDef>> = {};
  for (const id of BUILT) sceneDefs[id] = await loadDef(id);
  const bandDefs = await Promise.all(BUILT.slice(0, -1).map((_, i) => loadDef(`band${i}`)));

  // ---------------------------------------------------------------- layout: world art px → page CSS px
  let s = innerWidth / WORLD_W;
  const copyH: Partial<Record<StopId, number>> = {};
  const offsetAt = (wy: number) => {
    let off = 0;
    for (const id of BUILT) if (wy >= stopTop(id)) off += copyH[id] ?? 0;
    return off;
  };
  const map: Mapping = {
    get s() { return s; },
    worldToPage: (p: Pt) => ({ x: p.x * s, y: Math.round(p.y * s + offsetAt(p.y)) }),
    pageToWorld: (p: Pt) => {
      // A point on a stacked copy block (narrow screens) is not in the art at all.
      for (const id of BUILT) {
        const top = Math.round(stopTop(id) * s + offsetAt(stopTop(id)));
        if (p.y >= top - (copyH[id] ?? 0) && p.y < top) return { x: p.x / s, y: NaN };
      }
      let wy = p.y / s;
      for (let k = 0; k < 3; k++) wy = (p.y - offsetAt(wy)) / s;
      return { x: p.x / s, y: wy };
    },
  };
  const lastBuilt = BUILT[BUILT.length - 1];
  const worldEnd = stopTop(lastBuilt) + STOP_H;

  const scenes = new Map<StopId, Awaited<ReturnType<typeof mountScene>>>();
  let eggsReady = false;
  const stopEls = new Map<StopId, HTMLElement>();
  for (const id of BUILT) {
    const el = stage.querySelector<HTMLElement>(`[data-stop="${id}"]`)!;
    stopEls.set(id, el);
    const c = document.createElement("canvas");
    c.className = "scene";
    c.dataset.scene = id;
    el.prepend(c);
  }
  const bandEls: HTMLElement[] = [];
  for (let i = 0; i < BUILT.length - 1; i++) {
    const b = document.createElement("div");
    b.className = "band";
    b.dataset.band = String(i);
    const c = document.createElement("canvas");
    c.className = "scene";
    b.appendChild(c);
    stage.appendChild(b);
    bandEls.push(b);
  }

  function layout() {
    s = innerWidth / WORLD_W;
    document.documentElement.style.setProperty("--s", `${s}px`);
    for (const id of BUILT) {
      const el = stopEls.get(id)!;
      const copy = el.querySelector<HTMLElement>(".copy");
      copyH[id] = narrow() && copy ? copy.offsetHeight : 0;
    }
    for (const id of BUILT) {
      const el = stopEls.get(id)!;
      const top = map.worldToPage({ x: 0, y: stopTop(id) }).y - (copyH[id] ?? 0);
      el.style.top = `${top}px`;
      el.style.height = `${Math.round(STOP_H * s) + (copyH[id] ?? 0)}px`;
      const c = el.querySelector<HTMLCanvasElement>("canvas.scene")!;
      c.style.inset = "auto";
      c.style.top = `${copyH[id] ?? 0}px`;
      c.style.left = "0";
      c.style.width = "100%";
      c.style.height = `${Math.round(STOP_H * s)}px`;
    }
    bandEls.forEach((b, i) => {
      const y0 = map.worldToPage({ x: 0, y: stopTop(STOPS[i]) + STOP_H }).y;
      b.style.top = `${y0}px`;
      b.style.height = `${Math.round(BANDS[i] * s)}px`;
    });
    const lastTop = map.worldToPage({ x: 0, y: stopTop(lastBuilt) }).y;
    stage.style.height = `${Math.max(map.worldToPage({ x: 0, y: worldEnd }).y, lastTop + innerHeight)}px`;
    if (eggsReady) placeAllEggs();
  }

  // ---------------------------------------------------------------- scenes
  for (const id of BUILT) {
    const def = sceneDefs[id];
    const canvas = stopEls.get(id)!.querySelector<HTMLCanvasElement>("canvas.scene")!;
    if (def) scenes.set(id, await mountScene(canvas, `art/${id}`, def, reduced));
    else paintPlaceholder(canvas);
  }
  const bandScenes: Awaited<ReturnType<typeof mountScene>>[] = [];
  for (const [i, b] of bandEls.entries()) {
    const def = bandDefs[i];
    if (def) bandScenes[i] = await mountScene(b.querySelector("canvas")!, `art/band${i}`, def, reduced);
    else paintPlaceholder(b.querySelector("canvas")!);
  }

  // ---------------------------------------------------------------- eggs
  const sceneEggs: Egg[] = [];
  for (const [id, sc] of scenes) for (const e of sc.def.eggs ?? []) sceneEggs.push({ id: `${id}-${e.id}`, name: e.name, scene: id });
  bandScenes.forEach((sc, i) => { for (const e of sc?.def.eggs ?? []) sceneEggs.push({ id: `band${i}-${e.id}`, name: e.name, scene: `band${i}` }); });
  const eggs = createEggs([...sceneEggs, ...BELT_EGGS]);

  function placeEggs(key: string, def: SceneDef, el: HTMLElement, sc: Awaited<ReturnType<typeof mountScene>>, top: number) {
    for (const e of def.eggs ?? []) {
      let b = el.querySelector<HTMLButtonElement>(`[data-egg="${e.id}"]`);
      if (!b) {
        b = document.createElement("button");
        b.className = "egg";
        b.type = "button";
        b.dataset.egg = e.id;
        b.dataset.scene = key;
        b.setAttribute("aria-label", "Something here");
        const btn = b;
        b.addEventListener("click", () => {
          sc.poke(e.sprite ?? e.id, performance.now());
          if (e.says?.length) {
            const r = btn.getBoundingClientRect();
            say(e.says[Math.floor(Math.random() * e.says.length)], r.left + r.width / 2 + scrollX, r.top + scrollY - 4);
          }
          eggs.find(`${key}-${e.id}`);
        });
        el.appendChild(b);
      }
      Object.assign(b.style, { left: `${e.x * s}px`, top: `${top + e.y * s}px`, width: `${e.w * s}px`, height: `${e.h * s}px` });
    }
  }
  function placeAllEggs() {
    for (const [id, sc] of scenes) placeEggs(id, sc.def, stopEls.get(id)!, sc, copyH[id] ?? 0);
    bandScenes.forEach((sc, i) => sc && placeEggs(`band${i}`, sc.def, bandEls[i], sc, 0));
  }

  eggsReady = true;
  initDemo((n) => { if (n === 3) eggs.find("demo-pr"); });
  initCompare(reduced);
  layout();

  // ---------------------------------------------------------------- belt
  const journey = createJourney({ restSpeed: reduced ? REST * 0.25 : REST });
  const heroBottom = () => map.worldToPage({ x: 0, y: STOP_H - 10 }).y;
  const buildPageRoute = () => {
    const pts = routePoints().map(map.worldToPage);
    // Below the last built stop the belt runs on toward stops that are not drawn yet.
    const unbuilt = { x: -100, y: worldEnd, w: WORLD_W + 200, h: 1e6 };
    const hidden = [...HIDDEN, unbuilt].map((r) => {
      const a = map.worldToPage({ x: r.x, y: r.y }), b = map.worldToPage({ x: r.x + r.w, y: r.y + r.h });
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    });
    return buildRoute(pts, BEND_R * s, BELT_W * s, hidden);
  };
  const surfaces = () => [
    ...[...scenes].flatMap(([id, sc]) => (sc.def.surfaces ?? []).map((r) => ({ ...r, id: `${id}-${r.id}`, y: r.y + stopTop(id) }))),
    ...bandScenes.flatMap((sc, i) => (sc?.def.surfaces ?? []).map((r) => ({ ...r, id: `band${i}-${r.id}`, y: r.y + stopTop(STOPS[i]) + STOP_H }))),
  ];
  const deps = {
    canvas: document.getElementById("belt") as HTMLCanvasElement,
    route: buildPageRoute(),
    map,
    journey,
    seed: 20261001,
    reduced,
    bedOnly: (p: Pt) => p.y < heroBottom(),
    upright: (p: Pt) => p.y < heroBottom(),
    surfaces,
    water: () => [],
    onEgg: (id: string) => eggs.find(id),
    onSay: (text: string, p: Pt) => say(text, p.x, p.y),
  };
  const belt = await mountBelt(deps);

  const relayout = () => { layout(); deps.route = buildPageRoute(); belt.resize(); };
  addEventListener("resize", relayout);
  // Copy blocks set the mobile layout; they change height when the web fonts arrive.
  const copyObserver = new ResizeObserver(() => {
    if (!narrow()) return;
    const changed = BUILT.some((id) => (stopEls.get(id)!.querySelector<HTMLElement>(".copy")?.offsetHeight ?? 0) !== (copyH[id] ?? 0));
    if (changed) relayout();
  });
  stage.querySelectorAll(".copy").forEach((el) => copyObserver.observe(el));

  // ---------------------------------------------------------------- scroll: belt first, then the scene
  let expectY: number | null = null; // where our own programmatic scroll should land
  let lastY = scrollY;
  let lastInput = 0;
  let carry = 0;
  const canScrollInside = (el: HTMLElement | null, dy: number) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const st = getComputedStyle(n);
      if (/(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight) {
        if (dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true;
      }
    }
    return false;
  };
  addEventListener("wheel", (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || canScrollInside(e.target as HTMLElement, e.deltaY)) return;
    e.preventDefault();
    journey.wheel(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1));
    lastInput = performance.now();
    settling = null;
  }, { passive: false });
  addEventListener("scroll", () => {
    const dy = scrollY - lastY;
    lastY = scrollY;
    if (expectY !== null && Math.abs(scrollY - expectY) < 1.5) return;
    if (dy !== 0) { journey.nudge(dy); lastInput = performance.now(); }
  }, { passive: true });

  const stopTops = () => STOPS.filter((id) => BUILT.includes(id)).map((id) => stopEls.get(id)!.offsetTop);
  let settling: null | { from: number; to: number; start: number } = null;
  function settle(now: number) {
    if (settling) {
      const t = Math.min(1, (now - settling.start) / 320);
      const y = settling.from + (settling.to - settling.from) * (1 - Math.pow(1 - t, 3));
      const target = t >= 1 ? settling.to : y;
      expectY = Math.round(target);
      scrollTo(0, target);
      if (t >= 1) settling = null;
      return;
    }
    if (now - lastInput < 180 || journey.state().pending !== 0) return;
    const y = scrollY;
    const near = stopTops().find((top) => Math.abs(top - y) <= 40 && Math.abs(top - y) >= 1);
    if (near !== undefined) settling = { from: y, to: near, start: now };
  }

  // ---------------------------------------------------------------- frame loop
  let last = performance.now();
  function loop(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    journey.tick(dt);
    const st = journey.state();
    if (st.sceneDelta) {
      carry += st.sceneDelta;
      const step = carry > 0 ? Math.floor(carry) : Math.ceil(carry);
      if (step) { carry -= step; expectY = scrollY + step; scrollBy(0, step); }
    }
    settle(now);
    for (const [id, sc] of scenes) {
      const el = stopEls.get(id)!;
      const r = el.getBoundingClientRect();
      const vis = r.bottom > -50 && r.top < innerHeight + 50;
      sc.setVisible(vis);
      sc.draw(now);
    }
    bandScenes.forEach((sc, i) => {
      if (!sc) return;
      const r = bandEls[i].getBoundingClientRect();
      sc.setVisible(r.bottom > -50 && r.top < innerHeight + 50);
      sc.draw(now);
    });
    belt.frame(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  await document.fonts.ready;
  relayout();
  (window as any).__jiro = {
    ready: true,
    speed: () => journey.state().speed,
    restSpeed: () => REST,
    platesInView: belt.platesInView,
    slotsInView: belt.slotsInView,
    effectsActive: belt.effectsActive,
    surface: (id: string) => {
      const r = surfaces().find((x) => x.id === id);
      if (!r) throw new Error(`no surface ${id}`);
      const p = map.worldToPage({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
      return { x: p.x - scrollX, y: p.y - scrollY, w: r.w * s, h: r.h * s };
    },
  };
}

function paintPlaceholder(c: HTMLCanvasElement) {
  c.width = 2; c.height = 2;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0b0302";
  ctx.fillRect(0, 0, 2, 2);
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.add("boot-failed");
});
