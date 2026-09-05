# t_3bf56e4a — EPIC — cycles 15+: fold the R-c8 / R-c13 backlog (children below carry the work; this task closes when every child is Done)

**Status:** todo · **Priority:** 80 · **Parents:** — · **Created:** 2026-09-05T05:58:06.011Z

> Continuity: Hermes t_3bf56e4a (ready) — split into children per §13.2 (Split rule).

## YOUR ROLE
orchestrator — feedback_refactor_loop (docs/prompt.md §5). Open R-c8 items after cycles 7/11/12/13: MOT-F-1, C-03 (verify), C-04 (+ADV-F-3), C-07, C-08, ADV-F-2, MOT-F-3, C-09, C-11, ADV-F-4. Each is a child task with the R-c8 direction verbatim as spec.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Children created (see parents field on each)
- S-2 Close when all children Done and R-c13 PASS

## QUALITY GATES
- [ ] all children Done
- [ ] R-c13 (or later) review verdict PASS

## VERIFICATION
```bash
node -e "const b=require('/root/forgotten-mistory/artifacts/kanban/board.json');console.log(b.tasks.filter(t=>t.parents.includes('t_3bf56e4a')).map(t=>t.id+':'+t.status).join(' '))"
```

## HIERARCHY
role_matrix: feedback_refactor_loop → level orchestrator → effort **ultracode** (effort_cascade.yaml; depth_cap 4). Model: claude-fable-5-1 (ultracode) · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
