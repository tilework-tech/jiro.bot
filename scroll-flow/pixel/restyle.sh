#!/usr/bin/env bash
# Redraw every scene in the pond's pixel style, keeping its content and layout.
# usage: pixel/restyle.sh [scene...]   (writes pixel/raw/<scene>-<take>.png)
cd "$(dirname "$0")/.."
PY=${PY:-python3}
RULES=$(cat pixel/STYLE.md)
BASE="Redraw the FIRST image as true low-resolution pixel art. Keep its content EXACTLY: the same elements, the same people and objects, the same positions, sizes, camera angle, perspective and composition, so it lines up with the original when overlaid. Change ONLY the rendering style, to match the pixel style of the SECOND image (the koi pond): chunky uniform pixels, a small shared palette, flat 2-3 step shading, hard edges, dark outlines one step darker than the fill. Style rules:
$RULES"
JIRO="Jiro must match the THIRD image (canon character reference) exactly."
declare -A SRC NOTE
SRC[hero]=art/hero-v3-still.png;              NOTE[hero]="$JIRO Exception for this scene: Jiro has NO mouth and NO grille, only a plain copper jaw plate under the faceplate. Two customers (woman on the left, man in the middle, man on the far right) and one empty stool. The long counter lane where a conveyor belt runs stays an empty flat wooden strip. The kitchen window on the right stays dark inside. The left side stays a calm dark entrance wall."
SRC[demo]=site/public/p/s1-code-small.jpg;    NOTE[demo]="$JIRO His eyes are plain glowing squares with NO pupils. Jiro and his desk stay small in the lit corner on the left; everything else stays a calm, very dark wall. There is NO rectangular box or border around the lit corner: the desk, floor and wall continue into the darkness, and the light pool fades out with sparse ordered dithering."
SRC[serve]=site/public/p/s2-serve.jpg;        NOTE[serve]="Top-down restaurant view with no robot in it. Keep it dark and calm."
SRC[closing]=site/public/p/s7-closing-small.jpg; NOTE[closing]="$JIRO The small after-hours bar stays small on the right in its pool of light; the rest of the frame stays deep shadow. There is NO rectangular box, border or inset edge: the floor, walls and ceiling of the same room continue across the whole frame into darkness (faint floorboards, faint wall posts), and the light pool fades out with sparse ordered dithering."
SRC[faq]=art/faq-v3.png;                      NOTE[faq]="$JIRO Keep the five small sushi characters on the front board exactly where they are, with their faces."
SRC[delivery]=art/delivery-v2.png;            NOTE[delivery]="$JIRO He sits on the stopped delivery tricycle with one foot on the ground."
SRC[pond]=art/endings/pond-final.png;         NOTE[pond]="This IS the style reference: keep it, but make it strictly obey the rules (uniform chunky pixels, limited palette, no gradients). The long wooden trestle across the middle stays empty. No robot on the bridge."
TAKE=${TAKE:-a}
for s in "${@:-hero demo serve closing faq delivery pond}"; do for sc in $s; do
  refs=("${SRC[$sc]}" art/endings/pond-final.png)
  [[ ${NOTE[$sc]} == *"THIRD image"* ]] && refs+=(ref/jiro-char.png)
  STYLE_OVERRIDE="" SIZE=2K $PY pipeline/gen_still.py "pixel/raw/$sc-$TAKE.png" "$BASE

${NOTE[$sc]}" "${refs[@]}" > "pixel/raw/$sc-$TAKE.log" 2>&1 &
done; done
wait
