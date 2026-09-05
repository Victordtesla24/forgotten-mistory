# t_f26bd0ff — R-c13 MOT-C13-05 — At the one sampled pointer position the compass readout did not change; one sample is not a proof of absence, and this s

**Status:** todo · **Priority:** 70 · **Parents:** t_4adf34f7 · **Created:** 2026-09-05T07:30:51.433Z

## YOUR ROLE
tester — testing / qa (docs/prompt.md §5). #about · minor · Inferred · source motion. Finding: At the one sampled pointer position the compass readout did not change; one sample is not a proof of absence, and this state has now been reported twice

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 TDD: write the acceptance as a spec first — A Playwright spec that, for all ten sectors, hovers the sector centroid and asserts #about innerText changes and names that dimension; and that the same ten are reachable by keyboard with ArrowRight/ArrowLeft from #compass-open.
- S-2 Implement the direction: Verify with a hover over each of the ten sector centroids and over #compass-hub. If any sector fails to update the readout, bind the readout to pointerenter on the sector path element rather than to a hit area the bezel overlays. Regardless of outcome, add the regression test — this exact state has now been reported twice (R-c8 MOT-F-2 was reported worked).
- S-3 Battery (tsc/lint/audit 10/10/build) + the section suites; screenshots where visual; commit + evidence; push

## QUALITY GATES
- [ ] acceptance spec red → green
- [ ] battery green
- [ ] no gold introduced; tokens only

## VERIFICATION
```bash
# files: components/sections/About/Compass.tsx, components/sections/About/About.tsx, tests/e2e/
```

## HIERARCHY
role_matrix: testing / qa → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
