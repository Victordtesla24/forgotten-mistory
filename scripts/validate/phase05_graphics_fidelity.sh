#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/reports/phase05"
REPORT_FILE="${REPORT_DIR}/phase05-graphics-report.md"
METRICS_JSON="${REPORT_DIR}/asset-metrics.json"

mkdir -p "${REPORT_DIR}"
cd "${ROOT_DIR}"

npm run -s assets:hero >/tmp/phase05-assets.log
node - <<'NODE' > "${METRICS_JSON}"
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

(async () => {
  const root = process.cwd();
  const assets = path.join(root, "public", "assets");
  const png = await sharp(path.join(assets, "my_avatar.png")).metadata();
  const webp = await sharp(path.join(assets, "my_avatar.webp")).metadata();
  const avif = await sharp(path.join(assets, "my_avatar.avif")).metadata();

  const pageSource = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");
  const sceneSource = fs.readFileSync(path.join(root, "app", "components", "SpaceScene.tsx"), "utf8");
  const hasPicture = pageSource.includes('type="image/avif"') && pageSource.includes('type="image/webp"');
  const hasDprOne = sceneSource.includes("dpr={1}");

  const sameResolution = png.width === webp.width && png.width === avif.width && png.height === webp.height && png.height === avif.height;
  const payload = {
    png: { width: png.width, height: png.height },
    webp: { width: webp.width, height: webp.height },
    avif: { width: avif.width, height: avif.height },
    hasPicture,
    hasDprOne,
    sameResolution
  };
  process.stdout.write(JSON.stringify(payload, null, 2));
})();
NODE

jq -e '.hasPicture and .hasDprOne and .sameResolution' "${METRICS_JSON}" >/dev/null

cat > "${REPORT_FILE}" <<EOF
# Phase 05 Graphical Fidelity Validation

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Hero image formats: AVIF + WebP + PNG fallback in <picture>
- PNG Resolution: $(jq -r '(.png.width|tostring) + "x" + (.png.height|tostring)' "${METRICS_JSON}")
- WebP Resolution: $(jq -r '(.webp.width|tostring) + "x" + (.webp.height|tostring)' "${METRICS_JSON}")
- AVIF Resolution: $(jq -r '(.avif.width|tostring) + "x" + (.avif.height|tostring)' "${METRICS_JSON}")
- WebGL DPR policy: dpr={1}

## Result

PASS - hero media served with modern formats and WebGL canvas pinned to native DPR.
EOF

echo "Phase 05 PASS. Report: ${REPORT_FILE}"
