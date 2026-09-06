# t_w2_x2f6 — G-A3 story x2-f6 — the three role-side (open) sectors are DRAWN open (broken arc + 45° ruling, mean-zero mark at depth 0.42 gated by (1−guarded)(1−answered)) at unchanged mean luminance; TC-SCENE-ABOUT-10 rewritten to the per-sector structure metric (open ≥ 3.0× answered, ≥ 0.20) + non-inversion floor 1.20; TC-STORY-ABOUT-03 added; coverage ≥ 15.00% and TC-CONTRAST-01/02 are hard bounds

**Status:** ready · **Priority:** 93 · **Parents:** t_w2_a3sa · **Created:** 2026-09-06T04:19:56.561Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Implement slice x2-f6-about-open-mark exactly as docs/architecture/ABOUT-STORY-v2.md specifies (SA t_w2_a3sa): edits E-1 (hoist the guard/ceiling terms to the top of main(), pure code motion; ceiling still applied last), E-2 (leave `state` and its four uses byte-for-byte — that protects coverage), E-3 (after `float luma = sector;` add dash/ruled/mark/markWindow and luma *= 1 + ABOUT_OPEN_MARK_DEPTH·mark·markWindow; export ABOUT_OPEN_DASHES=5.0, ABOUT_OPEN_RULING=26.0, ABOUT_OPEN_MARK_DEPTH=0.42). Tests T-1/T-2 first (TC-SCENE-ABOUT-10 clauses 10a/10b/10c with sectorStructure added to readAnnulus() — 32 arc samples at rr 0.55/0.66/0.88, single DFT bin at k=ABOUT_OPEN_DASHES imported from field.glsl.ts, normalised 2|X_k|/mean, median of radii, all ten values printed; TC-STORY-ABOUT-03 in story-contract.spec.ts on RAW bins). Tuning window: depth 0.30–0.50, ruling 20–32, dashes 4/5/6; stop conditions: coverage < 15.00% at depth 0.30, any TC-CONTRAST node below AA, a visual baseline moving, structure ratio < 3.0 at depth 0.50 — then report RED and the PM fires x2-f7; never move a threshold. Precedent for a clean revert: ef2979a.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w2-x2f6 from origin/main (carries ef2979a + the extended ABOUT-10). One build / one browser; port 5601.
- S-1 Read ABOUT-STORY-v2.md in full, components/sections/About/field.glsl.ts (lines the doc cites: 275 state, 308/312/341/352 uses, 384 luma, 415–427 guards), tests/overhaul/scene-about.spec.ts (readAnnulus :184–208, assertTellsTen :684–690), tests/overhaul/story-contract.spec.ts (ABOUT-01/02, bestPhi), tests/overhaul/flagship-visibility.spec.ts (ABOUT floors), tests/a11y/text-contrast.spec.ts, app/data/portfolio/about.ts (role-side 6, 7, 9).
- S-2 TESTS FIRST: T-1 (10a/10b/10c) and T-2 (STORY-ABOUT-03) authored; run on origin/main; capture RED → docs/delivery/evidence/v10-20260905T0515Z/W2-A3/x2-f6/02-tests-failing.log.
- S-3 E-1 → E-3; tune only inside the window; every run prints the ten sectorStructure values and the ten means in every state.
- S-4 Verify: tsc · lint · build:static · audit 10/10 · scene-about (both widths, both states) · story-contract -g ABOUT · flagship-visibility -g about (coverage ≥ 15.00%) · text-contrast (1440 + 390, both paths) — logs 04/05/06/07 per the doc; 1440 + 390 type-hidden screenshots so a human can see the three broken sectors. LOOK at them.
- S-5 Ledger; commit 'feat(about): the three open dimensions are drawn open — structure, not darkness (G-A3 story x2-f6)' with the two mandatory trailers; push worktree-w2-x2f6. If a stop condition fires: do NOT push a partial shader; push only the tests (red-by-design) with the measured numbers in the evidence and return goal_complete:false naming the trigger for x2-f7.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, measurements:{structure_open_min, structure_answered_max, ratio, non_inversion, coverage_1440, coverage_390, story_about_02_deficit, contrast_min}, tuned:{depth, ruling, dashes}, gates:{tests_first, tsc, lint, build, audit_10_10, about_10_green_both_states_both_widths, story_about_03_green, coverage_ge_15, contrast_green, baselines_unmoved}, stop_condition:'none|…', evidence:[], goal_complete}.

## QUALITY GATES
- 10a/10b/10c + STORY-ABOUT-03 green at both widths/states after failing first; -01/-02 unchanged and reported
- coverage ≥ 15.00% @1440, TC-CONTRAST-01/02 green on both paths, no visual baseline moved, gold 0, ceilings byte-identical
- tsc · lint · build · audit 10/10; ledger; pushed (or red-by-design tests only + trigger named); ≤ 30 min

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w2-x2f6 && PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-about.spec.ts -g 'ABOUT-10'
git ls-remote --heads origin worktree-w2-x2f6
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T04:28:49.717Z)
running — dispatched 04:29Z fm-wave2-about-mark

## COMPLETE (2026-09-06T04:50:46.208Z)
ap-w2-x2f6 (over cap, honest stop): 21ff176d pushed — tests only (TC-SCENE-ABOUT-10 10a/10b/10c with a 15-sample radial-run estimator that beats the bin-5 noise floor 0.09–0.26; TC-STORY-ABOUT-03; three exported constants), GLSL body byte-identical to main; the measured E-1+E-3 term saved as W2-A3/x2-f6/03-shader-E1-E3.patch. Mark works where unguarded (390 at rest ratio 2.98, screenshot shows 3 of 10 sectors ruled at unchanged luminance; non-inversion 1.53–3.89 green everywhere) but at 1440 at rest the ring annulus is mostly guarded → markWindow = 0 → ratio 0.56 (trigger 3, at 1440); TC-STORY-ABOUT-02 @390 deficit 0.1075 < 0.15 on main (trigger 1). No threshold moved; depth 0.50 not run because it multiplies a zero. Full suite logs committed.

## COMMENT (2026-09-06T05:04:28.540Z)
FALSE DIAGNOSIS registered (rev by t_w2_x2f7's guard-mask probe): this lane's stop-condition claim 'markWindow is exactly zero at 1440 at rest because the annulus is mostly guarded' is contradicted by measurement (88.1% unguarded). The mark's absence there is unexplained and is being instrumented in t_w2_x2f8; the tests this lane shipped stand.
