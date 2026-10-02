#!/usr/bin/env bash
# Palette-index a PNG with LibreSprite: snap every pixel to palette/jiro56-libresprite.gpl (no dither),
# keep transparency, optional nearest-neighbour rescale, and save both the .ase source and the PNG.
# Usage: tools/ls-index.sh <in.png> <out-base-without-ext> [width height]
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
LS=${LIBRESPRITE:-/home/sprite/org/workspace/.local/tools/squashfs-root/AppRun}
PAL="$HERE/../palette/jiro56-libresprite.gpl"
in=$(realpath "$1"); out=$(realpath -m "$2"); w=${3:-}; h=${4:-}
mkdir -p "$(dirname "$out")"
export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/tmp/xdg-ls}; mkdir -p "$XDG_RUNTIME_DIR"; chmod 700 "$XDG_RUNTIME_DIR"
js=$(mktemp --suffix .js)
cat > "$js" <<JS
var s = app.activeSprite, c = app.command;
s.loadPalette("$PAL");
c.setParameter("format", "indexed"); c.setParameter("dithering", "none"); c.ChangePixelFormat(); c.clearParameters();
if ("$w" !== "") {
  c.setParameter("use-ui", "false"); c.setParameter("width", "$w"); c.setParameter("height", "$h");
  c.setParameter("resize-method", "nearest"); c.SpriteSize(); c.clearParameters();
}
s.saveAs("$out.ase", true);
s.saveAs("$out.png", true);
JS
rm -f "$out.png" "$out.ase"
SDL_VIDEODRIVER=offscreen "$LS" "$in" --script "$js" >/dev/null 2>&1 &
pid=$!
sleep "${LS_WAIT:-3}"
kill -TERM $pid 2>/dev/null || true
for _ in $(seq 1 40); do [ -s "$out.png" ] && [ -s "$out.ase" ] && break; sleep 0.25; done
sleep 0.3; kill -9 $pid 2>/dev/null || true; wait $pid 2>/dev/null || true
rm -f "$js"
[ -s "$out.png" ] || { echo "libresprite produced nothing for $in" >&2; exit 1; }
echo "$out.png"
