#!/usr/bin/env bash
# loop.sh IN OUT [WIDTH]
# Seamless loop: out[i<K] = mix(tail[i], head[i], i/K), then frames K..N-K-1.
# The last output frame is f[N-K-1] and wraps to out[0] = f[N-K], a normal consecutive step.
set -euo pipefail
FF=~/jiro/bin/ffmpeg; FP=~/jiro/bin/ffprobe
IN=$1; OUT=$2; W=${3:-1920}; K=12
N=$($FP -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$IN")
# Veo pins the last frame to the start still, so drop it as a near-duplicate of frame 0.
N=$((N-1))
$FF -v error -y -i "$IN" -filter_complex "
[0:v]fps=24,trim=start_frame=0:end_frame=$N,setpts=PTS-STARTPTS,split=3[a][b][c];
[a]trim=start_frame=0:end_frame=$K,setpts=PTS-STARTPTS[head];
[b]trim=start_frame=$((N-K)):end_frame=$N,setpts=PTS-STARTPTS[tail];
[c]trim=start_frame=$K:end_frame=$((N-K)),setpts=PTS-STARTPTS[mid];
[head][tail]blend=all_expr='A*(N/$K)+B*(1-N/$K)'[x];
[x][mid]concat=n=2:v=1,scale=$W:-2:flags=lanczos,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 24 -profile:v high -r 24 -movflags +faststart "$OUT"
echo "$OUT $($FP -v error -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$OUT") frames"
