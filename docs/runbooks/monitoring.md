# Monitoring SOP

## Core SLOs
- Frontend `/health` availability >= 99.9%
- API gateway `/health` availability >= 99.9%
- Realtime pipeline `firstTokenToAvatarMs` p95 < 1200ms
- Realtime pipeline session error rate < 1%

## Required Checks
1. Confirm containers are healthy:
   - `docker compose ps`
2. Check gateway metrics:
   - `curl -fsS http://127.0.0.1:8000/metrics | rg "llm_ttft_ms|elevenlabs_latency_ms|avatar_lipsync_latency_ms"`
3. Sample realtime session metrics:
   - `curl -fsS http://127.0.0.1:8000/api/realtime/session/<session_id>/metrics`
4. Verify log ingestion:
   - `docker logs --tail 100 api-gateway`
   - `docker logs --tail 100 realtime-orchestrator`

## Alert Triggers
- `firstTokenToAvatarMs` p95 >= 1200ms for 10 minutes
- Session creation 5xx >= 2% for 5 minutes
- ElevenLabs TTFB >= 1200ms for 10 minutes
- D-ID stream creation failures >= 2% for 10 minutes

## Immediate Response
1. Identify failing component (`api-gateway`, `realtime-orchestrator`, `llm-engine`, provider APIs).
2. Drain client traffic from unstable API instance if available.
3. Restart only the failing service first:
   - `docker compose up -d --no-deps <service>`
4. If SLO does not recover in 5 minutes, execute rollback SOP.
