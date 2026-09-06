# t_g2_h1 — ADV-1451Z P0 — G-H1 (restated, R1 bar) hero first fold: brand-strong composition with a DOMINANT visual plane (the GL atmosphere/poster as the frame, not a backdrop to a two-column résumé), ≤1 headline, ≤1 sentence, ≤1 CTA group — design brief + first visible slice

**Status:** todo · **Priority:** 95 · **Parents:** — · **Created:** 2026-09-05T14:57:53.510Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). The 1451Z review passes the fold’s density clauses (our G-H1 PASS stands) but fails the INTENT: “polished hire landing, not cinematic stage; brand ‘VIKRAM.’ is chrome; H1 dominates”. This is the R1/§14 bar. (A) solutions-architect ≤ 20 min: a one-page composition brief docs/architecture/HERO-FOLD-v2.md — how the fold reads as a set piece: the atmosphere/poster as the dominant plane (≥ 75% of the fold’s visual weight measured by luminance-weighted area), the name as a brand mark (typographic scale/tracking, single line), the photograph integrated INTO the plane (not a framed card beside a column — e.g. masked into the light, or the pool shaped around it), the CTA group as one quiet bar; keep every live gate (CT-10 via the proof band, AA plates, CLS 0, LCP, keyboard) and the B/W+gold palette (the colour photo question → t_g2_h6 decision); acceptance tests per clause; then TASKS JSON (≤ 30-min slices) for analyst-programmer lanes; (B) first visible slice dispatched from that JSON.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read Hero.tsx/Hero.module.css/HeroPortrait/atmosphere.glsl.ts, the poster, G-REV creative directions (#hero), the 1451Z review §Hero.
- S-2 Write HERO-FOLD-v2.md + HERO-TASKS.json; push docs branch.

## QUALITY GATES
- Brief names measurable acceptance per clause (dominant-plane ≥ 0.75, brand mark metrics, one CTA bar) and preserves all live gates
- Tasks JSON validates (§5 profiles, verify commands)

## VERIFICATION
```bash
python3 -c "import json;json.load(open('docs/architecture/HERO-TASKS.json'))"
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T14:58:24.501Z)
running — dispatched 14:59Z — solutions-architect max, docs-only worktree (no Chrome)

## COMPLETE (2026-09-05T15:20:05.902Z)
15:17Z docs-only brief delivered and consolidated: docs/architecture/HERO-FOLD-v2.md + HERO-TASKS.json (53c9dec, live d4090a0+). SPD acceptance metric (>=0.75, ship 0.78), D-1..D-7. Imported to the board as t_h2_01..t_h2_07; t_h2_01 (SPD instrument, tester) and t_h2_02 (retire desktop half-frame scrim — first visible slice) dispatch in parallel.

## STATUS (2026-09-05T16:57:52.502Z)
ready — 1556Z reopen — live still FAIL G-H1 two-column résumé; docs HERO-FOLD-v2 are not live PASS

## COMMENT (2026-09-05T16:57:52.549Z)
1556Z: architecture brief exists on origin; live first-fold still CV pitch. Dispatch researcher + AP t_h2_03/t_h2_04 for VISIBLE fold. Do not mark PASS on markdown.

## COMMENT (2026-09-05T16:58:33.246Z)
1556Z DISPATCH researcher + AP t_h2_03 (parent t_h2_02 now done).

## STATUS (2026-09-05T16:58:33.915Z)
running — dispatched researcher+AP

## COMMENT (2026-09-05T17:19:17.334Z)
Researcher fbfec0e on main. AP t_h2_03 dispatched cf7a0683.

## COMMENT (2026-09-05T17:53:50.109Z)
H1 name-as-mark e4634aa is on live 58d9c111. Photo-into-plane t_h2_04 still in flight. Do not mark G-H1 done on self-report.

## COMMENT (2026-09-05T17:58:40.660Z)
t_h2_04 pushed c917af04 awaiting cadence consolidate + live reviewer. t_h2_03 e4634aa already on live 58d9c111. Do not mark G-H1 done.

## COMMENT (2026-09-05T18:34:14.311Z)
C19 left G-H1 OPEN (not re-verified). Photo-into-plane c917af0 is ancestor of live 64404134. Focused reviewer rev-64404134-open dispatched. Do not complete on AP self-report.

## COMPLETE (2026-09-05T19:32:50.340Z)
PASS live 64404134. Hero_stage frac=1.000 first viewport; photo my_avatar.avif 547x305 in plane; ledger top=1104 below fold 900; colour photo retained. https://forgotten-mistory.web.app/ build-commit 64404134 · independent rev-64404134-c22 · docs/delivery/evidence/v10-20260905T0515Z/G-REV/64404134/08-adversarial-review.md + verdicts.json

## COMMENT (2026-09-06T00:00:28.377Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:29.523Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
