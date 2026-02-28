#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

BASE_URL="${1:-https://forgotten-mistory.web.app}"
LIGHTHOUSE_OUT="reports/post-prod/lighthouse-production.json"

mkdir -p reports/post-prod/evidence

echo "Running rendering stability validation against ${BASE_URL}"
node scripts/testing/rendering_stability_validation.mjs "${BASE_URL}"

echo "Running Lighthouse against ${BASE_URL}"
npx --yes lighthouse "${BASE_URL}?cb=lighthouse-$(date +%s)" \
  --quiet \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json \
  --output-path="${LIGHTHOUSE_OUT}"

echo "Generating post-production summary"
node scripts/testing/generate_post_prod_summary.mjs

echo "Post-production validation complete."
