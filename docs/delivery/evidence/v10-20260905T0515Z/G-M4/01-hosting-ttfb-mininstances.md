# G-M4 (t_g2_m4b) — Hosting POST /api/chat cold TTFB < 1.5 s

**Verdict: PASS on live.** Cold Hosting `POST /api/chat` TTFB was **2.295 s**
(ADV-1556Z, cold probe) vs **0.941 s** at the Cloud Run origin. After pinning one
always-warm instance on `minivicChat` (`minInstances: 1`) and deploying it, the
Hosting path returns in **0.116–0.177 s** and can no longer go cold. R3 (full
Higgsfield real-time avatar) stays **OPEN** — this lane does not touch it.

## Root cause — cold start, not SSE buffering

The verification probe sends `{"message":"ping"}`. That body is not a valid
conversation, so `normaliseConversation` rejects it with **HTTP 400
`messages_required`** *before* any provider ladder runs and before any
`text/event-stream` is opened (functions/index.js `minivicChat`). So the
2.295 s is **not** the SSE-buffering effect documented in G-M3 — a 400 JSON body
is tiny and non-streamed. The whole gap is **Cloud Functions (gen2 / Cloud Run)
container cold start** on the Hosting→Fastly→Cloud Run path.

Warm, the same Hosting path was already fast (measured this lane, before any
change, both endpoints warm):

```
Hosting POST /api/chat (ping):  ttfb=0.110s / 0.219s / 0.113s  http=400
Cloud Run origin (ping):        ttfb=0.104s / 0.153s / 0.157s  http=400
```

The delta between these ~0.11 s warm numbers and the 2.295 s cold number in
ADV-1556Z is the container start. Removing scale-to-zero removes it.

## Fix — `minInstances: 1` on `minivicChat`

functions/index.js, `exports.minivicChat = onRequest({ ... })`:

```js
region: "us-central1",
minInstances: 1,   // one always-warm instance; no scale-to-zero, no cold start
maxInstances: 5,
```

Deployed to live (Hosting CI deploys hosting only, so the function was deployed
by CLI):

```
$ firebase deploy --only functions:tts:minivicChat --project forgotten-mistory --force
...
✔  functions[tts:minivicChat(us-central1)] Successful update operation.
Function URL (tts:minivicChat(us-central1)): https://minivicchat-hjdyjsrzvq-uc.a.run.app
✔  Deploy complete!
```

`--force` was required because `minInstances: 1` raises the minimum bill — the
deploy CLI's own cost guard. That guard firing is itself confirmation the always-
warm floor is now set. Cost: one 256 MiB idle instance in us-central1,
~US$9–12/mo — bought deliberately for the site's flagship chat surface and the
hard G-M4 TTFB gate (§0.1 decision, logged not asked).

Why `minInstances` here when G-M3 said "do not buy it": G-M3's bar was R3's
*first-token* latency, which even warm is defeated by Hosting's Fastly edge
buffering the SSE stream — so an always-warm instance would not have moved it.
G-M4's bar is the **cold-probe TTFB** of the 400-fast path, where buffering is
irrelevant and cold start is the *entire* cost. `minInstances` is the exact and
deterministic fix for this gate; the free `?warm=1` GET remains as a second line.

## Verification — live, exact task command

```
$ for i in 1..5; do curl -sS -o /dev/null \
    -w '%{time_starttransfer} %{http_code}\n' \
    -X POST https://forgotten-mistory.web.app/api/chat \
    -H 'content-type: application/json' --data '{"message":"ping"}'; done
0.146248 400
0.116143 400
0.120043 400
0.128397 400
0.177485 400
```

P(max) 0.177 s ≪ 1.5 s. With `minInstances: 1` the service cannot scale to zero,
so a genuinely idle "cold" probe now lands on the warm instance and measures the
same ~0.12–0.18 s. Live `build-commit` at probe time: `b0513692`.

## Scope / honesty

- Greeting MP3 vs on-screen intro and the R3 Higgsfield avatar are **out of
  scope** for this lane and are **not** claimed PASS. R3 stays OPEN.
- No origin-only PASS is claimed: every number above is the Hosting URL the task
  names, measured from the VPS.
