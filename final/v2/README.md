# Jiro.bot v2

v2 rebuilds the Jiro scroll site from Martin Stübler's brief of 2026-10-01: a 16-bit pixel-art sushi restaurant seen from one fixed ¾ camera. The page slides straight down through seven stops: **hero → product → good/bad comparison → comparison table → FAQ → price → koi pond**. One continuous conveyor belt runs through all of them. v2 supersedes PR #13's `../site/` as the active build. That build stays in the tree because v2 reuses its copy and games.

## Status: review gate A, on the v2.1 brief

Gate A (Martin's decision 8 in `CHANGES-FROM-DRAFT.md`) is built and merged into `site/final-pixel-restaurant`. It covers:

- the hero bar and the crawlspace band below it
- the product stop
- the belt, plates and belt items, including clicks, drag/drop and rare events
- the Easter-egg tracker

The other five stops are Phase 2 (`PLAN.md`). `site/src/main.ts` only mounts the stops listed in `BUILT`. The belt route already runs on to the pond, but nothing draws it past the last built stop.

Martin's answers of 2026-10-01 (`CHANGES-FROM-DRAFT.md`, last section) are applied: the hero belt is diagonal and every later run is horizontal or vertical with rounded corners; the CTA reads "Reserve a seat"; Jiro has no jaw vent and his jaw plate drops along the mouth outline when he speaks (click him); the soot sprites are Spirited-Away-style susuwatari drawn at hero grain; the product-scene Jiro has no pupils. Web fonts are self-hosted in `site/public/fonts/` (OFL texts alongside), so the page makes no third-party request on load.

## Where things are

| Path | What |
| --- | --- |
| `DESIGN-BRIEF.md` | The approved visual spec. It overrides the videos where they disagree. |
| `PLAN.md`, `QUESTIONS.md` | The implementation plan and Martin's decisions |
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
- `ffmpeg` to convert the Playwright `.webm` recording into `review/scroll-desktop.mp4`

## Site

```bash
cd site
npm ci
npm run build
PORT=3301 node serve.mjs        # static server over dist/ with byte ranges and a /__diag beacon
npm test                        # Vitest: unit (belt model) + art (palette, plates, loops, motion budget)
npm run test:e2e                # Playwright: Chromium and WebKit, each at 1440×900 and as a phone (Pixel 7 / iPhone 13)
```

Playwright builds and serves the site on port 3301 itself, and reuses a server that is already running there.

**WebKit on the Linux VM.** WebKit needs host libraries that cannot be installed without root. Before running e2e tests or the capture, run:

```bash
source /home/sprite/org/workspace/.local/webkit-env.sh
```

This setup is session-local and gitignored, so a new session must rebuild it:

1. `apt-get download` Playwright's WebKit dependencies (Debian 12) into a user-writable apt state (`-o Dir::State=/tmp/apt -o Dir::Cache=/tmp/apt/cache -o Debug::NoLocking=1`, after an `update` with the same options). `install-deps --dry-run` fails on this image because of missing font packages; read the `debian12` → `webkit` package list out of `playwright-core/lib/coreBundle.js` instead.
2. Extract each package into `.local/webkit-libs/` with `dpkg -x`. Playwright's list omits transitive libraries; `ldd` the extracted `.so` files and `MiniBrowser` and fetch what is reported missing (on this image: `libgstreamer-plugins-bad1.0-0`, `libflite1`, `libgav1-1`, `liborc-0.4-0`, `librav1e0`, `libsvtav1enc1`, `libwebpmux3`, `libyuv0`, `libdw1`, `libabsl20220623`, `libgraphene-1.0-0`, `libnice10`, `libgupnp-igd-1.0-4`, `liblzo2-2`, `libxkbcommon-x11-0`, `libva2`, `libva-drm2`, `libcloudproviders0`, `libcairo-script-interpreter2`) plus Mesa for software GL (`libegl-mesa0 libegl1 libgl1-mesa-dri libgbm1 libglapi-mesa libglvnd0 libgles2 libllvm15 libdrm2 …`), because the VM has no GPU and WebKit aborts with "Could not create EGL display" without it.
   Do not add `glib-networking`: its GnuTLS GIO module crashes this WebKit's network process. The sandboxed WebKit therefore has no TLS, which is why the site's fonts are self-hosted.
3. Run `.local/webkit-overlay.sh`. It builds `.local/pw-browsers/`, an overlay of `~/.cache/ms-playwright` whose WebKit `MiniBrowser` wrappers append `PW_WEBKIT_EXTRA_LD_PATH` to `LD_LIBRARY_PATH`. The stock wrappers overwrite `LD_LIBRARY_PATH`.
4. `webkit-env.sh` sets the following, all pointing into the extracted tree:
   - `PLAYWRIGHT_BROWSERS_PATH`
   - `PW_WEBKIT_EXTRA_LD_PATH`
   - the GStreamer, GSettings and EGL vendor paths, with `GIO_MODULE_DIR` pointing at an empty directory
   - `LIBGL_ALWAYS_SOFTWARE=1`, `EGL_PLATFORM=surfaceless`, `GALLIUM_DRIVER=llvmpipe`, `LIBGL_DRIVERS_PATH`
   - `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`, since Playwright's own `ldd` check does not see the overlay

**Review capture.** With the site served:

```bash
node tools/capture.mjs http://127.0.0.1:3301/ ../review
```

This writes:

- a wheel-driven Chromium recording, converted to `scroll-desktop.mp4` with ffmpeg
- desktop stills from Chromium and WebKit
- iPhone 13 stills from WebKit

When sharing a preview URL, cache-bust with `?v=<timestamp>`, never `?t=`. Martin's standing rule comes from earlier sketch builds, where `?t=` froze the animation clock.

## Regenerating art

See `art/README.md`. In short:

1. `tools/gen.mjs` produces a scene master.
2. `tools/fit.py` fits it onto the native grid.
3. `tools/ls-index.sh` indexes it to the palette.
4. `tools/frames.py` builds the animation frames for each sprite.
5. `tools/export-scene.py` writes `site/public/art/<scene>/`.

Belt art goes through `tools/cut-sheet.py`, then `tools/item-frames.py`, then `tools/export-belt.sh`. After any re-export, run `npm test` in `site/`. The art tests enforce:

- the palette
- plate colours
- seamless loops
- the motion budget
