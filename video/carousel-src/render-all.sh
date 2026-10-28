#!/usr/bin/env bash
# Builds and renders every scene: both cuts plus the shared poster. Needs the
# jiro.bot repo root served on $PORT (default 3011); see README.md.
set -euo pipefail
cd "$(dirname "$0")"
for scene in oncall multiplayer rbac; do
  node build.mjs "scenes/$scene.html" "built/$scene.html" > /dev/null
  node render.mjs --scene="$scene" --cut=desktop
  node render.mjs --scene="$scene" --cut=mobile
  node render.mjs --scene="$scene" --cut=poster
done
ls -l ../../site/video/carousel/
