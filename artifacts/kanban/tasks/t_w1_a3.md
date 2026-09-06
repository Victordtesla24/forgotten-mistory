# t_w1_a3 — WAVE-1 P0 — G-A3 About: the GL field ITSELF tells the ten dimensions (ten legible light sectors, answered lit / open dim, hub count readable from light alone); the SVG compass becomes chrome; proven by a test that hides the SVG and still reads ten sectors

**Status:** todo · **Priority:** 96 · **Parents:** t_w1_h6h5 · **Created:** 2026-09-06T00:08:32.096Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ADV-REVIEW-20260905T2315Z §About: on live 9136bc59 a recruiter names the SVG compass dial (01–10, hub 01/04 ANSWERED), not the GL field, even though the field is now the section's 1248x900 plane (4eb4c8a). Docs commit 9136bc59 claiming 'G-A3 PASS' is a false positive. GAP-BACKLOG acceptance: recruiter recall of #about is the GL field, not the SVG radar; hide the SVG for 3 s on GPU load and the remaining picture still tells ten sectors; restore the SVG and the field still carries ≥ ~75% of the visual weight; gold/hatch honesty stays green. Data lives in app/data/portfolio/about.ts (ten dimensions, each with a caliper state). Gold never enters the shader (gold = sourced claim only, drawn by Caliper/compass chrome).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w1-a3 /root/forgotten-mistory/.claude/worktrees/w1-a3 origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules (npm ci if the symlink breaks the build).
- S-1 Read: docs/prompt.md §0.3-1/-6 and §14 C-6/C-8; docs/adversarial/ADV-REVIEW-20260905T2315Z.md §About; docs/adversarial/GAP-BACKLOG.md G-A3; docs/delivery/evidence/v10-20260905T0515Z/G-REV/d19939ac/G-A3-REVIEW.md (the invalidated PASS — learn what it measured and why that was not recall); app/data/portfolio/about.ts; components/sections/About/{About.tsx,AboutField.tsx,field.glsl.ts,Compass.tsx,About.module.css,Compass.module.css}; components/gl/Scene.tsx + useGLCapability.ts; tests/overhaul/scene-about.spec.ts (TC-SCENE-ABOUT-08/09), tests/overhaul/flagship-visibility.spec.ts (-g ABOUT), tests/a11y/text-contrast.spec.ts, tests/e2e/about.spec.ts; CLAUDE.md gotchas (reduced-motion + no-GL paths mandatory, DPR cap, dead CSS fails the audit).
- S-2 TESTS FIRST — add to tests/overhaul/scene-about.spec.ts and capture them FAILING on origin/main (→ docs/delivery/evidence/v10-20260905T0515Z/W1-A3/02-tests-failing.log): TC-SCENE-ABOUT-10 'the field alone tells ten sectors': at 1440x900 with ?gl=force, scroll #about so the field is in view and the k-th dimension (k from about.ts, pick k=4) is active; inject CSS that hides the SVG compass and the text column (visibility:hidden) for the capture; screenshot the canvas; around the compass centre sample ten 36° sectors on the annulus r∈[0.26,0.42]·min(w,h) and compute mean luminance per sector; assert (i) the ten sectors are individually legible: at least 9 of 10 sector boundaries show a luminance step ≥ 12% relative to the sector mean (lobes, not a smooth wash), (ii) sectors 1..k (answered) have mean luminance ≥ 1.6× sectors k+1..10 (open) with the SAME ordering the SVG uses, (iii) no sampled pixel is gold (hue 35–60°, saturation > 0.25). TC-SCENE-ABOUT-11 'the compass is chrome': with everything visible, luminance-weighted plane dominance of the canvas over the section's first viewport ≥ 0.75 (sum of pixel luminance above the section background contributed by the canvas ÷ total; use a screenshot with the canvas visible vs the canvas hidden) and the SVG's brightest stroke ≤ the luminance of --mist-400 from app/globals.css. Keep TC-SCENE-ABOUT-08/09 green (rewrite 08 only if its contract contradicts 10/11, and say so in the commit).
- S-3 Implement in field.glsl.ts + AboutField.tsx (+ Compass.module.css / About.module.css for the chrome demotion): ten radial sectors driven by uniforms derived from about.ts (count, active index, per-dimension state) — answered sectors luminous white with structured light (the strata/haze language already in the shader), open sectors dim with a visible hatch/absence, boundaries crisp enough to count; hub state readable from light (k lit of 10). Demote the SVG: hairline strokes at ≤ --mist-400, no filled hub plate, numerals small; keep gold footnotes on sourced axes (that is the caliper mark, not chrome). Reduced-motion: the ten sectors render static (no shimmer) but still lit/dim. No-GL: the compass SVG regains full contrast (CSS :has(canvas) rule already exists — extend it) so the ten dimensions are always readable. Mobile (390): sectors legible at 342x480. DPR cap untouched. Text contrast: reading column ≥ 4.5:1 stays green (tests/a11y/text-contrast.spec.ts).
- S-4 Verify: `npx tsc --noEmit` · `npm run lint` · `npm run build:static` · `node scripts/validate/overhaul_static_audit.mjs` (10/10) · `python3 -m http.server 5604 --directory out &` then `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5604 npx playwright test tests/overhaul/scene-about.spec.ts tests/overhaul/flagship-visibility.spec.ts -g ABOUT tests/a11y/text-contrast.spec.ts tests/e2e/about.spec.ts` (kill after). Also a ?gl=force SwiftShader probe: 0 pageerrors, canvases ≥ 1 (memory: a GPU-path crash once shipped page-wide). Screenshots of #about at 1440 and 390, GL and no-GL, → W1-A3/. LOOK at them: does a stranger see ten sectors of light before they see the dial?
- S-5 Ledger before commit (`git add -A`; `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w1_a3 --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w1_a3.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w1-a3 -- <files>`). Commit `feat(about): the field tells the ten dimensions; the compass is chrome (G-A3)` with trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC`; `git push -u origin worktree-w1-a3` (once; report push_denied if refused).
- S-6 Return {task_id, worktree, branch, sha, pushed, push_denied, files_changed, measurements:{sector_steps, lit_over_open_ratio, dominance, svg_max_luma, gold_pixels}, gates:{tests_failed_first, tsc, lint, build, audit_10_10, e2e_targeted, gl_force_0_pageerrors, reduced_motion_ok, nogl_ok}, evidence:[], goal_complete}.

## QUALITY GATES
- TC-SCENE-ABOUT-10/11 written first, captured failing, then green
- Ten sectors legible from the field alone at 1440 and 390; answered ≥ 1.6× open; zero gold pixels in the canvas
- Canvas plane dominance ≥ 0.75 with the SVG visible; SVG strokes ≤ --mist-400
- Reduced-motion static path and no-GL path both readable; ?gl=force 0 pageerrors
- tsc · lint · build · audit 10/10 · targeted suites green; text contrast ≥ 4.5:1
- Ledger before commit; pushed or push_denied; ≤ 30 min (split if the shader work overruns — push the test + partial with a WIP note is NOT allowed; push only green)

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w1-a3 && PLAYWRIGHT_BASE_URL=http://127.0.0.1:5604 npx playwright test tests/overhaul/scene-about.spec.ts -g 'ABOUT-1[01]'
git ls-remote --heads origin worktree-w1-a3
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T01:47:22.637Z)
PM check 01:48Z: e5c1e4d pushed on worktree-w1-a3 and CONSOLIDATED into origin/main 12cd9123 (live after the next tick). Self-report: TC-SCENE-ABOUT-10/11 written first (fan+ring annuli in the rose's frame; answered/open from about.ts mask), lit/open 4.04 ring / 5.9 fan at 1440, 3.19 at 390 (gate 1.6); dominance 0.7518; dial ink → --dial-ink (--mist-400 with a canvas, --white without); gold 0; ?gl=force 0 pageerrors; AA text contrast held. O1 OVERRUN: ~100 min (cap 30) — measurement-driven, reported honestly; next About slices split shader vs test. Pre-existing failures flagged (not from this change): TC-ABOUT-07 intermittent 1 canvas under no-WebGL (SwiftShader appeal in useGLCapability.ts on an idle host) and flagship-visibility 'listen beat field' motion gate failing on LIVE too (0.00142 < 0.004). Not done until independent reviewer t_w1_rev3 PASS on live.

## DECISION (2026-09-06T01:47:22.699Z)
O1 overrun recorded (100 min vs 30). Future About/scene slices are split: (a) test-instrument slice (tester) and (b) shader slice (AP), each ≤ 30 min.

## COMPLETE (2026-09-06T02:10:43.467Z)
Independent live PASS on the G-A3 gap acceptance (rev-12cd9123-w1). Sub-claim (answered ≥ 1.6× open in the initial state at 390/1440) FAIL → t_w2_x2f5 carries it with the reviewer's per-sector numbers. Live 12cd9123 via Deploy 34004706433.
