# t_w3_rev8 — WAVE-3 REVIEW 8 (reviewer, max, independent) on the live SHA carrying e92808f (and, if consolidated by then, the removal slice worktree-w3-rm1): (1) F-1 at 390 — does a real tap at the centre of every hero action reach its own control with the dock unpainted? (2) the panel placement numbers at 1440/1366/1280/834/390 on live (expected still FAIL until t_w3_p0b lands — grade honestly); (3) G-M4 strict-cold on both routes (origin-first, Hosting fallback capped with disclosure); (4) OCCLUDE-02 at 390; (5) TC-FOLD-04 at 390 (action group below the fold — pre-existing); (6) if the interim frame is live: every TC-IF clause re-measured independently on the live URL plus the Owner's bar (does the black frame read as disciplined removal, or as broken?) with screenshots at 1440/1280/834/390; regression table; verdicts.json

**Status:** todo · **Priority:** 100 · **Parents:** t_w3_p0a · **Created:** 2026-09-06T06:08:23.715Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Independent adversarial review on https://forgotten-mistory.web.app only (never a branch, never a local build). Evidence → docs/delivery/evidence/v10-20260905T0515Z/G-REV/<live-sha>/08-adversarial-review.md + verdicts.json. Read the Owner directive note (both entries) first: the Owner's bar is the grading standard for anything visual; instruments and thresholds, never adjectives (R7). One Chrome at a time; ports 5609; ?gl=force is a smoke test, never an fps claim; persistent-profile second load check for the service worker.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- V-1 curl the live HTML, record build-commit, confirm it carries e92808f (git log) and whether worktree-w3-rm1 is in; read the p0a and rm1 board notes and evidence dirs W3-P0A/, W3-RM1/ (claims to falsify).
- V-2 Measure on live with Playwright (system Chrome, --no-sandbox): 390x844 fresh load — elementFromPoint at the centre of 'See the evidence' and 'Download CV', real tap → CV href reached, no panel opened; MONO-MV-02 opacity over the fold; then scroll past the hero → dock paints and a hit-tested click opens the dialog.
- V-3 Panel placement at 1440/1366/1280/834/390 after fonts.ready: panel rect, width, composer rect, clearance from the h1 run — table; grade against TC-BOT-14 (≥ 320) and the 360 bar.
- V-4 G-M4 strict-cold: two fresh contexts, first token time on the origin route and on the Hosting fallback; the disclosure text when capped; attempts[] on the done event.
- V-5 OCCLUDE-02 at 390 (closed launcher does not brighten the ground) and TC-FOLD-04 at 390 (action group bottom vs innerHeight − 16).
- V-6 If the interim frame is live: re-measure TC-IF-01…10 independently (no canvas/plate/blur in #hero/#about, ground luma ≤ 0.03 at nine points, contrast ≥ 4.5:1 for every text node, ten dimension rows readable, ?gl=force 0 pageerrors, reduced-motion diff, chroma 0, ledger below the fold, first-fold click) and answer the Owner's question with instruments: does the fold read as a disciplined black frame (one dominant ground, white type, the photograph, nothing decorative) or as a broken page (orphaned spacing, empty boxes, hidden text)? Screenshots at four viewports.
- V-7 Write 08-adversarial-review.md (findings F-n with severity, measurement, threshold, path) + verdicts.json {sha, F1, placement, M4, occlude02, fold04, interim:{…}|null, regressions:[…], overall}. ≤ 30 min. Return the verdicts object with task_id:'t_w3_rev8', goal_complete:true.

## QUALITY GATES
- Every verdict carries a measurement and a threshold; every claim in W3-P0A/W3-RM1 either confirmed or falsified
- Nothing edited outside G-REV/<sha>/
- Live URL only

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ | tail -3
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T06:09:58.594Z)
running — dispatched 06:10Z fm-wave3-rev8 (reviewer opus/max, live 20a17dfb carrying e92808f)

## COMPLETE (2026-09-06T06:26:33.213Z)
Live 20a17dfb (G-REV/20a17dfb/): F-1 PASS (real tap at 390 reaches the CV href, dock inert); OCCLUDE-02 PASS (delta max luma 0); placement FAIL — the panel is 432 px wide and OVERLAPS the H1 glyph run at 1440 (-67.5 px) and 1366 (-90.5 px), PASS at 1280/834/390, composer inside 5/5 — this FALSIFIES p0a's 'narrow panel 290/315 px' diagnosis on live (timing-dependent placement); F-2 REGRESSED P0: after a scroll JUMP past the hero at 390 the dock stays opacity 0 while pointer-events is auto and a click opens the panel (invisible clickable control; TC-MV-CLICK-01 @390 and MONO-MV-02 @640 red on live though green on p0a's export); FOLD-04 @390 FAIL pre-existing (828 vs 804); G-M4 NOT MEASURED (cap) -> t_w3_m4r; interim frame not yet live at 20a17dfb -> rev9 on 83590944.
