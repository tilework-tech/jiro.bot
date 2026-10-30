/* Host-page placement and safety policy for the scroll-buddy runtime. */
(function () {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 767.98px)");
  const overlaps = (a, b, gap = 0) => a.left - gap < b.right && a.right + gap > b.left &&
    a.top - gap < b.bottom && a.bottom + gap > b.top;
  const contains = (outer, inner) => inner.left >= outer.left && inner.right <= outer.right &&
    inner.top >= outer.top && inner.bottom <= outer.bottom;
  const rect = (x, y, width, height) => ({left: x, top: y, right: x + width, bottom: y + height});
  let buddy, mascot, bubble, close, status, probe;
  let protectedRects = [], sections = [], sectionNodes = [], hero;
  let frame = 0, settleTimer;
  const speechSizes = new Map();

  function measure() {
    hero = document.querySelector(".hero-row").getBoundingClientRect();
    sectionNodes = Array.from(document.querySelectorAll("[data-jiro-comment]"));
    sections = sectionNodes.map(node => node.getBoundingClientRect());
    protectedRects = Array.from(document.querySelectorAll("header, .hero-row, .hero-media, .cscroll, video, main a, main button, main input, main summary, footer a"))
      .filter(node => node.checkVisibility({visibilityProperty: true}))
      .map(node => node.getBoundingClientRect());
    for (const root of document.querySelectorAll("main, footer")) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode, parent = node.parentElement;
        if (!node.textContent.trim() || parent.closest('script, style, .sr-only, [aria-hidden="true"]') || !parent.checkVisibility({visibilityProperty: true})) continue;
        const box = parent.getBoundingClientRect();
        if (box.bottom < 0 || box.top > innerHeight) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        protectedRects.push(...range.getClientRects());
      }
    }
  }

  function flag(name, value) {
    if (buddy.hasAttribute(name) !== value) buddy.toggleAttribute(name, value);
  }
  function clear(box, margin = 8) {
    return contains(rect(margin, margin, innerWidth - margin * 2, innerHeight - margin * 2), box) &&
      !protectedRects.some(other => overlaps(box, other, 10));
  }
  function allowed() {
    return !buddy.hidden && !reduced.matches && !document.querySelector("dialog[open]") && hero.bottom <= 0;
  }
  function bubbleSize(section) {
    const key = `${innerWidth}:${section.dataset.jiroComment}`;
    if (!speechSizes.has(key)) {
      const style = getComputedStyle(bubble);
      for (const name of ['font', 'padding', 'border', 'maxWidth', 'minHeight', 'boxSizing', 'width', 'lineHeight', 'letterSpacing', 'textWrap', 'overflowWrap']) probe.style[name] = style[name];
      probe.style.width = 'max-content';
      probe.querySelector('p').textContent = section.dataset.jiroComment;
      const size = probe.getBoundingClientRect();
      speechSizes.set(key, {width: size.width, height: size.height});
    }
    return speechSizes.get(key);
  }
  function speechAt(x, y, size, below = false) {
    const left = Math.max(8, Math.min(innerWidth - size.width - 8, x + mascot.offsetWidth / 2 - size.width / 2));
    return rect(left, below ? y + mascot.offsetHeight + 14 : y - size.height - 14, size.width, size.height);
  }
  function safeSpeech(section, x, y, size) {
    for (const below of [false, true]) {
      const box = speechAt(x, y, size, below);
      if (contains(section, box) && clear(box)) return {box, below};
    }
    for (const side of ['left', 'right']) {
      const left = side === 'left' ? x - mascot.offsetWidth / 4 - size.width - 16 : x + mascot.offsetWidth * 1.25 + 16;
      const box = rect(left, y + (mascot.offsetHeight - size.height) / 2, size.width, size.height);
      if (contains(section, box) && clear(box)) return {box, side, below: false};
    }
    return null;
  }
  function position(event) {
    measure();
    const node = event.detail.section, section = node.getBoundingClientRect();
    const width = mascot.offsetWidth, height = mascot.offsetHeight;
    const size = bubbleSize(node);
    const anchor = document.querySelector(node.dataset.jiroAnchor) || node;
    const a = anchor.getBoundingClientRect();
    const spot = (mobile.matches ? node.dataset.jiroMobileSpot : node.dataset.jiroSpot).split(',').map(Number);
    const preferred = {x: a.left + a.width * spot[0] - width / 2, y: a.top + a.height * spot[1] - height / 2};
    const xs = [preferred.x], ys = [preferred.y];
    for (let x = Math.max(24 + width / 4, section.left + width / 4 + 12); x <= Math.min(innerWidth - width * 1.25 - 12, section.right - width * 1.25 - 12); x += 12) xs.push(x);
    for (let y = Math.max(12 + height / 2, section.top + height / 2 + 12); y <= Math.min(innerHeight - height - 12, section.bottom - height - 12); y += 12) ys.push(y);
    let best;
    for (const x of xs) for (const y of ys) {
      const body = rect(x - width / 4, y - height / 2 - 8, width * 1.5, height * 1.5 + 8);
      const control = rect(x + close.offsetLeft, y + close.offsetTop, close.offsetWidth, close.offsetHeight);
      if (!contains(section, body) || !clear(body) || !clear(control)) continue;
      const speech = safeSpeech(section, x, y, size);
      if (!speech) continue;
      const score = Math.hypot(x - preferred.x, y - Math.max(150, Math.min(innerHeight - height - 40, preferred.y)));
      if (!best || score < best.score) best = {x, y, score};
    }
    if (best) event.detail.point = {x: best.x + scrollX, y: best.y + scrollY};
  }
  function place() {
    if (!buddy) return;
    measure();
    if (!allowed() || buddy.matches('.jiro-buddy--pinned, .jiro-buddy--held')) return;
    const distance = box => Math.max(box.top - innerHeight / 2, innerHeight / 2 - box.bottom, 0);
    const index = sections.reduce((best, box, i) => best < 0 || distance(box) < distance(sections[best]) ? i : best, -1);
    if (index >= 0) buddy.dispatchEvent(new CustomEvent('jiro-buddy:refresh', {detail: {section: sectionNodes[index]}}));
    update();
  }
  function update() {
    if (!buddy) return;
    const box = mascot.getBoundingClientRect();
    const entering = ['peeking', 'flying'].includes(buddy.dataset.jiroState);
    const held = buddy.classList.contains('jiro-buddy--held');
    const section = sections.find(other => contains(other, box));
    const enabled = allowed();
    flag('data-site-ready', enabled);
    flag('data-site-entering', entering);
    const clipped = {left: Math.max(0, box.left), right: Math.min(innerWidth, box.right), top: box.top, bottom: box.bottom};
    const transient = entering && clipped.right > clipped.left && clipped.top >= 8 && clipped.bottom <= innerHeight - 8 &&
      !protectedRects.some(other => overlaps(clipped, other, 4));
    const visible = enabled && (transient || (!!section && clear(box) && clear(close.getBoundingClientRect())));
    flag("data-site-visible", visible);
    const grown = rect(box.left - mascot.offsetWidth / 4, box.top - mascot.offsetHeight / 2 - 8, mascot.offsetWidth * 1.5, mascot.offsetHeight * 1.5 + 8);
    // Speaking uses the runtime's smaller talking pose so a fixed pin keeps room for its line.
    flag('data-site-grow', visible && bubble.hidden && !entering && !held && !!section && contains(section, grown) && clear(grown));
    // An unsafe dragged pose is hidden without breaking its captured pointer stream.
    const interactive = visible || (enabled && held);
    if (buddy.inert === interactive) buddy.inert = !interactive;
    const ariaHidden = String(!visible);
    if (buddy.getAttribute("aria-hidden") !== ariaHidden) buddy.setAttribute("aria-hidden", ariaHidden);
    const text = buddy.querySelector('.jiro-buddy__text');
    const comment = text.textContent + (text.dataset.rest || '');
    const belongs = !!section && comment === sectionNodes[sections.indexOf(section)].dataset.jiroComment;
    let speech = false;
    if (visible && !entering && !bubble.hidden && belongs) {
      const size = bubbleSize(sectionNodes[sections.indexOf(section)]);
      const fit = safeSpeech(section, box.left, box.top, size);
      if (fit) {
        buddy.classList.toggle('jiro-buddy--below', fit.below);
        flag('data-site-speech-side', !!fit.side);
        for (const [name, value] of [['--site-bubble-left', `${fit.box.left - box.left}px`], ['--site-bubble-top', `${fit.box.top - box.top}px`]]) {
          if (bubble.style.getPropertyValue(name) !== value) bubble.style.setProperty(name, value);
        }
        speech = true;
      }
    }
    flag("data-site-speech", speech);
    const live = speech ? "polite" : "off";
    if (status.getAttribute("aria-live") !== live) status.setAttribute("aria-live", live);
  }
  function tick() { frame = 0; update(); animate(); }
  function animate() {
    if (!frame && !document.hidden && !reduced.matches && buddy && !buddy.hidden && sections.some(box => box.top < innerHeight && box.bottom > 0)) frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (!buddy) return;
    measure(); update(); animate();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(place, 1200);
  }
  const ready = new MutationObserver(() => {
    buddy = document.querySelector(".jiro-buddy");
    if (!buddy) return;
    ready.disconnect();
    mascot = buddy.querySelector(".jiro-buddy__mascot");
    bubble = buddy.querySelector(".jiro-buddy__bubble");
    close = buddy.querySelector(".jiro-buddy__close");
    status = buddy.querySelector(".jiro-buddy__sr");
    const layer = document.createElement('div');
    layer.className = 'jiro-buddy-layer';
    buddy.before(layer); layer.append(buddy);
    probe = document.createElement('div');
    probe.append(document.createElement('p'));
    probe.querySelector('p').style.margin = '0';
    probe.className = 'jiro-buddy-measure';
    probe.setAttribute('aria-hidden', 'true');
    layer.append(probe);
    buddy.addEventListener('jiro-buddy:place', position);
    new MutationObserver(() => { update(); animate(); }).observe(buddy, {subtree: true, attributes: true, childList: true});
    new MutationObserver(resume).observe(document.querySelector("dialog"), {attributes: true, attributeFilter: ["open"]});
    new ResizeObserver(resume).observe(document.querySelector("main"));
    resume();
  });
  ready.observe(document.body, {childList: true});
  addEventListener("scroll", resume, {passive: true});
  addEventListener("resize", resume);
  addEventListener("load", resume);
  document.addEventListener("toggle", resume, true);
  document.addEventListener("visibilitychange", resume);
  reduced.addEventListener("change", resume);
  mobile.addEventListener("change", resume);
})();
