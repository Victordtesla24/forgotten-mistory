# t_fc52fa8b — §0.3-2 / C-8 — black, white, gold only; gold = sourced-claim mark

**Status:** todo · **Priority:** 75 · **Parents:** t_cc03ed93, t_3729f57e · **Created:** 2026-09-05T05:58:06.011Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Held by the static audit raw-hex gate + tests/monochrome; v9 cycle 5 moved tokens to neutral AA. Open: C-08 gold mass in #skills (cycle 17) and the zinc pip on the launcher (cycle 16).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 closes with cycles 16 + 17 and an R-c13 palette pass

## QUALITY GATES
- [ ] tests/monochrome green
- [ ] R-c13 palette section clean

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/monochrome
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
