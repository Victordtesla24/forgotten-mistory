# t_w3_rev9 — WAVE-3 REVIEW 9 (reviewer, max, independent) on live 83590944 — the interim frame (removal slice 0a) graded on the live URL: every TC-IF-01…10 clause re-measured independently at 1440/1280/834/390 (no canvas/plate/blur in #hero/#about, ground luma ≤ 0.03 at nine points, every text node ≥ 4.5:1, ten dimension rows readable, ?gl=force 0 pageerrors, reduced-motion diff ≤ 0.5 %, chroma 0 except gold marks, ledger below the fold, first-fold click), TC-FOLD-04 @390 (828 vs 804 — did the role line's return to the fold make it worse?), LCP/CLS on live, the remaining five scene mounts (Experience/Skills/Vitrine/Listen still carry the old fields until rm2), and the Owner's question answered with instruments: does the fold read as a disciplined black frame or as a broken page (orphaned spacing, empty boxes, hidden text, layout shift)? Screenshots at four viewports; regression table vs 20a17dfb; verdicts.json

**Status:** ready · **Priority:** 100 · **Parents:** t_w3_rm1 · **Created:** 2026-09-06T06:26:37.041Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Independent adversarial review on https://forgotten-mistory.web.app only. The implementer's claims to falsify: worktree-w3-rm1 commit a92f85b body and docs/delivery/evidence/v10-20260905T0515Z/W3-RM1/ (interim-frame 31/31 on the export) and docs/architecture/INTERIM-FRAME.md. The Owner's words (both entries in artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md) are the bar; R7: instruments, never adjectives. One Chrome at a time, short runs; port 5611 if a local server is needed; persistent-profile second-load check (service worker). Evidence → docs/delivery/evidence/v10-20260905T0515Z/G-REV/<live-sha>/. ≤ 30 min; unmeasured items are marked NOT MEASURED, never guessed.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- N-1 curl the live HTML: build-commit, data-plane count (expect 0), data-scene list (expect only career-descent, career-strata, skills-bench, vitrine-field, listen-field), poster reference (expect none).
- N-2 Playwright on live at 1440x900, 1280x800, 834x1194, 390x844: TC-IF-01…10 re-derived from your own instruments (do not run the repo spec as the only evidence — measure); screenshots hero + about per viewport; ?gl=force pageerrors; reduced-motion pixel diff; chroma scan; LCP/CLS via PerformanceObserver on a fresh context; TC-FOLD-04 geometry.
- N-3 Second-load check with a persistent profile: the returning visitor gets 83590944, not a cached older shell.
- N-4 Answer the Owner's question with instruments: for the first fold list what is on screen (elements + rects), any empty container taller than 48 px with no visible child, any text node with contrast < 4.5:1, any layout shift > 0.05, any element whose only purpose was decorative that remains (backdrop-filter, box-shadow spreads, gradients other than the page ground) — a 'disciplined frame' verdict requires zero of each; otherwise FAIL with the rows.
- N-5 Regression table vs 20a17dfb (F-1 tap at 390, OCCLUDE-02, MiniVic pill visible ≥ 0.9 past the hero after a jump — the rev8 F-2 — and every prior PASS). Write 08-adversarial-review.md + verdicts.json {sha, interim:{TC-IF-01..10, owner_question}, fold04, vitals, sw_second_load, remaining_scenes, regressions:[…], overall}. Return the verdicts object with task_id:'t_w3_rev9', goal_complete:true.

## QUALITY GATES
- Every verdict carries a measurement and a threshold; every implementer claim confirmed or falsified
- Live URL only; nothing edited outside G-REV/<sha>/

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/83590944/verdicts.json
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T06:27:12.530Z)
running — dispatched 06:27Z fm-wave3-rev9-m4 (reviewer opus/max, live 83590944)

## COMPLETE (2026-09-06T06:49:18.419Z)
Live 83590944 (G-REV/83590944/): interim frame TC-IF-01..09 PASS at four viewports (0 canvas/plane, all six fold elements in the first screen, ground luma <= 0.007, min contrast 6.20:1, ten rows readable, ?gl=force 0 pageerrors, reduced-motion diff 0 px, chroma 0 outside 45 gold caliper declarations, ledger below the fold); Owner question PASS — 'a disciplined black frame, not a broken page' (0 orphaned boxes, CLS 0.0000, 0 decorative remnants in #hero/#about; observation: 700 px of empty ground right of the photograph at 1440 is a composition brief for the wave-3 hero). TC-FOLD-04 @390 now PASS (521 vs 804). SW second load PASS (fm-static-83590944). Assets PASS (max 50 kB, 413 kB transfer). LCP NOT MEASURED (no LCP entries on this page; FCP 3.6 s at load 13 — host-influenced). TC-IF-10 FAIL P0: at 390 the MiniVic launcher is effectively invisible (dock wrapper opacity 0) in the fold AND past the hero, still focusable — G-MV1 breach; root cause the dock's opacity rule at 390 -> t_w3_p0c (scope widened). Remaining scene mounts as expected (rm2). Overall FAIL.
