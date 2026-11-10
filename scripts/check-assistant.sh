#!/usr/bin/env bash
# Asks the assistant one real question on each route a visitor's browser tries and fails
# unless both answer with text: a 2xx and a non-empty reply, not just a warm 204.
#
# The assistant is a Cloud Function that a site deploy never touches, so it can be down
# while the build, the tests and the deploy are all green; a provider that is out of
# credit answers every question with a 502 and the page quietly falls back to canned text.
# scripts/ship.sh runs this after every release. It is safe to run on its own:
#
#   bash scripts/check-assistant.sh [site-url]
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

site="${1:-https://forgotten-mistory.web.app/}"
site="${site%/}/"
question='Where is Vikram based?'

# The same constant the page sends from, so the check cannot drift from the browser.
origin="$(sed -n "s/.*MINIVIC_CHAT_ORIGIN = '\([^']*\)'.*/\1/p" lib/assistant/origin.ts)"
if [ -z "$origin" ]; then
  echo "[assistant] FAIL: lib/assistant/origin.ts does not name the chat origin" >&2
  exit 1
fi

# The routes in the order the browser tries them (lib/assistant/route.ts).
routes=("${origin%/}/" "${site}api/chat?route=hosting")

body="$(mktemp)"
trap 'rm -f "$body"' EXIT

payload="{\"messages\":[{\"role\":\"user\",\"content\":\"$question\"}],\"mode\":\"hiring\"}"
failed=0
for url in "${routes[@]}"; do
  status="$(curl -sS --max-time 40 -o "$body" -w '%{http_code}' -X POST \
    -H 'content-type: application/json' -H "Origin: ${site%/}" \
    --data "$payload" "$url" || true)"
  if [[ "$status" == 2* ]] && grep -q '"text":"[^"]' "$body"; then
    echo "[assistant] ok   $status $url"
  else
    echo "[assistant] FAIL ${status:-000} $url :: $(head -c 200 "$body" | tr -d '\n')" >&2
    failed=1
  fi
done

exit "$failed"
