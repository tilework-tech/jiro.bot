import * as THREE from "three";
import { PALETTE } from "./palette";

/**
 * True-pixel-art output: the 3D scene renders at 1/PIXEL of the CSS viewport, every pixel snaps to the
 * shared scene palette (with the same sparse 4x4 ordered dithering the stills use for soft light), and
 * the canvas is scaled up by an exact integer with nearest-neighbour. Belt, plates, doors, parallax and
 * the video scenes therefore all share one pixel size and one palette.
 */
export const PIXEL = 4;

const frag = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 pal[${PALETTE.length}];
  varying vec2 vUv;
  float bayer(vec2 p) {
    int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));
    int i = x + y * 4;
    int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
    return (float(m[i]) + 0.5) / 16.0;
  }
  vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  float dist(vec3 a, vec3 b) {            // "redmean" perceptual RGB distance (sRGB 0..1)
    float r = (a.r + b.r) * 0.5; vec3 d = a - b;
    return (2.0 + r) * d.r * d.r + 4.0 * d.g * d.g + (3.0 - r) * d.b * d.b;
  }
  void main() {
    vec3 c = toSRGB(texture2D(tDiffuse, vUv).rgb);
    float d1 = 1e9, d2 = 1e9; vec3 c1 = pal[0], c2 = pal[0];
    for (int i = 0; i < ${PALETTE.length}; i++) {
      float d = dist(c, pal[i]);
      if (d < d1) { d2 = d1; c2 = c1; d1 = d; c1 = pal[i]; } else if (d < d2) { d2 = d; c2 = pal[i]; }
    }
    float t = sqrt(d1) / (sqrt(d1) + sqrt(d2) + 1e-6);
    bool near = dist(c1, c2) < 0.02;       // only dither between neighbouring shades
    gl_FragColor = vec4((near && t > 0.32 && bayer(gl_FragCoord.xy) < t) ? c2 : c1, 1.0);
  }`;

export class PixelPass {
  rt: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  w = 1; h = 1;
  constructor(private renderer: THREE.WebGLRenderer, private canvas: HTMLCanvasElement) {
    this.rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: this.rt.texture }, pal: { value: PALETTE.map((c) => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255)) } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: frag, depthTest: false, depthWrite: false,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  }
  /** size the low-res buffer; the canvas is stretched by exactly PIXEL CSS px per art pixel */
  resize() {
    this.w = Math.ceil(innerWidth / PIXEL); this.h = Math.ceil(innerHeight / PIXEL);
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.w, this.h, false);
    this.rt.setSize(this.w, this.h);
    Object.assign(this.canvas.style, { width: `${this.w * PIXEL}px`, height: `${this.h * PIXEL}px` });
  }
  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.cam);
  }
}
