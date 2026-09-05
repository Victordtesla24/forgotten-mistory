# G-REV phase 3 — independent adversarial review of t_g_m3 + t_g_m3b

**Reviewer profile (docs/prompt.md §5), read-only. Nothing here was measured with
the implementer's harness.** `scripts/testing/minivic_live_ttft.mjs` was read only
to know what to attack; every number below comes from
[`reviewer-probe.mjs`](./reviewer-probe.mjs), [`reviewer-extras.mjs`](./reviewer-extras.mjs)
and [`reviewer-payload.mjs`](./reviewer-payload.mjs), written for this review.

**Verdict: the G-M3b latency claim survives an independent re-measurement, at both
widths, with the fallback and the one-request-per-send invariant intact.**

## Build under test — and the drift during the review

The deploy metronome shipped three times while this review ran, so the honest
record is per-run, not one commit:

| run | live `build-commit` meta | contains `8978c2c`? |
|---|---|---|
| latency 1440 (6 trials) | `753bc5ad` | yes — `git merge-base --is-ancestor 8978c2c 753bc5a` → 0 |
| latency 390 (6 trials) | `753bc5ad` | yes |
| fallback, reduced-motion, returning-visitor, payload | `5a8c8c34` | yes — `--is-ancestor 8978c2c 5a8c8c3` → 0 |
| at review start (`curl -sI`) | `411650c2` | yes — `--is-ancestor 8978c2c HEAD` → 0 |

All four are at or after `e658709b`. `8978c2c4` ("perf(minivic): answers stream
from the function origin") is an ancestor of every one of them, so every
measurement below describes the shipped G-M3b client.

## Verdict table

| gate | verdict | evidence |
|---|---|---|
| **G-M3-latency-1440** | **PASS** | cold 821 ms, warm **P50 732 ms**, P95 994 ms, n=5 warm — all six trials under the 1500 ms bar. `01-latency-1440.json` |
| **G-M3-latency-390** | **PASS** | cold 644 ms, warm **P50 594 ms**, P95 741 ms, n=5 warm — all six under the bar. `02-latency-390.json` |
| **fallback** | **PASS (answers) / limitation recorded (latency)** | origin aborted at the network layer → `POST /api/chat` **200** answers with a real, differently-worded grounded reply in 3/3 trials. TTFT 1655 / 1956 / 2134 ms — over the 1.5 s bar, and rendered in one shot. `03-fallback-1440.json` |
| **G-M1-invariant** | **PASS** | exactly **one** chat request per send in 12/12 happy-path sends (`POST` origin, 200, `text/event-stream`, `fetch`); 0 `/api/realtime*`, 0 `chat-with-vic*`, 0 WebSockets, in every trial |
| **csp** | **PASS** | `connect-src` on the live header carries `https://minivicchat-hjdyjsrzvq-uc.a.run.app`; **0** `securitypolicyviolation` events across 15 page loads; 0 page errors; 0 console errors on the happy path |
| **grounding** | **PASS** | reply names the ATO, Payday Super, the Agile Kookaburras squad, Distribution UI past 95%, NTP testing, COBOL/mainframe evidence automation — and it is progressive: bubble text grows 31 → 172 → 355 chars across 300 ms samples |

## The numbers, all of them

Enter → first visible bot text, `performance.now()` taken inside the page in a
capture-phase `keydown` listener and in a `MutationObserver`. One send per fresh
context; page load is not counted.

| viewport | cold (first send of run) | warm P50 | warm P95 | warm trials (ms) | route, every send |
|---|---|---|---|---|---|
| 1440 × 900 | 821 | **732** | 994 | 732, 772, 561, 994, 642 | origin, POST, 200, `text/event-stream` |
| 390 × 844 | 644 | **594** | 741 | 679, 594, 561, 593, 741 | origin, POST, 200, `text/event-stream` |

Against G-M3b's reported P50 683 ms (1440) / 711 ms (390): **not contradicted.**
Independent re-measurement lands at 732 / 594 — inside ordinary run-to-run
variance on the same VPS network position, and both well inside the bar.

**Warm-on-open, counted separately and named.** Opening the panel fires exactly
two requests, in every one of the 15 page loads:

```
GET https://minivicchat-hjdyjsrzvq-uc.a.run.app/?warm=1   → 204
GET https://forgotten-mistory.web.app/api/chat?warm=1     → 204
```

Both rungs are warmed, as claimed. Neither is a send, and neither is counted in
the per-send total.

**Progressive rendering is real.** Sampling the bot bubble every 300 ms from the
Enter keypress (1440, trial 0): `0 → 0 → 31 → 172 → 355` characters. A bubble
delivered complete would produce one sample; this is token frames arriving.

**Payload carries no provider/model.** Captured verbatim off the live wire
(`05-payload.json`):

```json
{"messages":[{"role":"assistant","content":"I'm Vikram — his AI clone…"},
             {"role":"user","content":"What did Vikram do at the ATO?"}],
 "mode":"hiring","stream":true}
```

Three keys: `messages`, `mode`, `stream`. No `provider`, no `model`, and no
multi-kilobyte client-side system prompt. The `mode` claim from G-M3 holds too.

**Preflight caching is live**, so the second and later sends of a conversation do
not pay a second round trip:

```
$ curl -sI -X OPTIONS https://minivicchat-hjdyjsrzvq-uc.a.run.app/ \
    -H 'Origin: https://forgotten-mistory.web.app' -H 'Access-Control-Request-Method: POST'
HTTP/2 204 · access-control-max-age: 3600
```

## Failures and limitations, first

Nothing here blocks t_g_m3 / t_g_m3b. All three are recorded so the next run does
not inherit a silent bias.

1. **The fallback answers, but it is not real-time — and the review should say so.**
   With the Cloud Run origin refused at the network layer, `POST /api/chat`
   returns 200 and a genuinely different, grounded reply each time (so: a live
   function, not a canned string). But first visible text lands at **1655 / 1956 /
   2134 ms**, and the 300 ms samples read `0,0,0,0,0,469` — nothing, then the
   whole answer at once. That is Firebase Hosting buffering the SSE, exactly what
   G-M3 proved at the wire, now confirmed independently from inside a browser.
   Consequence: the resilience rung preserves *the answer*, not *R3's latency
   clause*. It should never be cited as a latency PASS.

2. **The stop-the-clock condition includes the bubble chrome.** The observer (mine
   and the implementer's) fires on the first non-empty `textContent` of the new
   bot bubble, and that text begins with the bubble's own header — `Vic`, the
   `Hiring Fit` chip and a timestamp, ~21 characters — which renders in the same
   frame as the bubble. So the measurement is strictly "first visible bot bubble",
   a superset of "first token". Bounded: in 12/12 happy-path trials the first
   non-zero 300 ms sample already carried **31–142** characters, i.e. real answer
   text beyond the 21-char header, so the overstatement is under one 300 ms frame
   and cannot move a 732 ms P50 across a 1500 ms bar. Recorded, not waived.

3. **"Cold" is not cold.** The 10-minute deploy metronome and concurrent sibling
   probes keep the container warm; 821 ms / 644 ms are the first send *of my run*,
   not a first send against an idle instance. G-M3b's 774 / 980 ms carry the same
   caveat. A true cold-start figure would need a quiet window nobody has.

## Regressions

**None found.** Specifically re-checked and clean on the live build:

- 0 page errors and 0 console errors across every happy-path trial at both widths.
- 0 `securitypolicyviolation` events in 15 page loads (the two console errors in
  the fallback run are `net::ERR_CONNECTION_REFUSED` — my own abort, expected).
- **Reduced motion + mute unaffected** (`04-extras.json`): with
  `prefers-reduced-motion: reduce` the panel opens, the mute control is present,
  a send answers from the origin in **626 ms**, the `<audio>` element stays
  `paused: true, currentTime: 0`, and **zero** `/api/tts` requests are made.
- **Returning visitor serves the current build** (`04-extras.json`): a persistent
  Chrome profile loading the site, revisiting, then hard-reloading reports
  `5a8c8c34` on all three loads and the live meta agrees. `getRegistrations()`
  returns `[]` — no service worker is registered, so the 2026-09-05 stale-shell
  failure mode has no vehicle on this build.

## False-positive register

Claims in `8978c2c` / `16144a0` / `ddb2476` that this review could **not**
reproduce: **none.** Every load-bearing claim was re-tested independently and
held. For the record, the four that were most worth attacking:

| claim (verbatim) | independent result |
|---|---|
| "Enter → first visible token P50 683 ms at 1440 and 711 ms at 390, n=5 warm each, against the < 1500 ms bar" (16144a0, `G-M3b/09-verification.md`) | **reproduced within variance** — 732 ms and 594 ms on my own probe, 12/12 trials under the bar |
| "0 CSP violations, 0 page errors, in all 12 page loads" (16144a0) | **reproduced** — 0 and 0 across my 15 page loads |
| "`/api/chat` … sits behind it and answers whenever the direct rung fails" (16144a0) | **reproduced on live**, not just in the e2e mock: origin refused → `POST /api/chat` 200 with a real grounded reply, 3/3 |
| "No `provider`/`model` in the payload" (ddb2476, `G-M3/08-decision-first-token.md`) | **reproduced** — live body is `{messages, mode, stream}` only (`05-payload.json`) |

One honest non-reproduction that is *not* a false positive: the exact P50 values
differ (683 → 732 at 1440; 711 → 594 at 390). Different sample, same conclusion.

## One line on the other open items

- **G-H1 / G-H2a** — sibling-owned, being probed in parallel; not duplicated here,
  no opinion offered on their status.
- **Stability / skills sweep** — sibling-owned; not duplicated here.
- **R3 beyond latency** — still only the latency clause is measured, by anyone;
  G-M3b said so itself and this review does not extend that.
- **Australian-visitor latency** — unmeasured from this VPS (us-central1 is close
  by); the model's own ~639 ms first token remains the floor.

## How to reproduce

```bash
cd docs/delivery/evidence/v10-20260905T0515Z/G-REV/411650c2
node reviewer-probe.mjs   --mode latency  --width 1440 --trials 6 --out 01-latency-1440.json
node reviewer-probe.mjs   --mode latency  --width 390  --trials 6 --out 02-latency-390.json
node reviewer-probe.mjs   --mode fallback --width 1440 --trials 3 --out 03-fallback-1440.json
node reviewer-extras.mjs      # reduced motion + mute, returning visitor
node reviewer-payload.mjs     # live send payload, verbatim
```
