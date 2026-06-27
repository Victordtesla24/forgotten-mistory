#!/usr/bin/env bash
# CI-CD-8: Lighthouse budget fail-loud test
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

cleanup() {
  if [ -n "${SERVER_PID:-}" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Cleaning up dev server (PID $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "=== CI-CD-8: Lighthouse Fail-Loud Test ==="

echo "Starting dev server..."
npx next start -p 3000 &
SERVER_PID=$!
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1; then echo "Server ready"; break; fi
  sleep 1
done

echo ""
echo "--- Test 1: Impossible budgets (should FAIL) ---"
rm -rf .lighthouseci
npx --yes @lhci/cli@0.13.0 collect --config=lighthouserc.test-fail.json 2>&1 || { echo "ERROR: collect"; exit 1; }
if npx --yes @lhci/cli@0.13.0 assert --config=lighthouserc.test-fail.json 2>&1; then
  echo "FAIL: lhci assert PASSED with impossible budgets!"
  exit 1
else
  echo "PASS: lhci assert correctly FAILED"
fi

echo ""
echo "--- Test 2: Realistic budgets (should PASS) ---"
rm -rf .lighthouseci
npx --yes @lhci/cli@0.13.0 collect --config=lighthouserc.json 2>&1 || { echo "ERROR: collect"; exit 1; }
if npx --yes @lhci/cli@0.13.0 assert --config=lighthouserc.json 2>&1; then
  echo "PASS: lhci assert passed with realistic budgets"
else
  echo "FAIL: lhci assert failed with realistic budgets"
  exit 1
fi

echo ""
echo "=== All tests passed ==="
