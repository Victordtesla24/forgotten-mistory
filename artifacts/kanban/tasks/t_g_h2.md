# t_g_h2 — ADV-FAIL P0 — G-H2/G-X1 Signature scene architecture

**Status:** ready · **Priority:** 96 · **Lane:** G-H2 · **Port:** — · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (max). The independent reviewer FAILED R2 (Three.js/R3F + **HyperFrames** + GLSL, ≥ 7 signature scenes @ 60 fps desktop + 2021+ phone, reduced-motion fallback each), R5 (2160p60 surfaces), §0.3-1 (one Marvel-grade flagship per section) and G-H2 (hero atmosphere is a shy backdrop under a heavy scrim; GL mounts idle-deferred so first paint is blank; HyperFrames = 0 in package.json). Root cause #3 in the review: agents renegotiated HyperFrames / 2160p60 / ≥7 scenes out of existence. Your job: a binding, TDD-first architecture that MEETS the bar — not one that renames it. No implementation; no "Owner decision required" parking (§0.1 — you decide, log the decision with reversal cost).

## EXECUTION ORDER
- S-1 Ground truth: read docs/prompt.md §2.1, §3 R2/R5, §0.3, §14 C-1/C-6; artifacts/adversarial/ADV-REVIEW-20260905.md; components/gl/Scene.tsx + GLCanvas.tsx + useGLCapability.ts; every existing scene (Hero/HeroAtmosphere + atmosphere.glsl.ts, About/AboutField + field.glsl.ts, Experience/CareerStrata*, Vitrine/VitrineField + vitrine.glsl.ts, Listen/* field, Skills/BenchField in worktree wf_c06ca2f9-9de-1); tests/overhaul/flagship-visibility.spec.ts + cinematic.spec.ts + tests/perf; docs/SPEC-v10.md and docs/review.md if present; the deploy pipeline (.github/workflows/deploy.yml — static Firebase export, 500 kB asset cap, no server).
- S-2 Research HyperFrames for real: `npx skills add heygen-com/hyperframes` docs / https://github.com/heygen-com/hyperframes (use WebFetch / context7 / the HyperFrames MCP read tools if reachable). Determine concretely: (a) what HyperFrames is (HTML+GSAP programmable video compositions, renderable to MP4/WebM and previewable in-browser), (b) how it can be integrated into a Next.js static export honestly — e.g. HyperFrames-authored compositions as in-page cinematic sequences (hero intro / section transitions) AND/OR as the render pipeline for the 2160p60 hero/avatar video assets — with exact package names, versions, bundle cost, and 60 fps feasibility on a 2021 phone. If a part is genuinely infeasible on static hosting, say so with evidence and the honest substitute that still meets the Marvel bar — never a silent narrowing.
- S-3 Design the 7 signature scenes (one per section = 6, plus the MiniVic viseme stage = 7): for each — what it shows, why it tells that section's story (§0.3-6), R3F vs raw three vs GLSL quad, GSAP/ScrollTrigger choreography, DPR/perf budget (median rAF ≤ 16.7 ms at 1440, ≤ 20 ms at 390), reduced-motion static frame, no-GL fallback, palette (black/white/gold tokens only, gold = sourced mark), and the exact acceptance test that proves it (test file + assertion). Include G-H2 specifically: hero stage without idle deferral blanking first paint (e.g. static poster frame → scene crossfade), scrim as a graded text-plate not a 0.86 wash, full-bleed composition.
- S-4 R5 plan: which surfaces/assets can honestly reach 3840×2160 / 60 fps on static Firebase (SVG/GL are resolution-independent — say how to PROVE it; raster/video assets need ≥ 4K sources — Higgsfield has 0 credits: state the exact unblock and the interim honest state). No fake PASS.
- S-5 Deliverables: `docs/architecture/SIGNATURE-SCENES-v1.md` (winning design + 2 alternatives with trade-offs; scene table; per-scene acceptance tests; HyperFrames integration decision; R5 plan; risk register; decision log with reversal costs) and `docs/architecture/SIGNATURE-SCENES-TASKS.json` — an ordered list of ≤ 30-minute board tasks {slug,title,assignee (§5 profile),priority,parents,summary,order[],gates[],verify[]} the orchestrator can feed to `scripts/pm/kanban.mjs create` verbatim, each shipping a recruiter-VISIBLE slice on the 10-minute cadence. Commit both files on a fresh branch and push (docs only — this branch does not need a build). Return structured output.

## QUALITY GATES
- [ ] Every R2/R5/§0.3-1 clause is either designed-to-meet with a named test, or stated infeasible WITH evidence and the honest substitute — zero silent narrowing
- [ ] HyperFrames decision is grounded in fetched documentation (cite URLs / package versions), not assumption
- [ ] 7 scenes × (story, tech, perf budget, reduced-motion, no-GL, palette, acceptance test) complete
- [ ] SIGNATURE-SCENES-TASKS.json validates as JSON, every assignee is a §5 profile, every task ≤ 30 min with a verify command
- [ ] Branch pushed; no production code touched

## VERIFICATION
```bash
python3 -c "import json;d=json.load(open('docs/architecture/SIGNATURE-SCENES-TASKS.json'));assert all(t['assignee'] in {'analyst-programmer','tester','reviewer','solutions-architect','researcher','coder','cleanup-agent'} for t in d);print(len(d),'tasks ok')"
grep -c -E 'HyperFrames' docs/architecture/SIGNATURE-SCENES-v1.md
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-H2/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/solutions-architect.SOUL.md + solutions-architect.system-prompt.md (+ /root/.sub-agents/council/solutions-architect.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:28.020Z)
running — dispatched 12:1xZ — solutions-architect max opus, Workflow wf_2cd21f31-055 architect:signature-scenes, docs-only worktree

## COMMENT (2026-09-05T12:23:00.168Z)
REVIEWER BASELINE for G-H2 (measured): 0 canvases on a NORMAL load at 1440 and 390 (GL only under /?gl=force — capability gate or deferral: establish which, with the real-GPU spoof pass); .Hero_stage scrim linear-gradient(90deg, rgba(10,10,10,.68) …) covers the left of the frame; HyperFrames string count in served chunks = 0. Council: full-bleed single-layer stage, directional key ≤0.35 alpha + text-protection no larger than the headline box, scene on the critical path with a 900 ms settle, reduced-motion = the same picture stopped.

## COMPLETE (2026-09-05T12:24:54.561Z)
solutions-architect delivered docs/architecture/SIGNATURE-SCENES-v1.md + SIGNATURE-SCENES-TASKS.json (0b0bf02, consolidated to main). Orchestrator verified: 14 tasks validate (assignees §5, verify commands present), HyperFrames decision grounded in fetched README + npm (v0.8.29: player 17.6 kB gz in-page for hero overture + viseme stage; CLI+engine at build time render 3840×2160@60 masters on this VPS at zero credits — the R5 unblock), GSAP+ScrollTrigger adopted, Scene priority prop for hero first paint, R5 raster reported FAIL with waivers (no re-scoping). Imported as t_x1_01…t_x1_14 (g-s1-04 = t_g_s1). Next lanes: t_x1_01 (fps harness, tester) → t_x1_02/03 (hero first paint + graded plate).

## STATUS (2026-09-05T14:22:58.094Z)
running — REOPENED per RECTIFY 14:12Z — Architecture docs are not PASS; awaiting live first-paint/poster PASS via t_x1_02/t_x1_03.

## COMMENT (2026-09-05T14:22:58.142Z)
Architecture docs are not PASS; awaiting live first-paint/poster PASS via t_x1_02/t_x1_03. Live state 14:22Z: desktop wash gone + column-bound grade (9e41474), phone scene lit, priority Scene mechanism proven, JS-off page paints (6f4ba6c); FAIL clauses open: real url() poster ≥ 0.10 luminance (t_x1_02c running), first-paint canvas timing (SwiftShader 1.4 s after DCL — GPU numbers via t_x1_01c). Closes only on a live reviewer PASS.

## COMPLETE (2026-09-05T14:36:53.151Z)
G-H2 PASS on live d5227962/66199cba by independent reviewer (t_rev_h2_next, e16521a) — the LIVE evidence the RECTIFY demanded: desktop 0.68 wash gone (flagship-C + 9e41474 column-bound grade), phone scene lit (100% coverage @390 gl), hero atmosphere in the first paint as a REAL rendered 4K frame (ee334cc) with the priority Scene crossfading over it, JS-off page paints fully (6f4ba6c), AA and floors hold, CLS 0, LCP < 1.5 s. Architecture docs (0b0bf02) were the plan, not the PASS. Still OPEN elsewhere (not claimed here): R2 60 fps unproven (software rasteriser only), HyperFrames in-page overture (t_x1_11), MiniVic viseme stage (t_x1_07).
