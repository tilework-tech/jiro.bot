// 32x32 pixel-art plates, painted procedurally so they stay crisp at any zoom.
const S = 32;
function cv(draw) {
  return () => {
    const c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d");
    draw(g);
    return c;
  };
}
const px = (g, col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
function ellipse(g, col, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
    if ((x * x) / (rx * rx + 0.5) + (y * y) / (ry * ry + 0.5) <= 1) px(g, col, cx + x, cy + y);
}
function outlineEllipse(g, col, cx, cy, rx, ry) { ellipse(g, col, cx, cy, rx + 1, ry + 1); }
function plate(g, rim = "#c23a2c") {
  outlineEllipse(g, "#1a0f08", 16, 24, 14, 6);
  ellipse(g, rim, 16, 24, 14, 6);
  ellipse(g, "#f3ece0", 16, 23, 11, 4);
  px(g, "#ffffff", 9, 21, 5, 1);
}
function rice(g, x0 = 9, y0 = 16, w = 14, h = 6) {
  px(g, "#1a0f08", x0 - 1, y0 - 1, w + 2, h + 2);
  px(g, "#f4f1e8", x0, y0, w, h);
  px(g, "#d9d2c3", x0, y0 + h - 2, w, 2);
  for (let i = 0; i < 6; i++) px(g, "#ffffff", x0 + 1 + ((i * 5) % (w - 2)), y0 + 1 + (i % 3));
}
function nigiri(fish, stripe, dark) {
  return cv((g) => {
    plate(g);
    rice(g);
    px(g, "#1a0f08", 7, 11, 18, 7);
    px(g, fish, 8, 12, 16, 5);
    px(g, dark, 8, 16, 16, 1);
    for (let i = 0; i < 4; i++) px(g, stripe, 10 + i * 4, 12, 1, 4);
    px(g, "#ffffff", 9, 12, 3, 1);
  });
}
export const KINDS = {
  maguro: { type: "sushi", colors: ["#d2303c", "#f4f1e8", "#8a1a22"] },
  salmon: { type: "sushi", colors: ["#f08a4b", "#ffc59a", "#f4f1e8"] },
  tamago: { type: "sushi", colors: ["#f5c542", "#1c2a1c", "#f4f1e8"] },
  maki: { type: "sushi", colors: ["#1c2a1c", "#f4f1e8", "#e0485a", "#7fbf3f"] },
  ikura: { type: "sushi", colors: ["#ff7a1a", "#1c2a1c", "#ffb070"] },
  ebi: { type: "sushi", colors: ["#ff8e5e", "#ffffff", "#d0401a"] },
  onigiri: { type: "onigiri", colors: ["#f4f1e8", "#1c2a1c"] },
  bomb: { type: "bomb", colors: ["#2b2b2b"] },
  wasabi: { type: "wasabi", colors: ["#7fbf3f"] },
  puffer: { type: "puffer", colors: ["#f5d76e"] },
  bug: { type: "bug", colors: ["#3d6b2d"] },
  duck: { type: "duck", colors: ["#ffd34d"] },
  cat: { type: "cat", colors: ["#ffffff"] },
  apprentice: { type: "apprentice", colors: ["#d98b4e"] },
  gold: { type: "gold", colors: ["#ffd34d"] },
};
export const SPRITES = {
  maguro: nigiri("#d2303c", "#ef6d78", "#8a1a22"),
  salmon: nigiri("#f08a4b", "#ffc59a", "#b85a26"),
  ebi: cv((g) => {
    plate(g); rice(g);
    px(g, "#1a0f08", 7, 11, 19, 7);
    for (let i = 0; i < 16; i++) px(g, i % 3 === 0 ? "#ffffff" : "#ff8e5e", 8 + i, 12, 1, 5);
    px(g, "#d0401a", 23, 10, 3, 3); px(g, "#d0401a", 25, 9, 2, 2);
  }),
  tamago: cv((g) => {
    plate(g); rice(g);
    px(g, "#1a0f08", 7, 10, 18, 8);
    px(g, "#f5c542", 8, 11, 16, 6);
    px(g, "#ffe08a", 8, 11, 16, 1);
    px(g, "#1c2a1c", 14, 10, 4, 12);
  }),
  maki: cv((g) => {
    plate(g);
    for (const cx of [11, 21]) {
      ellipse(g, "#1a0f08", cx, 17, 5, 5);
      ellipse(g, "#1c2a1c", cx, 17, 4, 4);
      ellipse(g, "#f4f1e8", cx, 17, 3, 3);
      px(g, "#e0485a", cx - 1, 16, 2, 2); px(g, "#7fbf3f", cx, 17, 1, 1);
    }
  }),
  ikura: cv((g) => {
    plate(g);
    px(g, "#1a0f08", 8, 12, 16, 10);
    px(g, "#1c2a1c", 9, 13, 14, 8);
    for (let i = 0; i < 7; i++) { ellipse(g, "#ff7a1a", 11 + (i % 4) * 3, 12 + Math.floor(i / 4) * 3, 1, 1); px(g, "#ffd0a0", 11 + (i % 4) * 3, 12 + Math.floor(i / 4) * 3); }
  }),
  onigiri: cv((g) => {
    plate(g);
    for (let y = 0; y < 14; y++) { const w = Math.round(y * 0.9) + 2; px(g, "#1a0f08", 16 - w - 1, 6 + y, w * 2 + 2, 1); }
    for (let y = 1; y < 13; y++) { const w = Math.round(y * 0.9) + 1; px(g, "#f4f1e8", 16 - w, 6 + y, w * 2, 1); }
    px(g, "#1c2a1c", 11, 15, 10, 5);
    px(g, "#1a0f08", 13, 11, 2, 2); px(g, "#1a0f08", 18, 11, 2, 2);
    px(g, "#ff9aa2", 11, 13, 2, 1); px(g, "#ff9aa2", 20, 13, 2, 1);
    px(g, "#1a0f08", 15, 13, 3, 1);
  }),
  bomb: cv((g) => {
    plate(g, "#444");
    ellipse(g, "#000", 16, 15, 7, 7);
    ellipse(g, "#2b2b2b", 16, 15, 6, 6);
    px(g, "#6a6a6a", 13, 11, 2, 2);
    px(g, "#8a6a3a", 20, 7, 1, 3); px(g, "#8a6a3a", 21, 6, 1, 1);
    px(g, "#ffd34d", 22, 4, 2, 2); px(g, "#ff5e3a", 21, 3, 1, 1); px(g, "#ff5e3a", 24, 5, 1, 1);
  }),
  wasabi: cv((g) => {
    plate(g, "#3a6e2a");
    ellipse(g, "#1a0f08", 16, 16, 8, 6);
    ellipse(g, "#7fbf3f", 16, 16, 7, 5);
    ellipse(g, "#b6e36a", 14, 13, 3, 1);
    px(g, "#1a0f08", 12, 15, 2, 2); px(g, "#1a0f08", 18, 15, 2, 2);
    px(g, "#1a0f08", 11, 13, 3, 1); px(g, "#1a0f08", 18, 13, 3, 1);
    px(g, "#1a0f08", 14, 19, 4, 1);
  }),
  puffer: cv((g) => {
    plate(g, "#2d6fa3");
    for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; px(g, "#1a0f08", Math.round(16 + Math.cos(t) * 9), Math.round(15 + Math.sin(t) * 8)); }
    ellipse(g, "#1a0f08", 16, 15, 8, 7);
    ellipse(g, "#f5d76e", 16, 15, 7, 6);
    ellipse(g, "#fff3c0", 16, 18, 5, 2);
    px(g, "#1a0f08", 12, 13, 2, 2); px(g, "#1a0f08", 19, 13, 2, 2);
    px(g, "#e0485a", 15, 17, 3, 2);
  }),
  bug: cv((g) => {
    plate(g, "#5a5a5a");
    for (const y of [12, 15, 18]) { px(g, "#1a0f08", 8, y, 16, 1); }
    ellipse(g, "#1a0f08", 16, 15, 6, 7);
    ellipse(g, "#3d6b2d", 16, 15, 5, 6);
    px(g, "#1a0f08", 16, 9, 1, 12);
    px(g, "#a3d15a", 13, 11, 2, 2);
    ellipse(g, "#1a0f08", 16, 7, 3, 2);
    px(g, "#ff3b3b", 14, 7, 1, 1); px(g, "#ff3b3b", 18, 7, 1, 1);
  }),
  duck: cv((g) => {
    plate(g, "#2d6fa3");
    ellipse(g, "#1a0f08", 15, 17, 8, 5);
    ellipse(g, "#ffd34d", 15, 17, 7, 4);
    ellipse(g, "#1a0f08", 19, 10, 5, 5);
    ellipse(g, "#ffd34d", 19, 10, 4, 4);
    px(g, "#1a0f08", 20, 9, 1, 1);
    px(g, "#ff8a1a", 23, 10, 4, 2);
    px(g, "#ffe89a", 11, 15, 4, 1);
  }),
  cat: cv((g) => {
    plate(g, "#c23a2c");
    ellipse(g, "#1a0f08", 16, 13, 7, 7);
    ellipse(g, "#ffffff", 16, 13, 6, 6);
    px(g, "#1a0f08", 10, 5, 3, 4); px(g, "#1a0f08", 19, 5, 3, 4);
    px(g, "#ffffff", 11, 6, 1, 3); px(g, "#ffffff", 20, 6, 1, 3);
    px(g, "#ff9aa2", 11, 7, 1, 1); px(g, "#ff9aa2", 20, 7, 1, 1);
    px(g, "#1a0f08", 13, 12, 2, 1); px(g, "#1a0f08", 18, 12, 2, 1);
    px(g, "#ff6f91", 15, 14, 2, 1);
    px(g, "#ffffff", 23, 6, 3, 6); px(g, "#1a0f08", 23, 5, 3, 1);
    px(g, "#ffd34d", 14, 18, 4, 2);
  }),
  apprentice: cv((g) => {
    plate(g, "#2d3a6a");
    ellipse(g, "#1a0f08", 16, 13, 7, 7);
    ellipse(g, "#d98b4e", 16, 13, 6, 6);
    px(g, "#f3e6c8", 11, 12, 10, 6);
    px(g, "#ffffff", 9, 8, 14, 2); px(g, "#ffffff", 23, 7, 3, 2);
    px(g, "#6fe3ff", 13, 13, 2, 2); px(g, "#6fe3ff", 18, 13, 2, 2);
    px(g, "#8a5a3a", 14, 16, 4, 1);
  }),
  gold: cv((g) => {
    outlineEllipse(g, "#1a0f08", 16, 24, 14, 6);
    ellipse(g, "#e0a526", 16, 24, 14, 6);
    ellipse(g, "#ffd34d", 16, 23, 11, 4);
    rice(g);
    px(g, "#1a0f08", 7, 11, 18, 7);
    px(g, "#ffd34d", 8, 12, 16, 5);
    px(g, "#fff3b0", 8, 12, 16, 1);
    px(g, "#ffffff", 5, 6, 1, 3); px(g, "#ffffff", 4, 7, 3, 1);
    px(g, "#ffffff", 26, 9, 1, 3); px(g, "#ffffff", 25, 10, 3, 1);
  }),
};
const COMMON = ["maguro", "salmon", "tamago", "maki", "ikura", "ebi", "maguro", "salmon"];
const SPECIAL = ["onigiri", "bomb", "duck", "wasabi", "cat", "puffer", "bug", "apprentice", "onigiri", "bomb", "gold"];
export function pickKind(i) {
  if (i % 4 === 2) return SPECIAL[Math.floor(i / 4) % SPECIAL.length];
  return COMMON[(i * 5 + (i >> 3)) % COMMON.length];
}
