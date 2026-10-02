import { mountBelt, type Mapping } from "./beltView";
import { buildRoute, routePoints, BELT_W, BEND_R, HIDDEN, POND_TRESTLE, type Pt } from "./belt/route";
import { createJourney } from "./belt/motion";
import { glideTarget, wheelTarget, type StopSpan } from "./belt/snap";
import { createEggs, say, type Egg } from "./eggs";
import { BANDS, STOP_H, STOPS, WORLD_W, stopTop, type StopId } from "./layout";
import { mountScene, sceneDensity, type SceneDef } from "./scene";
import { initCompare, initDemo, initFaq, initPricing, initTable } from "./content";
import { DAILY_STALL, RUSH_CABINET, mountCabinet } from "./cabinet";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => innerWidth <= 760;
const BUILT: StopId[] = ["hero", "product", "compare", "table", "faq", "price", "pond"];
const REST = 6;

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
  { id: "game-rush", name: "Played Sushi Rush", scene: "table" },
  { id: "faq-asked", name: "Asked Jiro a question", scene: "faq" },
  { id: "game-daily", name: "Played today's Daily Roll", scene: "pond" },
  { id: "koi-leap", name: "Saw the koi leap", scene: "pond" },
  { id: "koi-fed", name: "Fed the koi", scene: "pond" },
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

  let cabinets: { id: StopId; c: ReturnType<typeof mountCabinet> }[] = [];
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
      // A canvas finer than the screen is shrunk by the browser: let it average rather than drop pixels.
      c.style.imageRendering = density > s * (devicePixelRatio || 1) + 0.01 ? "auto" : "";
    }
    bandEls.forEach((b, i) => {
      const y0 = map.worldToPage({ x: 0, y: stopTop(STOPS[i]) + STOP_H }).y;
      b.style.top = `${y0}px`;
      b.style.height = `${Math.round(BANDS[i] * s)}px`;
    });
    const lastTop = map.worldToPage({ x: 0, y: stopTop(lastBuilt) }).y;
    stage.style.height = `${Math.max(map.worldToPage({ x: 0, y: worldEnd }).y, lastTop + innerHeight)}px`;
    if (eggsReady) placeAllEggs();
    for (const { id, c } of cabinets) c.place(s, copyH[id] ?? 0, narrow());
  }

  // ---------------------------------------------------------------- scenes
  // Canvas density follows the screen; a resize, zoom or move to another monitor that changes it remounts the scenes.
  const bandScenes: Awaited<ReturnType<typeof mountScene>>[] = [];
  let density = 0;
  let mounting = false;
  async function mountAll() {
    const want = sceneDensity(innerWidth / WORLD_W, devicePixelRatio || 1);
    if (want === density) return;
    density = want;
    mounting = true;
    await Promise.all([
      ...BUILT.map(async (id) => {
        const def = sceneDefs[id];
        const canvas = stopEls.get(id)!.querySelector<HTMLCanvasElement>("canvas.scene")!;
        if (def) scenes.set(id, await mountScene(canvas, `art/${id}`, def, reduced, density));
        else paintPlaceholder(canvas);
      }),
      ...bandEls.map(async (b, i) => {
        const def = bandDefs[i];
        if (def) bandScenes[i] = await mountScene(b.querySelector("canvas")!, `art/band${i}`, def, reduced, density);
        else paintPlaceholder(b.querySelector("canvas")!);
      }),
    ]);
    mounting = false;
  }
  await mountAll();

  // ---------------------------------------------------------------- eggs
  const sceneEggs: Egg[] = [];
  for (const [id, sc] of scenes) for (const e of sc.def.eggs ?? []) sceneEggs.push({ id: `${id}-${e.id}`, name: e.name, scene: id });
  bandScenes.forEach((sc, i) => { for (const e of sc?.def.eggs ?? []) sceneEggs.push({ id: `band${i}-${e.id}`, name: e.name, scene: `band${i}` }); });
  const eggs = createEggs([...sceneEggs, ...BELT_EGGS]);

  function placeEggs(key: string, def: SceneDef, el: HTMLElement, scene: () => Awaited<ReturnType<typeof mountScene>>, top: number) {
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
          scene().poke(e.sprite ?? e.id, performance.now());
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
    for (const [id, sc] of scenes) placeEggs(id, sc.def, stopEls.get(id)!, () => scenes.get(id)!, copyH[id] ?? 0);
    bandScenes.forEach((sc, i) => sc && placeEggs(`band${i}`, sc.def, bandEls[i], () => bandScenes[i], 0));
  }

  eggsReady = true;
  initDemo((n) => { if (n === 3) eggs.find("demo-pr"); });
  initCompare(reduced);
  initTable();
  cabinets = [
    { id: "table" as StopId, c: mountCabinet(stopEls.get("table")!, RUSH_CABINET, () => eggs.find("game-rush")) },
    { id: "pond" as StopId, c: mountCabinet(stopEls.get("pond")!, DAILY_STALL, () => eggs.find("game-daily")) },
  ];
  initFaq(() => { scenes.get("faq")?.poke("jiro", performance.now()); eggs.find("faq-asked"); });
  initPricing();
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
    surfaces,
    water: () => [...scenes].flatMap(([id, sc]) => (sc.def.water ?? []).map((r) => ({ ...r, id: `${id}-${r.id}`, y: r.y + stopTop(id) }))),
    koiLine: () => map.worldToPage({ x: 0, y: stopTop("pond") + STOP_H * POND_TRESTLE }).y,
    onEgg: (id: string) => eggs.find(id),
    onSay: (text: string, p: Pt) => say(text, p.x, p.y),
  };
  const belt = await mountBelt(deps);

  const relayout = () => {
    // A resize moves every scene: drop any glide in flight and re-snap once the new layout is in.
    if (glide) { glide = null; journey.glide(false); }
    void mountAll().then(() => { layout(); deps.route = buildPageRoute(); belt.resize(); freeDir = 0; lastFree = performance.now(); });
  };
  addEventListener("resize", relayout);
  // Copy blocks set the mobile layout; they change height when the web fonts arrive.
  const copyObserver = new ResizeObserver(() => {
    if (!narrow()) return;
    const changed = BUILT.some((id) => (stopEls.get(id)!.querySelector<HTMLElement>(".copy")?.offsetHeight ?? 0) !== (copyH[id] ?? 0));
    if (changed) relayout();
  });
  stage.querySelectorAll(".copy").forEach((el) => copyObserver.observe(el));

  // ---------------------------------------------------------------- scroll: magnetic, always resting on a scene
  // A wheel flick glides to the next or previous scene; any other scroll that ends between scenes glides on to one.
  // While the page glides, the belt runs half again as fast.
  let expectY: number | null = null; // where our own programmatic scroll should land
  let lastY = scrollY;
  let lastFree = 0, freeDir: 1 | -1 | 0 = 0, lastWheel = 0, swallowUntil = 0, touching = false, dragging = false;
  let gesture = { acc: 0, glided: false };
  let glide: null | { from: number; to: number; start: number; lead: number; dur: number } = null;
  const spans = (): StopSpan[] => STOPS.filter((id) => BUILT.includes(id))
    .map((id) => { const el = stopEls.get(id)!; return { top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight }; });
  const canScrollInside = (el: HTMLElement | null, dy: number) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const st = getComputedStyle(n);
      if (/(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight) {
        if (dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true;
      }
    }
    return false;
  };
  function glideTo(to: number, now: number, lead: number) {
    const from = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    to = Math.max(0, Math.min(Math.round(to), max));
    if (Math.abs(to - from) < 1) return;
    glide = { from, to, start: now, lead: reduced ? 0 : lead, dur: reduced ? 1 : Math.min(1100, Math.max(650, 500 + Math.abs(to - from) * 0.3)) };
    journey.glide(true);
  }
  addEventListener("wheel", (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || canScrollInside(e.target as HTMLElement, e.deltaY)) return;
    const now = performance.now();
    if (now - lastWheel > 250) gesture = { acc: 0, glided: false };
    lastWheel = now;
    if (glide || gesture.glided || now < swallowUntil) { e.preventDefault(); return; }
    const to = wheelTarget(scrollY, e.deltaY > 0 ? 1 : -1, spans(), innerHeight);
    if (to === null) return; // free scroll inside a tall scene, or nothing further that way
    e.preventDefault();
    gesture.acc += e.deltaY;
    if (Math.abs(gesture.acc) < 4) return; // trackpads often open a gesture with a 1–2 px nudge
    gesture.glided = true;
    glideTo(to, now, 250);
  }, { passive: false });
  addEventListener("touchstart", () => { touching = true; glide = null; journey.glide(false); }, { passive: true });
  const touchDone = (e: TouchEvent) => { if (e.touches.length === 0) { touching = false; lastFree = performance.now(); } };
  addEventListener("touchend", touchDone, { passive: true });
  addEventListener("touchcancel", touchDone, { passive: true });
  // Holding the page's scrollbar: no glides until it is let go.
  addEventListener("pointerdown", (e) => { if (e.clientX >= document.documentElement.clientWidth) dragging = true; });
  addEventListener("pointerup", () => { if (dragging) { dragging = false; lastFree = performance.now(); } });
  addEventListener("scroll", () => {
    const dy = scrollY - lastY;
    lastY = scrollY;
    if (expectY !== null && Math.abs(scrollY - expectY) < 1.5) { if (!glide) expectY = null; return; }
    if (glide && performance.now() - glide.start > glide.lead) { glide = null; journey.glide(false); }
    if (dy !== 0) { freeDir = dy > 0 ? 1 : -1; lastFree = performance.now(); }
  }, { passive: true });

  function settle(now: number) {
    if (glide) {
      const t = Math.min(1, Math.max(0, (now - glide.start - glide.lead) / glide.dur));
      if (now - glide.start < glide.lead) return;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const y = Math.round(glide.from + (glide.to - glide.from) * e);
      expectY = y;
      scrollTo(0, y);
      if (t >= 1) { glide = null; journey.glide(false); swallowUntil = Math.max(swallowUntil, now + 200); }
      return;
    }
    if (touching || dragging || lastFree === 0 || now - lastFree < 160 || now - lastWheel < 160) return;
    const to = glideTarget(scrollY, freeDir, spans(), innerHeight);
    lastFree = 0;
    if (to !== null) glideTo(to, now, 0);
  }

  // ---------------------------------------------------------------- frame loop
  let last = performance.now();
  function loop(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    journey.tick(dt);
    settle(now);
    // Scenes more than 1.5 screens away hand their canvas memory back; within one screen they are restored.
    const tend = (sc: Awaited<ReturnType<typeof mountScene>>, el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const gap = r.bottom < 0 ? -r.bottom : r.top > innerHeight ? r.top - innerHeight : 0;
      if (gap > innerHeight * 1.5) sc.release();
      else if (gap < innerHeight) sc.restore();
      sc.setVisible(r.bottom > -50 && r.top < innerHeight + 50);
      sc.draw(now);
    };
    if (!mounting) {
      for (const [id, sc] of scenes) tend(sc, stopEls.get(id)!);
      bandScenes.forEach((sc, i) => sc && tend(sc, bandEls[i]));
    }
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
    koi: belt.koi,
    surface: (id: string) => {
      const r = [...surfaces(), ...deps.water()].find((x) => x.id === id);
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
