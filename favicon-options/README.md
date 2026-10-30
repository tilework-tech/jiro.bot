# Jiro favicon options

Review assets on `favicon/options-20261030`, for Martin to choose a direction before favicon integration. This folder stays outside the published `site/` tree. This round does not modify the landing page, add icon links, open a PR, or deploy.

## Candidates

Each candidate includes an editable SVG, PNGs rendered directly at 16, 32, 48 and 180 pixels, a multi-resolution ICO, and a browser-tab mockup. The 180px exports are review-size PNGs; production Apple touch icon masking and opaque backing are deferred until a direction is chosen.

### 01 — Original bubble

The familiar round Jiro mark, with its terminal face and speech tail floating freely.

16px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/01-bubble/16.png

32px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/01-bubble/32.png

180px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/01-bubble/180.png

Light + dark tabs: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/01-bubble/tabs.png

### 02 — Porcelain

A white squircle gives the full-color mascot a stable, quiet backing in either browser theme.

16px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/02-white/16.png

32px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/02-white/32.png

180px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/02-white/180.png

Light + dark tabs: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/02-white/tabs.png

### 03 — Carbon

A carbon tile and fine cream separation keep the full-color bubble distinct on dark chrome.

16px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/03-carbon/16.png

32px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/03-carbon/32.png

180px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/03-carbon/180.png

Light + dark tabs: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/03-carbon/tabs.png

### 04 — Jiro orange

The site’s #FB5E45 accent frames the cream-and-green mascot as a bright but contained tab marker.

16px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/04-orange/16.png

32px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/04-orange/32.png

180px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/04-orange/180.png

Light + dark tabs: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/04-orange/tabs.png

### 05 — Terminal glyph

A heavier monochrome silhouette and pixel-aligned terminal face prioritize recognition at 16px.

16px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/05-mono/16.png

32px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/05-mono/32.png

180px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/05-mono/180.png

Light + dark tabs: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/05-mono/tabs.png

### 06 — Ember bubble

A direct two-tone orange speech bubble turns the terminal face into a compact, distinctive stamp.

16px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/06-signal/16.png

32px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/06-signal/32.png

180px: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/06-signal/180.png

Light + dark tabs: https://raw.githubusercontent.com/tilework-tech/jiro.bot/favicon/options-20261030/favicon-options/06-signal/tabs.png

## Artwork provenance

The primary source is [site/img/jiro-v3.svg](../site/img/jiro-v3.svg) from jiro.bot base commit `0fa2f4e03a48925aeaf8e2464e9787dffe4f16bd`. Its round cream body, green perimeter, orange terminal face and speech tail give Jiro a recognizable compact silhouette. The full-color candidates reuse that SVG geometry, removing its `crispEdges` hint so Chromium can antialias at the export size.

Source colors are cream `#FAF8F2`, green `#1D3B2A` and orange `#FB5E45`; the source also declares `#E2DDCF` on an empty path. Tiles use white `#FFFFFF`, carbon `#0A0A0A`, or the same Jiro orange. Carbon adds a fine cream keyline. The monochrome candidate uses `#161616` and cream; the wildcard uses orange and cream.

The alternative [video/carousel-src/brand/jiro-v4.png](../video/carousel-src/brand/jiro-v4.png) is a 256×259 raster. The light and dark J4 peek-jump ident artwork was also inspected in `tilework-tech/nori-monorepo`, under `docs/specs/jiro-launch/ident/`, on branch `design/jiro-ident-peek-jump` at `48094cede35f9ac9a07fe2ec2236a426475b644c`. Its mascot layers are raster, so it does not provide a cleaner vector source.

## Honest small-size review

The renderer draws each SVG directly onto a canvas of the requested output dimensions; it never enlarges a small PNG to create another size. `05-mono/source-16.svg` is an optical variant with the terminal underscore and cursor adjusted to the 16px grid. Larger sizes use that candidate's standard `source.svg`.

Each `tabs.png` is a 1100×376 Chromium-style mockup with light and dark chrome, neutral neighboring tabs, and the real title `jiro.bot - The tasteful software engineer`. Both Jiro tab icons use the actual `16.png` at 16×16 CSS pixels, integer coordinates and device scale factor 1. View the image at its native dimensions to judge legibility; a fitted thumbnail changes the apparent icon size. The mockup is a designed browser strip, not a screenshot of the live site.

The ICO packages independently rendered 16/32/48 frames as uncompressed 32-bit DIB images with alpha and transparency masks.

## Reproduce and review

From the repository root, with Node 22+ and the session browser available:

```sh
nori-browser
node favicon-options/render.mjs
```

[render.mjs](render.mjs) uses Node built-ins and the existing Chrome DevTools endpoint on port 9222; no npm packages are required. It regenerates the SVGs, PNGs, ICOs, [manifest](manifest.json), and tab mockups from [tab-template.html](tab-template.html). It uses an existing browser tab, so finish any unrelated browser interaction first.

Start the local review page in the background:

```sh
setsid nohup python3 favicon-options/server.py --port 4317 > favicon-options/preview.log 2>&1 < /dev/null &
```

Open the server root to compare the candidates in [index.html](index.html). Browser review notes are stored locally in `favicon-options/review-notes.json`; saving them does not publish a selection or change the live site. See [docs.md](docs.md) for the render and review data flow.
