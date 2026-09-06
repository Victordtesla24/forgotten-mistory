# t_g2_v3 — ADV-1451Z P0 — G-V3 Vitrine mechanism drawings read as visualisation: effective stroke contrast ≥ 4.5:1 on every plate (or replace the drawings); vitrine-field sceneId already live

**Status:** todo · **Priority:** 98 · **Parents:** — · **Created:** 2026-09-05T14:57:52.967Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ADV-REVIEW-20260905T1451Z §Vitrine: hairline SVG strokes at 0.16–0.35 element opacity (≈1.4–2.4:1 effective) are unreadable as a visualisation (P1→P0 in the backlog). The sceneId half (vitrine-field) shipped in 192d743 (live ff67273b, reviewer probe t_rev_s56 running). Acceptance: on every one of the six plates at rest, the drawing’s effective stroke contrast against the plate ground ≥ 4.5:1 for the primary strokes (measure composited pixels: stroke colour × stroke-opacity × element opacity × plate opacity over the ground), labels ≥ 4.5:1, with the lit plate still heavier; keep the authored tonal hierarchy (guide lines may be secondary but ≥ 3:1); reduced motion identical; the t_vit_desc01 finding (description 1.12:1 mid-entrance flake) fixed in the same lane. Tokens only; no gold beyond live-URL plates.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read Drawings.tsx (per-element opacity), Drawings.module.css (stroke-opacity .5 at rest), Vitrine.module.css (.plate opacity .62), the reviewer report §Vitrine, t_vit_desc01.md.
- S-2 TDD: extend tests/overhaul/scene-vitrine.spec.ts — composited stroke contrast per plate ≥ 4.5:1 (primary), labels ≥ 4.5:1, description never below AA during entrance (sample at t=0/300/600 ms); RED.
- S-3 Implement: raise stroke-opacity / plate opacity / stroke colour (currentColor → --white) and the description ground; verify the lit plate remains heavier and text-contrast stays green.
- S-4 PUSH RULE → then scene-vitrine + text-contrast (both paths) + monochrome → follow-up evidence with 1440/390 screenshots of the rail at rest.

## QUALITY GATES
- All six plates: primary strokes ≥ 4.5:1, labels ≥ 4.5:1 at rest (composited); lit plate heavier; description ≥ 4.5:1 through the entrance
- scene-vitrine, text-contrast, monochrome green; audit 10/10; ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5630 npx playwright test tests/overhaul/scene-vitrine.spec.ts tests/a11y/text-contrast.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T14:58:24.349Z)
ADD (reviewer t_rev_s56, live ff67273b): vitrine-field peak at 390 gl=force = 0.2918 vs floor 0.35 (TC-FLAGSHIP-VIS-VITRINE @390 red on main) — the 390 branch of vitrine.glsl.ts spreads rather than concentrates; raise the core to peak ≥ 0.40 at 390 without dimming 1440; correct the overclaiming SCENES comment in tests/overhaul/flagship-visibility.spec.ts:152-163. Same lane as the stroke-contrast work (same files).

## STATUS (2026-09-05T14:58:24.454Z)
running — dispatched 14:59Z — one implementer lane (analyst-programmer xhigh, isolated worktree, port 5629); load 9.4, Chrome-heavy count 2 with this

## COMMENT (2026-09-05T15:10:14.013Z)
ADD: the shader lane's worktree battery (b0e038b evidence 05-regression) had vitrine-field failing floors at BOTH widths and listen-field too — under load 11. Live reviewer (ff67273b) found only vitrine@390 red and listen thin (motion 1.07×). When you raise the 390 core, also give the 1440 peak/motion real margin (≥ 1.3× the floor) and record load with your measurements.

## COMMENT (2026-09-05T15:20:06.097Z)
15:17Z independent live measurement on ce3ab346 (t_rev_s7): vitrine-field @390 peak 0.3325 < 0.35 (coverage 0.6798, motion 0.01778), up from 0.2918 on ff67273b; coupled to #vitrine worst AA 4.69:1 (x1.04) — clearing the peak must not spend the AA margin. Still red on live.

## COMMENT (2026-09-05T16:57:52.906Z)
1556Z reclaim — prior swarm stopped. Live rest-plate strokes still 3.60-4.24:1 despite origin stroke-opacity 0.9. Re-dispatch fresh AP identity. Measure composited pixels.

## STATUS (2026-09-05T16:57:52.962Z)
ready — 1556Z reclaim then re-dispatch

## COMMENT (2026-09-05T16:58:32.857Z)
1556Z DISPATCH NOW fresh identity. Composited rest-plate primary strokes >=4.5:1. Plate rest opacity 0.62 x stroke-opacity 0.9 is NOT enough (live 3.60-4.24). Port 5642. origin/main worktree only.

## STATUS (2026-09-05T16:58:33.625Z)
running — dispatched

## COMMENT (2026-09-05T17:11:57.314Z)
PUSHED 6b1ad3d on worktree-gv3-1556. Plate rest 0.62→0.82. NOT live PASS until measured ≥4.5:1 on production.

## COMMENT (2026-09-05T17:22:09.762Z)
LIVE candidate b0513692 should include 6b1ad3d plate 0.82. Independent reviewer dispatching.

## COMMENT (2026-09-05T17:41:11.943Z)
INDEPENDENT REVIEWER FAIL on live b0513692 (t_rev_adv1556): plate opacity 0.82 shipped but composited pixels not certifiable; plates 3 and 6 no measurable primary stroke; 0.75px hairline AA may drop below 4.5:1. CORRECTION: thicken rest primaries, ensure all six plates have measurable strokes, supply per-plate pixel evidence.

## COMMENT (2026-09-05T17:53:49.640Z)
1556Z reclaim stalled worktree-gv3-corr-1556 (clean, behind origin, no commit). New identity ap-gv3-c2-58d9 from origin/main. CORRECTION: thicken rest primaries; all six plates measurable composited ≥4.5:1; plates 3 and 6 must have primary strokes; 0.75px hairline AA may drop ~3.1:1.

## COMMENT (2026-09-05T18:11:01.770Z)
47b6f0e G-V3 correction is on live 0892d092. Stale evidence PASS on 8d772fb9 is NOT this commit — do not complete. Duplicate AP ap-gv3-c2-58d9 cancelled. Fresh reviewer measures composited strokes on 0892d092.

## COMMENT (2026-09-05T18:12:46.951Z)
Independent reviewer 07a59ecc PASS on live 8d772fb9 (not current live): composited rest primary 9.73:1, label 9.31:1, guide 10.46:1, lit primary 18.16:1. Evidence docs/delivery/evidence/v10-20260905T0515Z/G-REV/8d772fb9/G-V3.md. HOLD t_g2_v3 open until rev-0892d092-c18 confirms the same floors on live 0892d092 (includes later correction 47b6f0e). Do not complete on 8d772fb9 while live has moved.

## COMMENT (2026-09-05T18:13:59.274Z)
Author 1e134d11 shipped 47b6f0e (already live on 0892d092): .primary 1.7px full-opacity white (claimed 8.97:1 rest), .guide 1.4px/0.7 (3.60:1), .label 0.9; plates 3 and 6 now have primary <line>/<circle>. Sampler scripts/testing/vitrine-plate-contrast.mjs is source-token composite, not live CDP. Do not complete on this self-report. Independent close remains rev-0892d092-c18 on https://forgotten-mistory.web.app/ (build-commit 0892d092).

## COMPLETE (2026-09-05T18:31:46.981Z)
INDEPENDENT PASS live aa58395b: rest primary ~12:1 (worst gather ~5.8:1 ≥4.5), guide ≥3.8:1, label ≥4.8:1; 25 .primary across all six plates. Evidence G-REV/aa58395b/08-adversarial-review.md §3. Correction 47b6f0e ancestor. Not rubber-stamped 8d772fb9.
