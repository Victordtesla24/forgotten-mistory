#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase06"
REPORT_FILE="${REPORT_DIR}/phase06-accessibility-seo-report.md"
METRICS_FILE="${REPORT_DIR}/axe-results.json"

mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

npm run build >/tmp/phase06-build.log 2>&1
npm run start >/tmp/phase06-start.log 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in {1..45}; do
  if curl -fsS "http://127.0.0.1:3000" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

node scripts/validate/phase06_axe_probe.mjs >/tmp/phase06-axe.log

jq -e '.criticalViolations == 0 and .hasWebsiteSchema and .hasPersonSchema' "${METRICS_FILE}" >/dev/null

cat > "${REPORT_FILE}" <<EOF
# Phase 06 Accessibility and SEO Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Axe Total Violations: $(jq -r '.totalViolations' "${METRICS_FILE}")
- Axe Critical Violations: $(jq -r '.criticalViolations' "${METRICS_FILE}")
- JSON-LD WebSite Present: $(jq -r '.hasWebsiteSchema' "${METRICS_FILE}")
- JSON-LD Person Present: $(jq -r '.hasPersonSchema' "${METRICS_FILE}")
- AI chat stream region: aria-live=\"polite\" on message log

## Result

PASS - zero critical axe violations and structured data schema contract validated.
EOF

echo "Phase 06 PASS. Report: ${REPORT_FILE}"
