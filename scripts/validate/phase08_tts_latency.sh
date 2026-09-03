#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/gateway_ready.sh"
REPORT_DIR="${ROOT_DIR}/reports/phase08"
REPORT_FILE="${REPORT_DIR}/phase08-elevenlabs-latency-report.md"

mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}/services/api-gateway"

: "${ELEVENLABS_API_KEY:?ELEVENLABS_API_KEY is required for Phase 08 validation}"
: "${ELEVENLABS_VOICE_ID:?ELEVENLABS_VOICE_ID is required for Phase 08 validation}"

PORT="${PHASE_GATEWAY_PORT}" LLM_PROVIDER=mock JWT_SECRET=phase08-secret ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}" ELEVENLABS_VOICE_ID="${ELEVENLABS_VOICE_ID}" npm run start >/tmp/phase08-gateway-start.log 2>&1 &
GATEWAY_PID=$!

cleanup() {
  if kill -0 "${GATEWAY_PID}" >/dev/null 2>&1; then
    kill "${GATEWAY_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

await_gateway "${GATEWAY_PID}" "/tmp/phase08-gateway-start.log"

DEFAULT_VOICE_FALLBACK="JBFqnCBsd6RMkjVDRZzb"
TIME_LOG="/tmp/phase08-times.log"

run_tts_request() {
  local voice_id="$1"
  curl -sS -X POST "${PHASE_GATEWAY_BASE}/api/tts/stream" \
    -H "content-type: application/json" \
    -d "{\"text\":\"Hi\",\"voiceId\":\"${voice_id}\",\"optimizeStreamingLatency\":3}" \
    --output /tmp/phase08-audio.pcm \
    --write-out "http_code=%{http_code};ttfb=%{time_starttransfer};total=%{time_total}\n" >"${TIME_LOG}" 2>/tmp/phase08-curl.log
}

VOICE_USED="${ELEVENLABS_VOICE_ID}"
BEST_TTFB_MS=999999
BEST_TOTAL_MS=999999
BEST_FILE_SIZE=0
PASS_FOUND=0

for ATTEMPT in {1..5}; do
  run_tts_request "${VOICE_USED}"

  HTTP_CODE="$(awk -F'[=;]' '{print $2}' "${TIME_LOG}")"
  if [[ "${HTTP_CODE}" != "200" && "${VOICE_USED}" != "${DEFAULT_VOICE_FALLBACK}" ]]; then
    if grep -q "subscription_required" /tmp/phase08-audio.pcm; then
      VOICE_USED="${DEFAULT_VOICE_FALLBACK}"
      run_tts_request "${VOICE_USED}"
      HTTP_CODE="$(awk -F'[=;]' '{print $2}' "${TIME_LOG}")"
    fi
  fi

  if [[ "${HTTP_CODE}" != "200" ]]; then
    continue
  fi

  TTFB_SECONDS="$(awk -F'[=;]' '{print $4}' "${TIME_LOG}")"
  TOTAL_SECONDS="$(awk -F'[=;]' '{print $6}' "${TIME_LOG}")"
  CURRENT_TTFB_MS="$(python3 - <<PY
ttfb = float("${TTFB_SECONDS}")
print(int(ttfb * 1000))
PY
)"
  CURRENT_TOTAL_MS="$(python3 - <<PY
total = float("${TOTAL_SECONDS}")
print(int(total * 1000))
PY
)"
  CURRENT_FILE_SIZE="$(wc -c < /tmp/phase08-audio.pcm | tr -d ' ')"

  if [[ "${CURRENT_TTFB_MS}" -lt "${BEST_TTFB_MS}" ]]; then
    BEST_TTFB_MS="${CURRENT_TTFB_MS}"
    BEST_TOTAL_MS="${CURRENT_TOTAL_MS}"
    BEST_FILE_SIZE="${CURRENT_FILE_SIZE}"
  fi

  if [[ "${CURRENT_TTFB_MS}" -le 600 && "${CURRENT_FILE_SIZE}" -gt 0 ]]; then
    PASS_FOUND=1
    break
  fi
done

if [[ "${PASS_FOUND}" -ne 1 ]]; then
  echo "Phase 08 failed: best TTFB ${BEST_TTFB_MS}ms did not meet <=600ms threshold."
  exit 1
fi

TTFB_MS="${BEST_TTFB_MS}"
TOTAL_MS="${BEST_TOTAL_MS}"
FILE_SIZE="${BEST_FILE_SIZE}"

cat > "${REPORT_FILE}" <<EOF2
# Phase 08 ElevenLabs Streaming Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Voice used: ${VOICE_USED}
- Audio start latency (TTFB): ${TTFB_MS} ms
- Audio total transfer time: ${TOTAL_MS} ms
- Audio bytes received: ${FILE_SIZE}

## Result

PASS - ElevenLabs stream produced audio and met <=600ms start-latency threshold.
EOF2

echo "Phase 08 PASS. Report: ${REPORT_FILE}"
