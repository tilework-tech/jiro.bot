#!/usr/bin/env bash
# Encode the two Playwright webm recordings into the site's MP4s + posters (exact flags used on 2026-09-29).
# usage: tools/compare/encode.sh /tmp/cmpvid     (dir containing generic.webm and jiro.webm from record-compare.mjs)
# ffmpeg comes from the imageio-ffmpeg wheel (no system ffmpeg on the session boxes).
set -euo pipefail
IN=${1:-/tmp/cmpvid}
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
O=$ROOT/public/ui/compare; mkdir -p "$O"
FF=${FF:-$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
# -ss trims the blank white page-load frames (measured with signalstats YAVG, see docs/06); -t 34 = ~30 s
# animation + 4.2 s hold. generic uses crf 27 because crf 26 was 3.1 MB (budget <= 3 MB per file).
$FF -y -loglevel error -ss ${SS_GENERIC:-0.1} -i "$IN/generic.webm" -t 34 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -r 25 -movflags +faststart -an "$O/generic.mp4"
$FF -y -loglevel error -ss ${SS_JIRO:-0.25}   -i "$IN/jiro.webm"    -t 34 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -r 25 -movflags +faststart -an "$O/jiro.mp4"
for f in generic jiro; do
  $FF -y -loglevel error -sseof -0.3 -i "$O/$f.mp4" -update 1 -q:v 3 "$O/$f.jpg"   # poster = final frame
done
ls -la "$O"
# Find blank lead-in frames if the timing changes:
#   $FF -t 2.5 -i generic.webm -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -o "pts_time:[0-9.]*\|YAVG=[0-9.]*" | paste - -
