# t_w3_rev10 — WAVE-3 REVIEW 10 (reviewer, max, independent) on the live SHA carrying removal slice 0b (316a520): all six sections on the interim frame — TC-IF-11…21 re-measured independently at 1440/834/390 (no canvas/[data-scene] in #experience/#skills/#vitrine/#listen except minivic-viseme; eight role rows drawn to scale as DOM within 2 % of months; three gold sourced marks + five open brackets; calibration card tested/untested readable; six repository cards with limits + source, keyboard-reachable rail; four contact routes + synthetic-introduction label; ground luma ≤ 0.03 at nine points per section; every text node ≥ 4.5:1; ?gl=force 0 pageerrors; reduced-motion identical; chroma 0 outside gold), whole-page pageerrors on a full scroll, LCP via a Lighthouse-style probe (largest image/text block paint from the trace, not only the LCP entry — state the method), CLS, SW second load, and the Owner's question for the whole page: does every section read as a disciplined frame (zero orphaned boxes, zero hidden text, zero decorative remnants) — plus the regression table vs 83590944 (TC-IF-01..10, F-1, OCCLUDE-02, G-MV1 at 390 expected still FAIL until p0c)

**Status:** todo · **Priority:** 100 · **Parents:** t_w3_rm2 · **Created:** 2026-09-06T07:13:40.214Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Independent adversarial review on https://forgotten-mistory.web.app only. Implementer claims to falsify: commit 316a520's body, docs/delivery/evidence/v10-20260905T0515Z/W3-RM2/, docs/architecture/INTERIM-FRAME.md §6. The Owner's words (both entries in artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md) are the bar; R7: instruments, never adjectives. One Chrome at a time, short runs; port 5611 if a local server is needed; evidence → docs/delivery/evidence/v10-20260905T0515Z/G-REV/<live-sha>/; ≤ 30 min; unmeasured items are NOT MEASURED, never guessed.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- T-1 curl live: build-commit, data-scene list (expect only minivic-viseme), canvas count in the static HTML.
- T-2 Playwright on live at 1440x900, 834x1194, 390x844: per section (#experience #skills #vitrine #listen) canvases/scenes, ground luma at nine points, every text node's contrast, the data DOM checks (role rows to scale: measure bar widths vs months from app/data/portfolio/experience.ts; gold marks count; open brackets count; card count 6 with limits + source; routes 4 + synthetic label); keyboard: Tab reaches every card link and every route; ?gl=force pageerrors on a full scroll; reduced-motion diff per section; chroma scan; screenshots per section per viewport.
- T-3 Vitals: CLS on a fresh context at 1440 and 390; LCP — use a trace-based method (Playwright tracing or PerformanceObserver with buffered:true registered BEFORE navigation via addInitScript) and report the candidate element + time; if still empty, say NOT MEASURED and why; SW second load on a persistent profile.
- T-4 Owner's question for the whole page with instruments (as rev9 N-4, per section).
- T-5 Regression table vs 83590944; write 08-adversarial-review.md + verdicts.json {sha, interim_b:{TC-IF-11..21}, owner_question_page, vitals, sw, regressions, overall}. Return the verdicts object with task_id:'t_w3_rev10', goal_complete:true.

## QUALITY GATES
- Every verdict carries a measurement and a threshold; every implementer claim confirmed or falsified
- Live URL only; nothing edited outside G-REV/<sha>/

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ | tail -2
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T07:22:11.214Z)
running — dispatched 07:22Z fm-wave3-rev10 (reviewer opus/max, live 6d3310b7)
