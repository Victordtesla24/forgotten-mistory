# t_ci_verify01 — O3 — deploy.yml live-verify step fails on curl exit 23 (EPIPE from awk early-exit) while the deploy succeeded — make the check deterministic

**Status:** todo · **Priority:** 96 · **Parents:** — · **Created:** 2026-09-05T12:17:08.269Z

## YOUR ROLE
coder — coding / documentation (docs/prompt.md §5). Deploy run 33965475659 (workflow_dispatch 12:14:24Z, HEAD 9ba97a5c) deployed hosting successfully, then the step 'Verify the live page carries the deployed commit' died with `curl: (23) Failure writing output to destination` — under `set -euo pipefail`, `live="$(curl … | awk '… exit')"` fails whenever awk exits before curl finishes writing (EPIPE race). The live page DID serve 9ba97a5c. This is an O3 flaky blocker: a healthy deploy reported as failure. Fix the step so it never depends on pipe timing (curl to a temp file with `-o`, then parse the file; keep the 12×10 s retry, keep the exact-prefix comparison; compare the short 8-char commit as the meta prints it), and add a regression check to the existing pipeline-robustness test so the pattern cannot return.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read .github/workflows/deploy.yml (the Verify step ~lines 98-115), the gh log of run 33965475659 (`gh run view 33965475659 -R Victordtesla24/forgotten-mistory --log-failed`), and the existing pipeline test(s): `grep -rln 'deploy.yml' tests/*.mjs scripts/validate/*.mjs` (ci_pipeline_robustness or similar).
- S-2 TDD: extend that node:test with an assertion that the Verify step contains no `curl … |` pipe inside a `$( )` under pipefail (assert it writes to a file via `-o` and parses the file), and that the step still retries and compares the build-commit meta. Run → RED (capture to docs/delivery/evidence/v10-20260905T0515Z/CI-verify/02-tests-failing.log).
- S-3 Implement in deploy.yml: `tmp=$(mktemp); for _ in $(seq 1 12); do if curl -fsS --max-time 20 -o "$tmp" https://forgotten-mistory.web.app/; then live=$(grep -o 'name="build-commit" content="[0-9a-f]*"' "$tmp" | head -1 | sed 's/.*content="//; s/"$//'); …fi; sleep 10; done` — semantics unchanged (prefix match of expected sha against live), no `|| true` that would mask a real mismatch, no reduction of retries. Do not touch any other step (O3: the deploy path stays gate-free).
- S-4 Run the node:test → GREEN (04-tests-passing.log); `npx tsc --noEmit` untouched (no TS change) — skip; validate YAML: `python3 -c "import yaml,sys;yaml.safe_load(open('.github/workflows/deploy.yml'))"` or `node -e` with js-yaml if available; ledger rows; commit `ci(deploy): live-verify reads curl output from a file — no EPIPE false failures (O3)`; push branch.

## QUALITY GATES
- node:test red → green
- deploy.yml still: consolidate every branch → push main → npm ci → firebase deploy → verify live prefix match with 12×10 s retry
- No `curl … | awk` inside `$( )` in the Verify step; YAML parses
- Ledger rows; branch pushed

## VERIFICATION
```bash
node --test tests/ci_pipeline_robustness.test.mjs 2>/dev/null || node --test $(grep -rln 'deploy.yml' tests/*.mjs | head -1)
grep -n -c 'curl -fsS --max-time 20 -o' .github/workflows/deploy.yml   # ≥1
gh run list -R Victordtesla24/forgotten-mistory --workflow=deploy.yml --limit 3
```

## HIERARCHY
role_matrix: coding / documentation → level 4 → effort **medium (xhigh when coding)** (effort_cascade.yaml; depth_cap 4). Model: deepseek · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:17:08.408Z)
running — dispatched 12:1xZ — coder (xhigh while coding) in an isolated docs/yml-only worktree

## COMMENT (2026-09-05T12:22:18.277Z)
Pushed 6f59312 on worktree-wf_22129a5e-0d0-1 — orchestrator reviewed the diff: curl -o mktemp file + grep -m1 parse, 12×10 s retries, prefix match, exit 1 on exhaustion preserved; test extended with 10 assertions (red→green logs in CI-verify/). Consolidating via Deploy dispatched 12:21:42Z; the fixed step takes effect on the run AFTER that one — close when a subsequent Deploy run passes Verify.

## COMPLETE (2026-09-05T12:25:22.920Z)
VERIFIED on production pipeline: Deploy run 33965890266 (dispatched 12:23:17Z, after 6f59312 consolidated into main as f4c4dbb5) executed the NEW verify step (log shows tmp="$(mktemp)" and curl -fsS --max-time 20 -o) and concluded success; live now 0c6f9f9f. Orchestrator reviewed the diff independently (no pipe, 12×10 s retries, prefix match, exit 1 preserved; test 12/12 with red-first evidence in CI-verify/). O3 flaky blocker removed.
