import * as THREE from "three";
import { PALETTE } from "./palette";

/**
 * Palette pass. The scenes are true pixel art (960x540 native, shown at 2x via nearest-filtered video
 * textures), so the 3D scene itself renders at full resolution: the belt and everything on it move
 * smoothly with fine, readable pixels instead of snapping to the coarse scene grid (which made the belt
 * pulse and flash). Every rendered pixel is still snapped to the shared scene palette so colours stay
 * consistent; there is no dithering here, because dither patterns shimmer on moving objects.
 */

const frag = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 pal[${PALETTE.length}];
  varying vec2 vUv;
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
    gl_FragColor = vec4(c1, 1.0);
  }`;

export class PixelPass {
  rt: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  w = 1; h = 1;
  constructor(private renderer: THREE.WebGLRenderer, private canvas: HTMLCanvasElement) {
    this.rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, samples: 4 });
    this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: this.rt.texture }, pal: { value: PALETTE.map((c) => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255)) } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: frag, depthTest: false, depthWrite: false,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  }
  /** full-resolution buffer (device pixels, capped at 2x) */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.round(innerWidth * dpr); this.h = Math.round(innerHeight * dpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.rt.setSize(this.w, this.h);
    void this.canvas;
  }
  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.cam);
  }
}
