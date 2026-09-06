# t_w1_mv2 — REGRESSION (rev-ec53e2b4-w1) — the Ask Mini Vic launcher is visible but NOT clickable on the first fold at 1440 and 390: .hero-fold intercepts pointer events over the pill (3/3 runs); fix stacking/pointer-events so a real click opens the panel, prove it with a real click test, never hide the pill (G-MV1)

**Status:** ready · **Priority:** 95 · **Parents:** t_w1_rev2 · **Created:** 2026-09-06T01:46:12.270Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/08-adversarial-review.md (REGRESSION FAIL) + panel-probe-*.json: the pill reports display:block, opacity:1, visibility:visible, isVisible()===true, yet page.click fails because `hero-fold` intercepts pointer events at both widths. Relates to G-NEW-1 (dock opacity on the first fold) and G-E2 (dock must not occlude charts). The hero set-piece lane (t_w2_h1s1…) is editing components/sections/Hero/* concurrently — do NOT edit Hero files; fix on the launcher side (app/globals.css .minivic-launcher* / components/MiniVicBot.tsx z-index, pointer-events, stacking context) so it wins over any section overlay, and coordinate only through origin/main.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree from origin/main as usual (worktree-w1-mv2, .claude/worktrees/w1-mv2, node_modules symlink). One build / one browser.
- S-1 Read the review's regression section + panel-probe JSON; app/globals.css (minivic launcher/dock rules, the 'dock fades above the hero' comment block), components/MiniVicBot.tsx (launcher markup, aria-label), components/sections/Hero/Hero.module.css (.heroFold / stacking — read only), tests/a11y/minivic-occlusion.spec.ts, tests/monochrome/minivic-launcher.spec.ts, tests/e2e/chatbot.spec.ts.
- S-2 TESTS FIRST: e2e case at 1440x900 and 390x844, first fold, no scrolling: locate the pill, assert document.elementFromPoint(centre) is the pill or its descendant, then a REAL page.mouse.click at that point opens the panel (dialog visible). Capture failing → W1-MV2/02-tests-failing.log.
- S-3 Fix on the launcher side (z-index/pointer-events/stacking) — smallest change; keep the dock's own occlusion rules (never brighten ground under it; never display:none).
- S-4 Verify: tsc · lint · build:static · audit 10/10 · e2e chatbot + a11y minivic-occlusion + monochrome minivic-launcher + the new case on :5619 (kill after); screenshots first fold 1440/390 with the panel opened by a real click → W1-MV2/.
- S-5 Ledger; commit 'fix(minivic): launcher receives clicks on the first fold at every width' with the two mandatory trailers; git push -u origin worktree-w1-mv2.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, root_cause, gates:{tests_failed_first, tsc, lint, build, audit_10_10, real_click_opens_panel_1440, real_click_opens_panel_390, occlusion_suites_green, hero_files_untouched}, evidence:[], goal_complete}.

## QUALITY GATES
- Real click opens the panel on the first fold at 1440 and 390 (test green after failing first)
- Hero files untouched; pill never hidden; occlusion/monochrome launcher suites green
- tsc · lint · build · audit 10/10; ledger; pushed; ≤ 25 min

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w1-mv2 && git diff --stat origin/main -- components/sections/Hero | wc -l  # must be 0
git ls-remote --heads origin worktree-w1-mv2
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:47:22.582Z)
running — dispatched 01:48Z fm-wave1-d (serialized)

## COMMENT (2026-09-06T02:40:21.187Z)
Lane result 02:42Z (ap-w1-mv2): 6d007adb pushed on worktree-w1-mv2. Root cause = hit testing, not stacking: .minivic-dock carried inline pointer-events:none until pastHero, so the launcher was never in the hit test on the first fold. Fix CSS-only in app/globals.css (launcher pointer-events:auto + :hover reveal; the opacity gate kept so MONO-MV-02 and G-E2 hold); new tests/e2e/minivic-first-fold-click.spec.ts TC-MV-CLICK-01 @1440/@390 green after failing first; Hero files untouched. goal_complete:false honestly because TC-MV-OCCLUDE-01 (Vitrine foot copy 4.05:1 under the launcher ground, pre-existing on origin/main 2cc7165) survives → in t_w1_red2 scope. Reviewer t_w1_rev4 judges on live.

## COMMENT (2026-09-06T02:48:46.516Z)
PM check 02:49Z: consolidated into origin/main and LIVE 97e19d07. Independent reviewer t_w1_rev4 judges on live.
