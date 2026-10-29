/* Complete stories live in HTML. Scroll changes emphasis, never their content. */
(function () {
  "use strict";
  const stories = [...document.querySelectorAll(".feature-story")].map((el) => ({
    el,
    steps: [...el.querySelectorAll(".feature-step")],
    links: [...el.querySelectorAll(".feature-step a")],
    regions: [...el.querySelectorAll(".feature-region")],
    demo: el.querySelector(".feature-demo"),
    current: -1,
    sticky: false,
  }));
  if (!stories.length) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wide = window.matchMedia("(min-width: 901px) and (min-height: 760px)");
  let queued = false;

  function select(story, index) {
    if (story.current === index) return;
    story.current = index;
    story.links.forEach((link, i) => {
      if (i === index) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
      story.regions[i].classList.toggle("is-current", i === index);
    });
  }

  function update() {
    queued = false;
    if (reduced.matches || document.hidden) return;
    const middle = window.innerHeight / 2;
    stories.forEach((story) => {
      const bounds = story.el.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      // Geometry handles reverse scrolling and jumps past several steps at once.
      const targets = story.sticky ? story.steps : story.regions;
      let nearest = 0;
      let distance = Infinity;
      targets.forEach((target, i) => {
        const rect = target.getBoundingClientRect();
        const next = Math.abs(rect.top + rect.height / 2 - middle);
        if (next < distance) { distance = next; nearest = i; }
      });
      select(story, nearest);
    });
  }

  function requestUpdate() {
    if (queued || reduced.matches) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  function layout() {
    stories.forEach((story) => {
      story.sticky = !reduced.matches && wide.matches && story.demo.offsetHeight <= window.innerHeight - 100;
      story.el.classList.toggle("feature-sticky", story.sticky);
    });
    requestUpdate();
  }

  function configure() {
    stories.forEach((story) => {
      story.el.classList.toggle("feature-enhanced", !reduced.matches);
      select(story, -1);
    });
    layout();
  }

  stories.forEach((story) => {
    story.links.forEach((link, i) => {
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const target = story.sticky ? story.steps[i] : story.regions[i];
        target.scrollIntoView({ block: "center", behavior: "instant" });
        // Keep keyboard focus on the real link; the mock UI is read-only.
        if (!reduced.matches) select(story, i);
      });
    });
  });
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", layout);
  window.addEventListener("pageshow", requestUpdate);
  document.addEventListener("visibilitychange", requestUpdate);
  reduced.addEventListener("change", configure);
  wide.addEventListener("change", layout);
  if ("ResizeObserver" in window) {
    const resize = new ResizeObserver(layout);
    stories.forEach((story) => resize.observe(story.demo));
  }
  configure();
})();
