# t_w3_p0b — P0 FUNCTIONAL 2 (analyst-programmer, xhigh) — MiniVic panel placement: the panel is placed against the pre-font-settle name and never re-widened (290 px at 1440, 315 px at 1366, both under TC-BOT-14's 320 minimum and the 360 bar) because every recompute path in placePanelClearOfHeroName can only narrow and returns early on the cached natural box; and at 390 the composer sits outside a 368-px panel. Fix at the cause: recompute from a fresh natural box after fonts.ready/resize/scroll with the ability to re-expand; guarantee width ≥ 360 at ≥ 1280 by falling back from 'beside' to 'below/over' when beside cannot reach it; at 390 the sheet holds the composer inside; tests at 1440/1366/1280/834/390; push worktree-w3-p0b within 30 min

**Status:** ready · **Priority:** 100 · **Parents:** t_w3_p0a · **Created:** 2026-09-06T06:08:23.407Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Diagnosis and probe from t_w3_p0a: docs/delivery/evidence/v10-20260905T0515Z/W3-P0A/02-placement-probe-baseline.json and placement-probe.mjs (re-runnable, PROBE_BASE_URL default :5605 — use :5608 here). Functional only: zero visual change outside the MiniVic panel; do not touch components/sections/**. Fresh worktree .claude/worktrees/w3-p0b on branch worktree-w3-p0b from origin/main (which now carries e92808f if consolidated — check git log origin/main; otherwise merge origin/worktree-w3-p0b's parent e92808f into your branch first). One heavy job at a time; port 5608; wait on PIDs; never pgrep -f your own command text; never git checkout/reset/stash in /root/forgotten-mistory.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- B-1 Read: the p0a COMPLETE note on the board (artifacts/kanban/tasks/t_w3_p0a.md), W3-P0A/02-placement-probe-baseline.json, W3-P0A/placement-probe.mjs, lib/minivicPlacement.ts, components/MiniVicBot.tsx (placePanelClearOfHeroName, tightenPlacement, clearPanelPlacement, the fonts.ready / resize / scroll hooks), app/globals.css MiniVic panel + sheet rules, tests/e2e/chatbot.spec.ts TC-BOT-14, tests/overhaul/*minivic*.
- B-2 TDD first — tests/e2e/minivic-panel-placement.spec.ts (TC-MV-PLACE-01…): open the panel after fonts.ready at 1440x900, 1366x768, 1280x800, 834x1194, 390x844 and assert: panel rect inside the viewport with ≥ 24 px margins (390: the sheet contract as already written), panel width ≥ 360 at ≥ 1280 and ≥ 320 at 834, composer rect inside the panel rect at every viewport, panel clear of the h1 glyph run by ≥ MINIVIC_CLEARANCE where 'beside' is chosen, and after a viewport resize (1440→1366→1440) the width recovers (re-expansion). Run red first (expect 1440/1366 width and 390 composer red).
- B-3 Fix at the cause: (a) recompute placement from a freshly measured natural box (never the cached one) on fonts.ready, resize, and the first scroll into/out of the hero, and let the algorithm choose a wider result than the current one; (b) the chooser tries 'beside' first and, when beside cannot reach 360 at ≥ 1280 (or 320 at 834), falls back to 'below the name' or 'over the hero ground' so the width floor holds; (c) at 390 the sheet's height accounts for the composer (min-height = header + transcript min + composer) so composerInsidePanel is true. Keep lib/minivicPlacement.ts pure and unit-tested (node --test) for the chooser with the five measured geometries from 02-placement-probe-baseline.json as fixtures.
- B-4 Verify: npx tsc --noEmit · npm run lint · npm run build:static · node scripts/validate/overhaul_static_audit.mjs (10/10) · serve out/ on :5608 · PLAYWRIGHT_BASE_URL=http://127.0.0.1:5608 npx playwright test tests/e2e/minivic-panel-placement.spec.ts tests/e2e/chatbot.spec.ts -g 'TC-BOT-14' tests/e2e/minivic-first-fold-click.spec.ts tests/e2e/minivic-first-fold-cv-tap.spec.ts tests/a11y/minivic-occlusion.spec.ts tests/e2e/minivic-send-path.spec.ts · node --test tests/*.test.mjs · node docs/delivery/evidence/v10-20260905T0515Z/W3-P0A/placement-probe.mjs (PROBE_BASE_URL=http://127.0.0.1:5608) saved as W3-P0B/02-placement-probe-after.json; full logs + screenshots of the open panel at five viewports → docs/delivery/evidence/v10-20260905T0515Z/W3-P0B/.
- B-5 Ledger row (scripts/pm/ledger_append.mjs --task t_w3_p0b …) before the commit; conventional commit stating the cause; push origin HEAD:refs/heads/worktree-w3-p0b (never main). ≤ 30 min: if you would overrun, land the width-floor fallback + its tests first. Return {task_id:'t_w3_p0b', branch, sha, pushed, files_changed, cause_fixed, widths:{1440,1366,1280,834,390}, composer_inside:{…}, gates:{tsc,lint,build,audit,playwright,node_test}, evidence:[…], remaining:[…], goal_complete:true}.

## QUALITY GATES
- TC-MV-PLACE-01… red-then-green; TC-BOT-14 green at 1440 and 1366; first-fold click/CV-tap, occlusion and send-path suites green
- Probe-after shows width ≥ 360 at 1440/1366/1280, ≥ 320 at 834, composer inside at all five
- tsc/lint/build clean; audit 10/10; nothing under components/sections touched; ledger row; branch pushed

## VERIFICATION
```bash
git -C /root/forgotten-mistory/.claude/worktrees/w3-p0b diff --stat origin/main..HEAD -- components/sections | wc -l
node -e "const j=require('/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-P0B/02-placement-probe-after.json');console.log(JSON.stringify(j).slice(0,300))"
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T06:08:51.628Z)
running — dispatched 06:09Z fm-wave3-p0b (AP opus/xhigh, port 5608)

## REVIEWER FINDING (06:24Z, G-REV/20a17dfb/13-placement.json) — re-aim
On the LIVE build the panel is NOT narrow: it is 432 px at 1440 and 1366 and OVERLAPS the H1 glyph run by 67.5 px (1440) and 90.5 px (1366); 1280/834/390 pass; composer inside 5/5. p0a's probe saw the narrowed panel on its own export after a 2.5 s settle — so the placement is timing-dependent: sometimes it applies and over-narrows, sometimes it never applies. The acceptance instrument is the reviewer's `docs/delivery/evidence/v10-20260905T0515Z/G-REV/20a17dfb/12-placement.mjs` (panel opened after fonts.ready, scrollY 0): clearance ≥ +16 px from the H1 run AND width ≥ 360 at ≥ 1280 AND composer inside, at all five viewports, deterministically (run it three times). The fix must be deterministic: compute from fresh measurements when the panel opens (after fonts.ready and after the panel has laid out), choose beside only if it can reach the width floor with clearance, otherwise below-the-name / over-the-ground.

## COMPLETE (2026-09-06T07:08:13.913Z)
PARTIAL, NOT PUSHED (correct call: the pipeline ships every branch, and TC-BOT-14 is still red at 1366/1280). Committed locally 1697bac on worktree-w3-p0b (.claude/worktrees/w3-p0b, no node_modules). Fixed: (a) width floor 360 at >=1280 / 320 below with tallest-candidate-meeting-width selection (1440 now 432 px lifted above the name, sep 18.2); (b) three staleness paths that made recompute narrowing-only (live read when no caps; post-clear read believed only after two agreeing frames; per-recompute retry budget); (c) composer inside the 390 sheet (container tiers 24rem/20rem). Probe-after: width 432 at 1440/1366/1280/834, 342 at 390; composer inside 5/5; TC-MV-PLACE-01..06 12/12 (repeat 2); MiniVic suites 11/11; node tests 19/19 placement. OPEN: at 1366 (and sometimes 1280) the panel ends with the 'above' heightCap written but the lift NOT applied (h 272, bottom still 680, over the name) — the chooser is right, the WRITE is lost; suspects: a React style prop on [data-testid=minivic-panel] (MiniVicBot.tsx:1242) rewriting the attribute on re-render, or a CSS transition measured mid-flight. -> t_w3_p0b2.
