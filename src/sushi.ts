// Sushi art. Every piece is drawn procedurally, then baked once into an
// offscreen canvas per (kind, variant) so the main loop only blits sprites.

export type Kind =
  | 'salmon'
  | 'maguro'
  | 'hamachi'
  | 'tamago'
  | 'ebi'
  | 'unagi'
  | 'kappa'
  | 'sakemaki'
  | 'ikura'
  | 'onigiri'
  | 'rock'
  | 'rice'
  | 'topping-salmon'
  | 'topping-maguro'
  | 'topping-hamachi'
  | 'topping-tamago'
  | 'topping-ebi'
  | 'topping-unagi';

export type Variant = 'normal' | 'stone' | 'gold' | 'pixel';

export const BELT_KINDS: Kind[] = ['salmon', 'maguro', 'tamago', 'ebi', 'unagi', 'hamachi', 'kappa', 'sakemaki', 'ikura', 'salmon', 'maguro', 'onigiri'];

export const NIGIRI: Kind[] = ['salmon', 'maguro', 'hamachi', 'tamago', 'ebi', 'unagi'];

export interface Spec {
  w: number;
  h: number;
  r: number;
  face: { x: number; y: number; s: number; light: boolean };
  name: string;
  round: boolean;
}

const nigiriFace = { x: 0, y: -3, s: 1, light: false };

export const SPECS: Record<Kind, Spec> = {
  salmon: { w: 80, h: 48, r: 22, face: nigiriFace, name: 'Sake nigiri', round: false },
  maguro: { w: 80, h: 48, r: 22, face: { ...nigiriFace, light: true }, name: 'Maguro nigiri', round: false },
  hamachi: { w: 80, h: 48, r: 22, face: nigiriFace, name: 'Hamachi nigiri', round: false },
  tamago: { w: 80, h: 48, r: 22, face: { x: -16, y: -5, s: 0.9, light: false }, name: 'Tamago', round: false },
  ebi: { w: 92, h: 48, r: 22, face: { x: -4, y: -3, s: 1, light: false }, name: 'Ebi nigiri', round: false },
  unagi: { w: 80, h: 48, r: 22, face: { x: -16, y: -4, s: 0.9, light: true }, name: 'Unagi', round: false },
  kappa: { w: 52, h: 50, r: 23, face: { x: 0, y: 13, s: 0.85, light: true }, name: 'Kappa maki', round: true },
  sakemaki: { w: 52, h: 50, r: 23, face: { x: 0, y: 13, s: 0.85, light: true }, name: 'Sake maki', round: true },
  ikura: { w: 60, h: 50, r: 23, face: { x: 0, y: 11, s: 0.85, light: true }, name: 'Ikura gunkan', round: false },
  onigiri: { w: 56, h: 54, r: 24, face: { x: 0, y: 2, s: 0.95, light: false }, name: 'Onigiri', round: false },
  rock: { w: 50, h: 42, r: 20, face: { x: 0, y: 0, s: 0.9, light: false }, name: 'A rock', round: true },
  rice: { w: 72, h: 30, r: 15, face: { x: 0, y: 6, s: 0.85, light: false }, name: 'Rice', round: false },
  'topping-salmon': { w: 80, h: 34, r: 15, face: { x: 0, y: -1, s: 0.9, light: false }, name: 'Salmon', round: false },
  'topping-maguro': { w: 80, h: 34, r: 15, face: { x: 0, y: -1, s: 0.9, light: true }, name: 'Tuna', round: false },
  'topping-hamachi': { w: 80, h: 34, r: 15, face: { x: 0, y: -1, s: 0.9, light: false }, name: 'Yellowtail', round: false },
  'topping-tamago': { w: 80, h: 34, r: 15, face: { x: -16, y: -3, s: 0.9, light: false }, name: 'Egg', round: false },
  'topping-ebi': { w: 92, h: 34, r: 15, face: { x: -4, y: -1, s: 0.9, light: false }, name: 'Shrimp', round: false },
  'topping-unagi': { w: 80, h: 34, r: 15, face: { x: -16, y: -2, s: 0.9, light: true }, name: 'Eel', round: false },
};

export function toppingOf(k: Kind): Kind | null {
  return (NIGIRI.includes(k) ? (`topping-${k}` as Kind) : null);
}

export function nigiriOf(k: Kind): Kind | null {
  return k.startsWith('topping-') ? (k.slice(8) as Kind) : null;
}

// Deterministic PRNG so baked textures look identical between reloads.
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type C = CanvasRenderingContext2D;

function grains(c: C, rand: () => number, n: number, x0: number, y0: number, x1: number, y1: number, size = 1) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + rand() * (y1 - y0);
    c.save();
    c.translate(x, y);
    c.rotate(rand() * Math.PI);
    c.beginPath();
    c.ellipse(0, 0, 3.3 * size, 1.9 * size, 0, 0, Math.PI * 2);
    const shade = 244 + Math.floor(rand() * 11);
    c.fillStyle = `rgb(${shade},${shade - 4},${shade - 14})`;
    c.fill();
    c.lineWidth = 0.6;
    c.strokeStyle = 'rgba(150,130,100,0.35)';
    c.stroke();
    c.beginPath();
    c.ellipse(-0.8 * size, -0.6 * size, 1.4 * size, 0.6 * size, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fill();
    c.restore();
  }
}

function riceLoaf(c: C, rand: () => number, w = 64, top = -4, bottom = 20) {
  const hw = w / 2;
  c.save();
  c.beginPath();
  c.moveTo(-hw, (top + bottom) / 2);
  c.bezierCurveTo(-hw, top - 2, hw, top - 2, hw, (top + bottom) / 2);
  c.bezierCurveTo(hw, bottom + 3, -hw, bottom + 3, -hw, (top + bottom) / 2);
  c.closePath();
  const g = c.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#fffdf6');
  g.addColorStop(0.7, '#f1e9d8');
  g.addColorStop(1, '#d9ccb2');
  c.fillStyle = g;
  c.fill();
  c.clip();
  grains(c, rand, Math.round(w * 0.9), -hw, top - 2, hw, bottom + 2);
  // Ambient occlusion along the bottom.
  const ao = c.createLinearGradient(0, bottom - 8, 0, bottom + 3);
  ao.addColorStop(0, 'rgba(120,95,60,0)');
  ao.addColorStop(1, 'rgba(120,95,60,0.35)');
  c.fillStyle = ao;
  c.fillRect(-hw, top, w, bottom - top + 4);
  c.restore();
}

function drapePath(c: C, w = 76, lift = 0) {
  const hw = w / 2;
  c.beginPath();
  c.moveTo(-hw, 5 + lift);
  c.bezierCurveTo(-hw + 6, -19 + lift, hw - 8, -21 + lift, hw, -1 + lift);
  c.bezierCurveTo(hw + 2, 3 + lift, hw - 1, 7 + lift, hw - 4, 8 + lift);
  c.bezierCurveTo(hw * 0.45, 11 + lift, -hw * 0.45, 13 + lift, -hw + 4, 10 + lift);
  c.bezierCurveTo(-hw, 9 + lift, -hw - 1, 7 + lift, -hw, 5 + lift);
  c.closePath();
}

function gloss(c: C, x: number, y: number, rx: number, ry: number, a = 0.45, rot = -0.2) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, ry / rx);
  c.translate(-x, -y);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, rx, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function topping(c: C, kind: string, rand: () => number, lift = 0) {
  const w = 76;
  c.save();
  // Soft contact shadow on the rice.
  c.save();
  c.translate(0, 4 + lift);
  c.globalAlpha = 0.25;
  drapePath(c, w - 4, 2);
  c.fillStyle = '#7a4a2a';
  c.filter = 'blur(2px)';
  c.fill();
  c.filter = 'none';
  c.restore();

  drapePath(c, w, lift);
  c.save();
  c.clip();
  if (kind === 'salmon' || kind === 'hamachi') {
    const g = c.createLinearGradient(-w / 2, -20, w / 2, 12);
    if (kind === 'salmon') {
      g.addColorStop(0, '#ffa071');
      g.addColorStop(0.5, '#ff7a47');
      g.addColorStop(1, '#f2582c');
    } else {
      g.addColorStop(0, '#fbe6d6');
      g.addColorStop(0.6, '#f3cdb2');
      g.addColorStop(1, '#e9ad93');
    }
    c.fillStyle = g;
    c.fillRect(-50, -30, 100, 50);
    if (kind === 'hamachi') {
      // Blood-line blush along one edge.
      const bl = c.createLinearGradient(0, -20, 0, 14);
      bl.addColorStop(0, 'rgba(214,92,92,0)');
      bl.addColorStop(0.75, 'rgba(214,92,92,0)');
      bl.addColorStop(1, 'rgba(214,92,92,0.55)');
      c.fillStyle = bl;
      c.fillRect(-50, -30, 100, 50);
    }
    c.strokeStyle = kind === 'salmon' ? 'rgba(255,236,222,0.9)' : 'rgba(255,250,244,0.7)';
    c.lineCap = 'round';
    for (let i = -6; i < 8; i++) {
      const x = i * 9 + lift;
      c.lineWidth = kind === 'salmon' ? 2.4 + rand() * 1.2 : 1.4;
      c.beginPath();
      c.moveTo(x - 10, -24);
      c.quadraticCurveTo(x + 2, -6, x + 12, 16);
      c.stroke();
    }
  } else if (kind === 'maguro') {
    const g = c.createLinearGradient(-w / 2, -20, w / 2, 12);
    g.addColorStop(0, '#e2394b');
    g.addColorStop(0.55, '#c21f33');
    g.addColorStop(1, '#8e1325');
    c.fillStyle = g;
    c.fillRect(-50, -30, 100, 50);
    c.strokeStyle = 'rgba(255,140,150,0.25)';
    c.lineWidth = 1;
    for (let i = -6; i < 8; i++) {
      c.beginPath();
      c.moveTo(i * 8 - 8, -24);
      c.quadraticCurveTo(i * 8 + 4, -4, i * 8 + 12, 16);
      c.stroke();
    }
  } else if (kind === 'ebi') {
    c.fillStyle = '#fff1e4';
    c.fillRect(-50, -30, 100, 50);
    for (let i = -5; i < 6; i++) {
      const x = i * 8;
      const g = c.createLinearGradient(x - 3, 0, x + 5, 0);
      g.addColorStop(0, '#ff5d3b');
      g.addColorStop(0.6, '#ff7f5a');
      g.addColorStop(1, 'rgba(255,127,90,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(x - 3, -24);
      c.quadraticCurveTo(x + 4, -4, x - 2, 16);
      c.lineTo(x + 3, 16);
      c.quadraticCurveTo(x + 9, -4, x + 2, -24);
      c.fill();
    }
  } else if (kind === 'unagi') {
    const g = c.createLinearGradient(0, -20, 0, 12);
    g.addColorStop(0, '#a4521f');
    g.addColorStop(0.5, '#7a3713');
    g.addColorStop(1, '#4e210a');
    c.fillStyle = g;
    c.fillRect(-50, -30, 100, 50);
    c.strokeStyle = 'rgba(40,14,4,0.55)';
    c.lineWidth = 2.5;
    for (let i = -4; i < 5; i++) {
      c.beginPath();
      c.moveTo(i * 12 - 4, -22);
      c.lineTo(i * 12 + 6, 14);
      c.stroke();
    }
    for (let i = 0; i < 14; i++) {
      c.save();
      c.translate(-30 + rand() * 60, -14 + rand() * 18);
      c.rotate(rand() * Math.PI);
      c.fillStyle = '#f4e6c6';
      c.beginPath();
      c.ellipse(0, 0, 1.8, 1, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
  c.restore();
  // Rim light along the top edge.
  c.save();
  drapePath(c, w, lift);
  c.clip();
  c.lineWidth = 3;
  c.strokeStyle = kind === 'maguro' || kind === 'unagi' ? 'rgba(255,170,150,0.35)' : 'rgba(255,255,255,0.35)';
  drapePath(c, w, lift - 1.5);
  c.stroke();
  c.restore();
  gloss(c, -12, -9 + lift, 20, 6, kind === 'unagi' ? 0.55 : 0.4);
  drapePath(c, w, lift);
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(60,20,10,0.25)';
  c.stroke();
  if (kind === 'ebi') {
    // Tail fan poking out the right side.
    c.save();
    c.translate(w / 2 - 2, 0 + lift);
    for (let i = -1; i <= 1; i++) {
      c.save();
      c.rotate(i * 0.45);
      const g = c.createLinearGradient(0, 0, 16, 0);
      g.addColorStop(0, '#ff6a45');
      g.addColorStop(1, '#c9301a');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(10, -7, 17, -3);
      c.quadraticCurveTo(12, 0, 17, 3);
      c.quadraticCurveTo(10, 7, 0, 0);
      c.fill();
      c.restore();
    }
    c.restore();
  }
  c.restore();
}

function tamagoBlock(c: C, rand: () => number, lift = 0) {
  c.save();
  c.save();
  c.globalAlpha = 0.25;
  c.fillStyle = '#7a4a2a';
  c.filter = 'blur(2px)';
  c.beginPath();
  c.roundRect(-34, -12 + lift + 4, 68, 22, 5);
  c.fill();
  c.restore();
  c.beginPath();
  c.roundRect(-36, -16 + lift, 72, 22, 5);
  const g = c.createLinearGradient(0, -16, 0, 6);
  g.addColorStop(0, '#ffe07a');
  g.addColorStop(0.5, '#ffcf4f');
  g.addColorStop(1, '#e8a930');
  c.fillStyle = g;
  c.fill();
  c.save();
  c.clip();
  c.strokeStyle = 'rgba(200,130,20,0.45)';
  c.lineWidth = 1;
  for (let y = -12; y < 6; y += 4) {
    c.beginPath();
    c.moveTo(-36, y + lift + rand());
    c.bezierCurveTo(-10, y + lift - 1, 10, y + lift + 1, 36, y + lift);
    c.stroke();
  }
  for (let i = 0; i < 7; i++) {
    c.fillStyle = `rgba(190,110,20,${0.15 + rand() * 0.25})`;
    c.beginPath();
    c.ellipse(-30 + rand() * 60, -14 + lift + rand() * 3, 4 + rand() * 6, 1.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  gloss(c, -14, -12 + lift, 18, 4, 0.5, 0);
  c.restore();
}

function noriBelt(c: C, x: number, top: number, bottom: number, w = 13) {
  c.save();
  c.beginPath();
  c.roundRect(x - w / 2, top, w, bottom - top, 2);
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#16201a');
  g.addColorStop(0.45, '#2e3d32');
  g.addColorStop(1, '#131a15');
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = 'rgba(160,190,150,0.15)';
  c.lineWidth = 0.8;
  for (let y = top + 3; y < bottom; y += 4) {
    c.beginPath();
    c.moveTo(x - w / 2 + 1, y);
    c.lineTo(x + w / 2 - 1, y + 1);
    c.stroke();
  }
  c.restore();
}

function maki(c: C, rand: () => number, filling: 'kappa' | 'sake') {
  const rx = 23, ry = 15, top = -8, side = 18;
  // Side band (nori).
  c.save();
  c.beginPath();
  c.ellipse(0, top + side, rx, ry, 0, 0, Math.PI);
  c.lineTo(-rx, top);
  c.ellipse(0, top, rx, ry, 0, Math.PI, 0, true);
  c.closePath();
  const g = c.createLinearGradient(-rx, 0, rx, 0);
  g.addColorStop(0, '#0f1611');
  g.addColorStop(0.3, '#2d3d31');
  g.addColorStop(0.5, '#3b4d3f');
  g.addColorStop(1, '#0c120e');
  c.fillStyle = g;
  c.fill();
  c.clip();
  c.strokeStyle = 'rgba(170,200,160,0.12)';
  for (let x = -rx; x < rx; x += 3) {
    c.beginPath();
    c.moveTo(x, top);
    c.lineTo(x + 1, top + side + ry);
    c.stroke();
  }
  c.restore();
  // Top face: nori ring, rice, filling.
  c.beginPath();
  c.ellipse(0, top, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = '#1d2920';
  c.fill();
  c.save();
  c.beginPath();
  c.ellipse(0, top, rx - 2.6, ry - 2.2, 0, 0, Math.PI * 2);
  c.fillStyle = '#f6efe1';
  c.fill();
  c.clip();
  grains(c, rand, 34, -rx, top - ry, rx, top + ry, 0.85);
  c.restore();
  if (filling === 'kappa') {
    c.beginPath();
    c.ellipse(0, top, 8.5, 6.2, 0, 0, Math.PI * 2);
    c.fillStyle = '#3f7a2a';
    c.fill();
    c.beginPath();
    c.ellipse(0, top, 7, 5, 0, 0, Math.PI * 2);
    c.fillStyle = '#b8dc7c';
    c.fill();
    c.fillStyle = '#e9f5c8';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      c.beginPath();
      c.ellipse(Math.cos(a) * 3, top + Math.sin(a) * 2.2, 1.2, 0.8, a, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    c.save();
    c.beginPath();
    c.roundRect(-8, top - 6, 16, 12, 3);
    c.fillStyle = '#ff7a47';
    c.fill();
    c.clip();
    c.strokeStyle = 'rgba(255,230,210,0.9)';
    c.lineWidth = 1.6;
    for (let i = -3; i < 4; i++) {
      c.beginPath();
      c.moveTo(i * 5 - 4, top - 8);
      c.lineTo(i * 5 + 4, top + 8);
      c.stroke();
    }
    c.restore();
  }
  for (let i = 0; i < 6; i++) {
    c.fillStyle = rand() > 0.5 ? '#2a2018' : '#efe2c2';
    c.beginPath();
    c.ellipse(-14 + rand() * 28, top - 9 + rand() * 18, 1.3, 0.7, rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  gloss(c, -8, top - 7, 12, 4, 0.35, -0.1);
}

function gunkan(c: C, rand: () => number) {
  const rx = 27, ry = 13, top = -6, side = 17;
  c.save();
  c.beginPath();
  c.ellipse(0, top + side, rx, ry, 0, 0, Math.PI);
  c.lineTo(-rx, top);
  c.ellipse(0, top, rx, ry, 0, Math.PI, 0, true);
  c.closePath();
  const g = c.createLinearGradient(-rx, 0, rx, 0);
  g.addColorStop(0, '#0f1611');
  g.addColorStop(0.35, '#304233');
  g.addColorStop(1, '#0c120e');
  c.fillStyle = g;
  c.fill();
  c.restore();
  c.beginPath();
  c.ellipse(0, top, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = '#1b261e';
  c.fill();
  // Cucumber leaf garnish.
  c.save();
  c.translate(-12, top - 3);
  c.rotate(-0.5);
  c.beginPath();
  c.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
  c.fillStyle = '#5e9a36';
  c.fill();
  c.restore();
  // Heaped roe.
  const pearls: [number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand());
    pearls.push([Math.cos(a) * d * (rx - 6), top - 4 + Math.sin(a) * d * (ry - 3) - (1 - d) * 6]);
  }
  pearls.sort((p, q) => p[1] - q[1]);
  for (const [x, y] of pearls) {
    const pg = c.createRadialGradient(x - 1.2, y - 1.2, 0.3, x, y, 4.2);
    pg.addColorStop(0, '#ffd08a');
    pg.addColorStop(0.35, '#ff8a2a');
    pg.addColorStop(1, '#c8360e');
    c.fillStyle = pg;
    c.beginPath();
    c.arc(x, y, 4.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(x - 1.4, y - 1.5, 1, 0, Math.PI * 2);
    c.fill();
  }
}

function onigiri(c: C, rand: () => number) {
  c.save();
  c.beginPath();
  c.moveTo(0, -24);
  c.bezierCurveTo(8, -24, 26, 6, 25, 16);
  c.bezierCurveTo(24, 24, -24, 24, -25, 16);
  c.bezierCurveTo(-26, 6, -8, -24, 0, -24);
  c.closePath();
  const g = c.createLinearGradient(0, -24, 0, 24);
  g.addColorStop(0, '#fffdf6');
  g.addColorStop(1, '#e2d6bd');
  c.fillStyle = g;
  c.fill();
  c.clip();
  grains(c, rand, 60, -26, -26, 26, 24);
  noriBelt(c, 0, 6, 26, 26);
  c.restore();
  for (let i = 0; i < 8; i++) {
    c.fillStyle = '#2a2018';
    c.beginPath();
    c.ellipse(-12 + rand() * 24, -14 + rand() * 16, 1.3, 0.7, rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  gloss(c, -6, -12, 10, 6, 0.4);
}

function rock(c: C, rand: () => number) {
  const pts: [number, number][] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 18 + rand() * 6;
    pts.push([Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.85]);
  }
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  const g = c.createRadialGradient(-8, -10, 2, 0, 0, 28);
  g.addColorStop(0, '#b9b3aa');
  g.addColorStop(0.6, '#7d766d');
  g.addColorStop(1, '#4b4640');
  c.fillStyle = g;
  c.fill();
  c.save();
  c.clip();
  for (let i = 0; i < 40; i++) {
    c.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
    c.fillRect(-26 + rand() * 52, -22 + rand() * 44, 1.5, 1.5);
  }
  c.strokeStyle = 'rgba(40,36,32,0.5)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-4, -18);
  c.lineTo(2, -6);
  c.lineTo(-2, 2);
  c.lineTo(6, 12);
  c.stroke();
  c.restore();
  c.lineWidth = 1.5;
  c.strokeStyle = 'rgba(30,26,22,0.6)';
  c.stroke();
}

export function drawKind(c: C, kind: Kind, seed = 1) {
  const rand = mulberry(seed * 9973 + kind.length * 131);
  switch (kind) {
    case 'salmon':
    case 'maguro':
    case 'hamachi':
    case 'ebi':
      riceLoaf(c, rand);
      topping(c, kind, rand);
      break;
    case 'tamago':
      riceLoaf(c, rand);
      tamagoBlock(c, rand);
      noriBelt(c, 4, -18, 22);
      break;
    case 'unagi':
      riceLoaf(c, rand);
      topping(c, 'unagi', rand);
      noriBelt(c, 6, -18, 22);
      break;
    case 'kappa':
      maki(c, rand, 'kappa');
      break;
    case 'sakemaki':
      maki(c, rand, 'sake');
      break;
    case 'ikura':
      gunkan(c, rand);
      break;
    case 'onigiri':
      onigiri(c, rand);
      break;
    case 'rock':
      rock(c, rand);
      break;
    case 'rice':
      riceLoaf(c, rand, 64, -8, 12);
      break;
    default: {
      const base = nigiriOf(kind)!;
      c.save();
      c.translate(0, 6);
      if (base === 'tamago') tamagoBlock(c, rand, 0);
      else topping(c, base, rand, 0);
      c.restore();
    }
  }
}

const BAKE = 3;
const cache = new Map<string, HTMLCanvasElement>();

export function sprite(kind: Kind, variant: Variant = 'normal'): HTMLCanvasElement {
  const key = kind + ':' + variant;
  let cv = cache.get(key);
  if (cv) return cv;
  const s = SPECS[kind];
  const pad = 14;
  cv = document.createElement('canvas');
  cv.width = Math.ceil((s.w + pad * 2) * BAKE);
  cv.height = Math.ceil((s.h + pad * 2) * BAKE);
  const c = cv.getContext('2d')!;
  c.scale(BAKE, BAKE);
  c.translate(s.w / 2 + pad, s.h / 2 + pad);
  drawKind(c, kind);
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (variant === 'stone') {
    c.globalCompositeOperation = 'saturation';
    c.fillStyle = '#808080';
    c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = '#9a948c';
    c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-atop';
    const r = mulberry(7);
    for (let i = 0; i < 500; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.18)';
      c.fillRect(r() * cv.width, r() * cv.height, 3, 3);
    }
  } else if (variant === 'gold') {
    c.globalCompositeOperation = 'saturation';
    c.fillStyle = '#808080';
    c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'multiply';
    const g = c.createLinearGradient(0, 0, cv.width, cv.height);
    g.addColorStop(0, '#fff0a8');
    g.addColorStop(0.5, '#ffc53d');
    g.addColorStop(1, '#c98a12');
    c.fillStyle = g;
    c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'screen';
    c.fillStyle = 'rgba(120,70,0,0.25)';
    c.fillRect(0, 0, cv.width, cv.height);
  } else if (variant === 'pixel') {
    const small = document.createElement('canvas');
    small.width = Math.ceil(cv.width / 14);
    small.height = Math.ceil(cv.height / 14);
    const sc = small.getContext('2d')!;
    sc.drawImage(cv, 0, 0, small.width, small.height);
    // Hard alpha threshold so the pixel edges read as pixel art.
    const img = sc.getImageData(0, 0, small.width, small.height);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 90 ? 255 : 0;
    sc.putImageData(img, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.imageSmoothingEnabled = false;
    c.drawImage(small, 0, 0, cv.width, cv.height);
  }
  c.globalCompositeOperation = 'destination-in';
  if (variant === 'stone' || variant === 'gold') {
    // Re-mask to the original silhouette (composite ops above tint the pad).
    const mask = document.createElement('canvas');
    mask.width = cv.width;
    mask.height = cv.height;
    const mc = mask.getContext('2d')!;
    mc.scale(BAKE, BAKE);
    mc.translate(s.w / 2 + pad, s.h / 2 + pad);
    drawKind(mc, kind);
    c.drawImage(mask, 0, 0);
  }
  c.globalCompositeOperation = 'source-over';
  cache.set(key, cv);
  return cv;
}

export function spriteOffset(kind: Kind) {
  const s = SPECS[kind];
  return { w: s.w + 28, h: s.h + 28 };
}

export type Mood = 'neutral' | 'happy' | 'surprised' | 'dizzy' | 'sleep' | 'love' | 'angry' | 'wink' | 'scared' | 'smug' | 'dead';

export function drawFace(
  c: C,
  kind: Kind,
  mood: Mood,
  blink: number,
  lookX: number,
  lookY: number,
  t: number,
  blush = 0,
) {
  const f = SPECS[kind].face;
  c.save();
  c.translate(f.x, f.y);
  c.scale(f.s, f.s);
  const ink = f.light ? '#fff6ea' : '#2a1208';
  const ex = 8.5;
  const lx = lookX * 1.6;
  const ly = lookY * 1.2;
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineWidth = 1.9;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const eye = (sx: number) => {
    const x = sx * ex + lx;
    const y = ly;
    switch (mood) {
      case 'happy':
        c.beginPath();
        c.arc(x, y + 1.5, 3, Math.PI * 1.15, Math.PI * 1.85);
        c.stroke();
        break;
      case 'sleep':
        c.beginPath();
        c.arc(x, y - 0.5, 3, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
        break;
      case 'angry':
        c.beginPath();
        c.moveTo(x - 3 * sx, y - 3);
        c.lineTo(x + 3 * sx, y);
        c.lineTo(x - 3 * sx, y + 3);
        c.stroke();
        break;
      case 'dizzy': {
        c.beginPath();
        for (let i = 0; i < 18; i++) {
          const a = i * 0.7 + t * 10 * sx;
          const r = i * 0.2;
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r;
          i ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
        break;
      }
      case 'dead':
        c.beginPath();
        c.moveTo(x - 2.5, y - 2.5);
        c.lineTo(x + 2.5, y + 2.5);
        c.moveTo(x + 2.5, y - 2.5);
        c.lineTo(x - 2.5, y + 2.5);
        c.stroke();
        break;
      case 'love': {
        c.save();
        c.translate(x, y);
        const s = 1 + Math.sin(t * 12) * 0.15;
        c.scale(s, s);
        c.fillStyle = '#ff3b6b';
        c.beginPath();
        c.moveTo(0, 3);
        c.bezierCurveTo(-5, -1, -3, -5, 0, -2.5);
        c.bezierCurveTo(3, -5, 5, -1, 0, 3);
        c.fill();
        c.restore();
        break;
      }
      case 'wink':
        if (sx > 0) {
          c.beginPath();
          c.moveTo(x - 3, y);
          c.lineTo(x + 3, y);
          c.stroke();
          break;
        }
      // falls through
      default: {
        const big = mood === 'surprised' || mood === 'scared' ? 1.35 : 1;
        const h = Math.max(0.25, 3.2 * big * (1 - blink));
        c.beginPath();
        c.ellipse(x, y, 2.5 * big, h, 0, 0, Math.PI * 2);
        c.fill();
        if (blink < 0.5) {
          c.fillStyle = f.light ? '#2a1208' : '#ffffff';
          c.beginPath();
          c.arc(x - 0.8, y - 1.2 * (1 - blink), 0.9 * big, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = ink;
        }
        if (mood === 'smug') {
          c.beginPath();
          c.moveTo(x - 3.5, y - 2.5);
          c.lineTo(x + 3.5, y - 2.5);
          c.lineWidth = 2.4;
          c.strokeStyle = f.light ? '#2a1208' : 'rgba(255,200,170,0.95)';
          c.stroke();
          c.strokeStyle = ink;
          c.lineWidth = 1.9;
        }
      }
    }
  };
  eye(-1);
  eye(1);
  // Mouth.
  c.beginPath();
  const mx = lx * 0.6;
  const my = 5 + ly * 0.6;
  switch (mood) {
    case 'surprised':
    case 'scared':
      c.ellipse(mx, my + 0.5, 1.8, 2.4, 0, 0, Math.PI * 2);
      c.fill();
      break;
    case 'dizzy':
    case 'dead':
      c.moveTo(mx - 3, my);
      for (let i = 0; i <= 6; i++) c.lineTo(mx - 3 + i, my + (i % 2 ? 1.2 : -0.4));
      c.stroke();
      break;
    case 'angry':
      c.arc(mx, my + 2.5, 2.5, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
      break;
    case 'sleep':
      c.ellipse(mx, my, 1.2, 1.2 + Math.sin(t * 2) * 0.5, 0, 0, Math.PI * 2);
      c.stroke();
      break;
    case 'smug':
      c.moveTo(mx - 2.5, my);
      c.quadraticCurveTo(mx + 1, my + 2, mx + 3.5, my - 1.5);
      c.stroke();
      break;
    case 'happy':
    case 'love':
      c.moveTo(mx - 3, my - 0.5);
      c.quadraticCurveTo(mx, my + 4.5, mx + 3, my - 0.5);
      c.closePath();
      c.fillStyle = f.light ? '#fff6ea' : '#6e1d0c';
      c.fill();
      break;
    default:
      c.arc(mx, my - 1.2, 2.2, Math.PI * 0.2, Math.PI * 0.8);
      c.stroke();
  }
  const b = Math.max(blush, mood === 'love' || mood === 'happy' ? 0.7 : 0.35);
  c.fillStyle = `rgba(255,90,110,${0.45 * b})`;
  c.beginPath();
  c.ellipse(-ex - 3 + lx, 3 + ly, 3, 1.7, 0, 0, Math.PI * 2);
  c.ellipse(ex + 3 + lx, 3 + ly, 3, 1.7, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
