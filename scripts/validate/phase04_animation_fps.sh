#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase04"
REPORT_FILE="${REPORT_DIR}/phase04-animation-report.md"
FPS_JSON="${REPORT_DIR}/fps-metrics.json"

mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

npm run build >/tmp/phase04-build.log 2>&1
npm run start >/tmp/phase04-start.log 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in {1..45}; do
  if curl -fsS "http://127.0.0.1:3000" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

node scripts/validate/phase04_fps_probe.mjs >/tmp/phase04-fps.log
FPS_VALUE="$(jq '.fps' "${FPS_JSON}")"
WILL_CHANGE_NON_TRANSFORM="$(rg -n 'will-change:\\s*(?!transform)' app/globals.css -P || true)"

if [[ -n "${WILL_CHANGE_NON_TRANSFORM}" ]]; then
  echo "Phase 04 failed: non-transform will-change usage detected."
  echo "${WILL_CHANGE_NON_TRANSFORM}"
  exit 1
fi

awk "BEGIN {exit !(${FPS_VALUE} >= 60)}"

cat > "${REPORT_FILE}" <<EOF
# Phase 04 Animation Fluency Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Framer Motion: enabled (MotionConfig reducedMotion=\"user\")
- Page Transition: AnimatePresence + motion.main
- FPS (5s probe): ${FPS_VALUE}
- will-change policy: transform-only

## Result

PASS - animation fluency threshold met and GPU promotion policy constrained to transform.
EOF

echo "Phase 04 PASS. Report: ${REPORT_FILE}"
