# t_g2_s2 — ADV-1451Z P1 — G-S2 Skills: make skills-bench the narrative carrier (the light reads the tested/production rows and the hovered wire, not only atmosphere under the table) + a section CTA (CV dossier)

**Status:** todo · **Priority:** 76 · **Parents:** — · **Created:** 2026-09-05T14:57:53.786Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). 1451Z review §Skills: the story is the evidence table, not the GL plate; no section CTA. Acceptance: bench.glsl.ts uniforms from the table state (measured-in-production rows lift the field where their wire lands; hover already feeds uHover — extend to the row set), reduced-motion composed still; one quiet CTA at the end of the section (Download CV — the employer path, R4) with cta-duplication rules respected; floors, AA, gold budget hold.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read Bench.tsx/BenchField.tsx/bench.glsl.ts, skills.ts, scene-skills.spec, cta-duplication.spec.
- S-2 TDD; S-3 implement; PUSH RULE; evidence.

## QUALITY GATES
- Light follows the data (measured); CTA present and allowed by cta-duplication; floors/AA/gold hold
- ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5634 npx playwright test tests/overhaul/scene-skills.spec.ts tests/overhaul/cta-duplication.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T17:39:33.870Z)
WAVE2: queue skills-bench narrative carrier.

## COMMENT (2026-09-05T17:55:22.782Z)
C16 PARK: P1 G-S2 dirty worktree gs2-1556 (Bench/Skills/glsl). Resume after first-wave live PASSes with a NEW identity. Not boarded.

## COMMENT (2026-09-05T18:01:09.520Z)
Parked worktree was consolidated to live 545df77b (c0a2c86). Do NOT mark done on self-report — independent reviewer this commit.

## STATUS (2026-09-05T18:07:43.567Z)
running — P1 on live 545df77b (c0a2c86) — awaiting independent reviewer; not done on self-report

## COMMENT (2026-09-05T18:07:43.656Z)
Author 81789d73 sha c0a2c86 already live on 545df77b (bench uRows + Download CV). Independent reviewer rev-545df77b-c17 in flight. Do not complete on self-report.

## COMMENT (2026-09-05T18:11:01.681Z)
Still live (c0a2c86 ancestor of 0892d092). Reviewer retargeted to 0892d092. Do not complete on author 81789d73 self-report.

## COMMENT (2026-09-05T18:34:14.526Z)
C19 left G-S2 OPEN. c0a2c86 on live. Focused reviewer dispatched. Do not complete.

## COMPLETE (2026-09-05T19:32:50.600Z)
PASS live 64404134. Bench_figure 1248x775 dominant in #skills; 126 bench nodes; no proficiency bars. https://forgotten-mistory.web.app/ build-commit 64404134 · independent rev-64404134-c22 · docs/delivery/evidence/v10-20260905T0515Z/G-REV/64404134/08-adversarial-review.md + verdicts.json
