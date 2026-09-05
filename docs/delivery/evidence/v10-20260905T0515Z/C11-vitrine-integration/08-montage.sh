#!/usr/bin/env bash
# S-4 montage: fold the sixteen raw captures from 08-screenshots.mjs into the
# eight PNGs that are committed — per review width, the hero fold as the reader
# meets it, and the three reworked sections stacked in page order
# (#vitrine, #about, #skills). Each output is palette-reduced so it stays under
# the 400 kB evidence budget; the site is monochrome, so 256 colours is lossless
# to the eye and every judgement in 07-decisions.md D-7 was made on these files.
#
#   bash docs/delivery/evidence/v10-20260905T0515Z/C11-vitrine-integration/08-montage.sh
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="$here/08-screens"
raw="$out/raw"

for width in 1440 1280 834 390; do
  case "$width" in
    1440 | 1280) hero=760 ;;
    834) hero=680 ;;
    *) hero=390 ;;
  esac
  # The stacked sections are three sections tall, so they carry the tighter
  # budget: 560 px wide at 128 colours, and 340 px for the phone stack, which is
  # already three full sections of a 390 px page.
  stack=560
  [ "$width" = 390 ] && stack=340

  convert "$raw/hero-$width.png" -resize "${hero}x" -colors 256 -depth 8 \
    -define png:compression-level=9 "$out/hero-$width.png"

  convert "$raw/vitrine-$width.png" "$raw/about-$width.png" "$raw/skills-$width.png" \
    -background '#0A0A0A' -append -resize "${stack}x" -colors 128 -depth 8 \
    -define png:compression-level=9 "$out/sections-$width.png"
done

rm -rf "$raw"
ls -l "$out"
