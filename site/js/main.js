/*
 * jiro.bot: page behaviour.
 * Everything animated on the page runs off one shared clock (a 100 ms tick), so the
 * pixel Jiros, the terminal / Slack / PR panels and the footer wordmark stay in step.
 * Each region only touches the DOM when its output changes.
 * Motion is off when the visitor prefers reduced motion; every region then shows a still frame.
 */
(function () {
  "use strict";
  const { jiroGrid, jiroPx, jiroArt } = window.JiroPixels;

  const TOMATO = "#FB5E45",
    GREEN = "#2BFF6B",
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
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
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
  const onBlack = jiroPx({ K: GREEN, F: TOMATO, SH: ["#2A2A27", "#232320", "#1C1C1A"] });

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

  // a face-only Jiro on a dark ground with its own blink offset
  function termFace(f, off, s, box, face) {
    const f0 = face || "open";
    const cc = (f.t + off) % 6000,
      b = cc - 4800;
    const e =
      still || cc < 4800
        ? f0
        : (b > 600 && b < 700) || (b > 800 && b < 900)
          ? "half"
          : b >= 700 && b <= 800
            ? "shut"
            : "open";
    return onBlack(0, e, s, { faceOnly: true, box });
  }

  // ---------- regions ----------
  const R = {};

  // header logo: his face, blinking
  R.logo = (f) =>
    put($('[data-px="logo"]'), pxHtml(plain(0, f.eyes, 5, { noShadow: true, faceOnly: true, box: [64, 28] })));

  // compare table header logo: his face in white
  R.logoW = (f) => put($('[data-px="logoW"]'), pxHtml(jiroArt(f.eyes, 1.6, { F: "#FFFFFF" }, { faceOnly: true }).px));

  // Jiro vs. other agents: big terminal face
  R.howFace = (f) => put($('[data-px="howFace"]'), pxHtml(termFace(f, 1500, 20, [256, 104], "open")));

  // PR comparison: the regular agent's numbers count up, its bullet list keeps growing
  R.vid = (f) => {
    const vc = still ? 1e9 : f.t % 9000;
    const ramp = Math.min(1, vc / 4500);
    const fmt = (n) => Math.round(n).toLocaleString("en-US");
    const set = (k, v) => {
      const el = $('[data-text="' + k + '"]');
      if (el && el.textContent !== v) el.textContent = v;
    };
    set("vid.addA", fmt(12659 * ramp));
    set("vid.delA", fmt(1649 * ramp));
    set("vid.filesA", fmt(171 * ramp));
    set("vid.commitsA", fmt(100 * ramp));
    const bloat = [
      "Updated homepage components",
      "Refactored layout and styling",
      "Improved responsiveness across devices",
      "Enhanced performance optimizations",
      "Added new utility functions",
      "Updated configuration files",
      "Fixed various issues",
      "Cleaned up code",
    ];
    put(
      $('[data-list="vid.bloat"]'),
      bloat
        .map((x, i) => '<div class="gh-li" style="opacity:' + (vc >= i * 520 ? 1 : 0) + '">' + esc(x) + "</div>")
        .join(""),
    );
  };

  const typed = (str, start, now, cps) =>
    now >= 1e9 ? str : now < start ? "" : str.slice(0, Math.floor(((now - start) * cps) / 1000));
  const loop = (f, p) => (still ? 1e9 : f.t % p);

  // 01: Jiro maps the repo, then writes a plan
  R.f1 = (f) => {
    const c1 = loop(f, 9600);
    const tree = [
      "repo/",
      "  apps/web/",
      "    routes/checkout.tsx",
      "  services/payments/",
      "    webhook.ts",
      "    charge.ts",
      "    retry.ts",
      "  packages/ui/",
      "  infra/terraform/",
    ];
    const scan = Math.min(tree.length - 1, Math.floor(c1 / 420));
    const mapped = c1 >= 4200;
    put(
      $('[data-list="feat.f1Tree"]'),
      tree
        .map((x, i) => {
          const hit = mapped && (i === 4 || i === 5),
            cur = !mapped && i === scan;
          const op = c1 >= i * 420 ? (cur || hit ? 1 : 0.55) : 0;
          const bg = cur ? "rgba(251,94,69,0.22)" : hit ? "rgba(43,255,107,0.16)" : "transparent";
          return '<div class="fline" style="opacity:' + op + ";background:" + bg + '">' + esc(x) + "</div>";
        })
        .join(""),
    );
    const plan = [
      "record the event before charging",
      "key retries on the event id",
      "back off: 2s, 8s, 30s",
      "test a double delivery",
    ];
    put(
      $('[data-list="feat.f1Plan"]'),
      plan
        .map((x, k) => {
          const at = 4600 + k * 900,
            done = c1 >= at + 600;
          return (
            '<div class="fline" style="opacity:' +
            (c1 >= at ? 1 : 0) +
            ';white-space:normal"><span style="color:' +
            (done ? GREEN : "#8FA89A") +
            '">' +
            (done ? "[x]" : "[ ]") +
            "</span> " +
            esc(typed(x, at, c1, 48)) +
            "</div>"
          );
        })
        .join(""),
    );
    put(
      $('[data-px="f1Face"]'),
      pxHtml(termFace(f, 400, 4, [64, 28], mapped ? (c1 >= 8200 ? "star" : "caret") : "zero")),
    );
    const stat = $('[data-bind="f1Stat"]');
    if (stat) {
      const txt = c1 >= 8200 ? "plan ready" : mapped ? "planning" : "reading";
      if (stat.textContent !== txt) stat.textContent = txt;
      stat.style.color = c1 >= 8200 ? GREEN : TOMATO;
    }
  };

  // 02: a teammate tags @jirobot in a Slack thread and he answers
  R.f2 = (f) => {
    const c2 = loop(f, 10800);
    const jiroAv = pxHtml(plain(0, f.eyes, 1.3, { noShadow: true, box: [28, 28] }));
    const you = { av: "#3A3F3A", px: "", nc: "#5C5C5C" },
      ji = { av: "transparent", px: jiroAv, nc: INK };
    const conv = [
      [you, "maya", "@jirobot add bulk actions to the orders table. labels and CSV export.", 300, 0],
      [ji, "jiro", "On it. Reading the table and the export service first.", 1600, 38],
      [ji, "jiro", "One question: should export respect the current filters?", 3600, 38],
      [you, "maya", "yes, filtered rows only.", 5400, 0],
      [ji, "jiro", "Draft PR #1284 is up: bulk select, labels, filtered CSV. 3 commits.", 6800, 38],
    ];
    put(
      $('[data-list="feat.f2Msgs"]'),
      conv
        .map(([a, who, x, at, cps]) => {
          const vis = c2 >= at && c2 < 10200;
          const txt = cps && c2 < 1e9 ? typed(x, at, c2, cps) : x;
          const tag = txt.startsWith("@jirobot") ? "@jirobot" : "";
          const rest = tag ? txt.slice(8) : txt;
          const cursor = cps && vis && c2 < 1e9 && txt.length < x.length;
          return (
            '<div style="display:' +
            (vis ? "flex" : "none") +
            ';gap:12px;align-items:flex-start">' +
            '<span style="flex:none;position:relative;width:28px;height:28px;background:' +
            a.av +
            '">' +
            a.px +
            "</span>" +
            '<div style="display:flex;flex-direction:column;gap:3px"><span class="fmeta" style="color:' +
            a.nc +
            ';font-size:9px">' +
            who +
            "</span>" +
            "<span style=\"font-family:'Sohne','Helvetica Neue',Helvetica,sans-serif;font-size:13px;line-height:1.4\"><span style=\"font-family:'JetBrains Mono',monospace;font-size:0.92em\">" +
            tag +
            "</span>" +
            esc(rest) +
            '<span class="wc" style="display:' +
            (cursor ? "inline-block" : "none") +
            '"></span></span></div></div>'
          );
        })
        .join(""),
    );
  };

  // 03: checks pass, the diff fills in, the PR merges
  R.f3 = (f) => {
    const c3 = loop(f, 10400);
    const checks = ["typecheck", "unit tests", "e2e · checkout", "jiro review"];
    put(
      $('[data-list="feat.f3Checks"]'),
      checks
        .map((n, k) => {
          const ok = c3 >= 900 + k * 900;
          return (
            '<div class="fline" style="display:flex;gap:10px;align-items:center"><span style="flex:none;width:8px;height:8px;background:' +
            (ok ? "#1ED65A" : "#DADAD4") +
            '"></span><span style="flex:1">' +
            esc(n) +
            '</span><span style="color:' +
            (ok ? INK : "#8A8A8A") +
            '">' +
            (ok ? "passed" : "running") +
            "</span></div>"
          );
        })
        .join(""),
    );
    const diff = [
      ["+ const selected = useSelection(rows)", "a"],
      ["- <Toolbar />", "d"],
      ["+ <BulkBar onLabel={label} onExport={exportCsv} />", "a"],
      ["+ exportCsv(rows.filter(isVisible))", "a"],
      ['+ test("exports filtered rows only")', "a"],
    ];
    put(
      $('[data-list="feat.f3Diff"]'),
      diff
        .map(
          ([x, k], i) =>
            '<div class="fline" style="opacity:' +
            (c3 >= 300 + i * 450 ? 1 : 0) +
            ";background:" +
            (k === "a" ? "rgba(43,255,107,0.22)" : "rgba(251,94,69,0.18)") +
            '">' +
            esc(x) +
            "</div>",
        )
        .join(""),
    );
    const merged = c3 >= 6000;
    const pill = $('[data-bind="f3Pill"]');
    if (pill) {
      const txt = merged ? "Merged" : "Open";
      if (pill.textContent !== txt) pill.textContent = txt;
      pill.style.background = merged ? TOMATO : GREEN;
    }
    const foot = $('[data-bind="f3Foot"]');
    if (foot) foot.style.opacity = merged ? 1 : 0;
  };

  // reserve panel: a sushi counter with seven stools; the open one blinks green
  R.counter = (f) => {
    const el = $('[data-px="counter"]');
    if (!el) return;
    const P = 6,
      W = ($("#reserve") || {}).clientWidth || 560,
      cols = Math.max(40, Math.floor(W / P));
    const on = still || Math.floor(f.t / 600) % 2 === 0;
    const RICE = "#FAF8F2",
      GRAIN = "#E2DDCF",
      OPEN = on ? GREEN : null,
      H = 19;
    const g = Array.from({ length: H }, () => new Array(cols).fill(null));
    const set = (x, y, c) => {
      if (c && y >= 0 && y < H && x >= 0 && x < cols) g[y][x] = c;
    };
    for (let x = 0; x < cols; x++) {
      set(x, 0, RICE);
      set(x, 1, (x * 7 + 3) % 11 === 0 ? GRAIN : RICE);
      set(x, 2, RICE);
      set(x, 3, GRAIN);
    }
    const n = 7,
      gap = (cols - n * 5) / n;
    for (let k = 0; k < n; k++) {
      const x0 = Math.round(gap / 2 + k * (5 + gap)),
        c = k === n - 1 ? OPEN : RICE,
        d = k === n - 1 ? OPEN : GRAIN;
      [1, 2, 3].forEach((dx) => set(x0 + dx, 6, c));
      [0, 1, 2, 3, 4].forEach((dx) => set(x0 + dx, 7, c));
      [0, 1, 2, 3, 4].forEach((dx) => set(x0 + dx, 8, d));
      [9, 10, 11, 12, 13, 14].forEach((y) => set(x0 + 2, y, c));
      [1, 2, 3].forEach((dx) => set(x0 + dx, 13, c));
      set(x0 + 1, 15, c);
      set(x0 + 3, 15, c);
      set(x0 + 1, 16, c);
      set(x0 + 3, 16, c);
      set(x0, 17, c);
      set(x0 + 4, 17, c);
    }
    const runs = [];
    g.forEach((row, y) => {
      let x = 0;
      while (x < cols) {
        const cc = row[x];
        if (!cc) {
          x++;
          continue;
        }
        let e = x + 1;
        while (e < cols && row[e] === cc) e++;
        runs.push({
          l: ((x / cols) * 100).toFixed(4),
          t: ((y / H) * 100).toFixed(4),
          w: (((e - x) / cols) * 100 + 0.05).toFixed(4),
          h: (100 / H + 0.05).toFixed(4),
          c: cc,
        });
        x = e;
      }
    });
    el.style.aspectRatio = cols + " / " + H;
    put(el, pxHtml(runs, "%"));
  };

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
  initNav();
  initMenu();
  window.addEventListener("resize", () => {
    if (still) render();
  });
  if (!still) setInterval(render, 100);
})();
