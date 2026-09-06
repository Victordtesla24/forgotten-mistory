# t_w2_x2s1 — WAVE-2 scene-7 x2-s1-career-descent-mount — S7 career-descent — FIRST VISIBLE SHIP: the sticky 160vh band after the chart and accordion in #experience, CareerDescent.tsx + descent.glsl.ts mounted through Scene with sceneId career-descent, priority=false, resolutionScale 0.5, uSpans[8]/uSpanCount from app/data/portfolio/experience.ts (same module as the Gantt), uDescent driven by scroll (60vh = 0→1), year ticks + ONE caption line and nothing else over the canvas

**Status:** todo · **Priority:** 93 · **Parents:** t_w2_x2sa · **Created:** 2026-09-06T01:40:35.350Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Slice x2-s1-career-descent-mount of docs/architecture/SIGNATURE-SCENES-v2.md (SA t_w2_x2sa; research W2-RESEARCH/G-H1-G-X2-prior-art.md). Full slice definition (files, green tests, gates) is the entry with id x2-s1-career-descent-mount in docs/architecture/SIGNATURE-SCENES-TASKS.json and the matching row of v2 §slices. ADV-2315Z R2 FAIL (six wallpaper fields, no seventh cinematic scene) is the baseline; the recruiter sentence scene 7 must earn: 'There is a bit where you scroll and you are falling down sixteen years of his career like a core sample — each job is a layer, and the layers get brighter as you come up to now.' Immovables (v2 §constraints): palette B/W/gold with gold never in a shader; 4.5:1 type contrast first, story second (never add light over type); DPR cap 1.75 and resolutionScale 0.5 not raised; six-section IA unchanged (no seventh section); zero Hero files touched (HERO-SETPIECE-v3 owns that fold); G-MV1 pill never hidden; reduced-motion and no-GL render the same picture; no fps claim from a software rasteriser (Tier A readings labelled 'software-rasteriser'); no ffmpeg/encode in these slices; masters never committed.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w2-x2s1 /root/forgotten-mistory/.claude/worktrees/w2-x2s1 origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules. One build and one Playwright browser at a time; no ffmpeg.
- S-1 Read docs/architecture/SIGNATURE-SCENES-v2.md in full and the x2-s1-career-descent-mount entry in docs/architecture/SIGNATURE-SCENES-TASKS.json; then the files this slice names: components/sections/Experience/{Experience.tsx,Experience.module.css,CareerDescent.tsx (new),descent.glsl.ts (new)}; tests/overhaul/scene-descent.spec.ts (new: data-scene present in the static export, 0 pageerrors under ?gl=force at 1440 and 390, caption-only over canvas, no hex/gold); plus components/gl/Scene.tsx (sceneId, priority, pageSettled, context loss), components/sections/Experience/{Experience.tsx,CareerStrata.tsx,strata.glsl.ts}, app/data/portfolio/experience.ts, tests/perf/scene-framerate.spec.ts, CLAUDE.md gotchas.
- S-2 TESTS FIRST: write/extend the spec the slice entry names with its assertions and thresholds verbatim; run on origin/main and capture FAILING → docs/delivery/evidence/v10-20260905T0515Z/W2-X2/t_w2_x2s1/02-tests-failing.log.
- S-3 Implement slice x2-s1-career-descent-mount exactly as the entry and v2 describe; smallest change; delete orphaned CSS in the same commit.
- S-4 Verify: npx tsc --noEmit · npm run lint · npm run build:static · node scripts/validate/overhaul_static_audit.mjs (10/10) · python3 -m http.server 5614 --directory out & then PLAYWRIGHT_BASE_URL=http://127.0.0.1:5614 npx playwright test <this slice's spec files> tests/e2e/experience.spec.ts (kill the server after) · ?gl=force probe: 0 pageerrors, canvases ≥ expected at 1440 and 390. Screenshots of #experience at 1440 and 390 (GL, reduced-motion, no-GL) → W2-X2/t_w2_x2s1/. LOOK at them.
- S-5 Ledger before commit: git add -A; node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w2_x2s1 --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w2_x2s1.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w2-x2s1 -- <files>. Commit 'feat(experience): x2-s1-career-descent-mount' with trailers Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com> and Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC; git push -u origin worktree-w2-x2s1 (once; report push_denied with sha if refused).
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, measurements:{...}, gates:{tests_first, tsc, lint, build, audit_10_10, slice_tests, gl_force_0_pageerrors, hero_files_untouched, no_gold_in_shader}, evidence:[], decisions:[], goal_complete}.

## QUALITY GATES
- Slice entry's gates satisfied verbatim (no threshold lowered; red-authored tests stay red until their owning slice lands)
- tsc · lint · build:static · audit 10/10 · slice spec + experience e2e green (or red-by-design cases documented)
- Zero Hero files touched; gold never in a shader; type contrast untouched; G-MV1 pill visible
- ?gl=force 0 pageerrors at 1440/390; screenshots attached
- Ledger before commit; pushed or push_denied; ≤ 30 min

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w2-x2s1 && node scripts/validate/overhaul_static_audit.mjs | tail -2
git ls-remote --heads origin worktree-w2-x2s1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T02:11:32.267Z)
running — dispatched 02:12Z fm-wave2-scene7 (s1 → t1 → s2)

## COMMENT (2026-09-06T02:48:46.820Z)
PM check 02:49Z: consolidated into origin/main and LIVE 97e19d07. Independent reviewer t_w1_rev4 judges on live.

## COMMENT (2026-09-06T02:59:20.447Z)
Lane result 03:00Z (ap-w2-x2s1): daa4f57 pushed and LIVE (97e19d07 → 4043b8e9). Seven data-scene slots in the served HTML; career-descent = 160vh sticky band after the chart+accordion in #experience (140vh phone branch; 100vh under reduced motion), uSpans[8] from experience.ts (same module as the Gantt), caption from experienceContent.descentCaption (data module = single source of truth), 0 pageerrors under ?gl=force at 1440/390 on GL/reduced-motion/no-GL paths, canvases 1/1, gold 0, no raw hex, six-section IA unchanged, Hero files untouched; scene-descent (9) + scene-experience (13) + experience e2e (9) green after 8 red on baseline; TC-SCENE-EXP-06 strengthened (scoped to the chart slot). Field brightness raised after LOOKING at the first screenshot (strata base 0.26/0.42, seam 0.72). O1 overrun ~50 min (diagnosis + brightness + reduced-motion ordering), reported honestly. Interim review by t_w1_rev4; R2/G-X2 graded after s2/s3.
