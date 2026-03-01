#!/usr/bin/env bash
set -euo pipefail

FRONTEND_URL="${1:-http://127.0.0.1:3000/health}"
API_URL="${2:-http://127.0.0.1:8000/health}"

for _ in {1..30}; do
  if curl -fsS "${FRONTEND_URL}" >/dev/null 2>&1 && curl -fsS "${API_URL}" >/dev/null 2>&1; then
    echo "Post-deploy verification passed."
    exit 0
  fi
  sleep 2
done

echo "Post-deploy verification failed."
exit 1
