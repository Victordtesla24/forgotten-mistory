#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase03"
REPORT_FILE="${REPORT_DIR}/phase03-design-token-audit.md"

mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

jq -e '.spacing and .typography and .colors and .metadata.grid == "8pt"' design-tokens.json >/dev/null

RAW_HEX_COUNT="$( (rg -n '#[0-9A-Fa-f]{3,8}' app components --glob '*.{ts,tsx,js,jsx}' || true) | wc -l | tr -d ' ' )"
if [[ "${RAW_HEX_COUNT}" != "0" ]]; then
  echo "Phase 03 failed: raw hex values found in component code (${RAW_HEX_COUNT})."
  rg -n '#[0-9A-Fa-f]{3,8}' app components --glob '*.{ts,tsx,js,jsx}' | sed -n '1,50p'
  exit 1
fi

npx eslint "app/**/*.{ts,tsx,js,jsx}" "components/**/*.{ts,tsx,js,jsx}" --max-warnings=0

cat > "${REPORT_FILE}" <<EOF
# Phase 03 Design Token Audit

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Token File: design-tokens.json
- Grid Standard: $(jq -r '.metadata.grid' design-tokens.json)
- Typography Base: $(jq -r '.typography.body.value.fontFamily' design-tokens.json)
- Raw Hex Findings in Component Code: ${RAW_HEX_COUNT}

## Result

PASS - Tailwind v4 + shadcn/Radix setup validated and component token policy enforced by ESLint + token audit.
EOF

echo "Phase 03 PASS. Report: ${REPORT_FILE}"
