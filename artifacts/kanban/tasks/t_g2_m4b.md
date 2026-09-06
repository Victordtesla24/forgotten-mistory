# t_g2_m4b — ADV-1556Z P0 — G-M4 AP: Hosting POST /api/chat TTFB <1.5s on cold probe (not only Cloud Run origin); R3 avatar stays OPEN

**Status:** ready · **Priority:** 97 · **Parents:** t_adv1556 · **Created:** 2026-09-05T16:57:52.219Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). 1556Z measured Hosting POST /api/chat TTFB 2.295s; Cloud Run origin 0.941s. Firebase Hosting buffers SSE (first byte == last byte). Make the Hosting path itself <1.5s TTFB (rewrite to streaming origin, warm, or otherwise unbuffered). Do NOT claim origin-only PASS. Greeting MP3 speech === on-screen intro. Full R3 Higgsfield avatar stays honestly OPEN. Worktree from origin/main.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- Measure current Hosting vs origin TTFB
- Implement Hosting-path fix
- ledger before commit
- push; do not wait on Playwright

## QUALITY GATES
- Cold Hosting POST /api/chat TTFB <1.5s on live after deploy
- Greeting MP3 matches on-screen intro
- R3 avatar not claimed PASS

## VERIFICATION
```bash
curl -sS -o /dev/null -w '%{time_starttransfer}\n' -X POST https://forgotten-mistory.web.app/api/chat -H 'content-type: application/json' --data '{"message":"ping"}'
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:33.339Z)
1556Z queued behind Window-1 5-AP cap; dispatch as soon as an AP slot frees.

## STATUS (2026-09-05T17:19:17.535Z)
running — dispatched

## COMMENT (2026-09-05T17:27:41.801Z)
AP pushed 1c8167d minInstances=1; claims Hosting TTFB 0.116-0.177s. Independent measure required. Functions deployed via CLI (hosting workflow does not ship functions).

## COMMENT (2026-09-05T17:53:50.157Z)
Live now 58d9c111 includes 1c8167d minInstances. Independent reviewer must POST valid {messages:[...]} to Hosting /api/chat and measure TTFB. ping-400 is not the gate. R3 avatar stays OPEN.

## COMMENT (2026-09-05T17:58:40.615Z)
INDEPENDENT REVIEWER FAIL on live 2806edec (c7dd6fcd): Hosting valid-payload TTFB median 1.704s (1.488-1.997). ping-400 0.11s is NOT the gate. Origin 0.57-0.79s. CORRECTION dispatched identity ap-gm4-c2-58d9: unbuffer Hosting path; remeasure valid messages[] stream; R3 stays OPEN.

## COMMENT (2026-09-05T18:19:48.440Z)
Hung AP 02581235 interrupted; claimed functions CHAT_MAX_TOKENS 128 + live TTFB ~1.25s (self-report). Uncommitted worktree gm4-c2-58d9. New identity ap-gm4-c3-aa58 to commit/push. Independent reviewer on aa58395b measures valid-payload Hosting TTFB. R3 OPEN.

## COMMENT (2026-09-05T18:28:39.230Z)
Author ap-gm4-c3-aa58 pushed origin/worktree-gm4-c3-aa58 8808bfa (CHAT_MAX_TOKENS 128, ≤45 words). Self-measured Hosting valid-payload TTFB samples 1.615/1.162/1.365/1.317/1.270/1.403 median 1.34s — one sample over 1.5s. NOT a PASS. Not on main yet. Dispatching Deploy to consolidate. R3 OPEN. Independent reviewer decides.

## COMPLETE (2026-09-05T18:31:46.870Z)
INDEPENDENT PASS live https://forgotten-mistory.web.app/ POST /api/chat valid messages[] stream: TTFB median 1.204s (7/7 <1.5s, max 1.386s) on build-commit aa58395b (Deploy 33983551491). Reviewer 836eeb5f G-REV/aa58395b/08-adversarial-review.md §2. Source 8808bfa now on live 64404134. R3 avatar OPEN. ping-400 not used.

## COMMENT (2026-09-06T00:00:34.504Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:34.613Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
