#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase16"
REPORT_FILE="${REPORT_DIR}/phase16-cicd-workflow-report.md"
mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

if ! test -f .github/workflows/deploy.yml; then
  echo "deploy workflow missing"
  exit 1
fi

for token in "lint" "test" "build" "deploy" "appleboy/ssh-action" "forgotten-mistory-realtime-orchestrator" "./scripts/deploy/blue_green_deploy.sh"; do
  if ! rg -n "$token" .github/workflows/deploy.yml >/dev/null; then
    echo "Workflow token missing: $token"
    exit 1
  fi
done

cat > "${REPORT_FILE}" <<EOF2
# Phase 16 CI/CD Workflow Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Workflow file: .github/workflows/deploy.yml
- Required jobs: lint, test, build, deploy

## Result

PASS - CI/CD workflow includes required pipeline stages and SSH deploy.
EOF2

echo "Phase 16 PASS. Report: ${REPORT_FILE}"
