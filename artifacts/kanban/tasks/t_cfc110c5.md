# t_cfc110c5 — Board bootstrap — file-backed Kanban (artifacts/kanban), ledger, owner prompt refresh committed

**Status:** done · **Priority:** 100 · **Parents:** — · **Created:** 2026-09-05T05:58:06.011Z

## YOUR ROLE
orchestrator — feedback_refactor_loop (docs/prompt.md §5). docs/prompt.md refreshed by the Owner (Fable 5.1 ultracode, no Hermes, file-backed board); Hermes board `default` retired — its 7 tasks migrated with ids preserved; artifacts/kanban/ un-ignored so the ledger is versioned.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 artifacts/kanban/board.json + tasks/*.md + cycles/ + delegation-ledger.jsonl
- S-2 .gitignore: !artifacts/kanban/ !artifacts/delegation-ledger.jsonl
- S-3 commit docs(prompt)+board+HYG evidence; push HEAD:main

## QUALITY GATES
- [x] board.json parses
- [x] every task file has the eight sections in order
- [x] committed on main

## VERIFICATION
```bash
node -e "JSON.parse(require('fs').readFileSync('/root/forgotten-mistory/artifacts/kanban/board.json'))"
```

## HIERARCHY
role_matrix: feedback_refactor_loop → level orchestrator → effort **ultracode** (effort_cascade.yaml; depth_cap 4). Model: claude-fable-5-1 (ultracode) · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
