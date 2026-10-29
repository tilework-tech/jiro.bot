/* Host-page safety policy for the pinned, unmodified scroll-buddy runtime. */
(function () {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
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
  let hero;
  let frame = 0;

  function measure() {
    hero = document.querySelector(".hero-row").getBoundingClientRect();
    sections = Array.from(document.querySelectorAll("[data-jiro-comment]"), node => node.getBoundingClientRect());
    if (reduced.matches || document.querySelector("dialog[open]") ||
        !sections.some(rect => rect.top < innerHeight && rect.bottom > 0)) {
      protectedRects = [];
      return;
    }
    protectedRects = Array.from(document.querySelectorAll("header, .hero-row, .hero-media, #compare, video, main a, main button, main input, main summary, footer a"))
      .filter(node => node.checkVisibility({visibilityProperty: true}))
      .map(node => node.getBoundingClientRect());
    // Text ranges protect the glyphs while leaving genuinely empty panel space usable.
    for (const root of document.querySelectorAll("main, footer")) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!node.textContent.trim() || parent.closest('script, style, [aria-hidden="true"]') || !parent.checkVisibility({visibilityProperty: true})) continue;
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

  function update() {
    if (!buddy) return;
    const box = mascot.getBoundingClientRect();
    const section = sections.find(rect => contains(rect, box));
    const viewport = {left: 8, top: 8, right: innerWidth - 8, bottom: innerHeight - 8};
    const clear = rect => contains(viewport, rect) && !protectedRects.some(other => overlaps(rect, other, 10));
    const visible = !buddy.hidden && !reduced.matches && !document.querySelector("dialog[open]") &&
      hero.bottom <= 0 && !!section && clear(box) && clear(close.getBoundingClientRect());
    flag("data-site-visible", visible);
    if (buddy.inert === visible) buddy.inert = !visible;
    const ariaHidden = String(!visible);
    if (buddy.getAttribute("aria-hidden") !== ariaHidden) buddy.setAttribute("aria-hidden", ariaHidden);
    const speech = visible && !bubble.hidden && contains(section, bubble.getBoundingClientRect()) && clear(bubble.getBoundingClientRect());
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
  document.addEventListener("toggle", refresh, true);
  document.addEventListener("visibilitychange", resume);
  reduced.addEventListener("change", resume);
})();
