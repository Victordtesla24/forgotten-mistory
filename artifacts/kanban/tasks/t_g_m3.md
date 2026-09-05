# t_g_m3 — ADV-FAIL P0 — G-M3 MiniVic first visible answer token < 1.5 s on live (warm path / streaming), client payload carries no provider/model

**Status:** todo · **Priority:** 94 · **Parents:** t_g_m1 · **Created:** 2026-09-05T12:19:26.382Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). R3 acceptance: perceived real-time (< ~1.5 s to first word). The reviewer measured a latency tax on live. After G-M1 lands (send path = /api/chat only) the remaining budget is the Firebase Function `minivicChat` (functions/index.js — v2 onRequest, us-central1, 256 MiB, provider ladder OpenRouter → DeepSeek → Z.ai → OpenAI, per-warm-instance cooldowns) reached through the Hosting rewrite `/api/chat` (firebase.json). Cold starts + a full non-streamed completion dominate. Directive: measure first, then remove the tax with cost-neutral mechanisms first — (a) a warm-up request fired when the MiniVic panel opens (GET /api/chat?warm=1 → 204 from the function, no upstream call) so the instance is hot before the visitor finishes typing; (b) drop any `provider`/`model` fields from the client payload (server decides); (c) stream the completion (SSE / chunked) IF Firebase Hosting rewrites to Cloud Functions v2 pass chunks through — verify against current Firebase docs via context7/WebFetch and by a live measurement, do not assume; (d) trim the function's cold-start (lazy requires, smaller bundle). `minInstances` is a paid setting — record it as the fallback decision with monthly cost if (a)-(d) cannot reach the bar; never claim R3 PASS while the bar is unmet. Functions deploy from the VPS: `/usr/bin/firebase deploy --only functions:minivicChat --project forgotten-mistory` (auth verified 12:15Z; `firebase functions:list` shows elevenLabsTts + minivicChat v2 nodejs20).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read functions/index.js fully, firebase.json, components/MiniVicBot.tsx handleSend after G-M1, lib/miniVicBrain.ts. Measure live TTFB now: 5 trials from the VPS `curl -s -o /dev/null -w '%{time_starttransfer}\n' -X POST https://forgotten-mistory.web.app/api/chat -H 'content-type: application/json' -d '{"message":"What did Vikram do at the ATO?","mode":"recruiter","history":[]}'` and 5 browser trials (Playwright: time from Enter to first non-empty bot bubble text) → 01-live-baseline.log with P50/P95.
- S-2 TDD: extend tests/e2e/minivic-send-path.spec.ts (from G-M1) — on panel open exactly one warm request is fired and is not counted as a send; the send payload JSON has no `provider`/`model` keys; add `tests/minivic_chat_function.test.mjs` (node:test) unit-testing the function handler with an injected fetchImpl: warm=1 returns 204 without calling upstream; streaming path (if chosen) writes the first chunk before the upstream completes. RED first.
- S-3 Implement client (warm ping, payload) + function (warm branch; streaming or chunked first-token if verified supportable; cold-start trims). Deploy the function from the VPS; re-measure live (5+5 trials) → 06-deploy.log + 07-prod-verification/.
- S-4 Rebuild static; run the specs on your port; tsc; lint; audit 10/10. Record the measured live P50/P95 honestly against the 1.5 s bar in the structured output — PASS only if met.
- S-5 Ledger; commit `perf(minivic): warm path and lean payload — first token measured on live (G-M3)`; push branch.

## QUALITY GATES
- Live P50 first-token < 1.5 s over ≥5 trials (browser-measured) — or the exact measured number with the decision memo (minInstances cost) if not met
- No provider/model in the client payload; warm request fired on open, not on send
- node:test + e2e red → green; function deployed and `firebase functions:list` shows the new version; tsc, lint, audit 10/10
- Ledger rows; branch pushed

## VERIFICATION
```bash
for i in 1 2 3 4 5; do curl -s -o /dev/null -w '%{time_starttransfer}\n' -X POST https://forgotten-mistory.web.app/api/chat -H 'content-type: application/json' -d '{"message":"What did Vikram do at the ATO?","mode":"recruiter","history":[]}'; done
node --test tests/minivic_chat_function.test.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5612 npx playwright test tests/e2e/minivic-send-path.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T12:49:33.997Z)
PREREQ FINDING (from G-M2): ELEVENLABS_API_KEY in /root/.claude/.env.production is a key ID (ElevenLabs 400 api_key_id_used_as_api_key) — the live /api/tts function (elevenLabsTts, Secret Manager ELEVENLABS_API_KEY) very likely fails the same way → speakReply falls back to browser TTS. Measure /api/tts on live in this lane and report honestly; the fix (a real sk_ key) is a credential the Owner holds — record as the blocker for the voice half of R3 while the chat TTFB half proceeds.

## COMMENT (2026-09-05T13:06:01.934Z)
BASELINE MEASURED by the reviewer on live (ca2b442): Enter→first visible bot text, 5 warm trials @1440 muted: 1677/2089/2121/2451/2813 ms → P50 2121 / P95 2813 (budget <1500); cold first sends 6151 (1440) / 1875 (390) / 3093 (unmuted); curl POST /api/chat time_starttransfer P50 1674 / P95 2564 ms (best 1450) — the FUNCTION itself is the budget, not the client; text/event-stream = 0. CORRECTION to my earlier note: POST /api/tts on live → 200 audio/mpeg 36.8 kB in 0.395 s (real MP3) — the deployed function's ELEVENLABS secret is a valid key; only the local .env.production value is a key ID. Suspect the provider ladder: OpenRouter (rung 1) is at 402 — if every warm instance pays a failing rung before DeepSeek answers, that is ~0.5–1 s of the budget; check 2026-09-05T06:04:38.624591Z W minivicchat: 
2026-09-05T06:04:48.548228Z I minivicchat: 
2026-09-05T06:38:03.618255Z I minivicchat: 
2026-09-05T06:38:03.656366Z I minivicchat: Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-09-05T06:38:04.608450Z I minivicchat: Default STARTUP TCP probe succeeded after 1 attempt for container "worker" on port 8080.
2026-09-05T06:38:10.122790Z I minivicchat: 
2026-09-05T07:03:48.177573Z W minivicchat: 
2026-09-05T07:03:48.210237Z I minivicchat: Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-09-05T07:03:49.123893Z I minivicchat: Default STARTUP TCP probe succeeded after 1 attempt for container "worker" on port 8080.
2026-09-05T10:56:51.469930Z I minivicchat: 
2026-09-05T10:56:51.500215Z I minivicchat: Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-09-05T10:56:52.507821Z I minivicchat: Default STARTUP TCP probe succeeded after 1 attempt for container "worker" on port 8080.
2026-09-05T11:00:07.164164Z I minivicchat: 
2026-09-05T11:00:09.335663Z W minivicchat: 
2026-09-05T11:00:09.633814Z W minivicchat: 
2026-09-05T11:00:09.932674Z W minivicchat: 
2026-09-05T11:00:59.807147Z I minivicchat: 
2026-09-05T11:04:40.118839Z I minivicchat: 
2026-09-05T11:04:42.453065Z I minivicchat: 
2026-09-05T11:04:43.520194Z I minivicchat: 
2026-09-05T12:54:06.345209Z I minivicchat: 
2026-09-05T12:54:06.372378Z I minivicchat: Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-09-05T12:54:07.356052Z I minivicchat: Default STARTUP TCP probe succeeded after 1 attempt for container "worker" on port 8080.
2026-09-05T12:54:58.185140Z I minivicchat: 
2026-09-05T12:55:39.378541Z I minivicchat: 
2026-09-05T12:56:18.466908Z I minivicchat: 
2026-09-05T12:56:22.610193Z I minivicchat: 
2026-09-05T12:56:26.126500Z I minivicchat: 
2026-09-05T12:56:29.220244Z I minivicchat: 
2026-09-05T12:56:33.648564Z I minivicchat: 
2026-09-05T12:57:18.256336Z I minivicchat: 
2026-09-05T12:57:20.850314Z I minivicchat: 
2026-09-05T12:57:22.859578Z I minivicchat: 
2026-09-05T12:57:24.530559Z I minivicchat: 
2026-09-05T12:57:26.172564Z I minivicchat:  rung timings and make the cooldown/ordering survive cold starts (env-driven rung order), plus warm ping + streaming if Hosting passes chunks. Parent t_g_m1 done → READY.

## STATUS (2026-09-05T13:07:14.639Z)
running — dispatched 13:07Z — analyst-programmer xhigh, isolated worktree, port 5612; function deploy from VPS allowed; RECTIFY push rule

## COMMENT (2026-09-05T13:31:34.342Z)
LANE RESULT (ddb2476 + d8983e5, function deployed twice, client slice consolidating): HONEST FAIL on the bar — live first byte through Hosting P50 1836 / P95 2940 ms (was 2016/4178); the function itself first-token 639 ms; direct to the Cloud Run origin P50 665 ms first byte (SSE streams there); PROVEN by experiment that Firebase Hosting buffers SSE (first byte == last byte on every trial, both text/event-stream) — docs silent. Shipped: answering rung (openai) first via CHAT_PROVIDER_ORDER (three dead 402 rungs off the cold path — rung log now [openai answered 1618ms]); GET /api/chat?warm=1 → 204 in 192 ms fired on panel open (MV-WARM-01); payload without provider/model and mode now reaches the server (MV-PAYLOAD-01); SSE implemented end to end (real per-token frames); 45/45 node:test, 4/4 e2e, tsc/lint/build/audit clean; minInstances rejected (cold start is not the gap). REMAINING FIX → t_g_m3b: stream from the Cloud Run origin directly. R3 stays OPEN.

## COMMENT (2026-09-05T13:54:12.470Z)
Superseded by t_g_m3b (direct-origin SSE): lane-measured live P50 683/711 ms. This task's own slice (rung order, warm ping, lean payload, SSE) is live; close together with t_g_m3b on the reviewer's PASS.

## COMPLETE (2026-09-05T14:04:38.117Z)
DONE via t_g_m3b — R3 latency clause (first word < ~1.5 s) independently PASS on live; this task's slice (rung order, warm ping, lean payload, SSE) is live and the Hosting-buffering proof stands. R3 as a whole stays OPEN on t_1e4e053e (Higgsfield real-time avatar + ≤40 ms lip-sync not met; voice via /api/tts works).
