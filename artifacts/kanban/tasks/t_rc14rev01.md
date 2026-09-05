# t_rc14rev01 — R-c14 — adversarial + composition + motion council review of the LIVE site after the P100 fix, cycles 15/16/16b and the React 19 upgrade (O2/O6); PASS required to close the refactor loop

**Status:** todo · **Priority:** 95 · **Parents:** t_86cdd156, t_c16b0001, t_r19r3f9 · **Created:** 2026-09-05T07:41:48.957Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Same three lenses and merge as R-c13 (docs/delivery/evidence/v10-20260905T0515Z/R-c13/review.md is the template and the open backlog); precondition: live build is a descendant of the last of the three parent merges; must include the hardware-GPU spoof pass and the ?gl=force SwiftShader pass (0 pageerrors, canvases per section), every R-c13 item re-graded (closed / open), and the §0.3 mandates.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 adversarial lens
- S-2 composition lens
- S-3 motion lens
- S-4 merge: verdict + backlog with existing_task mapping

## QUALITY GATES
- [ ] every R-c13 item re-graded with evidence
- [ ] GPU-spoof + gl=force passes clean
- [ ] verdict stated

## VERIFICATION
```bash
ls docs/delivery/evidence/v10-20260905T0515Z/R-c14/
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
