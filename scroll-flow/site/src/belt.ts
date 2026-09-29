import * as THREE from "three";
import { Card, dirWorld, toWorld } from "./layout";

export interface Frame { p: THREE.Vector3; t: THREE.Vector3; b: THREE.Vector3; u: THREE.Vector3 }

/** One continuous belt from the hero exit to the footer, sampled densely with an orthonormal frame. */
export class BeltPath {
  pts: THREE.Vector3[] = [];
  ups: THREE.Vector3[] = [];
  tans: THREE.Vector3[] = [];
  bins: THREE.Vector3[] = [];
  cum: number[] = [];
  length = 0;
  /** arc length where each card's in-card belt starts / ends */
  cardSpan: [number, number][] = [];

  constructor(cards: Card[]) {
    const P: THREE.Vector3[] = [];
    const U: THREE.Vector3[] = [];
    const cardIdx: number[] = [];
    const push = (p: THREE.Vector3, u: THREE.Vector3, ci: number) => { P.push(p); U.push(u.clone().normalize()); cardIdx.push(ci); };

    cards.forEach((c, i) => {
      c.belt.forEach((q) => push(toWorld(c, q), c.normal, i));
      const n = cards[i + 1];
      if (!n) return;
      const a = toWorld(c, c.belt[c.belt.length - 1]);
      const d = toWorld(n, n.belt[0]);
      const k = a.distanceTo(d) * 0.42;
      const b = a.clone().add(dirWorld(c, c.exitDir ?? [0, -1]).multiplyScalar(k));
      const cc = d.clone().sub(dirWorld(n, n.entryDir ?? [0, -1]).multiplyScalar(k));
      const curve = new THREE.CubicBezierCurve3(a, b, cc, d);
      const steps = Math.ceil(a.distanceTo(d) / 0.5);
      const qa = new THREE.Quaternion(), qb = new THREE.Quaternion().setFromUnitVectors(c.normal, n.normal);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const e = t * t * (3 - 2 * t);
        const up = c.normal.clone().applyQuaternion(qa.clone().slerp(qb, e));
        push(curve.getPoint(t), up, -1);
      }
    });

    // densify straight runs, then round corners with Chaikin (endpoints pinned)
    let pts: THREE.Vector3[] = [], ups: THREE.Vector3[] = [], ci: number[] = [];
    for (let i = 0; i < P.length - 1; i++) {
      const n = Math.max(1, Math.ceil(P[i].distanceTo(P[i + 1]) / 0.35));
      for (let s = 0; s < n; s++) {
        pts.push(P[i].clone().lerp(P[i + 1], s / n));
        ups.push(U[i].clone().lerp(U[i + 1], s / n).normalize());
        ci.push(cardIdx[i] >= 0 && cardIdx[i] === cardIdx[i + 1] ? cardIdx[i] : -1);
      }
    }
    pts.push(P[P.length - 1]); ups.push(U[U.length - 1]); ci.push(cardIdx[cardIdx.length - 1]);
    for (let it = 0; it < 3; it++) {
      const np = [pts[0]], nu = [ups[0]], nc = [ci[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        np.push(pts[i].clone().lerp(pts[i + 1], 0.25), pts[i].clone().lerp(pts[i + 1], 0.75));
        nu.push(ups[i].clone().lerp(ups[i + 1], 0.25).normalize(), ups[i].clone().lerp(ups[i + 1], 0.75).normalize());
        nc.push(ci[i], ci[i]);
      }
      np.push(pts[pts.length - 1]); nu.push(ups[ups.length - 1]); nc.push(ci[ci.length - 1]);
      pts = np; ups = nu; ci = nc;
    }

    this.pts = pts;
    let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) acc += pts[i].distanceTo(pts[i - 1]);
      this.cum.push(acc);
      const t = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
      const b = new THREE.Vector3().crossVectors(t, ups[i]).normalize();
      const u = new THREE.Vector3().crossVectors(b, t).normalize();
      this.tans.push(t); this.bins.push(b); this.ups.push(u);
    }
    this.length = acc;
    cards.forEach((_, k) => {
      let s0 = Infinity, s1 = -Infinity;
      ci.forEach((c, i) => { if (c === k) { s0 = Math.min(s0, this.cum[i]); s1 = Math.max(s1, this.cum[i]); } });
      if (!isFinite(s0)) {
        // single-point card (the hero exit): use the nearest sample
        const q = toWorld(cards[k], cards[k].belt[0]);
        let best = 0;
        pts.forEach((p, i) => { if (p.distanceToSquared(q) < pts[best].distanceToSquared(q)) best = i; });
        s0 = s1 = this.cum[best];
      }
      this.cardSpan.push([s0, s1]);
    });
  }

  frameAt(s: number, out?: Frame): Frame {
    s = THREE.MathUtils.clamp(s, 0, this.length);
    let lo = 0, hi = this.cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.cum[m] < s) lo = m; else hi = m; }
    const f = (s - this.cum[lo]) / Math.max(1e-6, this.cum[hi] - this.cum[lo]);
    const o = out ?? { p: new THREE.Vector3(), t: new THREE.Vector3(), b: new THREE.Vector3(), u: new THREE.Vector3() };
    o.p.lerpVectors(this.pts[lo], this.pts[hi], f);
    o.t.lerpVectors(this.tans[lo], this.tans[hi], f).normalize();
    o.b.lerpVectors(this.bins[lo], this.bins[hi], f).normalize();
    o.u.lerpVectors(this.ups[lo], this.ups[hi], f).normalize();
    return o;
  }
}

export const BELT_W = 1.15;
export const SLAT = 0.42; // world length of one texture repeat

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
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
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
    const p = path.pts[i], b = path.bins[i];
    const l = p.clone().addScaledVector(b, -hw), r = p.clone().addScaledVector(b, hw);
    sp.set([l.x, l.y, l.z, r.x, r.y, r.z], i * 6);
    const v = path.cum[i] / SLAT;
    suv.set([0, v, 1, v], i * 4);
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sg.setAttribute("uv", new THREE.BufferAttribute(suv, 2));
  sg.setIndex(idx);
  const tex = slatTexture();
  const surface = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: true }));

  // --- frame: profile in (b, u) coordinates, with a flat shade per face
  const prof: [number, number][] = [
    [-hw, 0], [-hw - 0.03, 0.11], [-hw - 0.13, 0.11], [-hw - 0.13, -0.26],
    [hw + 0.13, -0.26], [hw + 0.13, 0.11], [hw + 0.03, 0.11], [hw, 0],
  ];
  const faceCol = [
    new THREE.Color("#8a4a28"), new THREE.Color("#e39a62"), new THREE.Color("#a3582f"),
    new THREE.Color("#1c120c"), new THREE.Color("#a3582f"), new THREE.Color("#e39a62"), new THREE.Color("#8a4a28"),
  ];
  const fp: number[] = [], fc: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < prof.length - 1; k++) {
      const q = (j: number, m: number) => path.pts[j].clone()
        .addScaledVector(path.bins[j], prof[m][0]).addScaledVector(path.ups[j], prof[m][1]);
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
