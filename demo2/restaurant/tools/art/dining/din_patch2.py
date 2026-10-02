p='src/scenes/dining.ts'
s=open(p).read()
s=s[:s.index('export const dining')]+'''export const dining: SceneDef = {
  id: "dining",
  room: "Dining room",
  art: ART,
  mood: "bustling",
  hold: 1.3,
  belt: { pts: [[-30, 824, 1.55], [1950, 824, 1.55]], width: 72, plate: 50, fadeIn: 30, fadeOut: 30 },
  surfaces: [
    { poly: [[176, 612], [548, 612], [548, 694], [158, 694]], scale: 0.95, say: "Table 4 didn't order this. They're keeping it." },
    { poly: [[578, 612], [928, 612], [928, 694], [576, 694]], scale: 0.95, say: "Table 7 is splitting it four ways. Git blame says it was you." },
    { poly: [[992, 612], [1348, 612], [1348, 694], [992, 694]], scale: 0.95, say: "Table 9 reviewed it. LGTM, very tasty." },
    { poly: [[1376, 610], [1770, 610], [1772, 694], [1374, 694]], scale: 0.95, say: "Table 12 thinks it's a free sample. Technically, it is." },
    { poly: [[512, 498], [652, 498], [646, 562], [506, 562]], scale: 0.72, say: "Table 2 asked for no wasabi. Jiro already filed a ticket." },
    { poly: [[734, 496], [884, 496], [884, 548], [734, 548]], scale: 0.72, say: "Table 3 is photographing it for the changelog." },
    { poly: [[0, 892], [1920, 892], [1920, 968], [0, 968]], scale: 1.4, say: "Parked on the counter. Jiro wipes around it, silently judging." },
  ],
  under(g, now, api) {
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) {
      const prev = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      const k = art.naturalWidth / 1920;
      for (const [sx, sy, w, h, dx, dy, per, a, b] of SWAPS) {
        const f = ((now % per) + per) % per / per;
        if (f >= a && f < b) g.drawImage(art, sx * k, sy * k, w * k, h * k, sx + dx, sy + dy, w, h);
      }
      g.imageSmoothingEnabled = prev;
    }
    TEA.forEach(([x, y, s]) => steam(g, x, y, now, s, 56, 3, 0.16));
    // Push the room into the background: half-desaturate, then dim (heavier up top).
    g.save();
    g.globalCompositeOperation = "saturation";
    g.fillStyle = "rgba(128,128,128,.55)";
    g.fillRect(0, 0, 1920, 1080);
    g.globalCompositeOperation = "source-over";
    const dim = g.createLinearGradient(0, 0, 0, LEDGE);
    dim.addColorStop(0, "rgba(7,5,4,.66)");
    dim.addColorStop(0.75, "rgba(7,5,4,.58)");
    dim.addColorStop(1, "rgba(7,5,4,.42)");
    g.fillStyle = dim;
    g.fillRect(0, 0, 1920, LEDGE);
    g.fillStyle = "rgba(7,5,4,.34)";
    g.fillRect(0, LEDGE, 1920, 1080 - LEDGE);
    g.restore();
    // Lanterns and portholes still glow softly through the dim.
    const flick = tnow() - flickT;
    LANTERNS.forEach(([x, y, r], i) => {
      if (i === FLICK && flick < 1.6 && Math.floor(flick * 7) % 2 === 0) { g.fillStyle = "rgba(10,6,4,.6)"; g.fillRect(x - 58, y - 80, 116, 165); return; }
      glow(g, x, y, r * 0.8, "rgba(255,196,120,.3)", now, 0.08, 6, i);
      glow(g, x, y, r * 0.3, "rgba(255,214,150,.22)", now, 0.05, 12, i + 1);
    });
    PORTHOLES.forEach(([x, y], i) => glow(g, x, y, 60, "rgba(255,210,130,.16)", now, 0.12, 8, i * 2));
  },
  over(g, now) {
    // String lights twinkle (slow, each bulb its own period).
    g.save();
    g.globalCompositeOperation = "lighter";
    BULBS.forEach(([x, y], i) => {
      const a = 0.1 + 0.12 * (0.5 + 0.5 * wave(now, [6, 8, 12, 24][i % 4], i * 1.9));
      g.fillStyle = `rgba(255,205,120,${a.toFixed(3)})`;
      g.fillRect(x - 4, y - 4, 8, 8);
      g.fillStyle = `rgba(255,190,100,${(a * 0.35).toFixed(3)})`;
      g.fillRect(x - 9, y - 9, 18, 18);
    });
    g.restore();
  },
  mount(el, api) {
    cmp = mountCompare(el, api);
    const [lx, ly] = LANTERNS[FLICK];
    hotspot(el, lx - 52, ly - 70, 104, 110, "Lantern", () => {
      flickT = tnow();
      api.sfx("bonk");
      api.egg("dining-lantern", "Flaky lantern. The generic agent marked it @skip. Jiro filed a bug.");
    });
  },
  enter() {
    cmp?.enter();
  },
  leave() {
    cmp?.leave();
  },
};
'''
s=s.replace('import { glow, shade, steam, wave } from "../engine/fx";','import { glow, steam, wave } from "../engine/fx";')
s=s.replace('import { hotspot, bubble } from "../engine/dom";','import { hotspot } from "../engine/dom";')
open(p,'w').write(s)
