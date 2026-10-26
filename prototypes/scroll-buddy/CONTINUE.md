# Continue the Jiro scroll buddy tomorrow

This is the handoff for the 2026-10-26 session. Read `docs.md` for architecture and the current behavior contract. Work is in `tilework-tech/jiro.bot`, branch `feat/jiro-scroll-buddy`, based on `e4b830d`. The branch is a prototype and is not deployed.

## What Martin asked for, in order

1. Restore the playful but calm hover and keep the avatar away from the center and readable headings.
2. Use open monochrome space; sometimes dock into existing Jiro logos instead of standing beside them.
3. Follow the section the reader actually reaches, including a fast jump to the bottom.
4. Peek slowly from the left or right edge at least once, then land with a small joyful bounce.
5. Draw a new board with low, medium, and high movement groups.
6. Bake in a direction-pass rule: one bigger move, two smaller moves, then game idle as the default.
7. Save the work in git so it can be resumed tomorrow.

The resulting page is silent until Jiro is clicked. The original mockup layout remains intact apart from marker positions and making the FAQ reserve seal visible on narrow screens for docking. Motion remains restrained: the flight arc is capped, idle bob is 3.5 px, and local small gestures are 5 or 7 px.

## Start and link the previews

From the repo root, use background processes in a Nori Session:

```bash
setsid -f nohup python3 -m http.server 4320 --directory prototypes/scroll-buddy > /tmp/jiro-scroll-preview.log 2>&1 < /dev/null
setsid -f nohup python3 prototypes/scroll-buddy/moodboard/serve.py --port 4330 > /tmp/jiro-motion-board.log 2>&1 < /dev/null
```

Verify both local ports using the hostname from `NORI_SESSION_URL` as the Host header. For example, set `preview_host=${NORI_SESSION_URL#https://}` and use `curl --connect-to "${preview_host}:80:127.0.0.1:4320" "http://${preview_host}/"`; repeat for port 4330 and `/motion.html`. Resolve a fresh timestamp with `date +%s` and give Martin session URLs for `/port/4320/?t=...` and `/port/4330/motion.html?t=...`. The old preview URLs die with their session. In Slack, wrap resolved URLs in short `<url|label>` links.

## Verified in the 2026-10-26 session

- `uv run --no-project --with playwright python qa/check_motion.py` passed against the session's headed Chrome with no page errors.
- A fast down scroll produced `large-peek`, then `small-scoot`, then `small-hop`. A fast up scroll produced `large-spring`, then `small-scoot`, then `small-hop`. Both ended idle and silent.
- The browser check found no mascot collision with heading glyphs in hero, pricing, or bakeoff at 1440 px and 390 px.
- The new board rendered three groups and nine tiles with no broken mascot images. Star and note saving persisted through a reload via `serve.py`. The test pick was cleared afterward.
- `node --check jiro-buddy.js` and `git diff --check` passed. The two buddy assets total about 10.5 KB gzip.

## Specific implementation details to preserve

- `nearestToCenter()` scans all commented sections. Do not restore the old visible-only selection, which lagged after fast jumps.
- `setActive()` waits 450 ms for a jump of two or more section indices and 1200 ms for nearby transitions. `settle()` also honors the 2000 ms dwell. This keeps fast catch-up without making nearby movement erratic.
- `updateDirection()` accumulates a 60 px reversal before resetting the large/small budget. `travelTo()` chooses the next beat. `fillJourneyAtRest()` completes the two small gestures if the user stops at the destination. Pending timers are canceled by `hideBubble()` when the section changes.
- The one offscreen edge peek is an exception to the direction quota. It can produce a second large beat in a pass if the quota's first large move already happened. This preserves Martin's earlier request to see a peek at least once on the page.
- `data-jiro-motion="game"` is constant in the live page. The calm, sleepy, and other low-motion examples in the board are options, not random live idle modes. High and small arrival variants are randomized.
- `spotFor()` starts at each section marker, rejects text overlap when a clear visible alternate exists, and excludes the wide-screen center band. Ditch and FAQ use `data-jiro-merge`. `merge()` checks center alignment before hiding the original image.
- CSS idle motion is layered on nested spans inside the mascot, while travel uses Web Animations API on the outer aside or inner hop span. Reduced motion has no CSS animation and `play()` resolves immediately.
- The bubble only appears on mascot click. Do not reintroduce scroll-triggered or hover-triggered comments without Martin's explicit change of direction.

## Open items

- The older `tests/test_scroll_buddy.py` assumes v4 automatic comments and center placement. It is not a valid gate for this version until updated. The new `qa/check_motion.py` tests the current rule.
- The old share video and screenshots are from earlier flows. Re-record only after Martin signs off on the current motion.
- The original Maddy ZIP and copy editor page were not available here. Porting to that real page remains undone.
- The text clearance fallback samples candidate positions. If no clear visible position exists, it retains the planned anchor, potentially offscreen. Check new page widths, translated copy, and changed layouts visually.
- A very short pass interrupted by a quick direction reversal may not have time to play all three beats. The new direction cancels pending moves, as requested for responsive scrolling.
- Picks saved in `moodboard/picks-motion.json` are tracked by git. If Martin adds picks tomorrow, read them before changing the animation, then commit and push the updated file to make them durable across machines.

## Git and production boundary

The feature branch can be committed and pushed for review. The prototype is not merged, deployed, or connected to the real jiro.bot page. Production changes require a separate, specific approval. Before working further, inspect `git status`, recent commits, and the diff; do not assume this session's processes or URLs survived.
