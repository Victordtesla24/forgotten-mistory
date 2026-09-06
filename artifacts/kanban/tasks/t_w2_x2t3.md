# t_w2_x2t3 — Scene-7 instruments (tester) — reconcile the duration→spacing detector (implementer TC-SCENE-DESCENT-09 ρ 0.994 vs reviewer row-profile ρ 0.214 on live), fix the TC-STORY-DESCENT-02 'caption-only' contract (a 100vh sticky stage always intersects nav/launcher chrome and the 5 axis ticks) so it measures what a reader sees, and add the renderer-labelled fps record to the harness — no threshold lowered

**Status:** ready · **Priority:** 90 · **Parents:** t_w1_rev6 · **Created:** 2026-09-06T04:28:49.587Z

## YOUR ROLE
tester — testing / qa (docs/prompt.md §5). Two instruments disagree on the same live band (docs/delivery/evidence/v10-20260905T0515Z/G-REV/1ba16f90/03-scene7.json vs W2-X2/t_w2_x2s2 evidence): the implementer's TC-SCENE-DESCENT-09 (scene-descent.spec.ts) reads 9 edges with Spearman 0.994 against role durations at both widths; the reviewer's independent row-profile detector reads 10 edges but best-alignment ρ 0.214. Decide which measures the story (spacing proportional to duration, v2 §5): reproduce both on the export at the SAME scroll position/uDescent, print edge rows and the duration vector, and either fix the spec's detector (if it is reading the bars not the strata, or a fixed alignment) or file the shader defect for an AP with numbers. Second: TC-STORY-DESCENT-02 'caption-only over the canvas' counts persistent chrome (nav, launcher) and the 5 axis ticks that are part of the scene — redefine the assertion to exclude position:fixed chrome and the band's own ticks, keeping 'no heading/paragraph/CTA inside the stage' (v2 §2.4 intent), and say so in the spec. Third: the fps harness must emit the renderer string with every reading and refuse to print 'fps' for a software rasteriser (v2 §6.2).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w2-x2t3 from origin/main. One build / one browser; port 5634.
- S-1 Read v2 §5/§6.2, scene-descent.spec.ts (DESCENT-09/10), story-contract.spec.ts (DESCENT-02, EXP-02), the reviewer's 03-scene7.json + its probe, tests/perf/scene-framerate.spec.ts, components/sections/Experience/{CareerDescent.tsx,descent.glsl.ts}, app/data/portfolio/experience.ts.
- S-2 Reproduce both detectors on the export at identical uDescent (0.5) at 1440 and 390; capture → W2-X2/t_w2_x2t3/01-detectors.log with edge rows, gaps, durations, ρ for each.
- S-3 Fix the instrument that is wrong (with the reason in the spec) or file the AP follow-up with numbers; rewrite DESCENT-02 as specified; add the renderer label + software-rasteriser refusal to the harness.
- S-4 Verify: scene-descent, story-contract -g DESCENT, scene-framerate (Tier A labelled) green serially; tsc; lint; audit 10/10.
- S-5 Ledger; commit 'test(experience): descent instruments reconciled; caption-only contract measures the stage, not the chrome; fps readings carry the renderer' with the two mandatory trailers; push worktree-w2-x2t3.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, detector_verdict:'spec|reviewer|shader', rho_1440, rho_390, followups:[…], gates:{reproduced_both, specs_green, tsc, lint, audit_10_10, no_threshold_lowered}, evidence:[], goal_complete}.

## QUALITY GATES
- Both detectors reproduced on the same state; the disagreement explained with numbers
- No threshold lowered; contract rewrite justified in the spec; fps never printed for SwiftShader
- tsc · lint · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-x2t3
```

## HIERARCHY
role_matrix: testing / qa → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
