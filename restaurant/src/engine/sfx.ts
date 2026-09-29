// Tiny WebAudio synth. Off until the first user gesture; toggled by the sound pill.

let ac: AudioContext | null = null;
export let soundOn = localStorage.getItem("jiro-sound") !== "off";

export function setSound(on: boolean) {
  soundOn = on;
  localStorage.setItem("jiro-sound", on ? "on" : "off");
}

function ctx(): AudioContext | null {
  if (!soundOn) return null;
  if (!ac) {
    try { ac = new AudioContext(); } catch { return null; }
  }
  if (ac.state === "suspended") ac.resume();
  return ac;
}

function tone(f0: number, f1: number, dur: number, type: OscillatorType, vol = 0.08, delay = 0) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), gn = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.12, lp = 1200) {
  const a = ctx();
  if (!a) return;
  const b = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), gn = a.createGain();
  s.buffer = b; f.type = "lowpass"; f.frequency.value = lp; gn.gain.value = vol;
  s.connect(f).connect(gn).connect(a.destination);
  s.start();
}

export function sfx(name: string) {
  switch (name) {
    case "pop": tone(500, 900, 0.08, "square", 0.05); break;
    case "blip": tone(880, 1320, 0.07, "square", 0.04); break;
    case "quack": tone(420, 260, 0.14, "sawtooth", 0.06); tone(400, 250, 0.12, "sawtooth", 0.05, 0.16); break;
    case "boom": noise(0.6, 0.25, 500); tone(120, 40, 0.5, "sine", 0.15); break;
    case "coin": tone(988, 988, 0.08, "square", 0.05); tone(1319, 1319, 0.25, "square", 0.05, 0.08); break;
    case "meow": tone(700, 1000, 0.12, "triangle", 0.06); tone(1000, 500, 0.25, "triangle", 0.06, 0.12); break;
    case "splash": noise(0.5, 0.18, 2200); break;
    case "whoosh": noise(0.35, 0.08, 900); break;
    case "bonk": tone(220, 110, 0.12, "square", 0.07); break;
    case "chime": tone(1568, 1568, 0.3, "sine", 0.05); tone(2093, 2093, 0.4, "sine", 0.04, 0.1); break;
  }
}
