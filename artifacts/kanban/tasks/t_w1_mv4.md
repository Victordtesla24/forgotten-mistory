# t_w1_mv4 — REGRESSION (rev-97e19d07-w1 F-2, pre-existing) — at 1440x900 the open MiniVic panel (x 984→1416, y 360→812) covers the H1's glyph run (x 560→1215, y 480→660) by 231 px: the panel must never overlap the name — contract measured on Range.getClientRects (horizontal gap ≥ 16 px or the panel sits fully below the H1 run), at 1440, 1280 and 834; MiniVicBot/globals only, Hero untouched

**Status:** ready · **Priority:** 92 · **Parents:** t_w1_rev4 · **Created:** 2026-09-06T03:23:09.925Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Evidence: G-REV/97e19d07/04-panel-1440.json + 07-b2-1440x900-answered.png (reader sees 'Vikram Deshpa'). TC-BOT-14 currently asserts vertical clearance only (panel top vs glyph bottom) and passed at 19 px while the panel horizontally overlaps the run. Hero S3 (running) will reduce the H1 to clamp(3.25rem, 8vw, 7rem) with column x 96→~1028 at 1440 — the panel's left edge must clear the H1's measured right glyph edge by ≥ 16 px at every viewport, or the panel must open below the H1 run. Fix in components/MiniVicBot.tsx + app/globals.css (panel width/anchor: e.g. width = min(432px, viewport − H1right − 16 − 16) measured at open time, or anchor the panel's top below the H1 run when the width would drop under 320 px). Rewrite TC-BOT-14 to measure BOTH axes on glyph rects at 1440/1280/834 and keep the 16 px contract. Never touch Hero component files.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w1-mv4 from origin/main. One build / one browser.
- S-1 Read the review F-2 evidence, components/MiniVicBot.tsx (panel geometry, open state), app/globals.css MiniVic block, tests/e2e/chatbot.spec.ts TC-BOT-14, tests/e2e/minivic-first-fold-click.spec.ts.
- S-2 TESTS FIRST: TC-BOT-14 rewritten (both axes, glyph rects, three viewports); capture failing → W1-MV4/02-tests-failing.log.
- S-3 Implement the geometry rule; keep TC-MV-CLICK-01, occlusion and monochrome launcher suites green.
- S-4 Verify: chatbot + minivic suites serially on :5632; tsc; lint; build:static; audit 10/10; screenshots open panel at 1440/1280/834 → W1-MV4/.
- S-5 Ledger; commit 'fix(minivic): the open panel never covers the name (glyph-rect contract on both axes)' with the two mandatory trailers; push worktree-w1-mv4.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, geometry:{...}, gates:{tests_failed_first, both_axes_contract_green_3_viewports, click_green, occlusion_green, tsc, lint, build, audit_10_10, hero_untouched}, evidence:[], goal_complete}.

## QUALITY GATES
- Panel never overlaps the H1 glyph run at 1440/1280/834 (≥ 16 px gap or fully below), measured on glyph rects
- TC-MV-CLICK-01 + occlusion + monochrome launcher suites green; Hero untouched
- tsc · lint · build · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w1-mv4
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T03:53:30.466Z)
running — dispatched 03:54Z fm-wave2-corrections-b (serialized: mv4 → m4b → l1m → a3g)

## COMMENT (2026-09-06T04:56:23.498Z)
PM check 04:57Z: b4e4b79 pushed on worktree-w1-mv4 (consolidating). lib/minivicPlacement.ts chooses beside / below / flipped / under-nav from the measured glyph run and re-measures until the 16 px contract holds; TC-BOT-14 rewritten to both axes on Range.getClientRects at 1440/1366/1280/834 (0 glyph rects covered, 18–19 px separation, panel ≥ 320 px). Reviewer t_w1_rev7 judges on live.

## COMMENT (2026-09-06T05:01:56.664Z)
Lane result 05:03Z (ap-w1-mv4, over cap): b4e4b79 (fix) live in fda84067 + b2cbc43 (evidence: the two occlusion failures reproduce on origin/main, not on this branch) consolidating. Awaiting reviewer t_w1_rev7 (TC-BOT-14 both axes at 4 widths).

## COMMENT (2026-09-06T05:05:44.156Z)
Structured result (ap-w1-mv4, goal_complete:false honestly): lib/minivicPlacement.ts measures the glyph run and tries beside / below / flipped / lift in cost order; 0 glyph rects covered and 18–19 px separation at 1440/1366/1280/834 (panel lifted ABOVE the run: 1440 → t 112, h 350). CAVEAT for the reviewer: at 1366x768 the applied box is h 245 px and composer_inside_panel = FALSE — the input may sit outside the panel there; rev7 measures it and mv5/rev7 decide. OCCLUDE-02 (launcher ground) is t_w1_mv5's; OCCLUDE-01 already fixed on main (mv3).

## COMPLETE (2026-09-06T05:44:53.966Z)
Landed (worktree-w1-mv4, lib/minivicPlacement.ts + MiniVicBot.tsx:584), live 314d9d28 — but rev7 measured no effect at 1440 and a 222-px panel at 1366: the defect continues as P0 t_w3_p0a
