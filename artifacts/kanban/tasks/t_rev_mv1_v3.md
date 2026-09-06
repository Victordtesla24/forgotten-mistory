# t_rev_mv1_v3 — Reviewer probe — G-MV1 (MiniVic label visible at ≤640 px, no unlabeled disc over the portrait) and G-V3 (vitrine stroke contrast ≥ 4.5:1 per plate, description AA through entrance, vitrine-field 390 peak ≥ 0.35) on the live build carrying the MV1/V3 lane's pushes

**Status:** todo · **Priority:** 97 · **Parents:** — · **Created:** 2026-09-05T15:09:09.997Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). One-Deploy reviewer task. On live: at 390 and 640 the launcher shows a visible text label (computed visibility/opacity, text content), ≥ 44 px target, AA on its ground, not intersecting the hero portrait or actions while docked; at 834/1440 unchanged. Vitrine: composited primary stroke contrast per plate at rest (six plates), labels, guide lines, description at t=0/300/600 ms of the entrance; lit plate heavier; vitrine-field at 390 gl=force: peak ≥ 0.35 (repo gate TC-FLAGSHIP-VIS-VITRINE @390 run against production), 1440 unchanged; gold only on live-URL plates; AA both paths for #vitrine; 0 pageerrors. Verdict per clause; failures first; false-positive register vs the lane's commit messages; push evidence.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- wait for the Deploy carrying the MV1 push (and V3 if landed)
- probe; report; push

## QUALITY GATES
- Fresh live numbers per clause

## VERIFICATION
```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
