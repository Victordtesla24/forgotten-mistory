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
