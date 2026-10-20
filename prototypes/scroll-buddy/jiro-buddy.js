(function () {
  "use strict";

  if (window.__jiroBuddyLoaded) return;
  window.__jiroBuddyLoaded = true;

  var STORAGE_KEY = "jiro-buddy-hidden";
  var SETTLE_MS = 600;
  var TYPE_MS = 28;
  var ANNOUNCE_MS = 100;
  var FLIGHT_MS = 900;
  var THINK_MS = 750;
  var LOOK_MS = 700;
  var LOOK_LINGER_MS = 1800;
  var SLEEP_AFTER_MS = 20000;
  var MAX_SIDE_CHANGES = 3;
  var MAX_PERCHES = 1;
  var SWITCH_RATIO = 0.7;
  var FOOTPRINT = { width: 420, height: 160, bottom: 32 };
  var SVG_NS = "http://www.w3.org/2000/svg";

  var BODY_FILL = "M35 6L34 6L34 3L33 3L33 0.75L30.5 0.75L30.25 1L29 1L28.75 1.25L28 1.25L27.75 1.5L27 1.5L26.75 1.75L26 1.75L26 2L25.5 2L25.25 2.25L24.75 2.25L24.5 2.5L24 2.5L23.75 2.75L23.25 2.75L23 3L22.75 3L22.5 3.25L22.25 3.25L22 3.5L21.75 3.5L21.5 3.75L21.25 3.75L21 4L20.75 4L20.5 4.25L20.25 4.25L20 4.5L19.75 4.5L19.5 4.75L19.25 4.75L19.25 5L19 5L18.75 5.25L18.5 5.25L18.5 5.5L18 5.5L18 5.75L17.75 5.75L17 6.5L16.75 6.5L16.25 7L16 7L16 7.25L15.75 7.25L15.75 7.5L15.5 7.5L15.5 7.75L15.25 7.75L14 9L14 9.25L13.75 9.25L13.75 9.5L13.5 9.5L13.5 9.75L13.25 9.75L13.25 10L13 10L13 10.25L12.25 11L12.25 11.25L12 11.25L12 11.5L11.75 11.5L11.75 12L11.5 12L11.5 12.25L11.25 12.25L11.25 12.5L11 12.75L11 13L10.75 13L10.75 13.25L10.5 13.5L10.5 13.75L10 14.25L10 14.5L9.75 14.75L9.75 15L9.5 15.25L9.5 15.5L9.25 15.75L9.25 16L9 16.25L9 16.5L8.75 16.75L8.75 17.25L8.5 17.5L8.5 17.75L8.25 18L8.25 18.5L8 18.75L8 19.25L7.75 19.25L7.75 20L7.5 20.25L7.5 21L7.25 21L7.25 22L7 22.25L7 23.25L6.75 23.5L6.75 25.25L6.5 25.25L6.5 30.5L6.75 30.5L6.75 32.25L7 32.5L7 33.5L7.25 33.75L7.25 34.75L7.5 34.75L7.5 35.5L7.75 35.75L7.75 36.25L8 36.5L8 37L8.25 37.25L8.25 37.5L8.5 37.75L8.5 38.25L8.75 38.5L8.75 38.75L9 39L9 39.25L9.25 39.5L9.25 39.75L9 40L9 42L10 42L10 44L9 44L9 45L8 45L8 46L7 46L7 47L6 47L6 48L5 48L5 49L4 49L4 50L3 50L3 51L2.25 51L2 51.25L2 52L4 52L4.25 51.75L4.75 51.75L5 51.5L5 51L6.75 51L7 50.75L7 50L9 50L9 49L11 49L11 48L13 48L13 47L14 47L14 48L16 48L16 48.75L16.25 49L17 49L17 49.5L17.25 49.5L17.5 49.75L17.75 49.75L17.75 50L19 50L19 50.5L19.25 50.75L19.5 50.75L19.5 51L21 51L21 51.5L21.25 51.5L21.25 51.75L21.75 51.75L22 52L23 52L23 52.25L23.25 52.5L24 52.5L24.25 52.75L24.75 52.75L25 53L27 53L27 53.25L27.25 53.5L28.5 53.5L28.75 53.75L35.75 53.75L35.75 53.5L37 53.5L37 53L39.5 53L39.75 52.75L40.5 52.75L40.5 52.5L41 52.5L41 52L42.5 52L42.75 51.75L43 51.75L43 51L44.75 51L45 50.75L45 50L46.5 50L46.75 49.75L47 49.75L47 49L48 49L48 48L49.5 48L50 47.5L50 47L50.75 47L50.75 46.75L51 46.75L51 46L51.75 46L52 45.75L52 45L52.75 45L53 44.75L53 43L54 43L54 42L55 42L55 40L56 40L56 38L57 38L57 36L58 36L58 32L59 32L59 31L60 31L60 29L59 29L59 26L56 26L56 25L55 25L55 24L54 24L54 23L53 23L53 14L48 14L48 13L47 13L47 12L46 12L46 9L45 9L45 7L41 7L41 8L39 8L39 7L36 7L36 6Z";
  var BODY_LINE = "M88 384L-24 424L42 317C-8 218 30 90 127 36C178 7 242-4 242 16C242 24 236 29 225 29C157 29 70 98 51 167C38 214 43 266 66 310L70 317L32 378L87.7 358.6A202.4 202.4 0 0 0 426.6 230.1C426 220 431 213 439 213C447 213 450.5 220 450.5 232.4A226.4 226.4 0 0 1 88 384Z";
  var FACES = {
    cursor: "M16 22h2v1h1v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1h1v-1h1v-1h1v-1h1v-2h-1v-1h-1v-1h-1v-1h-1zM27 31h10v3h-10z",
    eyes: "M19 23h5v7h-5zM38 23h5v7h-5z",
    dots: "M18 28h4v4h-4zM29 28h4v4h-4zM40 28h4v4h-4z",
    sleepy: "M17 29h8v2h-8zM37 29h8v2h-8zM29 34h4v1h-4z"
  };

  function el(tag, className, attrs, parent) {
    var node = tag.indexOf("svg:") === 0
      ? document.createElementNS(SVG_NS, tag.slice(4))
      : document.createElement(tag);
    if (className) node.setAttribute("class", className);
    Object.keys(attrs || {}).forEach(function (name) { node.setAttribute(name, attrs[name]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  function mascotArt() {
    var art = el("svg:svg", "jiro-buddy__art", { viewBox: "0 -1 62 56", focusable: "false" });
    var shell = el("svg:g", "jiro-buddy__shell", {}, art);
    el("svg:path", "", { d: BODY_FILL, fill: "#faf8f2", "shape-rendering": "crispEdges" }, shell);
    el("svg:path", "", { d: BODY_LINE, transform: "translate(4 0) scale(.125)", fill: "#1d3b2a" }, shell);
    var face = el("svg:g", "jiro-buddy__face", { fill: "#fb5e45", "shape-rendering": "crispEdges" }, art);
    Object.keys(FACES).forEach(function (name) {
      FACES[name].split(/(?=M)/).forEach(function (d, i) {
        el("svg:path", "jiro-buddy__face-" + name, { d: d, style: "--i:" + i }, face);
      });
    });
    el("svg:rect", "jiro-buddy__cursor", { x: "41", y: "23", width: "6", height: "9" }, face);
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

  function attr(section, name) {
    return (section.getAttribute("data-jiro-" + name) || "").trim();
  }

  function target(section, name) {
    var selector = attr(section, name);
    if (!selector) return null;
    try {
      return document.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function onChange(query, listener) {
    if (query.addEventListener) query.addEventListener("change", listener);
    else query.addListener(listener);
  }

  function init() {
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-jiro-comment]"));
    var commented = sections.some(function (section) { return attr(section, "comment") !== ""; });
    if (!commented || isHidden() || !("IntersectionObserver" in window)) return;
    if (document.querySelector(".jiro-buddy")) return;

    var wide = window.matchMedia("(min-width: 768px)");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    var aside = el("aside", "jiro-buddy", { "aria-label": "Jiro", "data-jiro-state": "idle", "data-jiro-face": "cursor" });
    var mascot = el("button", "jiro-buddy__mascot", { type: "button", "aria-label": "Jiro: replay comment" }, aside);
    var figure = el("span", "jiro-buddy__figure", { "aria-hidden": "true" }, mascot);
    var layer = figure;
    ["bob", "drift", "tilt", "squash", "hop"].forEach(function (name) {
      layer = el("span", "jiro-buddy__" + name, {}, layer);
    });
    var hop = layer;
    hop.appendChild(mascotArt());
    el("span", "jiro-buddy__zzz", {}, hop).textContent = "z z";
    el("span", "jiro-buddy__shadow", {}, figure);
    el("span", "jiro-buddy__puff", {}, figure);
    var bubble = el("div", "jiro-buddy__bubble", {}, aside);
    var text = el("p", "jiro-buddy__text", { "aria-hidden": "true" }, bubble);
    var acts = el("div", "jiro-buddy__acts", {}, bubble);
    var yes = el("button", "jiro-buddy__yes", { type: "button" }, acts);
    var later = el("button", "jiro-buddy__later", { type: "button" }, acts);
    var status = el("p", "jiro-buddy__sr", { role: "status", "aria-live": "polite" }, aside);
    var close = el("button", "jiro-buddy__close", { type: "button", "aria-label": "Hide Jiro" }, aside);
    close.textContent = "×";
    bubble.hidden = true;
    acts.hidden = true;
    document.body.appendChild(aside);

    var visible = new Set();
    var seen = new Set();
    var active = null;
    var run = 0;
    var timers = [];
    var looked = null;
    var spoken = "";
    var side = "left";
    var sideChanges = 0;
    var perches = 0;
    var perched = null;
    var flight = null;
    var hovered = false;
    var closed = false;
    var face = "cursor";
    var sleepTimer = 0;
    var entered = Promise.resolve();
    var returning = Promise.resolve();

    function schedule(fn, ms) {
      var id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    }

    function wait(ms, token) {
      return new Promise(function (resolve, reject) {
        schedule(function () { (token === run ? resolve : reject)(); }, ms);
      });
    }

    function setState(state) {
      aside.setAttribute("data-jiro-state", state);
    }

    function setFace(name) {
      face = name;
      aside.setAttribute("data-jiro-face", hovered && name !== "dots" && name !== "sleepy" ? "eyes" : name);
    }

    function motion() {
      return !reduced.matches;
    }

    function play(node, frames, ms, easing) {
      if (!motion()) return Promise.resolve();
      return node.animate(frames, { duration: ms, easing: easing || "ease-out" }).finished.catch(function () {});
    }

    function squash(sx, sy, ms) {
      return play(hop, [
        { transform: "scale(1,1)" },
        { transform: "scale(" + sx + "," + sy + ")", offset: 0.4 },
        { transform: "scale(1,1)" }
      ], ms || 260);
    }

    function hopOnce(height, ms) {
      return play(hop, [
        { transform: "translateY(0) scale(1.08,.9)" },
        { transform: "translateY(" + -height + "px) scale(.94,1.08)", offset: 0.4, easing: "ease-in" },
        { transform: "translateY(1px) scale(1.1,.88)", offset: 0.82 },
        { transform: "translateY(0) scale(1,1)" }
      ], ms);
    }

    function puff() {
      if (!motion()) return;
      figure.classList.remove("jiro-buddy--puff");
      void figure.offsetWidth;
      figure.classList.add("jiro-buddy--puff");
    }

    function clearLook() {
      if (looked) looked.classList.remove("jiro-look-target");
      looked = null;
    }

    function hideBubble() {
      if (bubble.contains(document.activeElement)) mascot.focus({ preventScroll: true });
      run += 1;
      timers.forEach(clearTimeout);
      timers = [];
      bubble.hidden = true;
      acts.hidden = true;
      bubble.classList.remove("jiro-buddy--pop");
      text.textContent = "";
      text.removeAttribute("data-rest");
      spoken = "";
      clearLook();
      if (aside.getAttribute("data-jiro-state") !== "sleepy") setState("idle");
      setFace("cursor");
    }

    function speak(section, token) {
      seen.add(section);
      say(attr(section, "comment"), attr(section, "ask"), token);
    }

    function say(comment, ask, token) {
      if (!comment) return;
      spoken = comment;
      setState("speaking");
      setFace("cursor");
      status.textContent = "";
      schedule(function () { status.textContent = comment; }, ANNOUNCE_MS);
      yes.textContent = ask;
      later.textContent = ask ? "Later" : "";
      acts.hidden = !ask;
      bubble.hidden = false;
      var finish = function () {
        text.removeAttribute("data-rest");
        acts.classList.remove("jiro-buddy--waiting");
        setState("idle");
        schedule(clearLook, LOOK_LINGER_MS);
      };
      if (!motion()) {
        text.textContent = comment;
        finish();
        return;
      }
      acts.classList.add("jiro-buddy--waiting");
      bubble.classList.remove("jiro-buddy--pop");
      void bubble.offsetWidth;
      bubble.classList.add("jiro-buddy--pop");
      squash(side === "right" ? 0.9 : 1.12, 0.92, 300);
      var chars = Array.from(comment);
      var shown = 0;
      (function typeNext() {
        if (token !== run) return;
        shown += 1;
        text.textContent = chars.slice(0, shown).join("");
        text.setAttribute("data-rest", chars.slice(shown).join(""));
        if (shown < chars.length) schedule(typeNext, TYPE_MS);
        else finish();
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
      var pinned = attr(section, "side");
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

    function arc(from, ahead) {
      var to = aside.getBoundingClientRect();
      var dx = from.left - to.left;
      var dy = from.top - to.top;
      if (!motion() || (Math.abs(dx) < 1 && Math.abs(dy) < 1)) return Promise.resolve();
      var dir = (dx < 0) === !ahead ? 1 : -1;
      var lift = Math.min(ahead ? dy : 0, ahead ? 0 : dy) - 70;
      var at = function (t, y, r) {
        var k = ahead ? t : 1 - t;
        return "translate(" + dx * k + "px," + (dy * k + y) + "px) rotate(" + r * dir + "deg)";
      };
      setState("flying");
      var animation = aside.animate([
        { offset: 0, transform: at(0, 0, 0), easing: "ease-out" },
        { offset: 0.12, transform: at(0, 6, 4), easing: "ease-out" },
        { offset: 0.4, transform: at(0.35, lift, -8), easing: "ease-in-out" },
        { offset: 0.6, transform: at(0.65, lift * 0.9, 6), easing: "ease-in" },
        { offset: 0.84, transform: at(1, 0, 4), easing: "ease-out" },
        { offset: 0.92, transform: at(1, 2, -2), easing: "ease-in-out" },
        { offset: 1, transform: at(1, 0, 0) }
      ], { duration: FLIGHT_MS, fill: ahead ? "forwards" : "none" });
      flight = animation;
      schedule(function () { puff(); squash(1.16, 0.84, 240); }, FLIGHT_MS * 0.84);
      return animation.finished.then(function () {
        if (flight === animation) flight = null;
      }, function () {});
    }

    function placeOnPerch(heading) {
      var rect = heading.getBoundingClientRect();
      var width = mascot.offsetWidth;
      var x = Math.min(rect.right - width - 12, document.documentElement.clientWidth - width - 24);
      x = Math.max(x, rect.left);
      var y = rect.top - mascot.offsetHeight + 4;
      aside.classList.add("jiro-buddy--perched");
      aside.classList.toggle("jiro-buddy--flip", x + width / 2 > document.documentElement.clientWidth / 2);
      aside.style.left = "0px";
      aside.style.top = "0px";
      var origin = aside.getBoundingClientRect();
      aside.style.left = x - origin.left + "px";
      aside.style.top = y - origin.top + "px";
    }

    function unplace() {
      aside.classList.remove("jiro-buddy--perched");
      aside.style.left = "";
      aside.style.top = "";
    }

    function perchOn(heading) {
      landFlight();
      perched = heading;
      perches += 1;
      placeOnPerch(heading);
      var landing = aside.getBoundingClientRect();
      unplace();
      return arc(landing, true).then(function () {
        if (perched !== heading) return;
        aside.getAnimations().forEach(function (animation) { animation.cancel(); });
        placeOnPerch(heading);
      });
    }

    function leavePerch() {
      if (!perched) return Promise.resolve();
      var from = aside.getBoundingClientRect();
      var gone = from.bottom < 0 || from.top > window.innerHeight;
      landFlight();
      perched = null;
      if (gone) aside.hidden = true;
      unplace();
      aside.classList.remove("jiro-buddy--flip");
      if (!gone) return arc(from);
      returning = new Promise(function (resolve) {
        requestAnimationFrame(function () {
          aside.hidden = closed;
          play(aside, [
            { transform: "translateY(140%)", easing: "ease-out" },
            { transform: "translateY(-14%)", offset: 0.7, easing: "ease-in" },
            { transform: "translateY(0)" }
          ], 520).then(function () { puff(); return squash(1.14, 0.86, 240); }).then(resolve);
        });
      });
      return returning;
    }

    function flyTo(next) {
      var from = aside.getBoundingClientRect();
      landFlight();
      side = next;
      sideChanges += 1;
      aside.classList.toggle("jiro-buddy--right", side === "right");
      return arc(from);
    }

    function move(section) {
      var heading = target(section, "perch");
      if (heading && perches < MAX_PERCHES) {
        var rect = heading.getBoundingClientRect();
        if (rect.top > 120 && rect.bottom < window.innerHeight) return perchOn(heading);
      }
      if (perched) return leavePerch();
      var next = chooseSide(section);
      if (next !== side && sideChanges < MAX_SIDE_CHANGES) return flyTo(next);
      return flight ? flight.finished.catch(function () {}) : Promise.resolve();
    }

    function look(section, token) {
      var thing = target(section, "look");
      if (!thing) return Promise.resolve();
      clearLook();
      looked = thing;
      thing.classList.add("jiro-look-target");
      var a = thing.getBoundingClientRect();
      var b = mascot.getBoundingClientRect();
      var dx = (a.left + a.width / 2) - (b.left + b.width / 2);
      var dy = (a.top + a.height / 2) - (b.top + b.height / 2);
      var len = Math.max(Math.hypot(dx, dy), 1);
      aside.style.setProperty("--jiro-gx", (dx / len * 2.5).toFixed(2) + "px");
      aside.style.setProperty("--jiro-gy", (dy / len * 2.5).toFixed(2) + "px");
      setState("looking");
      setFace("glance");
      return motion() ? wait(LOOK_MS, token) : Promise.resolve();
    }

    async function perform(section, token) {
      await entered;
      await returning;
      if (token !== run) return;
      await move(section);
      if (token !== run) return;
      if (attr(section, "mood") === "eager" && motion()) {
        setState("eager");
        await hopOnce(14, 300);
        await hopOnce(9, 260);
        if (token !== run) return;
      }
      await look(section, token);
      if (token !== run) return;
      if (motion()) {
        setState("thinking");
        setFace("dots");
        await wait(THINK_MS, token);
      }
      speak(section, token);
    }

    function settle(section) {
      var token = run;
      schedule(function () {
        if (active !== section || seen.has(section) || !wide.matches) return;
        perform(section, token).catch(function () {});
      }, SETTLE_MS);
    }

    function setActive(section) {
      if (!section || section === active) return;
      active = section;
      hideBubble();
      if (perched && target(section, "perch") !== perched) leavePerch();
      settle(section);
    }

    function sleep() {
      if (aside.getAttribute("data-jiro-state") !== "idle" || aside.contains(document.activeElement)) {
        sleepTimer = setTimeout(sleep, SLEEP_AFTER_MS);
        return;
      }
      hideBubble();
      setState("sleepy");
      setFace("sleepy");
    }

    function stir() {
      clearTimeout(sleepTimer);
      sleepTimer = setTimeout(sleep, SLEEP_AFTER_MS);
      if (aside.getAttribute("data-jiro-state") !== "sleepy") return;
      setState("idle");
      setFace("cursor");
      hopOnce(8, 320);
    }

    ["scroll", "pointermove", "keydown", "touchstart", "wheel"].forEach(function (name) {
      window.addEventListener(name, stir, { passive: true });
    });
    stir();

    onChange(wide, function () {
      landFlight();
      leavePerch();
      hideBubble();
      if (wide.matches && active) settle(active);
    });

    onChange(reduced, function () {
      if (reduced.matches) landFlight();
      if (!reduced.matches || bubble.hidden || !spoken) return;
      var section = active;
      hideBubble();
      if (section) speak(section, run);
    });

    window.addEventListener("resize", function () {
      if (perched && !flight && wide.matches) placeOnPerch(perched);
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

    if (motion() && wide.matches) {
      entered = aside.animate([
        { transform: "translateX(-75%) rotate(14deg)", easing: "ease-out" },
        { transform: "translateX(-45%) rotate(10deg)", offset: 0.25 },
        { transform: "translateX(-45%) rotate(10deg)", offset: 0.5, easing: "ease-in" },
        { transform: "translateX(-62%) rotate(12deg)", offset: 0.6, easing: "ease-out" },
        { transform: "translateX(8%) translateY(-40px) rotate(-6deg)", offset: 0.85, easing: "ease-in" },
        { transform: "translateX(0) rotate(0)" }
      ], { duration: 1500 }).finished.then(function () { puff(); squash(1.16, 0.84, 240); }, function () {});
      setFace("glance");
      aside.style.setProperty("--jiro-gx", "2.5px");
      entered.then(function () { if (face === "glance") setFace("cursor"); });
    }

    sections.forEach(function (section) { observer.observe(section); });

    var quips = ((document.querySelector("[data-jiro-hovers]") || aside).getAttribute("data-jiro-hovers") || "")
      .split("|").map(function (line) { return line.trim(); }).filter(Boolean);
    var quipAt = 0;
    var quipTime = -Infinity;

    function dodge() {
      var away = side === "right" || aside.classList.contains("jiro-buddy--flip") ? -1 : 1;
      return play(hop, [
        { transform: "translate(0,0) rotate(0)" },
        { transform: "translate(" + 6 * away + "px,-10px) rotate(" + 6 * away + "deg)", offset: 0.3 },
        { transform: "translate(" + 12 * away + "px,0) rotate(" + -3 * away + "deg)", offset: 0.6 },
        { transform: "translate(0,0) rotate(0)" }
      ], 560, "ease-in-out");
    }

    function quip() {
      var state = aside.getAttribute("data-jiro-state");
      var asking = !bubble.hidden && !acts.hidden;
      var now = performance.now();
      if (!quips.length || asking || !wide.matches || now - quipTime < 1200) return;
      if (state !== "idle" && state !== "sleepy") return;
      quipTime = now;
      hideBubble();
      dodge();
      say(quips[quipAt % quips.length], "", run);
      quipAt += 1;
    }

    mascot.addEventListener("pointerenter", function (event) {
      hovered = true;
      setFace(face);
      if (event.pointerType === "mouse") quip();
    });
    mascot.addEventListener("pointerleave", function () { hovered = false; setFace(face); });

    mascot.addEventListener("click", function () {
      if (!active) return;
      hideBubble();
      speak(active, run);
      hopOnce(10, 320);
    });

    yes.addEventListener("click", function () {
      var section = active;
      var goal = section && target(section, "action");
      hideBubble();
      if (!goal) return;
      goal.scrollIntoView({ behavior: motion() ? "smooth" : "auto", block: "center" });
      if (goal.matches("input, textarea, select, button, a[href]")) goal.focus({ preventScroll: true });
    });

    later.addEventListener("click", hideBubble);

    close.addEventListener("click", function () {
      var hadFocus = aside.contains(document.activeElement);
      hideBubble();
      landFlight();
      observer.disconnect();
      clearTimeout(sleepTimer);
      closed = true;
      aside.hidden = true;
      rememberHidden();
      if (hadFocus) focusContent();
    });
  }

  function start() {
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1); };
    idle(init, { timeout: 500 });
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
