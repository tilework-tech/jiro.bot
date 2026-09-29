// Fit a generated (upscaled, JPEG) frame back onto the 179px pixel grid of
// the reference: find scale + offset against the static parts of the scene,
// sample each cell's centre, snap colours to the reference's own colours.
window.JiroFit = (() => {
  const S = 179;
  const px = (d, w, x, y) => { const k = (y * w + x) * 4; return [d[k], d[k + 1], d[k + 2]]; };

  function align(ref, G, W, H, region) {
    const s0 = W / S;
    let best = { e: Infinity };
    const pts = [];
    for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (region(x, y)) pts.push([x, y]);
    const score = (s, ox, oy) => {
      let e = 0;
      for (const [x, y] of pts) {
        const gx = Math.floor(ox + (x + 0.5) * s), gy = Math.floor(oy + (y + 0.5) * s);
        if (gx < 0 || gy < 0 || gx >= W || gy >= H) { e += 30000; continue; }
        const a = px(ref, S, x, y), b = px(G, W, gx, gy);
        e += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
      }
      return e / pts.length;
    };
    for (let s = s0 * 0.94; s <= s0 * 1.06; s += s0 * 0.005)
      for (let ox = -24; ox <= 24; ox += 3) for (let oy = -24; oy <= 24; oy += 3) {
        const e = score(s, ox, oy);
        if (e < best.e) best = { e, s, ox, oy };
      }
    const b0 = best;
    for (let s = b0.s - s0 * 0.005; s <= b0.s + s0 * 0.005; s += s0 * 0.001)
      for (let ox = b0.ox - 3; ox <= b0.ox + 3; ox += 0.5) for (let oy = b0.oy - 3; oy <= b0.oy + 3; oy += 0.5) {
        const e = score(s, ox, oy);
        if (e < best.e) best = { e, s, ox, oy };
      }
    return best;
  }

  function resample(G, W, H, fit) {
    const out = new Uint8ClampedArray(S * S * 4);
    const { s, ox, oy } = fit;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let v = 0.3; v <= 0.71; v += 0.2) for (let u = 0.3; u <= 0.71; u += 0.2) {
        const gx = Math.floor(ox + (x + u) * s), gy = Math.floor(oy + (y + v) * s);
        if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
        const c = px(G, W, gx, gy); r += c[0]; g += c[1]; b += c[2]; n++;
      }
      const k = (y * S + x) * 4;
      out[k] = r / (n || 1); out[k + 1] = g / (n || 1); out[k + 2] = b / (n || 1); out[k + 3] = 255;
    }
    return out;
  }

  function snap(img, ref) {
    const pal = [];
    const seen = new Set();
    for (let i = 0; i < ref.length; i += 4) {
      const key = (ref[i] << 16) | (ref[i + 1] << 8) | ref[i + 2];
      if (!seen.has(key)) { seen.add(key); pal.push([ref[i], ref[i + 1], ref[i + 2]]); }
    }
    const cache = new Map();
    const out = new Uint8ClampedArray(img.length);
    for (let i = 0; i < img.length; i += 4) {
      const q = ((img[i] >> 2) << 12) | ((img[i + 1] >> 2) << 6) | (img[i + 2] >> 2);
      let c = cache.get(q);
      if (!c) {
        let bd = Infinity;
        for (const p of pal) {
          const d = (p[0] - img[i]) ** 2 * 0.3 + (p[1] - img[i + 1]) ** 2 * 0.59 + (p[2] - img[i + 2]) ** 2 * 0.11;
          if (d < bd) { bd = d; c = p; }
        }
        cache.set(q, c);
      }
      out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255;
    }
    return out;
  }

  return { align, resample, snap, S };
})();
