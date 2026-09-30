p='src/scenes/dining.ts'
s=open(p).read()
start=s.index('// Dining room (bustling')
end=s.index('export const dining')
s=s[:start]+'''// Dining room (bustling, no Jiro). Two big comparison windows fill the screen;
// the room is dimmed and desaturated behind them (canvas pass, art untouched)
// so it reads as ambient backdrop at the edges and below, with the belt bright.
// Ambient: lantern breathing, string-light twinkle, tea steam, and a few diners
// doing slow 2-frame "sprite swaps" cut from the art (seen when the windows
// step aside while you carry a plate). Tables and the counter are surfaces.

declareEggs(["slop", "dining-jiro", "dining-lantern"]);
let cmp: { enter(): void; leave(): void } | null = null;

const ART = "art/dining.jpg";
const LANTERNS: [number, number, number][] = [[58, 68, 170], [270, 92, 190], [630, 160, 150], [1302, 160, 150], [1660, 92, 190], [1873, 68, 170]];
const BULBS: [number, number][] = [
  [342, 86], [382, 98], [425, 106], [476, 106], [515, 100], [552, 86], [583, 72], [660, 72], [689, 86], [728, 98],
  [767, 106], [818, 106], [861, 98], [901, 87], [936, 72], [985, 71], [1020, 86], [1062, 99], [1104, 106], [1155, 106],
  [1194, 99], [1231, 86], [1261, 72], [1342, 72], [1373, 87], [1408, 96], [1448, 106], [1499, 106], [1543, 100], [1583, 87],
];
const PORTHOLES: [number, number][] = [[1402, 318], [1546, 318]];
/** Sprite swaps: [sx, sy, w, h, dx, dy, period s, on-from, on-to (fraction of period)]. Periods divide LOOP. */
const SWAPS: [number, number, number, number, number, number, number, number, number][] = [
  [788, 560, 56, 48, 0, -3, 8, 0.1, 0.32], // light-blue diner lifts his chopsticks
  [1394, 560, 80, 48, 0, -3, 12, 0.55, 0.72], // pink sweater, chopsticks up
  [1412, 498, 64, 60, 2, 0, 24, 0.05, 0.3], // pink sweater tilts her head
  [312, 562, 50, 44, 0, -2, 6, 0.6, 0.8], // left diner, chopsticks
  [1566, 478, 70, 100, 0, -2, 24, 0.3, 0.42], // man by the doors takes a bite
  [1198, 502, 52, 60, 2, 0, 12, 0.7, 0.9], // scarf woman glances over
  [1658, 552, 66, 60, -2, 0, 24, 0.55, 0.8], // blue shirt turns to his friend
];
const TEA: [number, number, number][] = [[890, 604, 0], [1266, 608, 2.2], [617, 632, 4.1]];
/** Room above the belt ledge gets the heavy dim; the counter below the belt a light one. */
const LEDGE = 768;
/** The lantern the egg flickers (top right, visible above the windows). */
const FLICK = 4;

let flickT = -99;
const tnow = () => performance.now() / 1000;

'''+s[end:]
open(p,'w').write(s)
