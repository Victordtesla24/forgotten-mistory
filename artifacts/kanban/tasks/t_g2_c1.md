# t_g2_c1 — ADV-1556Z P0 — G-C1 calendar URL from named env OR honest labels (no Book-mailto lie) on Listen AND Vitrine

**Status:** ready · **Priority:** 98 · **Parents:** t_adv1556 · **Created:** 2026-09-05T16:57:52.113Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). Orchestrator §0.1 decision already logged: there is NO calendar env key (grep key NAMES only; 0 matches cal|calendar|book|schedul|meet). Do NOT invent Cal.com/Calendly. Honest labels + structured mailto. Listen must not say Book. Vitrine must not say Start a project as if it books. Same inbox allowed; two different pretend products are FAIL. Confirm in <=8 min on the task; AP t_g2_c1b implements in parallel from this decision.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- Re-run key-NAME grep; paste names-only count (never values)
- Confirm orchestrator decision: honest email labels
- One-page note on this task: exact replacement labels for listen.ts engage.label and vitrine.ts engagement.label
- Do not implement code

## QUALITY GATES
- No invented calendar URL
- Exact honest labels named for both plates
- Decision logged

## VERIFICATION
```bash
grep -E '^[A-Z][A-Z0-9_]*=' /root/.claude/.env.production | sed 's/=.*//' | grep -ciE 'cal|calendar|book|schedul|meet' || true
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:32.899Z)
1556Z DISPATCH: confirm honest labels in <=8 min. AP t_g2_c1b already implementing Email a 20-minute-call agenda / Email a project brief unless you name different strings immediately.

## STATUS (2026-09-05T16:58:33.529Z)
running — dispatched

## COMMENT (2026-09-05T17:19:17.171Z)
SA docs d3afe2b on main (honest labels). Implementation fb49e53 live on 33e7ce64 pending independent reviewer t_rev_gc1.

## STATUS (2026-09-05T17:19:17.248Z)
done — docs confirmation on main d3afe2b; AP owned by t_g2_c1b
