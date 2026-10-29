// Hero: the three-example carousel.
// The carousel follows the WAI-ARIA tabbed carousel pattern and never advances on its own.
(function () {
  var hero = document.getElementById("top");
  if (!hero) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobile = window.matchMedia("(max-width: 900px)");

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
    // The visitor controls video playback (WCAG 2.2.2).
    toggle.addEventListener("click", function () {
      playing = !playing;
      sync();
    });
    mobile.addEventListener("change", sync);
    select(0, false);
    hero.querySelector(".hc-controls").hidden = false;
  }

  initCarousel();
})();
