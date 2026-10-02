Rebuild Demo1, the jiro.bot 3D scroll-flow website. Desktop first, and it must work in Safari as well as Chrome.

START FROM WHAT EXISTS. Clone tilework-tech/jiro.bot and work in its `demo1/` folder. `docs/RECREATE.md` is the full spec, `docs/FEEDBACK-LOG.md` has every client request, `docs/ASSETS.md` has checksums for every asset, and `reference/` holds ground-truth frames and a walkthrough video. `site/` is the working Vite + Three.js site with all videos, stills and sprites. Only regenerate an asset if it is missing. Serve it with `site/serve.mjs`: Demo1 was verified there in Safari 26.5 on a real Apple GPU at about 57 fps. If any browser shows a black screen, read the `/__diag` beacon lines in `/tmp/jiro-access.log`.

CONCEPT
- Pixel-art sushi bar world. Jiro is a sushi-chef robot: copper-and-cream dome head, white hachimaki knotted on the side, square glowing cyan eyes with NO pupils, horizontal speaker-grille mouth, NO shoulder pads, blue-and-white striped happi with rolled sleeves, slim copper arms. Use `ref/jiro-char.png` as the character reference in every generation. Reject any off-model Jiro.
- One kaiten conveyor belt runs from the hero to the footer and never stops. Scrolling follows its path. Only one scene is visible full screen at a time.
- Every scene is a seamlessly looping video with small, calm motion. Every loop must join with no visible jump; measure the join.

BELT
- It starts realistically inside the hero's kitchen window: the plates come out of the dark kitchen, dim inside and brightening as they pass the frame, and tuck behind the window's right-hand post. No dark box or shadow square on the wall around it.
- The hero belt is the site belt. The plates on the hero are the same plates that ride down the whole site, and the hand-off is unnoticeable. The hero has no separate painted belt.
- It flows from the hero toward the footer.
- Curves work like an airport baggage carousel: overlapping slats, each pinned on the centre line and tilted slightly nose-down, sliding under the one ahead and fanning open on the outside of each turn. No sharp kinks: every corner radius is at least 1.2 × the belt width, with gentle curves between scenes.
- The belt is always in view, including during transitions.
- Plates are pixel-art sushi and oddities (about 30). Click a plate to drag and throw it, and it flies back to the belt. Poking a plate triggers a reaction: sushi explodes into pixels and is remade, and there are others (bomb, duck, fugu, gold plate, wasabi flash, fire laptop, fortune cookie, mini Jiro, lobster). The belt is a cornucopia of easter eggs, with an egg counter, the Konami code, typing "omakase", tapping the logo 5 times, and more.
- Occasionally a dish slides off the belt. Once or twice per whole site, a dish grows little legs and wanders off.

CAMERA AND TRANSITIONS
- Smooth, upright chase camera. No loops or barrel rolls: it just tilts gently over to the next view.
- Between scenes, the belt travels through the house, room to room, via doorways and windows: noren doorway, open shoji, moon window, kitchen hatch, arched door. Walls stay far enough from the camera that nothing fills the frame.
- Parallax on transitions: dark foreground props (bamboo, lanterns, noren strips, plants, a shelf of jars) sweep past faster, and distant warm lantern clusters drift slower. None of them show in a landed scene.
- Scroll snaps: a small scroll moves one scene, a tiny one springs back.
- Some scenes zoom in, zoom out or rotate for a good close-up of Jiro's craft.

SCENES, IN ORDER
1. HERO: high-resolution pixel-art bar with smooth, relaxing motion. Everything is smaller, leaving quiet dark space on the left (entrance wall), with a gradient about 30% darker there so the headline reads. Two customers, not three, each animated very differently: one nearly still, one laughing and gesturing with chopsticks, one eating. Jiro has no mouth; only his jaw plate moves. The headline is "Jiro, your AI staff engineer" with one CTA and no menu.
2. PRODUCT DEMO: Jiro coding at a CRT, half size, in a dim lit corner, no pupils. The rest of the wall is dark. The clickable demo panel (Slack → PR → proof) takes up most of the screen. The belt runs down the right-hand side of the screen.
3. SIDE BY SIDE ("Same prompt. Different chef."): top-down restaurant with no Jiro, minimal motion, darker. The two example dialogues get most of the screen.
4. HOW JIRO COMPARES: after-hours bar scene at about 50% size, with the rest of the room in shadow so it feels spacious. The table is twice as big and light-coloured on the dark background.
5. QUESTIONS FROM THE COUNTER: canon Jiro at an angled counter with square omakase sets being prepared. Five small, cute sushi characters sit on one set and only wiggle, stretch and sway in place: no dancing, no legs, no walking. The questions appear above them and Jiro answers in a speech bubble above his head.
6. PRICING ("Not market price.", 3 tiers, Reserve a seat): Jiro stopped on his delivery bike in neon rain with one foot on the ground. He only moves like someone relaxed at a traffic light, with no pedalling.
7. ENDING, KOI POND: moonlit pond, with the belt crossing on a trestle and continuing out past the left edge. No Jiro on the bridge. A big koi jumps only occasionally, and when it does it eats a whole stretch of plates.

REMOVED, DO NOT ADD BACK: the "20 copper fingers" slide, the fish-cutting scene, the fish market, the tea scene, the train ending, the FAQ mini bots.

DONE MEANS: tested in Safari and Chrome on a real GPU, the preview link is shared with a fresh ?t= timestamp, and every scene is screenshotted.
