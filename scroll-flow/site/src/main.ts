import * as THREE from "three";
import "./style.css";
import { CARD_H, CARD_W, Card, makeCards, toWorld } from "./layout";
import { BeltPath, buildBeltMesh, Slats } from "./belt";
import { Plates, BASE_SPEED } from "./plates";
import { Particles, blip } from "./fx";
import { FAQ, initCompare, initDemo, initFaq, initPricing, initTable } from "./content";
import { buildDoors, animateDoors } from "./doors";
import { Koi } from "./ending";
import { buildParallax } from "./parallax";

// ------------------------------------------------------------------ renderer
const canvas = document.getElementById("gl") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
{ // for the preview diagnostics beacon (index.html)
  const gl = renderer.getContext(); const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  (canvas as any).__ctx = gl;
  (window as any).__jiroGL = { renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE) };
}
const scene = new THREE.Scene();
const BG = new THREE.Color("#0c0806");
scene.background = BG;
scene.fog = new THREE.FogExp2(BG, 0.022);
const FOV = 38;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.05, 400);
const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

// ------------------------------------------------------------------ cards (looping video planes)
const cards = makeCards();
interface CardView { card: Card; video: HTMLVideoElement; mat: THREE.MeshBasicMaterial; mesh: THREE.Mesh;
  close?: { video: HTMLVideoElement; mat: THREE.MeshBasicMaterial; mesh: THREE.Mesh; focus: THREE.Vector3; dir: THREE.Vector3; quat: THREE.Quaternion } }

function makeVideo(src: string, eager = false) {
  const v = document.createElement("video");
  // only the hero loads up front; the rest load as the camera approaches (see ensureLoaded)
  v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = "anonymous";
  v.preload = eager ? "auto" : "none"; v.dataset.src = src; if (eager) v.src = src;
  v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
  const tex = new THREE.VideoTexture(v);
  tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  // poster (first frame of the loop) until the video has data, so a card is never black
  const poster = new THREE.TextureLoader().load(src.replace(/^v\//, "p/").replace(/\.mp4$/, ".jpg"));
  poster.colorSpace = THREE.SRGBColorSpace;
  return { v, tex, poster };
}

const views: CardView[] = cards.map((card) => {
  const { v, tex, poster } = makeVideo(card.video, card.id === "s0-hero");
  const mat = new THREE.MeshBasicMaterial({ map: poster, fog: false, toneMapped: false });
  v.addEventListener("loadeddata", () => { mat.map = tex; mat.needsUpdate = true; }, { once: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), mat);
  mesh.quaternion.copy(card.quat); mesh.position.copy(card.center);
  scene.add(mesh);
  // dark back + pixel frame so cards read as physical panels from behind/side
  const back = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W + 0.5, CARD_H + 0.5), new THREE.MeshBasicMaterial({ color: "#1d130d", side: THREE.BackSide, fog: true }));
  back.quaternion.copy(card.quat); back.position.copy(card.center).addScaledVector(card.normal, -0.02);
  scene.add(back);
  const view: CardView = { card, video: v, mat, mesh };
  if (card.close) {
    const c = makeVideo(card.close.video);
    const cm = new THREE.MeshBasicMaterial({ map: c.poster, fog: false, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
    c.v.addEventListener("loadeddata", () => { cm.map = c.tex; cm.needsUpdate = true; }, { once: true });
    const cmesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cm);
    const yawQ = new THREE.Quaternion().setFromAxisAngle(card.up, THREE.MathUtils.degToRad(card.close.yaw));
    const quat = yawQ.clone().multiply(card.quat);
    const dir = card.normal.clone().applyQuaternion(yawQ);
    const focus = toWorld(card, card.close.focus, 0);
    cmesh.quaternion.copy(quat);
    cmesh.position.copy(focus).addScaledVector(dir, 0.9);
    cmesh.renderOrder = 5;
    scene.add(cmesh);
    view.close = { video: c.v, mat: cm, mesh: cmesh, focus, dir, quat };
  }
  return view;
});

(window as any).__jiroVideos = views.map((v) => v.video);

function ensureLoaded(v: HTMLVideoElement) {
  if (v.src) return;
  v.src = v.dataset.src!; v.preload = "auto"; v.load();
}

// ------------------------------------------------------------------ belt + plates + fx
const path = new BeltPath(cards);
// light on the belt where it comes out of the hero's kitchen window (1600x900 hero grid):
// dim (~0.25) behind the right-hand post, brightening across the opening until it clears
// the left jamb into the lit bar. Only the belt, slats and plates are shaded, never the wall.
const heroInv = cards[0].object.matrixWorld.clone().invert(), heroV = new THREE.Vector3();
function heroShade(p: THREE.Vector3) {
  heroV.copy(p).applyMatrix4(heroInv);
  if (Math.abs(heroV.z) > 1.5) return 1;
  const gx = 800 + heroV.x * 100, gy = 450 - heroV.y * 100;
  if (gy < 320 || gy > 480 || gx < 1440) return 1;
  const t = THREE.MathUtils.smoothstep(gx, 1450, 1508);  // 0 at the left jamb, 1 near/behind the right post
  return (1 - 0.8 * t) ** 2.2;                             // perceived brightness -> linear colour factor
}
const belt = buildBeltMesh(path, heroShade);
scene.add(belt.group);
const slats = new Slats(path);
slats.shade = heroShade;
scene.add(slats.mesh);
const fx = new Particles(scene);

// lanterns + drifting embers along the connector runs so transitions have depth
const lanternTex = (() => {
  const c = document.createElement("canvas"); c.width = 16; c.height = 24; const g = c.getContext("2d")!;
  g.fillStyle = "#2a1a0e"; g.fillRect(7, 0, 2, 3); g.fillRect(4, 3, 8, 2); g.fillRect(4, 19, 8, 2);
  g.fillStyle = "#ffcf7a"; g.fillRect(3, 5, 10, 14); g.fillStyle = "#fff0c2"; g.fillRect(5, 7, 5, 9);
  g.fillStyle = "#d9893f"; for (let y = 7; y < 19; y += 4) g.fillRect(3, y, 10, 1);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const glowTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,190,110,.55)"); r.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
for (let i = 0; i < cards.length - 1; i++) {
  const s0 = path.cardSpan[i][1], s1 = path.cardSpan[i + 1][0];
  for (let s = s0 + 3; s < s1 - 2; s += 5.5) {
    const f = path.frameAt(s);
    if (cards.some((c) => c.center.distanceTo(f.p) < 12)) continue;
    const side = (Math.floor(s) % 2 ? 1 : -1) * 2.2;
    const p = f.p.clone().addScaledVector(f.b, side).addScaledVector(f.u, 1.6);
    const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: lanternTex, fog: true })); l.scale.set(0.55, 0.82, 1); l.position.copy(p);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: true })); gl.scale.setScalar(3.2); gl.position.copy(p);
    scene.add(l, gl);
  }
}
const emberGeo = new THREE.BufferGeometry();
{
  const n = 900, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const f = path.frameAt(Math.random() * path.length);
    const p = f.p.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(1.5 + Math.random() * 6));
    pos.set([p.x, p.y, p.z], i * 3);
  }
  emberGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
}
const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({ color: "#ffb56b", size: 0.05, transparent: true, opacity: 0.7, fog: true }));
scene.add(embers);

// ------------------------------------------------------------------ DOM hooks for easter eggs
const bubbleLayer = document.getElementById("bubbles")!;
const bubbles: { el: HTMLElement; p: THREE.Vector3; until: number }[] = [];
const counts = new Map<string, number>();
const foundSet = new Set<string>();
const TOTAL_EGGS = 24;
document.getElementById("egg-t")!.textContent = String(TOTAL_EGGS);
let toastTimer = 0;
function toast(t: string) {
  const el = document.getElementById("toast")!; el.textContent = t; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = window.setTimeout(() => el.classList.remove("show"), 2600);
}
let shakeAmt = 0;
const hooks = {
  bubble(p: THREE.Vector3, text: string, ms = 2000, cls = "") {
    const el = document.createElement("div"); el.className = "bubble " + cls; el.textContent = text; bubbleLayer.appendChild(el);
    bubbles.push({ el, p: p.clone(), until: performance.now() + ms });
  },
  found(key: string, label: string) {
    if (foundSet.has(key)) return;
    foundSet.add(key);
    document.getElementById("eggs")!.classList.remove("hidden");
    document.getElementById("egg-n")!.textContent = String(foundSet.size);
    toast(`🥚 ${label}`);
    if (foundSet.size === TOTAL_EGGS) setTimeout(() => toast("Every egg found. Jiro bows deeply."), 2800);
  },
  shake(a: number) { shakeAmt = Math.max(shakeAmt, a); },
  flash(color: string) {
    const f = document.getElementById("flash")!; f.style.background = color; f.style.transition = "none"; f.style.opacity = "0.7";
    requestAnimationFrame(() => { f.style.transition = "opacity .6s"; f.style.opacity = "0"; });
  },
  count(key: string) { const n = counts.get(key) ?? 0; counts.set(key, n + 1); return n; },
  rainbow(on: boolean) { document.body.classList.toggle("rainbow", on); },
};
const plates = new Plates(scene, path, camera, fx, hooks);
plates.shade = heroShade;

// endings: the koi pond, then the station where the belt finally stops
const koi = new Koi(scene, cards[6], plates, fx, hooks);


// the belt comes out from behind the right-hand post of the hero's kitchen window:
// an opaque cut-out of the painted post/wall is drawn over the belt (see heroShade for
// how the belt itself dims inside the window)
{
  const img = new Image();
  img.src = "p/s0-hero.jpg";
  img.onload = () => {
    // window geometry measured on the 1600x900 hero grid; `post` = inner (left) edge of the right post
    const x0 = 1440, y0 = 320, x1 = 1600, y1 = 470, post = 1524;
    const k = img.width / 1600, W = Math.round((x1 - x0) * k), H = Math.round((y1 - y0) * k);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.drawImage(img, x0 * k, y0 * k, W, H, 0, 0, W, H);
    const id = g.getImageData(0, 0, W, H), d = id.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d[(y * W + x) * 4 + 3] = x0 + x / k >= post ? 255 : 0;
    g.putImageData(id, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const w = (x1 - x0) / 100, h = (y1 - y0) / 100;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    // lies on the card itself (so it lines up with the painting from any camera) and is drawn last, over the belt
    m.renderOrder = 8;
    const cx = ((x0 + x1) / 2 / 1600 - 0.5) * 16, cy = (0.5 - (y0 + y1) / 2 / 900) * 9;
    m.position.copy(new THREE.Vector3(cx, cy, 0.001).applyMatrix4(cards[0].object.matrixWorld));
    m.quaternion.copy(cards[0].quat);
    scene.add(m);
    heroOccluder = m;
  };
}
let heroOccluder: THREE.Mesh | null = null;


// ------------------------------------------------------------------ stops + camera rig
interface Stop { card: number; close?: boolean }
const STOPS: Stop[] = [
  { card: 0 }, { card: 1 }, { card: 2 }, { card: 3 },
  { card: 4 }, { card: 5 }, { card: 6 },
];
const N = STOPS.length;
const FAQ_STOP = STOPS.findIndex((x) => x.card === 4);
const CLOSING_STOP = STOPS.findIndex((x) => x.card === 3);

function coverDist() {
  const a = camera.aspect;
  return Math.min(CARD_H / 2 / tanH, CARD_W / 2 / (tanH * a)) * 0.985;
}
interface Pose { pos: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3 }
function stopPose(st: Stop): Pose {
  const v = views[st.card], c = v.card;
  if (st.close && v.close) {
    const d = c.close!.dist;
    return { pos: v.close.focus.clone().addScaledVector(v.close.dir, d), target: v.close.focus.clone(), up: c.up.clone() };
  }
  return { pos: c.center.clone().addScaledVector(c.normal, coverDist()), target: c.center.clone(), up: c.up.clone() };
}
function sizeClosePlanes() {
  for (const v of views) if (v.close) {
    const d = v.card.close!.dist - 0.9;
    const h = 2 * d * tanH, w = h * camera.aspect;
    const H = Math.max(h, w * 9 / 16) * 1.01;
    v.close.mesh.scale.set(H * 16 / 9, H, 1);
  }
}

const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeS = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const slerpV = (a: THREE.Vector3, b: THREE.Vector3, t: number) => {
  const q = new THREE.Quaternion().setFromUnitVectors(a.clone().normalize(), b.clone().normalize());
  return a.clone().applyQuaternion(new THREE.Quaternion().slerp(q, t)).normalize();
};

const doorViews = STOPS.map((st) => {
  const p = stopPose(st), c = views[st.card].card;
  const to = st.close ? [p.target] : [[-8, -4.5], [8, -4.5], [-8, 4.5], [8, 4.5], [0, 0]].map((q) => new THREE.Vector3(q[0], q[1], 0).applyMatrix4(c.object.matrixWorld));
  return { from: p.pos, to };
});
// transitions: an upright camera glides from scene A to scene B a few units off the
// belt, always looking at the stretch of belt between them, and passes through the
// doorway in the wall that separates the two rooms. Its up vector just blends from
// A's up to B's up, so a change of orientation is a gentle flop, never a roll.
const TRANSIT_D = 8;
let curveCache: Map<number, { pos: THREE.CatmullRomCurve3; tgt: THREE.CatmullRomCurve3 }> = new Map();
function transitionCurves(k: number) {
  let c = curveCache.get(k);
  if (c) return c;
  const A = STOPS[k], B = STOPS[k + 1];
  const pa = stopPose(A), pb = stopPose(B);
  const ca = views[A.card].card, cb = views[B.card].card;
  const sa = path.cardSpan[A.card][1], sb = path.cardSpan[B.card][0];
  const pts: THREE.Vector3[] = [pa.pos], tg: THREE.Vector3[] = [pa.target];
  for (const f of [0.33, 0.67]) {
    const fr = path.frameAt(THREE.MathUtils.lerp(sa, sb, f));
    const n = slerpV(ca.normal, cb.normal, f);
    const dir = n.clone().multiplyScalar(0.55).addScaledVector(fr.u, 0.45).normalize();
    pts.push(fr.p.clone().addScaledVector(dir, TRANSIT_D));
    tg.push(fr.p.clone());
  }
  pts.push(pb.pos); tg.push(pb.target);
  c = { pos: new THREE.CatmullRomCurve3(pts, false, "centripetal"), tgt: new THREE.CatmullRomCurve3(tg, false, "centripetal") };
  curveCache.set(k, c);
  return c;
}

const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), camUp = new THREE.Vector3();
function poseAt(s: number) {
  s = THREE.MathUtils.clamp(s, 0, N - 1);
  const k = Math.min(Math.floor(s), N - 2), t = s - k;
  const A = STOPS[k], B = STOPS[k + 1];
  if (t < 1e-4 || t > 1 - 1e-4) {
    const p = stopPose(t < 0.5 ? A : B); camPos.copy(p.pos); camTgt.copy(p.target); camUp.copy(p.up);
  } else if (A.card === B.card) {
    const pa = stopPose(A), pb = stopPose(B), e = easeS(t);
    camPos.lerpVectors(pa.pos, pb.pos, e); camTgt.lerpVectors(pa.target, pb.target, e); camUp.copy(pa.up);
  } else {
    const c = transitionCurves(k), e = easeS(t);
    camPos.copy(c.pos.getPoint(e)); camTgt.copy(c.tgt.getPoint(e));
    camUp.copy(slerpV(views[A.card].card.up, views[B.card].card.up, e));
  }
  return 0;
}
void ease;

// where each transition's camera crosses the plane half-way along its connector (for the doorways)
function cameraCrossing(ci: number, planePoint: THREE.Vector3, normal: THREE.Vector3) {
  const k = STOPS.findIndex((st, i) => st.card === ci && STOPS[i + 1] && STOPS[i + 1].card === ci + 1);
  if (k < 0) return null;
  const c = transitionCurves(k);
  let prev = c.pos.getPoint(0), pd = prev.clone().sub(planePoint).dot(normal);
  for (let i = 1; i <= 200; i++) {
    const p = c.pos.getPoint(i / 200), d = p.clone().sub(planePoint).dot(normal);
    if (pd * d <= 0) return prev.clone().lerp(p, pd / (pd - d));
    prev = p; pd = d;
  }
  return null;
}
const doors = buildDoors(scene, path, path.cardSpan, lanternTex, doorViews, cameraCrossing);

// parallax props along every scene-to-scene ride (never inside a landed view)
buildParallax(scene,
  STOPS.slice(0, -1).map((A, k) => ({ A, B: STOPS[k + 1], k })).filter(({ A, B }) => A.card !== B.card).map(({ A, B, k }) => {
    const c = transitionCurves(k);
    return { pos: c.pos, tgt: c.tgt, upA: views[A.card].card.up, upB: views[B.card].card.up };
  }),
  STOPS.map((st) => {
    const p = stopPose(st), cam = new THREE.PerspectiveCamera(FOV * 1.08, camera.aspect, 0.05, 400);
    cam.position.copy(p.pos); cam.up.copy(p.up); cam.lookAt(p.target); return cam;
  }),
  lanternTex);

// ------------------------------------------------------------------ scroll: one gesture = one scene, spring camera
// The camera position `s` follows `target` on a critically damped spring, so every move starts and ends
// calmly, keeps its velocity if retargeted mid-ride, and never overshoots.
// Input is read as gestures: a scroll that travels past COMMIT_PX commits to the next scene at once
// (no waiting for the wheel to stop). The rest of that gesture, including trackpad momentum, is ignored,
// but a new gesture (after a pause, or when the wheel speeds up again) is accepted immediately, even mid-ride.
let s = 0, target = 0, landed = 0, vel = 0;
const SPRING = 7.5;           // rad/s: a one-scene ride lands in about 0.8 s
const COMMIT_PX = 70;         // scroll distance that commits to the next scene
const PREVIEW = 0.06;         // how far the camera leans toward the next scene before committing
const GESTURE_GAP = 180;      // ms of silence that ends a gesture
let accum = 0, used = false, lastWheel = 0, lastAbs = 0, lastSign = 0;
function go(i: number) {
  landed = THREE.MathUtils.clamp(i, 0, N - 1); target = landed; accum = 0;
}
function gesture(px: number, now: number, fresh: boolean) {
  if (fresh) { accum = 0; used = false; }
  if (used) return;
  accum += px;
  if (Math.abs(accum) >= COMMIT_PX) {
    const next = THREE.MathUtils.clamp(landed + Math.sign(accum), 0, N - 1);
    used = true;
    if (next !== landed) go(next); else { accum = 0; target = landed; }
  } else {
    target = landed + THREE.MathUtils.clamp(accum / COMMIT_PX, -1, 1) * PREVIEW;
  }
}
window.addEventListener("wheel", (e) => {
  e.preventDefault();
  onWheel(e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY, performance.now());
}, { passive: false });
function onWheel(dy: number, now: number) {
  const abs = Math.abs(dy);
  // momentum only ever decays; a pause, a direction flip or a speed-up means a new swipe or wheel turn
  const flipped = lastSign !== 0 && Math.sign(dy) !== lastSign;
  // (a stall during momentum, e.g. while a video decodes, also leaves a gap, but the next event is still smaller)
  const gap = now - lastWheel;
  const fresh = gap > 700 || (gap > GESTURE_GAP && abs >= lastAbs * 0.98) || flipped
    || (used && abs > lastAbs * 1.4 + 2 && Math.abs(s - landed) < 0.35);
  lastAbs = abs; lastSign = Math.sign(dy) || lastSign; lastWheel = now;
  gesture(dy, now, fresh);
}
window.addEventListener("keydown", (e) => {
  if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(landed + 1); }
  if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); go(landed - 1); }
  if (e.key === "Home") go(0);
  if (e.key === "End") go(N - 1);
  konami(e.key);
});
let touchY: number | null = null;
window.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; lastWheel = performance.now(); gesture(0, lastWheel, true); }, { passive: true });
window.addEventListener("touchmove", (e) => {
  if (touchY === null || plates.drag) return;
  const y = e.touches[0].clientY; lastWheel = performance.now(); gesture((touchY - y) * 1.6, lastWheel, false); touchY = y;
}, { passive: true });
window.addEventListener("touchend", () => { touchY = null; });
document.querySelectorAll<HTMLElement>("[data-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); go(+a.dataset.go!); }));

// a gesture that ended before committing springs back to the scene
function release(now: number) {
  if (!used && accum !== 0 && now - lastWheel > GESTURE_GAP && touchY === null) { accum = 0; target = landed; }
}

// ------------------------------------------------------------------ pointer: drag / poke plates, click hero Jiro
const ndc = new THREE.Vector2();
const setNdc = (e: PointerEvent) => ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
canvas.addEventListener("pointerdown", (e) => {
  setNdc(e);
  if (plates.pointerDown(ndc, e.clientX, e.clientY)) { canvas.setPointerCapture(e.pointerId); canvas.classList.add("grabbing"); return; }
  const sc = project(toWorld(cards[0], [1.75, 1.2], 0));
  if (Math.round(s) === 0 && Math.hypot(sc.x - e.clientX, sc.y - e.clientY) < innerHeight * 0.12) {
    hooks.bubble(toWorld(cards[0], [1.75, 2.8], 0), "Irasshaimase!", 1600); hooks.found("hero", "Jiro welcomes you in."); blip(620, 0.1); setTimeout(() => blip(830, 0.14), 110);
  }
});
canvas.addEventListener("pointermove", (e) => {
  setNdc(e);
  if (plates.drag) { plates.pointerMove(ndc); return; }
  canvas.classList.toggle("grab", !!plates.pick(ndc));
});
canvas.addEventListener("pointerup", (e) => { plates.pointerUp(e.clientX, e.clientY); canvas.classList.remove("grabbing"); });

function project(p: THREE.Vector3) {
  const v = p.clone().project(camera);
  return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, z: v.z };
}

// ------------------------------------------------------------------ secrets
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let kIdx = 0;
function konami(key: string) {
  kIdx = key === KONAMI[kIdx] ? kIdx + 1 : key === KONAMI[0] ? 1 : 0;
  if (kIdx === KONAMI.length) { kIdx = 0; plates.party(); hooks.found("konami", "Konami code: rainbow belt."); }
}
let typed = "";
window.addEventListener("keypress", (e) => {
  typed = (typed + e.key.toLowerCase()).slice(-8);
  if (typed.endsWith("omakase")) { plates.turbo = 6; hooks.found("typed", "Typed the magic word."); toast("おまかせ — the chef decides."); }
  if (typed.endsWith("slop")) { hooks.found("slop", "Said the forbidden word."); hooks.flash("#ff6a4a"); toast("Jiro does not serve slop."); }
});
let footerSince = 0, paraded = false;
let heroClicks = 0;
document.querySelector(".mark")!.addEventListener("click", () => {
  if (++heroClicks === 5) { hooks.found("logo", "Five taps on the logo."); plates.paradeOfJiros(); toast("Mini Jiro parade!"); }
});
document.getElementById("ov-pricing")!.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).id === "reserve") { e.preventDefault(); hooks.found("cta", "You reserved a seat."); toast("Seat reserved. (Demo: no form yet.)"); }
});
document.querySelectorAll(".tag").forEach(() => 0);

// ------------------------------------------------------------------ overlays
initDemo(); initCompare(); initTable(); initPricing();
const faqEls = initFaq();
const faqAnswer = document.getElementById("faq-answer")!;
document.getElementById("tags")!.addEventListener("click", () => hooks.found("tag", "Poked a price tag."));
const ovs = Array.from(document.querySelectorAll<HTMLElement>(".ov"));
const railFill = document.getElementById("rail-fill")!;
const hint = document.getElementById("hint")!;
let faqShown = false;

const TABLE_STOP = STOPS.findIndex((x) => x.card === 3 && !x.close);
const strayState = new Map<number, number>(); // stop -> landed-at time, or -1 once done
function strayEvent(stop: number, delay: number, fire: () => boolean) {
  const st = strayState.get(stop);
  if (st === -1) return;
  if (Math.abs(s - stop) > 0.02) { strayState.delete(stop); return; }
  const now = performance.now() / 1000;
  if (st === undefined) { strayState.set(stop, now); return; }
  if (now - st > delay && fire()) strayState.set(stop, -1);
}
// every so often a dish slides off the edge of whatever stretch of belt is on screen
let fallIn = 14 + Math.random() * 10;
function occasionalFall(dt: number) {
  if (Math.abs(s - Math.round(s)) > 0.02) return;
  fallIn -= dt;
  if (fallIn > 0) return;
  fallIn = 18 + Math.random() * 22;
  const ci = STOPS[Math.round(s)].card;
  const list = platesOnCard(ci);
  if (!list.length) return;
  const p = list[Math.floor(Math.random() * list.length)];
  const f = path.frameAt(0); void f;
  const side = new THREE.Vector3(Math.random() < 0.5 ? -1 : 1, 0.4, 0).applyQuaternion(camera.quaternion);
  plates.fallOff(p, side);
}

function platesOnCard(ci: number) {
  const [s0, s1] = path.cardSpan[ci];
  return plates.plates.filter((p) => {
    if (p.mode !== "belt" || !p.sprite.visible) return false;
    const q = project(p.sprite.position);
    return q.x > 40 && q.x < innerWidth - 40 && q.y > 60 && q.y < innerHeight - 4 && q.z < 1 && s0 <= s1;
  });
}

function updateOverlays(time: number) {
  for (const el of ovs) {
    const k = +el.dataset.stop!;
    const d = s - k;
    const o = THREE.MathUtils.clamp(1 - Math.abs(d) * 3.2, 0, 1);
    el.style.opacity = String(o);
    el.style.visibility = o > 0.01 ? "visible" : "hidden";
    el.style.transform = `translateY(${-d * 70}px)`;
    el.classList.toggle("live", o > 0.6);
  }
  railFill.style.height = `${(s / (N - 1)) * 100}%`;
  hint.style.opacity = s < 0.15 ? "0.85" : "0";
  // FAQ bubbles ride on the sushi
  const faqOn = Math.abs(s - FAQ_STOP) < 0.3;
  if (faqOn && !faqShown) { faqEls.forEach((b, i) => setTimeout(() => b.classList.add("in"), 250 + i * 320)); faqShown = true; }
  if (!faqOn && Math.abs(s - FAQ_STOP) > 0.9 && faqShown) { faqEls.forEach((b) => b.classList.remove("in")); faqShown = false; }
  if (Math.abs(s - FAQ_STOP) < 1) faqEls.forEach((b, i) => {
    // the five sit close together on one board: fan the bubbles out above them
    const p = project(toWorld(cards[4], [FAQ[i].at[0] + (i - 2) * 1.25 + 0.6, FAQ[i].at[1] + 1.2 + (i % 2) * 1.05], 0));
    b.style.left = `${p.x}px`; b.style.top = `${p.y}px`;
  });
  // Jiro answers in a speech bubble next to his head
  if (Math.abs(s - FAQ_STOP) < 1) {
    const a = project(toWorld(cards[4], [-3.6, 3.0], 0));
    faqAnswer.style.left = `${a.x}px`; faqAnswer.style.top = `${a.y}px`;
  }
  // the two strays, once each per visit: a dish on the table scene's belt falls off,
  // and one on the FAQ belt grows legs and wanders off into the scene
  strayEvent(TABLE_STOP, 2.2, () => {
    const p = platesOnCard(3)[3]; if (!p) return false;
    plates.fallOff(p, cards[3].up.clone().multiplyScalar(0.6).addScaledVector(new THREE.Vector3(-1, 0, 0).applyQuaternion(cards[3].quat), 1.2));
    return true;
  });
  strayEvent(FAQ_STOP, 3.4, () => {
    const p = platesOnCard(4).find((q) => { const x = project(q.sprite.position).x; return x > innerWidth * 0.25 && x < innerWidth * 0.5; }); if (!p) return false;
    plates.walkOff(p, cards[4].up.clone().multiplyScalar(0.55).addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(cards[4].quat), 1));
    return true;
  });
  // footer: stay 8s → a mini-Jiro parade
  if (Math.abs(s - CLOSING_STOP) < 0.05) {
    footerSince ||= time;
    if (!paraded && time - footerSince > 8) {
      paraded = true; plates.paradeOfJiros(); hooks.found("stay", "Stayed after closing time.");
      hooks.bubble(toWorld(cards[3], [3.2, 2.6], 0), "…five more minutes", 2600);
    }
  } else footerSince = 0;
}

// ------------------------------------------------------------------ resize
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  (fx.points.material as THREE.ShaderMaterial).uniforms.scale.value = innerHeight * renderer.getPixelRatio() / (2 * tanH);
  curveCache = new Map(); sizeClosePlanes();
}
window.addEventListener("resize", resize);
resize();

// ------------------------------------------------------------------ loop
const clock = new THREE.Clock();
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
const smoothMouse = new THREE.Vector2();
const tmpQ = new THREE.Quaternion();

function frame() {
  (window as any).__jiroFrames = ((window as any).__jiroFrames || 0) + 1;
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  release(performance.now());
  // critically damped spring toward target (semi-implicit, sub-stepped for stability)
  for (let k = 0; k < 4; k++) {
    const h = dt / 4;
    vel += (SPRING * SPRING * (target - s) - 2 * SPRING * vel) * h;
    s += vel * h;
  }
  if (Math.abs(target - s) < 1e-4 && Math.abs(vel) < 1e-3) { s = target; vel = 0; }

  const roll = poseAt(s);
  // tiny breathing + mouse parallax, fades out during transitions
  const settle = 1 - Math.min(1, Math.abs(s - Math.round(s)) * 4);
  smoothMouse.lerp(mouse, 1 - Math.exp(-dt * 3));
  camera.position.copy(camPos);
  camera.up.copy(camUp);
  camera.lookAt(camTgt);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const breathe = Math.sin(time * 0.5) * 0.06 * settle;
  camera.position.addScaledVector(right, -smoothMouse.x * 0.18 * settle).addScaledVector(up, smoothMouse.y * 0.12 * settle).addScaledVector(fwd, 0.05 * settle + breathe);
  if (roll) camera.quaternion.multiply(tmpQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  if (shakeAmt > 0.001) {
    camera.position.addScaledVector(right, (Math.random() - 0.5) * shakeAmt * 0.3).addScaledVector(up, (Math.random() - 0.5) * shakeAmt * 0.3);
    shakeAmt *= Math.pow(0.02, dt);
  }

  // one scene at a time: the active card is lit, the others sink into the dark
  views.forEach((v, i) => {
    let dmin = Infinity;
    STOPS.forEach((st, k) => { if (st.card === i) dmin = Math.min(dmin, Math.abs(s - k)); });
    const w = THREE.MathUtils.smoothstep(1 - dmin * 1.7, 0, 1);
    const b = 0.1 + 0.9 * w;
    v.mat.color.setScalar(b);
    if (dmin < 2.2) ensureLoaded(v.video);
    if (v.close && dmin < 1.6) ensureLoaded(v.close.video);
    const want = dmin < 1.05;
    if (want && v.video.paused) v.video.play().catch(() => {});
    if (!want && !v.video.paused) v.video.pause();
    if (v.close) {
      const kc = STOPS.findIndex((st) => st.card === i && st.close);
      const dc = Math.abs(s - kc);
      v.close.mat.opacity = THREE.MathUtils.smoothstep(1 - dc, 0.35, 0.9);
      v.close.mesh.visible = v.close.mat.opacity > 0.001;
      if (dc < 1 && v.close.video.paused) v.close.video.play().catch(() => {});
      if (dc >= 1 && !v.close.video.paused) v.close.video.pause();
    }
  });

  plates.update(dt, time);
  const near = (ci: number) => Math.min(...STOPS.map((st, k) => st.card === ci ? Math.abs(s - k) : 9));
  koi.update(dt, near(6) < 0.6);

  animateDoors(doors, time);
  occasionalFall(dt);
  if (heroOccluder) heroOccluder.visible = near(0) < 1.5;
  slats.update(plates.offset);
  fx.update(dt);
  embers.rotation.y = Math.sin(time * 0.05) * 0.01;

  // speech bubbles follow their anchor
  const now = performance.now();
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]; const p = project(b.p);
    b.el.style.left = `${p.x}px`; b.el.style.top = `${p.y - 10}px`;
    if (now > b.until) { b.el.classList.add("out"); if (now > b.until + 350) { b.el.remove(); bubbles.splice(i, 1); } }
  }
  updateOverlays(time);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
void BASE_SPEED;
requestAnimationFrame(frame);

// debug handle for screenshots: ?s=3.5 freezes the camera at a scroll position
const qs = new URLSearchParams(location.search);
if (qs.has("s")) { const v = +qs.get("s")!; s = target = v; landed = Math.round(v); }
(window as any).__jiro = {
  go, set: (v: number) => { s = target = v; vel = 0; landed = Math.round(v); },
  state: () => ({ s, target, landed }),
  wheel: onWheel, // test hook: feed wheel deltas with explicit timestamps
  plateOnScreen: (item?: string) => {
    for (const p of plates.plates) {
      if (!p.sprite.visible || p.mode !== "belt" || (item && p.item !== item)) continue;
      const q = project(p.sprite.position);
      if (q.x > 20 && q.x < innerWidth - 20 && q.y > 70 && q.y < innerHeight - 20 && q.z < 1) return { x: q.x, y: q.y, item: p.item };
    }
    return null;
  },
  eggs: () => [...foundSet],
  koi: () => ({ t: koi.t, next: koi.next, vis: koi.mesh.visible, eaten: koi.eaten }),
  jump: () => koi.start(),
};
(window as any).__dbg = () => plates.plates.filter((p) => p.sprite.visible).slice(0, 400).map((p) => { const q = project(p.sprite.position); return [Math.round(q.x), Math.round(q.y), +q.z.toFixed(3), p.mode]; }).filter((a) => (a[0] as number) > 0 && (a[0] as number) < 1600 && (a[1] as number) > 0 && (a[1] as number) < 900);
