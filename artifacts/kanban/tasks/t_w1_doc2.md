# t_w1_doc2 — DOC DEFECTS (rev-97e19d07-w1 F-3/F-4) — ASSET-LADDER.md §1 og-image row (live 2400x1260 / 209,035 B) and minivic-greeting.txt row (live 384 B), §11 'OG card untouched' sentence; MINIVIC-BRAIN-0-4.md addendum contradiction (DIRECT_FIRST_BYTE_TIMEOUT_MS is 3200 ms per lib/miniVicRoute.mjs:56 and the shipped chunk — point 3 must not say 2 600 ms)

**Status:** ready · **Priority:** 78 · **Parents:** t_w1_rev4 · **Created:** 2026-09-06T03:23:09.990Z

## YOUR ROLE
coder — coding / documentation (docs/prompt.md §5). Documentation-only (coder, documentation role, medium). Numbers come from the review's captures (G-REV/97e19d07/08-adversarial-review.md F-3/F-4) and from `identify`/`ls -l` on the live files in the worktree, never from memory. No code, no assets, no builds.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w1-doc2 from origin/main.
- S-1 Read the review F-3/F-4, docs/architecture/ASSET-LADDER.md §1/§11, docs/architecture/MINIVIC-BRAIN-0-4.md addendum, lib/miniVicRoute.mjs (the constant).
- S-2 Fix the three items; re-measure the two asset rows with identify/ls -l in the worktree; keep everything else byte-identical.
- S-3 Verify with grep: no '1200x630' / '182,547' / '368 B' in §1; no '2 600' / '2600' in the addendum; 'untouched' sentence corrected.
- S-4 Ledger (--role coder --model claude-sonnet); commit 'docs(ladder,brain): live OG/greeting rows; 3200 ms timeout stated once' with the two mandatory trailers; push worktree-w1-doc2.
- S-5 Return {task_id, branch, sha, pushed, push_denied, files_changed, gates:{rows_match_live, contradiction_removed, no_code_touched}, goal_complete}.

## QUALITY GATES
- Every corrected number re-measured; contradiction removed; only the two docs changed
- Ledger; pushed; ≤ 15 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w1-doc2
```

## HIERARCHY
role_matrix: coding / documentation → level 4 → effort **medium (xhigh when coding)** (effort_cascade.yaml; depth_cap 4). Model: deepseek · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T03:23:10.050Z)
running — dispatched 03:24Z coder (docs, sonnet medium)

## COMPLETE (2026-09-06T03:25:49.179Z)
coder-w1-doc2 (sonnet, 2.3 min): 26213c4 pushed — ASSET-LADDER.md §1 og-image row 2400x1260/209,035 B and greeting.txt 384 B re-measured; §11 corrected; MINIVIC-BRAIN-0-4.md addendum point 3 now 3 200 ms (matches lib/miniVicRoute.mjs:56 and point 1). Docs only; ledger +2.
