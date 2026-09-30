// usage: node qa/chain.mjs  -> prints the engine's scene belt chain (phase, path length U,
// global offset J at the scene's u=0, gap to the next scene) as computed at start().
import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage();
await pg.goto("http://localhost:3000/?seg=bar&tt=0.5&freeze=0", { waitUntil: "networkidle" });
for (const l of await pg.evaluate(() => window.__chain)) console.log(`${l.id.padEnd(8)} phase ${l.phase.toFixed(1).padStart(9)}  U ${l.U.toFixed(1).padStart(7)}  off ${l.off.toFixed(1).padStart(8)}  gap ${l.gap.toFixed(1)}`);
await b.close();
