#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports"
REPORT_FILE="${REPORT_DIR}/phase01-stack-audit.md"
TMP_HTML="$(mktemp)"

mkdir -p "${REPORT_DIR}"

cd "${ROOT_DIR}"

FRAMEWORK_VERSION="$(jq -r '.dependencies.next' package.json)"
TAILWIND_VERSION="$(jq -r '.devDependencies.tailwindcss' package.json)"
GSAP_VERSION="$(jq -r '.dependencies.gsap' package.json)"
REACT_VERSION="$(jq -r '.dependencies.react' package.json)"
BUNDLER="Next.js (webpack/turbopack configurable)"

curl -fsSL "https://forgotten-mistory.web.app" -o "${TMP_HTML}"

RENDERER_HINT="unknown"
if grep -q "__NEXT_DATA__" "${TMP_HTML}"; then
  RENDERER_HINT="nextjs"
fi

if [[ "${FRAMEWORK_VERSION}" =~ [\^\~] ]]; then
  echo "Phase 01 failed: next version is not pinned (${FRAMEWORK_VERSION})."
  exit 1
fi
if [[ "${TAILWIND_VERSION}" =~ [\^\~] ]]; then
  echo "Phase 01 failed: tailwindcss version is not pinned (${TAILWIND_VERSION})."
  exit 1
fi
if [[ "${GSAP_VERSION}" =~ [\^\~] ]]; then
  echo "Phase 01 failed: gsap version is not pinned (${GSAP_VERSION})."
  exit 1
fi

cat > "${REPORT_FILE}" <<EOF
# Phase 01 Stack Audit

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Production URL: https://forgotten-mistory.web.app
- Renderer Hint: ${RENDERER_HINT}
- Framework: Next.js ${FRAMEWORK_VERSION}
- React: ${REACT_VERSION}
- Tailwind CSS: ${TAILWIND_VERSION}
- GSAP: ${GSAP_VERSION}
- Bundler: ${BUNDLER}
- Firebase Config: $(jq -c '.hosting' firebase.json)

## Result

PASS - pinned framework/build/animation versions detected and production renderer hint gathered.
EOF

rm -f "${TMP_HTML}"
echo "Phase 01 PASS. Report: ${REPORT_FILE}"
