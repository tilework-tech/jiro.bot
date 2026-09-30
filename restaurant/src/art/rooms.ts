import {
  ART_W,
  ART_H,
  ART_PIXEL,
  P,
  Pixels,
  canvas,
  noise,
  beat,
} from "./pixels";
import type { SceneDef } from "../engine/types";

// All rooms are original drawings in the same 240 × 135 coordinate system.
// The composition retains the existing belt and interaction anchors.
function timber(
  p: Pixels,
  x: number,
  y: number,
  w: number,
  h: number,
  vertical = false,
) {
  p.r(x, y, w, h, P.wood1);
  for (let i = 0; i < (vertical ? w : h); i += 6) {
    if (vertical) {
      p.r(x + i, y, 1, h, P.wood0);
      p.r(x + i + 1, y, 1, h, P.wood2);
    } else {
      p.r(x, y + i, w, 1, P.wood0);
      p.r(x, y + i + 1, w, 1, P.wood2);
    }
  }
  for (let i = 0; i < (w * h) / 70; i++) {
    const a = Math.floor(noise(i + 31) * w),
      b = Math.floor(noise(i + 600) * h);
    p.r(x + a, y + b, vertical ? 1 : 3, vertical ? 3 : 1, P.wood2);
  }
}
function floor(p: Pixels, top: number) {
  p.r(0, top, 240, 135 - top, P.wood0);
  for (let y = top; y < 135; y += 9) {
    p.r(0, y, 240, 1, P.wood2);
    for (let x = (y % 3) * 12; x < 240; x += 36) {
      p.r(x, y, 1, 9, P.wood1);
      p.r(x + 3, y + 5, 9, 1, P.wood1);
    }
  }
}
function wall(p: Pixels, top = 0, bottom = 78) {
  p.r(0, top, 240, bottom - top, P.wood0);
  for (let x = 0; x < 240; x += 15) {
    p.r(x, top, 1, bottom - top, P.wood1);
    p.r(x + 1, top, 1, bottom - top, P.wood2);
  }
  for (const y of [8, bottom - 4]) {
    p.r(0, y, 240, 3, P.wood1);
    p.r(0, y, 240, 1, P.wood3);
  }
}
function windowArt(
  p: Pixels,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  shoji = false,
) {
  p.r(x - 2, y - 2, w + 4, h + 4, P.ink);
  p.r(x, y, w, h, P.blue);
  p.r(x + 1, y + 1, w - 2, h / 2, P.navy);
  if (shoji) {
    p.r(x + 1, y + 1, w - 2, h - 2, P.sand);
    p.r(x + 2, y + 2, w - 4, h - 4, P.cream);
  } else {
    for (let i = 0; i < 14; i++) {
      const xx = x + 2 + noise(i + 7) * (w - 5),
        yy = y + 4 + noise(i + 99) * (h - 8);
      p.r(xx, yy, 1, 2, i % 4 ? P.slate : P.gold);
    }
    p.oval(x + w - 7, y + 7, 3, 3, P.cream);
  }
  for (let xx = x + 10; xx < x + w; xx += 10) p.r(xx, y, 1, h, P.wood2);
  for (let yy = y + 10; yy < y + h; yy += 10) p.r(x, yy, w, 1, P.wood2);
  p.r(x - 3, y + h, w + 6, 2, P.wood3);
  p.r(x - 3, y + h + 2, w + 6, 2, P.wood0);
}
function lantern(p: Pixels, x: number, y: number, t: number, phase = 0) {
  const shift = Math.round(beat(t, 12, phase) * 0.6);
  x += shift;
  p.line(x, y - 12, x, y, P.wood3);
  p.r(x - 3, y - 1, 7, 1, P.ink);
  p.oval(x, y + 6, 6, 7, P.red0);
  p.oval(x, y + 5, 5, 6, P.copper);
  p.r(x - 3, y, 6, 11, P.gold);
  p.r(x - 1, y, 2, 10, P.light);
  for (let a = 1; a < 11; a += 3) p.r(x - 4, y + a, 9, 1, P.copper);
  p.r(x - 3, y + 12, 7, 2, P.wood0);
  p.r(x, y + 14, 1, 4, P.copper);
}
function stoneLamp(p: Pixels, x: number, y: number, t: number) {
  p.oval(x, y + 12, 9, 3, P.moss0);
  p.poly(
    [
      [x - 5, y + 11],
      [x - 3, y],
      [x + 3, y],
      [x + 5, y + 11],
    ],
    P.wood3,
  );
  p.r(x - 5, y - 9, 11, 11, P.copper);
  p.r(x - 3, y - 8, 7, 7, P.gold);
  p.r(x - 1, y - 8, 3, 7, beat(t, 6) > 0.4 ? P.white : P.light);
  p.r(x - 6, y + 1, 13, 2, P.wood2);
  p.poly(
    [
      [x - 10, y - 10],
      [x - 3, y - 14],
      [x, y - 17],
      [x + 3, y - 14],
      [x + 10, y - 10],
    ],
    P.wood2,
  );
  p.line(x - 10, y - 10, x, y - 15, P.copper);
  p.line(x, y - 15, x + 10, y - 10, P.gold);
  p.r(x - 9, y - 9, 19, 1, P.copper);
}
function bottle(p: Pixels, x: number, y: number, i: number) {
  const c = [P.moss1, P.red0, P.blue, P.wood3][i % 4];
  p.r(x + 1, y - 7, 2, 3, P.sand);
  p.r(x, y - 5, 4, 7, c);
  p.r(x + 1, y - 4, 1, 4, P.mist);
  p.r(x, y - 1, 4, 2, P.cream);
  p.dot(x + 1, y, P.red0);
}
function shelf(p: Pixels, x: number, y: number, w: number, seed = 0) {
  p.r(x - 1, y - 13, w + 2, 16, P.ink);
  p.r(x, y - 12, w, 14, P.wood0);
  for (let xx = x + 3, i = 0; xx < x + w - 3; xx += 7, i++)
    bottle(p, xx, y - 1, seed + i);
  p.r(x - 2, y + 2, w + 4, 3, P.wood2);
  p.r(x - 2, y + 2, w + 4, 1, P.copper);
}
function plant(p: Pixels, x: number, y: number, t: number, big = false) {
  const k = big ? 2 : 1;
  p.poly(
    [
      [x - 3 * k, y],
      [x + 3 * k, y],
      [x + 2 * k, y + 5 * k],
      [x - 2 * k, y + 5 * k],
    ],
    P.red0,
  );
  p.r(x - 3 * k, y, 6 * k, 1, P.copper);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.3,
      dx = Math.round(Math.cos(a) * 5 * k + beat(t, 12, i) * 0.5),
      dy = -3 - Math.abs(Math.sin(a)) * 8 * k;
    p.line(x, y, x + dx, y + dy, P.moss1);
    p.oval(x + dx, y + dy, 3 * k, 2 * k, i % 2 ? P.moss2 : P.moss1);
    p.dot(x + dx, y + dy, P.moss3);
  }
}
function curtain(
  p: Pixels,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  phase = 0,
) {
  p.r(x - 1, y - 1, w + 2, 2, P.wood3);
  for (let xx = 0; xx < w; xx += 8) {
    const off = Math.round(beat(t, 12, phase + xx / 20));
    p.r(x + xx, y, 7, h - 2, P.blue);
    p.r(x + xx + 1, y, 1, h - 2, P.slate);
    p.r(x + xx + off, y + h - 4, 7, 3, P.blue);
    p.r(x + xx + off, y + h - 2, 7, 1, P.navy);
    if (xx % 16 === 0) p.r(x + xx + 3, y + 8, 2, 6, P.sand);
  }
}
function steam(p: Pixels, x: number, y: number, t: number, phase = 0) {
  for (let i = 0; i < 3; i++) {
    const f = (t * 0.35 + i * 0.32 + phase) % 1;
    p.r(
      x + Math.round(beat(t, 6, i) * 2),
      y - f * 10,
      1 + (i % 2),
      2,
      f > 0.65 ? P.slate : P.mist,
    );
  }
}
function cup(p: Pixels, x: number, y: number, t = 0) {
  p.r(x - 2, y - 3, 5, 5, P.cream);
  p.r(x - 1, y - 4, 3, 1, P.moss1);
  p.r(x + 2, y - 2, 1, 4, P.sand);
  if (t) steam(p, x, y - 5, t);
}
function jiro(p: Pixels, x: number, y: number, t: number, pose = "chef") {
  // Canon: copper dome, cream faceplate, blue eyes, headband, grille, rolled sleeves.
  const blink = t % 7.3 < 0.16 || t % 11.7 < 0.12,
    hand = Math.round(beat(t, pose === "typing" ? 2 : 8) * 0.6);
  p.oval(x, y + 28, 13, 3, P.ink);
  p.r(x - 6, y + 22, 4, 7, P.navy);
  p.r(x + 3, y + 22, 4, 7, P.navy);
  p.r(x - 7, y + 28, 6, 2, P.ink);
  p.r(x + 2, y + 28, 7, 2, P.ink);
  p.poly(
    [
      [x - 8, y + 9],
      [x + 8, y + 9],
      [x + 10, y + 25],
      [x - 10, y + 25],
    ],
    P.navy,
  );
  for (let xx = -6; xx <= 6; xx += 4) p.r(x + xx, y + 12, 1, 12, P.slate);
  p.line(x - 5, y + 9, x, y + 15, P.cream);
  p.line(x + 4, y + 9, x, y + 15, P.cream);
  p.r(x - 9, y + 22, 18, 2, P.blue);
  p.r(x - 12, y + 11, 5, 6, P.cream);
  p.r(x + 8, y + 11, 5, 6, P.cream);
  p.r(x - 11, y + 17, 3, 6, P.copper);
  p.r(x - 10, y + 21 + hand, 7, 3, P.copper);
  p.r(x + 9, y + 16, 3, 6, P.copper);
  p.r(x + 4, y + 20 - hand, 7, 3, P.copper);
  p.oval(x, y + 2, 10, 9, P.ink);
  p.oval(x, y + 1, 9, 8, P.wood3);
  p.oval(x - 1, y - 1, 8, 6, P.copper);
  p.r(x - 4, y - 6, 7, 1, P.gold);
  p.r(x - 8, y - 1, 15, 8, P.sand);
  p.r(x - 8, y - 1, 13, 6, P.cream);
  p.r(x - 9, y - 3, 18, 2, P.white);
  p.r(x + 9, y - 3, 3, 2, P.cream);
  p.line(x + 10, y - 2, x + 13, y + 2, P.sand);
  p.r(x - 6, y + 1, 3, blink ? 1 : 2, blink ? P.navy : P.cyan);
  p.r(x + 1, y + 1, 3, blink ? 1 : 2, blink ? P.navy : P.cyan);
  p.r(x - 4, y + 5, 7, 2, P.wood0);
  for (let i = 0; i < 3; i++) p.dot(x - 3 + i * 2, y + 5, P.mist);
  p.r(x + 8, y + 1, 2, 3, P.wood2);
  if (pose === "chef") {
    p.r(x - 4, y + 21 + hand, 6, 2, P.white);
    p.r(x - 4, y + 20 + hand, 6, 1, P.salmon);
  }
}
function person(p: Pixels, x: number, y: number, t: number, i: number) {
  const nod =
    i % 4 === 1
      ? Math.round(beat(t, 12, i) * 0.7)
      : i % 4 === 2
        ? Math.round(Math.max(0, beat(t, 6, i)))
        : 0;
  const coat = [P.blue, P.red0, P.moss1, P.plum][i % 4];
  p.oval(x, y + 25, 9, 3, P.ink);
  p.r(x - 5, y + 15, 3, 10, P.deep);
  p.r(x + 3, y + 15, 3, 10, P.deep);
  p.r(x - 7, y + 4, 15, 15, coat);
  p.r(x - 8, y + 8, 2, 8, P.wood3);
  p.r(x + 7, y + 8, 2, 8, P.wood3);
  p.r(x - 5, y + 5, 1, 13, P.slate);
  p.oval(x, y + nod, 6, 7, P.sand);
  p.oval(x, y - 3 + nod, 6, 5, P.ink);
  p.r(x - 6, y - 1 + nod, 3, 6, P.wood0);
  if (i % 4 === 0) {
    const sip = t % 9 > 5 && t % 9 < 7 ? -4 : 0;
    cup(p, x + 8, y + 11 + sip);
    p.r(x + 5, y + 13 + sip, 4, 2, P.copper);
  }
  if (i % 4 === 3)
    p.r(x + 4, y + 25 + (beat(t, 3) > 0.4 ? 1 : 0), 5, 2, P.wood2);
}
function counter(p: Pixels, pts: number[][], thick = 7) {
  p.poly(
    pts.map(([x, y]) => [x, y + thick]),
    P.wood0,
  );
  p.poly(pts, P.wood2);
  for (let i = 0; i < pts.length - 1; i++)
    p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], P.wood3);
}
function stool(p: Pixels, x: number, y: number) {
  p.r(x - 4, y, 2, 12, P.wood0);
  p.r(x + 3, y, 2, 12, P.wood0);
  p.r(x - 5, y + 6, 11, 1, P.wood2);
  p.oval(x, y, 7, 3, P.wood0);
  p.oval(x, y - 1, 6, 2, P.red0);
  p.r(x - 4, y - 2, 8, 1, P.salmon);
}
function crate(p: Pixels, x: number, y: number, w = 18, h = 12) {
  p.r(x, y, w, h, P.wood0);
  p.r(x + 1, y + 1, w - 2, h - 2, P.wood2);
  p.r(x + 1, y + 1, w - 2, 1, P.copper);
  p.r(x + 2, y + 3, w - 4, 2, P.wood1);
  p.r(x + 2, y + 8, w - 4, 2, P.wood1);
  p.r(x + 2, y, 2, h, P.wood3);
  p.r(x + w - 4, y, 2, h, P.wood3);
  p.r(x + w / 2 - 3, y + 4, 6, 3, P.sand);
  p.r(x + w / 2 - 1, y + 5, 2, 1, P.red0);
}
function soot(p: Pixels, x: number, y: number, t: number) {
  p.oval(x, y, 2, 2, P.ink);
  p.dot(x - 1, y - 1, P.white);
  p.dot(x + 1, y - 1, P.white);
  p.dot(x - 2, y + 3 + (Math.floor(t * 6) % 2), P.ink);
  p.dot(x + 2, y + 3 - (Math.floor(t * 6) % 2), P.ink);
}
function cat(p: Pixels, x: number, y: number, t: number) {
  p.oval(x, y, 6, 3, P.wood3);
  p.r(x - 4, y - 5, 6, 5, P.copper);
  p.dot(x - 4, y - 6, P.copper);
  p.dot(x + 1, y - 6, P.copper);
  p.r(x - 3, y - 3, 1, 1, P.ink);
  p.r(x, y - 3, 1, 1, P.ink);
  p.line(x + 4, y, x + 8, y - 2 + Math.round(beat(t, 8)), P.copper);
}

function bar(p: Pixels, t: number) {
  wall(p, 0, 69);
  floor(p, 69);
  windowArt(p, 5, 17, 18, 34, t);
  curtain(p, 0, 15, 23, 34, t);
  shelf(p, 64, 23, 26);
  shelf(p, 155, 14, 47, 2);
  shelf(p, 155, 33, 47, 1);
  shelf(p, 206, 26, 33, 3);
  windowArt(p, 100, 7, 48, 30, t, true);
  curtain(p, 103, 7, 43, 24, t, 1);
  for (const [x, y, i] of [
    [54, 12, 0],
    [90, 16, 1],
    [152, 16, 2],
    [201, 11, 3],
  ])
    lantern(p, x, y, t, i);
  p.r(214, 35, 15, 19, P.ink);
  p.r(213, 34, 17, 2, P.wood3);
  // Chef's island and rear counter.
  jiro(p, 122, 34, t);
  counter(p, [
    [91, 67],
    [146, 67],
    [174, 47],
    [194, 47],
    [154, 78],
    [91, 76],
  ]);
  for (let i = 0; i < 5; i++) {
    p.oval(135 + i * 4, 70, 2, 1, P.cream);
    p.r(135 + i * 4, 69, 3, 1, i % 2 ? P.red : P.salmon);
  }
  cup(p, 140, 65, t);
  p.r(111, 62, 15, 3, P.sand);
  p.r(112, 62, 9, 1, P.cream);
  for (const [x, y, i] of [
    [40, 56, 0],
    [66, 57, 1],
    [92, 67, 2],
    [207, 71, 3],
  ]) {
    stool(p, x, y + 29);
    person(p, x, y, t, i);
  }
  counter(
    p,
    [
      [96, 132],
      [82, 137],
      [229, 45],
      [226, 43],
    ],
    10,
  );
  counter(
    p,
    [
      [19, 69],
      [81, 69],
      [99, 80],
      [88, 84],
      [19, 76],
    ],
    7,
  );
  cup(p, 49, 72, t);
  bottle(p, 75, 72, 2);
  p.r(28, 71, 8, 1, P.sand);
  p.r(28, 73, 8, 1, P.sand);
  counter(
    p,
    [
      [171, 92],
      [187, 92],
      [232, 64],
      [218, 65],
    ],
    8,
  );
  cup(p, 182, 93, t);
  plant(p, 228, 103, t, true);
  p.r(0, 119, 60, 16, P.wood0);
  p.r(0, 119, 60, 1, P.wood2);
  cat(p, 39, 123, t);
}
function office(p: Pixels, t: number) {
  wall(p, 0, 109);
  floor(p, 110);
  // A quiet blank wall behind the existing interactive product display.
  p.r(7, 17, 160, 89, P.deep);
  p.r(8, 18, 158, 1, P.blue);
  windowArt(p, 175, 49, 43, 30, t);
  curtain(p, 174, 49, 45, 11, t, 2);
  shelf(p, 177, 81, 18, 1);
  plant(p, 231, 104, t, true);
  jiro(p, 215, 88, t, "typing");
  counter(
    p,
    [
      [188, 102],
      [208, 99],
      [231, 108],
      [213, 114],
    ],
    5,
  );
  p.r(192, 89, 13, 11, P.ink);
  p.r(194, 91, 9, 7, P.moss1);
  for (let i = 0; i < 3; i++)
    p.r(195, 92 + i * 2, 4 + (Math.floor(t * 0.6 + i) % 3), 1, P.moss3);
  p.r(197, 100, 3, 3, P.slate);
  p.poly(
    [
      [197, 103],
      [208, 103],
      [212, 106],
      [201, 106],
    ],
    P.slate,
  );
  cup(p, 219, 109, t);
  p.r(206, 94, 1, 8, P.copper);
  p.poly(
    [
      [202, 93],
      [209, 93],
      [207, 89],
      [204, 89],
    ],
    P.gold,
  );
  p.r(203, 94, 6, 1, P.light);
  p.r(226, 42, 8, 9, P.sand);
  p.r(227, 43, 6, 7, P.cream);
  p.r(228, 45, 3, 1, P.red);
  p.r(228, 48, 4, 1, P.moss1);
  cat(p, 181, 112, t);
  soot(p, 15 + ((t * 2) % 32), 126, t);
  p.r(0, 115, 240, 2, P.wood3);
  p.r(0, 125, 240, 5, P.wood2);
  p.r(0, 125, 240, 1, P.copper);
}
function dining(p: Pixels, t: number) {
  wall(p, 0, 56);
  floor(p, 56);
  windowArt(p, 12, 16, 43, 31, t, true);
  windowArt(p, 75, 16, 40, 31, t, true);
  windowArt(p, 134, 16, 40, 31, t, true);
  p.r(166, 25, 37, 44, P.ink);
  p.r(167, 26, 17, 42, P.wood2);
  p.r(185, 26, 17, 42, P.wood2);
  p.r(183, 26, 2, 42, P.wood0);
  p.oval(176, 39, 4, 5, P.ink);
  p.oval(176, 39, 3, 4, P.blue);
  p.oval(193, 39, 4, 5, P.ink);
  p.oval(193, 39, 3, 4, P.blue);
  p.r(181, 49, 1, 6, P.copper);
  p.r(186, 49, 1, 6, P.copper);
  for (let i = 0; i < 4; i++) {
    lantern(p, 37 + i * 50, 10, t, i);
    plant(p, 10 + i * 56, 50, t);
  }
  for (let i = 0; i < 4; i++) {
    const x = 21 + i * 51;
    person(p, x + 12, 67, t, i);
    person(p, x + 34, 66, t, i + 1);
    counter(
      p,
      [
        [x, 77],
        [x + 46, 77],
        [x + 44, 86],
        [x - 1, 86],
      ],
      4,
    );
    cup(p, x + 8, 80, t);
    cup(p, x + 33, 81, t);
    p.r(x + 19, 79, 10, 3, P.sand);
    p.r(x + 22, 79, 5, 1, P.red);
    p.r(x + 5, 80, 1, 3, P.wood0);
    stool(p, x + 10, 94);
    stool(p, x + 33, 94);
  }
  jiro(p, 224, 66, t);
  p.r(0, 109, 240, 11, P.wood2);
  p.r(0, 109, 240, 1, P.copper);
  p.r(0, 117, 240, 1, P.wood0);
  p.r(0, 121, 240, 14, P.wood0);
  for (let i = 0; i < 8; i++) stool(p, 12 + i * 31, 126);
}
function kitchen(p: Pixels, t: number) {
  p.r(0, 0, 240, 135, P.wood0);
  floor(p, 91);
  p.poly(
    [
      [88, 5],
      [240, 0],
      [240, 92],
      [88, 66],
    ],
    P.sand,
  );
  for (let y = 0; y < 90; y += 6) p.line(91, y, 240, y - 9, P.mist);
  for (let x = 91; x < 240; x += 9) p.line(x, 0, x, 85, P.cream);
  p.r(0, 0, 80, 102, P.wood0);
  p.r(54, 34, 28, 46, P.ink);
  p.r(55, 34, 2, 46, P.wood3);
  curtain(p, 55, 34, 25, 17, t, 1);
  shelf(p, 100, 23, 64);
  shelf(p, 104, 48, 54, 1);
  p.r(220, 11, 20, 12, P.slate);
  p.poly(
    [
      [218, 24],
      [240, 23],
      [240, 28],
      [216, 29],
    ],
    P.mist,
  );
  p.r(216, 64, 24, 7, P.navy);
  p.r(217, 63, 23, 1, P.mist);
  for (let i = 0; i < 3; i++) {
    p.oval(221 + i * 7, 63, 3, 2, P.ink);
    p.r(219 + i * 7, 58, 5, 5, P.slate);
    p.r(220 + i * 7, 57, 4, 1, P.cream);
    steam(p, 221 + i * 7, 56, t, i * 0.2);
  }
  jiro(p, 192, 54, t);
  counter(
    p,
    [
      [165, 82],
      [182, 80],
      [221, 83],
      [212, 99],
      [166, 87],
    ],
    6,
  );
  p.r(176, 84, 20, 5, P.sand);
  p.r(178, 85, 8, 2, P.salmon);
  p.line(190, 82, 198, 80, P.cream);
  p.oval(141, 73, 10, 6, P.wood2);
  p.oval(141, 70, 10, 4, P.cream);
  p.oval(141, 69, 8, 3, P.white);
  counter(
    p,
    [
      [58, 99],
      [72, 94],
      [200, 135],
      [146, 135],
    ],
    6,
  );
  counter(
    p,
    [
      [62, 69],
      [66, 67],
      [240, 120],
      [240, 128],
    ],
    8,
  );
  for (let i = 0; i < 4; i++) {
    p.oval(155, 49 - i * 2, 6, 2, P.sand);
    p.r(150, 48 - i * 2, 10, 1, P.cream);
  }
  p.line(184, 6, 184, 26, P.wood2);
  p.r(181, 25, 7, 1, P.mist);
  p.r(184, 27, 1, 4, P.mist);
  p.line(197, 5, 197, 26, P.wood2);
  p.oval(197, 29, 3, 4, P.slate);
  lantern(p, 70, 12, t);
  cat(p, 228, 82, t);
}
function storage(p: Pixels, t: number) {
  wall(p, 0, 72);
  floor(p, 72);
  p.r(19, 23, 21, 32, P.ink);
  p.r(18, 22, 23, 2, P.wood3);
  // Shelves and labelled boxes sit at the original drop/hotspot anchors.
  for (const y of [19, 43, 66]) {
    p.r(99, y, 132, 4, P.wood2);
    p.r(99, y, 132, 1, P.copper);
  }
  for (let x = 99; x < 239; x += 45) p.r(x, 0, 3, 86, P.wood1);
  for (let i = 0; i < 7; i++) {
    crate(p, 110 + i * 17, 4, 15, 14);
    crate(p, 116 + i * 16, 25, 14, 16);
    crate(p, 110 + i * 17, 48, 15, 16);
  }
  for (let i = 0; i < 3; i++) {
    p.oval(116 + i * 16, 21 + i * 6, 7, 8, P.wood2);
    p.r(110 + i * 16, 17 + i * 6, 13, 2, P.ink);
    p.r(110 + i * 16, 24 + i * 6, 13, 2, P.ink);
    p.oval(116 + i * 16, 14 + i * 6, 6, 2, P.wood3);
  }
  for (let i = 0; i < 4; i++) {
    p.oval(10 + i * 8, 63 - i * 2, 8, 12, P.sand);
    p.oval(10 + i * 8, 55 - i * 2, 6, 3, P.cream);
    p.r(6 + i * 8, 62 - i * 2, 7, 2, P.wood3);
  }
  crate(p, 45, 73, 22, 14);
  crate(p, 63, 82, 23, 14);
  crate(p, 193, 80, 24, 17);
  p.oval(98, 39, 8, 5, P.wood3);
  p.oval(98, 38, 7, 3, P.cream);
  p.r(93, 36, 9, 2, P.white);
  counter(
    p,
    [
      [30, 43],
      [34, 41],
      [240, 134],
      [235, 139],
    ],
    9,
  );
  jiro(p, 215, 91, t);
  p.r(208, 108, 10, 6, P.wood3);
  p.r(209, 109, 8, 1, P.copper);
  lantern(p, 70, 8, t);
  windowArt(p, 47, 10, 32, 19, t);
  p.r(8, 93, 1, 22, P.slate);
  p.oval(8, 119, 5, 2, P.slate);
  for (let i = 0; i < 3; i++)
    soot(p, 16 + ((t * (2 + i) + i * 17) % 63), 109 + i * 6, t + i);
  cat(p, 90, 25, t);
}
function bicycle(p: Pixels, x: number, y: number, t: number) {
  for (const dx of [-18, 22]) {
    p.oval(x + dx, y, 11, 11, P.ink);
    p.ring(x + dx, y, 9, 9, P.mist);
    p.ring(x + dx, y, 8, 8, P.deep);
    p.line(x + dx - 8, y, x + dx + 8, y, P.slate);
    p.line(x + dx, y - 8, x + dx, y + 8, P.slate);
    p.dot(x + dx, y, P.copper);
  }
  p.line(x - 18, y, x - 7, y - 18, P.copper, 2);
  p.line(x - 7, y - 18, x + 6, y, P.copper, 2);
  p.line(x + 6, y, x - 18, y, P.copper, 2);
  p.line(x - 7, y - 18, x + 15, y - 19, P.copper, 2);
  p.line(x + 15, y - 19, x + 6, y, P.copper, 2);
  p.line(x + 15, y - 22, x + 22, y, P.copper, 2);
  p.line(x + 15, y - 22, x + 14, y - 27, P.mist);
  p.line(x + 14, y - 27, x + 8, y - 27, P.mist);
  p.r(x - 11, y - 20, 9, 2, P.ink);
  p.line(x + 6, y, x + 11, y + 3, P.cream);
  p.r(x + 10, y + 3, 5, 1, P.ink);
  crate(p, x - 27, y - 30, 18, 14);
  p.r(x - 27, y - 31, 18, 2, P.red);
  p.r(x - 21, y - 27, 6, 6, P.cream);
  p.r(x - 19, y - 26, 2, 4, P.red);
  jiro(p, x - 2, y - 48, t, "riding");
  p.line(x - 6, y - 24, x + 5, y - 16, P.navy, 3);
  p.line(x + 5, y - 16, x + 8, y - 2, P.navy, 3);
  p.line(x - 7, y - 23, x - 8, y + 2, P.navy, 3);
  p.r(x - 11, y + 2, 7, 2, P.ink);
  p.r(x + 19, y - 23, 10, 6, P.wood2);
  p.r(x + 19, y - 23, 10, 1, P.sand);
}
function street(p: Pixels, t: number) {
  p.r(0, 0, 240, 135, P.deep);
  p.r(0, 0, 96, 135, P.wood0);
  for (let i = 0; i < 7; i++) {
    const x = 98 + i * 21,
      h = 35 + noise(i) * 32;
    p.r(x, 0, 19, h, P.navy);
    for (let yy = 8; yy < h; yy += 8)
      for (let xx = x + 3; xx < x + 18; xx += 6)
        p.r(xx, yy, 3, 4, (i + xx + yy) % 3 ? P.blue : P.gold);
  }
  p.poly(
    [
      [97, 64],
      [170, 48],
      [239, 66],
      [240, 135],
      [91, 135],
    ],
    P.navy,
  );
  for (let i = 0; i < 50; i++) {
    const x = 98 + noise(i + 3) * 130,
      y = 72 + noise(i + 27) * 62;
    p.r(
      x,
      y,
      2 + noise(i) * 7,
      1,
      i % 4 === 0 ? P.copper : i % 3 ? P.blue : P.slate,
    );
  }
  timber(p, 98, 37, 40, 37, true);
  windowArt(p, 101, 40, 29, 23, t, true);
  curtain(p, 98, 29, 44, 10, t);
  p.r(103, 13, 31, 9, P.ink);
  p.r(105, 15, 27, 5, P.red0);
  for (let i = 0; i < 5; i++)
    p.r(107 + i * 5, 16, 2, 3, beat(t, 12) > -0.95 ? P.pink : P.red);
  lantern(p, 136, 43, t);
  p.r(114, 62, 11, 10, P.wood0);
  p.r(115, 63, 9, 7, P.sand);
  p.r(117, 65, 5, 1, P.red0);
  p.r(195, 8, 2, 92, P.slate);
  p.r(178, 8, 28, 6, P.ink);
  for (let i = 0; i < 3; i++)
    p.oval(182 + i * 9, 11, 2, 2, i === 0 ? P.red : P.moss0);
  p.r(215, 0, 7, 135, P.wood0);
  p.r(213, 0, 1, 135, P.wood3);
  p.r(224, 0, 16, 135, P.moss0);
  plant(p, 236, 116, t, true);
  bicycle(p, 167, 107, t);
  p.r(94, 106, 43, 3, P.slate);
  p.r(94, 109, 43, 2, P.deep);
  cat(p, 116, 104, t);
  // Quiet rain and tiny hard-edged puddle rings; never a screen-wide particle storm.
  for (let i = 0; i < 22; i++) {
    const x = 97 + noise(i + 200) * 116,
      y = (noise(i + 70) * 135 + t * 15) % 135;
    p.line(x, y, x - 1, y + 3, P.slate);
  }
  for (let i = 0; i < 4; i++) {
    const f = (t * 0.4 + i * 0.2) % 1;
    p.ring(125 + i * 24, 117 + (i % 2) * 9, 2 + f * 5, 1 + f, P.blue);
  }
}
function reeds(p: Pixels, x: number, y: number, t: number, seed = 0) {
  for (let i = 0; i < 9; i++) {
    const dx = (i - 4) * 2,
      h = 8 + noise(i + seed) * 13,
      sway = Math.round(beat(t, 12, i * 0.3) * 1);
    p.line(x, y, x + dx + sway, y - h, P.moss0);
    p.line(x + 1, y, x + dx + 1 + sway, y - h + 1, i % 2 ? P.moss2 : P.moss1);
    if (i % 3 === 0) p.r(x + dx + sway, y - h - 3, 1, 4, P.wood3);
  }
}
function island(p: Pixels, x: number, y: number, rx: number, ry: number) {
  p.oval(x, y + 3, rx, ry, P.wood0);
  p.oval(x, y + 1, rx, ry, P.wood2);
  p.oval(x, y - 1, rx, ry, P.moss0);
  p.oval(x, y - 3, rx - 2, ry - 1, P.moss1);
  p.oval(x - 2, y - 5, rx - 5, ry - 3, P.moss2);
  for (let i = 0; i < rx * 2; i++) {
    const a = noise(i + 54) * 6.28,
      r = noise(i + 74);
    p.r(
      x + Math.cos(a) * rx * r,
      y - 4 + Math.sin(a) * (ry - 4) * r,
      2,
      1,
      i % 2 ? P.moss3 : P.moss1,
    );
  }
}
function lily(p: Pixels, x: number, y: number, r = 6) {
  p.oval(x, y + 1, r, Math.max(2, r * 0.45), P.ink);
  p.oval(x, y, r, Math.max(2, r * 0.45), P.moss1);
  p.oval(x - 1, y - 1, r - 2, Math.max(1, r * 0.35), P.moss2);
  p.line(x, y, x + r, y + 2, P.deep);
  p.line(x, y, x - 2, y - 2, P.moss3);
  p.line(x, y, x - r + 2, y + 1, P.moss0);
  p.line(x, y, x + 2, y - 2, P.moss0);
  p.line(x, y, x - 2, y + 2, P.moss0);
}
function pond(p: Pixels, t: number) {
  p.r(0, 0, 240, 135, P.navy);
  for (let i = 0; i < 150; i++) {
    const x = noise(i + 7) * 240,
      y = noise(i + 400) * 135,
      w = 2 + noise(i + 81) * 10;
    p.r(x, y, w, 1, i % 3 ? P.blue : P.deep);
  }
  // Moonlight is drawn in bands of colour, with no blur or gradients.
  for (let i = 0; i < 38; i++) {
    const y = 33 + i,
      x = 132 + beat(t, 12, i * 0.8) * 2,
      w = Math.max(1, 18 - Math.abs(i - 16) * 0.6);
    p.r(
      x - w,
      y,
      w * 2,
      1,
      i % 4 === 0 ? P.cream : i % 3 === 0 ? P.sand : P.slate,
    );
  }
  island(p, 122, -4, 52, 31);
  island(p, 16, 118, 34, 24);
  island(p, 227, 113, 33, 24);
  for (let i = 0; i < 6; i++) {
    p.oval(132 + i * 8, 6 + (i % 2) * 4, 3, 2, P.slate);
    p.r(131 + i * 8, 5 + (i % 2) * 4, 3, 1, P.mist);
  }
  stoneLamp(p, 145, 11, t);
  stoneLamp(p, 20, 103, t + 2);
  stoneLamp(p, 209, 110, t + 4);
  // Arched bridge on the upper-right bank.
  p.poly(
    [
      [191, 21],
      [205, 17],
      [221, 18],
      [239, 27],
      [240, 46],
      [222, 35],
      [207, 32],
      [191, 34],
    ],
    P.wood0,
  );
  p.poly(
    [
      [191, 19],
      [205, 15],
      [221, 16],
      [239, 25],
      [240, 40],
      [222, 30],
      [207, 27],
      [191, 30],
    ],
    P.wood2,
  );
  for (let i = 0; i < 9; i++)
    p.line(
      193 + i * 5,
      19 + Math.abs(i - 3) * 1.2,
      193 + i * 5,
      29 + Math.abs(i - 3) * 1.4,
      P.wood0,
    );
  for (const x of [192, 209, 238]) {
    p.r(x, 11 + Math.abs(x - 209) * 0.2, 2, 20, P.wood0);
    p.r(x, 11 + Math.abs(x - 209) * 0.2, 1, 19, P.copper);
  }
  p.line(192, 15, 208, 11, P.wood3, 2);
  p.line(208, 11, 239, 21, P.wood3, 2);
  reeds(p, 91, 34, t);
  reeds(p, 124, 35, t, 9);
  reeds(p, 232, 59, t, 21);
  reeds(p, 10, 98, t, 5);
  reeds(p, 212, 99, t, 9);
  for (const [x, y, r] of [
    [124, 43, 6],
    [143, 45, 7],
    [173, 93, 8],
    [160, 113, 9],
    [62, 112, 10],
    [86, 130, 9],
    [195, 104, 5],
  ])
    lily(p, x, y, r);
  // Continuous pier: its lip ends under the exact koi arrival point.
  for (let x = 76; x < 240; x += 27) {
    p.r(x, 68, 3, 20, P.wood0);
    p.r(x, 68, 1, 19, P.wood3);
  }
  p.r(72, 62, 168, 11, P.wood0);
  p.r(72, 63, 168, 8, P.wood2);
  p.r(72, 63, 168, 1, P.copper);
  p.r(72, 71, 168, 1, P.wood3);
  for (let x = 74; x < 240; x += 6) p.r(x, 63, 1, 8, P.wood1);
  for (let i = 0; i < 5; i++) {
    const x = 90 + i * 30 + beat(t, 24, i) * 8,
      y = 90 + (i % 2) * 29 + beat(t, 12, i) * 2;
    p.oval(x, y, 6, 2, P.deep);
    p.poly(
      [
        [x + 5, y],
        [x + 9, y - 3],
        [x + 8, y + 3],
      ],
      P.deep,
    );
    const f = (t * 0.2 + i * 0.2) % 1;
    p.ring(x - 2, y, 4 + f * 6, 1 + f * 2, P.blue);
  }
  p.g.save();
  p.g.translate(227, 46);
  p.g.scale(0.5, 0.5);
  jiro(p, 0, 0, t, "watching");
  p.g.restore();
  for (let i = 0; i < 9; i++) {
    const x = 80 + noise(i + 56) * 140,
      y = 8 + noise(i + 90) * 28;
    if (beat(t, 6, i) > 0.65) p.dot(x, y, P.light);
  }
}

const painters: Record<string, (p: Pixels, t: number) => void> = {
  bar,
  office,
  dining,
  kitchen,
  storage,
  pantry: storage,
  street,
  pond,
};
const buffers = new Map<string, HTMLCanvasElement>();
export function roomCanvas(id: string, t = 0) {
  let c = buffers.get(id);
  if (!c) {
    c = canvas();
    buffers.set(id, c);
  }
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, ART_W, ART_H);
  painters[id]?.(new Pixels(g), t);
  finish(g);
  return c;
}
export function drawRoom(g: CanvasRenderingContext2D, id: string, t: number) {
  const smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.drawImage(roomCanvas(id, t), 0, 0, 1920, 1080);
  g.imageSmoothingEnabled = smooth;
}
/** Low-resolution overlays (koi fates) retain their timing on the shared art grid. */
function pixelOverlay(
  original: NonNullable<SceneDef["over"]>,
): NonNullable<SceneDef["over"]> {
  const c = canvas(),
    g = c.getContext("2d")!;
  return (target, t, api) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, 240, 135);
    g.setTransform(1 / ART_PIXEL, 0, 0, 1 / ART_PIXEL, 0, 0);
    g.imageSmoothingEnabled = false;
    original(g, t, api);
    target.save();
    target.imageSmoothingEnabled = false;
    target.drawImage(c, 0, 0, 1920, 1080);
    target.restore();
  };
}
export function installGardenArt(scenes: SceneDef[]) {
  for (const scene of scenes) {
    const oldOver = scene.over;
    scene.art = roomCanvas(scene.id, 0).toDataURL();
    scene.under = (g, t) => drawRoom(g, scene.id, t);
    scene.over =
      scene.id === "pond" && oldOver ? pixelOverlay(oldOver) : undefined;
  }
}

/** Original cutaway backdrops. Native output sizes preserve transition crop contracts. */
export function transitionArt(url: string): string | undefined {
  const sizes: Record<string, [number, number]> = {
    "art/tr/bar-office/wall.jpg": [2560, 1080],
    "art/tr/office-dining/wall-empty.jpg": [1436, 1248],
    "art/tr/kitchen-storage-f/world.jpg": [4460, 1966],
    "art/tr/storage-street/shaft.jpg": [2112, 760],
    "art/tr/street-pond/garden.jpg": [2395, 1673],
  };
  const sceneMatch =
    /^art\/(bar|office|dining|kitchen|storage|street|pond)\.jpg$/.exec(url);
  if (sceneMatch) {
    const c = canvas(1920, 1080),
      g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(roomCanvas(sceneMatch[1], 0), 0, 0, 1920, 1080);
    return c.toDataURL();
  }
  const size = sizes[url];
  if (!size) return;
  const [w, h] = size,
    c = canvas(Math.ceil(w / 8), Math.ceil(h / 8)),
    p = new Pixels(c.getContext("2d")!);
  p.r(0, 0, c.width, c.height, P.wood0);
  if (url.includes("bar-office")) {
    timber(p, 0, 0, c.width, c.height, true);
    for (let x = 3; x < c.width; x += 42) {
      p.r(x, 0, 5, c.height, P.wood2);
      p.r(x, 0, 1, c.height, P.wood3);
    }
    p.poly(
      [
        [87, 23],
        [235, 115],
        [233, 123],
        [84, 30],
      ],
      P.wood2,
    );
    p.line(87, 23, 235, 115, P.copper);
    p.r(55, 33, 26, 20, P.ink);
    p.r(55, 32, 26, 1, P.wood3);
    p.line(3, 100, 315, 100, P.slate, 2);
    p.line(230, 12, 230, 92, P.copper, 2);
    for (let i = 0; i < 9; i++) {
      crate(p, 100 + i * 17, 116, 14, 12);
    }
    cat(p, 155, 84, 0);
  } else if (url.includes("office-dining")) {
    timber(p, 0, 0, c.width, c.height, true);
    const x = Math.round(c.width * 0.169),
      y = Math.round(c.height * 0.405),
      ww = Math.round(c.width * 0.707),
      hh = Math.round(c.height * 0.32);
    p.r(x - 2, y - 2, ww + 4, hh + 8, P.ink);
    p.r(x, y, ww, hh, P.navy);
    p.r(x + 1, y + 1, ww - 2, 1, P.cyan);
    for (let yy = y + 6; yy < y + hh; yy += 9)
      p.r(x + 1, yy, ww - 2, 1, P.blue);
    p.r(x, y + hh, ww, 5, P.sand);
    for (let i = 0; i < 70; i++)
      p.dot(
        x + noise(i) * ww,
        y + hh + noise(i + 90) * 5,
        i % 2 ? P.wood2 : P.cream,
      );
    p.r(x - 3, y - 6, ww + 6, 3, P.wood2);
    p.r(x - 3, y + hh + 6, ww + 6, 3, P.wood2);
    shelf(p, 18, 35, 110, 1);
    plant(p, 160, 42, 0);
    p.r(51, 17, 76, 10, P.sand);
    p.r(56, 21, 66, 2, P.wood2);
  } else if (url.includes("kitchen-storage")) {
    p.g.drawImage(roomCanvas("kitchen", 0), 0, 0);
    p.g.drawImage(
      roomCanvas("storage", 0),
      2470 / 8,
      846 / 8,
      240 * 1.035,
      135 * 1.035,
    );
    // Original room placement and corridor geometry are retained, without baked JPEGs.
    timber(p, 242, 0, 66, 245, true);
    p.r(244, 91, 62, 81, P.deep);
    windowArt(p, 256, 100, 33, 25, 0, true);
    p.r(244, 158, 65, 4, P.wood2);
    p.r(244, 158, 65, 1, P.copper);
    p.r(247, 162, 3, 24, P.wood1);
    p.r(300, 162, 3, 24, P.wood1);
    p.r(266, 149, 26, 7, P.slate);
    p.r(268, 149, 22, 4, P.deep);
    p.line(280, 149, 280, 140, P.mist);
    p.line(280, 140, 285, 140, P.mist);
    crate(p, 260, 183, 18, 13);
    plant(p, 294, 183, 0);
    lantern(p, 267, 76, 0);
    p.r(254, 0, 4, 140, P.wood2);
    p.r(254, 0, 1, 140, P.copper);
  } else if (url.includes("storage-street")) {
    p.r(0, 0, c.width, 20, P.wood1);
    p.r(0, 20, c.width, 5, P.wood2);
    p.r(0, 25, c.width, c.height - 25, P.deep);
    for (let yy = 28; yy < c.height; yy += 11)
      for (let xx = (yy % 2) * 12; xx < c.width; xx += 24) {
        p.r(xx, yy, 22, 9, P.wood0);
        p.r(xx + 1, yy + 1, 20, 1, P.wood1);
      }
    p.line(0, 45, 236, 45, P.slate, 3);
    p.line(236, 45, 236, 94, P.slate, 3);
    p.line(1, 45, 234, 45, P.mist);
    p.r(230, 34, 14, 20, P.ink);
    p.r(232, 36, 10, 16, P.blue);
    p.dot(235, 40, P.gold);
    p.dot(240, 40, P.moss3);
    for (let i = 0; i < 6; i++) crate(p, 10 + i * 29, 73, 22, 14);
  } else {
    p.r(0, 0, c.width, c.height, P.moss0);
    p.r(0, 5, c.width, 57, P.wood0);
    for (let yy = 9; yy < 60; yy += 9)
      for (let xx = (yy % 2) * 11; xx < c.width; xx += 22) {
        p.r(xx, yy, 20, 7, P.mist);
        p.r(xx + 1, yy + 1, 18, 1, P.sand);
      }
    p.r(0, 4, c.width, 3, P.navy);
    for (let x = 0; x < c.width; x += 8) {
      p.r(x, 3, 7, 2, P.blue);
      p.dot(x + 1, 3, P.slate);
    }
    p.oval(246, 39, 25, 23, P.wood2);
    p.oval(246, 39, 22, 20, P.deep);
    p.r(245, 61, 27, 100, P.wood1);
    for (let y = 64; y < 159; y += 5) p.r(246, y, 25, 1, P.wood3);
    for (let i = 0; i < 7; i++) {
      plant(p, 20 + i * 34, 70 + (i % 2) * 12, 0, true);
      reeds(p, 30 + i * 39, 130, 0, i);
    }
    stoneLamp(p, 200, 70, 0);
    p.g.drawImage(roomCanvas("pond", 0), 1, 77);
  }
  finish(p.g, c.width, c.height);
  const full = canvas(w, h),
    fg = full.getContext("2d")!;
  fg.imageSmoothingEnabled = false;
  fg.drawImage(c, 0, 0, w, h);
  return full.toDataURL();
}

/** Sparse material pixels and banded shadows: no blur, gradients, or random per-frame noise. */
function finish(g: CanvasRenderingContext2D, w = 240, h = 135) {
  const im = g.getImageData(0, 0, w, h),
    a = im.data,
    source = a.slice();
  const rgb = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
  const materials = new Map<
    number,
    { hi: number[]; lo: number[]; kind: string }
  >();
  for (const [col, hi, lo, kind] of [
    [P.wood2, P.wood3, P.wood1, "wood"],
    [P.wood1, P.wood2, P.wood0, "wood"],
    [P.moss2, P.moss3, P.moss1, "leaf"],
    [P.moss1, P.moss2, P.moss0, "leaf"],
    [P.copper, P.gold, P.wood3, "metal"],
    [P.sand, P.cream, P.wood3, "paper"],
  ] as const) {
    const r = rgb(col);
    materials.set((r[0] << 16) | (r[1] << 8) | r[2], {
      hi: rgb(hi),
      lo: rgb(lo),
      kind,
    });
  }
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4,
        key = (a[i] << 16) | (a[i + 1] << 8) | a[i + 2],
        m = materials.get(key);
      if (!m) continue;
      const n = noise(x + y * w + 130),
        boundary =
          source[i - 4 * w] !== source[i] ||
          source[i - 4 * w + 1] !== source[i + 1];
      let c: number[] | undefined;
      if (boundary && n > 0.3) c = m.hi;
      else if (
        m.kind === "wood" &&
        y % 4 === 0 &&
        noise(Math.floor(x / 4) + y * 19) > 0.78
      )
        c = n > 0.5 ? m.hi : m.lo;
      else if (m.kind === "leaf" && n > 0.88) c = n > 0.96 ? m.hi : m.lo;
      else if (m.kind === "metal" && n > 0.97) c = m.hi;
      if (c) {
        a[i] = c[0];
        a[i + 1] = c[1];
        a[i + 2] = c[2];
      }
    }
  g.putImageData(im, 0, 0);
}

/** Fish and wall-cat replacements keep the original animation anchors and sheet sizes. */
export function smallWorldArt(url: string): string | undefined {
  const name = url.split("/").pop()?.replace(".png", "") ?? "";
  const fish: Record<string, [number, number]> = {
    gold1: [112, 82],
    gold2: [109, 69],
    koi1: [94, 117],
    koi2: [91, 111],
    minnow1: [87, 46],
    minnow2: [84, 41],
    puffer: [182, 160],
    weed0: [167, 284],
    weed1: [233, 256],
    weed2: [76, 138],
    weed3: [91, 74],
  };
  const koi: Record<string, [number, number]> = {
    "koi-rise": [169, 264],
    "koi-rise2": [173, 264],
    "koi-gulp": [178, 264],
    "koi-dive": [160, 264],
  };
  const size = url.includes("office-dining/")
    ? fish[name]
    : url.startsWith("end/")
      ? koi[name]
      : url === "art/tr/bar-office/cat.png"
        ? [480, 118]
        : undefined;
  if (!size) return;
  const [w, h] = size,
    c = canvas(Math.ceil(w / 8), Math.ceil(h / 8)),
    p = new Pixels(c.getContext("2d")!);
  if (name === "cat") {
    for (let i = 0; i < 4; i++) {
      cat(p, i * 15 + 7, 10, i * 2);
      if (i === 1) {
        p.r(i * 15 + 4, 7, 1, 1, P.copper);
        p.r(i * 15 + 7, 7, 1, 1, P.copper);
      }
    }
  } else if (name.startsWith("weed")) {
    reeds(p, c.width / 2, c.height - 1, 0, Number(name.at(-1)) * 11);
  } else if (koi[name]) {
    // Mouth at the same native coordinate as F in pond.ts.
    const diving = name === "koi-dive";
    if (diving) {
      p.poly(
        [
          [1, 31],
          [2, 24],
          [8, 15],
          [11, 3],
          [15, 0],
          [17, 7],
          [13, 17],
          [5, 29],
        ],
        P.ink,
      );
      p.poly(
        [
          [2, 30],
          [3, 24],
          [9, 15],
          [12, 4],
          [15, 3],
          [15, 9],
          [11, 20],
          [4, 29],
        ],
        P.cream,
      );
      p.oval(10, 15, 3, 5, P.red);
      p.dot(3, 28, P.ink);
    } else {
      p.poly(
        [
          [20, 10],
          [19, 6],
          [12, 5],
          [7, 12],
          [4, 22],
          [0, 28],
          [1, 32],
          [8, 28],
          [11, 22],
          [12, 16],
        ],
        P.ink,
      );
      p.poly(
        [
          [20, 10],
          [18, 7],
          [13, 7],
          [9, 13],
          [6, 23],
          [2, 29],
          [7, 27],
          [10, 21],
          [11, 15],
        ],
        P.cream,
      );
      p.oval(12, 12, 3, 4, P.salmon);
      p.oval(7, 23, 2, 3, P.red);
      p.dot(17, 8, P.ink);
      p.dot(16, 8, P.white);
      p.poly(
        [
          [11, 15],
          [16, 20],
          [10, 19],
        ],
        P.sand,
      );
      p.r(
        19,
        10,
        name === "koi-gulp" ? 3 : 2,
        name === "koi-gulp" ? 2 : 1,
        P.red0,
      );
    }
  } else {
    const x = c.width * 0.52,
      y = c.height * 0.52,
      rx = c.width * 0.35,
      ry = c.height * 0.3;
    const col = name.startsWith("koi")
      ? P.cream
      : name.startsWith("gold")
        ? P.gold
        : name === "puffer"
          ? P.sand
          : P.cyan;
    p.poly(
      [
        [x - rx + 1, y],
        [1, y - ry],
        [1, y + ry],
      ],
      P.wood3,
    );
    p.oval(x, y, rx, ry, P.ink);
    p.oval(x, y - 1, rx - 1, ry - 1, col);
    p.dot(x + rx - 2, y - 1, P.ink);
    p.line(x, y + 1, x - 2, y + ry, P.copper);
    if (name.startsWith("koi")) p.oval(x - 2, y - 1, 2, ry - 1, P.red);
    if (name === "puffer")
      for (let i = 0; i < 8; i++) {
        const a = i * 0.785;
        p.dot(x + Math.cos(a) * (rx + 1), y + Math.sin(a) * (ry + 1), P.copper);
      }
  }
  const full = canvas(w, h),
    g = full.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, w, h);
  return full.toDataURL();
}
