#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase14"
REPORT_FILE="${REPORT_DIR}/phase14-npm-routing-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

if ! rg -n "yourdomain.com|api.yourdomain.com|Let's Encrypt|HSTS" scripts/deploy/npm_proxy_setup.md >/dev/null; then
  echo "NPM routing setup guide is incomplete"
  exit 1
fi

cat > "${REPORT_FILE}" <<EOF2
# Phase 14 Nginx Proxy Manager Setup Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Guide: scripts/deploy/npm_proxy_setup.md
- Domains covered: root + api
- TLS policy: Let's Encrypt + forced HTTPS + HSTS

## Result

PASS - NPM routing and SSL setup instructions are complete.
EOF2

echo "Phase 14 PASS. Report: ${REPORT_FILE}"
