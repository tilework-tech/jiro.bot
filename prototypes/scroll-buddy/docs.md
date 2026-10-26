# Jiro scroll buddy prototype

Status on 2026-10-26: working, scrollable prototype on `feat/jiro-scroll-buddy` in `tilework-tech/jiro.bot`. This is not deployed to jiro.bot. The current landing page is a hand-built HTML reconstruction, not Maddy's final HTML or the ZIP mentioned in the Slack thread. The requested ZIP and `restore-copy-editor` bundle were not present in this workspace. Keep the mockup separate from the production site until the source page is available.

## Open it in a future session

From the repository root, start both servers in the background:

```bash
setsid -f nohup python3 -m http.server 4320 --directory prototypes/scroll-buddy > /tmp/jiro-scroll-preview.log 2>&1 < /dev/null
setsid -f nohup python3 prototypes/scroll-buddy/moodboard/serve.py --port 4330 > /tmp/jiro-motion-board.log 2>&1 < /dev/null
```

The scrollable page is on port 4320 at `/`; the new movement moodboard is on port 4330 at `/motion.html`. Use the current session's `NORI_SESSION_URL` and `/port/4320/` or `/port/4330/motion.html`, with a fresh `?t=<unix timestamp>` in links. Preview URLs from a previous session are not durable. The moodboard's Save button writes the tracked `moodboard/picks-motion.json` through `serve.py`; commit and push any new picks before ending a later session so they are durable beyond the current machine.

## Files

| File | Purpose |
|---|---|
| `index.html` | Scrollable landing-page reconstruction with section markers and safe resting points. |
| `jiro-buddy.js`, `jiro-buddy.css` | Dependency-free runtime and isolated styling. These are the two files meant for transplanting to a real HTML site. |
| `jiro-v3.svg` | Mascot art used by the mockup's existing likenesses. |
| `moodboard/motion.html` | New three-level movement board, nine live examples, speed/pause/replay/theme controls, stars, notes, and a direction-pass preview. |
| `moodboard/jiro-v3.svg` | Local art copy so the moodboard server can serve tiles independently. |
| `moodboard/index.html` | Original 5 by 5 board, now linked to the new board. |
| `moodboard/interactions.html`, `moodboard/expressions.html` | Earlier design boards, not a specification of current behavior. |
| `qa/check_motion.py` | Browser regression check against the session's headed Chrome. |
| `stitched/`, `share/` | Earlier screenshot demo and explainer. Their art and behavior are older than this version. |

## Design provenance and decisions

- The mockup's top follows Maddy's 2026-10-19 screenshot. Lower sections follow the 2026-10-14 review mock. The Slack-style hero thread, video graphic, pricing layout, and resting markers were created for this prototype. Later Figma copy edits are not available in this checkout.
- Martin chose the newer Jiro balloon: smooth outline with a pixel `>_` face. The `jiro-v3.svg` image in the Ditch card and reserve seal is an existing likeness. The buddy hides the image and occupies its position when docked there.
- The v4 branch tip placed Jiro near section centers and auto-commented. Martin found it too central, erratic, and high-jumping. The current version uses left or right blank areas, keeps his center out of the middle 35% to 65% of the viewport on wide screens, caps arc height, and waits for scrolling to settle.
- Martin asked for a silent observer. Scroll, hover, and page clicks do not open speech bubbles. Clicking Jiro opens the current section's line; clicking again replays it. The close button hides him for the rest of the tab via `sessionStorage`.
- Martin asked for the old video game hover, a slow edge peek at least once, occasional short hops, and no overlap with readable headings. The latest rule makes the layered game idle the default and budgets one large plus two small moves for each direction pass.
- No production site code, external application, or live page has been changed.

## Runtime behavior

### Section selection and pacing

`nearestToCenter()` considers every section with `data-jiro-comment` and selects the one at the viewport's vertical center. An `IntersectionObserver` and passive scroll listener both feed it, so a fast jump from hero to footer targets FAQ directly. Initial placement pops in over 700 ms. A nearby section waits 1200 ms after selection and respects a minimum 2000 ms dwell at the current resting point. A jump across at least two section indices is handled after 450 ms, preserving fast-scroll catch-up. Pending callbacks check the active section and a run token before acting.

### Directional motion budget

A direction pass begins on the first scroll movement. At least 60 px of movement in the opposite direction starts a new pass; shorter reversals are ignored as jitter. Each pass budgets an initial large beat and two small beats. The first offscreen peek can add one extra large beat later in the same pass:

1. The first eligible section change uses a large move. On wide screens, if the previous spot is offscreen and Jiro has not peeked yet, he peeks from the nearer side. The peek takes 1700 ms, followed by an 850 ms bounded flight and a 340 ms landing bounce. At most one such peek occurs per page load. Otherwise a large move randomly chooses a bounded arc flight or a 13 px spring arrival.
2. The next two eligible section changes get small moves. Each randomly chooses a 5 px hop or a 7 px side scoot, each 500 ms.
3. If the user stops after a large move, the remaining small beats play at the current safe spot, spaced by at least 2000 ms. A later section change cancels those local beats and uses the remaining budget there.
4. Subsequent section changes reposition Jiro quietly. His resting animation is always layered game idle: 3.5 px bob, 0.75 px sideways drift, 1.5 degree tilt, slight squash, and shrinking shadow on different cycles. It is not randomly replaced at every landing.
5. A direction reversal resets the budget. Motion interrupted by another scroll is canceled. A pass reversed or closed before its queued beats complete cannot display all three beats; the new direction takes priority.

The board groups the repertoire by visual intensity. Low has game idle, calm float, and sleepy sway. Only game idle is the live default; the others remain design options. Medium has live small hop and side scoot, plus a curious-tilt option. High has live bounded glide, edge peek, and spring arrival. Board examples loop so differences are easy to compare; the page runtime schedules individual beats.

### Placement and readable text

Every mockup section has a `data-jiro-anchor` pointing at an image or a one-pixel `.jiro-rest` marker. Desktop anchors alternate left and right. Hero, video, pillars, How, pricing, and bakeoff use deliberately empty, mostly solid-color resting space. Ditch and FAQ point at existing Jiro images. Pricing's marker is left of the heading, not on it. Mobile overrides place markers in smaller blank areas; the reserve seal remains visible so Jiro can dock into it on phones.

At placement time, `spotFor()` measures visible text in headings, paragraphs, labels, summary rows, links, buttons, list items, and table cells with DOM `Range.getClientRects()`. If an anchor overlaps readable text or is out of view, it samples nearby positions in the current section, favors a fully clear visible spot, and rejects candidates covering a heading. If no clear candidate exists, it keeps the planned anchor, which may be offscreen. This is still a prototype: inspect new layouts and translations in a browser. Flight paths may pass briefly near content; resting points are the protected targets.

`data-jiro-merge` points at a likeness. The buddy merges only when its actual center matches the visible logo's center within 12 px. The logo becomes `visibility:hidden` while Jiro occupies it and is restored when he moves away or closes. Scale is capped at 2.4. There is no forced merge if a safe fallback moved him elsewhere.

### Speech and accessibility

Jiro is quiet on load and while scrolling. Clicking his button displays the section line. Speech typing uses a visible paragraph, while an `aria-live` status announces the complete sentence once. Questions can show Yes and Later; Yes scrolls and focuses the configured action target. A section change closes the bubble. `prefers-reduced-motion: reduce` turns off CSS hover and Web Animations API motion while preserving placement, comments, and logo docking. The close control is keyboard accessible. Jiro creates no layout shift because the `<aside>` is absolutely positioned and moved by `translate`.

## Host-page attributes

| Attribute | Current behavior |
|---|---|
| `data-jiro-comment="..."` | Required on sections to opt in and supplies the click comment. |
| `data-jiro-anchor="selector"` | Preferred center. If absent, section center is the starting candidate. |
| `data-jiro-mobile-anchor="selector"` | Fallback only when the main anchor has no rendered size. |
| `data-jiro-merge="selector"` | Optional logo that Jiro can replace when he lands on its center. |
| `data-jiro-ask="..."` | Optional affirmative button label in the speech bubble. |
| `data-jiro-action="selector"` | Target scrolled into view and focused when the affirmative button is clicked. |

Old `data-jiro-hovers`, `data-jiro-look`, `data-jiro-mood`, and `data-jiro-click` behavior from v4 is inactive. Dead instances were removed from the mockup. Earlier moodboards and the old explainer still show those concepts as design history.

## Verification and limitations

Start the port 4320 preview and the Nori session browser, then from `prototypes/scroll-buddy` run:

```bash
uv run --no-project --with playwright python qa/check_motion.py
node --check jiro-buddy.js
git diff --check
```

The browser check connects to the existing headed Chrome at CDP port 9222. It tests a fast down pass and fast up pass, verifies one large and two small moves per settled pass, game idle, silent speech, and heading clearance in hero, pricing, and bakeoff at 1440 px and 390 px. It does not launch a separate browser. On 2026-10-26 it passed with zero page errors. The buddy JS and CSS together compressed to about 10.5 KB, under the existing 12 KB budget.

The repository's older `tests/test_scroll_buddy.py` still describes v4 automatic speech and center placement. Its behavior assertions need an intentional update before it can be used as a gate for this version. The standalone regression check above covers the new motion rule. The `share/` video and stills also show an older flow. There is no current production integration or complete Maddy source page in this branch.

## Next session

1. Fetch `feat/jiro-scroll-buddy` and read this document plus `CONTINUE.md`.
2. Start both preview servers in the background, verify the session host header for ports 4320 and 4330, and give Martin fresh session links.
3. Read `moodboard/picks-motion.json` if Martin saved stars or notes. The file is tracked, but new picks are local until committed and pushed.
4. Get Martin's visual feedback on the one-large, two-small pacing. Keep the silent observer behavior and heading clearance while adjusting.
5. Once the actual Maddy HTML or ZIP is available, transplant the two buddy files and markers, then check every resting point at desktop and phone widths before any deployment.
6. Update the old browser tests and old share video when the interaction is approved. Do not merge or deploy from this prototype without explicit approval.

Created and maintained by Nori.
