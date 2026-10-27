#!/usr/bin/env bash
# Fetch the live site's wrapper fonts into reference/brand/fonts/ (not bundled:
# General Sans is served by Fontshare under its webfont licence). IBM Plex Mono
# comes from @fontsource/ibm-plex-mono, which must be installed in the cwd.
set -euo pipefail
BRAND="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$BRAND/fonts"
css=$(curl -sfL "https://api.fontshare.com/v2/css?f%5B%5D=general-sans@400,500,600,700&display=swap")
: > "$BRAND/fonts/fonts.css"
for w in 400 500 600 700; do
  url=$(printf '%s' "$css" | tr -d '\n' | grep -o "@font-face[^}]*font-weight: $w;[^}]*}" | grep -o "//[^']*\.woff2" | head -1)
  curl -sfL "https:$url" -o "$BRAND/fonts/general-sans-$w.woff2"
  echo "@font-face{font-family:'General Sans';font-weight:$w;src:url(general-sans-$w.woff2) format('woff2');}" >> "$BRAND/fonts/fonts.css"
done
for w in 400 500 600; do
  cp "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-$w-normal.woff2" "$BRAND/fonts/plex-mono-$w.woff2"
  echo "@font-face{font-family:'IBM Plex Mono';font-weight:$w;src:url(plex-mono-$w.woff2) format('woff2');}" >> "$BRAND/fonts/fonts.css"
done
echo "fonts: $BRAND/fonts"
