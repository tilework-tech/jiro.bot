#!/usr/bin/env bash
# Build the fake-data "restaurant tour" fixture inside the sessions repo (UNTRACKED; delete when done).
# usage: SESSIONS=~/org/workspace/sessions tools/product/make-fixture.sh
# Captured against sessions commit 6181bbe0a (2026-09-29). gen.py uses string anchors in chat-page.ts and
# asserts on two of them; if the fixture moved on, fix the anchors or `git -C $SESSIONS checkout 6181bbe0a`.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
FX=${SESSIONS:-$HOME/org/workspace/sessions}/broker/ui/e2e/fixtures
cd "$FX"
sed 's#/e2e/fixtures/chat-page.ts#/e2e/fixtures/restaurant-tour.ts#; s#Chat page preview#Nori Sessions#' chat-page.html > restaurant-tour.html
python3 "$HERE/gen.py"
echo "wrote $FX/restaurant-tour.{html,ts}"
