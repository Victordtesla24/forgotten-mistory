# t_w2_x2sa — WAVE-2 architecture — G-X2 / R2: the seventh signature scene as a REAL cinematic story scene (not a viseme census), plus the 'story' contract that turns the existing six fields from wallpaper into flagships; TDD fps/reduced-motion/recall tests first; ≤30-min slices

**Status:** todo · **Priority:** 93 · **Parents:** t_w2_h1r · **Created:** 2026-09-06T00:59:04.313Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). ADV-2315Z R2 FAIL: six data-scene slots, GL is wallpaper, not ≥7 cinematic 60 fps scenes; §14 Marvel FAIL: no set-piece WoW. Prior SA docs: docs/architecture/SIGNATURE-SCENES-v1.md (+ NEXT.json, TASKS.json) and board t_x1_10 (HyperFrames 4K masters on this VPS) / t_x1_11 (@hyperframes/player overture) / t_x1_12 (GSAP ScrollTrigger). Research input: W2-RESEARCH/G-H1-G-X2-prior-art.md §seventh scene incl. the HyperFrames verdict. Zero credits: everything must be GLSL/R3F/pre-rendered-from-existing-masters. This task decides what scene 7 IS, where it mounts, what story it tells, how 60 fps on a 2021 phone is proven, and what makes each existing field carry its section's story (the recall contract already used for G-A3: hide the chrome and the field still tells the section).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: docs/prompt.md R2, §0.3-1/-6, §2.1, §14 C-1/C-6; ADV-2315Z (R2 row, Experience/Skills/Vitrine/Listen rows); GAP-BACKLOG G-X2/G-E2/G-S2/G-H2; SIGNATURE-SCENES-v1.md, SIGNATURE-SCENES-NEXT.json, SIGNATURE-SCENES-TASKS.json; the research doc; components/gl/Scene.tsx (sceneId, priority, capability, context-loss); each section's field file (About/field.glsl.ts, Experience/strata.glsl.ts, Skills/bench.glsl.ts, Vitrine/vitrine.glsl.ts, Listen/listen.glsl.ts, Hero/atmosphere.glsl.ts); tests/overhaul/scene-*.spec.ts and the frame-rate harness (board t_x1_01: median rAF per sceneId); artifacts/masters/ inventory (ls -la; 4K master, 1080p voiced, 720p idle — untracked, never commit).
- S-2 Decide scene 7: candidates — (i) a hero 'overture' pre-rendered from the 4K master + GLSL (HyperFrames only if the research verdict says it adds real value), (ii) a page-spine scene that travels between sections (the ledger figures as light that flows from hero to experience), (iii) a MiniVic 'presence' scene that is a real GLSL portrait-light stage (NOT the viseme canvas). Pick one, name its story in one sentence a recruiter would repeat, its mount (sceneId, section, z-order), its uniforms/data source (must trace to resume data), DPR cap and instancing budget, reduced-motion static frame, no-GL still, and its cost on a 2021 phone (estimate labelled as estimate until measured).
- S-3 Story contract for the six existing fields: for each section define the ONE thing the field must communicate with the chrome hidden (as G-A3's TC-SCENE-ABOUT-10 does for About) and the measurable assertion (e.g. Experience: ≥ 2 visible strata depth planes and role durations legible as bands; Skills: bench light reads the tested/untested split; Vitrine: six plates as light; Listen: the greeting envelope). Where the current shader cannot, say so and slice it.
- S-4 TDD first: fps harness thresholds per sceneId (median rAF ≤ 16.7 ms at 1440, ≤ 20 ms at 390 under ?gl=force is NOT proof — define the GPU-spoof or real-device path honestly; SwiftShader numbers are labelled as such), reduced-motion static test per scene, recall tests per section, 0 pageerrors under ?gl=force, plane-dominance per section. Write to docs/architecture/SIGNATURE-SCENES-v2.md (new) + update SIGNATURE-SCENES-TASKS.json in place with ≤ 30-min slices for scene 7 and for each field's story upgrade (ordered by recruiter visibility: Hero/Experience first).
- S-5 Return {task_id:'t_w2_x2sa', scene7:{name, story_sentence, mount, data_source, budget}, story_contract:[{section, assertion}], tests:[…], slices:[{id,title,files,gates,minutes}], hyperframes_verdict, doc:'docs/architecture/SIGNATURE-SCENES-v2.md', goal_complete:true}. Read-only for app code; ≤ 30 min.

## QUALITY GATES
- Scene 7 is a real cinematic scene with a resume-traceable story, not a widget or census
- Every existing field has a measurable story assertion or an honest 'cannot yet' with a slice
- fps proof path is honest about SwiftShader vs GPU
- Slices ≤ 30 min, ordered by recruiter visibility
- Doc + TASKS.json updated in place; no app code edited

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/architecture/SIGNATURE-SCENES-v2.md && grep -c 'scene' /root/forgotten-mistory/docs/architecture/SIGNATURE-SCENES-TASKS.json
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:05:36.099Z)
running — dispatched 01:07Z fm-wave2-sa (sequential, opus max)

## COMPLETE (2026-09-06T01:39:26.258Z)
SA delivered docs/architecture/SIGNATURE-SCENES-v2.md (34.6 kB; PM verified) + SIGNATURE-SCENES-TASKS.json updated: scene 7 = career-descent (sticky 160vh band in #experience after the chart; uSpans from experience.ts; no type over the canvas; resolutionScale 0.5; priority=false), story contract per section with TC-STORY-* assertions (two honest cannot-yets: hero poolPlate unbound → owned by HERO-SETPIECE-v3; strata parallax → x2-f1), three-tier fps proof (only Tier B GPU may say 60 fps), HyperFrames NOT shipped (honest zero-credit branch), 13 slices ≤ 30 min.
