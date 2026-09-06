# t_g_h1 — ADV-FAIL P0 — G-H1 Hero fold reinvention (cut CV dump)

**Status:** ready · **Priority:** 99 · **Lane:** G-H1 · **Port:** 5607 · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
analyst-programmer — coding. The independent reviewer graded the first viewport a "CV dump, not a cinematic composition" (P0): location eyebrow, H1, role, a 29-word statement, a 3-figure ledger with sources, a grading note, two CTAs, an inset portrait and an availability + 3-link line all inside the fold. Directive (GAP-BACKLOG G-H1): in the first viewport at 1440×900, 1280×800, 834×1194 and 390×844 the hero shows ≤ 1 headline (the name), ≤ 1 sentence (role OR statement — pick the statement, it is the pitch; the role can live as a short kicker only if the sentence count stays 1), ≤ 1 CTA group (See the evidence + Download CV together), and the visual (GL atmosphere + photograph) is dominant — the stage occupies the full fold and the scrim no longer hides it. The ledger (3 figures + sources + grading note) and the availability/links line MOVE below the fold — they are not deleted (R7 traceability; CT-10 keeps asserting `#hero ul li` ×3 with 92 / $5M+ / 10k+). Put them in a second hero band (`.proof` inside `#hero`, starting ≥ 100vh) so the section still owns its evidence and `#hero ul` still resolves.

File ownership (O4, to avoid clobbering the parallel flagship-C lane): you own components/sections/Hero/Hero.tsx, app/data/portfolio/hero.ts, and the LAYOUT rules in Hero.module.css (.inner, .ledgerRow, .grading, .availability, .actions, .proof, portrait placement). The flagship-C lane owns .stage, .stage::after (scrim), atmosphere.glsl.ts, and the text-plate rules under `@media (max-width: 700px)`. Do not edit those; when you `git merge origin/main` before pushing, keep both intents.

## EXECUTION ORDER
- S-1 Read Hero.tsx, hero.ts, Hero.module.css (911 lines — all of it), HeroPortrait.tsx, tests/e2e/hero.spec.ts (TC-HERO-01…21), tests/e2e/hero-photo.spec.ts, tests/content/content-check.spec.ts CT-10, tests/overhaul/cinematic.spec.ts, tests/overhaul/flagship-visibility.spec.ts. List every assertion that pins ledger/availability inside the fold (TC-HERO-09, TC-HERO-12 phone, TC-HERO-21) — these get REWRITTEN deliberately, not deleted: the new invariants are the fold budget below.
- S-2 TDD: add `tests/e2e/hero-fold.spec.ts` — at each of the four viewports: within y < innerHeight exactly one `h1`; ≤ 1 `<p>` with > 12 words; exactly one CTA group (`.actions` fully inside the fold, both links visible); `#hero ul` (ledger) top ≥ innerHeight; the availability line top ≥ innerHeight; the `.stage` canvas/gradient box covers ≥ 90% of the fold area; the photograph is visible in the fold at ≥ 1280 wide. Update TC-HERO-09/12/21 to the new layout (fold ends on the CTA group; the ledger is "below the fold, before #about"). Build, serve :5607, run → RED (02-tests-failing.log).
- S-3 Implement: restructure Hero.tsx into `.fold` (eyebrow optional, name, statement, actions, portrait) + `.proof` band (ledger + grading + availability/links) with `min-height: 100vh` on `.fold` and the proof band below; reduce inner column width so the stage shows; keep every word server-rendered, every CSS entrance step; keep `heroContent` fields (no copy deletion — hero.ts may reorder/group but every string stays traceable). Reduced-motion + no-WebGL paths unchanged.
- S-4 Rebuild; run hero-fold.spec + hero.spec + hero-photo.spec + content-check.spec + cinematic.spec + flagship-visibility.spec + tests/a11y/text-contrast.spec.ts + tests/perf/performance.spec.ts (LCP < 2.5 s, CLS < 0.05 must hold) → GREEN. tsc, lint, audit 10/10. Screenshots 1440/1280/834/390 → 08-screens/.
- S-5 `git fetch origin && git merge origin/main` (resolve keeping flagship-C's stage/scrim rules if they have landed), rerun hero-fold + text-contrast, ledger rows, commit `feat(hero): the first fold is one name, one sentence, one action — the evidence moves below (G-H1)`, push branch.

## QUALITY GATES
- [ ] hero-fold.spec red→green at 1440/1280/834/390
- [ ] CT-10 still green (ledger present with sources, below the fold); no copy deleted from hero.ts
- [ ] hero, hero-photo, cinematic, flagship-visibility, text-contrast, performance specs green; LCP < 2.5 s; CLS < 0.05
- [ ] tsc, lint, audit 10/10; reduced-motion + no-GL paths verified (`?gl=off` or the suite's flag)
- [ ] Ledger rows; branch pushed after merging origin/main

## VERIFICATION
```bash
npm run build:static && (python3 -m http.server 5607 --directory out --bind 127.0.0.1 &)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5607 npx playwright test tests/e2e/hero-fold.spec.ts tests/e2e/hero.spec.ts tests/e2e/hero-photo.spec.ts tests/content/content-check.spec.ts tests/overhaul/cinematic.spec.ts tests/overhaul/flagship-visibility.spec.ts tests/a11y/text-contrast.spec.ts tests/perf/performance.spec.ts
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-H1/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/analyst-programmer.SOUL.md + analyst-programmer.system-prompt.md (+ /root/.sub-agents/council/analyst-programmer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:27.950Z)
running — dispatched 12:1xZ (queued; host cap) — Workflow wf_b908a7a9-f5d lane:hero-fold, port 5607; owns Hero.tsx/hero.ts/layout rules only

## COMMENT (2026-09-05T12:22:59.736Z)
REVIEWER BASELINE 9ba97a5c (G-H1 FAIL, measured): 21 text-bearing leaf nodes in the 1440×900 fold, 4 paragraphs >12 words (longest 29), 6 in-fold CTAs in 3 groups (See the evidence+Download CV; Play the portrait; LinkedIn/GitHub/Email), ledger at top:535 with 15 caliper marks, availability at top:840, dominant media covers 11.4% of the fold (516×287). Council targets for the re-probe: ≤8 text leaves in fold; dominant visual coverage ≥0.75 (the stage IS the fold); one CTA group; ledger/note/availability start ≥100vh; the 'Play the portrait' control counts as a CTA — fold it into the photograph or move it with the proof band. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/captures/probe-a.json → 1440-normal.measure.hero

## COMMENT (2026-09-05T12:39:54.870Z)
HEADS-UP 12:40Z: flagship-C landed on the remote (d7adf27, 13f1b82 → consolidating): Hero.module.css .stage::after display:none below 700px + per-run text plates rgb(10 10 10/.90) on .eyebrow/.name/.role/.statement/.grading/.availability/.ledgerItem, atmosphere.glsl.ts reframed to the viewport half-width, TC-CONTRAST-02 on /?gl=force, nav::before ground below 700px. Your merge of origin/main before push must keep those plate rules; your new .fold/.proof structure should give the moved elements their plates too (any text over the scene needs AA on /?gl=force at 390).

## COMMENT (2026-09-05T12:58:11.002Z)
ORCHESTRATOR PUSH under host RECTIFY 12:52Z (O3): 0506e7e on worktree-wf_b908a7a9-f5d-4 at 12:57Z — build:static fresh (out/ 12:52:22 > last source edit 12:39:51), tsc exit 0; Hero.tsx/Hero.module.css restructured (data-testid hero-fold / hero-proof), tests/e2e/hero-fold.spec.ts added, hero.spec updated. The lane agent's green battery is still running and lands as a follow-up evidence commit; reviewer probes live after Deploy. Ledger +4.

## COMMENT (2026-09-05T13:00:10.132Z)
LIVE 9b864752 at 12:59:23Z — consolidated cleanly (no forced conflict; flagship-C plate rules and the new .fold/.proof structure both present on main). Reviewer phase-2 dispatched on 9b864752 for G-H1 + G-S1.

## COMMENT (2026-09-05T13:10:25.297Z)
FOLLOW-UP from lane G-H3's battery: tests/overhaul visual baseline hero-section.png (TC-RENDER-07) is stale (1280×742 → 782 after the photo/plates/fold changes) — the hero lane owns this pixel set: regenerate deliberately with UPDATE_SNAPSHOTS=1 for the hero baselines after the fold lands, look at the PNG, commit it with the evidence.

## COMMENT (2026-09-05T13:12:44.900Z)
REVIEWER PHASE-2 FAIL on live 9b864752 (G-REV/9b864752/08-adversarial-review.md, measured at 1440/1280/834/390): PASS parts — text leaves in fold 4/4/6/5 (was 21), paragraphs>12w = 1, ledger top 1110/1005/1195/892 vs innerHeight 900/800/1194/844 (below the fold everywhere, but only by 1 px at 834), availability below, stage coverage 1.0, CT-10 holds, plates + phone scene intact, AA 0 failures, 0 pageerrors, LCP 1032 ms. FAIL parts — (1) at 834 and 390 the fold has TWO CTA groups: hero-actions AND the 'Play the portrait' <button> (counts as a CTA); (2) INVERSION at 1440/1280: the actions group (See the evidence + Download CV) is BELOW the fold — the only in-fold CTA is the portrait toggle; (3) CLS 0.176 at 1280×720 in 2/3 cold loads (gate <0.05), LCP element = the photograph my_avatar.avif → a deterministic reflow attributable to the moved band; (4) 834 ledger clears the fold by 1 px. → CORRECTION t_g_h1c.

## COMMENT (2026-09-05T13:14:27.740Z)
ORIGINAL LANE FOLLOW-UP LIVE 6224a7f8 at 13:14:01Z: 44c3e08 'the fold is one column of type beside the photograph' — reading column is one grid item beside the figure (38vw right column), band anchored at top; lane-measured: 6–7 text leaves in fold, actions end at 723/656/762/582 (inside 900/800/1194/844), ledger tops 901/801/1195/889, CLS 0.0000, LCP 588 ms; hero-fold 12/12, hero/hero-photo/content-check/cinematic/performance green; portrait caption --mist-400 → --mist-200 (3.35:1 → AA). Still open for t_g_h1c: the 'Play the portrait' button as a second in-fold CTA group at 834/390, and the 1-px ledger margin at 1440/834 (≥40 px required); reviewer re-probe after the correction lands.

## COMPLETE (2026-09-05T14:02:43.305Z)
DONE via 44c3e08 + 70a04a8/46379f1 — independent reviewer PASS on live (phase 3). Lineage: 0506e7e (fold split) → FAIL (portrait toggle as 2nd CTA, actions below fold at desktop, CLS .176, 1-px ledger margin) → 44c3e08 (column beside the photo) → 70a04a8 (control to the proof band; margins; CLS 0) → PASS.

## COMMENT (2026-09-06T00:00:29.857Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:30.026Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
