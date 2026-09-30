import { chromium } from "playwright";
const b = await chromium.launch(); const pg = await b.newPage();
pg.on("pageerror", (e) => console.log("PE", e.stack?.slice(0,500)));
pg.on("response", (r) => r.status() >= 400 && console.log("HTTP", r.status(), r.url()));
await pg.goto("http://localhost:3000/?seg=dining%3Ekitchen&tt=0.1&freeze=5", { waitUntil: "networkidle" });
await pg.waitForTimeout(5000); await b.close();
