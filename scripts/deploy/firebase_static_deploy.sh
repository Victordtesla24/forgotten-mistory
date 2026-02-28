#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

PROJECT_ID="${1:-forgotten-mistory}"

echo "Building static export for project: ${PROJECT_ID}"
FIREBASE_STATIC_EXPORT=1 npm run build

echo "Deploying static export to Firebase Hosting site for project: ${PROJECT_ID}"
firebase deploy --project "${PROJECT_ID}" --only hosting --config firebase.static.json

echo "Firebase static deploy complete for ${PROJECT_ID}"
