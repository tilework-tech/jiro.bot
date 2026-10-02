# Jiro.bot v2

v2 rebuilds the Jiro scroll site from Martin Stübler's brief of 2026-10-01: a 16-bit pixel-art sushi restaurant seen from one fixed ¾ camera. The page slides straight down through seven stops: **hero → product → good/bad comparison → comparison table → FAQ → price → koi pond**. One continuous conveyor belt runs through all of them. v2 supersedes PR #13's `../site/` as the active build. That build stays in the tree because v2 reuses its copy and games.

## Status: all seven stops built, final review

Martin asked on 2026-10-01 for the rest of the scroll in one pass: "build the entire scroll animation until the very end in one go… come back with one final review link". `PLAN-FINAL.md` is that pass, and the tree is now at the final review. Every stop and band is built and mounted (`BUILT` in `site/src/main.ts` lists all seven).

What came before, in order:

- Round 2 (`PLAN-R2.md`) applied Martin's 2026-10-01 17:44 feedback: much higher resolution for everything (above all Jiro, people, dust spirits and belt items), a smooth belt and fewer plates.
- Round 3 (`PLAN-R3.md`) applied his gate-B review: "crank it up a bit more and use even higher resolution moving forward", and stop 3 moved down so the belt runs along the bottom. Rounds 4 and 5 (addenda in the same file) halved the product art so the demo panel nearly fills the screen, ran the stop-3 panels down to the belt, cut every belt end horizontally, and made the scroll surge stronger.
- Stop 4 (`PLAN-S4.md`): band 2, the comparison table on a cream menu board, Sushi Rush in the arcade cabinet, and the belt's right-hand run moved to x = 320 inside the painted steel shaft.

The final pass (`PLAN-FINAL.md`) added:

- band 3 (storage cutaway with a dust-spirit bunk room), band 4 (drain cross-section) and band 5 (garden wall with a moon gate)
- stop 5, the FAQ counter: the live noriagentic.com FAQ verbatim, as question bubbles over six plates; clicking one makes Jiro answer
- stop 6, the night street: the live plans on hanging paper tags, Jiro on a bicycle at a red light
- stop 7, the koi pond: closing CTAs, Daily Roll in the yatai stall, and the koi that leaps over the belt trestle and eats what is on the plates in its arc
- the belt running straight down the right-hand shaft from stop 3 to the pond, then one turn onto the trestle
- the no-JavaScript still page (`site/public/still/`), far-off scene canvases released to save memory, and 87 Easter eggs in the tracker

Open question for Martin: stop 4 has no Jiro (the brief puts him in the hero, product, FAQ and street; the pond has none by design).

**Resolution.** World coordinates stay 360 units across. Rooms and bands are fitted at grain 4 (1440 art px across, 1 CSS px per art px at 1440 wide). Characters, creatures, clickable props and all belt art are grain 8 (one art px per device pixel on a 2× retina screen at 1440 wide). The site sizes each scene canvas to the device (2, 4 or 8 canvas px per world unit) and averages finer art down once at load, so 1× screens and phones do not carry 8× canvases. Grain 8 is the ceiling the current 4K masters support. Gemini cannot draw pixel art this fine, so its scene masters are flat illustrations and our scripts make the pixel grid (see `art/README.md`, "Detail").

## Where things are

| Path | What |
| --- | --- |
| `DESIGN-BRIEF.md` | The approved visual spec. It overrides the videos where they disagree. |
| `PLAN.md`, `PLAN-R2.md`, `PLAN-R3.md`, `PLAN-S4.md`, `PLAN-FINAL.md`, `QUESTIONS.md` | The implementation plans (gate A, rounds 2–5, stop 4, the final pass) and Martin's decisions |
| `research/` | Frame-by-frame analyses of the nine reference videos (see `research/README.md`) |
| `palette/` | The 56-colour master palette, plus a LibreSprite variant with a transparent slot at index 0 |
| `art/` | Specs, prompts, refs, raw Gemini output, the Gemini call log and `.ase` sources. See `art/README.md`. |
| `tools/` | The art pipeline: Gemini → fit → LibreSprite → export |
| `site/` | Vite + TypeScript site that reads exported art from `site/public/art/`. See `site/docs.md`. |
| `review/` | Stills and the scroll recording from the last capture (`site/tools/capture.mjs` stills cover the stops up to the table) |

## Prerequisites

**LibreSprite 1.2.** Extract the AppImage. This does not need root or FUSE.

```bash
mkdir -p /home/sprite/org/workspace/.local/tools && cd $_
curl -LO https://github.com/LibreSprite/LibreSprite/releases/download/v1.2/LibreSprite-anylinux-x86_64.AppImage
chmod +x LibreSprite-anylinux-x86_64.AppImage && ./LibreSprite-anylinux-x86_64.AppImage --appimage-extract
export LIBRESPRITE=$PWD/squashfs-root/AppRun   # default used by tools/ls-index.sh
```

`tools/ls-index.sh` runs LibreSprite headless with `SDL_VIDEODRIVER=offscreen`, passing a generated `--script`. LibreSprite runs that script in UI mode, so the process never exits by itself. Its saves are only flushed to disk when the process receives SIGTERM. The wrapper therefore works in four steps:

1. Wait `LS_WAIT` seconds (default 3).
2. Send SIGTERM.
3. Poll until both the `.png` and the `.ase` exist.
4. SIGKILL any leftovers.

If a large image comes out empty, raise `LS_WAIT`. The wrapper also creates a private `XDG_RUNTIME_DIR` if one is missing.

**Other tools**

- `GEMINI_API_KEY` for `tools/gen.mjs`
- Node 22
- `uv` for the Python tools (dependencies are inline script metadata)
- `ffmpeg` to convert the Playwright `.webm` recording into `review/scroll-desktop.mp4`. It is not installed on the VM; the `ffmpeg-static` npm binary works: `npm i ffmpeg-static` in a temp dir and symlink its `ffmpeg` onto `PATH`.

## Site

```bash
cd site
npm ci
npm run build                   # writes public/still/index.html (tools/build-still.mjs), type-checks, then vite build
PORT=3301 node serve.mjs        # static server over dist/ with byte ranges and a /__diag beacon
npm test                        # Vitest: unit (belt model) + art (palette, plates, loops, motion budget, resolution)
npm run test:e2e                # Playwright: Chromium + WebKit, each at 1440×900 desktop and 390×844 mobile
```

Playwright builds and serves the site on port 3301 itself, and reuses a server that is already running there.

**Rebuilding.** The site only reads exported files under `site/public/`, so a rebuild after an art change is: re-export (`tools/export-scene.py art/specs/<scene>.json`, or `tools/export-belt.sh` for belt art and the koi), then `npm test` and `npm run build` in `site/`. `npm run build` regenerates the still page first. `node tools/build-still.mjs` can also be run on its own; it pulls the table, FAQ and pricing copy out of `src/content.ts` and the base PNG of each stop, so it must be rerun whenever that copy or a stop's base changes, and it fails loudly if it cannot find the copy.

**WebKit on the Linux VM.** WebKit needs host libraries that cannot be installed without root. Before running e2e tests or the capture, run:

```bash
source /home/sprite/org/workspace/.local/webkit-env.sh
```

This setup is session-local and gitignored, so a new session must rebuild it:

1. Fetch Playwright's WebKit dependencies (Debian 12) without root. The VM's `/var/lib/apt/lists` is empty, so point `APT_CONFIG` at a config whose lists and cache dirs are private, run `apt-get update`, take the package list from `npx playwright install-deps --dry-run webkit`, add `libglib2.0-bin` and `libgl1-mesa-dri`, and `apt-get download` them all (fonts included).
2. Extract each package into `.local/webkit-libs/` with `dpkg -x`, then compile the extracted GSettings schemas with the system `glib-compile-schemas`.
3. `.local/webkit-overlay.sh` builds `.local/pw-browsers/`, an overlay of `~/.cache/ms-playwright` whose WebKit `MiniBrowser` wrappers append `PW_WEBKIT_EXTRA_LD_PATH` to `LD_LIBRARY_PATH`. The stock wrappers overwrite `LD_LIBRARY_PATH`. `webkit-env.sh` runs it itself when the overlay is missing.
4. `webkit-env.sh` sets the following, all pointing into the extracted tree:
   - `PLAYWRIGHT_BROWSERS_PATH`
   - `PW_WEBKIT_EXTRA_LD_PATH`
   - the GStreamer, GIO, GSettings, GL and EGL paths
   - `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`, because Playwright's host check only reads the process's own `LD_LIBRARY_PATH` and so reports the overlay libraries as missing

Some WebKit e2e cases are skipped by design.

**Review capture.** With the site served:

```bash
node tools/capture.mjs http://127.0.0.1:3301/ ../review
```

This writes:

- a wheel-driven Chromium recording, converted to `scroll-desktop.mp4` with ffmpeg
- desktop stills from Chromium and WebKit (the Chromium compare still scrolls straight to its stop after the recording; WebKit adds the table stop)
- retina stills of the hero, compare and table stops from Chromium at deviceScaleFactor 2, plus one with Sushi Rush started (`retina-table-game.png`)
- iPhone 13 stills from WebKit, including the table stop

When sharing a preview URL, cache-bust with `?v=<timestamp>`, never `?t=`. Martin's standing rule comes from earlier sketch builds, where `?t=` froze the animation clock.

## Regenerating art

See `art/README.md`. In short:

1. `tools/soften.py` blurs an approved master, and `tools/gen.mjs` has Gemini repaint it as a 4K flat illustration. `tools/shift-down.py` reframes a master downward so Gemini can outpaint the top (stop 3), `tools/shrink-place.py` shrinks a master into one corner so Gemini can outpaint the rest (product), and `tools/shift-x.py` slides a master sideways so its painted steel shaft lines up with the belt at x = 320 (FAQ, street, band 4).
2. `tools/fit.py` pixelates it onto the grain-4 grid and snaps it to the palette.
3. `tools/ls-index.sh` indexes it to the palette.
4. `tools/frames.py` builds the animation frames for each sprite, at the sprite's grain.
5. `tools/export-scene.py` writes `site/public/art/<scene>/`.

Belt art (including the koi) goes through `tools/cut-sheet.py`, then `tools/item-frames.py` for living items, then `tools/export-belt.sh`. After any re-export, run `npm test` in `site/`. The art tests enforce:

- the palette
- plate colours
- seamless loops
- the motion budget
- resolution: room layers at least 4 art px per world unit, detail sprites grain 8 or finer, plates at least 120 px, items 56 px up to 70% of a plate

## Gemini spend

`art/log/gemini-calls.jsonl` has one line per call. The final pass (entries from 2026-10-02T00:00 UTC on) made 49 calls, about $6.80 at list price:

| Calls | Model and size | Unit | Subtotal |
| --- | --- | --- | --- |
| 9 | `gemini-3-pro-image` 4K (six scene masters, the street edit, the two shaft outpaints) | $0.24 | $2.16 |
| 19 | `gemini-3-pro-image` 1K/2K (Jiro, soot-sprite and eye frame edits, two masks, two koi renders) | $0.134 | $2.55 |
| 21 | `gemini-3.1-flash-image` 2K (lantern, sushi, cat, firefly and other frame edits) | $0.101 | $2.12 |

To recount, filter the log on its `t` field and group by `model` and `size`.
