/*
 * "How it works": the three stories become tabs over a horizontal snap track.
 * One story shows at a time and the tabs autorotate every 20 seconds. Choosing a tab,
 * swiping or keyboard use hands control to the visitor and stops the rotation; a resting
 * pointer holds it. Without JavaScript the stories stay stacked; reduced motion never rotates.
 * Steps are plain text: scrolling only emphasizes the demo region nearest the viewport center.
 */
(function () {
  "use strict";
  const section = document.getElementById("features");
  if (!section) return;
  const strip = section.querySelector(".feature-tabs");
  const tablist = strip.querySelector('[role="tablist"]');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const toggle = strip.querySelector(".ft-pause");
  const track = section.querySelector(".feature-track");
  const stories = tabs.map((tab) => {
    const el = document.getElementById(tab.getAttribute("aria-controls"));
    return {
      el,
      steps: [...el.querySelectorAll(".feature-step")],
      regions: [...el.querySelectorAll(".feature-region")],
      emphasis: -1,
    };
  });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let queued = false;
  const cycle = window.JiroTabCycle(tablist, 20000, () => select(current + 1));

  const behavior = () => (reduced.matches ? "instant" : "smooth");
  const offset = (i) => stories[i].el.offsetLeft - track.offsetLeft;

  function select(i, focus) {
    current = (i + tabs.length) % tabs.length;
    tabs.forEach((tab, j) => {
      const on = j === current;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      const story = stories[j].el;
      story.inert = !on;
      story.tabIndex = on ? 0 : -1;
      if (on) story.removeAttribute("aria-hidden");
      else story.setAttribute("aria-hidden", "true");
    });
    if (focus) tabs[current].focus();
    if (Math.abs(track.scrollLeft - offset(current)) > 1) track.scrollTo({ left: offset(current), behavior: behavior() });
    requestEmphasis();
  }

  // The visitor took over: show their choice and stop rotating until they press play.
  function take(i, focus) {
    select(i, focus);
    setPaused(true);
  }

  function setPaused(on) {
    cycle.setPaused(on);
    toggle.dataset.state = on ? "paused" : "playing";
    toggle.setAttribute("aria-label", on ? "Play stories" : "Pause stories");
  }

  // Where a swipe settled; a story other than the selected one means the visitor moved it.
  function settled() {
    let nearest = 0;
    stories.forEach((_, i) => {
      if (Math.abs(offset(i) - track.scrollLeft) < Math.abs(offset(nearest) - track.scrollLeft)) nearest = i;
    });
    if (nearest !== current) take(nearest, false);
  }

  function emphasize(story, index) {
    if (story.emphasis === index) return;
    story.emphasis = index;
    story.steps.forEach((step, i) => {
      if (i === index) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
      story.regions[i].classList.toggle("is-current", i === index);
    });
  }

  function updateEmphasis() {
    queued = false;
    if (reduced.matches || document.hidden) return;
    const story = stories[current];
    const middle = window.innerHeight / 2;
    let nearest = 0;
    let distance = Infinity;
    story.regions.forEach((target, i) => {
      const rect = target.getBoundingClientRect();
      const next = Math.abs(rect.top + rect.height / 2 - middle);
      if (next < distance) { distance = next; nearest = i; }
    });
    emphasize(story, nearest);
  }

  function requestEmphasis() {
    if (queued || reduced.matches) return;
    queued = true;
    window.requestAnimationFrame(updateEmphasis);
  }

  function configure() {
    stories.forEach((story) => {
      story.el.classList.toggle("feature-enhanced", !reduced.matches);
      emphasize(story, -1);
    });
    toggle.hidden = reduced.matches;
    requestEmphasis();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => take(i, false));
    tab.addEventListener("keydown", (e) => {
      const to = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      take(to, true);
    });
  });
  // Keyboard focus on the tabs or a story stops the rotation (APG carousel). The pause button
  // is excluded so its first press always pauses.
  [tablist, track].forEach((area) => area.addEventListener("focusin", (e) => {
    if (e.target.matches(":focus-visible")) setPaused(true);
  }));
  toggle.addEventListener("click", () => setPaused(!cycle.paused()));
  track.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") cycle.hold("pointer", true);
  });
  track.addEventListener("pointerleave", () => cycle.hold("pointer", false));
  if ("onscrollend" in track) track.addEventListener("scrollend", settled);
  else {
    let quiet;
    track.addEventListener("scroll", () => {
      clearTimeout(quiet);
      quiet = setTimeout(settled, 150);
    }, { passive: true });
  }
  window.addEventListener("resize", () => {
    track.scrollTo({ left: offset(current), behavior: "instant" });
    requestEmphasis();
  });
  window.addEventListener("scroll", requestEmphasis, { passive: true });
  window.addEventListener("pageshow", requestEmphasis);
  document.addEventListener("visibilitychange", requestEmphasis);
  reduced.addEventListener("change", configure);

  section.classList.add("is-tabbed");
  strip.hidden = false;
  stories.forEach((story, i) => {
    story.el.setAttribute("role", "tabpanel");
    story.el.setAttribute("aria-labelledby", tabs[i].id);
  });
  configure();
  select(0, false);
  setPaused(false);
})();
