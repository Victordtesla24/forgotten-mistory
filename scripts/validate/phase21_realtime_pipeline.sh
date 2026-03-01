#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase21"
REPORT_FILE="${REPORT_DIR}/phase21-realtime-pipeline-report.md"
mkdir -p "${REPORT_DIR}"

ORCH_LOG="/tmp/phase21-orchestrator.log"
GATEWAY_LOG="/tmp/phase21-gateway.log"

cleanup() {
  if [[ -n "${ORCH_PID:-}" ]] && kill -0 "${ORCH_PID}" >/dev/null 2>&1; then
    kill "${ORCH_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${GATEWAY_PID:-}" ]] && kill -0 "${GATEWAY_PID}" >/dev/null 2>&1; then
    kill "${GATEWAY_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

cd "${ROOT_DIR}/services/realtime-orchestrator"
ORCHESTRATOR_GRPC_PORT=50051 LLM_PROVIDER=mock npm run start >"${ORCH_LOG}" 2>&1 &
ORCH_PID=$!

cd "${ROOT_DIR}/services/api-gateway"
PORT=8000 LLM_PROVIDER=mock JWT_SECRET=phase21-secret ORCHESTRATOR_GRPC_ADDR=127.0.0.1:50051 npm run start >"${GATEWAY_LOG}" 2>&1 &
GATEWAY_PID=$!

for _ in {1..45}; do
  if curl -fsS "http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

TEST_OUT="$(cd "${ROOT_DIR}" && API_BASE=http://127.0.0.1:8000 WS_BASE=ws://127.0.0.1:8000 node tests/test_realtime_pipeline.js)"
TOKEN_TO_DONE="$(echo "${TEST_OUT}" | jq -r '.metrics.firstTokenToDoneMs // 0')"
TOKEN_TO_AVATAR="$(echo "${TEST_OUT}" | jq -r '.metrics.firstTokenToAvatarMs // 0')"

cat > "${REPORT_FILE}" <<EOF2
# Phase 21 Realtime Pipeline Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Validation mode: mock provider end-to-end
- First token to done latency: ${TOKEN_TO_DONE} ms
- First token to avatar latency: ${TOKEN_TO_AVATAR} ms

## Result

PASS - realtime session creation, websocket stream orchestration, and metrics endpoint validated.
EOF2

echo "Phase 21 PASS. Report: ${REPORT_FILE}"
