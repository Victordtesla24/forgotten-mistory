#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
./scripts/deploy/blue_green_deploy.sh "${IMAGE_TAG}"
