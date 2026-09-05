#!/usr/bin/env bash
# O1 fallback: GitHub Actions schedule is unreliable; dispatch Deploy every 10m from VPS.
set -euo pipefail
LOG=/var/log/fm-deploy/cadence.log
REPO=Victordtesla24/forgotten-mistory
mkdir -p "$(dirname "$LOG")"
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
{
  echo "[$(ts)] cadence tick"
  running="$(gh run list -R "$REPO" --workflow=deploy.yml --status=in_progress --limit 3 --json databaseId --jq 'length' 2>/dev/null || echo 0)"
  if [ "${running:-0}" -gt 0 ]; then
    echo "[$(ts)] skip: $running Deploy run(s) already in_progress"
    exit 0
  fi
  # Also skip if a successful Deploy finished within the last 8 minutes (push already satisfied O1)
  recent="$(gh run list -R "$REPO" --workflow=deploy.yml --limit 5 --json createdAt,conclusion,event \
    --jq '[.[] | select(.conclusion=="success") | select((now - (.createdAt|fromdateiso8601)) < 480)] | length' 2>/dev/null || echo 0)"
  if [ "${recent:-0}" -gt 0 ]; then
    echo "[$(ts)] skip: successful Deploy within last 8m (push already covered cadence)"
    live="$(curl -fsS --max-time 15 https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"' | head -1 || true)"
    echo "[$(ts)] live $live"
    exit 0
  fi
  if gh workflow run deploy.yml -R "$REPO" --ref main; then
    echo "[$(ts)] workflow_dispatch ok"
    exit 0
  fi
  echo "[$(ts)] workflow_dispatch FAILED" >&2
  exit 1
} >>"$LOG" 2>&1
