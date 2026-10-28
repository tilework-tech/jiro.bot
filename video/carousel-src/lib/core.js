// Shared timeline helpers for the carousel scenes. Every visual is a pure
// function of the video time t (seconds), so any frame can be rendered alone.
// desktop 5:4 and mobile 4:5 match the hero carousel. The poster is square and
// keeps its content inside SAFE, the part that survives both crops.
export const CUTS = { desktop: [1200, 960], mobile: [720, 900], poster: [1080, 1080] };
const asked = new URLSearchParams(location.search).get('cut');
export const CUT = asked in CUTS ? asked : 'desktop';
export const [W, H] = CUTS[CUT];
export const SAFE = CUT === 'poster' ? [864, 864] : [W, H];
document.documentElement.style.width = document.body.style.width = `${W}px`;
document.documentElement.style.height = document.body.style.height = `${H}px`;
// The poster uses the mobile layout, framed into its safe square.
document.body.classList.add(`cut-${CUT === 'poster' ? 'mobile' : CUT}`);

// Camera key for a world box (x, y, w, h): centred, scaled to fill SAFE, at most `max`.
export const fit = (x, y, w, h, max = 2) => [x + w / 2, y + h / 2, Math.min(max, SAFE[0] / w, SAFE[1] / h)];

export const $ = (id) => document.getElementById(id);
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const prog = (t, a, d) => clamp((t - a) / d);
export const eo = (x) => 1 - Math.pow(1 - x, 3);
export const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const lerp = (a, b, p) => a + (b - a) * p;

// Calm typing: a fixed number of characters per second from `at`.
export const typed = (text, t, at, cps = 14) => text.slice(0, Math.max(0, Math.floor((t - at) * cps)));
export const typeEnd = (text, at, cps = 14) => at + text.length / cps;

// Slack-style @mentions inside already-escaped text.
export const fmt = (s) => s.replace(/@[A-Za-z][\w-]*/g, (m) => `<span class="mention">${m}</span>`);
export const caret = '<span class="caret"></span>';

export const show = (el, on) => { el.style.display = on ? '' : 'none'; };

// Fade and rise in at `at`.
export const reveal = (el, t, at, dur = 0.7, rise = 12) => {
  const p = eo(prog(t, at, dur));
  el.style.opacity = String(t < at ? 0 : p);
  el.style.transform = `translateY(${(1 - p) * rise}px)`;
};

// A message joining a bottom-anchored list: its slot opens (pushing older
// messages up), then it fades in. `fold` (0..1) closes it again for the loop.
// Heights and paddings are measured once in init().
export const grow = (el, t, at, fold = 0, dur = 0.8) => {
  const open = (t < at ? 0 : eio(prog(t, at, dur * 0.7))) * (1 - fold);
  el.style.height = `${Number(el.dataset.h) * open}px`;
  el.style.paddingTop = `${Number(el.dataset.pt) * open}px`;
  el.style.paddingBottom = `${Number(el.dataset.pb) * open}px`;
  el.style.opacity = String(eo(prog(t, at + dur * 0.35, dur * 0.65)) * (1 - fold));
};

// Three-dot "working" indicator.
export const dots = (el, t) => {
  el.querySelectorAll('i').forEach((d, i) => {
    d.style.opacity = String(0.35 + 0.65 * Math.max(0, Math.sin(t * Math.PI * 1.6 - i * 0.7)));
  });
};

// Camera: keys are [t, cx, cy, scale] with (cx, cy) the world point at the
// centre of the frame. Between keys it eases; before the first and after the
// last it holds.
export const camera = (t, keys) => {
  let k = keys[0];
  let [cx, cy, s] = [k[1], k[2], k[3]];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t >= a[0]) {
      const p = eio(prog(t, a[0], b[0] - a[0]));
      cx = lerp(a[1], b[1], p); cy = lerp(a[2], b[2], p); s = lerp(a[3], b[3], p);
    }
  }
  $('world').style.transform = `translate(${W / 2 - cx * s}px, ${H / 2 - cy * s}px) scale(${s})`;
};

// Cross-dissolve between shots: [{ id, from, to }] with fade seconds.
export const shots = (t, list, fade = 0.9) => {
  for (const s of list) {
    const el = $(s.id);
    const a = Math.min(s.from <= 0 ? 1 : prog(t, s.from, fade), s.to == null ? 1 : 1 - prog(t, s.to, fade));
    el.style.opacity = String(a);
    show(el, a > 0);
  }
};

// setup() fills final content before message heights are measured.
export const scene = ({ duration, seek, setup = () => {} }) => {
  window.__init = async () => {
    await Promise.all([...document.fonts].map((f) => f.load()));
    await document.fonts.ready;
    setup();
    document.querySelectorAll('.shot').forEach((el) => show(el, true));
    document.querySelectorAll('[data-grow]').forEach((el) => {
      const cs = getComputedStyle(el);
      Object.assign(el.dataset, { h: el.offsetHeight, pt: parseFloat(cs.paddingTop), pb: parseFloat(cs.paddingBottom) });
    });
    seek(0);
    return duration;
  };
  window.__seek = (t) => seek(((t % duration) + duration) % duration);
};
