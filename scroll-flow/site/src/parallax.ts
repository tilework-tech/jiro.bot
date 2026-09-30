import * as THREE from "three";

/**
 * Parallax props for the scene-to-scene rides. Near the camera path we hang dark
 * foreground pieces (bamboo, hanging lanterns, noren strips, potted plants, a
 * shelf of jars) that sweep past faster than the belt; far away we scatter
 * warm lantern clusters that drift slower. Together they sell depth while the
 * camera moves through the house. Nothing is placed inside a landed scene's view.
 */

type Painter = (g: CanvasRenderingContext2D) => void;
function tex(w: number, h: number, paint: Painter) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const PROPS: { w: number; h: number; tex: THREE.Texture }[] = [
  // bamboo stalks
  { w: 0.9, h: 6, tex: tex(12, 80, (g) => {
    for (const [x, c] of [[1, "#3f6b35"], [6, "#4d7d3f"]] as [number, string][]) {
      g.fillStyle = c; g.fillRect(x, 0, 4, 80);
      g.fillStyle = "#2c4a25"; for (let y = 6; y < 80; y += 14) g.fillRect(x - 1, y, 6, 2);
      g.fillStyle = "#7fa05f"; g.fillRect(x + 1, 0, 1, 80);
    }
    g.fillStyle = "#4d7d3f"; g.fillRect(8, 20, 4, 2); g.fillRect(10, 18, 2, 2); g.fillRect(0, 44, 3, 2);
  }) },
  // hanging lantern on a cord
  { w: 0.8, h: 2.4, tex: tex(12, 36, (g) => {
    g.fillStyle = "#2a1a0e"; g.fillRect(5, 0, 2, 12); g.fillRect(2, 12, 8, 2); g.fillRect(2, 32, 8, 2);
    g.fillStyle = "#e0833a"; g.fillRect(1, 14, 10, 18); g.fillStyle = "#ffc27a"; g.fillRect(3, 16, 5, 13);
    g.fillStyle = "#b05a24"; for (let y = 17; y < 32; y += 4) g.fillRect(1, y, 10, 1);
  }) },
  // noren strip
  { w: 1.1, h: 2.6, tex: tex(14, 34, (g) => {
    g.fillStyle = "#3a2215"; g.fillRect(0, 0, 14, 2);
    g.fillStyle = "#27325c"; g.fillRect(1, 2, 12, 30); g.fillStyle = "#e9e1d0"; g.fillRect(5, 12, 4, 1); g.fillRect(6, 10, 2, 7);
    g.fillStyle = "#1c2444"; g.fillRect(1, 30, 12, 2);
  }) },
  // potted plant
  { w: 1.6, h: 2.2, tex: tex(20, 28, (g) => {
    g.fillStyle = "#2f5a2a"; for (const [x, y, w, h] of [[8, 2, 4, 14], [3, 6, 6, 3], [11, 5, 7, 3], [4, 11, 5, 3], [12, 10, 6, 3]]) g.fillRect(x, y, w, h);
    g.fillStyle = "#4d8a3f"; g.fillRect(9, 3, 2, 10); g.fillRect(4, 7, 3, 1); g.fillRect(13, 6, 4, 1);
    g.fillStyle = "#7a3f22"; g.fillRect(5, 17, 10, 10); g.fillStyle = "#9a5a30"; g.fillRect(4, 16, 12, 3);
  }) },
  // shelf with jars
  { w: 3.4, h: 1.6, tex: tex(40, 18, (g) => {
    const jar = (x: number, c: string) => { g.fillStyle = c; g.fillRect(x, 4, 7, 9); g.fillRect(x + 2, 2, 3, 2); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(x + 1, 5, 1, 6); };
    jar(2, "#8a6a3a"); jar(12, "#6b7a4a"); jar(22, "#7a4a3a"); jar(31, "#8a6a3a");
    g.fillStyle = "#4a2e1c"; g.fillRect(0, 13, 40, 3); g.fillStyle = "#2b190f"; g.fillRect(0, 16, 40, 2);
  }) },
];

const glow = tex(32, 32, (g) => {
  const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,190,110,.6)"); r.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
});

export interface Ride { pos: THREE.Curve<THREE.Vector3>; tgt: THREE.Curve<THREE.Vector3>; upA: THREE.Vector3; upB: THREE.Vector3 }

export function buildParallax(scene: THREE.Scene, rides: Ride[], landed: THREE.PerspectiveCamera[], lanternTex: THREE.Texture) {
  const frusta = landed.map((c) => {
    c.updateMatrixWorld(true); c.updateProjectionMatrix();
    return new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse));
  });
  const clear = (p: THREE.Vector3, r: number) => frusta.every((f) => !f.intersectsSphere(new THREE.Sphere(p, r)));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const group = new THREE.Group();
  rides.forEach((ride) => {
    for (const t of [0.22, 0.36, 0.5, 0.64, 0.78]) {
      const P = ride.pos.getPoint(t), T = ride.tgt.getPoint(t);
      const d = T.clone().sub(P).normalize();
      const up = ride.upA.clone().lerp(ride.upB, t).normalize();
      const right = new THREE.Vector3().crossVectors(d, up).normalize();
      const side = rnd() < 0.5 ? -1 : 1;
      // near: framing silhouettes that whip past (dimmed, like out-of-light foreground)
      const kind = PROPS[Math.floor(rnd() * PROPS.length)];
      const near = P.clone().addScaledVector(d, 3.2 + rnd() * 1.5).addScaledVector(right, side * (2.3 + rnd() * 0.8)).addScaledVector(up, (rnd() - 0.4) * 2.2);
      if (clear(near, Math.max(kind.w, kind.h))) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kind.tex, color: new THREE.Color(0.42, 0.36, 0.32), alphaTest: 0.5, fog: false }));
        s.scale.set(kind.w, kind.h, 1); s.position.copy(near); group.add(s);
      }
      // far: warm lantern clusters that drift slowly behind everything
      for (let k = 0; k < 2; k++) {
        const far = P.clone().addScaledVector(d, 16 + rnd() * 10).addScaledVector(right, (rnd() - 0.5) * 22).addScaledVector(up, (rnd() - 0.3) * 8);
        if (!clear(far, 2)) continue;
        const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: lanternTex, fog: true })); l.scale.set(0.5, 0.75, 1); l.position.copy(far);
        const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, fog: true })); g.scale.setScalar(2.6); g.position.copy(far);
        group.add(l, g);
      }
    }
  });
  scene.add(group);
  return group;
}
