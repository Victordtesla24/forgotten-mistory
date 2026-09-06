# t_g2_mv1 — ADV-1451Z P0 — G-MV1 MiniVic launcher at ≤640 px shows a visible “Ask Mini Vic” text affordance (no unlabeled disc-only over the portrait)

**Status:** todo · **Priority:** 99 · **Parents:** — · **Created:** 2026-09-05T14:57:52.906Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ADV-REVIEW-20260905T1451Z (hero/chrome + MiniVic): at 390 the MiniVic pill label is hidden → an icon-only disc sits over the portrait area; P0. Acceptance (binary): at viewport ≤ 640 px the launcher exposes a visible text label “Ask Mini Vic” (or equivalent visible text affordance, not aria-only), not overlapping the hero portrait/photo box in the first viewport, ≥ 44×44 px target, AA contrast on its ground, achromatic chrome (gold is for sourced claims), still present at 834/1440; tests/monochrome/minivic-launcher.spec.ts extended with a ≤640 case; no regression to the launcher’s pastHero gating (the dock must not cover the CV button — see MiniVicBot.tsx comment).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read components/MiniVicBot.tsx launcher block + its CSS (globals.css .minivic-launcher*), tests/monochrome/minivic-launcher.spec.ts, the reviewer report §Chrome/Hero.
- S-2 TDD: launcher label visible (getComputedStyle display/visibility/opacity, text content) at 390 and 640; label not intersecting [data-testid=hero-portrait] while the dock is docked; RED.
- S-3 Implement (CSS/markup only; keep the disc, add/show the label pill at small widths — measure that it does not collide with the hero CV/actions).
- S-4 PUSH RULE: tsc+lint+build+audit green → ledger → commit → push (merge origin/main first); then minivic-launcher + hero-fold + text-contrast @390 specs → follow-up evidence.

## QUALITY GATES
- Label visible at 390/640 with AA; 44 px target; no overlap with the hero portrait or actions in the fold
- minivic-launcher, hero-fold, text-contrast @390 green; audit 10/10
- ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5629 npx playwright test tests/monochrome/minivic-launcher.spec.ts tests/e2e/hero-fold.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T14:58:24.404Z)
running — dispatched 14:59Z — one implementer lane (analyst-programmer xhigh, isolated worktree, port 5629); load 9.4, Chrome-heavy count 2 with this

## COMMENT (2026-09-05T15:14:50.861Z)
15:13Z orchestrator: lane pushed worktree-wf_b8a7f13a-b92-1 at 15:12:59Z with 688444d (MiniVic launcher visible label at <=640px) merged onto origin/main ce3ab34 (4fd8b98). tsc clean in the worktree at 15:12Z. deploy.yml dispatched by orchestrator 15:13Z (branch watcher had exited without dispatching). G-V3 slice still in flight in the same lane. Reviewer t_rev_mv1_v3 dispatches when the live build-commit carries 688444d.

## COMMENT (2026-09-05T16:57:52.796Z)
1556Z: G-MV1 HOLD PASS on live CSS/DOM. Stop rework. Protect via t_g_new1. Reclaim this running lane.

## COMPLETE (2026-09-05T16:57:52.852Z)
HOLD PASS live b2ac21be Ask Mini Vic pill; further work is t_g_new1 freeze only
