# t_w1_mv5 — REGRESSION (found by t_w1_mv3) — TC-MV-OCCLUDE-02 @390: the CLOSED Ask Mini Vic launcher paints a ground of rgb(174,174,174) (relative luminance 0.4233) against the 0.0968 ceiling derived from --mist-200 body ink, i.e. the dock brightens the prose under it; regressed between b02a8863 and b9f5195e (candidates: mv2's :hover reveal / pointer-events rules, red2's panel cap, hero S1–S3 nav/token changes) — bisect, fix on the launcher side, keep G-MV1 (visible, labelled, clickable) and TC-MV-CLICK-01 green

**Status:** ready · **Priority:** 91 · **Parents:** t_w1_mv3 · **Created:** 2026-09-06T04:38:48.278Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Contract (app/globals.css MiniVic block, tests/a11y/minivic-occlusion.spec.ts TC-MV-OCCLUDE-02): every pixel the launcher paints stays darker than the brightest ground that still carries --mist-200 body ink at 4.5:1 — the launcher may float over prose; it may never brighten the ground under it. On b02a8863 only OCCLUDE-01 was red; on b9f5195e the closed pill's own surface measures rgb(174,174,174) at 390. Bisect with the export at the candidate commits (mv2 6d007adb, red2 9deea50d, S1 9287089, S2 9835a950, S3 1e1cb392) — one build each, one browser, serially — then fix at the root on the launcher side (never display:none, never opacity 0 that hides the label; G-MV1). Hero component files stay untouched (S4 lane).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w1-mv5 from origin/main. One build / one browser; port 5635.
- S-1 Read tests/a11y/minivic-occlusion.spec.ts (OCCLUDE-02 measurement), app/globals.css MiniVic block, components/MiniVicBot.tsx launcher markup, the mv3 evidence (W1-MV3/) for the failing capture, git log -p for app/globals.css between b02a8863 and b9f5195e.
- S-2 Reproduce OCCLUDE-02 @390 on origin/main (capture → W1-MV5/01-reproduction.log); bisect to the introducing commit with the same probe (record each measurement).
- S-3 Fix at the root (launcher surface/plate luminance, hover/focus reveal states included — the :hover reveal must not paint a light ground either); keep the label plate readable (12.5:1 --mist-200 on --ink-900 per the CSS comment).
- S-4 Verify: occlusion (01+02 at 390/640/1440), monochrome launcher, first-fold click, chatbot suites serially; tsc; lint; build:static; audit 10/10; screenshots of the closed and hovered launcher at 390 → W1-MV5/.
- S-5 Ledger; commit 'fix(minivic): the launcher never brightens the ground under it (OCCLUDE-02 regression)' with the two mandatory trailers; push worktree-w1-mv5 WITH the full suite log.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, introducing_commit, luminance_after, gates:{reproduced, bisected, occlusion_01_02_green_3_widths, mono_launcher_green, click_green, tsc, lint, build, audit_10_10, hero_untouched, pill_never_hidden}, evidence:[], goal_complete}.

## QUALITY GATES
- Introducing commit named with measurements; OCCLUDE-01/02 green at 390/640/1440; launcher ground ≤ 0.0968 L
- G-MV1 + TC-MV-CLICK-01 + monochrome launcher green; Hero untouched
- tsc · lint · build · audit 10/10; ledger; pushed with full logs; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w1-mv5
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T05:04:28.861Z)
running — dispatched 05:05Z fm-wave2-corrections-c (serialized: mv5 → x2t3 → x2f8)

## COMMENT (2026-09-06T05:05:44.216Z)
NOTE 05:09Z: when you verify, also open the MiniVic panel at 1366x768 — t_w1_mv4's placement reports composer_inside_panel=false there (h 245 px). If the composer is outside its box, the placement's usable-dialog floor (≥ 320×304) is not being honoured at that viewport; report with numbers (fix only if it is on the launcher/panel side and within cap).

## COMPLETE (2026-09-06T05:44:54.061Z)
Landed 4978a47 (worktree-w1-mv5), live 199f116c: closed launcher never brightens the ground under it (OCCLUDE-02); reviewer rev8 to confirm on live
