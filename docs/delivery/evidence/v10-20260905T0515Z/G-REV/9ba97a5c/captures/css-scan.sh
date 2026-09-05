#!/usr/bin/env bash
set -uo pipefail
SP=/tmp/claude-0/-root-forgotten-mistory/46afcf46-5464-449d-9c0d-a9f0b25357cd/scratchpad
EV=/root/forgotten-mistory/.claude/worktrees/wf_2cd21f31-055-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/captures
mkdir -p "$EV"
grep -o '/_next/static/css/[^"]*\.css' "$SP/live-index.html" | sort -u > "$SP/css-list.txt"
cat "$SP/css-list.txt"
: > "$SP/css-bundle.css"
while read -r p; do
  curl -fsS "https://forgotten-mistory.web.app$p" >> "$SP/css-bundle.css"
  printf '\n' >> "$SP/css-bundle.css"
done < "$SP/css-list.txt"
wc -c "$SP/css-bundle.css"

{
echo "### served CSS files"
cat "$SP/css-list.txt"
echo
echo "### bundle bytes"
wc -c "$SP/css-bundle.css"
echo
echo "-- literal 138 143 154 (cool-steel) --"
grep -oE 'rgba?\(138[ ,]+143[ ,]+154[^)]*\)' "$SP/css-bundle.css" | sort | uniq -c
echo "-- red-500 family hexes --"
grep -oiE '#(ef4444|dc2626|f87171|fca5a5|b91c1c|991b1b|fee2e2)' "$SP/css-bundle.css" | sort | uniq -c
echo "-- orange family hexes --"
grep -oiE '#(f97316|fb923c|ea580c|fdba74|fed7aa|c2410c)' "$SP/css-bundle.css" | sort | uniq -c
echo "-- tailwind red/orange utility class selectors --"
grep -oE '\.(text|bg|border|from|to|ring|fill|stroke)-(red|orange|amber|yellow|green|blue|indigo|purple|pink|rose|teal|cyan|sky|violet|fuchsia|lime|emerald)-[0-9]{2,3}' "$SP/css-bundle.css" | sort | uniq -c | head -60
echo "-- rgb() triples with chroma (max-min) > 18, top 40 --"
grep -oE 'rgba?\([0-9]{1,3}[ ,]+[0-9]{1,3}[ ,]+[0-9]{1,3}' "$SP/css-bundle.css" | sed -E 's/rgba?\(//' | tr ',' ' ' | awk '{mx=$1;mn=$1; if($2>mx)mx=$2; if($2<mn)mn=$2; if($3>mx)mx=$3; if($3<mn)mn=$3; if(mx-mn>18) print $1","$2","$3"  chroma="mx-mn}' | sort | uniq -c | sort -rn | head -40
echo "-- hex colors with chroma > 18, top 40 --"
grep -oE '#[0-9a-fA-F]{6}' "$SP/css-bundle.css" | tr 'A-F' 'a-f' | sort -u | while read -r h; do
  r=$((16#${h:1:2})); g=$((16#${h:3:2})); b=$((16#${h:5:2}))
  mx=$r; mn=$r
  [ $g -gt $mx ] && mx=$g; [ $g -lt $mn ] && mn=$g
  [ $b -gt $mx ] && mx=$b; [ $b -lt $mn ] && mn=$b
  c=$((mx-mn))
  [ $c -gt 18 ] && echo "$h chroma=$c"
done | sort -t= -k2 -rn | head -40
echo "-- gold token definitions --"
grep -oE '\-\-gold[a-z-]*:[^;]*;' "$SP/css-bundle.css" | sort -u
} > "$EV/css-chroma-scan.txt" 2>&1
echo "WROTE $EV/css-chroma-scan.txt"
