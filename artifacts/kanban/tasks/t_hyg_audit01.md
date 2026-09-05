# t_hyg_audit01 — O4 hygiene — stop committing the generated reports/static-audit.json (every lane rewrites it → every consolidation is a forced 'branch wins conflicts' merge)

**Status:** todo · **Priority:** 85 · **Parents:** — · **Created:** 2026-09-05T12:33:05.199Z

## YOUR ROLE
coder — coding / documentation (docs/prompt.md §5). scripts/validate/overhaul_static_audit.mjs:609 rewrites reports/static-audit.json on every run (timestamps + per-build numbers), each lane commits it, and deploy.yml then hits a conflict on every consolidation and resolves it with `-X theirs` / checkout --theirs (seen on 843b679d: 'merge worktree-wf_b908a7a9-f5d-2 into main (branch wins conflicts)'). A forced merge is a standing risk: if a real conflict coexists, the branch silently wins it. The report is a build artifact for CI upload (checks.yml) and is read by tests/static_audit_fail.test.mjs only after that test runs the audit itself. Untrack it.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read .gitignore, .github/workflows/checks.yml (artifact upload of reports/), tests/static_audit_fail.test.mjs:100-125, scripts/validate/overhaul_static_audit.mjs:570-612. Confirm nothing reads the COMMITTED file (only the freshly written one).
- S-2 TDD: extend tests/ci_pipeline.test.mjs (or tests/static_audit_fail.test.mjs — whichever already asserts repo hygiene) with `reports/static-audit.json is not tracked` (`git ls-files --error-unmatch reports/static-audit.json` must fail) and `.gitignore covers reports/static-audit.json`. RED first.
- S-3 Implement: add `reports/static-audit.json` to .gitignore; `git rm --cached reports/static-audit.json`; ensure overhaul_static_audit.mjs still `mkdir -p reports` before writing (REPORT_DIR creation) so a clean checkout runs; ensure checks.yml uploads it with `if-no-files-found: warn` (not error) if it is uploaded.
- S-4 `node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs` green; `node scripts/validate/overhaul_static_audit.mjs` still writes the report and passes 10/10; ledger; commit `chore(hygiene): untrack the generated static-audit report — no forced merges on every consolidation`; push branch.

## QUALITY GATES
- node:test red → green
- reports/static-audit.json untracked and ignored; audit still writes it; checks.yml unaffected or made tolerant
- Ledger rows; branch pushed

## VERIFICATION
```bash
git ls-files reports/static-audit.json | wc -l   # → 0
node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs
node scripts/validate/overhaul_static_audit.mjs | tail -3
```

## HIERARCHY
role_matrix: coding / documentation → level 4 → effort **medium (xhigh when coding)** (effort_cascade.yaml; depth_cap 4). Model: deepseek · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:41:28.859Z)
running — dispatched 12:41Z — coder, isolated docs/test worktree, no build

## COMPLETE (2026-09-05T12:46:43.776Z)
coder 5d22bca on worktree-wf_1790b40a-e53-1: reports/static-audit.json untracked (git rm --cached) + .gitignore:218; audit still writes it (mkdir at :578 precedes write at :609, pinned by test); checks.yml never uploaded it; docs/ci-audit-contract.md stale header corrected; ci_pipeline.test.mjs +4 assertions red→green (22/22). WATCH: lanes branched before 5d22bca (H1, S1) may still commit the file → modify/delete conflict resolved by checkout --theirs re-tracks it; orchestrator will git rm --cached on main if ci_pipeline.test.mjs goes red in checks.yml.
