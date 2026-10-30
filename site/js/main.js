/*
 * jiro.bot: page behaviour.
 * Pixel art uses a 100 ms clock. The feature walkthroughs
 * are scroll-driven in features.js; the hero has its own controller.
 * Each region only touches the DOM when its output changes.
 * Motion is off when the visitor prefers reduced motion; every region then shows a still frame.
 */
(function () {
  "use strict";
  const { jiroGrid, jiroPx, jiroArt } = window.JiroPixels;

  const TOMATO = "#FB5E45",
    NORI = "#1D3B2A",
    INK = "#0A0A0A";
  const reduced = (() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  })();
  const still = reduced;
  const t0 = Date.now();

  // ---------- helpers ----------
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const cache = new WeakMap();
  // write html into el only when it changed
  const put = (el, html) => {
    if (!el || cache.get(el) === html) return;
    cache.set(el, html);
    el.innerHTML = html;
  };
  // pixel runs ({l,t,w,h,c}) as absolutely positioned spans; unit '%' for responsive art
  const pxHtml = (runs, unit) => {
    const u = unit || "px";
    let s = "";
    for (const r of runs)
      s +=
        '<span style="position:absolute;display:block;left:' +
        r.l +
        u +
        ";top:" +
        r.t +
        u +
        ";width:" +
        r.w +
        u +
        ";height:" +
        r.h +
        u +
        ";background:" +
        r.c +
        '"></span>';
    return s;
  };

  const plain = jiroPx({ K: NORI, F: TOMATO, SH: ["#000", "#000", "#000"] });

  // ---------- one frame of state ----------
  function frame() {
    const t = still ? 0 : Date.now() - t0;
    const c = t % 6000;
    // shared blink: every 6 s he blinks (half, shut, half)
    let eyes = "open";
    if (!still && c >= 4800) {
      const b = c - 4800;
      eyes = (b > 600 && b < 700) || (b > 800 && b < 900) ? "half" : b >= 700 && b <= 800 ? "shut" : "open";
    }
    return { t, c, eyes };
  }

  // ---------- regions ----------
  const R = {};

  // header logo: his face, blinking
  R.logo = (f) =>
    put($('[data-px="logo"]'), pxHtml(plain(0, f.eyes, 5, { noShadow: true, faceOnly: true, box: [64, 28] })));

  // compare table header logo: his face in white
  R.logoW = (f) => put($('[data-px="logoW"]'), pxHtml(jiroArt(f.eyes, 1.6, { F: "#FFFFFF" }, { faceOnly: true }).px));

  // footer wordmark: JIRO.BOT where the two Os become his eyes.
  // Loop (10 s): Os, blink shut, open as eyes (O in JIRO is the chevron, O in BOT is the right eye),
  // look left, blink, look right, blink, close back to Os. The right eye is a different secondary face each loop.
  const GLYPHS = {
    J: ["...X", "...X", "...X", "X..X", ".XX."],
    I: ["X", "X", "X", "X", "X"],
    R: ["XXX.", "X..X", "XXX.", "X.X.", "X..X"],
    O: [".XX.", "X..X", "X..X", "X..X", ".XX."],
    ".": [".", ".", ".", ".", "X"],
    B: ["XXX.", "X..X", "XXX.", "X..X", "XXX."],
    T: ["XXX", ".X.", ".X.", ".X.", ".X."],
  };
  const SYM = ["block", "star", "zero", "at", "caret", "hash", "ring", "bento", "dot"];
  // squash a glyph vertically to n rows (pixel blink)
  const squash = (rows, n) => {
    const H = rows.length;
    if (n >= H) return rows;
    if (n <= 0) return [];
    if (n <= 2)
      return Array.from({ length: n }, (_, i) => {
        const a0 = Math.floor((i * H) / n),
          a1 = Math.floor(((i + 1) * H) / n);
        let r = rows[a0].split("");
        for (let j = a0 + 1; j < a1; j++) r = r.map((c, q) => (c === "X" || rows[j][q] === "X" ? "X" : "."));
        return r.join("");
      });
    return Array.from({ length: n }, (_, i) => rows[Math.min(H - 1, Math.round((i * (H - 1)) / (n - 1)))]);
  };
  R.wordmark = (f) => {
    const el = $('[data-px="wordmark"]');
    if (!el) return;
    const width = Math.max(200, el.clientWidth || 1366);
    const ms = width / 32;
    const runs = [];
    const draw = (rows, ox, oy, us) =>
      rows.forEach((row, y) => {
        let i = 0;
        while (i < row.length) {
          if (row[i] !== "X") {
            i++;
            continue;
          }
          let e = i + 1;
          while (e < row.length && row[e] === "X") e++;
          const l = Math.round(ox + i * us),
            tp = Math.round(oy + y * us);
          runs.push({ l, t: tp, w: Math.round(ox + e * us) - l, h: Math.round(oy + (y + 1) * us) - tp, c: INK });
          i = e;
        }
      });
    const word = "JIRO.BOT",
      oSlots = [];
    let x = 0;
    word.split("").forEach((ch, k) => {
      const g = GLYPHS[ch];
      if (ch === "O") oSlots.push(x);
      else draw(g, x * ms, 0, ms);
      x += g[0].length + (k < word.length - 1 ? 1 : 0);
    });
    const LOOP = 10000,
      T = still ? 3400 : f.t % LOOP,
      cyc = still ? 0 : Math.floor(f.t / LOOP);
    let oN = 5,
      eN = 0,
      look = 0;
    if (T >= 2400 && T < 8800) {
      oN = T < 2500 ? 3 : T < 2600 ? 1 : T >= 8700 ? 3 : T >= 8600 ? 1 : 0;
      const blink = (s) => {
        const d = T - s;
        return d < 100 ? 6 : d < 200 ? 2 : d < 300 ? 0 : d < 400 ? 2 : d < 500 ? 6 : 12;
      };
      if (T >= 2800 && T < 8600) {
        eN = T < 2900 ? 2 : T < 3000 ? 6 : 12;
        if (T >= 4800 && T < 5300) eN = blink(4800);
        if (T >= 7000 && T < 7500) eN = blink(7000);
        if (T >= 8300) eN = T < 8400 ? 6 : T < 8500 ? 2 : 0;
      }
      look = T >= 3800 && T < 4500 ? -2 : T >= 6000 && T < 6700 ? 2 : 0;
    }
    if (oN)
      oSlots.forEach((sx) => {
        const rows = squash(GLYPHS.O, oN);
        draw(rows, sx * ms, Math.round((5 - rows.length) / 2) * ms, ms);
      });
    if (eN) {
      const band = (g, c0, c1) =>
        g.slice(22, 34).map((r) =>
          r
            .slice(c0, c1)
            .map((v) => (v === "F" ? "X" : "."))
            .join(""),
        );
      const u = (5 * ms) / 12;
      const groups = [
        [band(jiroGrid("block", 1), 14, 26), 14, 19.5, oSlots[0]],
        [band(jiroGrid(SYM[cyc % SYM.length], 1), 38, 52), 38, 44, oSlots[1]],
      ];
      groups.forEach(([rows, c0, cc, sx]) => {
        const sq = squash(rows, eN);
        draw(sq, (sx + 2) * ms - (cc - c0 - look) * u, Math.round((12 - sq.length) / 2) * u, u);
      });
    }
    el.style.height = Math.round(5 * ms) + "px";
    put(el, pxHtml(runs));
  };

  function render() {
    const f = frame();
    for (const k in R) R[k](f);
  }

  // ---------- pricing: one brief blink as each face first enters view ----------
  function initPricingFaces() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-awake");
        observer.unobserve(entry.target);
      });
    }, { threshold: .5 });
    $$("#pricing .tface").forEach((face) => observer.observe(face));
  }

  // ---------- nav: highlight the section in view ----------
  function initNav() {
    const links = $$("[data-nav]");
    if (!("IntersectionObserver" in window) || !links.length) return;
    const byId = {};
    links.forEach((a) => {
      byId[a.dataset.nav] = a;
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => a.setAttribute("aria-current", a.dataset.nav === e.target.id ? "location" : "false"));
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    Object.keys(byId).forEach((id) => {
      const s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  // ---------- AI slop: compact section progress selects one of three steps ----------
  function initSlop() {
    const box = $("[data-slop]");
    if (!box) return;
    const steps = $$("[data-step]", box);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let queued = false;
    function update() {
      queued = false;
      const rect = box.closest("section").getBoundingClientRect();
      // Begin at viewport entry; finish while the diff panels are still in view.
      const progress = motion.matches ? 1 : (window.innerHeight - rect.top) / (window.innerHeight + rect.height * .45);
      const ramp = (from, to) => Math.max(0, Math.min(1, (progress - from) / (to - from)));
      const first = 1 - ramp(.33, .46);
      const second = ramp(.43, .53) * (1 - ramp(.65, .74));
      const third = ramp(.72, .84);
      const current = progress < .46 ? 0 : progress < .74 ? 1 : 2;
      box.style.setProperty("--frame", String(ramp(.25, .43) * .3));
      box.style.setProperty("--left-focus", String(ramp(.46, .55) * (1 - ramp(.72, .84))));
      box.style.setProperty("--right-focus", String(third));
      [first, second, third].forEach((opacity, i) => {
        steps[i].style.setProperty("--step-opacity", String(opacity));
        steps[i].style.setProperty("--step-offset", (motion.matches ? 0 : i === 2 ? (1 - third) * 18 : 0) + "px");
      });
      box.dataset.at = String(current + 1);
      steps.forEach((step, i) => {
        if (i === current) step.setAttribute("aria-current", "step");
        else step.removeAttribute("aria-current");
      });
    }
    function requestUpdate() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }
    function configure() {
      box.classList.add("slop-ready");
      update();
    }
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("pageshow", requestUpdate);
    motion.addEventListener("change", configure);
    configure();
  }

  // ---------- mobile menu ----------
  function initMenu() {
    const nav = $(".topnav");
    const toggle = $(".nav-toggle");
    if (!nav || !toggle) return;
    const set = (open) => {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => set(!nav.classList.contains("open")));
    // close after choosing a section, on Escape, on a tap outside, or when the screen gets wide again
    $$(".nav-links a", nav).forEach((a) => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        set(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("open") && !nav.contains(e.target)) set(false);
    });
    const wide = window.matchMedia("(min-width: 901px)");
    const onWide = () => {
      if (wide.matches) set(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  }

  render();
  initPricingFaces();
  initNav();
  initSlop();
  initMenu();
  window.addEventListener("resize", () => {
    if (still) render();
  });
  if (!still) setInterval(render, 100);
})();
