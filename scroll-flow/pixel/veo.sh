#!/usr/bin/env bash
# Animate the pixel stills with Veo 3.1 (first and last frame pinned to the still).
cd "$(dirname "$0")/.."
PY=${PY:-python3}
L="Locked-off static camera, no camera movement at all. Very calm, small, slow movements only."
E="Everything else stays perfectly still. Return to the exact starting pose at the end."
declare -A M
M[hero]="$L The woman on the left is almost completely still, only breathing and one slow sip of tea. The man in the middle laughs and gestures a little with his chopsticks. The man on the far right eats slowly. The paper lanterns sway very slightly. The robot chef behind the counter does not move. $E"
M[demo]="$L The robot types calmly on the keyboard with small hand movements, green code lines scroll on the small CRT screen, the paper lantern flickers softly, a thin wisp of steam rises from the tea cup. The robot's head does not move. $E"
M[serve]="$L Top-down view. Very little movement: a few customers take small sips and make small chopstick movements, the lantern light flickers softly. $E"
M[closing]="$L The robot chef dozes behind the counter, his head bobbing very slightly. The cat creeps a tiny bit toward a piece of sushi and then settles. The lantern flickers softly, moonlight dust drifts in the window beam. $E"
M[delivery]="$L Rain falls steadily, neon signs flicker softly, puddle reflections ripple. The robot sits relaxed on the stopped tricycle with one foot on the ground, like waiting at a traffic light: one slow breath and a small weight shift, no pedalling. The people with umbrellas stand still. $E"
M[pond]="$L Only the water moves: gentle ripples, dark koi shadows glide slowly under the surface, the moonlight shimmers on the water, the reeds sway very slightly. The wooden walkway, bridge and lanterns do not move. $E"
for s in "${@:-hero demo serve closing delivery pond}"; do for sc in $s; do
  $PY pipeline/gen_veo.py "pixel/out/$sc.png" "pixel/veo/$sc-${TAKE:-a}.mp4" "${M[$sc]}" > "pixel/veo/$sc-${TAKE:-a}.log" 2>&1 &
done; done
wait
