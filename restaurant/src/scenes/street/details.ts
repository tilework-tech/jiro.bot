// Small interactions preserved from the pre-provider-switch street (cef2e81),
// positioned on the bicycle rebuilt from Martin's recording.
const PX = 3, TAU = Math.PI * 2;
const snap = (v: number) => Math.round(v / PX) * PX;
export const streetFx = { bell: -99, lamp: -99, blink: -99, cat: -99, ripple: -99, rx: 0, ry: 0 };
export const streetClock = () => performance.now() / 1000;
export const CAT_POS = { x: 480, y: 450 };
const CAT = [
  ".o......o.", ".oo....oo.", ".hoooooooo", "hooooooooo",
  "hoyyooyyoo", "hoypooypoo", "hoooonoooo", ".oooooooo.",
  "..oooooo..", ".hooooooo.", "hoooooooooo", "hoooooooooo",
  "hoooooooooo", ".oo....oo..",
];
const COLORS: Record<string, string> = { o: "#15131c", h: "#3d3752", y: "#f4d35e", p: "#15131c", n: "#c07a8a" };

export function streetDetails(g: CanvasRenderingContext2D, now: number) {
  const t = ((now % 24) + 24) % 24;
  const catAge = now - streetFx.cat, startled = catAge >= 0 && catAge < 1.4;
  const blink = (t % 6 > 4.1 && t % 6 < 4.25) || (startled && catAge > 1);
  const hop = startled && catAge < .5 ? -PX * (catAge < .25 ? 2 : 1) : 0;
  g.save();
  CAT.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      let ch = row[i];
      if (ch === "." || (t % 12 > 7 && t % 12 < 7.25 && j === 0 && i === 8)) continue;
      if (blink && (ch === "y" || ch === "p")) ch = j === 5 ? "h" : "o";
      if (startled && !blink && ch === "p") ch = "y";
      g.fillStyle = COLORS[ch];
      g.fillRect(CAT_POS.x + i * PX, CAT_POS.y + j * PX + hop, PX, PX);
    }
  });
  const sw = Math.round(Math.sin(TAU * t / 4) * 1.2);
  g.fillStyle = COLORS.o;
  for (const [x,y] of [[0,0],[1,-1],[1,-2],[1,-3],[1,-4],[1+sw,-5],[sw,-6]]) {
    g.fillRect(CAT_POS.x + 33 + x * PX, CAT_POS.y + 36 + y * PX + hop, PX, PX);
  }
  const blinkAge = now - streetFx.blink;
  if ((t % 8 > 3 && t % 8 < 3.15) || (blinkAge >= 0 && blinkAge < .9 && Math.floor(blinkAge / .15) % 3 === 0)) {
    g.fillStyle = "#d6bd90"; g.fillRect(732, 447, 12, 21);
    g.fillStyle = "#705238"; g.fillRect(732, 462, 12, 3);
  }
  const bellAge = now - streetFx.bell;
  if (bellAge >= 0 && bellAge < 1) {
    g.fillStyle = `rgba(255,230,150,${1-bellAge})`;
    for (let i=0;i<3;i++) {
      const r=9+i*9+(Math.floor(bellAge*10)%2)*3;
      g.fillRect(816-r,snap(645-r/2),3,6);
      g.fillRect(822+r,snap(645-r/2),3,6);
    }
  }
  const rippleAge = now - streetFx.ripple;
  if (rippleAge >= 0 && rippleAge < 2.4) {
    g.fillStyle = "#b9c9d5";
    for (let ring=0;ring<3;ring++) {
      const age = rippleAge-ring*.18;
      if (age<0) continue;
      g.globalAlpha = Math.max(0,.5-age/4);
      for (let a=0;a<TAU;a+=.15) {
        g.fillRect(snap(streetFx.rx+Math.cos(a)*(8+age*38)),snap(streetFx.ry+Math.sin(a)*(3+age*10)),3,3);
      }
    }
  }
  g.restore();
}
