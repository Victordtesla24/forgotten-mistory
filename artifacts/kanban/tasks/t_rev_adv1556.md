# t_rev_adv1556 — ADV-1556Z reviewer — independent FAIL baseline on live forgotten-mistory.web.app then re-probe after EACH Deploy (O2/O6)

**Status:** ready · **Priority:** 100 · **Parents:** t_adv1556 · **Created:** 2026-09-05T16:57:52.267Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Fresh identity. Read-only. Probe https://forgotten-mistory.web.app/ NOW against GAP-BACKLOG P0 binary acceptance. Record live build-commit. Overall will be FAIL on b2ac21be. After each subsequent Deploy, new evidence folder G-REV/<build-commit>/. Do not count Playwright, Deploy count, data-scene census, architecture markdown, or Book-mailto as PASS. Do not implement.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- curl live build-commit
- Browser 390+1440 first-fold, vitrine rest plates, listen/vitrine CTAs, MiniVic pill, about field
- Write 08-adversarial-review.md with per-gap PASS/FAIL
- Push evidence branch from origin/main

## QUALITY GATES
- Live URL only
- Per-gap binary verdicts
- build-commit cited
- no self-PASS of implementer work

## VERIFICATION
```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:33.095Z)
1556Z DISPATCH NOW FAIL baseline on live b2ac21be.

## STATUS (2026-09-05T16:58:33.724Z)
running — dispatched

## COMMENT (2026-09-05T17:53:49.543Z)
C16 re-probe: live 58d9c111 Deploy 33982085429. Fresh identity rev-58d9c111-c16. Prior matrix was FAIL on b0513692. Evidence must land docs/delivery/evidence/v10-20260905T0515Z/G-REV/58d9c111/. Valid MiniVic body is {messages:[{role:user,content:...}]} not {message:ping}.

## COMMENT (2026-09-05T18:01:09.339Z)
Live moved 58d9c111 → 545df77b (H1-04 c917af0, L1-03 553de01, G-S2 c0a2c86). Stopped rev-58d9c111-c16. Fresh identity rev-545df77b-c17 dispatched. Do not complete gaps until this probe returns.

## COMMENT (2026-09-05T18:11:01.889Z)
Live 0892d092 Deploy 33983082312. Stopped rev-545df77b-c17. Fresh identity rev-0892d092-c18. Includes E2+S2+V3-corr+H1-04+L1-03.

## COMMENT (2026-09-05T18:19:48.488Z)
Live aa58395b Deploy 33983551491. Stopped rev-0892d092-c18 (noted G-M4 ~1.61s on prior sha — stale). Fresh rev-aa58395b-c19.

## COMMENT (2026-09-05T18:31:47.139Z)
rev-aa58395b-c19 overall FAIL. PASS this commit: G-L1 C3, G-M4 TTFB, G-V3, G-C1, G-NEW-1. FAIL: G-L1 overall (reading —), G-X2. OPEN unverified: G-H1/H5/H6 this cycle (H6 prior PASS 2806edec held), G-A3, G-E2/S2. Live now 64404134 (evidence merge + 8808bfa).

## COMMENT (2026-09-05T18:34:14.261Z)
C19 completion received (836eeb5f). PASSes already boarded: t_g2_m4b, t_g2_v3, t_l1_04, G-C1, G-NEW-1. Overall FAIL stands (G-L1 reading —, G-X2). OPEN gaps dispatched to fresh identity rev-64404134-open on live 64404134. t_x1_10 AP ap-x1-10-c20 for first real cinematic scene. Do not complete t_rev_adv1556.

## COMMENT (2026-09-05T18:44:00.505Z)
rev-64404134-open died mid-probe on unpaid invoice. No evidence commit. OPEN gaps H1/H5/A3/E2/S2 still unverified on live 64404134. Do not complete.

## COMMENT (2026-09-05T19:11:49.734Z)
C21: fresh reviewer rev-64404134-c21 on live 64404134 for H1/H5/H6/A3/E2/S2/L1-C5/X2. Do not complete overall.

## COMMENT (2026-09-05T19:20:25.149Z)
C22 spawn: claude --bg rev-64404134-c22 (7d658519) live OPEN-gap probe. Independent of ap-gl1-05-c22. Evidence only.

## STATUS (2026-09-05T19:20:25.197Z)
running — rev-64404134-c22 claude --bg 7d658519

## COMMENT (2026-09-05T19:32:50.789Z)
64404134 matrix: H1/H5/H6/E2/S2 PASS; A3/L1-C5/X2 FAIL. Live moved to b4b4a9a3 (C5+evidence). Fresh rev-b4b4a9a3-c23 for C5. Overall still FAIL.

## COMMENT (2026-09-05T19:44:49.851Z)
C23 G-L1 C5 PASS on b4b4a9a3. G-A3 FAIL restated: about GL is 384x384 coincident with compass SVG — field must carry the section, not halo the radar. G-X2 FAIL 6<7. Overall ADV still FAIL.

## COMMENT (2026-09-05T20:22:15.422Z)
C24: rev-d19939ac-c24 on live d19939ac for G-A3 dominant-plane. C5 hold expected.

## STATUS (2026-09-05T20:22:15.476Z)
running — rev-d19939ac-c24 G-A3 on d19939ac

## COMMENT (2026-09-05T20:33:49.200Z)
C24 G-A3 PASS on d19939ac. First-wave live PASSes boarded (NEW-1/V3/C1/H6/H1/H5/A3/L1/M4/E2/S2). G-X2 R2 remains FAIL honest (6<7, viseme not scene 7). R3 avatar OPEN. Overall ADV still FAIL on R2/R3. No Fusion Council.

## COMMENT (2026-09-05T20:35:18.427Z)
Stale Cursor Task rev-64404134-c21 (2c81efc1) invoice death — superseded by claude --bg rev-64404134-c22 / rev-b4b4a9a3-c23 / rev-d19939ac-c24. No re-dispatch on Cursor Task.
