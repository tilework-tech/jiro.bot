(function () {
  "use strict";

  if (window.__jiroBuddyLoaded) return;
  window.__jiroBuddyLoaded = true;

  var STORAGE_KEY = "jiro-buddy-hidden";
  var PIN_KEY = "jiro-buddy-pin";
  var SETTLE_MS = 1200;
  var FAST_SETTLE_MS = 450;
  var MIN_DWELL_MS = 2000;
  var TYPE_MS = 28;
  var ANNOUNCE_MS = 100;
  var FLIGHT_MS = 1300;
  var GLIDE_STEPS = 20;
  var CENTER_EDGE = 0.35;
  var MAX_PEEKS = 1;
  var PASS_LINE_MS = 900;
  var LINE_HOLD_MS = 4500;
  var ASK_HOLD_MS = 9000;
  var QUIET_AFTER = 4;
  var LONG_PASS = 0.5;
  var REST_BEAT_MS = 5000;
  var GLANCE_MS = 1300;
  var DRAG_SLOP = 5;
  var NUDGE = 24;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var CONFIG_URL = document.currentScript && document.currentScript.getAttribute("data-jiro-config");
  var avoid = [];

  var BODY_FILL = "M35 6L34 6L34 3L33 3L33 0.75L30.5 0.75L30.25 1L29 1L28.75 1.25L28 1.25L27.75 1.5L27 1.5L26.75 1.75L26 1.75L26 2L25.5 2L25.25 2.25L24.75 2.25L24.5 2.5L24 2.5L23.75 2.75L23.25 2.75L23 3L22.75 3L22.5 3.25L22.25 3.25L22 3.5L21.75 3.5L21.5 3.75L21.25 3.75L21 4L20.75 4L20.5 4.25L20.25 4.25L20 4.5L19.75 4.5L19.5 4.75L19.25 4.75L19.25 5L19 5L18.75 5.25L18.5 5.25L18.5 5.5L18 5.5L18 5.75L17.75 5.75L17 6.5L16.75 6.5L16.25 7L16 7L16 7.25L15.75 7.25L15.75 7.5L15.5 7.5L15.5 7.75L15.25 7.75L14 9L14 9.25L13.75 9.25L13.75 9.5L13.5 9.5L13.5 9.75L13.25 9.75L13.25 10L13 10L13 10.25L12.25 11L12.25 11.25L12 11.25L12 11.5L11.75 11.5L11.75 12L11.5 12L11.5 12.25L11.25 12.25L11.25 12.5L11 12.75L11 13L10.75 13L10.75 13.25L10.5 13.5L10.5 13.75L10 14.25L10 14.5L9.75 14.75L9.75 15L9.5 15.25L9.5 15.5L9.25 15.75L9.25 16L9 16.25L9 16.5L8.75 16.75L8.75 17.25L8.5 17.5L8.5 17.75L8.25 18L8.25 18.5L8 18.75L8 19.25L7.75 19.25L7.75 20L7.5 20.25L7.5 21L7.25 21L7.25 22L7 22.25L7 23.25L6.75 23.5L6.75 25.25L6.5 25.25L6.5 30.5L6.75 30.5L6.75 32.25L7 32.5L7 33.5L7.25 33.75L7.25 34.75L7.5 34.75L7.5 35.5L7.75 35.75L7.75 36.25L8 36.5L8 37L8.25 37.25L8.25 37.5L8.5 37.75L8.5 38.25L8.75 38.5L8.75 38.75L9 39L9 39.25L9.25 39.5L9.25 39.75L9 40L9 42L10 42L10 44L9 44L9 45L8 45L8 46L7 46L7 47L6 47L6 48L5 48L5 49L4 49L4 50L3 50L3 51L2.25 51L2 51.25L2 52L4 52L4.25 51.75L4.75 51.75L5 51.5L5 51L6.75 51L7 50.75L7 50L9 50L9 49L11 49L11 48L13 48L13 47L14 47L14 48L16 48L16 48.75L16.25 49L17 49L17 49.5L17.25 49.5L17.5 49.75L17.75 49.75L17.75 50L19 50L19 50.5L19.25 50.75L19.5 50.75L19.5 51L21 51L21 51.5L21.25 51.5L21.25 51.75L21.75 51.75L22 52L23 52L23 52.25L23.25 52.5L24 52.5L24.25 52.75L24.75 52.75L25 53L27 53L27 53.25L27.25 53.5L28.5 53.5L28.75 53.75L35.75 53.75L35.75 53.5L37 53.5L37 53L39.5 53L39.75 52.75L40.5 52.75L40.5 52.5L41 52.5L41 52L42.5 52L42.75 51.75L43 51.75L43 51L44.75 51L45 50.75L45 50L46.5 50L46.75 49.75L47 49.75L47 49L48 49L48 48L49.5 48L50 47.5L50 47L50.75 47L50.75 46.75L51 46.75L51 46L51.75 46L52 45.75L52 45L52.75 45L53 44.75L53 43L54 43L54 42L55 42L55 40L56 40L56 38L57 38L57 36L58 36L58 32L59 32L59 31L60 31L60 29L59 29L59 26L56 26L56 25L55 25L55 24L54 24L54 23L53 23L53 14L48 14L48 13L47 13L47 12L46 12L46 9L45 9L45 7L41 7L41 8L39 8L39 7L36 7L36 6Z";
  var BODY_LINE = "M88 384L-24 424L42 317C-8 218 30 90 127 36C178 7 242-4 242 16C242 24 236 29 225 29C157 29 70 98 51 167C38 214 43 266 66 310L70 317L32 378L87.7 358.6A202.4 202.4 0 0 0 426.6 230.1C426 220 431 213 439 213C447 213 450.5 220 450.5 232.4A226.4 226.4 0 0 1 88 384Z";
  var FACES = {
    cursor: "M16 22h2v1h1v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1h1v-1h1v-1h1v-1h1v-2h-1v-1h-1v-1h-1v-1h-1zM27 31h10v3h-10z",
    eyes: "M19 23h5v7h-5zM38 23h5v7h-5z",
    dots: "M18 28h4v4h-4zM29 28h4v4h-4zM40 28h4v4h-4z",
    happy: "M16 28h4v4h-4zM20 24h4v4h-4zM24 28h4v4h-4zM35 28h4v4h-4zM39 24h4v4h-4zM43 28h4v4h-4z",
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

  function savedPin() {
    try {
      var pin = JSON.parse(window.sessionStorage.getItem(PIN_KEY));
      return pin && isFinite(pin.x) && isFinite(pin.y) ? pin : null;
    } catch (e) {
      return null;
    }
  }

  function rememberPin(pin) {
    try {
      window.sessionStorage.setItem(PIN_KEY, JSON.stringify(pin));
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

    var aside = el("aside", "jiro-buddy", { "aria-label": "Jiro", "data-jiro-state": "idle", "data-jiro-face": "cursor", "data-jiro-motion": "game" });
    var mascot = el("button", "jiro-buddy__mascot", { type: "button", "aria-label": "Ask Jiro for a comment" }, aside);
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
    aside.hidden = true;
    document.body.appendChild(aside);

    var active = null;
    var restingSection = null;
    var speakingSection = null;
    var run = 0;
    var timers = [];
    var spoken = "";
    var placed = false;
    var flight = null;
    var hovered = false;
    var closed = false;
    var face = "cursor";
    var moveId = 0;
    var moving = false;
    var landedAt = 0;
    var peekAnimation = null;
    var peeks = 0;
    var mergedLogo = null;
    var direction = 0;
    var lastScrollY = window.scrollY;
    var reverseDistance = 0;
    var journey = { id: 0, small: 0, start: window.scrollY };
    var said = new Set();
    var longPasses = 0;
    var quiet = false;
    var pinned = savedPin();
    var drag = null;
    var swallowClick = false;
    var restTimer = 0;
    var restBeats = 0;
    var looked = null;
    var pendingKind = "quiet";
    var pendingJourney = 0;

    function schedule(fn, ms) {
      var id = setTimeout(fn, ms);
      timers.push(id);
      return id;
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

    function puff() {
      if (!motion()) return;
      figure.classList.remove("jiro-buddy--puff");
      void figure.offsetWidth;
      figure.classList.add("jiro-buddy--puff");
    }

    function restFace() {
      return aside.getAttribute("data-jiro-motion") === "sleepy" ? "sleepy" : "cursor";
    }

    function closeBubble() {
      if (bubble.contains(document.activeElement)) mascot.focus({ preventScroll: true });
      bubble.hidden = true;
      acts.hidden = true;
      bubble.classList.remove("jiro-buddy--pop");
      aside.removeAttribute("data-jiro-talking");
      text.textContent = "";
      text.removeAttribute("data-rest");
      spoken = "";
      if (drag || moving) return;
      setState("idle");
      setFace(restFace());
    }

    function hideBubble() {
      run += 1;
      timers.forEach(clearTimeout);
      timers = [];
      closeBubble();
    }

    function fit() {
      text.textContent = spoken;
      bubble.style.setProperty("--jiro-dx", "0px");
      aside.classList.remove("jiro-buddy--below");
      var r = bubble.getBoundingClientRect();
      var edge = document.documentElement.clientWidth - 8;
      bubble.style.setProperty("--jiro-dx", (r.left < 8 ? 8 - r.left : r.right > edge ? edge - r.right : 0) + "px");
      aside.classList.toggle("jiro-buddy--below", r.top < 8);
      text.textContent = "";
    }

    function speak(section, token) {
      speakingSection = section;
      said.add(section);
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
      aside.setAttribute("data-jiro-talking", "true");
      fit();
      var finish = function () {
        text.removeAttribute("data-rest");
        acts.classList.remove("jiro-buddy--waiting");
        setState("idle");
        schedule(function later() {
          if (token !== run) return;
          if (bubble.matches(":hover") || bubble.contains(document.activeElement)) schedule(later, 1500);
          else closeBubble();
        }, ask ? ASK_HOLD_MS : LINE_HOLD_MS);
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
      squash(0.9, 1.12, 300);
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
      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var distance = center < rect.top ? rect.top - center : center > rect.bottom ? center - rect.bottom : 0;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = section;
        }
      });
      return best;
    }

    function landFlight() {
      if (flight) flight.cancel();
      flight = null;
      if (peekAnimation) peekAnimation.cancel();
      peekAnimation = null;
      hop.getAnimations().forEach(function (animation) { animation.cancel(); });
    }

    function updateDirection() {
      var now = window.scrollY;
      var delta = now - lastScrollY;
      lastScrollY = now;
      if (Math.abs(delta) < 2) return;
      var next = delta > 0 ? 1 : -1;
      if (next !== direction) {
        reverseDistance += Math.abs(delta);
        if (direction !== 0 && reverseDistance < 60) return;
        direction = next;
        journey = { id: journey.id + 1, small: 0, start: now - next * reverseDistance };
        aside.setAttribute("data-jiro-direction", direction > 0 ? "down" : "up");
      }
      reverseDistance = 0;
      var range = document.documentElement.scrollHeight - window.innerHeight;
      if (!journey.long && range > 0 && Math.abs(now - journey.start) >= range * LONG_PASS) {
        journey.long = true;
        longPasses += 1;
        quiet = longPasses >= QUIET_AFTER;
      }
    }

    function spotSection() {
      if (!pinned) return restingSection;
      var box = mascot.getBoundingClientRect();
      var y = box.top + box.height / 2;
      return sections.reduce(function (best, section) {
        var r = section.getBoundingClientRect();
        var d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
        return !best || d < best.d ? { s: section, d: d } : best;
      }, null).s;
    }

    function passLine() {
      if (!direction || journey.spoke || quiet || closed) return;
      var token = run;
      var journeyId = journey.id;
      schedule(function () {
        if (token !== run || journeyId !== journey.id || journey.spoke || quiet || moving || drag || !bubble.hidden) return;
        var section = spotSection();
        if (!section || said.has(section) || !attr(section, "comment")) return;
        if (!pinned && section !== active) return;
        journey.spoke = true;
        speak(section, run);
      }, PASS_LINE_MS);
    }

    function pickIdle() {
      var styles = journey.bouncy ? ["game", "game", "sleepy"] : ["game", "game", "sleepy", "spring", "eager"];
      var style = styles[Math.floor(Math.random() * styles.length)];
      if (style === "spring" || style === "eager") journey.bouncy = true;
      aside.setAttribute("data-jiro-motion", style);
      if (bubble.hidden) setFace(restFace());
    }

    function express(name, ms) {
      setFace(name);
      squash(1.03, 0.97, 200);
      clearTimeout(restTimer);
      restTimer = setTimeout(function () {
        if (face === name) setFace(restFace());
        rest();
      }, ms);
    }

    function unlook() {
      if (looked) looked.classList.remove("jiro-look-target");
      looked = null;
    }

    function glance() {
      var box = mascot.getBoundingClientRect();
      var cx = box.left + box.width / 2;
      var cy = box.top + box.height / 2;
      var near = Array.prototype.filter.call(document.querySelectorAll("main h2, main h3, main button, main a, main img, main td, main article"), function (item) {
        var r = item.getBoundingClientRect();
        return r.width && r.bottom > 0 && r.top < window.innerHeight &&
          Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) < 520 && !item.contains(mascot);
      });
      if (!near.length) return;
      looked = near[Math.floor(Math.random() * near.length)];
      var r = looked.getBoundingClientRect();
      var dx = r.left + r.width / 2 - cx;
      var dy = r.top + r.height / 2 - cy;
      var size = Math.hypot(dx, dy) || 1;
      aside.style.setProperty("--jiro-gx", (3 * dx / size).toFixed(1) + "px");
      aside.style.setProperty("--jiro-gy", (3 * dy / size).toFixed(1) + "px");
      looked.classList.add("jiro-look-target");
      setFace("glance");
    }

    function rest() {
      clearTimeout(restTimer);
      if (closed || !motion()) return;
      restTimer = setTimeout(function beat() {
        unlook();
        if (closed || !motion()) return;
        if (moving || drag || !bubble.hidden) {
          rest();
          return;
        }
        restBeats += 1;
        if (restBeats % 2) {
          glance();
          restTimer = setTimeout(function () {
            unlook();
            setFace(restFace());
            rest();
          }, GLANCE_MS);
        } else {
          express(Math.random() < 0.5 ? "happy" : "eyes", 900);
        }
      }, REST_BEAT_MS);
    }

    function smallGesture() {
      var sideways = Math.random() < 0.5;
      aside.setAttribute("data-jiro-move", sideways ? "small-scoot" : "small-hop");
      return play(hop, sideways ? [
        { transform: "translate(0,0) rotate(0)" },
        { transform: "translate(7px,-3px) rotate(2deg)", offset: 0.48 },
        { transform: "translate(0,0) rotate(0)" }
      ] : [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-5px) scale(.99,1.01)", offset: 0.48 },
        { transform: "translateY(0) scale(1)" }
      ], 500, "ease-in-out");
    }

    function fillJourneyAtRest(section, id) {
      if (!motion() || !direction || pinned || journey.small >= 2) return;
      var token = run;
      var journeyId = journey.id;
      schedule(function beat() {
        if (closed || token !== run || id !== moveId || active !== section || moving || journey.id !== journeyId) return;
        journey.small += 1;
        smallGesture();
        if (journey.small < 2) schedule(beat, MIN_DWELL_MS);
      }, MIN_DWELL_MS);
    }

    function arc(from, duration) {
      var to = aside.getBoundingClientRect();
      var dx = from.left - to.left;
      var dy = from.top - to.top;
      if (!motion() || (Math.abs(dx) < 1 && Math.abs(dy) < 1)) return Promise.resolve();
      var dir = dx < 0 ? 1 : -1;
      var controlY = Math.min(from.top, to.top) - (to.top > from.top ? 6 : 18);
      setState("flying");
      var frames = [];
      for (var i = 0; i <= GLIDE_STEPS; i += 1) {
        var u = i / GLIDE_STEPS;
        var eased = (1 - Math.cos(Math.PI * u)) / 2;
        var pathY = (1 - eased) * (1 - eased) * from.top + 2 * (1 - eased) * eased * controlY + eased * eased * to.top;
        frames.push({
          offset: u,
          transform: "translate(" + (dx * (1 - eased)) + "px," + (pathY - to.top) + "px) rotate(" + (2 * Math.sin(Math.PI * u) * dir) + "deg)"
        });
      }
      var travelMs = duration || FLIGHT_MS;
      var animation = aside.animate(frames, { duration: travelMs });
      flight = animation;
      schedule(function () { puff(); squash(1.04, 0.96, 180); }, travelMs * 0.9);
      return animation.finished.then(function () {
        if (flight === animation) flight = null;
      }, function () {});
    }

    function spotFor(section) {
      var anchor = target(section, "anchor");
      var box = (anchor || section).getBoundingClientRect();
      if (!box.width || !box.height) box = (target(section, "mobile-anchor") || section).getBoundingClientRect();
      var spot = attr(section, wide.matches ? "spot" : "mobile-spot").split(",").map(Number);
      if (spot.length !== 2 || spot.some(isNaN)) spot = [0.5, 0.5];
      var x = box.left + box.width * spot[0];
      if (wide.matches && x > window.innerWidth * CENTER_EDGE && x < window.innerWidth * (1 - CENTER_EDGE)) {
        x = x < window.innerWidth / 2 ? window.innerWidth * CENTER_EDGE : window.innerWidth * (1 - CENTER_EDGE);
      }
      x = Math.min(Math.max(x, mascot.offsetWidth / 2 + 8), window.innerWidth - mascot.offsetWidth / 2 - 8);
      var y = box.top + box.height * spot[1];
      var sectionBox = section.getBoundingClientRect();
      var halfWidth = mascot.offsetWidth / 2;
      var halfHeight = mascot.offsetHeight / 2;
      var protectedRects = [];
      var headingRects = [];
      section.querySelectorAll("h1,h2,h3,p,summary,.label,a,button,input,li,th,td").forEach(function (item) {
        if (!item.getBoundingClientRect().width) return;
        var range = document.createRange();
        range.selectNodeContents(item);
        var rects = item.matches("input") ? [item.getBoundingClientRect()] : Array.prototype.slice.call(range.getClientRects());
        rects.forEach(function (rect) {
          if (!rect.width || !rect.height) return;
          protectedRects.push(rect);
          if (item.matches("h1,h2,h3")) headingRects.push(rect);
        });
      });
      avoid.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (item) {
          var rect = item.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          protectedRects.push(rect);
          headingRects.push(rect);
        });
      });
      function overlaps(cx, cy, rects) {
        return rects.some(function (rect) {
          return cx + halfWidth + 8 > rect.left && cx - halfWidth - 8 < rect.right &&
            cy + halfHeight + 8 > rect.top && cy - halfHeight - 8 < rect.bottom;
        });
      }
      if (overlaps(x, y, protectedRects) || y - halfHeight < 8 || y + halfHeight > window.innerHeight - 8) {
        var xs = [x, sectionBox.left + halfWidth + 12, sectionBox.left + sectionBox.width * 0.23,
          sectionBox.left + sectionBox.width * 0.77, sectionBox.right - halfWidth - 12];
        var ys = [y, sectionBox.top + halfHeight + 12, sectionBox.bottom - halfHeight - 12,
          (Math.max(0, sectionBox.top) + Math.min(window.innerHeight, sectionBox.bottom)) / 2];
        [0.08, 0.18, 0.3, 0.45, 0.6, 0.75, 0.88].forEach(function (part) {
          ys.push(sectionBox.top + sectionBox.height * part);
        });
        var best = null;
        xs.forEach(function (candidateX) {
          if (wide.matches && candidateX > window.innerWidth * CENTER_EDGE && candidateX < window.innerWidth * (1 - CENTER_EDGE)) {
            candidateX = candidateX < window.innerWidth / 2 ? window.innerWidth * CENTER_EDGE : window.innerWidth * (1 - CENTER_EDGE);
          }
          candidateX = Math.min(Math.max(candidateX, halfWidth + 8), window.innerWidth - halfWidth - 8);
          ys.forEach(function (candidateY) {
            candidateY = Math.min(Math.max(candidateY, sectionBox.top + halfHeight + 8), sectionBox.bottom - halfHeight - 8);
            if (candidateY < halfHeight + 8 || candidateY > window.innerHeight - halfHeight - 8) return;
            var headings = overlaps(candidateX, candidateY, headingRects);
            var text = overlaps(candidateX, candidateY, protectedRects);
            var distance = Math.hypot(candidateX - x, candidateY - y);
            var score = (headings ? 1000000 : 0) + (text ? 100000 : 0) + distance;
            if (!best || score < best.score) best = { x: candidateX, y: candidateY, score: score };
          });
        });
        var stay = (overlaps(x, y, headingRects) ? 1000000 : 0) + (overlaps(x, y, protectedRects) ? 100000 : 0);
        if (best && (best.score < 100000 || best.score < stay)) { x = best.x; y = best.y; }
      }
      return {
        x: x + window.scrollX - mascot.offsetWidth / 2,
        y: y + window.scrollY - mascot.offsetHeight / 2
      };
    }

    function pin(x, y) {
      pinned = { x: x, y: y };
      x = Math.min(Math.max(x, 0), document.documentElement.clientWidth - mascot.offsetWidth);
      y = Math.min(Math.max(y, 0), document.documentElement.clientHeight - mascot.offsetHeight);
      aside.classList.add("jiro-buddy--pinned");
      aside.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
    }

    function place(section) {
      if (pinned) {
        pin(pinned.x, pinned.y);
        return;
      }
      var at = spotFor(section);
      aside.style.translate = at.x.toFixed(1) + "px " + at.y.toFixed(1) + "px";
    }

    function unmerge() {
      if (mergedLogo) mergedLogo.style.visibility = "";
      mergedLogo = null;
      aside.removeAttribute("data-jiro-merged");
    }

    function merge(section) {
      if (pinned) return;
      var logo = target(section, "merge");
      if (!logo || !logo.getBoundingClientRect().width) return;
      var logoBox = logo.getBoundingClientRect();
      var mascotBox = mascot.getBoundingClientRect();
      if (Math.abs(logoBox.left + logoBox.width / 2 - (mascotBox.left + mascotBox.width / 2)) > 12 ||
        Math.abs(logoBox.top + logoBox.height / 2 - (mascotBox.top + mascotBox.height / 2)) > 12) return;
      mergedLogo = logo;
      aside.style.setProperty("--jiro-merge-scale", Math.min(logoBox.width / mascot.offsetWidth, 2.4).toFixed(2));
      aside.setAttribute("data-jiro-merged", "true");
      logo.style.visibility = "hidden";
    }

    function finishMove(section, id) {
      if (id !== moveId) return;
      moving = false;
      landedAt = performance.now();
      restingSection = section;
      if (pendingJourney === journey.id && pendingKind === "small") journey.small += 1;
      pendingKind = "quiet";
      merge(section);
      if (bubble.hidden) setState("idle");
      pickIdle();
      if (motion() && bubble.hidden) express("happy", 900);
      else rest();
      fillJourneyAtRest(section, id);
      passLine();
    }

    async function peekThenFly(section, id) {
      var to = aside.getBoundingClientRect();
      var fromRight = to.left > window.innerWidth / 2;
      var y = Math.min(Math.max(to.top, window.innerHeight * 0.22), window.innerHeight * 0.68);
      var edge = fromRight ? window.innerWidth - mascot.offsetWidth * 0.28 : -mascot.offsetWidth * 0.72;
      var out = fromRight ? window.innerWidth + mascot.offsetWidth : -mascot.offsetWidth * 1.4;
      var transform = function (x) { return "translate(" + (x - to.left) + "px," + (y - to.top) + "px)"; };
      setState("peeking");
      peekAnimation = aside.animate([
        { transform: transform(out), opacity: 0 },
        { transform: transform(edge), opacity: 1, offset: 0.3 },
        { transform: transform(edge), opacity: 1, offset: 0.8 },
        { transform: transform(out), opacity: 0.7 }
      ], { duration: 2400, easing: "ease-in-out", fill: "forwards" });
      await hopIn(section, id, out, y);
    }

    async function hopIn(section, id, x, y) {
      var held = peekAnimation;
      await held.finished.catch(function () {});
      if (id === moveId) await squash(1.06, 0.92, 220);
      held.cancel();
      if (peekAnimation === held) peekAnimation = null;
      if (id !== moveId) return;
      await arc({ left: x, top: y }, 850);
      if (id !== moveId) return;
      await play(hop, [
        { transform: "translateY(0)" },
        { transform: "translateY(-8px)", offset: 0.45 },
        { transform: "translateY(0)" }
      ], 340);
      finishMove(section, id);
    }

    function hopTo(section, kind) {
      var id = ++moveId;
      pendingKind = kind || "quiet";
      pendingJourney = journey.id;
      landFlight();
      unmerge();
      moving = true;
      if (!placed) aside.hidden = closed;
      place(section);
      if (!placed) {
        placed = true;
        restingSection = section;
        landedAt = performance.now();
        if (!motion()) {
          finishMove(section, id);
          return;
        }
        play(aside, [
          { transform: "translateY(24px) scale(.3)", opacity: 0, easing: "cubic-bezier(.3,1.5,.5,1)" },
          { transform: "translateY(-10px) scale(1.06,.96)", opacity: 1, offset: 0.6 },
          { transform: "none" }
        ], 700).then(function () {
          if (id !== moveId) return;
          puff();
          return squash(1.04, 0.96, 180);
        }).then(function () { finishMove(section, id); });
        return;
      }
      peeks += 1;
      peekThenFly(section, id);
    }

    function travelTo(section) {
      var from = aside.getBoundingClientRect();
      var offscreen = from.bottom < 0 || from.top > window.innerHeight;
      if (wide.matches && motion() && (offscreen || direction > 0) && peeks < MAX_PEEKS) {
        aside.setAttribute("data-jiro-move", "large-peek");
        hopTo(section, "large");
        return;
      }
      if (direction && journey.small < 2 && motion()) {
        jumpToCurrent(section, "small");
        smallGesture();
        return;
      }
      jumpToCurrent(section, "quiet");
    }

    function jumpToCurrent(section, kind) {
      var id = ++moveId;
      pendingKind = kind || "quiet";
      pendingJourney = journey.id;
      landFlight();
      aside.getAnimations().forEach(function (animation) { animation.cancel(); });
      unmerge();
      aside.hidden = closed;
      place(section);
      if (pendingKind === "quiet") aside.setAttribute("data-jiro-move", "game-idle");
      finishMove(section, id);
      if (motion()) play(aside, [{ opacity: 0 }, { opacity: 1 }], 300);
    }

    function settle(section, move) {
      if (!move) return;
      var token = run;
      function follow() {
        if (active !== section || token !== run) return;
        var remaining = landedAt + MIN_DWELL_MS - performance.now();
        if (moving || remaining > 0) {
          schedule(follow, moving ? 200 : remaining);
          return;
        }
        if (move) travelTo(section);
      }
      schedule(follow, SETTLE_MS);
    }

    function setActive(section) {
      if (!section || section === active) return;
      active = section;
      hideBubble();
      if (!placed) {
        hopTo(section);
        return;
      }
      if (pinned) {
        restingSection = section;
        schedule(passLine, SETTLE_MS);
        return;
      }
      var far = restingSection && Math.abs(sections.indexOf(section) - sections.indexOf(restingSection)) >= 2;
      if (far) {
        var token = run;
        schedule(function () {
          if (token !== run || closed) return;
          var current = nearestToCenter();
          if (current !== active) {
            setActive(current);
            return;
          }
          travelTo(current);
        }, FAST_SETTLE_MS);
      } else if (section !== restingSection || moving) {
        settle(section, true);
      }
    }

    onChange(wide, function () {
      landFlight();
      moving = false;
      unmerge();
      if (active) place(active);
      if (active) {
        restingSection = active;
        landedAt = performance.now();
        merge(active);
      }
      hideBubble();
    });

    onChange(reduced, function () {
      rest();
      if (reduced.matches) {
        landFlight();
        moving = false;
        if (active) {
          place(active);
          unmerge();
          restingSection = active;
          landedAt = performance.now();
          merge(active);
        }
      }
      if (!reduced.matches || bubble.hidden || !spoken) return;
      var section = active;
      hideBubble();
      if (section) speak(section, run);
    });

    window.addEventListener("resize", function () {
      if (pinned) {
        place(active);
        return;
      }
      if (active && !flight && !peekAnimation) {
        unmerge();
        place(active);
        restingSection = active;
        merge(active);
      }
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

    var observer = new IntersectionObserver(function () {
      setActive(nearestToCenter());
    }, { rootMargin: "-40% 0px -40% 0px" });

    sections.forEach(function (section) { observer.observe(section); });
    var scrollFrame = 0;
    window.addEventListener("scroll", function () {
      updateDirection();
      if (scrollFrame || closed) return;
      scrollFrame = requestAnimationFrame(function () {
        scrollFrame = 0;
        setActive(nearestToCenter());
      });
    }, { passive: true });

    mascot.addEventListener("pointerenter", function () {
      hovered = true;
      setFace(face);
    });
    mascot.addEventListener("pointerleave", function () { hovered = false; setFace(face); });

    mascot.addEventListener("click", function () {
      if (swallowClick) {
        swallowClick = false;
        return;
      }
      if (!restingSection) return;
      quiet = false;
      longPasses = 0;
      said.clear();
      hideBubble();
      speak(spotSection(), run);
    });

    function grab() {
      hideBubble();
      landFlight();
      aside.getAnimations().forEach(function (animation) { animation.cancel(); });
      unmerge();
      unlook();
      clearTimeout(restTimer);
      moving = false;
      moveId += 1;
      aside.classList.add("jiro-buddy--held");
      setState("held");
      setFace("eyes");
    }

    function drop() {
      aside.classList.remove("jiro-buddy--held");
      setState("idle");
      rememberPin(pinned);
      restingSection = spotSection();
      landedAt = performance.now();
      if (motion()) express("happy", 900);
      else setFace(restFace());
    }

    mascot.addEventListener("pointerdown", function (event) {
      swallowClick = false;
      if (!event.isPrimary || event.button !== 0 || !placed) return;
      var box = mascot.getBoundingClientRect();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: box.left, top: box.top, moved: false };
      mascot.setPointerCapture(event.pointerId);
    });

    mascot.addEventListener("pointermove", function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var dx = event.clientX - drag.x;
      var dy = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < DRAG_SLOP) return;
        drag.moved = true;
        grab();
      }
      pin(drag.left + dx, drag.top + dy);
    });

    function endDrag(event) {
      if (!drag || event.pointerId !== drag.id) return;
      var moved = drag.moved;
      drag = null;
      if (!moved) return;
      swallowClick = true;
      setTimeout(function () { swallowClick = false; }, 0);
      drop();
    }

    mascot.addEventListener("pointerup", endDrag);
    mascot.addEventListener("pointercancel", endDrag);
    mascot.addEventListener("lostpointercapture", endDrag);

    mascot.addEventListener("keydown", function (event) {
      var step = event.shiftKey ? NUDGE * 4 : NUDGE;
      var move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!move || !placed) return;
      event.preventDefault();
      var box = mascot.getBoundingClientRect();
      grab();
      pin(box.left + move[0], box.top + move[1]);
      drop();
    });

    yes.addEventListener("click", function () {
      var section = speakingSection;
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
      unmerge();
      observer.disconnect();
      closed = true;
      clearTimeout(restTimer);
      unlook();
      aside.hidden = true;
      rememberHidden();
      if (hadFocus) focusContent();
    });
  }

  function configure(config) {
    avoid = config.avoid || [];
    (config.sections || []).forEach(function (entry) {
      var section;
      try {
        section = document.querySelector(entry.section);
      } catch (e) {}
      if (!section) return;
      Object.keys(entry).forEach(function (key) {
        if (key === "section") return;
        section.setAttribute("data-jiro-" + key.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); }), String(entry[key]));
      });
    });
  }

  function start() {
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1); };
    if (!CONFIG_URL) return idle(init, { timeout: 500 });
    fetch(CONFIG_URL).then(function (response) {
      if (!response.ok) throw new Error("jiro-buddy: " + CONFIG_URL + " returned " + response.status);
      return response.json();
    }).then(function (config) {
      configure(config);
      idle(init, { timeout: 500 });
    });
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
