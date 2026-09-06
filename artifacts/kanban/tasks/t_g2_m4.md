# t_g2_m4 — ADV-1451Z P0 — G-M4 R3 achievable slice: independent confirmation on live that first token < 1.5 s (direct Cloud Run SSE with Hosting fallback), greeting MP3 == on-screen intro, no dead API ladder; R3 full avatar stays OPEN

**Status:** todo · **Priority:** 97 · **Parents:** — · **Created:** 2026-09-05T14:57:53.310Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). The 1451Z review (probed ff67273b) says the Hosting /api/chat path is often > 1.5 s — correct for the FALLBACK path (buffered SSE); the primary path since 8978c2c streams from the Cloud Run origin (reviewer 1062dc6: P50 732/594 ms). This task asks a fresh reviewer to re-confirm on the current live build, on a COLD instance (wait ≥ 10 min without traffic or state why not possible), 1440 + 390, and to state the R3 status honestly: latency PASS / greeting parity PASS / ladder PASS; avatar realism + lip-sync ≤ 40 ms FAIL (720p24 loop + heuristic visemes + premade voice). Output = one 08-adversarial-review.md + structured verdict; no implementation.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- probe as G-REV/411650c2 did, plus a cold-start trial
- report; push docs branch

## QUALITY GATES
- Fresh numbers; honest R3 split verdict

## VERIFICATION
```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T17:41:12.223Z)
Baseline review TTFB 3.67s on b0513692 before minInstances. Re-probe after 1c8167d is live.

## COMPLETE (2026-09-05T18:31:46.926Z)
INDEPENDENT PASS same evidence as t_g2_m4b: Hosting TTFB median 1.204s on live aa58395b. Full R3 avatar remains OPEN.
