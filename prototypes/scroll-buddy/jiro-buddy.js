(function () {
  "use strict";

  if (window.__jiroBuddyLoaded) return;
  window.__jiroBuddyLoaded = true;

  var STORAGE_KEY = "jiro-buddy-hidden";
  var SETTLE_MS = 600;
  var TYPE_MS = 28;
  var ANNOUNCE_MS = 100;
  var FLIGHT_MS = 1100;
  var GLIDE_STEPS = 20;
  var CLICK_HOLD_MS = 1200;
  var THINK_MS = 750;
  var LOOK_MS = 700;
  var LOOK_LINGER_MS = 1800;
  var SLEEP_AFTER_MS = 20000;
  var BAND = 0.17;
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
    aside.hidden = true;
    document.body.appendChild(aside);

    var visible = new Set();
    var seen = new Set();
    var active = null;
    var run = 0;
    var timers = [];
    var looked = null;
    var spoken = "";
    var placed = false;
    var flight = null;
    var hovered = false;
    var closed = false;
    var face = "cursor";
    var sleepTimer = 0;
    var entered = Promise.resolve();
    var clickHold = 0;
    var clicks = new WeakMap();

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
      fit();
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

    function landFlight() {
      if (flight) flight.cancel();
      flight = null;
    }

    function glide(t) {
      var u = Math.min(Math.max((t - 0.1) / 0.74, 0), 1);
      return (1 - Math.cos(Math.PI * u)) / 2;
    }

    function arc(from) {
      var to = aside.getBoundingClientRect();
      var dx = from.left - to.left;
      var dy = from.top - to.top;
      if (!motion() || (Math.abs(dx) < 1 && Math.abs(dy) < 1)) return Promise.resolve();
      var dir = dx < 0 ? 1 : -1;
      var lift = Math.min(0, dy) - 70;
      var at = function (t, y, r) {
        var k = 1 - t;
        return "translate(" + dx * k + "px," + (dy * k + y) + "px) rotate(" + r * dir + "deg)";
      };
      setState("flying");
      var frames = [
        { offset: 0, transform: at(0, 0, 0), easing: "ease-out" },
        { offset: 0.1, transform: at(0, 6, 3) }
      ];
      for (var i = 1; i <= GLIDE_STEPS; i += 1) {
        var u = i / GLIDE_STEPS;
        var rest = (1 - u) * (1 - u);
        frames.push({
          offset: 0.1 + 0.74 * u,
          transform: at(glide(0.1 + 0.74 * u), lift * Math.sin(Math.PI * u) + 6 * rest,
            3 * rest - 8 * Math.sin(2 * Math.PI * u))
        });
      }
      frames[frames.length - 1].easing = "ease-out";
      frames.push(
        { offset: 0.92, transform: at(1, 2, -2), easing: "ease-in-out" },
        { offset: 1, transform: at(1, 0, 0) }
      );
      var animation = aside.animate(frames, { duration: FLIGHT_MS });
      flight = animation;
      schedule(function () { puff(); squash(1.16, 0.84, 240); }, FLIGHT_MS * 0.84);
      return animation.finished.then(function () {
        if (flight === animation) flight = null;
      }, function () {});
    }

    function spotFor(section) {
      var box = (target(section, "anchor") || section).getBoundingClientRect();
      var band = (document.querySelector("[data-jiro-band]") || document.querySelector("main") || document.body).getBoundingClientRect();
      var x = Math.min(Math.max(box.left + box.width / 2, band.left + band.width * BAND), band.right - band.width * BAND);
      return {
        x: x + window.scrollX - mascot.offsetWidth / 2,
        y: box.top + box.height / 2 + window.scrollY - mascot.offsetHeight / 2
      };
    }

    function place(section) {
      var at = spotFor(section);
      aside.style.translate = at.x.toFixed(1) + "px " + at.y.toFixed(1) + "px";
    }

    function hopTo(section) {
      var from = aside.getBoundingClientRect();
      landFlight();
      if (!placed) aside.hidden = closed;
      place(section);
      if (!placed) {
        placed = true;
        if (!motion()) return;
        entered = play(aside, [
          { transform: "translateY(24px) scale(.3)", opacity: 0, easing: "cubic-bezier(.3,1.5,.5,1)" },
          { transform: "translateY(-10px) scale(1.06,.96)", opacity: 1, offset: 0.6 },
          { transform: "none" }
        ], 700).then(function () { puff(); return squash(1.16, 0.84, 240); });
        return;
      }
      var top = Math.min(Math.max(from.top, -from.height), window.innerHeight);
      arc({ left: from.left, top: top });
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
      if (flight) await flight.finished.catch(function () {});
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
      if (performance.now() < clickHold) {
        seen.add(section);
        hopTo(section);
        return;
      }
      hideBubble();
      hopTo(section);
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
      if (active) place(active);
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
      if (active && !flight) place(active);
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

    var quips = ((document.querySelector("[data-jiro-hovers]") || aside).getAttribute("data-jiro-hovers") || "")
      .split("|").map(function (line) { return line.trim(); }).filter(Boolean);
    var quipAt = 0;
    var quipTime = -Infinity;

    function dodge() {
      var away = quipAt % 2 ? -1 : 1;
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

    document.addEventListener("click", function (event) {
      var node = event.target;
      if (closed || !wide.matches || !(node instanceof Element) || aside.contains(node)) return;
      var section = sections.filter(function (s) { return s.contains(node); }).pop() || null;
      var source = node.closest("[data-jiro-click]");
      if (source && section && !section.contains(source)) source = null;
      if (!source && !section) return;
      var lines = (source ? source.getAttribute("data-jiro-click") : attr(section, "comment"))
        .split("|").map(function (line) { return line.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var key = source || section;
      var count = clicks.get(key) || 0;
      clicks.set(key, count + 1);
      hideBubble();
      if (section) seen.add(section);
      clickHold = performance.now() + CLICK_HOLD_MS;
      if (source && source !== section) {
        looked = source;
        source.classList.add("jiro-look-target");
      }
      var b = mascot.getBoundingClientRect();
      var dx = event.clientX - (b.left + b.width / 2);
      var dy = event.clientY - (b.top + b.height / 2);
      var len = Math.max(Math.hypot(dx, dy), 1);
      aside.style.setProperty("--jiro-gx", (dx / len * 2.5).toFixed(2) + "px");
      aside.style.setProperty("--jiro-gy", (dy / len * 2.5).toFixed(2) + "px");
      hopOnce(10, 320);
      say(lines[count % lines.length], "", run);
    });

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
