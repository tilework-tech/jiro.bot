import * as THREE from "three";

/** Card plane is 16 x 9 world units, centred on its origin, facing local +Z. */
export const CARD_W = 16;
export const CARD_H = 9;
export const BELT_Z = 0.32; // belt floats just in front of each card

export type V2 = [number, number];

export interface CardDef {
  id: string;
  video: string;
  pos: [number, number, number];
  rot: [number, number, number]; // degrees, XYZ
  /** belt polyline in card-local units, entry first. */
  belt: V2[];
  /** direction the belt leaves the card (local), used for the connector tangent. */
  exitDir?: V2;
  entryDir?: V2;
  close?: { video: string; focus: V2; yaw: number; dist: number };
  /** painted-lane cards (hero): full belt width as a card-local vector (lets the belt skew to the scene's isometric axis) */
  beltWidth?: V2;
  /** visual scale of belt + plates on this card (1 = default) */
  beltScale?: number;
  beltZ?: number;
  /** barrel roll on the transition INTO this card (turns). */
  spin?: number;
}

const L = -7.0, R = 7.0, T = 4.5, B = -4.5, BOT = -3.85;

// The belt follows the sketch: diagonal out of the hero, down the left of the
// demo, left+bottom of the top-down scene, down the right through table + FAQ,
// back left, diagonal across pricing, down the right of the CTA, left along the
// footer. Each card sits somewhere different in 3D, so following the belt means
// the camera orbits, pitches, and rolls between scenes.
export const CARDS: CardDef[] = [
  {
    id: "s0-hero", video: "v/s0-hero.mp4",
    pos: [0, 0, 0], rot: [0, 0, 0],
    // the belt lies on the painted wooden lane: out of the wall opening, down to the bottom-left edge
    belt: [[7.6, 0.8], [-0.35, B]], exitDir: [-0.832, -0.555],
    beltWidth: [0.42, -0.085], beltScale: 0.42, beltZ: 0.04,
  },
  {
    id: "s1-code", video: "v/s1-code-small.mp4",
    pos: [-15, -14, -8], rot: [0, 32, 0],
    belt: [[L, T], [L, B]], entryDir: [0, -1], exitDir: [0, -1],
  },
  {
    id: "s2-serve", video: "v/s2-serve.mp4",
    pos: [-14, -32, -1.5], rot: [-90, 0, 0],
    belt: [[L, T], [L, BOT], [R, BOT], [R, B]], entryDir: [0, -1], exitDir: [0, -1],
  },
  {
    // after-hours bar (was the tuna scene's slot): hosts the comparison table
    id: "s7-closing", video: "v/s7-closing-small.mp4",
    pos: [9, -42, -14], rot: [0, -28, 0],
    belt: [[R, T], [R, B]], entryDir: [0, -1], exitDir: [0, -1],
  },
  {
    id: "s4-omakase", video: "v/s4-omakase.mp4",
    pos: [26, -55, -4], rot: [0, -78, 0],
    // belt runs only along the very bottom so all five sushi characters stay visible
    belt: [[8.7, T + 0.6], [8.7, -4.15], [L, -4.15]], entryDir: [0, -1], exitDir: [-1, 0],
  },
  {
    id: "s5-market", video: "v/s5-market.mp4",
    pos: [25, -70, 14], rot: [0, -122, 12],
    belt: [[L, T], [R, 2.4], [R, B]], entryDir: [0.99, -0.14], exitDir: [0, -1],
  },
  {
    id: "s6-delivery", video: "v/s6-delivery.mp4",
    pos: [9, -86, 25], rot: [6, -168, 0],
    belt: [[R, T], [R, B]], entryDir: [0, -1], exitDir: [0, -1],
  },
  {
    // ending 1: a trestle over a koi pond; the koi jumps now and then and eats a stretch of belt
    id: "e1-pond", video: "v/e1-pond.mp4",
    pos: [12.7, -110, 29.2], rot: [-6, 155, 0],
    belt: [[8.4, 0.08], [-8.8, 0.08]], entryDir: [-1, 0],
    beltWidth: [0, 0.4], beltScale: 0.55, beltZ: 0.04,
  },
];

export interface Card extends CardDef {
  object: THREE.Object3D; // carries world transform
  quat: THREE.Quaternion;
  normal: THREE.Vector3;
  up: THREE.Vector3;
  center: THREE.Vector3;
}

export function toWorld(c: Card, p: V2, z = c.beltZ ?? BELT_Z): THREE.Vector3 {
  return new THREE.Vector3(p[0], p[1], z).applyMatrix4(c.object.matrixWorld);
}

export function dirWorld(c: Card, d: V2): THREE.Vector3 {
  return new THREE.Vector3(d[0], d[1], 0).applyQuaternion(c.quat).normalize();
}

export function makeCards(): Card[] {
  return CARDS.map((d) => {
    const o = new THREE.Object3D();
    o.position.set(...d.pos);
    o.rotation.set(...(d.rot.map(THREE.MathUtils.degToRad) as [number, number, number]));
    o.updateMatrixWorld(true);
    const quat = o.quaternion.clone();
    return {
      ...d, object: o, quat,
      normal: new THREE.Vector3(0, 0, 1).applyQuaternion(quat),
      up: new THREE.Vector3(0, 1, 0).applyQuaternion(quat),
      center: o.position.clone(),
    };
  });
}
