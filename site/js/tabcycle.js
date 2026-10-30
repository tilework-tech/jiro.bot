/*
 * Shared timer for the hero bar and the "How it works" tabs.
 * The cycle advances every `interval` ms while it is not paused, nothing holds it
 * (keyboard focus, a resting pointer, being off screen) and the visitor has not asked for reduced
 * motion. `strip` gets data-cycling and --cycle-ms so the active tab can draw its progress line.
 */
window.JiroTabCycle = function (strip, interval, advance, area) {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var paused = false;
  var holds = {};
  var timer = null;

  function running() {
    return !paused && !reduce.matches && !Object.keys(holds).some(function (k) { return holds[k]; });
  }

  // Starts a full interval from now, restarting the progress line with it.
  function restart() {
    clearTimeout(timer);
    timer = null;
    strip.removeAttribute("data-cycling");
    if (!running()) return;
    void strip.offsetWidth;
    strip.setAttribute("data-cycling", "");
    timer = setTimeout(function () {
      advance();
      restart();
    }, interval);
  }

  var cycle = {
    restart: restart,
    paused: function () { return paused; },
    setPaused: function (on) {
      paused = on;
      restart();
    },
    hold: function (reason, on) {
      if (!!holds[reason] === on) return;
      holds[reason] = on;
      restart();
    },
  };
  strip.style.setProperty("--cycle-ms", interval + "ms");
  reduce.addEventListener("change", restart);
  // Nobody is watching an area scrolled out of view, so it waits where it is.
  if (area && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      cycle.hold("offscreen", !entries[entries.length - 1].isIntersecting);
    }).observe(area);
  }
  return cycle;
};
