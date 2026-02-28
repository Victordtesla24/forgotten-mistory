#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase15"
REPORT_FILE="${REPORT_DIR}/phase15-gateway-hardening-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}/services/api-gateway"

PORT=8000 LLM_PROVIDER=mock JWT_SECRET=phase15-secret ALLOWED_ORIGINS=http://localhost:3000 npm run start >/tmp/phase15-gateway.log 2>&1 &
GATEWAY_PID=$!
trap 'kill ${GATEWAY_PID} >/dev/null 2>&1 || true' EXIT

for _ in {1..45}; do
  if curl -fsS "http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

CORS_CODE="$(curl -s -o /tmp/phase15-cors.txt -w '%{http_code}' -H 'Origin: https://evil.example' -H 'content-type: application/json' -X POST http://127.0.0.1:8000/api/chat -d '{"message":"test","stream":true}')"

LIMIT_FAIL=0
for i in $(seq 1 25); do
  code="$(curl -s -o /tmp/phase15-rate-${i}.txt -w '%{http_code}' -H 'content-type: application/json' -X POST http://127.0.0.1:8000/api/chat -d '{"message":"rate test","stream":false}')"
  if [[ "$i" -ge 21 && "$code" != "429" ]]; then
    LIMIT_FAIL=1
  fi
done

if [[ "${CORS_CODE}" != "500" && "${CORS_CODE}" != "403" ]]; then
  echo "Unexpected CORS rejection code: ${CORS_CODE}"
  exit 1
fi
if [[ "${LIMIT_FAIL}" -ne 0 ]]; then
  echo "Rate limiting did not return 429 after threshold."
  exit 1
fi

cat > "${REPORT_FILE}" <<EOF2
# Phase 15 API Gateway Hardening Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- CORS external-origin rejection: ${CORS_CODE}
- Rate limit threshold enforcement: PASS (429 after 20 req/min)

## Result

PASS - gateway hardening policies enforce CORS and rate limits.
EOF2

echo "Phase 15 PASS. Report: ${REPORT_FILE}"
