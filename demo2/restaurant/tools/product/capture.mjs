import { chromium } from "playwright";
import fs from "node:fs";
const B = "http://127.0.0.1:4173/e2e/fixtures/restaurant-tour.html?theme=dark&state=";
const OUT = "/tmp/product/raw";
fs.mkdirSync(OUT, { recursive: true });
const W = 1600, H = 1000;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: "dark", reducedMotion: "reduce", timezoneId: "America/New_York" });
await ctx.grantPermissions(["notifications"], { origin: "http://127.0.0.1:4173" });
await ctx.addInitScript(() => {
  Object.defineProperty(Notification, "permission", { get: () => "granted" });
  localStorage.setItem("nori.chat.completionAlerts.v1", "1");
});
const pg = await ctx.newPage();
pg.on("pageerror", (e) => console.log("ERR", String(e)));
const open = async (s) => { await pg.goto(B + s, { waitUntil: "networkidle" }); await pg.waitForTimeout(900); };
const neutral = () => pg.mouse.move(420, 600);
const row = (t) => pg.locator(".session-row", { hasText: t }).first();
const rowMenuBtn = (t) => pg.getByRole("button", { name: `Conversation actions for ${t}` });
const acct = () => pg.locator('button[title="Account and settings"]');
const newChat = () => pg.getByRole("button", { name: "New chat" }).or(pg.getByRole("link", { name: "New chat" })).first();
const navChat = () => pg.locator('nav[aria-label="Pages"] a', { hasText: "Chat" }).first();
const modelPill = () => pg.locator('.composer-row button:has-text("Opus 5.5")').first();
const FLAKY = "Fix flaky checkout test", TUNA = "jiro: refactor tuna-inventory service";
const sidebarCommon = (self) => [
  ...(self !== "chat" ? [{ loc: () => row(FLAKY), to: "chat", label: `Open "${FLAKY}"` }] : []),
  ...(self !== "done" ? [{ loc: () => row(TUNA), to: "done", label: `Open "${TUNA}"` }] : []),
  ...(self !== "new" ? [{ loc: navChat, to: "new", label: "Chat: start a new session" }] : []),
  { loc: acct, to: "settings", label: "Account and settings" },
];
const S = {
  chat: {
    caption: "Mention @nori in Slack and a session spins up on its own machine. Watch it work and steer it from here.",
    setup: () => open("conversation"),
    hot: () => [
      { loc: () => pg.getByText("Worked for 4m").first(), to: "work", label: "Expand the work: every tool call" },
      { loc: () => pg.locator('button[aria-label^="Open artifacts"]'), to: "code", label: "Artifacts" },
      { loc: () => pg.locator(".artifact-chip, button", { hasText: "checkout.spec.ts" }).last(), to: "code", label: "Open checkout.spec.ts" },
      { loc: newChat, to: "new", label: "New chat" },
      { loc: () => rowMenuBtn(FLAKY), hover: () => row(FLAKY), to: "menu", label: "Conversation actions" },
      ...sidebarCommon("chat"),
    ],
  },
  work: {
    caption: "Every turn folds its work: thoughts, file reads, edits and commands, one click away.",
    setup: async () => { await open("conversation"); await pg.getByText("Worked for 4m").first().click(); await pg.waitForTimeout(300);
      await pg.locator(".transcript-scroll").evaluate((e) => (e.scrollTop = 0)); await pg.waitForTimeout(300); },
    hot: () => [
      { loc: () => pg.getByText("Worked for 4m").first(), to: "chat", label: "Fold the work away" },
      ...sidebarCommon("work"),
    ],
  },
  code: {
    caption: "Code, tables and pull requests the agent produces collect in the artifacts pane.",
    setup: async () => { await open("conversation"); await pg.locator('button[aria-label^="Open artifacts"]').click(); },
    hot: () => [
      { loc: () => pg.locator('aside button[aria-label*="lose"], [class*="artifact"] button[aria-label*="lose"]').first(), to: "chat", label: "Close artifacts" },
      ...sidebarCommon("code"),
    ],
  },
  done: {
    caption: "Finished work lands as a pull request with CI green. The session stays live for follow-ups.",
    setup: () => open("done"),
    hot: () => [
      { loc: () => pg.locator("button", { hasText: "Split reservations out of InventoryService" }).first(), to: "pr", label: "Open the pull request" },
      { loc: newChat, to: "new", label: "New chat" },
      ...sidebarCommon("done"),
    ],
  },
  pr: {
    caption: "Pull requests open straight from the conversation.",
    setup: async () => { await open("done"); await pg.locator("button", { hasText: "Split reservations out of InventoryService" }).first().click(); },
    hot: () => [
      { loc: () => pg.locator('button[aria-label*="lose"]').first(), to: "done", label: "Close" },
      ...sidebarCommon("pr"),
    ],
  },
  new: {
    caption: "Start a session from the web: pick a model and skillset, and a fresh machine picks it up.",
    setup: async () => { await open("landing"); const t = pg.locator("textarea").first(); await t.fill("Add Apple Pay to the checkout page on acme/checkout"); },
    hot: () => [
      { loc: modelPill, to: "model", label: "Switch model" },
      ...sidebarCommon("new"),
    ],
  },
  model: {
    caption: "Switch models per session: Claude, Codex and more from one picker.",
    setup: async () => { await S.new.setup(); await modelPill().click(); },
    hot: () => [
      { loc: () => pg.getByRole("menuitem", { name: /Claude Opus 5.5/ }).or(pg.locator('[aria-label="Use Claude Opus 5.5"]')).first(), to: "new", label: "Use Claude Opus 5.5" },
      { loc: modelPill, to: "new", label: "Close the picker" },
    ],
  },
  menu: {
    caption: "Every session is a real machine: rename it, archive it, or release it back to the pool.",
    setup: async () => { await open("conversation"); await row(FLAKY).hover(); await rowMenuBtn(FLAKY).click(); await pg.waitForTimeout(200); },
    hot: () => [
      { loc: () => pg.getByRole("menuitem", { name: "Release" }), to: "release", label: "Release" },
      { loc: () => rowMenuBtn(FLAKY), to: "chat", label: "Close the menu" },
    ],
  },
  release: {
    caption: "Releasing stops the agent and returns its machine to the pool.",
    setup: async () => { await S.menu.setup(); await pg.getByRole("menuitem", { name: "Release" }).click(); },
    hot: () => [
      { loc: () => pg.getByRole("dialog").getByRole("button", { name: "Cancel" }), to: "chat", label: "Cancel" },
    ],
  },
  settings: {
    caption: "Completion alerts, connected integrations and org settings live one click away.",
    setup: async () => { await open("conversation"); await acct().click(); },
    hot: () => [
      { loc: () => pg.locator('[aria-label="Close settings"], .panel button[aria-label*="lose"]').first(), to: "chat", label: "Close settings" },
    ],
  },
};
const only = process.argv[2]?.split(",");
const spec = { width: W, height: H, start: "chat", url: "acme.norisessions.com", states: {} };
const r4 = (n) => Math.round(n * 10000) / 10000;
for (const [id, st] of Object.entries(S)) {
  if (only && !only.includes(id)) continue;
  await st.setup();
  await neutral(); await pg.waitForTimeout(500);
  await pg.screenshot({ path: `${OUT}/${id}.png` });
  const hotspots = [];
  for (const h of st.hot()) {
    if (h.hover) { await h.hover().hover(); await pg.waitForTimeout(150); }
    const bb = await h.loc().boundingBox({ timeout: 3000 }).catch(() => null);
    if (h.hover) await neutral();
    if (!bb) { console.log(`!! ${id}: no box for ${h.label}`); continue; }
    const pad = 3;
    const x = Math.max(0, bb.x - pad), y = Math.max(0, bb.y - pad);
    const w = Math.min(W - x, bb.width + 2 * pad), hh = Math.min(H - y, bb.height + 2 * pad);
    hotspots.push({ x: r4(x / W), y: r4(y / H), w: r4(w / W), h: r4(hh / H), to: h.to, label: h.label });
  }
  spec.states[id] = { img: `ui/product/${id}.png`, caption: st.caption, hotspots };
  console.log(id, hotspots.length);
}
fs.writeFileSync("/tmp/product/states.raw.json", JSON.stringify(spec, null, 2));
await b.close();
