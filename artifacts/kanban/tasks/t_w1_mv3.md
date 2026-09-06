# t_w1_mv3 — MiniVic occlusion follow-ups from t_w1_red2 — (1) TC-MV-OCCLUDE-01: Vitrine exclusion dd ink → --mist-400 (PM decision b: 5.22:1 on the launcher ground, no hairline loss), visual baselines re-accepted with reason; (2) MONO-MV-02 @390: root-cause the dock painted/opacity contract at scrollY 0 (390 fails, 640 passes) and fix product or test with numbers — never hide the pill (G-MV1)

**Status:** ready · **Priority:** 90 · **Parents:** t_w1_red2 · **Created:** 2026-09-06T02:58:43.474Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Evidence: docs/delivery/evidence/v10-20260905T0515Z/W1-RED2/ (01-reproduction.log, 02-verify.log, followups in the t_w1_red2 result). (1) At 390x844 scrollY 16036 the Vitrine exclusion <dd> ink rgb(125,125,125) sits on the launcher's hairline ground rgb(30,30,30) → 4.05:1 < 4.5. Change the dd colour token to --mist-400 in the Vitrine module CSS (find the rule that sets --ink-300 for the exclusion list), keep the launcher CSS untouched, re-accept only the affected visual baselines (UPDATE_SNAPSHOTS=1 on those specs) and write why in the commit. (2) tests/monochrome/minivic-launcher.spec.ts MONO-MV-02 expects painted < 0.05 at scrollY 0 at 390 and 640; after t_w1_mv2 (pointer-events restored, :hover reveal, opacity gate kept) it fails at 390 only — reproduce, read the dock rules in app/globals.css and MiniVicBot.tsx (pastHero gate), and determine whether the product paints the dock on the first fold at 390 (then fix the product: the gate must hold on phones so the launcher does not sit on the portrait, G-E2) or the instrument measures the :hover reveal / a stale bundle (then fix the test). Constraints: G-MV1 (pill never display:none, labelled at every width), TC-MV-CLICK-01 (real click opens the panel on the first fold at 1440/390) must stay green, hero component files untouched (S2–S4 lane owns them).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w1-mv3 from origin/main (.claude/worktrees/w1-mv3, node_modules symlink). One build / one browser.
- S-1 Read the red2 evidence + followups, components/sections/Vitrine/Vitrine.module.css + Drawings.module.css (exclusion dd rule), app/globals.css (minivic dock/launcher block), components/MiniVicBot.tsx (pastHero gate), tests/a11y/minivic-occlusion.spec.ts, tests/monochrome/minivic-launcher.spec.ts, tests/e2e/minivic-first-fold-click.spec.ts, tests/visual baselines for #vitrine.
- S-2 Reproduce both on the export (:5629) → W1-MV3/01-reproduction.log.
- S-3 Implement (1) and root-cause (2) as specified; capture the failing→passing runs.
- S-4 Verify: minivic-occlusion + minivic-launcher + minivic-first-fold-click + vitrine e2e + visual vitrine specs green serially; tsc; lint; build:static; audit 10/10; screenshots of the Vitrine foot at 390 and the first fold at 390 → W1-MV3/.
- S-5 Ledger; commit 'fix(vitrine,minivic): exclusion ink to --mist-400 (4.5:1 under the launcher); MONO-MV-02 root cause' with the two mandatory trailers; push worktree-w1-mv3.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, root_cause_mono_mv_02:'product|test', contrast_after, gates:{reproduced, occlusion_green, mono_launcher_green, click_green, vitrine_green, visual_reaccepted_with_reason, tsc, lint, build, audit_10_10, pill_never_hidden, hero_untouched}, evidence:[], goal_complete}.

## QUALITY GATES
- TC-MV-OCCLUDE-01 green with contrast ≥ 4.5:1 measured; launcher CSS untouched
- MONO-MV-02 root cause named with numbers; fix on the right side; TC-MV-CLICK-01 still green; pill never hidden
- Visual baselines re-accepted only for the Vitrine foot, with the reason in the commit
- tsc · lint · build · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w1-mv3
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T03:16:05.183Z)
ROOT CAUSE for (2) from t_w1_red2 07-decisions.md: components/MiniVicBot.tsx:307 IntersectionObserver(#hero, { threshold: 0.35 }) — at 390 the hero is far taller than the viewport, so the intersection ratio can never approach 0.35 and pastHero only flips when the hero leaves the root entirely; MONO-MV-02 @390 therefore reads opacity 0 after twelve 844 px steps. This is a PRODUCT defect (G-NEW-1: first-fold/early visibility on phones): fix by observing with thresholds [0, 0.35] or a sentinel at the hero's bottom edge so pastHero flips as the hero's end passes the viewport top, while the launcher still never sits on the portrait (G-E2) — prove with the spec at 390 AND 640 plus TC-MV-CLICK-01.
