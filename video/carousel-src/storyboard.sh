#!/usr/bin/env bash
# Storyboard sheets for review: key frames of every scene and cut, tiled into
# storyboard/<scene>-<cut>.png. Needs the repo root served on $PORT (default 3011).
set -euo pipefail
cd "$(dirname "$0")"
FF=node_modules/ffmpeg-static/ffmpeg
declare -A TIMES=(
  [oncall]=3,8.5,14,19.5,23.5,28
  [multiplayer]=4.5,10.5,17,25,28.5,33
  [rbac]=4,11,18,22,27,32
)
rm -rf stills && mkdir -p storyboard
for scene in oncall multiplayer rbac; do
  node build.mjs "scenes/$scene.html" "built/$scene.html" > /dev/null
  for cut in desktop mobile; do
    node render.mjs --scene="$scene" --cut="$cut" --times="${TIMES[$scene]}"
    w=$([ "$cut" = desktop ] && echo 600 || echo 360)
    "$FF" -v error -y -pattern_type glob -i "stills/$scene-$cut-*.png" \
      -vf "scale=$w:-1,tile=$([ "$cut" = desktop ] && echo 3x2 || echo 6x1):padding=10:color=0x0a0a0a" \
      -frames:v 1 "storyboard/$scene-$cut.png"
  done
  node render.mjs --scene="$scene" --cut=poster && cp "../../site/video/carousel/$scene-poster.jpg" storyboard/
done
ls storyboard
