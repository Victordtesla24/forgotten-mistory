# t_w1_r2c — CORRECTION G-R2/G-M4 (reviewer rev-ec53e2b4-w1 FAIL) — the provider disclosure must be READABLE (wrap, sentence case, no shouted LIVE), retire every 'AI clone' string, expose attempts[] on the done event, make the warm-prime path actually work through Hosting (204, not 400), and stop the client aborting the origin at 1500 ms on a cold cooldown map

**Status:** ready · **Priority:** 97 · **Parents:** t_w1_rev2 · **Created:** 2026-09-06T01:46:12.200Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: G-R2 truth line + G-M4 cold first token
Original output: t_w1_r2ap ec53e2b4 (order openrouter,deepseek,zai,openai; badge 'MiniVic · synthetic'; truth line 'Voice: ElevenLabs stock · Face: pre-rendered loop · Answers: live text via {provider}'; primeProviderCooldowns on ?warm=1).
Failing criteria (docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/08-adversarial-review.md): F4 the truth line is `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` and needs 595 px in a 316 px (1440) / 226 px (390) box, so 'Answers: live text via openai' is never visible (the panel subtitle is clipped at 390 too); F8 text-transform:uppercase shouts LIVE; F7 residual 'AI clone' copy (launcher aria-label 'Ask Mini Vic — Vikram's AI clone'; greeting "I'm Vikram — his AI clone, speaking from his CV"); F5 the done event carries only {done,provider,model} so §0.4 routing is not auditable; F3 POST/GET /api/chat?warm=1 through Hosting returns 400 (the implementer measured 204 at the origin) so primeProviderCooldowns never runs for real visitors; F2 lib/miniVicBrain.ts aborts the origin at 1500 ms — on a cold cooldown map the origin's first token is 2449 ms, so the visitor pays 1.5 s and then the buffered Hosting fallback in full.
Required fix: (1) MiniVicBot.tsx + CSS: the truth line wraps (white-space:normal, no ellipsis), sentence case (no uppercase transform on that line), at both widths — verify by measuring scrollWidth ≤ clientWidth per line in the test; subtitle likewise; (2) replace every 'AI clone' string (grep -rn 'AI clone' app components lib functions public) with the sanctioned synthetic wording; (3) functions/index.js done event and JSON body gain attempts:[{provider,outcome,ms}] (no secrets, no URLs) — and the node test asserts it; (4) find why ?warm=1 is 400 through Hosting (query stripped? method? body parser rejecting empty body?) — reproduce with curl against https://forgotten-mistory.web.app/api/chat?warm=1 (GET and POST) before and after; make it 204 through Hosting and keep the priming fire-and-forget; (5) in lib/miniVicBrain.ts do not abort the origin at a fixed 1500 ms — race sensibly: keep the origin as primary with a budget derived from the measured cold walk (e.g. 2600 ms) OR start the Hosting fallback only after the origin's headers are late, but never discard an origin stream whose first token arrives before the fallback's; document the chosen policy in MINIVIC-BRAIN-0-4.md §2(c) addendum; (6) redeploy the function (firebase deploy --only functions:tts:minivicChat --project forgotten-mistory --non-interactive) and push the site branch.
Verification: tests first (node: attempts[] shape; warm 204 contract; e2e: truth line fully visible at 1440/390 by scrollWidth ≤ clientWidth, 0 'AI clone' in DOM, no uppercase LIVE); then the reviewer's own protocol: 7 cold origin samples after ≥ 10 min idle AND 7 Hosting samples, plus 3 warm — report every number; PASS bar is all 7 < 1.5 s on the route the client actually completes.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w1-r2c /root/forgotten-mistory/.claude/worktrees/w1-r2c origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules; cd functions && npm ci. One build / one browser at a time; no ffmpeg.
- S-1 Read the review (08-adversarial-review.md F2–F8 + 15-truthline-clipping.json + first-token.mjs), MINIVIC-BRAIN-0-4.md, functions/index.js (isWarmRequest, primeProviderCooldowns, done event), lib/miniVicBrain.ts (origin race, abort), components/MiniVicBot.tsx (truth line, subtitle, aria-labels, greeting), app/globals.css MiniVic chrome, tests/minivic_chat_function.test.mjs, tests/e2e/chatbot.spec.ts.
- S-2 TESTS FIRST (capture failing → docs/delivery/evidence/v10-20260905T0515Z/W1-R2C/02-tests-failing.log): node — done event/JSON carry attempts[]; warm request contract returns 204 with no body for GET and POST; e2e — truth line + subtitle scrollWidth ≤ clientWidth at 1440 and 390 after an answer, text contains 'via ' + provider in sentence case, 0 occurrences of 'AI clone' anywhere in the DOM/aria, launcher aria-label sanctioned.
- S-3 Implement (1)–(5) as the smallest changes; keep CHAT_MAX_TOKENS 128 and minInstances 1; never touch ANTHROPIC_API_KEY; never print secrets.
- S-4 Deploy the function and verify through Hosting with curl: GET and POST https://forgotten-mistory.web.app/api/chat?warm=1 → 204 (capture headers); one real question → done event shows attempts[]; log → W1-R2C/06-deploy-functions.log.
- S-5 Site verify: tsc · lint · build:static · audit 10/10 · node tests · e2e chatbot + minivic-send-path on :5618 (kill after) · screenshots of the open panel at 1440/390 showing the full truth line → W1-R2C/.
- S-6 Ledger before commit (node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w1_r2c --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w1_r2c.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w1-r2c -- <files>); commit 'fix(minivic): readable provider disclosure, no AI-clone copy, attempts audit, warm-prime via Hosting, origin race (G-R2, G-M4)' with the two mandatory trailers; git push -u origin worktree-w1-r2c.
- S-7 Cold protocol on live after the push is consolidated OR against the origin+Hosting now for the function half: wait ≥ 10 min idle, then 7 origin + 7 Hosting first-token samples with the reviewer's first-token.mjs approach (your own copy), plus 3 warm; → W1-R2C/07-first-token.json. Report every number; do not stop or start anything to flatter them.
- S-8 Return {task_id, branch, sha, pushed, push_denied, files_changed, functions_deployed, warm_status_via_hosting:{get,post}, attempts_field:bool, first_token:{origin_cold:[7], hosting_cold:[7], warm:[3]}, gates:{tests_failed_first, tsc, lint, build, audit_10_10, node_tests, e2e_targeted, truth_line_visible_both_widths, zero_ai_clone, all7_under_1_5s}, evidence:[], decisions:[], goal_complete}.

## QUALITY GATES
- Truth line and subtitle fully visible (scrollWidth ≤ clientWidth) at 1440 and 390, sentence case; 0 'AI clone' strings; attempts[] present
- ?warm=1 → 204 through Hosting (GET and POST) captured with curl; function deployed
- Origin race policy documented and implemented; no fixed 1500 ms abort that discards a live stream
- Cold protocol numbers reported in full; PASS only if all 7 < 1.5 s on the completed route, otherwise the shortfall is stated
- tsc · lint · build · audit 10/10 · node + e2e green; ledger before commit; pushed; ≤ 30 min per slice (split S-7 into a return if the idle wait would breach)

## VERIFICATION
```bash
curl -s -o /dev/null -w '%{http_code}\n' 'https://forgotten-mistory.web.app/api/chat?warm=1'
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'content-type: application/json' -d '{}' 'https://forgotten-mistory.web.app/api/chat?warm=1'
git ls-remote --heads origin worktree-w1-r2c
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:47:22.528Z)
running — dispatched 01:48Z fm-wave1-d (serialized)

## COMMENT (2026-09-06T02:07:45.989Z)
PM probe 02:08Z on LIVE 5293e7d6 (Deploy 34005562108): GET and POST /api/chat?warm=1 through Hosting → 204 in 0.19 s / 0.17 s (was 400); 'AI clone' 0 in HTML and all shipped chunks. Truth-line visibility, attempts[] and the origin race policy are for the independent reviewer (rev-4, composite SHA with t_w1_mv2).

## COMMENT (2026-09-06T02:37:33.569Z)
Lane result 02:38Z (identity ap-w1-r2c, over cap, honest goal_complete:false): a134bb5c on worktree-w1-r2c (live since 5293e7d6/b02a8863); function redeployed; ?warm=1 GET/POST 204 through Hosting (a POST carrying messages[] + warm flag is still answered — never swallowed); attempts[] on the done event and JSON body; disclosure moved from the clipped overlay to a flow-level bar (visible at 1440/390, sentence case), subtitle unclipped; 'AI clone' 0 in DOM/aria (retired in greeting variants, aria-label, visa answer, server system prompt). Strict-cold (≥10 min idle, no warm ping): Hosting 7/7 < 1.5 s (max 1194 ms); origin first sample 2626 ms (dead-rung walk) then 465–1408 ms. Remaining measurement: the real visitor sequence (idle → panel open fires warm ping → send) — assigned to reviewer t_w1_rev4. e2e: 32 pass / 3 pre-existing fails reproduced on the pre-change live build (TC-BOT-14, TC-MV-OCCLUDE-01, MONO-MV-02@640) → t_w1_red2 scope.

## DECISION (2026-09-06T02:37:33.628Z)
§0.1 decision 02:38Z: public/assets/minivic-greeting.mp3 still speaks 'his AI clone'. Regenerating it is ONE ordinary TTS call with the configured premade voice — the same class of call the live site makes for every visitor's reply — not a new spend class (IVC/cloning/video). It is folded into t_w2_r3a2, which already makes exactly one /with-timestamps call for the greeting alignment: that call produces the new audio AND the alignment. No separate paid call.

## COMPLETE (2026-09-06T03:23:09.511Z)
Independent live PASS for G-R2 (rev-97e19d07-w1): ladder order, readable disclosure with runtime provider, attempts[], warm-prime 204 through Hosting, 'AI clone' gone from DOM/aria/chunks. G-M4 remains FAIL on the Hosting fallback route only → t_w1_m4b (PM decision recorded there).

## DECISION (2026-09-06T03:23:09.793Z)
§14 decision policy applied to G-M4 03:22Z: Firebase Hosting's function rewrite is buffered by Fastly, so first byte on that route equals the origin's completion time (measured: firstChunk == headers == firstToken, total − firstToken ≤ 4 ms). The shipped client renders the ORIGIN route first (verified from the network log; strict-cold 965 ms; 0/5 over) — that is the product a visitor experiences and it meets the bar. The Hosting route is the fallback for proxies that block *.a.run.app. Decision: keep origin-first; on the Hosting fallback route only, cap the answer length (CHAT_MAX_TOKENS_FALLBACK, sized so completion < 1.5 s at the measured openai rate) and disclose it in the truth line ('via openai · short answer on the proxy route'); never lower the primary route's tokens. Reversal cost: one env/config change. What would unblock a full fix: Hosting streaming support (not available for function rewrites) or a VPS nginx SSE proxy (C-2) — filed as an SA option in t_w1_m4b.
