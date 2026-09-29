(() => {
  const qs = new URLSearchParams(location.search);
  const V = window.VARIANTS.find((x) => x.id === qs.get('v')) || window.VARIANTS[0];
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(V.pal)) root.setProperty('--' + k, v);
  root.setProperty('--fd', V.font.d); root.setProperty('--fb', V.font.b); root.setProperty('--dw', V.font.dw);
  root.setProperty('--dscale', V.font.big || V.font.small || 1);
  if (V.font.it) root.setProperty('--it', 'italic');
  document.body.classList.add('t-' + V.id);
  document.title = `jiro.bot · ${V.n}. ${V.name}`;

  // 1. hero
  $('hero-img').src = `art/${V.id}-hero.webp`;
  $('eyebrow').textContent = V.eyebrow;
  $('hero-sub').textContent = V.sub;

  // 2. product tour (Playwright captures of the real UI)
  fetch('ui/ui.json').then((r) => r.json()).then((ui) => {
    let cur = 'chat';
    const tabs = $('ui-tabs'), img = $('ui-img'), hs = $('hotspots');
    ui.screens.forEach((s) => { const b = document.createElement('button'); b.textContent = s.name; b.dataset.id = s.id; b.onclick = () => show(s.id); tabs.append(b); });
    function show(id) {
      cur = id; img.classList.add('swap');
      const next = new Image(); next.src = `ui/${id}-${V.ui}.jpg`;
      next.onload = () => { img.src = next.src; img.classList.remove('swap'); };
      $('url-path').textContent = id;
      [...tabs.children].forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      hs.innerHTML = '';
      for (const h of ui.hot[id] || []) {
        if (h.to === id) continue;
        const d = document.createElement('div'); d.className = 'hot'; d.dataset.label = h.label;
        Object.assign(d.style, { left: (Math.max(0, h.x) / 14.4) + '%', top: (Math.max(0, h.y) / 9) + '%', width: (h.w / 14.4) + '%', height: (h.h / 9) + '%' });
        d.onclick = () => show(h.to); hs.append(d);
      }
    }
    show(cur);
    $('tiny-jiro').onclick = () => { const i = ui.screens.findIndex((s) => s.id === cur); show(ui.screens[(i + 1) % ui.screens.length].id); };
    $('screen').addEventListener('mouseenter', () => { $('screen').classList.add('hint-on'); setTimeout(() => $('screen').classList.remove('hint-on'), 900); }, { once: true });
  });

  // 3. comparison (Playwright recordings)
  $('dining-img').src = `art/${V.id}-dining.webp`;
  const vg = $('vid-generic'), vj = $('vid-jiro');
  for (const [el, side] of [[vg, 'generic'], [vj, 'jiro']]) { el.poster = `rec/${V.task}-${side}.jpg`; el.innerHTML = `<source src="rec/${V.task}-${side}.webm" type="video/webm"><source src="rec/${V.task}-${side}.mp4" type="video/mp4">`; el.load(); }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { vg.currentTime = vj.currentTime = 0; vg.play().catch(() => {}); vj.play().catch(() => {}); }
    else { vg.pause(); vj.pause(); }
  }, { threshold: 0.35 }).observe($('antislop'));

  // 4. FAQ
  $('counter-img').src = `art/${V.id}-counter.webp`;
  V.faq.forEach(([q, a], i) => {
    const b = document.createElement('button'); b.className = 'sushi'; b.style.setProperty('--i', i);
    b.innerHTML = `<span class="qb"></span><img src="art/sushi-${i % 6}.png" alt="">`;
    b.querySelector('.qb').textContent = q;
    b.onclick = () => { $('bq').textContent = q; $('ba').textContent = a; $('answer').hidden = false; };
    $('sushi-row').append(b);
  });
  $('close').onclick = () => { $('answer').hidden = true; };
  $('answer').onclick = (e) => { if (e.target === $('answer')) $('answer').hidden = true; };

  // 5. pricing: night ride pans with scroll
  const bike = $('bike-bg'); bike.style.backgroundImage = `url(art/${V.id}-bike.webp)`;

  // 6. ending
  $('koi-img').src = `art/${V.id}-koi.webp`;
  new IntersectionObserver(([e]) => $('ending').classList.toggle('in', e.isIntersecting), { threshold: 0.3 }).observe($('ending'));

  // Belt: one continuous path from the hero belt exit, down the left, across, down the right, into the pond.
  const layer = $('belt-layer'), path = $('belt-path'), rollers = $('belt-rollers'), platesEl = $('plates');
  let total = 0, plates = [], endPt = null;
  const page = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  function build() {
    layer.style.height = document.documentElement.scrollHeight + 'px';
    const W = document.documentElement.clientWidth, L = 40, R = W - 40, r = 70;
    const hf = page(document.querySelector('.hero-frame')), cmp = page($('antislop')), ks = page($('koi-stage'));
    const x0 = hf.x + V.exit * hf.w, y0 = hf.y + hf.h - 30;
    const yA = hf.y + hf.h + 150, yX = cmp.y + cmp.h - 80, yE = ks.y + ks.h * 0.18;
    const d = [`M ${x0} ${y0}`, `C ${x0} ${y0 + 90}, ${L} ${yA - 90}, ${L} ${yA}`, `L ${L} ${yX - r}`, `Q ${L} ${yX} ${L + r} ${yX}`, `L ${R - r} ${yX}`, `Q ${R} ${yX} ${R} ${yX + r}`, `L ${R} ${yE}`].join(' ');
    path.setAttribute('d', d); rollers.setAttribute('d', d);
    total = path.getTotalLength();
    endPt = { x: R, y: yE, mx: ks.x + V.mouth[0] * ks.w, my: ks.y + V.mouth[1] * ks.h };
    const n = Math.floor(total / 190);
    if (plates.length !== n) {
      platesEl.innerHTML = ''; plates = [];
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div'); el.className = 'plate';
        el.innerHTML = `<img src="art/sushi-${i % 6}.png" alt=""><span class="lbl"></span>`;
        el.querySelector('.lbl').textContent = V.plates[i % V.plates.length];
        platesEl.append(el); plates.push({ el, i, prev: 0 });
      }
    }
  }
  let off = 0, last = performance.now(), lastY = scrollY, boost = 0;
  function eat(i) {
    const f = document.createElement('div'); f.className = 'plate';
    f.innerHTML = `<img src="art/sushi-${i % 6}.png" alt="">`;
    f.style.transform = `translate(${endPt.x}px, ${endPt.y}px)`; platesEl.append(f);
    const vis = $('ending').classList.contains('in');
    f.animate([{ transform: `translate(${endPt.x}px, ${endPt.y}px) scale(1)` }, { transform: `translate(${(endPt.x + endPt.mx) / 2}px, ${endPt.y - 140}px) scale(1.3) rotate(-160deg)`, offset: 0.45 },
      { transform: `translate(${endPt.mx}px, ${endPt.my}px) scale(.3) rotate(-320deg)`, opacity: vis ? 1 : 0 }], { duration: 900, easing: 'ease-in' }).onfinish = () => {
      f.remove();
      if (!vis) return;
      const s = $('splash'), ks = page($('koi-stage'));
      s.style.left = (endPt.mx - ks.x) + 'px'; s.style.top = (endPt.my - ks.y) + 'px';
      s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
      $('koi-stage').classList.remove('chomp'); void s.offsetWidth; $('koi-stage').classList.add('chomp');
    };
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    boost = boost * 0.92 + Math.abs(scrollY - lastY) * 0.9; lastY = scrollY;
    off += dt * (46 + boost * 6);
    if (total) {
      const gap = total / plates.length;
      for (const p of plates) {
        const d = (off + p.i * gap) % total;
        if (d < p.prev) eat(p.i);
        p.prev = d;
        const pt = path.getPointAtLength(d);
        const fade = Math.min(1, d / 60, (total - d) / 60);
        p.el.style.transform = `translate(${pt.x}px, ${pt.y}px)`; p.el.style.opacity = fade;
      }
    }
    const bb = page(bike.parentElement), prog = (scrollY + innerHeight - bb.y) / (bb.h + innerHeight);
    bike.style.backgroundPosition = `${70 - Math.max(0, Math.min(1, prog)) * 40}% 100%`;
    requestAnimationFrame(tick);
  }
  addEventListener('load', build); addEventListener('resize', build);
  document.querySelectorAll('img').forEach((i) => i.addEventListener('load', build));
  build(); requestAnimationFrame(tick);
})();
