# t_rev_s56 — Reviewer probe — S5 vitrine-field + S6 listen-field on the live build carrying 192d743: canvases with sceneIds at /?gl=force, flagship floors (coverage ≥ .15 @Δ.06, peak ≥ .35, motion ≥ .004, still lit), gold only on live-URL plates / none in listen, AA both paths, no regression to the other five scenes

**Status:** todo · **Priority:** 95 · **Parents:** — · **Created:** 2026-09-05T14:40:11.403Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). One-Deploy reviewer task (RECTIFY cadence). Verify on live: [data-scene=vitrine-field] and [data-scene=listen-field] mount one webgl canvas each at 1440 and 390 under /?gl=force after scroll-and-wait; measure coverage/peak/motion with the flagship-visibility method; reduced-motion: 0 canvases, still lit ≥ 8%; AA walk over #vitrine and #listen on both paths (the fields sit under plates/copy); gold census: vitrine gold only on live repository URLs, listen zero gold; 0 pageerrors; the other five scenes unchanged (hero/about/experience/skills floors). Verdict per scene; failures first; false-positive register vs the checkpoint commit; push evidence; orchestrator completes this task on receipt.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- wait for the Deploy carrying 192d743 (orchestrator dispatches with the build id)
- probe with your own scripts (method parity with G-REV/abc475e3 and /9b864752)
- report + captures; push

## QUALITY GATES
- Fresh live numbers per clause
- Failures first; register present

## VERIFICATION
```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T14:41:43.254Z)
running — dispatched 14:42Z on live ff67273b (checkpoint 192d743 + merge)

## COMPLETE (2026-09-05T14:58:24.197Z)
REVIEWER on live ff67273b (G-REV/ff67273b, 6783435): S6 listen-field PASS all clauses (canvas 1440/390, coverage .224/.347, peak .59/.41, motion .0043/.0088, still .25/.30, 0 gold); S5 vitrine-field PASS at 1440 (.224/.376/.0118) and still, FAIL at 390 — peak 0.2918 < 0.35 (repo gate on production: 'brightest pixel is 0.292 — the scene has no core', TC-FLAGSHIP-VIS-VITRINE @390 red on main); AA 0 fails over 96 nodes both paths; gold: 3 live-URL nodes in #vitrine, 0 in #listen, page 7; tests NOT weakened (diff additive); other five scenes hold; 0 errors. F-CLAIM-01: 192d743's spec comment 'held to the full default bar at both widths' outran the evidence. R2 tally: 7 scenes, 6 with sceneId on that build (S7 landed after), 5 passing every floor.
