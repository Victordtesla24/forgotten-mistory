# t_2acdaa58 — R12 — MCP servers / skills actively used and evidenced (Higgsfield balance probe, n8n, chrome-devtools/Playwright, Perplexity research, Figma where a design is exchanged)

**Status:** running · **Priority:** 40 · **Parents:** — · **Created:** 2026-09-05T05:58:06.011Z

## YOUR ROLE
orchestrator — feedback_refactor_loop (docs/prompt.md §5). Evidence so far: n8n MCP (v9 E-n8n), Higgsfield MCP balance (v10 manifest), Playwright (every battery), Perplexity/Firecrawl (v9 B-research). Each future cycle names the tool it used in its decisions file.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Each cycle's 07-decisions.md carries a "Tools used" line

## QUALITY GATES
- [ ] every cycle ≥1 named tool with the call

## VERIFICATION
```bash
grep -rl "Tools used" docs/delivery/evidence/v10-20260905T0515Z/*/07-decisions.md | wc -l
```

## HIERARCHY
role_matrix: feedback_refactor_loop → level orchestrator → effort **ultracode** (effort_cascade.yaml; depth_cap 4). Model: claude-fable-5-1 (ultracode) · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T06:03:37.263Z)
Tools used this cycle (orchestrator): Higgsfield MCP balance; n8n MCP get_workflow_details ×2; gh CLI (run list); sqlite3 read-only migration of the retired Hermes board; Workflow tool ×3 (opus council agents).
