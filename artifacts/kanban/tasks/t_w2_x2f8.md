# t_w2_x2f8 — G-A3 story x2-f8 — instrument the open-mark term at 1440 at rest (why does clause 10b read open-min 0.097 vs answered-max 0.174 when the annulus is 88% unguarded?): test in order (i) ABOUT_OPEN_RULING=26 folding into DFT bin 5 at rr 0.551/0.658/0.882 with a cancelling phase, (ii) the numerals' groove at rr 0.724 between two structure radii, (iii) the 0.09–0.26 incoherent floor in bin 5; then land the mark green at both widths/states inside ABOUT-STORY-v2's window — thresholds untouched

**Status:** ready · **Priority:** 90 · **Parents:** t_w2_x2f7 · **Created:** 2026-09-06T05:04:28.704Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Inputs: docs/architecture/ABOUT-STORY-v2.md (§4 metric, §6 window/stop rules), W2-A3/x2-f6/03-shader-E1-E3.patch (the mark term, apply it), x2-f6/09-verification.md (measured structure values per state), x2-f7/02-guard-mask-measured.log + 09-verification.md (annulus unguarded; candidates ordered). Method: apply the patch in your worktree, then instrument — render the field with ONLY the dash term (ruling off), then only the ruling, then both, and read the per-sector structure values printed by TC-SCENE-ABOUT-10 at 1440 at rest and dim4 and at 390 at rest; also read the raw bin spectrum (k=3..8) per sector to see where the ruling's energy lands; if (i) is the cause, choose a ruling frequency that does not alias into bin k=ABOUT_OPEN_DASHES at the three radii (the SA window allows ruling 20–32; if none in the window is clean, pick the cleanest and REPORT — do not widen the window silently); if (ii), the metric's radii are the SA's — report the groove overlap with numbers and propose the radii change in the evidence, do not change the test yourself; if (iii), the estimator's radial-run length may be raised (a measurement-precision change, log it). Hard bounds unchanged: coverage ≥ 15.00% both widths, TC-CONTRAST-01/02 both paths, ceilings untouched, non-inversion ≥ 1.20, story-about-01/02 reported, visual baselines unmoved. Stop rule: if 10a/10b cannot go green at 1440 at rest with the mark inside the window, push the instrumentation + numbers and return goal_complete:false naming which candidate is proven — a doc for the SA.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w2-x2f8 from origin/main (carries x2f6 tests + x2f7 probe); one build / one browser; port 5601; never git in the main checkout.
- S-1 Read the inputs; apply the patch; build once; capture the baseline structure values in all four states → W2-A3/x2-f8/01-baseline.log.
- S-2 Instrument (i)–(iii) in order with one build per variant at most (three builds); print per-sector spectra; decide the cause with numbers → 02-instrumentation.log.
- S-3 Land the fix inside the window; run the full About battery (scene-about both states/widths, story-contract -g ABOUT, flagship -g about, text-contrast both paths, e2e about) serially; screenshots type-hidden at 1440/390 at rest — LOOK at them (three sectors visibly ruled).
- S-4 Ledger; commit 'feat(about): the three open dimensions are drawn open (G-A3 story x2-f8)' with the two mandatory trailers and FULL suite logs; push worktree-w2-x2f8.
- S-5 Return the x2-f6 structured shape plus {cause:'i|ii|iii|other', spectra:{...}}.

## QUALITY GATES
- Cause proven with per-sector numbers before any tuning
- 10a/10b/10c + STORY-ABOUT-03 green in all four states, or the proven cause reported with the mark still off the tree
- coverage ≥ 15.00%, contrast green both paths, ceilings/thresholds untouched, baselines unmoved
- tsc · lint · build · audit 10/10; ledger; pushed with full logs; ≤ 30 min (three builds max)

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-x2f8
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T05:04:29.070Z)
running — dispatched 05:05Z fm-wave2-corrections-c (serialized: mv5 → x2t3 → x2f8)

## BLOCKED (2026-09-06T05:42:20.548Z)
superseded: Owner directive 05:29Z replaces the About field; the story-metric requirement carries into CINEMATIC-VFX-v1 as a gate on the replacing instrument. Lane never started (chain interrupted 05:30Z).
