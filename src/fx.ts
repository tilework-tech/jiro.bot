// Particles, floating text, and screen shake. Everything lives in document
// coordinates; the renderer subtracts the scroll offset.

export type PType =
  | 'dot'
  | 'rice'
  | 'spark'
  | 'star'
  | 'heart'
  | 'note'
  | 'smoke'
  | 'drop'
  | 'confetti'
  | 'z'
  | 'sesame'
  | 'ring'
  | 'flame'
  | 'shard';

interface P {
  type: PType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  text?: string;
}

interface FText {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
  size: number;
  rot: number;
  font: string;
}

export interface BurstOpts {
  speed?: number;
  spread?: number;
  angle?: number;
  size?: number;
  life?: number;
  g?: number;
  drag?: number;
  colors?: string[];
  vx?: number;
  vy?: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: T[]) => arr[(Math.random() * arr.length) | 0];

const DEFAULT_COLORS: Partial<Record<PType, string[]>> = {
  rice: ['#fffaf0', '#f4ecd9', '#ffffff'],
  spark: ['#fff3b0', '#ffd166', '#ffb347'],
  star: ['#ffd166', '#fff3b0', '#ff9f43'],
  heart: ['#ff4d7a', '#ff7a9c', '#ff3b6b'],
  note: ['#f4ead7', '#ffd9b8', '#5ff3ff'],
  smoke: ['rgba(240,232,220,0.7)', 'rgba(210,200,190,0.6)'],
  drop: ['#9ad7ff', '#c9ecff', '#6fc3ff'],
  confetti: ['#ff7b4f', '#ffd166', '#a6c94a', '#5ff3ff', '#ff4d7a', '#f4ead7'],
  z: ['#cfe8ff'],
  sesame: ['#f4e6c6', '#2a2018'],
  ring: ['rgba(255,255,255,0.8)'],
  flame: ['#b7f36b', '#e8ff9e', '#7fd13b', '#ffffff'],
  shard: ['#8f887f', '#a9a298', '#6f6961'],
  dot: ['#f4ead7'],
};

export class FX {
  ps: P[] = [];
  texts: FText[] = [];
  shakeAmt = 0;
  shakeX = 0;
  shakeY = 0;
  flash = 0;
  flashColor = '255,255,255';

  burst(type: PType, x: number, y: number, n: number, o: BurstOpts = {}) {
    const colors = o.colors ?? DEFAULT_COLORS[type] ?? ['#fff'];
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? -Math.PI / 2) + rnd(-1, 1) * (o.spread ?? Math.PI);
      const sp = (o.speed ?? 300) * rnd(0.35, 1);
      const life = (o.life ?? 0.9) * rnd(0.6, 1.2);
      this.ps.push({
        type,
        x,
        y,
        vx: Math.cos(a) * sp + (o.vx ?? 0),
        vy: Math.sin(a) * sp + (o.vy ?? 0),
        g: o.g ?? (type === 'smoke' || type === 'z' || type === 'note' || type === 'heart' ? -60 : 900),
        drag: o.drag ?? (type === 'smoke' ? 2.5 : 0.6),
        life,
        max: life,
        size: (o.size ?? 1) * rnd(0.7, 1.3),
        color: pick(colors),
        rot: rnd(0, Math.PI * 2),
        vr: rnd(-8, 8),
        text: type === 'note' ? pick(['♪', '♫', '♬']) : type === 'z' ? 'z' : undefined,
      });
    }
  }

  ring(x: number, y: number, size = 1, color = 'rgba(255,255,255,0.8)') {
    this.ps.push({ type: 'ring', x, y, vx: 0, vy: 0, g: 0, drag: 0, life: 0.5, max: 0.5, size, color, rot: 0, vr: 0 });
  }

  text(x: number, y: number, text: string, o: { color?: string; size?: number; life?: number; font?: string } = {}) {
    const life = o.life ?? 1.3;
    this.texts.push({
      x,
      y,
      text,
      life,
      max: life,
      color: o.color ?? '#f4ead7',
      size: o.size ?? 20,
      rot: rnd(-0.12, 0.12),
      font: o.font ?? 'Fraunces',
    });
  }

  shake(amount: number) {
    this.shakeAmt = Math.min(28, this.shakeAmt + amount);
  }

  doFlash(a = 0.5, color = '255,255,255') {
    this.flash = a;
    this.flashColor = color;
  }

  update(dt: number) {
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.ps[i] = this.ps[this.ps.length - 1];
        this.ps.pop();
        continue;
      }
      p.vy += p.g * dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.type === 'z' || p.type === 'note') p.x += Math.sin(p.life * 6) * 0.6;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 40 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    this.shakeAmt *= Math.exp(-7 * dt);
    if (this.shakeAmt < 0.2) this.shakeAmt = 0;
    this.shakeX = (Math.random() * 2 - 1) * this.shakeAmt;
    this.shakeY = (Math.random() * 2 - 1) * this.shakeAmt;
    this.flash *= Math.exp(-6 * dt);
    if (this.ps.length > 1400) this.ps.splice(0, this.ps.length - 1400);
  }

  draw(c: CanvasRenderingContext2D, top: number, bottom: number) {
    for (const p of this.ps) {
      if (p.y < top - 60 || p.y > bottom + 60) continue;
      const k = p.life / p.max;
      c.save();
      c.globalAlpha = Math.min(1, k * 2);
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.strokeStyle = p.color;
      const s = p.size;
      switch (p.type) {
        case 'rice':
          c.beginPath();
          c.ellipse(0, 0, 3.4 * s, 2 * s, 0, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = 'rgba(150,130,100,0.4)';
          c.lineWidth = 0.6;
          c.stroke();
          break;
        case 'sesame':
          c.beginPath();
          c.ellipse(0, 0, 2 * s, 1.1 * s, 0, 0, Math.PI * 2);
          c.fill();
          break;
        case 'spark':
          c.rotate(-p.rot + Math.atan2(p.vy, p.vx));
          c.globalCompositeOperation = 'lighter';
          c.fillRect(-6 * s, -1 * s, 12 * s, 2 * s);
          break;
        case 'star': {
          c.globalCompositeOperation = 'lighter';
          const r = 6 * s * (0.5 + k * 0.5);
          c.beginPath();
          for (let i = 0; i < 8; i++) {
            const rr = i % 2 ? r * 0.35 : r;
            const a = (i / 8) * Math.PI * 2;
            c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          c.closePath();
          c.fill();
          break;
        }
        case 'heart':
          c.rotate(-p.rot * 0.9);
          c.scale(s * 1.2, s * 1.2);
          c.beginPath();
          c.moveTo(0, 5);
          c.bezierCurveTo(-8, -1, -5, -8, 0, -4);
          c.bezierCurveTo(5, -8, 8, -1, 0, 5);
          c.fill();
          break;
        case 'note':
        case 'z':
          c.rotate(-p.rot * 0.95);
          c.font = `${p.type === 'z' ? 'italic 700' : '700'} ${Math.round(18 * s)}px Fraunces, serif`;
          c.textAlign = 'center';
          c.fillText(p.text!, 0, 0);
          break;
        case 'smoke': {
          const r = 14 * s * (1.6 - k * 0.8);
          c.globalAlpha = k * 0.7;
          c.beginPath();
          c.arc(0, 0, r, 0, Math.PI * 2);
          c.fill();
          break;
        }
        case 'drop':
          c.rotate(-p.rot + Math.atan2(p.vy, p.vx) - Math.PI / 2);
          c.beginPath();
          c.ellipse(0, 0, 2.2 * s, 4 * s, 0, 0, Math.PI * 2);
          c.fill();
          break;
        case 'confetti':
          c.scale(1, Math.cos(p.rot * 2));
          c.fillRect(-4 * s, -2.5 * s, 8 * s, 5 * s);
          break;
        case 'ring':
          c.globalAlpha = k;
          c.lineWidth = 3 * k;
          c.beginPath();
          c.arc(0, 0, (1 - k) * 60 * s + 6, 0, Math.PI * 2);
          c.stroke();
          break;
        case 'flame': {
          c.globalCompositeOperation = 'lighter';
          const r = 7 * s * k + 1;
          c.beginPath();
          c.arc(0, 0, r, 0, Math.PI * 2);
          c.fill();
          break;
        }
        case 'shard':
          c.beginPath();
          c.moveTo(-5 * s, -3 * s);
          c.lineTo(5 * s, -1 * s);
          c.lineTo(1 * s, 4 * s);
          c.closePath();
          c.fill();
          break;
        default:
          c.beginPath();
          c.arc(0, 0, 3 * s, 0, Math.PI * 2);
          c.fill();
      }
      c.restore();
    }
    for (const t of this.texts) {
      if (t.y < top - 60 || t.y > bottom + 60) continue;
      const k = t.life / t.max;
      const age = t.max - t.life;
      const pop = age < 0.18 ? 0.4 + (age / 0.18) * 0.75 : age < 0.3 ? 1.15 - ((age - 0.18) / 0.12) * 0.15 : 1;
      c.save();
      c.translate(t.x, t.y);
      c.rotate(t.rot);
      c.scale(pop, pop);
      c.globalAlpha = Math.min(1, k * 3);
      c.font = `italic 700 ${t.size}px ${t.font}, Georgia, serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.lineJoin = 'round';
      c.lineWidth = 5;
      c.strokeStyle = 'rgba(18,13,10,0.9)';
      c.strokeText(t.text, 0, 0);
      c.fillStyle = t.color;
      c.fillText(t.text, 0, 0);
      c.restore();
    }
  }
}
