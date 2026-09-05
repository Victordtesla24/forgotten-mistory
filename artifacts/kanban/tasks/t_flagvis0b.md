# t_flagvis0b — Flagship visibility B: Skills bench field (scene 4, new), Vitrine field and Listen caliper field become unmistakable — same visibility gate; MiniVic viseme stage after

**Status:** todo · **Priority:** 98 · **Parents:** t_flagvis0a · **Created:** 2026-09-05T09:16:20.880Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Second half of the owner correction: #skills has no scene (t_cbff57b0), #vitrine field invisible on live captures (black behind the cards), #listen a faint band. Reuse tests/overhaul/flagship-visibility.spec.ts from lane A; skills bench field brief in t_cbff57b0; vitrine/listen fields exist (1150e3e, d53d228) and need their intensity/structure raised to the gate.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 skills bench field (TDD)
- S-2 vitrine + listen fields to the gate
- S-3 battery, screenshots, push

## QUALITY GATES
- [ ] visibility spec green for skills/vitrine/listen
- [ ] gold unchanged (marks only)
- [ ] TC-CONTRAST-01 green

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/overhaul/flagship-visibility.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T10:50:00.946Z)
running — flagship B lane dispatched, port 5603
