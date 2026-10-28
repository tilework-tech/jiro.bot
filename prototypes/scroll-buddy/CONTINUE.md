# Continue the Jiro scroll buddy

Start with `HANDOFF.md`: it is the primary entry point (links, how to run, movement catalogue, placement, comment spots, open items). This file holds the engineering notes from the 2026-10-27 (v6) and 2026-10-28 (v7) sessions; `docs.md` is the architecture and behavior contract.

Also new in this session: `versions/v5/` and `versions/v6/` are frozen, self-contained snapshots (served at `/versions/v5/` and `/versions/v6/` on port 4320); the folder root stays the editable latest and is what the tests target. `moodboard/handoff.html` (served at `/moodboard/handoff.html`) is a generated board of every v6 movement with frequency, placement map and comment spots; it inlines the art and comment rows, so regenerate or hand-edit it when `jiro-buddy.js` or `index.html` change. Work is in `tilework-tech/jiro.bot`, branch `feat/jiro-scroll-buddy`, based on `e4b830d`. The branch is a prototype and is not deployed.

## What Martin asked for (v6, 2026-10-27)

Martin picked A2-A5, B3, B5, C4 and D4 from the original moodboard (`moodboard/index.html`) and asked for:

1. Speech back, but sparse: silent on load, exactly one line per scroll direction pass about the section Jiro sits on, never repeating a section, closing on its own. After 4 "up and down" passes he goes quiet until clicked; clicking always talks.
2. Idle variety (A2-A5): game, sleepy, spring and eager idles picked at random per landing, with the bouncy ones rare.
3. Calmer travel: no big glide or big spring. Keep the one slow edge peek (B3), made slower and longer at the edge, plus small scoots and hops.
4. He looks at stuff (B5) and changes expression (C4) while resting.
5. He grows into the speech bubble (D4).
6. Drag and drop: "exactly where you drop it", on desktop and phone, and he stays there.

## What Martin asked for (v7, 2026-10-28)

Martin said he only saw small moves. Changes, all approved by him:

1. Edge peek root cause: it required his previous spot to be fully off-screen, which never happens for readers who scroll in ~200 px flicks and pause. `travelTo()` now fires it when `(offscreen || direction > 0) && peeks < MAX_PEEKS`, so the first downward section change on desktop (motion allowed, not pinned) always plays it, still once per page visit.
2. Hop-in after a peek (shared `hopIn()`): the peek animation uses `fill: forwards` and is held through a 220 ms crouch (squash 1.06/0.92), then cancelled as the 850 ms arc starts, then the 8 px hop. This removed a ~230 ms flash at the resting spot before the flight.
3. Peek from behind an element: a section can declare `data-jiro-peek="<selector>"`; `#video` uses `#video-frame`. On desktop, with motion, not pinned, the element visible and `journey.covered` unset, `peekBehind()` raises the element's inline `z-index` to the buddy's + 1, starts him tucked behind it, slides him out until ~30% shows at the side edge nearest his resting spot, holds (2000 ms total), then `hopIn()`; the inline `z-index` is restored afterwards. Label `large-peek-behind`. Once per pass, checked before the edge peek and not counted in `peeks`, so the first pass can contain both big moves.
4. Game idle (A2) range +50%: bob 5.25 px, drift ±1.1 px, tilt ±2.25°, timing unchanged, no scale change. Eager now has its own `jiro-buddy-eager-drift` / `-tilt` keyframes with the old values, so only game idle grew. The resting hover cap in tests went from 7 to 9 px.
5. Gzip budget raised from 12 KB to 13 KB ("whatever you need"); currently ~12,600 bytes.
6. `versions/v7/` is a frozen snapshot (`index.html`, buddy files, `jiro-v3.svg`), served at `/versions/v7/` on port 4320. No single-file build was made for v7 (v6 has `jiro-scroll-buddy-v6.html`).

## Start and link the previews

From the repo root, use background processes in a Nori Session:

```bash
setsid -f nohup python3 -m http.server 4320 --directory prototypes/scroll-buddy > /tmp/jiro-scroll-preview.log 2>&1 < /dev/null
setsid -f nohup python3 prototypes/scroll-buddy/moodboard/serve.py --port 4330 > /tmp/jiro-motion-board.log 2>&1 < /dev/null
```

Verify both local ports using the hostname from `NORI_SESSION_URL` as the Host header. For example, set `preview_host=${NORI_SESSION_URL#https://}` and use `curl --connect-to "${preview_host}:80:127.0.0.1:4320" "http://${preview_host}/"`; repeat for port 4330 and `/motion.html`. Resolve a fresh timestamp with `date +%s` and give Martin session URLs for `/port/4320/?t=...`, `/port/4320/moodboard/handoff.html?t=...` and, when comparing, `/port/4320/versions/v6/?t=...`. Boards that need Save (star/note picks) go through port 4330, e.g. `/port/4330/motion.html` or the original board `/port/4330/index.html`. The old preview URLs die with their session. In Slack, wrap resolved URLs in short `<url|label>` links.

## Verified in the 2026-10-28 session (v7)

- `uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py` from the repo root: 36 tests, all pass (headless system Chrome, about 13 minutes). New tests use the reading-pace helper `read_to()` (200 px flicks, 2.5 s pauses) and cover: the edge peek on the first read-down of the real page exactly once per visit, the peek behind a marked element once per pass (fixture `peek.html`), the real landing page peeking behind `#video-frame`, game idle range bounds, and a dropped Jiro never peeking.
- `qa/check_motion.py` accepts `large-peek-behind` alongside `large-peek`, `small-*` and `game-idle`, and passed (down pass: `large-peek`, `small-hop`, `small-hop`). Other checks (at least two small moves, idle style, bubble closed after 13 s, heading clearance at 1440 px and 390 px) are unchanged.
- The two buddy files are ~12,600 bytes gzip against the 13 KB budget.

## Specific implementation details to preserve

- Speech: `passLine()` fires about 900 ms after a landing, once per pass (`journey.spoke`), skips sections in the `said` set, and does nothing while quiet, moving, dragging or already speaking. Auto-close is 4500 ms, or 9000 ms with an ask button. A pass is "long" when it travels at least 50% of the scrollable height; 4 long passes set quiet. Click resets quiet, the long-pass count and `said`, and speaks about `spotSection()`.
- `hideBubble()` cancels timers then calls `closeBubble()`; `closeBubble()` only hides visuals. Auto-close must use `closeBubble()` so the pass's pending small gestures keep playing.
- Motion: `travelTo()` only chooses the peek behind a `data-jiro-peek` element (once per pass via `journey.covered`, checked first), the edge peek (once per page, wide screens, previous spot offscreen or moving down; 2400 ms with keyframes at 0.3 and 0.8), a small gesture (max two per pass, 7 px scoot or 5 px hop), or a quiet `game-idle` jump. `fillJourneyAtRest()` plays remaining small beats at rest and is skipped when pinned.
- Idle: `pickIdle()` picks from game (x2), sleepy, spring, eager on every landing; spring/eager at most once per pass (`journey.bouncy`). Sleepy visuals are keyed on `data-jiro-motion="sleepy"`, not `data-jiro-state`. The existing subdued keyframes are reused (spring bob 6 px). Game idle and eager no longer share drift/tilt keyframes; keep them separate when tuning either.
- Rest loop: `rest()` has its own `restTimer`, 5 s beats alternating `glance()` (3 px face nudge toward a nearby element within 520 px, `.jiro-look-target` for 1.3 s, no layout change) and `express()` (`^_^` happy or `o_o` eyes with a small squash). Paused while moving, dragging or speaking; off under reduced motion. Landing shows `^_^` for 900 ms.
- Talking: `data-jiro-talking` scales the art (1.05, 1.12) with `transform-origin` at the bottom. Reduced motion has no stretch.
- Drag: Pointer Events with pointer capture, 5 px threshold, `touch-action: none` on the mascot only. `pin()` clamps to the viewport and switches to `.jiro-buddy--pinned` (`position: fixed`); the pin is stored in `sessionStorage["jiro-buddy-pin"]`. Pinned Jiro skips travel, peek, docking and rest-spot gestures but still gets one pass line about the section under his centre. Arrow keys (24 px, Shift 96 px) pin without scrolling.
- Unchanged from v5 and still important: `nearestToCenter()` scans all sections (fast jumps target the right one), the 450 ms / 1200 ms / 2000 ms settle timing, `spotFor()` text and heading clearance with the wide-screen centre band excluded, and `merge()` only docking on centre alignment.

## Open items

- Maddy's template ZIP has still not been received; the page is still the hand-built mockup. Porting the two buddy files and section attributes to the real page remains undone, and every resting point needs checking at desktop and phone widths after the port.
- "4 up and down" was interpreted as 4 long passes, each direction counting once (so two full round trips). Confirm with Martin.
- There is no way to un-pin Jiro except clearing the tab session; dragging again just re-pins. Ask Martin whether he wants a reset (for example double-click or the close menu).
- The gzip budget has ~700 bytes of headroom (~12,600 of 13,312 bytes).
- `moodboard/handoff.html` still describes v6 movements (no peek behind, old game idle range, old edge peek trigger); it was not regenerated for v7.
- v7 has no single-file build yet; make one (like `versions/v6/jiro-scroll-buddy-v6.html`) if Martin wants to share it.
- The `share/` video and screenshots are pre-v6. Re-record only after Martin signs off.
- `moodboard/motion.html` still presents glide and spring arrival as live high-motion options; they are no longer in the runtime.
- Moodboard picks for the index, interactions and expressions boards are gitignored (`picks*.json`); only `picks-motion.json` is tracked. If Martin saves picks on those boards, copy them into the handoff or commit them under a tracked name before the session ends.
- The stitched page's auto-greeting test was dropped (`stitched/` is legacy); its three markup tests remain.

## Git and production boundary

The feature branch can be committed and pushed for review. The prototype is not merged, deployed, or connected to the real jiro.bot page. Production changes require a separate, specific approval. Before working further, inspect `git status`, recent commits, and the diff; do not assume this session's processes or URLs survived.
