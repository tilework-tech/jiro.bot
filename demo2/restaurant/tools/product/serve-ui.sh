#!/usr/bin/env bash
# Start the broker UI dev server against a DEAD API on 127.0.0.1:4173 with Nori credentials scrubbed,
# so the capture can never reach a real broker. Stop it with: pkill -f "vite.*4173"
set -euo pipefail
UI=${SESSIONS:-$HOME/org/workspace/sessions}/broker/ui
cd "$UI"
[ -d node_modules ] || bun install --frozen-lockfile
env -u NORI_SESSIONS_URL -u NORI_SESSIONS_TOKEN $(env | grep -o '^NORI_BROKER[A-Z_]*' | sed 's/^/-u /') \
  VITE_API_TARGET=http://127.0.0.1:9 nohup bun run dev -- --host 127.0.0.1 --port 4173 > /tmp/product-vite.log 2>&1 &
sleep 6; tail -3 /tmp/product-vite.log
echo "fixture: http://127.0.0.1:4173/e2e/fixtures/restaurant-tour.html?theme=dark&state=conversation|done|landing"
