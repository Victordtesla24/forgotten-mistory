# t_g_new1 — ADV-1556Z P0 — G-NEW-1 freeze MiniVic pill display:inline-block at ALL widths; dirty-tree display:none must never ship; tester 390 screenshot

**Status:** ready · **Priority:** 99 · **Parents:** t_adv1556 · **Created:** 2026-09-05T16:57:52.013Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Live HOLD PASS on G-MV1: origin/main already has .minivic-launcher__pill { display: inline-block } at all widths. Host checkout /root/forgotten-mistory is 45 behind and DIRTY with display:none below 52.125rem — NEVER commit/push that tree. Worktree FROM origin/main only. Pin the freeze (CSS comment + tests/monochrome/minivic-launcher.spec.ts already has MONO-MV-02; fix tests/a11y/minivic-launcher.spec.ts comments/asserts that still say 834px). Do not hide the pill. Do not rework G-MV1 visuals.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- git fetch origin && git worktree add -b worktree-gnew1-<uuid> /root/forgotten-mistory/.claude/worktrees/gnew1-<uuid> origin/main
- Confirm origin/main pill is display:inline-block at all widths
- Fix a11y spec comments/asserts that still say label only from 834px
- Add/extend a 390 computed-style assert that pill display is not none
- ledger_append.mjs BEFORE commit
- tsc+lint+build:static+audit; SKIP local Playwright in window 1; push unique branch

## QUALITY GATES
- Pill display:inline-block at 390/640/834/1440 in source on the branch
- No display:none for .minivic-launcher__pill at any breakpoint
- a11y spec no longer claims 834px-only label
- ledger row before commit
- pushed worktree-* branch

## VERIFICATION
```bash
git show HEAD:app/globals.css | sed -n '/minivic-launcher__pill/,+20p'
git grep -n '834px' tests/a11y/minivic-launcher.spec.ts || true
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:32.991Z)
1556Z DISPATCH NOW. origin/main worktree. Port 5641. Never copy host checkout CSS.

## STATUS (2026-09-05T16:58:33.432Z)
running — dispatched

## COMMENT (2026-09-05T17:11:57.435Z)
PUSHED 4d875da on worktree-gnew1-1556. Pill freeze comment + a11y 390 assert. HOLD until tester live 390.

## COMMENT (2026-09-05T17:22:09.812Z)
LIVE candidate b0513692 should include 4d875da pill freeze.

## COMPLETE (2026-09-05T17:25:39.296Z)
HOLD+freeze PASS live b0513692 (4d875da) with independent tester PASS t_g_new1t. Pill display:inline-block all widths. Dirty-tree hide did not ship.
