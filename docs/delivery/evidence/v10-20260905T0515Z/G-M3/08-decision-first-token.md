# G-M3 — first visible token on live: what was measured, and the one thing left

**Verdict: R3's < 1500 ms first-token bar is NOT met on the live site. Measured P50
1856 ms (n=5 warm, through Firebase Hosting).** The function now produces its first
token in **671 ms**; Firebase Hosting buffers it. That is the whole remaining gap,
and it is proven below rather than argued.

## What was measured

| path | first byte (P50) | total (P50) | n |
|---|---|---|---|
| baseline, before this lane (Hosting, JSON) | 2016 ms | 2016 ms | 5 |
| after this lane (Hosting, SSE) — warm | 1856 ms | 1856 ms | 5 |
| after this lane (Hosting, SSE) — incl. one cold | 1972 ms | 1972 ms | 6 |
| **after this lane, direct to the Cloud Run origin (SSE)** | **671 ms** | 1913 ms | 3 |
| warm ping `GET /api/chat?warm=1` | 169 ms | 169 ms | 3 |

Raw: `07-prod-verification/01-curl-after.log`, `07-prod-verification/02-hosting-buffers-sse.log`.

## Firebase Hosting buffers SSE — proven, not assumed

The task required this be verified against current docs and then proved by
measurement. The docs do not answer it: Firebase's serverless-overview page says
nothing about streaming, chunked encoding, SSE, or response buffering. So it was
settled by experiment — the *same function*, the *same request*, reached two ways:

```
A. direct to https://minivicchat-hjdyjsrzvq-uc.a.run.app
   starttransfer=0.763  total=1.913
   starttransfer=0.644  total=1.873
   starttransfer=0.671  total=1.931      <- first byte at ~35% of the reply

B. through https://forgotten-mistory.web.app/api/chat  (the Hosting rewrite)
   starttransfer=2.051  total=2.051
   starttransfer=1.798  total=1.798
   starttransfer=1.691  total=1.691      <- first byte == last byte
```

Both return `content-type: text/event-stream; charset=utf-8`; B carries
`x-served-by: cache-bos-…` (Fastly). The origin streams; the edge holds every
chunk until the response ends. `X-Accel-Buffering: no` is set and does not change it.

**No stream was faked.** The wire really is `data: {"delta":"At"}` … one frame per
token; it simply arrives all at once through Hosting.

## What landed, and what each is worth

1. **Warm-up on panel open** — `GET /api/chat?warm=1` → 204 in **169 ms**, no upstream
   call. Removes ~2.3 s of container start (4178 ms cold vs ~1900 ms warm) from the
   first send of a quiet period, paid while the visitor is still typing. Cost-neutral.
2. **Streaming, end to end** — the function asks the provider for `stream: true`, and
   relays each fragment. Worth **1.24 s** at the origin (671 ms vs 1913 ms), worth
   **nothing** through Hosting today. It is left in because it is correct, it is what
   fix (4) below turns on, and it costs nothing when buffered.
3. **Lean payload** — the client shipped a ~6 kB grounded system prompt with every send
   that the function discarded unread (its prompt is server-owned). Removed. `mode` is
   now sent, which it never was: every reply came back in the hiring persona whatever
   the visitor picked. No `provider`/`model` in the payload (asserted, MV-PAYLOAD-01).
4. **Ladder order that survives a cold start** — `CHAT_PROVIDER_ORDER` reorders rungs from
   the env. The per-instance cooldown map does nothing for a visitor landing on a cold
   instance; this does. Worth ~0.17 s (measured: the OpenRouter rung answers `402
   Insufficient credits` in 0.169 s). Left at its existing order until the new
   rung-timing log says which rung actually answers in production — see below.
5. **Rung timings in the log** — every request now logs `rungs: [{provider, outcome, ms}]`,
   the answering rung included. The ladder's cost stops being a guess.

## The one thing left, and its cost

**Call the Cloud Run origin directly from the browser.** It is the only change that
reaches the bar, and it is free:

- measured first token **671 ms** — comfortably inside 1500 ms
- CORS already allows `https://forgotten-mistory.web.app` (`applyCors`, functions/index.js)
- needs: `connect-src` in `firebase.json`'s CSP extended to the function origin, and the
  client preferring that URL with `/api/chat` as the fallback
- risk: the run.app hostname is deploy-specific, so it belongs in a build-time constant

**`minInstances` is not the fix and should not be bought.** It removes cold starts only —
the 2.3 s that the warm ping already hides for free — and does nothing about buffering, so
the warm P50 would stay at ~1856 ms and R3 would still fail. For the record, 1 always-on
256 MiB / 1 vCPU instance in us-central1 is roughly **US$9–12 per month** at current
Cloud Run idle-instance rates. Recommendation: **do not buy it.** Spend the change on
fix (4) instead, which is free and worth four times as much.

## Honest statement of the gate

R3 (perceived real-time, first word < ~1.5 s) is **NOT met on live**: P50 1856 ms,
P95 2187 ms, n=5 warm, measured at the wire through Hosting after this deploy.
It is met at the function origin (671 ms). Nothing in this lane should be read as a
PASS on R3.
