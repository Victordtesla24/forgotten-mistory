# t_vit_desc01 — P1 — Vitrine plate description flashes 1.12:1 (light-on-light) mid-entrance at 1440 (TC-CONTRAST-02 caught it 1 in 3 runs)

**Status:** todo · **Priority:** 80 · **Parents:** t_g_v1 · **Created:** 2026-09-05T12:39:54.833Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Found by the flagship-C lane's new TC-CONTRAST-02 (WebGL path): p.Vitrine_description on the third plate ('An agent loop whose only exit is a signed verifier') measured fg rgb(213,213,212) on bg rgb(226,225,223) = 1.12:1 once in three runs at 1440 on both paths, green on the other two — the description is sampled mid-entrance over the plate's drawing/light. A flaky AA failure is a real intermittent legibility defect, not a test problem. Fix the composition (plate ground under the description, or the entrance order so text never sits on the light) and make the contrast walk deterministic for that node (wait for the plate's entrance to settle before sampling, without lengthening the whole suite).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Reproduce with --repeat-each=5 on tests/a11y/text-contrast.spec.ts -g 'CONTRAST-02 @ 1440' against a fresh build; capture the failing frame (test-results png) → 01-repro.
- S-2 TDD: pin the description's ground in scene-vitrine.spec.ts (computed background of the description's nearest plate ≥ AA against its text at rest AND at t=0 of the entrance).
- S-3 Fix in Vitrine.module.css / Drawings.module.css (plate ground or z-order), tokens only.
- S-4 5/5 green on both specs; monochrome; audit 10/10; ledger; commit `fix(vitrine): plate descriptions never sit on the light`; push.

## QUALITY GATES
- TC-CONTRAST-02 @1440 5/5 green; scene-vitrine green
- No gold, tokens only, audit 10/10
- Ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5615 npx playwright test tests/a11y/text-contrast.spec.ts tests/overhaul/scene-vitrine.spec.ts --repeat-each=5 --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T12:42:06.830Z)
ADD (from reviewer 843b679d + creative council): composited resting alpha of a plate's strokes is 0.31 (stroke .5 × plate opacity .62 pre-existing at Vitrine.module.css:170) and individual strokes go as faint as element opacity .07; council target: every plate reads as drawn work at ≥0.55 composite, the lit plate gains weight. Fold the resting-weight uplift into this task with the description-contrast fix (same files).
