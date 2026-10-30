// Hero: the three-example carousel with its bottom bar.
// The bar follows the WAI-ARIA tabbed carousel pattern and autocycles every 40 seconds, long enough
// for each clip to finish. Pause stops the video and the cycle; reduced motion never cycles.
(function () {
  var hero = document.getElementById("top");
  if (!hero) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobile = window.matchMedia("(max-width: 900px)");

  function initCarousel() {
    var bar = hero.querySelector(".hero-bar");
    var tablist = bar.querySelector('[role="tablist"]');
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var stage = hero.querySelector(".hc-stage");
    var name = hero.querySelector(".hc-name");
    var toggle = hero.querySelector(".hc-pause");
    var playing = !reduce.matches;
    var current = 0;
    var cycle = window.JiroTabCycle(tablist, 40000, function () {
      select(current + 1, false);
    }, hero.querySelector(".hero-row"));

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
      toggle.setAttribute("aria-label", playing ? "Pause examples" : "Play examples");
    }

    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, j) {
        var on = j === current;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = panel(j);
        p.toggleAttribute("data-active", on);
        p.tabIndex = on ? 0 : -1;
        if (on) p.removeAttribute("aria-hidden");
        else p.setAttribute("aria-hidden", "true");
      });
      name.textContent = tabs[current].getAttribute("aria-label");
      if (focus) tabs[current].focus();
      sync();
    }

    // A tap jumps to the example and the cycle carries on from there.
    function jump(i, focus) {
      select(i, focus);
      cycle.restart();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        jump(i, false);
      });
      t.addEventListener("keydown", function (e) {
        var to = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        cycle.hold("focus", true);
        jump(to, true);
      });
    });
    stage.addEventListener("click", function () {
      jump(current + 1, false);
    });
    // Keyboard users exploring the bar keep the example still (APG carousel).
    tablist.addEventListener("focusin", function (e) {
      if (e.target.matches(":focus-visible")) cycle.hold("focus", true);
    });
    tablist.addEventListener("focusout", function (e) {
      if (!tablist.contains(e.relatedTarget)) cycle.hold("focus", false);
    });
    // The visitor controls video playback and the cycle (WCAG 2.2.2).
    toggle.addEventListener("click", function () {
      playing = !playing;
      sync();
      cycle.setPaused(!playing);
    });
    mobile.addEventListener("change", sync);
    reduce.addEventListener("change", function () {
      if (!reduce.matches) return;
      playing = false;
      sync();
      cycle.setPaused(true);
    });
    select(0, false);
    cycle.setPaused(!playing);
    hero.querySelector(".hc-controls").hidden = false;
    bar.hidden = false;
  }

  initCarousel();
})();
