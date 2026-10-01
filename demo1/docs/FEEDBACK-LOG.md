# Demo1 feedback log

Every piece of direction Martin Stübler gave in the Slack thread that produced this scroll flow (28–30 Sep 2026), in order, with what was built for it. Each "Asked" line is his request, lightly condensed, and each "Built" line is what shipped. When this log and the code disagree, the code in `site/` wins; when the two disagree about what was *wanted*, this log wins.

Rules that came out of the whole thread, and that must hold in any rebuild, are collected at the end.

---

## Round 1: the brief

**Asked**
- Make an impressive jiro.bot scroll-flow animation. Use the attached sketch (`ref/sketch.png`) as the guide for how the conveyor belt moves through the page.
- Use the latest hero video loop, then continue with the conveyor belt from there onward.
- The belt keeps moving throughout the site and never stops. Scrolling follows its path.
- Smooth, impressive 3D rotations and shifts between animated scenes.
- Clicking a plate on the belt lets you drag it around, and some plates explode. Make the belt "a cornucopia of easter eggs".
- Animate every scene with small movements, like the hero. Scrolling zooms in and out in some scenes, or rotates the camera for a good close-up of Jiro at his craft.
- All videos loop perfectly, with no jumps.
- Be creative with transitions. Only one scene is ever visible full screen on desktop.

**Built**
- A Three.js site with each scene as a looping video panel placed in 3D and one continuous belt. Snapping scroll. 30 plate sprites with drag, throw and poke reactions, and 24 easter eggs.
- Every loop is first/last-frame pinned in Veo and crossfade-cut. The seam is measured against a normal frame step.

## Round 2

**Asked**
- Delete the "20 copper fingers" first slide (the hands close-up). It got stuck and was zoomed in too far.
- Redo the hero from the ground up: high-resolution pixel art with smooth, relaxing motion of the people and especially the belt.
- Make the transition from the hero belt to the site belt as unnoticeable as possible, one smooth experience. The things shown on the hero belt should be the same things going down the site.
- Some dishes fall off, or grow legs and wander off, no more than once or twice on the whole site.
- Brainstorm five ludicrous or unexpected endings for the belt and show them side by side.

**Built**
- Hands close-up removed.
- New 5504 px hero still with an empty counter lane. The 3D belt runs down the painted lane, so the hero plates are the site plates.
- One fall-off event (comparison slide) and one walk-off event (FAQ slide) per visit.
- Endings moodboard: Koi Gulp, Sushi Orbit, Final Code Review, Kaiten Portal, Last Train Out (`art/endings/`).

## Round 3

**Asked**
- Keep the single belt from hero to end, but make it better and more interesting. Things fall off occasionally.
- The belt starts realistically behind the corner of the kitchen window.
- Make the rollercoaster smoother: no crazy loops, just flop over to the new view, and keep the belt always in view.
- Make it feel like exploring different places in a house: go through doors or windows to reach the next room.
- Endings: he likes 1 (koi) and 5 (train); show both. The koi appears only occasionally, but eats a whole lot of belt when it jumps over it. The train must be continuous: a platform fills up with plates, then they all board together, so the belt can keep moving.

**Built**
- Upright chase camera with no barrel roll. The belt passes through walls with openings (noren, shoji, moon window, hatch, arch) between rooms.
- A random fall-off every 20–40 s.
- Koi pond and station endings, both built.

## Round 4

**Asked**
- Scene 2 (demo): Jiro and his surroundings at half size. The product demo takes most of the screen, and the rest is much darker, as background.
- Restaurant scene: no Jiro, less movement, darker, and much more space for the two example dialogues.
- Research how airport baggage conveyors handle curves, and show that realistically: each segment slides proportionally under the one before to make the turn.
- Cut the fish-cutting scene.
- Stick with the koi ending (drop the train).

**Built**
- Demo corner at half size with a dark wall, and the demo panel at about 58vw.
- Restaurant redrawn without Jiro and darkened to 48%, with the dialogue panels at 92vw × 68vh.
- Carousel slats per `docs/CONVEYOR-RESEARCH.md`, with every corner radius at least 1.2 × the belt width.
- Tuna scene removed. Koi is the only ending.

## Round 5

**Asked**
- Hero: more quiet space on the left. Make everything smaller and add a corner about 30% darker on the left so the text reads.
- Every slide: text must sit on a neutral enough background to be legible.
- Hero Jiro: no mouth, just a moving jaw.
- Hero customers: drop one of the three, and give each of the remaining two a very different animation, one stiller than the other.
- Questions from the counter: the sushi are smaller (20%), sit on plates, and are cute and funny (sitting, stretching and so on). The questions appear over them and Jiro answers in a bubble above.
- Final scene: the belt continues out of the left side of the frame.
- Jiro on the bike: he sways and doesn't pedal, keeping one foot on the ground for stability.

**Built**
- Hero at 80% size with an outpainted dark entrance wall on the left and a left gradient scrim.
- The middle customer removed. Jiro frozen from the still, with only his copper jaw plate hand-animated (`pipeline/jaw.py`).
- A scrim or panel behind every headline.
- Pond trestle extended off the left edge.
- Bike with one foot down.

## Round 6

**Asked**
- Questions scene: this isn't Jiro, it's a generic robot; use the real one. Angle the scene so you see square food sets being prepared. The items on one set ask the questions. They don't dance around; they just sit, wiggle and stretch.
- Scene 2: Jiro has no pupils.
- Last scene: remove Jiro from the bridge.
- Bike: much less movement, just regular body movement, like someone relaxed waiting at a traffic light.
- How Jiro compares: the scene at about 50% of its size, the rest of the room in shadow so it feels spacious. The table doubles in size and is more visible (lighter colours on the dark background).
- Fix the sharp kink in the belt from scene 2 to 3. No sharp kinks: gentle curves and smooth transitions.
- Hero: the dark shadow square where the belt starts must fall realistically on the belt, not on its surroundings. Launch many subagents to rework the start of the belt until it is realistic.

**Built**
- `art/faq-v3.png`: canon Jiro, angled counter, square sets, five sushi characters animated in place by `pipeline/faq_anim.py`.
- Pupils painted out of every frame (`pipeline/nopupils.py`).
- Bridge emptied. Bike re-rendered as a calm idle.
- Comparison scene at half size in a pool of light, with a cream table panel.
- The restaurant card was moved so the belt drops in with one gentle bend.
- Belt start: three agents tried approaches in parallel, and the winner shades the belt dim inside the window, brightening past the frame. The post cut-out was aligned to the painted post.

## Round 7

**Asked**
- Slide 2: the belt goes down the right-hand side of the screen.
- What is the purpose of the bike scene?

**Built**
- Demo belt runs down the right edge, with the demo panel moved left.
- The bike scene was then the CTA ("Pull up a stool").

## Round 8

**Asked**
- Eliminate the fish market slide and put the pricing on the bike scene.
- The five front-row sushi are a little animated and alive: not moving too much, but stretching, moving or wiggling slightly, with the questions above them.

**Built**
- Fish market removed. Pricing ("Not market price.", three tags, Reserve a seat) on the bike scene. The site is now 7 slides.
- Livelier but calm sushi idles: tuna sways, salmon stretches, tamago wiggles, ikura leans, ebi breathes.
- Walls kept away from the camera path.

## Round 9

**Asked**
- He likes being guided through doors for transitions. Add a few more moving forms that move at a slightly different speed from the main frame when scrolling, for the illusion of perspective.
- Save it for tomorrow: a PR that documents the video to the smallest detail, so it can be recreated.

**Built**
- Parallax props: dark near props sweep past faster (bamboo, lanterns, noren strips, plants, a shelf of jars), and far lantern clusters drift slower. None show in a landed scene. The seed is fixed.
- PR tilework-tech/jiro.bot#5 with `docs/RECREATE.md`.

## Round 10 (30 Sep)

**Asked**
- The preview is black in Safari. Recover it.
- Write the best possible prompt to reconstruct it in a new thread, based on every piece of feedback (`docs/REBUILD-PROMPT.md`).
- Make a safe documentation of exactly this scroll flow recreatable to the T. At Martin's request this became a folder, `demo1/`, inside the jiro.bot repo, not a separate repo.
- Document it as **Demo1**.

**Built**
- A diagnostics beacon and request log (`site/serve.mjs`), an on-screen error box, and an automatic fallback to a 7-scene video reel (`site/public/fallback/`).
- A later load in Martin's Safari 26.5 ran at about 57 fps with all videos playing.
- Martin named this version **Demo1**.

---

## Standing rules (hold these in any rebuild)

1. One belt, hero to footer, never stopping. It flows from the hero toward the footer.
2. The belt starts inside the hero's kitchen window and tucks behind the right-hand post. No dark box on the wall.
3. The belt is in view during every transition. No sharp kinks; corners follow gentle, carousel-style curves.
4. The camera stays upright: no loops, no barrel rolls, just a gentle tilt to the next view.
5. Rooms connect through doors and windows, with parallax props on each ride.
6. One scene full screen at a time, and every headline on a legible dark backdrop.
7. Every loop is seamless.
8. Canon Jiro only: dome head, side-knotted hachimaki, square cyan eyes with no pupils, grille mouth, no shoulder pads, striped happi. The hero Jiro has no mouth, only a moving jaw.
9. Motion is calm and small. Characters sit, wiggle and stretch; they never walk off, except for the single walk-off event.
10. Strays are rare: an occasional slide-off, plus one walk-off per visit.
11. The koi ending is occasional and eats a big stretch of plates.
12. Removed for good: the hands close-up, the fish cutting, the fish market, the tea garden, the train, the FAQ mini bots.
