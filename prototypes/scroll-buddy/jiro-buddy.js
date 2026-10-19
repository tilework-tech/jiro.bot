(function () {
  "use strict";

  if (window.__jiroBuddyLoaded) return;
  window.__jiroBuddyLoaded = true;

  var STORAGE_KEY = "jiro-buddy-hidden";
  var SETTLE_MS = 600;
  var TYPE_MS = 30;
  var ANNOUNCE_MS = 100;

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    Object.keys(attrs || {}).forEach(function (name) {
      node.setAttribute(name, attrs[name]);
    });
    return node;
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
    var bob = el("span", "jiro-buddy__bob", { "aria-hidden": "true" });
    var hop = el("span", "jiro-buddy__hop");
    var body = el("span", "jiro-buddy__body");
    var glyph = el("span", "jiro-buddy__glyph");
    var cursor = el("span", "jiro-buddy__cursor");
    var bubble = el("div", "jiro-buddy__bubble", { "aria-hidden": "true" });
    var status = el("p", "jiro-buddy__sr", { role: "status", "aria-live": "polite" });
    var close = el("button", "jiro-buddy__close", { type: "button", "aria-label": "Hide Jiro" });

    glyph.textContent = ">_";
    glyph.appendChild(cursor);
    body.appendChild(glyph);
    hop.appendChild(body);
    bob.appendChild(hop);
    mascot.appendChild(bob);
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

    function settle(section) {
      settleTimer = setTimeout(function () {
        if (active === section && !seen.has(section) && wide.matches) say(section);
      }, SETTLE_MS);
    }

    function setActive(section) {
      if (!section || section === active) return;
      active = section;
      hideBubble();
      settle(section);
    }

    onChange(wide, function () {
      hideBubble();
      if (wide.matches && active) settle(active);
    });

    onChange(reduced, function () {
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
