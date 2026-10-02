#!/bin/bash
# loop every finished raw Veo clip into site/public/v once
cd "$(dirname "$0")/.."
while true; do
  for raw in veo/*-a.mp4; do
    id=$(basename $raw -a.mp4); out=site/public/v/$id.mp4
    [ -f "$out" ] && continue
    .venv/bin/python pipeline/loop.py $raw $out 8 >> qa/loops.log 2>&1
  done
  n=$(ls site/public/v/*.mp4 | wc -l); [ $n -ge 10 ] && exit 0
  sleep 20
done
