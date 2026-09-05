#!/usr/bin/env bash
set -uo pipefail
SP=/tmp/claude-0/-root-forgotten-mistory/46afcf46-5464-449d-9c0d-a9f0b25357cd/scratchpad
EV=/root/forgotten-mistory/.claude/worktrees/wf_2cd21f31-055-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/captures
grep -o '/_next/static/chunks/[^"]*\.js' "$SP/live-index.html" | sort -u > "$SP/js-list.txt"
: > "$SP/js-bundle.js"
while read -r p; do curl -fsS "https://forgotten-mistory.web.app$p" >> "$SP/js-bundle.js"; printf '\n' >> "$SP/js-bundle.js"; done < "$SP/js-list.txt"
{
echo "### served JS chunks: $(wc -l < "$SP/js-list.txt") files, $(wc -c < "$SP/js-bundle.js") bytes"
echo
echo "-- /api/realtime occurrences (G-M1) --"; grep -o '/api/realtime' "$SP/js-bundle.js" | wc -l
echo "-- /api/chat-with-vic occurrences (G-M1) --"; grep -o '/api/chat-with-vic' "$SP/js-bundle.js" | wc -l
echo "-- /api/chat occurrences --"; grep -o '/api/chat[^-]' "$SP/js-bundle.js" | wc -l
echo "-- endpoint ladder context (200 chars around first realtime hit) --"
grep -o '.\{160\}/api/realtime.\{200\}' "$SP/js-bundle.js" | head -3
echo
echo "-- chat-with-vic context --"
grep -o '.\{160\}/api/chat-with-vic.\{200\}' "$SP/js-bundle.js" | head -3
echo
echo "-- client payload provider/model fields (G-M3) --"
grep -o 'provider:"[a-z]*"' "$SP/js-bundle.js" | sort | uniq -c
grep -o '.\{0,140\}provider:"openai".\{0,180\}' "$SP/js-bundle.js" | head -3
echo
echo "-- streaming indicators --"
grep -c 'text/event-stream' "$SP/js-bundle.js"
grep -o 'getReader()' "$SP/js-bundle.js" | wc -l
echo
echo "-- greeting mp3 ref + expected sha constant --"
grep -o '.\{0,80\}minivic-greeting\.mp3.\{0,200\}' "$SP/js-bundle.js" | head -2
echo
echo "-- HyperFrames / three / R3F presence in served JS --"
for t in hyperframes HyperFrames "@react-three" "three.module" REVISION; do printf '%s: ' "$t"; grep -o "$t" "$SP/js-bundle.js" | wc -l; done
} > "$EV/served-js-scan.txt" 2>&1
echo WROTE "$EV/served-js-scan.txt"
cat "$EV/served-js-scan.txt"
