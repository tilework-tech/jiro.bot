#!/usr/bin/env bash
# Index every belt sprite (plates, tile, items) with LibreSprite into site/public/art/belt.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p site/public/art/belt/items art/src/ase/belt/items
ls art/work/belt/items/*.png | xargs -P 6 -I{} bash -c 'n=$(basename {} .png); tools/ls-index.sh {} art/src/ase/belt/items/$n >/dev/null && cp art/src/ase/belt/items/$n.png site/public/art/belt/items/$n.png'
for n in plate-grey plate-blue tile; do tools/ls-index.sh art/work/belt/$n.png art/src/ase/belt/$n >/dev/null && cp art/src/ase/belt/$n.png site/public/art/belt/$n.png; done
ls site/public/art/belt/items | wc -l
# frame counts of animated items (horizontal strips)
cat > site/public/art/belt/items/frames.json <<'J'
{ "breathing-onigiri": 2, "waving-ebi": 3, "shivering-jelly": 3, "blinking-maki": 2, "legged-maki": 3 }
J
