// Hero: the slow "You just hired ..." line and the three-example carousel.
// The carousel follows the WAI-ARIA tabbed carousel pattern and never advances on its own.
(function () {
  var hero = document.getElementById("top");
  if (!hero) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobile = window.matchMedia("(max-width: 900px)");

  var ROLES = ["an engineer.", "a reviewer.", "a doc writer.", "an on-call.", "Jiro."];
  var STEP_MS = 2600;
  var FADE_MS = 200;

  var role = hero.querySelector("[data-hero-line] .hero-role");
  var settled = reduce.matches;

  function settleRoles() {
    settled = true;
    role.classList.remove("is-out");
    role.textContent = ROLES[ROLES.length - 1];
  }

  function rollRoles() {
    if (settled) return;
    var i = 0;
    role.classList.add("is-out");
    role.textContent = ROLES[0];
    setTimeout(function () {
      if (settled) return;
      role.classList.remove("is-out");
      setTimeout(next, STEP_MS);
    }, FADE_MS);

    function next() {
      if (settled) return;
      if (document.hidden) {
        document.addEventListener("visibilitychange", next, { once: true });
        return;
      }
      role.classList.add("is-out");
      setTimeout(function () {
        if (settled) return;
        i += 1;
        role.textContent = ROLES[i];
        role.classList.remove("is-out");
        if (i < ROLES.length - 1) setTimeout(next, STEP_MS);
      }, FADE_MS);
    }
  }

  function initCarousel() {
    var tabs = Array.prototype.slice.call(hero.querySelectorAll('.hc-dots [role="tab"]'));
    var name = hero.querySelector(".hc-name");
    var toggle = hero.querySelector(".hc-pause");
    var playing = !reduce.matches;
    var current = 0;

    function panel(i) {
      return document.getElementById(tabs[i].getAttribute("aria-controls"));
    }
    function video(i) {
      return panel(i).querySelector("video");
    }

    function show(v) {
      var src = mobile.matches ? v.dataset.mobile : v.dataset.desktop;
      if (v.getAttribute("src") !== src) v.setAttribute("src", src);
      // A missing file or a blocked autoplay leaves the poster up, which is the intended fallback.
      v.play().catch(function () {});
    }

    function sync() {
      tabs.forEach(function (_, i) {
        var v = video(i);
        if (i === current && playing) show(v);
        else v.pause();
      });
      toggle.dataset.state = playing ? "playing" : "paused";
      toggle.setAttribute("aria-label", playing ? "Pause video" : "Play video");
    }

    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, j) {
        var on = j === current;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = panel(j);
        p.toggleAttribute("data-active", on);
        if (on) p.removeAttribute("aria-hidden");
        else p.setAttribute("aria-hidden", "true");
      });
      name.textContent = tabs[current].getAttribute("aria-label");
      if (focus) tabs[current].focus();
      sync();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        select(i, false);
      });
      t.addEventListener("keydown", function (e) {
        var to = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        select(to, true);
      });
    });
    // Pausing stops all hero motion, including the rotating line (WCAG 2.2.2).
    toggle.addEventListener("click", function () {
      playing = !playing;
      if (!playing) settleRoles();
      sync();
    });
    mobile.addEventListener("change", sync);
    select(0, false);
    hero.querySelector(".hc-controls").hidden = false;
  }

  rollRoles();
  initCarousel();
})();
