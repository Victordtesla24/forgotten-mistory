# t_cba10f82 — R9/TDD — requirements spec + test-case list for every unmet R-item and §0.3 mandate before any further code

**Status:** ready · **Priority:** 96 · **Parents:** — · **Created:** 2026-09-05T05:58:06.011Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). solutions-architect (level 1, max). Produces docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md: for each of R1–R12, O1–O6, M1–M7 the current state (Verified from the live site/repo, with the command), the gap, the binary acceptance test (spec file + assertion), and the cycle that closes it. Inputs: docs/prompt.md §2–§3, §0.2, §0.3, §14; R-c8 review; C13/C11 evidence; this board.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Inventory signature scenes: components/sections/*/ — GLSL (Hero atmosphere, Experience strata) vs SVG/CSS (About compass, Skills bench, Vitrine drawings, Listen caliper); grade each against R2 (Three.js/R3F + GLSL, 60 fps, reduced-motion fallback) and §0.3-1 (one flagship per section). State how many R2-grade scenes exist and the cheapest path to ≥7 without regressing LCP < 2.5 s / 500 kB asset cap.
- S-2 R4 audience paths: walk employer → CV dossier (public/docs/Vik_Resume_Final.pdf link) and client → engagement CTA on the live page with Playwright; record click-through completion or the gap.
- S-3 R3 avatar: design the achievable architecture under the Owner-blocked credit state (OpenRouter −$5.38, Higgsfield 0 credits, ElevenLabs payg/IVC refused): brain = the deployed Cloud Function ladder (OpenRouter first when credited → OpenAI rung today); voice = ElevenLabs stock voice labelled synthetic (no cloning); avatar = pre-rendered loop (existing public/assets/my-hero-avatar.mp4 / minivic-greeting.mp4) with mouth-state switching driven by the audio envelope; latency budget ≤1.5 s first word. List the exact tests (tests/e2e/avatar-*.spec.ts) that prove it, and the parts that stay Owner-blocked (true lip-sync ≤40 ms needs a generated viseme track).
- S-4 R5/R6 4K: inventory every raster/video asset in public/ with `identify`/`ffprobe`; list which are ≥3840×2160/2160p60 and which are Owner-blocked (generation needs credits); no fabricated 4K.
- S-5 R1/§0.3-6 narrative: per section, the story beat it tells and the missing beat; feed R-c13.
- S-6 Write SPEC-v10.md with a table R-id → state → gap → test → cycle; then create the board children (title + acceptance) in artifacts/kanban/tasks/ via the orchestrator (return them as structured output).

## QUALITY GATES
- [ ] every R/O/M id has a row
- [ ] every gap has a named spec file + assertion
- [ ] no claim without a command/URL
- [ ] Owner-blocked items named as such with the credit that unblocks them

## VERIFICATION
```bash
test -s docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md && grep -c "^| R" docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T06:01:51.566Z)
running — Workflow wf_fd340253-7ea (solutions-architect:spec-v10 opus max)

## COMPLETE (2026-09-05T06:20:07.325Z)
SPEC-v10.md written (25 rows R1–R12/O1–O6/M1–M7; scene inventory 2 GLSL + 4 SVG/CSS + avatar stage; 13 proposed tasks → 9 created, 4 merged into existing). Orchestrator verified the file exists and the rows parse.
