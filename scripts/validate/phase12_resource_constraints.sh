#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase12"
REPORT_FILE="${REPORT_DIR}/phase12-resource-constraints-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

jq_check() {
  local pattern="$1"
  if ! rg -n "$pattern" docker-compose.yml >/dev/null; then
    echo "Missing required compose constraint: $pattern"
    exit 1
  fi
}

jq_check "llm-engine"
jq_check "cpus: \"6\""
jq_check "memory: 12G"
jq_check "api-gateway"
jq_check "memory: 512M"
jq_check "redis"
jq_check "memory: 256M"
jq_check "frontend"
jq_check "memory: 128M"

if docker info >/dev/null 2>&1; then
  STATS_OUT="$(docker stats --no-stream --format '{{.Name}} {{.MemUsage}} {{.CPUPerc}}' | head -n 20)"
else
  STATS_OUT="Docker daemon unavailable"
fi

cat > "${REPORT_FILE}" <<EOF2
# Phase 12 Resource Constraint Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Compose constraints: present
- docker stats sample: ${STATS_OUT}

## Result

PASS - resource limits are encoded for all required services.
EOF2

echo "Phase 12 PASS. Report: ${REPORT_FILE}"
