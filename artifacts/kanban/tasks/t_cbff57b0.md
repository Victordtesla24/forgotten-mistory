# t_cbff57b0 — Scene 4 — #skills flagship: GLSL bench field behind the wire diagram (R2, M1)

**Status:** todo · **Priority:** 86 · **Parents:** t_cba10f82, t_3729f57e · **Created:** 2026-09-05T06:20:05.764Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). SPEC-v10.md c19: #skills has 0 canvases (20-path SVG bench). Add a shader field mounted through components/gl/Scene.tsx that lights the sourced edges; gold stays a mark (≤ 6 gold-painting elements after cycle 17). Files: components/sections/Skills/BenchField.tsx, bench.glsl.ts, Skills.tsx, Skills.module.css; tests/overhaul/scene-skills.spec.ts (TDD first).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read SPEC-v10.md c19 acceptance and the cycle-17 outcome (gold rest opacity).
- S-2 TDD scene-skills.spec.ts: one canvas at ?gl=force after entry; zero under reduced motion with the SVG visible; no-GL readable; gold-painting elements in #skills ≤ 6. Run → red.
- S-3 Implement bench.glsl.ts + BenchField.tsx (one quad, DPR cap, no new asset/dependency); hover feeds a uHover uniform like CareerStrata.
- S-4 Battery; screenshots; commit `feat(skills): the bench sits on a lit field`; push.

## QUALITY GATES
- [ ] spec red → green
- [ ] battery green; asset budget unchanged
- [ ] gold ≤ 6 elements in #skills, only on sourced marks

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-skills.spec.ts tests/monochrome
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T10:50:01.011Z)
running — skills bench field built inside flagship B

## STATUS (2026-09-05T12:09:07Z)
running — continued 12:0xZ as t_g_s1 (G-S1) in worktree wf_c06ca2f9-9de-1
