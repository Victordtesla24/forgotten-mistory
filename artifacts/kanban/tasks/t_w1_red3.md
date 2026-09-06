# t_w1_red3 — Two more pre-existing failures surfaced by t_w1_a3 (verified on origin/main and on LIVE): TC-ABOUT-07 'complete without WebGL' intermittently sees 1 canvas because useGLCapability.ts's SwiftShader appeal admits the software rasteriser on an idle host; flagship-visibility 'listen beat field' motion gate fails on live (0.00142 < 0.004) — root-cause and fix without weakening

**Status:** ready · **Priority:** 86 · **Parents:** — · **Created:** 2026-09-06T01:47:22.770Z

## YOUR ROLE
tester — testing / qa (docs/prompt.md §5). Evidence: docs/delivery/evidence/v10-20260905T0515Z/W1-A3/05-baseline-build.log and 05-listen-preexisting-live.log (from t_w1_a3). (1) tests/e2e/about.spec.ts TC-ABOUT-07 expects 0 canvases without WebGL; components/gl/useGLCapability.ts appeals a SwiftShader context when the host is idle, so the no-GL contract is nondeterministic — decide the honest contract (a no-WebGL test must force capability off, e.g. via ?gl=off or a documented query, rather than depend on host idleness) and make useGLCapability deterministic under that flag. (2) tests/overhaul/flagship-visibility.spec.ts 'listen beat field' motion floor 0.004 vs live 0.00142: determine whether the listen field's motion genuinely fell below the flagship bar (then the field needs its motion restored — an analyst-programmer follow-up, filed by you with numbers) or whether the instrument measures the wrong window (then fix the instrument). Never lower 0.004 to pass.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w1-red3 from origin/main (.claude/worktrees/w1-red3, node_modules symlink). One build / one browser.
- S-1 Reproduce both on the export (:5620) and on live; capture → W1-RED3/01-reproduction.log.
- S-2 Root-cause each per the summary; implement the test/instrument fix or file the exact AP follow-up with measured numbers (kanban comment text in your result).
- S-3 Verify: the two specs green (or the AP follow-up documented) + tests/e2e/about.spec.ts + tests/overhaul/flagship-visibility.spec.ts + scene-about.spec.ts serially; tsc · lint · audit 10/10.
- S-4 Ledger; commit 'test(gl,listen): deterministic no-WebGL contract; listen motion instrument' with the two mandatory trailers; push worktree-w1-red3.
- S-5 Return {task_id, branch, sha, pushed, push_denied, files_changed, root_causes:{ABOUT_07:'…', LISTEN_MOTION:'product|instrument'}, followups:[…], gates:{reproduced, specs_green_or_followup_filed, tsc, lint, audit_10_10}, evidence:[], goal_complete}.

## QUALITY GATES
- Both reproduced first
- No threshold lowered; no test deleted or skipped
- Deterministic no-GL contract documented in the test and in useGLCapability.ts
- tsc · lint · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w1-red3
```

## HIERARCHY
role_matrix: testing / qa → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMPLETE (2026-09-06T03:16:59.635Z)
tester-w1-red3: a2891fc pushed on worktree-w1-red3 (consolidating). TC-ABOUT-07 = test defect: it inferred no-WebGL from SwiftShader, but useGLCapability's projectedFrameMs appeal admits the software rasteriser on an idle host — fixed by an explicit contract: ?gl=off answers 'unsupported' before any context (off beats force), spec asks for that page; appeal path untouched. LISTEN_MOTION = PRODUCT defect: the instrument is sound (about field measures 0.00877/0.01749 on the same spec/host; listen 0.00050/0.00061 export, 0.00142/0.00384 live vs 0.004): after the 1.16 s beat uClose holds and the field's remaining terms never clear the bar inside 1.5 s → AP follow-up t_w2_l1m. ~45 min (cap 30) reported.
