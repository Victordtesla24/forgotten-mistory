# G-M3 — first visible token on live: what was measured, and the one thing left

**Verdict: R3's < 1500 ms first-token bar is NOT met on the live site. Measured P50
1836 ms / P95 2940 ms (n=5) at the wire through Firebase Hosting.** The function
itself now delivers its first token in **639 ms**; Firebase Hosting buffers it and
hands the visitor the whole answer at the end. That is the entire remaining gap, and
it is proven below rather than argued.

## What was measured

All figures from the VPS (srv1356245) against https://forgotten-mistory.web.app.

| path | first byte P50 | total P50 | n |
|---|---|---|---|
| baseline, before this lane (Hosting, JSON) | 2016 ms | 2016 ms | 5 |
| after this lane (Hosting, SSE) | **1836 ms** | 1836 ms | 5 |
| **after this lane, direct to the Cloud Run origin (SSE)** | **665 ms** | 1521 ms | 5 |
| the function's own `firstTokenMs`, from its log | 639 ms | — | 3 |
| warm ping `GET /api/chat?warm=1` | 192 ms | 192 ms | 3 |

Raw: `01-live-baseline.log`, `07-prod-verification/01-curl-after.log`,
`07-prod-verification/02-hosting-buffers-sse.log`,
`07-prod-verification/03-final-after-order-fix.log`.

## Firebase Hosting buffers SSE — proven, not assumed

The task required this be verified against current Firebase docs and then proved by
measurement. **The docs do not answer it**: the serverless-overview page says nothing
about streaming, chunked encoding, SSE, or response buffering. So it was settled by
experiment — the *same function*, the *same request*, reached two ways:

```
A. direct to https://minivicchat-hjdyjsrzvq-uc.a.run.app
   starttransfer=0.763  total=1.913
   starttransfer=0.644  total=1.873
   starttransfer=0.671  total=1.931      <- first byte at ~35% of the reply

B. through https://forgotten-mistory.web.app/api/chat  (the Hosting rewrite)
   starttransfer=2.051  total=2.051
   starttransfer=1.798  total=1.798
   starttransfer=1.691  total=1.691      <- first byte == last byte, every time
```

Both return `content-type: text/event-stream; charset=utf-8`; B carries
`x-served-by: cache-bos-…` (Fastly). The origin streams; the edge holds every chunk
until the response ends. `X-Accel-Buffering: no` is set and does not change it.

**No stream was faked.** The wire really is `data: {"delta":"At"}` … one frame per
token — it simply arrives all at once through Hosting.

## What landed, and what each is worth

1. **Warm-up on panel open** — `GET /api/chat?warm=1` → 204 in **192 ms**, no upstream
   call. Removes ~2.3 s of container start (4178 ms cold vs ~1900 ms warm) from the
   first send of a quiet period, paid while the visitor is still typing. Free.
2. **Ladder order that survives a cold start** — the function's own rung log showed the
   truth the hypothesis had guessed at:

   ```
   before: rungs:[openrouter cooling_down, deepseek cooling_down,
                  zai cooling_down, openai answered 1736ms]  firstTokenMs 493
   after:  rungs:[openai answered 1618ms]                     firstTokenMs 639
   ```

   Three of the four rungs are credential-dead. That cooldown map lives in one warm
   instance's memory, so a visitor landing on a **cold** instance paid all three
   failing round trips first — the OpenRouter 402 measured 0.169 s and the DeepSeek
   402 measured 1.174 s, i.e. well over a second of pure dead-rung tax on exactly the
   request that is already slowest. `DEFAULT_PROVIDER_ORDER` now puts the answering
   rung first; `CHAT_PROVIDER_ORDER` overrides it from the env; every rung stays in the
   ladder, so the site self-heals the moment an account is topped up. Free.
3. **Streaming, end to end** — worth **1.19 s at the origin** (665 ms to first byte vs
   1521 ms for the whole reply) and, today, **nothing through Hosting**. It is kept
   because it is correct, it costs nothing when buffered, and it is precisely what
   fix (4) turns on.
4. **Lean payload** — the client shipped a ~6 kB grounded system prompt on every send
   that the function discarded unread (its prompt is server-owned, so a visitor cannot
   replace it). Removed. `mode` is now sent, which it never was: every reply came back
   in the hiring persona whichever one the visitor had picked. No `provider`/`model` in
   the payload (asserted by MV-PAYLOAD-01).

The hypothesis this lane was handed was half right and worth correcting for the record:
the dead first rung is real, but it costs 0.169 s warm, not "0.5–1 s" — and the real
prize was the three dead rungs a *cold* instance walks, which no amount of cooldown
bookkeeping could ever have fixed.

## The one thing left, and its cost

**Call the Cloud Run origin directly from the browser.** It is the only change that
reaches the bar, and it is free:

- measured first byte **665 ms** (P50, n=5) — comfortably inside the 1500 ms bar
- CORS already allows `https://forgotten-mistory.web.app` (`applyCors`, functions/index.js)
- needs: `connect-src` in `firebase.json`'s CSP extended to the function origin, and the
  client preferring that URL with `/api/chat` kept as the fallback
- risk to handle: the `run.app` hostname is deploy-specific, so it belongs in a
  build-time constant with the Hosting rewrite as the graceful fallback

**`minInstances` is not the fix and should not be bought.** It removes cold starts only —
the ~2.3 s the warm ping already hides for free — and does nothing about buffering, so
the warm P50 would stay at ~1836 ms and R3 would still fail. For the record, one
always-on 256 MiB / 1 vCPU instance in us-central1 is roughly **US$9–12 per month** at
current Cloud Run idle-instance rates. Recommendation: **do not buy it.** Spend the
change on the direct-origin route instead, which is free and worth far more.

## Honest statement of the gate

R3 (perceived real-time, first word < ~1.5 s) is **NOT met on live**: P50 1836 ms,
P95 2940 ms, n=5, measured at the wire through Hosting after this deploy. It is met at
the function origin (665 ms). Nothing in this lane should be read as a PASS on R3.

One measurement this lane did not take: Enter→first-visible-text in a browser against
live *after* the client change. The client half ships with the static site when this
branch merges, so a browser trial run now would measure the old client against the new
function and would not describe either state. The wire numbers above are the binding
ones and they are measured on the same path a browser uses.
