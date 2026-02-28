#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase20"
REPORT_FILE="${REPORT_DIR}/phase20-scaling-strategy-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

if ! rg -n "LLM_PROVIDER" services/api-gateway/src/providers/index.ts docs/runbooks/scaling-strategy.md >/dev/null; then
  echo "LLM provider runtime switch docs/code missing"
  exit 1
fi

if ! test -f config/traefik/dynamic.yml; then
  echo "Traefik staging config missing"
  exit 1
fi

cat > "${REPORT_FILE}" <<EOF2
# Phase 20 Scaling Strategy Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Provider swap contract: present (\`LLM_PROVIDER\`)
- Traefik staging config: present
- Upgrade runbook: docs/runbooks/scaling-strategy.md

## Result

PASS - horizontal scaling readiness artifacts are complete.
EOF2

echo "Phase 20 PASS. Report: ${REPORT_FILE}"
