# t_stab01 — Stability lane (continuity) — finish footer CLS reserve (t_2d068068), GLCanvas context-error containment TC-SKEW-02 (t_skew0002 / t_skew0001 clause), scene-local error boundary (t_e9d4e10f) from the paused worktrees

**Status:** todo · **Priority:** 90 · **Parents:** — · **Created:** 2026-09-05T12:19:26.429Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). §0 continuity: two paused worktrees hold partial work — wf_38db9d7d-ce3-1 (tests/perf/performance.spec.ts +126 lines, docs/delivery/evidence/v10-20260905T0515Z/F-stability/, no node_modules) and wf_d69fe804-9d9-1 (untracked tests/overhaul/scene-error-boundary.spec.ts). V-skew FAIL on one clause (0ece403): TC-SKEW-02 line 165 — a forced WebGL context-creation error escapes as an uncaught pageerror (containment holds: 6 sections, no error shell), deterministic 3/3. PERF-03 / TC-HERO-15: footer.Footer_footer layout shift ≈0.16 CLS at ≈508 ms under 2-worker load — reserve the footer box so CLS < 0.05 at 1440 and 390. Consolidate into ONE worktree (wf_38db9d7d-ce3-1 after `npm ci`; copy the untracked spec in from wf_d69fe804-9d9-1), finish, push.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 cd /root/forgotten-mistory/.claude/worktrees/wf_38db9d7d-ce3-1; git fetch origin; git merge --no-edit origin/main; npm ci --no-audit --no-fund; cp ../wf_d69fe804-9d9-1/tests/overhaul/scene-error-boundary.spec.ts tests/overhaul/ if main lacks it; read t_2d068068.md, t_skew0002.md, t_skew0001.md (COMMENT sections), t_e9d4e10f.md, components/gl/GLCanvas.tsx, components/gl/Scene.tsx, app/error.tsx, components/site/Footer* and its CSS module.
- S-2 Reproduce red: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5613 npx playwright test tests/overhaul/scene-error-boundary.spec.ts tests/perf/performance.spec.ts tests/e2e/hero.spec.ts -g 'SKEW-02|PERF-03|TC-HERO-15' --repeat-each=3 --workers=2` → 02-tests-failing.log.
- S-3 Implement: GLCanvas catches the context-creation failure and reports ONCE via console.error (never an uncaught pageerror, never a swallow without a log); the scene-local error boundary keeps all six sections rendered; footer gets a reserved box (min-height / explicit line box for the build-stamp line) so first paint == settled paint.
- S-4 Rerun the three specs 3/3 green under --workers=2; tsc; lint; audit 10/10; screenshots footer 1440/390 → 08-screens/ under F-stability/.
- S-5 Ledger (tasks t_stab01 + the three ids); commit `fix(stability): GL context errors contained and logged once; footer box reserved — CLS < 0.05 under load`; push branch worktree-wf_38db9d7d-ce3-1.

## QUALITY GATES
- TC-SKEW-01/02 green 3/3 (0 uncaught pageerrors, one console.error)
- PERF-03 + TC-HERO-15 green 3/3 under 2 workers; CLS < 0.05 at 1440 and 390
- scene-error-boundary spec green; tsc, lint, audit 10/10
- Ledger rows; branch pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5613 npx playwright test tests/overhaul/scene-error-boundary.spec.ts tests/perf/performance.spec.ts tests/e2e/hero.spec.ts -g 'SKEW|PERF-03|TC-HERO-15' --repeat-each=3 --workers=2
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T13:03:55.747Z)
ADD (reviewer 62e1e10): (a) p.Experience_openNote at 390 on /?gl=force measures 4.496:1 — give it margin (plate a shade darker than the #2A2A2A ceiling, or a shader groove) so one frame of shader phase cannot decide the gate; extend TC-CONTRAST-02 to require ≥ 4.6:1 worst-pixel on that node. (b) CLS 0.176 at 1280×720 measured with a preloader-Skip click — first re-measure on an unskipped boot (PerformanceObserver layout-shift, list sources), then reserve whatever shifts (footer per PERF-03, or the hero entrance). Priority raised to 96.

## STATUS (2026-09-05T13:04:41.179Z)
running — dispatched 13:04Z — analyst-programmer in the paused worktree wf_38db9d7d-ce3-1, port 5613; RECTIFY push rule (tsc/lint/build/audit gate, battery in parallel)

## COMPLETE (2026-09-05T13:29:44.437Z)
LANE COMPLETE 87c9667 (live a3edeff4 13:20Z) + evidence 0df240f: CLS root cause = app/loading.tsx styled-jsx rules never shipped in the static export → fallback 24 px tall, footer painted inside the fold then travelled ~11,600 px (single layout-shift entry, source footer.Footer_footer) → rules moved into globals.css → CLS 0.0000 / 0 entries at 1440, 1280, 390 on an unskipped boot under 6× throttle (was 0.156 / 0.176 / 0.256); TC-SKEW-02 3/3 (GLCanvas pre-flights a context on a detached canvas, one console.error per scene, nothing swallowed); PERF-03/03b + TC-HERO-15 3/3 under 2 workers; openNote on an --ink-900 plate → 6.20:1 on both paths (TC-CONTRAST-02 pin 4.6 with a liveness guard, self-caught regex bug fixed); removed the orphan MiniVicBot block that 735ea66's branch-wins merge had reinstated (6 tsc errors on main). 21 passed --repeat-each=3.
