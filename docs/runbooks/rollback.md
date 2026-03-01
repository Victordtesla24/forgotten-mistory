# Rollback SOP

## Preconditions
- Last known-good image tag exists in `/opt/forgotten-mistory/.deploy-state/last_successful_image_tag`
- SSH access to Hostinger VPS is available

## Rollback Steps
1. Read previous image tag:
   - `cat /opt/forgotten-mistory/.deploy-state/last_successful_image_tag`
2. Execute rollback:
   - `./scripts/deploy/rollback.sh <last_good_tag>`
3. Verify health:
   - `./scripts/deploy/post_deploy_verify.sh`
4. Confirm realtime path:
   - Create a session with `POST /api/realtime/session`
   - Open websocket `/ws/realtime/:sessionId`
   - Validate `session.done` event delivery

## Rollback Validation Gate
- Frontend and API health endpoints return 200
- No sustained 5xx in gateway logs over 5 minutes
- Realtime session completes and returns non-empty text

## Escalation
- If rollback fails, pin `LLM_PROVIDER=mock` to restore service continuity while investigating provider or model issues.
