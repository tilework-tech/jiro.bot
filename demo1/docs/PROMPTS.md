# Generation prompts

The exact prompts that were saved, verbatim. `gen_still.py` appends the STYLE suffix to every still prompt, and `gen_veo.py` sends NEG as the negative prompt for every clip.

**What was not saved:** the exact wording of the later edit, outpaint and Veo prompts (rounds 2–8) lived only in the original session and could not be recovered. Their intent is recorded in the table at the end, and the resulting files are in `art/` and `site/public/` with checksums in `docs/ASSETS.md`. Rebuild from those files, not by regenerating.

## STYLE suffix (every still)

```python
"Style: high-quality 16-bit pixel art like a modern premium indie game (Eastward, Octopath HD-2D sprites), "
    "crisp hard-edged pixels, rich warm palette of copper, wood browns, indigo, cream, lantern amber, soft dithering, "
    "consistent with the reference bar scene. The character Jiro is exactly the robot in the character reference: "
    "copper-and-cream riveted dome head with a white twisted hachimaki headband knotted on the side, two glowing "
    "cyan-blue square eyes, a small horizontal speaker-grille mouth, cream faceplate, NO shoulder pads or shoulder armor, "
    "blue-and-white vertically striped happi jacket with dark navy V collar and rolled sleeves, slim segmented copper arms "
    "and copper robot hands. No text, no letters, no watermark, no UI, no borders."
```

## Veo negative prompt (every clip)

```python
"camera movement, zoom, pan, dolly, camera shake, cuts, scene change, text, subtitles, watermark, "
       "morphing, extra limbs, new characters appearing, objects falling from above, fast motion, "
       "shoulder pads, shoulder armor"
```

## Scene prompts (`pipeline/scenes.json`)

### `s1-code`

**Used in the final site:** Yes (demo corner, then nopupils + small_scene)

**Still prompt**

> Wide 16:9 scene. A cozy back office behind the sushi bar at night: Jiro the robot sushi chef sits on the LEFT third of the frame at a wooden desk, typing on a chunky beige mechanical keyboard in front of a small beige CRT monitor glowing with green code. A cup of steaming green tea and a plate of two nigiri next to the keyboard, sticky notes on the wall, a paper lantern above. The RIGHT 60% of the frame is a calm, dim, uncluttered dark wood-paneled wall with soft lantern falloff (negative space for a UI panel). Three-quarter view from slightly above.

**Motion prompt (Veo)**

> Locked-off static camera, no zoom, no pan. Jiro types gently on the keyboard with small finger motions and blinks his blue eyes once. Green code scrolls slowly on the CRT. Steam rises softly from the tea. The lantern flickers very subtly. Everything else stays still. Movements are small and calm and return to the exact starting pose at the end.

### `s1-code-close`

**Used in the final site:** Removed (round 2)

**Still prompt**

> Close-up 16:9 pixel art shot of Jiro the robot sushi chef's slim copper robot hands typing on a chunky beige mechanical keyboard, the rolled blue-and-white striped happi sleeves visible, the corner of a glowing green CRT screen at the top right, a steaming tea cup and a nigiri plate at the edge. Warm lantern light. Same scene as the reference office image, camera pushed in close on the hands.

**Motion prompt (Veo)**

> Locked-off static camera, no zoom. The copper fingers type gently and rhythmically on the keys, keys depress slightly. Tea steam rises softly. Green screen glow flickers subtly. Hands return to the exact starting pose at the end.

### `s2-serve`

**Used in the final site:** Base only; then edited to remove Jiro

**Still prompt**

> Straight top-down bird's-eye view, 16:9, of a lively warm sushi restaurant floor seen from the ceiling: wooden floorboards, several low square wooden tables with customers seen from above (tops of heads, shoulders), plates of sushi and tea cups on the tables. Jiro the robot sushi chef is seen from directly above in the LOWER LEFT area, carrying a wooden sushi tray between tables, his white hachimaki knot and copper dome visible from above. The upper center of the frame is a calmer open wooden floor area. Warm lantern pools of light.

**Motion prompt (Veo)**

> Locked-off static top-down camera, no zoom, no rotation. Customers make small motions: lifting chopsticks, sipping tea, turning heads slightly. Jiro sways slightly while holding the tray, taking a small half-step and returning. Lantern light flickers subtly. All motion is small and returns to the exact starting positions at the end.

### `s3-tuna`

**Used in the final site:** Removed (round 4)

**Still prompt**

> Wide 16:9 scene. Jiro the robot sushi chef stands on the RIGHT third of the frame behind a long hinoki wood counter, precisely slicing a large glistening red bluefin tuna loin with a long yanagiba knife. Neat slices of tuna fan out on the board, a wooden rice tub steams behind him, sake bottles and ceramic jars on shelves in warm shadow. The LEFT 60% of the frame is a calm, uncluttered, softly lit stretch of empty wooden counter and dim back wall (negative space for a table). Three-quarter view from slightly above.

**Motion prompt (Veo)**

> Locked-off static camera, no zoom. Jiro draws the knife slowly through the tuna in one small smooth slicing stroke and lifts it back, blinks once. Rice tub steam rises softly. Lantern light flickers slightly. Everything else still. Return to the exact starting pose at the end.

### `s3-tuna-close`

**Used in the final site:** Removed (round 4)

**Still prompt**

> Dramatic close-up 16:9 pixel art shot: Jiro the robot sushi chef's copper robot hand holding a long gleaming yanagiba knife mid-slice through a glistening red bluefin tuna loin on a hinoki board, a neat fan of slices beside it, the blue-and-white striped rolled sleeve visible, a glint of light on the blade, part of his cream faceplate and glowing blue eye visible at the top edge looking down in concentration.

**Motion prompt (Veo)**

> Locked-off static camera. The knife slides slowly and smoothly through the tuna in one small stroke and returns; a light glint travels along the blade. The glowing eye blinks once. Return to the exact starting pose at the end.

### `s4-omakase`

**Used in the final site:** No: replaced by art/faq-v3.png

**Still prompt**

> Wide 16:9 scene from a seated customer's point of view across the counter: Jiro the robot sushi chef on the LEFT side of the frame presenting a long black lacquer omakase tray toward the viewer. On the counter across the center and right of the frame sit five clearly separated, large, beautiful sushi pieces spaced evenly apart on a wooden geta board: a tuna nigiri, a salmon nigiri, a tamago nigiri with nori belt, an ikura gunkan, and an ebi shrimp nigiri. Above the sushi is calm dim warm-toned wall space. Warm lantern light.

**Motion prompt (Veo)**

> Locked-off static camera, no zoom. Jiro holds the tray and makes a tiny proud nod, blinks once. The ikura glistens, faint steam from a tea cup. Lantern light flickers subtly. The sushi pieces do not move. Return to the exact starting pose at the end.

### `s5-market`

**Used in the final site:** Removed (round 8)

**Still prompt**

> Wide 16:9 scene of a misty Tokyo fish market at blue dawn: rows of huge silver bluefin tuna laid on wet concrete with ice, paper lanterns glowing overhead, wooden crates of ice. Jiro the robot sushi chef crouches on the RIGHT side of the frame, inspecting a tuna's tail cut with a small flashlight beam. Distant market workers in silhouette in the mist. The CENTER and LEFT of the frame has a calm misty open area with soft fog (negative space for price cards).

**Motion prompt (Veo)**

> Locked-off static camera, no zoom. Mist drifts slowly. Jiro moves the flashlight beam slightly across the tuna and blinks. Lanterns sway very slightly. Distant silhouettes shift a little. Wet floor reflections shimmer. Return to the exact starting pose at the end.

### `s6-delivery`

**Used in the final site:** Base only; then edited: stopped, left foot down

**Still prompt**

> Wide 16:9 scene of a rainy neon-lit Tokyo alley at night, cyberpunk-cozy: Jiro the robot sushi chef rides a vintage delivery tricycle stacked with wooden bento crates toward the viewer, slightly right of center, with a small paper umbrella clipped on. Pink and cyan neon signs, glowing shop windows, puddles reflecting neon, pedestrians with umbrellas at the edges. The center-left of the frame has a darker calmer area of wet street and fog.

**Motion prompt (Veo)**

> Locked-off static camera, no zoom. Rain falls steadily, puddle ripples, neon signs flicker softly. Jiro pedals in place with small leg motions, the crates wobble slightly, he blinks. Pedestrians shift slightly. Return to the exact starting pose at the end.

### `s7-closing`

**Used in the final site:** Yes (comparison scene, then small_scene)

**Still prompt**

> Wide 16:9 scene of the same sushi bar after closing time, late night: chairs up on some tables, a single paper lantern still lit. Jiro the robot sushi chef sits asleep behind the counter on the RIGHT, head gently tilted forward, eyes dimmed to thin blue lines, a small 'z' feeling. A sneaky orange tabby cat creeps along the counter toward a lone tuna nigiri on a plate. Moonlight from a window on the LEFT, calm dark space in the center. Cozy, funny.

**Motion prompt (Veo)**

> Locked-off static camera, no zoom. Jiro breathes slowly, his head bobbing slightly as he dozes. The cat's tail swishes and the cat creeps a tiny bit then settles back. Lantern flickers softly. Moonlight dust motes float. Return to the exact starting pose at the end.

## Ending concepts (`art/endings/prompts.tsv`)

### `e1-koi`

> Wide 16:9 scene at night: the end of a long copper-railed sushi conveyor belt juts out over a moonlit koi pond in a Japanese garden. A GIANT orange-and-white koi fish, bigger than a car, rises from the water with its huge mouth wide open, gulping sushi plates one by one as they slide off the end of the belt. Jiro the robot sushi chef stands on a small wooden bridge nearby, calmly holding a clipboard, unbothered. Lily pads, stone lanterns, ripples, a few plates splashing. Funny and serene.

### `e2-orbit`

> Wide 16:9 scene: the end of a long copper-railed sushi conveyor belt curves up into a steep ski-jump ramp on a rooftop at night over a pixel city. Sushi plates launch off the ramp into a starry sky and arc up past a big full moon, where dozens of sushi pieces already orbit in a ring like tiny satellites and form a sushi constellation. Jiro the robot sushi chef watches from the rooftop with a small telescope. Whimsical, epic.

### `e3-review`

> Wide 16:9 scene: the end of a long copper-railed sushi conveyor belt arrives at a tiny inspection booth where Jiro the robot sushi chef sits wearing a green eyeshade like a strict code reviewer, holding two big rubber stamps. Approved plates slide onto a golden tray with a green APPROVED stamp mark (as a simple green check symbol). Sloppy, misshapen sushi drops through a trapdoor into a dented steel bin marked with a big red X, and the bin burps a puff of smoke. Funny, deadpan.

### `e4-portal`

> Wide 16:9 scene: the end of a long copper-railed sushi conveyor belt dives into a swirling glowing cyan-and-magenta pixel portal floating in a dark wooden room, and the same plates are seen popping back out of a second matching portal on the ceiling, landing at the start of the belt in a loop. Jiro the robot sushi chef stands between the portals scratching his head, a small speech-bubble-like question mark above him as a symbol (no letters). Mind-bending, playful.

### `e5-shinkansen`

> Wide 16:9 scene at a tiny night-time train platform: the end of a long copper-railed sushi conveyor belt feeds sushi plates into the open doors of a small sleek white-and-blue bullet train (shinkansen) the size of a bus, each plate taking its own seat by the window. Jiro the robot sushi chef stands on the platform in a station master cap blowing a whistle and waving a small flag. Glowing platform lights, departure board glow, steam. Cute and absurd.

## Later edits (intent only; exact wording not preserved)

| Final asset | Made from | Intent of each step |
|---|---|---|
| `art/hero-v3-still.png` → `v/s0-hero.mp4` | `art/hero-v2-still.png` (5504 px redraw of the approved v6 hero, empty counter lane) | 1) Edit: remove the middle customer (empty stool), and replace Jiro's mouth with a copper jaw plate. 2) Shrink to 80% anchored bottom-right on magenta, then outpaint a quiet dark entrance wall (noren doorway, coat hook, plant) on the left and top (`art/hero-v3-pre-outpaint.png` is the pre-outpaint). 3) Veo 4K: the left woman nearly still, the middle man laughs and gestures with chopsticks, the right man eats. 4) Crisp composite with STATIC on Jiro, loop_big K=20, jaw.py. |
| `v/s1-code-small.mp4` | `art/s1-code.png` | Veo re-render of the CRT typing, then nopupils.py, then small_scene.py (half size in a lit corner, dark wall). |
| `v/s2-serve.mp4` | `art/s2-serve.png` → `art/serve-nojiro.png` | Edit: remove Jiro and keep everything else. Veo: very little movement (small sips, chopsticks). Crisp composite, loop, darken R/G ×0.48, B ×0.52. |
| `v/s7-closing-small.mp4` | `art/s7-closing.png` | The original Veo loop, then small_scene.py at 50% size on the right, with the rest blurred into shadow. |
| `v/s4-omakase.mp4` | `art/faq-v3.png` | New still: canon Jiro (ref/jiro-char.png) behind an angled counter with square omakase sets being prepared, and five small cute sushi characters (tuna, salmon, tamago, ikura, ebi) sitting on the front set. No Veo: faq_anim.py animates them in place. |
| `v/s6-delivery.mp4` | `art/s6-delivery.png` → `art/delivery-v2.png` | Edit: the trike is stopped and Jiro has his left foot on the ground. Veo: relaxed idle like waiting at a traffic light (a breath, a small weight shift, a blink), no pedalling. Crisp composite, loop. |
| `v/e1-pond.mp4` | `art/endings/pond.png` → `art/endings/pond-final.png` | Edit 1: extend the trestle off the left edge. Edit 2: remove Jiro from the bridge. Veo: water only. Crisp composite with STATIC on the trestle and bridge, loop K=24. |
| `end/koi.png` | `art/endings/koi-sprite.png` | A koi sprite on magenta, chroma-keyed. The first roll had Jiro in its mouth and was re-rolled. |
| `items/*.png` | `art/items-sheet.png` | One Gemini sheet of 30 pixel-art items on magenta, chroma-keyed and cut to 160 px on the long side. |
