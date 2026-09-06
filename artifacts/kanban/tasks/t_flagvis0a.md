# t_flagvis0a — OWNER CORRECTION 09:10Z — flagship visibility A: hero atmosphere, About compass field, Experience strata become unmistakable cinematic light scenes (measurable luminance + motion gate), text contrast preserved

**Status:** running · **Priority:** 99 · **Parents:** — · **Created:** 2026-09-05T09:16:20.775Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Owner: I still cannot see flagship UI/UX for each section. Orchestrator confirmed on live captures (c76459d0, 1440, gl=force): hero faint, About field invisible, Experience strata invisible. The quiet/text-primary bar is revoked for these scenes. Gate: tests/overhaul/flagship-visibility.spec.ts — scene-only capture ≥ 15% pixels at L ≥ ground+0.06, max L ≥ 0.35, motion between captures, reduced-motion static fallback visible, TC-CONTRAST-01 green. Lane wf flagship-visibility-a (port 5602/5604).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 visibility spec (red numbers per section)
- S-2 hero → about → experience, commit + push per section
- S-3 verifier judges visibility by eye + numbers

## QUALITY GATES
- [ ] visibility spec green for the three sections
- [ ] TC-CONTRAST-01 green
- [ ] reduced motion static; no-GL still visible
- [ ] verifier PASS

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/overhaul/flagship-visibility.spec.ts tests/a11y/text-contrast.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T10:11:52.983Z)
SHIPPED via pipeline consolidation (39f4211, 8f81ae8) and LIVE on 8f81ae86 at 10:1xZ: 9fd78ef feat(hero) volumetric light the visitor can actually see; c6bf7ff feat(about) ten luminous sectors; b200958 feat(experience) sediment strata with real weight; a78d9f0 fix(scenes) scrims protect the copy. Live probe 0 errors, canvases mount at 1440/390. Verifier lane still running; orchestrator visual check in progress.

## COMMENT (2026-09-05T10:12:39.733Z)
ORCHESTRATOR VISUAL CHECK on live 8f81ae86 (1440, gl=force): HERO — volumetric light shafts + fog + particle glints, a bright pool behind the portrait: visible within a second, text still legible on the scrim. ABOUT — the rose now sits on ten luminous sectors with a lit top sector: visible; note 'NO SCORES' still reads at rest until the entry sweep fires (the sweep needs ~40% of the svg in view) — R-c14 should decide whether the sweep should fire earlier. EXPERIENCE — visible sediment strata bands with grain across the chart card, brighter under the ANZ span, bars remain the brightest objects: visible and on-story. Judgement: the owner's 'cannot see flagship UI/UX' is answered for these three sections; verifier lane pending for the numbers.

## DECISION (2026-09-05T10:15:48.623Z)
V-flagship-A FAIL (c3bc139) on two live defects: F1 at ≤700 px Hero.module.css paints a flat rgb(10 10 10 / 0.86) .stage::after over the canvas → hero scene 0.00% coverage on phones; F2 shader-path contrast: 9 nodes @1440 / 12 @390 below AA (Telstra 1.10:1, InfoCentric 1.11:1 over lit strata; hero .ledgerSource 1.34:1) — text-contrast.spec.ts loads without ?gl=force so it never saw them; the visibility gate is single-viewport. Owner's O5 ship stands (1440 verified visible by the orchestrator); correction lane t_flagvis0c dispatched now: graded mobile scrim, viewport-parameterised gate (1440+390), ?gl=force TC-CONTRAST-01 variant + fix every reported node (local text plates / shader uTextRect dimming), About @390 peak ≥ 0.35.

## COMMENT (2026-09-05T16:57:53.217Z)
1556Z reclaim — swarm stopped; do not duplicate. G-H1 restated on t_g2_h1.

## STATUS (2026-09-05T16:57:53.278Z)
ready — 1556Z reclaim
