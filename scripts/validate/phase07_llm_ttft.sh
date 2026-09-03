#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/gateway_ready.sh"
REPORT_DIR="${ROOT_DIR}/reports/phase07"
REPORT_FILE="${REPORT_DIR}/phase07-llm-ttft-report.md"

mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

cd services/api-gateway
npm install >/tmp/phase07-gateway-install.log 2>&1
LLM_PROVIDER=mock PORT="${PHASE_GATEWAY_PORT}" JWT_SECRET=phase07-secret npm run start >/tmp/phase07-gateway-start.log 2>&1 &
GATEWAY_PID=$!

cleanup() {
  if kill -0 "${GATEWAY_PID}" >/dev/null 2>&1; then
    kill "${GATEWAY_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

await_gateway "${GATEWAY_PID}" "/tmp/phase07-gateway-start.log"

TTFT_JSON="$(npm run -s test:ttft)"
TTFT_MS="$(echo "${TTFT_JSON}" | jq -r '.ttftMs')"

awk "BEGIN {exit !(${TTFT_MS} < 800)}"

cat > "${REPORT_FILE}" <<EOF2
# Phase 07 LLM TTFT Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Provider: mock (gateway streaming path validation)
- Endpoint: /api/chat (stream: true)
- TTFT: ${TTFT_MS} ms

## Result

PASS - gateway streaming TTFT gate met (<800ms).
EOF2

echo "Phase 07 PASS. Report: ${REPORT_FILE}"
