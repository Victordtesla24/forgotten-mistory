# t_w1_m4b — CORRECTION G-M4 (rev-97e19d07-w1 FAIL on the Hosting fallback) — honest first-token on the buffered route: fallback-only answer cap sized from measured openai throughput so Hosting POST /api/chat completes < 1.5 s strict-cold, disclosed in the truth line; primary origin route untouched; evaluate (read-only) a VPS nginx SSE proxy as the real fix and write the option memo

**Status:** ready · **Priority:** 96 · **Parents:** t_w1_rev4 · **Created:** 2026-09-06T03:23:09.863Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: G-M4 Hosting fallback
Original output: t_w1_r2c (origin-first client, warm-prime, attempts[]). Failing criteria (docs/delivery/evidence/v10-20260905T0515Z/G-REV/97e19d07/08-adversarial-review.md F-1, 01-coldA-hosting.json, 03-spaced-sequences.jsonl): strict-cold Hosting first token 1805 ms (2 of 4 over); firstChunk == headers == firstToken and total − firstToken ≤ 4 ms → Fastly buffers the whole SSE, so Hosting first byte = origin completion (openai answered 1121–1735 ms for ~320-char answers). The panel renders the origin route (725/978 ms; strict-cold 965 ms; 0/5 over) — PASS there. PM decision (t_w1_r2c DECISION 03:22Z): fallback-only answer cap + disclosure.
Required fix: (1) functions/index.js — detect the Hosting route (e.g. the x-forwarded-host / via header Fastly adds, or an explicit ?route=hosting the client sets only on the fallback POST) and apply CHAT_MAX_TOKENS_FALLBACK (start at 64; size it from the measured tokens/s in attempts[] so P95 completion < 1.4 s) while the origin route keeps 128; include route:'origin'|'hosting' and max_tokens in the done event; (2) lib/miniVicBrain.ts + MiniVicBot.tsx — when the answer came via the Hosting route, the truth line reads 'Answers: live text via <provider> · short answer on the proxy route' (sentence case, wraps); (3) tests first: node test for the route detection + cap; e2e for the disclosure variant; (4) redeploy the function; (5) measure: two strict-cold Hosting sequences (≥ 10 min idle each: warm ping → 1.5 s → POST via Hosting) + three spaced, with your own first-token reader; report all; (6) write docs/architecture/MINIVIC-BRAIN-0-4.md §2(c) addendum 2: the structural finding, the cap, and the real-fix option memo (a VPS nginx location proxying /api/chat to the Cloud Run origin with proxy_buffering off — C-2 says the VPS is the execution target; note DNS/TLS/CORS implications and that it is a separate SA decision).
Verification: tsc · lint · build:static · audit 10/10 · node tests · e2e chatbot on :5631 · curl strict-cold Hosting first token < 1.5 s on both strict samples (or the shortfall stated).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w1-m4b from origin/main; cd functions && npm ci. One build / one browser; no ffmpeg.
- S-1 Read the review F-1 + its JSON evidence, functions/index.js (route handling, done event, CHAT_MAX_TOKENS), lib/miniVicRoute.mjs + lib/miniVicBrain.ts (origin-first, DIRECT_FIRST_BYTE_TIMEOUT_MS 3200), components/MiniVicBot.tsx (truth line), tests/minivic_chat_function.test.mjs, tests/minivic_chat_route.test.mjs, tests/e2e/chatbot.spec.ts, MINIVIC-BRAIN-0-4.md §2(c).
- S-2 TESTS FIRST (capture failing → W1-M4B/02-tests-failing.log).
- S-3 Implement (1)–(2); keep the origin route's 128 tokens; never print secrets.
- S-4 Deploy the function (firebase deploy --only functions:tts:minivicChat --project forgotten-mistory --non-interactive) → W1-M4B/06-deploy.log; verify route/max_tokens fields with curl on both routes.
- S-5 Verify site; screenshots of the fallback disclosure (force the Hosting route in a test via route override) → W1-M4B/.
- S-6 Ledger; commit 'fix(minivic): fallback-only answer cap with disclosure so the buffered Hosting route also clears 1.5 s (G-M4)' with the two mandatory trailers; push worktree-w1-m4b.
- S-7 Strict-cold measurements (S-2 protocol of rev4) → W1-M4B/07-first-token.json. If the idle windows would breach 30 min, return after the push with the measurement plan and numbers so far — honestly.
- S-8 Return {task_id, branch, sha, pushed, push_denied, files_changed, functions_deployed, fallback_cap, hosting_strict_cold_ms:[...], origin_ms:[...], gates:{tests_failed_first, tsc, lint, build, audit_10_10, node_tests, e2e_targeted, disclosure_variant_visible, hosting_all_under_1_5s}, evidence:[], decisions:[], goal_complete}.

## QUALITY GATES
- Origin route unchanged (128 tokens, first token unaffected); fallback cap applied only on the Hosting route and disclosed in the truth line
- Function deployed; done event carries route + max_tokens; no secrets
- Strict-cold Hosting first token < 1.5 s on both strict samples, or the shortfall stated with numbers
- tsc · lint · build · audit 10/10 · node + e2e green; ledger; pushed; ≤ 30 min per slice

## VERIFICATION
```bash
curl -s -X POST -H 'content-type: application/json' -d '{"messages":[{"role":"user","content":"In one sentence, what did Vikram do at the ATO?"}]}' https://forgotten-mistory.web.app/api/chat | tail -c 400
git ls-remote --heads origin worktree-w1-m4b
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T03:53:30.542Z)
running — dispatched 03:54Z fm-wave2-corrections-b (serialized: mv4 → m4b → l1m → a3g)
