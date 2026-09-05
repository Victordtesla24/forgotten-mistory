# t_dc02ded1 — D-C13 — merge cycle 13 into main, push, verify the live build-commit

**Status:** todo · **Priority:** 93 · **Parents:** t_3e553558 · **Created:** 2026-09-05T05:58:06.011Z

## YOUR ROLE
orchestrator — feedback_refactor_loop (docs/prompt.md §5). Orchestrator consolidation duty (O3/O4). git merge --no-ff worktree-wf_18f926b0-2a4-1 into main; git push origin HEAD:main; deploy.yml deploys; verify meta.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 `git merge --no-ff worktree-wf_18f926b0-2a4-1` on main (ledger rows appended first)
- S-2 `git push origin HEAD:main`
- S-3 `gh run watch` the Deploy run; then `curl -s https://forgotten-mistory.web.app/ | grep build-commit` == HEAD[0:8]
- S-4 Record in artifacts/kanban/cycles/

## QUALITY GATES
- [ ] ledger rows for every changed file
- [ ] live build-commit == main HEAD
- [ ] Deploy run success

## VERIFICATION
```bash
gh run list --workflow Deploy --limit 1 --json conclusion,headSha
curl -s https://forgotten-mistory.web.app/ | grep -o 'content="[0-9a-f]\{8\}"'
```

## HIERARCHY
role_matrix: feedback_refactor_loop → level orchestrator → effort **ultracode** (effort_cascade.yaml; depth_cap 4). Model: claude-fable-5-1 (ultracode) · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMPLETE (2026-09-05T06:21:18.245Z)
Merged 5ec231d (--no-ff) and pushed 06:15Z; Deploy runs 06:16:24Z + 06:18:14Z success; live build-commit meta = 5ec231d3 (curl 06:20Z). Ledger: 11 rows (0e690f1).
