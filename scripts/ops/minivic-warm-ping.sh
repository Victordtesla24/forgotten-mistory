#!/usr/bin/env bash
# minivic-warm-ping.sh — keep the MiniVic brain hot on BOTH routes.
#
# Why this exists (G-M4, docs/architecture/MINIVIC-BRAIN-0-4.md §4.3):
# `minInstances: 1` keeps a container running, but the per-instance provider
# cooldown map only survives CREDENTIAL_COOLDOWN_MS (10 min). A visitor whose
# send lands after the map lapsed pays the serial dead-rung walk — measured at
# ~1.67 s — on top of the answering rung's own time, which alone takes
# 865–1278 ms of the 1500 ms first-token budget. The independent review of
# build 83590944 measured 1900 ms / 1793 ms cold precisely in that regime and
# noted its own numbers were the *primed* (favourable) case.
#
# Firing every 2 minutes against both routes keeps the map primed and the TLS
# path exercised at the edge, so the primed case is the only case a visitor
# ever gets. It spends no provider credit beyond the function's own guarded
# 1-token prime probe (functions/index.js primeProviderCooldowns).
#
# Both URLs are pinged because they are different code paths: the Cloud Run
# origin the page's CSP names, and the Firebase Hosting rewrite the fallback
# route uses. A ping that only warmed one left the other cold.
set -uo pipefail

ORIGIN_URL="${MINIVIC_ORIGIN_URL:-https://minivicchat-hjdyjsrzvq-uc.a.run.app/?warm=1}"
HOSTING_URL="${MINIVIC_HOSTING_URL:-https://forgotten-mistory.web.app/api/chat?warm=1}"
LOG="${MINIVIC_WARM_LOG:-/var/log/fm-minivic-warm.log}"

ping_one() {
  local name="$1" url="$2"
  # -sS: quiet but keep errors. --max-time 10: a warm ping must never hang the
  # timer into the next fire. The 204 body is empty by contract.
  local out
  out="$(curl -sS -o /dev/null --max-time 10 \
    -w '%{http_code} %{time_namelookup} %{time_connect} %{time_appconnect} %{time_total}' \
    "$url" 2>&1)" || out="000 curl-failed"
  printf '%s %s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$name" "$out"
}

{
  ping_one origin  "$ORIGIN_URL"
  ping_one hosting "$HOSTING_URL"
} | tee -a "$LOG"
