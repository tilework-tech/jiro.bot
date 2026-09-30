/**
 * The short passages between scenes: one wall band per passage, drawn as low-res pixel art and scaled
 * up with nearest-neighbour. Each wall has an opening exactly where the belt crosses it. The wall sits
 * above the belt canvas, so plates disappear into the wall and come out of the opening.
 */

export type PassStyle = "noren" | "shoji" | "moon" | "sliding" | "backdoor" | "fence";
const PX = 3; // css px per art pixel

interface Palette { plaster: string; plaster2: string; wood: string; woodHi: string; woodDk: string; floor: string; glow: string }
const INDOOR: Palette = { plaster: "#3d2c22", plaster2: "#35261d", wood: "#4a2c18", woodHi: "#7a4a28", woodDk: "#1e120a", floor: "#0d0806", glow: "rgba(255,190,110,0.16)" };
const STREET: Palette = { plaster: "#2a2733", plaster2: "#24212c", wood: "#3a2a22", woodHi: "#5e4636", woodDk: "#151219", floor: "#0b0a10", glow: "rgba(120,200,255,0.10)" };
const GARDEN: Palette = { plaster: "#141c18", plaster2: "#111814", wood: "#39431f", woodHi: "#56612f", woodDk: "#0e1309", floor: "#070b0c", glow: "rgba(160,220,255,0.08)" };

function rng(seed: number) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9 >>> 0) / 4294967296); }

export interface PassGeom { top: number; height: number; width: number; cross: { x: number; w: number }[] }

/** Draw a passage. `cross` holds the belt centre (css px, relative to the pass) at the band's top, middle and bottom. */
export function drawPass(el: HTMLElement, style: PassStyle, geom: PassGeom) {
  el.querySelectorAll(".wall, .wall-deco").forEach((n) => n.remove());
  const W = Math.ceil(geom.width / PX), H = Math.ceil(geom.height / PX);
  const c = document.createElement("canvas");
  c.className = "wall"; c.width = W; c.height = H;
  c.style.width = `${W * PX}px`; c.style.height = `${H * PX}px`;
  const g = c.getContext("2d")!;
  const pal = style === "backdoor" ? STREET : style === "fence" ? GARDEN : INDOOR;
  const r = rng(W * 31 + H * 17 + style.length);
  const bandTop = Math.round(H * 0.2), bandBot = Math.round(H * 0.8);
  const bh = bandBot - bandTop;

  // opening: covers every x the belt occupies while crossing the band, plus a margin
  const xs = geom.cross.map((c) => c.x / PX);
  const bw = Math.max(...geom.cross.map((c) => c.w)) / PX;
  let o0 = Math.floor(Math.min(...xs) - bw * 0.95), o1 = Math.ceil(Math.max(...xs) + bw * 0.95);
  const ocx = (o0 + o1) / 2;

  const rect = (x: number, y: number, w: number, h: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  // wall body
  for (let y = bandTop; y < bandBot; y++) for (let x = 0; x < W; x += 1) {
    const n = r();
    g.fillStyle = n < 0.06 ? pal.plaster2 : pal.plaster;
    g.fillRect(x, y, 1, 1);
  }
  if (style === "fence") {
    // bamboo fence: vertical culms with nodes and two binding rails
    for (let x = 0; x < W; x += 5) {
      rect(x, bandTop, 4, bh, x % 10 ? pal.wood : "#323b1b");
      rect(x, bandTop, 1, bh, pal.woodHi);
      rect(x + 3, bandTop, 1, bh, pal.woodDk);
      for (let y = bandTop + 6 + (x % 7); y < bandBot; y += 14) rect(x, y, 4, 1, pal.woodDk);
    }
    for (const fy of [0.3, 0.7]) { const y = bandTop + Math.round(bh * fy); rect(0, y, W, 3, "#3b2a16"); rect(0, y, W, 1, "#6a4a26"); for (let x = 2; x < W; x += 10) rect(x, y - 1, 2, 5, "#2a1c0e"); }
  } else if (style === "shoji") {
    // paper panes lit warmly from the room behind, dark lattice
    rect(0, bandTop, W, bh, "#cdb98f");
    for (let y = bandTop; y < bandBot; y++) { const t = (y - bandTop) / bh; g.fillStyle = `rgba(255,200,120,${0.18 * (1 - Math.abs(t - 0.5) * 2)})`; g.fillRect(0, y, W, 1); }
    for (let x = 0; x < W; x += 12) rect(x, bandTop, 2, bh, pal.woodDk);
    for (let y = bandTop; y < bandBot; y += 10) rect(0, y, W, 1, pal.woodDk);
    for (let x = 0; x < W; x += 48) rect(x, bandTop, 4, bh, pal.wood);
  } else {
    // wainscot and posts
    const wy = bandTop + Math.round(bh * 0.58);
    rect(0, wy, W, bandBot - wy, pal.woodDk);
    for (let x = 0; x < W; x += 7) rect(x, wy, 1, bandBot - wy, "#2c1a0f");
    rect(0, wy, W, 2, pal.wood);
    for (let x = 18; x < W; x += 64) { rect(x, bandTop, 5, bh, pal.wood); rect(x, bandTop, 1, bh, pal.woodHi); rect(x + 4, bandTop, 1, bh, pal.woodDk); }
    if (style === "backdoor") {
      // brick-ish lower wall of the alley and a paper lamp
      for (let y = wy; y < bandBot; y += 4) for (let x = ((y / 4) % 2) * 6; x < W; x += 12) rect(x, y, 11, 3, "#2e2630");
    }
  }
  // beam and sill
  rect(0, bandTop - 4, W, 4, pal.wood); rect(0, bandTop - 4, W, 1, pal.woodHi); rect(0, bandTop - 1, W, 1, pal.woodDk);
  rect(0, bandBot, W, 4, pal.wood); rect(0, bandBot, W, 1, pal.woodHi); rect(0, bandBot + 3, W, 1, pal.woodDk);

  // warm light spilling around the opening
  const glow = g.createRadialGradient(ocx, (bandTop + bandBot) / 2, 2, ocx, (bandTop + bandBot) / 2, (o1 - o0) * 1.1 + bh * 0.4);
  glow.addColorStop(0, pal.glow); glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow; g.fillRect(0, bandTop - 4, W, bh + 8);

  // cut the opening
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "#000";
  if (style === "moon") {
    const rx = Math.max((o1 - o0) / 2 + 3, bh * 0.44), ry = bh * 0.47;
    g.beginPath(); g.ellipse(ocx, (bandTop + bandBot) / 2, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.strokeStyle = pal.woodHi; g.lineWidth = 2; g.beginPath(); g.ellipse(ocx, (bandTop + bandBot) / 2, rx + 1, ry + 1, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = pal.woodDk; g.lineWidth = 1; g.beginPath(); g.ellipse(ocx, (bandTop + bandBot) / 2, rx + 3, ry + 3, 0, 0, Math.PI * 2); g.stroke();
  } else {
    g.fillRect(o0, bandTop - 4, o1 - o0, bh + 8);
    g.restore();
    // frame posts
    for (const x of [o0 - 4, o1]) { rect(x, bandTop - 6, 4, bh + 12, pal.wood); rect(x, bandTop - 6, 1, bh + 12, pal.woodHi); rect(x + 3, bandTop - 6, 1, bh + 12, pal.woodDk); }
    if (style !== "fence") { rect(o0 - 6, bandTop - 8, o1 - o0 + 12, 4, pal.wood); rect(o0 - 6, bandTop - 8, o1 - o0 + 12, 1, pal.woodHi); }
    if (style === "sliding") {
      // the fusuma slid aside, half-covering the wall next to the opening
      const dw = Math.min(40, Math.round((o1 - o0) * 0.7));
      for (const [x, s] of [[o0 - 4 - dw, 1], [o1 + 4, -1]] as [number, number][]) {
        rect(x, bandTop, dw, bh, "#c9b48a"); rect(x, bandTop, dw, 2, pal.woodDk); rect(x, bandBot - 2, dw, 2, pal.woodDk);
        rect(s > 0 ? x : x + dw - 2, bandTop, 2, bh, pal.woodDk);
        for (let y = bandTop + 8; y < bandBot - 4; y += 9) rect(x + 3, y, dw - 6, 1, "rgba(120,90,50,0.35)");
        rect(x + (s > 0 ? dw - 7 : 4), bandTop + Math.round(bh / 2) - 2, 3, 4, pal.woodDk);
      }
    }
    if (style === "backdoor") {
      // open wooden door swung against the wall, sign and a lamp
      const dw = Math.min(26, Math.round(bh * 0.4));
      const dx = o1 + 4;
      rect(dx, bandTop, dw, bh, "#4a3222"); for (let x = dx + 3; x < dx + dw; x += 5) rect(x, bandTop, 1, bh, "#2a1a10");
      rect(dx + 2, bandTop + Math.round(bh / 2), 3, 2, "#c9a24a");
      rect(o0 - 22, bandTop + 6, 14, 20, "#e8e0cc"); rect(o0 - 21, bandTop + 7, 12, 18, "#f6efdd");
    }
  }
  el.appendChild(c);

  // noren curtains hang in front of the belt; drawn as separate swaying strips
  const deco = document.createElement("div");
  deco.className = "wall-deco";
  const openPx = (o1 - o0) * PX, leftPx = o0 * PX, topPx = bandTop * PX;
  if (style === "noren") {
    const n = Math.max(3, Math.round(openPx / 90)), sw = openPx / n;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      s.className = "noren";
      s.style.cssText = `left:${leftPx + i * sw + 1}px;top:${topPx - 2}px;width:${sw - 3}px;height:${bh * PX * 0.3}px;animation-delay:${-i * 1.7}s`;
      if (i === Math.floor(n / 2)) s.dataset.mark = "寿";
      deco.appendChild(s);
    }
  }
  if (style === "backdoor" || style === "sliding" || style === "noren") {
    const lamp = document.createElement("i");
    lamp.className = "lamp";
    lamp.style.cssText = `left:${leftPx - (style === "backdoor" ? 110 : 70)}px;top:${topPx + 14}px`;
    deco.appendChild(lamp);
  }
  if (style === "backdoor") {
    const sign = document.createElement("i");
    sign.className = "sign"; sign.textContent = "裏口";
    sign.style.cssText = `left:${leftPx - 60}px;top:${topPx + 22}px`;
    deco.appendChild(sign);
  }
  el.appendChild(deco);
  return { bandTop: bandTop * PX, bandBot: bandBot * PX, open: [o0 * PX, o1 * PX] as [number, number] };
}
