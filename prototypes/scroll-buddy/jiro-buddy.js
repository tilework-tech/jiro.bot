(function () {
  "use strict";

  if (window.__jiroBuddyLoaded) return;
  window.__jiroBuddyLoaded = true;

  var STORAGE_KEY = "jiro-buddy-hidden";
  var SETTLE_MS = 600;
  var TYPE_MS = 30;
  var ANNOUNCE_MS = 100;
  var FLIGHT_MS = 900;
  var MAX_SIDE_CHANGES = 3;
  var SWITCH_RATIO = 0.7;
  var FOOTPRINT = { width: 420, height: 160, bottom: 32 };
  var SVG_NS = "http://www.w3.org/2000/svg";

  var SHELL_STROKE = "M53.99 8.05A38 38 0 0 0 22.47 69.91L13.7 81.4L31.30 77.87A38 38 0 0 0 89.98 44.67";
  var SHELL_FILL = SHELL_STROKE + "A38 38 0 0 0 53.99 8.05Z";
  var PIXEL = 1.41;
  var CHEVRON_ROWS = [[0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [4, 3], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2]];

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    Object.keys(attrs || {}).forEach(function (name) {
      node.setAttribute(name, attrs[name]);
    });
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (name) {
      node.setAttribute(name, attrs[name]);
    });
    return node;
  }

  function mascotArt() {
    var art = svg("svg", { class: "jiro-buddy__art", viewBox: "0 3 100 86", focusable: "false" });
    var shell = svg("g", { class: "jiro-buddy__shell" });
    shell.appendChild(svg("path", { d: SHELL_FILL, fill: "#f8f6f0" }));
    shell.appendChild(svg("path", {
      d: SHELL_STROKE, fill: "none", stroke: "#173d2b", "stroke-width": "5",
      "stroke-linecap": "round", "stroke-linejoin": "round"
    }));
    var glyph = svg("g", { class: "jiro-buddy__glyph", fill: "#f2694f", "shape-rendering": "crispEdges" });
    CHEVRON_ROWS.forEach(function (run, row) {
      glyph.appendChild(svg("rect", {
        x: (29.3 + run[0] * PIXEL).toFixed(2), y: (40.4 + row * PIXEL).toFixed(2),
        width: (run[1] * PIXEL).toFixed(2), height: PIXEL.toFixed(2)
      }));
    });
    glyph.appendChild(svg("rect", { x: "45", y: "53.2", width: "14.1", height: "4.1" }));
    glyph.appendChild(svg("rect", { class: "jiro-buddy__cursor", x: "65.1", y: "41.9", width: "8.2", height: "12.4" }));
    art.appendChild(shell);
    art.appendChild(glyph);
    return art;
  }

  function groundShadow() {
    var art = svg("svg", { class: "jiro-buddy__shadow-art", viewBox: "0 0 100 5", preserveAspectRatio: "none", focusable: "false" });
    art.appendChild(svg("rect", { x: "26.6", y: "0", width: "51.4", height: "2.4", fill: "#e4e0d4" }));
    art.appendChild(svg("rect", { x: "33.9", y: "2.4", width: "37", height: "2.4", fill: "#e4e0d4" }));
    return art;
  }

  function intersect(a, b) {
    return {
      left: Math.max(a.left, b.left), right: Math.min(a.right, b.right),
      top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom)
    };
  }

  function clipOf(element, cache) {
    if (!element || element === document.documentElement) {
      return { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
    }
    if (cache.has(element)) return cache.get(element);
    var clip = clipOf(element.parentElement, cache);
    var style = window.getComputedStyle(element);
    if (style.overflowX !== "visible" || style.overflowY !== "visible") {
      clip = intersect(clip, element.getBoundingClientRect());
    }
    cache.set(element, clip);
    return clip;
  }

  function textOverlap(box, skip) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!/\S/.test(node.nodeValue) || skip.contains(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var range = document.createRange();
    var clips = new Map();
    var area = 0;
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      range.selectNodeContents(node);
      var rects = range.getClientRects();
      if (!rects.length) continue;
      var clip = intersect(box, clipOf(node.parentElement, clips));
      for (var i = 0; i < rects.length; i += 1) {
        var hit = intersect(clip, rects[i]);
        if (hit.right > hit.left && hit.bottom > hit.top) {
          area += (hit.right - hit.left) * (hit.bottom - hit.top);
        }
      }
    }
    range.detach();
    return area;
  }

  function cornerBox(side) {
    var width = document.documentElement.clientWidth;
    var bottom = window.innerHeight - FOOTPRINT.bottom;
    var left = side === "right" ? width - FOOTPRINT.width : 0;
    return { left: left, right: left + FOOTPRINT.width, top: bottom - FOOTPRINT.height, bottom: bottom };
  }

  function isHidden() {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function rememberHidden() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
  }

  function commentOf(section) {
    return (section.getAttribute("data-jiro-comment") || "").trim();
  }

  function onChange(query, listener) {
    if (query.addEventListener) query.addEventListener("change", listener);
    else query.addListener(listener);
  }

  function init() {
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-jiro-comment]"));
    var commented = sections.some(function (section) { return commentOf(section) !== ""; });
    if (!commented || isHidden() || !("IntersectionObserver" in window)) return;
    if (document.querySelector(".jiro-buddy")) return;

    var wide = window.matchMedia("(min-width: 768px)");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    var aside = el("aside", "jiro-buddy", { "aria-label": "Jiro" });
    var mascot = el("button", "jiro-buddy__mascot", { type: "button", "aria-label": "Jiro: replay comment" });
    var figure = el("span", "jiro-buddy__figure", { "aria-hidden": "true" });
    var bob = el("span", "jiro-buddy__bob");
    var drift = el("span", "jiro-buddy__drift");
    var tilt = el("span", "jiro-buddy__tilt");
    var squash = el("span", "jiro-buddy__squash");
    var hop = el("span", "jiro-buddy__hop");
    var shadow = el("span", "jiro-buddy__shadow");
    var bubble = el("div", "jiro-buddy__bubble", { "aria-hidden": "true" });
    var status = el("p", "jiro-buddy__sr", { role: "status", "aria-live": "polite" });
    var close = el("button", "jiro-buddy__close", { type: "button", "aria-label": "Hide Jiro" });

    hop.appendChild(mascotArt());
    squash.appendChild(hop);
    tilt.appendChild(squash);
    drift.appendChild(tilt);
    bob.appendChild(drift);
    shadow.appendChild(groundShadow());
    figure.appendChild(bob);
    figure.appendChild(shadow);
    mascot.appendChild(figure);
    bubble.hidden = true;
    close.textContent = "×";
    aside.appendChild(mascot);
    aside.appendChild(bubble);
    aside.appendChild(status);
    aside.appendChild(close);
    document.body.appendChild(aside);

    var visible = new Set();
    var seen = new Set();
    var active = null;
    var settleTimer = 0;
    var typeTimer = 0;
    var announceTimer = 0;
    var spoken = "";
    var side = "left";
    var sideChanges = 0;
    var flight = null;

    function clearTimers() {
      clearTimeout(settleTimer);
      clearTimeout(typeTimer);
      clearTimeout(announceTimer);
    }

    function hideBubble() {
      clearTimers();
      bubble.hidden = true;
      bubble.classList.remove("jiro-buddy--pop");
      bubble.textContent = "";
      spoken = "";
    }

    function say(section) {
      var text = commentOf(section);
      hideBubble();
      seen.add(section);
      if (!text) return;
      spoken = text;
      status.textContent = "";
      announceTimer = setTimeout(function () { status.textContent = text; }, ANNOUNCE_MS);
      bubble.hidden = false;
      if (reduced.matches) {
        bubble.textContent = text;
        return;
      }
      void bubble.offsetWidth;
      bubble.classList.add("jiro-buddy--pop");
      hop.classList.remove("jiro-buddy--hopping");
      void hop.offsetWidth;
      hop.classList.add("jiro-buddy--hopping");
      var chars = Array.from(text);
      var shown = 0;
      (function typeNext() {
        shown += 1;
        bubble.textContent = chars.slice(0, shown).join("");
        if (shown < chars.length) typeTimer = setTimeout(typeNext, TYPE_MS);
      })();
    }

    function nearestToCenter() {
      var center = window.innerHeight / 2;
      var best = null;
      var bestDistance = Infinity;
      visible.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var distance = Math.abs((rect.top + rect.bottom) / 2 - center);
        if (rect.top <= center && rect.bottom >= center) distance = -1;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = section;
        }
      });
      return best;
    }

    function chooseSide(section) {
      var pinned = section.getAttribute("data-jiro-side");
      if (pinned === "left" || pinned === "right") return pinned;
      var other = side === "left" ? "right" : "left";
      var here = textOverlap(cornerBox(side), aside);
      var there = textOverlap(cornerBox(other), aside);
      return there < here * SWITCH_RATIO ? other : side;
    }

    function landFlight() {
      if (flight) flight.cancel();
      flight = null;
    }

    function flyTo(target) {
      var from = mascot.getBoundingClientRect();
      landFlight();
      side = target;
      sideChanges += 1;
      aside.classList.toggle("jiro-buddy--right", side === "right");
      if (reduced.matches) return Promise.resolve();
      var to = mascot.getBoundingClientRect();
      var dx = from.left - to.left;
      var dir = dx < 0 ? 1 : -1;
      var frames = [
        { offset: 0, transform: "translate(" + dx + "px, 0) rotate(0deg)", easing: "ease-out" },
        { offset: 0.18, transform: "translate(" + dx * 0.88 + "px, -46px) rotate(" + -9 * dir + "deg)", easing: "ease-in-out" },
        { offset: 0.34, transform: "translate(" + dx * 0.68 + "px, -70px) rotate(" + 5 * dir + "deg)", easing: "ease-in-out" },
        { offset: 0.55, transform: "translate(" + dx * 0.36 + "px, -74px) rotate(" + -6 * dir + "deg)", easing: "ease-in" },
        { offset: 0.8, transform: "translate(" + 14 * dir + "px, -6px) rotate(" + 7 * dir + "deg)", easing: "ease-out" },
        { offset: 0.9, transform: "translate(" + -4 * dir + "px, 3px) rotate(" + -3 * dir + "deg)", easing: "ease-in-out" },
        { offset: 1, transform: "translate(0px, 0px) rotate(0deg)" }
      ];
      var animation = aside.animate(frames, { duration: FLIGHT_MS });
      flight = animation;
      return animation.finished.then(function () {
        if (flight === animation) flight = null;
      });
    }

    function settle(section) {
      settleTimer = setTimeout(function () {
        if (active !== section || seen.has(section) || !wide.matches) return;
        var target = chooseSide(section);
        var move = target !== side && sideChanges < MAX_SIDE_CHANGES;
        var arrived = move ? flyTo(target) : flight ? flight.finished : Promise.resolve();
        arrived.then(function () {
          if (active === section && !seen.has(section) && wide.matches) say(section);
        }, function () {});
      }, SETTLE_MS);
    }

    function setActive(section) {
      if (!section || section === active) return;
      active = section;
      hideBubble();
      settle(section);
    }

    onChange(wide, function () {
      landFlight();
      hideBubble();
      if (wide.matches && active) settle(active);
    });

    onChange(reduced, function () {
      if (reduced.matches) landFlight();
      if (!reduced.matches || bubble.hidden || !spoken) return;
      clearTimeout(typeTimer);
      bubble.classList.remove("jiro-buddy--pop");
      hop.classList.remove("jiro-buddy--hopping");
      bubble.textContent = spoken;
    });

    function focusContent() {
      var target = active || document.querySelector("main");
      if (!target) return;
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener("blur", function () {
          target.removeAttribute("tabindex");
        }, { once: true });
      }
      target.focus({ preventScroll: true });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      setActive(nearestToCenter());
    }, { rootMargin: "-40% 0px -40% 0px" });
    sections.forEach(function (section) { observer.observe(section); });

    hop.addEventListener("animationend", function () {
      hop.classList.remove("jiro-buddy--hopping");
    });

    mascot.addEventListener("click", function () {
      if (active) say(active);
    });

    close.addEventListener("click", function () {
      var hadFocus = aside.contains(document.activeElement);
      hideBubble();
      landFlight();
      observer.disconnect();
      aside.hidden = true;
      rememberHidden();
      if (hadFocus) focusContent();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
