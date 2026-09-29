import "./style.css";
import { start } from "./engine/stage";
import { declareEggs } from "./engine/eggs";
import { override } from "./engine/items";
import { bar } from "./scenes/bar";
import { office } from "./scenes/office";
import { dining } from "./scenes/dining";
import { kitchen } from "./scenes/kitchen";
import { storage } from "./scenes/storage";
import { yard } from "./scenes/yard";
import { street } from "./scenes/street";
import { pond } from "./scenes/pond";
import { barOffice } from "./transitions/bar-office";
import { officeDining } from "./transitions/office-dining";
import { diningKitchen } from "./transitions/dining-kitchen";
import { kitchenStorage } from "./transitions/kitchen-storage";
import { storageYard } from "./transitions/storage-yard";
import { yardStreet } from "./transitions/yard-street";
import { streetPond } from "./transitions/street-pond";

declareEggs(["konami", "omakase", "logo-5"]);

const api = start(
  [bar, office, dining, kitchen, storage, yard, street, pond],
  [barOffice, officeDining, diningKitchen, kitchenStorage, storageYard, yardStreet, streetPond],
);

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
