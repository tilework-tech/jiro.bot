# Jiro.bot v2

v2 rebuilds the Jiro scroll site from Martin Stübler's brief of 2026-10-01: a 16-bit pixel-art sushi restaurant seen from one fixed ¾ camera. The page slides straight down through seven stops: **hero → product → good/bad comparison → comparison table → FAQ → price → koi pond**. One continuous conveyor belt runs through all of them. v2 supersedes PR #13's `../site/` as the active build. That build stays in the tree because v2 reuses its copy and games.

## Status: stop 4 built, review gate C

Round 2 (`PLAN-R2.md`) applied Martin's 2026-10-01 17:44 feedback: much higher resolution for everything (above all Jiro, people, dust spirits and belt items), a smooth belt, fewer plates, then one more stop and a stop for review. Round 3 (`PLAN-R3.md`) applies his gate-B review: "crank it up a bit more and use even higher resolution moving forward", and in stop 3 move everything down so the belt runs along the bottom with only table space, condiments and the cat beneath it. This tree is at review gate B with round 3 applied:

- the hero bar, the crawlspace band (band 0), the product stop, band 1 and stop 3 "compare" (*Same prompt. Different chef.*), all at the round-3 resolution
- stop 3 reframed: the art shifted down with outpainted ceiling beams, the belt along the bottom, a new set of sprites and eggs for what is now in view
- the belt, plates and belt items at grain 8, gliding sub-pixel, with plates on about half the slots
- the Easter-egg tracker
- round 4 (`PLAN-R3.md`, "Round 4 addendum"): the product stop's pixel art is redrawn at about half size in the bottom-right corner, so the scripted demo panel is about 1.5× larger and nearly fills the screen
- round 5 (`PLAN-R3.md`, "Round 5 addendum"): stop 3's replay panels run down to the belt, every belt end is cut horizontally where architecture covers it, and a scroll surges the belt harder (up to 6×) and longer (0.3 s) before the page moves

Stop 4 (`PLAN-S4.md`, after Martin's "produce the next scene according to the plan") is now built on top of that, and the tree is at review gate C:

- band 2, a floor-slab cutaway between the dining room and the kitchen with a dust spirit hanging from a cable and a pair of eyes
- stop 4 "How Jiro compares": a dim kitchen corner with the noriagentic.com comparison table on a light cream HTML menu board (Martin, 2026-09-29: "make the table more visible, lighter colours against the dark background"), refreshed to the live site's copy of 2026-10-01
- Sushi Rush playing in place in the stop's arcade cabinet, in a same-origin iframe loaded on first click, snapped per frame to the master palette, paused when it scrolls out of view
- the belt's right-edge run moved to x = 320 so it runs inside the steel shaft painted in band 2 and stop 4

Open question for Martin: stop 4 has no Jiro (the brief puts him in the hero, product, FAQ and street).

The remaining three stops (FAQ, price, pond) come after Martin's review. `site/src/main.ts` only mounts the stops listed in `BUILT`. The belt route already runs on to the pond, but it is hidden below the last built stop.

**Resolution.** World coordinates stay 360 units across. Rooms and bands are fitted at grain 4 (1440 art px across, 1 CSS px per art px at 1440 wide). Characters, creatures, clickable props and all belt art are grain 8 (one art px per device pixel on a 2× retina screen at 1440 wide). The site sizes each scene canvas to the device (2, 4 or 8 canvas px per world unit) and averages finer art down once at load, so 1× screens and phones do not carry 8× canvases. Grain 8 is the ceiling the current 4K masters support. Gemini cannot draw pixel art this fine, so its scene masters are flat illustrations and our scripts make the pixel grid (see `art/README.md`, "Detail").

## Where things are

| Path | What |
| --- | --- |
| `DESIGN-BRIEF.md` | The approved visual spec. It overrides the videos where they disagree. |
| `PLAN.md`, `PLAN-R2.md`, `PLAN-R3.md`, `PLAN-S4.md`, `QUESTIONS.md` | The implementation plans (gate A, rounds 2 and 3, stop 4) and Martin's decisions |
| `research/` | Frame-by-frame analyses of the nine reference videos (see `research/README.md`) |
| `palette/` | The 56-colour master palette, plus a LibreSprite variant with a transparent slot at index 0 |
| `art/` | Specs, prompts, refs, raw Gemini output, the Gemini call log and `.ase` sources. See `art/README.md`. |
| `tools/` | The art pipeline: Gemini → fit → LibreSprite → export |
| `site/` | Vite + TypeScript site that reads exported art from `site/public/art/`. See `site/docs.md`. |
| `review/` | Stills and the scroll recording from the last capture |

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
npm run build
PORT=3301 node serve.mjs        # static server over dist/ with byte ranges and a /__diag beacon
npm test                        # Vitest: unit (belt model) + art (palette, plates, loops, motion budget, resolution)
npm run test:e2e                # Playwright: Chromium + WebKit, each at 1440×900 desktop and 390×844 mobile
```

Playwright builds and serves the site on port 3301 itself, and reuses a server that is already running there.

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

1. `tools/soften.py` blurs an approved master, and `tools/gen.mjs` has Gemini repaint it as a 4K flat illustration. `tools/shift-down.py` reframes a master downward so Gemini can outpaint the top (stop 3), and `tools/shrink-place.py` shrinks a master into one corner so Gemini can outpaint the rest (product).
2. `tools/fit.py` pixelates it onto the grain-4 grid and snaps it to the palette.
3. `tools/ls-index.sh` indexes it to the palette.
4. `tools/frames.py` builds the animation frames for each sprite, at the sprite's grain.
5. `tools/export-scene.py` writes `site/public/art/<scene>/`.

Belt art goes through `tools/cut-sheet.py`, then `tools/item-frames.py`, then `tools/export-belt.sh`. After any re-export, run `npm test` in `site/`. The art tests enforce:

- the palette
- plate colours
- seamless loops
- the motion budget
- resolution: room layers at least 4 art px per world unit, detail sprites grain 8 or finer, plates at least 120 px, items 56 px up to 70% of a plate
