import * as THREE from "three";
import { BeltPath } from "./belt";

/**
 * Between two scenes the belt passes through a wall of the house: a noren doorway,
 * an open shoji, a round moon window, a kitchen hatch, an arched door. The chase
 * camera rides through the opening with the belt, so every scene change reads as
 * "going into the next room".
 */
export type DoorStyle = "noren" | "shoji" | "moon" | "hatch" | "arch";
const STYLES: DoorStyle[] = ["noren", "shoji", "moon", "hatch", "arch"];

// wall-local units: x across the belt, y up from the belt surface
interface Opening { l: number; r: number; b: number; t: number }
// minimum distance from any camera position on a ride to a wall, so a wall never fills the frame
const WALL_CLEAR = 3.6;
const PX = 14; // canvas pixels per world unit (chunky pixel art)

interface WallRect { w: number; top: number; bottom: number }

function paintWall(style: DoorStyle, r: WallRect, o: Opening): HTMLCanvasElement {
  const W = Math.round(r.w * PX), H = Math.round((r.top - r.bottom) * PX);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const X = (x: number) => Math.round((x + r.w / 2) * PX), Y = (y: number) => Math.round((r.top - y) * PX);
  // plaster upper wall, dark wood wainscot, posts and a top beam
  g.fillStyle = "#c9b48f"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? "#bfa983" : "#d3bf9b"; g.fillRect(Math.random() * W | 0, Math.random() * H | 0, 2, 1); }
  g.fillStyle = "#4a2e1c"; g.fillRect(0, Y(1.2), W, H - Y(1.2));
  g.fillStyle = "#3a2215"; for (let x = 0; x < W; x += 9) g.fillRect(x, Y(1.2), 1, H - Y(1.2));
  g.fillStyle = "#2b190f"; g.fillRect(0, Y(1.25), W, 3);
  g.fillStyle = "#5a3822"; g.fillRect(0, Y(6.2), W, 6);
  for (const px of [o.l - 4.2, o.l - 1.2, o.r + 1.2, o.r + 4.2]) { g.fillStyle = "#5a3822"; g.fillRect(X(px) - 4, 0, 8, H); g.fillStyle = "#2b190f"; g.fillRect(X(px) + 3, 0, 1, H); }
  const L = X(o.l), R = X(o.r), T = Y(o.t), B = Y(o.b);
  // frame around the opening
  g.fillStyle = "#6b4226"; g.fillRect(L - 6, T - 6, R - L + 12, B - T + 12);
  g.fillStyle = "#8a5a34"; g.fillRect(L - 6, T - 6, R - L + 12, 2);
  if (style === "shoji") {
    // paper panels slid open to either side
    for (const x0 of [L - 34, R + 6]) {
      g.fillStyle = "#f3ead8"; g.fillRect(x0, T, 28, B - T);
      g.fillStyle = "#6b4226"; g.strokeStyle = "#6b4226";
      for (let x = x0; x <= x0 + 28; x += 7) g.fillRect(x, T, 1, B - T);
      for (let y = T; y <= B; y += 8) g.fillRect(x0, y, 28, 1);
    }
  }
  if (style === "hatch") {
    g.fillStyle = "#3a2215"; g.fillRect(L - 12, B - 2, R - L + 24, 6); // sill
    g.fillStyle = "#7a2f25"; g.fillRect(L - 10, T - 16, R - L + 20, 8); // little awning
    g.fillStyle = "#a33b2e"; for (let x = L - 10; x < R + 10; x += 8) g.fillRect(x, T - 16, 4, 8);
  }
  // cut the opening
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "#000";
  if (style === "moon") {
    const cx = (L + R) / 2, cy = (T + B) / 2, rr = (B - T) / 2 + 2;
    g.globalCompositeOperation = "source-over"; g.fillStyle = "#6b4226"; g.beginPath(); g.arc(cx, cy, rr + 6, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fill();
  } else if (style === "arch") {
    const cx = (L + R) / 2, rr = (R - L) / 2;
    g.fillRect(L, T + rr, R - L, B - T - rr); g.beginPath(); g.arc(cx, T + rr, rr, Math.PI, 0); g.fill();
  } else {
    g.fillRect(L, T, R - L, B - T);
  }
  g.globalCompositeOperation = "source-over";
  return c;
}

function norenTexture(k: number) {
  const c = document.createElement("canvas"); c.width = 16; c.height = 20; const g = c.getContext("2d")!;
  g.fillStyle = ["#27325c", "#7a2f25", "#2f5a3a"][k % 3]; g.fillRect(0, 0, 16, 20);
  g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(5, 6, 6, 1); g.fillRect(7, 4, 2, 8); g.fillRect(5, 11, 6, 1);
  g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 19, 16, 1);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export interface Door { group: THREE.Group; noren: THREE.Mesh[]; style: DoorStyle }

export function buildDoors(scene: THREE.Scene, path: BeltPath, spans: [number, number][], lanternTex: THREE.Texture,
  views: { from: THREE.Vector3; to: THREE.Vector3[] }[],
  cameraCrossing: (cardIndex: number, p: THREE.Vector3, n: THREE.Vector3) => THREE.Vector3 | null,
  cameraSamples: (cardIndex: number) => THREE.Vector3[] = () => []): Door[] {
  const doors: Door[] = [];
  for (let i = 0; i < spans.length - 1; i++) {
    const s0 = spans[i][1], s1 = spans[i + 1][0];
    if (s1 - s0 < 10) continue;
    const style = STYLES[doors.length % STYLES.length];
    const cams = cameraSamples(i);
    // a small doorway just around the belt; the camera glides past the wall's side
    const o: Opening = style === "moon" ? { l: -1.45, r: 1.45, b: -1.25, t: 1.65 } : { l: -1.25, r: 1.25, b: -0.45, t: 2.0 };
    const OPEN_W = o.r - o.l, OPEN_T = o.t, OPEN_B = o.b, OX = 0;
    const cl = new THREE.Vector3(0, 0.3, 0);
    const size: WallRect[] = [{ w: 8, top: 4.6, bottom: -1.8 }, { w: 6, top: 3.6, bottom: -1.2 }, { w: 5, top: 3.0, bottom: -1.0 }];
    let placed: { rect: WallRect; basis: THREE.Matrix4; clear: number } | null = null;
    // slide the wall along the connector and keep the placement the rides clear by the widest margin
    for (let along = 0.25; along <= 0.751; along += 0.025) {
      const sm = s0 + (s1 - s0) * along;
      const f = path.frameAt(sm);
      const basis = new THREE.Matrix4().makeBasis(f.b, f.u, f.t).setPosition(f.p);
      const inv = basis.clone().invert();
      const cross = cameraCrossing(i, f.p, f.t);
        for (const r of size) {
        const blocked = (a: THREE.Vector3, b: THREE.Vector3) => {
          const la = a.clone().applyMatrix4(inv), lb = b.clone().applyMatrix4(inv);
          if (la.z * lb.z > 0) return false;
          const k = la.z / (la.z - lb.z), x = la.x + (lb.x - la.x) * k, y = la.y + (lb.y - la.y) * k;
          const inWall = Math.abs(x - OX) < r.w / 2 + 0.6 && y < r.top + 0.6 && y > r.bottom - 0.6;
          const inHole = Math.abs(x - OX) < OPEN_W / 2 && y > OPEN_B && y < OPEN_T;
          return inWall && !inHole;
        };
        let ok = views.every((v) => v.to.every((t) => !blocked(v.from, t)));
        if (ok && cross) {
          const c = cross.clone().applyMatrix4(inv);
          if (Math.abs(c.x) < r.w / 2 + 3.5 && c.y < r.top + 3 && c.y > r.bottom - 3) ok = false;
        }
        // nothing may fill the frame: every camera position on the ride stays WALL_CLEAR from the wall
        let clear = Infinity;
        for (let j = 0; ok && j < cams.length; j++) {
          const c = cams[j].clone().applyMatrix4(inv);
          const dx = Math.max(0, Math.abs(c.x - OX) - r.w / 2), dy = Math.max(0, r.bottom - c.y, c.y - r.top);
          clear = Math.min(clear, Math.hypot(dx, dy, c.z));
        }
        if (clear < WALL_CLEAR) ok = false;
        for (let s = 0; ok && s < path.length - 0.5; s += 0.5) {
          if (Math.abs(s - sm) < 1) continue;
          if (blocked(path.frameAt(s).p, path.frameAt(s + 0.5).p)) ok = false;
        }
        if (ok && (!placed || clear > placed.clear + 0.25)) placed = { rect: r, basis, clear };
      }
    }
    if (!placed) continue;
    const { rect, basis } = placed;
    const group = new THREE.Group();
    group.matrixAutoUpdate = false; group.matrix.copy(basis);
    const tex = new THREE.CanvasTexture(paintWall(style, rect, { l: o.l - OX, r: o.r - OX, b: o.b, t: o.t }));
    tex.magFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(rect.w, rect.top - rect.bottom),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, fog: true }));
    wall.position.set(OX, (rect.top + rect.bottom) / 2, 0.18);
    const back = wall.clone(); back.position.z = -0.18;
    group.add(wall, back);
    // edges so it reads as a solid wall, and a little tiled eave on top
    const edge = new THREE.MeshBasicMaterial({ color: "#3a2215", fog: true });
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.2, rect.top - rect.bottom, 0.36), edge); e.position.set(OX + sx * rect.w / 2, (rect.top + rect.bottom) / 2, 0); group.add(e); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(rect.w + 0.3, 0.22, 0.46), edge);
    beam.position.set(OX, rect.top + 0.05, 0); group.add(beam);
    // warm lanterns on both faces of the wall, beside the opening
    for (const side of [-1, 1]) for (const face of [-1, 1]) {
      const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: lanternTex, fog: true }));
      l.scale.set(0.5, 0.75, 1); l.position.set(OX + side * (OPEN_W / 2 + 0.9), OPEN_T - 0.3, face * 0.42);
      group.add(l);
    }
    const noren: THREE.Mesh[] = [];
    void cl;
    if (style === "noren") {
      for (let k = 0; k < 3; k++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(OPEN_W / 3 - 0.08, Math.min(1.1, OPEN_T - cl.y - 0.4)), new THREE.MeshBasicMaterial({ map: norenTexture(k), side: THREE.DoubleSide, fog: true }));
        const hh = Math.min(1.1, OPEN_T - cl.y - 0.4);
        m.geometry.translate(0, -hh / 2, 0);
        m.position.set(OX - OPEN_W / 3 + k * OPEN_W / 3, OPEN_T, 0);
        group.add(m); noren.push(m);
      }
    }
    group.updateMatrixWorld(true);
    scene.add(group);
    doors.push({ group, noren, style });
  }
  return doors;
}

export function animateDoors(doors: Door[], time: number) {
  for (const d of doors) d.noren.forEach((m, k) => { m.rotation.x = Math.sin(time * 1.3 + k * 0.9) * 0.12; });
}
