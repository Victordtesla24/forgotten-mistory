# t_9cd97adc — R-c13 MOT-C13-07 — HeroAtmosphere carries a full reduced-motion implementation that can never run — Scene.tsx:91 gates the mount first — le

**Status:** todo · **Priority:** 60 · **Parents:** t_4adf34f7 · **Created:** 2026-09-05T07:30:51.696Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). #hero · polish · Verified · source motion. Finding: HeroAtmosphere carries a full reduced-motion implementation that can never run — Scene.tsx:91 gates the mount first — leaving two competing policies with no note

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 TDD: write the acceptance as a spec first — Either the block is gone and reduced motion still reports zero canvases and zero running animations across all six sections, or the comment at HeroAtmosphere.tsx:20 states the redundancy explicitly.
- S-2 Implement the direction: Not urgent and not wrong, but either delete the block and let Scene.tsx:91 be the single policy, or keep it and say so in one line at HeroAtmosphere.tsx:20 ('belt-and-braces; Scene already gates this'). Do not leave two policies with no note.
- S-3 Battery (tsc/lint/audit 10/10/build) + the section suites; screenshots where visual; commit + evidence; push

## QUALITY GATES
- [ ] acceptance spec red → green
- [ ] battery green
- [ ] no gold introduced; tokens only

## VERIFICATION
```bash
# files: components/sections/Hero/HeroAtmosphere.tsx:20,51-76,88-92, components/gl/Scene.tsx:91
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
