import { CONNECTORS, RECIPES, byId, type Connector, type MoodVersion, type Recipe } from "./data";
import "./v04.css";

// v04 · Periodic table of ingredients.
// Connectors are elements, grouped by kitchen role. Picking a reaction lifts its elements
// out of the table and flies them into an equation that yields the finished sushi.

type Role = Connector["role"];

const GROUPS: { role: Role; label: string; col: string; roman: string }[] = [
  { role: "fish", label: "Fish", col: "#ef7f5f", roman: "I" },
  { role: "rice", label: "Rice", col: "#eadcbe", roman: "II" },
  { role: "nori", label: "Nori", col: "#5fae74", roman: "III" },
  { role: "garnish", label: "Garnish", col: "#c3d85a", roman: "IV" },
  { role: "sauce", label: "Sauce", col: "#c9803f", roman: "V" },
];
const groupOf = (r: Role) => GROUPS.find((g) => g.role === r)!;

const SYM: Record<string, string> = {
  sentry: "Se", github: "Gh", linear: "Li", slack: "Sl", notion: "No", gdrive: "Gd",
  hubspot: "Hs", gmail: "Gm", stripe: "St", jira: "Ji", postgres: "Pg",
};

// Grid placement (col, row). Ragged like a real periodic table: sauce sits alone top-right like He.
const POS: Record<string, [number, number]> = {
  sentry: [0, 0], hubspot: [0, 1], stripe: [0, 2],
  github: [1, 1], gdrive: [1, 2], postgres: [1, 3],
  linear: [5, 1], gmail: [5, 2], jira: [5, 3],
  notion: [6, 1],
  slack: [7, 0],
};
// The "transition block": undiscovered elements, i.e. any other MCP server.
const UNKNOWN: [number, number][] = [[2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3], [6, 2], [7, 1]];

const CELL = 96, STEP = 104, TX = 36, TY = 40;
const EQ_Y = 572, EQ_X = 36, PLUS_W = 46;
const cellXY = (c: number, r: number) => [TX + c * STEP, TY + r * STEP] as const;

function tile(c: Connector | null, n: number, big = false): string {
  if (!c) {
    return `<div class="t unk${big ? " big" : ""}"><i class="n">${n}</i><b class="s">?</b><span class="nm">any MCP</span></div>`;
  }
  const g = groupOf(c.role);
  return `<div class="t${big ? " big" : ""}" style="--g:${g.col};--brand:${c.color}">
    <i class="n">${n}</i><em class="badge"></em><b class="s">${SYM[c.id]}</b><span class="nm">${c.name}</span></div>`;
}

// 16x20 pixel flask, drawn as SVG rects (crisp).
function flaskSVG(): string {
  const rows: [number, number][] = [
    [5, 10], [6, 9], [6, 9], [6, 9], [6, 9], [6, 9], [5, 10], [4, 11], [3, 12], [2, 13],
    [1, 14], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14], [2, 13],
  ];
  let glass = "", liquid = "", shine = "";
  rows.forEach(([a, b], y) => {
    for (let x = a; x <= b; x++) {
      const edge = x === a || x === b || y === rows.length - 1 || (y === 0);
      if (edge) glass += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      else if (y >= 9) liquid += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  });
  shine = `<rect x="3" y="11" width="1" height="3"/><rect x="4" y="10" width="1" height="1"/>`;
  return `<svg viewBox="0 0 16 19" width="96" height="114" shape-rendering="crispEdges">
    <g class="lq">${liquid}</g><rect class="surf" x="2" y="9" width="12" height="1"/>
    <g fill="#d9ecef" opacity=".85">${glass}</g><g fill="#fff" opacity=".7">${shine}</g></svg>`;
}

export const v04: MoodVersion = {
  n: 4,
  title: "Periodic table",
  pitch: "Connectors as elements, grouped by kitchen role. Pick a reaction: its elements lift out of the table and react into sushi.",
  mount(el, ctx) {
    const timers: number[] = [];
    const later = (ms: number, f: () => void) => { timers.push(window.setTimeout(f, ms)); };
    const rm = ctx.reducedMotion;

    const root = document.createElement("div");
    root.className = "mv04";
    el.appendChild(root);

    // --- table ---------------------------------------------------------------
    const table = document.createElement("div");
    table.className = "tbl";
    root.appendChild(table);
    const cells = new Map<string, HTMLElement>();
    CONNECTORS.forEach((c, i) => {
      const [x, y] = cellXY(...POS[c.id]);
      const w = document.createElement("button");
      w.className = "cell";
      w.style.left = `${x}px`; w.style.top = `${y}px`;
      w.setAttribute("aria-label", `${c.name}: ${c.does}`);
      w.innerHTML = tile(c, i + 1);
      w.addEventListener("mouseenter", () => showCard(c.id));
      w.addEventListener("mouseleave", () => showCard(null));
      w.addEventListener("click", (e) => {
        e.stopPropagation();
        const r = RECIPES.find((rc) => rc.ingredients.includes(c.id) && rc.id !== cur?.id) ?? RECIPES.find((rc) => rc.ingredients.includes(c.id));
        if (r) { userPicked = true; react(r); }
      });
      table.appendChild(w);
      cells.set(c.id, w);
    });
    UNKNOWN.forEach(([cc, rr], i) => {
      const [x, y] = cellXY(cc, rr);
      const w = document.createElement("button");
      w.className = "cell";
      w.style.left = `${x}px`; w.style.top = `${y}px`;
      w.setAttribute("aria-label", "Undiscovered element: any MCP server");
      w.innerHTML = tile(null, 12 + i);
      w.addEventListener("mouseenter", () => showCard("?" + (12 + i)));
      w.addEventListener("mouseleave", () => showCard(null));
      w.addEventListener("click", (e) => {
        e.stopPropagation();
        ctx.sfx("bonk");
        ctx.egg("v04-undiscovered", "Element " + (12 + i) + " is still undiscovered. Any MCP server slots into the table.");
      });
      table.appendChild(w);
    });
    // group headers over each column
    const heads: [number, number, Role][] = [[0, 0, "fish"], [1, 1, "rice"], [5, 1, "nori"], [6, 1, "garnish"], [7, 0, "sauce"]];
    heads.forEach(([c, r, role]) => {
      const g = groupOf(role);
      const [x, y] = cellXY(c, r);
      const h = document.createElement("div");
      h.className = "ghead";
      h.style.cssText = `left:${x}px;top:${y - 26}px;--g:${g.col}`;
      h.textContent = g.roman;
      table.appendChild(h);
    });

    // legend in the empty top-middle, where real tables print their key
    const [lx, ly] = cellXY(2, 0);
    const legend = document.createElement("div");
    legend.className = "legend";
    legend.style.cssText = `left:${lx - 6}px;top:${ly - 8}px`;
    legend.innerHTML = `<p class="kick">Periodic table of</p><h3>MCP ingredients</h3>
      <ul>${GROUPS.map((g) => `<li style="--g:${g.col}"><i></i>${g.roman} ${g.label}</li>`).join("")}</ul>`;
    table.appendChild(legend);

    // --- element card (hover) --------------------------------------------------
    const card = document.createElement("div");
    card.className = "card";
    root.appendChild(card);
    function showCard(id: string | null) {
      const cid = id ?? cur?.ingredients[0] ?? "github";
      if (cid.startsWith("?")) {
        card.innerHTML = `${tile(null, +cid.slice(1), true)}<div class="info"><p class="grp" style="color:#8f8676">Undiscovered · group ?</p>
          <h4>Any MCP server</h4><p class="does">Plug in your own server and it takes a seat in the table.</p></div>`;
        return;
      }
      const c = byId(cid);
      const n = CONNECTORS.indexOf(c) + 1;
      const g = groupOf(c.role);
      const uses = RECIPES.filter((r) => r.ingredients.includes(c.id)).length;
      card.innerHTML = `${tile(c, n, true)}<div class="info"><p class="grp" style="color:${g.col}">Group ${g.roman} · ${g.label}</p>
        <h4>${c.name}</h4><p class="does">Brings ${c.does}.</p>
        <p class="meta">atomic no. ${n} · in ${uses} of ${RECIPES.length} reactions</p></div>`;
    }

    // --- reaction picker -------------------------------------------------------
    const picker = document.createElement("div");
    picker.className = "picker";
    picker.innerHTML = `<p class="kick">Reactions</p>`;
    root.appendChild(picker);
    const pbtn = new Map<string, HTMLElement>();
    RECIPES.forEach((r, i) => {
      const b = document.createElement("button");
      b.innerHTML = `<i>R${i + 1}</i><img src="${ctx.base}items/${r.item}.png" alt=""><span>${r.sushi}</span><em>${r.ingredients.map((id) => SYM[id]).join("·")}</em>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); userPicked = true; react(r); });
      picker.appendChild(b);
      pbtn.set(r.id, b);
    });

    // --- equation bench --------------------------------------------------------
    const bench = document.createElement("div");
    bench.className = "bench";
    bench.innerHTML = `<div class="shelf"></div>`;
    root.appendChild(bench);
    const order = document.createElement("p");
    order.className = "order";
    root.appendChild(order);
    const eq = document.createElement("div");
    eq.className = "eq";
    root.appendChild(eq);

    let cur: Recipe | null = null;
    let userPicked = false;
    let gen = 0;

    function react(r: Recipe) {
      if (cur?.id === r.id && eq.childElementCount) return;
      const my = ++gen;
      cur = r;
      timers.splice(0).forEach(clearTimeout);
      ctx.sfx("whoosh");
      pbtn.forEach((b, id) => b.classList.toggle("on", id === r.id));
      root.classList.add("picking");
      cells.forEach((c, id) => {
        c.classList.toggle("lit", r.ingredients.includes(id));
        c.classList.remove("gone");
      });
      showCard(null);
      order.innerHTML = `<b>order</b> ${r.order}`;
      // clear old equation
      eq.querySelectorAll<HTMLElement>(".piece").forEach((p) => { p.classList.add("out"); later(320, () => p.remove()); });

      const n = r.ingredients.length;
      const slotX = (i: number) => EQ_X + i * (CELL + PLUS_W);
      const arrowX = slotX(n) - PLUS_W + 20;
      const prodX = arrowX + 190;
      const lift = rm ? 0 : 420;
      const gap = rm ? 0 : 260;

      r.ingredients.forEach((id, i) => {
        later(lift + i * gap, () => {
          if (my !== gen) return;
          const c = byId(id);
          const src = cells.get(id)!;
          const [sx, sy] = cellXY(...POS[id]);
          const w = document.createElement("div");
          w.className = "piece el";
          w.style.left = `${slotX(i)}px`; w.style.top = `${EQ_Y}px`;
          w.innerHTML = tile(c, CONNECTORS.indexOf(c) + 1);
          w.addEventListener("mouseenter", () => showCard(id));
          w.addEventListener("mouseleave", () => showCard(null));
          eq.appendChild(w);
          src.classList.add("gone");
          ctx.sfx("pop");
          if (!rm) {
            const dx = sx - slotX(i), dy = sy - EQ_Y;
            w.animate([
              { transform: `translate(${dx}px,${dy}px)`, filter: "brightness(1.6)" },
              { transform: `translate(${dx * 0.55}px,${dy * 0.55 - 70}px) scale(1.12) rotate(${i % 2 ? 6 : -6}deg)`, offset: 0.45 },
              { transform: "translate(0,0)", filter: "brightness(1)" },
            ], { duration: 820, easing: "cubic-bezier(.45,.05,.3,1)" });
          }
          if (i < n - 1) {
            later(rm ? 0 : 700, () => {
              if (my !== gen) return;
              const p = document.createElement("div");
              p.className = "piece plus";
              p.textContent = "+";
              p.style.left = `${slotX(i) + CELL}px`; p.style.top = `${EQ_Y + 20}px`;
              eq.appendChild(p);
            });
          }
        });
      });

      const tArrow = lift + n * gap + (rm ? 0 : 520);
      later(tArrow, () => {
        if (my !== gen) return;
        const a = document.createElement("div");
        a.className = "piece arrow";
        a.style.left = `${arrowX}px`; a.style.top = `${EQ_Y - 80}px`;
        const liq = byId(r.ingredients.find((id) => byId(id).role === "fish") ?? r.ingredients.find((id) => !["github", "notion"].includes(id)) ?? r.ingredients[0]).color;
        a.innerHTML = `<div class="flask" style="--liq:${liq}">${flaskSVG()}
            <span class="bub b1"></span><span class="bub b2"></span><span class="bub b3"></span><span class="bub b4"></span></div>
          <svg class="arr" viewBox="0 0 40 7" width="160" height="28" style="margin-top:-6px" shape-rendering="crispEdges">
            <rect x="0" y="3" width="36" height="1"/><rect x="33" y="1" width="2" height="5"/><rect x="35" y="2" width="2" height="3"/><rect x="37" y="3" width="1" height="1"/></svg>
          <p class="cond">Jiro · Δ MCP</p>`;
        a.querySelector(".flask")!.addEventListener("click", (e) => {
          e.stopPropagation();
          ctx.sfx("bonk");
          ctx.egg("v04-flask", "Jiro's lab rule #1: never taste the reagents. Rule #2: except the tamago.");
        });
        eq.appendChild(a);
        ctx.sfx("blip");
      });

      const tProd = tArrow + (rm ? 0 : 1100);
      later(tProd, () => {
        if (my !== gen) return;
        const p = document.createElement("div");
        p.className = "piece prod";
        p.style.left = `${prodX}px`; p.style.top = `${EQ_Y - 58}px`;
        const idx = RECIPES.indexOf(r) + 1;
        p.innerHTML = `<div class="dish"><i class="halo"></i><img src="${ctx.base}items/${r.item}.png" alt="${r.sushi}"></div>
          <div class="txt"><p class="tag">product · R${idx}</p><h4>${r.sushi}</h4><p class="serves"><b>serves</b> ${r.serves}</p></div>`;
        eq.appendChild(p);
        root.classList.remove("picking");
        ctx.sfx("chime");
      });

      if (!userPicked && !rm) {
        later(tProd + 9000, () => {
          if (my !== gen || userPicked) return;
          react(RECIPES[(RECIPES.indexOf(r) + 1) % RECIPES.length]);
        });
      }
    }

    react(RECIPES[0]);

    return () => {
      gen++;
      timers.splice(0).forEach(clearTimeout);
      root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      root.remove();
    };
  },
};
