# t_g_clean1556 — ADV-1556Z cleanup — restore dirty host checkout app/globals.css MiniVic pill hide from origin/main LOCALLY; never push the 45-behind main

**Status:** ready · **Priority:** 99 · **Parents:** t_adv1556 · **Created:** 2026-09-05T16:57:52.316Z

## YOUR ROLE
cleanup-agent — cleanup (docs/prompt.md §5). /root/forgotten-mistory is 45 commits behind origin/main with dirty .minivic-launcher__pill { display: none }. Restore ONLY app/globals.css from origin/main in that working tree. Do NOT git push main. Do NOT commit on the stale main. Do not delete .env or .git.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- git -C /root/forgotten-mistory checkout origin/main -- app/globals.css
- Confirm pill is inline-block
- Do not push

## QUALITY GATES
- Working-tree globals.css pill is display:inline-block
- no push of stale main

## VERIFICATION
```bash
git -C /root/forgotten-mistory diff origin/main -- app/globals.css | head
```

## HIERARCHY
role_matrix: cleanup → level 4 → effort **medium** (effort_cascade.yaml; depth_cap 4). Model: claude-sonnet · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:33.147Z)
1556Z DISPATCH NOW. Local restore only. Never push main.

## STATUS (2026-09-05T16:58:33.767Z)
running — dispatched

## COMPLETE (2026-09-05T17:03:15.358Z)
Verified 17:02Z: git diff origin/main -- app/globals.css is empty (pill display:inline-block). Host HEAD still 45 behind — file restored locally only, not pushed. Staged M app/globals.css must not be committed on stale main.
