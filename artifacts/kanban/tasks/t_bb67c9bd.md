# t_bb67c9bd — R10/R12 — contract test: every closed cycle has artifacts/kanban/cycles/<cycle>.json with PEA numerator/denominator, adversarial verdict, deploy commit and tools_used

**Status:** todo · **Priority:** 60 · **Parents:** t_cba10f82 · **Created:** 2026-09-05T06:20:06.758Z

## YOUR ROLE
coder — coding / documentation (docs/prompt.md §5). SPEC-v10.md c21 (the report files are written by the orchestrator every cycle; this task adds the guard). tests/cycle_reports.test.mjs (node --test): parse every artifacts/kanban/cycles/*.json — required keys {cycle, pea_numerator, pea_denominator: 25, adversarial_verdict, deploy_commit, tools_used (≥ 1 entry)}; a malformed file fails.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read an existing cycle file under artifacts/kanban/cycles/
- S-2 TDD: the test fails on a deliberately malformed temp file and passes on the real directory
- S-3 Add it to the checks.yml static-job node --test list; commit `test(pm): cycle reports carry PEA and tools`; push.

## QUALITY GATES
- [ ] red on malformed, green on real
- [ ] node --test green

## VERIFICATION
```bash
node --test tests/cycle_reports.test.mjs
```

## HIERARCHY
role_matrix: coding / documentation → level 4 → effort **medium (xhigh when coding)** (effort_cascade.yaml; depth_cap 4). Model: deepseek · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.
