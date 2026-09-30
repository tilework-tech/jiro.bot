import * as THREE from "three";
import { BeltPath, Frame, BELT_W, SHADE_U } from "./belt";
import { Particles, pixelGrid, blip, boom } from "./fx";

export const ITEMS = [
  "tuna", "salmon", "tamago", "ikura", "ebi", "maki", "onigiri-happy", "onigiri-angry", "onigiri-sleepy",
  "bomb", "duck", "bug", "puffer", "rock", "gold", "wasabi", "cat", "lucky-cat", "bowl-ramen", "cup-matcha",
  "cup-tea", "cup-soy", "bowl-miso", "bowl-soup", "ramen", "floppy", "laptop-fire", "fortune", "mini-jiro", "lobster",
] as const;
type Item = (typeof ITEMS)[number];

const SUSHI: Item[] = ["tuna", "salmon", "tamago", "ikura", "ebi", "maki"];
// belt mix: mostly sushi, a steady sprinkle of weird stuff
const WEIGHTS: Partial<Record<Item, number>> = {
  tuna: 6, salmon: 6, tamago: 4, ikura: 4, ebi: 4, maki: 5, "onigiri-happy": 2, "onigiri-angry": 1.5, "onigiri-sleepy": 1.5,
  bomb: 1.2, duck: 1.2, bug: 1.6, puffer: 1.2, rock: 1.2, gold: 0.5, wasabi: 1.2, cat: 0.8, "lucky-cat": 0.8,
  "bowl-ramen": 0.6, "cup-matcha": 0.8, "cup-tea": 0.6, "cup-soy": 0.4, "bowl-miso": 0.6, "bowl-soup": 0.4,
  ramen: 0.8, floppy: 1, "laptop-fire": 1, fortune: 1.2, "mini-jiro": 0.9, lobster: 0.8,
};
const RIMS = ["#3b6fd1", "#d13b3b", "#e8b33a", "#3ba15b", "#1c1c1c", "#e8e2d4"];

export const SPACING = 1.25;
export const BASE_SPEED = 0.38; // belt-space units / s, calm

interface Plate {
  s: number; item: Item; group: THREE.Group; sprite: THREE.Sprite; disc: THREE.Mesh;
  mode: "belt" | "drag" | "return" | "gone" | "fling" | "walk" | "fall";
  pos: THREE.Vector3; vel: THREE.Vector3; t: number; scale: number; spin: number; puff: number; sc: number; lastRaw: number;
}

export interface Hooks {
  bubble(p: THREE.Vector3, text: string, ms?: number, cls?: string): void;
  found(key: string, label: string): void;
  shake(amount: number): void;
  flash(color: string): void;
  count(key: string): number;
  rainbow(on: boolean): void;
}

const FORTUNES = [
  "Your tests will pass on the first try.", "A flaky test will leave your life today.",
  "The bug is in the code you were sure about.", "You will ship before lunch.",
  "Beware of Friday deploys.", "Someone will finally write the docs. (Jiro.)",
];

export class Plates {
  plates: Plate[] = [];
  tex = new Map<Item, THREE.Texture>();
  imgs = new Map<Item, HTMLImageElement>();
  discTex: THREE.Texture[] = [];
  speedMul = 1;
  turbo = 0;
  sleepy = 0;
  offset = 0; // belt phase (world units)
  ray = new THREE.Raycaster();
  drag: Plate | null = null;
  dragPlane = new THREE.Plane();
  down = { x: 0, y: 0, t: 0 };
  lastDrag: THREE.Vector3[] = [];
  f: Frame = { p: new THREE.Vector3(), t: new THREE.Vector3(), b: new THREE.Vector3(), u: new THREE.Vector3(), w: new THREE.Vector3(), sc: 1, lift: new THREE.Vector3() };
  legs: THREE.Sprite;
  legTex: THREE.Texture[];
  walker: Plate | null = null;
  /** called when a plate reaches the end of the belt (before it recycles to the hero) */
  onWrap: ((item: THREE.Texture) => void) | null = null;
  /** light level (0..1) at a world point near the belt start (kitchen-window shading) */
  shade?: (p: THREE.Vector3) => number;

  constructor(public scene: THREE.Scene, public path: BeltPath, public camera: THREE.PerspectiveCamera,
    public fx: Particles, public hooks: Hooks) {
    const loader = new THREE.TextureLoader();
    for (const it of ITEMS) {
      const t = loader.load(`items/${it}.png`, (tx) => this.imgs.set(it, tx.image as HTMLImageElement));
      t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
      this.tex.set(it, t);
    }
    this.discTex = RIMS.map((r) => discTexture(r));
    this.legTex = [0, 1].map((k) => legTexture(k));
    this.legs = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.legTex[0], alphaTest: 0.5 }));
    this.legs.visible = false; scene.add(this.legs);
    const n = Math.floor(path.lengthU / SPACING);
    const bag = weightedBag();
    for (let i = 0; i < n; i++) this.plates.push(this.make(i * SPACING, bag()));
  }

  make(s: number, item: Item): Plate {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20),
      new THREE.MeshBasicMaterial({ map: this.discTex[Math.floor(Math.random() * RIMS.length)], transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex.get(item)!, alphaTest: 0.35 }));
    sprite.scale.set(0.62, 0.62, 1);
    sprite.userData.plate = true;
    group.add(disc);
    this.scene.add(group, sprite);
    group.matrixAutoUpdate = false;
    const p: Plate = { s, item, group, sprite, disc, mode: "belt", pos: new THREE.Vector3(), vel: new THREE.Vector3(), t: 0, scale: 1, spin: 0, puff: 1, sc: 1, lastRaw: s };
    sprite.userData.ref = p;
    return p;
  }

  setItem(p: Plate, item: Item) {
    p.item = item; (p.sprite.material as THREE.SpriteMaterial).map = this.tex.get(item)!;
  }

  slot(p: Plate, out: Frame) {
    let s = (p.s + this.offset) % this.path.lengthU;
    if (s < 0) s += this.path.lengthU;
    return this.path.frameAtU(s, out);
  }

  update(dt: number, time: number) {
    const target = BASE_SPEED * (this.turbo > 0 ? 5 : 1) * (this.sleepy > 0 ? 0.25 : 1);
    this.speedMul += (target / BASE_SPEED - this.speedMul) * Math.min(1, dt * 2);
    this.offset += BASE_SPEED * this.speedMul * dt;
    this.turbo -= dt; this.sleepy -= dt;
    const f = this.f;
    for (const p of this.plates) {
      const raw = (p.s + this.offset) % this.path.lengthU;
      this.slot(p, f);
      // pop in at the hero exit, sink out at the footer end
      // plates only ease in at the start (hidden behind the kitchen window); the end hands them to the ending
      const vis = THREE.MathUtils.clamp(raw / 0.8, 0, 1);
      if (raw < p.lastRaw - this.path.lengthU / 2 && p.mode === "belt") this.onWrap?.(this.tex.get(p.item)!);
      p.lastRaw = raw;
      if (p.mode === "gone") {
        p.t -= dt;
        if (p.t > 0) { p.group.visible = p.sprite.visible = false; continue; }
        p.mode = "belt"; p.puff = 0.01; if (SUSHI.includes(p.item)) this.setItem(p, SUSHI[Math.floor(Math.random() * SUSHI.length)]);
      }
      if (raw < 0.2 && p.mode === "belt" && Math.random() < 0.02) this.setItem(p, weightedBag()());
      const beltPos = f.p.clone().addScaledVector(f.u, 0.09 * f.sc);
      if (p.mode === "belt") { p.pos.copy(beltPos); p.sc = f.sc; }
      else if (p.mode === "walk" || p.mode === "fall") { this.stray(p, dt, time); continue; }
      else if (p.mode === "return" || p.mode === "fling") {
        if (p.mode === "fling") {
          p.vel.multiplyScalar(Math.pow(0.04, dt)); p.pos.addScaledVector(p.vel, dt); p.t -= dt;
          if (p.t <= 0) p.mode = "return";
        } else {
          p.pos.lerp(beltPos, 1 - Math.pow(0.0008, dt));
          if (p.pos.distanceTo(beltPos) < 0.02) p.mode = "belt";
        }
      }
      p.group.visible = p.sprite.visible = vis > 0.01;
      // disc lies in the belt plane (skewed on the painted hero lane)
      const k = vis * f.sc;
      const X = f.t.clone().multiplyScalar(k), Y = f.w.clone().multiplyScalar(vis / (BELT_W / 2)), Z = f.u.clone().multiplyScalar(k);
      p.group.matrix.makeBasis(X, Y, Z).setPosition(p.pos);
      p.spin *= Math.pow(0.02, dt);
      p.sprite.position.copy(p.pos).add(f.lift);
      if (p.mode === "drag") p.sprite.position.addScaledVector(f.lift, 0.5);
      p.puff += (1 - p.puff) * Math.min(1, dt * 1.5);
      const sc = 0.62 * f.sc * vis * p.puff * (1 + (p.mode === "drag" ? 0.15 : 0));
      p.sprite.scale.set(sc, sc, 1);
      (p.sprite.material as THREE.SpriteMaterial).rotation = p.spin + (p.item === "onigiri-angry" && p.mode === "belt" ? Math.sin(time * 30) * 0.04 : 0);
      // dim plates still inside the hero's kitchen window (lit by the belt surface under them)
      const l = this.shade && raw < SHADE_U && p.mode === "belt" ? this.shade(p.pos) : 1;
      (p.sprite.material as THREE.SpriteMaterial).color.setScalar(l);
      (p.disc.material as THREE.MeshBasicMaterial).color.setScalar(l);
    }
  }

  /** swallowed (koi): gone until it would have reached the end, then it recycles as usual */
  eat(p: Plate) {
    const raw = (p.s + this.offset) % this.path.lengthU;
    p.mode = "gone"; p.t = (this.path.lengthU - raw) / (BASE_SPEED * Math.max(0.2, this.speedMul)) + 0.2;
    p.group.visible = p.sprite.visible = false;
  }

  // ---------- the two strays: one dish grows legs and wanders off, one falls off ----------
  walkOff(p: Plate, dir: THREE.Vector3) {
    if (this.walker) return;
    this.walker = p; p.mode = "walk"; p.t = 7; p.vel.copy(dir).normalize();
    this.hooks.bubble(p.sprite.position.clone(), "!", 900);
  }

  fallOff(p: Plate, side: THREE.Vector3) {
    p.mode = "fall"; p.t = 2.6; p.spin = 0;
    p.vel.copy(side).multiplyScalar(1.1);
    this.hooks.bubble(p.sprite.position.clone(), "whoa—", 900);
  }

  stray(p: Plate, dt: number, time: number) {
    p.t -= dt;
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const s = 0.62 * p.sc;
    if (p.mode === "walk") {
      const age = 7 - p.t;
      const sprout = THREE.MathUtils.clamp(age / 0.6, 0, 1);         // legs pop out
      const going = age > 1.1 && !(age > 3.0 && age < 3.6);            // pause once to look around
      if (going) p.pos.addScaledVector(p.vel, dt * 0.9 * p.sc / 0.42 * 0.42);
      const hop = going ? Math.abs(Math.sin(time * 11)) * 0.06 * p.sc : 0;
      p.sprite.position.copy(p.pos).addScaledVector(camUp, s * 0.75 + hop);
      p.sprite.scale.set(s, s, 1);
      (p.sprite.material as THREE.SpriteMaterial).rotation = going ? Math.sin(time * 11) * 0.08 : Math.sin(time * 3) * 0.2;
      this.legs.visible = true;
      this.legs.material.map = this.legTex[going ? Math.floor(time * 8) % 2 : 0];
      this.legs.position.copy(p.pos).addScaledVector(camUp, s * 0.28 * sprout + hop * 0.5);
      this.legs.scale.set(s * 0.8, s * 0.6 * sprout, 1);
      p.group.visible = false;
      if (p.t <= 0) { p.mode = "gone"; p.t = 30; this.legs.visible = false; this.walker = null; p.sprite.visible = false; }
      return;
    }
    // fall: tip over the edge, then drop with gravity (screen-down) and tumble
    p.vel.addScaledVector(camUp, -6 * dt);
    p.pos.addScaledVector(p.vel, dt);
    p.spin += dt * 5;
    p.group.visible = false;
    p.sprite.position.copy(p.pos).addScaledVector(camUp, s * 0.4);
    p.sprite.scale.set(s, s, 1);
    (p.sprite.material as THREE.SpriteMaterial).rotation = p.spin;
    if (p.t <= 0) { p.mode = "gone"; p.t = 20; p.sprite.visible = false; }
  }

  // ---------- interaction ----------
  pick(ndc: THREE.Vector2): Plate | null {
    this.ray.setFromCamera(ndc, this.camera);
    const hits = this.ray.intersectObjects(this.plates.filter((p) => p.sprite.visible).map((p) => p.sprite), false);
    return hits.length ? (hits[0].object.userData.ref as Plate) : null;
  }

  pointerDown(ndc: THREE.Vector2, x: number, y: number): boolean {
    const p = this.pick(ndc);
    if (!p) return false;
    this.drag = p; p.mode = "drag";
    this.down = { x, y, t: performance.now() };
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    this.dragPlane.setFromNormalAndCoplanarPoint(dir, p.pos);
    this.lastDrag = [p.pos.clone()];
    blip(520, 0.05);
    return true;
  }

  pointerMove(ndc: THREE.Vector2) {
    if (!this.drag) return;
    this.ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(this.dragPlane, hit)) {
      this.drag.pos.copy(hit);
      this.lastDrag.push(hit.clone()); if (this.lastDrag.length > 5) this.lastDrag.shift();
    }
  }

  pointerUp(x: number, y: number) {
    const p = this.drag; if (!p) return;
    this.drag = null;
    const moved = Math.hypot(x - this.down.x, y - this.down.y);
    if (moved < 7 && performance.now() - this.down.t < 450) { p.mode = "return"; this.poke(p); return; }
    const a = this.lastDrag[0], b = this.lastDrag[this.lastDrag.length - 1];
    p.vel.copy(b).sub(a).multiplyScalar(12);
    p.mode = "fling"; p.t = 0.5; p.spin += (Math.random() - 0.5) * 8;
    if (!this.hooks.count("thrown")) this.hooks.found("throw", "Yeet. It always comes back.");
  }

  explode(p: Plate, power = 1) {
    const img = this.imgs.get(p.item);
    const g = new THREE.Vector3(); this.camera.getWorldDirection(g);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(this.camera.quaternion).multiplyScalar(5);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const c = p.sprite.position;
    if (img) for (const px of pixelGrid(img, 20)) {
      const o = c.clone().addScaledVector(right, px.x * 0.6).addScaledVector(up, px.y * 0.6);
      const v = right.clone().multiplyScalar(px.x * 6 * power + (Math.random() - 0.5) * 2)
        .addScaledVector(up, (px.y * 5 + 2.5 + Math.random() * 2) * power).addScaledVector(g, -Math.random() * 2);
      this.fx.emit(o, v, px.c, 0.9 + Math.random() * 0.6, 0.035, down);
    }
    p.mode = "gone"; p.t = 2.5;
    boom();
  }

  near(p: Plate, r: number) {
    return this.plates.filter((q) => q !== p && q.mode === "belt" && q.sprite.visible && q.pos.distanceTo(p.pos) < r);
  }

  poke(p: Plate) {
    const h = this.hooks, at = p.sprite.position.clone();
    switch (p.item) {
      case "bomb":
        h.found("bomb", "Bomb maki: a chain reaction."); h.shake(0.9); h.flash("#fff3c4");
        this.explode(p, 1.6); this.near(p, 3.2).forEach((q, i) => setTimeout(() => this.explode(q, 1.2), 90 + i * 60));
        break;
      case "duck": h.found("duck", "Rubber duck debugging."); h.bubble(at, "Quack. Now explain your code to me."); blip(900, 0.18, "sine", 0.08, -500); p.spin = 6.3; break;
      case "bug": {
        h.found("bug", "Squashed a bug."); const n = h.count("bugs");
        h.bubble(at, `Bug squashed. ${n + 1} fixed, 0 introduced.`, 1800, "ok");
        this.explode(p, 0.6); blip(140, 0.1, "sawtooth", 0.08); break;
      }
      case "puffer": h.found("puffer", "Don't poke the fugu."); p.puff = 2.4; blip(300, 0.4, "sine", 0.07, 600);
        setTimeout(() => this.explode(p, 1.3), 650); break;
      case "rock": h.found("rock", "Jiro eats rocks."); h.bubble(at, "Jiro eats rocks. Hard tickets welcome."); blip(90, 0.15, "square", 0.06); break;
      case "gold": h.found("gold", "Golden plate: omakase turbo."); h.bubble(at, "OMAKASE UNLOCKED", 2000, "gold"); this.turbo = 6; h.flash("#ffd76a");
        this.confetti(at, ["#ffd76a", "#fff1b3", "#e8b33a"]); blip(660, 0.1); setTimeout(() => blip(990, 0.2), 110); break;
      case "wasabi": h.found("wasabi", "Too much wasabi."); h.flash("#7fd34e"); h.shake(0.6); h.bubble(at, "TOO SPICY", 1400, "hot"); blip(200, 0.3, "sawtooth", 0.07, 400); break;
      case "cat": h.found("cat", "Found the belt cat."); h.bubble(at, "purrrr… (do not pet the sushi)"); this.confetti(at, ["#ff8fb1", "#ff5d8f"], 30); break;
      case "lucky-cat": h.found("lucky", "Maneki-neko: good luck on your deploy."); this.confetti(at, ["#ffd76a", "#e8b33a"], 80); h.bubble(at, "Deploy luck +100"); break;
      case "onigiri-happy": h.found("oni1", "A very happy onigiri."); h.bubble(at, "I'm just a rice guy doing my best!"); p.spin = 6.3; break;
      case "onigiri-angry":
        h.found("oni2", "Angry onigiri knocks its neighbours off."); h.bubble(at, "WHO MOVED MY NORI", 1400, "hot"); h.shake(0.3);
        this.near(p, 2.6).forEach((q) => { q.mode = "fling"; q.t = 0.45; q.vel.copy(q.pos).sub(p.pos).normalize().multiplyScalar(6); q.spin += 9; });
        break;
      case "onigiri-sleepy": h.found("oni3", "Sleepy onigiri slows the belt."); h.bubble(at, "zzz… belt… slower…"); this.sleepy = 5; break;
      case "ramen": case "bowl-ramen": h.found("ramen", "Wrong restaurant."); h.bubble(at, "Wrong restaurant, but Jiro respects the broth."); break;
      case "floppy": h.found("floppy", "Saving to floppy."); h.bubble(at, "Saving… 1.44 MB of pure legacy code", 2200); break;
      case "laptop-fire": h.found("fire", "This is fine."); h.bubble(at, "This is fine. (It's a staging server.)", 2200, "hot");
        this.confetti(at, ["#ff7a1a", "#ffd23f", "#ff3d1a"], 60); break;
      case "fortune": h.found("fortune", "Read a fortune."); h.bubble(at, FORTUNES[Math.floor(Math.random() * FORTUNES.length)], 2600); break;
      case "mini-jiro":
        h.found("mini", "Mini Jiro says hi."); h.bubble(at, "Irasshaimase!", 1600);
        this.plates.filter((q) => q.item === "mini-jiro").forEach((q) => (q.spin = 6.3)); blip(700, 0.08); setTimeout(() => blip(880, 0.12), 90); break;
      case "lobster": h.found("lobster", "A lobster. On a sushi belt."); h.bubble(at, "I'm not even sushi. Snip snip."); p.spin = 0.6; break;
      case "cup-matcha": case "cup-tea": case "cup-soy": case "bowl-miso": case "bowl-soup":
        h.found("tea", "Tea break."); h.bubble(at, "Ahh. Hot."); this.steam(at); break;
      default:
        if (!h.count("sushi")) h.found("sushi", "Sushi goes boom. Jiro makes more.");
        this.explode(p, 1);
    }
    if (SUSHI.includes(p.item) === false && p.item !== "bomb") p.puff = Math.max(p.puff, 1.35);
  }

  confetti(at: THREE.Vector3, cols: string[], n = 120) {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const g = up.clone().multiplyScalar(-4);
    for (let i = 0; i < n; i++) {
      const v = right.clone().multiplyScalar((Math.random() - 0.5) * 7).addScaledVector(up, 3 + Math.random() * 5);
      this.fx.emit(at, v, new THREE.Color(cols[i % cols.length]).convertSRGBToLinear(), 1.2 + Math.random(), 0.04, g);
    }
  }

  steam(at: THREE.Vector3) {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    for (let i = 0; i < 40; i++) {
      const v = up.clone().multiplyScalar(0.8 + Math.random()).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5));
      this.fx.emit(at, v, new THREE.Color("#e8e4dc").convertSRGBToLinear(), 1 + Math.random(), 0.05, up.clone().multiplyScalar(0.2));
    }
  }

  /** Konami: every plate turns gold for a rainbow lap. */
  party() {
    this.turbo = 8;
    this.plates.forEach((p, i) => { if (i % 3 === 0) p.spin = 6.3; });
    this.hooks.rainbow(true);
    setTimeout(() => this.hooks.rainbow(false), 8000);
  }

  paradeOfJiros() {
    let k = 0;
    for (const p of this.plates) { if (k++ % 2 === 0) this.setItem(p, "mini-jiro"); }
    setTimeout(() => { const bag = weightedBag(); this.plates.forEach((p) => this.setItem(p, bag())); }, 12000);
  }
}

function weightedBag() {
  const list: Item[] = [];
  for (const it of ITEMS) for (let i = 0; i < Math.round((WEIGHTS[it] ?? 1) * 4); i++) list.push(it);
  let last: Item | null = null;
  return (): Item => {
    let it: Item;
    do { it = list[Math.floor(Math.random() * list.length)]; } while (it === last && !SUSHI.includes(it));
    last = it; return it;
  };
}

function discTexture(rim: string) {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const R = 16;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const d = Math.hypot(x + 0.5 - R, y + 0.5 - R);
    if (d > 15.5) continue;
    g.fillStyle = d > 14.3 ? "#241a14" : d > 12 ? rim : d > 10.8 ? "#cfc8bb" : (x + y) % 9 === 0 ? "#f2eee6" : "#e6e0d4";
    g.fillRect(x, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function legTexture(frame: number) {
  // two little legs with shoes, 2-frame walk cycle
  const c = document.createElement("canvas"); c.width = 16; c.height = 12;
  const g = c.getContext("2d")!;
  const leg = (x: number, lift: number) => {
    g.fillStyle = "#e8c9a0"; g.fillRect(x, 0, 2, 8 - lift);
    g.fillStyle = "#2a1a10"; g.fillRect(x - 1, 8 - lift, 4, 2);
    g.fillStyle = "#c0392b"; g.fillRect(x - 1, 7 - lift, 4, 1);
  };
  leg(4, frame ? 2 : 0); leg(10, frame ? 0 : 2);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
