# t_w1_rev7 — WAVE-2 REVIEW 7 — G-H1 GRADED on the live SHA carrying hero S1–S4: every HERO-SETPIECE-v3 §8 case measured independently (F-1 descender 0 px off the plate, SPD ≥ 0.78 at 4 viewports × 2 paths, H1 contrast on glyph box, TYPE/SET/GL/PERF/PAL), the recruiter sentence, TC-BOT-14 on both axes, About story tests (red-by-design), regression table; plus the R1 question — is this a new visual system or still a résumé stack?

**Status:** todo · **Priority:** 100 · **Parents:** t_w2_h1s4, t_w1_mv4 · **Created:** 2026-09-06T04:56:23.594Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Read the live build-commit at start; it must descend from a06f317 (S4), b4e4b79 (mv4), 21ff176d (x2f6 tests). Baselines: G-REV/1ba16f90 (F-1 descender 145/130/57/42 px; SPD 390 rm 0.7487; TC-BOT-14 −67 px), G-REV/3657baa1, ADV-2315Z §Hero (the original FAIL: stacked hire landing, smoky wallpaper, no set-piece). Grade G-H1 against GAP-BACKLOG: one dominant visual plane ≥ 75% weight, brand + ≤ 1 headline + ≤ 1 non-CV sentence + ≤ 1 CTA group, photograph IN the plane, ledger below the fold, and — the human clause — a recruiter names the set-piece in one sentence (the brief's target: 'His face is standing in the shaft of light that his name is written across.'). Say the sentence you would say; say whether the fold is a new visual system (R1) or still a résumé landing. Measure with your own instruments; use scripts/validate/hero_plane_dominance.mjs exports for SPD only.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read HERO-SETPIECE-v3.md §0/§2/§3/§8, the prior hero verdicts, tests/overhaul/hero-plane-dominance.spec.ts + hero-setpiece.spec.ts + hero-typography.spec.ts + tests/perf/hero-vitals.spec.ts + tests/monochrome/hero-palette.spec.ts (what the implementer asserts; you measure independently).
- S-2 Browser (one at a time; ?gl=force is CPU-heavy): four viewports × (?gl=force settled, reduced-motion still): SPD (instrument exports), lit density, text-leaf blocks ≤ 3 + 1 CTA group + 0 stray pressables, ledger top ≥ innerHeight, figure inside the plane ≤ 846 px natural 1480x826, H1 contrast on the glyph ink box AND per-pixel ink off the plate (must be 0 px — measure the descender explicitly), H1/brand ratio 2.5–6.0, H1 lines 1/1/1/2, CTA targets ≥ 48 px, focus order (Ask Mini Vic first as the bypass, then brand, then CTAs), canvases 1 gl / 0 rm, poster painted under reduced motion, nothing plays by default (network log), fold max chroma 0, LCP < 2.5 s and CLS < 0.05 on live, 0 pageerrors/console errors. Screenshots of the fold at all four viewports on both paths → G-REV/<sha>/ — LOOK at them and write the recruiter sentence.
- S-3 TC-BOT-14 both axes: open the panel at 1440/1366/1280/834 (and 390): no H1 glyph rect covered, ≥ 16 px separation on one axis, panel ≥ 320 px, composer inside its box; real click on the first fold at 390.
- S-4 About story tests on live (x2f6 shipped tests only): run the reviewer's own read of TC-SCENE-ABOUT-10 10b/10c at 1440/390 at rest — report red-by-design status honestly (x2f7 in flight); regression table: G-H6 monochrome, G-C1, G-A3 ten sectors, G-MV1, G-OG1, disclosure, ?gl=off 0 canvases, scene-7 band, /api/tts route alive (GET 405), 0 errors.
- S-5 Write G-REV/<sha>/08-adversarial-review.md + verdicts.json {sha, gaps:{'G-H1':'PASS|FAIL', 'R1_new_visual_system':'PASS|FAIL|PARTIAL', 'TC-BOT-14':…}, hero_cases:{...per §8 id...}, recruiter_sentence, regression:{...}, R2:'OPEN', R3:'OPEN', false_positives:[…]}; return {task_id:'t_w1_rev7', live_sha, verdicts, failures_first, evidence, goal_complete:true}. Read-only; ≤ 30 min.

## QUALITY GATES
- Every §8 case measured by the reviewer at 4 viewports × 2 paths with numbers; descender measured as ink pixels off the plate
- G-H1 graded against the GAP-BACKLOG clause including the recruiter sentence; R1 judged and justified
- TC-BOT-14 both axes at ≥ 4 widths; regression table re-run; failures first; writes only under G-REV/<sha>/

## VERIFICATION
```bash
ls -t /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ | head -1
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T04:57:13.485Z)
running — dispatched 04:59Z reviewer rev-hero-s4 (waits for live to carry a06f317)

## COMPLETE (2026-09-06T05:36:53.792Z)
Reviewer verdict (wf_10280795-ffd, 05:27Z) on live 314d9d28 (hero numbers on fda84067): G-H1 FAIL / R1 PARTIAL. F-1..F-11: opaque nameplate defeats 'written across the light'; SET-05/SET-04 unmet; nav Menu contrast over the fold; a CV sentence in the fold; two P0 regressions: at 390 the unpainted MiniVic dock swallows the Download CV tap, and placeMiniVicPanel has no effect at 1440 (panel 432x452 at 984,360) and yields a 222 px panel with the composer outside the box at 1366. Functional P0s -> t_w3_p0a. Visual findings -> constraints in the wave-3 direction (Owner directive 05:29Z supersedes the v3.1 re-brief).
