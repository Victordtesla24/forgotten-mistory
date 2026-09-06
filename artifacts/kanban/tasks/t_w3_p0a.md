# t_w3_p0a — P0 FUNCTIONAL (analyst-programmer, xhigh) — two live regressions from rev7 on 314d9d28/199f116c: (1) at 390x844 the not-yet-painted MiniVic dock/launcher intercepts the tap on 'Download CV' in the first fold — make the dock inert (pointer-events none, aria-hidden) until it is painted, keep TC-MV-CLICK-01 (pill clickable where painted), add a test that the CTA at its own centre receives the tap at 390; (2) placeMiniVicPanel has no effect at 1440x900 (panel 432x452 at 984,360) and yields a 222-px panel with the composer outside the box at 1366x768 — find why the placement does not apply (trace the call at components/MiniVicBot.tsx:584, CSS overrides, measure-before-layout) and make the panel sit inside the viewport with ≥ 24 px margins and the composer inside the panel at 1440x900 / 1366x768 / 1280x800 / 834x1194 / 390x844, with tests at all five; no Hero or visual changes

**Status:** ready · **Priority:** 100 · **Parents:** t_w1_rev7 · **Created:** 2026-09-06T05:41:45.858Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Functional only — zero visual change (the visual layer is being replaced under t_w3_own; do not touch components/sections/Hero/** or any scene). Reviewer evidence: docs/delivery/evidence/v10-20260905T0515Z/G-REV/fda84067/08-adversarial-review.md (F-findings on the dock and the panel). Work in a fresh worktree from origin/main: git -C /root/forgotten-mistory worktree add .claude/worktrees/w3-p0a -b worktree-w3-p0a origin/main; npm ci there if node_modules is missing. One heavy job at a time (build, then Playwright); port 5605 for your static server; never pgrep -f your own command text; wait on PIDs.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- A-1 Read the rev7 review (F-findings), components/MiniVicBot.tsx, lib/minivicPlacement.ts, app/globals.css MiniVic rules, tests/e2e/minivic*.spec.ts, tests/e2e/minivic-first-fold-click.spec.ts, tests/overhaul/*minivic* (the contracts).
- A-2 TDD first: (a) tests/e2e/minivic-first-fold-cv-tap.spec.ts — at 390x844 fresh load, before the dock paints, document.elementFromPoint at the 'Download CV' centre is the CTA (or a descendant) and a real click navigates/downloads the CV href; (b) extend the placement spec: for 1440x900, 1366x768, 1280x800, 834x1194, 390x844 open the panel and assert panel rect inside viewport with ≥ 24 px margins (390: full-width sheet rules as already contracted), composer rect inside panel rect, panel width ≥ 360 at ≥ 1280. Run them red first.
- A-3 Fix (1): the launcher/dock is inert until painted — pointer-events none + aria-hidden while its paint state is pending; flip when painted (the existing paint signal or an onLoad/ready state); keep the 834+ behaviour unchanged. Fix (2): instrument placeMiniVicPanel on the built export at 1440 (console the rects it computes vs the applied style), find the cause (style overridden by a later CSS rule / media query, run() early return, measured before the panel mounts, transform vs left/top), fix at the cause, no !important hacks unless the cause is a specificity war and you document it.
- A-4 Verify: npx tsc --noEmit · npm run lint · npm run build:static · node scripts/validate/overhaul_static_audit.mjs (10/10) · serve out/ on :5605 · PLAYWRIGHT_BASE_URL=http://127.0.0.1:5605 npx playwright test tests/e2e/minivic tests/overhaul -g 'minivic|MiniVic|BOT|MV' plus the two new specs plus tests/e2e/hero-fold.spec.ts (unchanged hero) — full logs to docs/delivery/evidence/v10-20260905T0515Z/W3-P0A/ (never a truncated log); screenshots of the open panel at the five viewports into the same dir.
- A-5 Ledger row (node scripts/pm/ledger_append.mjs --task t_w3_p0a --role analyst-programmer --model claude-opus --prompt 'artifacts/kanban/tasks/t_w3_p0a.md' --range <sha> --cached false --cwd <worktree> -- <files>) before the commit; conventional commit; push origin HEAD:refs/heads/worktree-w3-p0a (never main). Return {task_id:'t_w3_p0a', branch, sha, pushed, files_changed, cause_of_placement_bug, gates:{tsc,lint,build,audit,tests}, evidence:[…], goal_complete:true}. ≤ 30 min.

## QUALITY GATES
- Two new tests red-then-green; every existing MiniVic contract green; hero-fold spec unchanged and green
- tsc/lint/build clean; audit 10/10
- No file under components/sections/** touched
- Ledger row present; branch pushed; full suite logs in W3-P0A/

## VERIFICATION
```bash
git -C /root/forgotten-mistory/.claude/worktrees/w3-p0a diff --stat origin/main..HEAD -- components/sections | wc -l
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-P0A/
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T05:43:10.567Z)
running — dispatched 05:43Z (fm-wave3-directions: two SAs opus/max in parallel, then serialized prototypes; fm-wave3-p0a: AP opus/xhigh)
