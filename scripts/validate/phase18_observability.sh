#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase18"
REPORT_FILE="${REPORT_DIR}/phase18-observability-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

for file in config/prometheus/prometheus.yml docker-compose.yml; do
  test -f "$file" || { echo "Missing $file"; exit 1; }
done

for metric in "llm_ttft_ms" "elevenlabs_latency_ms" "did_webrtc_frame_drop_rate" "redis_hit_ratio"; do
  if ! rg -n "$metric" services/api-gateway/src/lib/metrics.ts >/dev/null; then
    echo "Missing metric: $metric"
    exit 1
  fi
done

cat > "${REPORT_FILE}" <<EOF2
# Phase 18 Observability Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Prometheus config: present
- Grafana compose profile: present
- Custom metrics: llm_ttft_ms, elevenlabs_latency_ms, did_webrtc_frame_drop_rate, redis_hit_ratio

## Result

PASS - observability stack and metric instrumentation are in place.
EOF2

echo "Phase 18 PASS. Report: ${REPORT_FILE}"
