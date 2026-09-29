import * as THREE from "three";
import { Card, V2 } from "./layout";
import { Plates } from "./plates";
import { Particles, blip, boom } from "./fx";
import type { Hooks } from "./plates";

const loader = new THREE.TextureLoader();
function tex(url: string) {
  const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
}
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;

/** Positions in a card's local plane (16 x 9 units, origin at the centre). */
function place(card: Card, obj: THREE.Object3D, p: V2, z: number) {
  obj.position.copy(new THREE.Vector3(p[0], p[1], z).applyMatrix4(card.object.matrixWorld));
}
function local(card: Card, w: THREE.Vector3) { return card.object.worldToLocal(w.clone()); }

// ------------------------------------------------------------------ koi
export class Koi {
  mesh: THREE.Mesh;
  t = -1;           // -1 idle, else seconds into the jump
  next = 3.5;       // seconds until the next jump (first one soon after you arrive)
  xa = 0; xb = 0;
  eaten = 0;
  static DUR = 1.9;
  static BELT_Y = -0.02;

  constructor(scene: THREE.Scene, public card: Card, public plates: Plates, public fx: Particles, public hooks: Hooks) {
    const m = new THREE.MeshBasicMaterial({ map: tex("end/koi.png"), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, fog: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3 * 1.0, 4.56 * 1.0), m);
    this.mesh.visible = false;
    this.mesh.renderOrder = 6;
    scene.add(this.mesh);
  }

  /** active = the pond is on screen */
  update(dt: number, active: boolean) {
    if (this.t < 0) {
      if (!active) return;
      this.next -= dt;
      if (this.next <= 0) this.start();
      return;
    }
    this.t += dt;
    const u = this.t / Koi.DUR;
    if (u >= 1) { this.t = -1; this.mesh.visible = false; this.next = 22 + Math.random() * 18; this.splash(this.xb); return; }
    // parabola from under the water on one side of the belt, over it, back in
    const x = THREE.MathUtils.lerp(this.xa, this.xb, u);
    const y = -3.3 + 4 * 5.6 * u * (1 - u);
    const dx = this.xb - this.xa, dy = 4 * 5.6 * (1 - 2 * u);
    const ang = Math.atan2(dy, dx / Koi.DUR * Koi.DUR);
    this.mesh.visible = true;
    place(this.card, this.mesh, [x, y], 0.35);
    // sprite's mouth points up-right (45°); when mirrored it points up-left (135°)
    const rot = ang - (this.mesh.scale.x > 0 ? Math.PI / 4 : (3 * Math.PI) / 4);
    this.mesh.quaternion.copy(this.card.quat).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rot));
    // the mouth sits up-and-forward of the sprite centre
    const mouth = new THREE.Vector2(x, y).add(new THREE.Vector2(Math.cos(ang), Math.sin(ang)).multiplyScalar(1.7));
    if (Math.abs(mouth.y - Koi.BELT_Y) < 1.1) this.chomp(mouth.x, 1.7);
  }

  start() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const c = -0.5 + Math.random() * 4.5;
    this.xa = c - dir * 3.2; this.xb = c + dir * 3.2;
    this.t = 0; this.eaten = 0;
    this.mesh.scale.x = dir;          // sprite faces right; mirror when jumping left
    this.splash(this.xa);
    blip(180, 0.3, "sine", 0.07, 300);
  }

  chomp(mx: number, r: number) {
    for (const p of this.plates.plates) {
      if (p.mode !== "belt" || !p.sprite.visible) continue;
      const q = local(this.card, p.pos);
      if (Math.abs(q.y - Koi.BELT_Y) > 0.8 || Math.abs(q.x - mx) > r || q.x < -3.1 || q.x > 8) continue;
      this.plates.eat(p);
      this.eaten++;
      if (this.eaten === 1) { this.hooks.bubble(p.sprite.position.clone(), "GULP", 900, "hot"); boom(); }
    }
  }

  splash(x: number) {
    const at = new THREE.Vector3(x, -2.9, 0.3).applyMatrix4(this.card.object.matrixWorld);
    const up = this.card.up, right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.card.quat);
    for (let i = 0; i < 90; i++) {
      const v = up.clone().multiplyScalar(2 + Math.random() * 4).addScaledVector(right, (Math.random() - 0.5) * 4);
      this.fx.emit(at, v, new THREE.Color(i % 3 ? "#9fd6ff" : "#ffffff").convertSRGBToLinear(), 0.9 + Math.random() * 0.5, 0.05, up.clone().multiplyScalar(-9));
    }
  }
}

// ------------------------------------------------------------------ train
interface Queued { sprite: THREE.Sprite; slot: V2; from: V2; t: number; hop: number; door: V2 | null }

export class Train {
  mesh: THREE.Mesh;
  queue: Queued[] = [];
  state: "away" | "arriving" | "boarding" | "departing" = "away";
  t = 0;
  x = 16;
  sinceDepart = 0;
  static W = 10.4;
  static H = 10.4 * 403 / 1600;
  static RAIL_Y = -2.15;
  static STOP_X = -3.4;
  static BELT_END: V2 = [0.05, 0.68];
  static COLS = 7; static ROWS = 3;

  constructor(public scene: THREE.Scene, public card: Card, public plates: Plates, public fx: Particles, public hooks: Hooks) {
    const m = new THREE.MeshBasicMaterial({ map: tex("end/train.png"), transparent: true, alphaTest: 0.4, fog: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(Train.W, Train.H), m);
    this.mesh.renderOrder = 6;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  slot(i: number): V2 {
    const c = i % Train.COLS, r = Math.floor(i / Train.COLS);
    return [-1.75 - c * 0.52 - (r % 2) * 0.2, 0.55 - r * 0.33];
  }

  /** a plate reached the end of the belt: it steps off onto the platform */
  arrive(item: THREE.Texture) {
    const i = this.queue.filter((q) => !q.door).length;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: item, alphaTest: 0.35 }));
    const s = 0.62 * 0.55; sprite.scale.set(s, s, 1);
    this.scene.add(sprite);
    const slot = i < Train.COLS * Train.ROWS ? this.slot(i) : this.slot(Train.COLS * Train.ROWS - 1 - (i % 4));
    this.queue.push({ sprite, slot, from: Train.BELT_END, t: 0, hop: -1, door: null });
  }

  update(dt: number, time: number, active: boolean) {
    this.sinceDepart += dt;
    // queued plates slide from the belt end to their spot, with a little bob
    for (const q of this.queue) {
      if (q.hop >= 0) continue;
      q.t = Math.min(1, q.t + dt / 0.7);
      const e = easeOut(q.t);
      const x = THREE.MathUtils.lerp(q.from[0], q.slot[0], e), y = THREE.MathUtils.lerp(q.from[1], q.slot[1], e);
      place(this.card, q.sprite, [x, y + 0.17 + Math.abs(Math.sin(q.t * Math.PI * 2)) * 0.06 * (1 - q.t)], 0.08);
    }
    const trainY = Train.RAIL_Y + Train.H / 2;
    if (this.state === "away") {
      this.mesh.visible = false;
      if (this.queue.length >= 9 || (this.queue.length >= 5 && this.sinceDepart > 22)) { this.state = "arriving"; this.t = 0; if (active) blip(260, 0.6, "sine", 0.05, -80); }
    } else if (this.state === "arriving") {
      this.t += dt / 2.6;
      this.x = THREE.MathUtils.lerp(14, Train.STOP_X, easeOut(Math.min(1, this.t)));
      if (this.t >= 1) {
        this.state = "boarding"; this.t = 0;
        const doors: V2[] = [[Train.STOP_X - Train.W / 2 + Train.W * 0.353, trainY + 0.05], [Train.STOP_X - Train.W / 2 + Train.W * 0.70, trainY + 0.05]];
        this.queue.forEach((q, i) => { q.hop = -0.2 - i * 0.07; q.door = doors[q.slot[0] < -3.4 ? 0 : 1]; q.from = q.slot; });
        if (active) this.hooks.bubble(new THREE.Vector3(-6.6, 2.9, 0).applyMatrix4(this.card.object.matrixWorld), "All aboard!", 1400);
      }
    } else if (this.state === "boarding") {
      this.t += dt;
      let left = 0;
      for (const q of this.queue) {
        if (!q.door || q.hop > 1) continue;   // late arrivals wait for the next train
        q.hop += dt / 0.45;
        if (q.hop < 0) { left++; continue; }
        if (q.hop > 1) { q.sprite.visible = false; continue; }
        left++;
        const h = q.hop, d = q.door!;
        const x = THREE.MathUtils.lerp(q.from[0], d[0], h), y = THREE.MathUtils.lerp(q.from[1], d[1], h) + Math.sin(h * Math.PI) * 0.9;
        place(this.card, q.sprite, [x, y + 0.17], 0.08 + h * 0.2);
        const sc = 0.62 * 0.55 * (1 - h * 0.35); q.sprite.scale.set(sc, sc, 1);
      }
      if (left === 0 && this.t > 0.6) {
        const boarded = this.queue.filter((q) => q.door), waiting = this.queue.filter((q) => !q.door);
        boarded.forEach((q) => { this.scene.remove(q.sprite); q.sprite.material.dispose(); });
        this.queue = waiting;
        waiting.forEach((q, i) => { q.from = [...q.slot] as V2; q.slot = this.slot(i); q.t = 0; });
        this.state = "departing"; this.t = 0;
        if (active) { this.hooks.bubble(new THREE.Vector3(-6.6, 2.9, 0).applyMatrix4(this.card.object.matrixWorld), "Piiii!", 1100); blip(2100, 0.35, "square", 0.04); }
      }
    } else if (this.state === "departing") {
      this.t += dt / 2.0;
      this.x = THREE.MathUtils.lerp(Train.STOP_X, -24, easeIn(Math.min(1, this.t)));
      if (this.t > 0.35 && this.t - dt / 2.0 <= 0.35 && active) blip(120, 0.8, "sawtooth", 0.03, 900);
      if (this.t >= 1) { this.state = "away"; this.sinceDepart = 0; this.x = 16; }
    }
    if (this.state !== "away") {
      this.mesh.visible = true;
      // a tiny suspension bounce while moving
      const bob = this.state === "boarding" ? 0 : Math.sin(time * 22) * 0.012;
      place(this.card, this.mesh, [this.x, trainY + bob], 0.28);
      this.mesh.quaternion.copy(this.card.quat);
    }
  }
}
