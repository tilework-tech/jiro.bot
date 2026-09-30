import { installGardenArt } from "./art/rooms";
import "./style.css";
import { start } from "./engine/stage";
import { declareEggs, eggCount } from "./engine/eggs";
import { sfx } from "./engine/sfx";
import { setupChrome } from "./chrome";
import { override } from "./engine/items";
import { bar } from "./scenes/bar";
import { office } from "./scenes/office";
import { dining } from "./scenes/dining";
import { kitchen } from "./scenes/kitchen";
import { storage } from "./scenes/storage";
import { pantry } from "./scenes/pantry";
import { street } from "./scenes/street";
import { pond } from "./scenes/pond";
import { barOffice } from "./transitions/bar-office";
import { officeDining } from "./transitions/office-dining";
import { diningKitchen } from "./transitions/dining-kitchen";
import { kitchenStorageF as kitchenStorage } from "./transitions/kitchen-storage-f";
import { pantryStreet } from "./transitions/storage-street";
import { storagePantry } from "./transitions/storage-pantry";
import { streetPond } from "./transitions/street-pond";

// Every egg id awarded outside a scene's own declareEggs() goes here, so the counter total is fixed from the first frame.
declareEggs([
  // global secrets (this file + chrome.ts)
  "konami", "omakase", "sudo", "type-wasabi", "type-jiro", "logo-5", "tab-away", "console", "idle-cloud", "idle-soot",
  // plate drag outcomes (engine/drag.ts)
  "plate-parked", "plate-exploded", "plate-vanished",
  // pantry moodboard versions (moodboard/v01..v10.ts award these through the viewer)
  "mv01-omakase", "mood-v02-all", "mood-v02-rocks", "v03-all", "v03-press", "v04-flask", "v04-undiscovered",
  "mv05-river", "v06-orphan", "v07-bell", "v08-eye", "mood-v09-checked", "v10-hanko",
  // street > pond garden soot (transitions/street-pond.ts has no declareEggs of its own)
  "soot-rice",
]);

installGardenArt([bar, office, dining, kitchen, storage, pantry, street, pond]);

const api = start(
  [bar, office, dining, kitchen, storage, pantry, street, pond],
  [barOffice, officeDining, diningKitchen, kitchenStorage, storagePantry, pantryStreet, streetPond],
);

setupChrome(api);

/** Swap every plate's topping for a while (one at a time; a new secret replaces the old one). */
let overrideTimer = 0;
function takeover(item: string, ms: number) {
  override.item = item;
  clearTimeout(overrideTimer);
  overrideTimer = window.setTimeout(() => (override.item = null), ms);
}

// Keyboard secrets. Konami for gamers, words for everyone else.
const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
const WORDS: Record<string, () => void> = {
  omakase() {
    takeover("gold", 20000);
    api.sfx("coin");
    api.egg("omakase", "Omakase. The chef chose gold.");
  },
  wasabi() {
    takeover("wasabi", 12000);
    sfx("sneeze");
    const f = document.getElementById("frame");
    f?.classList.remove("wasabi");
    void f?.offsetWidth;
    f?.classList.add("wasabi");
    api.egg("type-wasabi", "Too much wasabi. The whole restaurant is crying.");
  },
  jiro() {
    takeover("mini-jiro", 15000);
    api.sfx("blip");
    api.egg("type-jiro", "You called? Jiro sent a tiny inspector to every plate.");
  },
  sudo() {
    takeover("maki", 15000);
    api.sfx("blip");
    api.egg("sudo", "sudo make me a sandwich? This is a sushi bar. Maki.");
  },
};
let kseq: string[] = [];
let typed = "";
addEventListener("keydown", (e) => {
  const t = e.target as Element | null;
  if (t && t.closest?.("input, textarea, [contenteditable]")) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = (e.key || "").toLowerCase();
  kseq = [...kseq, k].slice(-KONAMI.length);
  if (kseq.join() === KONAMI.join()) {
    kseq = [];
    takeover("duck", 30000);
    api.sfx("quack");
    api.egg("konami", "Konami code! Every plate is a rubber duck for 30 seconds.");
  }
  if (k.length === 1) {
    typed = (typed + k).slice(-12);
    for (const w of Object.keys(WORDS)) if (typed.endsWith(w)) { typed = ""; WORDS[w](); break; }
  }
});

// Tap the logo five times (it also takes you back to the bar, which is fine: you're already there).
let taps = 0, tapTimer = 0;
document.querySelector(".logo")?.addEventListener("click", () => {
  taps++;
  clearTimeout(tapTimer);
  tapTimer = window.setTimeout(() => (taps = 0), 1500);
  if (taps === 5) {
    taps = 0;
    const img = document.querySelector(".logo img");
    img?.classList.remove("spin");
    void (img as HTMLElement | null)?.offsetWidth;
    img?.classList.add("spin");
    api.sfx("chime");
    api.egg("logo-5", "Five taps. jiro.bot was almost called sushi.exe.");
  }
});

// Leave the tab and come back.
const title = document.title;
let awayAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    awayAt = Date.now();
    document.title = "🍣 Your sushi is getting cold";
  } else {
    document.title = title;
    if (awayAt && Date.now() - awayAt > 3000) api.egg("tab-away", "You're back! Jiro kept your seat warm. The rice, less so.");
    awayAt = 0;
  }
});

// For the people who open devtools on a sushi restaurant.
(window as unknown as { jiro: unknown }).jiro = {
  hire() {
    api.egg("console", "Console diver. Jiro reads stack traces like menus.");
    return "🍣 Seat reserved. Real reservations: https://noriagentic.com/";
  },
  eggs() {
    const [n, t] = eggCount();
    return `${n}/${t} found. Hints: try typing a few Japanese food words. Try doing nothing for a minute.`;
  },
  menu() {
    return "jiro.hire()  jiro.eggs()  jiro.menu()";
  },
};
const C = "color:#d98a4a", W = "color:#f3e6cf", B = "color:#5aa9ff", H = "color:#ffffff", M = "color:#bfae95";
console.log(
  [
    "%c        ▄▄██████▄▄",
    "      ▄████████████▄",
    "%c    ━━━━━━━━━━━━━━━━━━━━╸╸",
    "%c     █%c▐  %c◉%c      %c◉%c  ▌%c█",
    "     █%c▐    ▤▤▤▤▤▤    ▌%c█",
    "      ▀████████████▀",
    "%c  jiro.bot %c your AI staff engineer, by Nori",
    "%c  Reading the console at a sushi bar? Respect. Try jiro.menu().",
  ].join("\n"),
  C, H, C, W, B, W, B, W, C, W, C,
  "font-weight:700;background:#d98a4a;color:#1a0f07", "color:#6fdc8c", M,
);
