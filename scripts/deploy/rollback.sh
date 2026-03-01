#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <image_tag>"
  exit 1
fi

IMAGE_TAG="$1"
export IMAGE_TAG

docker compose pull frontend api-gateway realtime-orchestrator
docker compose up -d --no-deps realtime-orchestrator api-gateway frontend

echo "Rollback complete to IMAGE_TAG=${IMAGE_TAG}"
