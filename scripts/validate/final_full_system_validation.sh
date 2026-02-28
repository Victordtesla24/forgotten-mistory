#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

for phase in $(seq 1 20); do
  script_name="$(printf 'validate:phase%02d' "${phase}")"
  if npm run -s "${script_name}" >/dev/null 2>&1; then
    :
  else
    echo "Final validation failed: ${script_name} did not pass."
    exit 1
  fi
done

LIGHTHOUSE_SCORE="$(grep -E 'Performance Score:' reports/phase02/phase02-lighthouse-report.md | awk -F': ' '{print $2}')"
CLS_VALUE="$(grep -E 'CLS:' reports/phase02/phase02-lighthouse-report.md | awk -F': ' '{print $2}')"
AXE_CRITICAL="$(grep -E 'Axe Critical Violations:' reports/phase06/phase06-accessibility-seo-report.md | awk -F': ' '{print $2}')"
TTFT_MS="$(grep -E 'TTFT:' reports/phase07/phase07-llm-ttft-report.md | awk -F': ' '{print $2}' | awk '{print $1}')"
ELEVENLABS_TTFB_MS="$(grep -E 'Audio start latency \(TTFB\):' reports/phase08/phase08-elevenlabs-latency-report.md | awk -F': ' '{print $2}' | awk '{print $1}')"
DID_LATENCY_MS="$(grep -E 'Reported input-to-lip latency:' reports/phase09/phase09-avatar-sync-report.md | awk -F': ' '{print $2}' | awk '{print $1}')"

awk "BEGIN {exit !(${LIGHTHOUSE_SCORE} >= 0.90)}"
awk "BEGIN {exit !(${CLS_VALUE} <= 0.1)}"
awk "BEGIN {exit !(${AXE_CRITICAL} == 0)}"
awk "BEGIN {exit !(${TTFT_MS} < 800)}"
awk "BEGIN {exit !(${ELEVENLABS_TTFB_MS} <= 600)}"
awk "BEGIN {exit !(${DID_LATENCY_MS} < 200)}"

cat > reports/final-full-system-validation.md <<EOF
# Final Full-System Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Lighthouse Performance: ${LIGHTHOUSE_SCORE}
- CLS: ${CLS_VALUE}
- Axe Critical Violations: ${AXE_CRITICAL}
- LLM TTFT: ${TTFT_MS} ms
- ElevenLabs TTFB: ${ELEVENLABS_TTFB_MS} ms
- D-ID Lip-sync Latency: ${DID_LATENCY_MS} ms

## Result

PASS - all phase gates and integrated stack metrics satisfied.
EOF

echo "Final full-system validation PASS. Report: reports/final-full-system-validation.md"
