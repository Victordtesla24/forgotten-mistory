# t_c3ece39c — Hygiene — remove the two superseded worktrees + /var/tmp/v6-wt once cycles 11/13 are on main; remote = main only

**Status:** todo · **Priority:** 60 · **Parents:** t_62c9ee4d, t_8cdf3b61 · **Created:** 2026-09-05T05:58:06.011Z

> Continuity: Hermes t_c3ece39c (ready) — first half executed 05:22Z (decision.md).

## YOUR ROLE
cleanup-agent — cleanup (docs/prompt.md §5). decision.md (HYG-branches) already abandoned wt/data-backend and pruned 5 worktrees/4 branches. Left: .claude/worktrees/wf_7658aeb2-d07-1 (base 4f1d659, superseded by wf_18f926b0-2a4-2) and wf_dc0c232e-59d-1 (base 0c02861, superseded by wf_18f926b0-2a4-1); empty dir /var/tmp/v6-wt.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Preconditions (verify, do not assume): `git log --oneline -3 origin/main` contains the C13 and C11 commits; live build-commit meta equals origin/main HEAD.
- S-2 Archive each superseded diff first: `git -C <wt> diff > docs/delivery/evidence/v10-20260905T0515Z/HYG-branches/<name>-superseded.patch` (both), then `git worktree remove --force <wt>` and `git branch -D worktree-wf_7658aeb2-d07-1 worktree-wf_dc0c232e-59d-1`.
- S-3 `rmdir /var/tmp/v6-wt` (must be empty — `ls -A` first). `git worktree prune`.
- S-4 After the pipeline consolidates: `git ls-remote --heads origin` → refs/heads/main only; `gh pr list --state open` → empty; local `git branch` → main + only live council worktree branches.
- S-5 Append the actions + outputs to docs/delivery/evidence/v10-20260905T0515Z/HYG-branches/decision.md (section "Run v10 cycle H-2").

## QUALITY GATES
- [ ] both superseded diffs archived as .patch before removal
- [ ] remote heads == main only
- [ ] 0 open PRs
- [ ] no detached-HEAD worktrees
- [ ] nothing removed that is ahead of main (git rev-list --count main..<branch> == 0 proven)

## VERIFICATION
```bash
git worktree list
git branch -a
git ls-remote --heads origin
gh pr list --state open
```

## HIERARCHY
role_matrix: cleanup → level 4 → effort **medium** (effort_cascade.yaml; depth_cap 4). Model: claude-sonnet · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T06:20:07.208Z)
Also: CLAUDE.md says 276 Playwright tests; the suite reports 288 (V-C13 finding V-5) — correct CLAUDE.md and README in the same hygiene commit.

## COMMENT (2026-09-05T06:32:27.806Z)
Also move docs/delivery/evidence/v9-20260904T2312Z/C11-vitrine-integration/apply_edits.py under v10-20260905T0515Z/C11-vitrine-integration/ (misfiled, V-C11 F-4).
