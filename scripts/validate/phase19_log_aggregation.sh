#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase19"
REPORT_FILE="${REPORT_DIR}/phase19-log-aggregation-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

for file in config/loki/loki-config.yml config/promtail/promtail-config.yml; do
  test -f "$file" || { echo "Missing $file"; exit 1; }
done

if ! rg -n "retention_period: 720h" config/loki/loki-config.yml >/dev/null; then
  echo "Loki 30-day retention not found"
  exit 1
fi

if ! rg -n "__path__: /var/lib/docker/containers" config/promtail/promtail-config.yml >/dev/null; then
  echo "Promtail docker path not configured"
  exit 1
fi

cat > "${REPORT_FILE}" <<EOF2
# Phase 19 Log Aggregation Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Loki config: present with 30-day retention
- Promtail config: present with docker container log scraping

## Result

PASS - centralized logging configs are complete.
EOF2

echo "Phase 19 PASS. Report: ${REPORT_FILE}"
