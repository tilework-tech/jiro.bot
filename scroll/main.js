import * as THREE from "three";
import { SPRITES, KINDS, pickKind } from "./sprites.js";

// ---------------------------------------------------------------------------
// Scenes. Each is a 16x9 video plane placed in the world. Shots are camera
// framings in image space: z = zoom (1 = the plane exactly covers the screen),
// fx/fy = focus point in normalized image coords, r = roll in degrees.
// Timeline, in screen heights: T transit in, S settle, H hold (overlay), P push.
// ---------------------------------------------------------------------------
const W = 16, H = 9;
const shot = (z = 1, fx = 0.5, fy = 0.5, r = 0) => ({ z, fx, fy, r });
const SCENES = [
  { id: "hero", video: "hero", pos: [0, 0, 0], rot: [0, 0, 0], belt: false,
    T: 0, S: 0, H: 0.7, P: 0.9,
    a: shot(1), b: shot(1), b2: shot(1.05, 0.5, 0.47), c: shot(1.7, 0.36, 0.72, 0) },
  { id: "demo", video: "s1-shoulder", pos: [-30, -24, -16], rot: [0, 42, 0],
    T: 1.4, S: 0.5, H: 1.0, P: 0.7, rollIn: 0,
    a: shot(1), b: shot(2.5, 0.705, 0.41), b2: shot(2.6, 0.705, 0.41), c: shot(2.3, 0.54, 0.74, -6) },
  { id: "duel", video: "s2-topdown", pos: [-8, -56, -34], rot: [-90, 24, 0],
    T: 1.5, S: 0.5, H: 1.0, P: 0.8, rollIn: 1,
    a: shot(1.05), b: shot(1.08, 0.5, 0.5, -5), b2: shot(1.12, 0.5, 0.5, 5), c: shot(2.4, 0.5, 0.5, 90) },
  { id: "compare", video: "s3-tuna", videoB: "s3b-knife", pos: [26, -70, -10], rot: [0, -38, 0],
    T: 1.5, S: 0.5, H: 1.0, P: 0.9, rollIn: 0, dip: true,
    a: shot(1), b: shot(1.02, 0.5, 0.5), b2: shot(1.1, 0.46, 0.42), c: shot(3.4, 0.47, 0.3, 0), mixB: [0.55, 1] },
  { id: "faq", video: "s4-teaching", pos: [6, -98, 16], rot: [0, 12, 0],
    T: 1.5, S: 0.5, H: 1.2, P: 0.7, rollIn: -1,
    a: shot(1), b: shot(1.06, 0.46, 0.5), b2: shot(1.06, 0.54, 0.5), c: shot(2.8, 0.47, 0.62, 3) },
  { id: "pricing", video: "s5-menuboard", pos: [-26, -118, -6], rot: [0, 52, 0],
    T: 1.5, S: 0.6, H: 1.0, P: 0.7, rollIn: 0,
    a: shot(1), b: shot(1.62, 0.315, 0.45), b2: shot(1.68, 0.315, 0.45), c: shot(2.6, 0.79, 0.33, -4) },
  { id: "footer", video: "s6-tea", videoB: "s6b-bento", pos: [4, -146, -22], rot: [0, -12, 0],
    T: 1.6, S: 0.4, H: 1.0, P: 0, rollIn: 0,
    a: shot(2.1, 0.53, 0.56), b: shot(1.7, 0.53, 0.56), b2: shot(1, 0.5, 0.5), c: shot(1) },
];

// ---------------------------------------------------------------------------
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0806);
scene.fog = new THREE.Fog(0x0b0806, 26, 78);
const FOV = 50;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 400);
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

// Scene planes -------------------------------------------------------------
const videos = {};
function makeVideo(name) {
  if (videos[name]) return videos[name];
  const v = document.createElement("video");
  Object.assign(v, { src: `media/${name}.mp4`, muted: true, loop: true, playsInline: true, preload: "auto", crossOrigin: "anonymous" });
  v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
  const tex = new THREE.VideoTexture(v);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  const poster = new THREE.TextureLoader().load(`media/${name}.jpg`);
  poster.colorSpace = THREE.SRGBColorSpace;
  videos[name] = { el: v, tex, poster, ready: false };
  v.addEventListener("playing", () => (videos[name].ready = true), { once: true });
  return videos[name];
}

const frameMat = new THREE.MeshBasicMaterial({ color: 0x1c120b });
const trimMat = new THREE.MeshBasicMaterial({ color: 0x6b3b1c });
for (const s of SCENES) {
  const g = new THREE.Group();
  g.position.set(...s.pos);
  g.rotation.set(...s.rot.map(THREE.MathUtils.degToRad), "YXZ");
  scene.add(g); g.updateMatrixWorld();
  s.group = g;
  s.ux = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
  s.uy = new THREE.Vector3(0, 1, 0).applyQuaternion(g.quaternion);
  s.n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
  s.center = g.position.clone();
  const vid = makeVideo(s.video);
  s.mat = new THREE.MeshBasicMaterial({ map: vid.poster, fog: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), s.mat);
  g.add(plane);
  if (s.videoB) {
    const vb = makeVideo(s.videoB);
    s.matB = new THREE.MeshBasicMaterial({ map: vb.poster, transparent: true, opacity: 0, fog: false, depthWrite: false });
    const pb = new THREE.Mesh(new THREE.PlaneGeometry(W, H), s.matB);
    pb.position.z = 0.01; g.add(pb);
  }
  // a chunky diorama frame so the tiles read as objects during flights
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, H + 0.8, 1.2), frameMat);
  back.position.z = -0.62; g.add(back);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(W + 1.0, H + 1.0, 0.2), trimMat);
  trim.position.z = -1.3; g.add(trim);
}
const byId = Object.fromEntries(SCENES.map((s) => [s.id, s]));

// Timeline -------------------------------------------------------------------
let TOTAL = 0;
for (const s of SCENES) {
  s.t0 = TOTAL; s.tS = s.t0 + s.T; s.tH = s.tS + s.S; s.tP = s.tH + s.H; s.tE = s.tP + s.P;
  TOTAL = s.tE;
  s.snap = s.id === "hero" ? 0 : s.id === "footer" ? s.tE : (s.tH + s.tP) / 2;
}
const spacer = document.getElementById("spacer");
function layout() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  spacer.style.height = `${(TOTAL + 1) * innerHeight}px`;
}
layout();
addEventListener("resize", layout);

// Camera framing --------------------------------------------------------------
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function mixShot(p, q, t) { return { z: lerp(p.z, q.z, t), fx: lerp(p.fx, q.fx, t), fy: lerp(p.fy, q.fy, t), r: lerp(p.r, q.r, t) }; }

function pose(s, sh) {
  const A = camera.aspect, r = THREE.MathUtils.degToRad(sh.r);
  const c = Math.abs(Math.cos(r)), sn = Math.abs(Math.sin(r));
  // largest distance at which the rolled view rectangle still fits inside the plane
  const d1 = W / (2 * TAN * (A * c + sn)), d2 = H / (2 * TAN * (A * sn + c));
  const d = (Math.min(d1, d2) * 0.992) / sh.z;
  const vh = 2 * d * TAN, vw = vh * A;
  const hbw = (vw * c + vh * sn) / 2, hbh = (vw * sn + vh * c) / 2;
  const px = clamp((sh.fx - 0.5) * W, -W / 2 + hbw, W / 2 - hbw);
  const py = clamp((0.5 - sh.fy) * H, -H / 2 + hbh, H / 2 - hbh);
  const focus = s.center.clone().addScaledVector(s.ux, px).addScaledVector(s.uy, py);
  const pos = focus.clone().addScaledVector(s.n, d);
  const up = s.uy.clone().multiplyScalar(Math.cos(r)).addScaledVector(s.ux, -Math.sin(r));
  const q = quatLook(pos, focus, up);
  return { pos, focus, up, q, d };
}
const _m = new THREE.Matrix4();
function quatLook(pos, target, up) {
  _m.lookAt(pos, target, up);
  return new THREE.Quaternion().setFromRotationMatrix(_m);
}

// Belt ------------------------------------------------------------------------
// One continuous belt from the hero video's bottom-left exit to past the footer.
// Plates travel toward the hero (decreasing s) and vanish into its belt.
const BELT_W = 1.05;
const ctrl = []; // {p: Vector3, n: Vector3}
const localN = new THREE.Vector3(0, 0.55, 0.83).normalize();
function addLocal(s, x, y, z) {
  const p = new THREE.Vector3(x, y, z).applyMatrix4(s.group.matrixWorld);
  const n = localN.clone().applyQuaternion(s.group.quaternion);
  ctrl.push({ p, n, scene: s.id });
}
{
  const hero = SCENES[0];
  const dir = new THREE.Vector2(-0.84, -0.54);
  addLocal(hero, -2.3, -4.5, 0.02);
  addLocal(hero, -2.3 + dir.x * 2.2, -4.5 + dir.y * 2.2, 0.6);
  addLocal(hero, -2.3 + dir.x * 5.5, -4.5 + dir.y * 5.5, 1.6);
  let prev = ctrl[ctrl.length - 1].p;
  for (let i = 1; i < SCENES.length; i++) {
    const s = SCENES[i];
    const side = Math.sign(prev.clone().sub(s.center).dot(s.ux)) || 1;
    // swoop: a control point between the tiles, pushed out in front of both
    const entry = new THREE.Vector3(side * 9.8, -3.3, 1.0).applyMatrix4(s.group.matrixWorld);
    const mid = prev.clone().lerp(entry, 0.5).addScaledVector(SCENES[i - 1].n.clone().add(s.n).normalize(), 5);
    ctrl.push({ p: mid, n: ctrl[ctrl.length - 1].n.clone().lerp(localN.clone().applyQuaternion(s.group.quaternion), 0.5).normalize() });
    addLocal(s, side * 9.8, -3.3, 1.0);
    addLocal(s, 0, -3.3, 1.0);
    addLocal(s, -side * 9.8, -3.3, 1.0);
    s.beltSide = side;
    prev = ctrl[ctrl.length - 1].p;
    if (i === SCENES.length - 1) addLocal(s, -side * 16, -3.0, 2.5);
  }
}
const curve = new THREE.CatmullRomCurve3(ctrl.map((c) => c.p), false, "centripetal");
const BELT_LEN = curve.getLength();
const SAMPLES = Math.ceil(BELT_LEN * 6);
const bs = { p: [], t: [], n: [], b: [] };
for (let i = 0; i <= SAMPLES; i++) {
  const u = i / SAMPLES;
  const p = curve.getPointAt(u), t = curve.getTangentAt(u);
  const tk = curve.getUtoTmapping(u) * (ctrl.length - 1);
  const k = Math.min(Math.floor(tk), ctrl.length - 2);
  let n = ctrl[k].n.clone().lerp(ctrl[k + 1].n, tk - k).normalize();
  const b = new THREE.Vector3().crossVectors(t, n).normalize();
  n = new THREE.Vector3().crossVectors(b, t).normalize();
  bs.p.push(p); bs.t.push(t); bs.n.push(n); bs.b.push(b);
}
function beltAt(s) { // s in world units along the belt
  const f = clamp(s / BELT_LEN, 0, 1) * SAMPLES, i = Math.min(Math.floor(f), SAMPLES - 1), k = f - i;
  return {
    p: bs.p[i].clone().lerp(bs.p[i + 1], k),
    n: bs.n[i].clone().lerp(bs.n[i + 1], k).normalize(),
    t: bs.t[i].clone().lerp(bs.t[i + 1], k).normalize(),
    b: bs.b[i],
  };
}
// arc-length position of each scene's belt center, used for the chase cam
for (const s of SCENES) {
  let best = 0, bd = Infinity;
  const target = s.id === "hero" ? ctrl[0].p : new THREE.Vector3(0, -3.3, 1).applyMatrix4(s.group.matrixWorld);
  for (let i = 0; i <= SAMPLES; i += 2) { const d = bs.p[i].distanceToSquared(target); if (d < bd) { bd = d; best = i; } }
  s.beltS = (best / SAMPLES) * BELT_LEN;
}

// belt mesh: slatted strip + copper rails, pixel textures
function pixelTexture(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter;
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const beltTex = pixelTexture(16, 16, (g) => {
  g.fillStyle = "#3a3f44"; g.fillRect(0, 0, 16, 16);
  g.fillStyle = "#4d545b"; g.fillRect(0, 1, 16, 6);
  g.fillStyle = "#5e666e"; g.fillRect(0, 1, 16, 1);
  g.fillStyle = "#2a2e32"; g.fillRect(0, 7, 16, 1);
  g.fillStyle = "#4d545b"; g.fillRect(0, 9, 16, 6);
  g.fillStyle = "#5e666e"; g.fillRect(0, 9, 16, 1);
  g.fillStyle = "#2a2e32"; g.fillRect(0, 15, 16, 1);
  g.fillStyle = "#23272a"; g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
});
{
  const pos = [], uv = [], idx = [], rpos = [], ridx = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const p = bs.p[i], b = bs.b[i], n = bs.n[i];
    const L = p.clone().addScaledVector(b, -BELT_W / 2), R = p.clone().addScaledVector(b, BELT_W / 2);
    pos.push(L.x, L.y, L.z, R.x, R.y, R.z);
    const v = (i / SAMPLES) * BELT_LEN * 1.4;
    uv.push(0, v, 1, v);
    if (i < SAMPLES) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    for (const side of [-1, 1]) {
      const e = p.clone().addScaledVector(b, (side * (BELT_W + 0.14)) / 2);
      const lo = e.clone().addScaledVector(n, -0.08), hi = e.clone().addScaledVector(n, 0.2);
      rpos.push(lo.x, lo.y, lo.z, hi.x, hi.y, hi.z);
    }
    if (i < SAMPLES) for (const o of [0, 2]) { const a = i * 4 + o; ridx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: beltTex, side: THREE.DoubleSide })));
  const rg = new THREE.BufferGeometry();
  rg.setAttribute("position", new THREE.Float32BufferAttribute(rpos, 3));
  rg.setIndex(ridx);
  scene.add(new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xb8703c, side: THREE.DoubleSide })));
}

// floating lantern motes for depth during flights
{
  const n = 900, p = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    p[i * 3] = (Math.random() - 0.5) * 140; p[i * 3 + 1] = 20 - Math.random() * 200; p[i * 3 + 2] = (Math.random() - 0.5) * 120 - 10;
    const w = Math.random(); col.set([1, 0.55 + w * 0.3, 0.25 + w * 0.2], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.55 })));
}

// Plates ------------------------------------------------------------------------
const SPACING = 2.3;
const plates = [];
const texCache = {};
function texFor(kind) {
  if (!texCache[kind]) {
    const t = new THREE.CanvasTexture(SPRITES[kind]());
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    texCache[kind] = t;
  }
  return texCache[kind];
}
const plateCount = Math.floor(BELT_LEN / SPACING);
for (let i = 0; i < plateCount; i++) {
  const kind = pickKind(i);
  const mat = new THREE.SpriteMaterial({ map: texFor(kind), transparent: true, alphaTest: 0.1 });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(1.05, 1.05, 1);
  sp.userData.plate = i;
  scene.add(sp);
  plates.push({ i, kind, sp, mat, base: i * SPACING, state: "belt", hidden: 0, fly: null, scale: 1, pop: 0 });
}

// Particles -------------------------------------------------------------------
const PMAX = 5000;
const pp = new Float32Array(PMAX * 3).fill(-9999), pc = new Float32Array(PMAX * 3), pv = new Float32Array(PMAX * 3), pl = new Float32Array(PMAX);
let pHead = 0;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
pGeo.setAttribute("color", new THREE.BufferAttribute(pc, 3));
const pMat = new THREE.PointsMaterial({ size: 0.14, vertexColors: true, fog: false });
const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; scene.add(pts);
const _c = new THREE.Color();
function burst(at, colors, n = 80, power = 5) {
  for (let k = 0; k < n; k++) {
    const i = pHead; pHead = (pHead + 1) % PMAX;
    pp.set([at.x, at.y, at.z], i * 3);
    const v = new THREE.Vector3().randomDirection().multiplyScalar(power * (0.35 + Math.random()));
    pv.set([v.x, v.y, v.z], i * 3);
    _c.set(colors[k % colors.length]); pc.set([_c.r, _c.g, _c.b], i * 3);
    pl[i] = 0.9 + Math.random() * 0.8;
  }
}
function stepParticles(dt, down) {
  for (let i = 0; i < PMAX; i++) {
    if (pl[i] <= 0) continue;
    pl[i] -= dt;
    if (pl[i] <= 0) { pp[i * 3 + 1] = -9999; continue; }
    pv[i * 3] += down.x * 9 * dt; pv[i * 3 + 1] += down.y * 9 * dt; pv[i * 3 + 2] += down.z * 9 * dt;
    pp[i * 3] += pv[i * 3] * dt; pp[i * 3 + 1] += pv[i * 3 + 1] * dt; pp[i * 3 + 2] += pv[i * 3 + 2] * dt;
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}

// Scroll state --------------------------------------------------------------------
let gTarget = 0, g = 0;
function readScroll() { gTarget = clamp(scrollY / innerHeight, 0, TOTAL); }
addEventListener("scroll", () => { readScroll(); scheduleSnap(); }, { passive: true });
readScroll(); g = gTarget;

let snapTimer = 0, snapping = false, lastDir = 1, lastG = gTarget;
const NOSNAP = new URLSearchParams(location.search).has("nosnap");
function scheduleSnap() {
  if (gTarget !== lastG) { lastDir = Math.sign(gTarget - lastG); lastG = gTarget; }
  clearTimeout(snapTimer);
  if (snapping || NOSNAP) return;
  snapTimer = setTimeout(() => {
    // settle on a scene, favouring the direction the reader was heading
    const snaps = SCENES.map((s) => s.snap);
    let best = snaps[0];
    const k = snaps.findIndex((v) => v > gTarget);
    if (k <= 0) best = k === 0 ? snaps[0] : snaps[snaps.length - 1];
    else {
      const a = snaps[k - 1], b = snaps[k], f = (gTarget - a) / (b - a);
      best = lastDir > 0 ? (f > 0.12 ? b : a) : (f < 0.88 ? a : b);
    }
    if (Math.abs(best - gTarget) > 0.02) {
      snapping = true;
      scrollTo({ top: best * innerHeight, behavior: "smooth" });
      setTimeout(() => (snapping = false), 1100);
    }
  }, 280);
}

// camera path for a transit between scene a (end shot c) and scene b (arrival a)
function transitPose(A, B, t, sa, sb) {
  const pa = pose(A, A.c), pb = pose(B, B.a);
  const s0 = A.beltS, s1 = B.beltS;
  const chase = (f) => {
    const s = lerp(s0, s1, f), fr = beltAt(s), ahead = beltAt(lerp(s0, s1, Math.min(1, f + 0.06)));
    return { pos: fr.p.clone().addScaledVector(fr.n, B.dip && f > 0.4 && f < 0.7 ? 1.2 : 2.6), look: ahead.p.clone().addScaledVector(ahead.n, 0.3), up: fr.n };
  };
  const m1 = chase(0.3), m2 = chase(0.7);
  const aBack = pa.focus.clone().addScaledVector(A.n, pa.d * 1.9 + 4);
  const bBack = pb.focus.clone().addScaledVector(B.n, pb.d * 1.9 + 4);
  const posC = new THREE.CatmullRomCurve3([pa.pos, aBack, m1.pos, m2.pos, bBack, pb.pos], false, "centripetal");
  const lookC = new THREE.CatmullRomCurve3([pa.focus, pa.focus.clone().lerp(m1.look, 0.5), m1.look, m2.look, pb.focus.clone().lerp(m2.look, 0.5), pb.focus], false, "centripetal");
  const e = ease(t);
  const pos = posC.getPoint(e), look = lookC.getPoint(e);
  // up: scene A -> belt normal -> scene B
  const up = e < 0.5 ? pa.up.clone().lerp(m1.up, smooth(0, 0.3, e)) : m2.up.clone().lerp(pb.up, smooth(0.7, 1, e));
  up.normalize();
  const q = quatLook(pos, look, up);
  const roll = (B.rollIn || 0) * Math.PI * 2 * smooth(0.3, 0.8, e);
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  return { pos, q };
}

function cameraAt(gv) {
  let i = SCENES.findIndex((s) => gv < s.tE);
  if (i < 0) i = SCENES.length - 1;
  const s = SCENES[i];
  if (gv < s.tS && i > 0) return transitPose(SCENES[i - 1], s, (gv - s.t0) / s.T);
  let sh;
  if (gv < s.tH) sh = mixShot(s.a, s.b, ease(clamp((gv - s.tS) / (s.S || 1), 0, 1)));
  else if (gv < s.tP) sh = mixShot(s.b, s.b2, clamp((gv - s.tH) / s.H, 0, 1));
  else sh = mixShot(s.b2, s.c, ease(clamp((gv - s.tP) / (s.P || 1), 0, 1)));
  const p = pose(s, sh);
  return { pos: p.pos, q: p.q };
}
function sceneIndexAt(gv) {
  let i = SCENES.findIndex((s) => gv < s.tE);
  return i < 0 ? SCENES.length - 1 : i;
}

// Overlays ------------------------------------------------------------------------------
const overlays = [...document.querySelectorAll(".ov")].map((el) => ({ el, s: byId[el.dataset.scene] }));
function overlayVis(s, gv) {
  if (s.id === "hero") return 1 - smooth(s.tP, s.tP + 0.35 * s.P, gv);
  const fin = smooth(s.tS + 0.5 * s.S, s.tH, gv);
  if (s.id === "footer") return smooth(s.tH + 0.25 * s.H, s.tH + 0.7 * s.H, gv);
  return fin * (1 - smooth(s.tP, s.tP + 0.35 * s.P, gv));
}

// project plane-local image coords (u,v in 0..1) to screen px
const _v = new THREE.Vector3();
function project(s, u, v) {
  _v.set((u - 0.5) * W, (0.5 - v) * H, 0).applyMatrix4(s.group.matrixWorld).project(camera);
  return { x: (_v.x * 0.5 + 0.5) * innerWidth, y: (-_v.y * 0.5 + 0.5) * innerHeight, behind: _v.z > 1 };
}

// FAQ bubbles
const FAQ = [
  { u: 0.53, v: 0.39, q: "Which coding agents can I run?", a: "Claude Code, Codex, and Cursor. Any agent that speaks the Agent Client Protocol can be registered alongside them, and you can mix agents across tasks." },
  { u: 0.49, v: 0.6, q: "Does it work with non-engineering tools?", a: "Yes. Salesforce, HubSpot, Google Sheets, Drive, Notion, Linear, Jira, Stripe, Gmail and hundreds more. Ops, finance and data teams ask in Slack or Teams, the way they'd ask a teammate." },
  { u: 0.415, v: 0.7, q: "What does Jiro's kitchen look like?", a: "Each agent works in an isolated cloud environment with your repository, tools, dependencies and services ready to use." },
  { u: 0.63, v: 0.69, q: "Is the output always a PR?", a: "No. A pull request, commit, comment or completed task, or a file when that's what the work produces: a doc, a spreadsheet, a deck." },
  { u: 0.795, v: 0.62, q: "How does billing work?", a: "Plans are sized by runtimes. Trial: five for 30 days. Developer: one user, three persistent runtimes. Team: five shared. Runtimes sleep when idle and wake on demand." },
];
const bubbleBox = document.getElementById("bubbles");
const answer = document.getElementById("faq-answer");
FAQ.forEach((f, k) => {
  const b = document.createElement("button");
  b.className = "bubble"; b.textContent = f.q; b.style.animationDelay = `${-k * 0.7}s`;
  b.onclick = () => {
    bubbleBox.querySelectorAll(".bubble").forEach((x) => x.classList.toggle("active", x === b));
    answer.hidden = false; answer.querySelector("h3").textContent = f.q; answer.querySelector("p").textContent = f.a;
  };
  f.el = b; bubbleBox.appendChild(b);
});
answer.querySelector(".x").onclick = () => { answer.hidden = true; bubbleBox.querySelectorAll(".bubble").forEach((x) => x.classList.remove("active")); };

// pricing panels in image coords of the menu board
const PANELS = [
  { u0: 0.077, u1: 0.228, v0: 0.235, v1: 0.68 },
  { u0: 0.247, u1: 0.395, v0: 0.235, v1: 0.68 },
  { u0: 0.413, u1: 0.563, v0: 0.235, v1: 0.68 },
];
const planEls = [...document.querySelectorAll("#board .plan")];

function placeAnchored(gv) {
  const portrait = innerWidth / innerHeight < 0.9;
  document.body.classList.toggle("portrait", portrait);
  if (portrait) { for (const f of FAQ) f.el.removeAttribute("style"); planEls.forEach((el) => el.removeAttribute("style")); return; }
  const faq = byId.faq, pr = byId.pricing;
  if (overlays.find((o) => o.s === faq).el.classList.contains("on")) {
    for (const f of FAQ) { const p = project(faq, f.u, f.v); f.el.style.left = `${p.x}px`; f.el.style.top = `${p.y - 36}px`; }
  }
  if (overlays.find((o) => o.s === pr).el.classList.contains("on")) {
    PANELS.forEach((P, k) => {
      const a = project(pr, P.u0, P.v0), b = project(pr, P.u1, P.v1);
      const w = b.x - a.x, h = b.y - a.y;
      Object.assign(planEls[k].style, { left: `${a.x}px`, top: `${a.y}px`, width: `${w}px`, height: `${h}px`, fontSize: `${Math.min(w / 15, h / 24).toFixed(1)}px` });
    });
  }
}

// Interaction: drag, throw, poke --------------------------------------------------------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let drag = null;
function pickPlate(e) {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(plates.filter((p) => p.sp.visible && p.state !== "gone").map((p) => p.sp));
  return hits.length ? plates[hits[0].object.userData.plate] : null;
}
const camDir = new THREE.Vector3(), camUp = new THREE.Vector3(), camRight = new THREE.Vector3();
canvas.addEventListener("pointerdown", (e) => {
  const p = pickPlate(e);
  if (!p) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  const depth = p.sp.position.clone().sub(camera.position).dot(camDir);
  drag = { p, depth, x0: e.clientX, y0: e.clientY, t0: performance.now(), hist: [], moved: false };
  p.state = "drag";
  document.body.classList.add("grab");
});
function screenToWorld(x, y, depth) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const k = depth / ray.ray.direction.dot(camDir);
  return ray.ray.origin.clone().addScaledVector(ray.ray.direction, k);
}
canvas.addEventListener("pointermove", (e) => {
  if (!drag) {
    document.body.classList.toggle("hover-plate", !!pickPlate(e));
    return;
  }
  if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
  const w = screenToWorld(e.clientX, e.clientY, drag.depth);
  drag.p.sp.position.copy(w);
  drag.hist.push({ w, t: performance.now() }); if (drag.hist.length > 6) drag.hist.shift();
});
function endDrag(e) {
  if (!drag) return;
  const { p, moved, hist } = drag;
  document.body.classList.remove("grab");
  drag = null;
  if (!moved) { p.state = "belt"; poke(p); return; }
  const a = hist[0], b = hist[hist.length - 1];
  const dt = Math.max(0.016, (b.t - a.t) / 1000);
  const vel = b.w.clone().sub(a.w).divideScalar(dt).clampLength(0, 40);
  p.state = "fly"; p.fly = { vel, t: 0, spin: (Math.random() - 0.5) * 12 };
  if (vel.length() > 6) egg("throw", "Yeet! Plates always find their way back to the belt.");
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

// HUD
const eggsFound = new Set();
const eggEl = document.getElementById("eggs");
const toasts = document.getElementById("toasts");
const flashEl = document.getElementById("flash");
function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; toasts.appendChild(t);
  setTimeout(() => t.remove(), 2900);
}
function egg(id, msg) {
  if (msg) toast(msg);
  if (eggsFound.has(id)) return;
  eggsFound.add(id);
  eggEl.querySelector("b").textContent = eggsFound.size;
  eggEl.classList.add("bump"); setTimeout(() => eggEl.classList.remove("bump"), 250);
  if (eggsFound.size === 15) setTimeout(() => toast("All 15 found. Jiro bows deeply. 🙇"), 1200);
}
function flash(white) {
  flashEl.classList.toggle("white", !!white);
  flashEl.classList.remove("go"); void flashEl.offsetWidth; flashEl.classList.add("go");
}
let shake = 0;
function speech(p, text) {
  const s = p.sp.position.clone().project(camera);
  const d = document.createElement("div"); d.className = "speech"; d.textContent = text;
  d.style.left = `${(s.x * 0.5 + 0.5) * innerWidth}px`; d.style.top = `${(-s.y * 0.5 + 0.5) * innerHeight - 30}px`;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
}
const JOKES = [
  "Why did the onigiri fail code review? Too many side dishes.",
  "I told Jiro a rice pun. He said it was a bit grainy.",
  "My favourite design pattern? The rice factory.",
  "Tabs or spaces? Nori.",
  "I'm not lazy, I'm in idle mode. Like a runtime.",
];
let jokeI = 0, bugs = 0, turboUntil = 0, rainbowUntil = 0;
function hidePlate(p, secs = 4) { p.state = "gone"; p.sp.visible = false; p.hidden = secs; }
function poke(p) {
  const at = p.sp.position.clone();
  const K = KINDS[p.kind];
  switch (K.type) {
    case "sushi": burst(at, K.colors, 90, 5); hidePlate(p); egg("sushi", null); break;
    case "bomb":
      burst(at, ["#ffb347", "#ff5e3a", "#2b2b2b", "#fff1a8"], 260, 9); flash(true); shake = 1;
      for (const o of plates) if (o !== p && o.state === "belt" && o.sp.position.distanceTo(at) < 5) { burst(o.sp.position, KINDS[o.kind].colors, 50, 6); hidePlate(o, 5); }
      hidePlate(p, 6); egg("bomb", "BOOM. Nearby plates are now tartare."); break;
    case "wasabi": flash(false); shake = 0.7; burst(at, ["#7fbf3f", "#b6e36a"], 60, 3); egg("wasabi", "辛い! Way too much wasabi."); break;
    case "puffer": p.pop = 0.001; egg("puffer", null); break;
    case "bug": bugs++; p.squash = 1; burst(at, ["#3d6b2d", "#a3d15a"], 30, 2); setTimeout(() => hidePlate(p, 5), 500); egg("bug", `Bug squashed. PR opened. (${bugs} fixed)`); break;
    case "duck": speech(p, "Quack. Explain your code to me, line by line."); egg("duck", null); p.hop = 1; break;
    case "cat": burst(at, ["#ff6f91", "#ffc2d1"], 24, 1.6); speech(p, "purrrr… 🐾"); egg("cat", null); p.hop = 1; break;
    case "apprentice": speech(p, "Hai, chef!"); p.hop = 1; egg("apprentice", null); break;
    case "onigiri": speech(p, JOKES[jokeI++ % JOKES.length]); p.hop = 1; egg("onigiri", null); break;
    case "gold": burst(at, ["#ffd34d", "#fff3b0", "#e0a526"], 160, 6); turboUntil = performance.now() + 8000; egg("gold", "Omakase unlocked. Turbo belt!"); break;
  }
}

// Konami code -> rainbow turbo belt
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let kIdx = 0;
addEventListener("keydown", (e) => {
  kIdx = e.key === KONAMI[kIdx] ? kIdx + 1 : e.key === KONAMI[0] ? 1 : 0;
  if (kIdx === KONAMI.length) { kIdx = 0; rainbowUntil = turboUntil = performance.now() + 10000; egg("konami", "↑↑↓↓←→←→BA: rainbow turbo belt!"); }
});
// typing "omakase" anywhere rains sushi over the current scene
let typed = "";
addEventListener("keydown", (e) => {
  if (e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-7);
  if (typed === "omakase") {
    for (let k = 0; k < 14; k++) setTimeout(() => {
      const at = camera.position.clone().addScaledVector(camDir, 8).addScaledVector(camRight, (Math.random() - 0.5) * 10).addScaledVector(camUp, 4);
      burst(at, ["#e0485a", "#f08a4b", "#f4f1e8", "#f5c542"], 40, 2.5);
    }, k * 90);
    egg("rain", "It's raining omakase.");
  }
});

// Demo ---------------------------------------------------------------------------------
const demoLog = document.getElementById("demo-log");
const demoInitial = demoLog.innerHTML;
function demoWire() {
  const go = document.getElementById("demo-go");
  if (!go) return;
  go.onclick = async () => {
    document.getElementById("demo-start").remove();
    const add = (html, cls = "") => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; demoLog.appendChild(d); demoLog.scrollTop = demoLog.scrollHeight; return d; };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    add(`<em class="av av-j">J</em><div><b>Jiro</b> <small>9:41</small><p>Hai. On it. 🍣</p></div>`, "msg");
    const steps = [
      "Claimed a warm runtime (1.2s)",
      "Cloned tilework/checkout, installed deps",
      "Reproduced: 3 of 20 runs fail. Race in cart total",
      "Fix: await price recalculation before asserting",
      "Ran checkout suite 50×: all green",
    ];
    for (const s of steps) { const el = add(s, "step"); await wait(650); el.classList.add("done"); }
    const pr = add(`<h5>#482 fix(checkout): await cart recalculation</h5><div class="meta">+12 −3 · 2 files · tests ✓ · reviewer: you</div>
      <div class="row"><button class="px-btn" data-a="diff">View diff</button><button class="px-btn" data-a="merge">Merge</button></div>`, "pr");
    pr.querySelector('[data-a="diff"]').onclick = (e) => {
      e.target.remove();
      pr.insertAdjacentHTML("beforeend", `<div class="diff"><span class="d">-  cart.addItem(sku)\n-  expect(total()).toBe(42)</span>\n<span class="a">+  await cart.addItem(sku)\n+  await cart.recalculated()\n+  expect(total()).toBe(42)</span></div>`);
      demoLog.scrollTop = demoLog.scrollHeight;
    };
    pr.querySelector('[data-a="merge"]').onclick = (e) => {
      e.target.closest(".row").remove();
      add(`<em class="av av-j">J</em><div><b>Jiro</b> <small>9:44</small><p>Merged. The flaky test is retired. 🙇</p></div>`, "msg");
      for (const p of plates) if (p.state === "belt") p.hop = Math.random();
      turboUntil = performance.now() + 3000;
      egg("merge", "Merged! The belt does a little victory lap.");
    };
  };
}
demoWire();
document.getElementById("demo-reset").onclick = () => { demoLog.innerHTML = demoInitial; demoWire(); };

// Loop ------------------------------------------------------------------------------------
let beltPos = 0, last = performance.now(), footerSince = 0, bentoOn = false;
const duelVids = [...document.querySelectorAll("#ov-duel video")];
const baseQ = new THREE.Quaternion();
function frame(now) {
  const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt); last = now;
  g += (gTarget - g) * (1 - Math.exp(-dt * 7));
  if (Math.abs(gTarget - g) < 1e-4) g = gTarget;

  const cam = cameraAt(g);
  camera.position.copy(cam.pos); camera.quaternion.copy(cam.q);
  if (shake > 0) {
    camera.position.add(new THREE.Vector3((Math.random() - 0.5) * shake * 0.3, (Math.random() - 0.5) * shake * 0.3, 0).applyQuaternion(cam.q));
    shake = Math.max(0, shake - dt * 1.6);
  }
  camera.updateMatrixWorld();
  camera.getWorldDirection(camDir);
  camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
  camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);

  // videos: play the current scene and its neighbours, pause the rest
  const si = sceneIndexAt(g);
  SCENES.forEach((s, k) => {
    const near = Math.abs(k - si) <= 1;
    for (const name of [s.video, s.videoB].filter(Boolean)) {
      const v = videos[name];
      if (near && v.el.paused) v.el.play().catch(() => {});
      if (!near && !v.el.paused) v.el.pause();
    }
    const vA = videos[s.video];
    if (vA.ready && s.mat.map !== vA.tex) { s.mat.map = vA.tex; s.mat.needsUpdate = true; }
    if (s.videoB) {
      const vB = videos[s.videoB];
      if (vB.ready && s.matB.map !== vB.tex) { s.matB.map = vB.tex; s.matB.needsUpdate = true; }
    }
  });
  // knife close-up crossfade in the comparison scene
  const cmp = byId.compare;
  cmp.matB.opacity = smooth(cmp.tP + cmp.mixB[0] * cmp.P, cmp.tP + cmp.mixB[1] * cmp.P, g) * (g < cmp.tE + 0.5 * byId.faq.T ? 1 : 0);
  // footer easter egg: sit still for 7s and Jiro goes on a bento run
  const ft = byId.footer;
  if (g > ft.tH + 0.5 * ft.H) {
    footerSince += rawDt;
    if (footerSince > 7 && !bentoOn) { bentoOn = true; egg("bento", "Jiro's out on a bento run. 🚲"); }
  } else { footerSince = 0; bentoOn = false; }
  ft.matB.opacity += ((bentoOn ? 1 : 0) - ft.matB.opacity) * (1 - Math.exp(-dt * 2.5));
  document.getElementById("wait-hint").style.opacity = bentoOn ? 0 : 0.7;

  // belt + plates
  const speed = now < turboUntil ? 3.2 : 0.55;
  beltPos += speed * dt;
  beltTex.offset.y = beltPos * 1.4;
  if (now < rainbowUntil) { beltTex.image && (beltMatHue = (beltMatHue + dt * 0.6) % 1); } else beltMatHue = -1;
  const down = camUp.clone().negate();
  for (const p of plates) {
    let s = (((p.base - beltPos) % BELT_LEN) + BELT_LEN) % BELT_LEN;
    if (p.state === "gone") { p.hidden -= dt; if (p.hidden <= 0) { p.state = "belt"; p.sp.visible = true; p.squash = 0; p.pop = 0; } continue; }
    const fr = beltAt(s);
    const home = fr.p.clone().addScaledVector(fr.n, 0.42);
    if (p.state === "belt") {
      let lift = 0;
      if (p.hop > 0) { lift = Math.sin(p.hop * Math.PI) * 0.8; p.hop = Math.max(0, p.hop - dt * 2); }
      p.sp.position.copy(home).addScaledVector(fr.n, lift);
    } else if (p.state === "fly") {
      const f = p.fly; f.t += dt;
      if (f.t < 1.4) {
        f.vel.addScaledVector(down, 14 * dt);
        p.sp.position.addScaledVector(f.vel, dt);
        p.mat.rotation += f.spin * dt;
      } else {
        const k = smooth(1.4, 2.1, f.t);
        p.sp.position.lerp(home, k);
        p.mat.rotation *= 1 - k;
        if (f.t > 2.1) { p.state = "belt"; p.mat.rotation = 0; }
      }
    }
    // hero end: fade into the video belt; far end: fade in from the dark
    const fade = smooth(0.2, 1.6, s) * (1 - smooth(BELT_LEN - 3, BELT_LEN - 0.5, s));
    p.mat.opacity = p.state === "belt" ? fade : 1;
    let sc = 1.05;
    if (p.pop > 0) {
      p.pop += dt;
      sc *= 1 + p.pop * 2.4;
      if (p.pop > 0.65) { burst(p.sp.position, ["#f5d76e", "#e8b83a", "#fff"], 120, 6); hidePlate(p, 5); flash(true); toast("Fugu popped. Good thing Jiro's licensed."); }
    }
    p.sp.scale.set(sc, p.squash ? sc * 0.25 : sc, 1);
  }
  if (beltMatHue >= 0) { beltMesh().material.color.setHSL(beltMatHue, 0.9, 0.65); } else beltMesh().material.color.set(0xffffff);
  stepParticles(dt, down);

  // overlays
  for (const o of overlays) {
    const v = overlayVis(o.s, g);
    o.el.style.opacity = v.toFixed(3);
    o.el.classList.toggle("on", v > 0.02);
  }
  const duelOn = overlays.find((o) => o.s.id === "duel").el.classList.contains("on");
  for (const v of duelVids) { if (duelOn && v.paused) v.play().catch(() => {}); if (!duelOn && !v.paused) v.pause(); }
  placeAnchored(g);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
let beltMatHue = -1;
let _beltMesh;
function beltMesh() { return (_beltMesh ||= scene.children.find((c) => c.isMesh && c.material.map === beltTex)); }
requestAnimationFrame(frame);

// debugging / screenshots: ?g=3.2 jumps to a timeline position
const qg = new URLSearchParams(location.search).get("g");
if (qg !== null) { const target = parseFloat(qg) * innerHeight; setTimeout(() => { scrollTo(0, target); readScroll(); g = gTarget; }, 50); }
window.__jiro = { SCENES, TOTAL, plates, poke, eggsFound, get footerSince() { return footerSince; }, get gT() { return gTarget; }, get g() { return g; }, camera, project };
