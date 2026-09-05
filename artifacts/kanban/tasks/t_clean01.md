# t_clean01 — O3/O4 hygiene — remove merged, clean worktrees and prune gone branches; keep every worktree that still holds uncommitted or unpushed work

**Status:** todo · **Priority:** 60 · **Parents:** — · **Created:** 2026-09-05T13:15:01.019Z

## YOUR ROLE
cleanup-agent — cleanup (docs/prompt.md §5). 27+ worktrees under /root/forgotten-mistory/.claude/worktrees/ after the ADV-FAIL waves. Every lane branch is consolidated into main and deleted on the remote by deploy.yml (`git ls-remote --heads origin` = main only when idle). Remove a worktree ONLY IF: its branch is fully contained in origin/main (`git merge-base --is-ancestor <branch> origin/main`), `git -C <wt> status --porcelain` is empty (ignoring out/, .next/, node_modules/), and no agent process has it as cwd (`ls -l /proc/*/cwd 2>/dev/null | grep <wt>` empty). NEVER touch: the main checkout, worktrees with dirty files, worktrees whose branch has commits not in origin/main, or any worktree named in a RUNNING board task (t_stab01 → wf_38db9d7d-ce3-1; t_g_s1 battery → wf_c06ca2f9-9de-1 until its agent exits; t_g_h1c / t_g_m3 → their fresh wf_* worktrees). Also kill orphaned `python3 -m http.server 56xx --directory out` processes whose cwd is a removed worktree, and `git worktree prune` + `git branch -d` for merged local branches. Log every removal with the evidence checks in docs/delivery/evidence/v10-20260905T0515Z/HYG-worktrees/01-removals.log.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 inventory: for each worktree print branch, ahead-of-origin/main count, dirty count, cwd-holders
- S-2 remove only those passing all three checks (`git worktree remove <wt>` then `git branch -d <branch>`); `git worktree prune`
- S-3 kill orphan static servers (fuser -k <port>/tcp, one command each) whose cwd no longer exists
- S-4 write 01-removals.log (kept vs removed with reasons); commit on a fresh branch (docs only) and push

## QUALITY GATES
- No worktree with dirty or unpushed work removed (log proves each check)
- No running lane's worktree touched
- git worktree list shrinks; git branch --list shows only main + live lanes

## VERIFICATION
```bash
git -C /root/forgotten-mistory worktree list | wc -l
git -C /root/forgotten-mistory branch --list | wc -l
```

## HIERARCHY
role_matrix: cleanup → level 4 → effort **medium** (effort_cascade.yaml; depth_cap 4). Model: claude-sonnet · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
