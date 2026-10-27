# Handoff prompt: Jiro scroll buddy

Paste everything below into a new agent session (or hand it to a designer or engineer) to continue the Jiro scroll buddy as a project.

---

You are taking over the **Jiro scroll buddy**: an animated `>_` speech-bubble mascot ("Jiro") that floats beside the content of the jiro.bot landing page as you scroll. He hovers gently, moves into each section you read, and occasionally comments on it. The owner is **Martin Stübler** (GTM, martin@noriagentic.com, Slack `U0BMHUGUZ5Z`), who directs the work in Slack. Work happens in `tilework-tech/jiro.bot` on branch `feat/jiro-scroll-buddy` (PR #22, open, not merged). It is a prototype. Nothing is deployed and nothing touches the live jiro.bot site.

## Links

| What | Where |
|---|---|
| This handoff (always latest) | https://github.com/tilework-tech/jiro.bot/blob/feat/jiro-scroll-buddy/prototypes/scroll-buddy/HANDOFF.md |
| **v6, latest version** (frozen snapshot) | https://github.com/tilework-tech/jiro.bot/tree/feat/jiro-scroll-buddy/prototypes/scroll-buddy/versions/v6 |
| **v5, previous version** (frozen snapshot) | https://github.com/tilework-tech/jiro.bot/tree/feat/jiro-scroll-buddy/prototypes/scroll-buddy/versions/v5 |
| Working copy (where edits go) | https://github.com/tilework-tech/jiro.bot/tree/feat/jiro-scroll-buddy/prototypes/scroll-buddy |
| **Handoff moodboard**: every movement, grouped, with frequency and placement | https://github.com/tilework-tech/jiro.bot/blob/feat/jiro-scroll-buddy/prototypes/scroll-buddy/moodboard/handoff.html |
| Behaviour contract (engineering) | https://github.com/tilework-tech/jiro.bot/blob/feat/jiro-scroll-buddy/prototypes/scroll-buddy/docs.md |
| Session-to-session notes | https://github.com/tilework-tech/jiro.bot/blob/feat/jiro-scroll-buddy/prototypes/scroll-buddy/CONTINUE.md |
| PR | https://github.com/tilework-tech/jiro.bot/pull/22 |
| Slack threads | https://tilework-tech.slack.com/archives/C0BGDN7PK3K/p1792432910834459 (v1–v5) and https://tilework-tech.slack.com/archives/C0BGDN7PK3K/p1793107657025189 (v6 and this handoff) |
| Design sources | Slack channel #jiro-bot-design (Maddy's 2026-10-19 Figma "updated sequence" screenshot, 2026-10-14 review mock `jiro-bot-review.png`) |

Preview links from earlier sessions die with their session. To see anything you must serve it yourself (see "Run it" below).

## Run it

From the repo root, start both servers in the background:

```bash
setsid -f nohup python3 -m http.server 4320 --directory prototypes/scroll-buddy > /tmp/jiro-scroll-preview.log 2>&1 < /dev/null
setsid -f nohup python3 prototypes/scroll-buddy/moodboard/serve.py --port 4330 > /tmp/jiro-motion-board.log 2>&1 < /dev/null
```

| Page | Path on port 4320 |
|---|---|
| v6 live (working copy) | `/` |
| v6 frozen | `/versions/v6/` |
| v5 frozen | `/versions/v5/` |
| Handoff moodboard | `/moodboard/handoff.html` |
| Earlier boards | `/moodboard/index.html` (5×5 original, Martin's A–E picks), `/moodboard/interactions.html`, `/moodboard/expressions.html`, `/moodboard/motion.html` (v5 movement levels) |

Port 4330 serves the same boards with star and note saving (`serve.py`). In a Nori session, the links are `$NORI_SESSION_URL/port/4320/...?t=<unix time>`. Resolve the real URL before sharing it, and in Slack wrap it as `<url|label>`.

## The two latest versions

**v6 (2026-10-27, commit `025ab6b`, the current version).** Martin picked A2, A3, A4, A5, B3, B5, C4 and D4 from the original 5×5 moodboard (`moodboard/index.html`), plus click and drag:
- speech returns, but sparse: one line per scroll pass, no repeats, quiet after 4 long passes
- a random idle hover each landing (game, sleepy, spring, eager)
- the big glide and spring jumps are removed; only the slow edge peek and small moves remain
- he glances at things and changes expression
- his shell grows into the speech bubble
- free drag-and-drop placement, plus arrow keys

**v5 (2026-10-26, commit `2b66db4`).**
- *Motion:* a silent observer. Each pass had at least 1 large move (glide, spring or peek) plus 2 small moves. The hover was always game idle.
- *Speech:* only on click.
- *Placement:* he rested in empty space away from headings and the centre band, and docked into the Ditch and FAQ logos.
- *Martin's verdict:* calmer than v4, but "I don't see it at all" and too little life. That led to v6.

Older history: v3 had corner docking and drag to a corner; v4 auto-commented near section centres. Martin rejected v4 as "too much in the center, erratic, jumping too high".

## Movement catalogue and how often each may play

A **pass** is one scroll in one direction. A reversal of at least 60px starts a new pass. These per-pass limits apply in v6:

| Per pass | Limit |
|---|---|
| Big moves | at most 1 (the edge peek), and only once per page visit |
| Small moves | at most 2, at least 2s apart |
| Spoken lines | at most 1 |
| Bouncy hover (spring or eager) | at most 1 |
| Rest before following | at least 2s |

### Big movements

| Movement | How often | Where | Notes |
|---|---|---|---|
| Pop-in | once per page load | first section's spot | scales from 30% with an overshoot, 700ms |
| Edge peek, then fly in (B3) | **at most once per page visit**, desktop (≥768px) only, only when his old spot has scrolled off-screen | nearest left or right edge, then the new spot | 2.4s peek (about 1.2s visible, about a quarter of him showing), 850ms low arc, 8px landing hop |
| Follow to the next section | once per section change | the next section's resting spot | waits 1.2s after scrolling stops (0.45s when jumping 2+ sections), then a 300ms fade relocation; always rests 2s or more first |
| Dock into a logo | every landing on Ditch or FAQ | `#callin-logo`, `#reserve-jiro-logo` | the logo hides and he scales up (max 2.4×) to replace it; never while dropped |
| Drag and drop | user only, any time | anywhere on screen | stays exactly where dropped, fixed on screen, until the tab closes |

### Small movements

| Movement | How often | Notes |
|---|---|---|
| Side scoot | shares the limit of 2 small moves per pass | 7px sideways with a 2° tilt, 500ms |
| Small hop | shares the limit of 2 small moves per pass | 5px up, 500ms. If you stop, unused small moves play at 2s intervals |
| Landing squash and puff | every landing | a 4% squash with a dust puff |
| Peek landing hop | only with the edge peek | 8px, his largest in-place move |
| Arrow-key nudge | user only | 24px per press (96px with Shift), drops him there |

### Idle hovers (A2–A5): exactly one always runs, re-picked at random on every landing

| Hover | Odds | Limit | Motion |
|---|---|---|---|
| Game idle (A2) | 2 in 5 (the default) | none | 3.5px bob, ±0.75px drift, ±1.5° tilt, soft squash, 4.1s |
| Sleepy (A5) | 1 in 5 | none | 2px sink over 7.3s, dimmed, `-_-` face, z's |
| Bouncy spring (A3) | 1 in 5 | at most 1 per pass | 6px hops with squash, 3.5s |
| Eager jitter (A4) | 1 in 5 | at most 1 per pass, shared with spring | 2.5px double bob, 2.7s |
| Held dangle | while dragged | — | ±7° swing |

Once a spring or eager has played in a pass, the rest of that pass picks only game idle or sleepy.

### Faces and looks (C4, B5)

While resting, a beat fires every 5s, alternating a glance and an expression. Each therefore comes round about every 10s. Beats pause while he moves, talks or is held, and are off with reduced motion.

| Face or look | When |
|---|---|
| `>_` cursor (blinking) | default |
| `^_^` happy | 0.9s on every landing and drop; also as a resting expression |
| `o_o` eyes | on hover, while held, and as a resting expression |
| `-_-` sleepy | for as long as the sleepy hover runs |
| Looks at stuff (B5) | his face shifts 3px towards a random nearby heading, button, link, image, table cell or card within 520px, which gets a dashed salmon outline for 1.3s; no layout shift |

### Talking (D4)

| Behaviour | Rule |
|---|---|
| Pass line | **at most 1 per pass**, 0.9s after he lands, about the section he's sitting on. It types out and closes itself after 4.5s |
| No repeats | a section he has already commented on is skipped (a later landing in the same pass may speak instead) |
| Quiet mode | after **4 long passes** (each covering 50% or more of the page height), no pass lines until he is clicked. Martin said "4 up and down"; this counts each direction once, so confirm whether he meant 4 round trips |
| Grows into the bubble (D4) | his shell stretches ×1.05 wide and ×1.12 tall while the bubble is open, then shrinks back |
| Ask line | only where the section has `data-jiro-ask` (pricing today). Yes/Later buttons; Yes scrolls to and focuses `#email`. Stays 9s, and longer while hovered or focused |
| Screen readers | each line is announced once in a polite live region |

## Where he can, should and must not appear

- **Should rest:** empty monochrome space beside headings, solid-colour areas, and the outer left or right 35% bands on desktop. Each section's `data-jiro-anchor` marks his preferred spot (resting markers alternate left and right).
- **Docks into:** the existing Jiro logos in Ditch (`#callin-logo`) and FAQ (`#reserve-jiro-logo`), replacing them while he sits there.
- **Must never cover:** headings (h1–h3, the hardest rule), body text, labels, links, buttons, inputs, list items or table cells. If the anchor overlaps any of these, `spotFor()` searches a grid of nearby candidates and takes the closest clear one.
- **Must never sit:** in the centre band (35–65% of the width) on screens 768px and wider, or off-screen (he keeps at least 8px from the edges). The edge peek is the one deliberate exception.
- **Phones (under 768px):** a 56px mascot, no centre-band rule and no peek. The same rules against covering text apply. The FAQ has a phone-only anchor (`#jiro-faq`).
- **After a drag:** exactly where the user dropped him, fixed on screen and kept inside the viewport. No travel, peek or docking until the tab is closed.

## What clicking can do

| Input | Result |
|---|---|
| Click, tap or Enter on Jiro | always says the line for where he sits now (repeats allowed), and resets quiet mode and the already-said list |
| Drag (mouse or touch) | moves him freely; under 5px of movement counts as a click. Only the mascot blocks touch scrolling |
| Arrow keys (Jiro focused) | move him 24px (96px with Shift) and drop him there; the page doesn't scroll |
| Hover | `o_o` eyes |
| Yes please / Later (ask line) | Yes goes to the email field, Later closes the bubble |
| × | hides him for the rest of the tab; a new tab brings him back and resets his dropped spot |

Clicks on other parts of the page do nothing. Ideas for page clicks (fact-check a bakeoff cell, explain a Slack line, bouncy wordmark, and more) are on `moodboard/interactions.html`, but none were chosen for v6.

## Where comments can be added

Comments live in the page markup, not the code. Any element with `data-jiro-comment="…"` becomes a section he follows and can comment on. Optional attributes:
- `data-jiro-anchor="#id"`: his resting spot
- `data-jiro-mobile-anchor="#id"`: a phone-only resting spot
- `data-jiro-merge="#id"`: a logo to dock into
- `data-jiro-ask="Button text"` with `data-jiro-action="#target"`: Yes/Later buttons

The current 8 on the mockup (`index.html`):

| Section | Line |
|---|---|
| `#hero` | Hi, I'm Jiro. |
| `#ditch` | I censored them myself. Professional courtesy. (docks into the logo) |
| `#video` | Fewer lines. Same fix. You're welcome. |
| `#pillars` | The cheapest bug is the one I flag before the PR. |
| `#how` | Plain words are fine. I'll ask if it's unclear. |
| `#pricing` | Thirty days on the house. Pull up a stool? (Yes please → `#email`) |
| `#bakeoff` | The green column is mine. Biased, but sourced. |
| `#faq` | Yes, you can bring your current subscription. (docks into the reserve logo) |

## Engineering notes

- **Files:** `jiro-buddy.js` and `jiro-buddy.css` are the whole runtime: vanilla, no dependencies, and loaded after the page. These two files are what transplants onto the real site. `index.html` is a hand-built reconstruction of the design, not Maddy's final HTML.
- **Size:** the two files are 12,244 bytes gzipped against a 12,288-byte budget (enforced by a test). Anything new needs trimming first; the `BODY_FILL` path is the biggest chunk.
- **Tuning constants** at the top of `jiro-buddy.js`:

  | Constant | Value |
  |---|---|
  | `SETTLE_MS` | 1200 |
  | `FAST_SETTLE_MS` | 450 |
  | `MIN_DWELL_MS` | 2000 |
  | `CENTER_EDGE` | 0.35 |
  | `MAX_PEEKS` | 1 |
  | `PASS_LINE_MS` | 900 |
  | `LINE_HOLD_MS` | 4500 |
  | `ASK_HOLD_MS` | 9000 |
  | `QUIET_AFTER` | 4 |
  | `LONG_PASS` | 0.5 |
  | `REST_BEAT_MS` | 5000 |
  | `GLANCE_MS` | 1300 |
  | `DRAG_SLOP` | 5 |
  | `NUDGE` | 24 |

  Idle odds are in `pickIdle()`; the small move sizes are in `smallGesture()`.
- **Tests:** `uv run --no-project --with playwright python -m unittest tests/test_scroll_buddy.py` from the repo root runs 31 browser tests in headless system Chrome (about 8 minutes); all pass. `prototypes/scroll-buddy/qa/check_motion.py` is a quick check against a running preview and the session browser on CDP port 9222. Repo checks: `cd tests && python3 -m unittest` and `python3 tools/lint.py`.
- **Workflow:** write tests first. Commit on `feat/jiro-scroll-buddy` (in Nori sessions, publish with `nori-git publish`), then push and update PR #22. Never merge or push to `main`, and never deploy, without Martin's explicit approval. Deploys only go through the GitHub Actions workflow dispatch.

## What Martin cares about (from the threads)

- **Calm over busy:** "less speaking and more just small, gentle, hovering movements". He disliked erratic movement, high jumps and sitting in the centre.
- **Never over headings that should be read:** "there is plenty of monochrome space where we don't mind having him hop".
- **He should feel alive:** in v5 Martin said "I don't see it at all". He likes the game-like hover, the slow peek from the side with a joyful landing, and some randomness.
- **Bouncy hovers are fine:** "not too much as long as it's only shown once per up and down scroll".
- **Concise replies:** short replies with a direct link to the latest version, plus a fresh `?t=` timestamp.

## Open items

1. **Confirm the quiet rule:** "after 4 up and down" — 4 long passes (current) or 4 round trips?
2. **No way back to following:** once dropped, Jiro can only be moved again. Should a double-click (or similar) send him back to following the page?
3. **Real page:** Maddy's template ZIP or copy-editor page never arrived, so this is still the reconstruction. Port the two buddy files plus the `data-jiro-*` tags onto the real page when it exists.
4. **Outdated assets:** the `share/` explainer video and stills and `moodboard/motion.html` show pre-v6 behaviour.
5. **Lost picks:** star and note picks on `index.html`, `interactions.html` and `expressions.html` are gitignored (only `picks-motion.json` is tracked). Earlier picks were never saved.
6. **Size budget is full:** any new feature needs trimming or a decision to raise the budget.
