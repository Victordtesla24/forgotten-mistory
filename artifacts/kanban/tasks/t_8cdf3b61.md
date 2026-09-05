# t_8cdf3b61 — Cycle 11 — Vitrine rail mask/trace-on + lit-plate fix, Skills/About contrast, hero 390 one-fold (R-c8 C-02/C-06, TC-CONTRAST-01, TC-HERO-12)

**Status:** running · **Priority:** 90 · **Parents:** — · **Created:** 2026-09-05T05:58:06.011Z

> Continuity: Hermes t_8cdf3b61 (ready) — in-flight worktree found at decision D-6.

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Worktree .claude/worktrees/wf_18f926b0-2a4-2 (base 8dc4cf4). Patch applied + real fixes D-1…D-6 written (07-decisions.md); TDD failing log captured (7 failed / 10 passed on unpatched main). NOT yet done: passing battery, regression, screenshots, D-7+, commit.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read docs/delivery/evidence/v10-20260905T0515Z/C11-vitrine-integration/07-decisions.md (D-1…D-6) and `git status` in /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-2 — continue, do not redo.
- S-2 `.eslintrc.json` already carries "root": true (D-1); keep it — cycle 13 lands the identical line.
- S-3 Build (`npm run build:static`), serve on :5602, run `tests/e2e/vitrine.spec.ts tests/e2e/hero.spec.ts tests/a11y/text-contrast.spec.ts tests/overhaul/page-spine.spec.ts` → 04-tests-passing.log (all green incl. TC-VIT-10..13, TC-HERO-12, TC-CONTRAST-01 @1440 and @390).
- S-4 Screenshots of #vitrine, #hero, #about, #skills at 1440/1280/834/390 via 08-screenshots.mjs → 08-screens/*.png; look at them; record D-7 (visual) with what you saw.
- S-5 Full suite in two halves on :5602 (`--shard=1/2`, `--shard=2/2`) → 05-regression-a.log / 05-regression-b.log; every ✘ named and proven pre-existing (compare 00-run-manifest.json ci_checks list) or fixed.
- S-6 Rebaseline only the three intentional PNGs already in the diff (hero-section, hero-full, viewport-top-1440x900) with UPDATE_SNAPSHOTS=1 on those specs; open the PNGs before committing.
- S-7 `git checkout -- app/data/generated/build-stamp.ts`; commit on branch worktree-wf_18f926b0-2a4-2: `feat(vitrine): rail on the page spine, plates trace on when lit, hero holds one fold at 390`; second commit for evidence.

## QUALITY GATES
- [ ] TC-VIT-01..13 green
- [ ] TC-HERO-12 green at 390×844 (action bottom ≤ 844)
- [ ] TC-CONTRAST-01 green @1440 and @390
- [ ] tsc 0 · lint 0 · audit 10/10 · build exit 0
- [ ] full suite: every ✘ proven pre-existing or fixed
- [ ] no gold outside live repository URLs (tests/monochrome green)
- [ ] reduced-motion: dashoffset 0 immediately (TC-VIT-11)
- [ ] screenshots at 1440/1280/834/390 exist and were looked at

## VERIFICATION
```bash
git -C /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-2 log --oneline main..HEAD
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/e2e/vitrine.spec.ts tests/e2e/hero.spec.ts tests/a11y/text-contrast.spec.ts
npx tsc --noEmit
npm run lint
node scripts/validate/overhaul_static_audit.mjs   # must print RESULT: ALL PASS (10/10)
npm run build:static
python3 -m http.server <PORT> --directory out --bind 127.0.0.1 &   # 5601 or 5602 — never 5599/8080 (foreign servers)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> npx playwright test   # 276 specs; every failure triaged with proof
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## DECISION (2026-09-05T06:01:51.444Z)
S-5 (full suite in halves) re-assigned to cycle 14 (t_d0066b7a) on the merged main (30-min cap, O1). Targeted acceptance specs + screenshots + independent verification remain the merge gate. Dispatched: Workflow wf_3136d81b-e67 (analyst-programmer:c11 opus xhigh → reviewer:v-c11 opus max, port 5602).

## DECISION (2026-09-05T06:32:27.639Z)
V-C11 FAIL on one gate only: TC-CONTRAST-01 @390 red on 1 node (#role-body-ato li:first, 1.79:1) because the MiniVic launcher (MiniVicBot.tsx:1191, fixed bottom-6 right-6 z-[10030]) paints a light disc over body prose at ≤480 px — pre-existing, outside this cycle's files (reviewer F-1 confirmed by re-walking the gate's own sample points). All 19 other acceptance lines pass; the cycle cut contrast failures 68→0 @1440 and 30→1 @390. Orchestrator decision (§0.1 preserve functionality + O5 every cycle improves production; deploy path is gate-free by Owner directive O3): MERGE AND DEPLOY NOW, task stays open until cycle 16 (t_cc03ed93) turns the @390 gate green; correction prompt issued there. F-2: R-c8 C-06 clause 'portrait below the lede' is superseded by B-research/02-hero-avatar-placement.md P1 + TC-HERO-21 (portrait beside the eyebrow, H1 owns the 342 px measure) — recorded as a deliberate overrule. F-3: C-06 clause 4 names .figureNote which no longer exists; rewritten against .ledgerItem (equal heights 123.88 px @1440 — already true). F-4: apply_edits.py misfiled under the v9 evidence path → hygiene task.
