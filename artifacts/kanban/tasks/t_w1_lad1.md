# t_w1_lad1 — DOC DEFECT (rev-12cd9123-w1 F-5) — docs/architecture/ASSET-LADDER.md §1–2 still call /assets/my-hero-avatar.mp4 a 640x360 / 160,156 B unreferenced orphan to RETIRE while §10 and the live file are the 1280x720 / 1,916,328 B base rung; rewrite §1–2 so every sentence is true of live 12cd9123 (§11.9 honest documentation)

**Status:** ready · **Priority:** 80 · **Parents:** t_w1_rev3 · **Created:** 2026-09-06T02:10:44.244Z

## YOUR ROLE
coder — coding / documentation (docs/prompt.md §5). Documentation-only slice (coder profile, documentation role, medium). Source of truth for the numbers: the review's own measurements (docs/delivery/evidence/v10-20260905T0515Z/G-REV/12cd9123/h5-rung-probe.json, ffprobe lines in 08-adversarial-review.md) and §10 of the ladder. Do not touch code or assets.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w1-lad1 from origin/main (.claude/worktrees/w1-lad1); no build needed.
- S-1 Read docs/architecture/ASSET-LADDER.md in full, the review F-5, h5-rung-probe.json, app/data/portfolio/avatar.ts (ladder declaration), lib/videoRung.ts (selector rules).
- S-2 Rewrite §1 (inventory table) and §2 so they describe the live state: canonical /assets/my-hero-avatar.mp4 1280x720@24 1,916,328 B H.264 greyscale (base rung, default); /assets/avatar/my-hero-avatar-1080.mp4 and -2160.webm as on-demand rungs with their measured bytes/codecs; my-avatar.mp4 → 301; stills 1480x826 greyscale; the 640x360 orphan retired on 2026-09-05 (history note, not current state); R5 OPEN (24 fps). Keep §10 as is; add a one-line changelog entry at the top with the review id.
- S-3 Verify: grep -n '640x360\|160,156\|RETIRE' docs/architecture/ASSET-LADDER.md shows only the history note; markdown renders (no broken table pipes); node scripts/validate/overhaul_static_audit.mjs is unaffected (docs are not audited) — skip builds.
- S-4 Ledger (node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w1_lad1 --role coder --model claude-sonnet --prompt artifacts/kanban/tasks/t_w1_lad1.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w1-lad1 -- docs/architecture/ASSET-LADDER.md); commit 'docs(ladder): §1–2 describe the live rungs, not the retired orphan' with the two mandatory trailers; push worktree-w1-lad1.
- S-5 Return {task_id, branch, sha, pushed, push_denied, files_changed, gates:{stale_lines_gone, numbers_match_review, no_code_touched}, goal_complete}.

## QUALITY GATES
- Every number in §1–2 matches the review/§10; the orphan appears only as dated history
- No file other than ASSET-LADDER.md changed
- Ledger; pushed; ≤ 15 min

## VERIFICATION
```bash
grep -c '640x360' /root/forgotten-mistory/.claude/worktrees/w1-lad1/docs/architecture/ASSET-LADDER.md
git ls-remote --heads origin worktree-w1-lad1
```

## HIERARCHY
role_matrix: coding / documentation → level 4 → effort **medium (xhigh when coding)** (effort_cascade.yaml; depth_cap 4). Model: deepseek · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T02:10:44.427Z)
running — dispatched 02:11Z coder (documentation, medium)

## COMPLETE (2026-09-06T02:13:45.731Z)
coder-w1-lad1 (sonnet, medium, 2.6 min): 46accc4 pushed on worktree-w1-lad1 — §1/§2 rewritten to the live rungs (numbers re-measured with ffprobe/identify in the worktree; the orphan survives only as dated history). PM check on the branch: 640x360 appears 0 times, all under the RETIRED 2026-09-05 history marker (1). Consolidates next tick.

## COMMENT (2026-09-06T03:23:09.726Z)
Reviewer PASS on the raised defect (§1–2 truthful); F-3 residue (og-image row 1200x630/182,547 B vs live 2400x1260/209,035 B; greeting.txt 368 vs 384 B; §11 'untouched') → t_w1_doc2.
