import * as THREE from "three";
import { Card, dirWorld, toWorld } from "./layout";

export interface Frame {
  p: THREE.Vector3; t: THREE.Vector3; b: THREE.Vector3; u: THREE.Vector3;
  /** half-width vector of the belt surface (may be skewed on painted lanes) */
  w: THREE.Vector3;
  /** visual scale of belt + plates here */
  sc: number;
  /** offset from belt surface to where a plate's item sits */
  lift: THREE.Vector3;
}

export const BELT_W = 1.15;
export const SLAT = 0.42; // belt-space length of one texture repeat

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * One continuous belt from the hero's wall opening to the footer, sampled densely.
 * Two parametrisations: world arc length `s` (camera), and belt-space `u` where
 * du = ds / scale. Plates and slats live in `u`, so on the small hero belt they
 * sit closer together and move slower in world units, matching the painting.
 */
export class BeltPath {
  pts: THREE.Vector3[] = [];
  ups: THREE.Vector3[] = [];
  tans: THREE.Vector3[] = [];
  bins: THREE.Vector3[] = [];
  wid: THREE.Vector3[] = [];
  lifts: THREE.Vector3[] = [];
  scs: number[] = [];
  cum: number[] = [];
  cumU: number[] = [];
  length = 0;
  lengthU = 0;
  /** world arc length where each card's in-card belt starts / ends */
  cardSpan: [number, number][] = [];

  constructor(cards: Card[]) {
    interface Ctl { p: THREE.Vector3; up: THREE.Vector3; w: THREE.Vector3 | null; sc: number; lift: THREE.Vector3 | null; ci: number }
    const C: Ctl[] = [];
    const cardW = (c: Card) => c.beltWidth ? dirWorld(c, c.beltWidth).multiplyScalar(Math.hypot(...c.beltWidth) / 2) : null;
    const cardLift = (c: Card) => c.beltWidth ? c.up.clone().multiplyScalar(0.3 * (c.beltScale ?? 1)).addScaledVector(c.normal, 0.02) : null;

    cards.forEach((c, i) => {
      c.belt.forEach((q) => C.push({ p: toWorld(c, q), up: c.normal.clone(), w: cardW(c), sc: c.beltScale ?? 1, lift: cardLift(c), ci: i }));
      const n = cards[i + 1];
      if (!n) return;
      const a = toWorld(c, c.belt[c.belt.length - 1]);
      const d = toWorld(n, n.belt[0]);
      const k = a.distanceTo(d) * 0.42;
      const b = a.clone().add(dirWorld(c, c.exitDir ?? [0, -1]).multiplyScalar(k));
      const cc = d.clone().sub(dirWorld(n, n.entryDir ?? [0, -1]).multiplyScalar(k));
      const curve = new THREE.CubicBezierCurve3(a, b, cc, d);
      const steps = Math.ceil(a.distanceTo(d) / 0.5);
      const qb = new THREE.Quaternion().setFromUnitVectors(c.normal, n.normal);
      for (let s = 1; s < steps; s++) {
        const t = s / steps, e = smooth(t);
        const up = c.normal.clone().applyQuaternion(new THREE.Quaternion().slerp(qb, e));
        C.push({ p: curve.getPoint(t), up, w: null, sc: THREE.MathUtils.lerp(c.beltScale ?? 1, n.beltScale ?? 1, smooth(Math.min(1, t * 1.6))), lift: null, ci: -1 });
      }
    });

    // round the corners on the coarse polygon first (Chaikin, cut capped at ~1.8 units) so every
    // turn has a radius well above the belt width: the slats need that to fan without gaps
    type S = { p: THREE.Vector3; up: THREE.Vector3; w: THREE.Vector3 | null; sc: number; lift: THREE.Vector3 | null; ci: number };
    const mixC = (a: THREE.Vector3 | null, b: THREE.Vector3 | null, f: number) => a && b ? a.clone().lerp(b, f) : (f < 0.5 ? a : b);
    for (let it = 0; it < 4; it++) {
      const N: Ctl[] = [C[0]];
      for (let i = 0; i < C.length - 1; i++) {
        const A = C[i], B = C[i + 1], len = A.p.distanceTo(B.p);
        const f = Math.min(0.25, 1.8 / Math.max(len, 1e-6) / (it + 1));
        const at = (g: number): Ctl => ({ p: A.p.clone().lerp(B.p, g), up: A.up.clone().lerp(B.up, g).normalize(), w: mixC(A.w, B.w, g),
          sc: A.sc + (B.sc - A.sc) * g, lift: mixC(A.lift, B.lift, g), ci: A.ci === B.ci ? A.ci : (g < 0.5 ? A.ci : B.ci) });
        N.push(at(f), at(1 - f));
      }
      N.push(C[C.length - 1]);
      C.length = 0; C.push(...N);
    }
    let S: S[] = [];
    const mixV = (a: THREE.Vector3 | null, b: THREE.Vector3 | null, f: number) => a && b ? a.clone().lerp(b, f) : null;
    for (let i = 0; i < C.length - 1; i++) {
      const A = C[i], B = C[i + 1];
      const n = Math.max(1, Math.ceil(A.p.distanceTo(B.p) / 0.3));
      for (let s = 0; s < n; s++) {
        const f = s / n;
        S.push({ p: A.p.clone().lerp(B.p, f), up: A.up.clone().lerp(B.up, f).normalize(), w: mixV(A.w, B.w, f), sc: A.sc + (B.sc - A.sc) * f,
          lift: mixV(A.lift, B.lift, f), ci: A.ci >= 0 && A.ci === B.ci ? A.ci : -1 });
      }
    }
    S.push({ ...C[C.length - 1] });
    let acc = 0, accU = 0;
    for (let i = 0; i < S.length; i++) {
      if (i > 0) { const ds = S[i].p.distanceTo(S[i - 1].p); acc += ds; accU += ds / ((S[i].sc + S[i - 1].sc) / 2); }
      this.cum.push(acc); this.cumU.push(accU);
      const t = S[Math.min(i + 1, S.length - 1)].p.clone().sub(S[Math.max(i - 1, 0)].p).normalize();
      const b = new THREE.Vector3().crossVectors(t, S[i].up).normalize();
      const u = new THREE.Vector3().crossVectors(b, t).normalize();
      this.pts.push(S[i].p); this.tans.push(t); this.bins.push(b); this.ups.push(u); this.scs.push(S[i].sc);
      this.wid.push(new THREE.Vector3()); this.lifts.push(new THREE.Vector3());
    }
    // width + lift: explicit on painted lanes, default elsewhere, blended across the connector
    const explicitW = S.map((x) => x.w), explicitL = S.map((x) => x.lift);
    let lastW = -1;
    for (let i = 0; i < S.length; i++) if (explicitW[i]) lastW = i;
    const firstFree = S.findIndex((x) => !x.w);
    for (let i = 0; i < S.length; i++) {
      const defW = this.bins[i].clone().multiplyScalar(BELT_W / 2 * this.scs[i]);
      const defL = this.ups[i].clone().multiplyScalar(0.27 * this.scs[i]);
      if (explicitW[i]) { this.wid[i].copy(explicitW[i]!); this.lifts[i].copy(explicitL[i]!); continue; }
      // blend over the first ~12 world units after a painted lane
      const k = lastW >= 0 && i > lastW ? smooth(Math.min(1, (this.cum[i] - this.cum[lastW]) / 12)) : 1;
      const wA = lastW >= 0 ? explicitW[lastW]! : defW, lA = lastW >= 0 ? explicitL[lastW]! : defL;
      this.wid[i].copy(wA).lerp(defW, k);
      this.lifts[i].copy(lA).lerp(defL, k);
    }
    void firstFree;
    this.length = acc; this.lengthU = accU;
    cards.forEach((_, k) => {
      let s0 = Infinity, s1 = -Infinity;
      S.forEach((x, i) => { if (x.ci === k) { s0 = Math.min(s0, this.cum[i]); s1 = Math.max(s1, this.cum[i]); } });
      if (!isFinite(s0)) {
        const q = toWorld(cards[k], cards[k].belt[0]);
        let best = 0;
        this.pts.forEach((p, i) => { if (p.distanceToSquared(q) < this.pts[best].distanceToSquared(q)) best = i; });
        s0 = s1 = this.cum[best];
      }
      this.cardSpan.push([s0, s1]);
    });
  }

  private at(table: number[], v: number) {
    let lo = 0, hi = table.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (table[m] < v) lo = m; else hi = m; }
    return { lo, hi, f: (v - table[lo]) / Math.max(1e-6, table[hi] - table[lo]) };
  }

  private fill(lo: number, hi: number, f: number, out?: Frame): Frame {
    const o = out ?? { p: new THREE.Vector3(), t: new THREE.Vector3(), b: new THREE.Vector3(), u: new THREE.Vector3(), w: new THREE.Vector3(), sc: 1, lift: new THREE.Vector3() };
    o.p.lerpVectors(this.pts[lo], this.pts[hi], f);
    o.t.lerpVectors(this.tans[lo], this.tans[hi], f).normalize();
    o.b.lerpVectors(this.bins[lo], this.bins[hi], f).normalize();
    o.u.lerpVectors(this.ups[lo], this.ups[hi], f).normalize();
    o.w.lerpVectors(this.wid[lo], this.wid[hi], f);
    o.lift.lerpVectors(this.lifts[lo], this.lifts[hi], f);
    o.sc = this.scs[lo] + (this.scs[hi] - this.scs[lo]) * f;
    return o;
  }

  frameAt(s: number, out?: Frame): Frame {
    const { lo, hi, f } = this.at(this.cum, THREE.MathUtils.clamp(s, 0, this.length));
    return this.fill(lo, hi, f, out);
  }

  frameAtU(u: number, out?: Frame): Frame {
    const { lo, hi, f } = this.at(this.cumU, THREE.MathUtils.clamp(u, 0, this.lengthU));
    return this.fill(lo, hi, f, out);
  }
}

function slatTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 32; c.height = 16;
  const g = c.getContext("2d")!;
  g.fillStyle = "#7d7a78"; g.fillRect(0, 0, 32, 16);
  g.fillStyle = "#9c9893"; g.fillRect(1, 1, 30, 6);
  g.fillStyle = "#b8b3ab"; g.fillRect(2, 1, 28, 1);
  g.fillStyle = "#5d5a58"; g.fillRect(0, 13, 32, 3);
  g.fillStyle = "#3b3634"; g.fillRect(0, 15, 32, 1);
  g.fillStyle = "#6c6966"; for (let x = 3; x < 32; x += 7) g.fillRect(x, 9, 2, 2);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Belt surface (scrolling slats) plus a copper-railed wooden frame, shaded without lights. */
export function buildBeltMesh(path: BeltPath) {
  const n = path.pts.length;
  const hw = BELT_W / 2;
  // --- surface
  const sp = new Float32Array(n * 2 * 3), suv = new Float32Array(n * 2 * 2);
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = path.pts[i].clone().addScaledVector(path.ups[i], -0.06 * path.scs[i]), w = path.wid[i];
    const l = p.clone().sub(w), r = p.clone().add(w);
    sp.set([l.x, l.y, l.z, r.x, r.y, r.z], i * 6);
    const v = path.cumU[i] / SLAT;
    suv.set([0, v, 1, v], i * 4);
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sg.setAttribute("uv", new THREE.BufferAttribute(suv, 2));
  sg.setIndex(idx);
  const tex = slatTexture();
  // dark bed under the slats (the slats themselves are instanced, see Slats)
  const surface = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: "#1e1814", side: THREE.DoubleSide, fog: true }));

  // --- frame: profile in (width-fraction, up) coordinates, with a flat shade per face
  const prof: [number, number][] = [
    [-1, 0], [-1.05, 0.11], [-1.22, 0.11], [-1.22, -0.26],
    [1.22, -0.26], [1.22, 0.11], [1.05, 0.11], [1, 0],
  ];
  const faceCol = [
    new THREE.Color("#8a4a28"), new THREE.Color("#e39a62"), new THREE.Color("#a3582f"),
    new THREE.Color("#1c120c"), new THREE.Color("#a3582f"), new THREE.Color("#e39a62"), new THREE.Color("#8a4a28"),
  ];
  const fp: number[] = [], fc: number[] = [];
  const q = (j: number, m: number) => path.pts[j].clone()
    .addScaledVector(path.wid[j], prof[m][0]).addScaledVector(path.ups[j], prof[m][1] * path.scs[j] * (hw / hw));
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < prof.length - 1; k++) {
      const a = q(i, k), b = q(i, k + 1), c = q(i + 1, k), d = q(i + 1, k + 1);
      const col = faceCol[k];
      for (const v of [a, b, c, b, d, c]) { fp.push(v.x, v.y, v.z); fc.push(col.r, col.g, col.b); }
    }
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3));
  fg.setAttribute("color", new THREE.Float32BufferAttribute(fc, 3));
  const frame = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: true }));

  const group = new THREE.Group();
  group.add(surface, frame);
  return { group, tex };
}

/**
 * Airport-carousel style slats (see EP2669218A1 / US3718249A): each slat hangs off a
 * chain pin on the centreline, points along the chord to the next pin, and is tilted
 * nose-down so its front tucks under the slat ahead. On a curve the slats pivot about
 * their pins: they pile up on the inside of the turn and fan open on the outside,
 * sliding under one another instead of leaving gaps.
 */
export const SLAT_PITCH = 0.25;                    // ≈0.22 × belt width (research: 0.2–0.25 W)
const SLAT_LEN = SLAT_PITCH + 0.15;                // pitch + straight-run overlap
const SLAT_TILT = Math.atan(0.035 / SLAT_PITCH);   // nose-down shingle angle

function slatGeometry() {
  const W = BELT_W, L = SLAT_LEN, bow = 0.08 * W, hw = W / 2;
  const sh = new THREE.Shape();
  // plan view: x forward (0 = chain pin at the rear, L = nose), y across. Convex nose, concave tail.
  sh.moveTo(0, -hw);
  sh.quadraticCurveTo(bow, 0, 0, hw);                 // concave trailing edge
  sh.lineTo(L - bow, hw);
  sh.quadraticCurveTo(L + bow, 0, L - bow, -hw);      // convex leading edge
  sh.lineTo(0, -hw);
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: false, curveSegments: 10 });
  // subdivide along x so the per-vertex bands have vertices to live on
  g = g.toNonIndexed();
  // shingle tilt: the nose sits lower than the tail
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) - pos.getX(i) * Math.tan(SLAT_TILT) + 0.02);
  pos.needsUpdate = true;
  // pixel-art shading baked per vertex: a dark lip along the exposed trailing edge (the
  // classic stepped look of a carousel), a light band just behind it, steel in between
  const col = new Float32Array(pos.count * 3), c = new THREE.Color();
  const bowAt = (y: number) => 0.08 * W * (1 - (2 * y / W) ** 2); // x of the concave tail at this y
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), n = new THREE.Vector3();
  for (let t = 0; t < pos.count; t += 3) {
    va.fromBufferAttribute(pos, t); vb.fromBufferAttribute(pos, t + 1); vc.fromBufferAttribute(pos, t + 2);
    n.subVectors(vc, vb).cross(va.clone().sub(vb)).normalize();
    const top = Math.abs(n.z) > 0.6 && (va.z + vb.z + vc.z) / 3 > -0.03 + 0.02 - ((va.x + vb.x + vc.x) / 3) * Math.tan(SLAT_TILT) + 0.017;
    for (let k = 0; k < 3; k++) {
      const i = t + k, x = pos.getX(i), y = pos.getY(i);
      const fromTail = x - bowAt(y) * 0.5;
      if (!top) c.set("#3a3632");
      else if (fromTail < 0.035) c.set("#6b6661");
      else if (fromTail < 0.075) c.set("#e0dbd3");
      else c.set("#b3aea6");
      col.set([c.r, c.g, c.b], i * 3);
    }
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

export class Slats {
  mesh: THREE.InstancedMesh;
  n: number;
  f1: Frame = { p: new THREE.Vector3(), t: new THREE.Vector3(), b: new THREE.Vector3(), u: new THREE.Vector3(), w: new THREE.Vector3(), sc: 1, lift: new THREE.Vector3() };
  f2: Frame = { p: new THREE.Vector3(), t: new THREE.Vector3(), b: new THREE.Vector3(), u: new THREE.Vector3(), w: new THREE.Vector3(), sc: 1, lift: new THREE.Vector3() };
  m = new THREE.Matrix4();
  fwd = new THREE.Vector3(); side = new THREE.Vector3();

  constructor(public path: BeltPath) {
    this.n = Math.floor(path.lengthU / SLAT_PITCH);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
    this.mesh = new THREE.InstancedMesh(slatGeometry(), mat, this.n);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    // a hint of variation so the shingled rows read (every 4th slat a touch lighter)
    const c = new THREE.Color();
    for (let i = 0; i < this.n; i++) this.mesh.setColorAt(i, c.setScalar(i % 2 ? 0.86 : 1));
  }

  update(offsetU: number) {
    const L = this.path.lengthU, hw = BELT_W / 2;
    for (let i = 0; i < this.n; i++) {
      let u = (i * SLAT_PITCH + offsetU) % L; if (u < 0) u += L;
      const a = this.path.frameAtU(u, this.f1);
      const b = this.path.frameAtU(Math.min(L, u + SLAT_PITCH), this.f2);
      // aim along the chord to the next pin (this is what makes them fan in a turn)
      this.fwd.copy(b.p).sub(a.p);
      const len = this.fwd.length();
      if (len < 1e-5) this.fwd.copy(a.t).multiplyScalar(SLAT_PITCH * a.sc); else this.fwd.multiplyScalar((SLAT_PITCH * a.sc) / len);
      this.fwd.multiplyScalar(1 / SLAT_PITCH);          // geometry x is in slat units; scale to world
      this.side.copy(a.w).multiplyScalar(1 / hw);       // skewed + scaled width on painted lanes
      const up = a.u.clone().multiplyScalar(a.sc);
      const vis = Math.min(1, u / 0.3);
      this.m.makeBasis(this.fwd.multiplyScalar(vis), this.side.multiplyScalar(vis), up.multiplyScalar(vis)).setPosition(a.p.x, a.p.y, a.p.z);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
