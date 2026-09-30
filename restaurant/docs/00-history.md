# 00 · History, requests, and decisions

This is the story of how the site was built (Slack thread in #growth-and-marketing, 2026-09-29 → 2026-09-30, requester Martin Stübler, built by Jiro with parallel subagents). Rounds 1–4 are PR #6 (branch `restaurant-belt`); round 5 (V3) is branch `restaurant-belt-v3`. Read this first: it records what was asked, verbatim, what was built in response, and what was later removed and why. Everything removed is recoverable from git on branch `restaurant-belt` (commits cited).

## Round 1 — the brief (verbatim)

> apply this design elements to an entertaining scroll website the follows a sushi conveyer belt through different rooms of a restaurant.
>
> 1. keep the main elements from the noriagentic.com website for the context.
> 2. Make it entertaining and a bit silly with lot's of easter eggs, and random stuff you can click and discover things. Include 3 mini games that are immediately recognizable, and have some things especially on the conveyer belt be totally absurd, in the best of comic and animal way.
> 3. The scrolling should follow though a restaurant individual rooms, like start at the bar, go the the restaurant, kitchen, storage room, back room for washing plates outdoors, and then on the bike delivering stuff in the last view.
> 4. use some of the desing decision we made here: https://github.com/tilework-tech/jiro.bot/blob/jiro-site/brand/DESIGN-LOG.md
>
> once the website is down, laucn many many subagents to work on the logic of the belt and how it transitions from room to room, to be wild but not unrealistic, be creative about through which parts of a wall you go, and after all the transitions between scenes are worked out launch at least 10 different sub agents to polish each scene visually, making it a simple and polished pixel art by itself with minimal animaiton, so no big movements like walking around but the belt is always moving at the same speed though each scene.
>
> For one of the transitions be creative and imagine the camera is bolted to the conveyer belt and we are seeing the room we are entering from the perspective of the sushi on the belt. then return to the native neutral eye level observer view for the next scene.
>
> Done use the fish scene for reference i posted.  *(interpreted as "Don't": the fish-market image was not used)*
>
> The scene flow should be:
> 1. hero: bar with belt
> 2. a big interface of the nori product to click through: use palywright to record and make it clickable (very small nori with a computer in the bottom corner
> 3. Comparison two windows recorded with playwright, one wit general agent and the other one with our opinionated Jiro is producing much clearer code and better output. (restaurant scene, but without Jiro bot)
> 4. Straight to FAQ section, with the little sushi things having quesiont bubbles and if you click them the Jiro bot answeres them as a big bubble appearing over them.
> 5. Night bike on the street delivery for the pricing chart
> 6. A ending scene, which is a big koi jumping out of the pond and eating the sushi.
>
> i want you to have the pixel art be the central theme of each slide, but don't blow up the scnene to cover the entire room, we are happy with dark spaces where text is or just the main scene being adequatly small and not covering everything with action. maybe a side of the monitor being covered in shadow or just showing a dark garden or low contract wall is totally fine. we want to have a good mixture of very buzzling scenes and some more quiet scenes, but all of them need to be animated after the work is complete, animations should be minimal, very relaxing and slow and completely looped so that no human eye can identify when a scene is starting or ending.

Reference images Martin attached are in [`ref/`](ref/). `06-previous-hero-scroll-flow.jpg` and `07-previous-koi-pond-belt.jpg` are screenshots of the earlier `scroll-flow-3d` branch. The bar hero art (`public/art/bar.jpg`) and pond art (`public/art/pond.jpg`) started from those assets. The brand canon (Jiro design #19, the "one belt, flowing into the wall under the bottle shelf" rule) comes from `brand/DESIGN-LOG.md` and `brand/README.md`.

### Round 1: what was built

1. **Engine + first-pass site** (lead, commit `fb79069`). Engine contract, eight rooms (bar, office, dining, kitchen, storage, yard, street, pond), noriagentic.com copy (hero, FAQ, pricing, integrations), three games (Whack-a-Bug, Hose Snake, Flappy Koi), and a first round of easter eggs. First-pass stills were generated with Gemini (`pipeline/first_pass.tsv`).
2. **Wave 1, 9 parallel agents** (`bdab3d1`):
   - 7 transition agents, one per room boundary. dining→kitchen was the sushi-cam POV.
   - Product-UI capture from the real broker web UI with fake data (Playwright).
   - Generic-agent vs Jiro recordings (Playwright recordVideo).
3. **Wave 2, 11 polish agents** (`32eac88`): 8 scenes, belt items (14 new absurd animal items), mini games, site chrome.
4. **Fix-ups** (`00921a4`): two agents fixed the sushi-cam's hard split-screen seams and the grey wall band in street→pond.

## Round 2 — feedback (verbatim)

> 1. make the scrolling experience between the scenes shorter so that i can't rest too long there by default the interior parts of the house are fun but are taking up too much space, except the aquarium, keep that as it's one scroll stop point, maybe make a game out of if anc cancel the wackamole and instead make the game of a small fish that you can navigate to eat smaller fish and grow.
> 2. same ticket two kitches, make the restaurant darker to be more in the background and the chat windows should together take up almost the entire screen.
> 3. delete the entire camero on the sushi belt scne, and instead spin up many many sub agents to figure out the most realistic way to transition between scene with the FAQ, and the scene in the storage room.
> 4. cut both cat scenes from the scroll experience and go straight to the bike scene. have the belt go straight down and don't interface with the bike at all, just be part of the background, don't do the circle belt on the bike, and then go straight down to the pond.
> 5. remove the jiro on the bridge
> 6. make all plates clickabe and dragable to different parts of the room and then depending on if the room has proper surface to rest on have the plate either stay there or vanish, explode or zoom back onto it's place on the belt.
> 7. include about 5 differnet things i can click in the main hero to help people understand that clicking is possible,

### Round 2: what was built (`762b735`, `ed80e55`, `58c10f2`)

- **Drag-and-drop plates** (engine, `src/engine/drag.ts`): scenes declare `surfaces`. A drop elsewhere zooms back to the belt, vanishes, or explodes (see 01-engine).
- **Scroll lengths:**
  - bar→office cut from 1.8 to 0.9.
  - New and replaced transitions are 0.6–0.8 long.
  - Scene holds trimmed.
- **Aquarium:** the aquarium became its own stop with a "Fish Frenzy" fish-eat-fish game, and Whack-a-Bug was removed. **Later reverted, see round 3.**
- **Dining:** the room is dimmed on the canvas and the two comparison windows are about 900 px each, filling the screen.
- **dining→kitchen:** the sushi-cam POV was deleted and replaced by a short push through the swinging doors.
- **kitchen→storage:** six agents prototyped six realistic candidates:
  - A: wall hatch with a strip curtain
  - B: storage door
  - C: inclined belt down the cellar stairs
  - D: PVC strip-curtain dolly
  - E: foreground shelf wipe
  - F: one continuous back-of-house pan

  **F was chosen.** It's the most realistic (a steadicam walk, no tricks), and it keeps storage on ground level, so the later straight-down drop to the street makes sense. A–E are in `ed80e55`.
- **Removed:**
  - The storage→yard cat-flap transition, the yard scene, and the yard→street fence/cat transition. The storage→street belt now drops straight down.
  - The trike's loop belt. The street belt is a vertical background conveyor beside a utility pole.
  - Jiro on the pond bridge.
- **Hero:** five visible clickables that glint in turn, hover labels, a one-time "drag a plate" hint, and a "Psst: almost everything here is clickable" line.
- **Rehomed from the yard:**
  - Snake moved to the storage room (the coiled hose).
  - The integrations moved to tape labels on the storage jars.

## Round 3 — feedback (verbatim)

> revert the aquarium to the previous version

Done in `96a7cc3`: restored the original in-wall office→dining aquarium pan (length 2.0) and removed the aquarium stop and Fish Frenzy.

> eliminate the entire mouse family scene and put fat and bored cat there.
>
> open the swinging doors to the ask the chef slide, to be more realistic.
>
> give me 10 moodboard iterations of showing how you could display the exploding diagram of different mcp connect on our website, so go creative and show a lot of different versions of how the ingredients come together to produce different sushi. build the moodboard into the full website to click through different versions

Done in `0b16f6e` and `a6cda8c`:

- **Cat:** in the bar→office wall a fat, bored ginger tabby replaces the mouse family, and the knothole eye is gone.
- **Kitchen doors:** both swinging half-doors in the kitchen are painted open, with a slight sway.
- **Moodboard:** a new **MCP pantry** stop after storage (same room, dimmed) with a 10-version moodboard, one agent per version (see 05-moodboard).

## Round 4 — PR #6

> Safe it for tomorrow, make a pr that document the video to the smallest detail so that we can recreate to tomorrow

These docs. Six agents documented one area each, and the out-of-repo tooling was rescued into `tools/`.

## Round 5 — one single animation (V3, branch `restaurant-belt-v3`)

Martin screen-recorded the PR #6 site. It was opened with `?t=<unix time>`, which in that engine **froze** the animation clock, so in his recording the belt and the ambient loops were stopped. He still called it "the best flow we had". The recording itself could not be downloaded (Slack's 100 MB limit). His request (verbatim, 2026-09-30 17:42 UTC):

> <@U0ASASJJFAL> help me recreate this scrolling animation from a video recording.
> 
> keep in mind that the belt and most of the other small animations stopped because the website was no longer loading properly but the flow is still the best flow we had.
> 
> you gentle animations in every scene to make the scene look more alife and interactive, like let the curtains move a bit in the breeze, have the people at the bar move a bit but very different than any other person in the bar.
> 
> give jiro bot some small movement in each scene, like his eyes blinking from time to time, or the small things in the aquarium, between the walls or somewhere else just move.
> 
> the conveier belt has to move smoothly and coninously as well, following the best pracices especially in the corners, have some plates move independently and maybe move over to another plate to chat.
> 
> some plates are just falling off the belt, some small creatures like the little black dust spirits in spirited away can run around in a very simple pixelated form between the walls, etc.
> 
> Jiro on the bike should be replaced with a new screet bicycle scene similar to the other video i attached. animate the koi at the end scnene to somtimes jump up and swallow the sushi sometimes wait in the water for it. some beaitiful ripples on the pond from the other shadows of the fish and some wind in the grass should be animated.
> 
> animate each scene to have minimal movement, but animate every scene sufficiently to not look static.
> 
> the belt should move smoothly and continoulsy from scene one until the last scene, it should all be one single animation so that there are no interruptions of the flow. Give the things on the belt some irregularity, like not all spots are taken, often there are big gaps, between, make all the plates be somewhat homogenious in color, but the things on top of it should be really funny, surprising suhsi related and contain a plathora of easter eggs, if you click and pull the plates off they sometimes dissapear and sometimes if they are places on a flat surface anywhere in a scene they should stay there and remain on the counter for example and maybe it stays there or the sushi grows two small legs and starts walking a bit around on the surface.
> 
> 1. Make it entertaining and a bit silly with lot's of easter eggs, and random stuff you can click and discover things. Include 1 mini games that are immediately recognizable, and have some things especially on the conveyer belt be totally absurd, in the best of comic and animal way.
> 2. The scrolling should follow though a restaurant individual rooms, like start at the bar, go the the restaurant, kitchen, storage room, back room for washing plates outdoors, and then on the bike delivering stuff in the last view. 
> 3. use some of the desing decision we made here: <https://github.com/tilework-tech/jiro.bot/blob/jiro-site/brand/DESIGN-LOG.md|github.com/tilework-tech/jiro.bot/blob/…/DESIGN-LOG.md>
> launch many many subagents to work on the logic of the belt and how it transitions from room to room, to be wild but not unrealistic, be creative about through which parts of a wall you go, and after all the transitions between scenes are worked out launch at least 10 different sub agents to polish each scene visually, making it a simple and polished pixel art by itself with minimal animaiton, so no big movements like walking around but the belt is always moving at the same speed though each scene.

### Round 5: decisions (lead, recorded in `V3-BRIEF.md`)

- **Keep the flow.** Scene order and transitions are unchanged: bar → office → dining → kitchen → storage → pantry → street → pond. No rooms added or removed.
- **One mini game.** Flappy Koi (pond) stays. Hose Snake is removed; the coiled hose in storage is decoration and an egg.
- **New street.** The cargo trike is replaced by Jiro on a normal city delivery bicycle, stopped at a red light in neon rain, one foot down, delivery box on the rear rack; idle only (breathing, blinks, glances, the light cycling). It is the bicycle version of Martin's night-street motorcycle reference.
- **Pond.** The koi sometimes leaps and swallows a plate and sometimes waits at the surface under the pier for one; ripples from fish shadows; wind in the grass and reeds.
- **`?t=` no longer freezes time**, so old links animate. Screenshots use `?freeze=<seconds>`; cache-busters are `?v=`.
- **One belt, one animation.** A plate is one object from the bar wall to the koi: same item, same position continuity through every room and transition (global plate ids). Many empty slots, often big gaps. Plates are one homogeneous ceramic style; the fun is on top. Corners follow kaiten/baggage-carousel practice: rounded (radius ≥ 1.2 × belt width), slats fanning open on the outside, no kinks.
- **Minimal ambient motion everywhere**: curtains in a breeze, each bar customer moving differently, Jiro blinking in every scene he is in, tiny life in the aquarium and inside the walls.

### Round 5: what was built (three waves)

1. **Wave 1, engine (lead, `f2abe2f`).**
   - One belt: scene phases chained at start (`setChain`), global plate ids, and `TransitionDef.gap`.
   - Irregular occupancy.
   - Filleted corners and crescent slats that fan open on the outside of a curve.
   - Plate life: chats with pixel speech bubbles and falls with shards.
   - Plates stay taken everywhere once picked up; parked plates can grow legs and walk.
   - `?freeze`, `?debugplates`, the QA scripts `chain.mjs` / `align.mjs` / `life-scan.mjs` / `plates.mjs` / `legs.mjs`, and the bicycle street.
   - Hose Snake deleted. `01-engine.md` §7 rewritten.
2. **Wave 2, 6 transition agents (`a5da57a`), one per real transition** (storage→pantry is a DOM swap). Each transition carries the same plates end to end with a declared `gap`, and `align.mjs` shows delta 0 at every join.
   - bar→office: Spirited-Away-style soot sprites run inside the wall, and the cat breathes (`bo-cat`).
   - office→dining: a living aquarium. The fish are cut out as sprites and the wall is inpainted (`od-fugu`).
   - dining→kitchen: ambient life.
   - kitchen→storage: the corridor carries the plate through, with a soot rice thief (`ks-soot`).
   - pantry→street: the crawlspace, repainted `shaft.jpg`, with a soot rice smuggler (`pantry-soot`).
   - street→pond: the garden repainted for the bicycle (`soot-rice`).
3. **Wave 3, 11 polish agents (`ca3138c`).** One each for:
   - the seven rooms: bar, office, dining, kitchen, storage, street, pond (the pond agent added the koi fates, ripples and wind)
   - Flappy Koi, rewritten with a code-drawn koi
   - belt items: 20 new, with the absurd share held at ≈ 1 in 5
   - the pixel-art tread plus chat, fall and legs tuning
   - chrome: idle drifters, egg ledger names, the `wasabi` and `jiro` typed secrets, Safari fallbacks

   The egg total went from 88 to 156, and every id is declared up front.

## Final scene order (V3)

| # | Scene id | Room | Mood | Content |
|---|---|---|---|---|
| 1 | `bar` | Sushi bar | bustling | Hero: "Jiro, your AI staff engineer", CTAs, 5 glinting clickables |
| 2 | `office` | Back office | quiet | Clickable Nori product UI (10 real screens); tiny Jiro at a CRT in the corner |
| 3 | `dining` | Dining room | bustling, dimmed | Generic agent vs Jiro recordings, two big windows |
| 4 | `kitchen` | Kitchen | bustling | FAQ: 8 question sushi, Jiro answers in a big bubble; doors open |
| 5 | `storage` | Storage room | quiet | Integrations on jar labels; hose, soot family, mouse trap as eggs (Hose Snake removed in V3) |
| 6 | `pantry` | Storage room, dimmed | quiet | MCP moodboard, 10 versions |
| 7 | `street` | Night street | bustling | Pricing menu board; Jiro on a delivery bicycle at a red light; vertical belt on the pole |
| 8 | `pond` | Koi pond | quiet | Ending: the koi leaps for some plates, waits under the pier for others; CTA; Flappy Koi (the only mini game) |

Transitions:

| Transition | Length | What happens |
|---|---|---|
| bar→office | 0.9 | Inside the wall, past the fat cat; soot sprites scurry in the studs |
| office→dining | 2.0 | Pan past the in-wall staff aquarium (fish animated from sprites in V3) |
| dining→kitchen | 0.7 | Through the swinging doors |
| kitchen→storage | 0.7 | Continuous pan |
| storage→pantry | 0.35 | DOM swap only |
| pantry→street | 0.7 | Straight down through the foundation into the pole's reducer box |
| street→pond | 0.8 | Straight down through the moon gate onto the pier |

## Rules that must survive a rebuild

- **One belt.** Exactly one belt, never branching, always moving at `BELT_SPEED` = 46 stage px/s at scale 1. Plate ids are global: the same plate carries the same item from the bar to the koi (check with `tools/qa/align.mjs`).
- **Irregular, homogeneous belt.** Many empty slots and big gaps; one ceramic plate style; absurd items ≈ 1 in 5.
- **Loop-safe motion.** Ambient motion is minimal, slow, and a pure function of time. Periods divide 24 s (or it is deterministic aperiodic noise), so no start or end is visible. Every scene visibly breathes.
- **Never freeze real visitors.** Only `?freeze=` stops the clock.
- **Frame-exact transitions.** Every transition's t=0 frame equals the from-scene frame and t=1 equals the to-scene frame. Check with `tools/qa/seg.mjs`.
- **Jiro canon.** Copper dome, cream faceplate, two blue eyes, speaker-grille mouth, white hachimaki, indigo striped happi with rolled sleeves, slim copper arms. No shoulder pads, apron, visor, or red disc.
- **No Jiro in the dining room.** Jiro doesn't appear on the pond bridge either.
- **Pixel art.** Crisp, snapped to whole pixels, `imageSmoothingEnabled = false` for sprites (the belt tread is quantised pixel art too).
- **Plain text.** Never use the word "soak" (org rule).

## How the build was orchestrated (to repeat it)

1. **Lead first.** The lead writes the engine and contracts first: `BIBLE.md`, `src/engine/types.ts`. Each scene and transition lives in its own file, so agents never collide.
2. **One brief shape.** Each agent gets the same preamble:
   - project path
   - the files to read
   - dev server at `:3000` (never restart it)
   - the `seg.mjs` screenshot command
   - the `gen_still.py` command
   - "only edit files you own, keep them type-correct, don't commit"
   - art canon and motion rules
   - Martin's words verbatim for its part
   - one creative seed
   - deliverables: files, a contact sheet it must look at, and a ≤10-line report
3. **Agents in parallel, lead commits.** Agents run in parallel waves (V3: engine → transitions → polish); the lead commits after each wave, reviews contact sheets, and sends targeted fix agents. V3's brief shape is in `V3-BRIEF.md` ("How to work"): reports ≤ 12 lines, motion checked at several `--t`.
4. **Cross-file requests go through the lead.** Engine or CSS changes are applied by the lead from the agents' reports.

See [06-art-and-tooling.md](06-art-and-tooling.md) and `tools/prompts/gemini-calls.md` for every image-generation call.
