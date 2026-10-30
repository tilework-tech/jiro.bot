# Noridoc: Favicon Options

Path: @/favicon-options

### Overview

- Review-only favicon artwork and browser-strip mockups for selecting a Jiro mark before site integration.
- [README.md](README.md) records artwork provenance, export conventions, reproduction commands and candidate download URLs.

### How it fits into the larger codebase

- [render.mjs](render.mjs) reads the existing mascot in [site/img/jiro-v3.svg](../site/img/jiro-v3.svg), then writes only inside this folder. The production page and icon links are unchanged.
- The site's [deployment workflow](../.github/workflows/deploy.yml) publishes `site/`; this review folder remains outside that tree. Selection and production integration are separate work.

```text
site/img/jiro-v3.svg -> render.mjs -> candidate SVG / PNG / ICO
                          |                    |
                   tab-template.html          |
                          |                    v
                       tabs.png <------- index.html
                                             |
                                         server.py
                                             |
                                     review-notes.json
```

### Core Implementation

- [render.mjs](render.mjs) extracts the mascot group, constructs tile and simplified variants, and uses the existing Chrome DevTools endpoint with Node built-ins. Each PNG is drawn directly onto a canvas at its final dimensions. The monochrome tab-size export uses an optical adjustment recorded in its separate SVG.
- The ICO encoder converts canvas RGBA into bottom-up BGRA DIB frames with aligned transparency masks, then writes a directory of frame sizes and offsets. It uses the same direct-sized pixels as the PNG exports.
- [tab-template.html](tab-template.html) embeds the tab-size PNG in light and dark browser strips. The renderer checks image dimensions, integer placement and device scale before capturing each mockup.
- [index.html](index.html) reads [manifest.json](manifest.json), displays matching-size PNGs and opens mockups without fitting them to the viewport. Shortlist and text edits remain in page state until saved through [server.py](server.py); the save button is disabled while a request is pending.
- The single-threaded Python server serves this folder, handles the session port prefix and disables caching. Requests are serialized so saves cannot overlap while replacing the shared temporary notes file. Saving accepts a bounded JSON object keyed by manifest candidate IDs with boolean shortlist values and string notes, writes a temporary file, then replaces `review-notes.json`. Invalid review payloads return HTTP 400; other POST paths return 404. An absent notes file reads as an empty object.

### Things to Know

- Rendering uses an existing browser tab and requires the session Chrome endpoint to be available. Browser command failures and rendering exceptions stop generation; the renderer does not install dependencies.
- Mockups show the actual tab-size PNG at device scale 1. Browser zoom or external image resizing changes its apparent size; the review dialog preserves native dimensions and allows horizontal scrolling.
- Review saves affect only the local notes file. A failed save leaves edits visible in the page with a retry message; it does not select or publish a production favicon.
- Apple touch-size PNGs are for visual review. Production masking and backing are deferred until the chosen direction is integrated.

Created and maintained by Nori.
