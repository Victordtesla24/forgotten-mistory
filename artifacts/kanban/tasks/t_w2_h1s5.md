# t_w2_h1s5 — G-H1 S5 (tester) — realign the hero e2e suites to HERO-SETPIECE-v3 geometry: rewrite TC-PHOTO-02 and TC-HERO-21 (figure in the plane above the copy; §3.5 bleeds right only), recompute the loop-ladder rung expectations from the v3 figure box, root-cause TC-HERO-13 (hover point now under the copy block), re-measure TC-FOLD-03 (4 viewports) and TC-FOLD-04 @390 — no threshold lowered, every rewrite justified in the spec

**Status:** todo · **Priority:** 93 · **Parents:** t_w2_h1s3 · **Created:** 2026-09-06T02:41:29.234Z

## YOUR ROLE
tester — testing / qa (docs/prompt.md §5). From t_w2_h1s1's honest goal_complete:false (docs/delivery/evidence/v10-20260905T0515Z/W2-H1/t_w2_h1s1/05-hero-suites-remaining.log and 04-hero-suites.log). Five cases encode the superseded fold (docs/architecture/HERO-FOLD-v2.md) and must be rewritten to the v3 contract (docs/architecture/HERO-SETPIECE-v3.md §3 geometry, §4.3 rungs, §8 cases); TC-HERO-13 needs a root cause (mechanism works — TC-PHOTO-05 passes); TC-FOLD-03/04 were red before the pointer-events fix and never re-run. Run AFTER S3 (typography) lands so the geometry is final; do not edit Hero component files (S4 owns product changes) — file product findings as followups with numbers.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w2-h1s5 from origin/main (must contain S1–S3; verify with git log --oneline -5 origin/main). One build / one browser.
- S-1 Read HERO-SETPIECE-v3.md §3/§4.3/§8/§9, the S1 remaining-log, tests/e2e/hero.spec.ts, hero-photo.spec.ts, hero-fold.spec.ts, lib/videoRung.ts, app/data/portfolio/avatar.ts.
- S-2 Build once, serve :5628, run the three hero suites serially with --workers=1 and capture the baseline → W2-H1/t_w2_h1s5/01-baseline.log.
- S-3 For each red case: decide product vs test with evidence; rewrite the test to the v3 contract where the old composition is encoded (state the v3 clause it now asserts in a comment); for the rung cases derive the expected rung from the measured figure box × DPR and assert THAT rule, not literal numbers that only held for one box; for TC-HERO-13 find the hover point that is actually on the figure. Never delete, skip, or lower.
- S-4 Verify: the three suites green serially; tsc; lint; audit 10/10. Followups (product defects in Hero/*) listed with numbers for S4.
- S-5 Ledger; commit 'test(hero): suites realigned to the v3 set-piece geometry (G-H1 S5)' with the two mandatory trailers; push worktree-w2-h1s5.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, root_causes:{...}, followups:[...], gates:{baseline_captured, suites_green, tsc, lint, audit_10_10, no_threshold_lowered, hero_components_untouched}, evidence:[], goal_complete}.

## QUALITY GATES
- All three hero suites green serially on the export
- Every rewrite names the v3 clause it asserts; no threshold lowered; no test deleted/skipped
- Hero component files untouched; product findings filed as followups with numbers
- tsc · lint · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-h1s5
```

## HIERARCHY
role_matrix: testing / qa → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T03:16:05.274Z)
SCOPE ADD 03:16Z: tests/e2e/hero.spec.ts TC-HERO-08 — fold band 928.3 px vs viewport.height×1.1 = 792 ceiling at the default 720 px viewport (pre-existing on origin/main b02a8863, W1-RED2/04-suites.log). Decide product vs test against HERO-SETPIECE-v3 §3 (the plane is 100% of the fold by design; the ceiling may be measuring the old fold contract) — never raise the ceiling without the v3 clause that justifies it.

## COMMENT (2026-09-06T04:18:20.112Z)
SCOPE ADD 04:18Z (from S3's 09-hero-e2e.log, 10 failed / 54 passed): TC-FOLD-03 ×4 — visual baselines of the fold are stale since S1 recomposed it: re-accept ONLY after S4 lands (the v3 fold is the intended picture; look at the PNGs before committing them, per CLAUDE.md); TC-FOLD-04 @390 — 'the action group ends 16 px above the fold' expected ≤ 804, received 828 — decide product vs test against HERO-SETPIECE-v3 §3.5 (CTA group y 670–790 by design; if the v3 geometry puts the group at 828 the product is wrong or the geometry table is — file it for S4 with the number, do not raise 804). Order: run S5 after S4 pushes, from origin/main carrying S4.

## STATUS (2026-09-06T04:18:21.048Z)
ready — S3 consolidated 04:17Z — dispatch after S4 pushes

## STATUS (2026-09-06T04:57:13.557Z)
running — dispatched 04:59Z tester (waits for origin/main to carry a06f317)

## COMMENT (2026-09-06T05:42:20.607Z)
05:30Z the Owner's message interrupted the tester lane (wbtp5553u) mid-battery; nothing pushed after 199f116c. The hero suites realignment already landed in a0a9521; the full-battery pass is re-run by the reviewer on the next deploy (rev8) rather than re-dispatched, because the hero it validates is being replaced under t_w3_own.

## COMPLETE (2026-09-06T05:44:54.186Z)
Landed a0a9521 (worktree-w2-h1s5), live 199f116c: hero suites realigned to v3 geometry; the tester's full-battery pass was interrupted by the Owner's message at 05:30Z (its Playwright child in /root/wt-w2-h1s5 finishes on its own; log read by the PM when it exits). Battery re-run deferred to the wave-3 slices, which replace the hero.
