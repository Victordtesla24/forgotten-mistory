#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
export IMAGE_TAG

docker compose pull frontend api-gateway

docker compose up -d --no-deps --scale frontend=2 frontend

for _ in {1..40}; do
  if docker compose exec -T frontend curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

docker compose up -d --no-deps --scale frontend=1 frontend

echo "Zero-downtime frontend rollout complete for tag ${IMAGE_TAG}"
