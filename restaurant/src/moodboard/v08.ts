import { CONNECTORS, RECIPES, byId, type MoodVersion, type Recipe } from "./data";
import "./v08.css";

// v08 "Butcher's chart": a vintage fishmonger's cut chart of a bluefin tuna.
// Every cut is one MCP connector. Ordering a dish explodes the needed cuts out
// of the fish, carries them to the cutting board, slices them into the sushi.

/** Native fish sprite is 520x221, drawn at 2x. Cut boxes are in native px. */
const S = 2;
const FX = 30;
const FY = 164;
const FISH_CX = FX + 260 * S;
const FISH_CY = FY + 110 * S;

interface Cut { id: string; jp: string; conn: string; x: number; y: number; w: number; h: number; cx: number; cy: number; tx: number; ty: number }

// Box/centroid come from the asset build (public/mood/v08/cut-*.png); tx/ty = label anchor (native, global).
const CUTS: Cut[] = [
  { id: "noten", jp: "nōten", conn: "linear", x: 5, y: 51, w: 135, h: 76, cx: 78, cy: 99, tx: 68, ty: 86 },
  { id: "hoho", jp: "hoho", conn: "sentry", x: 3, y: 127, w: 137, h: 59, cx: 83, cy: 149, tx: 84, ty: 148 },
  { id: "kama", jp: "kama", conn: "slack", x: 116, y: 6, w: 72, h: 209, cx: 161, cy: 110, tx: 158, ty: 176 },
  { id: "sekami", jp: "se-kami", conn: "github", x: 188, y: 3, w: 97, h: 84, cx: 231, cy: 53, tx: 238, ty: 62 },
  { id: "seshimo", jp: "se-shimo", conn: "postgres", x: 285, y: 19, w: 161, h: 96, cx: 344, cy: 79, tx: 318, ty: 62 },
  { id: "chutoro", jp: "chūtoro", conn: "hubspot", x: 188, y: 78, w: 97, h: 54, cx: 235, cy: 106, tx: 236, ty: 110 },
  { id: "otoro", jp: "ōtoro", conn: "stripe", x: 188, y: 132, w: 97, h: 87, cx: 232, cy: 163, tx: 236, ty: 158 },
  { id: "haranaka", jp: "hara-naka", conn: "gdrive", x: 285, y: 87, w: 77, h: 45, cx: 318, cy: 112, tx: 323, ty: 112 },
  { id: "jabara", jp: "jabara", conn: "gmail", x: 285, y: 128, w: 77, h: 70, cx: 321, cy: 157, tx: 323, ty: 150 },
  { id: "harashimo", jp: "hara-shimo", conn: "jira", x: 362, y: 108, w: 84, h: 48, cx: 395, cy: 125, tx: 404, ty: 126 },
  { id: "onomi", jp: "o-no-mi", conn: "notion", x: 446, y: 29, w: 71, h: 165, cx: 474, cy: 112, tx: 476, ty: 112 },
];

const ABBR: Record<string, string> = { sentry: "SE", github: "GH", linear: "LI", slack: "SL", notion: "NO", gdrive: "GD", hubspot: "HS", gmail: "GM", stripe: "ST", jira: "JI", postgres: "PG" };
const cutOf = (conn: string) => CUTS.find((c) => c.conn === conn)!;

function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
function badge(conn: string) {
  const c = byId(conn);
  return `<i class="bdg" style="--c:${c.color};color:${lum(c.color) > 0.6 ? "#2b1a12" : "#fff"}">${ABBR[conn]}</i>`;
}

// Board geometry (stage px).
const BX = 1120, BY = 322;
const PIECE_ZONE = { x: BX + 22, y: BY + 26, w: 300, h: 176 };

export const v08: MoodVersion = {
  n: 8,
  title: "Butcher's chart",
  pitch: "A fishmonger's cut chart where every cut is an MCP server. Order a dish and the right cuts come off the fish and get sliced into sushi.",
  mount(el, ctx) {
    const b = ctx.base + "mood/v08/";
    const root = document.createElement("div");
    root.className = "mv08" + (ctx.reducedMotion ? " rm" : "");
    root.innerHTML = `
      <div class="chart" style="background-image:url(${b}parchment.png)">
        <div class="rule"></div>
        <h3 class="ttl">Bluefin tuna <span>·</span> cuts of the MCP</h3>
        <p class="sub">Fig. 8. Jiro's pantry, drawn as a fishmonger's chart. Each cut is one MCP server.</p>
        <p class="stamp">No. 08<br>Tsukiji-ish</p>
        <img class="ghost" src="${b}ghost.png" alt="" draggable="false">
        <div class="cuts"></div>
        <p class="readout"></p>
      </div>
      <svg class="leaders" width="1640" height="700" viewBox="0 0 1640 700"></svg>
      <div class="side">
        <p class="k">Orders</p>
        <div class="menu" role="tablist"></div>
        <p class="ask"></p>
        <div class="board" style="background-image:url(${b}board.png)">
          <img class="knife" src="${b}knife.png" alt="" draggable="false">
          <div class="plate"><img class="sushi" alt=""></div>
        </div>
        <i class="twine"></i>
        <div class="tag"><i class="hole"></i><p class="tn"></p><p class="ts"></p></div>
      </div>
      <div class="pieces"></div>`;
    el.appendChild(root);

    const cutsEl = root.querySelector<HTMLElement>(".cuts")!;
    const piecesEl = root.querySelector<HTMLElement>(".pieces")!;
    const readout = root.querySelector<HTMLElement>(".readout")!;
    const svg = root.querySelector<SVGSVGElement>(".leaders")!;
    const menu = root.querySelector<HTMLElement>(".menu")!;
    const ask = root.querySelector<HTMLElement>(".ask")!;
    const board = root.querySelector<HTMLElement>(".board")!;
    const sushi = root.querySelector<HTMLImageElement>(".sushi")!;
    const tag = root.querySelector<HTMLElement>(".tag")!;
    const twine = root.querySelector<HTMLElement>(".twine")!;
    const ghost = root.querySelector<HTMLImageElement>(".ghost")!;
    ghost.style.cssText = `left:${FX}px;top:${FY}px;width:${520 * S}px`;

    // One element per cut; it lives in .pieces (above everything) so it can fly to the board.
    const els = new Map<string, HTMLElement>();
    const imgs: HTMLImageElement[] = [];
    for (const c of CUTS) {
      const d = document.createElement("div");
      d.className = "cut";
      d.dataset.id = c.id;
      d.style.cssText = `left:${FX + c.x * S}px;top:${FY + c.y * S}px;width:${c.w * S}px;height:${c.h * S}px;--c:${byId(c.conn).color}`;
      const im = new Image();
      im.src = `${b}cut-${c.id}.png`;
      im.draggable = false;
      im.alt = "";
      imgs.push(im);
      d.appendChild(im);
      const t = document.createElement("div");
      t.className = "lbl";
      t.innerHTML = `${badge(c.conn)}<span><b>${byId(c.conn).name}</b><em>${c.jp}</em></span>`;
      t.style.left = `${(c.tx - c.x) * S}px`;
      t.style.top = `${(c.ty - c.y) * S}px`;
      d.appendChild(t);
      piecesEl.appendChild(d);
      els.set(c.id, d);
    }
    void cutsEl;

    // Hit map: which cut is under each native fish pixel.
    let hit: Uint8Array | null = null;
    Promise.all(imgs.map((im) => im.decode().catch(() => undefined))).then(() => {
      const map = new Uint8Array(520 * 221);
      const cv = document.createElement("canvas");
      const g = cv.getContext("2d", { willReadFrequently: true });
      if (!g) return;
      CUTS.forEach((c, k) => {
        cv.width = c.w; cv.height = c.h;
        g.clearRect(0, 0, c.w, c.h);
        g.drawImage(imgs[k], 0, 0);
        const px = g.getImageData(0, 0, c.w, c.h).data;
        for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (px[(y * c.w + x) * 4 + 3] > 0) map[(c.y + y) * 520 + c.x + x] = k + 1;
      });
      hit = map;
    });

    const DEFAULT_READOUT = `Hover a cut to see what it does. Pick an order on the right, or click a cut.`;
    readout.textContent = DEFAULT_READOUT;
    let hovered: string | null = null;
    function setHover(id: string | null) {
      if (id === hovered) return;
      if (hovered) els.get(hovered)!.classList.remove("hov");
      hovered = id;
      if (!id) { readout.textContent = DEFAULT_READOUT; return; }
      const c = CUTS.find((x) => x.id === id)!;
      const conn = byId(c.conn);
      els.get(id)!.classList.add("hov");
      const uses = RECIPES.filter((r) => r.ingredients.includes(c.conn)).map((r) => r.sushi);
      readout.innerHTML = `${badge(c.conn)}<b>${c.jp.toUpperCase()}</b> <span class="dash">·</span> <strong>${conn.name}</strong> brings ${conn.does}.<span class="uses">In: ${uses.length ? uses.join(", ") : "nothing on today's menu"}</span>`;
    }
    const cutAt = (e: MouseEvent): string | null => {
      const r = root.getBoundingClientRect();
      const k = r.width / 1640;
      const sx = (e.clientX - r.left) / k, sy = (e.clientY - r.top) / k;
      // Landed pieces on the board take priority.
      for (const id of flown) {
        const pr = els.get(id)!.getBoundingClientRect();
        if (e.clientX >= pr.left && e.clientX <= pr.right && e.clientY >= pr.top && e.clientY <= pr.bottom && landed) return id;
      }
      const nx = Math.floor((sx - FX) / S), ny = Math.floor((sy - FY) / S);
      if (!hit || nx < 0 || ny < 0 || nx >= 520 || ny >= 221) return null;
      const v = hit[ny * 520 + nx];
      return v ? CUTS[v - 1].id : null;
    };
    const onMove = (e: MouseEvent) => {
      const id = cutAt(e);
      setHover(id);
      root.style.cursor = id ? "pointer" : "";
    };
    const onLeave = () => { setHover(null); root.style.cursor = ""; };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".menu")) return;
      const r = root.getBoundingClientRect();
      const k = r.width / 1640;
      const sx = (e.clientX - r.left) / k - FX, sy = (e.clientY - r.top) / k - FY;
      if (Math.hypot(sx - 63 * S, sy - 106 * S) < 11 * S) ctx.egg("v08-eye", "The tuna's eye follows you around the chart. It knows you want the otoro.");
      const id = cutAt(e);
      if (!id) return;
      e.stopPropagation();
      const conn = CUTS.find((c) => c.id === id)!.conn;
      const uses = RECIPES.map((r, i) => ({ r, i })).filter((x) => x.r.ingredients.includes(conn));
      if (!uses.length) {
        ctx.sfx("bonk");
        readout.innerHTML = `${badge(conn)}<strong>${byId(conn).name}</strong> is on the chart but not on today's menu. Jiro keeps it for specials.`;
        return;
      }
      auto = false;
      const next = uses.find((x) => x.i > cur) ?? uses[0];
      select(next.i);
    };
    root.addEventListener("mousemove", onMove);
    root.addEventListener("mouseleave", onLeave);
    root.addEventListener("click", onClick);

    // Menu.
    RECIPES.forEach((r, i) => {
      const bt = document.createElement("button");
      bt.setAttribute("role", "tab");
      bt.innerHTML = `<img src="${ctx.base}items/${r.item}.png" alt=""><span>${r.sushi}</span><em>${r.ingredients.map((c) => ABBR[c]).join(" ")}</em>`;
      bt.addEventListener("click", (e) => { e.stopPropagation(); auto = false; select(i); });
      menu.appendChild(bt);
    });

    // Sequencing.
    const timers: number[] = [];
    const later = (ms: number, f: () => void) => { timers.push(window.setTimeout(f, ctx.reducedMotion ? Math.min(ms, 60) : ms)); };
    const clear = () => { while (timers.length) clearTimeout(timers.pop()); };
    let cur = -1;
    let auto = true;
    let flown: string[] = [];
    let landed = false;
    let slashes: HTMLElement[] = [];

    function reset() {
      for (const id of flown) {
        const d = els.get(id)!;
        d.style.transform = "";
        d.classList.remove("out", "board", "sliced");
      }
      for (const d of els.values()) d.classList.remove("pick");
      slashes.forEach((s) => s.remove());
      slashes = [];
      svg.innerHTML = "";
      board.classList.remove("cutting");
      sushi.classList.remove("on");
      tag.classList.remove("on");
      twine.classList.remove("on");
      landed = false;
    }

    function slots(n: number) {
      const cols = n <= 3 ? n : n === 4 ? 2 : 3;
      const rows = Math.ceil(n / cols);
      const w = PIECE_ZONE.w / cols, h = PIECE_ZONE.h / rows;
      return Array.from({ length: n }, (_, i) => {
        const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols);
        const off = (PIECE_ZONE.w - inRow * w) / 2;
        return { cx: PIECE_ZONE.x + off + (i % cols + 0.5) * w, cy: PIECE_ZONE.y + (row + 0.5) * h, w: w - 26, h: h - 18 };
      });
    }

    function run(r: Recipe) {
      const ids = r.ingredients.map((c) => cutOf(c).id);
      ask.innerHTML = `<i></i><span>${r.order}</span>`;
      root.querySelector<HTMLElement>(".tn")!.textContent = r.sushi;
      root.querySelector<HTMLElement>(".ts")!.textContent = `Serves ${r.serves}.`;
      sushi.src = `${ctx.base}items/${r.item}.png`;
      sushi.alt = r.sushi;
      ids.forEach((id) => els.get(id)!.classList.add("pick"));
      flown = ids;
      // 1. Explode outward, like the cut diagram in a butcher's manual.
      later(3200, () => {
        ctx.sfx("whoosh");
        ids.forEach((id) => {
          const c = CUTS.find((x) => x.id === id)!;
          const hx = FX + c.cx * S, hy = FY + c.cy * S;
          let dx = hx - FISH_CX, dy = (hy - FISH_CY) * 1.8;
          const m = Math.hypot(dx, dy) || 1;
          dx = (dx / m) * 34; dy = (dy / m) * 34;
          const d = els.get(id)!;
          d.classList.add("out");
          d.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      });
      // 2. Carry each cut to the board, base first.
      const sl = slots(ids.length);
      ids.forEach((id, i) => later(4700 + i * 420, () => {
        const c = CUTS.find((x) => x.id === id)!;
        const s = sl[i];
        const w = c.w * S, h = c.h * S;
        const k = Math.min(s.w / w, s.h / h);
        const hx = FX + c.x * S, hy = FY + c.y * S;
        const tx = s.cx - (w * k) / 2 - hx, ty = s.cy - (h * k) / 2 - hy;
        const d = els.get(id)!;
        d.classList.add("board");
        d.style.transform = `translate(${tx}px, ${ty}px) scale(${k})`;
        ctx.sfx("blip");
      }));
      const tLand = 4700 + ids.length * 420 + 800;
      // 3. Leader lines from the empty cavity to the piece; the knife pass.
      later(tLand, () => {
        landed = true;
        svg.innerHTML = ids.map((id, i) => {
          const c = CUTS.find((x) => x.id === id)!;
          const x1 = FX + c.cx * S, y1 = FY + c.cy * S, s = sl[i];
          const mx = 1098;
          return `<path d="M${x1} ${y1} L${mx - 30 + i * 6} ${y1} L${s.cx - s.w / 2 - 4} ${s.cy}" /><rect x="${x1 - 4}" y="${y1 - 4}" width="8" height="8" />`;
        }).join("");
        board.classList.add("cutting");
        ctx.sfx("whoosh");
      });
      ids.forEach((id, i) => later(tLand + 250 + i * 110, () => {
        const s = sl[i];
        const sl1 = document.createElement("i");
        sl1.className = "slash";
        sl1.style.cssText = `left:${s.cx - 34}px;top:${s.cy - 3}px`;
        piecesEl.appendChild(sl1);
        slashes.push(sl1);
        els.get(id)!.classList.add("sliced");
      }));
      // 4. The finished dish and its paper tag.
      later(tLand + 1300, () => { sushi.classList.add("on"); ctx.sfx("coin"); });
      later(tLand + 1700, () => { tag.classList.add("on"); twine.classList.add("on"); });
      later(tLand + 1700 + 9000, () => { if (auto) select(cur + 1); });
    }

    function select(i: number) {
      i = (i + RECIPES.length) % RECIPES.length;
      clear();
      const had = flown.length > 0;
      reset();
      cur = i;
      menu.querySelectorAll("button").forEach((bt, k) => { bt.classList.toggle("on", k === i); bt.setAttribute("aria-selected", String(k === i)); });
      if (had) later(800, () => run(RECIPES[i])); else run(RECIPES[i]);
    }
    void CONNECTORS;
    select(0);

    return () => {
      clear();
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      root.removeEventListener("click", onClick);
      el.innerHTML = "";
    };
  },
};
