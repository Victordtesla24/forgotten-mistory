# t_62c9ee4d — Cycle 13 — Next 15.5.25 security upgrade + checks.yml installs functions deps + .gitignore conflict markers

**Status:** running · **Priority:** 92 · **Parents:** — · **Created:** 2026-09-05T05:58:06.011Z

> Continuity: Hermes t_62c9ee4d (ready) — in-flight worktree found with the full battery run but no commit.

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Worktree .claude/worktrees/wf_18f926b0-2a4-1 (base 8dc4cf4). Battery already green there: tsc 0, lint 0, audit 10/10, build exit 0, secret scan PASS, root npm audit 0 vulns; regression log stopped at 243/276 (8 ✘, all in the CI-red list). Nothing committed yet.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

### STATE (observed by the orchestrator at 2026-09-05T05:58:06.011Z)
staged: .eslintrc.json app/not-found.tsx app/performance-benchmark/page.tsx package-lock.json package.json tsconfig.json · unstaged: .github/workflows/checks.yml .gitignore app/data/generated/build-stamp.ts reports/static-audit.json tests/ci_pipeline.test.mjs · untracked: docs/delivery/evidence/v10-20260905T0515Z/C13-next15/

## EXECUTION ORDER
- S-1 In /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1: `git status` must show the 6 staged + 5 unstaged files listed in artifacts/kanban/tasks/t_62c9ee4d.md §STATE; do not re-apply the patch.
- S-2 `git checkout -- app/data/generated/build-stamp.ts` (D-7: the null stamp never lands). Stage `.github/workflows/checks.yml`, `.gitignore`, `tests/ci_pipeline.test.mjs`, `reports/static-audit.json`.
- S-3 Re-run the four node contract files: `node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs tests/github-telemetry.test.mjs tests/minivic_chat_function.test.mjs` → append to docs/delivery/evidence/v10-20260905T0515Z/C13-next15/04b-node-tests.log.
- S-4 Commit on branch worktree-wf_18f926b0-2a4-1: `chore(deps): next 15.5.25 — audit clean, CI installs functions deps` (Conventional Commits, ≤72 chars, imperative). Body cites 07-decisions.md D-1…D-8.
- S-5 Finish the full regression to completion on :5601 (serve out/ built from the committed tree) → 05-regression-full.log overwritten with the complete run; list every ✘ with the proof it is pre-existing (compare against docs/delivery/evidence/v10-20260905T0515Z/00-run-manifest.json ci_checks_33936783382).
- S-6 Append D-9 (commit sha, regression totals) to 07-decisions.md; commit the evidence: `docs(evidence): C13 regression complete`.

## QUALITY GATES
- [ ] tsc 0 errors
- [ ] lint 0 errors
- [ ] static audit 10/10
- [ ] build:static exit 0 + secret scan PASS
- [ ] npm audit --audit-level=high: 0
- [ ] 276 specs run to completion; every ✘ named + proven pre-existing on main
- [ ] build-stamp.ts unchanged vs HEAD in the commit
- [ ] two commits on the branch, nothing uncommitted except out/

## VERIFICATION
```bash
git -C /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1 log --oneline main..HEAD   # 2 commits
git -C /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1 show --stat HEAD~1 | grep -c "package.json\|checks.yml\|.gitignore"   # 3
grep -c "✘" docs/delivery/evidence/v10-20260905T0515Z/C13-next15/05-regression-full.log
npx tsc --noEmit
npm run lint
node scripts/validate/overhaul_static_audit.mjs   # must print RESULT: ALL PASS (10/10)
npm run build:static
python3 -m http.server <PORT> --directory out --bind 127.0.0.1 &   # 5601 or 5602 — never 5599/8080 (foreign servers)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> npx playwright test   # 276 specs; every failure triaged with proof
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## DECISION (2026-09-05T06:01:51.406Z)
S-5/S-6 (full 276-spec regression) re-assigned to cycle 14 (t_d0066b7a) on the merged main so the unit fits the 30-min cap (O1) and the verified upgrade ships on the 10-min cadence; deterministic gates (tsc/lint/audit/build/npm audit/node tests) + independent verification remain the merge gate. Dispatched: Workflow wf_74bc3c5b-f9d (analyst-programmer:c13 opus xhigh → reviewer:v-c13 opus max).
