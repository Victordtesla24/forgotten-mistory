# t_g_new1t — ADV-1556Z P0 — G-NEW-1 tester: 390 screenshot of live Ask Mini Vic pill visible; FAIL if display:none

**Status:** ready · **Priority:** 99 · **Parents:** t_g_new1 · **Created:** 2026-09-05T16:57:52.063Z

## YOUR ROLE
tester — testing / qa (docs/prompt.md §5). Independent tester. Probe LIVE https://forgotten-mistory.web.app/ at 390. Screenshot the MiniVic launcher. Assert visible text 'Ask Mini Vic' (not aria-only) and computed display of .minivic-launcher__pill is not none. Do not implement CSS. Evidence under docs/delivery/evidence/v10-20260905T0515Z/G-NEW-1/<build-commit>/.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- Read live build-commit
- 390 viewport screenshot of launcher
- Computed style of pill
- Push evidence on a docs branch from origin/main

## QUALITY GATES
- 390 screenshot shows Ask Mini Vic
- pill computed display !== none
- build-commit recorded

## VERIFICATION
```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## HIERARCHY
role_matrix: testing / qa → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:33.043Z)
1556Z DISPATCH NOW against LIVE 390 even before AP freeze lands.

## STATUS (2026-09-05T16:58:33.477Z)
running — dispatched

## COMPLETE (2026-09-05T17:25:39.244Z)
PASS live b0513692 @390: pill computed display block !== none; visible text Ask Mini Vic; screenshot G-NEW-1/b0513692. Independent tester 484db65a. Deploy 33980197112.
