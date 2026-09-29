// Jiro's counter scene, animated from the original pixel art. The frames are
// pre-rendered by art/builder.js + art/choreo.js into a sprite sheet: frame 0
// is the reference image, the rest move his arms to make sushi (pick up fish,
// bring it to the rice, press, serve it off the bottom toward the belt, scoop
// fresh rice). Eyes, mouth and the lamp are drawn live on top.

import sheetUrl from './assets/jiro-make.png';
import meta from './assets/jiro-make.json';

export const S = 179;

export interface Frame {
  canvas: HTMLCanvasElement;
  headDy: number;
  serve: boolean;
  ms: number;
}

const EYES = [
  { x: 72, y: 46, w: 6, h: 10 },
  { x: 89, y: 45, w: 4, h: 8 },
];
const MOUTH = { x: 70, y: 60, w: 17 };
export const LAMP = { x: 166, y: 8, x0: 148, y0: 0, x1: 179, y1: 24 };

export async function loadFrames(): Promise<Frame[]> {
  const img = new Image();
  img.src = sheetUrl;
  await img.decode();
  return meta.frames.map((f, i) => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    c.getContext('2d')!.drawImage(img, i * S, 0, S, S, 0, 0, S, S);
    return { canvas: c, headDy: f.headDy ? 0 : 0, serve: !!f.serve, ms: f.ms };
  });
}

export type JiroMood = 'idle' | 'happy' | 'chomp' | 'crunch' | 'serve' | 'hungry' | 'shock' | 'wave';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class Jiro {
  c: CanvasRenderingContext2D;
  t = 0;
  blinkT = 2.5;
  blinking = 0;
  lookX = 0;
  lookY = 0;
  mood: JiroMood = 'idle';
  moodT = 0;
  hungry = false;
  frames: Frame[] | null = null;
  ready: Promise<void>;
  index = 0;
  frameT = 0;
  onServe?: () => void;

  constructor(public canvas: HTMLCanvasElement) {
    canvas.width = S;
    canvas.height = S;
    this.c = canvas.getContext('2d')!;
    this.ready = loadFrames().then((f) => {
      this.frames = f;
    });
  }

  set(m: JiroMood, dur: number) {
    this.mood = m;
    this.moodT = dur;
  }

  // Serving is part of the sushi-making loop now; kept for callers.
  serve() {}

  look(dx: number, dy: number) {
    this.lookX = Math.abs(dx) < 50 ? 0 : Math.sign(dx);
    this.lookY = dy > 90 ? 1 : dy < -90 ? -1 : 0;
  }

  frame(): Frame | null {
    return this.frames ? this.frames[this.index] : null;
  }

  mouthNorm() {
    const dy = this.frame()?.headDy ?? 0;
    return { x: (MOUTH.x + MOUTH.w / 2) / S, y: (MOUTH.y + 1 + dy) / S };
  }

  // The paper lamp is the lucky charm now.
  catHit(nx: number, ny: number) {
    const x = nx * S;
    const y = ny * S;
    return x >= LAMP.x0 && x <= LAMP.x1 && y >= LAMP.y0 && y <= LAMP.y1;
  }

  update(dt: number) {
    this.t += dt;
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blinking = 0.12;
      this.blinkT = rnd(2.2, 5.5);
      if (Math.random() < 0.2) this.blinkT = 0.25;
    }
    this.blinking = Math.max(0, this.blinking - dt);
    if (this.moodT > 0) {
      this.moodT -= dt;
      if (this.moodT <= 0) this.mood = 'idle';
    }
    if (this.frames) {
      this.frameT += dt * 1000;
      while (this.frameT >= this.frames[this.index].ms) {
        this.frameT -= this.frames[this.index].ms;
        this.index = (this.index + 1) % this.frames.length;
        if (this.frames[this.index].serve) this.onServe?.();
      }
    }
    const f = this.frame();
    if (f) this.drawFrame(f);
  }

  drawFrame(f: Frame) {
    const c = this.c;
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.drawImage(f.canvas, 0, 0);
    const dy = f.headDy;

    // Lamp flicker and a slow eye-glow pulse.
    const flick = 0.12 + Math.sin(this.t * 6.5) * 0.03 + (Math.random() < 0.03 ? 0.1 : 0);
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(LAMP.x, LAMP.y, 2, LAMP.x, LAMP.y, 46);
    g.addColorStop(0, `rgba(255,214,150,${flick})`);
    g.addColorStop(1, 'rgba(255,214,150,0)');
    c.fillStyle = g;
    c.fillRect(LAMP.x - 46, 0, 92, LAMP.y + 46);
    const pulse = 0.1 + Math.sin(this.t * 2.4) * 0.05;
    for (const e of EYES) {
      const ex = e.x + e.w / 2;
      const ey = e.y + dy + e.h / 2;
      const eg = c.createRadialGradient(ex, ey, 1, ex, ey, 9);
      eg.addColorStop(0, `rgba(95,243,255,${pulse})`);
      eg.addColorStop(1, 'rgba(95,243,255,0)');
      c.fillStyle = eg;
      c.fillRect(ex - 9, ey - 9, 18, 18);
    }
    c.globalCompositeOperation = 'source-over';

    // Eyes: untouched original unless blinking, looking, or emoting.
    const happy = this.mood === 'happy' || this.mood === 'chomp';
    const shock = this.mood === 'crunch' || this.mood === 'shock';
    const blink = this.blinking > 0;
    const looking = this.lookX !== 0 || this.lookY !== 0;
    if (blink || happy || shock || looking) {
      for (const e of EYES) {
        const x = e.x;
        const y = e.y + dy;
        c.fillStyle = '#1b2240';
        c.fillRect(x, y, e.w, e.h);
        if (blink) {
          c.fillStyle = '#5ff3ff';
          c.fillRect(x, y + Math.floor(e.h / 2), e.w, 1);
        } else if (happy) {
          c.fillStyle = '#5ff3ff';
          const mid = (e.w - 1) / 2;
          for (let i = 0; i < e.w; i++) c.fillRect(x + i, y + 3 + Math.round(Math.abs(i - mid)), 1, 2);
        } else if (shock) {
          c.fillStyle = '#e8ffff';
          c.fillRect(x, y, e.w, e.h);
          c.fillStyle = '#5ff3ff';
          c.fillRect(x + 1, y + 1, e.w - 2, e.h - 2);
        } else {
          const ox = Math.max(0, Math.min(1, this.lookX + 0.5)) | 0;
          const oy = this.lookY > 0 ? 2 : this.lookY < 0 ? 0 : 1;
          c.fillStyle = '#2a8fd8';
          c.fillRect(x + ox - (this.lookX < 0 ? 0 : 0), y + oy, e.w - 1, e.h - 2);
          c.fillStyle = '#5ff3ff';
          c.fillRect(x + ox + 1, y + oy + 1, e.w - 3, e.h - 4);
          c.fillStyle = '#e8ffff';
          c.fillRect(x + ox + 1, y + oy + 1, 1, 2);
        }
      }
    }

    // Mouth: only appears to chew or when food is close.
    const chew = this.mood === 'chomp' || this.mood === 'crunch';
    const open = (chew && Math.floor(this.t * 10) % 2 === 0) || this.mood === 'hungry' || this.hungry;
    if (open || chew) {
      const my = MOUTH.y + dy;
      c.fillStyle = '#6a5a4c';
      c.fillRect(MOUTH.x - 1, my - 1, MOUTH.w + 2, open ? 5 : 2);
      c.fillStyle = '#0b0d12';
      c.fillRect(MOUTH.x, my, MOUTH.w, open ? 3 : 1);
      if (open) {
        c.fillStyle = '#e8e2d4';
        for (let i = 0; i < MOUTH.w; i += 2) c.fillRect(MOUTH.x + i, my, 1, 1);
        c.fillStyle = 'rgba(95,243,255,0.8)';
        c.fillRect(MOUTH.x + 1, my + 2, MOUTH.w - 2, 1);
      }
    }
  }

}
