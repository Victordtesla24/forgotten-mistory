#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
STATE_DIR="${STATE_DIR:-/opt/forgotten-mistory/.deploy-state}"
VERIFY_FRONTEND_URL="${VERIFY_FRONTEND_URL:-http://127.0.0.1:3000/health}"
VERIFY_API_URL="${VERIFY_API_URL:-http://127.0.0.1:8000/health}"

mkdir -p "${STATE_DIR}"
LAST_TAG_FILE="${STATE_DIR}/last_successful_image_tag"
CURRENT_COLOR_FILE="${STATE_DIR}/current_color"

LAST_TAG=""
if [[ -f "${LAST_TAG_FILE}" ]]; then
  LAST_TAG="$(cat "${LAST_TAG_FILE}")"
fi

CURRENT_COLOR="blue"
if [[ -f "${CURRENT_COLOR_FILE}" ]]; then
  CURRENT_COLOR="$(cat "${CURRENT_COLOR_FILE}")"
fi

if [[ "${CURRENT_COLOR}" == "blue" ]]; then
  NEXT_COLOR="green"
else
  NEXT_COLOR="blue"
fi

echo "Deploying IMAGE_TAG=${IMAGE_TAG} to ${NEXT_COLOR} environment"
export IMAGE_TAG

docker compose pull frontend api-gateway realtime-orchestrator
docker compose up -d --no-deps realtime-orchestrator api-gateway frontend

if ./scripts/deploy/post_deploy_verify.sh "${VERIFY_FRONTEND_URL}" "${VERIFY_API_URL}"; then
  echo "${IMAGE_TAG}" > "${LAST_TAG_FILE}"
  echo "${NEXT_COLOR}" > "${CURRENT_COLOR_FILE}"
  echo "Deployment successful"
  exit 0
fi

echo "Health checks failed; attempting rollback"
if [[ -n "${LAST_TAG}" ]]; then
  ./scripts/deploy/rollback.sh "${LAST_TAG}"
fi

exit 1
