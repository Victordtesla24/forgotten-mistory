# Incident Response SOP

## Severity Levels
- SEV-1: Full outage (frontend/API down)
- SEV-2: Realtime pipeline degraded (p95 > 1200ms or high session failures)
- SEV-3: Partial feature impairment (audio/avatar provider intermittency)

## Triage Checklist
1. Confirm scope and start time.
2. Capture current deploy tag and active color:
   - `cat /opt/forgotten-mistory/.deploy-state/current_color`
   - `cat /opt/forgotten-mistory/.deploy-state/last_successful_image_tag`
3. Capture logs and metrics snapshots:
   - `docker logs --tail 300 api-gateway > /tmp/api-gateway.log`
   - `docker logs --tail 300 realtime-orchestrator > /tmp/realtime-orchestrator.log`

## Mitigation Playbook
1. Provider/API issue: switch to fallback provider (`mock` or `local`) and restart `realtime-orchestrator`.
2. Orchestrator issue: restart `realtime-orchestrator` and validate gRPC connectivity from gateway.
3. Deployment regression: execute rollback SOP immediately.

## Recovery Criteria
- Health checks pass for 10 consecutive minutes.
- Realtime session success rate returns above 99%.
- `firstTokenToAvatarMs` p95 returns below 1200ms.

## Post-Incident
1. Create timeline and root-cause summary.
2. Add concrete prevention action to CI/deploy gates.
3. Update runbook and validation scripts with learned checks.
