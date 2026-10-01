import { RECIPES, byId, type MoodVersion, type Recipe } from "./data";
import "./v07.css";

// v07 — Kitchen ticket rail. Order tickets hang on a stainless rail; pulling one
// down onto the pass checks off each MCP connector (ingredient) as its bowl of
// mise en place fills, then the plated sushi slides onto the pass with a ding.

const TIMES = ["19:42", "19:47", "19:53", "20:01", "20:08"];
const TICKET_NO = [412, 413, 414, 415, 416];
const SLOT_X = (i: number) => 30 + i * 318;
const SLOT_Y = 26;
const PASS = { x: 30, y: 204, w: 440 };
const BOWL_X0 = 492;
const BOWL_W = 140;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function badge(id: string, big = false) {
  const c = byId(id);
  // Pick readable glyph colour on the brand swatch.
  const h = c.color.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16));
  const light = r * 0.299 + g * 0.587 + b * 0.114 > 150;
  const glyph = c.name.replace(/[^A-Z]/g, "").slice(0, 2) || c.name[0];
  return `<i class="bdg${big ? " big" : ""}" style="--bc:${c.color};--bt:${light ? "#1a130c" : "#fff8ec"}">${glyph}</i>`;
}

export const v07: MoodVersion = {
  n: 7,
  title: "Kitchen ticket rail",
  pitch: "Every Slack ask is an order ticket. Pull one down: Jiro checks off each MCP connector as its bowl fills, then the dish hits the pass. Ding.",
  mount(el, ctx) {
    const B = ctx.base;
    const root = document.createElement("div");
    root.className = "mv07";
    root.innerHTML = `
      <img class="bg" src="${B}mood/v07/bg.jpg" alt="" draggable="false">
      <div class="glow" style="left:201px"></div><div class="glow g2" style="left:519px"></div>
      <div class="glow g3" style="left:1101px"></div><div class="glow g4" style="left:1427px"></div>
      <div class="rail"><b></b></div>
      <div class="tickets"></div>
      <div class="bowls"></div>
      <button class="bell" title="Ring the bell" aria-label="Ring the service bell"><svg viewBox="0 0 24 16" shape-rendering="crispEdges"><rect x="11" y="0" width="2" height="2" fill="#f6d27a"/><rect x="10" y="2" width="4" height="1" fill="#8a5a22"/><rect x="7" y="3" width="10" height="1" fill="#f0c060"/><rect x="5" y="4" width="14" height="2" fill="#e0a848"/><rect x="4" y="6" width="16" height="3" fill="#d09038"/><rect x="3" y="9" width="18" height="2" fill="#b8742a"/><rect x="7" y="4" width="2" height="4" fill="#fff0b8"/><rect x="1" y="11" width="22" height="2" fill="#6b3f1c"/><rect x="2" y="13" width="20" height="2" fill="#3a2212"/></svg></button>
      <div class="ding">DING!</div>
      <div class="board"><img class="dish" alt=""></div>
      <div class="orderup"><span class="px">ORDER UP</span><b></b></div>
      <div class="hint px">&uarr; pull a ticket off the rail</div>
      <article class="pass-ticket" aria-live="polite"></article>`;
    el.appendChild(root);

    const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const rail = $(".tickets");
    const bowls = $(".bowls");
    const pass = $(".pass-ticket");
    const board = $(".board");
    const dish = $<HTMLImageElement>(".dish");
    const ding = $(".ding");
    const bell = $(".bell");
    const orderup = $(".orderup");

    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, ms)); };
    const clear = () => { timers.forEach(clearTimeout); timers.length = 0; };

    let cur = -1;
    let userTouched = false;

    RECIPES.forEach((r, i) => {
      const t = document.createElement("button");
      t.className = "rt";
      t.style.left = `${SLOT_X(i)}px`;
      t.style.top = `${SLOT_Y}px`;
      t.style.animationDelay = `${-i * 1.7}s`;
      t.innerHTML = `
        <span class="clip"></span>
        <span class="rt-h"><span class="rt-d px">${esc(r.sushi)}</span><span class="stamp-t">${TIMES[i]}</span></span>
        <span class="rt-o">${esc(r.order)}</span>
        <span class="rt-ghost px">on the pass</span>`;
      t.setAttribute("aria-label", `Order ticket: ${r.order}`);
      t.addEventListener("click", (e) => { e.stopPropagation(); userTouched = true; fire(i); });
      rail.appendChild(t);
    });

    const ringBell = () => {
      ctx.sfx("chime");
      bell.classList.remove("ring"); ding.classList.remove("on");
      void bell.offsetWidth;
      bell.classList.add("ring"); ding.classList.add("on");
    };
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      ringBell();
      ctx.egg("v07-bell", "Order up! Jiro rings the pass bell for every merged PR.");
    });
    pass.addEventListener("click", (e) => { e.stopPropagation(); if (cur >= 0) { userTouched = true; fire(cur, true); } });

    function renderTicket(r: Recipe, i: number) {
      const lines = r.ingredients.map((id, k) => {
        const c = byId(id);
        return `<li style="--k:${k}"><span class="box"><svg viewBox="0 0 10 10"><path d="M1 5 L4 8 L9 1"/></svg></span>${badge(id)}<b>${c.name}</b><span class="does">${esc(c.does)}</span></li>`;
      }).join("");
      pass.innerHTML = `
        <header><span>TICKET #0${TICKET_NO[i]} · via Slack</span><span class="stamp-t">${TIMES[i]}</span></header>
        <p class="ord">${esc(r.order)}</p>
        <h3 class="px">${esc(r.sushi)}</h3>
        <ol class="${r.ingredients.length > 4 ? "tight" : ""}">${lines}</ol>
        <span class="stamp px">Served</span>
        <p class="served"><span class="hand"></span></p>`;
    }

    function fire(i: number, replay = false) {
      if (i === cur && !replay) return;
      clear();
      const r = RECIPES[i];
      const prev = cur;
      cur = i;
      if (userTouched) root.querySelector(".hint")?.classList.add("gone");
      rail.querySelectorAll<HTMLElement>(".rt").forEach((t, k) => t.classList.toggle("out", k === i));

      // Reset the pass.
      board.classList.remove("in"); ding.classList.remove("on"); bell.classList.remove("ring"); orderup.classList.remove("on");
      bowls.innerHTML = "";
      renderTicket(r, i);
      dish.src = `${B}items/${r.item}.png`;
      orderup.querySelector("b")!.textContent = r.sushi;

      // Bowls sit empty and dim until their line gets checked off.
      r.ingredients.forEach((id, k) => {
        const c = byId(id);
        const n = r.ingredients.length;
        const x = BOWL_X0 + (700 - n * BOWL_W) / 2 + k * BOWL_W;
        const b = document.createElement("div");
        b.className = "bowl";
        b.style.left = `${x}px`;
        b.innerHTML = `
          <img class="ing ${c.role}" src="${B}mood/v07/${c.role}.png" alt="">
          <img class="cer" src="${B}mood/v07/bowl.png" alt="">
          <span class="tag">${badge(id, true)}<span class="px">${c.name}</span></span>`;
        b.title = `${c.name}: ${c.does}`;
        bowls.appendChild(b);
      });

      const lis = pass.querySelectorAll<HTMLElement>("li");
      const bws = bowls.querySelectorAll<HTMLElement>(".bowl");
      const hand = pass.querySelector<HTMLElement>(".hand")!;
      const servedText = `SERVED: ${r.serves}`;

      const finish = () => {
        board.classList.add("in");
        ringBell();
        orderup.classList.add("on");
      };

      if (ctx.reducedMotion) {
        pass.classList.remove("drop");
        pass.style.transform = "";
        lis.forEach((l) => l.classList.add("done"));
        bws.forEach((b) => b.classList.add("set", "full"));
        board.classList.add("in"); orderup.classList.add("on");
        hand.textContent = servedText;
        pass.classList.add("stamped");
        return;
      }

      // Pull the ticket down from its rail slot onto the pass.
      pass.classList.remove("drop", "stamped");
      pass.style.transition = "none";
      const s = 300 / PASS.w;
      pass.style.transform = replay || prev === i ? "translateY(-14px)" : `translate(${SLOT_X(i) - PASS.x}px, ${SLOT_Y - PASS.y}px) scale(${s}) rotate(3deg)`;
      pass.style.opacity = replay ? "1" : "0.4";
      void pass.offsetWidth;
      pass.style.transition = "";
      pass.classList.add("drop");
      pass.style.transform = "";
      pass.style.opacity = "1";
      ctx.sfx("whoosh");

      later(500, () => bws.forEach((b, k) => later(k * 90, () => b.classList.add("set"))));
      const t0 = 1300;
      lis.forEach((l, k) => {
        later(t0 + k * 1050, () => { l.classList.add("done"); });
        later(t0 + k * 1050 + 220, () => { bws[k].classList.add("full"); ctx.sfx("pop"); });
      });
      const tEnd = t0 + lis.length * 1050 + 300;
      later(tEnd, finish);
      later(tEnd + 700, () => {
        let n = 0;
        const step = () => {
          n += 1;
          hand.textContent = servedText.slice(0, n);
          if (n < servedText.length) later(38, step);
          else later(250, () => { pass.classList.add("stamped"); ctx.sfx("bonk"); });
        };
        step();
      });
      // Until the visitor takes over, the kitchen works through the rail on its own.
      later(tEnd + 700 + servedText.length * 38 + 6500, () => { if (!userTouched) fire((cur + 1) % RECIPES.length); });
    }

    later(ctx.reducedMotion ? 0 : 700, () => fire(0));

    return () => { clear(); root.remove(); };
  },
};
