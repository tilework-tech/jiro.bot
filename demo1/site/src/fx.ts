import * as THREE from "three";

/** Pixel-square particles: explosions, confetti, coins, steam. */
export class Particles {
  max = 6000;
  geo = new THREE.BufferGeometry();
  pos = new Float32Array(this.max * 3);
  col = new Float32Array(this.max * 3);
  vel = new Float32Array(this.max * 3);
  life = new Float32Array(this.max);
  grav = new Float32Array(this.max * 3);
  size = new Float32Array(this.max);
  points: THREE.Points;
  head = 0;

  constructor(scene: THREE.Scene) {
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.geo.setAttribute("size", new THREE.BufferAttribute(this.size, 1));
    const mat = new THREE.ShaderMaterial({
      vertexColors: true, transparent: true, depthWrite: false,
      uniforms: { scale: { value: 600 } },
      vertexShader: `attribute float size; varying vec3 vC; varying float vA; uniform float scale;
        void main(){ vC=color; vA=step(0.001,size); vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=size*scale/(-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ if(vA<0.5) discard; gl_FragColor=vec4(vC,1.0); }`,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  emit(p: THREE.Vector3, v: THREE.Vector3, c: THREE.Color, life: number, size: number, g: THREE.Vector3) {
    const i = this.head; this.head = (this.head + 1) % this.max;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.col.set([c.r, c.g, c.b], i * 3);
    this.grav.set([g.x, g.y, g.z], i * 3);
    this.life[i] = life; this.size[i] = size;
  }

  update(dt: number) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.size[i] = 0; continue; }
      this.life[i] -= dt;
      const k = i * 3;
      this.vel[k] += this.grav[k] * dt; this.vel[k + 1] += this.grav[k + 1] * dt; this.vel[k + 2] += this.grav[k + 2] * dt;
      this.vel[k] *= 0.985; this.vel[k + 1] *= 0.985; this.vel[k + 2] *= 0.985;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.life[i] <= 0) this.size[i] = 0;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

/** Read an image into a coarse grid of opaque pixel colours (for pixel explosions). */
export function pixelGrid(img: HTMLImageElement, cells = 18): { x: number; y: number; c: THREE.Color }[] {
  const c = document.createElement("canvas");
  c.width = cells; c.height = cells;
  const g = c.getContext("2d")!;
  const s = Math.max(img.width, img.height);
  g.drawImage(img, (s - img.width) / 2 * cells / s, (s - img.height) / 2 * cells / s, img.width * cells / s, img.height * cells / s);
  const d = g.getImageData(0, 0, cells, cells).data;
  const out: { x: number; y: number; c: THREE.Color }[] = [];
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    const k = (y * cells + x) * 4;
    if (d[k + 3] > 140) out.push({ x: x / cells - 0.5, y: 0.5 - y / cells, c: new THREE.Color(`rgb(${d[k]},${d[k + 1]},${d[k + 2]})`).convertSRGBToLinear() });
  }
  return out;
}

/** Tiny WebAudio blips; only ever triggered by a user gesture. */
let ac: AudioContext | null = null;
export function blip(freq: number, dur = 0.12, type: OscillatorType = "square", vol = 0.05, slide = 0) {
  try {
    ac ??= new AudioContext();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch { /* audio is optional */ }
}
export function boom() {
  try {
    ac ??= new AudioContext();
    const len = ac.sampleRate * 0.5, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "lowpass"; f.frequency.value = 900; g.gain.value = 0.25;
    s.buffer = buf; s.connect(f).connect(g).connect(ac.destination); s.start();
  } catch { /* optional */ }
}
