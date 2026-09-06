# t_w1_c1ap — WAVE-1 P0 — G-C1 implementation: one identical engagement product on Listen + Vitrine per t_w1_c1sa (tests first, ship visible)

**Status:** todo · **Priority:** 98 · **Parents:** t_w1_c1sa · **Created:** 2026-09-06T00:05:41.309Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Implements the solutions-architect decision recorded in docs/architecture/G-C1-HONEST-CTA.md §7 (ADV-2315Z). Live 9136bc59 fails G-C1 because Listen and Vitrine promise two different mailto products. After this task both engage plates carry the SAME label, subject, body and href (or the same named-env calendar URL if the SA found one). R4 client click-through must complete; employer path (Download CV) must not regress.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w1-c1 /root/forgotten-mistory/.claude/worktrees/w1-c1 origin/main && cd /root/forgotten-mistory/.claude/worktrees/w1-c1 && ln -s /root/forgotten-mistory/node_modules node_modules (if the symlink breaks the build, `npm ci`). If `df --output=avail -BG / | tail -1` < 6 GB, poll every 30 s up to 8 min before building.
- S-1 Read docs/architecture/G-C1-HONEST-CTA.md §7 (the SA decision — strings verbatim), then app/data/portfolio/listen.ts, app/data/portfolio/vitrine.ts, the Listen/Vitrine components that render the plates, tests/e2e/listen.spec.ts, tests/e2e/vitrine.spec.ts, tests/e2e/audience-paths.spec.ts, tests/content/content-check.spec.ts (tone linter expectations).
- S-2 TESTS FIRST: write exactly the TDD cases the SA named (node test in tests/engage_single_product.test.mjs asserting the two hrefs are byte-identical and decode to the same subject/body; e2e cases in tests/e2e/audience-paths.spec.ts / listen.spec.ts / vitrine.spec.ts for identical plates, R4 both paths, and forbidden wording). Run them on origin/main code and capture FAILING output to docs/delivery/evidence/v10-20260905T0515Z/W1-C1/02-tests-failing.log.
- S-3 Implement the smallest change: export the one engagement product from ONE module (e.g. a shared `engagement` in listen.ts re-used by vitrine.ts, or a new app/data/portfolio/engage.ts if the SA specified it) so the two surfaces cannot drift; update labels/subject/body verbatim; keep mailto length under the TC-LISTEN-CTA-02 limit.
- S-4 Verify: `npx tsc --noEmit` · `npm run lint` · `npm run build:static` · `node scripts/validate/overhaul_static_audit.mjs` (10/10) · `node --test tests/engage_single_product.test.mjs` · `python3 -m http.server 5602 --directory out &` then `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/e2e/audience-paths.spec.ts tests/e2e/listen.spec.ts tests/e2e/vitrine.spec.ts tests/content` (kill the server after). Screenshots of #listen and #vitrine engage plates at 1440 and 390 → docs/delivery/evidence/v10-20260905T0515Z/W1-C1/. Logs → 04-tests-passing.log, 05-regression.log.
- S-5 Ledger before commit: `git add -A` then `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w1_c1ap --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w1_c1ap.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w1-c1 -- <changed files>`. Commit `fix(engage): one engagement product on Listen and Vitrine (G-C1)` with trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC`; `git push -u origin worktree-w1-c1`. If denied once, report push_denied with sha.
- S-6 Return {task_id, worktree, branch, sha, pushed, push_denied, files_changed, label, subject, gates:{tests_failed_first, tsc, lint, build, audit_10_10, node_tests, e2e_targeted}, evidence:[], goal_complete}.

## QUALITY GATES
- Tests captured failing first
- Both plates: identical label, subject, body, href (node + e2e green)
- No Book / Start a project / booking wording (unless named-env calendar URL)
- tsc · lint · build · audit 10/10 · targeted e2e + content tests green
- Ledger rows before commit; pushed or push_denied reported
- ≤ 30 min

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w1-c1 && node --test tests/engage_single_product.test.mjs
cd /root/forgotten-mistory/.claude/worktrees/w1-c1 && grep -c 'Book\|Start a project' app/data/portfolio/listen.ts app/data/portfolio/vitrine.ts
git ls-remote --heads origin worktree-w1-c1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T00:53:34.239Z)
PM check 00:48Z: branch consolidated into origin/main and LIVE build-commit 56ffed3e (deploy cadence). Not done until independent reviewer t_w1_rev1 issues PASS on the live URL.

## COMPLETE (2026-09-06T01:15:35.042Z)
Independent live PASS (rev-56ffed3e-w1): Listen + Vitrine engage plates identical label/subject/body/href; no booking wording; R4 both paths hold. Live 56ffed3e via Deploy 34001200263/34001642667.
