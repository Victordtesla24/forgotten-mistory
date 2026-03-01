#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

PROJECT_ID="${1:-forgotten-mistory}"
ENV_FILE="${2:-.env}"
DEPLOY_MODE="${3:-static}"

echo "Validating provider API keys before deploy..."
npm run -s validate:provider-keys -- "${ENV_FILE}"

if [[ "${DEPLOY_MODE}" == "static" ]]; then
  echo "Building static export for project: ${PROJECT_ID}"
  FIREBASE_STATIC_EXPORT=1 npm run build

  echo "Deploying static export to Firebase Hosting site for project: ${PROJECT_ID}"
  firebase deploy --project "${PROJECT_ID}" --only hosting --config firebase.static.json

  echo "Firebase static deploy complete for ${PROJECT_ID}"
  exit 0
fi

echo "Building framework-hosted app for project: ${PROJECT_ID}"
npm run build

echo "Deploying framework-hosted app to Firebase Hosting site for project: ${PROJECT_ID}"
firebase deploy --project "${PROJECT_ID}" --only hosting --config firebase.json

echo "Firebase framework deploy complete for ${PROJECT_ID}"
