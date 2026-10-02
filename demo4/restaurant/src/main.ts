import "./style.css";
import { start } from "./engine/stage";
import { declareEggs } from "./engine/eggs";
import { setupChrome } from "./chrome";
import { override } from "./engine/items";
import { bar } from "./scenes/bar";
import { office } from "./scenes/office";
import { dining } from "./scenes/dining";
import { kitchen } from "./scenes/kitchen";
import { storage } from "./scenes/storage";
import { street } from "./scenes/street";
import { pond } from "./scenes/pond";
import { barOffice } from "./transitions/bar-office";
import { officeDining } from "./transitions/office-dining";
import { diningKitchen } from "./transitions/dining-kitchen";
import { kitchenStorage } from "./transitions/kitchen-storage";
import { storageStreet } from "./transitions/storage-street";
import { streetPond } from "./transitions/street-pond";

declareEggs(["konami", "omakase", "logo-5", "sudo", "tab-away", "console"]);

const api = start(
  [bar, office, dining, kitchen, storage, street, pond],
  [barOffice, officeDining, diningKitchen, kitchenStorage, storageStreet, streetPond],
);

setupChrome(api);

// Keyboard secrets.
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let kseq: string[] = [];
let typed = "";
addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).closest("input, textarea")) return;
  kseq = [...kseq, e.key].slice(-KONAMI.length);
  if (kseq.join() === KONAMI.join()) {
    override.item = "duck";
    api.sfx("quack");
    api.egg("konami", "Konami code: every plate is a rubber duck for 30 seconds.");
    setTimeout(() => (override.item = null), 30000);
  }
  if (e.key.length === 1) {
    typed = (typed + e.key.toLowerCase()).slice(-12);
    if (typed.endsWith("omakase")) {
      override.item = "gold";
      api.sfx("coin");
      api.egg("omakase", "Omakase: chef's choice. The chef chose gold.");
      setTimeout(() => (override.item = null), 20000);
    }
    if (typed.endsWith("sudo")) {
      override.item = "maki";
      api.sfx("blip");
      api.egg("sudo", "sudo make me a sandwich? This is a sushi bar. Rolling you maki instead.");
      setTimeout(() => (override.item = null), 15000);
    }
  }
});

// Tap the logo five times.
let taps = 0, tapTimer = 0;
document.querySelector(".logo")?.addEventListener("click", () => {
  taps++;
  clearTimeout(tapTimer);
  tapTimer = window.setTimeout(() => (taps = 0), 1500);
  if (taps === 5) api.egg("logo-5", "jiro.bot was almost called sushi.exe.");
});

// Leave the tab and come back.
const title = document.title;
let awayAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    awayAt = Date.now();
    document.title = "🍣 come back, the rice is getting cold";
  } else {
    document.title = title;
    if (awayAt && Date.now() - awayAt > 3000) api.egg("tab-away", "You came back! Jiro kept your seat warm. The rice, less so.");
    awayAt = 0;
  }
});

// For the people who open devtools on a sushi restaurant.
(window as unknown as { jiro: unknown }).jiro = {
  hire() {
    api.egg("console", "Found in the console: Jiro reviews stack traces the way others read menus.");
    return "🍣 Seat reserved. Real reservations: https://noriagentic.com/";
  },
};
console.log(
  "%c jiro.bot %c your AI staff engineer, by Nori\n%cPsst, reading the console? Type jiro.hire() for an easter egg.",
  "font:700 14px monospace;background:#d98a4a;color:#1a0f07;padding:2px 6px",
  "font:14px monospace;color:#6fdc8c",
  "font:12px monospace;color:#bfae95",
);
