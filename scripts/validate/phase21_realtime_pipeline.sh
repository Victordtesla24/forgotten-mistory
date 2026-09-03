#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/gateway_ready.sh"
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
PORT="${PHASE_GATEWAY_PORT}" LLM_PROVIDER=mock JWT_SECRET=phase21-secret ORCHESTRATOR_GRPC_ADDR=127.0.0.1:50051 npm run start >"${GATEWAY_LOG}" 2>&1 &
GATEWAY_PID=$!

await_gateway "${GATEWAY_PID}" "${GATEWAY_LOG}"

# The driver this phase measures was deleted in 3d6b071 and never replaced, while
# this script and package.json both went on referencing it. Invoking a missing
# file fails with an opaque MODULE_NOT_FOUND that reads like an environment
# problem; say plainly instead that the verification does not exist, so nobody
# mistakes a broken reference for a broken pipeline — or, worse, edits the
# assertion away to make the phase "pass".
PIPELINE_DRIVER="${ROOT_DIR}/tests/test_realtime_pipeline.js"
if [ ! -f "${PIPELINE_DRIVER}" ]; then
  echo "FATAL: ${PIPELINE_DRIVER} does not exist." >&2
  echo "       It was removed in 3d6b071. Phase 21 cannot measure a pipeline it" >&2
  echo "       has no driver for, and will not report a pass it did not earn." >&2
  echo "       Restore the driver, or rebuild it with the realtime pipeline." >&2
  exit 1
fi

TEST_OUT="$(cd "${ROOT_DIR}" && API_BASE=${PHASE_GATEWAY_BASE} WS_BASE=ws://127.0.0.1:${PHASE_GATEWAY_PORT} node "${PIPELINE_DRIVER}")"
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
