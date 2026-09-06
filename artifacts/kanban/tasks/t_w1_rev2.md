# t_w1_rev2 — WAVE-1 REVIEW 2 — independent adversarial review of live ec53e2b4 (G-R2 §0.4 ladder order + runtime provider label + honest MiniVic badge, G-M4 cold first-token protocol) plus regression table; R3 must stay OPEN

**Status:** ready · **Priority:** 100 · **Parents:** t_w1_r2ap · **Created:** 2026-09-06T01:17:30.499Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Live build-commit ec53e2b4 (Deploy 34003390250, 01:14Z) = commit 'fix(minivic): §0.4 ladder order, truthful badge, cold first-token (G-R2, G-M4)' touching functions/index.js, lib/miniVicBrain.ts, components/MiniVicBot.tsx; the function was redeployed from the worktree (W1-R2/06-deploy-functions.log). Baseline ADV-2315Z §MiniVic FAIL: provider openai/gpt-4.1-mini on every run with OpenAI first in the order; cold TTFB 2.17 s; 'MINIVIC LIVE' badge. Decision doc: docs/architecture/MINIVIC-BRAIN-0-4.md (SA t_w1_r2sa) — the accepted design is OpenRouter first, OpenAI last and LABELLED (OpenRouter balance is negative, so OpenAI answering is expected and must be visible as such), badge 'MiniVic · synthetic', truth line with the provider read at runtime, and the G-M4 route/priming change with its cold protocol in W1-R2/08-g-m4-route-protocol.md. You did not write any of it. Judge on the live URL only.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: ADV-2315Z §MiniVic + §0.4 row; GAP-BACKLOG G-R2/G-M4/G-R3; docs/architecture/MINIVIC-BRAIN-0-4.md (what was decided); docs/delivery/evidence/v10-20260905T0515Z/W1-R2/08-g-m4-route-protocol.md (the cold protocol the implementer defined — you re-run it independently, you do not reuse their numbers); orchestration-skill §10.
- S-2 Function behaviour on live: 5 POSTs to https://forgotten-mistory.web.app/api/chat with a valid messages[] body: capture the provider/rungs field per response (expected: openrouter attempted first and cooling down on 402, openai answering and labelled), status codes, any secret leakage in error bodies (must be none). Confirm the deployed function's DEFAULT_PROVIDER_ORDER via the response's rungs list (not by reading source). Also GET the shipped JS chunks and grep for 'MiniVic Live' (must be absent) and the new badge strings (must be present).
- S-3 Cold first-token per the protocol: ensure ≥ 10 min without chat traffic from this host (check the timestamp of your own last call), then 7 samples using a streaming reader that timestamps the first content token (write your own docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/first-token.mjs); report each sample, median, max; PASS only if all 7 < 1.5 s — otherwise FAIL with the numbers. Also measure 3 warm samples for context. Do not run this concurrently with the browser work (CPU skews timing): run it first, then the browser.
- S-4 Browser (Playwright, system Chrome, one browser at a time): open the MiniVic panel at 1440 and 390: badge text, the truth line (provider clause appears only after an answer and names the provider actually used), the synthetic label, no 'Live' claim anywhere in the panel; send one question and confirm the answer streams/appears and the provider clause updates; 0 pageerrors/console errors normal + ?gl=force; regression: G-MV1 pill visible/labelled at 390, hero monochrome still holds, engage plates identical (G-C1), 0 pageerrors. Screenshots → docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/.
- S-5 Attack: try to get the function to answer with a non-labelled provider; try a 4001-char message and an empty messages[] (expect clean 400s, no stack traces); check /api/tts still 200 (G-M2 regression); confirm R3 is NOT claimed anywhere (badge/copy) and grade R3 OPEN.
- S-6 Write docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/08-adversarial-review.md (failures first, every verdict with command + number) and verdicts.json {sha:'ec53e2b4', gaps:{'G-R2':…,'G-M4':…,'badge':…}, regression:{…}, R3:'OPEN', false_positives:[…]}; return {task_id:'t_w1_rev2', live_sha, verdicts, failures_first:[…], evidence:[…], goal_complete:true}. Read-only; no app edits; never Hermes; never print secrets; ≤ 30 min (the 10-min idle wait counts — start the clock, do S-1/S-2 during it).

## QUALITY GATES
- Provider behaviour judged from live responses, not source
- Cold protocol re-run independently with 7 samples; PASS only if all < 1.5 s
- Badge/truth line verified in the shipped JS and in the rendered panel at 1440 and 390
- Regression table re-run; R3 graded OPEN; failures first
- ≤ 30 min; writes only under G-REV/ec53e2b4/

## VERIFICATION
```bash
cat /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/verdicts.json
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:17:55.947Z)
running — dispatched 01:19Z reviewer rev-ec53e2b4-w1

## COMPLETE (2026-09-06T01:46:12.012Z)
Reviewer rev-ec53e2b4-w1 (max, 24 min): overall FAIL. G-R2 PARTIAL (ladder order PASS behaviourally via the 10-min cooldown step; badge PASS; truth line present in DOM but CLIPPED by nowrap/ellipsis at 1440 and 390 → never visible), G-M4 FAIL (cold origin 2449 ms 1/7; Hosting warm+primed max 2017 ms; client aborts origin at 1500 ms so cold visitors always take the buffered fallback; ?warm=1 via Hosting returns 400 → priming not running), badge PASS, R3 OPEN, regression: launcher NOT clickable on first fold (hero-fold intercepts pointer events, 3/3), 0 pageerrors, /api/tts PASS, attack surface PASS. PM CORRECTION to the review: F6 'G-C1 still two mailto products' is a reviewer FALSE POSITIVE — PM curl of live 521dac9c at 01:45Z: 0 × 'Email a project brief', 2 × identical engage href (subject 20-minute call, body Hiring or a project); reviewer-1 PASS stands. Evidence docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/.
