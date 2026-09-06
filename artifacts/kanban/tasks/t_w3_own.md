# t_w3_own — WAVE-3 ROOT — OWNER DIRECTIVE 05:29Z: replace the whole visual layer (every section's visualisation, the hero atmosphere and plates, the About compass/field, the Experience strata/descent, the Skills bench, the Vitrine drawings/field, the Listen field) with Marvel-Studios-grade visual effects and visualisations, black and white only; judge panel of two solutions-architect directions with real hero prototypes, independent judge, synthesis, hero-first ≤30-min slices, reviewer on every deploy, PEA loop to PASS

**Status:** running · **Priority:** 100 · **Parents:** t_adv2315 · **Created:** 2026-09-06T05:39:52.508Z

## YOUR ROLE
orchestrator — feedback_refactor_loop (docs/prompt.md §5). Owner's verbatim words and the four live screenshots (build-commit 199f116c) are in artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md and docs/delivery/evidence/v10-20260905T0515Z/OWNER-20260906T0529Z/. Every current visualisation is graded below the bar by the Owner and is REPLACED, not polished. Assumption logged: gold stays exclusively the sourced-claim mark and never appears in any effect. Everything else in docs/prompt.md stays binding (R7 copy, LCP/CLS, budgets, reduced-motion + no-GL readability, keyboard, G-MV1, six sections in order, tests replaced never deleted, O1/O5).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- W3-1 dispatch t_w3_dA + t_w3_dB (solutions-architect, max) in parallel — independent directions, no cross-reading; then t_w3_pa / t_w3_pb hero prototypes one Chrome at a time
- W3-2 dispatch t_w3_jdg (reviewer, max, independent) then t_w3_syn (solutions-architect, max) — CINEMATIC-VFX-v1.md + CINEMATIC-VFX-TASKS.json
- W3-3 put every slice on the board as ≤30-min analyst-programmer tasks (hero first), ≤2 heavy lanes, each pushed branch consolidates via deploy.yml; reviewer on the live URL after every deploy (O2/O6)
- W3-4 cycle reports every cycle with Deploy run id + live build-commit; PEA loop until the reviewer grades the live URL PASS on the Owner's bar and every R-gate; then Fusion Council

## QUALITY GATES
- Owner's words satisfied on the live URL as judged by an independent reviewer on instruments, not adjectives
- Zero functional regression (the 308-test battery green or consciously superseded and replaced)
- Palette: chroma 0 everywhere except gold claim marks
- O5: a visible production change at least every 10 minutes while slices exist

## VERIFICATION
```bash
test -f /root/forgotten-mistory/artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/OWNER-20260906T0529Z/
```

## HIERARCHY
role_matrix: feedback_refactor_loop → level orchestrator → effort **ultracode** (effort_cascade.yaml; depth_cap 4). Model: claude-fable-5-1 (ultracode) · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T05:43:10.628Z)
running — 05:43Z W3-1 dispatched

## DECISION (2026-09-06T05:53:30.790Z)
05:51Z Owner escalation (verbatim in the INBOX note): remove all the shabby work immediately and replace it with credible work, or loop until every UI/UX requirement and success criterion is met. Sequencing changed: removal slices t_w3_rm1 (hero+About) and t_w3_rm2 (Experience/Skills/Vitrine/Listen) ship first as a disciplined black frame; the wave-3 direction is judged on the specs as soon as they land (prototype stage cut for time); the loop never declares done.

## COMMENT (2026-09-06T05:55:54.689Z)
05:56Z removal chain dispatched (t_w3_rm1 -> t_w3_rm2). Directions A/B still designing (journal monitor boptn3lrv). Prototype stage will be cut when the specs land; judge + synthesis dispatched on the specs.

## COMMENT (2026-09-06T06:08:24.242Z)
06:09Z p0a partial (fix 1 landed e92808f; placement diagnosed -> t_w3_p0b ready). Pre-existing live FAIL surfaced: TC-FOLD-04 @390 (hero action group below the fold, bottom 828 > 804) — rm1's TC-IF-02 must fix it in the interim frame; rev8 grades it on live.

## COMMENT (2026-09-06T06:27:14.346Z)
06:27Z rev8 on 20a17dfb: F-1 PASS, OCCLUDE-02 PASS; placement FAIL (432-px panel overlaps the H1 at 1440/1366 — p0a's narrow-panel diagnosis falsified on live; p0b re-aimed via its task file); NEW P0 F-2: dock invisible-but-clickable after a scroll jump at 390/640 -> t_w3_p0c (after p0b); G-M4 -> t_w3_m4r; interim frame -> rev9 on 83590944. Overall FAIL (by design until the loop converges).

## COMMENT (2026-09-06T06:29:10.117Z)
06:29Z directions landed: A = 14 slices, 18 CQ gates, bundle ceiling 850 kB, proto A captured (CQ-01 luma range and CQ-04 light-through-type FAIL on the proto's own numbers — honest); B = 15 slices, 17 CQ, bundle ceiling 200 kB, proto B capturing. Judge dispatched; synthesis chained. NOTE: the journal monitor (boptn3lrv) never fired on the result lines — 35 min lost; replaced by direct file reads at each wake.

## COMMENT (2026-09-06T06:49:20.840Z)
06:50Z rev9 on 83590944: interim frame PASS on 9/10 clauses + the Owner's 'disciplined frame' question PASS; TC-IF-10 FAIL = G-MV1 breach at 390 (launcher invisible) -> t_w3_p0c scope widened (G-MV1 wins over MONO-MV-02; pill moved clear of the CTA row). G-M4 FAIL on cold sends (1.9 s / 1.8 s) -> t_w3_m4c. LCP still unmeasured on live (no LCP entries) — wave-3 hero slices carry CQ-12 with a Lighthouse-style probe.
