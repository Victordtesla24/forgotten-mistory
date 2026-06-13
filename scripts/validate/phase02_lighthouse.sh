#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase02"
REPORT_FILE="${REPORT_DIR}/phase02-lighthouse-report.md"
URL="http://127.0.0.1:3000/"

mkdir -p "${REPORT_DIR}"

cd "${ROOT_DIR}"
rm -rf .lighthouseci

npm run build >/tmp/phase02-build.log 2>&1
npm run start >/tmp/phase02-start.log 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in {1..40}; do
  if curl -fsS "${URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

npx --yes @lhci/cli@0.13.0 collect --config=lighthouserc.json
npx --yes @lhci/cli@0.13.0 assert --config=lighthouserc.json
npm run -s validate:phase02:screenshots

LATEST_LHR="$(ls -t .lighthouseci/lhr-*.json | head -n 1)"
PERF_SCORE="$(jq '.categories.performance.score' "${LATEST_LHR}")"
CLS_VALUE="$(jq '.audits["cumulative-layout-shift"].numericValue' "${LATEST_LHR}")"

awk "BEGIN {exit !(${PERF_SCORE} >= 0.9)}"
awk "BEGIN {exit !(${CLS_VALUE} <= 0.1)}"

cat > "${REPORT_FILE}" <<EOF
# Phase 02 Lighthouse + Screenshot Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- URL: ${URL}
- Performance Score: ${PERF_SCORE}
- CLS: ${CLS_VALUE}
- Lighthouse Config: lighthouserc.json
- Screenshot Archive: reports/phase02/screenshots

## Result

PASS - Lighthouse thresholds met and breakpoint screenshots archived.
EOF

echo "Phase 02 PASS. Report: ${REPORT_FILE}"
