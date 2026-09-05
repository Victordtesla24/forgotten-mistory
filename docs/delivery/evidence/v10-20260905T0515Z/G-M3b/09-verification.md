# G-M3b — first visible token, measured in a browser on live

**Verdict: R3's latency clause is MET. Enter → first visible token P50 683 ms at
1440 and 711 ms at 390, n=5 warm each, against the < 1500 ms bar.** Measured in
Chromium against <https://forgotten-mistory.web.app> serving build-commit
`8978c2c4` — this lane's own commit.

## The numbers, all of them

| viewport | cold (first send) | warm P50 | warm P95 | warm trials (ms) | route |
|---|---|---|---|---|---|
| 1440 × 900 | 774 ms | **683 ms** | 799 ms | 799, 683, 761, 668, 672 | origin, HTTP 200, every trial |
| 390 × 844 | 980 ms | **711 ms** | 1285 ms | 711, 1285, 757, 629, 670 | origin, HTTP 200, every trial |

- Raw: `07-prod-verification/03-live-ttft-routes.json` (the binding run).
- Harness: `scripts/testing/minivic_live_ttft.mjs` — one send per fresh page; both
  timestamps taken inside the page (`performance.now()` in a capture-phase keydown
  listener, and in a `MutationObserver` that fires on the first non-empty character
  of the new bot bubble), so no CDP round trip is counted as latency.
- 0 CSP violations, 0 page errors, in all 12 page loads.
- Live CSP carries the origin: `07-prod-verification/04-live-csp.log`.

For scale, G-M3 measured the same site at the wire before this change: first byte
P50 **1836 ms** through the Hosting rewrite, P95 2940 ms. The visitor now sees the
first word at 683 ms.

### Two honest notes on the measurement

1. **An earlier run of this harness reported `routes: "none"` for every trial**
   (`07-prod-verification/02-live-ttft-after.json`). That was the harness, not the
   site: it attributed routes on `requestfinished`, and an SSE request does not
   finish until its last frame — long after the clock has stopped and the page has
   closed. Attribution now happens at request time and at response headers. The
   timings in that earlier file are consistent with the binding run; only its route
   column was wrong. It is kept rather than deleted, because a discarded
   contradictory measurement is how a false PASS gets written.
2. **The 3362 ms outlier in that same earlier file** is the same artefact — the
   context was torn down mid-request, so both rungs recorded `FAILED`. It does not
   appear in the corrected run.

## What is now on the wire

A send goes to `https://minivicchat-hjdyjsrzvq-uc.a.run.app/` and reads the SSE
frames as the model writes them. `/api/chat` — the same function through the
Hosting rewrite — sits behind it and answers whenever the direct rung fails:
network, CORS, a 5xx, or no response headers inside 1500 ms. On live it never had
to: 12 of 12 sends were answered by the origin with HTTP 200.

**The fallback is proven, not asserted:**

- `tests/e2e/minivic-send-path.spec.ts` **MV-ORIGIN-01** aborts every request to
  the origin at the network layer, then requires the wire to read
  `origin,hosting` and a real reply to render. 6/6 pass —
  `05-e2e-send-path.log`.
- `tests/minivic_chat_route.test.mjs` **MV-ROUTE-04** proves the hand-over,
  **MV-ROUTE-06** proves that when *every* rung fails the caller is told rather
  than handed an invented answer (the deterministic knowledge tier then answers).
  9/9 pass — `04-node-tests-passing.log`; RED first in `02-tests-failing.log`.

## One config point

`config/minivic-origin.json` holds the deploy-specific run.app URL — public, no
credential. `scripts/build/minivic_origin.mjs` turns it into
`app/data/generated/minivic-origin.ts` at build time (`NEXT_PUBLIC_MINIVIC_ORIGIN`
overrides it for a build against another deployment), and **MV-ROUTE-08** fails if
that config, the generated module and `firebase.json`'s `connect-src` ever stop
naming the same origin. **MV-ROUTE-09** fails if the hostname is written anywhere
in `app/`, `components/` or `lib/` outside the generated module. Setting
`originUrl` to `""` ships the Hosting rewrite alone, and MV-ROUTE-02 covers that.

## The function change, and why

`applyCors` now sets `Access-Control-Max-Age: 3600`. A direct POST carrying
`Content-Type: application/json` is preflighted; with no max-age the browser
caches that preflight for about five seconds, so nearly every send in a
conversation paid a second round trip to us-central1 before the question left.
Deployed with `firebase deploy --only functions:tts:minivicChat` and verified:

```
$ curl -sI -X OPTIONS https://minivicchat-hjdyjsrzvq-uc.a.run.app/ \
    -H 'Origin: https://forgotten-mistory.web.app' -H 'Access-Control-Request-Method: POST'
HTTP/2 204
access-control-allow-origin: https://forgotten-mistory.web.app
access-control-max-age: 3600
```

## Gates

| gate | result | proving command |
|---|---|---|
| node:test route policy | 9/9 (RED first) | `node --test tests/minivic_chat_route.test.mjs` |
| node contract suite | 72/72 | `node --test tests/minivic_chat_route.test.mjs tests/minivic_send_path.test.mjs tests/minivic_chat_function.test.mjs tests/ci_pipeline.test.mjs` |
| e2e send path | 6/6 | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5619 npx playwright test tests/e2e/minivic-send-path.spec.ts --workers=1` |
| tsc | clean | `npx tsc --noEmit` |
| lint | clean | `npm run lint` |
| static audit | 10/10 | `node scripts/validate/overhaul_static_audit.mjs` |
| live CSP | carries the origin | `curl -sI https://forgotten-mistory.web.app/ \| grep -o 'connect-src[^;]*'` |
| **live browser TTFT** | **P50 683 ms (1440) / 711 ms (390) — PASS** | `node scripts/testing/minivic_live_ttft.mjs --trials 5` |

## What this does not claim

R3 has clauses beyond latency; this lane measured the latency clause only, and only
from this VPS's network position (us-central1 is close to it). A visitor in
Australia will pay their own round trip on top of the ~680 ms measured here — the
function's own first token is 639 ms, so the floor is the model, not the transport,
and the buffered 1.2 s that used to sit above it is gone for everyone.
