#!/usr/bin/env bash
# shellcheck shell=bash
#
# Shared readiness guard for the phase validators that start the local
# api-gateway and then probe it.
#
# WHY THIS EXISTS
# ---------------
# Every one of those validators used to do this:
#
#     PORT=8000 npm run start &
#     for _ in {1..45}; do
#       if curl -fsS "http://127.0.0.1:8000/health" >/dev/null 2>&1; then break; fi
#       sleep 1
#     done
#
# On this host :8000 is already held by an unrelated, guardian-owned production
# API whose /health answers `{"status":"ok","version":"0.2.0"}`. So the gateway
# failed to bind, died, and the loop broke out on the FIRST iteration against a
# foreign service. Every assertion afterwards ran against the wrong server, 404'd
# or read someone else's data, and the phase reported a pass it had not earned.
#
# A gate that cannot fail is decoration, and a gate that passes by talking to the
# wrong service is worse than no gate at all — it manufactures a false positive.
#
# WHAT THIS FIXES
# ---------------
#  1. The port moves off 8000 by default. `PHASE_GATEWAY_PORT` overrides it; the
#     default sits in the free API band on this host and never collides with the
#     production service.
#  2. Readiness asserts the *identity* of what answered, not merely that
#     something did. Our gateway's /health carries `provider` and
#     `realtimeOrchestrator`; the production API's carries neither. A response
#     without them is a stranger, and the guard refuses loudly.
#  3. Liveness is checked against the gateway's own PID. If the process died —
#     which is exactly what a port collision causes — the guard says so and names
#     the log, instead of waiting 45 seconds and then testing a stranger.

# Default chosen from the free in-convention API band on this host (8001-8079).
# 8000 is the production API and is never ours to bind.
: "${PHASE_GATEWAY_PORT:=8010}"
PHASE_GATEWAY_BASE="http://127.0.0.1:${PHASE_GATEWAY_PORT}"
export PHASE_GATEWAY_PORT PHASE_GATEWAY_BASE

# await_gateway <pid> <log-path> [timeout-seconds]
#
# Blocks until OUR gateway answers on PHASE_GATEWAY_PORT, or fails the script.
await_gateway() {
  local pid="$1" log="$2" timeout="${3:-45}" body=""

  # Refuse before starting if a stranger already holds the port. Better to fail
  # here, naming the conflict, than to test something else's server.
  if body="$(curl -fsS --max-time 2 "${PHASE_GATEWAY_BASE}/health" 2>/dev/null)"; then
    if ! printf '%s' "${body}" | grep -q '"provider"'; then
      echo "FATAL: port ${PHASE_GATEWAY_PORT} is already held by a service that is not this gateway." >&2
      echo "       Its /health returned: ${body}" >&2
      echo "       Refusing to run: assertions against a foreign service are a false positive." >&2
      return 1
    fi
  fi

  local waited=0
  while [ "${waited}" -lt "${timeout}" ]; do
    if ! kill -0 "${pid}" >/dev/null 2>&1; then
      echo "FATAL: the api-gateway process exited before becoming ready." >&2
      echo "       This is what a port collision looks like. Its log:" >&2
      tail -n 30 "${log}" >&2 || true
      return 1
    fi

    if body="$(curl -fsS --max-time 2 "${PHASE_GATEWAY_BASE}/health" 2>/dev/null)"; then
      # Identity, not liveness. Both keys are ours; neither is on the
      # production API that used to satisfy this loop by accident.
      if printf '%s' "${body}" | grep -q '"provider"' &&
        printf '%s' "${body}" | grep -q '"realtimeOrchestrator"'; then
        echo "gateway ready on ${PHASE_GATEWAY_BASE} (identity confirmed)"
        return 0
      fi
      echo "FATAL: something answered ${PHASE_GATEWAY_BASE}/health, but it is not this gateway." >&2
      echo "       Response: ${body}" >&2
      return 1
    fi

    sleep 1
    waited=$((waited + 1))
  done

  echo "FATAL: the api-gateway did not become ready on ${PHASE_GATEWAY_BASE} within ${timeout}s." >&2
  tail -n 30 "${log}" >&2 || true
  return 1
}
