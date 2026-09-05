# t_60d9cd7a — Scenes 5 + 6 — #vitrine and #listen flagships: GLSL fields under the plates and the caliper (R2, M1)

**Status:** todo · **Priority:** 84 · **Parents:** t_cba10f82, t_6fb8914b · **Created:** 2026-09-05T06:20:05.931Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). SPEC-v10.md c20 minus the C-02 rail fix (cycle 11 lands it). #vitrine: 6 SVG drawings, 0 canvases → a shader field under the rail that answers the lit plate; #listen: CSS caliper beat, 0 canvases → a field that answers the caliper-close (the CSS beat stays the single motion beat, MOT-F-4). Files: components/sections/Vitrine/VitrineField.tsx, vitrine.glsl.ts, Vitrine.tsx, Vitrine.module.css, components/sections/Listen/ListenField.tsx, listen.glsl.ts, Listen.tsx, Listen.module.css; tests/overhaul/scene-vitrine.spec.ts + scene-listen.spec.ts (TDD first). Two commits; if the 30-min cap approaches, ship #vitrine and return goal_complete:false naming #listen.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read SPEC-v10.md c20; read cycle-11 07-decisions.md so the rail/lit-plate logic is reused, not duplicated.
- S-2 TDD both specs: one canvas each at ?gl=force after entry; zero under reduced motion with SVG/CSS intact; no-GL readable; TC-LISTEN-06..08 and TC-VIT-01..13 still green. Run → red.
- S-3 Implement both fields through <Scene>; palette tokens only; gold untouched.
- S-4 Battery; screenshots; commits `feat(vitrine): …` / `feat(listen): …` + evidence; push.

## QUALITY GATES
- [ ] both specs red → green
- [ ] existing vitrine + listen suites green
- [ ] battery green; no new asset; reduced-motion/no-GL proven

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-vitrine.spec.ts tests/overhaul/scene-listen.spec.ts tests/e2e/vitrine.spec.ts tests/e2e/listen.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T08:30:41.924Z)
running — scenes 5+6 lane dispatched (vitrine + listen fields), port 5602
