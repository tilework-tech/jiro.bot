/* Host-page safety policy for the pinned, unmodified scroll-buddy runtime. */
(function () {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 767.98px)");
  const overlaps = (a, b, gap = 0) => a.left - gap < b.right && a.right + gap > b.left &&
    a.top - gap < b.bottom && a.bottom + gap > b.top;
  const contains = (outer, inner) => inner.left >= outer.left && inner.right <= outer.right &&
    inner.top >= outer.top && inner.bottom <= outer.bottom;
  let buddy;
  let mascot;
  let bubble;
  let close;
  let status;
  let protectedRects = [];
  let sections = [];
  let sectionNodes = [];
  let hero;
  let frame = 0;
  let settleTimer;
  let mobileSection;

  function measure() {
    hero = document.querySelector(".hero-row").getBoundingClientRect();
    sectionNodes = Array.from(document.querySelectorAll("[data-jiro-comment]"));
    sections = sectionNodes.map(node => node.getBoundingClientRect());
    if (reduced.matches || document.querySelector("dialog[open]") ||
        !sections.some(rect => rect.top < innerHeight && rect.bottom > 0)) {
      protectedRects = [];
      return;
    }
    protectedRects = Array.from(document.querySelectorAll("header, .hero-row, .hero-media, .cscroll, video, main a, main button, main input, main summary, footer a"))
      .filter(node => node.checkVisibility({visibilityProperty: true}))
      .map(node => node.getBoundingClientRect());
    // Text ranges protect the glyphs while leaving genuinely empty panel space usable.
    for (const root of document.querySelectorAll("main, footer")) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
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

  function clear(rect) {
    return contains({left: 8, top: 8, right: innerWidth - 8, bottom: innerHeight - 8}, rect) &&
      !protectedRects.some(other => overlaps(rect, other, 10));
  }

  function placeMobile() {
    if (!buddy) return;
    if (!mobile.matches || buddy.matches('.jiro-buddy--pinned, .jiro-buddy--held')) {
      flag('data-site-mobile', false);
      return;
    }
    measure();
    if (reduced.matches || buddy.hidden || document.querySelector('dialog[open]') || hero.bottom > 0) return;
    // Match the runtime's active section so comments still belong to the resting place.
    const distance = rect => Math.max(rect.top - innerHeight / 2, innerHeight / 2 - rect.bottom, 0);
    const index = sections.reduce((best, rect, i) => best < 0 || distance(rect) < distance(sections[best]) ? i : best, -1);
    if (index < 0) return;
    const section = sections[index];
    const node = sectionNodes[index];
    const box = mascot.getBoundingClientRect();
    const closeBox = close.getBoundingClientRect();
    if (mobileSection === node && contains(section, box) && clear(box) && clear(closeBox)) return;
    const width = mascot.offsetWidth, height = mascot.offsetHeight;
    const closeLeft = close.offsetLeft;
    const closeTop = close.offsetTop;
    const fits = (x, y) => {
      const body = {left: x, top: y, right: x + width, bottom: y + height};
      const control = {left: x + closeLeft, top: y + closeTop, right: x + closeLeft + close.offsetWidth, bottom: y + closeTop + close.offsetHeight};
      return contains(section, body) && contains(section, control) && clear(body) && clear(control);
    };
    const spot = node.dataset.jiroMobileSpot.split(',').map(Number);
    const anchor = document.querySelector(node.dataset.jiroAnchor) || node;
    const anchorBox = anchor.getBoundingClientRect();
    const preferred = {x: anchorBox.left + anchorBox.width * spot[0] - width / 2,
      y: anchorBox.top + anchorBox.height * spot[1] - height / 2};
    // Search visible space more finely than the upstream section-relative grid.
    const xs = [preferred.x];
    const ys = [preferred.y];
    for (let x = Math.max(18, section.left - closeLeft); x <= Math.min(innerWidth - width - 8, section.right - width); x += 12) xs.push(x);
    for (let y = Math.max(8 - closeTop, section.top - closeTop); y <= Math.min(innerHeight - height - 8, section.bottom - height); y += 12) ys.push(y);
    let best;
    for (const x of xs) for (const y of ys) {
      if (!fits(x, y)) continue;
      const score = Math.hypot(x - preferred.x, y - Math.max(80, Math.min(innerHeight - height - 40, preferred.y)));
      if (!best || score < best.score) best = {x, y, score};
    }
    if (!best) return;
    buddy.style.setProperty('--site-buddy-x', `${best.x + scrollX}px`);
    buddy.style.setProperty('--site-buddy-y', `${best.y + scrollY}px`);
    mobileSection = node;
    flag('data-site-mobile', true);
    update();
  }

  function update() {
    if (!buddy) return;
    const box = mascot.getBoundingClientRect();
    const section = sections.find(rect => contains(rect, box));
    if (!mobile.matches || buddy.matches('.jiro-buddy--pinned, .jiro-buddy--held')) flag('data-site-mobile', false);
    const visible = !buddy.hidden && !reduced.matches && !document.querySelector("dialog[open]") &&
      hero.bottom <= 0 && !!section && clear(box) && clear(close.getBoundingClientRect());
    flag("data-site-visible", visible);
    if (buddy.inert === visible) buddy.inert = !visible;
    const ariaHidden = String(!visible);
    if (buddy.getAttribute("aria-hidden") !== ariaHidden) buddy.setAttribute("aria-hidden", ariaHidden);
    const text = buddy.querySelector('.jiro-buddy__text');
    const comment = text.textContent + (text.dataset.rest || '');
    const belongs = !!section && comment === sectionNodes[sections.indexOf(section)].dataset.jiroComment;
    const speech = visible && !bubble.hidden && belongs && contains(section, bubble.getBoundingClientRect()) && clear(bubble.getBoundingClientRect());
    flag("data-site-speech", speech);
    const live = speech ? "polite" : "off";
    if (status.getAttribute("aria-live") !== live) status.setAttribute("aria-live", live);
  }

  function refresh() {
    measure();
    update();
  }

  function tick() {
    frame = 0;
    update();
    // Transforms (including a dragged or restored pin) can cross protected content.
    animate();
  }

  function animate() {
    if (!frame && !document.hidden && !reduced.matches && buddy && !buddy.hidden &&
        sections.some(rect => rect.top < innerHeight && rect.bottom > 0)) frame = requestAnimationFrame(tick);
  }

  function resume() {
    refresh();
    animate();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(placeMobile, 1200);
  }

  const ready = new MutationObserver(() => {
    buddy = document.querySelector(".jiro-buddy");
    if (!buddy) return;
    ready.disconnect();
    mascot = buddy.querySelector(".jiro-buddy__mascot");
    bubble = buddy.querySelector(".jiro-buddy__bubble");
    close = buddy.querySelector(".jiro-buddy__close");
    status = buddy.querySelector(".jiro-buddy__sr");
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
