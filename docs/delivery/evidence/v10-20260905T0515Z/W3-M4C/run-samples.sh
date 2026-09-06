#!/usr/bin/env bash
# run-samples.sh — G-M4 re-measurement after the W3-M4C correction.
# Four cold slots spaced >= 10 minutes; each slot probes BOTH routes from a
# fresh process (no ?warm=1 from the probe itself). Two warm samples at the end.
set -uo pipefail
cd "$(dirname "$0")"
P=probe-first-token.mjs
for slot in 1 2 3 4; do
  if [ "$slot" -gt 1 ]; then sleep 600; fi
  node "$P" --target=hosting --warm=0 --label="c${slot}a-hosting-cold" --out=. >> runner.log 2>&1
  node "$P" --target=origin  --warm=0 --label="c${slot}b-origin-cold"  --out=. >> runner.log 2>&1
  echo "slot ${slot} done $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> runner.log
done
node "$P" --target=origin  --warm=1 --label="w1-origin-warm"  --out=. >> runner.log 2>&1
node "$P" --target=hosting --warm=1 --label="w2-hosting-warm" --out=. >> runner.log 2>&1
echo "ALL DONE $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> runner.log
touch DONE.marker
