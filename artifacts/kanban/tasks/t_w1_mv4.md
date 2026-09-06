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
