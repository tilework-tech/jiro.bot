// Pixel-art characters: Jiro the chef, the diner by the belt, and "you".
// Each draws into a tiny canvas that CSS scales up with pixelated rendering.

type C = CanvasRenderingContext2D;

function R(c: C, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
}

function P(c: C, x: number, y: number, col: string) {
  c.fillStyle = col;
  c.fillRect(x, y, 1, 1);
}

// Filled rounded box with 1px chamfered corners and optional outline.
function box(c: C, x: number, y: number, w: number, h: number, col: string, outline?: string) {
  if (outline) {
    R(c, x + 1, y - 1, w - 2, 1, outline);
    R(c, x + 1, y + h, w - 2, 1, outline);
    R(c, x - 1, y + 1, 1, h - 2, outline);
    R(c, x + w, y + 1, 1, h - 2, outline);
    P(c, x, y, outline);
    P(c, x + w - 1, y, outline);
    P(c, x, y + h - 1, outline);
    P(c, x + w - 1, y + h - 1, outline);
  }
  R(c, x + 1, y, w - 2, h, col);
  R(c, x, y + 1, w, h - 2, col);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export { Jiro } from './jiroSprite';

export class Diner {
  c: C;
  t = 0;
  state: 'idle' | 'reach' | 'bring' | 'chew' = 'idle';
  st = 0;
  blinkT = 2;
  cool = 2;
  onBite?: () => void;

  constructor(public canvas: HTMLCanvasElement) {
    this.c = canvas.getContext('2d')!;
  }

  // Normalised 0..1 extension of the chopstick arm.
  get reach() {
    if (this.state === 'reach') return Math.min(1, this.st / 0.3);
    if (this.state === 'bring') return Math.max(0, 1 - this.st / 0.35);
    return 0;
  }

  grab() {
    this.state = 'reach';
    this.st = 0;
  }

  feed() {
    this.state = 'chew';
    this.st = 0;
  }

  update(dt: number) {
    this.t += dt;
    this.st += dt;
    this.cool = Math.max(0, this.cool - dt);
    this.blinkT -= dt;
    if (this.blinkT < -0.12) this.blinkT = rnd(2, 5);
    if (this.state === 'reach' && this.st > 0.3) {
      this.state = 'bring';
      this.st = 0;
    } else if (this.state === 'bring' && this.st > 0.35) {
      this.state = 'chew';
      this.st = 0;
      this.onBite?.();
    } else if (this.state === 'chew' && this.st > 1.1) {
      this.state = 'idle';
      this.st = 0;
      this.cool = rnd(1.5, 4);
    }
    this.draw();
  }

  draw() {
    const c = this.c;
    c.clearRect(0, 0, 48, 56);
    const chew = this.state === 'chew';
    const bob = chew ? (Math.floor(this.t * 8) % 2) : Math.sin(this.t * 2) > 0.7 ? 1 : 0;
    // Stool.
    R(c, 25, 44, 16, 3, '#c8321e');
    R(c, 25, 44, 16, 1, '#f06a4f');
    R(c, 26, 47, 14, 1, '#7d1a0e');
    R(c, 32, 48, 2, 8, '#3a2a22');
    R(c, 28, 54, 10, 2, '#3a2a22');
    // Legs.
    R(c, 22, 38, 14, 5, '#2b2f3a');
    R(c, 19, 40, 5, 10, '#2b2f3a');
    R(c, 17, 49, 7, 2, '#e8e3d9');
    // Hoodie.
    box(c, 24, 20 + bob, 14, 20, '#5a7d4a', '#1e2a18');
    R(c, 25, 21 + bob, 3, 18, '#6e9a5b');
    R(c, 35, 21 + bob, 2, 18, '#48663b');
    R(c, 26, 34 + bob, 8, 3, '#48663b');
    // Head.
    const hy = 6 + bob;
    box(c, 24, hy, 12, 13, '#f2c39b', '#3a2016');
    R(c, 24, hy, 12, 4, '#2a1a14');
    R(c, 32, hy, 4, 10, '#2a1a14');
    R(c, 23, hy + 1, 2, 3, '#2a1a14');
    P(c, 33, hy + 7, '#e8a883');
    const blink = this.blinkT < 0;
    if (chew) {
      R(c, 25, hy + 6, 2, 1, '#2a1208');
      P(c, 25, hy + 5, '#2a1208');
    } else if (!blink) {
      R(c, 25, hy + 6, 1, 2, '#2a1208');
    } else {
      R(c, 25, hy + 7, 2, 1, '#2a1208');
    }
    P(c, 27, hy + 8, 'rgba(255,110,110,0.7)');
    if (chew) R(c, 24, hy + 10 - (Math.floor(this.t * 10) % 2), 3, 1, '#7a2a1a');
    else R(c, 24, hy + 10, 2, 1, '#7a2a1a');
    // Arm with chopsticks.
    const r = this.reach;
    const hx = Math.round(20 - r * 14);
    const hyy = Math.round(26 - r * 2 + (this.state === 'bring' ? -this.st * 20 : 0));
    const handY = Math.max(hy + 9, hyy);
    R(c, hx + 2, handY, 26 - hx - 2, 3, '#5a7d4a');
    R(c, hx + 2, handY, 26 - hx - 2, 1, '#6e9a5b');
    box(c, hx - 1, handY - 1, 4, 4, '#f2c39b');
    R(c, hx - 9, handY, 10, 1, '#d8a86a');
    R(c, hx - 9, handY + 2, 10, 1, '#c89452');
    if (this.state === 'bring') {
      R(c, hx - 8, handY - 1, 5, 3, '#f7f0e2');
      R(c, hx - 9, handY - 2, 7, 1, '#ff7a47');
    }
  }

  // Where the chopstick tips are, in canvas pixels.
  tip() {
    const r = this.reach;
    return { x: Math.round(20 - r * 14) - 9, y: 27 };
  }
}

export class You {
  c: C;
  t = 0;
  eatT = 0;
  notifT = 3;
  notif = 0;
  typing = 0;

  constructor(public canvas: HTMLCanvasElement) {
    this.c = canvas.getContext('2d')!;
  }

  feed() {
    this.eatT = 1.4;
  }

  update(dt: number) {
    this.t += dt;
    this.eatT = Math.max(0, this.eatT - dt);
    this.notifT -= dt;
    if (this.notifT < 0) {
      this.notif = 3.2;
      this.notifT = rnd(6, 10);
    }
    this.notif = Math.max(0, this.notif - dt);
    this.draw();
  }

  draw() {
    const c = this.c;
    c.clearRect(0, 0, 72, 56);
    const eating = this.eatT > 0;
    const chew = eating && Math.floor(this.t * 9) % 2 === 0;
    const bob = Math.sin(this.t * 1.6) > 0.8 ? 1 : 0;

    // Stool behind.
    R(c, 24, 50, 24, 2, '#7d1a0e');

    // Body (from behind).
    const bx = 22;
    const by = 24 + bob;
    for (let y = by; y < 52; y++) {
      const spread = Math.min(3, Math.floor((y - by) / 3));
      R(c, bx - spread, y, 28 + spread * 2, 1, '#2b4486');
      R(c, bx - spread, y, 2, 1, '#1d2f63');
      R(c, bx + 26 + spread, y, 2, 1, '#1d2f63');
    }
    R(c, bx + 4, by + 8, 20, 1, '#243a78');
    // Hood, drawstrings and a tiny logo.
    box(c, bx + 4, by - 1, 20, 7, '#34529a', '#16224a');
    R(c, bx + 7, by + 1, 14, 3, '#243a78');
    R(c, bx + 6, by + 5, 16, 1, '#16224a');
    R(c, bx + 11, by + 6, 1, 5, '#e8e3d9');
    R(c, bx + 16, by + 6, 1, 4, '#e8e3d9');
    R(c, bx + 12, by + 16, 4, 2, '#f4ead7');
    R(c, bx + 11, by + 15, 6, 1, '#ff7a47');
    // Fabric folds.
    R(c, bx + 3, by + 20, 1, 8, '#243a78');
    R(c, bx + 24, by + 18, 1, 9, '#243a78');
    // Arms reaching to the counter (typing).
    const tap = Math.floor(this.t * 6) % 2;
    R(c, bx - 4, by + 12, 5, 14, '#2b4486');
    R(c, bx + 27, by + 12, 5, 14, '#2b4486');
    R(c, bx - 5, 44 + (tap && !eating ? 1 : 0), 4, 3, '#f2c39b');
    R(c, bx + 29, 44 + (!tap && !eating ? 1 : 0), 4, 3, '#f2c39b');

    // Head.
    const hx = 29;
    const hy = 6 + bob;
    box(c, hx, hy, 14, 15, '#3b2418', '#1a0e08');
    // Hair strands and a cowlick.
    for (let i = 0; i < 6; i++) R(c, hx + 2 + i * 2, hy + 3 + (i % 2), 1, 9 - (i % 3) * 2, '#2c1a10');
    R(c, hx + 2, hy + 1, 6, 2, '#5a3a26');
    R(c, hx + 3, hy + 2, 2, 1, '#7a5238');
    P(c, hx + 8, hy - 1, '#3b2418');
    P(c, hx + 9, hy - 2, '#3b2418');
    // Neck and ears peeking out.
    R(c, hx + 4, hy + 15, 6, 2, '#d9a47c');
    R(c, hx - 1, hy + 9, 1, 3, '#e8b48c');
    R(c, hx + 14, hy + 9, 1, 3, '#e8b48c');
    // Headphones.
    R(c, hx - 1, hy + 1, 16, 1, '#e8e3d9');
    R(c, hx + 1, hy, 12, 1, '#e8e3d9');
    box(c, hx - 2, hy + 6, 3, 6, '#1d1d1d');
    box(c, hx + 13, hy + 6, 3, 6, '#1d1d1d');
    P(c, hx - 1, hy + 7, '#ff7a47');
    if (eating) {
      // Turn to the side: cheek + chewing jaw.
      R(c, hx + 11, hy + 9, 4, 5, '#f2c39b');
      P(c, hx + 14, hy + 10, '#2a1208');
      R(c, hx + 13, hy + 12 + (chew ? 1 : 0), 2, 1, '#7a2a1a');
      P(c, hx + 12, hy + 11, 'rgba(255,110,110,0.8)');
    }

    // Counter.
    R(c, 0, 50, 72, 6, '#e2b574');
    R(c, 0, 50, 72, 1, '#f6d7a0');
    R(c, 0, 55, 72, 1, '#b98648');
    for (let x = 4; x < 72; x += 13) R(c, x, 52 + (x % 2), 6, 1, '#d4a563');

    // Laptop (lid back).
    R(c, 3, 36, 17, 14, '#c9ccd2');
    R(c, 3, 36, 17, 1, '#e6e8ec');
    R(c, 19, 36, 1, 14, '#9aa0a8');
    R(c, 2, 49, 20, 1, '#8a9098');
    // Glow from the screen.
    c.globalAlpha = 0.35 + Math.sin(this.t * 3) * 0.05;
    R(c, 0, 34, 24, 2, '#5ff3ff');
    c.globalAlpha = 1;
    // Sticker: tiny nigiri.
    R(c, 9, 42, 5, 2, '#f7f0e2');
    R(c, 8, 41, 7, 1, '#ff7a47');

    // Tea + plate.
    R(c, 52, 46, 14, 3, '#f4efe6');
    R(c, 53, 49, 12, 1, '#c9c0b0');
    R(c, 55, 44, 6, 2, '#f7f0e2');
    R(c, 54, 43, 8, 1, '#c21f33');
    R(c, 64, 40, 5, 7, '#5e7d3e');
    R(c, 64, 40, 5, 1, '#8aa860');

    // "PR merged" notification pops above the laptop.
    if (this.notif > 0) {
      const k = Math.min(1, (3.2 - this.notif) * 6, this.notif * 4);
      const ny = Math.round(22 + (1 - k) * 6);
      c.globalAlpha = k;
      box(c, 1, ny, 22, 9, '#f4ead7', '#1a0e08');
      box(c, 3, ny + 2, 5, 5, '#2f9e4f');
      P(c, 4, ny + 4, '#fff');
      P(c, 5, ny + 5, '#fff');
      P(c, 6, ny + 4, '#fff');
      P(c, 7, ny + 3, '#fff');
      R(c, 10, ny + 2, 11, 1, '#3b2a1a');
      R(c, 10, ny + 4, 8, 1, '#8a7a66');
      R(c, 10, ny + 6, 10, 1, '#8a7a66');
      R(c, 10, ny + 9, 2, 1, '#1a0e08');
      P(c, 11, ny + 10, '#1a0e08');
      c.globalAlpha = 1;
    }
  }
}
