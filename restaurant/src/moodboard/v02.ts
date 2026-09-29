import { CONNECTORS, RECIPES, byId, type Connector, type MoodVersion, type Recipe } from "./data";
import "./v02.css";

// v02 · Crafting table: a 3x3 sushi-bar crafting grid. Pick a recipe in the book and the
// connectors fly into the grid; or drag them in yourself. Right combo = dish, wrong = sad rock.

const W = 1640;
const SLOT = 112, GAP = 8;
const GX = 488, GY = 92; // grid origin
const OUT = { x: 1006, y: 176, s: 184 };
const INV = { x: 452, y: 586, tile: 96, gap: 10 };
/** Grid slot order by ingredient count, base first (bottom-centre, then up/out). */
const PATTERN: Record<number, number[]> = {
  1: [4], 2: [7, 4], 3: [7, 4, 1], 4: [7, 4, 3, 5], 5: [7, 4, 3, 5, 1], 6: [7, 4, 3, 5, 1, 6],
};
const IDLE_MS = 9000;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function initials(c: Connector) {
  const parts = c.name.split(" ");
  return parts.length > 1 ? parts.map((p) => p[0]).join("") : c.name.slice(0, 2);
}
/** Dark or light ink for a brand colour. */
function inkFor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 160 ? "#1a1410" : "#fdf6ea";
}
function badge(c: Connector, big = false) {
  return `<span class="bdg${big ? " big" : ""}" style="--c:${c.color};--k:${inkFor(c.color)}"><i>${esc(initials(c))}</i></span>`;
}
const slotXY = (i: number) => ({ x: GX + (i % 3) * (SLOT + GAP), y: GY + Math.floor(i / 3) * (SLOT + GAP) });
const invXY = (k: number) => ({ x: INV.x + k * (INV.tile + INV.gap), y: INV.y });
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export const v02: MoodVersion = {
  n: 2,
  title: "Crafting table",
  pitch: "A 3x3 crafting grid behind the counter: open the recipe book or drag connectors in yourself. The right combo crafts the dish; a wrong one makes a sad rock.",
  mount(el, ctx) {
    const img = (n: string) => `${ctx.base}items/${n}.png`;
    const root = document.createElement("div");
    root.className = "mv02";
    root.innerHTML = `
      <aside class="book">
        <div class="book-head"><span class="px">Recipe book</span><em>${RECIPES.length} dishes</em></div>
        <ol class="recipes">${RECIPES.map((r) => `
          <li><button data-r="${r.id}">
            <img src="${img(r.item)}" alt="" draggable="false">
            <span class="rn">${esc(r.sushi)}</span>
            <span class="pips">${r.ingredients.map((id) => `<b style="--c:${byId(id).color}" title="${esc(byId(id).name)}"></b>`).join("")}</span>
          </button></li>`).join("")}
        </ol>
        <p class="book-foot">Click a dish to watch Jiro fill the grid.</p>
      </aside>
      <section class="table">
        <header class="px">Crafting <span>· MCP</span></header>
      </section>
        <div class="arrow"><div class="fill"></div></div>
        <button class="out" aria-label="Take the dish"><span class="out-in"></span></button>
        <div class="tip"></div>
        <div class="count"></div>
        <button class="clear px" aria-label="Clear grid">Clear</button>
        <div class="chef"><img src="${img("mini-jiro")}" alt="Jiro" draggable="false"><p class="say"></p></div>
      <section class="inv">
        <header><span class="px">Inventory</span><span class="inv-say">MCP connectors. Drag any into the grid.</span></header>
      </section>
      <div class="fx"></div>`;
    el.appendChild(root);

    const out = root.querySelector<HTMLButtonElement>(".out")!;
    const outIn = root.querySelector<HTMLElement>(".out-in")!;
    const arrow = root.querySelector<HTMLElement>(".arrow")!;
    const tip = root.querySelector<HTMLElement>(".tip")!;
    const say = root.querySelector<HTMLElement>(".inv-say")!;
    const count = root.querySelector<HTMLElement>(".count")!;
    const fx = root.querySelector<HTMLElement>(".fx")!;
    const chefSay = root.querySelector<HTMLElement>(".chef .say")!;
    let sayTimer = 0;
    const jiro = (text: string) => {
      chefSay.textContent = text;
      chefSay.classList.add("on");
      clearTimeout(sayTimer);
      sayTimer = window.setTimeout(() => chefSay.classList.remove("on"), 3200);
    };

    // Grid slots
    const slots: HTMLElement[] = [];
    for (let i = 0; i < 9; i++) {
      const s = document.createElement("div");
      s.className = "slot";
      const p = slotXY(i);
      s.style.left = `${p.x}px`; s.style.top = `${p.y}px`;
      s.dataset.i = String(i);
      root.appendChild(s);
      slots.push(s);
    }
    // Inventory tiles
    CONNECTORS.forEach((c, k) => {
      const t = document.createElement("div");
      t.className = "tile";
      t.dataset.c = c.id;
      const p = invXY(k);
      t.style.left = `${p.x}px`; t.style.top = `${p.y}px`;
      t.innerHTML = `${badge(c)}<span class="tn">${esc(c.name.replace("Google ", "G "))}</span><span class="role">${c.role}</span>`;
      t.title = `${c.name}: ${c.does}`;
      root.appendChild(t);
    });

    const cells: (string | null)[] = Array(9).fill(null);
    let timers: number[] = [];
    let anims: Animation[] = [];
    let busy = false;
    let served = 0, rocks = 0;
    const crafted = new Set<string>();
    let result: Recipe | "rock" | null = null;
    let lastTouch = 0;
    let demoIdx = 0;
    let dead = false;
    let gen = 0;

    const later = (ms: number, f: () => void) => { const id = window.setTimeout(() => { timers = timers.filter((t) => t !== id); if (!dead) f(); }, ms); timers.push(id); };
    const anim = (node: Element, kf: Keyframe[], opt: KeyframeAnimationOptions) => {
      if (ctx.reducedMotion) opt = { ...opt, duration: 1 };
      const a = node.animate(kf, opt);
      anims.push(a);
      a.finished.then(() => { anims = anims.filter((x) => x !== a); }, () => {});
      return a;
    };

    function renderSlot(i: number) {
      const id = cells[i];
      slots[i].classList.toggle("full", !!id);
      slots[i].innerHTML = id ? `${badge(byId(id), true)}<span class="sn">${esc(byId(id).name)}</span>` : "";
    }
    function renderCount() {
      count.innerHTML = `<span>Served <b>${served}</b></span>${rocks ? `<span>Rocks <b>${rocks}</b></span>` : ""}`;
    }

    function setTip(html: string, kind = "") {
      tip.className = `tip ${kind}`;
      tip.innerHTML = html;
    }
    function idleTip() {
      setTip(`<p class="t-name">Empty grid</p><p class="t-body">Pick a dish in the recipe book, or drag connectors from the inventory into the grid.</p><p class="t-hint">Any slot works. Order does not matter.</p>`, "muted");
    }

    /** Recompute what the grid makes. */
    function evaluate(animate: boolean) {
      const have = cells.filter((x): x is string => !!x);
      const uniq = [...new Set(have)];
      const prev = result;
      result = null;
      arrow.classList.remove("ready", "bad", "part");
      if (!have.length) { outIn.innerHTML = ""; out.classList.remove("has", "rock"); idleTip(); return; }
      const dup = uniq.length !== have.length;
      const match = !dup ? RECIPES.find((r) => sameSet(r.ingredients, uniq)) : undefined;
      const partial = !dup ? RECIPES.filter((r) => uniq.every((x) => r.ingredients.includes(x))) : [];
      if (match) {
        result = match;
        arrow.classList.add("ready");
        if (prev !== match) showDish(match, animate);
        return;
      }
      if (partial.length) {
        outIn.innerHTML = ""; out.classList.remove("has", "rock");
        arrow.classList.add("part");
        const best = partial.sort((a, b) => a.ingredients.length - b.ingredients.length)[0];
        const miss = best.ingredients.filter((x) => !uniq.includes(x));
        setTip(`<p class="t-name">Smells like ${esc(best.sushi)}…</p>
          <p class="t-body">Still missing ${miss.length}:</p>
          <p class="t-chips">${miss.map((id) => `<span class="chip" style="--c:${byId(id).color}">${esc(byId(id).name)}</span>`).join("")}</p>`, "muted");
        return;
      }
      result = "rock";
      arrow.classList.add("bad");
      if (prev !== "rock") {
        out.classList.add("has", "rock");
        outIn.innerHTML = `<img src="${img("rock")}" alt="Sad rock" draggable="false">`;
        const names = uniq.map((id) => byId(id).name);
        const clash = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
        setTip(`<p class="t-name rockname">Sad rock</p>
          <p class="t-body">${dup ? "Two of the same connector. Jiro only needs one of each." : `Nothing on the menu uses ${esc(clash)} together.`}</p>
          <p class="t-hint">Click the rock to throw it out.</p>`, "rock");
        ctx.sfx("bonk");
        jiro(dup ? "One of each, please." : "That is a rock, chef.");
        if (animate) anim(outIn, [{ transform: "translateY(-18px) rotate(-8deg)" }, { transform: "translateY(0) rotate(0)" }], { duration: 420, easing: "steps(6)" });
      }
    }

    function showDish(r: Recipe, animate: boolean) {
      out.classList.add("has"); out.classList.remove("rock");
      outIn.innerHTML = `<img src="${img(r.item)}" alt="${esc(r.sushi)}" draggable="false">`;
      setTip(`<p class="t-name">${esc(r.sushi)}</p>
        <p class="t-order">${esc(r.order)}</p>
        <p class="t-serves"><span>Serves</span>${esc(r.serves)}</p>
        <p class="t-chips">${r.ingredients.map((id) => `<span class="chip" style="--c:${byId(id).color}">${esc(byId(id).name)}</span>`).join("")}</p>
        <p class="t-hint">Click the dish to serve it.</p>`, "dish");
      root.querySelectorAll<HTMLElement>(".recipes button").forEach((b) => b.classList.toggle("on", b.dataset.r === r.id));
      if (!animate) return;
      ctx.sfx("chime");
      later(900, () => { if (result === r) jiro(`Order up: ${r.sushi.toLowerCase()}.`); });
      anim(arrow.querySelector(".fill")!, [{ width: "0%" }, { width: "100%" }], { duration: 520, easing: "steps(8)", fill: "both" });
      anim(outIn, [{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1.15)", opacity: 1, offset: 0.7 }, { transform: "scale(1)", opacity: 1 }], { duration: 480, delay: 480, easing: "steps(7)", fill: "backwards" });
      anim(tip, [{ opacity: 0, transform: "translateX(-10px)" }, { opacity: 1, transform: "none" }], { duration: 300, delay: 700, fill: "backwards" });
      later(520, () => sparkle(OUT.x + OUT.s / 2, OUT.y + OUT.s / 2));
    }

    function sparkle(cx: number, cy: number) {
      if (ctx.reducedMotion) return;
      for (let k = 0; k < 14; k++) {
        const s = document.createElement("i");
        s.className = `spark${k % 3 === 0 ? " g" : ""}`;
        s.style.left = `${cx}px`; s.style.top = `${cy}px`;
        fx.appendChild(s);
        const a = (k / 14) * Math.PI * 2, d = 90 + (k % 4) * 22;
        anim(s, [{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`, opacity: 0 }], { duration: 700, easing: "steps(7)" })
          .finished.then(() => s.remove(), () => s.remove());
      }
    }

    function clearGrid(fly = false) {
      for (let i = 0; i < 9; i++) {
        if (cells[i] && fly) {
          const n = slots[i].firstElementChild;
          if (n) anim(n, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.4)" }], { duration: 220, easing: "steps(4)", fill: "forwards" });
        }
        cells[i] = null;
      }
      const g0 = gen;
      const go = () => { if (g0 !== gen) return; slots.forEach((_, i) => renderSlot(i)); evaluate(false); root.querySelectorAll(".recipes button.on").forEach((b) => b.classList.remove("on")); };
      if (fly && !ctx.reducedMotion) later(230, go); else go();
    }

    /** Fly a badge from (x,y) to a grid slot, then drop it in. */
    function flyTo(id: string, from: { x: number; y: number }, i: number, dur: number, done: () => void) {
      const f = document.createElement("div");
      f.className = "flyer";
      f.innerHTML = badge(byId(id), true);
      const to = slotXY(i);
      const fx0 = from.x, fy0 = from.y, fx1 = to.x + (SLOT - 76) / 2, fy1 = to.y + 10;
      f.style.left = `${fx0}px`; f.style.top = `${fy0}px`;
      fx.appendChild(f);
      const dx = fx1 - fx0, dy = fy1 - fy0;
      const lift = Math.min(-60, dy * 0.25 - 110);
      anim(f, [
        { transform: "translate(0,0) scale(.9)" },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + lift}px) scale(1.15)`, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) scale(1)` },
      ], { duration: dur, easing: "cubic-bezier(.3,.1,.3,1)", fill: "forwards" }).finished.then(() => { f.remove(); if (!dead) done(); }, () => f.remove());
    }

    /** Stop an in-progress auto-craft (the visitor took over). */
    function cancelCraft() {
      if (!busy) return;
      gen++;
      fx.querySelectorAll(".flyer:not(.held)").forEach((n) => n.remove());
      busy = false;
      root.classList.remove("busy");
      say.textContent = "MCP connectors. Drag any into the grid.";
    }

    /** Book click: Jiro fills the grid slot by slot. */
    function autoCraft(r: Recipe) {
      if (held) return;
      const g = ++gen;
      fx.querySelectorAll(".flyer:not(.held)").forEach((n) => n.remove());
      busy = true;
      root.classList.add("busy");
      root.querySelectorAll<HTMLElement>(".recipes button").forEach((b) => b.classList.toggle("on", b.dataset.r === r.id));
      const had = cells.some(Boolean);
      clearGrid(had);
      say.textContent = `Jiro is gathering ${r.ingredients.length} connectors for ${r.sushi}.`;
      const pattern = PATTERN[r.ingredients.length] ?? PATTERN[5];
      const step = ctx.reducedMotion ? 60 : 340;
      r.ingredients.forEach((id, k) => {
        later((had ? 260 : 0) + k * step, () => {
          if (g !== gen) return;
          const idx = CONNECTORS.findIndex((c) => c.id === id);
          const p = invXY(idx);
          const tile = root.querySelector<HTMLElement>(`.tile[data-c="${id}"]`);
          tile?.classList.add("pick");
          later(300, () => tile?.classList.remove("pick"));
          ctx.sfx("whoosh");
          flyTo(id, { x: p.x + 10, y: p.y + 8 }, pattern[k], 620, () => {
            if (g !== gen) return;
            cells[pattern[k]] = id;
            renderSlot(pattern[k]);
            anim(slots[pattern[k]], [{ transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 200, easing: "steps(3)" });
            ctx.sfx("pop");
            if (k === r.ingredients.length - 1) {
              evaluate(true);
              busy = false;
              root.classList.remove("busy");
              say.textContent = "MCP connectors. Drag any into the grid.";
            }
          });
        });
      });
    }

    function take() {
      if (busy || !result) return;
      touch();
      const node = outIn.firstElementChild;
      if (result === "rock") {
        rocks++;
        jiro(rocks === 1 ? "Into the rock garden." : "Another one for the garden.");
        ctx.sfx("bonk");
        if (node) anim(node, [{ transform: "none" }, { transform: "translate(40px,260px) rotate(120deg)", opacity: 0 }], { duration: 520, easing: "steps(8)", fill: "forwards" });
        if (rocks === 3) ctx.egg("mood-v02-rocks", "Three sad rocks. Jiro is starting a rock garden out back.");
      } else {
        served++;
        crafted.add(result.id);
        ctx.sfx("coin");
        jiro(["Hai! Served.", "To the counter!", "Shipped. Next?"][served % 3]);
        if (node) anim(node, [{ transform: "none" }, { transform: "translateY(-120px) scale(.6)", opacity: 0 }], { duration: 520, easing: "steps(8)", fill: "forwards" });
        sparkle(OUT.x + OUT.s / 2, OUT.y + OUT.s / 2);
        if (crafted.size === RECIPES.length) ctx.egg("mood-v02-all", "Every recipe crafted. Jiro awards you a copper spatula.");
      }
      renderCount();
      result = null;
      later(ctx.reducedMotion ? 0 : 440, () => clearGrid(true));
    }

    // ---- Drag & drop (pointer events; coordinates in local 1640x700 space) ----
    type Held = { id: string; from: number | null; ghost: HTMLElement; ox: number; oy: number; sx: number; sy: number; moved: boolean };
    let held: Held | null = null;
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const s = r.width / W || 1;
      return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
    };
    const slotAt = (x: number, y: number) => {
      for (let i = 0; i < 9; i++) {
        const p = slotXY(i);
        if (x >= p.x - 4 && x < p.x + SLOT + 4 && y >= p.y - 4 && y < p.y + SLOT + 4) return i;
      }
      return -1;
    };
    function touch() { lastTouch = performance.now(); }

    const onDown = (e: PointerEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      const tile = t.closest<HTMLElement>(".tile");
      const slot = t.closest<HTMLElement>(".slot.full");
      if (!tile && !slot) return;
      cancelCraft();
      e.preventDefault();
      touch();
      const p = local(e);
      const id = tile ? tile.dataset.c! : cells[+slot!.dataset.i!]!;
      const from = slot ? +slot.dataset.i! : null;
      const ghost = document.createElement("div");
      ghost.className = "flyer held";
      ghost.innerHTML = badge(byId(id), true);
      ghost.style.left = `${p.x - 38}px`; ghost.style.top = `${p.y - 38}px`;
      fx.appendChild(ghost);
      held = { id, from, ghost, ox: 38, oy: 38, sx: p.x, sy: p.y, moved: false };
      if (from !== null) { cells[from] = null; renderSlot(from); }
      ctx.sfx("blip");
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      e.stopPropagation();
      if (!held) return;
      const p = local(e);
      if (Math.abs(p.x - held.sx) + Math.abs(p.y - held.sy) > 6) held.moved = true;
      held.ghost.style.left = `${p.x - held.ox}px`; held.ghost.style.top = `${p.y - held.oy}px`;
      const i = slotAt(p.x, p.y);
      slots.forEach((s, k) => s.classList.toggle("hover", k === i));
    };
    const onUp = (e: PointerEvent) => {
      e.stopPropagation();
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (!held) return;
      const h = held; held = null;
      slots.forEach((s) => s.classList.remove("hover"));
      const p = local(e);
      let i = slotAt(p.x, p.y);
      // A click on an inventory tile (no drag) drops it into the next free patterned slot.
      if (!h.moved && h.from === null) i = [4, 7, 3, 5, 1, 6, 8, 0, 2].find((k) => !cells[k]) ?? -1;
      // A click on a filled slot (no drag) removes it.
      if (!h.moved && h.from !== null) i = -1;
      if (i >= 0) {
        cells[i] = h.id;
        renderSlot(i);
        anim(slots[i], [{ transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 200, easing: "steps(3)" });
        ctx.sfx("pop");
        h.ghost.remove();
      } else {
        anim(h.ghost, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.3)" }], { duration: 220, easing: "steps(4)" })
          .finished.then(() => h.ghost.remove(), () => h.ghost.remove());
      }
      root.querySelectorAll(".recipes button.on").forEach((b) => b.classList.remove("on"));
      evaluate(true);
    };
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", stop);
    el.addEventListener("mousemove", stop);

    // Hover the inventory: say what each connector brings.
    const onOver = (e: MouseEvent) => {
      if (busy) return;
      const t = (e.target as HTMLElement).closest<HTMLElement>(".tile");
      if (t) { const c = byId(t.dataset.c!); say.innerHTML = `<b style="color:${c.color === "#e8e3da" || c.color === "#f3f1ec" ? "var(--cream)" : c.color}">${esc(c.name)}</b> · ${c.role} · ${esc(c.does)}`; }
    };
    const onOut = (e: MouseEvent) => {
      if (busy) return;
      if ((e.target as HTMLElement).closest(".tile")) say.textContent = "MCP connectors. Drag any into the grid.";
    };
    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseout", onOut);

    root.querySelectorAll<HTMLButtonElement>(".recipes button").forEach((b) => b.addEventListener("click", () => {
      touch();
      autoCraft(RECIPES.find((r) => r.id === b.dataset.r)!);
    }));
    out.addEventListener("click", take);
    root.querySelector(".clear")!.addEventListener("click", () => { cancelCraft(); touch(); clearGrid(true); });

    // Attract loop: while nobody touches it, Jiro works through the book on his own.
    const tick = () => {
      if (performance.now() - lastTouch > IDLE_MS && !busy && !held) {
        autoCraft(RECIPES[demoIdx % RECIPES.length]);
        demoIdx++;
      }
      later(IDLE_MS / 1.5, tick);
    };
    renderCount();
    idleTip();
    later(500, () => { autoCraft(RECIPES[0]); demoIdx = 1; lastTouch = performance.now() - IDLE_MS + 4000; tick(); });

    return () => {
      dead = true;
      clearTimeout(sayTimer);
      timers.forEach((t) => clearTimeout(t));
      timers = [];
      anims.forEach((a) => a.cancel());
      anims = [];
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", stop);
      el.removeEventListener("mousemove", stop);
      root.remove();
    };
  },
};
