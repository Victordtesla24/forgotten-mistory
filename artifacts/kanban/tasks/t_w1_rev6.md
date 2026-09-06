# t_w1_rev6 — WAVE-2 REVIEW 6 — independent adversarial review of the live SHA carrying the About light correction (x2f5: answered/open ≥ 1.6 in every state), scene-7 depth (x2s2: spans recoverable from light, parallax) and, if landed, hero S3 typography (descender plate fix, H1 ratio band, CTA bar): G-A3 story clause graded, G-X2/R2 INTERIM with the honest fps tier, hero INTERIM, regression table

**Status:** todo · **Priority:** 100 · **Parents:** t_w2_x2f5, t_w2_x2s2 · **Created:** 2026-09-06T03:54:50.355Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Read the live build-commit at start; it must descend from worktree-w2-x2f5 and c29b55e1 (x2s2); note whether hero S3 (worktree-w2-h1s3) is in it. Baselines: G-REV/3657baa1 (F-1 descender plate FAIL, SPD 390 0.7153, false positive on 1280), G-REV/12cd9123 (G-A3 sub-claim: answered/open 1.039 @390 / 1.596 @1440 in the initial state; per-sector means recorded). Grade: (1) G-A3 story clause — with dial+column hidden, in BOTH the initial state (data-axis=-1) and with dimension 4 active, at 1440 and 390: ten sectors countable, answered/open ratio ≥ 1.6 on ring AND fan, ≥ 9/10 seams ≥ 12%, role-side maxima (dims 6, 7, 9) ≥ 15% below the candidate-side mean (TC-STORY-ABOUT-02), plane dominance ≥ 0.75, dial ≤ --mist-400, gold 0, about contrast ≥ 4.5:1, reduced-motion/no-GL paths; (2) scene 7 INTERIM: band present, spans legible as bands (your own edge count and rank correlation on a mid-band capture), parallax between two scroll positions, caption-only over the canvas, 0 pageerrors, and record — do not grade — the SwiftShader frame time with the renderer string (R2's 60 fps needs a GPU tier); (3) hero INTERIM/GRADED: if S3 landed, re-measure F-1 (descender ink off the plate: must be 0 px at 4 viewports × 2 paths), H1/brand ratio 2.5–6.0, H1 lines 1 at ≥ 720 px / 2 below, CTA targets ≥ 48 px, SET-02 ledger below the fold, SPD per viewport/path; if S3 has not landed, re-confirm F-1 still present and say so; (4) regression table: G-H6, G-C1, G-MV1 390 click, G-OG1, disclosure visible, ?gl=off 0 canvases, TC-BOT-14 (report), 0 pageerrors, LCP/CLS live.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read the prior verdicts.json files (to attack, not reuse), docs/architecture/SIGNATURE-SCENES-v2.md §5 (story thresholds), HERO-SETPIECE-v3.md §6/§8, app/data/portfolio/about.ts (which dimensions are answered; role-side 6, 7, 9).
- S-2 Browser (one at a time; ?gl=force is CPU-heavy — keep page visits minimal): About captures with dial+column hidden in both states at both widths; scene-7 mid-band captures at two scroll positions; hero fold at four viewports × two paths; regression probes.
- S-3 Write G-REV/<sha>/08-adversarial-review.md + verdicts.json {sha, gaps:{'G-A3-story':…}, interim:{scene7:{...}, hero:{...}}, regression:{...}, R2:'OPEN (fps unproven on GPU)', R3:'OPEN', false_positives:[…]}; return {task_id:'t_w1_rev6', live_sha, verdicts, failures_first, evidence, goal_complete:true}. Read-only; ≤ 30 min.

## QUALITY GATES
- G-A3 story clause judged from the reviewer's own captures in both states at both widths, against about.ts
- Scene-7 spans/parallax measured, fps recorded with renderer string and NOT graded
- Hero F-1 re-measured (0 px off the plate or the number)
- Regression table re-run; failures first; writes only under G-REV/<sha>/

## VERIFICATION
```bash
ls -t /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ | head -1
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T03:58:45.926Z)
running — dispatched 03:59Z reviewer rev-1ba16f90-w2

## COMMENT (2026-09-06T04:07:56.099Z)
NOTE 04:07Z: the About shader on live 1ba16f90 (479e2b2) is being REVERTED by ef2979a (worktree-w2-x2f5, consolidating next tick) because it broke the About coverage floor. Grade the story clause on what you measure and say which SHA; the design tension is with the SA (t_w2_a3sa).
