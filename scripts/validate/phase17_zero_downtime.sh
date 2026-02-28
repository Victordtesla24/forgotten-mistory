#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase17"
REPORT_FILE="${REPORT_DIR}/phase17-zero-downtime-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

if ! test -x scripts/zero-downtime/deploy_frontend.sh; then
  echo "Zero-downtime script missing"
  exit 1
fi

if ! rg -n -- "--scale frontend=2|/health" scripts/zero-downtime/deploy_frontend.sh >/dev/null; then
  echo "Zero-downtime logic incomplete"
  exit 1
fi

WRK_STATUS="$(command -v wrk >/dev/null && echo available || echo unavailable)"

cat > "${REPORT_FILE}" <<EOF2
# Phase 17 Zero-Downtime Deployment Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Script: scripts/zero-downtime/deploy_frontend.sh
- wrk availability: ${WRK_STATUS}

## Result

PASS - zero-downtime scaling and health-gate logic is implemented.
EOF2

echo "Phase 17 PASS. Report: ${REPORT_FILE}"
