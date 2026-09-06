# t_w2_h1s4 — G-H1 S4 — the same picture everywhere, gate unarmed: parity ?gl=force vs reduced-motion at four viewports, palette sweep, HERO_PLANE_GATE removed at the 0.78 ship margin, LCP/CLS/no-autoplay on the export

**Status:** todo · **Priority:** 95 · **Parents:** t_w2_h1s2, t_w2_h1s3 · **Created:** 2026-09-06T01:23:59.718Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). G-H1 hero set-piece, composition A (docs/architecture/HERO-SETPIECE-v3.md, SA t_w2_h1sa; research W2-RESEARCH/G-H1-G-X2-prior-art.md). This is slice S4 (g2h1v3-04) of §9. The recruiter sentence the fold must produce: 'His face is standing in the shaft of light that his name is written across.' ADV-2315Z §Hero FAIL is the baseline. Immovables (§10 of the brief): LCP < 2.5 s, CLS < 0.05, nothing plays by default, critical-path assets ≤ 500 kB / video ≤ 2.5 MB, palette B/W/gold with gold only on sourced claims, reduced-motion and no-GL paths are the same picture, keyboard order per §7, no upscale above 1480x826 (figure ≤ 846 CSS px), G-MV1 pill untouched, hero.ts copy unedited. Extra gates: full Playwright battery green (run it serially, one browser); no R5 claim added anywhere; evidence log per viewport per path.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w2-h1s4 /root/forgotten-mistory/.claude/worktrees/w2-h1s4 origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules. Never run more than one build or one Playwright browser at a time; never run ffmpeg in this slice.
- S-1 Read docs/architecture/HERO-SETPIECE-v3.md in full (§0–§12), then the files this slice names: components/sections/Hero/HeroPortrait.tsx, tests/overhaul/hero-plane-dominance.spec.ts, tests/perf/hero-vitals.spec.ts, tests/monochrome/, tests/palette_bundle.test.mjs; plus scripts/validate/hero_plane_dominance.mjs (the SPD instrument and its exports) and CLAUDE.md gotchas (dead CSS fails the audit; reduced-motion + no-GL mandatory).
- S-2 TESTS FIRST (brief §8): write/extend exactly the cases this slice must turn green — TC-HERO-PERF-01, PERF-02, PERF-03, PAL-01, PLANE-01 at 0.78 with the flag gone — with the thresholds verbatim from §8 (never lowered); run them on origin/main code and capture FAILING output → docs/delivery/evidence/v10-20260905T0515Z/W2-H1/t_w2_h1s4/02-tests-failing.log.
- S-3 Implement slice S4 (g2h1v3-04) exactly as §9 describes (files, geometry from §3, compositing from §4, fallbacks from §5, typography from §6). Smallest change; delete any CSS the change orphans in the same commit.
- S-4 Verify: npx tsc --noEmit · npm run lint · npm run build:static · node scripts/validate/overhaul_static_audit.mjs (10/10) · python3 -m http.server 5610 --directory out & then PLAYWRIGHT_BASE_URL=http://127.0.0.1:5610 npx playwright test <the slice's spec files> plus tests/e2e/hero.spec.ts tests/e2e/hero-fold.spec.ts tests/e2e/hero-photo.spec.ts (kill the server after). Screenshots of the fold at 1440x900, 1280x800, 834x1194, 390x844 on ?gl=force and reduced-motion → W2-H1/t_w2_h1s4/. LOOK at them against §2 and §3.
- S-5 Ledger before commit: git add -A; node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w2_h1s4 --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w2_h1s4.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w2-h1s4 -- <files>. Commit 'feat(hero): the same picture everywhere, gate unarmed: parity ?gl=force vs reduced-motion at four viewports, palette sweep, HERO_PLANE_GATE removed at the 0.78 ship margin, LCP/CLS/no-autoplay on the export (G-H1 S4 (g2h1v3-04))' with trailers Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com> and Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC; git push -u origin worktree-w2-h1s4 (once; report push_denied with sha if refused).
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, measurements:{spd_per_viewport_path, lit_fraction, h1_ratio, lcp_ms, cls}, gates:{tests_failed_first, tsc, lint, build, audit_10_10, slice_tests_green, hero_suites_green, no_dead_css, hero_ts_unedited}, evidence:[], decisions:[], goal_complete}.

## QUALITY GATES
- Slice tests (TC-HERO-PERF-01, PERF-02, PERF-03, PAL-01, PLANE-01 at 0.78 with the flag gone) captured failing first, then green at all four viewports on both paths where marked
- tsc · lint · build:static · static audit 10/10 (dead CSS removed in the same commit) · hero e2e suites green
- No threshold from §8 lowered; hero.ts unedited; no upscale; nothing plays by default; G-MV1 untouched
- Screenshots at the four viewports on both paths attached and LOOKED at
- Ledger before commit; pushed or push_denied; ≤ 30 min (report the smallest green pushed slice if overrunning)

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w2-h1s4 && node scripts/validate/overhaul_static_audit.mjs | tail -2
git ls-remote --heads origin worktree-w2-h1s4
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T02:41:29.400Z)
NOTE 02:46Z: hero e2e realignment is t_w2_h1s5 (tester, after S3). S4 keeps its own gates (PERF/PAL/PLANE-01 at 0.78, battery green) — coordinate by branching from origin/main once S5 is consolidated, or merge origin/worktree-w2-h1s5 first.

## COMMENT (2026-09-06T03:25:17.583Z)
MUST RESOLVE (from S2, 03:27Z): (1) TC-HERO-A11Y-01 red 8/8 on the H1 — P95 ground luminance under the H1's font-box rect 0.83 vs glyph 0.92 → 1.10:1; the §4.2 copy-guard bound (−50% contour inside text rects + 8 px) and the §7 P95-over-text-rect rule conflict at the font box's overhang. Options S4 may choose (decide per §0.1, log it): measure A11Y-01 on the glyph ink box (Range.getClientRects of the text, not the line box) if that is what a reader sees, keep the guard bound; OR let the guard's contour follow the font box (+8 px) so the plate rows are guarded; NEVER lower 4.5:1. (2) PLANE-01 at 390 still 0.7153 < 0.75 (gl unmeasured) — must reach 0.78 on both paths. (3) TC-STORY-HERO-01@1440 (story-contract, t_w2_x2t1): luminance centroid offset 0.2887 of the diagonal vs 0.12 bar on S1's build — re-measure after S2's pool binding; it is your target too.

## COMMENT (2026-09-06T03:51:45.041Z)
LIVE DEFECT from rev-3657baa1-w2 (F-1, graded FAIL, readers see it now): the H1's plate is cut at the baseline — the 'p' descender of 'Deshpande' hangs off the plate onto the near-white plane at 1440/1280/834/390 on both paths (204/203/84/64 ink px at 1.10–1.55:1, one blob starting exactly at plate bottom 639.8/565.3/912.7/595.9 px). Fix in Hero.module.css: the plate (or the shader copy guard) must cover the font's descent — extend the plate's bottom to the line box's descender (or guard the full line box + 8 px), never by adding a scrim over the plane. Also: SPD at 390 reduced-motion is 0.7153 (< 0.75 floor) and 1280 is 0.7788/0.7586 (< 0.78 ship) — S4 must land ≥ 0.78 on both paths at all four; TC-HERO-SET-02 currently passes with ZERO margin (proof top == innerHeight) — typography must not grow the fold by even 1 px.
