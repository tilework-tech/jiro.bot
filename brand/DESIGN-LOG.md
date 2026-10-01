# Jiro design log

One entry per round. "Asked" is Martin's request, "Kept" is what survived, "Dropped" is what was rejected and why. Numbers match the contact sheets in `character/05-design-iterations/`.

Source: Slack thread in #C0BGDN7PK3K, 2026-09-28 16:00 to 2026-09-29 01:00 UTC. Full export in `thread/`.

## Round 1: 16-bit sprite

- Asked: a cleaner, simpler 16-bit pixel-art version of the original Jiro artwork.
- Made: hand-placed 64x64 sprite, 26-color SNES-style palette, 1px outlines. Full scene and transparent character.
- Kept from the original: copper dome, cream faceplate, blue eyes, white hachimaki, striped indigo happi with V collar, copper shoulder joints.
- Files: `character/01-16bit/`.

## Round 2: Caves of Qud

- Asked: lean into Caves of Qud, then be more creative with other sushi art (onigiri-face reference attached).
- Made: Qud 16-color palette scene with checkerboard dithering, 16x24 two-tone creature tile, in-map mockup, then a 24-tile sushi bestiary (onigiri moods, nigiri, gunkan, rolls, sides, three Qud mutants) and a second map with the bestiary at the counter.
- Files: `character/02-caves-of-qud/`, reference in `reference/onigiri-faces-reference.png`.

## Round 3: Slack icon, hand-drawn

- Asked: an epic close-up suitable for a Slack icon, close to the original, a few angles, grand sushi-master feel.
- Made: 96x96 hand-drawn icons at 768px. Front, front focused (narrowed eyes, brows, red hinomaru disc), three-quarter left, three-quarter right.
- Jiro's pick: front focused. Disc is the only element not in the original.
- Files: `character/03-icons-handdrawn/`.

## Round 4: Aseprite

- Asked: use Aseprite for better pixel artwork, starting from the original image.
- Caveat: Aseprite proper is a paid binary with no public build; LibreSprite (open-source fork, same .ase format) ran headless instead.
- Made: original cropped and quantized with Pillow (128 and 96 px, 28 colors), despeckled and exported through LibreSprite. Two icon treatments (dimmed scene, flat backdrop) plus the full scene at 128 px. The 96 px clean variant damaged the headband and was dropped.
- Files: `character/04-icons-aseprite/`, including the .ase bundle.

## Round 5: Moodboard, 10 iterations

- Asked: 10 iterations varying angle, theme, action, job.
- Made with Gemini image generation, original artwork as reference. Titles: Breaking down the tuna, Dawn at the fish market, Fanning the rice, Omakase served, Edge (knife sharpening), Bento run, Code review with nigiri, The apprentices, The catch, Tea in the garden.
- Weakest: 05 (helmet drifts in profile). Strongest for brand: 01, 04, 07, 09.
- Martin: "i like them".
- Files: `scenes/01-moodboard/contact-sheet.jpg`. Individual full-res images were lost with the session machine.

## Round 6: Character design iterations

- Asked: shoulder pads are too on the nose. Iterate shoulders, head, eyes, hands, mouth toward a different persona. Then: number them.
- Made: same scene and pose as the original, one feature per card.

| # | Change | Outcome |
|---|---|---|
| REF | Original | |
| 1 | Shoulders removed | |
| 2 | Shoulders: flat flush plates | |
| 3 | Shoulders: rolled sleeves, slim copper arms | Chosen |
| 4 | Head: rice-tin cylinder | Rejected |
| 5 | Head: single visor band | Rejected |
| 6 | Head: smooth copper dome, no faceplate | Rejected, model also dropped the faceplate |
| 7 | Eyes: larger round | |
| 8 | Eyes: stern slits | |
| 9 | Eyes: smiling crescents | |
| 10 | Mouth: speaker grille | Chosen |
| 11 | Mouth: faint smile line | First attempt produced no visible change |
| 12 | Hands: rounded mittens | Model applied unevenly |
| 13 | Hands: white cloth gloves | |
| 14 | Persona: Quiet Apprentice | Model dropped the headband |
| 15 | Persona: Stern Master | |
| 16 | Persona: Warm Host | |
| 17 | Persona: Visor Engineer | Model dropped the headband |

- Martin: "i like 3 with the mouth of 10, and pls flip it so that he looks to the left".
- Round 2: #18 is 3 + 10 in the original orientation. #19 is the same mirrored to face left, with the reversed bottle kanji redrawn by the model so the labels read correctly. The mirror moves the headband knot to the other side.
- Outcome: #19 is the canon character reference for everything after.
- Files: `character/05-design-iterations/`.

## Round 7: Bar scene moodboard

- Asked: expand #19 into a full, warm, bustling bar scene. Conveyor belt running, customers with backs to us, ingredients in the back shadows, empty table, typical sushi bar elements. 10 iterations varying angle, interior, light, customers, tables.
- Made: 10 wide 16:9 scenes with #19 as the character reference. The bird's-eye view (10) was regenerated once for a black artifact.
- Fidelity notes: #7 gave Jiro an apron and a longer sleeve, #8 half-rolled sleeves.
- Martin liked 1, 5, 6, 10.
- Files: `scenes/02-bar-moodboard/contact-sheet.jpg`. Individual full-res scenes lost with the session machine except where they survive inside later edits.

## Round 8: Hero banners

- Asked: extend 1, 5, 6, 10 to the left with quiet space for a header and subheader: less light, pixelated, blank wall, or a fitting interior element.
- Made: 2560x768 (10:3), left 45% kept quiet. Three treatments per scene: A interior extension via outpaint (plank wall with lantern, wall with framed print, dark doorway with neon spill, floorboards and tatami corner), B deterministic plank wall, C pixelated mirrored fade. Each with a placeholder header, subheader, and button.
- Jiro's pick: A. Martin liked "1, 2 and 4" in his next message, which referred to the bar scenes, not banner codes.
- Files: `scenes/03-hero-banners/` holds the four A-treatment mocks. B and C variants and the clean no-text files were lost.

## Round 9 to 13: Conveyor belt

Bar scenes 1, 2, and 4 were edited so the belt exits the frame. Rules accumulated over five rounds:

1. v1: belt re-routed to exit the bottom. Rejected: "you can't combine them, it can always only be one single belt". Files `scenes/04-belt-edits/v1-multi-belt/`.
2. v2: exactly one belt per scene, other counters plain wood. Accepted, animation rendered from scene 1. Files `v2-single-belt/`.
3. v3: scene 1 only. Plain wood in front of the three customers, one straight belt from beside Jiro down to the bottom-left. Loop rendered with first and last frame pinned to the still. Files `v3-straight-belt-bottom-left/`.
4. v4: belt starts in the bottle wall, no ghost belt angled off to the right. Files `v4-belt-from-wall/`.
5. v5: Martin's five-point rejection of v4: belt started mid-counter, belt too fast, plates falling onto the belt, Jiro moving too much, curtains moving too much. Still re-edited so the belt visibly enters a dark opening under the bottle shelf. Files `v5-FINAL-belt-into-wall-opening/`.

## Animation

All loops: Veo 3.1 image-to-video from the current still, locked camera, ~8 s, cut into a seamless loop with ffmpeg. All versions on Drive; only v6 committed.

| Version | Source still | What changed | Verdict |
|---|---|---|---|
| v1 | belt v1 scene 1 | Belt, customers, Jiro, curtains, lanterns all move. Smooth and pixel-snapped variants, two renders | Martin chose smooth A1 |
| v2 | belt v2 scene 1 | Single belt | superseded |
| v3 | belt v3 | First and last frame pinned to the still. One take discarded for a stray "Jiro" text label | superseded |
| v4 | belt v4 | Belt from the wall. Three takes: one API error, one gave Jiro a green apron, one kept | "really bad", see v5 |
| v5 | belt v5 | Strict motion prompt: slow belt, no dropped plates, Jiro nearly still, curtains steady. Two of three takes swung a curtain open and were rejected | Martin chose smooth |
| v6 | same take as v5 | Playback reversed so plates flow into the wall | Approved: "great" |

## Round 14: Sushi mini sprites (2026-10-01)

- Asked: three different sushi character mini sprites that follow the onigiri face gallery Martin posted in round 2.
- Made: salmon nigiri, tamago nigiri with a nori belt, and a maki roll cross-section, each 32x32 native with a 1px ink outline, pink cheeks, and six moods (happy, wink, love, sleepy, angry, shocked). Sheet on the gallery's dotted pink backdrop, individual transparent sprites at 1x and 8x, one mood strip per character.
- Method: hand-placed pixels via Pillow, script committed this time at `character/06-sushi-mini-sprites/pipeline/draw_sushi_sprites.py` so the set can be extended with more moods or characters.
- Files: `character/06-sushi-mini-sprites/`.

## Open items

- Slack icon: candidates exist in rounds 3 and 4 but none was chosen, and all predate the #19 redesign. A #19-based icon has not been made.
- Hero banners: real header and subheader copy not yet set. Other ratios (16:9 social, 3:1 LinkedIn) not exported.
- Pipeline scripts and prompt files need to be rebuilt; see the README pipeline section.
